import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { Spinner, useColorModeValue, useContrastText, useToken } from 'native-base';
import React from 'react';
import { AppState, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

import * as Sentry from '@sentry/react-native';
import { BrowseCategoryProvider, CheckoutsProvider, GroupedWorkProvider, HoldsProvider, LanguageProvider, LibraryBranchProvider, LibrarySystemProvider, SearchProvider, SystemMessagesProvider, ThemeProvider, UserContext, UserProvider, LanguageContext } from '../context/initialContext';
import { navigationRef } from '../helpers/RootNavigator';
import LaunchStackNavigator from '../navigations/LaunchStackNavigator';

import { LoginScreen } from '../screens/Auth/Login';
import { SelfRegistration } from '../screens/Auth/SelfRegistration';
import { SplashScreen } from '../screens/Auth/Splash';
import { getTermFromDictionary } from '../translations/TranslationService';
import { GLOBALS, LIBRARY } from '../util/globals';
//import { updateAspenLiDABuild } from '../util/greenhouse';
import { checkCachedUrl } from '../util/api/system';
import { RemoveData } from '../helpers/helpers';
import LibraryCardScanner from './LibraryCardScanner';
import TitleWithLogo from '../components/TitleWithLogo'

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../util/logging.js';
import { trackAppLaunches, trackAppResume } from '../util/analytics';
const prefix = Linking.createURL('/');
logDebugMessage("Linking prefix is " + prefix);

enableScreens();

const Stack = createNativeStackNavigator();

let routingInstrumentation = null;
try {
     routingInstrumentation = new Sentry.ReactNavigationInstrumentation();
}catch (e) {
     routingInstrumentation = null;
     logWarnMessage("Could not create sentry routing instrumentation " + e);
}


export const AuthContext = React.createContext();

const iOSRelease = Constants.expoConfig.ios.bundleIdentifier;
const androidRelease = Constants.expoConfig.android.package;
const iOSDist = Constants.expoConfig.ios.buildNumber;
const androidDist = Constants.expoConfig.android.versionCode;
const version = Constants.expoConfig.version;

logDebugMessage("iOS Release: " + iOSRelease);
logDebugMessage("iOS Dist: " + iOSDist);
logDebugMessage("Version: " + version);

let releaseCode = Platform.OS === 'android' ? androidRelease + '@' + version + '+' + androidDist : iOSRelease + '@' + version + '+' + iOSDist;
releaseCode = releaseCode.toString();

let distribution = Platform.OS === 'android' ? androidDist : iOSDist;
distribution = distribution.toString();

try {
     logDebugMessage("Initializing sentry");
     let integrations = [];
     if (routingInstrumentation != null) {
          integrations.push(routingInstrumentation);
     }
     Sentry.init({
          dsn: Constants.expoConfig.extra.sentryDSN,
          enableAutoSessionTracking: true,
          sessionTrackingIntervalMillis: 10000,
          debug: false,
          tracesSampleRate: 0.1,
          sampleRate: 0.1,
          environment: Updates.channel ?? Updates.releaseChannel,
          release: releaseCode,
          dist: distribution,
          autoInject: false,
          integrations: integrations,
     });

     Sentry.setTag('patch', GLOBALS.appPatch);
     Sentry.setTag('stage', GLOBALS.appStage);
}catch(e) {
     logErrorMessage("Could not initialize sentry " + e);
}


export function App() {
     const { updateUser } = React.useContext(UserContext);
     const { language } = React.useContext(LanguageContext);

     const primaryColor = useToken('colors', 'primary.base');
     const primaryColorContrast = useToken('colors', useContrastText(primaryColor));
     const screenBackgroundColor = useToken('colors', useColorModeValue('warmGray.50', 'coolGray.800'));
     const navigationTheme = {
          ...DefaultTheme,
          colors: {
               ...DefaultTheme.colors,
               primary: primaryColorContrast,
               card: primaryColor,
               text: primaryColorContrast,
               background: screenBackgroundColor,
          },
     };
     const queryClient = useQueryClient();
     const [state, dispatch] = React.useReducer(
          (prevState, action) => {
               switch (action.type) {
                    case 'RESTORE_TOKEN':
                         return {
                              ...prevState,
                              userToken: action.token,
                              isLoading: false,
                              refreshUserData: true,
                         };
                    case 'SIGN_IN':
                         return {
                              ...prevState,
                              isSignout: false,
                              userToken: action.token,
                              isLoading: false,
                              refreshUserData: true,
                         };
                    case 'SIGN_OUT':
                         return {
                              ...prevState,
                              isSignout: true,
                              userToken: null,
                              isLoading: false,
                              refreshUserData: false,
                         };
               }
          },
          {
               isLoading: true,
               isSignout: false,
               userToken: null,
               refreshUserData: false,
          }
     );

     React.useEffect(() => {
          const timer = setInterval(async () => {
               if (!__DEV__) {
                    try {
                         const update = await Updates.checkForUpdateAsync();
                         if (update.isAvailable) {
                              logDebugMessage('Found an update...');
                              try {
                                   logDebugMessage('Downloading update...');
                                   await Updates.fetchUpdateAsync().then(async (r) => {
                                        logInfoMessage('Updating app...');
                                        await Updates.reloadAsync();
                                   });
                              } catch (e) {
                                   logErrorMessage("Error updating app");
                                   logErrorMessage(e);
                              }
                         }
                    } catch (e) {
                         // error checking for updates
                    }
               }
          }, 10000);
          return () => {
               clearInterval(timer);
          };
     }, []);

     React.useEffect(() => {
          const bootstrapAsync = async () => {
               logDebugMessage('Checking existing session...');
               let userToken;
               let libraryUrl;
               let userKey;
               try {
                    // Restore token stored in `AsyncStorage`
                    userToken = await AsyncStorage.getItem('@userToken');
                    libraryUrl = await AsyncStorage.getItem('@pathUrl');
                    userKey = await SecureStore.getItemAsync('userKey');
               } catch (e) {
                    // Restoring token failed
                    logErrorMessage("Error restoring token");
                    logErrorMessage(e);
                    dispatch({ type: 'SIGN_OUT' });
               }

               if (!userKey) {
                    dispatch({ type: 'SIGN_OUT' });
               }

               if (!libraryUrl) {
                    libraryUrl = LIBRARY.url;
               }

               if (userToken) {
                    logDebugMessage('Session found');
                    if (libraryUrl) {
                         logDebugMessage('Trying to connect to: ', libraryUrl);
                         await checkCachedUrl(libraryUrl).then(async (result) => {
                              if (result) {
                                   LIBRARY.url = libraryUrl;
                                   logDebugMessage('Connection successful. Continuing...');
                                   await trackAppLaunches(libraryUrl);
                              } else {
                                   logWarnMessage('Connection failed, logging out.');
                                   userToken = null;
                                   await RemoveData(queryClient, updateUser).then((res) => {
                                        dispatch({ type: 'SIGN_OUT' });
                                   });
                              }
                         });
                    } else {
                         logWarnMessage('No cached library url, logging out.');
                         await RemoveData(queryClient, updateUser).then((res) => {
                              dispatch({ type: 'SIGN_OUT' });
                         });
                    }
               } else {
                    logDebugMessage('No session found. Starting new.');
               }
               dispatch({
                    type: 'RESTORE_TOKEN',
                    token: userToken,
                    refreshData: true,
               });
          };
          bootstrapAsync();
     }, []);

     React.useEffect(() => {
          const subscription = AppState.addEventListener('change', async (nextAppState) => {
               if (nextAppState === 'active') {
                    logDebugMessage('App resumed from background');

                    try {
                         const libraryUrl = await AsyncStorage.getItem('@pathUrl');
                         if (libraryUrl) {
                              await trackAppResume(libraryUrl);
                         }
                    } catch (error) {
                         logErrorMessage('Failed to track app resume: ', error);
                    }
               }
          });

          return () => {
               subscription.remove();
          };
     }, []);

     const authContext = React.useMemo(
          () => ({
               signIn: async () => {
                    //queryClient.invalidateQueries({});
                    const userToken = GLOBALS.appSessionId;
                    await AsyncStorage.setItem('@userToken', userToken);
                    dispatch({
                         type: 'SIGN_IN',
                         token: userToken,
                         refreshData: true,
                    });
               },
               signOut: async () => {
                    await RemoveData(queryClient, updateUser).then((res) => {
                         dispatch({ type: 'SIGN_OUT' });
                    });
                    logDebugMessage('Session ended.');
               },
          }),
          []
     );

     if (state.isLoading) {
          // We haven't finished checking for the token yet
          return <SplashScreen />;
     }

     return (
          <AuthContext.Provider value={authContext}>
               <ThemeProvider>
                    <SystemMessagesProvider>
                         <LanguageProvider>
                              <LibrarySystemProvider>
                                   <LibraryBranchProvider>
                                        <SearchProvider>
                                             <UserProvider>
                                                  <CheckoutsProvider>
                                                       <HoldsProvider>
                                                            <BrowseCategoryProvider>
                                                                 <GroupedWorkProvider>
                                                                      <NavigationContainer
                                                                           theme={navigationTheme}
                                                                           ref={navigationRef}
                                                                           fallback={<Spinner />}
                                                                           linking={{
                                                                                prefixes: prefix,
                                                                                config: {
                                                                                     screens: {
                                                                                          Login: 'user/login',
                                                                                          LaunchStack: {
                                                                                               screens: {
                                                                                                    DrawerStack: {
                                                                                                         screens: {
                                                                                                              TabsNavigator: {
                                                                                                                   screens: {
                                                                                                                        AccountScreenTab: {
                                                                                                                             screens: {
                                                                                                                                  MySavedSearches: 'user/saved_searches',
                                                                                                                                  LoadSavedSearch: 'user/saved_search',
                                                                                                                                  MyLists: 'user/lists',
                                                                                                                                  MyList: 'user/list',
                                                                                                                                  MyLinkedAccounts: 'user/linked_accounts',
                                                                                                                                  MyHolds: 'user/holds',
                                                                                                                                  MyCheckouts: 'user/checkouts',
                                                                                                                                  MyPreferences: 'user/preferences',
                                                                                                                                  MyProfile: 'user',
                                                                                                                                  MyReadingHistory: 'user/reading_history',
                                                                                                                                  MyCampaigns: 'user/campaigns',
                                                                                                                             },
                                                                                                                        },
                                                                                                                        LibraryCardTab: {
                                                                                                                             screens: {
                                                                                                                                  LibraryCard: 'user/library_card',
                                                                                                                             },
                                                                                                                        },
                                                                                                                        SearchTab: {
                                                                                                                             screens: {
                                                                                                                                  SearchByCategory: 'search/browse_category',
                                                                                                                                  SearchByAuthor: 'search/author',
                                                                                                                                  SearchByList: 'search/list',
                                                                                                                             },
                                                                                                                        },
                                                                                                                        BrowseTab: {
                                                                                                                             screens: {
                                                                                                                                  HomeScreen: 'home',
                                                                                                                                  GroupedWorkScreen: 'search/grouped_work',
                                                                                                                                  SearchResults: 'search',
                                                                                                                             },
                                                                                                                        },
                                                                                                                   },
                                                                                                              },
                                                                                                         },
                                                                                                    },
                                                                                               },
                                                                                          },
                                                                                     },
                                                                                },
                                                                                async getInitialURL() {
                                                                                     let url = await Linking.getInitialURL();

                                                                                     if (url != null) {
                                                                                          url = decodeURIComponent(url).replace(/\+/g, ' ');
                                                                                          url = url.replace('aspen-lida://', prefix);
                                                                                          return url;
                                                                                     }

                                                                                     const response = await Notifications.getLastNotificationResponseAsync();
                                                                                     url = decodeURIComponent(response?.notification.request.content.data.url).replace(/\+/g, ' ');
                                                                                     url = url.replace('aspen-lida://', prefix);
                                                                                     return url;
                                                                                },
                                                                                subscribe(listener) {
                                                                                     const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
                                                                                          listener(url);
                                                                                     });
                                                                                     const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
                                                                                          const url = response.notification.request.content.data.url;
                                                                                          listener(url);
                                                                                     });

                                                                                     return () => {
                                                                                          subscription.remove();
                                                                                          linkingSubscription.remove();
                                                                                     };
                                                                                },
                                                                           }}>
                                                                           <Stack.Navigator
                                                                                screenOptions={{
                                                                                     headerShown: false,
                                                                                }}
                                                                                name="RootNavigator">
                                                                                {state.userToken === null ? (
                                                                                     // No token found, user isn't signed in
                                                                                     <Stack.Screen
                                                                                          name="Login"
                                                                                          component={LoginScreen}
                                                                                          options={{
                                                                                               headerShown: false,
                                                                                               animationTypeForReplace: state.isSignout ? 'pop' : 'push',
                                                                                          }}
                                                                                     />
                                                                                ) : (
                                                                                     // User is signed in
                                                                                     <Stack.Screen name="LaunchStack" component={LaunchStackNavigator} initialParams={{ refreshUserData: state.refreshUserData ?? false }} />
                                                                                )}
                                                                                <Stack.Screen
                                                                                     name="LibraryCardScanner"
                                                                                     component={LibraryCardScanner}
                                                                                     options={{
                                                                                          presentation: 'modal',
                                                                                     }}
                                                                                />
                                                                                <Stack.Screen
                                                                                     name="SelfRegistration"
                                                                                     component={SelfRegistration}
                                                                                     options={{
                                                                                          header: () => {
                                                                                               const title = getTermFromDictionary(language, 'register_for_a_library_card');
                                                                                               return <TitleWithLogo title={title} hideBack={true} />;
                                                                                          },
                                                                                          headerShown: true,
                                                                                          presentation: 'card',
                                                                                          gestureEnabled: false,
                                                                                          headerBackTitleVisible: false,
                                                                                     }}
                                                                                />
                                                                           </Stack.Navigator>
                                                                      </NavigationContainer>
                                                                 </GroupedWorkProvider>
                                                            </BrowseCategoryProvider>
                                                       </HoldsProvider>
                                                  </CheckoutsProvider>
                                             </UserProvider>
                                        </SearchProvider>
                                   </LibraryBranchProvider>
                              </LibrarySystemProvider>
                         </LanguageProvider>
                    </SystemMessagesProvider>
               </ThemeProvider>
          </AuthContext.Provider>
     );
}

export default Sentry.wrap(App);
