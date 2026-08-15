import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Center, Image, Spinner, VStack, useToast } from '@gluestack-ui/themed';
import React from 'react';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { buildThemeForLibrary, THEME_STALE_MS, useTheme } from '../../themes/theme';
import {
     isStoredThemeIdMatch,
     loadAllLanguageData,
     loadAllLibraryBranchData,
     loadAllLibrarySystemData,
     loadAllUserData,
     loadLibraryUrl,
     loadThemeState,
     saveThemeState,
} from '../../util/db';
import { isPlainObject } from '../../helpers/helpers';
import { GLOBALS, LIBRARY } from '../../util/globals';
import { logDebugMessage, logErrorMessage } from '../../util/logging';
import { prehydrateLibrarySystemSnapshotCache } from '../../hooks/useLibrarySystemData';
import { prehydrateLibraryBranchSnapshotCache, invalidateSelfCheckSnapshot } from '../../hooks/useLibraryBranchData';
import { prehydrateLanguageSnapshotCache } from '../../hooks/useLanguageData';
import { prehydrateUserDataSnapshotCache } from '../../hooks/useUserData';
import { saveSelfCheckEnabled, saveSelfCheckSettings } from '../../util/db';
import { getSelfCheckSettings } from '../../util/api/system';

const splashImage = Constants.expoConfig.extra.loginLogo;
const splashBackgroundColor = Constants.expoConfig.splash.backgroundColor;

const USER_DATA_STALE_MS = 24 * 60 * 60 * 1000;         // 24 hours
const LANGUAGE_DATA_STALE_MS = 24 * 60 * 60 * 1000;     // 24 hours
const LIBRARY_BRANCH_DATA_STALE_MS = 24 * 60 * 60 * 1000;   // 24 hours
const LIBRARY_SYSTEM_METADATA_STALE_MS = 24 * 60 * 60 * 1000;     // 24 hours
const LIBRARY_SYSTEM_MENU_STALE_MS = 24 * 60 * 60 * 1000;     // 24 hours

function isCacheStale(updatedAt, thresholdMs) {
     if (!updatedAt) {
          return true;
     }
     return Date.now() - Number(updatedAt) > thresholdMs;
}

function resolveSelfCheckEnabled(result = {}) {
     const candidates = [
          result?.settings?.isEnabled,
          result?.settings?.enableSelfCheck,
          result?.isEnabled,
          result?.enableSelfCheck,
     ];

     for (const candidate of candidates) {
          if (candidate === true || candidate === 1 || candidate === '1') return true;
          if (candidate === false || candidate === 0 || candidate === '0') return false;
          if (typeof candidate === 'string') {
               const lowered = candidate.toLowerCase();
               if (lowered === 'true') return true;
               if (lowered === 'false') return false;
          }
     }

     return undefined;
}

export async function evaluateStartupCache() {
     const [cachedUserState, cachedLibraryBranchState, cachedLibrarySystemState, cachedLanguageState, loginUserKey] = await Promise.all([
          loadAllUserData(),
          loadAllLibraryBranchData(),
          loadAllLibrarySystemData(),
          loadAllLanguageData(),
          SecureStore.getItemAsync('userKey'),
     ]);

     const cachedUser = cachedUserState?.user ?? null;
     const normalizedLoginKey = String(loginUserKey ?? '').toLowerCase();
     const normalizedCatUsername = String(cachedUser?.cat_username ?? '').toLowerCase();
     const normalizedBarcode = String(cachedUser?.ils_barcode ?? '').toLowerCase();
     const matchesLoggedInUser = !normalizedLoginKey || normalizedLoginKey === normalizedCatUsername || normalizedLoginKey === normalizedBarcode;

     const hasUsableUserCache = !!cachedUser && matchesLoggedInUser;
     const hasUsableLibraryBranchCache = !!cachedLibraryBranchState && (!!cachedLibraryBranchState.location || !!cachedLibraryBranchState.selfCheckSettings);
     const hasUsableLibrarySystemCache = !!cachedLibrarySystemState && !!cachedLibrarySystemState.library;
     const hasUsableLanguageCache = !!cachedLanguageState && (Array.isArray(cachedLanguageState.languages) || isPlainObject(cachedLanguageState.dictionary));

     const branchUpdatedAt = cachedLibraryBranchState?.updatedAt ?? cachedLibraryBranchState?.updated_at ?? 0;
     const userCacheStale = hasUsableUserCache && isCacheStale(cachedUserState?.updatedAt, USER_DATA_STALE_MS);
     const libraryBranchCacheStale = hasUsableLibraryBranchCache && isCacheStale(branchUpdatedAt, LIBRARY_BRANCH_DATA_STALE_MS);
     const librarySystemMetadataStale = hasUsableLibrarySystemCache && isCacheStale(cachedLibrarySystemState?.updatedAt, LIBRARY_SYSTEM_METADATA_STALE_MS);
     const librarySystemMenuStale = hasUsableLibrarySystemCache && isCacheStale(cachedLibrarySystemState?.updatedAt, LIBRARY_SYSTEM_MENU_STALE_MS);
     const languageCacheStale = hasUsableLanguageCache && isCacheStale(cachedLanguageState?.updatedAt, LANGUAGE_DATA_STALE_MS);

     const canBypassLoading =
          hasUsableUserCache &&
          hasUsableLibraryBranchCache &&
          hasUsableLibrarySystemCache &&
          hasUsableLanguageCache;

      try {
           const persistedLibraryUrl = await loadLibraryUrl();
           const libraryUrl = LIBRARY.url || persistedLibraryUrl;

           if (libraryUrl && cachedLibraryBranchState?.location?.locationId) {
                const configuredLocationId = await SecureStore.getItemAsync('locationId');
                const selfCheckLocationId = configuredLocationId ?? cachedLibraryBranchState.location.locationId;

                logDebugMessage({
                     event: 'splash_self_check_settings_request',
                     libraryUrl,
                     configuredLocationId,
                     locationDataLocationId: cachedLibraryBranchState.location.locationId,
                     selfCheckLocationId,
                });

                if (typeof getSelfCheckSettings === 'function') {
                     const selfCheckResp = await getSelfCheckSettings(libraryUrl, selfCheckLocationId);
                     if (selfCheckResp?.ok) {
                          const result = selfCheckResp.data?.result ?? {};
                          const rawEnabled = result?.settings?.isEnabled;
                          const normalizedEnabled = resolveSelfCheckEnabled(result);
                          const success = result?.success === true || result?.success === 'true';

                          logDebugMessage({
                               event: 'splash_self_check_settings_response',
                               locationId: selfCheckLocationId,
                               success,
                               rawEnabled,
                               normalizedEnabled,
                          });

                          if (typeof normalizedEnabled === 'boolean') {
                               await saveSelfCheckEnabled(normalizedEnabled);
                               logDebugMessage({
                                    event: 'splash_self_check_enabled_saved',
                                    value: normalizedEnabled,
                               });
                          }

                          if (isPlainObject(result?.settings)) {
                               await saveSelfCheckSettings(result.settings);
                               logDebugMessage({
                                    event: 'splash_self_check_settings_saved',
                                    settingsKeys: Object.keys(result.settings),
                               });
                          }

                          if (typeof normalizedEnabled === 'boolean' || isPlainObject(result?.settings)) {
                               invalidateSelfCheckSnapshot(normalizedEnabled, result?.settings);
                               logDebugMessage({
                                    event: 'splash_self_check_snapshot_invalidated',
                               });
                          }
                     }
                }
           } else {
                logDebugMessage({
                     event: 'splash_self_check_settings_skipped',
                     reason: 'missing libraryUrl or locationId',
                     hasLibraryUrl: !!libraryUrl,
                     hasLocationId: !!cachedLibraryBranchState?.location?.locationId,
                });
           }
      } catch (error) {
           logErrorMessage('Splash: failed to fetch fresh self-check settings');
           logErrorMessage(error);
      }

      // Validate and normalize self-check settings from cache as fallback
      if (cachedLibraryBranchState && hasUsableLibraryBranchCache) {
           try {
                const normalizedEnabled = resolveSelfCheckEnabled(cachedLibraryBranchState);
                if (typeof normalizedEnabled === 'boolean') {
                     await saveSelfCheckEnabled(normalizedEnabled);
                }
                if (isPlainObject(cachedLibraryBranchState.selfCheckSettings)) {
                     await saveSelfCheckSettings(cachedLibraryBranchState.selfCheckSettings);
                }
                logDebugMessage({
                     event: 'splash_self_check_cache_validated',
                     normalizedEnabled,
                     hasSelfCheckSettings: !!cachedLibraryBranchState.selfCheckSettings,
                });
           } catch (error) {
                logErrorMessage('Splash: failed to validate cached self-check settings');
                logErrorMessage(error);
           }
      }

     // Pre-populate module-level snapshot caches so hook consumers receive data
     // on their very first render instead of waiting for an async SQLite round-trip.
     // Do this regardless of bypass decision so both paths benefit.
     prehydrateLibrarySystemSnapshotCache(cachedLibrarySystemState);
     prehydrateLibraryBranchSnapshotCache(cachedLibraryBranchState);
     prehydrateLanguageSnapshotCache(cachedLanguageState);
     prehydrateUserDataSnapshotCache(cachedUserState);

     // Seed LIBRARY.version global so formatDiscoveryVersion callers never see undefined
     // on the bypass path (they normally get it set as a side-effect by Loading.js).
     const cachedVersion = cachedLibrarySystemState?.library?.discoveryVersion;
     if (cachedVersion && LIBRARY.version !== cachedVersion.split(' ')[0]) {
          LIBRARY.version = cachedVersion.split(' ')[0];
          logDebugMessage('evaluateStartupCache: seeded LIBRARY.version from cache: ' + LIBRARY.version);
     }

     return {
          canBypassLoading,
          hasUsableUserCache,
          hasUsableLibraryBranchCache,
          hasUsableLibrarySystemCache,
          hasUsableLanguageCache,
          shouldRefreshUserInBackground: userCacheStale,
          shouldRefreshLibraryBranchInBackground: libraryBranchCacheStale,
          shouldRefreshLibrarySystemInBackground: librarySystemMetadataStale || librarySystemMenuStale,
          shouldRefreshLanguageInBackground: languageCacheStale,
     };
}

export const SplashScreen = ({ shouldInitializeTheme = false, forceRefreshTheme = false, onThemeInitialized }) => {
     const toast = useToast();
     const { updateTheme, updateColorMode } = useTheme();

     React.useEffect(() => {
          let active = true;

          const initializeTheme = async () => {
               logDebugMessage(`Splash theme init: start (enabled=${shouldInitializeTheme} forceRefresh=${forceRefreshTheme})`);
               if (!shouldInitializeTheme) {
                    logDebugMessage('Splash theme init: skipped (shouldInitializeTheme=false)');
                    if (typeof onThemeInitialized === 'function' && active) {
                         onThemeInitialized();
                    }
                    return;
               }

               try {
                    const currentThemeState = await loadThemeState();
                    const mode = currentThemeState?.colorMode === 'dark' ? 'dark' : 'light';
                    logDebugMessage(`Splash theme init: loaded state mode=${mode} hasColors=${Boolean(currentThemeState?.themeColors?.primary && currentThemeState?.themeColors?.secondary && currentThemeState?.themeColors?.tertiary)}`);
                    await updateColorMode(mode);

                    const hasStoredTheme = Boolean(currentThemeState?.themeColors?.primary && currentThemeState?.themeColors?.secondary && currentThemeState?.themeColors?.tertiary);
                    const hasMatchingThemeId = await isStoredThemeIdMatch(Constants.expoConfig.extra.themeId ?? 1);
                    const themeAgeMs = currentThemeState?.updatedAt ? Date.now() - currentThemeState.updatedAt : Number.POSITIVE_INFINITY;
                    const isThemeStale = themeAgeMs > THEME_STALE_MS;
                    logDebugMessage(`Splash theme init: validation hasStoredTheme=${hasStoredTheme} hasMatchingThemeId=${hasMatchingThemeId} expectedThemeId=${Constants.expoConfig.extra.themeId ?? 1}`);

                    const shouldFetchFromApi = forceRefreshTheme || !hasStoredTheme || !hasMatchingThemeId || isThemeStale;
                    logDebugMessage(`Splash theme init: shouldFetchFromApi=${shouldFetchFromApi} isThemeStale=${isThemeStale} themeAgeMs=${themeAgeMs}`);

                    if (!shouldFetchFromApi && hasStoredTheme && hasMatchingThemeId) {
                         logDebugMessage('Splash theme init: applying cached theme from SQLite');
                         await updateTheme({
                              tokens: {
                                   colors: currentThemeState.themeColors,
                              },
                          });
                    } else {
                         const persistedLibraryUrl = await loadLibraryUrl();
                         const themeUrl = LIBRARY.url || persistedLibraryUrl || GLOBALS.url || Constants.expoConfig.extra.apiUrl;
                         if (!themeUrl) {
                              logDebugMessage('Splash theme init: no URL available yet, skipping fetch and leaving defaults until library context is ready');
                              return;
                         }

                         logDebugMessage(`Splash theme init: fetching theme from API url=${themeUrl}`);
                         const builtTheme = await buildThemeForLibrary(toast, themeUrl);
                         await saveThemeState({
                              themeId: builtTheme.themeId,
                              colorMode: mode,
                              textColor: mode === 'dark' ? 'textLight50' : 'textLight950',
                              themeColors: builtTheme.themeColors,
                           });
                         logDebugMessage(`Splash theme init: saved fetched theme themeId=${builtTheme.themeId}`);
                         await updateTheme(builtTheme.theme);
                    }
                    logDebugMessage('Splash theme init: complete');
               } catch (error) {
                    logErrorMessage('Splash theme initialization failed');
                    logErrorMessage(error);
               } finally {
                    logDebugMessage('Splash theme init: finalize callback');
                    if (typeof onThemeInitialized === 'function' && active) {
                         onThemeInitialized();
                    }
               }
          };

          initializeTheme();

          return () => {
               logDebugMessage('Splash theme init: cleanup (component unmounted)');
               active = false;
          };
     }, [forceRefreshTheme, onThemeInitialized, shouldInitializeTheme, toast, updateColorMode, updateTheme]);

     return (
          <Center testID="splash-center" flex={1} px="$3" style={{ backgroundColor: splashBackgroundColor }}>
               <VStack space="md" alignItems="center">
                    <Image source={{ uri: splashImage }} size="2xl" alt={getTermFromDictionary('en', 'app_name')} />
                    <Spinner size="small" />
               </VStack>
          </Center>
     );
};
