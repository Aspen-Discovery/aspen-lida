import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLinkTo, useNavigation} from '@react-navigation/native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import _, {isEmpty, isUndefined} from 'lodash';
import {Box, Center, Heading, Progress, useToast, VStack} from '@gluestack-ui/themed';
import React from 'react';
import {
     BrowseCategoryContext,
     LanguageContext,
     LibraryBranchContext,
     LibrarySystemContext,
     SystemMessagesContext,
     ThemeContext,
     UserContext
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

import {LIBRARY, PATRON} from '../../util/globals';
import {CatalogOffline} from './CatalogOffline';
import {ForceLogout} from './ForceLogout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {getErrorMessage, logDebugMessage, logErrorMessage, logInfoMessage, logWarnMessage} from '../../util/logging.js';
import {stripHTML} from '../../helpers/helpers';

const prefix = Linking.createURL('/');

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

     const { user, updateUser,  updateLinkedAccounts, cards, updateLibraryCards, updateAppPreferences, updateNotificationHistory, updateInbox } = React.useContext(UserContext);
     const { library, updateLibrary, updateMenu, updateCatalogStatus, catalogStatus, updateHomeScreenLinks } = React.useContext(LibrarySystemContext);
     const { location, updateLocation, updateEnableSelfCheck, updateSelfCheckSettings } = React.useContext(LibraryBranchContext);
     const { updateBrowseCategories, updateBrowseCategoryList, updateMaxCategories } = React.useContext(BrowseCategoryContext);
     const { language, updateLanguage, updateLanguages, updateDictionary, updateLanguageDisplayName, languages } = React.useContext(LanguageContext);
     const { updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { updateTheme, updateColorMode, textColor } = React.useContext(ThemeContext);

     const [loadingText, setLoadingText] = React.useState('');
     const [loadingTheme, setLoadingTheme] = React.useState(true);

     const toast = useToast();

     const insets = useSafeAreaInsets();

     const numSteps = 14;

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
          onSuccess: (data) => {
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
     useQuery(['active_language', PATRON.language, LIBRARY.url], () => getTranslatedTermsForUserPreferredLanguage(PATRON.language ?? 'en', LIBRARY.url), {
          enabled: !!LIBRARY.url && catalogStatusSuccess,
          onSuccess: (data) => {
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
          onSuccess: (data) => {
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

     const { isSuccess: userQuerySuccess} = useQuery(['user', LIBRARY.url, 'en'], () => refreshProfile(LIBRARY.url), {
          enabled: hasError === false && librarySystemQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    const profile = data.data.result.profile ?? [];
                    logInfoMessage('User Profile refreshed');
                    if (isUndefined(profile) || isEmpty(profile)) {
                         logWarnMessage("Setting Error to true because profile data was undefined or empty");
                         setHasError(true);
                    } else {
                         if (data.data.result.success === false || data.data.result.success === 'false') {
                              logWarnMessage("Setting Error to true because profile response returned a success of false");
                              setHasError(true);
                         } else {
                              logDebugMessage("Loaded User Profile");
                              setProgress(prevProgress => prevProgress + (100 / numSteps));
                              updateUser(profile);
                              updateLanguage(profile.interfaceLanguage ?? 'en');
                              updateLanguageDisplayName(getLanguageDisplayName(profile.interfaceLanguage ?? 'en', languages));
                              PATRON.language = profile.interfaceLanguage ?? 'en';
                         }
                    }
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Menu');
                    }
               } else {
                    logDebugMessage("Error reloading user profile");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage("Unable to load patron profile. " + error.message);
               }
          },
          onError: (error) => {
               logDebugMessage("Error reloading user profile");
               logErrorMessage(error);
               setHasError(true);
               setErrorMessage('Error loading user profile. Please try again or contact the library.')
          }
     });

     const { isSuccess: libraryLinksQuerySuccess} = useQuery(['library_links', LIBRARY.url], () => getLibraryLinks(LIBRARY.url), {
          enabled: hasError === false && userQuerySuccess,
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

     const { isSuccess: linkedAccountQuerySuccess} = useQuery(['linked_accounts', user ?? [], cards ?? [], LIBRARY.url, 'en'], () => getLinkedAccounts(LIBRARY.url, 'en'), {
          enabled: hasError === false && selfCheckQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded Linked Accounts");
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    const linkedAccounts = formatLinkedAccounts(user, cards ?? [], library?.barcodeStyle ?? 'UNKNOWN', data.data.result.linkedAccounts);
                    updateLinkedAccounts(linkedAccounts.accounts);
                    updateLibraryCards(linkedAccounts.cards);
                    setIsReloading(false);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Linked Accounts');
                    }
               } else {
                    logDebugMessage("Error loading linked accounts");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load linked accounts");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading linked accounts failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Unknown error loading linked accounts. Please try again or contact the library.')
          }
     });

     const { isSuccess: systemMessagesQuerySuccess} = useQuery(['system_messages', LIBRARY.url], () => getSystemMessages(library.libraryId, location.locationId, LIBRARY.url), {
          enabled: hasError === false && linkedAccountQuerySuccess,
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

     const { isSuccess: appPreferencesQuerySuccess } = useQuery(['app_preferences', LIBRARY.url], () => getAppPreferencesForUser(LIBRARY.url, 'en'), {
          enabled: hasError === false && systemMessagesQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded App Preferences");
                    const preferences = data.data.result ?? {
                         onboardAppNotifications: 0,
                         shouldAskBrightness: 0,
                         notification_preferences: [
                              {
                                   device: 'Unknown',
                                   token: false,
                                   notifySavedSearch: 0,
                                   notifyCustom: 0,
                                   notifyAccount: 0,
                                   onboardStatus: 0,
                              },
                         ],
                    }
                    updateAppPreferences(preferences);
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    setIsReloading(false);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Loading Notification History');
                    }
               } else {
                    logDebugMessage("Error loading app preferences");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load patron app preferences");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading app preferences failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading patron app preferences. Please try again or contact the library.')
          }
     });

     const { status: notificationHistoryQueryStatus } = useQuery(['notification_history'], () => fetchNotificationHistory(1, 20, true, LIBRARY.url, 'en'), {
          enabled: hasError === false && appPreferencesQuerySuccess,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Loaded Notification History");
                    const notificationHistory = formatNotificationHistory(data.data.result)
                    setProgress(prevProgress => prevProgress + (100 / numSteps));
                    updateNotificationHistory(notificationHistory);
                    updateInbox(notificationHistory?.inbox ?? []);
                    setIsReloading(false);
                    if (LIBRARY.appSettings.loadingMessageType === 1) {
                         setLoadingText('Finished, loading LiDA');
                    }
               } else {
                    logDebugMessage("Error loading notification history");
                    logDebugMessage(data);
                    const error = getErrorMessage(data.code ?? 0, data.problem);
                    setHasError(true);
                    setErrorMessage(error.message);
                    setErrorTitle("Unable to load notification history");
               }
          },
          onError: (error) => {
               logDebugMessage("Setting Error to true because loading notification history failed");
               logErrorMessage(error);
               setHasError(true);
               setErrorTitle(null);
               setErrorMessage('Error loading notification history. Please try again or contact the library.')
          }
     });

     React.useEffect(() => {
          if (
               !isReloading &&
               notificationHistoryQueryStatus === 'success' &&
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

               navigation.navigate('DrawerStack', {
                    user: user,
                    library: library,
                    location: location,
                    prevRoute: 'LoadingScreen',
               });
          }
     }, [
          isReloading,
          notificationHistoryQueryStatus,
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
