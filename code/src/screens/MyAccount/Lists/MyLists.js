import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Badge, BadgeText, Box, Center, ChevronDownIcon, FlatList, Heading, HStack, Pressable, ScrollView, Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectScrollView, SelectTrigger, Text, VStack, ButtonGroup, Button, ButtonText } from '@gluestack-ui/themed';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { SystemMessagesContext } from '../../../context/initialContext';
import { useLists, useListGroups, useUpdateLists, useUpdateListGroups, useUserState } from '../../../hooks/useUserData';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { getListGroupDetails, getListGroups, getLists } from '../../../util/api/list';
import CreateList from './CreateList';
import { getErrorMessage, logDebugMessage, logErrorMessage } from '../../../util/logging';
import CreateListGroup from './CreateListGroup';
import { Platform } from 'react-native';
import { EditListGroup } from './EditListGroup';
import { EditListGroupParent } from './EditListGroupParent';
import { DeleteListGroup } from './DeleteListGroup';
import { formatUnixDate, orderByFields } from '../../../helpers/helpers';
import { useActiveLanguage } from '../../../hooks/useLanguageData';
import { useTheme } from '../../../themes/theme';
import { useLibrary } from '../../../hooks/useLibrarySystemData';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';
const LISTS_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

export const MyLists = () => {
     const navigation = useNavigation();
     const hasPendingChanges = useRoute().params.hasPendingChanges ?? false;
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const library = useLibrary();
     const { data: lists } = useLists();
     const { data: listGroups } = useListGroups();
     const updateLists = useUpdateLists();
     const updateListGroups = useUpdateListGroups();
     const language = useActiveLanguage();

     const [page, setPage] = React.useState(1);
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');
     const [loading, setLoading] = React.useState(false);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { theme, textColor, colorMode } = useTheme();
     const insets = useSafeAreaInsets();

     const [currentListGroup, setCurrentListGroup] = React.useState(-1);
     const [currentListGroupData, setCurrentListGroupData] = React.useState({
          listGroupDetails: { title: '', id: -1 },
          listsInGroup: [] });

     // Track when we last fetched from the API (resets on app restart, which is intentional).
     const listsLastFetchedAt = React.useRef(null);

     // Stable refs so useFocusEffect callback can read latest state without adding them to deps
     const listsRef = React.useRef(lists);
     React.useEffect(() => { listsRef.current = lists; }, [lists]);

     const hasListGroupsRef = React.useRef(false);
     // Ref for currentListGroup so the focus effect can read it without being in its deps
     const currentListGroupRef = React.useRef(currentListGroup);
     React.useEffect(() => { currentListGroupRef.current = currentListGroup; }, [currentListGroup]);

     // Guard: only auto-select default list group once per focus event
     const autoSelectedOnFocus = React.useRef(false);


     let hasListGroups = false;
     if (user.numListGroups) {
          hasListGroups = user.numListGroups > 0;
     }
     React.useEffect(() => { hasListGroupsRef.current = hasListGroups; }, [hasListGroups]);

     let defaultListGroup = null;
     if (user.lastListGroupViewed) {
          defaultListGroup = user.lastListGroupViewed;
     }

     const pageSize = 20;
     const sortedLists = orderByFields(lists?.lists ?? [], ['title']);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box /> });
     }, [navigation]);

     // ─── Fetch helpers ──────────────────────────────────────────────────────────

     const fetchListsAndGroups = React.useCallback(async (targetPage = 1) => {
          setLoading(true);
          try {
               const [listsResult, groupsResult] = await Promise.all([
                    getLists(library.baseUrl, targetPage, pageSize, 1),
                    getListGroups(library.baseUrl),
               ]);

               if (listsResult.ok) {
                    const data = listsResult.data.result;
                    await updateLists(data);
                    listsLastFetchedAt.current = Date.now();
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', data.page_current ?? targetPage);
                    tmp = tmp.replace('%2%', data.page_total ?? 1);
                    setPaginationLabel(tmp);
                    setPage(data.page_current ?? targetPage);
               } else {
                    logDebugMessage('Error fetching user lists');
                    logDebugMessage(listsResult);
                    getErrorMessage(listsResult.code ?? 0, listsResult.problem);
               }

               if (groupsResult.ok) {
                    await updateListGroups({
                         groups: groupsResult.data?.result?.groups ?? [],
                         unassigned: groupsResult.data?.result?.unassigned ?? 0 });
               } else {
                    logDebugMessage('Error fetching user list groups');
                    logDebugMessage(groupsResult);
                    getErrorMessage(groupsResult.code ?? 0, groupsResult.problem);
               }
          } catch (error) {
               logErrorMessage(error);
          } finally {
               setLoading(false);
          }
     }, [library.baseUrl, language, pageSize, updateLists, updateListGroups]);

     const updateSelectedListGroup = React.useCallback(async (groupId) => {
          setLoading(true);
          setCurrentListGroup(groupId);
          setPage(1);
          try {
               const res = await getListGroupDetails(groupId, library.baseUrl, 1, pageSize, 1);
               if (res.ok) {
                    const data = res.data.result;
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', 1);
                    tmp = tmp.replace('%2%', data.page_total ?? 1);
                    setPaginationLabel(tmp);
                    setCurrentListGroupData(data);
               } else {
                    logDebugMessage('Error fetching user list group details for group ' + groupId);
                    logDebugMessage(res);
                    getErrorMessage(res.code ?? 0, res.problem);
               }
          } catch (error) {
               logErrorMessage(error);
          } finally {
               setLoading(false);
          }
     }, [library.baseUrl, language, pageSize]);

     // ─── Focus effect: stale check + pending-changes handling ───────────────────

     useFocusEffect(
          React.useCallback(() => {
               autoSelectedOnFocus.current = false;

               const currentLists = listsRef.current;
               const currentListGroupVal = currentListGroupRef.current;
               const isStale = !listsLastFetchedAt.current || (Date.now() - listsLastFetchedAt.current > LISTS_STALE_MS);
               const isEmpty = !currentLists?.lists?.length;
               const shouldFetch = hasPendingChanges || isEmpty || isStale;

               if (shouldFetch) {
                    fetchListsAndGroups(1).then(() => {
                         // If a list group was active and changes happened, reload it
                         if (hasPendingChanges && currentListGroupVal !== -1) {
                              updateSelectedListGroup(currentListGroupVal);
                         }
                    });
                    if (hasPendingChanges) {
                         navigation.setParams({ hasPendingChanges: false });
                    }
               } else {
                    // Use cached pagination info
                    if (currentLists && !hasListGroupsRef.current) {
                         setPage(currentLists.page_current ?? 1);
                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', currentLists.page_current ?? 1);
                         tmp = tmp.replace('%2%', currentLists.page_total ?? 1);
                         setPaginationLabel(tmp);
                    }
               }

               // Auto-select the last-viewed list group if none is active
               if (currentListGroupVal === -1 && defaultListGroup && !autoSelectedOnFocus.current) {
                    autoSelectedOnFocus.current = true;
                    updateSelectedListGroup(defaultListGroup);
               }
          }, [hasPendingChanges, defaultListGroup, fetchListsAndGroups, updateSelectedListGroup, navigation, language])
     );

     // ─── Pagination ─────────────────────────────────────────────────────────────

     const updatePage = async (value, type) => {
          logDebugMessage('updatePage for ' + type + ': ' + value);
          setLoading(true);
          setPage(value);

          if (type === 'listGroup') {
               try {
                    const res = await getListGroupDetails(currentListGroup, library.baseUrl, value, pageSize, 1);
                    if (res.ok) {
                         const data = res.data.result;
                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', value);
                         tmp = tmp.replace('%2%', data.page_total ?? 1);
                         setPaginationLabel(tmp);
                         setCurrentListGroupData(data);
                    } else {
                         logDebugMessage('Error fetching list group page ' + value + ' for group ' + currentListGroup);
                         logDebugMessage(res);
                         getErrorMessage(res.code ?? 0, res.problem);
                    }
               } catch (error) {
                    logErrorMessage(error);
               } finally {
                    setLoading(false);
               }
               return;
          }

          try {
               const res = await getLists(library.baseUrl, value, pageSize, 1);
               if (res.ok) {
                    const data = res.data.result;
                    await updateLists(data);
                    listsLastFetchedAt.current = Date.now();
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', value);
                    tmp = tmp.replace('%2%', data.page_total ?? 1);
                    setPaginationLabel(tmp);
               } else {
                    logDebugMessage('Error fetching user lists page ' + value);
                    logDebugMessage(res);
                    getErrorMessage(res.code ?? 0, res.problem);
               }
          } catch (error) {
               logErrorMessage(error);
          } finally {
               setLoading(false);
          }
     };

     // ─── UI helpers ─────────────────────────────────────────────────────────────

     const handleOpenList = (item) => {
          navigateStack('AccountScreenTab', 'MyList', {
               id: item.id,
               details: item,
               title: item.title,
               libraryUrl: library.baseUrl });
     };

     const listEmptyComponent = () => (
          <Center mt={5} mb={5}>
               <Text bold fontSize="$lg" color={textColor}>
                    {getTermFromDictionary(language, 'no_lists_yet')}
               </Text>
          </Center>
     );

     const renderList = (item) => {
          const lastUpdated = formatUnixDate(item.dateUpdated);
          const listLastUpdatedOn = getTermFromDictionary(language, 'last_updated_on') + ' ' + lastUpdated;
          let privacy = getTermFromDictionary(language, 'private');
          if (item.public === 1 || item.public === true || item.public === 'true') {
               privacy = getTermFromDictionary(language, 'public');
          }
          const imageUrl = item.cover ?? library.baseUrl + '/bookcover.php?type=list&id=' + item.id + '&size=medium';
          if (item.id !== 'recommendations') {
               return (
                    <Pressable onPress={() => handleOpenList(item)} pl="$1" pr="$1" py="$2">
                         <HStack space={3} mt="$2" mb="$2" justifyContent="flex-start">
                              <VStack space={1}>
                                   <Image
                                        alt={item.title}
                                        source={imageUrl}
                                        style={{ width: 100, height: 150, borderRadius: '$sm' }}
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
                                        <Text bold fontSize="$md" color={textColor}>{item.title}</Text>
                                        {item.description ? (
                                             <Text fontSize="$xs" mb={2} color={textColor}>{item.description}</Text>
                                        ) : null}
                                        <Text fontSize="$xs" italic color={textColor}>{listLastUpdatedOn}</Text>
                                        <Text fontSize="$xs" italic color={textColor}>{item.numTitles ?? 0} {getTermFromDictionary(language, 'items')}</Text>
                                   </Box>
                              </VStack>
                         </HStack>
                    </Pressable>
               );
          }
     };

     const showSystemMessage = () => {
          if (Array.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} />;
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
                    bgColor={colorMode === 'light' ? '$coolGray100' : '$coolGray700'}
                    borderColor={colorMode === 'light' ? '$coolGray400' : '$warmGray600'}
                    flexWrap="nowrap"
                    alignItems="center">
                    <ScrollView horizontal>
                         <ButtonGroup size="sm">
                              <Button
                                   bgColor={theme.tokens.colors.primary['500']}
                                   onPress={async () => {
                                        if (page > 1) {
                                             await updatePage(page - 1, type);
                                        }
                                   }}
                                   isDisabled={page === 1}>
                                   <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'previous')}</ButtonText>
                              </Button>
                              <Button
                                   bgColor={theme.tokens.colors.primary['500']}
                                   onPress={async () => {
                                        if ($type?.page_current !== $type?.page_total) {
                                             logDebugMessage('Adding to page');
                                             await updatePage(page + 1, type);
                                        }
                                   }}
                                   isDisabled={!($type?.page_current !== $type?.page_total) || loading}>
                                   <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'next')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ScrollView>
                    <Text mt="$2" fontSize="$sm" color={textColor}>{paginationLabel}</Text>
               </Box>
          );
     };

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
               {hasListGroups && listGroups?.groups && Object.values(listGroups.groups).length > 0 ? (
                    <Box px="$5" mt="$2">
                         <Select name="listGroupSelect" selectedValue={currentListGroup} defaultValue={defaultListGroup} onValueChange={(itemValue) => updateSelectedListGroup(itemValue)}>
                              <SelectTrigger variant="outline" size="md">
                                   {currentListGroup && currentListGroup !== '-1' && currentListGroup !== -1 ? (
                                        Object.values(listGroups.groups).map((group, selectedIndex) => {
                                             if (group.id === currentListGroup) {
                                                  return <SelectInput key={selectedIndex} py={0} value={group.title} color={textColor} />;
                                             }
                                             return null;
                                        })
                                   ) : currentListGroup == '-1' ? (
                                        <SelectInput py={0} value={getTermFromDictionary(language, 'unassigned_lists')} color={textColor} />
                                   ) : defaultListGroup ? (
                                        <SelectInput py={0} value={defaultListGroup} color={textColor} />
                                   ) : null}
                                   <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                              </SelectTrigger>
                              <SelectPortal>
                                   <SelectBackdrop />
                                   <SelectContent bgColor={colorMode === 'light' ? '$warmGray50' : '$coolGray700'} pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}>
                                        <SelectDragIndicatorWrapper>
                                             <SelectDragIndicator />
                                        </SelectDragIndicatorWrapper>
                                        <SelectScrollView>
                                             {Object.values(listGroups.groups).map((item, index) => (
                                                  <SelectItem
                                                       key={index}
                                                       value={item.id}
                                                       label={item.title}
                                                       bgColor={currentListGroup === item.id ? theme.tokens.colors.tertiary['300'] : ''}
                                                       sx={{ _text: { color: currentListGroup === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }}
                                                  />
                                             ))}
                                             {listGroups.unassigned > 0 ? (
                                                  <SelectItem
                                                       key={-1}
                                                       value="-1"
                                                       label={getTermFromDictionary(language, 'unassigned_lists')}
                                                       bgColor={currentListGroup == '-1' ? theme.tokens.colors.tertiary['300'] : ''}
                                                       sx={{ _text: { color: currentListGroup == '-1' ? theme.tokens.colors.tertiary['500-text'] : textColor } }}
                                                  />
                                             ) : null}
                                        </SelectScrollView>
                                   </SelectContent>
                              </SelectPortal>
                         </Select>
                         {currentListGroupData ? (
                              <Box mt="$2">
                                   <Box>
                                        <Heading size="xl" color={textColor}>{currentListGroupData.listGroupDetails?.title}</Heading>
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
                                   <FlatList
                                        contentContainerStyle={{ paddingBottom: 200 }}
                                        mt="$2"
                                        data={currentListGroupData.listsInGroup}
                                        renderItem={({ item }) => renderList(item)}
                                        keyExtractor={(item, index) => item.id ? String(item.id) : index.toString()}
                                        ListEmptyComponent={listEmptyComponent}
                                        ListFooterComponent={Paging('listGroup')}
                                   />
                              </Box>
                         ) : null}
                    </Box>
               ) : (
                    <FlatList
                         px="$5"
                         mt="$2"
                         data={sortedLists}
                         ListEmptyComponent={listEmptyComponent}
                         renderItem={({ item }) => renderList(item)}
                         keyExtractor={(item, index) => item.id ? String(item.id) : index.toString()}
                         ListFooterComponent={Paging('lists')}
                    />
               )}
          </Box>
     );
};
