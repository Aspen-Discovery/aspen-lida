import Constants from 'expo-constants';
import { Center, Image, Spinner, VStack, useToast } from '@gluestack-ui/themed';
import React from 'react';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { buildThemeForLibrary, THEME_STALE_MS, useTheme } from '../../themes/theme';
import { isStoredThemeIdMatch, loadLibraryUrl, loadThemeState, saveThemeState } from '../../util/db';
import { GLOBALS, LIBRARY } from '../../util/globals';
import { logDebugMessage, logErrorMessage } from '../../util/logging';

const splashImage = Constants.expoConfig.extra.loginLogo;
const splashBackgroundColor = Constants.expoConfig.splash.backgroundColor;

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
