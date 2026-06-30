import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import _ from 'lodash';
import { Box, Divider, HStack, Icon, Pressable, Text, VStack, ChevronRightIcon } from '@gluestack-ui/themed';
import React from 'react';
import { LanguageContext, LibraryBranchContext, LibrarySystemContext, UserContext } from '../../../context/initialContext';

// custom components and helper files
import { navigate } from '../../../helpers/RootNavigator';
import { UseColorMode } from '../../../themes/theme';
import { getTermFromDictionary, LanguageSwitcher } from '../../../translations/TranslationService';
import { logErrorMessage } from '../../../util/logging';

export const PreferencesScreen = () => {
     const navigation = useNavigation();
     const { library } = React.useContext(LibrarySystemContext);
     const { location } = React.useContext(LibraryBranchContext);
     const { language } = React.useContext(LanguageContext);
     const { user, expoToken, updateExpoToken, updateAspenToken } = React.useContext(UserContext);

     React.useEffect(() => {
          const updateTokens = navigation.addListener('focus', async () => {
               if (Constants.isDevice) {
                    try {
                         const token = (
                              await Notifications.getExpoPushTokenAsync({
                                   projectId: Constants.expoConfig.extra.eas.projectId,
                              })
                         ).data;
                         if (token) {
                              if (!_.isEmpty(user.notification_preferences)) {
                                   const tokenStorage = user.notification_preferences;
                                   if (_.find(tokenStorage, _.matchesProperty('token', token))) {
                                        updateAspenToken(true);
                                        updateExpoToken(token);
                                   }
                              }
                         }
                    } catch (error) {
                         logErrorMessage('Error fetching Expo push token:', error);
                    }
               }
          });
          return updateTokens;
     }, [navigation]);

     return (
          <Box safeArea={5}>
               <VStack divider={<Divider />} space="$md">
                    <VStack space="$md" mx={4} my={8}>
                         <VStack>
                              <Pressable py="$2" onPress={() => navigate('MyPreferences_ManageBrowseCategories')}>
                                   <HStack space="xs" alignItems="center">
                                        <Icon as={MaterialIcons} name="chevron-right" size="xl" />
                                        <Text fontWeight="$medium">{getTermFromDictionary(language, 'manage_browse_categories')}</Text>
                                   </HStack>
                              </Pressable>
                              {library.allowPickupLocationUpdates ? (
                                  <Pressable py="$2" onPress={() => navigate('MyPreferences_ManagePickupLocations')}>
                                       <HStack space="xs" alignItems="center">
                                            <Icon as={MaterialIcons} name="chevron-right" size="xl" />
                                            <Text fontWeight="$medium">{getTermFromDictionary(language, 'manage_pickup_locations')}</Text>
                                       </HStack>
                                  </Pressable>
                              ) : null}
                              <Pressable py="v" onPress={() => navigate('PermissionDashboard')}>
                                   <HStack space="xs" alignItems="center">
                                        <Icon as={MaterialIcons} name="chevron-right" size="xl" />
                                        <Text fontWeight="$medium">{getTermFromDictionary(language, 'device_permissions')}</Text>
                                   </HStack>
                              </Pressable>
                              <Pressable py="$2" onPress={() => navigate('MyDevice_Support')}>
                                   <HStack space="xs" alignItems="center">
                                        <Icon as={MaterialIcons} name="chevron-right" size="xl" />
                                        <Text fontWeight="$medium">{getTermFromDictionary(language, 'support')}</Text>
                                   </HStack>
                              </Pressable>
                         </VStack>
                    </VStack>
                    <VStack space="$md" mx={12} >
                         <HStack justifyContent="space-between" alignItems="center">
                              <Text bold>{getTermFromDictionary(language, 'language')}</Text>
                              <LanguageSwitcher />
                         </HStack>
                         <HStack justifyContent="space-between" alignItems="center">
                              <Text bold>{getTermFromDictionary(language, 'appearance')}</Text>
                              <UseColorMode showText={true} />
                         </HStack>
                    </VStack>
               </VStack>
          </Box>
     );
};
