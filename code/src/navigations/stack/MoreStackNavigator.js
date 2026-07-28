import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BackIcon } from '../../themes/theme';
import { getTermFromDictionary } from '../../translations/TranslationService';
import TitleWithLogo from '../../components/TitleWithLogo';
import { AllLocations } from '../../screens/Library/AllLocations';
import { Location } from '../../screens/Library/Location';
import { MyLibrary } from '../../screens/Library/MyLibrary';
import { MoreMenu } from '../../screens/More/MoreMenu';
import { Settings_BrowseCategories } from '../../screens/MyAccount/Settings/BrowseCategories';
import { Settings_LanguageScreen } from '../../screens/MyAccount/Settings/Language';
import { CalendarPermissionDescription } from '../../screens/MyAccount/Settings/Permission/Calendar';
import { CameraPermissionDescription } from '../../screens/MyAccount/Settings/Permission/Camera';
import { GeolocationPermissionDescription } from '../../screens/MyAccount/Settings/Permission/Geolocation';
import { NotificationPermissionDescription } from '../../screens/MyAccount/Settings/Permission/Notifications';
import { ScreenBrightnessPermissionDescription } from '../../screens/MyAccount/Settings/Permission/ScreenBrightness';
import { PermissionsDashboard } from '../../screens/MyAccount/Settings/Permissions';
import { PreferencesScreen } from '../../screens/MyAccount/Settings/Preferences';
import { SupportScreen } from '../../screens/MyAccount/Settings/Support';
import {Settings_PickupLocations} from "../../screens/MyAccount/Settings/PickupLocations";
import { APIErrorLog } from '../../screens/MyAccount/Settings/Logs/APIErrorLog';
import { useActiveLanguage } from '../../hooks/useLanguageData';

const MoreStackNavigator = () => {
     const language = useActiveLanguage();
     const Stack = createNativeStackNavigator();
     return (
          <Stack.Navigator
               initialRouteName="MoreMenu"
               screenOptions={({ navigation, route }) => ({
                    headerShown: true,
                    headerBackTitleVisible: false,
                    gestureEnabled: false,
                    headerBackImage: () => <BackIcon />,
               })}>
               <Stack.Screen
                    name="MoreMenu"
                    component={MoreMenu}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'nav_more');
                              return <TitleWithLogo title={title} hideBack={true} />;
                         },
                         //title: getTermFromDictionary(language, 'nav_more')
                    }}
               />
               <Stack.Screen
                    name="AllLocations"
                    component={AllLocations}
                    options={({ route }) => ({
                         header: () => {
                              const title = getTermFromDictionary(language, 'locations');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: getTermFromDictionary(language, 'locations'),
                    })}
               />
               <Stack.Screen
                    name="Location"
                    component={Location}
                    options={({ route }) => ({
                         header: () => {
                              const title = route?.params?.title ?? getTermFromDictionary(language, 'location');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route?.params?.title ?? getTermFromDictionary(language, 'location'),
                    })}
               />
               <Stack.Screen
                    name="MyLibrary"
                    component={MyLibrary}
                    options={({ route }) => ({
                         header: () => {
                              const title = route?.params?.title ?? getTermFromDictionary(language, 'my_library');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route?.params?.title ?? getTermFromDictionary(language, 'my_library'),
                    })}
               />
               <Stack.Group>
                    <Stack.Screen
                         name="MyPreferences"
                         component={PreferencesScreen}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'preferences');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'preferences')
                         }}
                    />
                    <Stack.Screen
                         name="MyPreferences_ManageBrowseCategories"
                         component={Settings_BrowseCategories}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'manage_browse_categories');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'manage_browse_categories')
                         }}
                    />
                   <Stack.Screen
                       name="MyPreferences_ManagePickupLocations"
                       component={Settings_PickupLocations}
                       options={{
                           header: () => {
                               const title = getTermFromDictionary(language, 'manage_pickup_locations');
                               return <TitleWithLogo title={title} />;
                           },
                       }}
                   />
                    <Stack.Screen
                         name="MyPreferences_Language"
                         component={Settings_LanguageScreen}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'manage_language');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'manage_browse_categories')
                         }}
                    />
                    <Stack.Screen
                         name="MyPreferences_Appearance"
                         component={Settings_BrowseCategories}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'manage_appearance');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'manage_browse_categories')
                         }}
                    />
                    <Stack.Screen
                         name="MyDevice_Support"
                         component={SupportScreen}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'support');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'support')
                         }}
                    />
                    <Stack.Screen
                         name="MyDevice_APIErrorLog"
                         component={APIErrorLog}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'api_error_log');
                                   return <TitleWithLogo title={title} />;
                              },
                         }}
                    />
               </Stack.Group>
               <Stack.Group>
                    <Stack.Screen
                         name="PermissionDashboard"
                         component={PermissionsDashboard}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'device_permissions');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'device_permissions')
                         }}
                    />
                    <Stack.Screen
                         name="PermissionCameraDescription"
                         component={CameraPermissionDescription}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'camera_permission');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'camera_permission')
                         }}
                    />
                    <Stack.Screen
                         name="PermissionCalendarDescription"
                         component={CalendarPermissionDescription}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'calendar_permission');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'calendar_permission')
                         }}
                    />
                    <Stack.Screen
                         name="PermissionGeolocationDescription"
                         component={GeolocationPermissionDescription}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'geolocation_permission');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'geolocation_permission')
                         }}
                    />
                    <Stack.Screen
                         name="PermissionNotificationDescription"
                         component={NotificationPermissionDescription}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'notification_permission');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'notification_permission')
                         }}
                    />
                    <Stack.Screen
                         name="PermissionScreenBrightnessDescription"
                         component={ScreenBrightnessPermissionDescription}
                         options={{
                              header: () => {
                                   const title = getTermFromDictionary(language, 'screen_brightness_permission');
                                   return <TitleWithLogo title={title} />;
                              },
                              //title: getTermFromDictionary(language, 'screen_brightness_permission')
                         }}
                    />
               </Stack.Group>
          </Stack.Navigator>
     );
};

export default MoreStackNavigator;
