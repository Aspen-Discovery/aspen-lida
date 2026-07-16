import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useToken, Box, createConfig, HStack, Icon, Button, ButtonIcon, ButtonText, Text, useColorMode, ChevronLeftIcon } from '@gluestack-ui/themed';
import { config as defaultConfig } from '@gluestack-ui/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/initialContext';

import { logDebugMessage, logInfoMessage, logErrorMessage } from '../util/logging.js';
import { getThemeInfo } from '../util/api/system';

export function useColorModeValue(lightValue, darkValue) {
     const { colorMode } = React.useContext(ThemeContext);
     return colorMode === 'dark' ? darkValue : lightValue;
}

export const BackIcon = (props) => {
     const { theme } = React.useContext(ThemeContext);
     return <ChevronLeftIcon size="md" ml={1} {...props} color={theme['tokens']['colors']['primary']['baseContrast']} />;
};

export async function createTheme(colorMode) {
     const response = await getThemeInfo();
     const theme = createConfig({
          ...defaultConfig,
          tokens: {
               ...defaultConfig.tokens,
               colors: {
                    primary: response[0],
                    secondary: response[1],
                    tertiary: response[2],
               },
          },
     });
     logDebugMessage('Theme created and saved.');
     return theme;
}

export async function createGlueTheme(url) {
     const response = await getThemeInfo(url);
     const theme = createConfig({
          ...defaultConfig,
          tokens: {
               ...defaultConfig.tokens,
               colors: {
                    primary: response[0],
                    secondary: response[1],
                    tertiary: response[2],
               },
          },

     });
     return theme;
}

export async function saveTheme(response) {
     if (response && response.tokens && response.tokens.colors) {

          const primaryColors = ['primaryColors', JSON.stringify(response.tokens.colors.primary)];
          const secondaryColors = ['secondaryColors', JSON.stringify(response.tokens.colors.secondary)];
          const tertiaryColors = ['tertiaryColors', JSON.stringify(response.tokens.colors.tertiary)];

          try {
               await AsyncStorage.multiSet([primaryColors, secondaryColors, tertiaryColors]).then((r) => {
                    logDebugMessage('Essential colors stored in async storage in theme.js');
               });
          } catch (e) {
               //save error
               logErrorMessage('Unable to save essential colors to async storage in theme.js');
               logErrorMessage(e);
          }
     }else{
          logErrorMessage("No response provided for saving theme or invalid structure");
     }
}

export async function fetchTheme() {
     let colors;
     try {
          colors = await AsyncStorage.multiGet(['primaryColors', 'secondaryColors', 'tertiaryColors']);
          const jsonValue = await AsyncStorage.getItem('primaryColors');
          const parsedJson = JSON.parse(jsonValue);
          logDebugMessage('Essential colors fetched from async storage.');
          return colors;
     } catch (e) {
          logErrorMessage('Unable to fetch essential colors from async storage.');
          logErrorMessage(e);
     }
}

export function UseColorMode(props) {
     const { showText } = props;
     const { colorMode } = React.useContext(ThemeContext);
     const currentMode = colorMode === 'dark' ? 'wb-sunny' : 'nightlight-round';
     const toggledColorMode = (colorMode === 'dark' ? 'light' : 'dark');
     const currentColorMode = colorMode === 'dark' ? 'Dark' : 'Light';
     const currentModeB = colorMode === 'dark' ? 'nightlight-round' : 'wb-sunny';
     const darkText = useToken('colors', 'textLight800');
     const lightText = useToken('colors', 'textLight50');
     const iconColor = colorMode === 'dark' ? "$warmGray50" : "$coolGray700";
     const { updateColorMode, updateTextColor, theme } = React.useContext(ThemeContext);

     const switchColorMode = async () => {
          let newColorMode;
          if (colorMode === 'light') {
               newColorMode = 'dark';
          }else{
               newColorMode = 'light';
          }

          logDebugMessage("Switching color mode to: " + newColorMode);
          updateColorMode(newColorMode);
          await AsyncStorage.setItem('@colorMode', newColorMode);
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
