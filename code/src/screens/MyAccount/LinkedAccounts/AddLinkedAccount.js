import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
     Button,
     ButtonText,
     ButtonGroup,
     Center,
     Modal,
     ModalContent,
     ModalHeader,
     ModalBody,
     ModalFooter,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     Input,
     InputField,
     Icon,
     Heading,
     ModalBackdrop, CloseIcon, ModalCloseButton, InputIcon, InputSlot, useToast,
} from '@gluestack-ui/themed';
import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {LanguageContext, LibrarySystemContext, ThemeContext, UserContext} from '../../../context/initialContext';
import { addLinkedAccount } from '../../../util/api/user';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import {logErrorMessage} from "../../../util/logging";

// custom components and helper files

const AddLinkedAccount = () => {
     const queryClient = useQueryClient();
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const {user} = React.useContext(UserContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const [loading, setLoading] = useState(false);
     const [showModal, setShowModal] = useState(false);
     const [showPassword, setShowPassword] = useState(false);
     const [newUser, setNewUser] = useState('');
     const [password, setPassword] = useState('');
     const toast = useToast();

     const passwordRef = useRef();

     const toggle = () => {
          setShowModal(!showModal);
          setNewUser('');
          setPassword('');
          setLoading(false);
     };

     const refreshLinkedAccounts = async () => {
          queryClient.invalidateQueries({ queryKey: ['linked_accounts', user.id, library.baseUrl, language] });
          queryClient.invalidateQueries({ queryKey: ['viewer_accounts', user.id, library.baseUrl, language] });
          queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
     };

     return (
          <Center>
               <Button onPress={toggle} bgColor={theme.tokens.colors.primary['500']}>
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'linked_add_an_account')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"} maxWidth="95%">
                         <ModalHeader>
                              <Heading size="sm" color={textColor}>{getTermFromDictionary(language, 'linked_account_to_manage')}</Heading>
                              <ModalCloseButton p="$3">
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl>
                                   <FormControlLabel><FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'username')}</FormControlLabelText></FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                        <InputField onChangeText={(text) => setNewUser(text)}
                                                      autoCorrect={false}
                                                      autoCapitalize="none"
                                                      id="username"
                                                      returnKeyType="next"
                                                      textContentType="username"
                                                      required
                                                      color={textColor}
                                                      onSubmitEditing={() => {
                                                           passwordRef.current.focus();
                                                      }}
                                                      blurOnSubmit={false}
                                                      value={newUser}/>
                                   </Input>
                              </FormControl>
                              <FormControl mt="$3">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'password')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                        <InputField onChangeText={(text) => setPassword(text)} value={password} color={textColor} autoCorrect={false}
                                                    autoCapitalize="none" id="password" returnKeyType="next"
                                                    textContentType="password" required size="$lg" type={showPassword ? 'text' : 'password'} ref={passwordRef}
                                        />
                                        <InputSlot onPress={() => setShowPassword(!showPassword)}>
                                             <InputIcon as={MaterialCommunityIcons} name={showPassword ? 'eye' : 'eye-off'} mr="$2" color={textColor} />
                                        </InputSlot>
                                   </Input>
                              </FormControl>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="link" onPress={toggle}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme.tokens.colors.primary['500']}
                                        isLoading={loading}
                                        isLoadingText={getTermFromDictionary(language, 'adding', true)}
                                        onPress={async () => {
                                             setLoading(true);
                                             try {
                                                  await addLinkedAccount(toast, newUser, password, library.baseUrl);
                                                  await refreshLinkedAccounts();
                                             }catch (e) {
                                                  logErrorMessage("Error adding linked account");
                                                  logErrorMessage(e);
                                             }finally {
                                                  toggle();
                                             }
                                        }}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'linked_add_account')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
};

export default AddLinkedAccount;
