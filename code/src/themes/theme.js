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

function buildConfigFromColors(colors) {
     return createConfig({
          ...defaultConfig,
          tokens: {
               ...defaultConfig.tokens,
               colors: {
                    primary: colors?.primary ?? defaultConfig.tokens.colors.primary,
                    secondary: colors?.secondary ?? defaultConfig.tokens.colors.secondary,
                    tertiary: colors?.tertiary ?? defaultConfig.tokens.colors.tertiary,
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
          const nextTextColor = mode === 'dark' ? 'textLight50' : 'textLight950';
          await updateTextColorValue(nextTextColor);
     }, [updateColorModeValue, updateTextColorValue]);

     const updateTextColor = React.useCallback(async (value) => {
          await updateTextColorValue(value);
     }, [updateTextColorValue]);

     const resetTheme = React.useCallback(async () => {
          await resetThemeState();
     }, [resetThemeState]);

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
     };
}

export function UseColorMode(props) {
     const { showText } = props;
     const { colorMode, theme } = useThemeForDisplay();
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
