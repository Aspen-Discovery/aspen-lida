import _ from 'lodash';
import { Box, CheckIcon, FormControl, Select, Text } from 'native-base';

import React from 'react';
import { Platform } from 'react-native';

import { getTermFromDictionary } from '../../../translations/TranslationService';

export const SelectExistingHoldSubLocation = (props) => {
     const { locations, sublocations, language, location, activeSublocation, setActiveSublocation} = props;


     //console.log("Sublocations in Select Pickup Location");
     //console.log(sublocations);
     const [locationId, locationCode] = location.split("_");
     //console.log("Active location is " + location + " locationCode is " + locationCode);
     if (sublocations !== undefined) {
          if (_.isObject(sublocations)) {
               const objectSize = Object.keys(sublocations).length;
               const validSublocations = [];

               const sublocationValues = Object.values(sublocations);
               let activeSublocationNeedsToChange = true;
               for (index in sublocationValues) {
                    //console.log("Checking sublocation index " + index);
                    let sublocation = sublocationValues[index];
                    //console.log(sublocation);
                    if (sublocation.locationCode == locationCode) {
                         //console.log("Sublocation " + index + " is valid");
                         validSublocations.push(sublocation);
                         if (activeSublocation == sublocation.id) {
                              activeSublocationNeedsToChange = false;
                         }
                    }
               }
               const validSublocationSize = validSublocations.length;
               if (validSublocationSize > 0) {
                    if (activeSublocationNeedsToChange){
                         //todo set the sublocation to change to
                         setActiveSublocation(validSublocations[0].id);
                    }
               }

               if (validSublocationSize > 1) {
                    return (
                         <>
                              <Box pl={4} pr={4} _text={{ color: 'text.900' }} _hover={{ bg: 'muted.200' }} _pressed={{ bg: 'muted.300' }} _dark={{ _text: { color: 'text.50' } }}>
                                   <FormControl>
                                        <FormControl.Label>{getTermFromDictionary(language, 'select_new_pickup_area')}</FormControl.Label>
                                        <Select
                                             isReadOnly={Platform.OS === 'android'}
                                             name="pickupSublocation"
                                             /* selectedValue={location} */
                                             minWidth="200"
                                             accessibilityLabel={getTermFromDictionary(language, 'select_new_pickup_area')}
                                             _selectedItem={{
                                                  bg: 'tertiary.300',
                                                  endIcon: <CheckIcon size="5" />,
                                             }}
                                             mt={1}
                                             mb={3}
                                             _actionSheet={{
                                                  useRNModal: Platform.OS === 'ios',
                                             }}
                                             onValueChange={(itemValue) => setActiveSublocation(itemValue)}>
                                             {validSublocations.map((item, index) => {
                                                  return <Select.Item value={item.id} label={item.displayName} />;
                                             })}
                                        </Select>
                                   </FormControl>
                              </Box>
                         </>
                    );
               }else{
                    return null;
               }
          }else{
               return null;
          }
     }else{
          return null;
     }
}
