import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { ListItem } from '@rneui/themed';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import moment from 'moment';
import { Box, Divider, FlatList, HStack, Icon, Pressable, ScrollView, Heading, Button, Text, useColorModeValue, useToken, VStack, Modal } from 'native-base';
import React from 'react';
import { popAlert, popToast } from '../../components/loadError';
import { AuthContext } from '../../components/navigation';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext } from '../../context/initialContext';
import { navigate } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { createList } from '../../util/api/list';
import { deleteAspenUser } from '../../util/api/user';
import { GLOBALS } from '../../util/globals';
import { LIBRARY } from '../../util/loadLibrary';

export const MoreMenu = () => {
     const { language } = React.useContext(LanguageContext);
     const { locations } = React.useContext(LibraryBranchContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { menu } = React.useContext(LibrarySystemContext);
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
                    <VStack space="4" my="2" mx="1">
                         <MyLibrary />
                         <Divider />

                         <VStack divider={<Divider />} space="4">
                              {hasMenuItems > 0 ? <FlatList data={Object.keys(menu)} renderItem={({ item }) => <MenuLink links={menu[item]} />} /> : null}
                              <VStack space="3">
                                   <VStack>
                                        <ViewAllLocations />
                                        <Settings />
                                        <PrivacyPolicy />
                                        {library.catalogRegistrationCapabilities?.enableSelfRegistration === '1' && library.catalogRegistrationCapabilities.enableSelfRegistrationInApp === '1' ? (
                                        <Pressable px="2" py="3" onPress={toggleDeleteConfirmationModal}>
                                             <HStack space="1" alignItems="center">
                                                  <Icon as={MaterialIcons} name="chevron-right" size="7" onPress={() => setShowDeleteConfirmationModal(true)}/>
                                                  <Text fontWeight="500">{getTermFromDictionary(language, 'delete_account')}</Text>
                                             </HStack>
                                        </Pressable>
                                        ) : null}
                                   </VStack>
                              </VStack>
                         </VStack>
                    </VStack>
                    <Modal isOpen={showDeleteConfirmationModal} onClose={toggleDeleteConfirmationModal}>
                         <Modal.Content bg="white" _dark={{ bg: 'coolGray.800' }}>
                              <Modal.CloseButton />
                              <Modal.Header>
                                   <Heading size="md">{getTermFromDictionary(language, 'delete_account')}</Heading>
                              </Modal.Header>
                              <Modal.Body>
                                   <Text>
                                        {getTermFromDictionary(language, 'confirm_delete_account_message')}
                                   </Text>
                              </Modal.Body>
                              <Modal.Footer>
                                   <Button.Group>
                                        <Button variant="outline" onPress={toggleDeleteConfirmationModal}>
                                             {getTermFromDictionary(language, 'cancel')}
                                        </Button>
                                        <Button
                                            isLoading={deleting}
                                            isLoadingText={getTermFromDictionary(language, 'deleting', true)}
                                            onPress={async () => {
                                                 await initiateDeleteAspenUser().then(() => {
                                                      setShowDeleteConfirmationModal(false);
                                                      setShowDeleteResultsModal(true);
                                                 });
                                            }}>
                                             {getTermFromDictionary(language, 'confirm_delete_account')}
                                        </Button>
                                   </Button.Group>
                              </Modal.Footer>
                         </Modal.Content>
                    </Modal>
                    <Modal isOpen={showDeleteResultsModal}>
                         <Modal.Content bg="white" _dark={{ bg: 'coolGray.800' }}>
                              <Modal.CloseButton />
                              <Modal.Header>
                                   <Heading size="md">{getTermFromDictionary(language, 'delete_account')}</Heading>
                              </Modal.Header>
                              <Modal.Body>
                                   {deleteResults?.message ? (
                                       <Text>{deleteResults.message}</Text>
                                   ) : (
                                       <Text>{getTermFromDictionary(language, 'error_deleting_account')}</Text>
                                   )}
                              </Modal.Body>
                              <Modal.Footer>
                                        {deleteResults.success === true ? (
                                            <Button variant="primary" onPress={signOut}>
                                                 {getTermFromDictionary(language, 'button_ok')}
                                            </Button>
                                        ) : (
                                            <Button variant="primary" onPress={toggleDeleteResultsModal}>
                                                 {getTermFromDictionary(language, 'button_ok')}
                                            </Button>
                                        )}

                              </Modal.Footer>
                         </Modal.Content>
                    </Modal>
               </Box>
          </ScrollView>
     );
};

const MyLibrary = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { location } = React.useContext(LibraryBranchContext);
     const { language } = React.useContext(LanguageContext);

     const contrastTextColor = useToken('colors', 'primary.400-text');

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
          <Box m="4" bg="primary.400" p="6" rounded="xl">
               <Pressable display="flex" flexDirection="row" onPress={() => navigate('MyLibrary')} space="1" alignItems="center" justifyContent="space-between">
                    <VStack>
                         <Text bold fontSize="16" color={contrastTextColor}>
                              {library.displayName}
                         </Text>
                         {library.displayName !== location.displayName ? (
                              <Text bold color={contrastTextColor}>
                                   {location.displayName}
                              </Text>
                         ) : null}
                         {hoursLabel ? <Text color={contrastTextColor}>{hoursLabel}</Text> : null}
                    </VStack>
                    <Icon as={MaterialIcons} name="chevron-right" size="7" color={contrastTextColor} />
               </Pressable>
          </Box>
     );
};

const ViewAllLocations = () => {
     const { language } = React.useContext(LanguageContext);
     const { locations } = React.useContext(LibraryBranchContext);

     if (_.size(locations) > 1) {
          return (
               <Pressable px="2" py="3" onPress={() => navigate('AllLocations')}>
                    <HStack space="1" alignItems="center">
                         <Icon as={MaterialIcons} name="chevron-right" size="7" />
                         <Text fontWeight="500">{getTermFromDictionary(language, 'view_all_locations')}</Text>
                    </HStack>
               </Pressable>
          );
     }

     return null;
};

const Settings = () => {
     const { language } = React.useContext(LanguageContext);

     return (
          <Pressable px="2" py="3" onPress={() => navigate('MyPreferences')}>
               <HStack space="1" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="7" />
                    <Text fontWeight="500">{getTermFromDictionary(language, 'preferences')}</Text>
               </HStack>
          </Pressable>
     );
};

const DeleteAccount = () => {
     const { language } = React.useContext(LanguageContext);

     return (
         <Pressable px="2" py="3" onPress={() => navigate('MyPreferences')}>
              <HStack space="1" alignItems="center">
                   <Icon as={MaterialIcons} name="chevron-right" size="7" />
                   <Text fontWeight="500">{getTermFromDictionary(language, 'preferences')}</Text>
              </HStack>
         </Pressable>
     );
};

const PrivacyPolicy = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);

     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));
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
          console.log(url);
          await WebBrowser.openBrowserAsync(url, browserParams)
               .then((res) => {
                    console.log(res);
                    if (res.type === 'cancel' || res.type === 'dismiss') {
                         console.log('User closed window.');
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
                                        console.log(response);
                                        if (response.type === 'cancel') {
                                             console.log('User closed window.');
                                        }
                                   })
                                   .catch(async (error) => {
                                        console.log('Unable to close previous browser session.');
                                   });
                         } catch (error) {
                              console.log('Really borked.');
                         }
                    } else {
                         popToast(getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                         console.log(err);
                    }
               });
     };

     return (
          <Pressable px="2" py="3" onPress={() => openURL()}>
               <HStack space="1" alignItems="center">
                    <Icon as={MaterialIcons} name="chevron-right" size="7" />
                    <Text fontWeight="500">{getTermFromDictionary(language, 'privacy_policy')}</Text>
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

     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));
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
               console.log('URL not valid!');
               formattedUrl = _.trimEnd(library.baseUrl, '/') + '/' + _.trimStart(url, '/');
          }
          if (formattedUrl.includes(library.baseUrl)) {
               /* If Aspen Discovery, append minimalInterface to clean up the UI */
               formattedUrl = appendQuery(formattedUrl, 'minimalInterface=true');
          }

          await WebBrowser.openBrowserAsync(formattedUrl, browserParams)
               .then(async (res) => {
                    console.log(res);
                    if (res.type === 'cancel' || res.type === 'dismiss') {
                         console.log('User closed window.');
                         WebBrowser.dismissBrowser();
                         WebBrowser.coolDownAsync();
                    }
               })
               .catch(async (err) => {
                    console.log(err);
                    if (err.message === 'Another WebBrowser is already being presented.') {
                         try {
                              WebBrowser.dismissBrowser();
                              WebBrowser.coolDownAsync();
                              await WebBrowser.openBrowserAsync(formattedUrl, browserParams)
                                   .then(async (response) => {
                                        console.log(response);
                                        if (response.type === 'cancel' || response.type === 'dismiss') {
                                             console.log('User closed window.');
                                             WebBrowser.dismissBrowser();
                                             WebBrowser.coolDownAsync();
                                        }
                                   })
                                   .catch(async (error) => {
                                        console.log('Unable to close previous browser session.');
                                   });
                         } catch (error) {
                              console.log('Really borked.');
                         }
                    } else {
                         popToast(getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                         console.log(err);
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
                                   <HStack space="1" alignItems="center" px="2" py="3">
                                        <Icon as={expanded ? Entypo : MaterialIcons} name={expanded ? 'chevron-small-down' : 'chevron-right'} size="7" />
                                        <VStack w="100%">
                                             <Text fontWeight="500">{categoryLabel}</Text>
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
                                        <HStack space="1" alignItems="center" ml={4}>
                                             <Icon as={MaterialIcons} name="chevron-right" size="7" />
                                             <VStack w="100%">
                                                  <Text fontWeight="500">{item.linkText}</Text>
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
                         <Pressable key={index} px="2" py="3" rounded="md" onPress={() => openURL(item.url)}>
                              <HStack space="1" alignItems="center">
                                   <Icon as={MaterialIcons} name="chevron-right" size="7" />
                                   <VStack w="100%">
                                        <Text fontWeight="500">{item.linkText}</Text>
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