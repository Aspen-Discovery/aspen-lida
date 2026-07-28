import React from 'react';
import { LanguageContext, ThemeContext } from '../../../context/initialContext';
import { useUserState, useListGroups, useUpdateUserProfile, useUpdateListGroups, useUpdateLists } from '../../../hooks/useUserData';
import { Center, Button, ButtonIcon, ButtonText, ButtonGroup, Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, Heading, ModalCloseButton, Icon, CloseIcon, Text, useToast } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { deleteListGroup, getLists, getListGroups } from '../../../util/api/list';
import { refreshProfile } from '../../../util/api/user';
import { popAlert } from '../../../components/loadError';
import { navigateStack } from '../../../helpers/RootNavigator';

export const DeleteListGroup = ({id, handleUpdate}) => {
      const { data: userState } = useUserState();
      const updateUserProfile = useUpdateUserProfile();
      const { data: listGroups } = useListGroups();
      const updateLists = useUpdateLists();
      const updateListGroups = useUpdateListGroups();
      const library = useLibrary();
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
                              <ModalCloseButton p="$3" onPress={toggle}>
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
                                                      // Refresh lists and list groups from API and update local database
                                                      const listsResponse = await getLists(library.baseUrl, 1, 20, 1);
                                                      if (listsResponse.ok) {
                                                           await updateLists(listsResponse.data.result);
                                                      }
                                                      const groupsResponse = await getListGroups(library.baseUrl);
                                                      if (groupsResponse.ok) {
                                                           await updateListGroups({
                                                                groups: groupsResponse.data?.result?.groups ?? [],
                                                                unassigned: groupsResponse.data?.result?.unassigned ?? 0,
                                                           });
                                                      }
                                                      const profileResponse = await refreshProfile(library.baseUrl);
                                                      if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
                                                           await updateUserProfile(profileResponse.data.result.profile);
                                                      }
                                                      handleUpdate(listGroups.groups[0]?.id || -1);
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
