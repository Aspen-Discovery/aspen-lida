import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import _ from 'lodash';
import moment from 'moment';
import { Badge, BadgeText, Box, Center, ChevronDownIcon, FlatList, Heading, HStack, Pressable, ScrollView, Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger, Text, VStack, ButtonGroup, Button, ButtonText } from '@gluestack-ui/themed';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { getListDetails, getListGroupDetails, getListGroups, getLists, getListTitles } from '../../../util/api/list';
import CreateList from './CreateList';
import { getErrorMessage, logDebugMessage, logErrorMessage } from '../../../util/logging';
import CreateListGroup from './CreateListGroup';
import { Platform } from 'react-native';
import { EditListGroup } from './EditListGroup';
import { EditListGroupParent } from './EditListGroupParent';
import { DeleteListGroup } from './DeleteListGroup';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MyLists = () => {
     const navigation = useNavigation();
     const hasPendingChanges = useRoute().params.hasPendingChanges ?? false;
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { lists, updateLists, listGroups, updateListGroups } = React.useContext(UserContext);
     const { language } = React.useContext(LanguageContext);

     const [page, setPage] = React.useState(1);
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');

     const [loading, setLoading] = React.useState(false);

     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);

     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     const insets = useSafeAreaInsets();

     const [currentListGroup, setCurrentListGroup] = React.useState(-1);
     const [currentListGroupData, setCurrentListGroupData] = React.useState({
          listGroupDetails: {
               title: '',
               id: -1,
          },
          listsInGroup: [],
     });

     const isFocused = useIsFocused();

     let hasListGroups = false;
     if(user.numListGroups) {
          hasListGroups = user.numListGroups > 0;
     }

     let defaultListGroup = null;
     if(user.lastListGroupViewed) {
          defaultListGroup = user.lastListGroupViewed;
     }

     const pageSize = 20;

     const sortedLists = _.sortBy(lists?.lists, ['title']);

     React.useEffect(() => {
          if (defaultListGroup) {
               updateSelectedListGroup(defaultListGroup);
          }
     }, []);

     React.useEffect(() => {
          if (isFocused) {
               if (hasPendingChanges) {
                    setLoading(true);
                    queryClient.invalidateQueries({ queryKey: ['lists', user.id, page, library.baseUrl, language] });
                    queryClient.invalidateQueries({ queryKey: ['list_groups', user.id, library.baseUrl, language] });
                    if(currentListGroup !== -1) {
                         updateSelectedListGroup(currentListGroup);
                    }
                    navigation.setParams({
                         hasPendingChanges: false,
                    });
               }
               if(currentListGroup === -1 && defaultListGroup) {
                    updateSelectedListGroup(defaultListGroup);
               }

               if(lists && !hasListGroups) {
                    setPage(lists.page_current ?? 1);
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', lists.page_current ?? 1);
                    tmp = tmp.replace('%2%', lists.page_total ?? 1);
                    setPaginationLabel(tmp);
               }
          }
     }, [isFocused]);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     useQuery(['lists', user.id, page, library.baseUrl, language], () => getLists(library.baseUrl, page, pageSize, 1), {
          initialData: lists,
          onSuccess: (data) => {
               if(data.ok) {
                    const results = data.data.result;
                    updateLists(results)
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', page ?? 1);
                    tmp = tmp.replace('%2%', results.page_total ?? 1);
                    setPaginationLabel(tmp);
               } else {
                    logDebugMessage("Error fetching user linked accounts");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
               setLoading(false);
          },
          onSettle: (data) => {
               setLoading(false);
          },
          onError: (error) => {
               logDebugMessage("Error fetching user lists");
               logErrorMessage(error);
          }
     });

     useQuery(['list_groups', user.id, library.baseUrl, language], () => getListGroups(library.baseUrl), {
          initialData: listGroups,
          onSuccess: (data) => {
               if(data.ok) {
                    const groups = {
                         groups: data.data?.result?.groups ?? [],
                         unassigned: data.data?.result?.unassigned ?? 0
                    };
                    updateListGroups(groups);
               } else {
                    logDebugMessage("Error fetching user list groups");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
               setLoading(false);
          },
          onSettle: (data) => {
               setLoading(false);
          },
          onError: (error) => {
               logDebugMessage("Error fetching user list groups");
               logErrorMessage(error);
          }
     });

     useQueries({
          queries: sortedLists?.map((list) => {
               return {
                    queryKey: ['list', list.id, user.id],
                    queryFn: () => getListTitles(list.id, library.baseUrl, 1, 25, 25, 'dateAdded'),
               };
          }),
     });

     useQueries({
          queries: sortedLists?.map((list) => {
               return {
                    queryKey: ['list-details', list.id, user.id],
                    queryFn: () => getListDetails(list.id, library.baseUrl),
               };
          }),
     });

     const updateSelectedListGroup = async (groupId) => {
          setLoading(true);
          setCurrentListGroup(groupId);
          setPage(1);
          await getListGroupDetails(groupId, library.baseUrl, 1, pageSize, 1).then((res) => {
               if(res.ok) {
                    const data = res.data.result;
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', 1);
                    tmp = tmp.replace('%2%', data.page_total ?? 1);
                    setPaginationLabel(tmp);
                    setCurrentListGroupData(data);
               } else {
                    logDebugMessage("Error fetching user list group details for group " + groupId);
                    logDebugMessage(res);
                    getErrorMessage(res.code ?? 0, res.problem);
               }
          });
          setLoading(false);
     }

     const updatePage = async (value, type) => {
          logDebugMessage('updatePage for ' + type + ": " + value);
          setLoading(true);
          setPage(value);
          if(type === 'listGroup') {
               await getListGroupDetails(currentListGroup, library.baseUrl, value, pageSize, 1).then((res) => {
                    if (res.ok) {
                         const data = res.data.result;
                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', page ?? 1);
                         tmp = tmp.replace('%2%', data.page_total ?? 1);
                         setPaginationLabel(tmp);
                         setCurrentListGroupData(data);
                    } else {
                         logDebugMessage('Error fetching user list group details for group ' + currentListGroup);
                         logDebugMessage(res);
                         getErrorMessage(res.code ?? 0, res.problem);
                    }
               });
               setLoading(false);
               return;
          }
          await getLists(library.baseUrl, value, pageSize, 1).then((res) => {
               if (res.ok) {
                    const results = res.data.result;
                    updateLists(results);
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', page ?? 1);
                    tmp = tmp.replace('%2%', results.page_total ?? 1);
                    setPaginationLabel(tmp);
               } else {
                    logDebugMessage('Error fetching user lists');
                    logDebugMessage(res);
                    getErrorMessage(res.code ?? 0, res.problem);
               }
          });
          setLoading(false);
     };

     const handleOpenList = (item) => {
          navigateStack('AccountScreenTab', 'MyList', {
               id: item.id,
               details: item,
               title: item.title,
               libraryUrl: library.baseUrl,
          });
     };

     const listEmptyComponent = () => {
          return (
               <Center mt={5} mb={5}>
                    <Text bold fontSize="$lg" color={textColor}>
                         {getTermFromDictionary(language, 'no_lists_yet')}
                    </Text>
               </Center>
          );
     };

     const renderList = (item) => {
          let lastUpdated = moment.unix(item.dateUpdated);
          lastUpdated = moment(lastUpdated).format('MMM D, YYYY');
          const listLastUpdatedOn = getTermFromDictionary(language, 'last_updated_on') + ' ' + lastUpdated;
          let privacy = getTermFromDictionary(language, 'private');
          if (item.public === 1 || item.public === true || item.public === 'true') {
               privacy = getTermFromDictionary(language, 'public');
          }
          const imageUrl = item.cover ?? library.baseUrl + '/bookcover.php?type=list&id=' + item.id + '&size=medium';
          if (item.id !== 'recommendations') {
               return (
                    <Pressable
                         onPress={() => {
                              handleOpenList(item);
                         }}
                         pl="$1"
                         pr="$1"
                         py="$2">
                         <HStack space={3} mt="$2" mb="$2" justifyContent="flex-start">
                              <VStack space={1}>
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
                                   <Badge mt={1}>
                                        <BadgeText>{privacy}</BadgeText>
                                   </Badge>
                              </VStack>
                              <VStack space={1} justifyContent="space-between" maxW="80%" pl="$2">
                                   <Box>
                                        <Text bold fontSize="$md" color={textColor}>
                                             {item.title}
                                        </Text>
                                        {item.description ? (
                                             <Text fontSize="$xs" mb={2} color={textColor}>
                                                  {item.description}
                                             </Text>
                                        ) : null}
                                        <Text fontSize="$xs" italic color={textColor}>
                                             {listLastUpdatedOn}
                                        </Text>
                                        <Text fontSize="$xs" italic color={textColor}>
                                             {item.numTitles ?? 0} {getTermFromDictionary(language, 'items')}
                                        </Text>
                                   </Box>
                              </VStack>
                         </HStack>
                    </Pressable>
               );
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

     const Paging = (type) => {
          const $type = type === 'lists' ? lists : currentListGroupData;
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
                                             updatePage(page - 1, type);
                                        }
                                   }}
                                   isDisabled={page === 1}>
                                   <ButtonText color={theme['colors']['primary']['500-text']} >{getTermFromDictionary(language, 'previous')}</ButtonText>
                              </Button>
                              <Button
                                   bgColor={theme['colors']['primary']['500']}
                                   onPress={async () => {
                                        if ($type?.page_current !== $type?.page_total) {
                                             logDebugMessage('Adding to page');
                                             let newPage = page + 1;
                                             updatePage(newPage, type);
                                        }
                                   }}
                                   isDisabled={!($type?.page_current !== $type?.page_total)}>
                                   <ButtonText color={theme['colors']['primary']['500-text']} >{getTermFromDictionary(language, 'next')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ScrollView>
                    <Text mt="$2" fontSize="$sm" color={textColor}>
                         {paginationLabel}
                    </Text>
               </Box>
          )
     }

     if (loading) {
          return loadingSpinner();
     }

     return (
          <Box style={{ flex: 1 }}>
               <Box pt="$2" px="$5" flexWrap="nowrap">
                    {showSystemMessage()}
                    <ScrollView horizontal>
                         <ButtonGroup space="sm">
                              <CreateList setLoading={setLoading} />
                              <CreateListGroup setLoading={setLoading} updateSelectedListGroup={updateSelectedListGroup} />
                         </ButtonGroup>
                    </ScrollView>
               </Box>
               {hasListGroups && Object.values(listGroups.groups) ? (
                    <Box px="$5" mt="$2">
                         <Select name="listGroupSelect" selectedValue={currentListGroup} defaultValue={defaultListGroup} onValueChange={(itemValue) => updateSelectedListGroup(itemValue)}>
                              <SelectTrigger variant="outline" size="md">
                                   {currentListGroup && currentListGroup !== '-1' && currentListGroup !== -1 ? (
                                        _.map(Object.values(listGroups.groups), function (group, selectedIndex, array) {
                                             if (group.id === currentListGroup) {
                                                  return <SelectInput value={group.title} color={textColor} />;
                                             }
                                        })
                                   ) : currentListGroup == '-1' ? (
                                        <SelectInput value={getTermFromDictionary(language, 'unassigned_lists')} color={textColor} />
                                   ) : defaultListGroup ? (
                                        <SelectInput value={defaultListGroup} color={textColor} />
                                   ) : null}
                                   <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                              </SelectTrigger>
                              <SelectPortal>
                                   <SelectBackdrop />
                                   <SelectContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']} pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}>
                                        <SelectDragIndicatorWrapper>
                                             <SelectDragIndicator />
                                        </SelectDragIndicatorWrapper>
                                        {_.map(Object.values(listGroups.groups), function (item, index, array) {
                                             return <SelectItem key={index} value={item.id} label={item.title} bgColor={currentListGroup === item.id ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: currentListGroup === item.id ? theme['colors']['tertiary']['500-text'] : textColor } }} />;
                                        })}
                                        {listGroups.unassigned > 0 ? <SelectItem key={-1} value="-1" label={getTermFromDictionary(language, 'unassigned_lists')} bgColor={currentListGroup == '-1' ? theme['colors']['tertiary']['300'] : ''} sx={{ _text: { color: currentListGroup == '-1' ? theme['colors']['tertiary']['500-text'] : textColor } }} /> : null}
                                   </SelectContent>
                              </SelectPortal>
                         </Select>
                         {currentListGroupData ? (
                              <Box mt="$2">
                                   <Box>
                                        <Heading size="xl" color={textColor}>
                                             {currentListGroupData.listGroupDetails?.title}
                                        </Heading>
                                        {currentListGroup != '-1' && (
                                             <ScrollView horizontal>
                                                  <HStack space="sm">
                                                       <EditListGroup id={currentListGroupData.listGroupDetails?.id} currentTitle={currentListGroupData.listGroupDetails?.title} handleUpdate={updateSelectedListGroup} />
                                                       <EditListGroupParent id={currentListGroupData.listGroupDetails?.id} parentId={currentListGroupData.listGroupDetails?.parentGroupId} handleUpdate={updateSelectedListGroup} />
                                                       <DeleteListGroup id={currentListGroupData.listGroupDetails?.id} handleUpdate={updateSelectedListGroup} setCurrentListGroup={setCurrentListGroup} />
                                                  </HStack>
                                             </ScrollView>
                                        )}
                                   </Box>
                                   <FlatList contentContainerStyle={{ paddingBottom: 200 }} mt="$2" data={currentListGroupData.listsInGroup} renderItem={({ item }) => renderList(item, library.baseUrl)} keyExtractor={(item, index) => index.toString()} ListEmptyComponent={listEmptyComponent} ListFooterComponent={Paging('listGroup')} />
                              </Box>
                         ) : null}
                    </Box>
               ) : (
                    <>
                         <FlatList px="$5" mt="$2" data={sortedLists} ListEmptyComponent={listEmptyComponent} renderItem={({ item }) => renderList(item, library.baseUrl)} keyExtractor={(item, index) => index.toString()} ListFooterComponent={Paging('lists')} />
                    </>
               )}
          </Box>
     );
};
