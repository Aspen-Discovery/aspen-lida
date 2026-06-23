import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogCloseButton, AlertDialogBody, AlertDialogFooter, Box, Button, ButtonGroup, ButtonText, ButtonIcon, Center, CheckIcon, FlatList, FormControl, HStack, Icon, ScrollView, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Text, VStack, CloseIcon, Heading, ChevronDownIcon } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { CheckoutsContext, LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { getTermFromDictionary, getTranslationsWithValues } from '../../../translations/TranslationService';
import { confirmRenewAllCheckouts, confirmRenewCheckout, renewAllCheckouts, getPatronCheckedOutItems, setSortPreferences } from '../../../util/api/user';
import { sortCheckouts } from '../../../util/api/userHelper';
import { stripHTML } from '../../../helpers/helpers';
import { MyCheckout } from './MyCheckout';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';

export const MyCheckouts = () => {
     const isFetchingCheckouts = useIsFetching({ queryKey: ['checkouts'] });
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const { user, userCheckoutSortMethod, updateUserCheckoutSortMethod } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { checkouts, updateCheckouts } = React.useContext(CheckoutsContext);
     const { language } = React.useContext(LanguageContext);
     const [checkoutSource, setCheckoutSource] = React.useState('all');
     const [isLoading, setLoading] = React.useState(false);
     const [renewAll, setRenewAll] = React.useState(false);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const [filterByLibby, setFilterByLibby] = React.useState(false);
     const insets = useSafeAreaInsets();

     const [renewConfirmationIsOpen, setRenewConfirmationIsOpen] = React.useState(false);
     const onRenewConfirmationClose = () => setRenewConfirmationIsOpen(false);
     const renewConfirmationRef = React.useRef(null);
     const [renewConfirmationResponse, setRenewConfirmationResponse] = React.useState('');
     const [confirmingRenewal, setConfirmingRenewal] = React.useState(false);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     const [checkoutsBy, setCheckoutBy] = React.useState({
          ils: 'Checked Out Titles for Physical Materials',
          hoopla: 'Checked Out Titles for Hoopla',
          overdrive: 'Checked Out Titles for Libby',
          axis_360: 'Checked Out Titles for Boundless',
          cloud_library: 'Checked Out Titles for cloudLibrary',
          palace_project: 'Checked Out Titles for Palace Project',
          all: 'Checked Out Titles',
     });

     const [sortBy, setSortBy] = React.useState({
          title: 'Sort by Title',
          author: 'Sort by Author',
          due_asc: 'Sort by Due Date Ascending',
          due_desc: 'Sort by Due Date Descending',
          format: 'Sort by Format',
          library_account: 'Sort by Library Account',
          times_renewed: 'Sort by Times Renewed',
     });

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     useQuery(['checkouts', user.id, library.baseUrl, language], () => getPatronCheckedOutItems('all', library.baseUrl, false, language), {
          placeholderData: checkouts,
          onSuccess: (data) => {
               if(data.ok) {
                    let checkouts = data.data.result.checkedOutItems ?? [];
                    checkouts = sortCheckouts(checkouts, userCheckoutSortMethod);
                    updateCheckouts(checkouts);
               } else {
                    logDebugMessage("Error fetching user checkouts");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onSettle: (data) => setLoading(false),
          onError: (error) => {
               logDebugMessage("Error fetching user checkouts");
               logErrorMessage(error);
          }
     });

     const toggleSort = async (value) => {
          updateUserCheckoutSortMethod(value);
          const sortedCheckouts = sortCheckouts(checkouts, value);
          await setSortPreferences('sort', value, language, library.baseUrl);
          updateCheckouts(sortedCheckouts);
     };

     const toggleCheckoutSource = async (value) => {
          const originalCheckoutSource = checkoutSource;
          setCheckoutSource(value);
          //setLoading(true);
          //console.log('changing checkouts from ' + originalCheckoutSource + ' to ' + value);
          if (!_.isNull(value)) {
               if (value === 'ils') {
                    navigation.setOptions({ title: checkoutsBy.ils });
               } else if (value === 'overdrive') {
                    navigation.setOptions({ title: checkoutsBy.overdrive });
               } else if (value === 'cloud_library') {
                    navigation.setOptions({ title: checkoutsBy.cloud_library });
               } else if (value === 'hoopla') {
                    navigation.setOptions({ title: checkoutsBy.hoopla });
               } else if (value === 'axis360') {
                    navigation.setOptions({ title: checkoutsBy.axis_360 });
               } else if (value === 'project_palace') {
                    navigation.setOptions({ title: checkoutsBy.palace_project });
               } else {
                    navigation.setOptions({ title: checkoutsBy.all });
               }

               //console.log("Clearing previous checkouts queries for " + originalCheckoutSource);
               //await queryClient.invalidateQueries({ queryKey: ['checkouts', user.id, library.baseUrl, originalCheckoutSource] });
               //console.log("Re-fetching checkout queries for " + value);
               //await queryClient.invalidateQueries({ queryKey: ['checkouts', user.id, library.baseUrl, value] });
               //await queryClient.refetchQueries({ queryKey: ['checkouts', user.id, library.baseUrl, value] });

          }
          //setLoading(false);
     };

     useFocusEffect(
          React.useCallback(() => {
               const update = async () => {
                    let tmp = checkoutsBy;
                    let term = '';

                    term = getTermFromDictionary(language, 'checkouts_for_all');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'all', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_ils');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'ils', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_libby');
                    if (library.libbyReaderName) {
                         term = await getTranslationsWithValues('checkouts_for_libby', library.libbyReaderName, language, library.baseUrl);
                         if (term[0]) {
                              term = term[0];
                         }

                         let filterTerm = await getTranslationsWithValues('filter_by_libby', library.libbyReaderName, language, library.baseUrl);
                         if (filterTerm[0]) {
                              setFilterByLibby(filterTerm[0]);
                         } else {
                              filterTerm = getTermFromDictionary(language, 'filter_by_libby');
                              setFilterByLibby(filterTerm);
                         }
                    }

                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'overdrive', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_hoopla');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'hoopla', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_cloud_library');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'cloud_library', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_boundless');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'axis_360', term);
                         setCheckoutBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'checkouts_for_palace_project');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'palace_project', term);
                         setCheckoutBy(tmp);
                    }

                    tmp = sortBy;

                    term = getTermFromDictionary(language, 'sort_by_title');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'title', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_author');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'author', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_due_asc');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'due_asc', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_due_desc');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'due_desc', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_format');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'format', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_library_account');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'library_account', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_times_renewed');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'times_renewed', term);
                         setSortBy(tmp);
                    }

                    setLoading(false);
               };
               update().then(() => {
                    return () => update();
               });
          }, [language])
     );

     if (isFetchingCheckouts || isLoading) {
          return loadingSpinner();
     }

     let numCheckedOut = 0;
     if (!_.isUndefined(user.numCheckedOut)) {
          numCheckedOut = user.numCheckedOut;
     }

     const noCheckouts = () => {
          return (
               <Center mt="$5" mb="$5">
                    <Text bold fontSize="$lg" color={textColor}>
                         {getTermFromDictionary(language, 'no_checkouts')}
                    </Text>
               </Center>
          );
     };

     const reloadCheckouts = async () => {
          setLoading(true);
          queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
          queryClient.invalidateQueries({ queryKey: ['checkouts', user.id, library.baseUrl, language] });
          setLoading(false);
     };

     const filterCheckouts = (source) => {
     }

     const actionButtons = () => {
          let checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_all') + ' (' + (user.numCheckedOut ?? 0) + ')';
          if (checkoutSource === 'all') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_all') + ' (' + (user.numCheckedOut ?? 0) + ')';
          } else if (checkoutSource === 'ils') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_ils') + ' (' + (user.numCheckedOutIls ?? 0) + ')';
          } else if (checkoutSource === 'overdrive') {
               checkoutSourceLabel = filterByLibby + ' (' + (user.numCheckedOutOverDrive ?? 0) + ')';
          } else if (checkoutSource === 'hoopla') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_hoopla') + ' (' + (user.numCheckedOut_Hoopla ?? 0) + ')';
          } else if (checkoutSource === 'cloud_library') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_cloud_library') + ' (' + (user.numCheckedOut_cloudLibrary ?? 0) + ')';
          } else if (checkoutSource === 'axis360') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_boundless') + ' (' + (user.numCheckedOut_axis360 ?? 0) + ')';
          } else if (checkoutSource === 'palace_project') {
               checkoutSourceLabel = getTermFromDictionary(language, 'filter_by_palace_project') + ' (' + (user.numCheckedOut_PalaceProject ?? 0) + ')';
          }

          let checkoutsSourceLabelLength = 8 * checkoutSourceLabel.length + 80;

          let sortLength = 8 * sortBy.title.length + 80;
          if (userCheckoutSortMethod === 'author') {
               sortLength = 8 * sortBy.author.length + 80;
          } else if (userCheckoutSortMethod === 'format') {
               sortLength = 8 * sortBy.format.length + 80;
          } else if (userCheckoutSortMethod === 'dueAsc') {
               sortLength = 8 * sortBy.due_asc.length + 80;
          } else if (userCheckoutSortMethod === 'dueDesc') {
               sortLength = 8 * sortBy.due_desc.length + 80;
          } else if (userCheckoutSortMethod === 'libraryAccount') {
               sortLength = 8 * sortBy.library_account.length + 80;
          } else if (userCheckoutSortMethod === 'timesRenewed') {
               sortLength = 8 * sortBy.times_renewed.length + 80;
          }

          const checkoutSortLabel = () => {
               switch (userCheckoutSortMethod) {
                    case "author":
                         return sortBy.author;
                    case "format":
                         return sortBy.format;
                    case "dueAsc":
                         return sortBy.due_asc;
                    case "dueDesc":
                         return sortBy.due_desc;
                    case "timesRenewed":
                         return sortBy.timesRenewed;
                    case "libraryAccount":
                         return sortBy.library_account;
                    case "sortTitle":
                         return sortBy.title;
                    default:
                         return getTermFromDictionary(language, 'select_sort_method');
               }
          };

          const checkoutSourceSelectLabel = () => {
               switch (checkoutSource) {
                    case "ils":
                         return getTermFromDictionary(language, 'filter_by_ils') + " (" + (user.numCheckedOutIls ?? 0) + ")";
                    case "overdrive":
                         return filterByLibby + " (" + (user.numCheckedOutOverDrive ?? 0) + ")";
                    case "cloud_library":
                         return getTermFromDictionary(language, 'filter_by_cloud_library') + " (" + (user.numCheckedOut_cloudLibrary ?? 0) + ")";
                    case "axis360":
                         return getTermFromDictionary(language, 'filter_by_boundless') + " (" + (user.numCheckedOut_axis360 ?? 0) + ")";
                    case "palace_project":
                         return getTermFromDictionary(language, 'filter_by_palace_project') + " (" + (user.numCheckedOut_PalaceProject ?? 0) + ")";
                    case "hoopla":
                         return getTermFromDictionary(language, 'filter_by_hoopla') + " (" + (user.numCheckedOut_Hoopla ?? 0) + ")";
                    default:
                         return getTermFromDictionary(language, 'filter_by_all') + " (" + (user.numCheckedOut ?? 0) + ")";
               }
          };

          if (numCheckedOut > 0) {
               return (
                    <VStack space="sm">
                         <HStack space="sm">
                              <Button
                                   isLoading={renewAll}
                                   isLoadingText={getTermFromDictionary(language, 'renewing_all', true)}
                                   isDisabled={renewAll}
                                   size="sm"
                                   bgColor={theme['colors']['primary']['500']}
                                   onPress={() => {
                                        if (renewAll) return;
                                        setRenewAll(true);
                                        renewAllCheckouts(library.baseUrl, language).then((result) => {
                                             if (result?.confirmRenewalFee && result.confirmRenewalFee) {
                                                  setRenewConfirmationResponse({
                                                       message: result.api.message,
                                                       title: result.api.title,
                                                       confirmRenewalFee: result.confirmRenewalFee ?? false,
                                                       recordId: record ?? null,
                                                       action: result.api.action,
                                                       renewType: 'all',
                                                  });
                                             }

                                             if (result?.confirmRenewalFee && result.confirmRenewalFee) {
                                                  setRenewConfirmationIsOpen(true);
                                             } else {
                                                  reloadCheckouts();
                                             }

                                             setRenewAll(false);
                                        });
                                   }}>
                                   {!renewAll && <ButtonIcon color={theme['colors']['primary']['500-text']} as={MaterialIcons} name="autorenew" />}
                                   <ButtonText color={theme['colors']['primary']['500-text']}>
                                        {renewAll ? getTermFromDictionary(language, 'renewing_all', true) : getTermFromDictionary(language, 'checkout_renew_all')}
                                   </ButtonText>
                              </Button>
                              <Button
                                   borderColor={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']}
                                   size="sm"
                                   variant="outline"
                                   onPress={() => {
                                        setLoading(true);
                                        reloadCheckouts();
                                   }}>
                                   <ButtonText color={colorMode === 'light' ? theme['colors']['coolGray']['600'] : theme['colors']['warmGray']['50']}>{getTermFromDictionary(language, 'checkouts_reload')}</ButtonText>
                              </Button>
                              <FormControl w={checkoutsSourceLabelLength}>
                                   <Select
                                        name="checkoutSource"
                                        selectedValue={checkoutSource}
                                        defaultValue={checkoutSource}
                                        accessibilityLabel={getTermFromDictionary(language, 'filter_by_source_label')}
                                        onValueChange={(itemValue) => toggleCheckoutSource(itemValue)}>
                                        <SelectTrigger variant="outline" size="sm">
                                             <SelectInput pt="$2" color={textColor} value={checkoutSourceSelectLabel()} />
                                             <SelectIcon mr="$3">
                                                  <Icon color={textColor} as={ChevronDownIcon} />
                                             </SelectIcon>
                                        </SelectTrigger>
                                        <SelectPortal>
                                             <SelectBackdrop />
                                             <SelectContent
                                                  bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
                                                  pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                                             >
                                                  <SelectDragIndicatorWrapper>
                                                       <SelectDragIndicator />
                                                  </SelectDragIndicatorWrapper>
                                                  <SelectItem label={getTermFromDictionary(language, 'filter_by_all') + ' (' + (user.numCheckedOut ?? 0) + ')'} value="all" key={0} bgColor={checkoutSource == "all" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "all" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={getTermFromDictionary(language, 'filter_by_ils') + ' (' + (user.numCheckedOutIls ?? 0) + ')'} value="ils" key={1} bgColor={checkoutSource == "ils" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "ils" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  {user.isValidForOverdrive ? <SelectItem label={filterByLibby + ' (' + (user.numCheckedOutOverDrive ?? 0) + ')'} value="overdrive" key={2}  bgColor={checkoutSource == "overdrive" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "overdrive" ? theme['colors']['tertiary']['500-text'] : textColor } }}/> : null}
                                                  {user.isValidForHoopla ? <SelectItem label={getTermFromDictionary(language, 'filter_by_hoopla') + ' (' + (user.numCheckedOut_Hoopla ?? 0) + ')'} value="hoopla" key={3}  bgColor={checkoutSource == "hoopla" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "hoopla" ? theme['colors']['tertiary']['500-text'] : textColor } }}/> : null}
                                                  {user.isValidForCloudLibrary ? <SelectItem label={getTermFromDictionary(language, 'filter_by_cloud_library') + ' (' + (user.numCheckedOut_cloudLibrary ?? 0) + ')'} value="cloud_library" key={4}  bgColor={checkoutSource == "cloud_library" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "cloud_library" ? theme['colors']['tertiary']['500-text'] : textColor } }} /> : null}
                                                  {user.isValidForAxis360 ? <SelectItem label={getTermFromDictionary(language, 'filter_by_boundless') + ' (' + (user.numCheckedOut_axis360 ?? 0) + ')'} value="axis360" key={5} bgColor={checkoutSource == "axis360" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "axis360" ? theme['colors']['tertiary']['500-text'] : textColor } }} /> : null}
                                                  {user.isValidForPalaceProject ? <SelectItem label={getTermFromDictionary(language, 'filter_by_palace_project') + ' (' + (user.numCheckedOut_PalaceProject ?? 0) + ')'} value="palace_project" key={6}  bgColor={checkoutSource == "palace_project" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: checkoutSource == "palace_project" ? theme['colors']['tertiary']['500-text'] : textColor } }} /> : null}
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                         </HStack>
                         <HStack space="$2">
                              <FormControl w={sortLength}>
                                   <Select
                                        name="sortBy"
                                        selectedValue={userCheckoutSortMethod}
                                        defaultValue={userCheckoutSortMethod}
                                        accessibilityLabel={getTermFromDictionary(language, 'select_sort_method')}
                                        onValueChange={(itemValue) => toggleSort(itemValue)}>
                                        <SelectTrigger variant="outline" size="sm">
                                             <SelectInput pt="$2" color={textColor} value={checkoutSortLabel()} />
                                             <SelectIcon mr="$3">
                                                  <Icon color={textColor} as={ChevronDownIcon} />
                                             </SelectIcon>
                                        </SelectTrigger>
                                        <SelectPortal>
                                             <SelectBackdrop />
                                             <SelectContent
                                                  bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
                                                  pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                                             >
                                                  <SelectDragIndicatorWrapper>
                                                       <SelectDragIndicator />
                                                  </SelectDragIndicatorWrapper>
                                                  <SelectItem label={sortBy.title} value="sortTitle" key={0} bgColor={userCheckoutSortMethod == "sortTitle" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "sortTitle" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.author} value="author" key={1} bgColor={userCheckoutSortMethod == "author" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "author" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.due_asc} value="dueAsc" key={2} bgColor={userCheckoutSortMethod == "dueAsc" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "dueAsc" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.due_desc} value="dueDesc" key={3} bgColor={userCheckoutSortMethod == "dueDesc" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "dueDesc" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.format} value="format" key={4} bgColor={userCheckoutSortMethod == "format" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "format" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.library_account} value="libraryAccount" key={5} bgColor={userCheckoutSortMethod == "libraryAccount" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "libraryAccount" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                                  <SelectItem label={sortBy.times_renewed} value="timesRenewed" key={6} bgColor={userCheckoutSortMethod == "timesRenewed" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: userCheckoutSortMethod == "timesRenewed" ? theme['colors']['tertiary']['500-text'] : textColor } }} />
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                         </HStack>
                    </VStack>
               );
          } else {
               return (
                    <HStack space="$2">
                         <Button
                              m="$2"
                              borderColor={theme['colors']['primary']['500']}
                              size="sm"
                              variant="outline"
                              onPress={() => {
                                   setLoading(true);
                                   reloadCheckouts();
                              }}>
                              <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'checkouts_reload')}</ButtonText>
                         </Button>
                    </HStack>
               );
          }
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0' || obj.showOn === '1' || obj.showOn === '2') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     const decodeMessage = (string) => {
          return stripHTML(string);
     };

     return (
          <Box flex={1}>
               <Box p="$2" bgColor="coolGray.100" borderBottomWidth={1} borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']} flexWrap="nowrap">
                    {showSystemMessage()}
                    <ScrollView horizontal>{actionButtons()}</ScrollView>
               </Box>
               <Center>
                    <AlertDialog leastDestructiveRef={renewConfirmationRef} isOpen={renewConfirmationIsOpen} onClose={onRenewConfirmationClose}>
                         <AlertDialogBackdrop />
                         <AlertDialogContent>
                              <AlertDialogHeader>
                                   <Heading size="md">{renewConfirmationResponse?.title ? renewConfirmationResponse.title : 'Unknown Error'}</Heading>
                                   <AlertDialogCloseButton>
                                        <Icon as={CloseIcon} />
                                   </AlertDialogCloseButton>
                              </AlertDialogHeader>
                              <AlertDialogBody><Text>{renewConfirmationResponse?.message ? decodeMessage(renewConfirmationResponse.message) : 'Unable to renew checkout for unknown error. Please contact the library.'}</Text></AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="md">
                                        <Button variant="outline" borderColor={theme['colors']['primary']['500']} onPress={() => setRenewConfirmationIsOpen(false)}>
                                             <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                        </Button>
                                        <Button
                                             isLoading={confirmingRenewal}
                                             isLoadingText={getTermFromDictionary(language, 'renewing', true)}
                                             onPress={async () => {
                                                  setConfirmingRenewal(true);

                                                  if (renewConfirmationResponse.renewType === 'all') {
                                                       await confirmRenewAllCheckouts(library.baseUrl, language).then(async (result) => {
                                                            queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                            queryClient.invalidateQueries({ queryKey: ['checkouts', user.id, library.baseUrl, language] });

                                                            setRenewConfirmationIsOpen(false);
                                                            setConfirmingRenewal(false);
                                                       });
                                                  } else {
                                                       await confirmRenewCheckout(renewConfirmationResponse.barcode, renewConfirmationResponse.recordId, renewConfirmationResponse.source, renewConfirmationResponse.itemId, library.baseUrl, renewConfirmationResponse.userId).then(async (result) => {
                                                            queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                            queryClient.invalidateQueries({ queryKey: ['checkouts', user.id, library.baseUrl, language] });

                                                            setRenewConfirmationIsOpen(false);
                                                            setConfirmingRenewal(false);
                                                       });
                                                  }
                                             }}>
                                             <ButtonText>{renewConfirmationResponse?.action ? renewConfirmationResponse.action : 'Renew Item'}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
               </Center>
               <FlatList data={checkouts} ListEmptyComponent={noCheckouts}
                    renderItem={({ item }) => <MyCheckout data={item} reloadCheckouts={reloadCheckouts} checkoutSource={checkoutSource} />}
                    keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} setRenewConfirmationIsOpen={setRenewConfirmationIsOpen} setRenewConfirmationResponse={setRenewConfirmationResponse} />
          </Box>
     );
};
