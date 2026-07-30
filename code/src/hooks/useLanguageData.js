import React from 'react';
import {
     loadUserState,
     saveUserSettings,
     loadAvailableLanguages,
     saveAvailableLanguages,
     loadDictionary,
     saveDictionary,
     loadAllLanguageData,
     saveAllLanguageData,
} from '../util/db';
import { GLOBALS } from '../util/globals';

const subscribers = new Set();
const languageSnapshotCache = new Map();

function getSnapshotCacheKey(queryKey) {
     return JSON.stringify(queryKey ?? []);
}

function subscribeToLanguageChanges(listener) {
     subscribers.add(listener);
     return () => subscribers.delete(listener);
}

function notifyLanguageChanged(queryKey) {
     subscribers.forEach((listener) => {
          try {
               listener(queryKey);
          } catch (_error) {
               // Keep notification fan-out resilient to listener failures.
          }
     });
}

function isMatchingKey(targetKey, incomingKey) {
     if (!Array.isArray(targetKey) || !Array.isArray(incomingKey)) {
          return false;
     }
     if (targetKey.length === 0 || incomingKey.length === 0) {
          return false;
     }
     return targetKey[0] === incomingKey[0];
}

function useSqliteReadQuery(queryKey, queryFn, options = {}) {
     const {
          enabled = true,
          initialData,
          onSuccess,
          onError,
     } = options ?? {};

     const cacheKey = React.useMemo(() => getSnapshotCacheKey(queryKey), [queryKey]);
     const initialSnapshot = React.useMemo(() => {
          if (languageSnapshotCache.has(cacheKey)) {
               return languageSnapshotCache.get(cacheKey);
          }
          return initialData;
     }, [cacheKey, initialData]);

     const [data, setData] = React.useState(initialSnapshot);
     const [error, setError] = React.useState(null);
     const [isLoading, setIsLoading] = React.useState(Boolean(enabled));
     const [dataUpdatedAt, setDataUpdatedAt] = React.useState(0);
     const [errorUpdatedAt, setErrorUpdatedAt] = React.useState(0);

     const load = React.useCallback(async () => {
          if (!enabled) {
               return data;
          }

          setIsLoading(true);
          try {
               const nextData = await queryFn();
               languageSnapshotCache.set(cacheKey, nextData);
               setData(nextData);
               setError(null);
               const now = Date.now();
               setDataUpdatedAt(now);
               if (typeof onSuccess === 'function') {
                    onSuccess(nextData);
               }
               return nextData;
          } catch (e) {
               setError(e);
               const now = Date.now();
               setErrorUpdatedAt(now);
               if (typeof onError === 'function') {
                    onError(e);
               }
               throw e;
          } finally {
               setIsLoading(false);
          }
     }, [enabled, queryFn, onSuccess, onError, cacheKey]);

     React.useEffect(() => {
          if (!enabled) {
               setIsLoading(false);
               return;
          }
          load().catch(() => {
               // Error is already captured in state.
          });
     }, [enabled, load]);

     React.useEffect(() => {
          if (!enabled) {
               return undefined;
          }

          return subscribeToLanguageChanges((incomingKey) => {
               if (isMatchingKey(queryKey, incomingKey)) {
                    load().catch(() => {
                         // Error is already captured in state.
                    });
               }
          });
     }, [enabled, queryKey, load]);

     return {
          data,
          error,
          isLoading,
          isFetching: isLoading,
          isSuccess: !isLoading && !error,
          isError: Boolean(error),
          status: isLoading ? 'loading' : error ? 'error' : 'success',
          dataUpdatedAt,
          errorUpdatedAt,
          refetch: load,
     };
}

export const LANGUAGE_USER_STATE_KEY = ['language_user_state'];
export const LANGUAGE_AVAILABLE_KEY = ['language_available'];
export const LANGUAGE_DICTIONARY_KEY = ['language_dictionary'];
export const LANGUAGE_ALL_KEY = ['language_all'];

export const useLanguageUserStateQuery = (options) =>
     useSqliteReadQuery(LANGUAGE_USER_STATE_KEY, loadUserState, options);

export function useActiveLanguage(options) {
     const { data } = useLanguageUserStateQuery(options);
     return data?.language ?? data?.user?.interfaceLanguage ?? 'en';
}

export function useLanguageDisplayName(options) {
     const { data } = useLanguageUserStateQuery(options);
     return data?.languageDisplayName ?? '';
}

export const useAvailableLanguagesQuery = (options) =>
     useSqliteReadQuery(LANGUAGE_AVAILABLE_KEY, loadAvailableLanguages, options);

export function useAvailableLanguages(options) {
     const { data } = useAvailableLanguagesQuery(options);
     return data ?? [];
}

export const useDictionaryQuery = (options) =>
     useSqliteReadQuery(LANGUAGE_DICTIONARY_KEY, loadDictionary, options);

export function useDictionary(options) {
     const { data } = useDictionaryQuery(options);
     return data ?? {};
}

export const useAllLanguageData = (options) =>
     useSqliteReadQuery(LANGUAGE_ALL_KEY, loadAllLanguageData, options);

export function useUpdateActiveLanguage() {
     return React.useCallback(async (languageCode) => {
          GLOBALS.language = languageCode ?? 'en';
          await saveUserSettings({ language: languageCode ?? 'en' });
          notifyLanguageChanged(LANGUAGE_USER_STATE_KEY);
     }, []);
}

export function useUpdateLanguageDisplayName() {
     return React.useCallback(async (displayName) => {
          await saveUserSettings({ languageDisplayName: displayName ?? '' });
          notifyLanguageChanged(LANGUAGE_USER_STATE_KEY);
     }, []);
}

export function useUpdateAvailableLanguages() {
     return React.useCallback(async (languages) => {
          await saveAvailableLanguages(languages ?? []);
          notifyLanguageChanged(LANGUAGE_AVAILABLE_KEY);
          notifyLanguageChanged(LANGUAGE_ALL_KEY);
     }, []);
}

export function useUpdateDictionary() {
     return React.useCallback(async (dictionary) => {
          await saveDictionary(dictionary ?? {});
          notifyLanguageChanged(LANGUAGE_DICTIONARY_KEY);
          notifyLanguageChanged(LANGUAGE_ALL_KEY);
     }, []);
}

export function useUpdateAllLanguageData() {
     return React.useCallback(async (state = {}) => {
          if (state.language !== undefined || state.languageDisplayName !== undefined) {
               await saveUserSettings({
                    language: state.language,
                    languageDisplayName: state.languageDisplayName,
               });
               if (state.language !== undefined) {
                    GLOBALS.language = state.language ?? 'en';
               }
               notifyLanguageChanged(LANGUAGE_USER_STATE_KEY);
          }

          await saveAllLanguageData({
               languages: state.languages ?? [],
               dictionary: state.dictionary ?? {},
          });

          notifyLanguageChanged(LANGUAGE_AVAILABLE_KEY);
          notifyLanguageChanged(LANGUAGE_DICTIONARY_KEY);
          notifyLanguageChanged(LANGUAGE_ALL_KEY);
     }, []);
}

// ─── Pre-hydration (bypass path) ─────────────────────────────────────────────

/**
 * Pre-populates module-level snapshot caches with language data already loaded from SQLite.
 */
export function prehydrateLanguageSnapshotCache(allData) {
     if (!allData) return;
     languageSnapshotCache.set(JSON.stringify(LANGUAGE_AVAILABLE_KEY), allData.languages ?? []);
     languageSnapshotCache.set(JSON.stringify(LANGUAGE_DICTIONARY_KEY), allData.dictionary ?? {});
     languageSnapshotCache.set(JSON.stringify(LANGUAGE_ALL_KEY), allData);
}
