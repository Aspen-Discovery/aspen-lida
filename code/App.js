import 'expo-dev-client';
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NativeBaseProvider, StatusBar } from 'native-base';
import React from 'react';
import Toast from 'react-native-toast-message';

import { LogBox } from 'react-native';

import { enableScreens } from 'react-native-screens';
import * as Sentry from '@sentry/react-native';
import App from './src/components/navigation';
import { ThemeContext } from './src/context/initialContext';

import { SplashScreenNative } from './src/screens/Auth/SplashNative';
import { createTheme, saveTheme } from './src/themes/theme';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from './src/util/logging.js';
import { initDatabase } from './src/util/db/sqlite';
import { purgeExpiredApiErrorLogs } from './src/util/db';

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
     const [aspenTheme, setAspenTheme] = React.useState([]);
     const [colorMode, setColorMode] = React.useState(null);
     const { mode, updateColorMode, updateTheme } = React.useContext(ThemeContext);
     const [statusBarColor, setStatusBarColor] = React.useState('light-content');

     const [dbReady, setDbReady] = React.useState(false);
     React.useEffect(() => {
          let active = true;

          (async () => {
               try {
                    await initDatabase();
                    // trim old API log rows in the background; without this the table grows
                    // unbounded (a row per API error) and slows every write on the request path
                    purgeExpiredApiErrorLogs(24).catch((e) => {
                         logDebugMessage('Could not purge expired API error logs: ' + e);
                    });
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

     logDebugMessage("2 Initial setup done");

     React.useEffect(() => {
          console.log('useEffect triggered with colorMode:', colorMode, 'and mode:', mode);
          const setupNativeBaseTheme = async () => {
               logDebugMessage('3 Running setupNativeBaseTheme...');
               try {
                    await AsyncStorage.getItem('@colorMode').then(async (mode) => {
                         if (mode === 'light' || mode === 'dark') {
                              setColorMode(mode);
                              updateColorMode(mode);
                         } else {
                              setColorMode('light');
                              updateColorMode('light');
                         }
                    });
               } catch (e) {
                    logErrorMessage("4 Could not load color mode " + e);
                    // something went wrong (or the item didn't exist yet in storage)
                    // so just set it to the default: light
                    setColorMode('light');
                    updateColorMode('light');
               }

               if (colorMode) {
                    logDebugMessage("5 Creating Theme ");
                    try {
                         await createTheme(colorMode).then(async (result) => {
                              logDebugMessage("5a retrieved data from createTheme");
                              setAspenTheme(result);
                              updateTheme(result);
                              logDebugMessage("5b Set Aspen Theme");
                              if (result.colors?.primary?.['baseContrast'] === '#000000') {
                                   setStatusBarColor('dark-content');
                              } else {
                                   setStatusBarColor('light-content');
                              }
                              logDebugMessage("5c Saving Theme");
                              await saveTheme(result);
                         });
                    } catch (e) {
                         // never leave the app stuck on the splash screen because theming failed
                         logErrorMessage('Could not create theme, continuing with defaults');
                         logErrorMessage(e);
                    } finally {
                         setLoading(false);
                    }
               }
          };
          setupNativeBaseTheme().then(() => {
               return () => setupNativeBaseTheme();
          });
     }, [colorMode, mode]);

     if (isLoading || !dbReady) {
          logDebugMessage("6 Still loading, showing splash screen");
          return <SplashScreenNative />;
     }else{
          logDebugMessage("7 Loading main page");
          return (
               <QueryClientProvider client={queryClient}>
                    <Sentry.TouchEventBoundary>
                         <GluestackUIProvider config={config}>
                              <NativeBaseProvider theme={aspenTheme}>
                                   <StatusBar barStyle={statusBarColor} />
                                   <App />
                              </NativeBaseProvider>
                         </GluestackUIProvider>
                    </Sentry.TouchEventBoundary>
                    <Toast />
               </QueryClientProvider>
          );
     }
}
