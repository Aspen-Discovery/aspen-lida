import {
     Button,
     ButtonText,
     ButtonGroup,
     Checkbox,
     CheckboxIndicator,
     CheckboxIcon,
     CheckboxLabel,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     Input,
     InputField,
     Modal,
     ModalBackdrop,
     ModalContent,
     ModalHeader,
     ModalBody,
     ModalFooter,
     ModalCloseButton,
     VStack,
     CheckIcon,
     Icon, CloseIcon, Heading
} from '@gluestack-ui/themed';
import React from 'react';

// custom components and helper files
import { updateOverDriveEmail } from '../../util/api/user';
import { getTermFromDictionary } from '../../translations/TranslationService';

export const GetOverDriveSettings = (props) => {
     const { promptTitle, promptItemId, promptSource, promptPatronId, promptForOverdriveEmail, libraryUrl, showOverDriveSettings, handleOverDriveSettings, showAlert, setEmail, setRememberPrompt, overdriveEmail, language } = props;

     return (
          <Modal isOpen={showOverDriveSettings} onClose={() => handleOverDriveSettings(false)}>
               <ModalBackdrop />
               <ModalContent>
                    <ModalHeader borderBottomWidth="$0">
                         <Heading>{promptTitle}</Heading>
                         <ModalCloseButton />
                    </ModalHeader>
                    <ModalBody mt="$4">
                         <FormControl>
                              <VStack space="md">
                                   <FormControlLabel>
                                        <FormControlLabelText>{getTermFromDictionary(language, 'overdrive_email_field')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input variant="outline" size="md">
                                        <InputField autoCapitalize="none" autoCorrect={false} onChangeText={(text) => setEmail(text)} />
                                   </Input>
                                   <Checkbox value="yes" size="md" onChange={(isSelected) => setRememberPrompt(isSelected)}>
                                        <CheckboxIndicator mr="$2">
                                             <CheckboxIcon as={CheckIcon} />
                                        </CheckboxIndicator>
                                        <CheckboxLabel>{getTermFromDictionary(language, 'remember_settings')}</CheckboxLabel>
                                   </Checkbox>
                              </VStack>
                         </FormControl>
                    </ModalBody>
                    <ModalFooter borderTopWidth="$0">
                         <ButtonGroup space="md" size="md">
                              <Button action="secondary" variant="ghost" onPress={() => handleOverDriveSettings(false)}>
                                   <ButtonText>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                              </Button>
                              <Button
                                   action="primary"
                                   onPress={async () => {
                                        await updateOverDriveEmail(promptItemId, promptSource, promptPatronId, overdriveEmail, promptForOverdriveEmail, libraryUrl, language).then((response) => {
                                             showAlert(response);
                                        });
                                   }}>
                                   <ButtonText>{getTermFromDictionary(language, 'place_hold')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </ModalFooter>
               </ModalContent>
          </Modal>
     );
};
