import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { Button, ButtonGroup, ButtonIcon, ButtonText, Center, CloseIcon, FormControl, FormControlLabel, FormControlLabelText, Heading, Icon, Input, InputField, Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { editListGroup } from '../../../util/api/list';
import { navigateStack } from '../../../helpers/RootNavigator';

export const EditListGroup = ({currentTitle, id, handleUpdate}) => {
     const queryClient = useQueryClient();
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const [showModal, setShowModal] = React.useState(false);
     const [loading, setLoading] = React.useState(false);

     const [title, setTitle] = React.useState(currentTitle);

     const toggle = () => {
          setShowModal(!showModal);
     };

     return (
          <Center>
               <Button onPress={toggle} size="xs" bgColor={theme.tokens.colors.primary['500']}>
                    <ButtonIcon color={theme.tokens.colors.primary['500-text']} as={MaterialIcons} name="edit" mr="$1" />
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'rename_list_group')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%"  bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'rename_list_group')}</Heading>
                              <ModalCloseButton p="$3" onPress={toggle}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'rename_list_group_to')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}><InputField id="title" defaultValue={currentTitle} autoComplete="off" onChangeText={(text) => setTitle(text)} color={textColor}/></Input>
                              </FormControl>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={toggle} borderColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                   <Button bgColor={theme.tokens.colors.primary['500']}
                                           isLoading={loading}
                                           isLoadingText={getTermFromDictionary(language, 'saving', true)}
                                           onPress={() => {
                                                setLoading(true);
                                                editListGroup(id, title, library.baseUrl).then(async (res) => {
                                                     setLoading(false);
                                                     setShowModal(false);
                                                     handleUpdate(id);
                                                     queryClient.invalidateQueries({ queryKey: ['list_groups', user.id, library.baseUrl, language] });
                                                     navigateStack('AccountScreenTab', 'MyLists', {
                                                          libraryUrl: library.baseUrl,
                                                          hasPendingChanges: true,
                                                     });
                                                });
                                           }}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'save')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
}
