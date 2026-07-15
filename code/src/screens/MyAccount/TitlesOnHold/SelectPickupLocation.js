import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import _ from 'lodash';
import {
     ActionsheetItem,
     ActionsheetItemText,
     Box,
     Button,
     ButtonGroup,
     ButtonText,
     ChevronDownIcon,
     CloseIcon,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     HStack,
     Icon,
     Pressable,
     Select,
     SelectTrigger,
     SelectInput,
     SelectIcon,
     SelectPortal,
     SelectBackdrop,
     SelectContent,
     SelectDragIndicatorWrapper,
     SelectDragIndicator,
     SelectItem,
     VStack,
     Text,
     ActionsheetIcon,
} from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import Modal from 'react-native-modal';
import { getTermFromDictionary } from '../../../translations/TranslationService';

import { changeHoldPickUpLocation } from '../../../util/api/user';
import {SelectExistingHoldSubLocation} from './SelectExistingHoldSubLocation';
import { ScrollView } from '@gluestack-ui/themed';

export const SelectPickupLocation = (props) => {
     const { locations, sublocations, onClose, currentPickupId, holdId, userId, libraryContext, holdsContext, resetGroup, language, textColor, colorMode, theme } = props;
     let pickupLocation = _.findIndex(locations, function (o) {
          return o.locationId === currentPickupId;
     });

     let pickupId = currentPickupId;
     if (_.isNumber(pickupId)) {
          pickupId = _.toString(pickupId);
     }

     pickupLocation = _.nth(locations, pickupLocation);
     let pickupLocationCode = _.get(pickupLocation, 'code', '');
     if (_.isNumber(pickupLocationCode)) {
          pickupLocationCode = _.toString(pickupLocationCode);
     }
     if (pickupId != false) {
          pickupLocation = pickupId.concat('_', pickupLocationCode);
     }else{
          pickupLocation = '';
     }

     const [loading, setLoading] = React.useState(false);
     const [showModal, setShowModal] = React.useState(false);
     let [location, setLocation] = React.useState(pickupLocation);
     let [activeSublocation, setActiveSublocation] = React.useState(null);

     return (
          <>
               <ActionsheetItem
                    onPress={() => {
                         setShowModal(true);
                    }}>
                    <ActionsheetIcon>
                         <Icon as={Ionicons} name="location" mr="$1" size="md" color={textColor} />
                    </ActionsheetIcon>
                    <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'change_location')}</ActionsheetItemText>
               </ActionsheetItem>
               <Modal

                    isVisible={showModal}
                    avoidKeyboard={true}
                    onBackdropPress={() => {
                         setShowModal(false);
                    }}>
                    <Box
                         bgColor={colorMode === 'light' ? '#F6F6F6' : '#262626'}
                         rounded="$md"
                         p="$1">
                         <VStack space="sm">
                              <HStack
                                   bgColor={colorMode === 'light' ? '#F6F6F6' : '#262626'}
                                   p="$4"
                                   borderBottomWidth="$1"
                                   borderColor={colorMode === 'light' ? "$muted300" : "$muted700"}
                                   justifyContent="space-between"
                                   alignItems="flex-start">
                                   <Box>
                                        <Text bold color={textColor}>{getTermFromDictionary(language, 'change_hold_location')}</Text>
                                   </Box>
                                   <Pressable onPress={() => setShowModal(false)}>
                                        <CloseIcon
                                             zIndex={1}
                                             color={textColor}
                                             p="$2"
                                             bg="transparent"
                                             borderRadius="$sm"
                                        />
                                   </Pressable>
                              </HStack>
                              <Box pl="$4" pr="$4" _text={{ color: 'text.900' }} _hover={{ bg: 'muted.200' }} _pressed={{ bg: 'muted.300' }} _dark={{ _text: { color: 'text.50' } }}>
                                   <FormControl>
                                        <FormControlLabel><FormControlLabelText>{getTermFromDictionary(language, 'select_new_pickup')}</FormControlLabelText></FormControlLabel>
                                        <Select
                                             name="pickupLocations"
                                             selectedValue={location}
                                             minWidth="100%"
                                             accessibilityLabel={getTermFromDictionary(language, 'select_new_pickup')}
                                             mt="$1"
                                             mb="$3"
                                             onValueChange={(itemValue) => setLocation(itemValue)}>

                                             <SelectTrigger variant="outline" size="md">
                                                  {locations.map((item, index) => {
                                                       const locationId = item.locationId;
                                                       const code = item.code;
                                                       const id = locationId.concat('_', code);
                                                       if (id === location) {
                                                            return <SelectInput value={item.name} color={textColor} />;
                                                       }
                                                  })}
                                                  <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                                             </SelectTrigger>
                                             <SelectPortal useRNModal={true}>
                                                  <SelectBackdrop />
                                                  <SelectContent
                                                       bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                                                  >
                                                       <SelectDragIndicatorWrapper>
                                                            <SelectDragIndicator />
                                                       </SelectDragIndicatorWrapper>
                                                       <ScrollView style={{ maxHeight: 400, minWidth: "100%" }}>
                                                            {locations.map((item, index) => {
                                                                 const locationId = item.locationId;
                                                                 const code = item.code;
                                                                 const id = locationId.concat('_', code);
                                                                 return <SelectItem value={id} label={item.name} key={index}  bgColor={location === (id) ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: location === (id) ? theme.tokens.colors.tertiary['500-text'] : textColor } }}/>;
                                                            })}
                                                       </ScrollView>
                                                  </SelectContent>
                                             </SelectPortal>
                                        </Select>
                                   </FormControl>
                              </Box>
                              <SelectExistingHoldSubLocation location={location} sublocations={sublocations} language={language} activeSublocation={activeSublocation} setActiveSublocation={setActiveSublocation}/>
                              <ButtonGroup
                                   p="$4"
                                   flexDirection="row"
                                   justifyContent="flex-end"
                                   flexWrap="wrap"
                                   bgColor={colorMode === 'light' ? "$muted50" : "$muted800"}
                                   borderTopWidth="$1"
                                   borderColor={colorMode === 'light' ? "$muted300" : "$muted700"}
                                   >
                                   <Button
                                        variant="outline"
                                        borderColor={theme.tokens.colors.primary['500']}
                                        onPress={() => {
                                             setShowModal(false);
                                        }}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                   </Button>
                                   <Button
                                        isLoading={loading}
                                        bgColor={theme.tokens.colors.primary['500']}
                                        isLoadingText={getTermFromDictionary(language, 'updating', true)}
                                        onPress={() => {
                                             setLoading(true);
                                             changeHoldPickUpLocation(holdId, location, activeSublocation, libraryContext.baseUrl, userId, language).then((r) => {
                                                  setShowModal(false);
                                                  resetGroup();
                                                  onClose(onClose);
                                                  setLoading(false);
                                             });
                                        }}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'change_location')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </VStack>
                    </Box>
               </Modal>
          </>
     );
};
