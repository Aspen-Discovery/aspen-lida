import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import {Box, ButtonGroup, Button, ButtonText, ButtonIcon, Center, Icon, useToken, useToast} from '@gluestack-ui/themed';
import { useColorModeValue } from '../../themes/theme';
import React from 'react';
import { showLocation } from 'react-native-map-link';
import { popToast } from '../../components/loadError';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';

// custom components and helper files
import { logDebugMessage, logErrorMessage } from '../../util/logging';

const ContactButtons = (data) => {
     const { library } = React.useContext(LibrarySystemContext);
     const location = data.data;
     const { language } = React.useContext(LanguageContext);
     const { textColor: themeTextColor, colorMode } = React.useContext(ThemeContext);
     const toast = useToast();

     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));

     const callLibrary = () => {
          /* location.phone */
          const phoneNumber = `tel:${location.phone}`;
          Linking.openURL(phoneNumber);
     };

     const emailLibrary = () => {
          /* location.email */
          const emailAddress = `mailto:${location.email}`;
          Linking.openURL(emailAddress);
     };

     const visitWebsite = async () => {
          /* location.homeLink */

          const browserParams = {
               enableDefaultShareMenuItem: false,
               presentationStyle: 'automatic',
               showTitle: false,
               toolbarColor: backgroundColor,
               controlsColor: textColor,
               secondaryToolbarColor: backgroundColor,
          };

          if (location.homeLink === '/') {
               await WebBrowser.openBrowserAsync(location.baseUrl, browserParams)
                    .then((res) => {
                         logDebugMessage(res);
                         if (res.type === 'cancel' || res.type === 'dismiss') {
                              logDebugMessage('User closed or dismissed window.');
                              WebBrowser.dismissBrowser();
                              WebBrowser.coolDownAsync();
                         }
                    })
                    .catch(async (err) => {
                         if (err.message === 'Another WebBrowser is already being presented.') {
                              try {
                                   WebBrowser.dismissBrowser();
                                   WebBrowser.coolDownAsync();
                                   await WebBrowser.openBrowserAsync(location.baseUrl, browserParams)
                                        .then((response) => {
                                             logDebugMessage(response);
                                             if (response.type === 'cancel') {
                                                  logDebugMessage('User closed window.');
                                             }
                                        })
                                        .catch(async (error) => {
                                             logDebugMessage('Unable to close previous browser session.');
                                        });
                              } catch (error) {
                                   logDebugMessage('Really borked.');
                                   logError(error);
                              }
                         } else {
                              popToast(toast, getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                              logErrorMessage(err);
                         }
                    });
          } else {
               await WebBrowser.openBrowserAsync(location.homeLink, browserParams)
                    .then((res) => {
                         logDebugMessage(res);
                         if (res.type === 'cancel' || res.type === 'dismiss') {
                              logDebugMessage('User closed or dismissed window.');
                              WebBrowser.dismissBrowser();
                              WebBrowser.coolDownAsync();
                         }
                    })
                    .catch(async (err) => {
                         if (err.message === 'Another WebBrowser is already being presented.') {
                              try {
                                   WebBrowser.dismissBrowser();
                                   WebBrowser.coolDownAsync();
                                   await WebBrowser.openBrowserAsync(location.homeLink, browserParams)
                                        .then((response) => {
                                             logDebugMessage(response);
                                             if (response.type === 'cancel') {
                                                  logDebugMessage('User closed window.');
                                             }
                                        })
                                        .catch(async (error) => {
                                             logDebugMessage('Unable to close previous browser session.');
                                        });
                              } catch (error) {
                                   logDebugMessage('Really borked.');
                                   logErrorMessage(error);
                              }
                         } else {
                              popToast(toast, getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                              logErrorMessage(err);
                         }
                    });
          }
     };

     const getDirections = async () => {
          /* location.latitude & location.longitude */
          const sourceLatitude = await SecureStore.getItemAsync('latitude');
          const sourceLongitude = await SecureStore.getItemAsync('longitude');
          if (sourceLatitude && sourceLongitude && sourceLatitude !== '0' && sourceLongitude !== '0') {
               showLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    sourceLatitude,
                    sourceLongitude,
                    googleForceLatLon: true,
               });
          } else {
               showLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    googleForceLatLon: true,
               });
          }
     };

     if (location.phone || location.email || location.homeLink || location.latitude !== 0) {
          return (
               <Box mb={4}>
                    <ButtonGroup flexWrap="wrap" size="sm" justifyContent="space-between">
                         {location.phone ? (
                              <Button
                                   variant="outline"
                                   width="23%"
                                   onPress={() => callLibrary()}
                                   style={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        paddingHorizontal: 2,
                                        height: 'auto',
                                        borderColor: colorMode === 'light' ? "$coolGray600" : "$warmGray200",
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="call" size="md" color={colorMode === 'light' ? "$coolGray600" : "$warmGray200"} />
                                   </Center>
                                   <ButtonText color={themeTextColor} style={{ textAlign: 'center', fontSize: 10 }}>{getTermFromDictionary(language, 'call_the_library')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.email ? (
                              <Button
                                   variant="outline"
                                   width="23%"
                                   onPress={() => emailLibrary()}
                                   style={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        paddingHorizontal: 2,
                                        height: 'auto',
                                        borderColor: colorMode === 'light' ? "$coolGray600" : "$warmGray200",
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="email" size="md" color={colorMode === 'light' ? "$coolGray600" : "$warmGray200"} />
                                   </Center>
                                   <ButtonText color={themeTextColor} style={{ textAlign: 'center', fontSize: 10 }}>{getTermFromDictionary(language, 'email_a_librarian')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.latitude !== 0 ? (
                              <Button
                                   variant="outline"
                                   width="23%"
                                   onPress={() => getDirections()}
                                   style={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        paddingHorizontal: 2,
                                        height: 'auto',
                                        borderColor: colorMode === 'light' ? "$coolGray600" : "$warmGray200",
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="map" size="md" color={colorMode === 'light' ? "$coolGray600" : "$warmGray200"} />
                                   </Center>
                                   <ButtonText color={themeTextColor} style={{ textAlign: 'center', fontSize: 10 }}>{getTermFromDictionary(language, 'get_directions')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.homeLink ? (
                              <Button
                                   variant="outline"
                                   width="23%"
                                   onPress={() => visitWebsite()}
                                   style={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        paddingHorizontal: 2,
                                        height: 'auto',
                                        borderColor: colorMode === 'light' ? "$coolGray600" : "$warmGray200",
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="home" size="md" color={colorMode === 'light' ? "$coolGray600" : "$warmGray200"} />
                                   </Center>
                                   <ButtonText color={themeTextColor} style={{ textAlign: 'center', fontSize: 10 }}>{getTermFromDictionary(language, 'visit_our_website')}</ButtonText>
                              </Button>
                         ) : null}
                    </ButtonGroup>
               </Box>
          );
     }

     return null;
};

export default ContactButtons;
