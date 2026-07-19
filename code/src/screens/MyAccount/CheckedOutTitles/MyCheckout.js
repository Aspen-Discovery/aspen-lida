import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
     Actionsheet,
     ActionsheetContent,
     ActionsheetItem,
     ActionsheetItemText, ActionsheetBackdrop, Box, HStack, Icon, Pressable, Text, VStack, ActionsheetIcon, useToast,
} from '@gluestack-ui/themed';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// custom components and helper files
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import {
     getAuthor,
     getCheckedOutTo,
     getCleanTitle,
     getDueDate,
     getFormat,
     getRenewalCount,
     getTitle,
     isOverdue,
     willAutoRenew,
     getCollectionName,
     CheckoutAccessLabel
} from '../../../helpers/item';
import { navigate, navigateStack } from '../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { renewCheckout, returnCheckout, viewOnlineItem, viewOverDriveItem } from '../../../util/api/user';
import { stripHTML, formatDiscoveryVersion } from '../../../helpers/helpers';

export const MyCheckout = (props) => {
     const { user } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language } = React.useContext(LanguageContext);
     const version = formatDiscoveryVersion(library.discoveryVersion);
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const insets = useSafeAreaInsets();

     const [access, setAccess] = useState(false);
     const [returning, setReturn] = useState(false);
     const [renewing, setRenew] = useState(false);
     const [isOpen, setIsOpen] = React.useState(false);

     const toast = useToast();

     const blurhash = 'MHPZ}tt7*0WC5S-;ayWBofj[K5RjM{ofM_';

     const checkout = props.data;
     const checkoutSource = props.checkoutSource
     const setRenewConfirmationIsOpen = props.setRenewConfirmationIsOpen;
     const setRenewConfirmationResponse = props.setRenewConfirmationResponse;
     const reloadCheckouts = props.reloadCheckouts;

     const openGroupedWork = (item, title) => {
          navigateStack('AccountScreenTab', 'MyCheckout', {
               id: item,
               title: getCleanTitle(title),
               url: library.baseUrl,
               userContext: user,
               libraryContext: library,
               prevRoute: 'MyCheckouts',
          });
     };
     const toggle = () => {
          setIsOpen(!isOpen);
     };

     let canRenew = !checkout.canRenew;
     let allowLinkedAccountAction = true;
     if (version < '22.05.00') {
          if (checkout.userId !== user.id) {
               allowLinkedAccountAction = false;
          }
     }

     let libbyReaderName = 'Libby';
     if (library.libbyReaderName) {
          libbyReaderName = library.libbyReaderName;
     }

     let returnEarly = false;
     if (checkout.canReturnEarly === 1 || checkout.canReturnEarly === '1' || checkout.canReturnEarly === true || checkout.canReturnEarly === 'true') {
          returnEarly = true;
     }

     let renewMessage = false;
     if (checkout.canRenew) {
          renewMessage = getTermFromDictionary(language, 'checkout_renew');
     } else {
          renewMessage = getTermFromDictionary(language, 'not_eligible_for_renewals');
     }
     if (checkout.autoRenew === '1' || checkout.autoRenew === 1) {
          renewMessage = getTermFromDictionary(language, 'if_eligible_auto_renew');
     }
     if (checkout.autoRenewError) {
          renewMessage = checkout.autoRenewError;
     }
     if (checkout.renewError) {
          renewMessage = checkout.renewError;
     }

     const key = 'medium_' + checkout.source + '_' + checkout.groupedWorkId;
     let url = library.baseUrl + '/bookcover.php?id=' + checkout.fullId + '&size=medium';

     let itemId = checkout.itemId;
     if (checkout.renewalId) {
          itemId = checkout.renewalId;
     }

	let record = checkout.recordId;
	if(checkout.source === 'overdrive') {
		record = checkout.sourceId
	}

     const handleOpenPalaceProjectInstructions = () => {
          navigate('PalaceProjectInstructionsModal');
     };


     return (
          <Pressable onPress={toggle} borderBottomWidth="$1" borderBottomColor={colorMode === 'light' ? "$coolGray200" : "$coolGray500"} pl="$4" pr="$5" py="$2">
               <HStack space="sm" maxW="75%">
                    <Image
                         alt={checkout.title}
                         source={url}
                         style={{
                              width: 100,
                              height: 150,
                              borderRadius: "$sm",
                         }}
                         placeholder={blurhash}
                         transition={1000}
                         contentFit="cover"
                    />
                    <VStack>
                         {getTitle(checkout.title)}
                         {isOverdue(checkout.overdue)}
                         {getAuthor(checkout.author)}
                         {getFormat(checkout.format, checkout.source)}
                         {getCollectionName(checkout.source, checkout.collectionName ?? null)}
                         {getCheckedOutTo(checkout.user)}
                         {getDueDate(checkout.dueDate)}
                         {getRenewalCount(checkout.renewCount ?? 0, checkout.maxRenewals ?? null)}
                         {willAutoRenew(checkout.autoRenew ?? false, checkout.renewalDate)}
                    </VStack>
               </HStack>
               <Actionsheet isOpen={isOpen} onClose={toggle} size="full">
                    <ActionsheetBackdrop />
                    <ActionsheetContent
                         bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}
                         pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
                    >
                         <ActionsheetItem h={60} px="$4">
                              <ActionsheetItemText bold color={textColor}>{checkout.title}</ActionsheetItemText>
                         </ActionsheetItem>
                         {checkout.groupedWorkId ? (
                              <ActionsheetItem
                                   onPress={() => {
                                        openGroupedWork(checkout.groupedWorkId, checkout.title);
                                        toggle();
                                   }}
                                   >
                                   <ActionsheetIcon>
                                        <Icon as={MaterialIcons} name="search" mr="$1" size="md" color={textColor}/>
                                   </ActionsheetIcon>
                                   <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'view_item_details')}</ActionsheetItemText>
                              </ActionsheetItem>
                         ): null}
                         {renewMessage ? (
                              <ActionsheetItem
                                   maxwidth="$full"
                                   isTruncated
                                   isDisabled={canRenew}
                                   isLoading={renewing}
                                   isLoadingText={getTermFromDictionary(language, 'renewing', true)}
                                   onPress={() => {
                                        setRenew(true);
                                        renewCheckout(checkout.barcode, record, checkout.source, itemId, library.baseUrl, checkout.userId).then((result) => {
                                             setRenew(false);

                                             if (result?.confirmRenewalFee && result.confirmRenewalFee) {
                                                  setRenewConfirmationResponse({
                                                       message: result.api.message,
                                                       title: result.api.title,
                                                       confirmRenewalFee: result.confirmRenewalFee ?? false,
                                                       action: result.api.action,
                                                       recordId: record ?? null,
                                                       barcode: checkout.barcode ?? null,
                                                       source: checkout.source ?? null,
                                                       itemId: itemId ?? null,
                                                       userId: checkout.userId ?? null,
                                                       renewType: 'single',
                                                  });
                                             }

                                             if (result?.confirmRenewalFee && result.confirmRenewalFee) {
                                                  setRenewConfirmationIsOpen(true);
                                             } else {
                                                  reloadCheckouts();
                                             }

                                             toggle();
                                        });
                                   }}
                                   >
                                   <ActionsheetIcon>
                                        <Icon as={MaterialIcons} name="autorenew" mr="$1" size="md" color={textColor}/>
                                   </ActionsheetIcon>
                                   <ActionsheetItemText color={textColor}>{stripHTML(renewMessage)}</ActionsheetItemText>
                              </ActionsheetItem>
                         ) : null}
                         {checkout.source === 'overdrive' ? (
                              <ActionsheetItem
                                   isLoading={access}
                                   isLoadingText={getTermFromDictionary(language, 'accessing', true)}
                                   onPress={() => {
                                        setAccess(true);
                                        viewOverDriveItem(toast, checkout.userId, checkout.formatId, checkout.overDriveId, library.baseUrl, language).then((result) => {
                                             setAccess(false);
                                             toggle();
                                        });
                                   }}
                                   >
                                   <ActionsheetIcon>
                                        <Icon as={MaterialIcons} name="book" mr="$1" size="md" color={textColor} />
                                   </ActionsheetIcon>
                                   <CheckoutAccessLabel checkout={checkout} libbyReaderName={libbyReaderName} baseUrl={library.baseUrl} language={language}></CheckoutAccessLabel>
                              </ActionsheetItem>
                         ) : null}
                         {checkout.source === 'palace_project' ? (
                              <ActionsheetItem onPress={() => handleOpenPalaceProjectInstructions()}>
                                   <ActionsheetIcon>
                                        <Icon as={MaterialIcons} name="info" color="trueGray.400" mr="1" size="6" />
                                   </ActionsheetIcon>
                                   <ActionsheetItemText color={textColor}>{getTermFromDictionary(language, 'access_instructions')}</ActionsheetItemText>
                              </ActionsheetItem>
                         ) : null}
                         {checkout.accessOnlineUrl != null ? (
                              <>
                                   <ActionsheetItem
                                        isLoading={access}
                                        isLoadingText={getTermFromDictionary(language, 'accessing', true)}
                                        onPress={() => {
                                             setAccess(true);
                                             viewOnlineItem(toast, checkout.userId, checkout.recordId, checkout.source, checkout.accessOnlineUrl, library.baseUrl, language).then((result) => {
                                                  setAccess(false);
                                                  toggle();
                                             });
                                        }}
                                        >
                                        <ActionsheetIcon>
                                             <Icon as={MaterialIcons} name="book" mr="$1" size="md"  color={textColor}/>
                                        </ActionsheetIcon>
                                        <CheckoutAccessLabel checkout={checkout} libbyReaderName={libbyReaderName} baseUrl={library.baseUrl} language={language}></CheckoutAccessLabel>
                                   </ActionsheetItem>
                                   <ActionsheetItem
                                        isLoading={returning}
                                        isLoadingText={getTermFromDictionary(language, 'returning', true)}
                                        onPress={() => {
                                             setReturn(true);
                                             returnCheckout(checkout.userId, record, checkout.source, checkout.overDriveId, library.baseUrl, version, checkout.transactionId, language).then((result) => {
                                                  setReturn(false);
                                                  reloadCheckouts();
                                                  toggle();
                                             });
                                        }}
                                        >
                                        <ActionsheetIcon>
                                             <Icon as={MaterialIcons} name="logout" mr="$1" size="md"  color={textColor} />
                                        </ActionsheetIcon>
                                        <CheckoutAccessLabel checkout={checkout} libbyReaderName={libbyReaderName} baseUrl={library.baseUrl} language={language}></CheckoutAccessLabel>
                                        <ActionsheetItemText  color={textColor}>{getTermFromDictionary(language, 'checkout_return_now')}</ActionsheetItemText>
                                   </ActionsheetItem>
                              </>
                         ) : null}
                         {returnEarly && allowLinkedAccountAction ? (
                              <>
                                   <ActionsheetItem
                                        isLoading={returning}
                                        isLoadingText={getTermFromDictionary(language, 'returning', true)}
                                        onPress={() => {
                                             setReturn(true);
                                             returnCheckout(checkout.userId, record, checkout.source, checkout.overDriveId, library.baseUrl, version, checkout.transactionId, language).then((result) => {
                                                  setReturn(false);
                                                  reloadCheckouts();
                                                  toggle();
                                             });
                                        }}
                                        >
                                        <ActionsheetIcon>
                                             <Icon as={MaterialIcons} name="logout" mr="$1" size="md"  color={textColor}/>
                                        </ActionsheetIcon>
                                        <ActionsheetItemText  color={textColor}>{getTermFromDictionary(language, 'checkout_return_now')}</ActionsheetItemText>
                                   </ActionsheetItem>
                              </>
                         ) : null}
                    </ActionsheetContent>
               </Actionsheet>
          </Pressable>
     );
};
