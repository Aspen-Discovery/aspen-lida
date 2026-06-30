import { MaterialIcons } from '@expo/vector-icons';
import _ from 'lodash';
import { Box, HStack, Icon, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { ScrollView } from 'react-native';

import { LanguageContext, LibrarySystemContext, SearchContext, ThemeContext } from '../../../context/initialContext';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getSearchIndexes } from '../../../util/api/search';
import { SearchGlobal } from '../../../util/globals';

// custom components and helper files

export const SearchSourceScreen = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { currentSource, sources, updateCurrentSource, updateIndexes, updateCurrentIndex } = React.useContext(SearchContext);
     const {theme, textColor, colorMode } = React.useContext(ThemeContext);
     console.log('currentSource: ' + currentSource);

     const search = async () => {
          navigateStack('BrowseTab', 'SearchResults', {
               term: SearchGlobal.term,
               type: 'catalog',
               prevRoute: 'DiscoveryScreen',
               scannerSearch: false,
          });
     };

     const updateSource = async (source) => {
          SearchGlobal.sortMethod = 'relevance';
          SearchGlobal.appliedFilters = [];
          SearchGlobal.sortList = [];
          SearchGlobal.availableFacets = [];
          SearchGlobal.defaultFacets = [];
          SearchGlobal.pendingFilters = [];
          SearchGlobal.appendedParams = '';
          updateCurrentSource(source);
          if (source === 'events') {
               updateCurrentIndex('EventsKeyword');
          } else {
               updateCurrentIndex('Keyword');
          }
          await search();
          await getSearchIndexes(library.baseUrl, language, source).then((indexes) => {
               updateIndexes(indexes);
          });
     };

     return (
          <VStack pt="$5" flex={1}>
               <ScrollView>
                    <Box px="$5">
                         {_.map(sources, function (source, index, array) {
                              if (index === 'events' || index === 'local') {
                                   return (
                                        <Pressable p="$0.5" py="$2" onPress={() => updateSource(index)}>
                                             {currentSource === index ? (
                                                  <HStack space="sm" justifyContent="flex-start" alignItems="center">
                                                       <Icon as={MaterialIcons} name="radio-button-checked" size="lg" color="$primary600" />
                                                       <Text color={textColor} ml="$2">
                                                            {source.name}
                                                       </Text>
                                                  </HStack>
                                             ) : (
                                                  <HStack space="sm" justifyContent="flex-start" alignItems="center">
                                                       <Icon as={MaterialIcons} name="radio-button-unchecked" size="lg" color="$muted400" />
                                                       <Text color={textColor} ml="$2">
                                                            {source.name}
                                                       </Text>
                                                  </HStack>
                                             )}
                                        </Pressable>
                                   );
                              }
                         })}
                    </Box>
               </ScrollView>
          </VStack>
     );
};
