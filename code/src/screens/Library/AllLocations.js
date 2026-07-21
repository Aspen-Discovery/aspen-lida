import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import _ from 'lodash';
import moment from 'moment';
import { Box, ButtonGroup, Button, ButtonText, Divider, FlatList, HStack, Icon, Pressable, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { loadError } from '../../components/loadError';
import { loadingSpinner } from '../../components/loadingSpinner';
import { DisplaySystemMessage } from '../../components/Notifications';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext, SystemMessagesContext, UserContext, ThemeContext } from '../../context/initialContext';
import { navigate } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getLocations } from '../../util/api/system';
import { PATRON } from '../../util/globals';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../util/logging';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const AllLocations = () => {
     const [isLoading, setLoading] = React.useState(false);
     const { library } = React.useContext(LibrarySystemContext);
     const { locations, updateLocations } = React.useContext(LibraryBranchContext);
     const { language } = React.useContext(LanguageContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const queryClient = useQueryClient();
     const [sort, setSort] = React.useState('alphabetical');
     const [isCoordinatesLoaded, setIsCoordinatesLoaded] = React.useState(false);
     const [userLatitude, setUserLatitude] = React.useState(0);
     const [userLongitude, setUserLongitude] = React.useState(0);
     const [sortedLocations, setSortedLocations] = React.useState(_.sortBy(locations, ['displayName']));

     const { status, isFetching } = useQuery(['locations', library.baseUrl, language, userLatitude, userLongitude, sort], () => getLocations(library.baseUrl, language, userLatitude, userLongitude), {
          initialData: locations,
          enabled: isCoordinatesLoaded,
          onSuccess: (data) => {
               if(data.ok) {
                    logDebugMessage("Got location data");
                    updateLocations(data.data.result.locations);
                    if (sort === 'distance') {
                         const tmpSortedLocations = _.sortBy(data, ['distance', 'displayName']);
                         const mapped = _.map(tmpSortedLocations, (val, key) => ({ ...val, originalKey: key }));
                         setSortedLocations(mapped);
                    } else {
                         const tmpSortedLocations = _.sortBy(data, ['displayName']);
                         const mapped = _.map(tmpSortedLocations, (val, key) => ({ ...val, originalKey: key }));
                         setSortedLocations(mapped);
                    }
               } else {
                    logDebugMessage("Error fetching locations");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
               setLoading(false);
          },
          onSettle: (data) => {
               logDebugMessage("Running settle after getting locations");
               if (sort === 'distance') {
                    const tmpSortedLocations = _.sortBy(data, ['distance', 'displayName']);
                    setSortedLocations(tmpSortedLocations);
               } else {
                    const tmpSortedLocations = _.sortBy(data, ['displayName']);
                    setSortedLocations(tmpSortedLocations);
               }
               setLoading(false);
          },
          onError: (error) => {
               logDebugMessage("Error fetching locations");
               logErrorMessage(error);
          },
          placeholderData: [],
     });

     useFocusEffect(
          React.useCallback(() => {
               const update = async () => {
                    logDebugMessage("Getting location information as part of focus effect in AllLocations");
                    let latitude = await SecureStore.getItemAsync('latitude');
                    let longitude = await SecureStore.getItemAsync('longitude');
                    setUserLatitude(latitude);
                    setUserLongitude(longitude);

                    if (sort === 'distance') {
                         const { status } = await Location.requestForegroundPermissionsAsync();
                         if (status === 'granted') {
                              let location = await Location.getLastKnownPositionAsync({});
                              if (location != null) {
                                   const latitude = JSON.stringify(location.coords.latitude);
                                   const longitude = JSON.stringify(location.coords.longitude);
                                   await SecureStore.setItemAsync('latitude', latitude);
                                   await SecureStore.setItemAsync('longitude', longitude);
                                   PATRON.coords.lat = latitude;
                                   PATRON.coords.long = longitude;
                                   setUserLatitude(latitude);
                                   setUserLongitude(longitude);
                              }
                         }

                         const tmpSortedLocations = _.sortBy(locations, ['distance', 'displayName']);
                         setSortedLocations(tmpSortedLocations);
                    }

                    if (sort === 'alphabetical') {
                         const tmpSortedLocations = _.sortBy(locations, ['displayName']);
                         setSortedLocations(tmpSortedLocations);
                    }
                    setIsCoordinatesLoaded(true);
                    setLoading(false);
               };
               update().then(() => {
                    return () => update();
               });
          }, [sort])
     );

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         return <DisplaySystemMessage key={obj.id || index} style={obj.style} message={obj.message} dismissable={obj.dismissable} id={obj.id} all={systemMessages} url={library.baseUrl} updateSystemMessages={updateSystemMessages} queryClient={queryClient} />;
                    }
               });
          }
          return null;
     };

     const updateSort = (sort) => {
          setLoading(true);
          setSort(sort);
     };

     const getActionButtons = () => {
          return (
               <Box
                    alignItems="center"
                    p="$2"
                    bgColor="$coolGray100"
                    borderBottomWidth="$1"
                    _dark={{
                         borderColor: '$coolGray600',
                         bgColor: '$coolGray700',
                    }}
                    borderColor="$coolGray200">
                    <ButtonGroup alignItems="center" isAttached>
                         <Button variant={sort === 'alphabetical' ? 'solid' : 'outline'} action="secondary" onPress={() => updateSort('alphabetical')}>
                              <ButtonText>{getTermFromDictionary(language, 'a_to_z')}</ButtonText>
                         </Button>
                         <Button variant={sort === 'distance' ? 'solid' : 'outline'} action="secondary" onPress={() => updateSort('distance')}>
                              <ButtonText>{getTermFromDictionary(language, 'distance')}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </Box>
          );
     };

     return (
          <>
               {isLoading || status === 'loading' || isFetching ? (
                    loadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <FlatList
                         ListHeaderComponent={
                              <>
                                   {_.size(systemMessages) > 0 ? <Box p="$2">{showSystemMessage()}</Box> : null}
                                   {getActionButtons()}
                              </>
                         }
                         data={Object.keys(sortedLocations)}
                         renderItem={({ item }) => (
                              <DisplayLocation data={sortedLocations[item]} />
                         )}
                         keyExtractor={(item, index) => index.toString()}
                         contentContainerStyle={{ paddingBottom: 30 }}
                    />
               )}
          </>
     );
};

const DisplayLocation = (data) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     const location = data.data;

     let units = false;
     if (location.unit === 'Mi') {
          units = 'miles';
     } else if (location.unit === 'Km') {
          units = 'kilometers';
     }

     let distanceText = false;
     if (units && location.distance) {
          distanceText = location.distance + ' ' + units + ' away';
     }

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
                              hoursLabel = getTermFromDictionary(language, 'location_closed');
                         }
                         if (!stillClosed) {
                              let openingTime = moment(openTime).format('h:mm A');
                              hoursLabel = 'Closed until ' + openingTime;
                         } else {
                              let closingTime = moment(closeTime).format('h:mm A');
                              hoursLabel = 'Open until ' + closingTime;
                         }
                    }
               }
          } else {
               hoursLabel = getTermFromDictionary(language, 'location_closed');
          }
     }

     const goToLocation = () => {
          navigate('Location', {
               data: location,
               title: location.displayName,
          });
     };

     return (
          <>
               <Pressable onPress={goToLocation}>
                    <HStack justifyContent="space-between" alignItems="center" p="$4">
                         {location.locationImage ? (
                              <Box width="30%" mr="$2">
                                   <Image alt={location.displayName} source={location.locationImage} style={{ width: '100%', height: 90, borderRadius: 4 }} placeholder={blurhash} transition={1000} contentFit="cover" />
                              </Box>
                         ) : null}
                         <VStack width={location.locationImage ? '60%' : '85%'}>
                              <Text size="md" bold color={textColor}>{location.displayName}</Text>
                              <Text size="xs" mb="$2" color={textColor}>
                                   {location.address}
                              </Text>
                              {hasHours ? (
                                   <HStack alignItems="center" space="xs">
                                        <Icon as={MaterialIcons} name="access-time" size="sm"  color={textColor}/>
                                        <Text size="xs" color={textColor}>{hoursLabel}</Text>
                                   </HStack>
                              ) : null}
                              {distanceText ? (
                                   <HStack alignItems="center" space="xs">
                                        <Icon as={MaterialIcons} name="pin-drop" size="sm" color={textColor} />
                                        <Text size="xs" color={textColor}>{distanceText}</Text>
                                   </HStack>
                              ) : null}
                         </VStack>
                         <Icon as={MaterialIcons} name="chevron-right" size="xl" color={textColor} />
                    </HStack>
               </Pressable>
               <Divider mt="$3" mb="$3" />
          </>
     );
};
