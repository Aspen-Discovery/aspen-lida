import React from 'react';
import { Platform } from 'react-native';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Icon, ChevronDownIcon, SelectScrollView, FormControl, FormControlLabel, FormControlLabelText, Text } from '@gluestack-ui/themed';
import _ from 'lodash';
import { getTermFromDictionary } from '../../../translations/TranslationService';

export const SelectNewHoldSublocation = (props) => {
     const {sublocations, location, activeSublocation, setActiveSublocation, language, textColor, theme} = props;

     if (sublocations !== undefined) {
          try {
               if (_.isObject(sublocations)) {
                    const objectSize = Object.keys(sublocations).length;
                    const validSublocations = [];

                    const sublocationValues = Object.values(sublocations);
                    let activeSublocationNeedsToChange = true;
                    for (index in sublocationValues) {
                         let sublocation = sublocationValues[index];
                         if (sublocation.locationCode == location) {
                             validSublocations.push(sublocation);
                              if (activeSublocation == sublocation.id) {
                                   activeSublocationNeedsToChange = false;
                              }
                         }
                    }

                    //console.log("Valid sublocations");
                    //console.log(validSublocations);
                    const validSublocationSize = validSublocations.length;
                    if (validSublocationSize > 0) {
                         if (activeSublocationNeedsToChange){
                              setActiveSublocation(validSublocations[0].id);
                         }
                    }
                    //sublocations need to convert from an object to an array!
                    if (validSublocationSize > 1) {
                         //console.log("Displaying sublocations, got " + validSublocationSize);

                         return (
                              <>
                                   <FormControl>
                                        <FormControlLabel>
                                             <FormControlLabelText size="sm" color={textColor}>
                                                  {getTermFromDictionary(language, 'select_pickup_area')}
                                             </FormControlLabelText>
                                        </FormControlLabel>
                                        <Select name="sublocations" selectedValue={activeSublocation} minWidth={200} mt="$1" mb="$2" onValueChange={(itemValue) => setActiveSublocation(itemValue)}>
                                             <SelectTrigger variant="outline" size="md">
                                                  {validSublocations.map((sublocation, index) => {
                                                       if (sublocation.id === activeSublocation) {
                                                            return <SelectInput value={sublocation.displayName} color={textColor} />;
                                                       }
                                                  })}
                                                  <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                                             </SelectTrigger>
                                             <SelectPortal>
                                                  <SelectBackdrop />
                                                  <SelectContent p="$5">
                                                       <SelectDragIndicatorWrapper>
                                                            <SelectDragIndicator />
                                                       </SelectDragIndicatorWrapper>
                                                       <SelectScrollView>
                                                            {validSublocations.map((sublocation, index) => {
                                                                 if (sublocation.id === activeSublocation) {
                                                                      return <SelectItem label={sublocation.displayName} value={sublocation.id} key={index} bgColor={theme['colors']['tertiary']['300']} />;
                                                                 }
                                                                 return <SelectItem label={sublocation.displayName} value={sublocation.id} key={index} color={textColor} />;
                                                            })}
                                                       </SelectScrollView>
                                                  </SelectContent>
                                             </SelectPortal>
                                        </Select>
                                   </FormControl>
                              </>
                         );
                    }else if (validSublocationSize <= 1) {
                         //No sub locations to choose from
                         console.log("Do not need to display sublocations, got " + validSublocationSize);
                         return null;
                    }
               }else{
                    console.log("Sublocations are an array, expected object");
                    return null;
               }
          } catch (e) {
               console.log("Error loading sublocations");
               console.error(e);
               return <Text>Oh no, there was an error loading sublocations</Text>;
          }
     }else{
          console.log("undefined");
          return <Text>Sublocations were undefined</Text>;
     }
};
