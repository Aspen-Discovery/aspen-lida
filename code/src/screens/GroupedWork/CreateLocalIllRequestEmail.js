import { useRoute, useNavigation } from '@react-navigation/native';
import {
     Button,
     ButtonGroup,
     ButtonText,
     Checkbox,
     CheckIcon,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     Input,
     InputField,
     Select,
     Text,
     Textarea,
     TextareaInput,
     ScrollView,
     VStack,
} from '@gluestack-ui/themed';
import React from 'react';
import { submitLocalIllRequestEmail } from '../../util/api/user';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import { popAlert } from '../../components/loadError';
import { getTermFromDictionary } from '../../translations/TranslationService';

export const CreateLocalIllRequestEmail = () => {
     const route = useRoute();
     const id = route.params.id;
     const title = route.params.workTitle ?? null;
     const author = route.params.workAuthor ?? null;
     const volumeName = route.params.volumeName ?? null;
     const recordId = route.params.recordId ?? null;

     return <Request workId={id} workTitle={title} author={author} volumeName={volumeName} recordId={recordId}/>;
};

const Request = (payload) => {
     const navigation = useNavigation();
     const { workTitle, author, volumeName, recordId} = payload;
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const {theme, textColor, colorMode} = React.useContext(ThemeContext);

     const [userVolumeName, setUserVolumeName] = React.useState(volumeName);
     const [userNote, setUserNote] = React.useState('');

     const [isSubmitting, setIsSubmitting] = React.useState(false);

     const handleSubmission = async () => {
          const request = {
               title: workTitle,
               author: author ?? null,
               volumeName: userVolumeName ?? null,
               note: userNote ?? null,
               recordId: recordId ?? null
          };
          //logDebugMessage("Submitting local ill request email");
          //logDebugMessage(request);
          await submitLocalIllRequestEmail(library.baseUrl, request).then(async (result) => {
               setIsSubmitting(false);
               //logDebugMessage("Result from submitting local ill request email");
               //logDebugMessage(result);
               if (result.success) {
                    navigation.goBack();
               } else {
                    popAlert(result.api.title, result.api.message, 'error');
               }
          });
     };

     return (
          <ScrollView>
               <VStack space="md" p="$4">
                    <FormControl my={2}>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>
                                   {getTermFromDictionary(language, 'title')}
                              </FormControlLabelText>
                         </FormControlLabel>
                         <Input isReadOnly={true}>
                              <InputField
                                   id="title"
                                   size="$lg"
                                   value={workTitle}
                                   defaultValue={workTitle}
                                   isReadOnly={true}
                              />
                         </Input>
                    </FormControl>
                    <FormControl my={2}>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>
                                   {getTermFromDictionary(language, 'author')}
                              </FormControlLabelText>
                         </FormControlLabel>
                         <Input isReadOnly={true}>
                              <InputField
                                   id="author"
                                   size="$lg"
                                   value={author}
                                   defaultValue={author}
                              />
                         </Input>
                    </FormControl>
                    <FormControl my={2}>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>
                                   {getTermFromDictionary(language, 'volume')}
                              </FormControlLabelText>
                         </FormControlLabel>
                         <Input borderColor={colorMode === 'light' ? "$coolGray500" : "$gray300"}>
                              <InputField
                                   id="volume"
                                   size="$lg"
                                   value={userVolumeName}
                                   defaultValue={volumeName}
                                   onChangeText={(text) => {
                                        setUserVolumeName(text);
                                   }}
                              />
                         </Input>
                    </FormControl>
                    <FormControl my={2}>
                         <FormControlLabel>
                              <FormControlLabelText fontSize="$sm" color={textColor}>
                                   {getTermFromDictionary(language, 'note')}
                              </FormControlLabelText>
                         </FormControlLabel>
                         <Textarea
                              id="note"
                              size="$lg"
                         >
                              <TextareaInput
                                   color={textColor}
                                   value={userNote}
                                   defaultValue={userNote}
                                   onChangeText={(text) => {
                                        setUserNote(text);
                                   }}
                              />
                         </Textarea>
                    </FormControl>
                    <ButtonGroup>
                         <Button
                              isLoading={isSubmitting}
                              isLoadingText={getTermFromDictionary(language, 'saving', true)}
                              onPress={() => {
                                   setIsSubmitting(true);
                                   handleSubmission();
                              }}>
                              <ButtonText>{getTermFromDictionary(language, 'submit')}</ButtonText>
                         </Button>
                         <Button
                              variant="outline"
                              onPress={() => {
                                   navigation.goBack()
                              }}>
                              <ButtonText>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                         </Button>
                    </ButtonGroup>
               </VStack>
          </ScrollView>
     );
};
