import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import { Image } from 'expo-image';
import _ from 'lodash';
import { Actionsheet, ActionsheetItem, ActionsheetBackdrop, ActionsheetContent, ActionsheetItemText, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator, Box, Button, ButtonText, Center, Checkbox, CheckboxIndicator, CheckboxIcon, CheckIcon, HStack, Icon, Pressable, ActionsheetIcon, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { popAlert } from '../../../components/loadError';
import { HoldsContext, LanguageContext, LibrarySystemContext, UserContext, ThemeContext } from '../../../context/initialContext';
import { getAuthor, getBadge, getCleanTitle, getExpirationDate, getFormat, getOnHoldFor, getPickupLocation, getPosition, getOutOfHoldGroupMessage, getTitle, getCallNumber, getVolume, getType, getCollectionName } from '../../../helpers/item';
import { navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { cancelHold, cancelHolds, freezeHold, freezeHolds, thawHold, thawHolds } from '../../../util/api/user';
import { formatPickupLocations } from '../../../util/api/userHelper';
import { formatDiscoveryVersion } from '../../../helpers/helpers';
import { checkoutItem, getPickupLocations } from '../../../util/api/user';
import { SelectPickupLocation } from './SelectPickupLocation';
import { SelectThawDate } from './SelectThawDate.js';
import { PATRON } from '../../../util/globals';

import { logDebugMessage } from '../../../util/logging.js';
import { useQueryClient } from '@tanstack/react-query';

const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

export const MyHold = (props) => {
     const hold = props.data;
     const holdSource = props.holdSource
     const resetGroup = props.resetGroup;
     const [pickupLocations, setPickupLocations] = React.useState([]);
     const sublocations = PATRON.sublocations;
     const section = props.section;
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { holds, updateHolds } = React.useContext(HoldsContext);
     const { language } = React.useContext(LanguageContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const insets = useSafeAreaInsets();
     const [cancelling, startCancelling] = React.useState(false);
     const [checkingOut, startCheckingOut] = React.useState(false);
     const [thawing, startThawing] = React.useState(false);
     const [freezing, startFreezing] = React.useState(false);
     let label, method, icon, canCancel;
     const version = formatDiscoveryVersion(library.discoveryVersion);
     const [usesHoldPosition, setUsesHoldPosition] = React.useState(false);
     const [holdPosition, setHoldPosition] = React.useState(null);

     const [showActionsheet, setShowActionsheet] = React.useState(false)
     const handleClose = () => setShowActionsheet(!showActionsheet);

     React.useEffect(() => {
          if (hold.holdQueueLength) {
               let tmp = getTermFromDictionary(language, 'hold_position_with_queue');
               if (hold.holdQueueLength && hold.position) {
                    tmp = tmp.replace('%1%', hold.position);
                    tmp = tmp.replace('%2%', hold.holdQueueLength);
                    setUsesHoldPosition(true);
                    setHoldPosition(tmp);
               }
          }
          const update = async () => {
               await getPickupLocations(library.baseUrl, null, hold.id).then((result) => {
                    if(result.ok) {
                         const pickupLocationsList = formatPickupLocations(result.data.result);
                         if (pickupLocations !== pickupLocationsList.locations) {
                              setPickupLocations(pickupLocationsList.locations);
                         }
                    }
               });
          };
          update();
     }, [language]);

     if (hold.canFreeze === true) {
          if (hold.frozen === true) {
               label = getTermFromDictionary(language, 'thaw_hold');
               method = 'thawHold';
               icon = 'play';
          } else {
               label = getTermFromDictionary(language, 'freeze_hold');
               method = 'freezeHold';
               icon = 'pause';
               if (hold.available) {
                    label = getTermFromDictionary(language, 'overdrive_delay_checkout');
                    method = 'freezeHold';
                    icon = 'pause';
               }
          }
     }

     if (!hold.available && hold.source !== 'ils') {
          canCancel = hold.cancelable;
          if (hold.source === 'axis360') {
               canCancel = true;
          }
     } else {
          canCancel = hold.cancelable;
     }

     let isPendingCancellation = false;
     if (hold.pendingCancellation) {
          canCancel = !hold.pendingCancellation;
          isPendingCancellation = hold.pendingCancellation;
     }

     let allowLinkedAccountAction = true;
     const discoveryVersion = formatDiscoveryVersion(library.discoveryVersion);
     if (discoveryVersion < '22.05.00') {
          if (hold.userId !== user.id) {
               allowLinkedAccountAction = false;
          }
     }

     const freezingHoldLabel = getTermFromDictionary(language, 'freezing_hold');
     const freezeHoldLabel = getTermFromDictionary(language, 'freeze_hold');

     const openGroupedWork = (item, title) => {
          navigateStack('AccountScreenTab', 'MyHold', {
               id: item,
               title: getCleanTitle(title),
               url: library.baseUrl,
               userContext: user,
               libraryContext: library,
               prevRoute: 'MyHolds',
          });
     };

     const initializeLeftColumn = () => {
          const key = 'medium_' + hold.source + '_' + hold.groupedWorkId;
          if (hold.coverUrl) {
               let url = library.baseUrl + '/bookcover.php?id=' + hold.source + ':' + hold.recordId + '&size=medium';
               if (hold.upc) {
                    url = url + '&upc=' + hold.upc;
               }
               return (
                    <VStack>
                         <Image
                              alt={hold.title}
                              source={url}
                              style={{
                                   width: 100,
                                   height: 150,
                              }}
                              borderRadius="$sm"
                              placeholder={blurhash}
                              transition={1000}
                              contentFit="cover"
                         />
                         {(hold.allowFreezeHolds || canCancel) && allowLinkedAccountAction && section === 'Pending' ? (
                              <Center>
                                   <Checkbox value={method + '|' + hold.recordId + '|' + hold.cancelId + '|' + hold.source + '|' + hold.userId} my="$3" size="md" accessibilityLabel="Check item">
                                        <CheckboxIndicator
                                             sx={{
                                                  ':checked': {
                                                       borderColor: theme['tokens']['colors']['primary']['500'],
                                                       backgroundColor: theme['tokens']['colors']['primary']['500'],
                                                  },
                                             }}>
                                             <CheckboxIcon as={CheckIcon} color="$textLight200" />
                                        </CheckboxIndicator>
                                   </Checkbox>
                              </Center>
                         ) : null}
                    </VStack>
               );
          } else {
               if (section === 'Pending') {
                    return (
                         <Center>
                              <Checkbox value={method + '|' + hold.recordId + '|' + hold.cancelId + '|' + hold.source + '|' + hold.userId} my="$3" size="md" accessibilityLabel="Check item" borderColor={colorMode === 'light' ? "$coolGray500" : "$warmGray300"}>
                                   <CheckboxIndicator
                                        _checked={{
                                             color: theme['tokens']['colors']['primary']['500'],
                                             borderColor: theme['tokens']['colors']['primary']['500'],
                                        }}>
                                        <CheckboxIcon as={CheckIcon}  sx={{ color: theme['tokens']['colors']['primary']['500-text'] }}/>
                                   </CheckboxIndicator>
                              </Checkbox>
                         </Center>
                    );
               }
          }

          return null;
     };

     const createOpenGroupedWorkAction = () => {
          if (hold.groupedWorkId) {
               return (
                    <ActionsheetItem
                         onPress={() => {
                              openGroupedWork(hold.groupedWorkId, hold.title);
                              handleClose();
                         }}>
                         <ActionsheetIcon>
                              <Icon as={MaterialIcons} name="search" mr="$1" size="md" color={textColor} />
                         </ActionsheetIcon>
                         <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'view_item_details')}</ActionsheetItemText>
                    </ActionsheetItem>
               );
          } else {
               return null;
          }
     };

     const createCheckoutHoldAction = () => {
          if (hold.source === 'overdrive' && hold.available) {
               return (
                    <ActionsheetItem
                         isLoading={checkingOut}
                         isLoadingText={getTermFromDictionary(language, 'checking_out', true)}
                         onPress={async () => {
                              startCheckingOut(true);
                              await checkoutItem(library.baseUrl, hold.sourceId, hold.source, hold.userId, '', '', '', language).then((result) => {
                                   popAlert(result.title, result.message, result.success ? 'success' : 'error');
                                   resetGroup();
                                   handleClose();
                                   startCheckingOut(false);
                              });
                         }}>
                         <ActionsheetIcon>
                              <Icon as={MaterialIcons} name="book"  mr="$1" size="md" color={textColor} />
                         </ActionsheetIcon>
                         <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'checkout_title')}</ActionsheetItemText>
                    </ActionsheetItem>
               );
          }

          return null;
     };

     const createCancelHoldAction = () => {
          if (canCancel && allowLinkedAccountAction) {
               let label = getTermFromDictionary(language, 'cancel_hold');
               if (hold.type === 'interlibrary_loan') {
                    label = getTermFromDictionary(language, 'ill_cancel_request');
               }

               let record = hold.recordId;
               if(hold.source === 'overdrive') {
                  record = hold.sourceId
               }

               return (
                    <ActionsheetItem
                         isLoading={cancelling}
                         isLoadingText={getTermFromDictionary(language, 'canceling', true)}
                         onPress={() => {
                              startCancelling(true);
                              cancelHold(hold.cancelId, record, hold.source, library.baseUrl, hold.userId, language).then((r) => {
                                   resetGroup();
                                   handleClose();
                                   startCancelling(false);
                              });
                         }}>
                         <ActionsheetIcon>
                              <Icon as={MaterialIcons} name="cancel" mr="$1" size="md"  color={textColor}/>
                         </ActionsheetIcon>
                         <ActionsheetItemText color={textColor}>{label}</ActionsheetItemText>
                    </ActionsheetItem>
               );
          } else if (hold.pendingCancellation) {
               return <ActionsheetItem><ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'pending_cancellation')}</ActionsheetItemText></ActionsheetItem>;
          } else {
               return null;
          }
     };

     const createFreezeHoldAction = () => {
          if (hold.allowFreezeHolds === '1' && allowLinkedAccountAction) {
			  let record = hold.recordId;
			  if(hold.source === 'overdrive') {
				  record = hold.sourceId
			  }
               if (hold.frozen) {
                    return (
                         <ActionsheetItem
                              isLoading={thawing}
                              isLoadingText={getTermFromDictionary(language, 'thawing_hold', true)}
                              onPress={() => {
                                   startThawing(true);
                                   thawHold(hold.cancelId, record, hold.source, library.baseUrl, hold.userId, language).then((r) => {
                                        resetGroup();
                                        handleClose();
                                        startThawing(false);
                                   });
                              }}>
                              <ActionsheetIcon>
                                   <Icon as={MaterialCommunityIcons} name={icon} mr="$1" size="md" color={textColor} />
                              </ActionsheetIcon>
                              <ActionsheetItemText color={textColor}>{label}</ActionsheetItemText>
                         </ActionsheetItem>
                    );
               } else {
                    if (library.showDateWhenSuspending) {
                         return <SelectThawDate isOpen={showActionsheet} label={null} freezeLabel={freezeHoldLabel} freezingLabel={freezingHoldLabel} language={language} libraryContext={library} holdsContext={updateHolds} onClose={handleClose} freezeId={hold.cancelId} recordId={record} source={hold.source} libraryUrl={library.baseUrl} userId={hold.userId} resetGroup={resetGroup} textColor={textColor} colorMode={colorMode} theme={theme}/>;
                    }else{
                         return (
                              <ActionsheetItem
                                   isLoading={freezing}
                                   isLoadingText={getTermFromDictionary(language, 'freezing_hold', true)}
                                   onPress={() => {
                                        startFreezing(true);
                                        freezeHold(hold.cancelId, record, hold.source, library.baseUrl, hold.userId, language, library.reactivateDateNotRequired ?? false).then((r) => {
                                             resetGroup();
                                             handleClose();
                                             startFreezing(false);
                                        });
                                   }}>
                                   <ActionsheetIcon>
                                        <Icon as={MaterialCommunityIcons} name={icon} mr="$1" size="md"  color={textColor}/>
                                   </ActionsheetIcon>
                                   <ActionsheetItemText color={textColor}>{label}</ActionsheetItemText>
                              </ActionsheetItem>
                         );
                    }
               }
          } else {
               return null;
          }
     };

     const createUpdatePickupLocationAction = (canUpdate, available) => {
          if (canUpdate && !available) {
               return <SelectPickupLocation isOpen={showActionsheet} language={language} libraryContext={library} holdsContext={updateHolds} locations={pickupLocations} sublocations={sublocations} onClose={handleClose} userId={hold.userId} currentPickupId={hold.pickupLocationId} holdId={hold.cancelId} resetGroup={resetGroup} textColor={textColor} colorMode={colorMode} theme={theme} />;
          } else {
               return null;
          }
     };

     if (holdSource != 'all' && holdSource != hold.source) {
          logDebugMessage("Hiding hold that is the wrong source " + holdSource);
          return null;
     }

     return (
          <>
               <Pressable onPress={handleClose} borderBottomWidth="$1" borderColor={colorMode === 'light' ? '$none' : "$warmGray400"} pl="$4" pr="$20" py="$2">
                    <HStack space="sm" maxW="95%">
                         {initializeLeftColumn()}
                         <VStack>
                              {getTitle(hold.title)}
                              {getBadge(hold.status, hold.frozen, hold.available, hold.source, hold.statusMessage ?? '')}
                              {getCallNumber(hold.callNumber)}
                              {getVolume(hold.volume)}
                              {getAuthor(hold.author)}
                              {getFormat(hold.format)}
                              {getCollectionName(hold.source, hold.collectionName ?? null)}
                              {getType(hold.type)}
                              {getOnHoldFor(hold.user)}
                              {getPickupLocation(hold.currentPickupName, hold.source)}
                              {getExpirationDate(hold.expirationDate, hold.available)}
                              {getOutOfHoldGroupMessage(hold.outOfHoldGroupMessage)}
                              {getPosition(hold.position, hold.available, hold.holdQueueLength, holdPosition, usesHoldPosition,hold.outOfHoldGroupMessage)}
                         </VStack>
                    </HStack>
               </Pressable>
               <Actionsheet isOpen={showActionsheet} onClose={handleClose} zIndex={999}>
                    <ActionsheetBackdrop />
                    <ActionsheetContent
                         bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                         pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                    >
                         <ActionsheetItem h={60} px="$4">
                              <ActionsheetItemText bold  color={textColor}>{hold.title}</ActionsheetItemText>
                         </ActionsheetItem>
                         {createCheckoutHoldAction()}
                         {createOpenGroupedWorkAction()}
                         {createCancelHoldAction()}
                         {createFreezeHoldAction()}
                         {createUpdatePickupLocationAction(hold.locationUpdateable ?? false, hold.available)}
                    </ActionsheetContent>
               </Actionsheet>
          </>
     );
};

export const ManageSelectedHolds = (props) => {
     const { selectedValues, onAllDateChange, selectedReactivationDate, resetGroup, context } = props;
     const navigation = useNavigation();
     const { language } = React.useContext(LanguageContext);
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { holds, updateHolds } = React.useContext(HoldsContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const insets = useSafeAreaInsets();

     const [showActionsheet, setShowActionsheet] = React.useState(false)
     const handleClose = () => setShowActionsheet(!showActionsheet);
     const [cancelling, startCancelling] = React.useState(false);
     const [thawing, startThawing] = React.useState(false);
     const [freezing, startFreezing] = React.useState(false);

     let titlesToFreeze = [];
     let titlesToThaw = [];
     let titlesToCancel = [];

     let numToCancel = 0;
     let numToFreeze = 0;
     let numToThaw = 0;
     let numSelected = 0;

     if (_.isArray(selectedValues)) {
          _.map(selectedValues, function (item, index, collection) {
               if (item.includes('freeze')) {
                    const arr = item.split('|');
                    titlesToFreeze.push({
                         action: arr[0],
                         recordId: arr[1],
                         cancelId: arr[2],
                         source: arr[3],
                         patronId: arr[4],
                    });
               }
               if (item.includes('thaw')) {
                    const arr = item.split('|');
                    titlesToThaw.push({
                         action: arr[0],
                         recordId: arr[1],
                         cancelId: arr[2],
                         source: arr[3],
                         patronId: arr[4],
                    });
               }

               const arr = item.split('|');
               titlesToCancel.push({
                    action: arr[0],
                    recordId: arr[1],
                    cancelId: arr[2],
                    source: arr[3],
                    patronId: arr[4],
               });
          });

          numToCancel = titlesToCancel.length;
          numToFreeze = titlesToFreeze.length;
          numToThaw = titlesToThaw.length;
          numSelected = _.toString(selectedValues.length);
     }

     const numToCancelLabel = getTermFromDictionary(language, 'cancel_selected_holds') + ' (' + numToCancel + ')';
     const numToFreezeLabel = getTermFromDictionary(language, 'freeze_selected_holds') + ' (' + numToFreeze + ')';
     const numToThawLabel = getTermFromDictionary(language, 'thaw_selected_holds') + ' (' + numToThaw + ')';
     const numSelectedLabel = getTermFromDictionary(language, 'manage_selected') + ' (' + numSelected + ')';
     const freezingHoldLabel = getTermFromDictionary(language, 'freezing_hold');
     const freezeHoldLabel = getTermFromDictionary(language, 'freeze_hold');

     const cancelActionItem = () => {
          if (numToCancel > 0) {
               return (
                    <ActionsheetItem
                         onPress={() => {
                              startCancelling(true);
                              cancelHolds(titlesToCancel, library.baseUrl, language).then((r) => {
                                   resetGroup();
                                   handleClose();
                                   startCancelling(false);
                              });
                         }}
                         isLoading={cancelling}
                         isLoadingText={getTermFromDictionary(language, 'canceling', true)}>
                         <ActionsheetItemText  color={textColor}>{numToCancelLabel}</ActionsheetItemText>
                    </ActionsheetItem>
               );
          } else {
               return <ActionsheetItem isDisabled>{getTermFromDictionary(language, 'cancel_holds')}</ActionsheetItem>;
          }
     };

     const thawActionItem = () => {
          if (numToThaw > 0) {
               return (
                    <ActionsheetItem
                         onPress={() => {
                              startThawing(true);
                              thawHolds(titlesToThaw, library.baseUrl, language).then((r) => {
                                   resetGroup();
                                   handleClose();
                                   startThawing(false);
                              });
                         }}
                         isLoading={thawing}
                         isLoadingText={getTermFromDictionary(language, 'thawing_hold', true)}>
                         <ActionsheetItemText color={textColor}>{numToThawLabel}</ActionsheetItemText>
                    </ActionsheetItem>
               );
          } else {
               return <ActionsheetItem isDisabled><ActionsheetItemText color={textColor}>{numToThawLabel}</ActionsheetItemText></ActionsheetItem>;
          }
     };

     const freezeActionItem = () => {
          if (numToFreeze > 0) {
               if (library.showDateWhenSuspending) {
                    return <SelectThawDate isOpen={showActionsheet} label={numToFreezeLabel} freezeLabel={freezeHoldLabel} freezingLabel={freezingHoldLabel} language={language} holdsContext={updateHolds} libraryContext={library} resetGroup={resetGroup} onClose={handleClose} count={numToFreeze} numSelected={numSelected} data={titlesToFreeze} colorMode={colorMode} textColor={textColor} theme={theme}/>;
               }else{
                    return (
                         <ActionsheetItem
                              isLoading={freezing}
                              isLoadingText={getTermFromDictionary(language, 'freezing_hold', true)}
                              onPress={() => {
                                   startFreezing(true);
                                   freezeHolds(titlesToFreeze, library.baseUrl, null,'en', library.reactivateDateNotRequired ?? false).then((r) => {
                                        resetGroup();
                                        handleClose();
                                        startFreezing(false);
                                   });
                              }}>
                              <ActionsheetItemText color={textColor}>{numToFreezeLabel}</ActionsheetItemText>
                         </ActionsheetItem>
                    );
               }
          } else {
               return <ActionsheetItem isDisabled><ActionsheetItemText color={textColor}>{numToFreezeLabel}</ActionsheetItemText></ActionsheetItem>;
          }
     }

     return (
          <Center>
               <Button bgColor={theme.tokens.colors.primary['500']} onPress={handleClose} size="sm" variant="solid" mr="$1">
                    <ButtonText color="$textLight200">{numSelectedLabel}</ButtonText>
               </Button>
               <Actionsheet isOpen={showActionsheet} onClose={handleClose} zIndex={999}>
                    <ActionsheetBackdrop />
                    <ActionsheetContent
                         zIndex={999}
                         bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                         pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                    >
                         <ActionsheetDragIndicatorWrapper>
                              <ActionsheetDragIndicator />
                         </ActionsheetDragIndicatorWrapper>
                         {cancelActionItem()}
                         {freezeActionItem()}
                         {thawActionItem()}
                    </ActionsheetContent>
               </Actionsheet>
          </Center>
     );
};

export const ManageAllHolds = (props) => {
     const queryClient = useQueryClient();
     const { resetGroup } = props;
     const { language } = React.useContext(LanguageContext);
     const { holds, updateHolds } = React.useContext(HoldsContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const { user } = React.useContext(UserContext);
     const insets = useSafeAreaInsets();

     const [showActionsheet, setShowActionsheet] = React.useState(false)
     const handleClose = () => setShowActionsheet(!showActionsheet);     const [cancelling, startCancelling] = React.useState(false);
     const [thawing, startThawing] = React.useState(false);
     const [freezing, startFreezing] = React.useState(false);

     let titlesToFreeze = [];
     let titlesToThaw = [];
     let titlesToCancel = [];

     const holdsNotReady = holds[1].data;

     if (_.isArray(holdsNotReady)) {
          _.map(holdsNotReady, function (item, index, collection) {
               let record = item.recordId;
               if(item.source === 'overdrive') {
                  record = item.sourceId
               }
               if (item.canFreeze) {
                    if (item.frozen) {
                         titlesToThaw.push({
                              recordId: record,
                              cancelId: item.cancelId,
                              source: item.source,
                              patronId: item.userId,
                         });
                    } else {
                         titlesToFreeze.push({
                              recordId: record,
                              cancelId: item.cancelId,
                              source: item.source,
                              patronId: item.userId,
                         });
                    }
               }

               if (item.cancelable) {
                    titlesToCancel.push({
                         recordId: record,
                         cancelId: item.cancelId,
                         source: item.source,
                         patronId: item.userId,
                    });
               }
          });
     }

     let numToCancel = titlesToCancel.length;
     let numToFreeze = titlesToFreeze.length;
     let numToThaw = titlesToThaw.length;

     let numToManage = numToCancel + numToFreeze + numToThaw;

     const numToCancelLabel = getTermFromDictionary(language, 'cancel_all_holds') + ' (' + numToCancel + ')';
     const numToFreezeLabel = getTermFromDictionary(language, 'freeze_all_holds') + ' (' + numToFreeze + ')';
     const numToThawLabel = getTermFromDictionary(language, 'thaw_all_holds') + ' (' + numToThaw + ')';
     const freezingHoldLabel = getTermFromDictionary(language, 'freezing_hold');
     const freezeHoldLabel = getTermFromDictionary(language, 'freeze_hold');

     const freezeAllActionItem = () => {
          if (numToFreeze > 0) {
               if (library.showDateWhenSuspending) {
                    return <SelectThawDate label={numToFreezeLabel} freezeLabel={freezeHoldLabel} freezingLabel={freezingHoldLabel} language={language} holdsContext={updateHolds} libraryContext={library} resetGroup={resetGroup} onClose={handleClose} count={numToFreeze} numSelected={numToManage} data={titlesToFreeze} textColor={textColor} colorMode={colorMode} theme={theme}/>;
               }else{
                    return (
                         <ActionsheetItem
                              isLoading={freezing}
                              isLoadingText={getTermFromDictionary(language, 'freezing_hold', true)}
                              onPress={() => {
                                   startFreezing(true);
                                   freezeHolds(titlesToFreeze, library.baseUrl, null,'en', library.reactivateDateNotRequired ?? false).then((r) => {
                                        resetGroup();
                                        onClose(onClose);
                                        startFreezing(false);
                                   });
                                   queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                              }}>
                              <ActionsheetItemText color={textColor}>{numToFreezeLabel}</ActionsheetItemText>
                         </ActionsheetItem>
                    );
               }
          } else {
               return <ActionsheetItem isDisabled><ActionsheetItemText color={textColor}>{freezeHoldLabel}</ActionsheetItemText></ActionsheetItem>;
          }
     }

     if (numToManage >= 1) {
          return (
               <Center>
                    <Button bgColor={theme.tokens.colors.primary['500']} size="sm" variant="solid" mr={1} onPress={handleClose}>
                         <ButtonText color="$textLight200">{getTermFromDictionary(language, 'hold_manage_all')}</ButtonText>
                    </Button>
                    <Actionsheet isOpen={showActionsheet} onClose={handleClose} zIndex={999}>
                         <ActionsheetBackdrop />
                         <ActionsheetContent
                              zIndex={999}
                              bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                              pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                         >
                              <ActionsheetDragIndicatorWrapper>
                                   <ActionsheetDragIndicator />
                              </ActionsheetDragIndicatorWrapper>
                              <ActionsheetItem
                                   isLoading={cancelling}
                                   isLoadingText={getTermFromDictionary(language, 'canceling', true)}
                                   onPress={() => {
                                        startCancelling(true);
                                        cancelHolds(titlesToCancel, library.baseUrl, language).then((r) => {
                                             resetGroup();
                                             handleClose();
                                             startCancelling(false);
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                                   }}>
                                   <ActionsheetItemText color={textColor}>{numToCancelLabel}</ActionsheetItemText>
                              </ActionsheetItem>

                              {freezeAllActionItem()}

                              <ActionsheetItem
                                   isLoading={thawing}
                                   isLoadingText={getTermFromDictionary(language, 'thaw_hold', true)}
                                   onPress={() => {
                                        startThawing(true);
                                        thawHolds(titlesToThaw, library.baseUrl, language).then((r) => {
                                             resetGroup();
                                             handleClose();
                                             startThawing(false);
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                                   }}>
                                   <ActionsheetItemText color={textColor}>{numToThawLabel}</ActionsheetItemText>
                              </ActionsheetItem>
                         </ActionsheetContent>
                    </Actionsheet>
               </Center>
          );
     }

     return null;
};
