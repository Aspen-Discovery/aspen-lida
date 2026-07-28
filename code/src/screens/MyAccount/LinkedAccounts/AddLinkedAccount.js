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
     ModalBackdrop, CloseIcon, ModalCloseButton, InputIcon, InputSlot, useToast } from '@gluestack-ui/themed';
import React, { useState, useRef } from 'react';


import { useUserState, useUpdateUserProfile, useUpdateAccounts, useUpdateViewers } from '../../../hooks/useUserData';
import { addLinkedAccount, refreshProfile, getLinkedAccounts, getViewerAccounts } from '../../../util/api/user';
import { formatLinkedAccounts } from '../../../util/api/userHelper';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import {logErrorMessage} from "../../../util/logging";
import { toArray } from '../../../helpers/helpers';
import { useActiveLanguage } from '../../../hooks/useLanguageData';
import { useTheme } from '../../../themes/theme';

// custom components and helper files

const AddLinkedAccount = () => {
     const library = useLibrary();
     const language = useActiveLanguage();
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const updateUserProfile = useUpdateUserProfile();
     const updateAccounts = useUpdateAccounts();
     const updateViewers = useUpdateViewers();
     const { textColor, theme, colorMode } = useTheme();
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
          const linkedResponse = await getLinkedAccounts(library.baseUrl, language);
          if (linkedResponse?.ok) {
               const formatted = formatLinkedAccounts(user, [], library.barcodeStyle, linkedResponse.data.result.linkedAccounts);
               await updateAccounts(formatted.accounts);
          }

          const viewerResponse = await getViewerAccounts(library.baseUrl, language);
          if (viewerResponse?.ok) {
               const viewerList = toArray(viewerResponse.data?.result?.viewers ?? []);
               await updateViewers(viewerList);
          }

          const profileResponse = await refreshProfile(library.baseUrl);
          if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
               await updateUserProfile(profileResponse.data.result.profile);
          }
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
                              <ModalCloseButton p="$3" onPress={toggle}>
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
