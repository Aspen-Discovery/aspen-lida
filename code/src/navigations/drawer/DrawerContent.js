import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useFocusEffect, useLinkTo } from '@react-navigation/native';
import { useQuery, onlineManager, focusManager } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import _ from 'lodash';
import {
     Badge,
     BadgeText,
     Box,
     Button,
     ButtonText,
     ButtonIcon,
     Divider,
     HStack,
     Icon,
     Image,
     Pressable,
     Text,
     Spinner,
     useToken,
     VStack,
     useToast
} from '@gluestack-ui/themed';
import { useColorModeValue } from '../../themes/theme';
import React from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AppState, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { showILSMessage } from '../../components/Notifications';
import { ThemeContext, BrowseCategoryContext, CheckoutsContext, HoldsContext, LanguageContext, LibraryBranchContext, LibrarySystemContext, UserContext } from '../../context/initialContext';
import { navigateStack } from '../../helpers/RootNavigator';
import { CatalogOffline } from '../../screens/Auth/CatalogOffline';
import { InvalidCredentials } from '../../screens/Auth/InvalidCredentials';
import { UseColorMode } from '../../themes/theme';
import { getTermFromDictionary, LanguageSwitcher } from '../../translations/TranslationService';
import { formatLists } from '../../util/api/listHelper';
import { getLocations, getCatalogStatus } from '../../util/api/system';
import { getILSMessages, refreshProfile, reloadProfile, validateSession, passUserToDiscovery, getPickupSublocations, getPatronHolds, getPatronCheckedOutItems, getPickupLocations, fetchNotificationHistory, getLinkedAccounts } from '../../util/api/user';
import { sortCheckouts, sortHolds, formatNotificationHistory, formatLinkedAccounts, formatHolds, formatPickupLocations } from '../../util/api/userHelper';
import { getListGroups, getLists, fetchSavedSearches } from '../../util/api/list';
import { getBrowseCategoryListForUser, getHomeScreenFeed } from '../../util/api/search';

import { GLOBALS, PATRON } from '../../util/globals';
import { stripHTML } from '../../helpers/helpers';

import { logDebugMessage, logWarnMessage, logErrorMessage, getErrorMessage } from '../../util/logging.js';

Notifications.setNotificationHandler({
     handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
     }),
});

onlineManager.setEventListener(setOnline => {
     return NetInfo.addEventListener(state => {
          setOnline(!!state.isConnected)
     })
})

function onAppStateChange(AppStateStatus) {
     if (Platform.OS !== 'web') {
          focusManager.setFocused(AppStateStatus === 'active')
     }
}

const prefix = Linking.createURL('/');

export const DrawerContent = (props) => {
     const [userLatitude, setUserLatitude] = React.useState(0);
     const [userLongitude, setUserLongitude] = React.useState(0);
     const linkTo = useLinkTo();
     const insets = useSafeAreaInsets();
     const { user, accounts, cards, updateUser, updateLanguage, updatePickupLocations, updateLinkedAccounts, updatePreferredPickupLocationIsValid, updatePreferredPickupLocationWarning, updateLists, updateLibraryCards, notificationHistory, updateNotificationHistory, userHoldPendingSortMethod, userHoldReadySortMethod, userCheckoutSortMethod, updateListGroups, updateSavedSearches } = React.useContext(UserContext);
     const { library, catalogStatus, updateCatalogStatus, updateHomeScreenLinks } = React.useContext(LibrarySystemContext);
     const [ setNotifications] = React.useState([]);
     const [messages, setILSMessages] = React.useState([]);
     const { category, list, maxNum, updateBrowseCategories, updateBrowseCategoryList } = React.useContext(BrowseCategoryContext);
     const { updateCheckouts } = React.useContext(CheckoutsContext);
     const { updateHolds } = React.useContext(HoldsContext);
     const { language } = React.useContext(LanguageContext);
     const [invalidSession, setInvalidSession] = React.useState(false);
     const { updateLocations } = React.useContext(LibraryBranchContext)


     React.useEffect(() => {
          const subscription = Notifications.addNotificationReceivedListener((notification) => {
               handleNewNotification(notification);
          });
          return () => subscription.remove();
     }, []);

     React.useEffect(() => {
          const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
               handleNewNotificationResponse(response);
          });
          const stateChangeSubscription = AppState.addEventListener('change', onAppStateChange)
          return () => {
               subscription.remove();
               stateChangeSubscription.remove();
          };
     }, []);

     useQuery(['catalog_status', library.baseUrl], () => getCatalogStatus(library.baseUrl), {
          enabled: !!library.baseUrl,
          refetchInterval: 60 * 1000 * 5,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: 'always',
          onSuccess: (data) => {
               if(data.ok) {
                    let catalogMessage = null;
                    if (data.data.result?.api?.message) {
                         catalogMessage = stripHTML(data.data.result.api.message);
                    }

                    let status = data.data.result?.catalogStatus ?? 0;
                    updateCatalogStatus({status: status, message: catalogMessage});
               } else {
                    logDebugMessage("Error fetching catalog status");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching catalog status");
               logErrorMessage(error);
          }
     });

     // Destructured isLoading from user query to pass down to child items for visual loaders
     const { isSuccess: isUserLoadedSuccessfully } = useQuery(['user', library.baseUrl, language], () => refreshProfile(library.baseUrl), {
          initialData: user,
          refetchInterval: 60 * 1000 * 5,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: 'always',
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Refreshed user in Drawer Content");
                    const validProfile = data.data.result.success ?? true;
                    if (validProfile) {
                         setInvalidSession(false);
                         if (user) {
                              if (data.data.result.profile !== user) {
                                   updateUser(data.data.result.profile);
                                   updateLanguage(data.data.result.profile.interfaceLanguage ?? 'en');
                                   PATRON.language = data.data.result.profile.interfaceLanguage ?? 'en';
                              }
                         } else {
                              updateUser(data.data.result.profile);
                              updateLanguage(data.data.result.profile.interfaceLanguage ?? 'en');
                              PATRON.language = data.data.result.profile.interfaceLanguage ?? 'en';
                         }
                    } else {
                         let errorFetching = data.errorFetching ?? false;
                         if (errorFetching === false) {
                              logWarnMessage("Session was invalid after reloading profile");
                              logWarnMessage(data);
                              setInvalidSession(true);
                         }
                         logErrorMessage(data);
                    }
               } else {
                    logDebugMessage("Error reloading user profile");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error reloading user profile");
               logErrorMessage(error);
          }
     });

     useQuery(['browse_categories', library.baseUrl, language, maxNum], () => getHomeScreenFeed(maxNum, library.baseUrl), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          initialData: category,
          onSuccess: (data) => {
               if(data.ok) {
                    const result = data.data.result;
                    updateBrowseCategories(result.browseCategories);
                    updateHomeScreenLinks(result.homeScreenLinks);
               } else {
                    logDebugMessage("Error fetching browse categories and home screen links");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching browse categories");
               logErrorMessage(error);
          }
     });

     useQuery(['holds', user.id, library.baseUrl, language], () => getPatronHolds(userHoldReadySortMethod, userHoldPendingSortMethod, 'all', library.baseUrl, false, language), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: 'always',
          placeholderData: [],
          onSuccess: (data) => {
               if(data.ok) {
                    let holds = formatHolds(data.data.result.holds ?? []);
                    holds = sortHolds(holds, userHoldPendingSortMethod, userHoldReadySortMethod);
                    updateHolds(holds);
               } else {
                    logDebugMessage("Error fetching user holds");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching user holds");
               logErrorMessage(error);
          }
     });

     useQuery(['checkouts', user.id, library.baseUrl, language], () => getPatronCheckedOutItems('all', library.baseUrl, false, language), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: 'always',
          onSuccess: (data) => {
               if(data.ok) {
                    let checkouts = data.data.result.checkedOutItems ?? [];
                    checkouts = sortCheckouts(checkouts, userCheckoutSortMethod);
                    updateCheckouts(checkouts);
               } else {
                    logDebugMessage("Error fetching user checkouts");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching user checkouts");
               logErrorMessage(error);
          }
     });

     useQuery(['lists', user.id, library.baseUrl, language], () => getLists(library.baseUrl, 1, 20, 1), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          notifyOnChangeProps: ['data'],
          refetchOnWindowFocus: 'always',
          placeholderData: [],
          onSuccess: (data) => {
               if(data.ok) {
                    const results = data.data.result;
                    updateLists(results)
               } else {
                    logDebugMessage("Error fetching user lists");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching user lists");
               logErrorMessage(error);
          }
     });

     useQuery(['all_lists', user.id, library.baseUrl, language], () => getLists(library.baseUrl, 1, 20, 0), {
          refetchInterval: 60 * 1000 * 60,
          refetchIntervalInBackground: true,
          notifyOnChangeProps: ['data'],
          refetchOnWindowFocus: 'always',
          placeholderData: [],
          onSuccess: (data) => {
               if (data.ok) {
                    formatLists(data.data.result); // this is just for PATRON.lists which is used for populating Selects of user lists (Adding to List)
               } else {
                    logDebugMessage('Error fetching all user lists');
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage('Error fetching all user lists');
               logErrorMessage(error);
          },
     });

     useQuery(['list_groups', user.id, library.baseUrl, language], () => getListGroups(library.baseUrl), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          notifyOnChangeProps: ['data'],
          refetchOnWindowFocus: 'always',
          placeholderData: [],
          onSuccess: (data) => {
               if(data.ok) {
                    const groups = {
                         groups: data.data?.result?.groups ?? [],
                         unassigned: data.data?.result?.unassigned ?? 0
                    };
                    updateListGroups(groups);
               } else {
                    logDebugMessage("Error fetching user list groups");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching user list groups");
               logErrorMessage(error);
          }
     });

     useQuery(['linked_accounts', user.id, library.baseUrl, language], () => getLinkedAccounts(library.baseUrl, language), {
          initialData: accounts,
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          notifyOnChangeProps: ['data'],
          refetchOnWindowFocus: 'always',
          onSuccess: (data) => {
               if(data.ok) {
                    const linkedAccounts = formatLinkedAccounts(user, cards ?? [], library.barcodeStyle, data.data.result.linkedAccounts);
                    if (accounts !== linkedAccounts.accounts) {
                         updateLinkedAccounts(linkedAccounts.accounts);
                    }
                    if (cards !== linkedAccounts.cards) {
                         updateLibraryCards(linkedAccounts.cards);
                    }
               } else {
                    logDebugMessage("Error fetching linked accounts (response was not ok)");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logErrorMessage("Error fetching linked accounts");
               logErrorMessage(error);
          }
     });

     useQuery(['notification_history', user.id, library.baseUrl, language], () => fetchNotificationHistory(1, 20, false, library.baseUrl, language), {
          initialData: notificationHistory,
          refetchInterval: 60 * 1000 * 5,
          refetchIntervalInBackground: true,
          onSuccess: (data) => {
               if(data.ok) {
                    const notificationHistory = formatNotificationHistory(data.data.result)
                    updateNotificationHistory(notificationHistory);
               } else {
                    logDebugMessage("Error fetching notification history");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching notification history");
               logErrorMessage(error);
          }
     });

     useQuery(['pickup_locations', library.baseUrl, language], () => getPickupLocations(library.baseUrl), {
          refetchInterval: 60 * 1000 * 30,
          refetchIntervalInBackground: true,
          placeholderData: [],
          onSuccess: (data) => {
               logDebugMessage("Finished pickup_locations query, setting data");
               if(data.ok) {
                    const pickupLocations = formatPickupLocations(data.data.result);
                    updatePickupLocations(pickupLocations.pickupLocations);
                    updatePreferredPickupLocationIsValid(pickupLocations.preferredPickupLocationIsValid);
                    updatePreferredPickupLocationWarning(pickupLocations.preferredPickupLocationWarning);
                    logDebugMessage("Finished pickup_locations query, done setting data");
               } else {
                    logDebugMessage("Error with pickup_locations query");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching pickup locations");
               logErrorMessage(error);
          }
     });

     useQuery(['pickup_sub_locations', library.baseUrl, language], () => getPickupSublocations(library.baseUrl), {
          refetchInterval: 60 * 1000 * 30,
          refetchIntervalInBackground: true,
          placeholderData: [],
          onSuccess: (data) => {
               logDebugMessage('Finished pickup_sub_locations query, setting data');
               if (data) {
                    logDebugMessage('Finished pickup_sub_locations query, done setting data');
               } else {
                    logDebugMessage('Error with pickup_sub_locations query');
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage('Error fetching pickup sublocations');
               logErrorMessage(error);
          },
     });

     useQuery(['locations', library.baseUrl, language, userLatitude, userLongitude], () => getLocations(library.baseUrl, language, userLatitude, userLongitude), {
          refetchInterval: 60 * 1000 * 30,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: 'always',
          placeholderData: [],
          onSuccess: (data) => {
               if(data.ok){
                    logDebugMessage("Updating locations");
                    updateLocations(data.data.result.locations);
               } else {
                    logDebugMessage("Error fetching locations");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching locations");
               logErrorMessage(error);
          },
          enabled: !!userLatitude && !!userLongitude && userLatitude !== '0' && userLongitude !== '0',

     });

     useQuery(['saved_searches', user?.id ?? 'unknown', library.baseUrl, language], () => fetchSavedSearches(library.baseUrl, language), {
          refetchInterval: 60 * 1000 * 5,
          refetchIntervalInBackground: true,
          placeholderData: [],
          onSuccess: (data) => {
               if(data.ok) {
                    updateSavedSearches(data.data.result?.searches ?? []);
               } else {
                    logDebugMessage("Error fetching saved searches for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching saved searches for user");
               logErrorMessage(error);
          }
     });

     useQuery(['browse_categories_list', library.baseUrl, language], () => getBrowseCategoryListForUser(library.baseUrl), {
          refetchInterval: 60 * 1000 * 15,
          refetchIntervalInBackground: true,
          placeholderData: list,
          onSuccess: (data) => {
               logDebugMessage("Fetched Browse Categories List");
               if(data.ok){
                    const categories = _.sortBy(data.data.result, ['title']);
                    updateBrowseCategoryList(categories);
               } else {
                    logDebugMessage("Error fetching browse category list for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching browse category list for user");
               logErrorMessage(error);
          }
     });

     useQuery(['session', library.baseUrl, user.id], () => validateSession(library.baseUrl), {
          initialData: GLOBALS.appSessionId,
          refetchInterval: 86400000,
          refetchIntervalInBackground: true,
          retry: 5,
          onSuccess: (data) => {
               if(data.ok) {
                    if (typeof data.data.result?.session !== 'undefined') {
                         logDebugMessage("Got session data");
                         GLOBALS.appSessionId = data.data.result.session;
                    } else {
                         logWarnMessage("No session returned when validating session");
                    }
               } else {
                    logDebugMessage("Error validating session");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error validating session");
               logErrorMessage(error);
          }
     });

     const [reloadProfileStarted, setReloadProfileStarted] = React.useState(false);
     const [isReloadingProfile, setReloadingProfile] = React.useState(true);
     useFocusEffect(
          React.useCallback(() => {
               let isMounted = true;
               const update = async () => {
                    if (!isMounted) {
                         logDebugMessage("Skipping DrawerContent useFocusEffect because component is unmounted");
                         return;
                    }

                    if (reloadProfileStarted) {
                         logDebugMessage("Skipping DrawerContent profile reload, already in progress");
                         return;
                    }else{
                         setReloadProfileStarted(true);
                    }

                    try {
                         logDebugMessage("Starting DrawerContent useFocusEffect");

                         let latitude = await SecureStore.getItemAsync('latitude');
                         let longitude = await SecureStore.getItemAsync('longitude');
                         if (userLatitude !== latitude) {
                              setUserLatitude(latitude);
                         }
                         if (userLongitude !== longitude) {
                              setUserLongitude(longitude);
                         }

                         logDebugMessage("reloading profile as part of Drawer Content focus effect Base URL is " + library.baseUrl);
                         const result = await reloadProfile(library.baseUrl);
                         if (!isMounted) {
                              logDebugMessage("Drawer Content unmounted after reloading profile, stopping");
                              return;
                         }

                         if (JSON.stringify(user) !== JSON.stringify(result)) {
                              logDebugMessage("Updating user as part of Drawer Content focus effect")
                              updateUser(result);
                         } else {
                              logDebugMessage("No change needed because the profile was unchanged");
                         }

                         logDebugMessage("Fetching ILS Messages");
                         const response = await getILSMessages(library.baseUrl);
                         if (!isMounted) {
                              logDebugMessage("Drawer Content unmounted after fetching ILS Messages,")
                              return;
                         }

                         if (response.ok) {
                              let updatedMessages = response.data?.result?.messages ?? [];
                              if (JSON.stringify(messages) !== JSON.stringify(updatedMessages)) {
                                   logDebugMessage("Updating ILS Messages");
                                   setILSMessages(response.data?.result?.messages ?? []);
                              }else{
                                   logDebugMessage("ILS Messages did not change");
                              }
                         } else {
                              logDebugMessage("Error fetching ILS messages");
                              logDebugMessage(response);
                              getErrorMessage(response.code, response.problem);
                         }
                    } catch (error) {
                         logErrorMessage("Error in DrawerContent useFocusEffect: " + error.message);
                    } finally {
                         setReloadingProfile(false);
                    }
               };
               update();

               return () => {
                    isMounted = false;
               };
          }, [user])
     );

     const handleNewNotification = (notification) => {
          logDebugMessage("Setting notifications");
          setNotifications(notification);
     };

     const handleNewNotificationResponse = async (response) => {
          logDebugMessage("Handling new notification response");
          await addStoredNotification(response);
          let url = decodeURIComponent(response.notification.request.content.data.url).replace(/\+/g, ' ');
          url = url.replace('aspen-lida://', prefix);

          const supported = await Linking.canOpenURL(url);
          if (supported) {
               try {
                    url = url.replace(prefix, '/');
                    logDebugMessage('Opening url in DrawerContent...');
                    logDebugMessage(url);
                    linkTo(url);
               } catch (e) {
                    logDebugMessage('Could not open url in DrawerContent');
                    logDebugMessage(e);
               }
          } else {
               logDebugMessage('Could not open url in DrawerContent');
               logDebugMessage(url);
          }
     };

     const displayILSMessages = () => {
          if (messages) {
               if (_.isArray(messages)) {
                    return messages.map((obj, index) => {
                         if (obj.message) {
                              return showILSMessage(obj.messageStyle, obj.message, index);
                         }
                    });
               }
          }

          return null;
     };

     if (catalogStatus > 0) {
          return <CatalogOffline />;
     }

     if (invalidSession === true || invalidSession === 'true') {
          return <InvalidCredentials />;
     }

     return (
          <View style={{ flex: 1 }}>
               <DrawerContentScrollView
                    {...props}
                    contentContainerStyle={{
                         flexGrow: 1,
                         paddingTop: insets.top,
                         paddingBottom: insets.bottom,
                    }}
               >
                    <VStack space="$md" mx={4} flex={1}>
                         <UserProfileOverview isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />

                         {displayILSMessages()}

                         <Divider my="$3"/>

                         <VStack flex={1}>
                              <Checkouts isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <Holds isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <UserLists isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <SavedSearches isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <ReadingHistory isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <YearInReview  isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <Fines isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile}/>
                              <NotificationHistory />
                              <Events isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile}/>
                              <Campaigns />

                              <Divider my="$2" />

                              <UserProfile />
                              <LinkedAccounts  isUserLoadedSuccessfully={isUserLoadedSuccessfully && !isReloadingProfile} />
                              <AlternateLibraryCard />
                         </VStack>

                         <VStack space={3} alignItems="center" pt="4">
                              <HStack space={2}>
                                   <LogOutButton />
                              </HStack>
                              <HStack space={2} mt={8}>
                                   <UseColorMode showText={false}/>
                                   <LanguageSwitcher />
                              </HStack>
                         </VStack>
                    </VStack>
               </DrawerContentScrollView>
          </View>
     );
};

const UserProfileOverview = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     let icon;
     if (!_.isUndefined(library.logoApp)) {
          icon = library.logoApp;
     } else if (!_.isUndefined(library.favicon)) {
          icon = library.favicon;
     } else {
          icon = Constants.expoConfig.ios.icon;
     }

     return (
          <Box px="$3">
               <HStack space={3} alignItems="center">
                    <Image source={{ uri: icon }} fallbackSource={require('../../themes/default/aspenLogo.png')} w={42} h={42} alt={getTermFromDictionary(language, 'library_card')} borderRadius="$md" />
                    <Box ml="$3">
                         {isUserLoadedSuccessfully ?
                              (user && user.displayName ? (
                                   <Text fontWeight="$bold" fontSize="$md" isTruncated maxW="175" color={textColor}>
                                        {user.displayName}
                                   </Text>
                              ) : null)
                         :
                              <Spinner />
                         }

                         {library && library.displayName ? (
                              <Text fontSize="$sm" fontWeight="$medium" isTruncated maxW="175" color={textColor}>
                                   {library.displayName}
                              </Text>
                         ) : null}
                         {isUserLoadedSuccessfully ?
                              <HStack space={1} alignItems="center">
                                   <Icon as={MaterialIcons} name="credit-card" size="xs" color={textColor} />
                                   {user && (user.ils_barcode || user.cat_username) ? (
                                        <Text fontSize="$sm" fontWeight="$medium" isTruncated maxW="175" color={textColor}>
                                             {user.ils_barcode ?? user.cat_username}
                                        </Text>
                                   ) : null}
                              </HStack>
                         :
                              <Spinner />
                         }
                    </Box>
               </HStack>
          </Box>
     );
};

const Checkouts = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     return (
          <Pressable
               px="$2"
               py="$2"
               borderRadius="$md"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MyCheckouts', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <VStack>
                         <HStack space="xs" alignItems="center">
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'checked_out_titles')}
                              </Text>
                              {isUserLoadedSuccessfully ? (
                                   <Text fontWeight="$bold" color={textColor}> ({user.numCheckedOut ?? 0})</Text>
                              ) : user ? (
                                   <Spinner size="small" ml="$1" />
                              ): null }
                         </HStack>
                         {isUserLoadedSuccessfully && user.numOverdue > 0 ? (
                              <Badge action="error" mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                   <BadgeText fontSize="$xs">{getTermFromDictionary(language, 'checkouts_overdue_summary').replace("%1%", user.numOverdue)}</BadgeText>
                              </Badge>
                         ) : null}
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const Holds = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { textColor } = React.useContext(ThemeContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);

     const [holdSummary, setHoldSummary] = React.useState('');

     return (
          <Pressable
               px="$2"
               py="$2"
               borderRadius="$md"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MyHolds', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor}/>
                    <VStack>
                         <HStack space="xs" alignItems="center">
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'titles_on_hold')}
                              </Text>
                              {isUserLoadedSuccessfully ? (
                                   <Text fontWeight="$bold" color={textColor}> ({user.numHolds ?? 0})</Text>
                              ) : user ? (
                                   <Spinner size="small" ml="$1" />
                              ) : null}
                         </HStack>
                         {isUserLoadedSuccessfully && user.numHoldsAvailable > 0 ? (
                              <Badge action="success" mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                   <BadgeText fontSize="$xs">{getTermFromDictionary(language, 'num_holds_ready_for_pickup', false).replace('%1%', user.numHoldsAvailable)}</BadgeText>
                              </Badge>
                         ) : null}
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const UserLists = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     return (
          <Pressable
               px="$2"
               py="$2"
               borderRadius="$md"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MyLists', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <VStack>
                         <HStack space="xs" alignItems="center">
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'my_lists')}
                              </Text>
                              {isUserLoadedSuccessfully ? (
                                   <Text fontWeight="$bold" color={textColor}> ({user.numLists ?? 0})</Text>
                              ) : (
                                   <Spinner />
                              )}
                         </HStack>
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const SavedSearches = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     return (
          <Pressable
               px="$2"
               py="$2"
               borderRadius="$md"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MySavedSearches', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <VStack>
                         <HStack space="xs" alignItems="center">
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'saved_searches')}
                              </Text>
                              {user ? (
                                   <Text fontWeight="$bold" color={textColor}> ({user.numSavedSearches ?? 0})</Text>
                              ): null}
                         </HStack>
                         {isUserLoadedSuccessfully ?
                              (user.numSavedSearchesNew > 0 ? (
                                   <Badge action="warning" mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                        <BadgeText fontSize="$xs">{getTermFromDictionary(language, 'num_saved_searches_with_updates', user.numSavedSearchesNew)}</BadgeText>
                                   </Badge>
                              ) : null)
                         :
                              <Spinner/>
                         }
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const ReadingHistory = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     return (
          <Pressable
               px="$2"
               py="$2"
               borderRadius="$md"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MyReadingHistory', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <VStack>
                         <HStack space="xs" alignItems="center">
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'reading_history')}
                              </Text>
                              { isUserLoadedSuccessfully ?
                                   <Text fontWeight="$bold" color={textColor}> ({user.numReadingHistory ?? 0})</Text>
                              :
                                   <Spinner />
                              }
                         </HStack>
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const UserProfile = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     return (
          <Pressable
               px="$2"
               py="$2"
               onPress={() => {
                    navigateStack('AccountScreenTab', 'MyProfile', {
                         libraryUrl: library.baseUrl,
                         hasPendingChanges: false,
                    });
               }}>
               <HStack space="xs" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'contact_information')}</Text>
               </HStack>
          </Pressable>
     );
};

const NotificationHistory = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     if (library.displayIlsInbox === '1' || library.displayIlsInbox === 1 || library.displayIlsInbox === true) {
          return (
               <Pressable
                    px="$2"
                    py="$2"
                    onPress={() => {
                         navigateStack('AccountScreenTab', 'MyNotificationHistory', {
                              hasPendingChanges: false,
                         });
                    }}>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                         <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'notification_history')}</Text>
                    </HStack>
               </Pressable>
          );
     }
};

const LinkedAccounts = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     if (library.allowLinkedAccounts === '1') {
          return (
               <Pressable
                    px="$2"
                    py="$2"
                    onPress={() =>
                         navigateStack('AccountScreenTab', 'MyLinkedAccounts', {
                              libraryUrl: library.baseUrl,
                              hasPendingChanges: false,
                         })
                    }>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                         <Text fontWeight="$medium" color={textColor}>
                              {getTermFromDictionary(language, 'linked_accounts')}
                         </Text>
                         { isUserLoadedSuccessfully ?
                              <Text fontWeight="$bold" color={textColor}> ({user.numLinkedAccounts ?? 0})</Text>
                         :
                              <Spinner />
                         }
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const AlternateLibraryCard = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     let shouldShowAlternateLibraryCard = false;
     if (typeof library.showAlternateLibraryCard !== 'undefined') {
          shouldShowAlternateLibraryCard = library.showAlternateLibraryCard;
     }

     if (shouldShowAlternateLibraryCard === '1' || shouldShowAlternateLibraryCard === 1) {
          return (
               <Pressable
                    px="$2"
                    py="$2"
                    borderRadius="$md"
                    onPress={() => {
                         navigateStack('LibraryCardTab', 'MyAlternateLibraryCard', {
                              prevRoute: 'AccountDrawer',
                              hasPendingChanges: false,
                         });
                    }}>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                         <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'alternate_library_card')}</Text>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const Fines = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor: themeTextColor } = React.useContext(ThemeContext);
     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));
     const toast = useToast();

     let shouldShowFines = true;
     if (typeof library.showFines !== 'undefined') {
          shouldShowFines = library.showFines;
     }

     let userFineAmount = user.fines ?? '$0.00';
     let hasFines = false;
     if (user.fines) {
          userFineAmount = userFineAmount.substring(1);
          userFineAmount = Number(userFineAmount);
          if (userFineAmount > 0) {
               hasFines = true;
          }
     }

     if (shouldShowFines) {
          return (
               <Pressable px="$2" py="$2" borderRadius="$md" onPress={async () => await passUserToDiscovery(toast, library.baseUrl, 'Fines', user.id, backgroundColor, textColor)}>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={themeTextColor} />
                         <VStack>
                              <Text fontWeight="$medium" color={themeTextColor}>{getTermFromDictionary(language, 'fines')}</Text>
                              {isUserLoadedSuccessfully ?
                                   <Badge action={hasFines ? 'error' : 'info'} mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                        <BadgeText fontSize="$xs">{user.fines ?? '$0.00'}</BadgeText>
                                   </Badge>
                              :
                                   <Spinner />
                              }
                         </VStack>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const Events = ({ isUserLoadedSuccessfully }) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     if (library.hasEventSettings) {
          return (
               <Pressable
                    px="$2"
                    py="$2"
                    borderRadius="$md"
                    onPress={() => {
                         navigateStack('AccountScreenTab', 'MyEvents', {
                              libraryUrl: library.baseUrl,
                              hasPendingChanges: false,
                         });
                    }}>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                         <VStack>
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'events')}
                              </Text>
                              { isUserLoadedSuccessfully ?
                                   (user.numSavedEventsUpcoming > 0 ? (
                                        <Badge action="info" mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                             <BadgeText fontSize="$xs">{getTermFromDictionary(language, 'num_saved_events_upcoming').replace('%1%', user.numSavedEventsUpcoming)}</BadgeText>
                                        </Badge>
                                   ) : null)
                              :
                                   <Spinner />
                              }
                         </VStack>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const YearInReview = () => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor: themeTextColor } = React.useContext(ThemeContext);
     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));
     const toast = useToast();

     let shouldShowYearInReview = false;
     if (typeof user.hasYearInReview !== 'undefined') {
          shouldShowYearInReview = user.hasYearInReview;
     }

     if (shouldShowYearInReview) {
          return (
               <Pressable px="$2" py="$2" borderRadius="$md" onPress={async () => await passUserToDiscovery(toast, library.baseUrl, 'YearInReview', user.id, backgroundColor, textColor)}>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={themeTextColor} />
                         <VStack>
                              <Text fontWeight="$medium" color={themeTextColor}>{user.yearInReviewName ?? getTermFromDictionary(language, 'year_in_review')}</Text>
                              <Badge action="info" mt="$1" borderRadius="$sm" alignSelf="flex-start">
                                   <BadgeText fontSize="$xs">{getTermFromDictionary(language, 'view_now')}</BadgeText>
                              </Badge>
                         </VStack>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const Campaigns = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);
     if (library.hasCommunityEngagementEnabled) {
          return(
               <Pressable
                    px="$2"
                    py="$2"
                    borderRadius="$md"
                    onPress={() =>
                         navigateStack('AccountScreenTab', 'MyCampaigns', {
                              libraryUrl: library.baseUrl,
                              hasPendingChanges: false,
                         })
                    }>
                    <HStack space="xs" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                         <VStack>
                              <Text fontWeight="$medium" color={textColor}>
                                   {getTermFromDictionary(language, 'campaigns')}
                              </Text>
                         </VStack>
                    </HStack>
               </Pressable>
          );
     }
}

async function getStoredNotifications() {
     try {
          const notifications = await AsyncStorage.getItem('@notifications');
          return notifications != null ? JSON.parse(notifications) : null;
     } catch (e) {
          logErrorMessage(e);
     }
}

async function createNotificationStorage(message) {
     try {
          const array = [];
          array.push(message);
          const notification = JSON.stringify(array);
          await AsyncStorage.setItem('@notifications', notification);
     } catch (e) {
          logErrorMessage(e);
     }
}

async function addStoredNotification(message) {
     await getStoredNotifications().then(async (response) => {
          if (response) {
               response.push(message);
               try {
                    await AsyncStorage.setItem('@notifications', JSON.stringify(response));
               } catch (e) {
                    logErrorMessage(e);
               }
          } else {
               await createNotificationStorage(message);
          }
     });
}

function LogOutButton() {
     const { language } = React.useContext(LanguageContext);
     const { signOut } = React.useContext(AuthContext);
     const { theme } = React.useContext(ThemeContext);

     return (
          <Button size="md" action="secondary" onPress={signOut} bgColor={theme.tokens.colors.primary['500']}>
               <ButtonIcon as={MaterialIcons} name="logout" size="xs" color={theme.tokens.colors.primary['500-text']} />
               <ButtonText color={theme.tokens.colors.primary['500-text']}> {getTermFromDictionary(language, 'logout')}</ButtonText>
          </Button>
     );
}
