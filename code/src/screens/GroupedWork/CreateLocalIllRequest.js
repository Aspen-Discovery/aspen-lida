import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Box, Button, ButtonText, ButtonSpinner, Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel, CheckIcon, FormControl, FormControlLabel, FormControlLabelText, Input, InputField, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, SelectScrollView, Text, Textarea, TextareaInput, ScrollView, HStack, ChevronDownIcon, Alert, AlertText } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadingSpinner } from '../../components/loadingSpinner';
import { submitLocalIllRequest } from '../../util/api/user';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext, UserContext, ThemeContext } from '../../context/initialContext';
import { loadError } from '../../components/loadError';
import { getLocalIllForm } from '../../util/api/system';
import { logDebugMessage, logErrorMessage, logInfoMessage, getErrorMessage } from '../../util/logging';
import { stripHTML } from '../../helpers/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CreateLocalIllRequest = () => {
     const [formConfig, setFormConfig] = React.useState([]);
     const [hasError, setHasError] = React.useState(false);
     const { library } = React.useContext(LibrarySystemContext);
     const { location } = React.useContext(LibraryBranchContext);
     const route = useRoute();

     const id = route.params.id;
     const title = route.params.workTitle ?? null;
     const volumeId = route.params.volumeId ?? null;
     const volumeName = route.params.volumeName ?? null;

     if (String(location.localIllFormId) === '-1' || location.localIllFormId === null) {
          return loadError('The ILL System is not setup properly, please contact your library to place a request', '');
     }

     logInfoMessage("Local ILL Form Id " + location.localIllFormId);
     logInfoMessage("ID " + route.params.id);
     logInfoMessage("Volume ID " + volumeId);
     logInfoMessage("Volume Name " + volumeName);

     const { status, data, error, isFetching, refetch } = useQuery({
          queryKey: ['localIllForm', location.localIllFormId, library.baseUrl],
          queryFn: () => getLocalIllForm(library.baseUrl, location.localIllFormId),
          onSuccess: (data) => {
               try {
                    if (data.ok) {
                         setFormConfig(data.data.result);
                    }
               } catch (e) {
                    setHasError(true);
                    logDebugMessage('Error fetching local ILL form configuration');
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.data.result);
               }
          },
          onError: (error) => {
               logDebugMessage('Error fetching local ILL form configuration');
               logErrorMessage(error);
          },
     });

     useFocusEffect(
          React.useCallback(() => {
               try {
                    if (data.ok) {
                         setFormConfig(data.data.result);
                    }
               } catch (e) {
                    refetch();
               }
          }, [])
     );

     return <>{status === 'loading' || isFetching ? loadingSpinner() : (hasError || status === 'error') ? loadError('The ILL System is not setup properly, please contact your library to place a request', '') : <Request config={formConfig} workId={id} workTitle={title} volumeId={volumeId} volumeName={volumeName} />}</>;
};

const Request = (payload) => {
     const [title, setTitle] = React.useState('');
     const [note, setNote] = React.useState('');
     const [acceptFee, setAcceptFee] = React.useState(false);
     const [pickupLocation, setPickupLocation] = React.useState();
     const [isSubmitting, setIsSubmitting] = React.useState(false);
     const [errorMessage, setErrorMessage] = React.useState('');
     const { library } = React.useContext(LibrarySystemContext);
     const { user } = React.useContext(UserContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const navigation = useNavigation();
     const queryClient = useQueryClient();
     const insets = useSafeAreaInsets();

     const { config, workId, workTitle, volumeId, volumeName } = payload;

     // Make sure we have a valid config object before trying to render the form
     if (!config || !config.fields || typeof config.fields !== 'object') {
          logDebugMessage('Local ILL Form configuration is invalid');
          logDebugMessage(config);
          return loadError('The ILL System is not setup properly, please contact your library to place a request', '');
     }

     const handleSubmission = async () => {
          const request = {
               title: title ?? workTitle,
               acceptFee: acceptFee,
               note: note ?? null,
               catalogKey: workId ?? null,
               pickupLocation: pickupLocation ?? null,
               volumeId: volumeId,
          };
          await submitLocalIllRequest(library.baseUrl, request).then(async (result) => {
               setIsSubmitting(false);
               if (result.success) {
                    setErrorMessage('');
                    navigation.goBack();
                    queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                    queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
               } else {
                    setErrorMessage(result.message);
               }
          });
     };

     const getIntroText = () => {
          const field = config.fields.introText;
          if (field.display === 'show') {
               return (
                    <Text size="sm" pb="$3" color={textColor}>
                         {stripHTML(field.label)}
                    </Text>
               );
          }
          return null;
     };

     const getTitleField = () => {
          const field = config.fields.title;
          if (field.display === 'show') {
               let fullTitle = workTitle;
               if (volumeName !== undefined) {
                    fullTitle += " " + volumeName;
               }
               return (
                    <FormControl my="$2" isRequired={field.required}>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{field.label}</FormControlLabelText>
                         </FormControlLabel>
                         <Input>
                              <InputField
                                   name={field.property}
                                   defaultValue={fullTitle}
                                   accessibilityLabel={field.description ?? field.label}
                                   onChangeText={(value) => {
                                        setTitle(value);
                                   }}
                              />
                         </Input>
                    </FormControl>
               );
          }
          return null;
     };

     const getFeeInformation = () => {
          const field = config.fields.feeInformationText;
          if (field.display === 'show' && field.label && field.label.trim() !== '') {
               return (
                    <Text fontWeight="bold" color={textColor}>
                         {stripHTML(field.label)}
                    </Text>
               );
          }
          return null;
     };

     const getAcceptFeeCheckbox = () => {
          const field = config.fields.acceptFee;
          if (field.display === 'show') {
               return (
                    <FormControl my="$2" maxWidth="90%" isRequired={field.required}>
                         <Checkbox
                              value="accept"
                              accessibilityLabel={field.description ?? field.label}
                              onChange={(value) => {
                                   setAcceptFee(value);
                              }}>
                              <CheckboxIndicator mr="$2">
                                   <CheckboxIcon>
                                        <CheckIcon />
                                   </CheckboxIcon>
                              </CheckboxIndicator>
                              <CheckboxLabel>
                                   <Text color={textColor}>{field.label}</Text>
                              </CheckboxLabel>
                         </Checkbox>
                    </FormControl>
               );
          }
          return null;
     };

     const getNoteField = () => {
          const field = config.fields.note;
          if (field.display === 'show') {
               return (
                    <FormControl my="$2" isRequired={field.required}>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{field.label}</FormControlLabelText>
                         </FormControlLabel>
                         <Textarea>
                              <TextareaInput
                                   name={field.property}
                                   value={note}
                                   accessibilityLabel={field.description ?? field.label}
                                   onChangeText={(text) => {
                                        setNote(text);
                                   }}
                              />
                         </Textarea>
                    </FormControl>
               );
          }
          return null;
     };

     const getPickupLocations = () => {
          const field = config.fields.pickupLocation;
          if (field.display === 'show' && Array.isArray(field.options)) {
               const locations = field.options;
               return (
                    <FormControl my="$2" isRequired={field.required}>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{field.label}</FormControlLabelText>
                         </FormControlLabel>
                         <Select
                              selectedValue={pickupLocation}
                              onValueChange={(itemValue) => {
                                   setPickupLocation(itemValue);
                              }}>
                              <SelectTrigger variant="outline" size="md">
                                   {pickupLocation ? (
                                        locations.map((location, index) => {
                                             if (location.code === pickupLocation) {
                                                  return <SelectInput key={index} value={location.displayName} color={textColor} />;
                                             }
                                        })
                                   ) : (
                                        <SelectInput placeholder="Select a pickup location" color={textColor} />
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
                                             {locations.map((location, index) => {
                                                  return <SelectItem key={index} label={location.displayName} value={location.code} bgColor={pickupLocation === location.code ? theme.tokens.colors.tertiary['300'] : ''} sx={{ _text: { color: pickupLocation === location.code ? theme.tokens.colors.tertiary['500-text'] : textColor } }} />;
                                             })}
                                        </SelectScrollView>
                                   </SelectContent>
                              </SelectPortal>
                         </Select>
                    </FormControl>
               );
          }
          return null;
     };

     const getCatalogKeyField = () => {
          const field = config.fields.catalogKey;
          if (field.display === 'show') {
               return (
                    <FormControl my="$2" isDisabled isRequired={field.required}>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{field.label}</FormControlLabelText>
                         </FormControlLabel>
                         <Input>
                              <InputField name={field.property} defaultValue={catalogKey} accessibilityLabel={field.description ?? field.label} />
                         </Input>
                    </FormControl>
               );
          }
          return null;
     };

     const getVolumeIdField = () => {
          const field = config.fields.volumeId;
          if (field.display === 'show') {
               return (
                    <FormControl my="$2" isDisabled isRequired={field.required}>
                         <FormControlLabel>
                              <FormControlLabelText color={textColor}>{field.label}</FormControlLabelText>
                         </FormControlLabel>
                         <Input>
                              <InputField name={field.property} defaultValue={volumeId} accessibilityLabel={field.description ?? field.label} />
                         </Input>
                    </FormControl>
               );
          }
          return null;
     };

     const getActions = () => {
          return (
               <HStack space="md" pt="$3">
                    <Button
                         bgColor={theme['tokens']['colors']['secondary']['500']}
                         isDisabled={isSubmitting}
                         onPress={() => {
                              setIsSubmitting(true);
                              handleSubmission();
                         }}>
                         <ButtonText color={theme['tokens']['colors']['secondary']['500-text']}>
                              {isSubmitting ? (
                                   <>
                                        <ButtonSpinner mr="$2" />
                                        {config.buttonLabelProcessing}
                                   </>
                              ) : (
                                   config.buttonLabel
                              )}
                         </ButtonText>
                    </Button>
                    <Button variant="outline" onPress={() => navigation.goBack()} borderColor={colorMode === 'light' ? "$warmGray300" : "$coolGray500"}>
                         <ButtonText color={colorMode === 'light' ? "warmGray500" : "$coolGray300"}>Cancel</ButtonText>
                    </Button>
               </HStack>
          );
     };

     const getErrorMessage = () => {
          if (errorMessage) {
               return (
                    <Alert width="100%" maxwidth="$full" action="warning" variant="solid">
                         <AlertText size="xs" bold>
                              {errorMessage}
                         </AlertText>
                    </Alert>
               );
          }
          return null;
     };

     return (
          <ScrollView>
               <Box p="$5">
                    {errorMessage ? getErrorMessage() : null}
                    {getIntroText()}
                    {getTitleField()}
                    {getNoteField()}
                    {getFeeInformation()}
                    {getAcceptFeeCheckbox()}
                    {getPickupLocations()}
                    {getCatalogKeyField()}
                    {getVolumeIdField()}
                    {getActions()}
               </Box>
          </ScrollView>
     );
};
