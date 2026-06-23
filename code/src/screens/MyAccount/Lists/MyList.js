import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import _ from 'lodash';
import moment from 'moment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
     Badge,
     BadgeText,
     Box,
     Button,
     ButtonGroup,
     ButtonIcon,
     ButtonText,
     CheckIcon,
     ChevronDownIcon,
     FlatList,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     HStack,
     Icon,
     Pressable,
     ScrollView,
     Select,
     SelectBackdrop,
     SelectContent, SelectDragIndicator,
     SelectDragIndicatorWrapper,
     SelectIcon,
     SelectInput, SelectItem,
     SelectPortal,
     SelectTrigger,
     Text,
     VStack,
} from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { loadError, popToast } from '../../../components/loadError';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import {
     LanguageContext,
     LibrarySystemContext,
     SystemMessagesContext,
     ThemeContext,
     UserContext,
} from '../../../context/initialContext';
import { getCleanTitle } from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary, getTranslationsWithValues } from '../../../translations/TranslationService';
import { getListTitles, removeTitlesFromList } from '../../../util/api/list';
import EditList from './EditList';
import { logDebugMessage, logErrorMessage } from '../../../util/logging';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MyList = () => {
     const providedList = useRoute().params.details;
     const id = providedList.id;
     const [page, setPage] = React.useState(1);
     const [sort, setSort] = React.useState('dateAdded');
     const [pageSize, setPageSize] = React.useState(20);
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const [list] = React.useState(providedList);
     const { language } = React.useContext(LanguageContext);
     const insets = useSafeAreaInsets();
     const [sortBy, setSortBy] = React.useState({
          title: 'Sort By Title',
          dateAdded: 'Sort By Date Added',
          recentlyAdded: 'Sort By Recently Added',
          custom: 'Sort By User Defined',
     });
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const systemMessagesForScreen = [];
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');

     React.useEffect(() => {
          if (_.isArray(systemMessages)) {
               systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0') {
                         systemMessagesForScreen.push(obj);
                    }
               });
          }

          async function fetchTranslations() {
               let tmp = sortBy;
               let term = '';

               term = getTermFromDictionary(language, 'sort_by_title');
               if (!term.includes('%1%')) {
                    tmp = _.set(tmp, 'title', term);
                    setSortBy(tmp);
               }

               term = getTermFromDictionary(language, 'sort_by_date_added');
               if (!term.includes('%1%')) {
                    tmp = _.set(tmp, 'dateAdded', term);
                    setSortBy(tmp);
               }

               term = getTermFromDictionary(language, 'sort_by_recently_added');
               if (!term.includes('%1%')) {
                    tmp = _.set(tmp, 'recentlyAdded', term);
                    setSortBy(tmp);
               }

               term = getTermFromDictionary(language, 'sort_by_user_defined');
               if (!term.includes('%1%')) {
                    tmp = _.set(tmp, 'custom', term);
                    setSortBy(tmp);
               }
          }

          fetchTranslations();
     }, [language, systemMessages]);

     const { status, data, error, isFetching, isPreviousData } = useQuery(['list', id, user.id, sort, page], () => getListTitles(id, library.baseUrl, page, pageSize, pageSize, sort), {
          keepPreviousData: false,
          staleTime: 1000,
          onSuccess: (data) => {
               if (data.totalPages) {
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', page);
                    tmp = tmp.replace('%2%', data.totalPages);
                    console.log(tmp);
                    setPaginationLabel(tmp);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching user list titles for list " + id);
               logErrorMessage(error);
          }
     });

     const handleOpenItem = (id, title) => {
          navigateStack('AccountScreenTab', 'ListItem', {
               id: id,
               url: library.baseUrl,
               title: getCleanTitle(title),
          });
     };

     const handleOpenEvent = (item) => {
          if (item.bypass) {
               openURL(item.url);
          } else {
               navigateStack('AccountScreenTab', 'ListItemEvent', {
                    id: item.id,
                    url: library.baseUrl,
                    title: getCleanTitle(item.title),
                    source: item.source,
               });
          }
     };

     const openURL = async (url) => {
          const browserParams = {
               enableDefaultShareMenuItem: false,
               presentationStyle: 'automatic',
               showTitle: false,
               toolbarColor: backgroundColor,
               controlsColor: textColor,
               secondaryToolbarColor: backgroundColor,
          };
          await WebBrowser.openBrowserAsync(url, browserParams)
               .then((res) => {
                    console.log(res);
                    if (res.type === 'cancel' || res.type === 'dismiss') {
                         console.log('User closed or dismissed window.');
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

     if (status !== 'loading') {
          if (!_.isUndefined(data.defaultSort)) {
               setSort(data.defaultSort);
          }
     }

     const queryClient = useQueryClient();

     const renderItem = (item) => {
          const imageUrl = item.image;
          const key = 'medium_' + item.id;

          if (item.recordType === 'event') {
               let registrationRequired = false;
               if (!_.isUndefined(item.registration_required)) {
                    registrationRequired = item.registration_required;
               }

               const startTime = item.start_date.date;
               const endTime = item.end_date.date;

               let time1 = startTime.split(' ');
               let day = time1[0];
               let time2 = endTime.split(' ');

               let time1arr = time1[1].split(':');
               let time2arr = time2[1].split(':');

               let displayDay = moment(day);
               let displayStartTime = moment().set({ hour: time1arr[0], minute: time1arr[1] });
               let displayEndTime = moment().set({ hour: time2arr[0], minute: time2arr[1] });

               displayDay = moment(displayDay).format('dddd, MMMM D, YYYY');
               displayStartTime = moment(displayStartTime).format('h:mm A');
               displayEndTime = moment(displayEndTime).format('h:mm A');

               return (
                    <Pressable borderBottomWidth="$1" _dark={{ borderColor: 'gray.600' }} borderColor="coolGray.200" pl="$4" pr="$5" py="$2" onPress={() => handleOpenEvent(item)}>
                         <HStack space="sm">
                              <VStack maxW="35%">
                                   <Image
                                        alt={item.title}
                                        source={imageUrl}
                                        style={{
                                             width: 100,
                                             height: 150,
                                             borderRadius: 4,
                                        }}
                                        placeholder={blurhash}
                                        transition={1000}
                                        contentFit="cover"
                                   />
                                   <Button
                                        onPress={() => {
                                             removeTitlesFromList(id, item.id, library.baseUrl, 'Events').then(async () => {
                                                  queryClient.invalidateQueries({ queryKey: ['list', id] });
                                             });
                                        }}
                                        size="$sm"
                                        variant="link">
                                        <ButtonIcon color={theme['colors']['warning']['500']} as={MaterialIcons} name="delete" />
                                        <ButtonText color={theme['colors']['warning']['500']}>{getTermFromDictionary(language, 'delete')}</ButtonText>
                                   </Button>
                              </VStack>
                              <VStack w="65%">
                                   <Text
                                        color={textColor}
                                        bold
                                        fontSize="$sm"
                                        >
                                        {item.title}
                                   </Text>
                                   {item.start_date && item.end_date ? (
                                        <>
                                             <Text color={textColor} fontSize="$xs">{displayDay}</Text>
                                             <Text color={textColor} fontSize="$xs">
                                                  {displayStartTime} - {displayEndTime}
                                             </Text>
                                        </>
                                   ) : null}
                                   {registrationRequired ? (
                                        <HStack mt="$1" direction="row" space="sm" flexWrap="wrap">
                                             <Badge key={0} colorScheme="secondary" mt="$1" variant="outline" rounded="4px" fontSize="$xs">
                                                  <BadgeText>{getTermFromDictionary(language, 'registration_required')}</BadgeText>
                                             </Badge>
                                        </HStack>
                                   ) : null}
                              </VStack>
                         </HStack>
                    </Pressable>
               );
          }

          return (
               <Pressable borderBottomWidth="$1" borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']} pl="$4" pr="$5" py="$2" onPress={() => handleOpenItem(item.id, item.title)}>
                    <HStack space="sm">
                         <VStack maxW="35%">
                              <Image
                                   alt={item.title}
                                   source={imageUrl}
                                   style={{
                                        width: 100,
                                        height: 150,
                                        borderRadius: 4,
                                   }}
                                   placeholder={blurhash}
                                   transition={1000}
                                   contentFit="cover"
                              />
                              <Button
                                   onPress={() => {
                                        removeTitlesFromList(id, item.id, library.baseUrl, 'GroupedWork').then(async () => {
                                             queryClient.invalidateQueries({ queryKey: ['list', id] });
                                        });
                                   }}
                                   size="sm"
                                   variant="link">
                                   <ButtonIcon color={theme['colors']['warning']['500']} as={MaterialIcons} name="delete" mr="$1" />
                                   <ButtonText color={theme['colors']['warning']['500']}>{getTermFromDictionary(language, 'delete')}</ButtonText>
                              </Button>
                         </VStack>
                         <VStack w="65%">
                              <Text
                                   color={textColor}
                                   bold
                                   fontSize="$sm"
                                   >
                                   {item.title}
                              </Text>
                              {item.author ? (
                                   <Text color={textColor} fontSize="$xs">
                                        {getTermFromDictionary(language, 'by')} {item.author}
                                   </Text>
                              ) : null}
                         </VStack>
                    </HStack>
               </Pressable>
          );
     };

     const Paging = () => {
          return (
               <Box
                    p="$2"
                    bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}
                    borderBottomWidth="$1"
                    borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']}
                    flexWrap="nowrap"
                    alignItems="center">
                    <ScrollView horizontal>
                         <ButtonGroup size="sm">
                              <Button bgColor={theme['colors']['primary']['500']} onPress={() => setPage(page - 1)} isDisabled={page === 1}>
                                   <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'previous')}</ButtonText>
                              </Button>
                              <Button
                                   bgColor={theme['colors']['primary']['500']}
                                   onPress={() => {
                                        if (!isPreviousData && data?.hasMore) {
                                             console.log('Adding to page');
                                             setPage(page + 1);
                                        }
                                   }}
                                   isDisabled={isPreviousData || !data?.hasMore}>
                                   <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'next')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ScrollView>
                    <Text mt="$2" fontSize="$sm" color={textColor}>
                         {paginationLabel}
                    </Text>
               </Box>
          );
     };

     const getActionButtons = () => {
          let sortLength = 8 * sortBy.dateAdded.length + 80;
          if (sort === 'title') {
               sortLength = 8 * sortBy.title.length + 80;
          } else if (sort === 'recentlyAdded') {
               sortLength = 8 * sortBy.recentlyAdded.length + 80;
          } else if (sort === 'custom') {
               sortLength = 8 * sortBy.custom.length + 80;
          } else if (sort === 'dateAdded') {
               sortLength = 8 * sortBy.dateAdded.length + 80;
          }

          const sortLabel = () => {
               switch (sort) {
                    case "recentlyAdded":
                         return sortBy.recentlyAdded;
                    case "custom":
                         return sortBy.custom;
                    case "title":
                         return sortBy.title;
                    case "dateAdded":
                         return sortBy.dateAdded;
                    default:
                         return getTermFromDictionary(language, 'select_sort_method');
               }
          };

          return (
               <Box
                    p="$2"
                    bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}
                    borderBottomWidth="$1"
                    borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']}
                    flexWrap="nowrap">
                    <ScrollView horizontal>
                         <HStack space="sm">
                              <FormControl w={sortLength}>
                                   <Select
                                        name="sortBy"
                                        selectedValue={sort}
                                        defaultValue={sort}
                                        accessibilityLabel={getTermFromDictionary(language, 'select_sort_method')}
                                        onValueChange={(itemValue) => setSort(itemValue)}>
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
                                                  <SelectItem label={sortBy.title} value="title" key={0} bgColor={sort == "title" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "title" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                  <SelectItem label={sortBy.dateAdded} value="dateAdded" key={1} bgColor={sort == "dateAdded" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "dateAdded" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                  <SelectItem label={sortBy.recentlyAdded} value="recentlyAdded" key={2} bgColor={sort == "recentlyAdded" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "recentlyAdded" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                                  <SelectItem label={sortBy.custom} value="custom" key={3} bgColor={sort == "custom" ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: sort == "custom" ? theme['colors']['tertiary']['500-text'] : textColor } }}/>
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                              <EditList data={list} listId={id} />
                         </HStack>
                    </ScrollView>
               </Box>
          );
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     return (
          <Box style={{ flex: 1 }}>
               {_.size(systemMessagesForScreen) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
               {status === 'loading' || isFetching ? (
                    loadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <>
                         <Box style={{ paddingBottom: 100 }}>
                              {getActionButtons()}
                              <FlatList data={data.listTitles} ListFooterComponent={Paging} renderItem={({ item }) => renderItem(item, library.baseUrl)} keyExtractor={(item, index) => index.toString()} />
                         </Box>
                    </>
               )}
          </Box>
     );
};
