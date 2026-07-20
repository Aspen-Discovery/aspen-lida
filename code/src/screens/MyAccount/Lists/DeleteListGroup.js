import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { Center, Button, ButtonIcon, ButtonText, ButtonGroup, Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, Heading, ModalCloseButton, Icon, CloseIcon, Text, useToast } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { deleteListGroup } from '../../../util/api/list';
import { popAlert } from '../../../components/loadError';
import { navigateStack } from '../../../helpers/RootNavigator';

export const DeleteListGroup = ({id, handleUpdate, setCurrentListGroup}) => {
     const queryClient = useQueryClient();
     const { user, listGroups } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const [showModal, setShowModal] = React.useState(false);
     const [loading, setLoading] = React.useState(false);
     const toast = useToast();

     const toggle = () => {
          setShowModal(!showModal);
     };

     return (
          <Center>
               <Button onPress={toggle} size="xs" bgColor="$error500">
                    <ButtonIcon color="$white" as={MaterialIcons} name="delete" mr="$1" />
                    <ButtonText color="$white">{getTermFromDictionary(language, 'delete_list_group')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%"  bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'delete_list_group')}</Heading>
                              <ModalCloseButton p="$3">
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <Text color={textColor}>{getTermFromDictionary(language, 'delete_list_group_confirmation')}</Text>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={toggle} borderColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                   </Button>
                                   <Button bgColor="$error500"
                                           isLoading={loading}
                                           isLoadingText={getTermFromDictionary(language, 'deleting', true)}
                                           onPress={() => {
                                                setLoading(true);
                                                deleteListGroup(id, library.baseUrl).then(async (res) => {
                                                     handleUpdate(listGroups.groups[0]?.id || -1);
                                                     queryClient.invalidateQueries({ queryKey: ['list_groups', user.id, library.baseUrl, language] });
                                                     queryClient.invalidateQueries({ queryKey: ['lists', user.id, library.baseUrl, language] });
                                                     queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                     setLoading(false);
                                                     let status = 'success';
                                                     setShowModal(false);
                                                     if (res.data.result.success === false) {
                                                          status = 'error';
                                                          popAlert(toast, res.data.result.title, res.data.result.message, status);
                                                     } else {
                                                          popAlert(toast, res.data.result.title, res.data.result.message, status);
                                                          navigateStack('AccountScreenTab', 'MyLists', {
                                                               libraryUrl: library.baseUrl,
                                                               hasPendingChanges: true,
                                                          });
                                                     }
                                                });
                                           }}
                                   >
                                        <ButtonText color="$white">{getTermFromDictionary(language, 'delete')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
}
