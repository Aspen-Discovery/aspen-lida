import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLinkTo, useNavigation} from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import _, {isEmpty, isUndefined} from 'lodash';
import {Box, Center, Heading, Progress, VStack} from '@gluestack-ui/themed';
import React from 'react';
import { SystemMessagesContext, ThemeContext } from '../../context/initialContext';
import {createGlueTheme} from '../../themes/theme';
import {
     getLanguageDisplayName,
     getTermFromDictionary,
     getTranslatedTermsForUserPreferredLanguage,
     setTranslationsLibrary,
     translationsLibrary,
} from '../../translations/TranslationService';
import {
     getCatalogStatus,
     getLibraryInfo,
     getLibraryLanguages,
     getLibraryLinks,
     getLocationInfo,
     getSelfCheckSettings,
     getSystemMessages
} from '../../util/api/system';
import {getBrowseCategoryListForUser, getHomeScreenFeed} from '../../util/api/search';
import {
     fetchNotificationHistory,
     getAppPreferencesForUser,
     getLinkedAccounts,
     refreshProfile
} from '../../util/api/user';
import {formatLinkedAccounts, formatNotificationHistory} from '../../util/api/userHelper';

import {LIBRARY} from '../../util/globals';
import {CatalogOffline} from './CatalogOffline';
import {ForceLogout} from './ForceLogout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
     loadAllUserData,
     loadAllLibraryBranchData,
     saveUserProfile,
     saveAccounts,
     saveCards,
     saveAppPreferences,
     saveNotificationHistory,
     saveInbox,
     saveAllLibraryBranchData,
     loadAllLibrarySystemData,
     loadAllLanguageData,
     saveCatalogStatus,
     saveLibrary,
     saveMenu,
     saveHomeScreenLinks,
} from '../../util/db';
import {
     useUpdateLibraryVersion,
     useUpdateCatalogStatus,
} from '../../hooks/useLibrarySystemData';
import {
     useUpdateBrowseCategories,
     useUpdateMaxCategories,
     useUpdateBrowseCategoryList,
} from '../../hooks/useBrowseCategoryData';
import {
     useActiveLanguage,
     useAvailableLanguages,
     useUpdateActiveLanguage,
     useUpdateAvailableLanguages,
     useUpdateDictionary,
     useUpdateLanguageDisplayName,
} from '../../hooks/useLanguageData';

import {getErrorMessage, logDebugMessage, logErrorMessage, logWarnMessage} from '../../util/logging.js';
import {stripHTML} from '../../helpers/helpers';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const prefix = Linking.createURL('/');
const USER_DATA_STALE_MS = 12 * 60 * 60 * 1000;
const LANGUAGE_DATA_STALE_MS = 12 * 60 * 60 * 1000;
const LIBRARY_BRANCH_DATA_STALE_MS = 24 * 60 * 60 * 1000;
const LIBRARY_SYSTEM_METADATA_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours
const LIBRARY_SYSTEM_MENU_STALE_MS = 5 * 60 * 1000; // 5 minutes

Notifications.setNotificationHandler({
     handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
     }),
});

export const LoadingScreen = () => {
     const linkingUrl = Linking.useLinkingURL();
     const linkTo = useLinkTo();
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const [isFocused, setIsFocused] = React.useState(0);
     const [progress, setProgress] = React.useState(0);
     const [isReloading, setIsReloading] = React.useState(false);
     const [hasError, setHasError] = React.useState(false);
     const [errorMessage, setErrorMessage] = React.useState(null);
     const [errorTitle, setErrorTitle] = React.useState(null);
     const [incomingUrl, setIncomingUrl] = React.useState('');
     const [hasIncomingUrlChanged, setIncomingUrlChanged] = React.useState(false);
     const [hasUsableUserCache, setHasUsableUserCache] = React.useState(false);
     const [shouldBlockUserFetch, setShouldBlockUserFetch] = React.useState(true);
       const [isInitialUserDataReady, setIsInitialUserDataReady] = React.useState(false);
       const [hasHydratedUserCacheDecision, setHasHydratedUserCacheDecision] = React.useState(false);
       const [hasUsableLibraryBranchCache, setHasUsableLibraryBranchCache] = React.useState(false);
       const [shouldBlockLibraryBranchFetch, setShouldBlockLibraryBranchFetch] = React.useState(true);
        const [isInitialLibraryBranchDataReady, setIsInitialLibraryBranchDataReady] = React.useState(false);
        const [hasHydratedLibraryBranchCacheDecision, setHasHydratedLibraryBranchCacheDecision] = React.useState(false);
        const [isSQLiteDataLoaded, setIsSQLiteDataLoaded] = React.useState(false);
        const [hasUsableLibrarySystemCache, setHasUsableLibrarySystemCache] = React.useState(false);
        const [shouldBlockLibrarySystemFetch, setShouldBlockLibrarySystemFetch] = React.useState(true);
        const [isInitialLibrarySystemDataReady, setIsInitialLibrarySystemDataReady] = React.useState(false);
        const [hasHydratedLibrarySystemCacheDecision, setHasHydratedLibrarySystemCacheDecision] = React.useState(false);
        const [hasUsableLanguageCache, setHasUsableLanguageCache] = React.useState(false);
        const [shouldBlockLanguageFetch, setShouldBlockLanguageFetch] = React.useState(true);
        const [isInitialLanguageDataReady, setIsInitialLanguageDataReady] = React.useState(false);
        const [hasHydratedLanguageCacheDecision, setHasHydratedLanguageCacheDecision] = React.useState(false);
       const isBlockingUserFetchInFlightRef = React.useRef(false);
       const isBlockingLibraryBranchFetchInFlightRef = React.useRef(false);
       const isBlockingLibrarySystemFetchInFlightRef = React.useRef(false);
       const userDataFetchInvocationRef = React.useRef(0);
       const libraryBranchFetchInvocationRef = React.useRef(0);
       const librarySystemFetchInvocationRef = React.useRef(0);
       const fetchAndPersistUserDataRef = React.useRef(null);
       const fetchAndPersistLibraryBranchDataRef = React.useRef(null);
       const fetchAndPersistLibrarySystemDataRef = React.useRef(null);

       const updateBrowseCategories = useUpdateBrowseCategories();
       const updateBrowseCategoryList = useUpdateBrowseCategoryList();
       const updateMaxCategories = useUpdateMaxCategories();
       const language = useActiveLanguage();
       const languages = useAvailableLanguages();
       const updateLanguage = useUpdateActiveLanguage();
       const updateLanguages = useUpdateAvailableLanguages();
       const updateDictionary = useUpdateDictionary();
       const updateLanguageDisplayName = useUpdateLanguageDisplayName();
       const { updateSystemMessages } = React.useContext(SystemMessagesContext);
       const { updateTheme, updateColorMode, textColor } = React.useContext(ThemeContext);

       // Get library system update hooks
       const updateLibraryVersion = useUpdateLibraryVersion();
       const updateCatalogStatus = useUpdateCatalogStatus();

       const [loadingText, setLoadingText] = React.useState('');
       const [loadingTheme, setLoadingTheme] = React.useState(true);
       const [loadedUser, setLoadedUser] = React.useState({});
       const [location, setLocation] = React.useState({});
       const [libraryData, setLibraryData] = React.useState({});
        const [libraryLinksQuerySuccess, setLibraryLinksQuerySuccess] = React.useState(false);
        const [browseCategoryQuerySuccess, setBrowseCategoryQuerySuccess] = React.useState(false);
       const library = libraryData ?? {};
       const appSettings = libraryData?.appSettings ?? LIBRARY?.appSettings ?? {};
       const loadingMessageType = appSettings?.loadingMessageType;
       const loadingMessage = appSettings?.loadingMessage;
       const user = loadedUser;
        // Use URL availability to start hydration/bootstrap. Requiring library metadata here can deadlock
        // because metadata is fetched later in this same loading pipeline.
        const hasResolvedLibraryContext = !!LIBRARY.url;

     const insets = useSafeAreaInsets();

     const numSteps = 14;

     const fetchAndPersistUserData = React.useCallback(async ({ runInBackground = false } = {}) => {
          const invocationId = ++userDataFetchInvocationRef.current;
          logDebugMessage({
               event: 'fetchAndPersistUserData:start',
               invocationId,
               runInBackground,
          });
          try {
               const profileResp = await refreshProfile(LIBRARY.url);
               const validProfile = profileResp?.ok && profileResp?.data?.result?.success !== false && profileResp?.data?.result?.success !== 'false';
               if (!validProfile) {
                    if (runInBackground) return false;
                    const error = getErrorMessage(profileResp?.code ?? 0, profileResp?.problem);
                    setHasError(true);
                    setErrorTitle('Unable to load patron profile');
                    setErrorMessage(error.message);
                    return false;
               }

               const profile = profileResp.data.result.profile ?? {};
               await saveUserProfile(profile);
               setLoadedUser(profile);
               await updateLanguage(profile.interfaceLanguage ?? 'en');
               await updateLanguageDisplayName(getLanguageDisplayName(profile.interfaceLanguage ?? 'en', languages));

               const linkedResp = await getLinkedAccounts(LIBRARY.url, 'en');
               if (linkedResp?.ok) {
                    const linkedAccounts = formatLinkedAccounts(profile, [], library?.barcodeStyle ?? 'UNKNOWN', linkedResp.data?.result?.linkedAccounts);
                    await saveAccounts(linkedAccounts.accounts ?? []);
                    await saveCards(linkedAccounts.cards ?? []);
               }

               const appPrefsResp = await getAppPreferencesForUser(LIBRARY.url, 'en');
               if (appPrefsResp?.ok) {
                    await saveAppPreferences(appPrefsResp.data?.result ?? {});
               }

               const notifResp = await fetchNotificationHistory(1, 20, true, LIBRARY.url, 'en');
               if (notifResp?.ok) {
                    const notificationHistory = formatNotificationHistory(notifResp.data?.result ?? {});
                    await saveNotificationHistory(notificationHistory);
                    await saveInbox(notificationHistory?.inbox ?? []);
               }

               if (!runInBackground) {
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    setIsInitialUserDataReady(true);
               }

               logDebugMessage({
                    event: 'fetchAndPersistUserData:success',
                    invocationId,
                    runInBackground,
               });

               return true;
          } catch (error) {
               if (runInBackground) {
                    logWarnMessage('Background user-data refresh failed. Continuing with cached data.');
                    logErrorMessage(error);
                    return false;
               }
               logDebugMessage({
                    event: 'fetchAndPersistUserData:error',
                    invocationId,
                    runInBackground,
               });
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading user data. Please try again or contact the library.');
               logErrorMessage(error);
               return false;
          }
     }, [library?.barcodeStyle, languages, updateLanguage, updateLanguageDisplayName]);

      React.useEffect(() => {
           fetchAndPersistUserDataRef.current = fetchAndPersistUserData;
      }, [fetchAndPersistUserData]);

     const fetchAndPersistLibraryBranchData = React.useCallback(async ({ runInBackground = false } = {}) => {
          const invocationId = ++libraryBranchFetchInvocationRef.current;
          logDebugMessage({
               event: 'fetchAndPersistLibraryBranchData:start',
               invocationId,
               runInBackground,
          });
          try {
               // Fetch location info
               const locationResp = await getLocationInfo(LIBRARY.url);
               if (!locationResp?.ok) {
                    if (runInBackground) {
                         logWarnMessage('Background location refresh failed. Continuing with cached data.');
                         return false;
                    }
                    const error = getErrorMessage(locationResp?.code ?? 0, locationResp?.problem);
                    setHasError(true);
                    setErrorTitle("Unable to load library branches");
                    setErrorMessage(error.message);
                    return false;
               }

               const location = locationResp.data.result?.location ?? [];

               // Fetch self-check settings
               const selfCheckResp = await getSelfCheckSettings(LIBRARY.url);
               let selfCheckEnabled = false;
               let selfCheckSettings = {};

               if (selfCheckResp?.ok && selfCheckResp.data.result?.success) {
                    selfCheckEnabled = selfCheckResp.data.result.settings?.isEnabled ?? false;
                    selfCheckSettings = selfCheckResp.data.result.settings ?? {};
               }

                // Save all library branch data in one transaction
                await saveAllLibraryBranchData({
                     location,
                     selfCheckEnabled,
                     selfCheckSettings
                });

                if (!runInBackground) {
                     setIsInitialLibraryBranchDataReady(true);
                     setLocation(location);
                }

               logDebugMessage({
                    event: 'fetchAndPersistLibraryBranchData:success',
                    invocationId,
                    runInBackground,
               });

               return true;
          } catch (error) {
               if (runInBackground) {
                    logWarnMessage('Background library-branch-data refresh failed. Continuing with cached data.');
                    logErrorMessage(error);
                    return false;
               }
               logDebugMessage({
                    event: 'fetchAndPersistLibraryBranchData:error',
                    invocationId,
                    runInBackground,
               });
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading library branch data. Please try again or contact the library.');
               logErrorMessage(error);
               return false;
          }
     }, []);

      React.useEffect(() => {
           fetchAndPersistLibraryBranchDataRef.current = fetchAndPersistLibraryBranchData;
      }, [fetchAndPersistLibraryBranchData]);

      const fetchAndPersistLibrarySystemData = React.useCallback(async ({ runInBackground = false } = {}) => {
           const invocationId = ++librarySystemFetchInvocationRef.current;
           logDebugMessage({
                event: 'fetchAndPersistLibrarySystemData:start',
                invocationId,
                runInBackground,
           });
           try {
                // Fetch catalog status
                const catalogResp = await getCatalogStatus(LIBRARY.url);
                let catalogStatus = 0;
                let catalogStatusMessage = '';
                if (catalogResp?.ok) {
                     catalogStatus = catalogResp.data.result?.catalogStatus ?? 0;
                     if (catalogResp.data.result?.api?.message) {
                          catalogStatusMessage = stripHTML(catalogResp.data.result.api.message);
                     }
                }

                // Fetch library info
                const libraryResp = await getLibraryInfo(LIBRARY.url, LIBRARY.id);
                if (!libraryResp?.ok) {
                     if (runInBackground) {
                          logWarnMessage('Background library info refresh failed. Continuing with cached data.');
                          return false;
                     }
                     const error = getErrorMessage(libraryResp?.code ?? 0, libraryResp?.problem);
                     setHasError(true);
                     setErrorTitle("Unable to load library info");
                     setErrorMessage(error.message);
                     return false;
                }

                const libraryInfo = libraryResp.data.result?.library ?? {};
                setLibraryData(libraryInfo);

                // Fetch library links (menu)
                const linksResp = await getLibraryLinks(LIBRARY.url);
                const menu = linksResp?.ok ? (linksResp.data.result?.items ?? []) : [];

                // Save library system data
                await saveCatalogStatus(catalogStatus, catalogStatusMessage);
                await saveLibrary(libraryInfo);
                await saveMenu(menu);

                // Update library version if present
                if (libraryInfo.discoveryVersion) {
                     await updateLibraryVersion(libraryInfo.discoveryVersion);
                }

                if (!runInBackground) {
                     setIsInitialLibrarySystemDataReady(true);
                     setLibraryLinksQuerySuccess(true);
                }

                logDebugMessage({
                     event: 'fetchAndPersistLibrarySystemData:success',
                     invocationId,
                     runInBackground,
                });

                return true;
           } catch (error) {
                if (runInBackground) {
                     logWarnMessage('Background library-system-data refresh failed. Continuing with cached data.');
                     logErrorMessage(error);
                     return false;
                }
                logDebugMessage({
                     event: 'fetchAndPersistLibrarySystemData:error',
                     invocationId,
                     runInBackground,
                });
                setHasError(true);
                setErrorTitle(null);
                setErrorMessage('Error loading library system data. Please try again or contact the library.');
                logErrorMessage(error);
                return false;
           }
      }, [updateLibraryVersion]);

       React.useEffect(() => {
            fetchAndPersistLibrarySystemDataRef.current = fetchAndPersistLibrarySystemData;
       }, [fetchAndPersistLibrarySystemData]);

       const fetchAndPersistLanguageData = React.useCallback(async ({ runInBackground = false } = {}) => {
            try {
                 const activeLanguage = language ?? 'en';

                 const languageResponse = await getLibraryLanguages(LIBRARY.url);
                 if (!languageResponse?.ok) {
                      if (runInBackground) {
                           logWarnMessage('Background language-list refresh failed. Continuing with cached language list.');
                           return false;
                      }
                      const error = getErrorMessage(languageResponse?.code ?? 0, languageResponse?.problem);
                      setHasError(true);
                      setErrorTitle('Unable to load library languages');
                      setErrorMessage(error.message);
                      return false;
                 }

                 const fetchedLanguages = _.sortBy(languageResponse?.data?.result?.languages ?? [], 'weight', 'displayName');
                 await updateLanguages(fetchedLanguages);

                 await getTranslatedTermsForUserPreferredLanguage(activeLanguage, LIBRARY.url);
                 setTranslationsLibrary(translationsLibrary);
                 await updateDictionary(translationsLibrary);

                 if (!runInBackground) {
                      setIsInitialLanguageDataReady(true);
                      setProgress(prevProgress => prevProgress + (100 / numSteps));
                 }

                 return true;
            } catch (error) {
                 if (runInBackground) {
                      logWarnMessage('Background language-data refresh failed. Continuing with cached translations.');
                      logErrorMessage(error);
                      return false;
                 }
                 setHasError(true);
                 setErrorTitle(null);
                 setErrorMessage('Error loading language data. Please try again or contact the library.');
                 logErrorMessage(error);
                 return false;
            }
       }, [language, updateLanguages, updateDictionary, numSteps]);

       React.useEffect(() => {
            if (!hasResolvedLibraryContext || hasError) return;
            let cancelled = false;

            const hydrateUserCache = async () => {
                 try {
                      logDebugMessage('hydrateUserCache: starting SQLite hydration');
                      const cached = await loadAllUserData();
                      const loginUserKey = (await SecureStore.getItemAsync('userKey')) ?? '';
                      const cachedUser = cached?.user ?? null;
                      const normalizedKey = String(loginUserKey).toLowerCase();
                      const normalizedCat = String(cachedUser?.cat_username ?? '').toLowerCase();
                      const normalizedBarcode = String(cachedUser?.ils_barcode ?? '').toLowerCase();
                      const matchesLoggedInUser = !normalizedKey || normalizedKey === normalizedCat || normalizedKey === normalizedBarcode;
                      const hasAnyCachedUserData = !!cachedUser && matchesLoggedInUser;

                      logDebugMessage('hydrateUserCache: cache snapshot');
                      logDebugMessage({
                           hasCachedUser: !!cachedUser,
                           hasUpdatedAt: !!cached?.updatedAt,
                           loginKeyPresent: normalizedKey.length > 0,
                           matchesCatUsername: !!normalizedKey && normalizedKey === normalizedCat,
                           matchesBarcode: !!normalizedKey && normalizedKey === normalizedBarcode,
                           matchesLoggedInUser,
                           hasAnyCachedUserData,
                      });

                      if (cancelled) return;

                      if (hasAnyCachedUserData) {
                           logDebugMessage('hydrateUserCache: using cached user data');
                           setHasUsableUserCache(true);
                           setShouldBlockUserFetch(false);
                           setIsInitialUserDataReady(true);
                           setLoadedUser(cachedUser);

                           const isStale = !cached?.updatedAt || Date.now() - cached.updatedAt > USER_DATA_STALE_MS;
                           logDebugMessage({
                                event: 'hydrateUserCache: stale check',
                                isStale,
                                cacheAgeMs: cached?.updatedAt ? Date.now() - cached.updatedAt : null,
                                staleThresholdMs: USER_DATA_STALE_MS,
                           });
                           if (isStale) {
                                logDebugMessage('hydrateUserCache: cache stale, running background refresh');
                                fetchAndPersistUserDataRef.current?.({ runInBackground: true });
                           } else {
                                logDebugMessage('hydrateUserCache: fresh cache path, skipping user-data API fetch');
                           }
                      } else {
                           logDebugMessage('hydrateUserCache: cache missing or user mismatch, forcing blocking fetch');
                           setHasUsableUserCache(false);
                           setShouldBlockUserFetch(true);
                      }
                      setHasHydratedUserCacheDecision(true);
                 } catch (error) {
                      if (cancelled) return;
                      logWarnMessage('hydrateUserCache: failed, falling back to blocking fetch');
                      logErrorMessage(error);
                      setHasUsableUserCache(false);
                      setShouldBlockUserFetch(true);
                      setHasHydratedUserCacheDecision(true);
                 }
            };

            hydrateUserCache();
            return () => {
                 cancelled = true;
            };
       }, [hasResolvedLibraryContext, hasError]);

        React.useEffect(() => {
             if (hasHydratedUserCacheDecision && hasHydratedLibraryBranchCacheDecision && hasHydratedLibrarySystemCacheDecision && hasHydratedLanguageCacheDecision) {
                  logDebugMessage('All SQLite hydrations complete, marking SQLite data as loaded');
                  setIsSQLiteDataLoaded(true);
             }
        }, [hasHydratedUserCacheDecision, hasHydratedLibraryBranchCacheDecision, hasHydratedLibrarySystemCacheDecision, hasHydratedLanguageCacheDecision]);

     React.useEffect(() => {
          if (!hasResolvedLibraryContext || hasError) return;
          let cancelled = false;

          const hydrateLibraryBranchCache = async () => {
               try {
                    logDebugMessage('hydrateLibraryBranchCache: starting SQLite hydration');
                    const cached = await loadAllLibraryBranchData();
                    const hasAnyCachedLibraryBranchData = !!cached && (!!cached.location || !!cached.selfCheckSettings);

                    logDebugMessage('hydrateLibraryBranchCache: cache snapshot');
                    logDebugMessage({
                         hasCachedLocation: !!cached?.location,
                         hasCachedSelfCheck: !!cached?.selfCheckSettings,
                         hasAnyCachedLibraryBranchData,
                    });

                    if (cancelled) return;

                     if (hasAnyCachedLibraryBranchData) {
                          logDebugMessage('hydrateLibraryBranchCache: using cached library branch data');
                          setHasUsableLibraryBranchCache(true);
                          setShouldBlockLibraryBranchFetch(false);
                          setIsInitialLibraryBranchDataReady(true);
                          setLocation(cached?.location || {});

                         const branchUpdatedAt = cached?.updatedAt ?? cached?.updated_at ?? 0;
                         const isStale = !branchUpdatedAt || (Date.now() - branchUpdatedAt > LIBRARY_BRANCH_DATA_STALE_MS);
                         logDebugMessage({
                              event: 'hydrateLibraryBranchCache: stale check',
                              isStale,
                              cacheAgeMs: branchUpdatedAt ? Date.now() - branchUpdatedAt : null,
                              staleThresholdMs: LIBRARY_BRANCH_DATA_STALE_MS,
                         });
                         if (isStale) {
                              logDebugMessage('hydrateLibraryBranchCache: cache stale, running background refresh');
                              fetchAndPersistLibraryBranchDataRef.current?.({ runInBackground: true });
                         } else {
                              logDebugMessage('hydrateLibraryBranchCache: fresh cache path, skipping library-branch-data API fetch');
                         }
                    } else {
                         logDebugMessage('hydrateLibraryBranchCache: cache missing, forcing blocking fetch');
                         setHasUsableLibraryBranchCache(false);
                         setShouldBlockLibraryBranchFetch(true);
                    }
                    setHasHydratedLibraryBranchCacheDecision(true);
               } catch (error) {
                    if (cancelled) return;
                    logWarnMessage('hydrateLibraryBranchCache: failed, falling back to blocking fetch');
                    logErrorMessage(error);
                    setHasUsableLibraryBranchCache(false);
                    setShouldBlockLibraryBranchFetch(true);
                    setHasHydratedLibraryBranchCacheDecision(true);
               }
          };

           hydrateLibraryBranchCache();
           return () => {
                cancelled = true;
           };
      }, [hasResolvedLibraryContext, hasError]);

      React.useEffect(() => {
           if (!hasResolvedLibraryContext || hasError) return;
           let cancelled = false;

           const hydrateLibrarySystemCache = async () => {
                try {
                     logDebugMessage('hydrateLibrarySystemCache: starting SQLite hydration');
                     const cached = await loadAllLibrarySystemData();
                     const hasAnyCachedLibrarySystemData = !!cached && !!cached.library;

                     logDebugMessage('hydrateLibrarySystemCache: cache snapshot');
                     logDebugMessage({
                          hasCachedLibrary: !!cached?.library,
                          hasCachedMenu: !!cached?.menu,
                          hasCachedCatalogStatus: cached?.catalogStatus !== undefined,
                          hasAnyCachedLibrarySystemData,
                     });

                     if (cancelled) return;

                     if (hasAnyCachedLibrarySystemData) {
                          logDebugMessage('hydrateLibrarySystemCache: using cached library system data');
                          setHasUsableLibrarySystemCache(true);
                          setShouldBlockLibrarySystemFetch(false);
                          setIsInitialLibrarySystemDataReady(true);
                          setLibraryData(cached?.library || {});

                          // Stale checks for different data types
                          const metadataIsStale = Date.now() - (cached?.updatedAt ?? 0) > LIBRARY_SYSTEM_METADATA_STALE_MS;
                          const menuIsStale = Date.now() - (cached?.updatedAt ?? 0) > LIBRARY_SYSTEM_MENU_STALE_MS;

                          logDebugMessage({
                               event: 'hydrateLibrarySystemCache: stale check',
                               metadataIsStale,
                               menuIsStale,
                               cacheAgeMs: cached?.updatedAt ? Date.now() - cached.updatedAt : null,
                               metadataStaleThresholdMs: LIBRARY_SYSTEM_METADATA_STALE_MS,
                               menuStaleThresholdMs: LIBRARY_SYSTEM_MENU_STALE_MS,
                          });

                          if (metadataIsStale || menuIsStale) {
                               logDebugMessage('hydrateLibrarySystemCache: cache stale, running background refresh');
                               fetchAndPersistLibrarySystemDataRef.current?.({ runInBackground: true });
                          } else {
                               logDebugMessage('hydrateLibrarySystemCache: fresh cache path, skipping library-system-data API fetch');
                          }
                     } else {
                          logDebugMessage('hydrateLibrarySystemCache: cache missing, forcing blocking fetch');
                          setHasUsableLibrarySystemCache(false);
                          setShouldBlockLibrarySystemFetch(true);
                     }
                     setHasHydratedLibrarySystemCacheDecision(true);
                } catch (error) {
                     if (cancelled) return;
                     logWarnMessage('hydrateLibrarySystemCache: failed, falling back to blocking fetch');
                     logErrorMessage(error);
                     setHasUsableLibrarySystemCache(false);
                     setShouldBlockLibrarySystemFetch(true);
                     setHasHydratedLibrarySystemCacheDecision(true);
                }
           };

           hydrateLibrarySystemCache();
           return () => {
                cancelled = true;
           };
      }, [hasResolvedLibraryContext, hasError]);

      React.useEffect(() => {
           if (!hasResolvedLibraryContext || hasError) return;
           let cancelled = false;

           const hydrateLanguageCache = async () => {
                try {
                     const cached = await loadAllLanguageData();
                     const hasCachedLanguageData = !!cached && (Array.isArray(cached.languages) || _.isObject(cached.dictionary));

                     if (cancelled) return;

                     if (hasCachedLanguageData) {
                          const cachedLanguages = Array.isArray(cached.languages) ? cached.languages : [];
                          const cachedDictionary = _.isObject(cached.dictionary) ? cached.dictionary : {};
                          await updateLanguages(cachedLanguages);
                          setTranslationsLibrary(cachedDictionary);
                          await updateDictionary(cachedDictionary);

                          setHasUsableLanguageCache(true);
                          setShouldBlockLanguageFetch(false);
                          setIsInitialLanguageDataReady(true);

                          const isStale = !cached?.updatedAt || (Date.now() - cached.updatedAt > LANGUAGE_DATA_STALE_MS);
                          if (isStale) {
                               fetchAndPersistLanguageData({ runInBackground: true });
                          }
                     } else {
                          setHasUsableLanguageCache(false);
                          setShouldBlockLanguageFetch(true);
                     }

                     setHasHydratedLanguageCacheDecision(true);
                } catch (error) {
                     if (cancelled) return;
                     logWarnMessage('hydrateLanguageCache: failed, falling back to blocking language fetch');
                     logErrorMessage(error);
                     setHasUsableLanguageCache(false);
                     setShouldBlockLanguageFetch(true);
                     setHasHydratedLanguageCacheDecision(true);
                }
           };

           hydrateLanguageCache();
           return () => {
                cancelled = true;
           };
      }, [hasResolvedLibraryContext, hasError, updateLanguages, updateDictionary, fetchAndPersistLanguageData]);

      React.useEffect(() => {
          const unsubscribe = navigation.addListener('focus', async () => {
               logDebugMessage('Setting up focus listener');
               //Only invoke the focus event once
               unsubscribe();
               if (isFocused === 0) {
                    setIsFocused(1);
                    // The screen is focused
                    logDebugMessage('The Loading screen is focused.');
                    setIsReloading(true);
                    setProgress(0);
                    queryClient.clear();
                    try {
                         await AsyncStorage.getItem('@colorMode').then(async (mode) => {
                              if (mode === 'light' || mode === 'dark') {
                                   updateColorMode(mode);
                              } else {
                                   updateColorMode('light');
                              }
                         });
                    } catch (e) {
                         // something went wrong (or the item didn't exist yet in storage)
                         // so just set it to the default: light
                         updateColorMode('light');
                    }

                    await createGlueTheme(LIBRARY.url).then((result) => {
                         logDebugMessage("Creating glue theme");
                         updateTheme(result);
                         setLoadingTheme(false);
                         //if we have no library we should set error
                         //to avoid being stuck on loading screen.
                         if (LIBRARY.url === null) {
                              setHasError(true);
                         }
                    });
               }else{
                    logDebugMessage('isFocused is not 0.');
               }
          });
          return unsubscribe;
     }, [navigation]);

      /**
       * Load information needed to display the interface. These are done sequentially since some calls may rely on previous data.
       * This is done by controlling when each query is enabled.
       */

      /**
       * First check to see if the catalog is online and check to see if offline mode is active.
       */
      let catalogStatusSuccess = false;
      const [catalogStatusData, setCatalogStatusData] = React.useState(null);
      const [catalogStatus, setCatalogStatusState] = React.useState(0);

      React.useEffect(() => {
           if (!LIBRARY.url || loadingTheme) return;
           let cancelled = false;

           (async () => {
                try {
                     const data = await getCatalogStatus(LIBRARY.url);
                     if (cancelled) return;

                     if (data?.ok) {
                          let catalogMessage = null;
                          if (data.data.result?.api?.message) {
                               catalogMessage = stripHTML(data.data.result.api.message);
                          }
                          let status = data.data.result?.catalogStatus ?? 0;
                          await saveCatalogStatus(status, catalogMessage);
                          await updateCatalogStatus(status, catalogMessage);
                          setCatalogStatusState(status);
                          if (loadingMessageType === 1) {
                               setLoadingText('Loading catalog...');
                          }else if (loadingMessageType === 2) {
                               setLoadingText(loadingMessage);
                          }
                          logDebugMessage("Loaded catalog status");
                          setProgress(prevProgress => prevProgress + (100 / numSteps));
                          catalogStatusSuccess = true;
                          setCatalogStatusData(data);
                     } else {
                          logWarnMessage("Setting Error to true because catalog status returned not ok");
                          const error = getErrorMessage(data?.code ?? 0, data?.problem);
                          setHasError(true);
                          setErrorMessage(error.message);
                          setErrorTitle("Unable to determine catalog status");
                     }
                } catch (error) {
                     if (cancelled) return;
                     logDebugMessage("Setting Error to true because loading catalog status failed");
                     logErrorMessage(error);
                     setHasError(true);
                     setErrorTitle(null);
                     setErrorMessage('Error checking catalog status. Please try again or contact the library.');
                }
           })();

           return () => {
                cancelled = true;
           };
      }, [LIBRARY.url, loadingTheme]);

      const [languagesQuerySuccess, setLanguagesQuerySuccess] = React.useState(false);

      React.useEffect(() => {
           if (!catalogStatusData || hasError || !hasHydratedLanguageCacheDecision || !shouldBlockLanguageFetch || isInitialLanguageDataReady) {
                return;
           }

           let cancelled = false;
           const runBlockingLanguageFetch = async () => {
                if (loadingMessageType === 1) {
                     setLoadingText('Loading Languages');
                }

                const ok = await fetchAndPersistLanguageData({ runInBackground: false });
                if (cancelled || !ok) {
                     return;
                }

                setLanguagesQuerySuccess(true);
                if (isUndefined(loadingMessageType) || loadingMessageType === 0) {
                     setLoadingText(getTermFromDictionary(language ?? 'en', 'loading_1'));
                } else if (loadingMessageType === 1) {
                     setLoadingText('Loading Library Information');
                }
           };

           runBlockingLanguageFetch();
           return () => {
                cancelled = true;
           };
      }, [catalogStatusData, hasError, hasHydratedLanguageCacheDecision, shouldBlockLanguageFetch, isInitialLanguageDataReady, fetchAndPersistLanguageData, loadingMessageType, language]);

      React.useEffect(() => {
           if (hasError || !hasHydratedLanguageCacheDecision || shouldBlockLanguageFetch || !isInitialLanguageDataReady) {
                return;
           }
           setLanguagesQuerySuccess(true);
      }, [hasError, hasHydratedLanguageCacheDecision, shouldBlockLanguageFetch, isInitialLanguageDataReady]);

      React.useEffect(() => {
           const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
                const url = response?.notification?.request?.content?.data?.url ?? prefix;
                if (url !== incomingUrl) {
                     logDebugMessage('Incoming url changed');
                     logDebugMessage('OLD > ' + incomingUrl);
                     logDebugMessage('NEW > ' + url);
                     setIncomingUrl(response?.notification?.request?.content?.data?.url ?? prefix);
                     setIncomingUrlChanged(true);
                } else {
                     setIncomingUrlChanged(false);
                }
           });

           return () => {
                responseListener.remove();
           };
      }, []);

       let librarySystemQuerySuccess = false;

       React.useEffect(() => {
           if (hasError || !languagesQuerySuccess) return;
           let cancelled = false;

           (async () => {
                try {
                     const data = await getLibraryInfo(LIBRARY.url, LIBRARY.id);
                     if (cancelled) return;

                     if (data?.ok) {
                          const libraryInfo = data.data.result?.library ?? [];
                          logDebugMessage("Loaded Library Info");
                          setProgress(prevProgress => prevProgress + (100 / numSteps));
                          await saveLibrary(libraryInfo);
                          setLibraryData(libraryInfo);
                          if (libraryInfo.discoveryVersion) {
                               await updateLibraryVersion(libraryInfo.discoveryVersion);
                          }
                           if (loadingMessageType === 1) {
                                setLoadingText('Loading User Information');
                           }
                           librarySystemQuerySuccess = true;
                      } else {
                          logDebugMessage("Error loading library system settings");
                          logDebugMessage(data);
                          const error = getErrorMessage(data?.code ?? 0, data?.problem);
                          setHasError(true);
                          setErrorMessage(error.message);
                          setErrorTitle("Unable to load library configuration");
                     }
                } catch (error) {
                     if (cancelled) return;
                     logWarnMessage("Setting Error to true because loading library system failed");
                     setHasError(true);
                     setErrorTitle(null);
                     setErrorMessage('Error loading library configuration. Please try again or contact the library.');
                     logErrorMessage(error);
                }
           })();

           return () => {
                cancelled = true;
           };
      }, [hasError, languagesQuerySuccess]);

       React.useEffect(() => {
           if (hasError || (!isInitialUserDataReady && !hasUsableUserCache) || libraryLinksQuerySuccess) return;
           let cancelled = false;

           // If library system bootstrap already ran from cache or blocking fetch,
           // menu data is already persisted and we can skip the duplicate link call.
           if (isInitialLibrarySystemDataReady || hasUsableLibrarySystemCache) {
                setLibraryLinksQuerySuccess(true);
                return;
           }

           (async () => {
                try {
                     const data = await getLibraryLinks(LIBRARY.url);
                     if (cancelled) return;

                     if (data?.ok) {
                          const links = data.data.result?.items ?? [];
                          setProgress(prevProgress => prevProgress + (100 / numSteps));
                          logDebugMessage("Loaded Library Links");
                          await saveMenu(links);
                          if (loadingMessageType === 1) {
                               setLoadingText('Loading Home Screen Feed');
                          }
                           setLibraryLinksQuerySuccess(true);
                      } else {
                          logDebugMessage("Error loading library links");
                          logDebugMessage(data);
                          const error = getErrorMessage(data?.code ?? 0, data?.problem);
                          setHasError(true);
                          setErrorMessage(error.message);
                          setErrorTitle("Unable to load menu links");
                     }
                } catch (error) {
                     if (cancelled) return;
                     logDebugMessage("Setting Error to true because loading library links failed");
                     logErrorMessage(error);
                     setHasError(true);
                     setErrorTitle(null);
                     setErrorMessage('Unknown error loading library links. Please try again or contact the library.');
                }
           })();

           return () => {
                cancelled = true;
           };
      }, [hasError, isInitialUserDataReady, hasUsableUserCache, libraryLinksQuerySuccess, isInitialLibrarySystemDataReady, hasUsableLibrarySystemCache]);

       React.useEffect(() => {
           if (hasError || !libraryLinksQuerySuccess) return;
           let cancelled = false;

           (async () => {
                try {
                     const data = await getHomeScreenFeed(5, LIBRARY.url);
                     if (cancelled) return;

                     if (data?.ok) {
                          logDebugMessage("Loaded Home Screen Feed");
                          setProgress(prevProgress => prevProgress + (100 / numSteps));
                          const result = data.data.result;
                          updateBrowseCategories(result.browseCategories);
                          updateMaxCategories(5);
                          await saveHomeScreenLinks(result.homeScreenLinks);
                          if (loadingMessageType === 1) {
                               setLoadingText('Loading Browse Category List');
                          }
                           setBrowseCategoryQuerySuccess(true);
                      } else {
                          logDebugMessage("Error loading browse categories and home screen links");
                          logDebugMessage(data);
                          const error = getErrorMessage(data?.code ?? 0, data?.problem);
                          setHasError(true);
                          setErrorMessage(error.message);
                          setErrorTitle("Unable to load browse categories and home screen links");
                     }
                } catch (error) {
                     if (cancelled) return;
                     logDebugMessage("Setting Error to true because loading browse categories and home screen links failed");
                     logErrorMessage(error);
                     setHasError(true);
                     setErrorTitle(null);
                     setErrorMessage('Error loading home screen feed. Please try again or contact the library.');
                }
           })();

           return () => {
                cancelled = true;
           };
       }, [hasError, libraryLinksQuerySuccess]);

       React.useEffect(() => {
            if (hasError || !browseCategoryQuerySuccess) return;
            let cancelled = false;

            (async () => {
                 try {
                      const data = await getBrowseCategoryListForUser(LIBRARY.url);
                      if (cancelled) return;

                      if (data?.ok) {
                           const categories = _.sortBy(data.data.result, ['title']);
                           logDebugMessage("Loaded Browse Category List");
                           setProgress(prevProgress => prevProgress + (100 / numSteps));
                           if (isUndefined(loadingMessageType) || loadingMessageType === 0) {
                                setLoadingText(getTermFromDictionary(language ?? 'en', 'loading_2'));
                           } else if (loadingMessageType === 1) {
                                setLoadingText('Loading Branch Information');
                           }
                           await updateBrowseCategoryList(categories);
                      } else {
                           logDebugMessage("Error loading browse category list");
                           logDebugMessage(data);
                           const error = getErrorMessage(data?.code ?? 0, data?.problem);
                           setHasError(true);
                           setErrorMessage(error.message);
                           setErrorTitle("Unable to load browse category list");
                      }
                 } catch (error) {
                      if (cancelled) return;
                      logDebugMessage("Setting Error to true because loading browse category list failed");
                      logErrorMessage(error);
                      setHasError(true);
                      setErrorTitle(null);
                      setErrorMessage('Unknown error loading browse category list. Please try again or contact the library.');
                 }
            })();

            return () => {
                 cancelled = true;
            };
       }, [hasError, browseCategoryQuerySuccess, language, updateBrowseCategoryList, numSteps]);

      React.useEffect(() => {
           if (!hasHydratedUserCacheDecision || !shouldBlockUserFetch || !hasResolvedLibraryContext || hasError || isInitialUserDataReady) return;
          let cancelled = false;

          const runBlockingUserFetch = async () => {
               if (isBlockingUserFetchInFlightRef.current) {
                    logDebugMessage('runBlockingUserFetch: skipped duplicate invocation while fetch already in flight');
                    return;
               }
               isBlockingUserFetchInFlightRef.current = true;
               logDebugMessage('runBlockingUserFetch: starting blocking user-data fetch');
               setLoadingText('Loading User Information');
               try {
                    const ok = await fetchAndPersistUserData({ runInBackground: false });
                    if (!cancelled && ok) {
                         setIsReloading(false);
                    }
               } finally {
                    isBlockingUserFetchInFlightRef.current = false;
                    logDebugMessage('runBlockingUserFetch: completed blocking user-data fetch');
               }
          };

          runBlockingUserFetch();
          return () => {
               cancelled = true;
          };
      }, [hasHydratedUserCacheDecision, shouldBlockUserFetch, hasResolvedLibraryContext, hasError, isInitialUserDataReady, fetchAndPersistUserData]);

     React.useEffect(() => {
          if (!hasHydratedLibraryBranchCacheDecision || !shouldBlockLibraryBranchFetch || !hasResolvedLibraryContext || hasError || isInitialLibraryBranchDataReady) return;
          let cancelled = false;

          const runBlockingLibraryBranchFetch = async () => {
               if (isBlockingLibraryBranchFetchInFlightRef.current) {
                    logDebugMessage('runBlockingLibraryBranchFetch: skipped duplicate invocation while fetch already in flight');
                    return;
               }
               isBlockingLibraryBranchFetchInFlightRef.current = true;
               logDebugMessage('runBlockingLibraryBranchFetch: starting blocking library-branch-data fetch');
               setLoadingText('Loading Branch Information');
               try {
                    const ok = await fetchAndPersistLibraryBranchData({ runInBackground: false });
                    if (!cancelled && ok) {
                         setIsReloading(false);
                    }
               } finally {
                    isBlockingLibraryBranchFetchInFlightRef.current = false;
                    logDebugMessage('runBlockingLibraryBranchFetch: completed blocking library-branch-data fetch');
               }
          };

           runBlockingLibraryBranchFetch();
           return () => {
                cancelled = true;
           };
      }, [hasHydratedLibraryBranchCacheDecision, shouldBlockLibraryBranchFetch, hasResolvedLibraryContext, hasError, isInitialLibraryBranchDataReady, fetchAndPersistLibraryBranchData]);

      React.useEffect(() => {
           if (!hasHydratedLibrarySystemCacheDecision || !shouldBlockLibrarySystemFetch || !hasResolvedLibraryContext || hasError || isInitialLibrarySystemDataReady) return;
           let cancelled = false;

           const runBlockingLibrarySystemFetch = async () => {
                if (isBlockingLibrarySystemFetchInFlightRef.current) {
                     logDebugMessage('runBlockingLibrarySystemFetch: skipped duplicate invocation while fetch already in flight');
                     return;
                }
                isBlockingLibrarySystemFetchInFlightRef.current = true;
                logDebugMessage('runBlockingLibrarySystemFetch: starting blocking library-system-data fetch');
                setLoadingText('Loading Library Information');
                try {
                     const ok = await fetchAndPersistLibrarySystemData({ runInBackground: false });
                     if (!cancelled && ok) {
                          setIsReloading(false);
                     }
                } finally {
                     isBlockingLibrarySystemFetchInFlightRef.current = false;
                     logDebugMessage('runBlockingLibrarySystemFetch: completed blocking library-system-data fetch');
                }
           };

           runBlockingLibrarySystemFetch();
           return () => {
                cancelled = true;
           };
      }, [hasHydratedLibrarySystemCacheDecision, shouldBlockLibrarySystemFetch, hasResolvedLibraryContext, hasError, isInitialLibrarySystemDataReady, fetchAndPersistLibrarySystemData]);

        useQuery(['system_messages', LIBRARY.url], () => getSystemMessages(libraryData?.libraryId, location?.locationId, LIBRARY.url), {
              enabled: hasError === false && (isInitialUserDataReady || hasUsableUserCache) && (isInitialLibrarySystemDataReady || hasUsableLibrarySystemCache) && !!location?.locationId,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded System Messages");
                    const messages = _.castArray(data.data.result?.systemMessages ?? {});
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    updateSystemMessages(messages);
                    setIsReloading(false);
                    if (loadingMessageType === 1) {
                         setLoadingText('Loading App Preferences');
                    }
               } else {
                    logDebugMessage("Error loading system messages");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load system messages");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading system messages failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading system messages. Please try again or contact the library.')
          }
     });

       React.useEffect(() => {
            if (
                 !isReloading &&
                 isSQLiteDataLoaded &&
                 (isInitialUserDataReady || hasUsableUserCache) &&
                 (isInitialLibrarySystemDataReady || hasUsableLibrarySystemCache) &&
                 (isInitialLibraryBranchDataReady || hasUsableLibraryBranchCache) &&
                 (isInitialLanguageDataReady || hasUsableLanguageCache) &&
                 !hasError &&
                 catalogStatus === 0
            ) {
               logDebugMessage("Checking incoming url");
               if (hasIncomingUrlChanged) {
                    let url = decodeURIComponent(incomingUrl).replace(/\+/g, ' ');
                    url = url.replace('aspen-lida://', prefix);
                    logDebugMessage('incomingUrl > ' + url);
                    setIncomingUrlChanged(false);
                    try {
                         logDebugMessage('Trying to open screen based on incomingUrl...');
                         Linking.openURL(url);
                    } catch (e) {
                         logErrorMessage('Error opening incoming url');
                         logErrorMessage(e);
                    }
               } else if (linkingUrl) {
                    if (linkingUrl !== prefix && linkingUrl !== incomingUrl) {
                         setIncomingUrl(linkingUrl);
                         logDebugMessage('Updated incoming url');
                         const { hostname, path, queryParams, scheme } = Linking.parse(linkingUrl);
                         logDebugMessage('linkingUrl > ' + linkingUrl);
                         logDebugMessage(
                              `Linked to app with hostname: ${hostname}, path: ${path}, scheme: ${scheme} and data: ${JSON.stringify(
                                   queryParams
                              )}`
                         );
                         try {
                              if (scheme !== 'exp') {
                                   logDebugMessage('Trying to open screen based on linkingUrl...');
                                   const url = linkingUrl.replace('aspen-lida://', prefix);
                                   logDebugMessage('url > ' + url);
                                   linkTo('/' + url);
                              } else {
                                   if (path) {
                                        logDebugMessage('Trying to open screen based on linkingUrl to Expo app...');
                                        let url = '/' + path;
                                        if (!isEmpty(queryParams)) {
                                             const params = new URLSearchParams(queryParams);
                                             const str = params.toString();
                                             url = url + '?' + str + '&url=' + library.baseUrl;
                                        }
                                        logDebugMessage('url > ' + url);
                                        logDebugMessage('linkingUrl > ' + linkingUrl);
                                        linkTo('/' + url);
                                   }
                              }
                         } catch (e) {
                              logErrorMessage('Error resolving deep link');
                              logErrorMessage(e);
                         }
                    }
               }

               setProgress(100);
               navigation.navigate('DrawerStack', {
                    user: user,
                    library: library,
                    location: location,
                    prevRoute: 'LoadingScreen',
               });
           }
       }, [
            isReloading,
            isSQLiteDataLoaded,
            isInitialUserDataReady,
            hasUsableUserCache,
            isInitialLibraryBranchDataReady,
            hasUsableLibraryBranchCache,
            isInitialLanguageDataReady,
            hasUsableLanguageCache,
            hasError,
            catalogStatus,
            hasIncomingUrlChanged,
            incomingUrl,
            linkingUrl,
            user,
            library,
            location,
            navigation,
            linkTo,
       ]);

     if (hasError) {
          return <ForceLogout title={errorTitle} reason={errorMessage} />;
     }

     if (catalogStatus > 0) {
          // catalog is offline
          return <CatalogOffline />;
     }

     return (
          <Center flex={1} px="$3" width="$full">
               <Box w="90%" maxW={400} pt={insets.top} pb={insets.bottom} pl={insets.left} pr={insets.right}>
                    <VStack>
                         <Heading pb="$5" size="md" color={textColor}>
                              {loadingText}
                         </Heading>
                         <Progress value={progress} width="$full" h="$3" size="lg" testID="progress-bar">
                              <Progress.FilledTrack />
                         </Progress>
                    </VStack>
               </Box>
          </Center>
     );
};
