import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Box, createConfig, HStack, Button, ButtonIcon, ButtonText, ChevronLeftIcon } from '@gluestack-ui/themed';
import { config as defaultConfig } from '@gluestack-ui/config';
import { GLOBALS } from '../util/globals';
import {
     useThemeState,
     useUpdateThemeColorMode,
     useUpdateThemeColors,
     useUpdateThemeTextColor,
     useResetThemeState,
} from '../hooks/useThemeData';

import { logDebugMessage } from '../util/logging.js';
import { getThemeInfo } from '../util/api/system';

export function useColorModeValue(lightValue, darkValue) {
     const { colorMode } = useThemeState();
     return colorMode === 'dark' ? darkValue : lightValue;
}

export const BackIcon = (props) => {
     const { theme } = useThemeForDisplay();
     return <ChevronLeftIcon size="md" ml={1} {...props} color={theme['tokens']['colors']['primary']['baseContrast']} />;
};

function buildAlertTheme(actionType) {
     const actionColors = {
          error: { bg: '#fecaca', icon: '#dc2625', text: '#000000' },
          warning: { bg: '#ffd7aa', icon: '#ea580b', text: '#000000' },
          success: { bg: '#bbf7d0', icon: '#17a34a', text: '#000000' },
          info: { bg: '#bae6fe', icon: '#0084c7', text: '#000000' },
     };

     const colors = actionColors[actionType] || actionColors.info;

     return {
          backgroundColor: colors.bg,
          '_icon': {
               color: colors.icon,
          },
          '_text': {
               color: colors.text,
          },
     };
}

function buildBadgeTheme(actionType) {
     const actionColors = {
          error: { bg: '#fee2e2', text: '#991b1b' },
          warning: { bg: '#fef3c7', text: '#92400e' },
          success: { bg: '#dcfce7', text: '#166534' },
          info: { bg: '#e0f2fe', text: '#075985' },
          muted: { bg: '#f3f4f6', text: '#1f2937' },
     };

     const colors = actionColors[actionType] || actionColors.muted;

     return {
          backgroundColor: colors.bg,
          borderRadius: 'sm',
          _text: {
               color: colors.text,
               fontSize: 'xs',
               fontWeight: 'medium',
               textTransform: 'none'
          },
     };
}

function buildConfigFromColors(colors) {
     return createConfig({
          ...defaultConfig,
          tokens: {
               ...defaultConfig.tokens,
               colors: {
                    ...defaultConfig.tokens.colors,
                    primary: colors?.primary ?? defaultConfig.tokens.colors.primary,
                    secondary: colors?.secondary ?? defaultConfig.tokens.colors.secondary,
                    tertiary: colors?.tertiary ?? defaultConfig.tokens.colors.tertiary,
               },
          },
          components: {
               ...defaultConfig.components,
               Alert: {
                    theme: {
                         variants: {
                              action: {
                                   error: buildAlertTheme('error'),
                                   warning: buildAlertTheme('warning'),
                                   success: buildAlertTheme('success'),
                                   info: buildAlertTheme('info'),
                              },
                         },
                    },
               },
               ButtonText: {
                    ...defaultConfig.components.ButtonText,
                    theme: {
                         ...defaultConfig.components.ButtonText?.theme,
                         baseStyle: {
                              ...defaultConfig.components.ButtonText?.theme?.baseStyle,
                              fontSize: '$sm',
                              fontWeight: '$normal',
                         },
                    },
               },
               Badge: {
                    ...defaultConfig.components.Badge,
                    theme: {
                         ...defaultConfig.components.Badge?.theme,
                         variants: {
                              ...defaultConfig.components.Badge?.theme?.variants,
                              action: {
                                   ...(defaultConfig.components.Badge?.theme?.variants?.action ?? {}),
                                   error: buildBadgeTheme('error'),
                                   warning: buildBadgeTheme('warning'),
                                   success: buildBadgeTheme('success'),
                                   info: buildBadgeTheme('info'),
                                   muted: buildBadgeTheme('muted'),
                              },
                         },
                    },
               },
          },
     });
}

function normalizeThemeColors(response = []) {
     return {
          primary: response?.[0] ?? null,
          secondary: response?.[1] ?? null,
          tertiary: response?.[2] ?? null,
     };
}

export async function buildThemeForLibrary(toast, url = null) {
     const response = await getThemeInfo(toast, url);
     const themeColors = normalizeThemeColors(response);
     const theme = buildConfigFromColors(themeColors);
     return {
          theme,
          themeColors,
          themeId: Number(GLOBALS.themeId ?? 1),
     };
}

export function useThemeForDisplay() {
     const { themeColors, colorMode, textColor, themeId } = useThemeState();
     const theme = React.useMemo(() => {
          if (!themeColors?.primary || !themeColors?.secondary || !themeColors?.tertiary) {
               return defaultConfig;
          }
          return buildConfigFromColors(themeColors);
     }, [themeColors]);

     return {
          theme,
          themeColors,
          themeId,
          colorMode,
          textColor,
     };
}

export function useTheme() {
     const { theme, themeColors, themeId, colorMode, textColor } = useThemeForDisplay();
     const updateThemeColors = useUpdateThemeColors();
     const updateColorModeValue = useUpdateThemeColorMode();
     const updateTextColorValue = useUpdateThemeTextColor();
     const resetThemeState = useResetThemeState();

     const updateTheme = React.useCallback(async (data) => {
          const primary = data?.tokens?.colors?.primary;
          const secondary = data?.tokens?.colors?.secondary;
          const tertiary = data?.tokens?.colors?.tertiary;
          if (!primary || !secondary || !tertiary) {
               return;
          }
          await updateThemeColors(
               { primary, secondary, tertiary },
               Number(GLOBALS.themeId ?? 1)
          );
     }, [updateThemeColors]);

     const updateColorMode = React.useCallback(async (mode) => {
          await updateColorModeValue(mode);
          const nextTextColor = mode === 'light' ? '$warmGray600' : '$coolGray200';
          await updateTextColorValue(nextTextColor);
     }, [updateColorModeValue, updateTextColorValue]);

     const updateTextColor = React.useCallback(async (value) => {
          await updateTextColorValue(value);
     }, [updateTextColorValue]);

     const resetTheme = React.useCallback(async () => {
          await resetThemeState();
     }, [resetThemeState]);

     const forceRefreshTheme = React.useCallback(async (toast, url = null) => {
          const builtTheme = await buildThemeForLibrary(toast, url);
          await updateTheme(builtTheme.theme);
          return builtTheme;
     }, [updateTheme]);

     return {
          theme,
          themeColors,
          themeId,
          colorMode,
          textColor,
          updateTheme,
          updateColorMode,
          updateTextColor,
          resetTheme,
          forceRefreshTheme,
     };
}

export function UseColorMode(props) {
     const { showText } = props;
     const { colorMode, theme } = useThemeForDisplay();
     const updateTextColor = useUpdateThemeTextColor();
     const currentMode = colorMode === 'dark' ? 'wb-sunny' : 'nightlight-round';
     const currentColorMode = colorMode === 'dark' ? 'Dark' : 'Light';
     const currentModeB = colorMode === 'dark' ? 'nightlight-round' : 'wb-sunny';
     const iconColor = colorMode === 'dark' ? "$warmGray50" : "$coolGray700";
     const updateColorMode = useUpdateThemeColorMode();

     const switchColorMode = async () => {
          let newColorMode;
          if (colorMode === 'light') {
               newColorMode = 'dark';
          }else{
               newColorMode = 'light';
          }

          logDebugMessage("Switching color mode to: " + newColorMode);
          await updateColorMode(newColorMode);
          await updateTextColor(newColorMode === 'light' ? '$warmGray600' : '$coolGray200');
     };

     if (showText) {
          return (
               <HStack alignItems="center">
                    <Button onPress={switchColorMode} borderRadius="$full" size="sm" bg="transparent">
                         <ButtonIcon as={MaterialIcons} name={currentModeB} size="sm" color={theme.tokens.colors.primary['500']} />
                         <ButtonText fontSize="$sm" color={iconColor}> {currentColorMode}</ButtonText>
                    </Button>
               </HStack>
          );
     }

     return (
          <Box alignItems="center">
               <Button onPress={switchColorMode} borderRadius="$full" size="sm" bg="transparent">
                    <ButtonIcon as={MaterialIcons} name={currentMode} size="sm" color={theme.tokens.colors.primary['500']} />
               </Button>
          </Box>
     );
}

export const THEME_STALE_MS = 12 * 60 * 60 * 1000;
