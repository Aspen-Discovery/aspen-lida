import { useFocusEffect } from '@react-navigation/native';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import _ from 'lodash';
import { Box, FlatList, HStack, Switch, Text } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadingSpinner } from '../../../components/loadingSpinner';
import { createChannelsAndCategories, registerForPushNotificationsAsync } from '../../../components/Notifications';
import { deletePushToken, getNotificationPreference, setNotificationPreference } from '../../../util/api/user';

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
     const { user, updateUser, notificationSettings, updateNotificationSettings, expoToken, aspenToken, userDebugMessage, updateUserDebugMessage} = React.useContext(UserContext);
     const { library } = React.useContext(LibrarySystemContext);
     const [toggled, setToggle] = React.useState(aspenToken);
     const toggleSwitch = () => setToggle((previousState) => !previousState);
     const { language } = React.useContext(LanguageContext);

     useFocusEffect(
          React.useCallback(() => {
               const update = async () => {
                    setLoading(true);
                    logDebugMessage("Creating Channels and Categories as part of Notification Options");

                    await createChannelsAndCategories();
                    if (expoToken && aspenToken) {
                         setToggle(true);
                         await getPreferences();
                    } else {
                         setToggle(false);
                    }
                    setLoading(false);
               };
               update();
          }, [expoToken, aspenToken])
     );

     const updateAspenToken = async () => {
          setLoading(true);
          if (!toggled) {
               logWarnMessage('Toggled is false in updateAspenToken');
               await registerForPushNotificationsAsync(library.baseUrl).then(async (result) => {
                    if (!result) {
                         setToggle(false);
                         logWarnMessage('unable to update preference');
                         setLoading(false);
                         if (Platform.OS === 'android') {
                              if (Device.osVersion < 13) {
                                   updateUserDebugMessage("Showing permissions prompt because platform is android prior to version 13");
                                   setShouldRequestPermissions(true);
                              }else{
                                   updateUserDebugMessage("Not showing permissions prompt because platform is android");
                                   setShouldRequestPermissions(false);
                              }
                         }else if (Platform.OS === 'ios') {
                              updateUserDebugMessage("Showing permissions prompt because platform is ios");
                              setShouldRequestPermissions(true);
                         } else {
                              updateUserDebugMessage("Not showing permissions prompt because platform is not android or ios");
                         }
                         return false;
                    } else {
                         updateUserDebugMessage("Got a result from registerForPushNotificationsAsync, showing preferences");
                         try {
                              await refreshProfile(library.baseUrl).then(async (result) => {
                                   updateUser(result);
                                   await getPreferences();
                              });
                         } catch (error) {
                              updateUserDebugMessage("Error refreshing profile");
                              updateUserDebugMessage(error);
                         }
                         setLoading(false);
                         return true;
                    }
               });
          } else {
               logWarnMessage('Toggled is true in updateAspenToken');
               await deletePushToken(library.baseUrl, expoToken, true);
               await refreshProfile(library.baseUrl).then(async (result) => {
                    updateUser(result);
                    await getPreferences();
               });
               setToggle(false);
               setLoading(false);
               return true;
          }
          setLoading(false);
          return false;
     };

     const getPreferences = async () => {
          updateUserDebugMessage("Getting Preferences");
          setLoading(true);
          if (_.isObject(notificationSettings)) {
               updateUserDebugMessage("Notification Settings are an object");
               const currentPreferences = Object.values(notificationSettings);
               updateUserDebugMessage("There are " + currentPreferences.length + " preferences");
               for await (const pref of currentPreferences) {
                    logDebugMessage(pref.option);
                    const i = _.findIndex(currentPreferences, ['option', pref.option]);
                    const deviceSettings = _.filter(notificationSettings, { option: pref.option });
                    const result = await getNotificationPreference(toast, library.baseUrl, expoToken, pref.option);
                    if (result && i !== -1) {
                         let prevSettings = notificationSettings[i];
                         logDebugMessage(prevSettings.allow);
                         if (result.success) {
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
                         }
                    }
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
                                   updateAspenToken().then((r) => logDebugMessage(r));
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
               await setNotificationPreference(library.baseUrl, expoToken, 'notifySavedSearch', allowAllNotifications, false);
               await setNotificationPreference(library.baseUrl, expoToken, 'notifyCustom', allowAllNotifications, false);
               await setNotificationPreference(library.baseUrl, expoToken, 'notifyAccount', allowAllNotifications, false);
               setNotifySavedSearch(allowAllNotifications);
               setNotifyCustom(allowAllNotifications);
               setNotifyAccount(allowAllNotifications);
               logDebugMessage("Reloading profile as part of enableAllNotifications");
               await reloadProfile(library.baseUrl).then((data) => {
                    updateUser(data);
                    updateNotificationSettings(data.notification_preferences, language);
                    setLoading(false);
               });
               queryClient.invalidateQueries({ queryKey: ['user', library.baseUrl, language] });
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
