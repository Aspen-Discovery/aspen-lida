import { FormControl, FormControlLabel, FormControlLabelText, Select, SelectTrigger, SelectInput, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, Radio, RadioGroup, RadioIndicator, RadioIcon, RadioLabel, CircleIcon, Icon, ChevronDownIcon } from '@gluestack-ui/themed';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { LibrarySystemContext } from '../../context/initialContext';
import { getVolumes } from '../../util/api/item';
import { loadingSpinner } from '../../components/loadingSpinner';
import { loadError } from '../../components/loadError';
import _ from 'lodash';
import { getTermFromDictionary } from '../../translations/TranslationService';

export const SelectVolume = (props) => {
     const { language, id, holdType, setHoldType, volume, setVolume, shouldLoad, promptForHoldType } = props;
     const { library } = React.useContext(LibrarySystemContext);

     const { status, data, error, isFetching } = useQuery({
          queryKey: ['volumes', id, library.baseUrl],
          queryFn: () => getVolumes(id, library.baseUrl),
          enabled: !!shouldLoad,
     });

     return (
          <>
               {status === 'loading' || isFetching ? (
                    loadingSpinner()
               ) : status === 'error' ? (
                    loadError('Error', '')
               ) : (
                    <>
                         {promptForHoldType ? (
                              <FormControl mb="$4">
                                   <RadioGroup
                                        value={holdType}
                                        onChange={(nextValue) => {
                                             setHoldType(nextValue);
                                        }}>
                                        <Radio value="item" size="sm" mb="$2">
                                             <RadioIndicator mr="$2">
                                                  <RadioIcon as={CircleIcon} />
                                             </RadioIndicator>
                                             <RadioLabel>{getTermFromDictionary(language, 'first_available')}</RadioLabel>
                                        </Radio>
                                        <Radio value="volume" size="sm">
                                             <RadioIndicator mr="$2">
                                                  <RadioIcon as={CircleIcon} />
                                             </RadioIndicator>
                                             <RadioLabel>{getTermFromDictionary(language, 'specific_volume')}</RadioLabel>
                                        </Radio>
                                   </RadioGroup>
                              </FormControl>
                         ) : null}
                         {holdType === 'volume' ? (
                              <FormControl>
                                   <FormControlLabel>
                                        <FormControlLabelText>{getTermFromDictionary(language, 'select_volume')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Select
                                        selectedValue={volume}
                                        onValueChange={(itemValue) => setVolume(itemValue)}>
                                        <SelectTrigger variant="outline" size="md">
                                             <SelectInput placeholder={getTermFromDictionary(language, 'select_volume')} />
                                             <Icon as={ChevronDownIcon} mr="$3" />
                                        </SelectTrigger>
                                        <SelectPortal>
                                             <SelectBackdrop />
                                             <SelectContent>
                                                  <SelectDragIndicatorWrapper>
                                                       <SelectDragIndicator />
                                                  </SelectDragIndicatorWrapper>
                                                  {_.map(data, function (item, index, array) {
                                                       return <SelectItem label={item.label} value={item.volumeId} key={index} />;
                                                  })}
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                         ) : null}
                    </>
               )}
          </>
     );
};
