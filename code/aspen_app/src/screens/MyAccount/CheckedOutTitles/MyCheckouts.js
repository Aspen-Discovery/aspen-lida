import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import _ from 'lodash';
import { ScrollView, Actionsheet, FormControl, Select, Box, Button, Center, FlatList, Icon, Pressable, Text, HStack, VStack, CheckIcon, Image } from 'native-base';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { translate } from '../../../translations/translations';
import { renewAllCheckouts, renewCheckout, returnCheckout, viewOnlineItem, viewOverDriveItem } from '../../../util/accountActions';
import {CheckoutsContext, LanguageContext, LibrarySystemContext, UserContext} from '../../../context/initialContext';
import {getPatronCheckedOutItems, refreshProfile, reloadProfile} from '../../../util/api/user';
import {getAuthor, getCheckedOutTo, getCleanTitle, getDueDate, getFormat, getRenewalCount, getTitle, isOverdue, willAutoRenew} from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { formatDiscoveryVersion } from '../../../util/loadLibrary';
import {getTermFromDictionary, getTranslationsWithValues} from '../../../translations/TranslationService';

export const MyCheckouts = () => {
     const navigation = useNavigation();
     const { user, updateUser } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { checkouts, updateCheckouts } = React.useContext(CheckoutsContext);
     const { language } = React.useContext(LanguageContext);
     const [isLoading, setLoading] = React.useState(true);
     const [renewAll, setRenewAll] = React.useState(false);
     const [source, setSource] = React.useState('all');
     const [filterBy, setFilterBy] = React.useState({
          ils: 'Filter by Physical Materials',
          hoopla: 'Filter by Hoopla',
          overdrive: 'Filter by OverDrive',
          axis360: 'Filter by Axis 360',
          cloudlibrary: 'Filter by cloudLibrary',
          all: 'Filter by All'
     });
     const [checkoutsBy, setCheckoutBy] = React.useState({
          ils: 'Checked Out Titles for Physical Materials',
          hoopla: 'Checked Out Titles for Hoopla',
          overdrive: 'Checked Out Titles for OverDrive',
          axis360: 'Checked Out Titles for Axis 360',
          cloudlibrary: 'Checked Out Titles for cloudLibrary',
          all: 'Checked Out Titles'
     })

     const toggleSource = async (value) => {
          setSource(value);
          setLoading(true);
          await getPatronCheckedOutItems(value, library.baseUrl, true, language).then((result) => {
               if (checkouts !== result) {
                    updateCheckouts(result);
               }
               if (!_.isNull(value)) {
                    if (value === 'ils') {
                         navigation.setOptions({title: checkoutsBy.ils});
                    } else if (value === 'overdrive') {
                         navigation.setOptions({title: checkoutsBy.overdrive});
                    } else if (value === 'cloud_library') {
                         navigation.setOptions({title: checkoutsBy.cloudlibrary});
                    } else if (value === 'axis360') {
                         navigation.setOptions({title: checkoutsBy.axis360});
                    } else {
                         navigation.setOptions({title: getTermFromDictionary(language, 'checked_out_titles')});
                    }
               }
               setLoading(false);
          });
     };

     useFocusEffect(
          React.useCallback(() => {
               const update = async () => {
                    await getPatronCheckedOutItems(source, library.baseUrl, true, language).then(async (result) => {
                         if (checkouts !== result) {
                              updateCheckouts(result);
                         }
                         await getTranslationsWithValues('filter_by_source', 'Physical Materials', language, library.baseUrl).then(term => {
                              const obj = {
                                   ils: _.toString(term)
                              }
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('filter_by_source', 'Hoopla', language, library.baseUrl).then(term => {
                              const obj = {
                                   hoopla: _.toString(term)
                              }
                              console.log(_.toString(term));
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('filter_by_source', 'OverDrive', language, library.baseUrl).then(term => {
                              const obj = {
                                   overdrive: _.toString(term)
                              }
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('filter_by_source', 'cloudLibrary', language, library.baseUrl).then(term => {
                              const obj = {
                                   cloudlibrary: _.toString(term)
                              }
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('filter_by_source', 'All', language, library.baseUrl).then(term => {
                              const obj = {
                                   all: term
                              }
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('filter_by_source', 'Axis 360', language, library.baseUrl).then(term => {
                              const obj = {
                                   axis360: _.toString(term)
                              }
                              let tmp = filterBy;
                              tmp = _.merge(obj, tmp);
                              setFilterBy(tmp);
                         })
                         await getTranslationsWithValues('checkouts_for_source', 'OverDrive', language, library.baseUrl).then(term => {
                              const obj = {
                                   overdrive: _.toString(term)
                              }
                              let tmp = checkoutsBy;
                              tmp = _.merge(obj, tmp);
                              setCheckoutBy(tmp);
                         })
                         await getTranslationsWithValues('checkouts_for_source', 'Hoopla', language, library.baseUrl).then(term => {
                              const obj = {
                                   hoopla: _.toString(term)
                              }
                              let tmp = checkoutsBy;
                              tmp = _.merge(obj, tmp);
                              setCheckoutBy(tmp);
                         })
                         await getTranslationsWithValues('checkouts_for_source', 'cloudLibrary', language, library.baseUrl).then(term => {
                              const obj = {
                                   cloudlibrary: _.toString(term)
                              }
                              let tmp = checkoutsBy;
                              tmp = _.merge(obj, tmp);
                              setCheckoutBy(tmp);
                         })
                         await getTranslationsWithValues('checkouts_for_source', 'Axis 360', language, library.baseUrl).then(term => {
                              const obj = {
                                   axis360: _.toString(term)
                              }
                              let tmp = checkoutsBy;
                              tmp = _.merge(obj, tmp);
                              setCheckoutBy(tmp);
                         })
                         setLoading(false);
                    });
               };
               update().then(() => {
                    return () => update();
               });
          }, [])
     );

     if (isLoading) {
          return loadingSpinner();
     }

     let numCheckedOut = 0;
     if (!_.isUndefined(user.numCheckedOut)) {
          numCheckedOut = user.numCheckedOut;
     }

     const noCheckouts = () => {
          return (
               <Center mt={5} mb={5}>
                    <Text bold fontSize="lg">
                         {getTermFromDictionary(language, 'no_checkouts')}
                    </Text>
               </Center>
          );
     };

     const reloadCheckouts = async () => {
          setLoading(true);
          await reloadProfile(library.baseUrl).then((result) => {
               if (user !== result) {
                    updateUser(result);
               }
               setLoading(false);
          })
     };

     const refreshCheckouts = async () => {
          setLoading(true);
          await reloadProfile(library.baseUrl).then((result) => {
               if (user !== result) {
                    updateUser(result);
               }
               setLoading(false);
          })
     };

     const actionButtons = () => {
          if (numCheckedOut > 0) {
               return (
                    <HStack space={2}>
                         <Button
                              isLoading={renewAll}
                              isLoadingText={getTermFromDictionary(language, 'renewing_all', true)}
                              size="sm"
                              variant="solid"
                              colorScheme="primary"
                              onPress={() => {
                                   setRenewAll(true);
                                   renewAllCheckouts(library.baseUrl).then((r) => {
                                        refreshCheckouts();
                                        setRenewAll(false);
                                   });
                              }}
                              startIcon={<Icon as={MaterialIcons} name="autorenew" size={5} />}>
                              {getTermFromDictionary(language, 'renew_all')}
                         </Button>
                         <Button
                              size="sm"
                              variant="outline"
                              onPress={() => {
                                   setLoading(true);
                                   reloadCheckouts();
                              }}>
                              {getTermFromDictionary(language, 'checkouts_reload')}
                         </Button>
                         <FormControl w={175}>
                              <Select
                                  name="holdSource"
                                  selectedValue={source}
                                  accessibilityLabel={getTermFromDictionary(language, 'filter_by_source_label')}
                                  _selectedItem={{
                                       bg: 'tertiary.300',
                                       endIcon: <CheckIcon size="5"/>,
                                  }}
                                  onValueChange={(itemValue) => toggleSource(itemValue)}>
                                   <Select.Item label={filterBy.all + ' (' + (user.numCheckedOut ?? 0) + ')'} value="all" key={0} />
                                   <Select.Item label={filterBy.ils + ' (' + (user.numCheckedOutIls ?? 0) + ')'} value="ils" key={1}/>
                                   <Select.Item label={filterBy.overdrive + ' (' + (user.numCheckedOutOverDrive ?? 0) + ')'} value="overdrive" key={2}/>
                                   <Select.Item label={filterBy.hoopla + ' (' + (user.numCheckedOut_Hoopla ?? 0) + ')'} value="hoopla" key={3}/>
                                   <Select.Item label={filterBy.cloudlibrary + ' (' + (user.numCheckedOut_cloudLibrary ?? 0) + ')'} value="cloud_library" key={4}/>
                                   <Select.Item label={filterBy.axis360 + ' (' + (user.numCheckedOut_axis360 ?? 0) + ')'} value="axis360" key={5}/>
                              </Select>
                         </FormControl>
                    </HStack>
               );
          } else {
               return (
                    <HStack>
                         <Button
                              size="sm"
                              variant="outline"
                              onPress={() => {
                                   setLoading(true);
                                   reloadCheckouts();
                              }}>
                              {getTermFromDictionary(language, 'checkouts_reload')}
                         </Button>
                    </HStack>
               );
          }
     };

     return (
          <SafeAreaView style={{ flex: 1 }}>
               <Box safeArea={2} bgColor="coolGray.100" borderBottomWidth="1" _dark={{ borderColor: 'gray.600', bg: 'coolGray.700' }} borderColor="coolGray.200" flexWrap="nowrap">
                    <ScrollView horizontal>{actionButtons()}</ScrollView>
               </Box>
               <FlatList data={checkouts} ListEmptyComponent={noCheckouts} renderItem={({ item }) => <Checkout data={item} reloadCheckouts={reloadCheckouts} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />
          </SafeAreaView>
     );
};

const Checkout = (props) => {
     const checkout = props.data;
     const reloadCheckouts = props.reloadCheckouts;
     const navigation = useNavigation();
     const { user, updateUser } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { checkouts, updateCheckouts } = React.useContext(CheckoutsContext);
     const version = formatDiscoveryVersion(library.discoveryVersion);

     const openGroupedWork = (item, title) => {
          if(version >= '23.01.00') {
               navigateStack('AccountScreenTab', 'MyCheckout', {
                    id: item,
                    title: getCleanTitle(title),
                    url: library.baseUrl,
                    userContext: user,
                    libraryContext: library,
                    prevRoute: 'MyCheckouts',
               });
          } else {
               navigateStack('AccountScreenTab', 'MyCheckout221200', {
                    id: item,
                    title: getCleanTitle(title),
                    url: library.baseUrl,
                    userContext: user,
                    libraryContext: library,
               });
          }
     };

     const [access, setAccess] = useState(false);
     const [returning, setReturn] = useState(false);
     const [renewing, setRenew] = useState(false);
     const [isOpen, setIsOpen] = React.useState(false);
     const [label, setAccessLabel] = React.useState('Access Online')
     const toggle = () => {
          setIsOpen(!isOpen);
     };

     let canRenew = !checkout.canRenew;
     let allowLinkedAccountAction = true;
     if (version < '22.05.00') {
          if (checkout.userId !== user.id) {
               allowLinkedAccountAction = false;
          }
     }

     let formatId;
     React.useEffect(() => {
          async function preloadTranslations() {
               if(checkout?.checkoutSource) {
                    if(checkout.checkoutSource === 'OverDrive') {
                         if(checkout.overdriveRead === 1) {
                              formatId = 'ebook-overdrive';
                              await getTranslationsWithValues('checkout_read_online', 'OverDrive', language, library.baseUrl).then(term => {
                                   setAccessLabel(_.toString(term));
                              })
                         } else if(checkout.overdriveListen === 1) {
                              formatId = 'audiobook-overdrive';
                              await getTranslationsWithValues('checkout_listen_online', 'OverDrive', language, library.baseUrl).then(term => {
                                   setAccessLabel(_.toString(term));
                              })
                         } else if(checkout.overdriveVideo === 1) {
                              formatId = 'video-streaming';
                              await getTranslationsWithValues('checkout_watch_online', 'OverDrive', language, library.baseUrl).then(term => {
                                   setAccessLabel(_.toString(term));
                              })
                         } else if(checkout.overdriveMagazine === 1) {
                              formatId = 'magazine-overdrive';
                              await getTranslationsWithValues('checkout_read_online', 'OverDrive', language, library.baseUrl).then(term => {
                                   setAccessLabel(_.toString(term));
                              })
                         } else {
                              await getTranslationsWithValues('checkout_access_online', 'OverDrive', language, library.baseUrl).then(term => {
                                   setAccessLabel(_.toString(term));
                              })
                         }
                    } else {
                         await getTranslationsWithValues('checkout_access_online', checkout.checkoutSource, language, library.baseUrl).then(term => {
                              setAccessLabel(_.toString(term));
                         })
                    }
               }
          }
          preloadTranslations();
     }, []);

     let returnEarly = false;
     if (checkout.canReturnEarly === 1 || checkout.canReturnEarly === '1' || checkout.canReturnEarly === true || checkout.canReturnEarly === 'true') {
          returnEarly = true;
     }

     let renewMessage = getTermFromDictionary(language, 'if_eligible_auto_renew');
     if (!checkout.canRenew) {
          renewMessage = getTermFromDictionary(language, 'not_eligible_for_renewals');
     }
     if (checkout.autoRenewError) {
          renewMessage = checkout.autoRenewError;
     }
     if (checkout.renewError) {
          renewMessage = checkout.renewError;
     }

     return (
          <Pressable onPress={toggle} borderBottomWidth="1" _dark={{ borderColor: 'gray.600' }} borderColor="coolGray.200" pl="4" pr="5" py="2">
               <HStack space={3} maxW="75%">
                    <Image
                         source={{ uri: checkout.coverUrl }}
                         borderRadius="md"
                         size={{
                              base: '80px',
                              lg: '120px',
                         }}
                         alt={checkout.title}
                    />
                    <VStack>
                         {getTitle(checkout.title)}
                         {isOverdue(checkout.overdue)}
                         {getAuthor(checkout.author)}
                         {getFormat(checkout.format, checkout.source)}
                         {getCheckedOutTo(checkout.user)}
                         {getDueDate(checkout.dueDate)}
                         {getRenewalCount(checkout.renewCount ?? 0, checkout.maxRenewals ?? null)}
                         {willAutoRenew(checkout.autoRenew ?? false, checkout.renewalDate)}
                    </VStack>
               </HStack>
               <Actionsheet isOpen={isOpen} onClose={toggle} size="full">
                    <Actionsheet.Content>
                         <Box w="100%" h={60} px={4} justifyContent="center">
                              <Text
                                   fontSize="18"
                                   color="gray.500"
                                   _dark={{
                                        color: 'gray.300',
                                   }}>
                                   {getTitle(checkout.title)}
                              </Text>
                         </Box>
                         <Actionsheet.Item
                              onPress={() => {
                                   openGroupedWork(checkout.groupedWorkId, checkout.title);
                                   toggle();
                              }}
                              startIcon={<Icon as={MaterialIcons} name="search" color="trueGray.400" mr="1" size="6" />}>
                              {getTermFromDictionary(language, 'view_item_details')}
                         </Actionsheet.Item>
                         <Actionsheet.Item
                              isDisabled={canRenew}
                              isLoading={renewing}
                              isLoadingText={getTermFromDictionary(language, 'renewing', true)}
                              onPress={() => {
                                   setRenew(true);
                                   renewCheckout(checkout.barcode, checkout.recordId, checkout.source, checkout.itemId, library.baseUrl, checkout.userId).then((result) => {
                                        setRenew(false);
                                        reloadCheckouts();
                                        toggle();
                                   });
                              }}
                              startIcon={<Icon as={MaterialIcons} name="autorenew" color="trueGray.400" mr="1" size="6" />}>
                              {renewMessage}
                         </Actionsheet.Item>
                         {checkout.source === 'overdrive' ? (
                              <Actionsheet.Item
                                   isLoading={access}
                                   isLoadingText={getTermFromDictionary(language, 'accessing', true)}
                                   onPress={() => {
                                        setAccess(true);
                                        viewOverDriveItem(checkout.userId, formatId, checkout.overDriveId, library.baseUrl).then((result) => {
                                             setAccess(false);
                                             toggle();
                                        });
                                   }}
                                   startIcon={<Icon as={MaterialIcons} name="book" color="trueGray.400" mr="1" size="6" />}>
                                   {label}
                              </Actionsheet.Item>
                         ) : null}
                         {checkout.accessOnlineUrl != null ? (
                              <>
                                   <Actionsheet.Item
                                        isLoading={access}
                                        isLoadingText={getTermFromDictionary(language, 'accessing', true)}
                                        onPress={() => {
                                             setAccess(true);
                                             viewOnlineItem(checkout.userId, checkout.recordId, checkout.source, checkout.accessOnlineUrl, library.baseUrl).then((result) => {
                                                  setAccess(false);
                                                  toggle();
                                             });
                                        }}
                                        startIcon={<Icon as={MaterialIcons} name="book" color="trueGray.400" mr="1" size="6" />}>
                                        {label}
                                   </Actionsheet.Item>
                                   <Actionsheet.Item
                                        isLoading={returning}
                                        isLoadingText={getTermFromDictionary(language, 'returning', true)}
                                        onPress={() => {
                                             setReturn(true);
                                             returnCheckout(checkout.userId, checkout.recordId, checkout.source, checkout.overDriveId, library.baseUrl, version, checkout.transactionId).then((result) => {
                                                  setReturn(false);
                                                  reloadCheckouts();
                                                  toggle();
                                             });
                                        }}
                                        startIcon={<Icon as={MaterialIcons} name="logout" color="trueGray.400" mr="1" size="6" />}>
                                        {getTermFromDictionary(language, 'checkout_return_now')}
                                   </Actionsheet.Item>
                              </>
                         ) : null}
                         {returnEarly && allowLinkedAccountAction ? (
                              <>
                                   <Actionsheet.Item
                                        isLoading={returning}
                                        isLoadingText={getTermFromDictionary(language, 'returning', true)}
                                        onPress={() => {
                                             setReturn(true);
                                             returnCheckout(checkout.userId, checkout.recordId, checkout.source, checkout.overDriveId, library.baseUrl, version, checkout.transactionId).then((result) => {
                                                  setReturn(false);
                                                  reloadCheckouts();
                                                  toggle();
                                             });
                                        }}
                                        startIcon={<Icon as={MaterialIcons} name="logout" color="trueGray.400" mr="1" size="6" />}>
                                        {getTermFromDictionary(language, 'checkout_return_now')}
                                   </Actionsheet.Item>
                              </>
                         ) : null}
                    </Actionsheet.Content>
               </Actionsheet>
          </Pressable>
     );
};