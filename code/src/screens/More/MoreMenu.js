import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { ListItem } from '@rneui/themed';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import moment from 'moment';
import {
     Box,
     Divider,
     FlatList,
     HStack,
     Icon,
     Pressable,
     ScrollView,
     Heading,
     Button,
     Text,
     VStack,
     Modal,
     ModalBackdrop,
     ModalContent,
     ModalHeader,
     ModalFooter,
     ModalCloseButton, CloseIcon, ModalBody, ButtonText, ButtonGroup
} from '@gluestack-ui/themed';
import React from 'react';
import { popToast } from '../../components/loadError';
import { AuthContext } from '../../context/AuthContext';
import {
     LanguageContext,
     LibraryBranchContext,
     LibrarySystemContext,
     ThemeContext,
} from '../../context/initialContext';
import { navigate } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { deleteAspenUser } from '../../util/api/user';
import { GLOBALS, LIBRARY } from '../../util/globals';
import { logDebugMessage, logErrorMessage, logInfoMessage } from '../../util/logging';

export const MoreMenu = () => {
     const { language } = React.useContext(LanguageContext);
     const { locations } = React.useContext(LibraryBranchContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { menu } = React.useContext(LibrarySystemContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);

     const { signOut } = React.useContext(AuthContext);
     const hasMenuItems = _.size(menu);
     const navigation = useNavigation();
     const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = React.useState(false);
     const [showDeleteResultsModal, setShowDeleteResultsModal] = React.useState(false);
     const [deleteResults, setDeleteResults] = React.useState('');
     const [deleting, setDeleting] = React.useState(false);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: null,
          });
     }, [navigation]);

     const initiateDeleteAspenUser = async () => {
          setDeleting(true);
          await deleteAspenUser(library.baseUrl).then((results) => {
               setDeleteResults(results);
          })

     }

     const toggleDeleteConfirmationModal = () => {
          setShowDeleteConfirmationModal(!showDeleteConfirmationModal);
     };

     const toggleDeleteResultsModal = () => {
          setShowDeleteResultsModal(!showDeleteResultsModal);
     };

     return (
          <ScrollView>
               <Box>
                    <VStack space="md" my="$2" mx="$1">
                         <MyLibrary />
                         <Divider />

                         <VStack divider={<Divider />} space="md">
                              {hasMenuItems > 0 ? (
                                   Object.keys(menu).map((item) => (
                                        <MenuLink key={item} links={menu[item]} />
                                   ))
                              ) : null}
                              <VStack space="md">
                                   <VStack>
                                        <ViewAllLocations />
                                        <Settings />
                                        <PrivacyPolicy />
                                        {library.catalogRegistrationCapabilities?.enableSelfRegistration === '1' && library.catalogRegistrationCapabilities.enableSelfRegistrationInApp === '1' ? (
                                        <Pressable px="$2" py="$3" onPress={toggleDeleteConfirmationModal}>
                                             <HStack space="sm" alignItems="center">
                                                  <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} onPress={() => setShowDeleteConfirmationModal(true)}/>
                                                  <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'delete_account')}</Text>
                                             </HStack>
                                        </Pressable>
                                        ) : null}
                                   </VStack>
                              </VStack>
                         </VStack>
                    </VStack>
                    <Modal isOpen={showDeleteConfirmationModal} onClose={toggleDeleteConfirmationModal}>
                         <ModalBackdrop />
                         <ModalContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                              <ModalHeader>
                                   <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'delete_account')}</Heading>
                                   <ModalCloseButton p="$3">
                                        <Icon as={CloseIcon} color={textColor} />
                                   </ModalCloseButton>
                              </ModalHeader>
                              <ModalBody>
                                   <Text color={textColor}>
                                        {getTermFromDictionary(language, 'confirm_delete_account_message')}
                                   </Text>
                              </ModalBody>
                              <ModalFooter>
                                   <ButtonGroup>
                                        <Button variant="outline" borderColor={theme.tokens.colors.primary['500']} onPress={toggleDeleteConfirmationModal}>
                                             <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                        </Button>
                                        <Button
                                             bgColor={theme.tokens.colors.primary['500']}
                                            isLoading={deleting}
                                            isLoadingText={getTermFromDictionary(language, 'deleting', true)}
                                            onPress={async () => {
                                                 await initiateDeleteAspenUser().then(() => {
                                                      setShowDeleteConfirmationModal(false);
                                                      setShowDeleteResultsModal(true);
                                                 });
                                            }}>
                                             <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'confirm_delete_account')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </ModalFooter>
                         </ModalContent>
                    </Modal>
                    <Modal isOpen={showDeleteResultsModal}>
                         <ModalBackdrop/>
                         <ModalContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                              <ModalHeader>
                                   <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'delete_account')}</Heading>
                                   <ModalCloseButton p="$3">
                                        <Icon as={CloseIcon} color={textColor} />
                                   </ModalCloseButton>
                              </ModalHeader>
                              <ModalBody>
                                   {deleteResults?.message ? (
                                       <Text color={textColor}>{deleteResults.message}</Text>
                                   ) : (
                                       <Text color={textColor}>{getTermFromDictionary(language, 'error_deleting_account')}</Text>
                                   )}
                              </ModalBody>
                              <ModalFooter>
                                        {deleteResults.success === true ? (
                                            <Button bgColor={theme.tokens.colors.primary['500']} onPress={signOut}>
                                                 <ButtonText color={theme.tokens.colors.primary['500-text']} >{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                            </Button>
                                        ) : (
                                            <Button bgColor={theme.tokens.colors.primary['500']}  variant="primary" onPress={toggleDeleteResultsModal}>
                                                 <ButtonText color={theme.tokens.colors.primary['500-text']} >{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                            </Button>
                                        )}

                              </ModalFooter>
                         </ModalContent>
                    </Modal>
               </Box>
          </ScrollView>
     );
};

const MyLibrary = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { location } = React.useContext(LibraryBranchContext);
     const { language } = React.useContext(LanguageContext);

     const { textColor, theme, colorMode } = React.useContext(ThemeContext);

     let isClosedToday = false;
     let hoursLabel = '';
     if (location.hours) {
          const day = moment().day();
          if (_.find(location.hours, _.matchesProperty('day', day))) {
               let todaysHours = _.filter(location.hours, { day: day });
               if (todaysHours[0]) {
                    todaysHours = todaysHours[0];
                    if (todaysHours.isClosed) {
                         isClosedToday = true;
                         hoursLabel = getTermFromDictionary(language, 'location_closed');
                    } else {
                         const closingText = todaysHours.close;
                         const time1 = closingText.split(':');
                         const openingText = todaysHours.open;
                         const time2 = openingText.split(':');
                         const closeTime = moment().set({ hour: time1[0], minute: time1[1] });
                         const openTime = moment().set({ hour: time2[0], minute: time2[1] });
                         const nowTime = moment();
                         const stillOpen = moment(nowTime).isBefore(closeTime);
                         const stillClosed = moment(openTime).isBefore(nowTime);
                         if (!stillOpen) {
                              isClosedToday = true;
                              hoursLabel = getTermFromDictionary(language, 'location_closed');
                         }
                         if (!stillClosed) {
                              isClosedToday = true;
                              let openingTime = moment(openTime).format('h:mm A');
                              hoursLabel = 'Closed until ' + openingTime;
                         } else {
                              let closingTime = moment(closeTime).format('h:mm A');
                              hoursLabel = 'Open until ' + closingTime;
                         }
                    }
               }
          }
     }

     return (
          <Box m="$4" bgColor={theme['tokens']['colors']['primary']['400']} p="$6" borderRadius="$xl">
               <Pressable display="flex" flexDirection="row" onPress={() => navigate('MyLibrary')} space="sm" alignItems="center" justifyContent="space-between">
                    <VStack>
                         <Text bold fontSize="$md" color={theme['tokens']['colors']['primary']['400-text']}>
                              {library.displayName}
                         </Text>
                         {library.displayName !== location.displayName ? (
                              <Text bold color={theme['tokens']['colors']['primary']['400-text']}>
                                   {location.displayName}
                              </Text>
                         ) : null}
                         {hoursLabel ? <Text color={theme['tokens']['colors']['primary']['400-text']}>{hoursLabel}</Text> : null}
                    </VStack>
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={theme['tokens']['colors']['primary']['400-text']} />
               </Pressable>
          </Box>
     );
};

const ViewAllLocations = () => {
     const { language } = React.useContext(LanguageContext);
     const { locations } = React.useContext(LibraryBranchContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);

     if (_.size(locations) > 1) {
          return (
               <Pressable px="2$" py="$3" onPress={() => navigate('AllLocations')}>
                    <HStack space="sm" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor}/>
                         <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'view_all_locations')}</Text>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const Settings = () => {
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);

     return (
          <Pressable px="$2" py="$3" onPress={() => navigate('MyPreferences')}>
               <HStack space="sm" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'preferences')}</Text>
               </HStack>
          </Pressable>
     );
};

const DeleteAccount = () => {
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);

     return (
         <Pressable px="$2" py="$3" onPress={() => navigate('MyPreferences')}>
              <HStack space="sm" alignItems="center">
                   <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor}/>
                   <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'preferences')}</Text>
              </HStack>
         </Pressable>
     );
};

const PrivacyPolicy = () => {
     const { language } = React.useContext(LanguageContext);

     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const backgroundColor = colorMode === 'light' ? "$warmGray200" : "$coolGray900";

     const browserParams = {
          enableDefaultShareMenuItem: false,
          presentationStyle: 'automatic',
          showTitle: false,
          toolbarColor: backgroundColor,
          controlsColor: textColor,
          secondaryToolbarColor: backgroundColor,
     };

     const openURL = async () => {
          const url = appendQuery(LIBRARY.appSettings?.privacyPolicy ?? GLOBALS.privacyPolicy, 'minimalInterface=true');
          logInfoMessage(url);
          await WebBrowser.openBrowserAsync(url, browserParams)
               .then((res) => {
                    logDebugMessage(res);
                    if (res.type === 'cancel' || res.type === 'dismiss') {
                         logDebugMessage('User closed window.');
                         WebBrowser.dismissBrowser();
                         WebBrowser.coolDownAsync();
                    }
               })
               .catch(async (err) => {
                    if (err.message === 'Another WebBrowser is already being presented.') {
                         try {
                              WebBrowser.dismissBrowser();
                              WebBrowser.coolDownAsync();
                              await WebBrowser.openBrowserAsync(url, browserParams)
                                   .then((response) => {
                                        logDebugMessage(response);
                                        if (response.type === 'cancel') {
                                             logDebugMessage('User closed window.');
                                        }
                                   })
                                   .catch(async (error) => {
                                        logDebugMessage('Unable to close previous browser session.');
                                        logErrorMessage(error);
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
     };

     return (
          <Pressable px="$2" py="$3" onPress={() => openURL()}>
               <HStack space="sm" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                    <Text fontWeight="$medium" color={textColor}>{getTermFromDictionary(language, 'privacy_policy')}</Text>
               </HStack>
          </Pressable>
     );
};

const MenuLink = (payload) => {
     const { library } = React.useContext(LibrarySystemContext);
     const categories = payload.links;
     let hasMultiple = false;
     if (_.size(categories) > 1) {
          hasMultiple = true;
     }
     let categoryLabel = _.sample(categories);
     categoryLabel = categoryLabel.category;

     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const backgroundColor = colorMode === 'light' ? "$warmGray200" : "$coolGray900";

     const browserParams = {
          enableDefaultShareMenuItem: false,
          presentationStyle: 'automatic',
          showTitle: false,
          toolbarColor: backgroundColor,
          controlsColor: textColor,
          secondaryToolbarColor: backgroundColor,
     };

     const [expanded, setExpanded] = React.useState(false);

     function isValidHttpUrl(str) {
          if (str.startsWith('http://') || str.startsWith('https://')) {
               return true;
          }
          return false;
     }

     const openURL = async (url) => {
          const browserParams = {
               enableDefaultShareMenuItem: false,
               presentationStyle: 'automatic',
               showTitle: false,
               toolbarColor: backgroundColor,
               controlsColor: textColor,
               secondaryToolbarColor: backgroundColor,
          };

          let formattedUrl = url;
          if (!isValidHttpUrl(url)) {
               /* Assume the URL is a relative one to Aspen Discovery */
               logDebugMessage('URL not valid!');
               formattedUrl = _.trimEnd(library.baseUrl, '/') + '/' + _.trimStart(url, '/');
          }
          if (formattedUrl.includes(library.baseUrl)) {
               /* If Aspen Discovery, append minimalInterface to clean up the UI */
               formattedUrl = appendQuery(formattedUrl, 'minimalInterface=true');
          }

          await WebBrowser.openBrowserAsync(formattedUrl, browserParams)
               .then(async (res) => {
                    logInfoMessage(res);
                    if (res.type === 'cancel' || res.type === 'dismiss') {
                         logDebugMessage('User closed window.');
                         WebBrowser.dismissBrowser();
                         WebBrowser.coolDownAsync();
                    }
               })
               .catch(async (err) => {
                    if (err.message === 'Another WebBrowser is already being presented.') {
                         try {
                              WebBrowser.dismissBrowser();
                              WebBrowser.coolDownAsync();
                              await WebBrowser.openBrowserAsync(formattedUrl, browserParams)
                                   .then(async (response) => {
                                        logDebugMessage(response);
                                        if (response.type === 'cancel' || response.type === 'dismiss') {
                                             logDebugMessage('User closed window.');
                                             WebBrowser.dismissBrowser();
                                             WebBrowser.coolDownAsync();
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
     };

     if (hasMultiple) {
          return (
               <>
                    <ListItem.Accordion
                         containerStyle={{
                              backgroundColor: 'transparent',
                              paddingBottom: 2,
                              paddingLeft: 0,
                              paddingTop: 0,
                         }}
                         content={
                              <>
                                   <HStack space="sm" alignItems="center" px="$2" py="$3">
                                        <Icon as={expanded ? Entypo : MaterialIcons} name={expanded ? 'chevron-small-down' : 'chevron-right'} size="lg" color={textColor} />
                                        <VStack width="$full">
                                             <Text fontWeight="$medium" color={textColor}>{categoryLabel}</Text>
                                        </VStack>
                                   </HStack>
                              </>
                         }
                         noIcon={true}
                         isExpanded={expanded}
                         onPress={() => {
                              setExpanded(!expanded);
                         }}>
                         {_.map(categories, function (item, index) {
                              return (
                                   <ListItem
                                        key={index}
                                        containerStyle={{
                                             backgroundColor: 'transparent',
                                             paddingTop: 1,
                                        }}
                                        borderBottom
                                        onPress={() => openURL(item.url)}>
                                        <HStack space="sm" alignItems="center" ml="$4">
                                             <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                                             <VStack width="$full">
                                                  <Text fontWeight="$medium" color={textColor}>{item.linkText}</Text>
                                             </VStack>
                                        </HStack>
                                   </ListItem>
                              );
                         })}
                    </ListItem.Accordion>
               </>
          );
     }

     return (
          <>
               {_.map(categories, function (item, index) {
                    return (
                         <Pressable key={index} px="$2" py="$3" borderRadius="$md" onPress={() => openURL(item.url)}>
                              <HStack space="sm" alignItems="center">
                                   <Icon as={MaterialIcons} name="chevron-right" size="lg" color={textColor} />
                                   <VStack width="$full">
                                        <Text fontWeight="$medium" color={textColor}>{item.linkText}</Text>
                                   </VStack>
                              </HStack>
                         </Pressable>
                    );
               })}
          </>
     );
};

function appendQuery(url, query) {
     let newQuery = _.trim(query, '?&');

     if (newQuery) {
          let glue = url.includes('?') === false ? '?' : '&';
          return url + glue + newQuery;
     }

     return url;
}
