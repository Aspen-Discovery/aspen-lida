import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import _ from 'lodash';
import { Alert, Box, Center, HStack, Pressable, Text, VStack, ScrollView, Button, ButtonText } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { checkVersion } from 'react-native-check-version';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext, UserContext, ThemeContext } from '../../../context/initialContext';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { GLOBALS } from '../../../util/globals';
import { useNavigation } from '@react-navigation/native';
import {logDebugMessage, logErrorMessage} from "../../../util/logging";

export const SupportScreen = () => {
     const navigation = useNavigation();
     const { accounts, userDebugMessage } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { location } = React.useContext(LibraryBranchContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const [status, setStatus] = React.useState({
          needsUpdate: false,
          url: null,
          latest: GLOBALS.appVersion,
          canOpenUrl: false,
     });

     const numLinkedAccounts = _.size(accounts) ?? 0;

     React.useEffect(() => {
          (async () => {
               let tmp = await checkStoreVersion();
               if (tmp.url) {
                    if (Linking.canOpenURL(tmp.url)) {
                         tmp = _.set(tmp, 'canOpenUrl', true);
                    }
               }
               setStatus(tmp);
          })();
     }, []);

     const openAppStore = () => {
          const supported = Linking.canOpenURL(status.url);
          if (supported) {
               Linking.openURL(status.url);
          } else {
               logDebugMessage("Opening app store is not supported " + supported);
          }
     };

     const enableDebugPanel = false;

     return (
          <Box safeArea={5}>
               <VStack space="$1" px="$4" py="$2">
                    <VStack justifyContent="space-between" py="$1">
                         <Text bold color={textColor}>
                              {getTermFromDictionary(language, 'app_name')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {' '}{GLOBALS.appVersion} {GLOBALS.appStage} b[{GLOBALS.appBuild}] p[{GLOBALS.appPatch}] c[{GLOBALS.releaseChannel}]
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'aspen_discovery')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {library.discoveryVersion}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'os_information')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {Device.osName} {Device.osVersion}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'device_information')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {Device.brand} {Device.modelName}, {Device.deviceYearClass}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'current_location')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {location.displayName}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'current_library')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {library.displayName}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'connected_to')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {library.baseUrl}
                         </Text>
                    </VStack>
                    <VStack justifyContent="space-between" py="$1">
                         <Text fontSize="$xs" bold color={textColor}>
                              {getTermFromDictionary(language, 'num_linked_accounts')}
                         </Text>
                         <Text color={colorMode === 'light' ? "$coolGray600" : "$warmGray400" }>
                              {numLinkedAccounts}
                         </Text>
                    </VStack>
                    {enableDebugPanel ? (
                         <VStack justifyContent="space-between" py="$1">
                              <Text fontSize="$xs" bold color={textColor}>
                                   Support Log
                              </Text>
                              <ScrollView>
                                   <Box>
                                        <Text color={textColor} mt="$5" fontSize="$xs" mb="$5">
                                             {userDebugMessage.join('\n')}
                                        </Text>
                                   </Box>
                              </ScrollView>
                         </VStack>
                    ) : null}
               </VStack>
               <Center pt={5}>
                    <Button bg={theme.tokens.colors.secondary['500']} onPress={() => navigation.navigate('MyDevice_APIErrorLog')}>
                         <ButtonText color={theme.tokens.colors.secondary['500-text']}>{getTermFromDictionary(language, 'open_api_error_log')}</ButtonText>
                    </Button>
               </Center>
               {status.needsUpdate ? (
                    <Center mt={5}>
                         <Alert variant="left-accent" width="$full" status="warning">
                              <VStack space={2} flexShrink={1} width="$full">
                                   <HStack flexShrink={1} space={2} alignItems="center" justifyContent="space-between">
                                        <HStack flexShrink={1} space={2} alignItems="center">
                                             <Alert.Icon />
                                             <Text fontSize="md" fontWeight="medium" color="coolGray.800">
                                                  {status.latest} Is Available
                                             </Text>
                                        </HStack>
                                   </HStack>
                                   <Box
                                        pl="6"
                                        _text={{
                                             color: 'coolGray.600',
                                        }}>
                                        Please update your app for the latest features and fixes.
                                        {status.canOpenUrl ? (
                                             <Pressable mt={3} variant="ghost" onPress={() => openAppStore(status.url)}>
                                                  <Text bold>Update now</Text>
                                             </Pressable>
                                        ) : null}
                                   </Box>
                              </VStack>
                         </Alert>
                    </Center>
               ) : null}
          </Box>
     );
};

async function checkStoreVersion() {
     try {
          const version = await checkVersion({
               bundleId: GLOBALS.bundleId,
               currentVersion: GLOBALS.appVersion,
          });
          if (version.needsUpdate) {
               let url = (url = GLOBALS.iosStoreUrl);
               if (Platform.OS === 'android') {
                    url = GLOBALS.androidStoreUrl;
               }
               return {
                    needsUpdate: true,
                    url: url,
                    latest: version.version,
               };
          }
     } catch (e) {
          logErrorMessage(e);
     }

     return {
          needsUpdate: false,
          url: null,
          latest: GLOBALS.appVersion,
     };
}
