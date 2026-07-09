import { ScanBarcode, SearchIcon, XIcon, Settings, RotateCwIcon, ClockIcon } from 'lucide-react-native';
import { Center, Box, Button, ButtonGroup, ButtonIcon, ButtonText, ButtonSpinner, FormControl, Input, InputField, InputSlot, InputIcon, FlatList } from '@gluestack-ui/themed';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// custom components and helper files
import { loadingSpinner } from '../../components/loadingSpinner';
import { DisplayAndroidEndOfSupportMessage, DisplaySystemMessage } from '../../components/Notifications';
import { BrowseCategoryContext, LanguageContext, LibrarySystemContext, SearchContext, SystemMessagesContext, ThemeContext, UserContext } from '../../context/initialContext';
import { navigateStack } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getHomeScreenFeed } from '../../util/api/search';
import { formatDiscoveryVersion } from '../../helpers/helpers';
import { getDefaultFacets, getSearchIndexes, getSearchSources } from '../../util/api/search';
import DisplayBrowseCategory from './Category';
import { DisplayErrorAlertDialog } from '../../components/loadError';
import { logDebugMessage, getErrorMessage } from '../../util/logging';
import HomeScreenLinkGrid from './Link';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const DiscoverHomeScreen = () => {
     const isQueryFetching = useIsFetching();
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const isFetchingBrowseCategories = useIsFetching({ queryKey: ['browse_categories'] });
     const isFocused = useIsFocused();
     const [loading, setLoading] = React.useState(false);

     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { updateIndexes, updateSources, updateCurrentIndex, updateCurrentSource } = React.useContext(SearchContext);
     const { notificationOnboard } = React.useContext(UserContext);
     const { library, homeScreenLinks } = React.useContext(LibrarySystemContext);
     const { category, updateMaxCategories, maxNum, updateBrowseCategories } = React.useContext(BrowseCategoryContext);
     const { language } = React.useContext(LanguageContext);

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
          await queryClient.invalidateQueries({ queryKey: ['browse_categories', library.baseUrl, language, maxNum] });
          await queryClient.invalidateQueries({ queryKey: ['browse_categories_list', library.baseUrl, language] });
          setLoading(false);
     };

     const onLoadAllCategories = async () => {
          updateMaxCategories(9999);
          setLoading(true);
          await getHomeScreenFeed(9999, library.baseUrl).then((response) => {
               if(response.ok) {
                    const result = response.data.result;
                    updateBrowseCategories(result.browseCategories);
                    queryClient.setQueryData(['browse_categories', library.baseUrl, language, maxNum], result);
                    queryClient.setQueryData(['browse_categories', library.baseUrl, language, 9999], result);
               } else {
                    logDebugMessage("Error fetching browse categories");
                    logDebugMessage(response);
                    getErrorMessage(response.code ?? 0, response.problem);
               }
          });
          setLoading(false);
     };

     const showManageCategories = () => {
          navigateStack('MoreTab', 'MyPreferences_ManageBrowseCategories', { prevRoute: 'HomeScreen' });
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
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

     if (loading === true || isFetchingBrowseCategories) {
          return loadingSpinner();
     }

     /*
     // load notification onboarding prompt
     if (isQueryFetching === 0 && preliminaryLoadingCheck) {
          if (notificationOnboard !== '0' && notificationOnboard !== 0) {
               if (isFocused && promptOpen === 'yes') {
                    return <NotificationsOnboard isFocused={isFocused} promptOpen={promptOpen} setPromptOpen={setPromptOpen} />;
               }
          }
     }*/

     const clearSearch = () => {
          setSearchTerm('');
     };

     return (
          <FlatList
               bgColor={colorMode === 'light' ? "$backgroundLight50" : "$backgroundDark900"}
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
               keyExtractor={(item, index) => item.id || index.toString()}
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
                           <ButtonSpinner key="spinner" color="$textLight200" mr="$1" />
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
