import React from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MaterialIcons } from '@expo/vector-icons';
import {
     ActionsheetIcon,
     ActionsheetItem,
     ActionsheetItemText,
     Button,
     ButtonGroup,
     ButtonText,
     Checkbox,
     CheckboxIcon,
     CheckboxIndicator,
     CheckboxLabel,
     CloseIcon,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     Heading,
     Icon,
     Modal,
     ModalBackdrop,
     ModalBody,
     ModalCloseButton,
     ModalContent,
     ModalFooter,
     ModalHeader, useToast
} from '@gluestack-ui/themed';
import { LanguageContext, ThemeContext } from '../../../context/initialContext';
import { freezeHold, freezeHolds } from '../../../util/api/user';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import {logDebugMessage, logWarnMessage} from "../../../util/logging";

export const SelectThawDate = (props) => {
     const { freezingLabel, freezeLabel, label, libraryContext, onClose, freezeId, recordId, source, userId, resetGroup, theme, textColor, colorMode } = props;
     let data = props.data;
     const { language } = React.useContext(LanguageContext);
     const [loading, setLoading] = React.useState(false);
     const [isDatePickerVisible, setDatePickerVisibility] = React.useState(false);
     const [showIndefiniteWarning, setShowIndefiniteWarning] = React.useState(false);
     const [freezeIndefinite, setFreezeIndefinite] = React.useState(false);
     const toast = useToast();

     let actionLabel = freezeLabel;
     if (label) {
          actionLabel = label;
     }

     const today = new Date();
     const [date, setDate] = React.useState(today);


     const showDatePicker = () => {
          if(libraryContext.reactivateDateNotRequired ?? false)
          {
               setShowIndefiniteWarning(true);
          }
          else
          {
               //setShowIndefiniteWarning(true);
               setDatePickerVisibility(true);
          }

     };

     const hideDatePicker = () => {
          setDatePickerVisibility(false);
          setShowIndefiniteWarning(false);
     };

     const onSelectDate = (date) => {
          hideDatePicker();
          setLoading(true);
          logWarnMessage('A date has been picked: ', date);
          setDate(date);
          onClose();
          if (data) {
               freezeHolds(toast, data, libraryContext.baseUrl, date, language, libraryContext.reactivateDateNotRequired ?? false).then((result) => {
                    setLoading(false);
                    resetGroup();
                    hideDatePicker();
               });
          } else {
               freezeHold(toast, freezeId, recordId, source, libraryContext.baseUrl, userId, date, language, libraryContext.reactivateDateNotRequired ?? false).then((result) => {
                    setLoading(false);
                    resetGroup();
                    hideDatePicker();
               });
          }
     };

     return (
          <>
               <ActionsheetItem onPress={showDatePicker}>
                    {data ? null : (
                         <ActionsheetIcon>
                              <Icon as={MaterialIcons} name="pause" mr="$1" size="md" color={textColor} />
                         </ActionsheetIcon>
                    )}
                    <ActionsheetItemText color={textColor}>{actionLabel}</ActionsheetItemText>
               </ActionsheetItem>

               {/* Moved avoidKeyboard to ModalContent where v1 tracks layouts */}
               <Modal isOpen={showIndefiniteWarning} onClose={hideDatePicker} size="full">
                    <ModalBackdrop />
                    <ModalContent
                         bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                         maxWidth="95%"
                         avoidKeyboard
                    >
                         <ModalHeader>
                              <Heading size="sm" color={textColor}>{actionLabel}</Heading>
                              <ModalCloseButton p="$3">
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>

                         <ModalBody>
                              <FormControl>
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>
                                             {getTermFromDictionary("en", "freeze_indefinite_warning")}
                                        </FormControlLabelText>
                                   </FormControlLabel>

                                   <Checkbox
                                        isChecked={freezeIndefinite}
                                        onChange={(value) => setFreezeIndefinite(value)}
                                        aria-label={getTermFromDictionary("en", "freeze_indefinite_checkbox")}
                                        value="freeze-indefinite"
                                   >
                                        <CheckboxIndicator
                                             sx={{
                                                  ':checked': {
                                                       borderColor: theme.tokens.colors.primary['500'],
                                                       backgroundColor: theme.tokens.colors.primary['500'],
                                                  },
                                             }}
                                        >
                                             <CheckboxIcon
                                                  as={MaterialIcons}
                                                  name="check"
                                                  color={theme.tokens.colors.primary['500-text']}
                                                  size="sm"
                                             />
                                        </CheckboxIndicator>
                                        <CheckboxLabel pl="$2" color={textColor}>
                                             {getTermFromDictionary("en", "freeze_indefinite_checkbox")}
                                        </CheckboxLabel>
                                   </Checkbox>
                              </FormControl>
                         </ModalBody>

                         <ModalFooter>
                              {/* Streamlined ButtonGroup for v1 (Removed the conflicting HStack component wrapper) */}
                              <ButtonGroup space="md" direction="row">
                                   <Button
                                        bgColor={theme.tokens.colors.primary['500']}
                                        onPress={hideDatePicker}
                                   >
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>
                                             {getTermFromDictionary("en", "cancel")}
                                        </ButtonText>
                                   </Button>

                                   <Button
                                        bgColor={theme.tokens.colors.primary['500']}
                                        onPress={() => {
                                             if (freezeIndefinite) {
                                                  onSelectDate();
                                             } else {
                                                  setDatePickerVisibility(true);
                                             }
                                        }}
                                   >
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>
                                             {freezeIndefinite
                                                  ? getTermFromDictionary("en", "freeze_hold_without_reactivation")
                                                  : getTermFromDictionary("en", "freeze_hold_choose_reactivation")}
                                        </ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>

               <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    date={date}
                    mode="date"
                    onConfirm={onSelectDate}
                    onCancel={hideDatePicker}
                    isDarkModeEnabled={colorMode === 'dark'}
                    minimumDate={today}
                    textColor={textColor}
                    confirmTextIOS={loading ? freezingLabel : actionLabel}
               />
          </>
     );
};
