import React from 'react';
import { ChevronRight, Dot } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { loadError } from '../../../components/loadError';
import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { LanguageContext, SystemMessagesContext, ThemeContext } from '../../../context/initialContext';
import { useNotificationHistory, useUpdateNotificationHistory, useInbox, useUpdateInbox } from '../../../hooks/useUserData';
import { Heading, Box, Button, ButtonText, ButtonGroup, Center, FlatList, HStack, Icon, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { navigate } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { stripHTML, truncate } from '../../../helpers/helpers';
import { fetchNotificationHistory } from '../../../util/api/user';
import { formatNotificationHistory } from '../../../util/api/userHelper';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';

export const MyNotificationHistory = () => {
     const navigation = useNavigation();
     const [isFetching, setIsFetching] = React.useState(false);
     const [fetchError, setFetchError] = React.useState(null);
     const [page, setPage] = React.useState(1);
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');
     const library = useLibrary();
     const { language } = React.useContext(LanguageContext);
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);
     const { data: notificationHistory } = useNotificationHistory();
     const updateNotificationHistory = useUpdateNotificationHistory();
     const { data: inbox } = useInbox();
     const updateInbox = useUpdateInbox();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const systemMessagesForScreen = React.useMemo(() => {
          if (!Array.isArray(systemMessages)) return [];
          return systemMessages.filter((obj) => obj.showOn === '0' || obj.showOn === '1');
     }, [systemMessages]);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     React.useEffect(() => {
          const loadHistory = async () => {
               setIsFetching(true);
               setFetchError(null);
               try {
                    const data = await fetchNotificationHistory(page, 20, true, library.baseUrl, language);
                    if (data.ok) {
                         const history = formatNotificationHistory(data.data.result);
                         await updateInbox(history.inbox ?? []);
                         await updateNotificationHistory(history);

                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', history.curPage || page);
                         tmp = tmp.replace('%2%', history.totalPages || 1);
                         setPaginationLabel(tmp);
                    } else {
                         logDebugMessage("Error fetching notification history");
                         logDebugMessage(data);
                         getErrorMessage(data.code ?? 0, data.problem);
                    }
               } catch (error) {
                    logDebugMessage("Error fetching notification history");
                    logErrorMessage(error);
                    setFetchError(error);
               } finally {
                    setIsFetching(false);
               }
          };
          loadHistory();
     }, [library.baseUrl, language, page, updateInbox, updateNotificationHistory]);

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

     const Empty = () => {
          return (
               <>
                    {systemMessagesForScreen.length > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
                    <Center flex={1} p="$5">
                         <Heading pt="$5" color={textColor}>{getTermFromDictionary(language, 'notification_history_empty')}</Heading>
                    </Center>
               </>
          );
     };

     const Paging = () => {
          if (notificationHistory?.totalResults > 0) {
               return (
                    <Box p="$2" bgColor={colorMode === 'light' ? "$coolGray100" : "$coolGray700"} borderTopWidth="$1" borderColor={colorMode === 'light' ? "$coolGray200" : "$warmGray600"} flexWrap="nowrap" alignItems="center">
                         <ScrollView horizontal>
                              <ButtonGroup>
                                   <Button onPress={() => setPage(page - 1)} isDisabled={page === 1} size="sm" bgColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'previous')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme.tokens.colors.primary['500']}
                                        onPress={() => {
                                             const totalPages = notificationHistory?.totalPages ?? 1;
                                             if (page < totalPages) {
                                                  logDebugMessage('Adding to page');
                                                  setPage(page + 1);
                                             }
                                        }}
                                        isDisabled={isFetching || page >= (notificationHistory?.totalPages ?? 1)}
                                        size="sm">
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'next')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ScrollView>
                         <Text mt="$2" fontSize="$2xs" color={textColor}>
                              {paginationLabel}
                         </Text>
                    </Box>
               );
          }
          return null;
     };

     const handleOpenMyMessage = (item) => {
          navigate('MyNotificationHistoryMessageModal', {
               message: item,
          });
     };

     return (
          <Box style={{ flex: 1 }}>
               {systemMessagesForScreen.length > 0 ? <Box safeArea="$2">{showSystemMessage()}</Box> : null}
               {isFetching && !inbox?.length ? (
                    loadingSpinner()
               ) : fetchError ? (
                    loadError('Error', '')
               ) : (
                    <>
                         <FlatList data={inbox} ListEmptyComponent={Empty} ListFooterComponent={Paging} renderItem={({ item }) => <Item data={item} handleOpenMyMessage={handleOpenMyMessage} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />
                    </>
               )}
          </Box>
     );
};

const Item = (data) => {
     const { colorMode, textColor } = React.useContext(ThemeContext);
     const message = data.data;
     const handleOpenMyMessage = data.handleOpenMyMessage;
     let content = stripHTML(message.content);
     content = truncate(content, 35);
     return (
          <Pressable onPress={() => handleOpenMyMessage(message)} borderBottomWidth="$1" borderColor={colorMode === 'light' ? "$warmGray300" : "$coolGray500"} pl="$4" pr="$5" py="$2">
               <HStack alignItems="start">
                    {message.isRead === '0' ? (
                         <Box width="7%">
                              <Icon as={Dot} color={textColor} />
                         </Box>
                    ) : (
                         <Box width="7%" />
                    )}
                    <VStack width="86%">
                         {message.isRead === '0' ? (
                              <Text bold color={textColor} fontSize="$sm">
                                   {message.title}
                              </Text>
                         ) : (
                              <Text color={textColor} fontSize="$sm">
                                   {message.title}
                              </Text>
                         )}
                         <Text color={textColor} fontSize="$xs">
                              {content}
                         </Text>
                    </VStack>
                    <Box width="7%">
                         <Icon as={ChevronRight} color={textColor} />
                    </Box>
               </HStack>
          </Pressable>
     );
};
