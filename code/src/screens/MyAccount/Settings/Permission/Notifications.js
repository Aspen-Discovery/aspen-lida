import { ChevronLeftIcon, Switch, ScrollView, AlertDialog, AlertDialogBackdrop, HStack, VStack, Pressable, Icon, Text, Center, Button, ButtonText, ButtonIcon, ButtonGroup, Heading, Box, Accordion, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AccordionItem, AccordionContent, AccordionContentText, AccordionHeader, AccordionTrigger, AccordionTitleText, AccordionIcon, useToast } from '@gluestack-ui/themed';
import React from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { loadingSpinner } from '../../../../components/loadingSpinner';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../../../context/initialContext';
import { useUserState, useNotificationSettings, useUpdateExpoToken, useAddDebugMessage } from '../../../../hooks/useUserData';
import { navigate } from '../../../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../../../translations/TranslationService';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useNotificationPermissions, useNotificationPreferences } from '../../../../hooks/useNotifications';
import {logDebugMessage, logWarnMessage, getErrorMessage, logErrorMessage} from '../../../../util/logging';

export const NotificationPermissionStatus = () => {
    const { language } = React.useContext(LanguageContext);
    const { textColor } = React.useContext(ThemeContext);
    const { library } = React.useContext(LibrarySystemContext);
    const { data: userState } = useUserState();
    const expoToken = userState?.expoToken ?? false;
    const updateExpoToken = useUpdateExpoToken();
    const addDebugMessage = useAddDebugMessage();
    const navigation = useNavigation();

    const { permissionStatus, checkAndUpdatePermissions } = useNotificationPermissions(library, updateExpoToken, updateUserDebugMessage);

    // Check permissions on mount
    React.useEffect(() => {
        const checkStatus = async () => {
            await checkAndUpdatePermissions('Notifications Mount');
        };
        checkStatus();
    }, []);

    // Check permissions when screen comes into focus
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkAndUpdatePermissions('Notifications focus listener');
        });

        return unsubscribe;
    }, [navigation]);

    // Check permissions when tokens change
    React.useEffect(() => {
        checkAndUpdatePermissions('Token change effect');
    }, [expoToken]);

    return (
        <Pressable onPress={() => navigate('PermissionNotificationDescription', { permissionStatus })} pb="$3">
            <HStack space="md" justifyContent="space-between" alignItems="center">
                <Text bold color={textColor}>
                    {getTermFromDictionary(language, 'notification_permission')}
                </Text>
                <HStack alignItems="center">
                    <Text color={textColor}>
                        {permissionStatus ? getTermFromDictionary(language, 'allowed') : getTermFromDictionary(language, 'not_allowed')}
                    </Text>
                    <Icon ml="$1" as={ChevronRight} color={textColor} />
                </HStack>
            </HStack>
        </Pressable>
    );
};

export const NotificationPermissionDescription = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const prevRoute = route.params?.prevRoute ?? null;

    const { theme, textColor } = React.useContext(ThemeContext);
    const { language } = React.useContext(LanguageContext);
    const { library } = React.useContext(LibrarySystemContext);
    const { data: notifSettings } = useNotificationSettings();
    const notificationSettings = notifSettings;
    const expoToken2 = userState?.expoToken ?? false;
    const updateExpoToken2 = useUpdateExpoToken();
    const toast = useToast();

    const {
        permissionStatus,
        isLoading,
        addNotificationPermissions,
        revokeNotificationPermissions
    } = useNotificationPermissions(library, updateExpoToken, updateUserDebugMessage);

    const {
        preferences,
        updatePreference,
        loadPreferences
    } = useNotificationPreferences(toast, library, expoToken);

    React.useLayoutEffect(() => {
        if (prevRoute === 'notifications_onboard') {
            navigation.setOptions({
                headerLeft: () => (
                    <Button
                        bg="transparent"
                        onPress={() => {
                            navigation.goBack();
                        }}
                        mr="$3"
                        p="$1"
                    >
                        <ButtonIcon
                            size="lg"
                            variant="outline"
                            borderWidth={0}
                            color={theme['tokens']['colors']['primary']['baseContrast']}
                            as={ChevronLeftIcon}
                        />
                    </Button>
                ),
            });
        }
    }, [navigation, prevRoute, theme]);



     React.useEffect(() => {
          // Refetch preferences when permission status or expoToken changes
          if (permissionStatus && expoToken) {
               logDebugMessage("Fetching Preferences because permission status or expoToken changed")
               loadPreferences(expoToken);
          }
     }, [permissionStatus, expoToken]);

     const defaultSettings = {
          notifySavedSearch: { option: 'notifySavedSearch', label: getTermFromDictionary(language, 'saved_searches') },
          notifyCustom: { option: 'notifyCustom', label: getTermFromDictionary(language, 'library_updates') },
          notifyAccount: { option: 'notifyAccount', label: getTermFromDictionary(language, 'account_updates') }
     };

     // Use default settings if notificationSettings is not available
     const settings = notificationSettings || defaultSettings;

     /*React.useEffect(() => {
          const checkCurrentPermissions = async () => {
               const { status } = await Notifications.getPermissionsAsync();
               if (status === 'granted') {
                    // Always try to load preferences when permissions are granted
                    if (expoToken) {
                         logDebugMessage("Loading Preferences as part of checkCurrentPermissions " + expoToken);
                         await loadPreferences(expoToken);
                    } else {
                         // If we don't have a token but permissions are granted, try to get one
                         logDebugMessage("Do not have a valid expoToken in checkCurrentPermissions, getting a token");
                         await handlePermissionUpdate();
                    }
               }
          };

          checkCurrentPermissions();
     }, []);*/

     const handlePermissionUpdate = async () => {
          //Will return either false or the expoToken that was added
          const result = await addNotificationPermissions();
          if (result) {
               // Force a preference refresh after permissions are granted
               logDebugMessage("Loading preferences as pert of handlePermissionUpdate");
               await loadPreferences(result);
          }
     };

    // Add effect to check permissions when screen is focused
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkAndUpdatePermissions('Notifications focus effect');
        });

        return unsubscribe;
    }, [navigation]);

    const checkAndUpdatePermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== permissionStatus) {
            // Permission status has changed, update the state
            logDebugMessage('Permission status has changed, updating state, status is "' + status + '"');
            updatePermissionStatus(status === 'granted');
        }
    };

     const updatePermissionStatus = (status) => {
          // This function will update the permission status in the context and trigger a reload of preferences if needed
          if (status) {
               // If permissions are granted, load preferences
               logDebugMessage("Loading preferences as part of updatePermissionStatus")
               loadPreferences();
          } else {
               // If permissions are revoked, you might want to clear preferences or handle it accordingly
               // For now, we'll just log out the user as an example
               logDebugMessage('Permissions revoked, status is ' + status + ' (handling accordingly...)');
          }
     };

     if (isLoading) {
          return loadingSpinner();
     }

    return (
        <ScrollView p="$5">
            <VStack alignItems="stretch">
                <Box>
                    <Text color={textColor}>{getTermFromDictionary(language, 'device_set_to')}</Text>
                    <Heading mb="$1" color={textColor}>
                        {permissionStatus ? getTermFromDictionary(language, 'allowed') : getTermFromDictionary(language, 'not_allowed')}
                    </Heading>
                    <Text color={textColor}>
                        {Constants.expoConfig.name} {permissionStatus ?
                            getTermFromDictionary(language, 'allowed_notification') :
                            getTermFromDictionary(language, 'not_allowed_notification')
                        }
                    </Text>

                    <Text color={textColor} mt="$5">
                        {getTermFromDictionary(language, 'to_update_settings')}
                    </Text>

                    <NotificationPermissionUsage />

                    <Box mb="$5">
                        <NotificationPreferencesSection
                            preferences={preferences}
                            updatePreference={updatePreference}
                            notificationSettings={settings}
                        />
                    </Box>
                </Box>
                <NotificationPermissionUpdate
                    permissionStatus={permissionStatus}
                    addNotificationPermissions={handlePermissionUpdate}
                    revokeNotificationPermissions={revokeNotificationPermissions}
                />
            </VStack>
        </ScrollView>
    );
};

const NotificationPreferencesSection = ({ preferences, updatePreference, notificationSettings }) => {
    const { textColor } = React.useContext(ThemeContext);

    return (
        <>
            {Object.entries(notificationSettings).map(([key, setting]) => (
                <HStack key={key} space="md" justifyContent="space-between" alignItems="center" my="$2">
                    <Text color={textColor}>{setting.label}</Text>
                    <Switch
                        value={preferences[setting.option]}
                        onValueChange={(value) => updatePreference(setting.option, value)}
                    />
                </HStack>
            ))}
        </>
    );
};

const NotificationPermissionUsage = () => {
    const { language } = React.useContext(LanguageContext);
    const { textColor } = React.useContext(ThemeContext);

    return (
        <Accordion variant="unfilled" width="$full" size="sm">
            <AccordionItem value="description">
                <AccordionHeader>
                    <AccordionTrigger px="$0">
                        {({ isExpanded }) => (
                            <>
                                <AccordionTitleText color={textColor}>
                                    {getTermFromDictionary(language, 'how_we_use_notification_title')}
                                </AccordionTitleText>
                                {isExpanded ?
                                    <AccordionIcon as={ChevronUp} ml="$3" color={textColor} /> :
                                    <AccordionIcon as={ChevronDown} ml="$3" color={textColor} />
                                }
                            </>
                        )}
                    </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent px="$0">
                    <AccordionContentText color={textColor}>
                        {Constants.expoConfig.name} {getTermFromDictionary(language, 'how_we_use_notification_body')}
                    </AccordionContentText>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

const NotificationPermissionUpdate = ({ permissionStatus, addNotificationPermissions, revokeNotificationPermissions }) => {
    const { colorMode, theme, textColor } = React.useContext(ThemeContext);
    const { language } = React.useContext(LanguageContext);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [showAlertDialog, setShowAlertDialog] = React.useState(false);

    const handleUpdatePermissions = async () => {
        try {
            setIsUpdating(true);

            if (permissionStatus) {
                await revokeNotificationPermissions();
            } else {
                // First request permissions without any options
                const granted = await addNotificationPermissions();
                if (!granted) {
                    setShowAlertDialog(true);
                }
            }
        } catch (error) {
            logErrorMessage('Error updating permissions:');
            logErrorMessage(error);
            setShowAlertDialog(true);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Center>
            <Button
                onPress={handleUpdatePermissions}
                bgColor={theme.tokens.colors.primary['500']}
                isDisabled={isUpdating}
            >
                <ButtonText color={theme.tokens.colors.primary['500-text']}>
                    {permissionStatus ?
                        getTermFromDictionary(language, 'revoke_device_settings') :
                        getTermFromDictionary(language, 'update_device_settings')}
                </ButtonText>
            </Button>

            <AlertDialog
                isOpen={showAlertDialog}
                onClose={() => setShowAlertDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent
                    bgColor={colorMode === 'light' ?
                        "$warmGray50" :
                        "$coolGray700"}
                >
                    <AlertDialogHeader>
                        <Heading color={textColor}>
                            {getTermFromDictionary(language, 'update_device_settings')}
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text color={textColor}>
                            {Platform.OS === 'android' ?
                                getTermFromDictionary(language, 'update_notification_android') :
                                getTermFromDictionary(language, 'update_notification_ios')}
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup flexDirection="column" alignItems="stretch" width="$full">
                            <Button
                                onPress={() => {
                                    Linking.openSettings();
                                    setShowAlertDialog(false);
                                }}
                                bgColor={theme.tokens.colors.primary['500']}
                            >
                                <ButtonText color={theme.tokens.colors.primary['500-text']}>
                                    {getTermFromDictionary(language, 'open_device_settings')}
                                </ButtonText>
                            </Button>
                            <Button
                                variant="link"
                                onPress={() => setShowAlertDialog(false)}
                            >
                                <ButtonText color={textColor}>
                                    {getTermFromDictionary(language, 'not_now')}
                                </ButtonText>
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Center>
    );
};
