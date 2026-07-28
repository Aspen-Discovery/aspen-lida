import 'expo-dev-client';
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider, Box, SafeAreaView, useToast } from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

import { LogBox } from 'react-native';

import { enableScreens } from 'react-native-screens';
import * as Sentry from '@sentry/react-native';
import App from './src/components/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { BrowseCategoryProvider, CheckoutsProvider, GroupedWorkProvider, HoldsProvider, LanguageProvider, SearchProvider, SystemMessagesProvider, ThemeContext, ThemeProvider } from './src/context/initialContext';

import { SplashScreenNative } from './src/screens/Auth/SplashNative';
import { createTheme, saveTheme } from './src/themes/theme';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from './src/util/logging.js';
import { initDatabase } from './src/util/db/sqlite';

logDebugMessage("1 Enabling Screens, react-native-screens");
enableScreens();

// react query client instance
const queryClient = new QueryClient({
     defaultOptions: {
          queries: {
               staleTime: 1000 * 60 * 60 * 24,
               cacheTime: 1000 * 60 * 60 * 24,
          },
     },
});

// Hide log error/warning popups in simulator (useful for demoing)
const IGNORED_LOGS = ['Non-serializable values were found in the navigation state', 'Warning: ...', 'Warn: ...', 'If you do not provide children, you must specify an aria-label for accessibility '];
LogBox.ignoreLogs(IGNORED_LOGS);
LogBox.ignoreAllLogs(); //Ignore all log notifications
// Workaround for Expo 45
if (__DEV__) {
     const withoutIgnored =
          (logger) =>
          (...args) => {
               const output = args.join(' ');

               if (!IGNORED_LOGS.some((log) => output.includes(log))) {
                    logger(...args);
               }
          };

     console.log = withoutIgnored(console.log);
     console.info = withoutIgnored(console.info);
     console.warn = withoutIgnored(console.warn);
     console.error = withoutIgnored(console.error);
}

export default function AppContainer() {
     const [isLoading, setLoading] = React.useState(true);
     const { colorMode, updateColorMode, updateTheme } = React.useContext(ThemeContext);
     const toast = useToast();

     const [dbReady, setDbReady] = React.useState(false);
     React.useEffect(() => {
          let active = true;

          (async () => {
               try {
                    logDebugMessage('2 Initializing SQLite');
                    await initDatabase();
               } catch (error) {
                    logErrorMessage('Failed to initialize SQLite');
                    logErrorMessage(error);
               } finally {
                    if (active) setDbReady(true);
               }
          })();

          return () => {
               active = false;
          };
     }, []);

     React.useEffect(() => {
          let loadingBaseTheme = true;
          (async () => {
               logDebugMessage('3 Running setupNativeBaseTheme... ' + colorMode);
               try {
                    await AsyncStorage.getItem('@colorMode').then(async (mode) => {
                          if (mode === 'light' || mode === 'dark') {
                              updateColorMode(mode);
                         } else {
                              updateColorMode('light');
                         }
                    });
               } catch (e) {
                    logErrorMessage("4 Could not load color mode " + e);
                    // something went wrong (or the item didn't exist yet in storage)
                    // so just set it to the default: light
                    updateColorMode('light');
               }

               if (colorMode) {
                    logDebugMessage("5 Creating Default Theme " + colorMode);
                    await createTheme(toast, colorMode).then(async (result) => {
                         logDebugMessage("5a retrieved data from createTheme");
                         updateTheme(result);
                         logDebugMessage("5b Set Aspen Theme");
                         logDebugMessage("5c Saving Theme");
                         await saveTheme(result);
                    });

                    setLoading(false);
               }
          })();
          return () => {
               loadingBaseTheme = false;
          };
     }, [colorMode]);

     if (isLoading || !dbReady) {
          logDebugMessage("6 Still loading, showing splash screen");
          return <SplashScreenNative />;
     }else{
          logDebugMessage("7 Loading main page colorMode " + colorMode);
          return (
               <SafeAreaProvider>
                    <QueryClientProvider client={queryClient}>
                          <Sentry.TouchEventBoundary>
                                <GluestackUIProvider config={config} colorMode={colorMode}>
                                     <ThemeProvider>
                                          <LanguageProvider>
                                               <SearchProvider>
                                                    <CheckoutsProvider>
                                                         <HoldsProvider>
                                                              <BrowseCategoryProvider>
                                                                   <SystemMessagesProvider>
                                                                        <GroupedWorkProvider>
                                                                             <AuthProvider>
                                                                                  <StatusBar key={colorMode} style={colorMode === 'light' ? 'dark' : 'light'} backgroundColor={colorMode === 'light' ? '#FFFFFF' : '#000000'} translucent={false}/>
                                                                                  <App />
                                                                             </AuthProvider>
                                                                        </GroupedWorkProvider>
                                                                   </SystemMessagesProvider>
                                                              </BrowseCategoryProvider>
                                                         </HoldsProvider>
                                                    </CheckoutsProvider>
                                               </SearchProvider>
                                          </LanguageProvider>
                                     </ThemeProvider>
                                </GluestackUIProvider>
                          </Sentry.TouchEventBoundary>
                    </QueryClientProvider>
               </SafeAreaProvider>
          );
     }
}
