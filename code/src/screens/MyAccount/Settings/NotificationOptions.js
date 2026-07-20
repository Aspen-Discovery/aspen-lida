import { useFocusEffect } from '@react-navigation/native';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import _ from 'lodash';
import {Box, FlatList, HStack, Switch, Text, useToast} from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadingSpinner } from '../../../components/loadingSpinner';
import { createChannelsAndCategories, registerForPushNotificationsAsync } from '../../../components/Notifications';
import { deletePushToken, getNotificationPreferences, setNotificationPreference } from '../../../util/api/user';

import { PermissionsPrompt } from '../../../components/PermissionsPrompt';
import { LanguageContext, LibrarySystemContext, UserContext } from '../../../context/initialContext';
import { getTermFromDictionary } from '../../../translations/TranslationService';
import { refreshProfile, reloadProfile } from '../../../util/api/user';

import { logDebugMessage, logWarnMessage } from '../../../util/logging.js';

export const Settings_NotificationOptions = () => {
     const isFetchingUserProfile = useIsFetching({ queryKey: ['user'] });
     const [isLoading, setLoading] = React.useState(false);
     const [error, showError] = React.useState(false);
     const [shouldRequestPermissions, setShouldRequestPermissions] = React.useState(false);
     const [allowNotifications, setAllowNotifications] = React.useState(!Device.isDevice);
     const [notifySavedSearch, setNotifySavedSearch] = React.useState(false);
     const [notifyCustom, setNotifyCustom] = React.useState(false);
     const [notifyAccount, setNotifyAccount] = React.useState(false);
     const { updateUser, notificationSettings, expoToken, updateUserDebugMessage} = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const toggleSwitch = () => setToggle((previousState) => !previousState);
     const { language } = React.useContext(LanguageContext);

     useFocusEffect(
          React.useCallback(() => {
               const update = async () => {
                    setLoading(true);
                    logDebugMessage("Creating Channels and Categories as part of Notification Options " + expoToken);

                    await createChannelsAndCategories();
                    if (expoToken) {
                         await getPreferences();
                    }
                    setLoading(false);
               };
               update();
          }, [expoToken, aspenToken])
     );

     const getPreferences = async () => {
          updateUserDebugMessage("Getting Preferences");
          setLoading(true);
          if (_.isObject(notificationSettings)) {
               updateUserDebugMessage("Notification Settings are an object");
               const result = await getNotificationPreferences(toast, library.baseUrl, expoToken);
               if (result !== false) {
                    if (result?.success) {
                         if (pref.option === 'notifySavedSearch') {
                              setNotifySavedSearch(result.allow);
                              _.set(prevSettings, prevSettings.allow, result.allow);
                              //setPreferences(newSettings);
                         }
                         if (pref.option === 'notifyCustom') {
                              _.set(prevSettings, prevSettings.allow, result.allow);
                              //setPreferences(newSettings);
                              setNotifyCustom(result.allow);
                         }
                         if (pref.option === 'notifyAccount') {
                              _.set(prevSettings, prevSettings.allow, result.allow);
                              //setPreferences(newSettings);
                              setNotifyAccount(result.allow);
                         }
                         logDebugMessage(prevSettings.allow);
                    }else{
                         logDebugMessage("Loading preferences for expoToken failed");
                    }
               }else{
                    logDebugMessage("Did not get preferences for expoToken");
               }
          }else{
               updateUserDebugMessage("Notification Settings were not an object");
          }
          setLoading(false);
     };

     const updateStatus = async () => {
          logDebugMessage("Updating Status in Notification Options");

          await reloadProfile(library.baseUrl).then(async (result) => {
               updateUser(result);
               await getPreferences();
          });
     };

     if (isLoading) {
          return loadingSpinner();
     }

     if (shouldRequestPermissions) {
          return <PermissionsPrompt promptTitle="permissions_notifications_title" promptBody="permissions_notifications_body" setShouldRequestPermissions={setShouldRequestPermissions} updateStatus={updateStatus} />;
     }

     logDebugMessage("Rendering Notification Options");
     return (
          <SafeAreaView style={{ flex: 1 }}>
               <Box flex={1} safeArea={5}>
                    <HStack space={3} pb={3} alignItems="center" justifyContent="space-between">
                         <Text bold>{getTermFromDictionary(language, 'notifications_allow')}</Text>
                         <Switch
                              onToggle={() => {
                                   toggleSwitch();
                              }}
                              defaultValue={toggled}
                              isDisabled={allowNotifications}
                         />
                    </HStack>
                    {toggled && !error && _.isObject(notificationSettings) ? (
                         <VStack space="md" style={{ flex: 1 }}>
                              <EnableAllNotifications setLoading={setLoading} notifySavedSearch={notifySavedSearch} setNotifySavedSearch={setNotifySavedSearch} notifyCustom={notifyCustom} setNotifyCustom={setNotifyCustom} notifyAccount={notifyAccount} setNotifyAccount={setNotifyAccount} />
                              <FlatList data={Object.keys(notificationSettings)} renderItem={({ item }) => <DisplayPreference data={notificationSettings[item]} notifySavedSearch={notifySavedSearch} setNotifySavedSearch={setNotifySavedSearch} notifyCustom={notifyCustom} setNotifyCustom={setNotifyCustom} notifyAccount={notifyAccount} setNotifyAccount={setNotifyAccount} />} keyExtractor={(item, index) => index.toString()} />
                         </VStack>
                    ) : null}
               </Box>
          </SafeAreaView>
     );
};

const EnableAllNotifications = (data) => {
     const queryClient = useQueryClient();
     const { language } = React.useContext(LanguageContext);
     const { user, updateUser, notificationSettings, updateNotificationSettings, expoToken } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { notifySavedSearch, setNotifySavedSearch, notifyCustom, setNotifyCustom, notifyAccount, setNotifyAccount, setLoading } = data;
     const toast = useToast();

     let defaultToggleState = notifyCustom && notifyAccount && notifySavedSearch;
     const [toggled, setToggle] = React.useState(defaultToggleState);
     const toggleSwitch = () => setToggle((previousState) => !previousState);

     const enableAllNotifications = async (value) => {
          logDebugMessage("Enable/Disable All Notifications");
          logDebugMessage(value);
          setLoading(true);
          let allowAllNotifications = true;
          if (value === 0 || value === 'false' || value === false) {
               allowAllNotifications = false;
          }
          if (expoToken) {
               await setNotificationPreference(toast, library.baseUrl, expoToken, 'notifySavedSearch', allowAllNotifications, false);
               await setNotificationPreference(toast, library.baseUrl, expoToken, 'notifyCustom', allowAllNotifications, false);
               await setNotificationPreference(toast, library.baseUrl, expoToken, 'notifyAccount', allowAllNotifications, false);
               setNotifySavedSearch(allowAllNotifications);
               setNotifyCustom(allowAllNotifications);
               setNotifyAccount(allowAllNotifications);
               logDebugMessage("Reloading profile as part of enableAllNotifications");
               //TODO: Update this to not do a full reload of the profile
               await reloadProfile(library.baseUrl).then((data) => {
                    updateUser(data);
                    updateNotificationSettings(data.notification_preferences, language);
                    setLoading(false);
               });
               queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
          }else{
               logDebugMessage("No expoToken in enableAllNotifications");
          }
     };

     logDebugMessage("Rendering enable all notifications switch");
     return (
          <HStack space={3} alignItems="center" justifyContent="space-between" pb={1}>
               <Text bold>{getTermFromDictionary(language, 'notifications_enable_all')}</Text>
               <Switch
                    onToggle={() => {
                         toggleSwitch();
                         enableAllNotifications(!toggled).then((r) => {
                              logDebugMessage(r);
                         });
                    }}
                    defaultValue={toggled}
                    isChecked={toggled}
               />
          </HStack>
     );
};

const DisplayPreference = (data) => {
     const { user, updateUser, notificationSettings, updateNotificationSettings, expoToken } = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const preference = data.data;
     const { notifySavedSearch, setNotifySavedSearch, notifyCustom, setNotifyCustom, notifyAccount, setNotifyAccount } = data;

     let defaultToggleState = false;
     logDebugMessage(preference.allow);
     defaultToggleState = preference.allow === 1 || preference.allow === '1' || preference.allow === true || preference.allow === 'true';

     if (preference.option === 'notifySavedSearch') {
          defaultToggleState = notifySavedSearch;
     } else if (preference.option === 'notifyCustom') {
          defaultToggleState = notifyCustom;
     } else if (preference.option === 'notifyAccount') {
          defaultToggleState = notifyAccount;
     }

     const [toggled, setToggle] = React.useState(defaultToggleState);
     const toggleSwitch = () => setToggle((previousState) => !previousState);

     const updatePreference = async (pref, value) => {
          logDebugMessage("Updating Preference");
          logDebugMessage(pref);
          logDebugMessage(value);
          let allowNotification = true;
          if (value === 0) {
               allowNotification = true;
          } else {
               allowNotification = false;
          }
          if (expoToken) {
               await setNotificationPreference(library.baseUrl, expoToken, pref, allowNotification);
               if (pref === 'notifySavedSearch') {
                    setNotifySavedSearch(value);
               }
               if (pref === 'notifyCustom') {
                    setNotifyCustom(value);
               }
               if (pref === 'notifyAccount') {
                    setNotifyAccount(value);
               }
               logDebugMessage("Reloading Profile as part of updatePreference")
               await reloadProfile(library.baseUrl).then((result) => {
                    updateUser(result);
               });
          }else{
               logDebugMessage("No expo token in NotificationOptions->updatePreference");
          }
     };

     logDebugMessage("Rendering notification preferences");
     return (
          <HStack space={3} alignItems="center" justifyContent="space-between" pb={1}>
               <Text>{preference.label}</Text>
               <Switch
                    onToggle={() => {
                         toggleSwitch();
                         updatePreference(preference.option, preference.allow).then((r) => {
                              logDebugMessage(r);
                         });
                    }}
                    isChecked={toggled}
               />
          </HStack>
     );
};
