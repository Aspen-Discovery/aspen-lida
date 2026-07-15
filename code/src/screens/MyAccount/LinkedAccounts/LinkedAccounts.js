import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { Box, Button, ButtonText, Divider, FlatList, Heading, HStack, ScrollView, Text } from '@gluestack-ui/themed';
import React, { useContext, useLayoutEffect, useEffect, useState } from 'react';

import { DisplayMessage, DisplaySystemMessage } from '../../../components/Notifications';
import {
     LanguageContext,
     LibrarySystemContext,
     SystemMessagesContext,
     ThemeContext,
     UserContext,
} from '../../../context/initialContext';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { getLinkedAccounts, getViewerAccounts, removeLinkedAccount, removeViewerAccount } from '../../../util/api/user';
import { formatLinkedAccounts } from '../../../util/api/userHelper';

import AddLinkedAccount from './AddLinkedAccount';
import DisableAccountLinking from './DisableAccountLinking';
import EnableAccountLinking from './EnableAccountLinking';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';
import { LoadingSpinner } from '../../../components/loadingSpinner';

export const MyLinkedAccounts = () => {
     const navigation = useNavigation();
     const { user, accounts, viewers, cards, updateLinkedAccounts, updateLinkedViewerAccounts, updateLibraryCards } = useContext(UserContext);
     const { library } = useContext(LibrarySystemContext);
     const { language } = useContext(LanguageContext);
     const { textColor } = useContext(ThemeContext);
     const queryClient = useQueryClient();
     const { systemMessages, updateSystemMessages } = useContext(SystemMessagesContext);

     let canUserLinkAccounts = true;
     let ptypeDisabledLinking = false;

     if ((user.disableAccountLinking !== '0' && user.disableAccountLinking !== 0) || user.addLinkedAccountRule === 3) {
          canUserLinkAccounts = false;

          if (user.addLinkedAccountRule === 3) {
               ptypeDisabledLinking = true;
          }
     }

     useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => <Box />,
          });
     }, [navigation]);

     const { data: linkedData, isSuccess: isLinkedSuccess } = useQuery(
          ['linked_accounts', user.id, library.baseUrl, language],
          () => getLinkedAccounts(user, cards, library.barcodeStyle, library.baseUrl, language),
          {
               placeholderData: [],
               enabled: !!library.baseUrl && !!user.id,
          }
     );

     useEffect(() => {
          if (isLinkedSuccess && linkedData) {
               if (linkedData.ok) {
                    const formatted = formatLinkedAccounts(
                         user,
                         cards ?? [],
                         library.barcodeStyle,
                         linkedData.data.result.linkedAccounts
                    );
                    updateLinkedAccounts(formatted.accounts);
                    updateLibraryCards(formatted.cards);
               } else {
                    logDebugMessage("Error fetching linked accounts");
                    logDebugMessage(linkedData);
                    getErrorMessage(linkedData.code ?? 0, linkedData.problem);
               }
          }
     }, [linkedData, isLinkedSuccess]);

     const { data: viewerData, isSuccess: isViewerSuccess } = useQuery(
          ['viewer_accounts', user.id, library.baseUrl, language],
          () => getViewerAccounts(library.baseUrl, language),
          {
               placeholderData: [],
               enabled: !!library.baseUrl && !!user.id,
          }
     );

     useEffect(() => {
          if (isViewerSuccess && viewerData) {
               if (viewerData.ok) {
                    const viewerList = _.values(viewerData.data?.result?.viewers ?? []);
                    updateLinkedViewerAccounts(viewerList);
               } else {
                    logDebugMessage("Error fetching linked viewer accounts");
                    logDebugMessage(viewerData);
                    getErrorMessage(viewerData.code ?? 0, viewerData.problem);
               }
          }
     }, [viewerData, isViewerSuccess]);

     const Empty = () => {
          return (
               <Box pt="$3" pb="$5">
                    <Text bold color={textColor}>{getTermFromDictionary(language, 'none')}</Text>
               </Box>
          );
     };

     const showSystemMessage = () => {
          if (_.isArray(systemMessages)) {
               return systemMessages.map((obj, index) => {
                    if (obj.showOn === '0' || obj.showOn === '1') {
                         return (
                              <DisplaySystemMessage
                                   key={obj.id || index}
                                   style={obj.style}
                                   message={obj.message}
                                   dismissable={obj.dismissable}
                                   id={obj.id}
                                   all={systemMessages}
                                   url={library.baseUrl}
                                   updateSystemMessages={updateSystemMessages}
                                   queryClient={queryClient}
                              />
                         );
                    }
                    return null;
               });
          }
          return null;
     };

     if (!canUserLinkAccounts) {
          return (
               <ScrollView p="$5" flex={1}>
                    {showSystemMessage()}
                    {ptypeDisabledLinking ? (
                         <DisplayMessage type="info" message={getTermFromDictionary(language, 'linked_account_disabled_by_ptype')} />
                    ) : (
                         <Box>
                              <DisplayMessage type="info" message={getTermFromDictionary(language, 'linked_account_disabled_by_user')} />
                              <EnableAccountLinking />
                         </Box>
                    )}
               </ScrollView>
          );
     }

     return (
          <ScrollView p="$2" flex={1}>
               {showSystemMessage()}
               <DisplayMessage type="info" message={getTermFromDictionary(language, 'linked_info_message')} />

               {user.addLinkedAccountRule !== 1 ? (
                    <Box>
                         <Heading size="lg" pb="$2" color={textColor}>
                              {getTermFromDictionary(language, 'linked_additional_accounts')}
                         </Heading>
                         <Text fontSize="$sm" color={textColor}>
                              {getTermFromDictionary(language, 'linked_following_accounts_can_manage')}
                         </Text>
                         <FlatList
                              data={accounts}
                              renderItem={({ item }) => <Account account={item} type="linked" />}
                              ListEmptyComponent={Empty}
                              keyExtractor={(item, index) => index.toString()}
                         />
                         <AddLinkedAccount />
                         <Divider my="$4" />
                    </Box>
               ) : null}

               {user.addLinkedAccountRule !== 2 ? (
                    <Box>
                         <Heading size="lg" pb="$2" color={textColor}>
                              {getTermFromDictionary(language, 'linked_other_accounts')}
                         </Heading>
                         <Text fontSize="$sm" color={textColor}>
                              {getTermFromDictionary(language, 'linked_following_accounts_can_view')}
                         </Text>
                         <FlatList
                              data={viewers}
                              renderItem={({ item }) => <Account account={item} type="viewer" />}
                              ListEmptyComponent={isViewerSuccess ? <LoadingSpinner /> : <Empty />}
                              keyExtractor={(item, index) => index.toString()}
                         />
                    </Box>
               ) : null}

               {user.addLinkedAccountRule !== 2 && user.removeLinkedAccountRule !== 0 ? (
                    <Box pb="$5">
                         <Divider my="$4" />
                         <DisableAccountLinking />
                    </Box>
               ) : null}
          </ScrollView>
     );
};

const Account = ({ account, type }) => {
     const queryClient = useQueryClient();
     const [isRemoving, setIsRemoving] = useState(false);
     const { user } = useContext(UserContext);
     const { library } = useContext(LibrarySystemContext);
     const { language } = useContext(LanguageContext);
     const { textColor } = useContext(ThemeContext);

     const refreshLinkedAccounts = async () => {
          await queryClient.invalidateQueries({ queryKey: ['linked_accounts', user.id, library.baseUrl, language] });
          await queryClient.invalidateQueries({ queryKey: ['viewer_accounts', user.id, library.baseUrl, language] });
          await queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
     };

     const removeAccount = async () => {
          setIsRemoving(true);
          try {
               if (type === 'viewer') {
                    await removeViewerAccount(account.id, library.baseUrl, language);
               } else {
                    await removeLinkedAccount(account.id, library.baseUrl, language);
               }
               await refreshLinkedAccounts();
          } catch (error) {
               logErrorMessage(error);
          } finally {
               setIsRemoving(false);
          }
     };

     if (!account) return null;

     return (
          <HStack justifyContent="space-around" pt="$2" pb="$2" alignItems="center" alignContent="flex-start">
               <Text bold isTruncated w="60%" maxW="60%" color={textColor}>
                    {account.displayName ? account.displayName : account.ils_barcode} - {account.homeLocation}
               </Text>
               {type === 'viewer' && user.removeLinkedAccountRule === 0 ? null : (
                    <Button
                         bgColor="$warning500"
                         isLoading={isRemoving}
                         isLoadingText={getTermFromDictionary(language, 'removing', true)}
                         size="sm"
                         onPress={removeAccount}
                    >
                         <ButtonText color="$white">{getTermFromDictionary(language, 'remove')}</ButtonText>
                    </Button>
               )}
          </HStack>
     );
};
