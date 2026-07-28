import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../../context/initialContext';
import { useUserState, useListGroups, useUpdateUserProfile, useUpdateListGroups } from '../../../hooks/useUserData';
import { Center, Button, ButtonIcon, ButtonText, CloseIcon, FormControl, FormControlLabel, FormControlLabelText, Heading, Icon, Input, InputField, Modal, ModalBackdrop, ModalCloseButton, ModalHeader, ModalContent, ModalBody, ButtonGroup, ModalFooter, SelectTrigger, SelectInput, SelectIcon, ChevronDownIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, SelectScrollView, Select, useToast } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { createListGroup, getListGroups } from '../../../util/api/list';
import { refreshProfile } from '../../../util/api/user';
import { popAlert } from '../../../components/loadError';
import { Platform } from 'react-native';
import { toArray } from '../../../helpers/helpers';
import { useActiveLanguage } from '../../../hooks/useLanguageData';

const CreateListGroup = (props) => {
      const { setLoading, updateSelectedListGroup } = props;
      const { data: userState } = useUserState();
      const user = userState?.user ?? {};
      const updateUserProfile = useUpdateUserProfile();
      const { data: listGroups } = useListGroups();
      const updateListGroupsData = useUpdateListGroups();
      const library = useLibrary();
      const language = useActiveLanguage();
      const { textColor, theme, colorMode } = React.useContext(ThemeContext);
      const [loading, setAdding] = React.useState(false);
      const [showModal, setShowModal] = useState(false);

     const [title, setTitle] = useState('');
     const [nestedGroupId, setNestedGroupId] = useState("no");

     const toast = useToast();

     const insets = useSafeAreaInsets();

     let hasListGroups = false;
     if(user.numListGroups) {
          hasListGroups = user.numListGroups > 0;
     }

     const toggle = () => {
          setShowModal(!showModal);
     };

     return (
          <Center>
               <Button onPress={toggle} size="sm" bgColor={theme.tokens.colors.primary['500']}>
                    <ButtonIcon color={theme.tokens.colors.primary['500-text']} as={MaterialIcons} name="add" mr="$1" />
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'create_new_list_group')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%" bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>
                                   {getTermFromDictionary(language, 'create_new_list_group')}
                              </Heading>
                              <ModalCloseButton p="$3" onPress={toggle}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'new_list_group_name')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                        <InputField id="title" onChangeText={(text) => setTitle(text)} returnKeyType="next" defaultValue={title} color={textColor} />
                                   </Input>
                              </FormControl>
                              {hasListGroups && (
                                   <FormControl pb="$5">
                                        <FormControlLabel>
                                             <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'should_nest_list_group')}</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select name="should_nest_list_group" selectedValue={nestedGroupId} accessibilityLabel={getTermFromDictionary(language, 'should_nest_list_group')} onValueChange={(itemValue) => setNestedGroupId(itemValue)}>
                                              <SelectTrigger variant="outline" size="md">
                                                   {nestedGroupId !== 'no' && nestedGroupId !== '' ? (
                                                        toArray(listGroups.groups).map((group) => {
                                                             if (group.id === nestedGroupId) {
                                                                  return <SelectInput py={0} value={group.title} color={textColor} />;
                                                             }
                                                        })
                                                   ) : (
                                                        <SelectInput py={0} value={getTermFromDictionary(language, 'nest_within_group_no')} color={textColor} />
                                                   )}
                                                   <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                                              </SelectTrigger>
                                             <SelectPortal>
                                                  <SelectBackdrop />
                                                  <SelectContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"} pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}>
                                                       <SelectDragIndicatorWrapper>
                                                            <SelectDragIndicator />
                                                       </SelectDragIndicatorWrapper>
                                                   <SelectScrollView>
                                                        <SelectItem label={getTermFromDictionary(language, 'nest_within_group_no')} value="no" key={1} bgColor={nestedGroupId === 'no' ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: nestedGroupId === 'no' ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />
                                                        {toArray(listGroups.groups).map((item, index) => {
                                                             return <SelectItem key={index} value={item.id} label={item.title} bgColor={nestedGroupId === item.id ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: nestedGroupId === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
                                                        })}
                                                   </SelectScrollView>
                                                  </SelectContent>
                                             </SelectPortal>
                                        </Select>
                                   </FormControl>
                              )}
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={toggle} borderColor={colorMode === 'light' ? "$coolGray700" : "$warmGray100"}>
                                        <ButtonText color={colorMode === 'light' ? "$coolGray700" : "$warmGray100"}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                    <Button
                                         bgColor={theme.tokens.colors.primary['500']}
                                         isLoading={loading}
                                         isLoadingText={getTermFromDictionary(language, 'creating_list', true)}
                                         onPress={async () => {
                                              setAdding(true);
                                              await createListGroup(title, nestedGroupId, library.baseUrl).then(async (res) => {
                                                   let status = 'success';
                                                   if (!res.data.result.success) {
                                                        status = 'error';
                                                   }
                                                   // Refresh list groups from API and update local database
                                                   const groupsResponse = await getListGroups(library.baseUrl);
                                                   if (groupsResponse.ok) {
                                                        await updateListGroupsData({
                                                             groups: groupsResponse.data?.result?.groups ?? [],
                                                             unassigned: groupsResponse.data?.result?.unassigned ?? 0,
                                                        });
                                                   }
                                                   const profileResponse = await refreshProfile(library.baseUrl);
                                                   if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
                                                        await updateUserProfile(profileResponse.data.result.profile);
                                                   }
                                                   toggle();
                                                   setLoading(true);
                                                   popAlert(toast, getTermFromDictionary(language, 'list_created'), res.data.result.message, status);
                                                   if (res.data.result.groupId) {
                                                        updateSelectedListGroup(res.data.result.groupId);
                                                   }
                                              });
                                         }}>
                                         <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'create_list_group')}</ButtonText>
                                    </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
}

export default CreateListGroup;
