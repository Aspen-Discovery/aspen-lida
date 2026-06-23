import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {
     Button,
     ButtonText,
     Center,
     FormControl,
     FormControlLabel,
     FormControlLabelText,
     Input,
     InputField, InputIcon,
     InputSlot,
} from '@gluestack-ui/themed';
import React, { useRef } from 'react';

// custom components and helper files
import { AuthContext } from '../../components/navigation';
import { DisplayMessage } from '../../components/Notifications';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import { navigate } from '../../helpers/RootNavigator';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getLocationInfo, getCatalogStatus } from '../../util/api/system';
import { loginToLiDA } from '../../util/api/user';
import { stripHTML } from '../../helpers/helpers';
import { GLOBALS, LIBRARY, PATRON } from '../../util/globals';
import { formatDiscoveryVersion } from '../../helpers/helpers';
import { ResetExpiredPin } from './ResetExpiredPin';

import { logDebugMessage, logInfoMessage, logWarnMessage, getErrorMessage } from '../../util/logging.js';
import { createApiClient } from '../../util/api/apiFactory';

export const GetLoginForm = (props) => {
     const {theme, textColor, colorMode} = React.useContext(ThemeContext);
     const navigation = useNavigation();
     const barcode = useRoute().params?.barcode ?? null;
     const [loading, setLoading] = React.useState(false);
     const [loadingDefaultUsername, setLoadingDefaultUsername] = React.useState(false);

     const [pinValidationRules, setPinValidationRules] = React.useState([]);
     const [expiredPin, setExpiredPin] = React.useState(false);
     const [resetToken, setResetToken] = React.useState('');
     const [userId, setUserId] = React.useState('');

     const [loginError, setLoginError] = React.useState(false);
     const [loginErrorMessage, setLoginErrorMessage] = React.useState('');

     // securely set and store key:value pairs
     const [username, setUsername] = React.useState('');
     const [valueSecret, setPassword] = React.useState('');

     // show:hide data from password field
     const [showPassword, setShowPassword] = React.useState(false);
     const toggleShowPassword = () => setShowPassword(!showPassword);

     // make ref to move the user to next input field
     const passwordRef = useRef();
     const { signIn } = React.useContext(AuthContext);
     const { updateCatalogStatus, catalogStatus, updateLibrary   } = React.useContext(LibrarySystemContext);
     const { updateLanguage } = React.useContext(LanguageContext);
     const patronsLibrary = props.selectedLibrary;

     const { usernameLabel, passwordLabel, allowBarcodeScanner, allowCode39, updateSelectedLibrary } = props;

     React.useEffect(() => {
          const loadDefaultUsername = async () => {
               try {
                    const defaultUsername = await SecureStore.getItemAsync('defaultUsername');
                    if (barcode)
                    {
                         setUsername(barcode);
                    }
                    else if (defaultUsername !== null && defaultUsername) {
                         setUsername(defaultUsername); // Set the retrieved username
                         //logDebugMessage("Default username is: " + defaultUsername);
                    }
               } catch (error) {
                    logWarnMessage("Error loading saved username:", error);
               } finally {
                    setLoadingDefaultUsername(false); // Stop loading regardless of success/failure
               }
          };

          loadDefaultUsername();
     }, [barcode]);

     const initialValidation = async () => {
          setLoginError(false);
          setLoginErrorMessage('');
          updateCatalogStatus({
               message: null,
               status: 0,
          });
          logInfoMessage ("Base Url is: " + patronsLibrary['baseUrl'] + " library is: " + patronsLibrary['libraryId']);
          const result = await checkAspenDiscovery(patronsLibrary['baseUrl'], patronsLibrary['libraryId']);
          if (result.ok) {
               const libraryInfo = result.data?.result?.library;
               updateLibrary(libraryInfo);
               LIBRARY.id = patronsLibrary['libraryId'];
               LIBRARY.url = patronsLibrary['baseUrl'];
               LIBRARY.version = formatDiscoveryVersion(libraryInfo.discoveryVersion);
               logDebugMessage("Successfully received library info");

               // check if catalog is in offline mode
               logDebugMessage("Checking if catalog is offline baseUrl:" + patronsLibrary['baseUrl'] );
               const catalogResponse = await getCatalogStatus(patronsLibrary['baseUrl']);
               if (catalogResponse.ok) {
                    let catalogMessage = null;
                    if (catalogResponse.data.result?.api?.message) {
                         catalogMessage = stripHTML(catalogResponse.data.result.api.message);
                    }
                    let status = catalogResponse.data.result?.catalogStatus ?? 0;
                    const currentStatus = {
                         status: status,
                         message: catalogMessage
                    }
                    logDebugMessage('Catalog status: ' + JSON.stringify(currentStatus));
                    updateCatalogStatus(currentStatus);
                    if (currentStatus.status >= 1) {
                         // catalog is offline
                         logInfoMessage('catalog is offline');
                         setLoading(false);
                         setLoginError(true);
                         if (currentStatus.message) {
                              let tmp = stripHTML(currentStatus.message);
                              tmp = tmp.trim();
                              setLoginErrorMessage(tmp);
                         } else {
                              getTermFromDictionary('en', 'catalog_offline_message');
                         }
                         return;
                    } else {
                         logInfoMessage('Catalog online');
                         logDebugMessage(catalogStatus);
                         updateCatalogStatus({
                              status: 0,
                              message: null,
                         });
                    }
               }else{
                    logDebugMessage('Could not get catalog status');
                    getErrorMessage(catalogResponse.code, catalogResponse.problem);
               }

               setPinValidationRules(libraryInfo.pinValidationRules);
               const loginResults = await loginToLiDA(username, valueSecret, patronsLibrary['baseUrl']);
               if (loginResults.ok) {
                    const validatedUser = loginResults.data.result;
                    if(validatedUser) {
                         logInfoMessage("Successfully logged in");
                         GLOBALS.appSessionId = validatedUser.session ?? '';
                         PATRON.language = validatedUser.lang ?? 'en';
                         PATRON.homeLocationId = validatedUser.homeLocationId ?? null;
                         updateLanguage(validatedUser.lang ?? 'en');
                         if (validatedUser.success) {
                              await setAsyncStorage();
                              signIn();
                              setLoading(false);
                         } else {
                              if (validatedUser.resetToken) {
                                   logInfoMessage('Expired pin!');
                                   setResetToken(validatedUser.resetToken);
                                   setUserId(validatedUser.userId);
                                   setExpiredPin(true);
                                   setLoading(false);
                              } else {
                                   logInfoMessage(validatedUser.message);
                                   setLoginError(true);
                                   setLoginErrorMessage(validatedUser.message);
                                   setLoading(false);
                              }
                         }
                    }
               }else{
                    const error = getErrorMessage(loginResults.code, loginResults.problem);
                    setLoginError(true);
                    setLoginErrorMessage(error.message);
                    setLoading(false);
                    logDebugMessage("Error logging in user");
                    logDebugMessage(loginResults);
               }
          } else {
               const error = getErrorMessage(result.code, result.problem);
               logDebugMessage("Error fetching library info as a pre-login check in initialValidation");
               logDebugMessage(result);
               setLoading(false);
               setLoginError(true);
               setLoginErrorMessage(error.message);
          }
     };

     const openScanner = async () => {
          navigate('LibraryCardScanner', { allowCode39 });
     };

     const setAsyncStorage = async () => {
          await SecureStore.setItemAsync('userKey', username);
          await SecureStore.setItemAsync('secretKey', valueSecret);
          await AsyncStorage.setItem('@lastStoredVersion', Constants.expoConfig.version);
          const autoPickUserHomeLocation = parseInt(LIBRARY.appSettings?.autoPickUserHomeLocation ?? 0);

          if (PATRON.homeLocationId && !GLOBALS.slug.startsWith('aspen-lida') && autoPickUserHomeLocation === 1) {
               logDebugMessage('User has a home location set (' + PATRON.homeLocationId + ') and autoPickUserHomeLocation is enabled, attempting to use that location as default');
               await getLocationInfo(LIBRARY.url, PATRON.homeLocationId).then(async (response) => {
                    const patronHomeLocation = response.data.result.location;
                    if (typeof patronHomeLocation.baseUrl !== 'undefined') {
                         logDebugMessage('Successfully retrieved location info for user home location while logging in, setting asyncStorage library and location to: ' + patronHomeLocation.displayName + ' (' + patronHomeLocation.libraryId + ')');
                         updateSelectedLibrary(patronHomeLocation);
                         LIBRARY.url = patronHomeLocation.baseUrl;
                         LIBRARY.id = patronHomeLocation.libraryId;
                         await SecureStore.setItemAsync('library', JSON.stringify(patronHomeLocation.libraryId));
                         await AsyncStorage.setItem('@libraryId', JSON.stringify(patronHomeLocation.libraryId));
                         await SecureStore.setItemAsync('libraryName', patronHomeLocation.displayName);
                         await SecureStore.setItemAsync('locationId', JSON.stringify(patronHomeLocation.locationId));
                         await AsyncStorage.setItem('@locationId', JSON.stringify(patronHomeLocation.locationId));
                         await SecureStore.setItemAsync('solrScope', patronHomeLocation.solrScope);
                         await AsyncStorage.setItem('@solrScope', patronHomeLocation.solrScope);
                         await AsyncStorage.setItem('@pathUrl', patronHomeLocation.baseUrl);
                    } else {
                         // just store what we know
                         logDebugMessage('Problem getting location info for user home location. Setting library and location to: ' + patronsLibrary['name']);
                         LIBRARY.url = patronsLibrary['baseUrl'];
                         LIBRARY.id = patronsLibrary['libraryId'];
                         await SecureStore.setItemAsync('library', patronsLibrary['libraryId']);
                         await AsyncStorage.setItem('@libraryId', patronsLibrary['libraryId']);
                         await SecureStore.setItemAsync('libraryName', patronsLibrary['name']);
                         await SecureStore.setItemAsync('locationId', patronsLibrary['locationId']);
                         await AsyncStorage.setItem('@locationId', patronsLibrary['locationId']);
                         await SecureStore.setItemAsync('solrScope', patronsLibrary['solrScope']);
                         await AsyncStorage.setItem('@solrScope', patronsLibrary['solrScope']);
                         await AsyncStorage.setItem('@pathUrl', patronsLibrary['baseUrl']);
                    }
               });
          } else {
               logDebugMessage('No home location set for user or autoPickUserHomeLocation is disabled, setting library and location to: ' + patronsLibrary['name']);
               LIBRARY.url = patronsLibrary['baseUrl'];
               LIBRARY.id = patronsLibrary['libraryId'];
               updateSelectedLibrary(patronsLibrary);
               await SecureStore.setItemAsync('library', patronsLibrary['libraryId']);
               await AsyncStorage.setItem('@libraryId', patronsLibrary['libraryId']);
               await SecureStore.setItemAsync('libraryName', patronsLibrary['name']);
               await SecureStore.setItemAsync('locationId', patronsLibrary['locationId']);
               await AsyncStorage.setItem('@locationId', patronsLibrary['locationId']);
               await SecureStore.setItemAsync('solrScope', patronsLibrary['solrScope']);

               await AsyncStorage.setItem('@solrScope', patronsLibrary['solrScope']);
               await AsyncStorage.setItem('@pathUrl', patronsLibrary['baseUrl']);
          }
     };

     if (expiredPin) {
          return <ResetExpiredPin username={username} userId={userId} resetToken={resetToken} url={patronsLibrary['baseUrl']} pinValidationRules={pinValidationRules} setExpiredPin={setExpiredPin} patronsLibrary={patronsLibrary} />;
     }

     return (
          <>
               {loginError ? <DisplayMessage type="error" message={loginErrorMessage} /> : null}
               <FormControl>
                    <FormControlLabel>
                         <FormControlLabelText fontSize="$sm" color={textColor}>{usernameLabel}</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                         <InputField autoCapitalize="none"
                              size="$xl"
                              autoCorrect={false}
                              variant="filled"
                              id="barcode"
                              value={username}
                              default={username}
                              onChangeText={(text) => {SecureStore.setItemAsync('defaultUsername', text); setUsername(text);}}
                              returnKeyType="next"
                              textContentType="username"
                              onSubmitEditing={() => {
                                   passwordRef.current.focus();
                              }}
                              blurOnSubmit={false}
                              color={textColor}
                                     autoComplete="username"
                         />
                         {allowBarcodeScanner ?
                              <InputSlot onPress={() => openScanner()}>
                              <InputIcon as={Ionicons} name="barcode-outline" mr="$2" color={textColor} />
                         </InputSlot> : null}
                    </Input>
               </FormControl>
               <FormControl mt="$3">
                    <FormControlLabel>
                         <FormControlLabelText size="sm" color={textColor}>{passwordLabel}</FormControlLabelText>
                    </FormControlLabel>
                    <Input borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}>
                         <InputField variant="filled"
                              size="$xl"
                              type={showPassword ? 'text' : 'password'}
                              returnKeyType="go"
                              textContentType="password"
                              ref={passwordRef}
                              onChangeText={(text) => setPassword(text)}
                              onSubmitEditing={async () => {
                                   setLoading(true);
                                   await initialValidation();
                              }}
                              color={textColor} autoComplete="password"
                         />
                         <InputSlot onPress={toggleShowPassword}>
                              <InputIcon as={Ionicons} name={showPassword ? 'eye-outline' : 'eye-off-outline'} mr="$2" color={textColor} />
                         </InputSlot>
                    </Input>
               </FormControl>

               <Center>
                    <Button
                         mt="$3"
                         size="md"
                         bgColor={theme['colors']['primary']['500']}
                         isLoading={loading}
                         isLoadingText={getTermFromDictionary('en', 'logging_in', true)}
                         onPress={async () => {
                              setLoading(true);
                              await initialValidation();
                         }}>
                         <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary('en', 'login')}</ButtonText>
                    </Button>
               </Center>
          </>
     );
};

async function checkAspenDiscovery(url, id) {
     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutFast,
     });
     return await client.get('/SystemAPI?method=getLibraryInfo', { id });
}
