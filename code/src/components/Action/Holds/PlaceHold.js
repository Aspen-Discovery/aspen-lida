import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { Button, ButtonText, ButtonSpinner, useToast } from '@gluestack-ui/themed';
import React from 'react';

// custom components and helper files
import { HoldsContext, LibrarySystemContext, ThemeContext } from '../../../context/initialContext';
import { useUserState, useAccounts, useLocations, useUpdateUserProfile } from '../../../hooks/useUserData';
import { refreshProfile } from '../../../util/api/user';
import { completeAction } from '../../../util/api/userHelper';
import { HoldPrompt } from './HoldPrompt';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../../../util/logging.js';

export const PlaceHold = (props) => {
     const queryClient = useQueryClient();
     const {
          id,
          type,
          volumeInfo,
          volumeId,
          volumeName,
          title,
          record,
          holdTypeForFormat,
          variationId,
          prevRoute,
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
          language,
          holdSelectItemResponse,
          setHoldSelectItemResponse,
          holdItemSelectIsOpen,
          setHoldItemSelectIsOpen,
          onHoldItemSelectClose,
          cancelHoldItemSelectRef,
          userHasAlternateLibraryCard,
          shouldPromptAlternateLibraryCard
     } = props;
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const updateUserProfile = useUpdateUserProfile();
     const preferredPickupLocationIsValid = userState?.preferredPickupLocationIsValid ?? true;
     const { data: accounts } = useAccounts();
     const { data: locations } = useLocations();
      const { library } = React.useContext(LibrarySystemContext);
      const [loading, setLoading] = React.useState(false);
     const { holds, updateHolds } = React.useContext(HoldsContext);
     const { theme } = React.useContext(ThemeContext);
     const toast = useToast();

     const refreshAndSaveUserProfile = React.useCallback(async () => {
          const profileResponse = await refreshProfile(library.baseUrl);
          if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
               await updateUserProfile(profileResponse.data.result.profile);
          }
     }, [library.baseUrl, updateUserProfile]);

     let userPickupLocationId = user.pickupLocationId ?? user.homeLocationId;
     if (_.isNumber(user.pickupLocationId)) {
          userPickupLocationId = _.toString(user.pickupLocationId);
     }

     let pickupLocation = '';
     if (_.size(locations) > 1) {
          const userPickupLocation = _.filter(locations, { locationId: userPickupLocationId });
          if (!_.isUndefined(userPickupLocation && !_.isEmpty(userPickupLocation))) {
               pickupLocation = userPickupLocation[0];
               if (_.isObject(pickupLocation)) {
                    pickupLocation = pickupLocation.code;
               }
          }
     } else {
          pickupLocation = locations[0];
          if (_.isObject(pickupLocation)) {
               pickupLocation = pickupLocation.code;
          }
     }

     logDebugMessage("Pickup Location: " + pickupLocation);

     const [sublocation, setSublocation] = React.useState(null);

     let promptForHoldNotifications = user.promptForHoldNotifications ?? false;

     let loadHoldPrompt = false;
     if (!preferredPickupLocationIsValid) {
          logDebugMessage("Showing Hold Prompt because the user's preferred pickup location is invalid");
          loadHoldPrompt = true;
     }else if (volumeInfo.numItemsWithVolumes >= 1 && _.isEmpty(volumeId)) {
          logDebugMessage("Showing Hold Prompt to select volume");
          loadHoldPrompt = true;
     }else if (_.size(accounts) > 0) {
          logDebugMessage("Showing Hold Prompt due to linked accounts");
          loadHoldPrompt = true;
     }else if (_.size(locations) > 1 && user.rememberHoldPickupLocation == 0) {
          logDebugMessage("Showing Hold Prompt due to having locations user.rememberHoldPickupLocation = " + user.rememberHoldPickupLocation);
          loadHoldPrompt = true;
     }else if (promptForHoldNotifications) {
          logDebugMessage("Showing Hold Prompt due to prompt for hold notifications");
          loadHoldPrompt = true;
     }else if ((holdTypeForFormat === 'item' || holdTypeForFormat === 'either') && _.isEmpty(volumeId)){
          logDebugMessage("Showing Hold Prompt due to hold type");
          loadHoldPrompt = true;
     }else if (shouldPromptAlternateLibraryCard && !userHasAlternateLibraryCard) {
          logDebugMessage("Showing Hold Prompt due to alternate library card");
          loadHoldPrompt = true;
     }

     //Check to see if the title is already on hold for the patron
     logDebugMessage("holdTypeForFormat = " + holdTypeForFormat);
     logDebugMessage("record = " + record);
     let alreadyOnHold = false;
     if(holds) {
          holds.forEach(holdSection => {
               holdSection.data.forEach(hold => {
                    if ((hold.source + ':' + hold.sourceId) == record) {
                         alreadyOnHold = true;
                    }
               });
          });
     }
     if (alreadyOnHold) {
          logDebugMessage("Showing Hold Prompt because titles is already on hold");
          loadHoldPrompt = true;
     }


     if (user.rememberHoldPickupLocation) {
          let userPickupLocationId = user.pickupLocationId ?? user.homeLocationId;
          if (_.isNumber(user.pickupLocationId)) {
               userPickupLocationId = _.toString(user.pickupLocationId);
          }
          const userPickupLocation = _.filter(locations, { locationId: userPickupLocationId });
          let pickupLocation = '';
          if (!_.isUndefined(userPickupLocation && !_.isEmpty(userPickupLocation))) {
               pickupLocation = userPickupLocation[0];
               if (_.isObject(pickupLocation)) {
                    pickupLocation = pickupLocation.locationId;
               }
          } else {
               // soft check on valid pickup location, if nothing is returned out of the locations array, its probably invalid
               logDebugMessage("Showing Hold Prompt because current pickup location is invalid");
               loadHoldPrompt = true;
          }
     }

     if (loadHoldPrompt) {
          logDebugMessage("Need to load hold prompt");
          return (
               <HoldPrompt
                    language={language}
                    id={record}
                    title={title}
                    action={type}
                    holdTypeForFormat={holdTypeForFormat}
                    variationId={variationId}
                    volumeInfo={volumeInfo}
                    volumeId={volumeId}
                    volumeName={volumeName}
                    prevRoute={prevRoute}
                    isEContent={false}
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
                    alreadyOnHold={alreadyOnHold}
               />
          );
     } else {
          logDebugMessage("Hold can be placed without prompting");
          let holdType = 'default';
          if (!_.isEmpty(volumeId)) {
               holdType = 'volume';
          }
          // The hold can be placed without additional prompting to the user.
          // See HoldPrompt.js for actions if a pickup location etc. is needed.
          return (
               <>
                    <Button
                         size="md"
                         bgColor={theme.tokens.colors.primary['500']}
                         variant="solid"
                         minWidth="100%"
                         maxWidth="100%"
                         onPress={async () => {
                              setLoading(true);
                              await completeAction(toast, record, type, user.id, '', '', pickupLocation, sublocation, user.rememberHoldPickupLocation, library.baseUrl, volumeId, holdType).then(async (ilsResponse) => {
                                   setResponse(ilsResponse);

                                   if (ilsResponse?.confirmationNeeded && ilsResponse.confirmationNeeded) {
                                        setHoldConfirmationResponse({
                                             message: ilsResponse.api?.message ?? ilsResponse.message,
                                             title: ilsResponse.api?.title ?? ilsResponse.title,
                                             confirmationNeeded: ilsResponse.confirmationNeeded ?? false,
                                             confirmationId: ilsResponse.confirmationId ?? null,
                                             recordId: record ?? null,
                                        });
                                   }
                                   if (ilsResponse?.shouldBeItemHold && ilsResponse.shouldBeItemHold) {
                                        setHoldSelectItemResponse({
                                             message: ilsResponse.message,
                                             title: 'Select an Item',
                                             patronId: user.id,
                                             pickupLocation: pickupLocation,
                                             bibId: record ?? null,
                                             items: ilsResponse.items ?? [],
                                        });
                                   }

                                   if (ilsResponse?.success === true || ilsResponse?.success === 'true') {
                                        //Refresh the hold and user if the hold was successful
                                        queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                                        await refreshAndSaveUserProfile();

                                        const timeoutId = setTimeout(() => {
                                             // Also refresh in 45 seconds for Sierra since hold can take a minute to show up on the account
                                             queryClient.invalidateQueries({ queryKey: ['holds', user.id, library.baseUrl, language] });
                                             refreshAndSaveUserProfile();
                                        }, 45 * 1000);
                                   }

                                   setLoading(false);
                                   if (ilsResponse?.confirmationNeeded && ilsResponse.confirmationNeeded) {
                                        setHoldConfirmationIsOpen(true);
                                   } else if (ilsResponse?.shouldBeItemHold && ilsResponse.shouldBeItemHold) {
                                        setHoldItemSelectIsOpen(true);
                                   } else {
                                        setResponseIsOpen(true);
                                   }
                              });
                         }}>
                         {loading ? (
                              <ButtonSpinner color={theme.tokens.colors.primary['500-text']} />
                         ) : (
                              <ButtonText color={theme.tokens.colors.primary['500-text']} textAlign="center">
                                   {title}
                              </ButtonText>
                         )}
                    </Button>
               </>
          );
     }
};
