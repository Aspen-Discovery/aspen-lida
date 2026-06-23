import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ListItem } from '@rneui/themed';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import _ from 'lodash';
import {
     Actionsheet,
     ActionsheetContent,
     ActionsheetItem,
     ActionsheetItemText,
     Alert,
     AlertDialog,
     AlertDialogBackdrop,
     AlertDialogContent,
     AlertDialogHeader,
     AlertDialogBody,
     AlertDialogFooter,
     Box,
     Button,
     ButtonGroup,
     ButtonText,
     Center,
     Heading,
     FlatList,
     Input,
     InputField,
     FormControl,
     HStack,
     Icon,
     Pressable,
     ScrollView,
     Select,
     Text,
     VStack,
     ActionsheetBackdrop,
     AlertIcon,
     InfoIcon,
     AlertText,
     SelectTrigger,
     SelectInput,
     SelectIcon,
     ChevronDownIcon,
     SelectBackdrop, SelectDragIndicatorWrapper, SelectDragIndicator, SelectPortal, SelectContent, SelectItem
} from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadError } from '../../../components/loadError';

import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { getAuthor, getCleanTitle, getDateLastUsed, getFormat, getTitle } from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { deleteAllReadingHistory, deleteSelectedReadingHistory, fetchReadingHistory, optIntoReadingHistory, optOutOfReadingHistory } from '../../../util/api/user';
import { formatReadingHistory } from '../../../util/api/userHelper';

import AddToList from '../../Search/AddToList';
import { ActionsheetIcon } from '@gluestack-ui/themed';

import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging.js';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MyReadingHistory = () => {
     const navigation = useNavigation();
     const queryClient = useQueryClient();
     const [isLoading, setLoading] = React.useState(false);
     const [page, setPage] = React.useState(1);
     const [sort, setSort] = React.useState('checkedOut');
     const [searchTerm, setSearchTerm] = React.useState('');
     const [filter, setFilter] = React.useState('');
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { user, readingHistory, updateReadingHistory } = React.useContext(UserContext);
     const insets = useSafeAreaInsets();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const pageSize = 20;
     const systemMessagesForScreen = [];
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     const [sortBy, setSortBy] = React.useState({
          title: 'Sort by Title',
          author: 'Sort by Author',
          format: 'Sort by Format',
          last_used: 'Sort by Last Used',
     });

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     const { status, data, error, isFetching, isPreviousData } = useQuery(['reading_history', user.id, library.baseUrl, page, sort, searchTerm], () => fetchReadingHistory(page, pageSize, sort, searchTerm, library.baseUrl), {
          onSuccess: (data) => {
               logDebugMessage("Reading history fetched ");
               if(data.ok) {
                    const tmpReadingHistory = formatReadingHistory(data.data.result);
                    updateReadingHistory(tmpReadingHistory);
                    if (tmpReadingHistory.totalPages) {
                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', page);
                         tmp = tmp.replace('%2%', tmpReadingHistory.totalPages);
                         setPaginationLabel(tmp);
                    }
                    setLoading(false);
               } else {
                    logDebugMessage("Error fetching reading history for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching reading history for user");
               logErrorMessage(error);
          }
     });

     const state = queryClient.getQueryState(['reading_history']);

     useFocusEffect(
          React.useCallback(() => {
               if (_.isArray(systemMessages)) {
                    systemMessages.map((obj, index, collection) => {
                         if (obj.showOn === '0') {
                              systemMessagesForScreen.push(obj);
                         }
                    });
               }
               const update = async () => {
                    let tmp = sortBy;
                    let term = '';

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

                    term = getTermFromDictionary(language, 'sort_by_format');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'format', term);
                         setSortBy(tmp);
                    }

                    term = getTermFromDictionary(language, 'sort_by_last_used');
                    if (!term.includes('%1%')) {
                         tmp = _.set(tmp, 'last_used', term);
                         setSortBy(tmp);
                    }

                    setLoading(false);
               };
               update().then(() => {
                    return () => update();
               });
          }, [language, systemMessages])
     );

     const [isOpen, setIsOpen] = React.useState(false);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);
     const [optingOut, setOptingOut] = React.useState(false);

     const [deleteAllIsOpen, setDeleteAllIsOpen] = React.useState(false);
     const onCloseDeleteAll = () => setDeleteAllIsOpen(false);
     const deleteAllCancelRef = React.useRef(null);
     const [deleting, setDeleting] = React.useState(false);

     const [optingIn, setOptingIn] = React.useState();

     const optIn = async () => {
          setOptingIn(true);
          await optIntoReadingHistory(library.baseUrl);
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['reading_history'] });
          setOptingIn(false);
     };

     const optOut = async () => {
          setOptingOut(true);
          await optOutOfReadingHistory(library.baseUrl);
          await deleteAllReadingHistory(library.baseUrl);
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['reading_history'] });
          setIsOpen(false);
          setOptingOut(false);
     };

     const deleteAll = async () => {
          setDeleting(true);
          await deleteAllReadingHistory(library.baseUrl);
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['reading_history'] });
          setDeleteAllIsOpen(false);
          setDeleting(false);
     };

     const updateSort = async (value) => {
          logDebugMessage('updateSort for reading history: ' + value);
          setLoading(true);
          //await queryClient.invalidateQueries({ queryKey: ['reading_history', user.id, library.baseUrl, page, sort] });
          setSort(value);
          await queryClient.refetchQueries({ queryKey: ['reading_history', user.id, library.baseUrl, page, value] });
     };

     const updatePage = async (value) => {
          logDebugMessage('updatePage for reading history: ' + value);
          setLoading(true);
          //await queryClient.invalidateQueries({ queryKey: ['reading_history', user.id, library.baseUrl, page, sort, searchTerm] });
          setPage(value);
          await queryClient.refetchQueries({ queryKey: ['reading_history', user.id, library.baseUrl, value, sort, searchTerm] });
     };

     const search = async () => {
          logDebugMessage('updateSearchTerm for reading history: ' + filter);
          setLoading(true);
          setPage(1);
          setSearchTerm(filter);
          //await queryClient.invalidateQueries({ queryKey: ['reading_history', user.id, library.baseUrl, 1, sort, searchTerm] });
          await queryClient.refetchQueries({ queryKey: ['reading_history', user.id, library.baseUrl, 1, sort, filter] });
          //setLoading(false);
     }

     const clearSearch = async () => {
          setLoading(true);
          setPage(1);
          setSearchTerm('');
          //await queryClient.invalidateQueries({ queryKey: ['reading_history', user.id, library.baseUrl, 1, sort, searchTerm] });
          await queryClient.refetchQueries({ queryKey: ['reading_history', user.id, library.baseUrl, 1, sort, searchTerm] });
     }

     const [expanded, setExpanded] = React.useState(false);
     const getDisclaimer = () => {
          return (
               <ListItem.Accordion
                    containerStyle={{
                         backgroundColor: 'transparent',
                         paddingBottom: 2,
                    }}
                    content={
                         <>
                              <ListItem.Content
                                   containerStyle={{
                                        width: '100%',
                                        padding: 0,
                                   }}>
                                   <Alert action="info" p="$1">
                                        <AlertIcon as={InfoIcon} mr="$3" />
                                        <AlertText fontSize="$xs">
                                             {getTermFromDictionary(language, 'reading_history_privacy_notice')}
                                        </AlertText>
                                   </Alert>
                              </ListItem.Content>
                         </>
                    }
                    isExpanded={expanded}
                    icon={<Icon as={ChevronDownIcon} color={textColor} />}
                    onPress={() => {
                         setExpanded(!expanded);
                    }}>
                    <ListItem
                         key={0}
                         borderBottom
                         containerStyle={{
                              backgroundColor: 'transparent',
                              paddingTop: 1,
                         }}>
                         <ListItem.Content containerStyle={{ padding: 0 }}>
                              <Text fontSize="$xs" color={textColor}>
                                   {getTermFromDictionary(language, 'reading_history_disclaimer')}
                              </Text>
                         </ListItem.Content>
                    </ListItem>
               </ListItem.Accordion>
          );
     };

     const getActionButtons = () => {
          let sortLength = 8 * sortBy.last_used.length + 80;
          if (sort === 'author') {
               sortLength = 8 * sortBy.author.length + 80;
          } else if (sort === 'format') {
               sortLength = 8 * sortBy.format.length + 80;
          } else if (sort === 'title') {
               sortLength = 8 * sortBy.title.length + 80;
          } else if (sort === 'checkedOut') {
               sortLength = 8 * sortBy.last_used.length + 80;
          }

          const sortLabel = () => {
               switch (sort) {
                    case "author":
                         return sortBy.author;
                    case "format":
                         return sortBy.format;
                    case "checkedOut":
                         return sortBy.last_used;
                    case "title":
                         return sortBy.title;
                    default:
                         return getTermFromDictionary(language, 'select_sort_method');
               }
          };

          return (
               <Box
                    p="$5"
                    bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}
                    borderBottomWidth="$1"
                    borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']}
                    flexWrap="nowrap">
                    <VStack space="sm">
                         <Input borderColor={colorMode === 'light' ? '$none' : theme['colors']['gray']['400']}>
                              <InputField
                                   returnKeyType="search"
                                   variant="outline"
                                   autoCapitalize="none"
                                   onChangeText={(term) => setFilter(term)}
                                   inputMode="search"
                                   value={filter}
                                   placeholder={getTermFromDictionary(language, 'search')}
                                   onSubmitEditing={search}
                                   size="$lg"
                                   color={textColor} />
                         </Input>
                         <ScrollView horizontal>
                              <HStack space="sm">
                                   <FormControl w={sortLength}>
                                        <Select
                                            name="sortBy"
                                            selectedValue={sort}
                                            defaultValue={sort}
                                            accessibilityLabel={getTermFromDictionary(language, 'select_sort_method')}
                                            onValueChange={(itemValue) => updateSort(itemValue)}>
                                             <SelectTrigger variant="outline" size="sm">
                                                  <SelectInput pt="$2" fontSize="$sm" color={textColor} value={sortLabel()} />
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
                                                       <SelectItem label={sortBy.title} value="title" key={0} bgColor={sort == "title" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "title" ? theme['colors']['tertiary']['500-text'] : textColor } }}  />
                                                       <SelectItem label={sortBy.author} value="author" key={1}  bgColor={sort == "author" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "author" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                       <SelectItem label={sortBy.last_used} value="checkedOut" key={2}  bgColor={sort == "checkedOut" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "checkedOut" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                       <SelectItem label={sortBy.format} value="format" key={3}  bgColor={sort == "format" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "format" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                  </SelectContent>
                                             </SelectPortal>
                                        </Select>
                                   </FormControl>
                                   <ButtonGroup size="sm" variant="solid">
                                        <Button  bgColor={theme['colors']['danger']['700']} onPress={() => setDeleteAllIsOpen(true)}>
                                             <ButtonText color={theme['colors']['white']}>{getTermFromDictionary(language, 'reading_history_delete_all')}</ButtonText>
                                        </Button>
                                        <Button bgColor={theme['colors']['danger']['700']} onPress={() => setIsOpen(true)}>
                                             <ButtonText color={theme['colors']['white']}>{getTermFromDictionary(language, 'reading_history_opt_out')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </HStack>
                         </ScrollView>
                    </VStack>

                    <Center>
                         <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                              <AlertDialogBackdrop />
                              <AlertDialogContent  bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                                   <AlertDialogHeader>
                                        <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'reading_history_opt_out')}</Heading>
                                   </AlertDialogHeader>
                                   <AlertDialogBody>
                                        <Text color={textColor}>{getTermFromDictionary(language, 'reading_history_opt_out_warning')}</Text>
                                   </AlertDialogBody>
                                   <AlertDialogFooter>
                                        <ButtonGroup space="sm">
                                             <Button borderColor={colorMode === 'light' ? theme['colors']['coolGray']['800'] : theme['colors']['coolGray']['400']} variant="outline" onPress={onClose}>
                                                  <ButtonText color={colorMode === 'light' ? theme['colors']['coolGray']['800'] : theme['colors']['coolGray']['400']}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                             </Button>
                                             <Button bgColor={theme['colors']['danger']['700']} isLoading={optingOut} isLoadingText={getTermFromDictionary(language, 'updating', true)} onPress={optOut} ref={cancelRef}>
                                                  <ButtonText  color={theme['colors']['white']}>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                             </Button>
                                        </ButtonGroup>
                                   </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                    </Center>

                    <Center>
                         <AlertDialog leastDestructiveRef={deleteAllCancelRef} isOpen={deleteAllIsOpen} onClose={onCloseDeleteAll}>
                              <AlertDialogBackdrop />
                              <AlertDialogContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                                   <AlertDialogHeader>
                                        <Heading color={textColor} size="md">{getTermFromDictionary(language, 'reading_history_delete_all')}</Heading>
                                   </AlertDialogHeader>
                                   <AlertDialogBody>
                                        <Text color={textColor}>{getTermFromDictionary(language, 'reading_history_delete_all_warning')}</Text>
                                   </AlertDialogBody>
                                   <AlertDialogFooter>
                                        <ButtonGroup space="sm">
                                             <Button borderColor={colorMode === 'light' ? theme['colors']['coolGray']['800'] : theme['colors']['coolGray']['400']} variant="outline" onPress={onCloseDeleteAll}>
                                                  <ButtonText color={colorMode === 'light' ? theme['colors']['coolGray']['800'] : theme['colors']['coolGray']['400']}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                             </Button>
                                             <Button bgColor={theme['colors']['danger']['700']} isLoading={deleting} isLoadingText={getTermFromDictionary(language, 'deleting', true)} onPress={deleteAll} ref={cancelRef}>
                                                  <ButtonText color={theme['colors']['white']}>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                             </Button>
                                        </ButtonGroup>
                                   </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                    </Center>
               </Box>
          );
     };

     const Empty = () => {
          return (
               <Center mt="$5" mb="$5">
                    <Text bold fontSize="$lg" color={textColor}>
                         {getTermFromDictionary(language, 'reading_history_empty')}
                    </Text>
               </Center>
          );
     };

     const Paging = () => {
          if (readingHistory?.totalResults > 0) {
               return (
                    <Box
                         p="$2"
                         borderTopWidth="$1"
                         bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}
                         borderColor={colorMode === 'light' ? theme['colors']['coolGray']['400'] : theme['colors']['gray']['600']}
                         flexWrap="nowrap"
                         alignItems="center">
                         <ScrollView horizontal>
                              <ButtonGroup size="sm">
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        onPress={async () => {
                                            if (page > 1) {
                                                 updatePage(page - 1)
                                            }
                                        }}
                                        isDisabled={page === 1}>
                                        <ButtonText color={theme['colors']['primary']['500-text']} >{getTermFromDictionary(language, 'previous')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        onPress={async () => {
                                             if (readingHistory?.hasMore) {
                                                  logDebugMessage('Adding to page');
                                                  let newPage = page + 1;
                                                  updatePage(newPage);
                                             }
                                        }}
                                        isDisabled={isPreviousData || !readingHistory?.hasMore}>
                                        <ButtonText color={theme['colors']['primary']['500-text']} >{getTermFromDictionary(language, 'next')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ScrollView>
                         <Text mt="$2" fontSize="$sm" color={textColor}>
                              {paginationLabel}
                         </Text>
                    </Box>
               );
          }else{
               return null;
          }
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     return (
          <SafeAreaView style={{ flex: 1 }}>
               {_.size(systemMessagesForScreen) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
               {user.trackReadingHistory !== '1' ? (
                    <Box p="$5">
                         <Button bgColor={theme['colors']['primary']['700']} onPress={optIn} isLoading={optingIn} isLoadingText={getTermFromDictionary(language, 'updating', true)}>
                              <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'reading_history_opt_in')}</ButtonText>
                         </Button>
                         {getDisclaimer()}
                    </Box>
               ) : (
                    <>
                         {getActionButtons()}
                         {status === 'loading' || isFetching || isLoading ? (
                              loadingSpinner()
                         ) : status === 'error' ? (
                              loadError('Error', '')
                         ) : (
                              <>
                                   <FlatList data={readingHistory?.history} ListEmptyComponent={Empty} ListFooterComponent={Paging} ListHeaderComponent={getDisclaimer} renderItem={({ item }) => <Item data={item} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />
                              </>
                         )}
                    </>
               )}
          </SafeAreaView>
     );
};

const Item = (data) => {
     const queryClient = useQueryClient();
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const insets = useSafeAreaInsets();
     const item = data.data;

     const [deleting, setDelete] = React.useState(false);
     const [isOpen, setIsOpen] = React.useState(false);
     const toggle = () => {
          setIsOpen(!isOpen);
     };

     const openGroupedWork = (item, title) => {
          navigateStack('AccountScreenTab', 'ItemDetails', {
               id: item,
               title: getCleanTitle(title),
               url: library.baseUrl,
               userContext: user,
               libraryContext: library,
          });
     };

     const deleteFromHistory = async (item) => {
          await deleteSelectedReadingHistory(item, library.baseUrl).then(async (result) => {
               if (result) {
                    queryClient.invalidateQueries({ queryKey: ['user'] });
                    queryClient.invalidateQueries({ queryKey: ['reading_history'] });
                    setLoading(true);
                    await queryClient.refetchQueries({ queryKey: ['reading_history', user.id, library.baseUrl, page, sort, searchTerm] });
               }
          });
     };

     const imageUrl = library.baseUrl + encodeURI(item.coverUrl);
     ///bookcover.php?id=af5d146c-d9d8-130b-9857-03d4126be9fd-eng&size=small&type=grouped_work&category=Books"
     const key = 'medium_' + item.permanentId;
     let url = library.baseUrl + '/bookcover.php?id=' + item.permanentId + '&size=medium';
     if (item.title) {
          return (
               <Pressable onPress={toggle} borderBottomWidth="$1" borderColor={colorMode === 'light' ? theme['colors']['coolGray']['400'] : theme['colors']['gray']['600']} pl="$4" pr="$5" py="$2">
                    <HStack space="md">
                         <VStack maxW="30%">
                              <Image
                                   alt={item.title}
                                   source={url}
                                   style={{
                                        width: 100,
                                        height: 150,
                                        borderRadius: 4,
                                   }}
                                   placeholder={blurhash}
                                   transition={1000}
                                   contentFit="cover"
                              />
                              <AddToList itemId={item.permanentId} btnStyle="sm" />
                         </VStack>
                         <VStack w="65%">
                              {getTitle(item.title)}
                              {getAuthor(item.author)}
                              {getFormat(item.format)}
                              {getDateLastUsed(item.checkout, item.checkedOut)}
                         </VStack>
                    </HStack>
                    <Actionsheet isOpen={isOpen} onClose={toggle} size="full">
                         <ActionsheetBackdrop />
                         <ActionsheetContent
                              bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
                              pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                         >
                              <Box w="100%" h="$60" px="$4" justifyContent="center">
                                   <Text
                                        fontSize="$lg"
                                        color={textColor}>
                                        {getTitle(item.title)}
                                   </Text>
                              </Box>
                              {item.existsInCatalog ? (
                                   <ActionsheetItem
                                        onPress={() => {
                                             openGroupedWork(item.permanentId, item.title);
                                             toggle();
                                        }}>
                                        <ActionsheetIcon>
                                             <Icon as={MaterialIcons} name="search" mr="$1" size="md" color={textColor} />
                                        </ActionsheetIcon>
                                        <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'view_item_details')}</ActionsheetItemText>
                                   </ActionsheetItem>
                              ) : null}
                              <ActionsheetItem
                                   isLoading={deleting}
                                   isLoadingText={getTermFromDictionary(language, 'removing', true)}
                                   onPress={async () => {
                                        setDelete(true);
                                        await deleteFromHistory(item.permanentId).then((r) => {
                                             setDelete(false);
                                        });
                                        toggle();
                                   }}>
                                   <ActionsheetIcon>
                                        <Icon as={MaterialIcons} name="delete" mr="$1" size="md" color={textColor} />
                                   </ActionsheetIcon>
                                   <ActionsheetItemText color={textColor}>
                                        {getTermFromDictionary(language, 'reading_history_delete')}
                                   </ActionsheetItemText>
                              </ActionsheetItem>
                         </ActionsheetContent>
                    </Actionsheet>
               </Pressable>
          );
     }else{
          return (
               <Text>Unknown title</Text>
         );
     }
};
