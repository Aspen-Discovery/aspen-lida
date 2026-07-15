import { useQueryClient } from '@tanstack/react-query';
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
     Text,
     Icon,
     Heading,
     ModalBackdrop, CloseIcon, ModalCloseButton
} from '@gluestack-ui/themed';
import React, { useState } from 'react';

import {LanguageContext, LibrarySystemContext, ThemeContext, UserContext} from '../../../context/initialContext';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { disableAccountLinking } from '../../../util/api/user';

// custom components and helper files

const DisableAccountLinking = () => {
     const queryClient = useQueryClient();
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const {user} = React.useContext(UserContext);
     const [loading, setLoading] = useState(false);
     const [showModal, setShowModal] = useState(false);

     const toggle = () => {
          setShowModal(!showModal);
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
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'disable_linked_accounts')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="lg">
                    <ModalBackdrop />
                    <ModalContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"} maxWidth="95%">
                         <ModalHeader>
                              <Heading size="sm" color={textColor}>{getTermFromDictionary(language, 'disable_linked_accounts_title')}</Heading>
                              <ModalCloseButton p="$3">
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary(language, 'disable_linked_accounts_body')}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="link" onPress={toggle}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                   <Button
                                        bgColor={theme.tokens.colors.primary['500']}
                                        isLoading={loading}
                                        isLoadingText={getTermFromDictionary(language, 'updating', true)}
                                        onPress={async () => {
                                             setLoading(true);
                                             await disableAccountLinking(language, library.baseUrl).then(async (r) => {
                                                  await refreshLinkedAccounts();
                                                  toggle();
                                             });
                                        }}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'accept')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
};

export default DisableAccountLinking;
