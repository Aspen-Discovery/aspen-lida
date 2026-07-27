import { MaterialIcons } from '@expo/vector-icons';
import _ from 'lodash';
import { Box, HStack, Icon, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { ScrollView } from 'react-native';

import { SearchContext, ThemeContext } from '../../../context/initialContext';
import { navigateStack } from '../../../helpers/RootNavigator';
import { SearchGlobal } from '../../../util/globals';
import {logDebugMessage} from "../../../util/logging";

// custom components and helper files

export const SearchIndexScreen = () => {
     const {theme, textColor, colorMode } = React.useContext(ThemeContext);
     const { currentIndex, indexes, updateCurrentSource, updateIndexes, updateCurrentIndex } = React.useContext(SearchContext);

     logDebugMessage('currentIndex: ' + currentIndex);

     const search = async () => {
          navigateStack('BrowseTab', 'SearchResults', {
               term: SearchGlobal.term,
               type: 'catalog',
               prevRoute: 'DiscoveryScreen',
               scannerSearch: false,
          });
     };

     const updateIndex = async (index) => {
          updateCurrentIndex(index);
          await search();
     };

     return (
          <VStack pt="$5" flex={1}>
               <ScrollView>
                    <Box px="$5">
                         {_.map(indexes, function (obj, index, array) {
                              return (
                                   <Pressable p="$0.5" py="$2" onPress={() => updateIndex(index)}>
                                        {currentIndex === index ? (
                                             <HStack space="sm" justifyContent="flex-start" alignItems="center">
                                                  <Icon as={MaterialIcons} name="radio-button-checked" size="lg" color={theme.tokens.colors.primary['600']} />
                                                  <Text color={textColor} ml="$2">
                                                       {obj}
                                                  </Text>
                                             </HStack>
                                        ) : (
                                             <HStack space="sm" justifyContent="flex-start" alignItems="center">
                                                  <Icon as={MaterialIcons} name="radio-button-unchecked" size="lg" color={theme.tokens.colors.primary['200']}  />
                                                  <Text color={textColor} ml="$2">
                                                       {obj}
                                                  </Text>
                                             </HStack>
                                        )}
                                   </Pressable>
                              );
                         })}
                    </Box>
               </ScrollView>
          </VStack>
     );
};
