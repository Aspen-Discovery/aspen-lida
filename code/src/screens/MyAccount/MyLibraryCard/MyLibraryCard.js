import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Brightness from 'expo-brightness';
import * as ScreenOrientation from 'expo-screen-orientation';
import _ from 'lodash';
import moment from 'moment';
import { Box, Button, ButtonText, ButtonIcon, Center, HStack, VStack, Icon, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Text, Heading, ModalBackdrop, CloseIcon, ModalCloseButton, Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@gluestack-ui/themed';
import React from 'react';
import { Dimensions } from 'react-native';
import Barcode from 'react-native-barcode-expo';
import { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

// custom components and helper files
import { PermissionsPrompt } from '../../../components/PermissionsPrompt';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary, getTranslationsWithValues } from '../../../translations/TranslationService';
import { getLinkedAccounts, updateScreenBrightnessStatus } from '../../../util/api/user';
import { formatLinkedAccounts } from '../../../util/api/userHelper';

import { formatDiscoveryVersion } from '../../../helpers/helpers';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';

export const MyLibraryCard = () => {
     const queryClient = useQueryClient();
     const navigation = useNavigation();
     const [shouldRequestPermissions, setShouldRequestPermissions] = React.useState(false);
     const [previousBrightness, setPreviousBrightness] = React.useState();
     const [brightnessMode, setBrightnessMode] = React.useState(1);
     const [isLandscape, setIsLandscape] = React.useState(false);
     const [showDrawer, setShowDrawer] = React.useState(false);
     const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
     const [showBarcodeModal, setShowBarcodeModal] = React.useState(false);
     const [selectedCard, setSelectedCard] = React.useState(null);
     const progressValue = useSharedValue(0);
     const carouselRef = React.useRef();
     const hasOpenModalRef = React.useRef(false);
     const { user, accounts, updateLinkedAccounts, cards, updateLibraryCards} = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const { theme } = React.useContext(ThemeContext);

     let autoRotate = library.generalSettings?.autoRotateCard ?? 0;

     useQuery(['linked_accounts', user, cards, library.baseUrl, language], () => getLinkedAccounts(user, cards, library.barcodeStyle, library.baseUrl, language), {
          initialData: accounts,
          onSuccess: (data) => {
               if(data.ok) {
                    const linkedAccounts = formatLinkedAccounts(user, cards ?? [], library.barcodeStyle, data.data.result.linkedAccounts);
                    updateLinkedAccounts(linkedAccounts.accounts);
                    updateLibraryCards(linkedAccounts.cards);
               } else {
                    logDebugMessage("Error fetching linked accounts");
                    logDebugMessage(data);
                    getErrorMessage(data.code ?? 0, data.problem);
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching linked accounts");
               logErrorMessage(error);
          },
          placeholderData: [],
     });

     const updateStatus = async () => {
          await updateScreenBrightnessStatus(false, library.baseUrl, language);
          queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
     };

     React.useEffect(() => {
          const updateAccounts = navigation.addListener('focus', async () => {
               queryClient.invalidateQueries({ queryKey: ['linked_accounts', library.baseUrl, language] });
          });
          const brightenScreen = navigation.addListener('focus', async () => {
               const { status } = await Brightness.getPermissionsAsync();
               if (status === 'undetermined') {
                    if (!_.isUndefined(user.shouldAskBrightness) && (user.shouldAskBrightness === 1 || user.shouldAskBrightness === '1')) {
                         setShouldRequestPermissions(true);
                    }
               } else {
                    if (status === 'granted') {
                         await Brightness.getBrightnessAsync().then((level) => {
                              console.log('Storing previous screen brightness for later: ' + level);
                              setPreviousBrightness(level);
                         });
                         await Brightness.getSystemBrightnessModeAsync().then((mode) => {
                              console.log('Storing system brightness mode for later: ' + mode);
                              setBrightnessMode(mode);
                         });
                         console.log('Updating screen brightness');
                         Brightness.setSystemBrightnessAsync(1);
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                         setShouldRequestPermissions(false);
                    } else {
                         // we were denied permissions
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                         setShouldRequestPermissions(false);
                         console.log('Unable to update screen brightness');
                    }
               }
          });
          const updateOrientation = navigation.addListener('focus', async () => {
               if (autoRotate === '1' || autoRotate === 1) {
                    await ScreenOrientation.unlockAsync();
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
                    setIsLandscape(true);
               } else {
                    const result = await ScreenOrientation.getOrientationAsync();
                    const isCurrentlyLandscape = result === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                                                 result === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
                    setIsLandscape(isCurrentlyLandscape);
               }
          });
          const changeOrientation = ScreenOrientation.addOrientationChangeListener(({ orientationInfo, orientationLock }) => {
               switch (orientationInfo.orientation) {
                    case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
                    case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
                    case ScreenOrientation.Orientation.LANDSCAPE:
                         console.log('Screen orientation changed to landscape');
                         setIsLandscape(true);
                         break;
                    default:
                         console.log('Screen orientation changed to portrait');
                         setIsLandscape(false);
                         break;
               }
          });
          return () => {
               updateAccounts();
               brightenScreen();
               updateOrientation();
               changeOrientation.remove();
          };
     }, [navigation, autoRotate]);

     React.useEffect(() => {
          navigation.addListener('blur', () => {
               (async () => {
                    const { status } = await Brightness.getPermissionsAsync();
                    if (status === 'granted' && previousBrightness) {
                         console.log('Restoring previous screen brightness');
                         Brightness.setSystemBrightnessAsync(previousBrightness);
                         console.log('Restoring system brightness');
                         Brightness.restoreSystemBrightnessAsync();
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                    }
                    if (status === 'granted' && brightnessMode) {
                         console.log('Restoring brightness mode');
                         let mode = 'BrightnessMode.MANUAL';
                         if (brightnessMode === 1) {
                              mode = 'BrightnessMode.AUTOMATIC';
                         }
                         Brightness.setSystemBrightnessModeAsync(brightnessMode);
                         await updateScreenBrightnessStatus(false, library.baseUrl, language);
                    }
                    // Only force rotation back to portrait if autoRotate was enabled.
                    if (isLandscape && (autoRotate === '1' || autoRotate === 1)) {
                         await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                         await ScreenOrientation.unlockAsync();
                    } else if (isLandscape) {
                         await ScreenOrientation.unlockAsync();
                    }
               })();
          });
          return () => {};
     }, [navigation, previousBrightness, isLandscape, autoRotate]);

     if (shouldRequestPermissions) {
          return <PermissionsPrompt promptTitle="permissions_screen_brightness_title" promptBody="permissions_screen_brightness_body" setShouldRequestPermissions={setShouldRequestPermissions} updateStatus={updateStatus} />;
     }

     const version = formatDiscoveryVersion(library.discoveryVersion);
     let shouldShowAlternateLibraryCard = false;
     if (typeof library.showAlternateLibraryCard !== 'undefined') {
          shouldShowAlternateLibraryCard = library.showAlternateLibraryCard;
     }
     if (version >= '24.09.00' && (shouldShowAlternateLibraryCard === '1' || shouldShowAlternateLibraryCard === 1)) {
          shouldShowAlternateLibraryCard = true;
     } else {
          shouldShowAlternateLibraryCard = false;
     }

     const openBarcodeModal = (card) => {
          setSelectedCard(card);
          setShowBarcodeModal(true);
          if (hasOpenModalRef) {
               hasOpenModalRef.current = true;
          }
     };

     const closeBarcodeModal = async () => {
          setShowBarcodeModal(false);
          setSelectedCard(null);
          if (hasOpenModalRef) {
               hasOpenModalRef.current = false;
          }
          await ScreenOrientation.unlockAsync();
     };

     const { textColor, colorMode } = React.useContext(ThemeContext);
     const drawerBg = colorMode === 'light' ? "$warmGray50" : "$coolGray800";

     return (
          <>
               <VStack flex={1} justifyContent={!isLandscape ? "space-between" : "flex-start"}>
                    <Box flex={1} justifyContent={!isLandscape ? "center" : "flex-start"}>
                         <CardCarousel
                              cards={cards}
                              orientation={isLandscape}
                              currentIndex={currentCardIndex}
                              setCurrentIndex={setCurrentCardIndex}
                              progressValue={progressValue}
                              carouselRef={carouselRef}
                              openBarcodeModal={openBarcodeModal}
                              hasOpenModalRef={hasOpenModalRef}
                         />
                    </Box>

                    {isLandscape && cards.length > 1 && (
                         <Box position="absolute" bottom={0} left={0} right={0} alignItems="center" pb="$2">
                              <Button variant="link" onPress={() => setShowDrawer(true)} size="sm">
                                   <ButtonIcon as={MaterialCommunityIcons} name="chevron-up" size="xl" color={textColor} />
                              </Button>
                         </Box>
                    )}

                    {!isLandscape && shouldShowAlternateLibraryCard && (
                         <Box pb="$5">
                              <Center>
                                   <Button
                                        size="md"
                                        bgColor={theme['tokens']['colors']['secondary']['500']}
                                        onPress={() => {
                                             navigateStack('LibraryCardTab', 'MyAlternateLibraryCard', {
                                                  prevRoute: 'MyLibraryCard',
                                                  hasPendingChanges: false,
                                             });
                                        }}>
                                        <ButtonText color={theme['tokens']['colors']['secondary']['500-text']}>{getTermFromDictionary(language, 'manage_alternate_library_card')}</ButtonText>
                                   </Button>
                              </Center>
                         </Box>
                    )}
               </VStack>

                    <Actionsheet isOpen={showDrawer} onClose={() => setShowDrawer(false)}>
                         <ActionsheetBackdrop />
                         <ActionsheetContent bgColor={drawerBg}>
                              <ActionsheetDragIndicatorWrapper>
                                   <ActionsheetDragIndicator bgColor={textColor} />
                              </ActionsheetDragIndicatorWrapper>
                              <VStack space="md" w="$full" p="$4">
                                   <Box>
                                        <Text fontSize="$sm" color={textColor} mb="$2">{getTermFromDictionary(language, 'select_card')}</Text>
                                        <Box flexDirection="row" flexWrap="wrap" justifyContent="center">
                                             {cards.map((card, index) => (
                                                  <Button
                                                       key={index}
                                                       size="sm"
                                                       mr="$1"
                                                       mb="$1"
                                                       bgColor={index === currentCardIndex ? theme['tokens']['colors']['tertiary']['500'] : '$none'}
                                                       borderColor={index === currentCardIndex ? 'transparent' : theme['tokens']['colors']['tertiary']['500']}
                                                       borderWidth={index === currentCardIndex ? 0 : 1}
                                                       variant={index === currentCardIndex ? 'solid' : 'outline'}
                                                       onPress={() => {
                                                            carouselRef.current?.scrollTo({ index: index, animated: false });
                                                            setCurrentCardIndex(index);
                                                            setShowDrawer(false);
                                                       }}>
                                                       <ButtonText color={index === currentCardIndex ? theme['tokens']['colors']['tertiary']['500-text'] : textColor}>
                                                            {card.displayName}
                                                       </ButtonText>
                                                  </Button>
                                             ))}
                                        </Box>
                                   </Box>
                                   {shouldShowAlternateLibraryCard && (
                                        <Box mt="$2">
                                             <Button
                                                  size="md"
                                                  bgColor={theme['tokens']['colors']['secondary']['500']}
                                                  onPress={() => {
                                                       setShowDrawer(false);
                                                       navigateStack('LibraryCardTab', 'MyAlternateLibraryCard', {
                                                            prevRoute: 'MyLibraryCard',
                                                            hasPendingChanges: false,
                                                       });
                                                  }}>
                                                  <ButtonText color={theme['tokens']['colors']['secondary']['500-text']}>
                                                       {getTermFromDictionary(language, 'manage_alternate_library_card')}
                                                  </ButtonText>
                                             </Button>
                                        </Box>
                                   )}
                              </VStack>
                         </ActionsheetContent>
                    </Actionsheet>

               {selectedCard && <BarcodeModal card={selectedCard} showModal={showBarcodeModal} closeModal={closeBarcodeModal} language={language} />}
          </>
     );
};

const CreateLibraryCard = (data) => {
     const card = data.card ?? [];
     const { numCards, hasOpenModalRef, openBarcodeModal } = data ?? 0;

     const [expirationText, setExpirationText] = React.useState('');
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);

     const { library } = React.useContext(LibrarySystemContext);
     const language = data.language || React.useContext(LanguageContext).language;

     let barcodeStyle;
     if (!_.isUndefined(card.barcodeStyle) && !_.isNull(card.barcodeStyle)) {
          barcodeStyle = _.toString(card.barcodeStyle);
     } else {
          barcodeStyle = _.toString(library.barcodeStyle);
     }

     let barcodeValue = 'UNKNOWN';
     if (!_.isUndefined(card.ils_barcode)) {
          barcodeValue = card.ils_barcode;
     } else if (!_.isUndefined(card.cat_username)) {
          barcodeValue = card.cat_username;
     }

     let expirationDate = null;
     if (!_.isUndefined(card.expires)
          && !_.isNull(card.expires)
          && (card.expires !== "")
          && (card.expires !== "Dec 31, 1969")) {

          if (_.isString(card.expires)) {
               expirationDate = moment(card.expires, 'MMM D, YYYY');
          }

          React.useEffect(() => {
               async function fetchTranslations() {
                    console.log(card.expires);
                    await getTranslationsWithValues('library_card_expires_on', card.expires, language, library.baseUrl).then((result) => {
                         setExpirationText(result);
                    });
               }

               fetchTranslations();
          }, [language]);
     }

     let cardHasExpired = 0;
     if (!_.isUndefined(card.expired) && !_.isNull(card.expired) && card.expired !== 0 && card.expired !== '0') {
          cardHasExpired = card.expired;
     }

     let neverExpires = false;
     if (cardHasExpired === 0 && !_.isNull(expirationDate)) {
          const now = moment();
          const expiration = moment(expirationDate);
          const hasExpired = moment(expiration).isBefore(now);
          if (hasExpired) {
               neverExpires = true;
          }
     }

     let showExpirationDate = true;
     if (library.showCardExpiration === '0' || library.showCardExpiration === 0) {
          showExpirationDate = false;
     }

     let icon = library.favicon;
     if (card.homeLocation === library.displayName && library.logoApp) {
          icon = library.logoApp;
     }

     const handleBarcodeError = () => {
          barcodeStyle = 'INVALID';
     };

     if (barcodeValue === 'UNKNOWN' || _.isNull(barcodeValue) || _.isNull(barcodeStyle) || _.isEmpty(barcodeValue) || _.isEmpty(barcodeStyle) || barcodeStyle === 'INVALID' || barcodeStyle === 'none') {
          return (
               <VStack maxW="90%" px="$8" py="$5" borderRadius="$lg">
                    <Center>
                         <HStack>
                              {icon ? <Image source={{ uri: icon }} fallbackSource={require('../../../themes/default/aspenLogo.png')} alt={getTermFromDictionary(language, 'library_card')} /> : null}
                              <Text bold ml="$3" mt="$2" fontSize="$lg">
                                   {card.homeLocation}
                              </Text>
                         </HStack>
                    </Center>
                    <Center pt="$8">
                         <Text pb="$2">
                              {card.displayName}
                         </Text>
                         <Text bold fontSize="$xl">
                              {barcodeValue}
                         </Text>
                         {showExpirationDate && expirationDate && !neverExpires ? (
                              <Text fontSize="$sm">
                                   {expirationText}
                              </Text>
                         ) : null}
                    </Center>
               </VStack>
          );
     }

     let cardBg = colorMode === 'light' ? "$warmGray50" : "$coolGray700";

     return (
          <VStack bg={cardBg} px="$8" py="$5" borderRadius="$lg" shadow="$1">
               {numCards > 1 ? (
                    <>
                         <Center>
                              <HStack>
                                   {icon ? <Image source={{ uri: icon }} fallbackSource={require('../../../themes/default/aspenLogo.png')} w={42} h={42} alt={getTermFromDictionary(language, 'library_card')} /> : null}
                                   <Text bold ml="$3" mt="$2" fontSize="$lg" color={textColor}>
                                        {card.homeLocation}
                                   </Text>
                              </HStack>
                         </Center>
                         <Center pt="$2">
                              <Text fontSize="$md" color={textColor}>
                                   {card.displayName}
                              </Text>
                         </Center>
                    </>
               ) : null}
               <Center>
                    {showExpirationDate && expirationDate && !neverExpires && numCards > 1 ? <Text color={textColor}>{expirationText}</Text> : null}
                    {numCards > 1 ? (
                         <Button variant="link" onPress={() => openBarcodeModal && openBarcodeModal(card)}>
                              <ButtonIcon color="$primary500" as={MaterialCommunityIcons} name="barcode-scan" size="lg" mr="$1" />
                              <ButtonText color="$primary500">{getTermFromDictionary(language, 'open_barcode')}</ButtonText>
                         </Button>
                    ) : (
                         <VStack alignItems="center" space="sm">
                              <Box bg={"$warmGray200"}
                                   p="$3"
                                   borderRadius="$sm">
                                   <Barcode
                                        value={barcodeValue}
                                        format={barcodeStyle}
                                        background={"$warmGray200"}
                                        onError={handleBarcodeError}
                                   />
                              </Box>
                              <Text color={textColor} fontSize="$xl" textAlign="center">{barcodeValue}</Text>
                         </VStack>
                    )}
                    {showExpirationDate && expirationDate && !neverExpires && numCards === 1 ? (
                         <Text color={textColor} fontSize="$sm" pt="$2">
                              {expirationText}
                         </Text>
                    ) : null}
               </Center>
          </VStack>
     );
};

const CardCarousel = (data) => {
     const { theme, textColor } = React.useContext(ThemeContext);
     const { language } = React.useContext(LanguageContext);
     const [internalIndex, setInternalIndex] = React.useState(0);
     const cards = _.sortBy(data.cards, ['key']);
     const isVertical = data.orientation;
     const toggleOrientation = data.toggleOrientation;
     const hasOpenModalRef = data.hasOpenModalRef;
     const openBarcodeModal = data.openBarcodeModal;
     const screenWidth = Dimensions.get('window').width;

     // Use external state if provided (for drawer), otherwise use internal state.
     const currentIndex = data.currentIndex !== undefined ? data.currentIndex : internalIndex;
     const setCurrentIndex = data.setCurrentIndex || setInternalIndex;
     const progressValue = data.progressValue || useSharedValue(0);
     const ref = data.carouselRef || React.useRef();

     let baseOptions = {
          vertical: false,
          width: screenWidth,
          height: screenWidth * 0.9,
     };

     if (isVertical) {
          baseOptions = {
               vertical: true,
               width: screenWidth * 0.5,
               height: screenWidth * 0.6,
          };
     }

     const PaginationItem = (props) => {
          const { animValue, index, length, card, isRotate } = props;
          const width = 100;

          const animStyle = useAnimatedStyle(() => {
               let inputRange = [index - 1, index, index + 1];
               let outputRange = [-width, 0, width];

               if (index === 0 && animValue?.value > length - 1) {
                    inputRange = [length - 1, length, length + 1];
                    outputRange = [-width, 0, width];
               }

               return {
                    transform: [
                         {
                              translateX: interpolate(animValue?.value, inputRange, outputRange, Extrapolate.CLAMP),
                         },
                    ],
               };
          }, [animValue, index, length]);

          return (
               <Button
                    size="sm"
                    mr="$1"
                    mb="$1"
                    bgColor={index === currentIndex ? theme['tokens']['colors']['tertiary']['500'] : '$none'}
                    borderColor={index === currentIndex ? 'transparent' : theme['tokens']['colors']['tertiary']['500']}
                    borderWidth={index === currentIndex ? 0 : 1}
                    variant={index === currentIndex ? 'solid' : 'outline'}
                    onPress={() => {
                         setCurrentIndex(index);
                         ref.current?.scrollTo({
                              index: index,
                              animated: false,
                         });
                    }}>
                    <ButtonText color={index === currentIndex ? theme['tokens']['colors']['tertiary']['500-text'] : textColor}>{card.displayName}</ButtonText>
               </Button>
          );
     };

     if (_.size(cards) === 1) {
          const card = cards[0];
          return (
               <Box
                    p="$5"
                    flex={1}
                    alignItems="center"
                    style={{
                         transform: [{ scale: 0.9 }],
                    }}>
                    <CreateLibraryCard key={0} card={card} numCards={_.size(cards)} language={language} hasOpenModalRef={hasOpenModalRef} openBarcodeModal={openBarcodeModal} />
               </Box>
          );
     }

     return (
          <Box alignItems="center" px="$3">
               <Carousel
                    {...baseOptions}
                    ref={ref}
                    defaultIndex={currentIndex}
                    pagingEnabled={true}
                    snapEnabled={true}
                    autoPlay={false}
                    mode="parallax"
                    onProgressChange={(_, absoluteProgress) => {
                         progressValue.value = absoluteProgress;
                         const totalCards = cards.length;
                         let newIndex = Math.round(absoluteProgress) % totalCards;
                         if (newIndex < 0) newIndex = totalCards + newIndex;
                         if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalCards) {
                              setCurrentIndex(newIndex);
                         }
                    }}
                    onSnapToItem={(index) => setCurrentIndex(index)}
                    modeConfig={{
                         parallaxScrollingScale: 0.9,
                         parallaxScrollingOffset: 50,
                    }}
                    data={cards}
                    renderItem={({ item, index }) => <CreateLibraryCard key={index} card={item} numCards={_.size(cards)} language={language} hasOpenModalRef={hasOpenModalRef} openBarcodeModal={openBarcodeModal} />}
               />
               {!!progressValue && (
                    <Box flexDirection="row" flexWrap="wrap" alignContent="center" alignSelf="center" maxWidth="100%" justifyContent="center">
                         {cards.map((card, index) => {
                              return <PaginationItem card={card} animValue={progressValue} index={index} key={index} isRotate={isVertical} length={cards.length} />;
                         })}
                    </Box>
               )}
          </Box>
     );
};

const BarcodeModal = ({ card, showModal, closeModal, language }) => {
     const { theme } = React.useContext(ThemeContext);
     const { library } = React.useContext(LibrarySystemContext);
     const [orientation, setOrientation] = React.useState('portrait');
     const [screenDimensions, setScreenDimensions] = React.useState(Dimensions.get('window'));
     const [manuallyRotated, setManuallyRotated] = React.useState(false);
     const [showRotateWarning, setShowRotateWarning] = React.useState(false);
     const barcodeWidthRef = React.useRef(null);

     let barcodeStyle;
     if (!_.isUndefined(card.barcodeStyle) && !_.isNull(card.barcodeStyle)) {
          barcodeStyle = _.toString(card.barcodeStyle);
     } else {
          barcodeStyle = _.toString(library.barcodeStyle);
     }

     let barcodeValue = 'UNKNOWN';
     if (!_.isUndefined(card.ils_barcode)) {
          barcodeValue = card.ils_barcode;
     } else if (!_.isUndefined(card.cat_username)) {
          barcodeValue = card.cat_username;
     }

     const handleBarcodeError = () => {
          barcodeStyle = 'INVALID';
     };

     React.useEffect(() => {
          const subscription = Dimensions.addEventListener('change', ({ window }) => {
               if (showModal) {
                    setScreenDimensions(window);
                    const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
                    setOrientation(newOrientation);

                    if (barcodeWidthRef.current) {
                         const shouldShowWarning = evaluateBarcode(barcodeWidthRef.current, newOrientation, window);
                         setShowRotateWarning(shouldShowWarning);
                    }
               }
          });

          return () => subscription?.remove();
     }, [showModal]);

     React.useEffect(() => {
          if (showModal) {
               setShowRotateWarning(false);
               barcodeWidthRef.current = null;
               setManuallyRotated(false);
          }
     }, [showModal]);

     const isPortrait = orientation === 'portrait';

     const evaluateBarcode = (width, currentOrientation, dimensions) => {
          const modalPadding = 32; // ModalBody p="$4" (16px * 2 sides)
          const centerPadding = 16; // Center p="$2" (8px * 2 sides)
          const modalMargins = 32; // Modal itself has margins from screen edges
          const edgeBuffer = 16; // Small buffer from modal content edges

          const availableWidth = dimensions.width - modalPadding - centerPadding - modalMargins - edgeBuffer;
          const isTooWide = width > availableWidth;
          const shouldShowWarning = isTooWide && currentOrientation === 'portrait';

          return shouldShowWarning;
     };

     const rotateToLandscape = async () => {
          setManuallyRotated(true);
          await ScreenOrientation.unlockAsync();
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
     };

     const rotateToPortrait = async () => {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          setManuallyRotated(false);
     };

     const onBarcodeLayout = (event) => {
          const { width } = event.nativeEvent.layout;
          barcodeWidthRef.current = width;
          // Only evaluate if this is the initial measurement; let orientation handler deal with changes.
          if (!showRotateWarning || orientation === 'portrait') {
               const shouldShowWarning = evaluateBarcode(width, orientation, screenDimensions);
               setShowRotateWarning(shouldShowWarning);
          }
     };

     return (
          <Modal isOpen={showModal} onClose={closeModal} size="full">
                    <ModalBackdrop sx={{ opacity: 0.85 }} />
                    <ModalContent bgColor="white">
                         <ModalBody style={{margin: 20}} bgColor="white" p="$4">
                              {/* Always render barcode to measure it, but hide if showing warning. */}
                              <Box style={{ opacity: showRotateWarning ? 0 : 1, position: showRotateWarning ? 'absolute' : 'relative' }}>
                                   <Center p="$2">
                                        <Box
                                             bg={"$warmGray200"}
                                             p="$3"
                                             borderRadius="$sm"
                                             onLayout={onBarcodeLayout}>
                                             <Barcode
                                                  value={barcodeValue}
                                                  format={barcodeStyle}
                                                  onError={handleBarcodeError}
                                                  background={"$warmGray200"}
                                             />
                                        </Box>
                                   </Center>
                              </Box>

                              {showRotateWarning && (
                                   <VStack space="md" alignItems="center" p="$4">
                                        <Text fontSize="$lg" textAlign="center" color="black">
                                             {getTermFromDictionary(language, 'rotate_device_for_barcode')}
                                        </Text>
                                        <Button
                                             size="md"
                                             bgColor="$primary500"
                                             onPress={rotateToLandscape}
                                             mt="$2">
                                             <ButtonIcon as={MaterialCommunityIcons} name="phone-rotate-landscape" size="sm" mr="$2" />
                                             <ButtonText color="$textLight200">
                                                  {getTermFromDictionary(language, 'rotate_to_landscape') || 'Rotate to Landscape'}
                                             </ButtonText>
                                        </Button>
                                   </VStack>
                              )}

                              {!showRotateWarning && !isPortrait && manuallyRotated && (
                                   <Center mt="$2" mb="$2">
                                        <Button
                                             size="md"
                                             bgColor="$primary500"
                                             onPress={rotateToPortrait}>
                                             <ButtonIcon as={MaterialCommunityIcons} name="phone-rotate-portrait" size="sm" mr="$2" />
                                             <ButtonText color="$textLight200">
                                                  {getTermFromDictionary(language, 'rotate_to_portrait') || 'Rotate to Portrait'}
                                             </ButtonText>
                                        </Button>
                                   </Center>
                              )}

                              <Center mt="$2">
                                   <Text fontSize="$xl" color="black">{barcodeValue}</Text>
                              </Center>
                         </ModalBody>
                    </ModalContent>
               </Modal>
     );
};
