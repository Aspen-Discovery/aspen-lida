import { useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Badge, BadgeText, Box, Center, FlatList, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { loadError } from '../../../components/loadError';

// custom components and helper files
import { DisplaySystemMessage } from '../../../components/Notifications';
import { SystemMessagesContext } from '../../../context/initialContext';
import { uniquePrimitiveArray } from '../../../helpers/helpers';
import { getCleanTitle } from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { getSavedSearch } from '../../../util/api/list';
import AddToList from '../../Search/AddToList';
import { logErrorMessage } from '../../../util/logging';
import { useActiveLanguage } from '../../../hooks/useLanguageData';
import { useTheme } from '../../../themes/theme';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MySavedSearch = () => {
     const route = useRoute();
     const id = route.params.id;
     const library = useLibrary();
     const language = useActiveLanguage();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const {colorMode} = useTheme();
     const [status, setStatus] = React.useState('loading');
     const [data, setData] = React.useState([]);

     React.useEffect(() => {
          let isMounted = true;
          const loadSavedSearch = async () => {
               setStatus('loading');
               try {
                    const response = await getSavedSearch(id, language, library.baseUrl);
                    if (!isMounted) return;
                    setData(Array.isArray(response) ? response : []);
                    setStatus('success');
               } catch (error) {
                    logErrorMessage(error);
                    if (!isMounted) return;
                    setStatus('error');
               }
          };
          loadSavedSearch();
          return () => {
               isMounted = false;
          };
     }, [id, language, library.baseUrl]);

     const showSystemMessage = () => {
          if (Array.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} />;
                    }
               });
          }
          return null;
     };

     const Empty = () => {
          return (
               <>
                    {(systemMessages?.length ?? 0) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
                    <Center mt={5} mb={5}>
                         <Text bold fontSize="$lg" color={colorMode === 'light' ? "$coolGray800" : "$warmGray50"}>
                              {getTermFromDictionary(language, 'no_results_found')}
                         </Text>
                    </Center>
               </>
          );
     };

     return (
          <Box style={{ flex: 1 }}>
               {(systemMessages?.length ?? 0) > 0 ? <Box safeArea={2}>{showSystemMessage()}</Box> : null}
               <Box safeArea={2}>{status === 'error' ? loadError('Error', '') : <FlatList data={data} ListEmptyComponent={Empty} renderItem={({ item }) => <SavedSearch data={item} />} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 30 }} />}</Box>
          </Box>
     );
};

const SavedSearch = (data) => {
     const item = data.data;
     const library = useLibrary();
     const language = useActiveLanguage();
     const {colorMode} = useTheme();

     const imageUrl = library.baseUrl + item.image;

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
               title: getCleanTitle(item.title) });
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
                                   borderRadius: "$sm" }}
                              placeholder={blurhash}
                              transition={1000}
                              contentFit="cover"
                         />
                         <Badge
                              mt={1}
                              bgColor={colorMode === 'light' ? "$warmGray200" : "$coolGray900"}
                              >
                              <BadgeText
                                   fontSize="$sm"
                                   color={colorMode === 'light' ? "$coolGray600":  "$warmGray400"}>
                                   {item.language}
                              </BadgeText>
                         </Badge>
                         <AddToList item={item.id} libraryUrl={library.baseUrl} />
                    </VStack>

                    <VStack w="65%" ml="$3">
                         <Text
                              color={colorMode === 'light' ? "$coolGray800" : "$warmGray50"}
                              bold
                              fontSize="$xs">
                              {item.title}
                         </Text>
                         {item.author ? (
                              <Text color={colorMode === 'light' ? "$coolGray800" : "$warmGray50"} fontSize="$xs">
                                   {getTermFromDictionary(language, 'by')} {item.author}
                              </Text>
                         ) : null}
                         {item.format ? (
                              <HStack mt={1.5} space={1} flexWrap="wrap">
                                   {formats.map((format) => {
                                        return (
                                             <Badge colorScheme="secondary" mt={1} variant="outline" borderRadius="$sm" ml="$2">
                                                  <BadgeText fontSize="$sm" textTransform="none"  color={colorMode === 'light' ? "$coolGray800" : "$warmGray50"}>
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
     formats = uniquePrimitiveArray(formats);
     return formats;
}
