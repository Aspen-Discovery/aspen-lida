import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import _ from 'lodash';
import moment from 'moment';
import { Badge, BadgeText, Box, Button, ButtonText, ButtonGroup, ButtonIcon, Center, FlatList, HStack, Pressable, ScrollView, Text, useToken, VStack, useToast } from '@gluestack-ui/themed';
import { useColorModeValue } from '../../../themes/theme';
import React from 'react';
import { loadError, popAlert, popToast } from '../../../components/loadError';

import { loadingSpinner } from '../../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, UserContext, ThemeContext } from '../../../context/initialContext';
import { getCleanTitle } from '../../../helpers/item';
import { navigate } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { fetchSavedEvents, removeSavedEvent } from '../../../util/api/event';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MyEvents = () => {
     const navigation = useNavigation();
     const queryClient = useQueryClient();
     const [isLoading, setLoading] = React.useState(false);
     const [page, setPage] = React.useState(1);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { user, savedEvents, updateSavedEvents } = React.useContext(UserContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { theme, colorMode} = React.useContext(ThemeContext);
     const pageSize = 25;
     const systemMessagesForScreen = [];

     const [filterBy, setFilterBy] = React.useState('upcoming');
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');
     const [events, updateEvents] = React.useState([]);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     React.useEffect(() => {
          if (_.isArray(systemMessages)) {
               systemMessages.map((obj) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         systemMessagesForScreen.push(obj);
                    }
               });
          }
     }, [systemMessages]);

     const { status, data, error, isFetching, isPreviousData } = useQuery(['saved_events', user.id, library.baseUrl, page, filterBy], () => fetchSavedEvents(page, pageSize, filterBy, library.baseUrl, user.language), {
          //initialData: savedEvents,
          keepPreviousData: true,
          staleTime: 1000,
          onSuccess: (data) => {
               if(data.ok) {
                    let morePages = false;

                    if (data.data.result.page_current !== data.data.result.page_total) {
                         morePages = true;
                    }

                    const events = {
                         events: data.data.result.events ?? [],
                         totalResults: data.data.result.totalResults ?? 0,
                         curPage: data.data.result.page_current ?? 0,
                         totalPages: data.data.result.page_total ?? 0,
                         hasMore: morePages,
                         filter: data.data.result.filter ?? filterBy,
                         message: data.data?.result?.message ?? null,
                    }

                    updateSavedEvents(events.events);
                    updateEvents(data.data.result ?? []);

                    if (data.data.totalPages) {
                         let tmp = getTermFromDictionary(language, 'page_of_page');
                         tmp = tmp.replace('%1%', page);
                         tmp = tmp.replace('%2%', data.data.totalPages);
                         setPaginationLabel(tmp);
                    }
               } else {
                    logDebugMessage("Error fetching saved events for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onSettle: () => setLoading(false),
          onError: (error) => {
               logDebugMessage("Error fetching saved events");
               logErrorMessage(error);
          }
     });

     const getActionButtons = () => {
          return (
               <Box
                    alignItems="center"
                    p="$2"
                    backgroundColor="$coolGray100"
                    borderBottomWidth="$1"
                    _dark={{
                         borderColor: '$coolGray600',
                         backgroundColor: '$coolGray700',
                    }}
                    borderColor="$coolGray200">
                    <ButtonGroup alignItems="center" space="md" isAttached size="sm" pb="$1">
                         <Button
                              variant={filterBy === 'all' ? 'solid' : 'outline'}
                              onPress={() => setFilterBy('all')}
                              bgColor={filterBy === 'all' ?  theme.tokens.colors.primary['500'] : (colorMode === 'light' ? "$backgroundLight50" : "$backgroundDark900")}
                              borderColor={theme.tokens.colors.primary['500']}
                              action="primary">
                              <ButtonText color={filterBy === 'all' ? theme.tokens.colors.primary['500-text'] : theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'all_events')}</ButtonText>
                         </Button>
                         <Button
                              variant={filterBy === 'upcoming' ? 'solid' : 'outline'}
                              action="primary"
                              bgColor={filterBy === 'upcoming' ?  theme.tokens.colors.primary['500'] : (colorMode === 'light' ? "$backgroundLight50" : "$backgroundDark900")}
                              borderColor={theme.tokens.colors.primary['500']}
                              onPress={() => setFilterBy('upcoming')}>
                              <ButtonText color={filterBy === 'upcoming' ? theme.tokens.colors.primary['500-text'] : theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'upcoming_events')}</ButtonText>
                         </Button>
                         <Button
                              action="primary"
                              variant={filterBy === 'past' ? 'solid' : 'outline'}
                              bgColor={filterBy === 'past' ?  theme.tokens.colors.primary['500'] : (colorMode === 'light' ? "$backgroundLight50" : "$backgroundDark900")}
                              borderColor={theme.tokens.colors.primary['500']}
                              onPress={() => setFilterBy('past')}>
                              <ButtonText color={filterBy === 'past' ? theme.tokens.colors.primary['500-text'] : theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'past_events')}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </Box>
          );
     };

     const Empty = () => {
          return (
               <Center mt={5} mb={5}>
                    <Text bold fontSize="$lg">
                         {filterBy === 'upcoming' ? getTermFromDictionary(language, 'no_events_upcoming') : filterBy === 'past' ? getTermFromDictionary(language, 'no_events_past') : getTermFromDictionary(language, 'no_events_all')}
                    </Text>
               </Center>
          );
     };

     const Paging = () => {
          if (savedEvents?.totalResults > 0) {
               return (
                    <Box
                         p="$2"
                         backgroundColor="$coolGray100"
                         borderTopWidth="$1"
                         _dark={{
                              borderColor: '$coolGray600',
                              backgroundColor: '$coolGray700',
                         }}
                         borderColor="$coolGray200"
                         flexWrap="nowrap"
                         alignItems="center">
                         <ScrollView horizontal>
                              <ButtonGroup size="sm" space="md">
                                   <Button onPress={() => setPage(page - 1)} isDisabled={page === 1} action="primary">
                                        <ButtonText>{getTermFromDictionary(language, 'previous')}</ButtonText>
                                   </Button>
                                   <Button
                                        action="primary"
                                        onPress={() => {
                                             if (!isPreviousData && data?.hasMore) {
                                                  console.log('Adding to page');
                                                  setPage(page + 1);
                                             }
                                        }}
                                        isDisabled={isPreviousData || !data?.hasMore}>
                                        <ButtonText>{getTermFromDictionary(language, 'next')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ScrollView>
                         <Text mt="$2" fontSize="$sm">
                              {paginationLabel}
                         </Text>
                    </Box>
               );
          }
          return null;
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     return (
          <Box style={{ flex: 1 }}>
               {_.size(systemMessagesForScreen) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
               {getActionButtons()}
               {events.length === 0 || status === 'loading' || isFetching ? (
                    loadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <>
                         <FlatList data={Object.keys(savedEvents)} ListEmptyComponent={Empty} ListFooterComponent={Paging} renderItem={({ item }) => <Item data={savedEvents[item]} filterBy={filterBy} setLoading={setLoading} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />
                    </>
               )}
          </Box>
     );
};

const Item = (data) => {
     const filterBy = data.filterBy;
     const setLoading = data.setLoading;
     const event = data.data;
     const toast = useToast();
     const queryClient = useQueryClient();
     const { user } = React.useContext(UserContext);
     const { language } = React.useContext(LanguageContext);
     const { library } = React.useContext(LibrarySystemContext);
     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
     const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));

     let coverUrl = event.cover;
     if (_.isNull(event.cover)) {
          coverUrl = library.baseUrl + '/bookcover.php?size=medium&id=' + event.sourceId;
     }

     let registrationRequired = false;
     if (!_.isUndefined(event.registrationRequired)) {
          registrationRequired = event.registrationRequired;
     }

     let hasPassed = false;
     if (typeof event.pastEvent !== 'undefined') {
          hasPassed = event.pastEvent;
     }

     const start = event.startDate ?? null;
     const end = event.endDate ?? null;
     let displayDay = false;
     let displayStartTime = false;
     let displayEndTime = false;
     let day = '';
     let time1arr = '';
     let time2arr = '';
     let startTime = null;
     let endTime = null;

     if (start) {
          startTime = start.date;
          let time1 = startTime.split(' ');
          day = time1[0];
          time1arr = time1[1].split(':');
          displayDay = moment(day);
          displayStartTime = moment().set({ hour: time1arr[0], minute: time1arr[1] });
          displayDay = moment(displayDay).format('dddd, MMMM D, YYYY');
          displayStartTime = moment(displayStartTime).format('h:mm A');
     }

     if (end) {
          endTime = end.date;
          let time2 = endTime.split(' ');
          time2arr = time2[1].split(':');
          displayEndTime = moment().set({ hour: time2arr[0], minute: time2arr[1] });
          displayEndTime = moment(displayEndTime).format('h:mm A');
     }

     const key = 'medium_' + event.sourceId;

     let source = event.source;
     if (event.source === 'lc') {
          source = 'library_calendar';
     }
     if (event.source === 'libcal') {
          source = 'springshare';
     }

     const openEvent = () => {
          if (!event.pastEvent && event.endDate) {
               if (event.bypass) {
                    openURL(event.url);
               } else {
                    navigate('EventDetails', {
                         id: event.sourceId,
                         title: getCleanTitle(event.title),
                         url: library.baseUrl,
                         source: source,
                    });
               }
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
                         popToast(toast, getTermFromDictionary('en', 'error_no_open_resource'), getTermFromDictionary('en', 'error_device_block_browser'), 'error');
                         console.log(err);
                    }
               });
     };

     const removeEvent = async () => {
          setLoading(true);
          await removeSavedEvent(event.sourceId, language, library.baseUrl).then((result) => {
               setLoading(false);
               queryClient.invalidateQueries({ queryKey: ['saved_events', user.id, library.baseUrl, 1, filterBy] });
               queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
               queryClient.invalidateQueries({ queryKey: ['event', event.sourceId, source, language, library.baseUrl] });
               if (result.success || result.success === 'true') {
                    popAlert(toast, getTermFromDictionary(language, 'removed_successfully'), result.message, 'success');
               } else {
                    popAlert(toast, getTermFromDictionary(language, 'error'), result.message, 'error');
               }
          });
     };

     return (
          <Pressable borderBottomWidth="$1" _dark={{ borderColor: '$coolGray600' }} borderColor="$coolGray200" pl="$4" pr="$5" py="$2" onPress={openEvent}>
               <HStack space="md">
                    {event.cover ? (
                         <VStack maxW="35%">
                              {hasPassed ? (
                                   <Box width="$full" zIndex={1}>
                                        <Badge action="warning" variant="solid" mb="-$3" ml="-$1" borderRadius="$sm">
                                             <BadgeText fontSize="$xs">
                                                  {getTermFromDictionary(language, 'flag_past')}
                                             </BadgeText>
                                        </Badge>
                                   </Box>
                              ) : null}
                              <Image
                                   alt={event.title}
                                   source={coverUrl}
                                   style={{
                                        width: 100,
                                        height: 150,
                                        borderRadius: "$sm",
                                   }}
                                   placeholder={blurhash}
                                   transition={1000}
                                   contentFit="cover"
                              />

                              <Button size="sm" variant="ghost" action="negative" onPress={() => removeEvent()}>
                                   <ButtonIcon as={MaterialIcons} name="delete" size="xs" mr="$1" />
                                   <ButtonText>{getTermFromDictionary(language, 'remove')}</ButtonText>
                              </Button>
                         </VStack>
                    ) : null}

                    <VStack w={event.cover ? '65%' : '100%'}>
                         <Text
                              _dark={{ color: "$warmGray50" }}
                              color="$coolGray800"
                              fontWeight="$bold"
                              fontSize="$md">
                              {event.title}
                         </Text>
                         {event.startDate && event.endDate ? (
                              <>
                                   <Text _dark={{ color: "$warmGray50" }} color="$coolGray800">
                                        {displayDay}
                                   </Text>
                                   <Text _dark={{ color: "$warmGray50" }} color="$coolGray800">
                                        {displayStartTime} - {displayEndTime}
                                   </Text>
                              </>
                         ) : event.startDate && !event.endDate ? (
                              <>
                                   <Text _dark={{ color: "$warmGray50" }} color="$coolGray800">
                                        {displayDay}
                                   </Text>
                                   <Text _dark={{ color: "$warmGray50" }} color="$coolGray800">
                                        {displayStartTime}
                                   </Text>
                              </>
                         ) : null}
                         {!event.cover ? (
                              <Box alignItems="flex-start" pt="$2">
                                   <Button p="$0" size="sm" variant="ghost" action="negative" onPress={() => removeEvent()}>
                                        <ButtonIcon as={MaterialIcons} name="delete" size="xs" mr="$1" />
                                        <ButtonText>{getTermFromDictionary(language, 'remove')}</ButtonText>
                                   </Button>
                              </Box>
                         ) : null}
                         {registrationRequired ? (
                              <HStack mt="$1.5" space="xs" flexWrap="wrap">
                                   <Badge key={0} action="secondary" mt="$1" variant="outline" borderRadius="$sm">
                                        <BadgeText fontSize="$sm">
                                             {getTermFromDictionary(language, 'registration_required')}
                                        </BadgeText>
                                   </Badge>
                              </HStack>
                         ) : null}
                    </VStack>
               </HStack>
          </Pressable>
     );
};
