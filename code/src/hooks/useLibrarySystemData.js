import React from 'react';
import {
     loadLibraryUrl, saveLibraryUrl,
     loadLibraryVersion, saveLibraryVersion,
     loadLibraryMetadata, saveLibraryMetadata,
     loadLibrary, saveLibrary,
     loadMenu, saveMenu,
     loadCatalogStatus, saveCatalogStatus,
     loadHomeScreenLinks, saveHomeScreenLinks,
     loadAppSettings, saveAppSettings,
     saveAllLibrarySystemData, loadAllLibrarySystemData,
} from '../util/db';

const subscribers = new Set();
const librarySystemSnapshotCache = new Map();

function getSnapshotCacheKey(queryKey) {
     return JSON.stringify(queryKey ?? []);
}

function subscribeToLibrarySystemChanges(listener) {
     subscribers.add(listener);
     return () => subscribers.delete(listener);
}

function notifyLibrarySystemChanged(queryKey) {
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
          if (librarySystemSnapshotCache.has(cacheKey)) {
               return librarySystemSnapshotCache.get(cacheKey);
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
               librarySystemSnapshotCache.set(cacheKey, nextData);
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

          return subscribeToLibrarySystemChanges((incomingKey) => {
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

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const LIBRARY_URL_KEY = ['library_url'];
export const LIBRARY_VERSION_KEY = ['library_version'];
export const LIBRARY_METADATA_KEY = ['library_metadata'];
export const LIBRARY_KEY = ['library'];
export const LIBRARY_MENU_KEY = ['library_menu'];
export const CATALOG_STATUS_KEY = ['catalog_status'];
export const HOME_SCREEN_LINKS_KEY = ['home_screen_links'];
export const APP_SETTINGS_KEY = ['app_settings'];
export const LIBRARY_ALL_SYSTEM_DATA_KEY = ['library_all_system_data'];

// ─── Read Hooks ───────────────────────────────────────────────────────────────

export function useLibraryUrl(options) {
     const { data } = useSqliteReadQuery(LIBRARY_URL_KEY, loadLibraryUrl, options);
     return data ?? '';
}

export function useLibraryVersion(options) {
     const { data } = useSqliteReadQuery(LIBRARY_VERSION_KEY, loadLibraryVersion, options);
     return data ?? '';
}

export function useLibraryMetadata(options) {
     const { data } = useSqliteReadQuery(LIBRARY_METADATA_KEY, loadLibraryMetadata, options);
     return data ?? null;
}

export function useLibrary(options) {
     const { data } = useSqliteReadQuery(LIBRARY_KEY, loadLibrary, options);
     return data ?? {};
}

export function useLibraryMenu(options) {
     const { data } = useSqliteReadQuery(LIBRARY_MENU_KEY, loadMenu, options);
     return data ?? [];
}

export function useCatalogStatus(options) {
     const { data } = useSqliteReadQuery(CATALOG_STATUS_KEY, loadCatalogStatus, options);
     return data ?? { status: 0, message: '' };
}

export function useHomeScreenLinks(options) {
     const { data } = useSqliteReadQuery(HOME_SCREEN_LINKS_KEY, loadHomeScreenLinks, options);
     return data ?? [];
}

export function useAppSettings(options) {
     const { data } = useSqliteReadQuery(APP_SETTINGS_KEY, loadAppSettings, options);
     return data ?? { settings: {}, urlCache: '', slugCache: '', updatedAt: 0 };
}

// Full query-object variants for callers that need isLoading / refetch / etc.
export const useLibraryUrlQuery = (options) =>
     useSqliteReadQuery(LIBRARY_URL_KEY, loadLibraryUrl, options);

export const useLibraryVersionQuery = (options) =>
     useSqliteReadQuery(LIBRARY_VERSION_KEY, loadLibraryVersion, options);

export const useLibraryMetadataQuery = (options) =>
     useSqliteReadQuery(LIBRARY_METADATA_KEY, loadLibraryMetadata, options);

export const useLibraryQuery = (options) =>
     useSqliteReadQuery(LIBRARY_KEY, loadLibrary, options);

export const useLibraryMenuQuery = (options) =>
     useSqliteReadQuery(LIBRARY_MENU_KEY, loadMenu, options);

export const useCatalogStatusQuery = (options) =>
     useSqliteReadQuery(CATALOG_STATUS_KEY, loadCatalogStatus, options);

export const useHomeScreenLinksQuery = (options) =>
     useSqliteReadQuery(HOME_SCREEN_LINKS_KEY, loadHomeScreenLinks, options);

export const useAppSettingsQuery = (options) =>
     useSqliteReadQuery(APP_SETTINGS_KEY, loadAppSettings, options);

export const useAllLibrarySystemData = (options) =>
     useSqliteReadQuery(LIBRARY_ALL_SYSTEM_DATA_KEY, loadAllLibrarySystemData, options);

/**
 * Combined hook that returns all library system data fields as raw values.
 * Uses the all-in-one loader for efficiency.
 */
export function useLibrarySystemData() {
     const { data } = useAllLibrarySystemData();
     return {
          url: data?.url ?? '',
          version: data?.version ?? '',
          name: data?.name ?? null,
          favicon: data?.favicon ?? null,
          libraryId: data?.libraryId ?? null,
          languages: data?.languages ?? [],
          localIll: data?.localIll ?? [],
          library: data?.library ?? {},
          menu: data?.menu ?? [],
          catalogStatus: data?.catalogStatus ?? 0,
          catalogStatusMessage: data?.catalogStatusMessage ?? '',
          homeScreenLinks: data?.homeScreenLinks ?? [],
          appSettings: data?.appSettings ?? {},
          updatedAt: data?.updatedAt ?? 0,
     };
}

// ─── Write Hooks ─────────────────────────────────────────────────────────────

/**
 * Returns a function that saves the library URL and refreshes the URL query.
 */
export function useUpdateLibraryUrl() {
     return React.useCallback(async (url) => {
          await saveLibraryUrl(url);
          notifyLibrarySystemChanged(LIBRARY_URL_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves the library version and refreshes the version query.
 */
export function useUpdateLibraryVersion() {
     return React.useCallback(async (version) => {
          await saveLibraryVersion(version);
          notifyLibrarySystemChanged(LIBRARY_VERSION_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves library metadata and refreshes the metadata query.
 */
export function useUpdateLibraryMetadata() {
     return React.useCallback(async (metadata) => {
          await saveLibraryMetadata(metadata);
          notifyLibrarySystemChanged(LIBRARY_METADATA_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves the complete library object and refreshes the library query.
 */
export function useUpdateLibrary() {
     return React.useCallback(async (library) => {
          await saveLibrary(library);
          notifyLibrarySystemChanged(LIBRARY_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves menu links and refreshes the menu query.
 */
export function useUpdateMenu() {
     return React.useCallback(async (menu) => {
          await saveMenu(menu);
          notifyLibrarySystemChanged(LIBRARY_MENU_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves catalog status and refreshes the query.
 */
export function useUpdateCatalogStatus() {
     return React.useCallback(async (status, message) => {
          await saveCatalogStatus(status, message);
          notifyLibrarySystemChanged(CATALOG_STATUS_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves home screen links and refreshes the query.
 */
export function useUpdateHomeScreenLinks() {
     return React.useCallback(async (links) => {
          await saveHomeScreenLinks(links);
          notifyLibrarySystemChanged(HOME_SCREEN_LINKS_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves app settings with cache metadata and refreshes the query.
 */
export function useUpdateAppSettings() {
     return React.useCallback(async (settings, urlCache = '', slugCache = '') => {
          await saveAppSettings(settings, urlCache, slugCache);
          notifyLibrarySystemChanged(APP_SETTINGS_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Returns a function that saves all library system data at once and refreshes all queries.
 */
export function useUpdateAllLibrarySystemData() {
     return React.useCallback(async (data) => {
          await saveAllLibrarySystemData(data);
          notifyLibrarySystemChanged(LIBRARY_URL_KEY);
          notifyLibrarySystemChanged(LIBRARY_VERSION_KEY);
          notifyLibrarySystemChanged(LIBRARY_METADATA_KEY);
          notifyLibrarySystemChanged(LIBRARY_KEY);
          notifyLibrarySystemChanged(LIBRARY_MENU_KEY);
          notifyLibrarySystemChanged(CATALOG_STATUS_KEY);
          notifyLibrarySystemChanged(HOME_SCREEN_LINKS_KEY);
          notifyLibrarySystemChanged(APP_SETTINGS_KEY);
          notifyLibrarySystemChanged(LIBRARY_ALL_SYSTEM_DATA_KEY);
     }, []);
}

/**
 * Hook to get library data from SQLite.
 * Replaces the 'library' value from LibrarySystemContext.
 */
export function useLibraryData(options = {}) {
     return useSqliteReadQuery(
          LIBRARY_KEY,
          () => loadLibrary(),
          options
     );
}

/**
 * Hook to get catalog status and message from SQLite.
 * Replaces the 'catalogStatus' and 'catalogStatusMessage' from LibrarySystemContext.
 */
export function useCatalogStatusData(options = {}) {
     return useSqliteReadQuery(
          CATALOG_STATUS_KEY,
          () => loadCatalogStatus(),
          {
               ...options,
               select: (data) => ({
                    status: data?.status ?? 0,
                    message: data?.message ?? ''
               })
          }
     );
}
