import { ScanBarcode, SearchIcon, XIcon, Settings, RotateCwIcon, ClockIcon } from 'lucide-react-native';
import { Center, Box, Button, ButtonGroup, ButtonIcon, ButtonText, ButtonSpinner, FormControl, Input, InputField, InputSlot, InputIcon, FlatList } from '@gluestack-ui/themed';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import React from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// custom components and helper files
import { loadingSpinner } from '../../components/loadingSpinner';
import { DisplayAndroidEndOfSupportMessage, DisplaySystemMessage } from '../../components/Notifications';
import { SearchContext, SystemMessagesContext, ThemeContext } from '../../context/initialContext';
import { useLibrary, useHomeScreenLinks } from '../../hooks/useLibrarySystemData';
import { useUserState } from '../../hooks/useUserData';
import { useBrowseCategories, useMaxCategories, useUpdateBrowseCategories, useUpdateMaxCategories, useBrowseCategoryExpiration } from '../../hooks/useBrowseCategoryData';
import { navigateStack } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getHomeScreenFeed } from '../../util/api/search';
import { formatDiscoveryVersion } from '../../helpers/helpers';
import { getDefaultFacets, getSearchIndexes, getSearchSources } from '../../util/api/search';
import DisplayBrowseCategory from './Category';
import { DisplayErrorAlertDialog } from '../../components/loadError';
import { logDebugMessage, getErrorMessage } from '../../util/logging';
import HomeScreenLinkGrid from './Link';
import { useActiveLanguage } from '../../hooks/useLanguageData';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const DiscoverHomeScreen = () => {
     const navigation = useNavigation();
     const isFocused = useIsFocused();
     const [loading, setLoading] = React.useState(false);

     const { textColor, colorMode } = React.useContext(ThemeContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { updateIndexes, updateSources, updateCurrentIndex, updateCurrentSource } = React.useContext(SearchContext);
     const { data: userState } = useUserState();
     const notificationOnboard = userState?.notificationOnboard ?? 0;
     const library = useLibrary();
     const homeScreenLinks = useHomeScreenLinks();
     const category = useBrowseCategories();
     const maxNum = useMaxCategories();
     const updateBrowseCategories = useUpdateBrowseCategories();
     const updateMaxCategories = useUpdateMaxCategories();
     const { categoriesExpired } = useBrowseCategoryExpiration();
     const browseRefreshInFlightRef = React.useRef(false);
     const emptyRefreshAttemptedRef = React.useRef(false);
     const language = useActiveLanguage();

     const [preliminaryLoadingCheck, setPreliminaryCheck] = React.useState(false);

     const version = formatDiscoveryVersion(library.discoveryVersion);
     const [searchTerm, setSearchTerm] = React.useState('');

     const [promptOpen, setPromptOpen] = React.useState('');

     const [showAndroidEndSupportMessage, setShowAndroidEndSupportMessage] = React.useState(false);
     const [androidEndSupportMessageIsOpen, setAndroidEndSupportMessageIsOpen] = React.useState(false);

     const [showErrorDialog, setShowErrorDialog] = React.useState(false);
     const [errorTitle, setErrorTitle] = React.useState('');
     const [errorMessage, setErrorMessage] = React.useState('');

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => {
                    return null;
               },
          });
     }, [navigation]);

     useFocusEffect(
          React.useCallback(() => {
               const checkSettings = async () => {
                    logDebugMessage("Checking Settings from Home Screen");
                    if (Platform.OS === 'android') {
                         if (Device.platformApiLevel <= 30) {
                              setShowAndroidEndSupportMessage(true);
                              setAndroidEndSupportMessageIsOpen(true);
                         }
                    }

                    updateCurrentIndex('Keyword');
                    updateCurrentSource('local');
                    await getSearchIndexes(library.baseUrl, language, 'local').then((result) => {
                         updateIndexes(result);
                    });
                    await getSearchSources(library.baseUrl, language).then((result) => {
                         updateSources(result);
                    });

                    await getDefaultFacets(library.baseUrl, 5, language);
               };
               checkSettings().then(() => {
                    return () => checkSettings();
               });
          }, [language])
     );

     // Check cache on home screen focus and validate with API
     useFocusEffect(
          React.useCallback(() => {
               const validateBrowseCategoriesCache = async () => {
                    if (!library.baseUrl) {
                         return;
                    }

                    const isEmpty = !Array.isArray(category) || category.length === 0;
                    const shouldRefreshForEmpty = isEmpty && !emptyRefreshAttemptedRef.current;
                    const shouldRefresh = categoriesExpired || shouldRefreshForEmpty;

                    if (!shouldRefresh || browseRefreshInFlightRef.current) {
                         return;
                    }

                    if (shouldRefreshForEmpty) {
                         emptyRefreshAttemptedRef.current = true;
                    }

                    browseRefreshInFlightRef.current = true;
                    const requestedMax = maxNum > 0 ? maxNum : 5;

                    if (maxNum <= 0) {
                         await updateMaxCategories(5);
                    }

                    logDebugMessage("Browse categories cache expired or empty, fetching from API");
                    setLoading(true);
                    try {
                         const response = await getHomeScreenFeed(requestedMax, library.baseUrl);
                         if (response?.ok) {
                              const result = response.data.result;
                              await updateBrowseCategories(result.browseCategories);
                              if (Array.isArray(result.browseCategories) && result.browseCategories.length > 0) {
                                   emptyRefreshAttemptedRef.current = false;
                              }
                              logDebugMessage("Browse categories refreshed from API");
                         } else {
                              logDebugMessage("Error fetching browse categories from API");
                         }
                    } catch (error) {
                         logDebugMessage("Error validating browse categories cache: " + error.message);
                    } finally {
                         browseRefreshInFlightRef.current = false;
                         setLoading(false);
                    }
               };

               validateBrowseCategoriesCache();
          }, [category, categoriesExpired, maxNum, library.baseUrl, updateBrowseCategories, updateMaxCategories])
     );

     const clearText = () => {
          setSearchTerm('');
     };

     const search = () => {
          navigateStack('BrowseTab', 'SearchResults', {
               term: searchTerm,
               type: 'catalog',
               prevRoute: 'DiscoveryScreen',
               scannerSearch: false,
          });
          clearText();
     };

     const openScanner = async () => {
          navigateStack('BrowseTab', 'Scanner');
     };

     const onRefreshCategories = async () => {
          setLoading(true);
          try {
               const requestedMax = maxNum > 0 ? maxNum : 5;
               const response = await getHomeScreenFeed(requestedMax, library.baseUrl);
               if (response?.ok) {
                    const result = response.data.result;
                    await updateBrowseCategories(result.browseCategories);
                    logDebugMessage("Browse categories refreshed");
               } else {
                    logDebugMessage("Error refreshing browse categories");
                    getErrorMessage(response?.code ?? 0, response?.problem);
               }
          } catch (error) {
               logDebugMessage("Error during refresh: " + error.message);
          } finally {
               setLoading(false);
          }
     };

     const onLoadAllCategories = async () => {
          setLoading(true);
          try {
               await updateMaxCategories(9999);
               const response = await getHomeScreenFeed(9999, library.baseUrl);
               if (response?.ok) {
                    const result = response.data.result;
                    await updateBrowseCategories(result.browseCategories);
                    logDebugMessage("All categories loaded");
               } else {
                    logDebugMessage("Error fetching all browse categories");
                    getErrorMessage(response?.code ?? 0, response?.problem);
               }
          } catch (error) {
               logDebugMessage("Error loading all categories: " + error.message);
          } finally {
               setLoading(false);
          }
     };

     const showManageCategories = () => {
          navigateStack('MoreTab', 'MyPreferences_ManageBrowseCategories', { prevRoute: 'HomeScreen' });
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} />;
                    }
                    return null;
               });
          }
          return null;
     };

     const androidEndSupportMessage = () => {
          if (showAndroidEndSupportMessage && androidEndSupportMessageIsOpen) {
               logDebugMessage("Showing Android End of Support Message");
               return <DisplayAndroidEndOfSupportMessage language={language} setIsOpen={setAndroidEndSupportMessageIsOpen} isOpen={androidEndSupportMessageIsOpen} />;
          }
     };

     if (loading === true) {
          return loadingSpinner();
     }

     const clearSearch = () => {
          setSearchTerm('');
     };

     return (
          <Box>
               <FlatList
                    ListHeaderComponent={
                         <Box p="$5">
                              {androidEndSupportMessage()}
                              {showSystemMessage()}
                              <FormControl pb="$5">
                                   <Input>
                                        <InputSlot>
                                             <InputIcon as={SearchIcon} ml="$2" color={textColor} />
                                        </InputSlot>
                                        <InputField returnKeyType="search" variant="outline" autoCapitalize="none" onChangeText={(term) => setSearchTerm(term)} status="info" placeholder={getTermFromDictionary(language, 'search')} onSubmitEditing={search} value={searchTerm} size="$lg" sx={{ color: textColor, borderColor: textColor, ':focus': { borderColor: textColor } }} />
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
                              {homeScreenLinks && homeScreenLinks.length > 0 ? (
                                   <HomeScreenLinkGrid links={homeScreenLinks} />
                              ) : null}
                         </Box>
                    }
                    data={category}
                    keyExtractor={(item, index) => {
                         const baseKey = item?.id ?? item?.textId ?? item?.sourceListId ?? item?.label ?? 'browse-category';
                         return `${baseKey}-${index}`;
                    }}
                    renderItem={({ item }) => (
                         <Box px="$5">
                              <DisplayBrowseCategory category={item} />
                         </Box>
                    )}
                    ListFooterComponent={
                         <Box p="$5">
                              <ButtonOptions language={language} showManageCategories={showManageCategories} onRefreshCategories={onRefreshCategories} discoveryVersion={library.discoveryVersion} maxNum={maxNum} onLoadAllCategories={onLoadAllCategories} />
                              {showErrorDialog && (
                                   <DisplayErrorAlertDialog title={errorTitle} message={errorMessage} />
                              )}
                         </Box>
                    }
               />
          </Box>
     );
};

const ButtonOptions = (props) => {
     const { theme } = React.useContext(ThemeContext);
     const [loading, setLoading] = React.useState(false);
     const [refreshing, setRefreshing] = React.useState(false);
     const { language, showManageCategories, onRefreshCategories, maxNum, onLoadAllCategories } = props;

     return (
          <Center>
               <ButtonGroup
                    sx={{
                         '@base': {
                              flexDirection: 'column',
                         },
                         '@lg': {
                              flexDirection: 'row',
                         },
                    }}>
                    <Button
                         isDisabled={maxNum === 9999}
                         bg={theme.tokens.colors.primary['500']}
                         size="md"
                         onPress={() => {
                              setLoading(true);
                              onLoadAllCategories();
                              setTimeout(function () {
                                   setLoading(false);
                              }, 2500);
                         }}>
                         {loading ? (
                           <ButtonSpinner key="spinner" color={theme.tokens.colors.primary['500-text']} mr="$1" />
                         ) : (
                              <ButtonIcon
                                   key="icon"
                                   as={ClockIcon}
                                   color={theme.tokens.colors.primary['500-text']}
                                   mr="$1"
                                   size="sm"
                              />
                         )}
                         <ButtonText
                              color={theme.tokens.colors.primary['500-text']}
                              size="sm"
                              fontWeight="$medium">
                              {getTermFromDictionary(language, 'browse_categories_load_all')}
                         </ButtonText>
                    </Button>

                    <Button
                         bg={theme['tokens']['colors']['primary']['500']}
                         onPress={() => {
                              showManageCategories();
                         }}>
                         <ButtonIcon
                              as={Settings}
                              color={theme.tokens.colors.primary['500-text']}
                              mr="$1"
                              size="sm"
                         />
                         <ButtonText
                              color={theme.tokens.colors.primary['500-text']}
                              size="sm"
                              fontWeight="$medium">
                              {getTermFromDictionary(language, 'browse_categories_manage')}
                         </ButtonText>
                    </Button>

                    <Button
                         isDisabled={refreshing}
                         bg={theme.tokens.colors.primary['500']}
                         onPress={() => {
                              setRefreshing(true);
                              onRefreshCategories();
                              setTimeout(function () {
                                   setRefreshing(false);
                              }, 2000);
                         }}>
                         {refreshing ? <ButtonSpinner color={theme.tokens.colors.primary['500-text']} /> : <ButtonIcon as={RotateCwIcon} color={theme.tokens.colors.primary['500-text']} mr="$1" size="sm" />}

                         <ButtonText size="sm" fontWeight="$medium" color={theme.tokens.colors.primary['500-text']}>
                              {getTermFromDictionary(language, 'browse_categories_refresh')}
                         </ButtonText>
                    </Button>
               </ButtonGroup>
          </Center>
     );
};
