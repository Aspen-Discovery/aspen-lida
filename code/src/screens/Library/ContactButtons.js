import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Box, ButtonGroup, Button, ButtonText, ButtonIcon, Center, Icon, useToken } from '@gluestack-ui/themed';
import { useColorModeValue } from '../../themes/theme';
import React from 'react';
import { showLocation } from 'react-native-map-link';
import { popToast } from '../../components/loadError';
import { LanguageContext, LibrarySystemContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';

// custom components and helper files
import { PATRON } from '../../util/globals';
import { logDebugMessage, logErrorMessage } from '../../util/logging';

const ContactButtons = (data) => {
     const { library } = React.useContext(LibrarySystemContext);
     const location = data.data;
     const { language } = React.useContext(LanguageContext);

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
                              popToast(getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
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
                              popToast(getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                              logErrorMessage(err);
                         }
                    });
          }
     };

     const getDirections = async () => {
          /* location.latitude & location.longitude */
          if (PATRON.coords.lat && PATRON.coords.long && PATRON.coords.lat !== 0 && PATRON.coords.long !== 0) {
               showLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    sourceLatitude: PATRON.coords.lat,
                    sourceLongitude: PATRON.coords.long,
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
                    <ButtonGroup flexWrap="wrap" size="sm" justifyContent="space-between" variant="outline">
                         {location.phone ? (
                              <Button
                                   width="23%"
                                   onPress={() => callLibrary()}
                                   _text={{
                                        padding: 0,
                                        textAlign: 'center',
                                        fontSize: '$xs',
                                        color: useColorModeValue('coolGray.600', 'warmGray.200'),
                                   }}
                                   style={{
                                        flex: 1,
                                        flexWrap: 'wrap',
                                        alignContent: 'center',
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="call" size="md" color="$coolGray600" _dark={{ color: 'warmGray.200' }} />
                                   </Center>
                                   <ButtonText>{getTermFromDictionary(language, 'call_the_library')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.email ? (
                              <Button
                                   width="23%"
                                   onPress={() => emailLibrary()}
                                   _text={{
                                        padding: 0,
                                        textAlign: 'center',
                                        fontSize: '$xs',
                                        color: useColorModeValue('coolGray.600', 'warmGray.200'),
                                   }}
                                   style={{
                                        flex: 1,
                                        flexWrap: 'wrap',
                                        alignContent: 'center',
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="email" size="md" color="$coolGray600" _dark={{ color: 'warmGray.200' }} />
                                   </Center>
                                   <ButtonText>{getTermFromDictionary(language, 'email_a_librarian')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.latitude !== 0 ? (
                              <Button
                                   width="23%"
                                   onPress={() => getDirections()}
                                   _text={{
                                        padding: 0,
                                        textAlign: 'center',
                                        fontSize: 'xs',
                                        color: useColorModeValue('coolGray.600', 'warmGray.200'),
                                   }}
                                   style={{
                                        flex: 1,
                                        flexWrap: 'wrap',
                                        alignContent: 'center',
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="map" size="md" color="$coolGray600" _dark={{ color: 'warmGray.200' }} />
                                   </Center>
                                   <ButtonText>{getTermFromDictionary(language, 'get_directions')}</ButtonText>
                              </Button>
                         ) : null}
                         {location.homeLink ? (
                              <Button
                                   width="23%"
                                   onPress={() => visitWebsite()}
                                   _text={{
                                        padding: 0,
                                        textAlign: 'center',
                                        fontSize: 'xs',
                                        color: useColorModeValue('coolGray.600', 'warmGray.200'),
                                   }}
                                   style={{
                                        flex: 1,
                                        flexWrap: 'wrap',
                                        alignContent: 'center',
                                   }}>
                                   <Center>
                                        <Icon as={MaterialIcons} name="home" size="md" color="$coolGray600" _dark={{ color: 'warmGray.200' }} />
                                   </Center>
                                   <ButtonText>{getTermFromDictionary(language, 'visit_our_website')}</ButtonText>
                              </Button>
                         ) : null}
                    </ButtonGroup>
               </Box>
          );
     }

     return null;
};

export default ContactButtons;
