import React from 'react';
import { Text, ChevronDownIcon, Heading, HStack, VStack, Badge, BadgeText, Button, ButtonGroup, ButtonText, ButtonIcon, Box, Icon, Center, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogBackdrop, Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem, SelectScrollView, ScrollView } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { loadingSpinner } from '../../components/loadingSpinner';
import { placeHold, confirmHold, refreshProfile } from '../../util/api/user';
import { getRecords } from '../../util/api/item';
import { loadError } from '../../components/loadError';
import { navigate, navigateStack } from '../../helpers/RootNavigator';
import { stripHTML } from '../../helpers/helpers';
import { getStatusIndicator } from './StatusIndicator';
import { ActionButton } from '../../components/Action/ActionButton';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';

import { logDebugMessage, logWarnMessage, getErrorMessage } from '../../util/logging.js';

export const Editions = () => {
     // 1. Hooks
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const { library } = React.useContext(LibrarySystemContext);
     const { user } = React.useContext(UserContext);
     const { language } = React.useContext(LanguageContext);
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);
     const insets = useSafeAreaInsets();

     const [isLoading, setLoading] = React.useState(false);
     const [confirmingHold, setConfirmingHold] = React.useState(false);
     const [selectedItem, setSelectedItem] = React.useState('');
     const [responseIsOpen, setResponseIsOpen] = React.useState(false);
     const [response, setResponse] = React.useState('');
     const [holdConfirmationIsOpen, setHoldConfirmationIsOpen] = React.useState(false);
     const [holdConfirmationResponse, setHoldConfirmationResponse] = React.useState('');
     const [holdItemSelectIsOpen, setHoldItemSelectIsOpen] = React.useState(false);
     const [holdSelectItemResponse, setHoldSelectItemResponse] = React.useState('');
     const [placingItemHold, setPlacingItemHold] = React.useState(false);

     const cancelResponseRef = React.useRef(null);
     const cancelHoldConfirmationRef = React.useRef(null);
     const cancelHoldItemSelectRef = React.useRef(null);

     // 2. Logic & Params
     let route = navigation.getParent()?.getState()?.routes || [];
     const editionsModalRoute = route.find(r => r.name === 'EditionsModal');
     const params = editionsModalRoute?.params || {};
     const { id, recordId, format, source, volumeInfo, prevRoute } = params;

     const { status, data, error, isFetching } = useQuery({
          queryKey: ['records', id, source, format, language, library.baseUrl],
          queryFn: () => getRecords(id, format, source, language, library.baseUrl),
          enabled: !!id && !!format && !!source,
     });

     // 3. Helper Functions
     const onResponseClose = () => setResponseIsOpen(false);
     const onHoldConfirmationClose = () => setHoldConfirmationIsOpen(false);
     const onHoldItemSelectClose = () => setHoldItemSelectIsOpen(false);

     let shouldPromptAlternateLibraryCard = false;
     let shouldShowAlternateLibraryCard = false;
     let useAlternateCardForCloudLibrary = false;
     let userHasAlternateLibraryCard = false;

     if (library.showAlternateLibraryCard === '1' || library.showAlternateLibraryCard === 1) {
          shouldShowAlternateLibraryCard = true;
     }

     if (library.useAlternateCardForCloudLibrary === '1' || library.useAlternateCardForCloudLibrary === 1) {
          useAlternateCardForCloudLibrary = true;
     }

     if (shouldShowAlternateLibraryCard && useAlternateCardForCloudLibrary && source === 'cloud_library') {
          shouldPromptAlternateLibraryCard = true;
     }

     if (user.alternateLibraryCard && user.alternateLibraryCard !== '') {
          if (library.alternateLibraryCardConfig?.showAlternateLibraryCardPassword === '1') {
               if (user.alternateLibraryCardPassword !== '') {
                    userHasAlternateLibraryCard = true;
               }
          } else {
               userHasAlternateLibraryCard = true;
          }
     }

     const handleNavigation = (action) => {
          if (prevRoute === 'DiscoveryScreen' || prevRoute === 'SearchResults' || prevRoute === 'HomeScreen') {
               if (action.includes('Checkouts')) {
                    setResponseIsOpen(false);
                    navigateStack('AccountScreenTab', 'MyCheckouts', {});
               } else {
                    setResponseIsOpen(false);
                    navigateStack('AccountScreenTab', 'MyHolds', {});
               }
          } else {
               if (action.includes('Checkouts')) {
                    setResponseIsOpen(false);
                    navigate('MyCheckouts', {});
               } else {
                    setResponseIsOpen(false);
                    navigate('MyHolds', {});
               }
          }
     };

     const decodeMessage = (string) => {
          return stripHTML(string);
     };

     // 4. Render
     if (isLoading) {
          return loadingSpinner();
     }

     const records = data?.records ? (Array.isArray(data.records) ? data.records : Object.values(data.records)) : [];

     return (
          <Box flex={1}>
               <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                    <Box p="$3">
                         {isFetching ? (
                              loadingSpinner()
                         ) : status === 'error' ? (
                              loadError('Error', '')
                         ) : records.length === 0 ? (
                              <Center p="$5">
                                   <Text>Edition information was not found</Text>
                              </Center>
                         ) : (
                              <VStack space="md">
                                   {records.map((record, index) => (
                                        <Edition
                                             key={record.id || index.toString()}
                                             records={record}
                                             id={id}
                                             format={format}
                                             volumeInfo={volumeInfo}
                                             prevRoute={prevRoute}
                                             setResponseIsOpen={setResponseIsOpen}
                                             responseIsOpen={responseIsOpen}
                                             onResponseClose={onResponseClose}
                                             cancelResponseRef={cancelResponseRef}
                                             response={response}
                                             setResponse={setResponse}
                                             setHoldConfirmationIsOpen={setHoldConfirmationIsOpen}
                                             holdConfirmationIsOpen={holdConfirmationIsOpen}
                                             onHoldConfirmationClose={onHoldConfirmationClose}
                                             cancelHoldConfirmationRef={cancelHoldConfirmationRef}
                                             holdConfirmationResponse={holdConfirmationResponse}
                                             setHoldConfirmationResponse={setHoldConfirmationResponse}
                                             setHoldItemSelectIsOpen={setHoldItemSelectIsOpen}
                                             holdItemSelectIsOpen={holdItemSelectIsOpen}
                                             onHoldItemSelectClose={onHoldItemSelectClose}
                                             cancelHoldItemSelectRef={cancelHoldItemSelectRef}
                                             holdSelectItemResponse={holdSelectItemResponse}
                                             setHoldSelectItemResponse={setHoldSelectItemResponse}
                                             userHasAlternateLibraryCard={userHasAlternateLibraryCard}
                                             shouldPromptAlternateLibraryCard={shouldPromptAlternateLibraryCard}
                                        />
                                   ))}
                              </VStack>
                         )}
                    </Box>
               </ScrollView>
               <Center>
                    <AlertDialog leastDestructiveRef={cancelResponseRef} isOpen={responseIsOpen} onClose={onResponseClose}>
                         <AlertDialogBackdrop />
                         <AlertDialogContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                              <AlertDialogHeader>
                                   <Heading color={textColor}>{response?.title}</Heading>
                              </AlertDialogHeader>
                              <AlertDialogBody>
                                   <Text color={textColor}>{response?.message}</Text>
                              </AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="sm">
                                        {response?.action ? (
                                             <Button onPress={() => handleNavigation(response.action)} variant="solid" bgColor={theme['colors']['primary']['500']}>
                                                  <ButtonText color={theme['colors']['primary']['500-text']}>{response.action}</ButtonText>
                                             </Button>
                                        ) : null}
                                        <Button variant="outline" borderColor={theme['colors']['primary']['500']} ref={cancelResponseRef} onPress={() => setResponseIsOpen(false)}>
                                             <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog leastDestructiveRef={cancelHoldConfirmationRef} isOpen={holdConfirmationIsOpen} onClose={onHoldConfirmationClose}>
                         <AlertDialogBackdrop />
                         <AlertDialogContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                              <AlertDialogHeader>
                                   <Heading color={textColor}>{holdConfirmationResponse?.title ? holdConfirmationResponse.title : 'Unknown Error'}</Heading>
                              </AlertDialogHeader>
                              <AlertDialogBody>
                                   <Text color={textColor}>{holdConfirmationResponse?.message ? decodeMessage(holdConfirmationResponse.message) : 'Unable to place hold for unknown error. Please contact the library.'}</Text>
                              </AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="md">
                                        <Button variant="link" onPress={() => setHoldConfirmationIsOpen(false)}>
                                             <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                        </Button>
                                        <Button
                                             isLoading={confirmingHold}
                                             isLoadingText="Placing hold..."
                                             variant="solid"
                                             bgColor={theme['colors']['primary']['500']}
                                             onPress={async () => {
                                                  setConfirmingHold(true);
                                                  await confirmHold(holdConfirmationResponse.recordId, holdConfirmationResponse.confirmationId, language, library.baseUrl).then(async (result) => {
                                                       setResponse(result);
                                                       queryClient.invalidateQueries({ queryKey: ['holds', library.baseUrl, language] });
                                                       await refreshProfile(library.baseUrl).then((data) => {
                                                            if(data.ok) {
                                                                 updateUser(data.data.result.profile);
                                                            } else {
                                                                 logWarnMessage('Could not refresh profile after placing hold from volume selection.');
                                                                 logDebugMessage(data);
                                                                 getErrorMessage(data.code ?? 0, data.problem);
                                                            }
                                                       });

                                                       setHoldConfirmationIsOpen(false);
                                                       setConfirmingHold(false);
                                                       if (result) {
                                                            setResponseIsOpen(true);
                                                       }
                                                  });
                                             }}>
                                             <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'confirm_place_hold')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog leastDestructiveRef={cancelHoldItemSelectRef} isOpen={holdItemSelectIsOpen} onClose={onHoldItemSelectClose}>
                         <AlertDialogBackdrop />
                         <AlertDialogContent bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}>
                              <AlertDialogHeader>
                                   <Heading color={textColor}>{holdSelectItemResponse?.title ? holdSelectItemResponse.title : 'Unknown Error'}</Heading>
                              </AlertDialogHeader>
                              <AlertDialogBody>
                                   <Text color={textColor}>{holdSelectItemResponse?.message ? decodeMessage(holdSelectItemResponse.message) : 'Unable to place hold for unknown error. Please contact the library.'}</Text>
                                   {holdSelectItemResponse?.items ? (
                                        <Select name="itemForHold" minWidth={200} accessibilityLabel={getTermFromDictionary(language, 'select_item')} mt="$1" mb="$2" onValueChange={(itemValue) => setSelectedItem(itemValue)}>
                                             <SelectTrigger>
                                                  <SelectInput placeholder="Select option" color={textColor} />
                                                  <SelectIcon mr="$3">
                                                       <Icon as={ChevronDownIcon} color={textColor} />
                                                  </SelectIcon>
                                             </SelectTrigger>
                                             <SelectPortal useRNModal={true}>
                                                  <SelectBackdrop />
                                                  <SelectContent
                                                       bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
                                                       pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                                                  >
                                                       <SelectDragIndicatorWrapper>
                                                            <SelectDragIndicator />
                                                       </SelectDragIndicatorWrapper>
                                                       <SelectScrollView>
                                                            {(holdSelectItemResponse.items || []).map((item, index) => {
                                                                 let itemLabel = "";
                                                                 if (item.location) {
                                                                      itemLabel = item.location + " - ";
                                                                 }
                                                                 itemLabel += item.callNumber;
                                                                 if (item.status) {
                                                                      itemLabel += " - " + item.status;
                                                                 }
                                                                 return <SelectItem label={item.callNumber} value={item.itemNumber} key={index} sx={{ _text: { color: textColor } }} />;
                                                            })}
                                                       </SelectScrollView>
                                                  </SelectContent>
                                             </SelectPortal>
                                        </Select>
                                   ) : null}
                              </AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="md">
                                        <Button variant="link" onPress={() => setHoldItemSelectIsOpen(false)}>
                                             <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                                        </Button>
                                        <Button
                                             isLoading={placingItemHold}
                                             isLoadingText="Placing hold..."
                                             variant="solid"
                                             bgColor={theme['colors']['primary']['500']}
                                             onPress={async () => {
                                                  setPlacingItemHold(true);
                                                  await placeHold(library.baseUrl, selectedItem, 'ils', holdSelectItemResponse.patronId, holdSelectItemResponse.pickupLocation, holdSelectItemResponse.sublocation, false, '', 'item', null, null, null, holdSelectItemResponse.bibId, language).then(async (result) => {
                                                       setResponse(result);
                                                       queryClient.invalidateQueries({ queryKey: ['holds', holdSelectItemResponse.patronId, library.baseUrl, language] });
                                                       queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
                                                       setHoldItemSelectIsOpen(false);
                                                       setPlacingItemHold(false);
                                                       if (result) {
                                                            setResponseIsOpen(true);
                                                       }
                                                  });
                                             }}>
                                             <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'place_hold')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
               </Center>
          </Box>
     );
};

const Edition = (props) => {
     // 1. Hooks
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     // 2. Props
     const {
          response,
          setResponse,
          responseIsOpen,
          setResponseIsOpen,
          onResponseClose,
          cancelResponseRef,
          holdConfirmationResponse,
          setHoldConfirmationResponse,
          holdConfirmationIsOpen,
          setHoldConfirmationIsOpen,
          onHoldConfirmationClose,
          cancelHoldConfirmationRef,
          holdSelectItemResponse,
          setHoldSelectItemResponse,
          holdItemSelectIsOpen,
          setHoldItemSelectIsOpen,
          onHoldItemSelectClose,
          cancelHoldItemSelectRef,
          userHasAlternateLibraryCard,
          shouldPromptAlternateLibraryCard
     } = props;

     const prevRoute = props.prevRoute;
     const records = props.records;
     const id = props.id;
     const format = props.format;
     const source = records.source;
     const recordId = records.recordId;
     const fullRecordId = records.id;
     const volumeInfo = props.volumeInfo;
     const closedCaptioned = records.closedCaptioned;
     const title = records.title ?? null;
     const author = records.author ?? null;
     const publisher = records.publisher ?? null;
     const isbn = records.isbn ?? null;
     const oclcNumber = records.oclcNumber ?? null;
     const holdTypeForFormat = records.holdType ?? 'default';
     const variationId = records.variationId ?? null;
     const status = records.statusIndicator || {};
     const actions = Array.isArray(records.actions) ? records.actions : Object.values(records.actions || {});

     const handleOnPress = () => {
          navigate('WhereIsIt', { id: id, format: format, prevRoute: prevRoute, type: 'record', recordId: fullRecordId, numHolds: status.numHolds, source });
     };

     const statusIndicator = getStatusIndicator(status, language);

     return (
          <Box mt="$0" mb="$0" p="$3" borderBottomWidth="$1" borderColor="$warmGray200">
               <HStack justifyContent="space-between" alignItems="center" space="sm" flex={1}>
                    <VStack space="sm" maxW="40%" flex={1} justifyContent="center">
                         <Text size="xs" color={textColor}>
                              <Text bold size="xs" color={textColor}>
                                   {records.publicationDate}
                              </Text>{' '}
                              {records.publisher}. {records.edition} {records.physical} {closedCaptioned === '1' ? <Icon as={MaterialIcons} name="closed-caption" size="sm" color={textColor} /> : null}
                         </Text>
                         <VStack space="sm">
                              <Center>
                                   <Badge action={statusIndicator.indicator} borderRadius="$sm" variant="solid">
                                        <BadgeText textTransform="none">{statusIndicator.label}</BadgeText>
                                   </Badge>
                              </Center>
                              {records.source === 'ils' || status.isEContent ? (
                                   <Button variant="link" size="xs" onPress={handleOnPress}>
                                        <ButtonIcon as={MaterialIcons} name="location-pin" size="xs" color={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']} />
                                        <ButtonText color={colorMode === 'light' ? theme['colors']['coolGray']['700'] : theme['colors']['warmGray']['100']}>{getTermFromDictionary(language, 'where_is_it')}</ButtonText>
                                   </Button>
                              ) : null}
                         </VStack>
                    </VStack>
                    <ButtonGroup flexDirection={actions.length > 1 ? 'column' : 'row'} width="50%" justifyContent="center" alignItems="stretch" space="sm">
                         {actions.map((item, index) => (
                              <ActionButton
                                   key={index}
                                   language={language}
                                   groupedWorkId={id}
                                   recordId={recordId}
                                   recordSource={source}
                                   fullRecordId={fullRecordId}
                                   variationId={variationId}
                                   holdTypeForFormat={holdTypeForFormat}
                                   title={title}
                                   author={author}
                                   publisher={publisher}
                                   isbn={isbn}
                                   oclcNumber={oclcNumber}
                                   actions={item}
                                   volumeInfo={volumeInfo}
                                   prevRoute={prevRoute}
                                   setResponseIsOpen={setResponseIsOpen}
                                   responseIsOpen={responseIsOpen}
                                   onResponseClose={onResponseClose}
                                   cancelResponseRef={cancelResponseRef}
                                   response={response}
                                   setResponse={setResponse}
                                   setHoldConfirmationIsOpen={setHoldConfirmationIsOpen}
                                   holdConfirmationIsOpen={holdConfirmationIsOpen}
                                   onHoldConfirmationClose={onHoldConfirmationClose}
                                   cancelHoldConfirmationRef={cancelHoldConfirmationRef}
                                   holdConfirmationResponse={holdConfirmationResponse}
                                   setHoldConfirmationResponse={setHoldConfirmationResponse}
                                   setHoldItemSelectIsOpen={setHoldItemSelectIsOpen}
                                   holdItemSelectIsOpen={holdItemSelectIsOpen}
                                   onHoldItemSelectClose={onHoldItemSelectClose}
                                   cancelHoldItemSelectRef={cancelHoldItemSelectRef}
                                   holdSelectItemResponse={holdSelectItemResponse}
                                   setHoldSelectItemResponse={setHoldSelectItemResponse}
                                   userHasAlternateLibraryCard={userHasAlternateLibraryCard}
                                   shouldPromptAlternateLibraryCard={shouldPromptAlternateLibraryCard}
                              />
                         ))}
                    </ButtonGroup>
               </HStack>
          </Box>
     );
};
