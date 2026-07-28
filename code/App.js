import 'expo-dev-client';
import Constants from 'expo-constants';
import { GluestackUIProvider, useToast } from '@gluestack-ui/themed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

import { LogBox } from 'react-native';

import { enableScreens } from 'react-native-screens';
import * as Sentry from '@sentry/react-native';
import App from './src/components/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { CheckoutsProvider, GroupedWorkProvider, HoldsProvider, SearchProvider, SystemMessagesProvider } from './src/context/initialContext';

import { SplashScreenNative } from './src/screens/Auth/SplashNative';
import { buildThemeForLibrary, THEME_STALE_MS, useThemeForDisplay } from './src/themes/theme';

import { logDebugMessage, logErrorMessage } from './src/util/logging.js';
import { initDatabase } from './src/util/db';
import { loadLibraryUrl, loadThemeState, saveThemeState, isStoredThemeIdMatch } from './src/util/db';
import { GLOBALS } from './src/util/globals';

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
     const { colorMode, theme } = useThemeForDisplay();
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
          let active = true;
          (async () => {
               if (!dbReady) {
                    return;
               }
               logDebugMessage('3 Running buildThemeForLibrary...');
               try {
                    const current = await loadThemeState();
                    const mode = current?.colorMode === 'dark' ? 'dark' : 'light';
                    const textColor = mode === 'dark' ? 'textLight50' : 'textLight950';
                    const hasStoredTheme = Boolean(current?.themeColors?.primary && current?.themeColors?.secondary && current?.themeColors?.tertiary);
                    const hasMatchingThemeId = await isStoredThemeIdMatch(GLOBALS.themeId ?? 1);
                    const themeAgeMs = current?.updatedAt ? Date.now() - current.updatedAt : Number.POSITIVE_INFINITY;
                    const isThemeStale = themeAgeMs > THEME_STALE_MS;

                    if (!hasStoredTheme || !hasMatchingThemeId || isThemeStale) {
                         const persistedLibraryUrl = await loadLibraryUrl();
                         const themeUrl = persistedLibraryUrl || GLOBALS.url || Constants.expoConfig.extra.apiUrl;
                         logDebugMessage(`4 Building theme for current themeId using url=${themeUrl ?? 'none'} stale=${isThemeStale} ageMs=${themeAgeMs}`);
                         if (!themeUrl) {
                              logDebugMessage('4 Skipping startup theme fetch because no library URL is available yet');
                         } else {
                              const builtTheme = await buildThemeForLibrary(toast, themeUrl);
                              await saveThemeState({
                                   themeId: builtTheme.themeId,
                                   colorMode: mode,
                                   textColor,
                                   themeColors: builtTheme.themeColors,
                              });
                         }
                    } else if (!current?.textColor || !current?.colorMode) {
                         await saveThemeState({
                              ...current,
                              colorMode: mode,
                              textColor,
                         });
                    }
               } catch (e) {
                    logErrorMessage('4 Could not load or build theme ' + e);
               } finally {
                    if (active) {
                         setLoading(false);
                    }
               }
          })();
          return () => {
               active = false;
          };
     }, [dbReady, toast]);

     if (isLoading || !dbReady) {
          logDebugMessage("6 Still loading, showing splash screen");
          return <SplashScreenNative />;
     }else{
          logDebugMessage("7 Loading AppContainer colorMode " + colorMode);
          return (
               <SafeAreaProvider>
                    <QueryClientProvider client={queryClient}>
                          <Sentry.TouchEventBoundary>
                                <GluestackUIProvider config={theme} colorMode={colorMode}>
                                     <SearchProvider>
                                           <CheckoutsProvider>
                                                <HoldsProvider>
                                                     <SystemMessagesProvider>
                                                          <GroupedWorkProvider>
                                                               <AuthProvider>
                                                                    <StatusBar key={colorMode} style={colorMode === 'light' ? 'dark' : 'light'} backgroundColor={colorMode === 'light' ? '#FFFFFF' : '#000000'} translucent={false}/>
                                                                    <App />
                                                               </AuthProvider>
                                                          </GroupedWorkProvider>
                                                     </SystemMessagesProvider>
                                                </HoldsProvider>
                                           </CheckoutsProvider>
                                     </SearchProvider>
                                </GluestackUIProvider>
                          </Sentry.TouchEventBoundary>
                    </QueryClientProvider>
               </SafeAreaProvider>
          );
     }
}
