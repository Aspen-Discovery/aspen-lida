import { SearchIcon } from 'lucide-react-native';

import { Button, ButtonGroup, ButtonIcon, ButtonText, Box, Center, HStack, Text, SafeAreaView, ScrollView } from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import _ from 'lodash';
import React from 'react';

// custom components and helper files
import {loadError} from '../../components/loadError';
import { LoadingSpinner } from '../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../components/Notifications';
import { GroupedWorkContext, LanguageContext, LibrarySystemContext, SystemMessagesContext, ThemeContext, UserContext } from '../../context/initialContext';
import { startSearch } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getFirstRecord, getVariations } from '../../util/api/item';
import { getLinkedAccounts, passUserToDiscovery } from '../../util/api/user';
import { formatLinkedAccounts } from '../../util/api/userHelper';
import { getGroupedWork } from '../../util/api/work';
import { decodeHTML } from '../../helpers/helpers';
import { getPickupLocations, getPickupSublocations } from '../../util/api/user';
import { formatPickupLocations } from '../../util/api/userHelper';
import AddToList from '../Search/AddToList';
import Variations from './Variations';

import { logDebugMessage, getErrorMessage } from '../../util/logging.js';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const GroupedWorkScreen = () => {
     const route = useRoute();
     const queryClient = useQueryClient();
     const id = route.params.id;
     const { user, locations, sublocations, accounts, cards, updatePickupLocations, updateSublocations, updateLinkedAccounts, updateLibraryCards, updatePreferredPickupLocationIsValid, preferredPickupLocationIsValid, updatePreferredPickupLocationWarning, preferredPickupLocationWarning } = React.useContext(UserContext);
     const { language, updateGroupedWork, updateFormat } = React.useContext(GroupedWorkContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language: userLanguage } = React.useContext(LanguageContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { theme, colorMode } = React.useContext(ThemeContext);

     const { status, data, error, isFetching } = useQuery(['groupedWork', id, userLanguage, library.baseUrl], () => getGroupedWork(route.params.id, userLanguage, library.baseUrl));

     React.useEffect(() => {
          let isSubscribed = true;
          if (!_.isUndefined(data) && !_.isEmpty(data)) {
               const update = async () => {
                    if (isSubscribed) {
                         updateGroupedWork(data);
                         updateFormat(data.format);
                         await getLinkedAccounts(library.baseUrl, language).then((data) => {
                              if(data.ok) {
                                   const linkedAccounts = formatLinkedAccounts(user, cards ?? [], library.barcodeStyle, data.data.result.linkedAccounts);
                                   if (accounts !== linkedAccounts.accounts) {
                                        updateLinkedAccounts(linkedAccounts.accounts);
                                   }
                                   if (cards !== linkedAccounts.cards) {
                                        updateLibraryCards(linkedAccounts.cards);
                                   }
                              } else {
                                   logDebugMessage("Error fetching linked accounts in GroupedWork");
                                   logDebugMessage(data);
                                   getErrorMessage(data.code ?? 0, data.problem);
                              }
                         });
                         await getPickupLocations(library.baseUrl, id).then((result) => {
                              logDebugMessage('Updating pickup locations after getPickupLocations call');
                              if(result.ok) {
                                   const pickupLocations = formatPickupLocations(result.data.result);
                                   if (locations !== pickupLocations.locations) {
                                        updatePickupLocations(pickupLocations.locations);
                                   }
                                   logDebugMessage("Preferred pickup location is valid? " + pickupLocations.preferredPickupLocationIsValid);
                                   if (preferredPickupLocationIsValid !== pickupLocations.preferredPickupLocationIsValid) {
                                        updatePreferredPickupLocationIsValid(pickupLocations.preferredPickupLocationIsValid);
                                   }
                                   if (preferredPickupLocationWarning !== pickupLocations.preferredPickupLocationWarning) {
                                        logDebugMessage("Preferred pickup location warning is " + pickupLocations.preferredPickupLocationWarning);
                                        updatePreferredPickupLocationWarning(pickupLocations.preferredPickupLocationWarning);
                                   }else{
                                        logDebugMessage("Preferred pickup location warning did not change");
                                        logDebugMessage("  preferredPickupLocationWarning = " + preferredPickupLocationWarning);
                                        logDebugMessage("  result.preferredPickupLocationWarning = " + pickupLocations.preferredPickupLocationWarning);
                                   }
                              } else {
                                   logDebugMessage("Error fetching pickup locations in GroupedWork");
                                   logDebugMessage(data);
                                   getErrorMessage(data.code ?? 0, data.problem);
                              }
                         });
                         await getPickupSublocations(library.baseUrl).then((result) => {
                              if (sublocations !== result) {
                                   updateSublocations(result);
                              }
                         });
                    }
               };
               update().catch(console.error);

               return () => (isSubscribed = false);
          }
     }, [data]);

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

     return (
          <SafeAreaView style={{ flex: 1 }}>
               {status === 'loading' || isFetching ? (
                    LoadingSpinner('Fetching data...')
               ) : status === 'error' ? (
                    loadError(error, '')
               ) : (
                    <ScrollView>
                         <Box sx={{ '@base': { height: 150 }, '@lg': { height: 200 } }} w="100%" bgColor={colorMode === 'light' ? theme['colors']['warmGray']['200'] : theme['colors']['coolGray']['900']} zIndex={-1} position="absolute" left={0} top={0} />
                         {_.size(systemMessages) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
                         <DisplayGroupedWork data={data.results} initialFormat={data.format} updateFormat={data.format} />
                    </ScrollView>
               )}
          </SafeAreaView>
     );
};

const DisplayGroupedWork = (payload) => {
     const groupedWork = payload.data;
     const route = useRoute();
     const id = route.params.id;
     const { format } = React.useContext(GroupedWorkContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const backgroundColor = colorMode === 'light' ? theme['colors']['warmGray']['200'] : theme['colors']['coolGray']['900'];

     const formats = Object.keys(groupedWork.formats);

     useQueries({
          queries: formats.map((format) => {
               return {
                    queryKey: ['recordId', groupedWork.id, format, language, library.baseUrl],
                    queryFn: () => getFirstRecord(id, format, language, library.baseUrl, groupedWork.formats[format]),
               };
          }),
     });

     useQueries({
          queries: formats.map((format) => {
               return {
                    queryKey: ['variation', groupedWork.id, format, language, library.baseUrl],
                    queryFn: () => getVariations(id, format, language, library.baseUrl, groupedWork.formats[format]),
               };
          }),
     });

     const key = 'large_' + groupedWork.id;

     return (
          <Box p="$5" w="100%">
               <Center mt="$5" width="100%">
                    <Image alt={groupedWork.title} source={groupedWork.cover} style={{ width: 180, height: 250, borderRadius: 4 }} placeholder={blurhash} transition={1000} contentFit="cover" />
                    <Title title={groupedWork.title} />
                    <Author author={groupedWork.author} />
               </Center>
               <Language language={groupedWork.language} />
               <Formats formats={groupedWork.formats} />
               <Variations format={format} data={groupedWork} />
               <AddToList itemId={groupedWork.id} btnStyle="lg" />
               <Description description={groupedWork.description} />
               <BibliographicInformationLink groupedWorkId={groupedWork.id} />
          </Box>
     );
};

const Title = ({ title }) => {
     const { textColor } = React.useContext(ThemeContext);
     if (title) {
          return (
               <>
                    <Text color={textColor} sx={{ '@base': { fontSize: 16, lineHeight: 19 }, '@lg': { fontSize: 24, lineHeight: 27 } }} bold pt="$5" alignText="center">
                         {title}
                    </Text>
               </>
          );
     } else {
          return null;
     }
};

const Author = ({ author }) => {
     const { library } = React.useContext(LibrarySystemContext);
     const { theme, colorMode } = React.useContext(ThemeContext);
     if (author) {
          return (
               <Button size="sm" variant="link" onPress={() => startSearch(author, 'SearchResults', library.baseUrl)}>
                    <ButtonIcon as={SearchIcon} color={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']} size="xs" mr="$1" />
                    <ButtonText fontWeight="normal" color={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']}>
                         {author}
                    </ButtonText>
               </Button>
          );
     }
     return null;
};

const Format = (data) => {
     const format = data.data;
     const key = data.format;
     const isSelected = data.isSelected;
     const updateFormat = data.updateFormat;
     const btnStyle = isSelected === key ? 'solid' : 'outline';
     const { theme, colorMode } = React.useContext(ThemeContext);

     return (
          <Button size="sm" bg={btnStyle === 'outline' ? 'transparent' : theme['colors']['secondary']['400']} borderColor={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']} mb="$1" mr="$1" variant={btnStyle} onPress={() => updateFormat(key)}>
               <ButtonText color={btnStyle === 'outline' ? (colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']) : theme['colors']['secondary']['400-text']}>{format.label}</ButtonText>
          </Button>
     );
};

const Description = ({ description }) => {
     const { theme, textColor } = React.useContext(ThemeContext);
     if (description) {
          return (
               <Text mt="$5" mb="$5" sx={{ '@base': { fontSize: 14, lineHeight: 21 }, '@lg': { fontSize: 20, lineHeight: 27 } }} color={textColor}>
                    {decodeHTML(description)}
               </Text>
          );
     } else {
          return null;
     }
};

const Language = ({ language }) => {
     const { language: user_language } = React.useContext(LanguageContext);
     const { theme, textColor } = React.useContext(ThemeContext);
     if (language) {
          return (
               <HStack mt="$3" mb="$1">
                    <Text sx={{ '@base': { fontSize: 12, lineHeight: 15 }, '@lg': { fontSize: 18, lineHeight: 21 } }} bold color={textColor}>
                         {getTermFromDictionary(user_language, 'language')}:
                    </Text>
                    <Text sx={{ '@base': { fontSize: 12, lineHeight: 15 }, '@lg': { fontSize: 18, lineHeight: 21 } }} ml="$1" color={textColor}>
                         {' '}
                         {language}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

const Formats = ({ formats }) => {
     const { language } = React.useContext(LanguageContext);
     const { format, updateFormat } = React.useContext(GroupedWorkContext);
     const { theme, textColor } = React.useContext(ThemeContext);
     if (formats) {
          return (
               <>
                    <Text sx={{ '@base': { fontSize: 12, lineHeight: 15 }, '@lg': { fontSize: 18, lineHeight: 21 } }} bold mt="$3" mb="$1" color={textColor}>
                         {getTermFromDictionary(language, 'format')}:
                    </Text>
                    <ButtonGroup flexDirection="row" flexWrap="wrap">
                         {_.compact(_.map(_.keys(formats), function (item, index, array) {
                              const formatData = formats[item];
                              if (!formatData || !formatData.label || formatData.label.trim() === '' || item.trim() === '') {
                                   return null;
                              }
                              return <Format key={index} format={item} data={formatData} isSelected={format} updateFormat={updateFormat} />;
                         }))}
                    </ButtonGroup>
               </>
          );
     } else {
          return null;
     }
};

const BibliographicInformationLink = ({ groupedWorkId }) => {
     const { language } = React.useContext(LanguageContext);
     const { theme, colorMode } = React.useContext(ThemeContext);
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const backgroundColor = colorMode === 'light' ? theme['colors']['warmGray']['200'] : theme['colors']['coolGray']['900'];
     const textColor = colorMode === 'light' ? theme['colors']['gray']['800'] : theme['colors']['coolGray']['200'];

     let showMoreInfoBtn = false;
     if(library?.showMoreInfoBtn) {
          showMoreInfoBtn = library.showMoreInfoBtn;
     }

     if (groupedWorkId && showMoreInfoBtn) {
          return (
          <Button onPress={async () => await passUserToDiscovery(library.baseUrl, 'GroupedWork', user.id, backgroundColor, textColor, groupedWorkId)} bgColor={theme['colors']['secondary']['500']}>
               <ButtonText color={theme['colors']['secondary']['500-text']}>
                    {getTermFromDictionary(language, 'more_information')}
               </ButtonText>
          </Button>
          );
     } else {
          return null;
     }
};
