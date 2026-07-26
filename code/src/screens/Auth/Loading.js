import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLinkTo, useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import _, {isEmpty, isUndefined} from 'lodash';
import {Box, Center, Heading, Progress, VStack} from '@gluestack-ui/themed';
import React from 'react';
import {
     BrowseCategoryContext,
     LanguageContext,
     LibraryBranchContext,
     LibrarySystemContext,
     SystemMessagesContext,
     ThemeContext,
} from '../../context/initialContext';
import {createGlueTheme} from '../../themes/theme';
import {
     getLanguageDisplayName,
     getTermFromDictionary,
     getTranslatedTermsForUserPreferredLanguage,
     translationsLibrary
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
     saveUserProfile,
     saveAccounts,
     saveCards,
     saveAppPreferences,
     saveNotificationHistory,
     saveInbox,
} from '../../util/db';

import {getErrorMessage, logDebugMessage, logErrorMessage, logWarnMessage} from '../../util/logging.js';
import {stripHTML} from '../../helpers/helpers';

const prefix = Linking.createURL('/');
const USER_DATA_STALE_MS = 12 * 60 * 60 * 1000;

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
     const navigation = useNavigation();
     const queryClient = useQueryClient();
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
     const isBlockingUserFetchInFlightRef = React.useRef(false);
     const userDataFetchInvocationRef = React.useRef(0);
     const fetchAndPersistUserDataRef = React.useRef(null);

     const { library, updateLibrary, updateMenu, updateCatalogStatus, catalogStatus, updateHomeScreenLinks } = React.useContext(LibrarySystemContext);
     const { location, updateLocation, updateEnableSelfCheck, updateSelfCheckSettings } = React.useContext(LibraryBranchContext);
     const { updateBrowseCategories, updateBrowseCategoryList, updateMaxCategories } = React.useContext(BrowseCategoryContext);
     const { language, updateLanguage, updateLanguages, updateDictionary, updateLanguageDisplayName, languages } = React.useContext(LanguageContext);
     const { updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { updateTheme, updateColorMode, textColor } = React.useContext(ThemeContext);

     const [loadingText, setLoadingText] = React.useState('');
     const [loadingTheme, setLoadingTheme] = React.useState(true);
     const [loadedUser, setLoadedUser] = React.useState({});
     const user = loadedUser;
     const hasResolvedLibraryContext = !!library?.libraryId || !!LIBRARY.id;

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
               updateLanguage(profile.interfaceLanguage ?? 'en');
               updateLanguageDisplayName(getLanguageDisplayName(profile.interfaceLanguage ?? 'en', languages));

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
     const { isSuccess: catalogStatusSuccess} = useQuery(['catalog_status', LIBRARY.url], () => getCatalogStatus(LIBRARY.url), {
          enabled: !!LIBRARY.url && !loadingTheme,
          onSuccess: async (data) => {
               if(data.ok) {
                    let catalogMessage = null;
                    if (data.data.result?.api?.message) {
                         catalogMessage = stripHTML(data.data.result.api.message);
                    }
                    let status = data.data.result?.catalogStatus ?? 0;
                    const currentStatus = {
                         status: status,
                         message: catalogMessage
                    }
                    updateCatalogStatus(currentStatus);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading catalog...');
                    }else if (LIBRARY.appSettings.loadingMessageType === 2) {
                         setLoadingText(LIBRARY.appSettings.loadingMessage);
                    }
                    logDebugMessage("Loaded catalog status");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
               } else {
                    logWarnMessage("Setting Error to true because catalog status returned not ok");
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to determine catalog status");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading catalog status failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error checking catalog status. Please try again or contact the library.')
          },
     });

     /**
      * Preload parameterized translations for use on holds and checkouts pages. This does not halt loading LiDA.
      */
     useQuery(['active_language', language, LIBRARY.url], () => getTranslatedTermsForUserPreferredLanguage(language ?? 'en', LIBRARY.url), {
          enabled: !!LIBRARY.url && catalogStatusSuccess,
          onSuccess: async () => {
               logDebugMessage("Loaded Translations");
               setProgress(prevProgress => prevProgress + (100 / numSteps));
               updateDictionary(translationsLibrary);
               if (isUndefined(LIBRARY.appSettings.loadingMessageType) || LIBRARY.appSettings.loadingMessageType === 0) {
                    setLoadingText(getTermFromDictionary(language ?? 'en', 'loading_1'));
               } else if (LIBRARY.appSettings.loadingMessageType === 1) {
                    setLoadingText('Loading Languages');
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading active language failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading patron preferred language. Please try again or contact the library.')
          }
     });

     const { isSuccess: languagesQuerySuccess} = useQuery(['languages', LIBRARY.url], () => getLibraryLanguages(LIBRARY.url), {
          enabled: hasError === false && catalogStatusSuccess,
          onSuccess: async (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded library languages");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    let languages = [];
                    if (data?.data?.result) {
                         logDebugMessage('Library languages saved at Loading');
                         languages = _.sortBy(data.data.result.languages, 'weight', 'displayName');
                    }
                    updateLanguages(languages);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Library Information');
                    }
               } else {
                    logDebugMessage("Error loading library languages");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load library languages");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading languages failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading languages. Please try again or contact the library.')
          }
     });

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

     const { isSuccess: librarySystemQuerySuccess} = useQuery(['library_system', LIBRARY.url], () => getLibraryInfo(LIBRARY.url, LIBRARY.id), {
          enabled: hasError === false && languagesQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    const library = data.data.result?.library ?? [];
                    logDebugMessage("Loaded Library Info");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    updateLibrary(library);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading User Information');
                    }
               } else {
                    logDebugMessage("Error loading library system settings");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load library configuration");
               }
          },
          onError: () => {
               logWarnMessage("Setting Error to true because loading library system failed");
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading library configuration. Please try again or contact the library.')
          }
     });

     const { isSuccess: libraryLinksQuerySuccess} = useQuery(['library_links', LIBRARY.url], () => getLibraryLinks(LIBRARY.url), {
          enabled: hasError === false && (isInitialUserDataReady || hasUsableUserCache),
          onSuccess: (data) => {
               if(data.ok) {
                    const links = data.data.result?.items ?? [];
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    logDebugMessage("Loaded Library Links");
                    updateMenu(links);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Home Screen Feed');
                    }
               } else {
                    logDebugMessage("Error loading library links");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load menu links")
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading library links failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading library links. Please try again or contact the library.');
          }
     });

     const { isSuccess: browseCategoryQuerySuccess} = useQuery(['browse_categories', LIBRARY.url, 'en', false], () => getHomeScreenFeed(5, LIBRARY.url), {
          enabled: hasError === false && libraryLinksQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded Home Screen Feed");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    const result = data.data.result;
                    updateBrowseCategories(result.browseCategories);
                    updateMaxCategories(5);
                    updateHomeScreenLinks(result.homeScreenLinks);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Browse Category List');
                    }
               } else {
                    logDebugMessage("Error loading browse categories and home screen links");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load browse categories and home screen links");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading browse categories and home screen links failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading home screen feed. Please try again or contact the library.');
          }
     });

     const { isSuccess: browseCategoryListQuerySuccess} = useQuery(['browse_categories_list', LIBRARY.url, 'en'], () => getBrowseCategoryListForUser(LIBRARY.url), {
          enabled: hasError === false && browseCategoryQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    const categories = _.sortBy(data.data.result, ['title']);
                    logDebugMessage("Loaded Browse Category List");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    if (isUndefined(LIBRARY.appSettings.loadingMessageType) || LIBRARY.appSettings.loadingMessageType === 0) {
                         setLoadingText(getTermFromDictionary(language ?? 'en', 'loading_2'));
                    }else if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Branch Information');
                    }
                    updateBrowseCategoryList(categories);
               } else {
                    logDebugMessage("Error loading browse category list");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load browse category list");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading browse category list failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading browse category list. Please try again or contact the library.');
          }
     });

     const { isSuccess: libraryBranchQuerySuccess} = useQuery(['library_location', LIBRARY.url, 'en'], () => getLocationInfo(LIBRARY.url), {
          enabled: hasError === false && browseCategoryListQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    const location = data.data.result?.location ?? [];
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    updateLocation(location);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Library Locations');
                    }
               } else {
                    logDebugMessage("Error loading library location");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load library branches");
               }
          },
          onError: (error) => {
               logWarnMessage("Setting Error to true because library location failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading library branches. Please try again or contact the library.')
          }
     });

     const { isSuccess: selfCheckQuerySuccess} = useQuery(['self_check_settings', LIBRARY.url, 'en'], () => getSelfCheckSettings(LIBRARY.url), {
          enabled: hasError === false && libraryBranchQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    const settings = data.data.result ?? [];
                    logDebugMessage("Loading Self Check Settings");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Self Check Information');
                    }
                    if (settings.success) {
                         updateEnableSelfCheck(settings.settings.isEnabled ?? false);
                         updateSelfCheckSettings(settings.settings);
                    } else {
                         updateEnableSelfCheck(false);
                    }
               } else {
                    logDebugMessage("Error loading self check settings");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load self check settings");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading self check settings failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading self check settings. Please try again or contact the library.')
          }

     });

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

     useQuery(['system_messages', LIBRARY.url], () => getSystemMessages(library.libraryId, location.locationId, LIBRARY.url), {
          enabled: hasError === false && selfCheckQuerySuccess && (isInitialUserDataReady || hasUsableUserCache),
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded System Messages");
                    const messages = _.castArray(data.data.result?.systemMessages ?? {});
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    updateSystemMessages(messages);
                    setIsReloading(false);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
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
               (isInitialUserDataReady || hasUsableUserCache) &&
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
          isInitialUserDataReady,
          hasUsableUserCache,
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
