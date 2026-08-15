import React from 'react';
import { Button, ButtonText, useToast, Center } from '@gluestack-ui/themed';

import { useTheme } from '../themes/theme';
import { loadLibraryUrl } from '../util/db';
import { GLOBALS, LIBRARY } from '../util/globals';
import { logDebugMessage, logErrorMessage } from '../util/logging';

export const ThemeRefreshButton = ({
     label = 'Refresh Theme',
     refreshingLabel = 'Refreshing Theme...',
     onRefreshed,
     ...buttonProps
}) => {
     const toast = useToast();
     const { forceRefreshTheme, theme } = useTheme();
     const [isRefreshing, setIsRefreshing] = React.useState(false);

     const onPress = React.useCallback(async () => {
          if (isRefreshing) {
               return;
          }

          setIsRefreshing(true);
          try {
               const persistedLibraryUrl = await loadLibraryUrl();
               const themeUrl = LIBRARY.url || persistedLibraryUrl || GLOBALS.url || null;
               logDebugMessage(`Theme refresh button: forcing theme refresh using url=${themeUrl ?? 'none'}`);
               await forceRefreshTheme(toast, themeUrl);
               if (typeof onRefreshed === 'function') {
                    onRefreshed();
               }
          } catch (error) {
               logErrorMessage('Theme refresh button: refresh failed');
               logErrorMessage(error);
          } finally {
               setIsRefreshing(false);
          }
     }, [forceRefreshTheme, isRefreshing, onRefreshed, toast]);

     return (
          <Center>
               <Button bgColor={theme.tokens.colors.primary['500']} onPress={onPress} isDisabled={isRefreshing} {...buttonProps}>
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{isRefreshing ? refreshingLabel : label}</ButtonText>
               </Button>
          </Center>
     );
};

