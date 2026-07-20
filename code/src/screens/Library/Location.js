import { useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import _ from 'lodash';
import moment from 'moment';
import { Badge, BadgeText, Box, Button, ButtonText, Divider, Heading, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { DisplaySystemMessage } from '../../components/Notifications';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext, SystemMessagesContext, ThemeContext } from '../../context/initialContext';
import { navigate } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import AdditionalInformation from './AdditionalInformation';
import ContactButtons from './ContactButtons';
import DisplayMap from './DisplayMap';
// custom components and helper files
import Hours from './Hours';
import {logDebugMessage} from "../../util/logging";

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const Location = () => {
     const route = useRoute();
     const location = route.params?.data ?? false;
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { locations } = React.useContext(LibraryBranchContext);
     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const { colorMode, textColor, theme } = React.useContext(ThemeContext);

     const bgColor = (colorMode === 'light' ? "$warmGray50" : "$coolGray800");
     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     let isClosedToday = false;
     let hoursLabel = '';
     let hasHours = false;
     if (location.hours) {
          if (_.size(location.hours) > 0) {
               hasHours = true;
          }
          const day = moment().day();
          if (_.find(location.hours, _.matchesProperty('day', day))) {
               let todaysHours = _.filter(location.hours, { day: day });
               if (todaysHours[0]) {
                    todaysHours = todaysHours[0];
                    if (todaysHours.isClosed) {
                         isClosedToday = true;
                         hoursLabel = getTermFromDictionary(language, 'location_closed');
                    } else {
                         const closingText = todaysHours.close;
                         const time1 = closingText.split(':');
                         const openingText = todaysHours.open;
                         const time2 = openingText.split(':');
                         const closeTime = moment().set({ hour: time1[0], minute: time1[1] });
                         const openTime = moment().set({ hour: time2[0], minute: time2[1] });
                         const nowTime = moment();
                         const stillOpen = moment(nowTime).isBefore(closeTime);
                         const stillClosed = moment(openTime).isBefore(nowTime);
                         if (!stillOpen) {
                              isClosedToday = true;
                              hoursLabel = getTermFromDictionary(language, 'location_closed');
                         }
                         if (!stillClosed) {
                              isClosedToday = true;
                              let openingTime = moment(openTime).format('h:mm A');
                              hoursLabel = 'Closed until ' + openingTime;
                         } else {
                              isClosedToday = false;
                              let closingTime = moment(closeTime).format('h:mm A');
                              hoursLabel = 'Open until ' + closingTime;
                         }
                    }
               }
          } else {
               isClosedToday = true;
               hoursLabel = getTermFromDictionary(language, 'location_closed');
          }
     }

     const key = 'location_' + location.locationId;
     logDebugMessage(key + ':' + location.locationImage);

     const selectLocations = () => {
          navigate('AllLocations');
     };

     if (!location) {
          return null;
     }

     return (
          <ScrollView>
               <Box>
                    <VStack space="md">
                         {location.locationImage ? (
                              <>
                                   <Image
                                        alt={location.displayName}
                                        source={location.locationImage}
                                        style={{
                                             width: '100%',
                                             height: 200,
                                             borderRadius: "$sm",
                                             zIndex: -1,
                                             position: 'absolute',
                                             left: 0,
                                             top: 0,
                                        }}
                                        placeholder={blurhash}
                                        transition={1000}
                                        contentFit="cover"
                                   />
                                   <Box
                                        h={200}
                                        w="100%"
                                        position="absolute"
                                        left={0}
                                        top={0}
                                        zIndex={100}
                                        bgColor="$backgroundLight50"
                                        opacity={.4}
                                   />
                              </>
                         ) : null}
                         <Box safeArea={5} mx="$4" zIndex={200}>
                              {showSystemMessage()}
                              {library.displayName !== location.displayName ? <Heading mb={2} color={textColor}>{location.displayName}</Heading> : <Heading mb={1} color={textColor}>{library.displayName}</Heading>}
                              {location.address ? <Text color={textColor}>{location.address}</Text> : null}
                              {location.phone ? (
                                   <Text color={textColor}>
                                        {getTermFromDictionary(language, 'phone')}: {location.phone}
                                   </Text>
                              ) : null}
                              {hasHours ? (
                                   <Badge colorScheme={isClosedToday ? 'error' : 'success'} alignSelf="flex-start">
                                        <BadgeText color={textColor}>
                                             {hoursLabel}
                                        </BadgeText>
                                   </Badge>
                              ) : null}
                         </Box>
                         <DisplayMap data={location} />
                         <Box safeArea={5} mx={4} >
                              <ContactButtons data={location} />
                              {hasHours ? <Hours data={location} /> : null}
                              <AdditionalInformation data={location} />
                              {_.size(locations) > 1 ? (
                                   <>
                                        <Divider mt={5} mb={2} />
                                        <Button variant="ghost" size="sm" onPress={selectLocations} bgColor={theme.tokens.colors.primary['500']}>
                                             <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'view_all_locations')}</ButtonText>
                                        </Button>
                                   </>
                              ) : null}
                         </Box>
                    </VStack>
               </Box>
          </ScrollView>
     );
};
