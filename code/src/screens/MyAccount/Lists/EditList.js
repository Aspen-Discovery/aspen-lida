import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { popAlert } from '../../../components/loadError';
import { LanguageContext, ThemeContext } from '../../../context/initialContext';
import { useUserState, useListGroups, useUpdateUserProfile, useUpdateLists } from '../../../hooks/useUserData';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { deleteList, editList, getLists } from '../../../util/api/list';
import { refreshProfile } from '../../../util/api/user';
import {Platform} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toArray } from '../../../helpers/helpers';
import {
     AlertDialog,
     AlertDialogContent,
     AlertDialogBody,
     AlertDialogFooter,
     Text,
     Button,
     ButtonText,
     ButtonGroup,
     Pressable,
     Center,
     Heading,
     Icon,
     Input,
     InputField,
     Modal,
     CircleIcon,
     CloseIcon,
     ModalBackdrop,
     ChevronLeftIcon,
     ModalCloseButton,
     ModalContent,
     ModalBody,
     ModalFooter,
     ModalHeader,
     RadioGroup,
     Radio,
     HStack,
     RadioIcon,
     RadioIndicator,
     RadioLabel,
     TextareaInput,
     Textarea,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     AlertDialogBackdrop,
     AlertDialogCloseButton,
     AlertDialogHeader,
     ButtonIcon,
     Checkbox,
     CheckboxIndicator,
     CheckboxIcon,
     CheckboxLabel,
     CheckIcon,
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
      Select, useToast,
} from '@gluestack-ui/themed';

const EditList = (props) => {
      const { data, listId } = props;
      const navigation = useNavigation();
      const { data: userState } = useUserState();
      const updateUserProfile = useUpdateUserProfile();
      const { data: listGroups } = useListGroups();
      const updateLists = useUpdateLists();
      const library = useLibrary();
      const { language } = React.useContext(LanguageContext);
      const [showModal, setShowModal] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [title, setTitle] = React.useState(data.title);
      const [description, setDescription] = React.useState(data.description);
      const [isPublic, setPublic] = React.useState(data.public);
      const [listGroupId, setListGroupId] = React.useState(data.listGroupId);
      const { theme, textColor, colorMode } = React.useContext(ThemeContext);

      const insets = useSafeAreaInsets();
      const user = userState?.user ?? {};

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => (
                    <Pressable
                         onPress={() => {
                              navigateStack('AccountScreenTab', 'MyLists', {
                                   hasPendingChanges: true,
                              });
                         }}
                         mr={3}
                         p="$1">
                         <ChevronLeftIcon size={5} color={textColor} />
                    </Pressable>
               ),
          });
     }, [navigation]);

     return (
          <>
               <ButtonGroup size="sm" justifyContent="center" >
                    <Button onPress={() => setShowModal(true)} bgColor={theme.tokens.colors.primary['500']}>
                         <ButtonIcon color={theme.tokens.colors.primary['500-text']} as={MaterialIcons} name="edit" mr="$1" />
                         <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'edit')}</ButtonText>
                    </Button>
                    <DeleteList listId={listId} />
               </ButtonGroup>
               <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="full" avoidKeyboard>
                    <ModalBackdrop />
                    <ModalContent maxWidth="90%" bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <ModalHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'edit')} {data.title}</Heading>
                              <ModalCloseButton p="$3" onPress={() => { setShowModal(false); }}>
                                   <Icon as={CloseIcon} color={textColor} />
                              </ModalCloseButton>
                         </ModalHeader>
                         <ModalBody>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'title')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}><InputField id="title" defaultValue={data.title} autoComplete="off" onChangeText={(text) => setTitle(text)} color={textColor}/></Input>
                              </FormControl>
                              <FormControl pb="$5">
                                   <FormControlLabel><FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'description')}</FormControlLabelText></FormControlLabel>
                                   <Textarea id="description" defaultValue={data.description} autoComplete="off" onChangeText={(text) => setDescription(text)}><TextareaInput color={textColor}/></Textarea>
                              </FormControl>
                              <FormControl pb="$5">
                                   <FormControlLabel>
                                     <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'access')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <RadioGroup
                                        value={isPublic ? "true" : "false"}
                                        onChange={(nextValue) => {
                                             setPublic(nextValue === "true");
                                        }}>
                                        <HStack direction="row" alignItems="center" space="md" w="75%" maxW="300px">
                                             <Radio value="false" my="$1">
                                                  <RadioIndicator mr="$2"  borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? "$coolGray500" : "$warmGray300"} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'private')}</RadioLabel>
                                             </Radio>
                                             <Radio value="true" my="$1">
                                                  <RadioIndicator mr="$2"  borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                       <RadioIcon as={CircleIcon} color={colorMode === 'light' ? "$coolGray500" : "$warmGray300"} />
                                                  </RadioIndicator>
                                                  <RadioLabel color={textColor}>{getTermFromDictionary(language, 'public')}</RadioLabel>
                                             </Radio>
                                        </HStack>
                                   </RadioGroup>
                              </FormControl>
                              <FormControl>
                                   <FormControlLabel>
                                        <FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'list_group')}</FormControlLabelText>
                                   </FormControlLabel>
                                   <Select
                                       name="newListGroupParent"
                                       selectedValue={listGroupId}
                                       accessibilityLabel={getTermFromDictionary(language, 'list_group')}
                                       onValueChange={(itemValue) => setListGroupId(itemValue)}>
                                        <SelectTrigger variant="outline" size="md">
                                              {listGroupId !== -1 ? (
                                                        toArray(listGroups.groups).map((group) => {
                                                             if (group.id === listGroupId) {
                                                                  return <SelectInput py={0} value={group.title} color={textColor} />;
                                                             }
                                                        })
                                                   ) :
                                                   <SelectInput py={0} placeholder={getTermFromDictionary(language, 'no_list_group')} value={-1} color={textColor} />
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
                                                        <SelectItem label={getTermFromDictionary(language, 'no_list_group')} value="-1" key={-1} sx={{ _text: { color: listGroupId === -1 ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />
                                                        {toArray(listGroups.groups).map((item, index) => {
                                                             return <SelectItem key={index} value={item.id} label={item.title} bgColor={listGroupId === item.id ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: listGroupId === item.id ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
                                                        })}
                                                   </SelectScrollView>
                                             </SelectContent>
                                        </SelectPortal>
                                   </Select>
                              </FormControl>
                         </ModalBody>
                         <ModalFooter>
                              <ButtonGroup>
                                   <Button variant="outline" onPress={() => setShowModal(false)} borderColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                   </Button>
                                    <Button
                                         bgColor={theme.tokens.colors.primary['500']}
                                         isLoading={loading}
                                         isLoadingText={getTermFromDictionary(language, 'saving', true)}
                                         onPress={() => {
                                              setLoading(true);
                                              editList(data.id, title, description, isPublic, library.baseUrl, listGroupId).then(async () => {
                                                   setLoading(false);
                                                   if (title !== null) {
                                                        navigation.setOptions({ title: title });
                                                   }
                                                   setShowModal(false);
                                                   // Refresh lists from API and update local database
                                                   const listsResponse = await getLists(library.baseUrl, 1, 20, 1);
                                                   if (listsResponse.ok) {
                                                        await updateLists(listsResponse.data.result);
                                                   }
                                              });
                                         }}>
                                         <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'save')}</ButtonText>
                                    </Button>
                              </ButtonGroup>
                         </ModalFooter>
                    </ModalContent>
               </Modal>
          </>
     );
};

const DeleteList = (props) => {
      const { listId } = props;
      const {textColor, colorMode } = React.useContext(ThemeContext);
      const { data: userState } = useUserState();
      const library = useLibrary();
      const { language } = React.useContext(LanguageContext);
      const updateUserProfile = useUpdateUserProfile();
      const updateLists = useUpdateLists();
      const [isOpen, setIsOpen] = React.useState(false);
      const [loading, setLoading] = useState(false);
      const [optOutOfSoftDeletion, setOptOutOfSoftDeletion] = useState(false);
      const onClose = () => setIsOpen(false);
      const cancelRef = React.useRef(null);
      const toast = useToast();
      const user = userState?.user ?? {};

     return (
          <Center>
               <Button bgColor="$error500" onPress={() => setIsOpen(!isOpen)} size="sm" >
                    <ButtonIcon color="$white" as={MaterialIcons} name="delete" mr="$1"/>
                    <ButtonText color="$white">Delete List</ButtonText>
               </Button>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                    <AlertDialogBackdrop />
                    <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <AlertDialogHeader>
                              <Heading size="md" color={textColor}>{getTermFromDictionary(language, 'delete_list')}</Heading>
                              <AlertDialogCloseButton>
                                   <Icon as={CloseIcon} color={textColor} />
                              </AlertDialogCloseButton>
                         </AlertDialogHeader>
                         <AlertDialogBody>
                              <Text color={textColor}>
                                   {user.hideSoftDeleteListUI
                                        ? getTermFromDictionary(language, 'delete_list_confirmation_no_restore')
                                        : getTermFromDictionary(language, 'delete_list_confirmation')
                                   }
                              </Text>
                              {!user.hideSoftDeleteListUI && (
                                   <FormControl pt="$3">
                                        <Checkbox
                                             value="optOut"
                                             isChecked={optOutOfSoftDeletion}
                                             onChange={(isChecked) => setOptOutOfSoftDeletion(isChecked)}
                                             alignItems="center"
                                        >
                                             <CheckboxIndicator mr="$2" borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                                  <CheckboxIcon as={CheckIcon} color={colorMode === 'light' ? "$coolGray500" : "$warmGray300"} />
                                             </CheckboxIndicator>
                                             <CheckboxLabel color={textColor}>{getTermFromDictionary(language, 'opt_out_soft_deletion')}</CheckboxLabel>
                                        </Checkbox>
                                   </FormControl>
                              )}
                         </AlertDialogBody>
                         <AlertDialogFooter>
                              <ButtonGroup space="sm">
                                   <Button variant="link" onPress={onClose} ref={cancelRef}>
                                        <ButtonText color={textColor}>{getTermFromDictionary(language, 'cancel')}</ButtonText>
                                   </Button>
                                    <Button
                                         bgColor="$error500"
                                         isLoading={loading}
                                         isLoadingText={getTermFromDictionary(language, 'deleting', true)}
                                         onPress={() => {
                                              setLoading(true);
                                              deleteList(listId, library.baseUrl, optOutOfSoftDeletion).then(async (res) => {
                                                   // Refresh lists from API and update local database
                                                   const listsResponse = await getLists(library.baseUrl, 1, 20, 1);
                                                   if (listsResponse.ok) {
                                                        await updateLists(listsResponse.data.result);
                                                   }
                                                   const profileResponse = await refreshProfile(library.baseUrl);
                                                   if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
                                                        await updateUserProfile(profileResponse.data.result.profile);
                                                   }
                                                   setLoading(false);
                                                   let status = 'success';
                                                   setIsOpen(!isOpen);
                                                   if (res.success === false) {
                                                        status = 'error';
                                                        popAlert(toast, res.title, res.message, status);
                                                   } else {
                                                        popAlert(toast, res.title, res.message, status);
                                                        navigateStack('AccountScreenTab', 'MyLists', {
                                                             libraryUrl: library.baseUrl,
                                                             hasPendingChanges: true,
                                                        });
                                                   }
                                              });
                                         }}>
                                         <ButtonText color="$white">{getTermFromDictionary(language, 'delete')}</ButtonText>
                                    </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};

export default EditList;
