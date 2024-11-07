import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import React from 'react';
import { Text, HStack, FlatList, Box } from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { loadingSpinner } from '../../components/loadingSpinner';
import {getManifestation, getRelatedRecord} from '../../util/api/item';
import { loadError } from '../../components/loadError';
import {getTermFromDictionary} from '../../translations/TranslationService';

export const WhereIsIt = () => {
     const route = useRoute();
     const { id, format, prevRoute, type, recordId, source } = route.params;
     const { language } = React.useContext(LanguageContext);
     const { library } = React.useContext(LibrarySystemContext);
    const { theme, textColor } = React.useContext(ThemeContext);
     const [isLoading, setLoading] = React.useState(false);

     const { status, data, error, isFetching } = useQuery({
          queryKey: ['manifestations', id, format, recordId, type, language, library.baseUrl],
          queryFn: async () => {
              if(!recordId) {
                  return await getManifestation(id, format, language, library.baseUrl);
              } else {
                  return await getRelatedRecord(id, recordId, format, library.baseUrl);
              }
          },
     });

	 return (
          <Box p="$5">
               {isLoading || status === 'loading' || isFetching ? (
                    loadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <Box>
                         <HStack space="md" justifyContent="space-between" pb="$2">
                              <Text bold w="30%" size="xs" color={textColor}>
                                   {getTermFromDictionary(language, 'available_copies')}
                              </Text>
                              <Text bold w="30%" size="xs" color={textColor}>
                                   {getTermFromDictionary(language, 'location')}
                              </Text>
							 {source === 'overdrive' ? (
								 <Text bold w="30%" size="xs" color={textColor}>
									 {getTermFromDictionary(language, 'holds')}
								 </Text>
							 ) : (
                              <Text bold w="30%" size="xs" color={textColor}>
                                   {getTermFromDictionary(language, 'call_num')}
                              </Text>
							 )}
                         </HStack>
                         <FlatList data={Object.keys(data.manifestation)} renderItem={({ item }) => <Details manifestation={data.manifestation[item]} source={source} />} />
                    </Box>
               )}
          </Box>
     );
};

const Details = (data) => {
     //console.log(data.manifestation);
    const { theme, textColor } = React.useContext(ThemeContext);
     const manifestation = data.manifestation;
	 const source = data.source;
     return (
          <HStack space="md" justifyContent="space-between">
               <Text w="30%" size="xs" color={textColor}>
                    {manifestation.availableCopies} of {manifestation.totalCopies}
               </Text>
               <Text w="30%" size="xs" color={textColor}>
                    {manifestation.shelfLocation}
               </Text>
			  {source === 'overdrive' ? (
				  <Text w="30%" size="xs" color={textColor}>
					  {manifestation.numHolds}
				  </Text>
			  ) : (
               <Text w="30%" size="xs" color={textColor}>
                    {manifestation.callNumber}
               </Text>
			  )}
          </HStack>
     );
};
