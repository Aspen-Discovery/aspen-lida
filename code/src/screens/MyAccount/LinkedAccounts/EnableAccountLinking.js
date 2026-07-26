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
     ModalBackdrop, CloseIcon, ModalCloseButton, useToast
} from '@gluestack-ui/themed';
import React, { useState } from 'react';

import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../../context/initialContext';
import { useUpdateUserProfile, useUpdateAccounts, useUpdateViewers } from '../../../hooks/useUserData';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { enableAccountLinking, refreshProfile, getLinkedAccounts, getViewerAccounts } from '../../../util/api/user';
import { formatLinkedAccounts } from '../../../util/api/userHelper';
import { toArray } from '../../../helpers/helpers';

// custom components and helper files

const EnableAccountLinking = () => {
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const updateUserProfile = useUpdateUserProfile();
     const updateAccounts = useUpdateAccounts();
     const updateViewers = useUpdateViewers();
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const [loading, setLoading] = useState(false);
     const [showModal, setShowModal] = useState(false);
     const toast = useToast();

     const toggle = () => {
          setShowModal(!showModal);
          setLoading(false);
     };

     const refreshLinkedAccounts = async () => {
          const linkedResponse = await getLinkedAccounts(library.baseUrl, language);
          if (linkedResponse?.ok) {
               const formatted = formatLinkedAccounts({}, [], library.barcodeStyle, linkedResponse.data.result.linkedAccounts);
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
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'enable_linked_accounts')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="lg">
                    <ModalBackdrop />
                    <ModalContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"} maxWidth="95%">
                         <ModalHeader>
                              <Heading size="sm" color={textColor}>{getTermFromDictionary(language, 'enable_linked_accounts_title')}</Heading>
                              <ModalCloseButton p="$3" onPress={toggle}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary(language, 'enable_linked_accounts_body')}</Text>
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
                                             await enableAccountLinking(toast, language, library.baseUrl).then(async (r) => {
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

export default EnableAccountLinking;
