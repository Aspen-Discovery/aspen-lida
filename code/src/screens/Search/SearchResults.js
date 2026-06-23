import {
     Button,
     ButtonGroup,
     ButtonIcon,
     ButtonText,
     Heading,
     Box,
     Center,
     FlatList,
     HStack,
     Pressable,
     Text,
     SafeAreaView,
     Badge,
     BadgeText,
     VStack,
     Input, InputSlot, InputIcon, InputField, FormControl
} from '@gluestack-ui/themed';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import _ from 'lodash';
import {ScanBarcode, SearchIcon, SlidersHorizontalIcon, XIcon} from 'lucide-react-native';
import moment from 'moment';

import { useColorModeValue, useToken } from 'native-base';
import React from 'react';
import { ScrollView } from 'react-native';
import { loadError, popToast } from '../../components/loadError';
import { LoadingSpinner } from '../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../components/Notifications';

import { LanguageContext, LibraryBranchContext, LibrarySystemContext, SearchContext, SystemMessagesContext, ThemeContext } from '../../context/initialContext';
import { getCleanTitle } from '../../helpers/item';
import {navigate, navigateStack} from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { GLOBALS, SearchGlobal } from '../../util/globals';
import { formatDiscoveryVersion, decodeHTML, isValidUrl } from '../../helpers/helpers';
import { getAppliedFilters, getAvailableFacetsKeys, getSortList } from '../../util/api/search';
import { setDefaultFacets } from '../../util/api/searchHelper';

import AddToList from './AddToList';
import { logDebugMessage, logErrorMessage } from '../../util/logging';
import { createApiClient } from '../../util/api/apiFactory';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const SearchResults = () => {
     const navigation = useNavigation();
     const route = useRoute();
     const [page, setPage] = React.useState(1);
     const [storedTerm, setStoredTerm] = React.useState('');
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { scope } = React.useContext(LibraryBranchContext);
     const { currentIndex, currentSource, updateCurrentIndex, updateCurrentSource, updateIndexes, updateSources } = React.useContext(SearchContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const url = library.baseUrl;
     const [paginationLabel, setPaginationLabel] = React.useState('Page 1 of 1');

     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);

     let term = useRoute().params.term ?? '%';
     term = term.replace(/" "/g, '%20');

     let isScannerSearch = useRoute().params.scannerSearch ?? false;

     let params = useRoute().params.pendingParams ?? [];

     const prevRoute = useRoute().params.prevRoute ?? 'SearchHome';

     const type = useRoute().params.type ?? 'catalog';
     const id = useRoute().params.id ?? null;
     const barcodeType = useRoute().params.barcodeType ?? null;

     const systemMessagesForScreen = [];

     if (term && term !== storedTerm) {
          console.log('Search term changed. Clearing previous search options...');
          setStoredTerm(term);
          setPage(1);
          SearchGlobal.pendingFilters = [];
          SearchGlobal.sortMethod = 'relevance';
          SearchGlobal.appliedFilters = [];
          SearchGlobal.sortList = [];
          SearchGlobal.availableFacets = [];
          SearchGlobal.defaultFacets = [];
          SearchGlobal.pendingFilters = [];
          SearchGlobal.appendedParams = '';
          params = [];
     }

     React.useEffect(() => {
          if (_.isArray(systemMessages)) {
               systemMessages.map((obj, index, collection) => {
                    if (obj.showOn === '0') {
                         systemMessagesForScreen.push(obj);
                    }
               });
          }
     }, [systemMessages]);

     const { status, data, error, isFetching, isPreviousData } = useQuery({
          queryKey: ['searchResults', url, page, term, scope, params, type, id, language, currentIndex, currentSource],
          queryFn: () => fetchSearchResults(term, page, scope, url, type, id, language, currentIndex, currentSource, barcodeType),
          keepPreviousData: true,
          staleTime: 1000,
          onSuccess: (data) => {
               if (data.totalPages) {
                    let tmp = getTermFromDictionary(language, 'page_of_page');
                    tmp = tmp.replace('%1%', page);
                    tmp = tmp.replace('%2%', data.totalPages);
                    console.log(tmp);
                    setPaginationLabel(tmp);
               }
               if ((data.totalResults === 1 || data.totalResults === '1') && isScannerSearch) {
                    const result = data.results[0];
                    if (result.key) {
                         navigate('GroupedWorkScreen', {
                              id: result.key,
                              title: getCleanTitle(result.title),
                              url: library.baseUrl,
                              libraryContext: library,
                         });
                    }
               }
          },
          onError: (error) => {
               logDebugMessage("Error searching");
               logErrorMessage(error);
          }
     });

     const Header = () => {
          const num = _.toInteger(data?.totalResults);
          if (num > 0) {
               let label = num + ' ' + getTermFromDictionary(language, 'results');
               if (num === 1) {
                    label = num + ' ' + getTermFromDictionary(language, 'result');
               }
               return (
                    <Box bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']} borderBottomWidth={1} borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']}>
                         <Box m="$2">
                              <Text color={textColor}>{label}</Text>
                         </Box>
                    </Box>
               );
          }

          return null;
     };

     const Paging = () => {
          if (data.totalPages > 1) {
               return (
                    <Box p="$2" bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']} borderTopWidth={1} borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']} flexWrap="nowrap" alignItems="center">
                         <ScrollView horizontal>
                              <ButtonGroup>
                                   <Button onPress={() => setPage(page - 1)} isDisabled={page === 1} size="sm" bgColor={theme['colors']['primary']['500']}>
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'previous')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme['colors']['primary']['500']}
                                        onPress={() => {
                                             if (!isPreviousData && data.hasMore) {
                                                  console.log('Adding to page');
                                                  setPage(page + 1);
                                             }
                                        }}
                                        isDisabled={isPreviousData || !data.hasMore}
                                        size="sm">
                                        <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'next')}</ButtonText>
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

     const NoResults = () => {
          return (
               <>
                    {_.size(systemMessagesForScreen) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
                    <Center flex={1}>
                         <Heading pt="$5" color={textColor}>
                              {getTermFromDictionary(language, 'no_results')}
                         </Heading>
                         <Text bold w="75%" textAlign="center" color={textColor}>
                              {route.params?.term}
                         </Text>
                    </Center>
               </>
          );
     };

     return (
          <SafeAreaView style={{ flex: 1 }}>
               {_.size(systemMessagesForScreen) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
               {status === 'loading' || isFetching ? (
                    LoadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <Box flex={1}>
                         {data.totalResults > 0 ? <FilterBar /> : null}
                         <SearchBox term={term} />
                         <FlatList data={data.results} ListHeaderComponent={Header} ListFooterComponent={Paging} ListEmptyComponent={NoResults} renderItem={({ item }) => <DisplayResult data={item} />} keyExtractor={(item, index) => index.toString()} />
                    </Box>
               )}
          </SafeAreaView>
     );
};

const DisplayResult = (data) => {
     const item = data.data;
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const { currentSource } = React.useContext(SearchContext);
     const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));

     const handlePressItem = () => {
          if (currentSource === 'events') {
               let eventSource = item.source;
               if (item.source === 'lc') {
                    eventSource = 'library_calendar';
               }
               if (item.source === 'libcal' || item.source === 'springshare_libcal') {
                    eventSource = 'springshare';
               }

               if (item.bypass) {
                    openURL(item.url);
               } else {
                    navigate('EventScreen', {
                         id: item.key,
                         title: getCleanTitle(item.title),
                         url: library.baseUrl,
                         source: eventSource,
                    });
               }
          } else {
               navigate('GroupedWorkScreen', {
                    id: item.key,
                    title: getCleanTitle(item.title),
                    url: library.baseUrl,
                    libraryContext: library,
               });
          }
     };

     const formats = item?.itemList ?? [];

     function getFormat(n) {

          // Skip empty or invalid formats.
          if (!n || !n.name || n.name.trim() === '') {
               return null;
          }

          return (
               <Badge key={n.key} borderRadius="$sm" borderColor={theme['colors']['secondary']['400']} variant="outline" bg="transparent">
                    <BadgeText textTransform="none" color={theme['colors']['secondary']['400']} fontSize="$xs">
                         {n.name}
                    </BadgeText>
               </Badge>
          );
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

     const imageUrl = item.image;

     const key = 'medium_' + item.key;
     let url = library.baseUrl + '/bookcover.php?id=' + item.key + '&size=medium';

     if (currentSource === 'events') {
          const keyParts = item.key.split('_');
          if(isValidUrl(imageUrl)) {
               url = imageUrl;
          } else {
              url += '&type=' + keyParts[0] + '_event';
          }

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

          let locationData = item?.location ?? [];
          let roomData = item?.room ?? null;

          return (
               <Pressable borderBottomWidth={1} borderColor={colorMode === 'light' ? theme['colors']['warmGray']['400'] : theme['colors']['gray']['600']} pl="$4" pr="$5" py="$2" onPress={handlePressItem}>
                    <HStack space="md">
                         <VStack sx={{ '@base': { width: 100 }, '@lg': { width: 180 } }}>
                              <Box sx={{ '@base': { height: 150 }, '@lg': { height: 250 } }}>
                                   <Image
                                        alt={item.title}
                                        source={url}
                                        style={{
                                             width: '100%',
                                             height: '100%',
                                             borderRadius: 4,
                                        }}
                                        placeholder={blurhash}
                                        transition={1000}
                                        contentFit="cover"
                                   />
                              </Box>
                              {item.canAddToList ? <AddToList source="Events" itemId={item.key} btnStyle="sm" /> : null}
                         </VStack>
                         <VStack w="65%" pt="$1">
                              <Text color={textColor} bold fontSize="$sm" pb="$1">
                                   {decodeHTML(item.title)}
                              </Text>
                              {item.start_date && item.end_date ? (
                                   <>
                                        <Text color={textColor} fontSize="$xs">
                                             {displayDay}
                                        </Text>
                                        <Text color={textColor} fontSize="$xs">
                                             {displayStartTime} - {displayEndTime}
                                        </Text>
                                   </>
                              ) : null}
                              {locationData.name ? (
                                   <Text color={textColor} fontSize="$xs">
                                        {locationData.name}
                                   </Text>
                              ) : null}
                              {registrationRequired ? (
                                   <HStack mt="$4" direction="row" space="xs" flexWrap="wrap">
                                        <Badge key={0} borderRadius="$sm" borderColor={theme['colors']['secondary']['400']} variant="outline" bg="transparent">
                                             <BadgeText textTransform="none" color={theme['colors']['secondary']['400']} fontSize="$xs">
                                                  {getTermFromDictionary(language, 'registration_required')}
                                             </BadgeText>
                                        </Badge>
                                   </HStack>
                              ) : null}
                         </VStack>
                    </HStack>
               </Pressable>
          );
     }

     return (
          <Pressable borderBottomWidth={1} borderColor={colorMode === 'light' ? theme['colors']['warmGray']['400'] : theme['colors']['gray']['600']} pl="$4" pr="$5" py="$2" onPress={handlePressItem}>
               <HStack space="md">
                    <VStack sx={{ '@base': { width: 100 }, '@lg': { width: 180 } }}>
                         <Box sx={{ '@base': { height: 150 }, '@lg': { height: 250 } }}>
                              <Image
                                   alt={item.title}
                                   source={url}
                                   style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 4,
                                   }}
                                   placeholder={blurhash}
                                   transition={1000}
                                   contentFit="cover"
                              />
                         </Box>
                         {item.language ? (
                              <Center
                                   mt="$1"
                                   sx={{
                                        bgColor: colorMode === 'light' ? theme['colors']['warmGray']['200'] : theme['colors']['coolGray']['900'],
                                   }}>
                                   <Badge
                                        size="$sm"
                                        sx={{
                                             bgColor: colorMode === 'light' ? theme['colors']['warmGray']['200'] : theme['colors']['coolGray']['900'],
                                        }}>
                                        <BadgeText textTransform="none" color={colorMode === 'light' ? theme['colors']['coolGray']['600'] : theme['colors']['warmGray']['400']} sx={{ '@base': { fontSize: 10 }, '@lg': { fontSize: 16, padding: 4, textAlign: 'center' } }}>
                                             {item.language}
                                        </BadgeText>
                                   </Badge>
                              </Center>
                         ) : null}
                         <AddToList itemId={item.key} btnStyle="sm" />
                    </VStack>
                    <VStack w="65%" pt="$1">
                         <Text color={textColor} bold fontSize="$sm" pb="$1">
                              {item.title}
                         </Text>
                         {item.author ? (
                              <Text color={textColor} fontSize="$xs">
                                   {getTermFromDictionary(language, 'by')} {item.author}
                              </Text>
                         ) : null}
                         <HStack mt="$4" direction="row" space="xs" flexWrap="wrap">
                              {_.compact(_.map(formats, getFormat))}
                         </HStack>
                    </VStack>
               </HStack>
          </Pressable>
     );
};

const FilterBar = () => {
     const navigation = useNavigation();
     const { language } = React.useContext(LanguageContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const version = formatDiscoveryVersion(library.discoveryVersion);
     const type = useRoute().params.type ?? 'catalog';

     if (version >= '22.11.00' && type === 'catalog') {
          return (
               <Box
                    padding="$2"
                    paddingBottom="$0"
                    sx={{
                         bg: colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700'],
                         borderColor: colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600'],
                    }}
                    flexWrap="nowrap">
                    <ScrollView horizontal>
                         <Button
                              size="sm"
                              variant="solid"
                              mr="$1"
                              bg={theme['colors']['primary']['600']}
                              onPress={() => {
                                   navigation.push('modal', {
                                        screen: 'Filters',
                                        params: {
                                             pendingUpdates: [],
                                        },
                                   });
                              }}>
                              <ButtonIcon color={theme['colors']['primary']['600-text']} as={SlidersHorizontalIcon} mr="$1" />
                              <ButtonText color={theme['colors']['primary']['600-text']}>{getTermFromDictionary(language, 'filters')}</ButtonText>
                         </Button>
                         <CreateFilterButton />
                    </ScrollView>
               </Box>
          );
     }
};

const SearchBox = (props) => {
     const navigation = useNavigation();
     const { term } = props;
     const { language } = React.useContext(LanguageContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const [searchTerm, setSearchTerm] = React.useState(term);

     const openScanner = async () => {
          navigateStack('BrowseTab', 'Scanner');
     };

     const clearSearch = () => {
          setSearchTerm('');
     }

     const updateSearch = async () => {
          setSearchTerm(searchTerm);
          navigation.dispatch(CommonActions.setParams({ term: searchTerm }));
     };

     return (
         <Box padding="$2" sx={{
              bg: colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700'],
              borderColor: colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600'],
         }} borderBottomWidth={1}>
              <FormControl pb="$5">
                   <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                        <InputSlot>
                             <InputIcon as={SearchIcon} ml="$2" color={textColor} />
                        </InputSlot>
                        <InputField returnKeyType="search" variant="outline" autoCapitalize="none" onChangeText={(term) => setSearchTerm(term)} status="info" placeholder={getTermFromDictionary(language, 'search')} onSubmitEditing={updateSearch} value={searchTerm} size="$lg" sx={{ color: textColor, borderColor: textColor, ':focus': { borderColor: textColor } }} />
                        {searchTerm ? (
                             <InputSlot onPress={() => clearSearch()}>
                                  <InputIcon as={XIcon} mr="$2" color={textColor} />
                             </InputSlot>
                        ) : null}
                        <InputSlot onPress={() => openScanner()}>
                             <InputIcon as={ScanBarcode} mr="$2" color={textColor} />
                        </InputSlot>
                   </Input>
              </FormControl>
         </Box>
     )
}

const CreateFilterButtonDefaults = () => {
     const navigation = useNavigation();
     const defaults = SearchGlobal.defaultFacets;
     const { location } = React.useContext(LibraryBranchContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);

     const locationGroupedWorkDisplaySettings = location.groupedWorkDisplaySettings ?? [];
     const libraryGroupedWorkDisplaySettings = library.groupedWorkDisplaySettings ?? [];

     let defaultAvailabilityToggleLabel = 'Entire Collection';
     let defaultAvailabilityToggleValue = 'global';
     if (locationGroupedWorkDisplaySettings.availabilityToggleValue) {
          defaultAvailabilityToggleValue = locationGroupedWorkDisplaySettings.availabilityToggleValue;
     } else if (libraryGroupedWorkDisplaySettings.availabilityToggleValue) {
          defaultAvailabilityToggleValue = libraryGroupedWorkDisplaySettings.availabilityToggleValue;
     }

     if (defaultAvailabilityToggleValue === 'global') {
          if (locationGroupedWorkDisplaySettings.superScopeLabel || _.isEmpty(locationGroupedWorkDisplaySettings.superScopeLabel)) {
               defaultAvailabilityToggleLabel = locationGroupedWorkDisplaySettings.superScopeLabel;
          } else if (libraryGroupedWorkDisplaySettings.superScopeLabel || _.isEmpty(libraryGroupedWorkDisplaySettings.superScopeLabel)) {
               defaultAvailabilityToggleLabel = libraryGroupedWorkDisplaySettings.superScopeLabel;
          }
     } else if (defaultAvailabilityToggleValue === 'local') {
          if (locationGroupedWorkDisplaySettings.localLabel || _.isEmpty(locationGroupedWorkDisplaySettings.localLabel)) {
               defaultAvailabilityToggleLabel = locationGroupedWorkDisplaySettings.localLabel;
          } else if (libraryGroupedWorkDisplaySettings.localLabel || _.isEmpty(libraryGroupedWorkDisplaySettings.localLabel)) {
               defaultAvailabilityToggleLabel = libraryGroupedWorkDisplaySettings.localLabel;
          }
     } else if (defaultAvailabilityToggleValue === 'available') {
          if (locationGroupedWorkDisplaySettings.availableLabel || _.isEmpty(locationGroupedWorkDisplaySettings.availableLabel)) {
               defaultAvailabilityToggleLabel = locationGroupedWorkDisplaySettings.availableLabel;
          } else if (libraryGroupedWorkDisplaySettings.availableLabel || _.isEmpty(libraryGroupedWorkDisplaySettings.availableLabel)) {
               defaultAvailabilityToggleLabel = libraryGroupedWorkDisplaySettings.availableLabel;
          }
     } else if (defaultAvailabilityToggleValue === 'available_online') {
          if (locationGroupedWorkDisplaySettings.availableOnlineLabel || _.isEmpty(locationGroupedWorkDisplaySettings.availableOnlineLabel)) {
               defaultAvailabilityToggleLabel = locationGroupedWorkDisplaySettings.availableOnlineLabel;
          } else if (libraryGroupedWorkDisplaySettings.availableOnlineLabel || _.isEmpty(libraryGroupedWorkDisplaySettings.availableOnlineLabel)) {
               defaultAvailabilityToggleLabel = libraryGroupedWorkDisplaySettings.availableOnlineLabel;
          }
     }

     return (
          <ButtonGroup space="sm" vertical>
               {defaults.map((obj, index) => {
                    if (obj['field'] === 'availability_toggle') {
                         const label = obj['label'] + ': ' + defaultAvailabilityToggleLabel;
                         return (
                              <Button
                                   key={index}
                                   size="sm"
                                   variant="outline"
                                   sx={{
                                        borderColor: colorMode === 'light' ? theme['colors']['muted']['300'] : theme['colors']['gray']['400'],
                                   }}
                                   onPress={() => {
                                        navigation.push('modal', {
                                             screen: 'Facet',
                                             params: {
                                                  navigation: navigation,
                                                  key: obj['field'],
                                                  title: obj['label'],
                                                  facets: SearchGlobal.availableFacets[obj['label']].facets,
                                                  pendingUpdates: [],
                                                  extra: obj,
                                             },
                                        });
                                   }}>
                                   <ButtonText color={textColor}>{label}</ButtonText>
                              </Button>
                         );
                    }

                    return (
                         <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              sx={{
                                   borderColor: colorMode === 'light' ? theme['colors']['primary']['400'] : theme['colors']['gray']['400'],
                              }}
                              onPress={() => {
                                   navigation.push('modal', {
                                        screen: 'Facet',
                                        params: {
                                             navigation: navigation,
                                             key: obj['field'],
                                             title: obj['label'],
                                             facets: SearchGlobal.availableFacets[obj['label']].facets,
                                             pendingUpdates: [],
                                             extra: obj,
                                        },
                                   });
                              }}>
                              <ButtonText color={textColor}>{obj['label']}</ButtonText>
                         </Button>
                    );
               })}
          </ButtonGroup>
     );
};

const CreateFilterButton = () => {
     const { currentSource } = React.useContext(SearchContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const navigation = useNavigation();
     const appliedFacets = SearchGlobal.appliedFilters;
     const sort = _.find(appliedFacets['Sort By'], {
          field: 'sort_by',
          value: 'relevance',
     });

     if ((_.size(appliedFacets) > 0 && _.size(sort) === 0) || (_.size(appliedFacets) >= 1 && _.size(sort) > 1) || (_.size(appliedFacets) >= 1 && currentSource === 'events')) {
          return (
               <ButtonGroup space="sm" vertical>
                    {_.map(appliedFacets, function (item, index, collection) {
                         const cluster = _.filter(SearchGlobal.availableFacets, ['field', item[0]['field']]);
                         let labels = '';
                         _.forEach(item, function (value, key) {
                              let label = value['display'];
                              if (item[0].field === 'sort_by') {
                                   label = getSortLabel(label);
                              }
                              if (labels.length === 0) {
                                   labels = labels.concat(_.toString(label));
                              } else {
                                   labels = labels.concat(', ', _.toString(label));
                              }
                         });
                         const label = _.truncate(index + ': ' + labels);
                         return (
                              <Button
                                   variant="outline"
                                   size="sm"
                                   key={index}
                                   sx={{
                                        borderColor: colorMode === 'light' ? theme['colors']['muted']['300'] : theme['colors']['gray']['400'],
                                   }}
                                   onPress={() => {
                                        navigation.push('modal', {
                                             screen: 'Facet',
                                             params: {
                                                  data: item,
                                                  navigation,
                                                  defaultValues: [],
                                                  key: item[0]['field'],
                                                  title: cluster[0]['label'],
                                                  facets: item[0]['facets'],
                                                  pendingUpdates: [],
                                                  extra: cluster[0],
                                             },
                                        });
                                   }}>
                                   <ButtonText color={textColor}>{label}</ButtonText>
                              </Button>
                         );
                    })}
               </ButtonGroup>
          );
     }

     return <CreateFilterButtonDefaults />;
};

async function fetchSearchResults(term, page, scope, url, type, id, language, index, source, barcodeType) {
     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutFast,
          language,
     });

     const params = {
          library: scope ?? null,
          lookfor: term ?? null,
          pageSize: 25,
          page: page ?? 1,
          type: type ?? 'catalog',
          id,
          language,
          includeSortList: true,
          source,
          searchIndex: index,
          barcodeType,
     };

     logDebugMessage('fetchSearchResults: ' + SearchGlobal.appendedParams);

     const endpoint = '/SearchAPI?method=searchLite' + SearchGlobal.appendedParams;
     const results = await client.post(endpoint, {}, { params });

     const data = results.ok ? (results.data ?? {}) : {};

     let morePages = true;
     if (data.result?.page_current === data.result?.page_total) {
          morePages = false;
     } else if (data.result?.page_total === 1) {
          morePages = false;
     }

     SearchGlobal.id = data?.result?.id ?? null;
     SearchGlobal.sortMethod = data?.result?.sort ?? '';
     SearchGlobal.term = data?.result?.lookfor ?? '';
     SearchGlobal.availableFacets = data?.result?.options ?? [];

     await getSortList(url, language);
     await getAvailableFacetsKeys(url, language);
     await getAppliedFilters(url, language);

     setDefaultFacets(data?.result?.options ?? []);

     return {
          results: data.result?.items ?? [],
          totalResults: data.result?.totalResults ?? 0,
          curPage: data.result?.page_current ?? 0,
          totalPages: data.result?.page_total ?? 0,
          hasMore: morePages,
          source: data?.result?.searchSource ?? 'local',
          index: data?.result?.searchIndex ?? 'Keyword',
          term,
          message: data.data?.message ?? null,
          error: data.data?.error?.message ?? false,
     };
}

function getSortLabel(payload = '') {
     let label = payload;
     if (payload) {
          if (payload === 'year desc,title asc') {
               label = 'Publication Year Desc';
          } else if (payload === 'relevance') {
               label = 'Best Match';
          } else if (payload === 'author asc,title asc') {
               label = 'Author';
          } else if (payload === 'title') {
               label = 'Title';
          } else if (payload === 'days_since_added asc') {
               label = 'Date Purchased Desc';
          } else if (payload === 'sort_callnumber') {
               label = 'Call Number';
          } else if (payload === 'sort_popularity') {
               label = 'Total Checkouts';
          } else if (payload === 'sort_rating') {
               label = 'User Rating';
          } else if (payload === 'total_holds desc') {
               label = 'Number of Holds';
          }
     }
     return label;
}
