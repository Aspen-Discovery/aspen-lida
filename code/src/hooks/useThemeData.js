import React from 'react';
import {
     loadThemeState,
     saveThemeState,
     saveThemeColors,
     saveThemeColorMode,
     saveThemeTextColor,
     resetThemeState,
} from '../util/db';

const subscribers = new Set();
const themeSnapshotCache = new Map();

function getSnapshotCacheKey(queryKey) {
     return JSON.stringify(queryKey ?? []);
}

function subscribeToThemeChanges(listener) {
     subscribers.add(listener);
     return () => subscribers.delete(listener);
}

function notifyThemeChanged(queryKey) {
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
          if (themeSnapshotCache.has(cacheKey)) {
               return themeSnapshotCache.get(cacheKey);
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
               themeSnapshotCache.set(cacheKey, nextData);
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

          return subscribeToThemeChanges((incomingKey) => {
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

export const THEME_STATE_KEY = ['theme_state'];

export const useThemeStateQuery = (options) =>
     useSqliteReadQuery(THEME_STATE_KEY, loadThemeState, options);

export function useThemeState(options) {
     const { data } = useThemeStateQuery(options);
     return {
          themeId: data?.themeId ?? null,
          colorMode: data?.colorMode ?? 'light',
          textColor: data?.textColor ?? '$warmGray600',
          themeColors: data?.themeColors ?? null,
          updatedAt: data?.updatedAt ?? 0,
     };
}

export function useUpdateThemeState() {
     return React.useCallback(async (state) => {
          await saveThemeState(state ?? {});
          notifyThemeChanged(THEME_STATE_KEY);
     }, []);
}

export function useUpdateThemeColors() {
     return React.useCallback(async (themeColors, themeId) => {
          await saveThemeColors(themeColors, themeId);
          notifyThemeChanged(THEME_STATE_KEY);
     }, []);
}

export function useUpdateThemeColorMode() {
     return React.useCallback(async (colorMode) => {
          await saveThemeColorMode(colorMode);
          notifyThemeChanged(THEME_STATE_KEY);
     }, []);
}

export function useUpdateThemeTextColor() {
     return React.useCallback(async (textColor) => {
          await saveThemeTextColor(textColor);
          notifyThemeChanged(THEME_STATE_KEY);
     }, []);
}

export function useResetThemeState() {
     return React.useCallback(async () => {
          await resetThemeState();
          notifyThemeChanged(THEME_STATE_KEY);
     }, []);
}
