import _ from 'lodash';
import moment from 'moment';
import { Box, FlatList, Heading, HStack, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';

// custom components and helper files
import { LanguageContext, ThemeContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';

const Hours = (data) => {
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);
     const location = data.data;

     /* location.hours */

     if (location.showInLocationsAndHoursList === '1' || location.showInLocationsAndHoursList === 1) {
          if (_.isArrayLikeObject(location.hours)) {
               return (
                    <Box>
                         <Heading color={textColor} mb={2} mx="$2">{getTermFromDictionary(language, 'library_hours')}</Heading>
                         <FlatList data={location.hours} renderItem={({ item }) => <Day hours={item} textColor={textColor} />} />
                    </Box>
               );
          }
     }

     return null;
};

const Day = (data) => {
     const { language } = React.useContext(LanguageContext);
     const { hours, textColor } = data;

     function formatTime(time) {
          let arr = time.split(':');
          let timeString = moment().set({ hour: arr[0], minute: arr[1] });
          return moment(timeString).format('h:mm A');
     }

     return (
          <VStack mb={2} mx="$4">
               <HStack justifyContent="space-between">
                    <Text color={textColor} bold>{hours.dayName}</Text>
                    {!hours.isClosed ? (
                         <Text color={textColor}>
                              <Text color={textColor}>{formatTime(hours.open)}</Text>
                              <Text color={textColor}> - </Text>
                              <Text color={textColor}>{formatTime(hours.close)}</Text>
                         </Text>
                    ) : (
                         <Text color={textColor}>{getTermFromDictionary(language, 'location_closed')}</Text>
                    )}
               </HStack>
               {hours.notes !== '' ? (
                    <Text color={textColor} fontSize="$xs" italic>
                         {hours.notes}
                    </Text>
               ) : null}
          </VStack>
     );
};

export default Hours;
