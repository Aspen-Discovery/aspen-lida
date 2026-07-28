import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
     Box,
     Button,
     ButtonText,
     Divider,
     FlatList,
     Heading,
     HStack,
     ScrollView,
     Text,
     useToast
} from '@gluestack-ui/themed';
import React, { useContext, useLayoutEffect, useState } from 'react';

import { DisplayMessage, DisplaySystemMessage } from '../../../components/Notifications';
import { SystemMessagesContext } from '../../../context/initialContext';
import { useUserState, useAccounts, useViewers, useCards, useUpdateAccounts, useUpdateViewers, useUpdateCards, useUpdateUserProfile } from '../../../hooks/useUserData';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { toArray } from '../../../helpers/helpers';
import { getLinkedAccounts, getViewerAccounts, refreshProfile, removeLinkedAccount, removeViewerAccount } from '../../../util/api/user';
import { formatLinkedAccounts } from '../../../util/api/userHelper';

import AddLinkedAccount from './AddLinkedAccount';
import DisableAccountLinking from './DisableAccountLinking';
import EnableAccountLinking from './EnableAccountLinking';
import { logErrorMessage } from '../../../util/logging';
import { useActiveLanguage } from '../../../hooks/useLanguageData';
import { useTheme } from '../../../themes/theme';

export const MyLinkedAccounts = () => {
     const navigation = useNavigation();
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const { data: accounts } = useAccounts();
     const { data: viewers } = useViewers();
     const library = useLibrary();
     const language = useActiveLanguage();
     const { textColor } = useTheme();
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
               headerLeft: () => <Box /> });
     }, [navigation]);


     const Empty = () => {
          return (
               <Box pt="$3" pb="$5">
                    <Text bold color={textColor}>{getTermFromDictionary(language, 'none')}</Text>
               </Box>
          );
     };

     const showSystemMessage = () => {
          if (Array.isArray(systemMessages)) {
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
                              ListEmptyComponent={<Empty />}
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
     const [isRemoving, setIsRemoving] = useState(false);
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const updateAccounts = useUpdateAccounts();
     const updateViewers = useUpdateViewers();
     const updateUserProfile = useUpdateUserProfile();
     const library = useLibrary();
     const language = useActiveLanguage();
     const { textColor } = useTheme();
     const toast = useToast();

     const refreshLinkedAccounts = async () => {
          const linkedResponse = await getLinkedAccounts(library.baseUrl, language);
          if (linkedResponse?.ok) {
               const formatted = formatLinkedAccounts(user, [], library.barcodeStyle, linkedResponse.data.result.linkedAccounts);
               await updateAccounts(formatted.accounts);
          }

          const viewerResponse = await getViewerAccounts(library.baseUrl, language);
          if (viewerResponse?.ok) {
               const viewerList = toArray(viewerResponse.data?.result?.viewers ?? []);
               await updateViewers(viewerList);
          }

          const profileResponse = await refreshProfile(library.baseUrl);
          if (profileResponse?.ok && profileResponse?.data?.result?.profile) {
               await updateUserProfile(profileResponse.data.result.profile);
          }
     };

     const removeAccount = async () => {
          setIsRemoving(true);
          try {
               if (type === 'viewer') {
                    await removeViewerAccount(toast, account.id, library.baseUrl, language);
               } else {
                    await removeLinkedAccount(toast, account.id, library.baseUrl, language);
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
