import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
     Button,
     ButtonGroup,
     ButtonText,
     ButtonIcon,
     Center,
     FormControl,
     FormControlLabel,
     CircleIcon,
     FormControlLabelText,
     Heading,
     Icon,
     Input,
     InputField,
     Modal,
     ModalContent,
     ModalHeader,
     ModalBody,
     ModalFooter,
     Radio,
     RadioGroup,
     RadioLabel,
     RadioIndicator,
     RadioIcon,
     HStack,
     Textarea,
     TextareaInput,
     CloseIcon,
     ModalCloseButton,
     ModalBackdrop,
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
     Select,
     useToast
} from '@gluestack-ui/themed';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { popAlert } from '../../../components/loadError';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { createList } from '../../../util/api/list';
import { Platform } from 'react-native';
import _ from 'lodash';
import {logDebugMessage, logErrorMessage} from "../../../util/logging";

const CreateList = (props) => {
     const { setLoading } = props;
     const queryClient = useQueryClient();
     const { user, listGroups } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const [loading, setAdding] = React.useState(false);
     const [showModal, setShowModal] = useState(false);

     const [title, setTitle] = React.useState('');
     const [description, setDescription] = React.useState('');
     const [isPublic, setPublic] = React.useState("false");
     const [addToGroup, setAddToGroup] = React.useState('no');
     const [groupName, setGroupName] = React.useState('');
     const [newGroupName, setNewGroupName] = React.useState('');
     const [nestedGroup, setNestedGroup] = React.useState('');
     const [existingGroupId, setExistingGroupId] = React.useState(user.lastListGroupAdded ? user.lastListGroupAdded : (listGroups?.groups[0] ? listGroups.groups[0].id : 0));
     const toast = useToast();
     const insets = useSafeAreaInsets();

     let hasListGroups = false;
     if(user.numListGroups) {
          hasListGroups = user.numListGroups > 0;
     }

     const toggle = () => {
          setShowModal(!showModal);
          setTitle('');
          setDescription('');
          setPublic("false");
          setAdding(false);
          setAddToGroup('no')
          setGroupName('');
          setNewGroupName('');
          setNestedGroup('');
          setExistingGroupId(user.lastListGroupAdded ? user.lastListGroupAdded : (listGroups?.groups[0] ? listGroups.groups[0].id : 0));
     };

     return (
          <Center>
               <Button onPress={toggle} size="sm" bgColor={theme.tokens.colors.primary['500']}>
                    <ButtonIcon color={theme.tokens.colors.primary['500-text']} as={MaterialIcons} name="add" mr="$1" />
                    <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'create_new_list')}</ButtonText>
               </Button>
               <Modal isOpen={showModal} onClose={toggle} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%" bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>
                                   {getTermFromDictionary(language, 'create_new_list')}
                              </Heading>
                              <ModalCloseButton p="$3" onPress={toggle}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'title')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                        <InputField id="title" onChangeText={(text) => setTitle(text)} returnKeyType="next" defaultValue={title} color={textColor} />
                                   </Input>
                              </FormControl>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'description')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Textarea id="description" onChangeText={(text) => setDescription(text)} defaultValue={description} returnKeyType="next" borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                        <TextareaInput color={textColor} />
                                   </Textarea>
                              </FormControl>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'access')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <RadioGroup
                                        name="access"
                                        value={isPublic}
                                        onChange={(nextValue) => {
                                             setPublic(nextValue);
                                        }}>
                                        <HStack direction="row" alignItems="center" space="md" w="75%" maxW="300px">
                                             <Radio value="false" my="$1">
                                                  <RadioIndicator mr="$2" borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? "$coolGray500" : "$warmGray300"} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'private')}</RadioLabel>
                                             </Radio>
                                             <Radio value="true" my="$1">
                                                  <RadioIndicator mr="$2" borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? "$coolGray500" : "$warmGray300"} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'public')}</RadioLabel>
                                             </Radio>
                                        </HStack>
                                   </RadioGroup>
                              </FormControl>
                              <FormControl pb="$3">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'should_add_to_list_group')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Select name="should_add_to_list_group" selectedValue={addToGroup} accessibilityLabel={getTermFromDictionary(language, 'should_add_to_list_group')} onValueChange={(itemValue) => setAddToGroup(itemValue)}>
                                        <SelectTrigger variant="outline" size="md">
                                             {addToGroup !== '' ? <SelectInput py={0} color={textColor} value={addToGroup === 'new' ? getTermFromDictionary(language, 'add_to_list_group_new') : addToGroup === 'existing' ? getTermFromDictionary(language, 'add_to_list_group_existing') : getTermFromDictionary(language, 'add_to_list_group_no')} /> : <SelectInput value={getTermFromDictionary(language, 'add_to_list_group_no')} color={textColor} />}
                                             <SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                             <SelectBackdrop />
                                             <SelectContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"} pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}>
                                                  <SelectDragIndicatorWrapper>
                                                       <SelectDragIndicator />
                                                  </SelectDragIndicatorWrapper>
                                                  <SelectScrollView>
                                                       <SelectItem label={getTermFromDictionary(language, 'add_to_list_group_no')} value="no" key={1} bgColor={addToGroup === 'no' ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: addToGroup === 'no' ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />
                                                       <SelectItem label={getTermFromDictionary(language, 'add_to_list_group_new')} value="new" key={2} bgColor={addToGroup === 'new' ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: addToGroup === 'new' ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />
                                                       {hasListGroups && <SelectItem label={getTermFromDictionary(language, 'add_to_list_group_existing')} value="existing" key={3} bgColor={addToGroup === 'existing' ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: addToGroup === 'existing' ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />}
                                                  </SelectScrollView>
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                              {addToGroup === 'new' && (
                                   <>
                                        <FormControl pb="$2">
                                             <FormControlLabel>
                                                  <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'new_list_group_name')}</FormControlLabelText>
                                             </FormControlLabel>
                                             <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                  <InputField id="newGroupName" onChangeText={(text) => setNewGroupName(text)} defaultValue={newGroupName} color={textColor} />
                                             </Input>
                                        </FormControl>
                                        {hasListGroups && (
                                             <FormControl pb="$2">
                                                  <FormControlLabel>
                                                       <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'should_nest_list_group')}</FormControlLabelText>
                                                  </FormControlLabel>
                                                  <Select name="should_nest_list_group" selectedValue={nestedGroup} accessibilityLabel={getTermFromDictionary(language, 'should_nest_list_group')} onValueChange={(itemValue) => setNestedGroup(itemValue)}>
                                                       <SelectTrigger variant="outline" size="md">
                                                            {nestedGroup !== 'no' && nestedGroup !== '' ? (
                                                                 _.map(Object.values(listGroups.groups), function (group, selectedIndex, array) {
                                                                      if (group.id === nestedGroup) {
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
                                                                      <SelectItem label={getTermFromDictionary(language, 'nest_within_group_no')} value="no" key={1} bgColor={nestedGroup === 'no' ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: nestedGroup === 'no' ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />
                                                                      {_.map(Object.values(listGroups.groups), function (item, index, array) {
                                                                           return <SelectItem key={index} value={item.id} label={item.title} bgColor={nestedGroup === item.id ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: nestedGroup === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
                                                                      })}
                                                                 </SelectScrollView>
                                                            </SelectContent>
                                                       </SelectPortal>
                                                  </Select>
                                             </FormControl>
                                        )}
                                   </>
                              )}
                              {addToGroup === 'existing' && hasListGroups && (
                                   <FormControl pb="$5">
                                        <FormControlLabel>
                                             <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'choose_existing_list_group')}</FormControlLabelText>
                                        </FormControlLabel>
                                        <Select
                                             selectedValue={existingGroupId}
                                             defaultValue={existingGroupId}
                                             onValueChange={(itemValue) => {
                                                  setExistingGroupId(itemValue);
                                                  setNestedGroup(itemValue);
                                                  logDebugMessage(itemValue);
                                             }}>
                                             <SelectTrigger variant="outline" size="md">
                                                  {existingGroupId && existingGroupId !== -1 ? (
                                                       _.map(Object.values(listGroups.groups), function (group, selectedIndex, array) {
                                                            if (group.id === existingGroupId) {
                                                                 return <SelectInput py={0} value={group.title} color={textColor} />;
                                                            }
                                                       })
                                                  ) : (
                                                       <SelectInput py={0} value={listGroups.groups[0].id} color={textColor} />
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
                                                             {_.map(Object.values(listGroups.groups), function (item, index, array) {
                                                                  return <SelectItem key={index} value={item.id} label={item.title} bgColor={existingGroupId === item.id ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: existingGroupId === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
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
                                             setLoading(true);
                                             try {
                                                  await createList(title, description, isPublic, library.baseUrl, addToGroup, nestedGroup, newGroupName, existingGroupId).then(async (res) => {
                                                       let status = 'success';
                                                       if (!res.success) {
                                                            status = 'danger';
                                                       }
                                                       queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                       queryClient.invalidateQueries({ queryKey: ['lists', user.id, library.baseUrl, language] });
                                                       queryClient.invalidateQueries({ queryKey: ['list_groups', user.id, library.baseUrl, language] });
                                                       toggle();
                                                       popAlert(toast, getTermFromDictionary(language, 'list_created'), res.message, status);
                                                  });
                                             } catch (error) {
                                                  logErrorMessage("Failed to create list: ", error);
                                                  popAlert(toast, "Error", "Something went wrong while creating the list.", "danger");
                                             } finally {
                                                  setAdding(false);
                                                  setLoading(false);
                                             }
                                        }}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'create_list')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </Center>
     );
};

export default CreateList;
