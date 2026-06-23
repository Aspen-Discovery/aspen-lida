import { Badge, BadgeText, Box, Center, FlatList, Pressable, Text, HStack, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';

// custom components and helper files
import { loadingSpinner } from '../../../components/loadingSpinner';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { fetchSavedSearches, getSavedSearch } from '../../../util/api/list';
import { loadError } from '../../../components/loadError';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { navigateStack } from '../../../helpers/RootNavigator';
import { DisplaySystemMessage } from '../../../components/Notifications';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';

export const MySavedSearches = () => {
     const navigation = useNavigation();
     const { user, savedSearches, updateSavedSearches } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const [searches, setSearches] = React.useState([]);

     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     const { status, data, error, isFetching, isPreviousData } = useQuery(['saved_searches', user.id, library.baseUrl, language], () => fetchSavedSearches(library.baseUrl), {
          placeholderData: savedSearches,
          onSuccess: (data) => {
               if(data.ok) {
                    updateSavedSearches(data.data.result?.searches ?? []);
               } else {
                    logDebugMessage("Error fetching saved searches for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching saved searches for user");
               logErrorMessage(error);
          }
     });

     useQueries({
          queries: savedSearches?.map((savedSearch) => {
               return {
                    queryKey: ['saved_search', savedSearch.id, user.id],
                    queryFn: () => getSavedSearch(savedSearch.id, language, library.baseUrl),
               };
          }),
     });

     const Empty = () => {
          return (
               <Center mt={5} mb={5}>
                    <Text bold fontSize="$lg" color={textColor}>
                         {getTermFromDictionary(language, 'saved_searches_empty')}
                    </Text>
               </Center>
          );
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
               <Box>
                    {showSystemMessage()}
                    {status === 'loading' || isFetching ? (
                         loadingSpinner()
                    ) : status === 'error' ? (
                         loadError('Error', '')
                    ) : (
                         <>
                              <FlatList data={savedSearches} ListEmptyComponent={Empty} renderItem={({ item }) => <Item data={item} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />
                         </>
                    )}
               </Box>
          </SafeAreaView>
     );
};

const Item = (data) => {
     const { language } = React.useContext(LanguageContext);
     const item = data.data;
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     let hasNewResults = 0;
     if (!_.isUndefined(item.hasNewResults)) {
          hasNewResults = item.hasNewResults;
     }

     const openSavedSearch = () => {
          navigateStack('AccountScreenTab', 'MySavedSearch', {
               id: item.id,
               details: item,
               title: item.title,
          });
     };

     return (
          <Pressable
               onPress={() => {
                    openSavedSearch();
               }}
               borderBottomWidth="$1"
               borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']}
               px="$1"
               py="$2">
               <HStack space="md" justifyContent="flex-start">
                    <VStack space="sm">{/*<Image source={{uri: item.cover}} alt={item.title} size="lg" resizeMode="contain" />*/}</VStack>
                    <VStack space="sm" justifyContent="space-between" maxW="80%">
                         <Box>
                              <Text bold fontSize="$md" color={textColor}>
                                   {item.title}{' '}
                                   {hasNewResults === 1 ? (
                                        <Badge mb="-0.5" colorScheme="warning">
                                             <BadgeText>{getTermFromDictionary(language, 'flag_updated')}</BadgeText>
                                        </Badge>
                                   ) : null}
                              </Text>
                              <Text fontSize="$xs" italic color={textColor}>
                                   Created on {item.created}
                              </Text>
                         </Box>
                    </VStack>
               </HStack>
          </Pressable>
     );
};
