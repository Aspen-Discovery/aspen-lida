import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageContext, ThemeContext } from '../../../context/initialContext';
import { useUserState, useListGroups, useUpdateLists, useUpdateListGroups } from '../../../hooks/useUserData';
import {
     Center,
     Button,
     ButtonIcon,
     ButtonText,
     Modal,
     ModalBackdrop,
     ModalContent,
     ModalHeader,
     Heading,
     ModalCloseButton,
     Icon,
     CloseIcon,
     ModalBody,
     ModalFooter,
     ButtonGroup,
     FormControlLabel,
     FormControlLabelText,
     Select,
     SelectTrigger,
     SelectInput,
     SelectIcon,
     ChevronDownIcon,
     SelectPortal,
     SelectBackdrop,
     SelectContent,
     SelectDragIndicatorWrapper,
     SelectDragIndicator,
     SelectItem,
     SelectScrollView,
     FormControl,
     useToast
} from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { editListGroupParent, getLists, getListGroups } from '../../../util/api/list';
import { popAlert } from '../../../components/loadError';
import { navigateStack } from '../../../helpers/RootNavigator';
import { Platform } from 'react-native';
import { toArray } from '../../../helpers/helpers';

export const EditListGroupParent = ({id, parentId, handleUpdate}) => {
      const { data: userState } = useUserState();
      const { data: listGroups } = useListGroups();
      const updateLists = useUpdateLists();
      const updateListGroups = useUpdateListGroups();
      const library = useLibrary();
      const { language } = React.useContext(LanguageContext);
      const { textColor, theme, colorMode } = React.useContext(ThemeContext);
      const [showModal, setShowModal] = React.useState(false);
      const [loading, setLoading] = React.useState(false);

      const [selectedGroup, setSelectedGroup] = React.useState(null);
      const [newListGroupParentId, setNewListGroupParentId] = React.useState(parentId); // default state is current list group parent id

      const insets = useSafeAreaInsets();

      const toast = useToast();

      React.useEffect(() => {
           if (listGroups && listGroups.groups && parentId != null) {
                const found = toArray(listGroups.groups).find((item) => item.id === parentId) || null;
                setSelectedGroup(found);
           } else {
                setSelectedGroup(null);
           }
      }, [listGroups.groups, parentId]);

      const updateSelectedGroup = (groupId) => {
           const group = toArray(listGroups.groups).find((item) => item.id === groupId);
           setSelectedGroup(group);
           setNewListGroupParentId(groupId);
      }

     const toggle = () => {
          setShowModal(!showModal);
     };

     return (
          <Center>
               <Button onPress={toggle} size="xs" bgColor={theme.tokens.colors.primary['500']}>
                    <ButtonIcon color={theme.tokens.colors.primary['500-text']} as={MaterialIcons} name="edit" mr="$1" />
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'move_list_group')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%"  bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'move_list_group')}</Heading>
                              <ModalCloseButton p="$3" onPress={toggle}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'move_list_group_to')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Select
                                        name="newListGroupParent"
                                        selectedValue={newListGroupParentId}
                                        accessibilityLabel={getTermFromDictionary(language, 'move_list_group_to')}
                                        onValueChange={(itemValue) => updateSelectedGroup(itemValue)}>
                                         <SelectTrigger variant="outline" size="md">
                                              {selectedGroup === null && parentId !== null ? (
                                                        toArray(listGroups.groups).map((group) => {
                                                             if (group.id === parentId) {
                                                                  return <SelectInput value={group.title} color={textColor} />;
                                                             }
                                                        })
                                                   ) :
                                                   (selectedGroup === null && parentId === null ? (
                                                        <SelectInput color={textColor} value={getTermFromDictionary(language, 'choose_existing_list_group')} />
                                                   ) : (
                                                        <SelectInput color={textColor} value={selectedGroup.title} />
                                                   ))
                                              }
                                            <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                                         </SelectTrigger>
                                        <SelectPortal>
                                             <SelectBackdrop />
                                             <SelectContent
                                                  bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                                                  pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                                             >
                                                  <SelectDragIndicatorWrapper>
                                                       <SelectDragIndicator />
                                                  </SelectDragIndicatorWrapper>
                                                   <SelectScrollView>
                                                        {toArray(listGroups.groups).map((item, index) => {
                                                             if(item.id === id || item.id === parentId || item.parentGroupId === id) {
                                                                  return null;
                                                             }
                                                             return <SelectItem key={index} value={item.id} label={item.title} bgColor={newListGroupParentId === item.id ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: newListGroupParentId === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
                                                        })}
                                                   </SelectScrollView>
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={toggle} borderColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                     <Button bgColor={theme.tokens.colors.primary['500']}
                                             isLoading={loading}
                                             isDisabled={selectedGroup === null}
                                             isLoadingText={getTermFromDictionary(language, 'saving', true)}
                                            onPress={() => {
                                                 setLoading(true);
                                                 editListGroupParent(id, newListGroupParentId, library.baseUrl).then(async (res) => {
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
                                                      setLoading(false);
                                                      let status = 'success';
                                                      setShowModal(false);
                                                      handleUpdate(id);
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
