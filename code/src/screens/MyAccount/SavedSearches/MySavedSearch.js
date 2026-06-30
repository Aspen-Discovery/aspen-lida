import { useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import _ from 'lodash';
import { Badge, BadgeText, Box, Center, FlatList, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadError } from '../../../components/loadError';

// custom components and helper files
import { DisplaySystemMessage } from '../../../components/Notifications';
import { LanguageContext, LibrarySystemContext, SystemMessagesContext, UserContext } from '../../../context/initialContext';
import { getCleanTitle } from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { getSavedSearch } from '../../../util/api/list';
import AddToList from '../../Search/AddToList';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MySavedSearch = () => {
     const route = useRoute();
     const id = route.params.id;
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);

     const { status, data, error, isFetching, isPreviousData } = useQuery(['saved_search', id, user.id], () => getSavedSearch(id, language, library.baseUrl), {
          staleTime: 1000,
          placeholderData: [],
     });

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

     const Empty = () => {
          return (
               <>
                    {_.size(systemMessages) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
                    <Center mt={5} mb={5}>
                         <Text bold fontSize="$lg">
                              {getTermFromDictionary(language, 'no_results_found')}
                         </Text>
                    </Center>
               </>
          );
     };

     return (
          <SafeAreaView style={{ flex: 1 }}>
               {_.size(systemMessages) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
               <Box safeArea={2}>{status === 'error' ? loadError('Error', '') : <FlatList data={data} ListEmptyComponent={Empty} renderItem={({ item }) => <SavedSearch data={item} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />}</Box>
          </SafeAreaView>
     );
};

const SavedSearch = (data) => {
     const item = data.data;
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);

     const imageUrl = library.baseUrl + item.image;
     const key = 'medium_' + item.id;

     let formats = [];
     if (item.format) {
          formats = getFormats(item.format);
     }
     let isNew = false;
     if (typeof item.isNew !== 'undefined') {
          isNew = item.isNew;
     }

     const openGroupedWork = () => {
          navigateStack('AccountScreenTab', 'SavedSearchItem', {
               id: item.id,
               title: getCleanTitle(item.title),
          });
     };

     return (
          <Pressable borderBottomWidth="$1" _dark={{ borderColor: 'gray.600' }} borderColor="coolGray.200" pl="$4" pr="$5" py="$2" onPress={() => openGroupedWork()}>
               <HStack space={3}>
                    <VStack maxW="35%">
                         {isNew ? (
                              <Box width="$full" zIndex={1}>
                                   <Badge colorScheme="warning" shadow={1} mb={-3} ml={-1}>
                                        <BadgeText fontSize="$xs">
                                             {getTermFromDictionary(language, 'flag_new')}
                                        </BadgeText>
                                   </Badge>
                              </Box>
                         ) : null}
                         <Image
                              alt={item.title}
                              source={imageUrl}
                              style={{
                                   width: 100,
                                   height: 150,
                                   borderRadius: "$sm",
                              }}
                              placeholder={blurhash}
                              transition={1000}
                              contentFit="cover"
                         />
                         <Badge
                              mt={1}
                              bgColor="warmGray.200"
                              _dark={{
                                   bgColor: 'coolGray.900',
                              }}>
                              <BadgeText
                                   fontSize="$sm"
                                   color="$coolGray600"
                                   _dark={{ color: "warmGray400" }}>
                                   {item.language}
                              </BadgeText>
                         </Badge>
                         <AddToList item={item.id} libraryUrl={library.baseUrl} />
                    </VStack>

                    <VStack w="65%" ml="$3">
                         <Text
                              _dark={{ color: "$warmGray50" }}
                              color="coolGray.800"
                              bold
                              fontSize="$xs">
                              {item.title}
                         </Text>
                         {item.author ? (
                              <Text _dark={{ color: "$warmGray50" }} color="coolGray.800" fontSize="$xs">
                                   {getTermFromDictionary(language, 'by')} {item.author}
                              </Text>
                         ) : null}
                         {item.format ? (
                              <HStack mt={1.5} space={1} flexWrap="wrap">
                                   {formats.map((format, i) => {
                                        return (
                                             <Badge colorScheme="secondary" mt={1} variant="outline" borderRadius="$sm" ml="$2" mt="$1">
                                                  <BadgeText fontSize="$sm">
                                                       {format}
                                                  </BadgeText>
                                             </Badge>
                                        );
                                   })}
                              </HStack>
                         ) : null}
                    </VStack>
               </HStack>
          </Pressable>
     );
};

function getFormats(data) {
     let formats = [];
     data.map((item) => {
          let thisFormat = item.split('#');
          thisFormat = thisFormat[thisFormat.length - 1];
          formats.push(thisFormat);
     });
     formats = _.uniq(formats);
     return formats;
}
