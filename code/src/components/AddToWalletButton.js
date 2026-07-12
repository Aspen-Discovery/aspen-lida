import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, ButtonIcon, ButtonText, Spinner } from '@gluestack-ui/themed';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Platform } from 'react-native';

import { LibrarySystemContext, ThemeContext } from '../context/initialContext';
import { fetchWalletPass } from '../util/api/user';
import { logDebugMessage, logErrorMessage } from '../util/logging';
import { popToast } from './loadError';

/**
 * "Add to Apple Wallet" / "Add to Google Wallet" button for the digital library card.
 *
 * Hidden unless the server advertises support via library.enableWalletPass (returned by
 * SystemAPI getLibraryInfo — see WALLET-PASS-SPEC.md), so this component is safe to ship
 * before the Aspen Discovery server side exists: it simply renders nothing. The optional
 * library.walletPassPlatforms field ("apple", "google", or "apple,google") limits which
 * platform shows the button; when absent, both are assumed.
 *
 * iOS flow:     UserAPI getPatronWalletPass (platform=apple) returns a base64-encoded,
 *               server-signed .pkpass → written to the cache directory → handed to iOS via
 *               the share sheet, which recognizes the pkpass UTI and offers "Add to Wallet".
 * Android flow: UserAPI getPatronWalletPass (platform=google) returns a signed-JWT
 *               "Save to Google Wallet" link (result.saveUrl) → opened with Linking; the
 *               Google Wallet app (or browser fallback) handles the save.
 * No native modules required on either platform.
 *
 * TODO before release: swap the styled button for the official "Add to Apple Wallet" /
 * "Add to Google Wallet" badge artwork (required by both Apple's and Google's brand
 * guidelines) and source the labels from translation terms.
 */
export const AddToWalletButton = (props) => {
     const { card } = props;
     const [isLoading, setIsLoading] = React.useState(false);
     const { library } = React.useContext(LibrarySystemContext);
     const { theme } = React.useContext(ThemeContext);

     const platformKey = Platform.OS === 'ios' ? 'apple' : 'google';
     const walletPassEnabled = library?.enableWalletPass === '1' || library?.enableWalletPass === 1 || library?.enableWalletPass === true;
     const supportedPlatforms = String(library?.walletPassPlatforms ?? 'apple,google').toLowerCase();
     if (!walletPassEnabled || !supportedPlatforms.includes(platformKey)) {
          return null;
     }

     const barcode = card?.ils_barcode ?? card?.cat_username ?? null;
     const buttonLabel = platformKey === 'apple' ? 'Add to Apple Wallet' : 'Add to Google Wallet';

     const addToWallet = async () => {
          setIsLoading(true);
          try {
               const response = await fetchWalletPass(library?.baseUrl, barcode, platformKey);
               const result = response?.data?.result;

               if (platformKey === 'google') {
                    if (response?.ok && result?.success && result?.saveUrl) {
                         // Google Wallet (or a browser fallback) handles the signed save link
                         await Linking.openURL(result.saveUrl);
                    } else {
                         const message = result?.message ?? 'The library card pass could not be created. Please try again or contact the library.';
                         popToast('Unable to add card to Wallet', message, 'error');
                         logDebugMessage(response);
                    }
               } else if (response?.ok && result?.success && result?.passData) {
                    const fileUri = FileSystem.cacheDirectory + (result.fileName ?? 'library-card.pkpass');
                    await FileSystem.writeAsStringAsync(fileUri, result.passData, { encoding: FileSystem.EncodingType.Base64 });

                    if (await Sharing.isAvailableAsync()) {
                         await Sharing.shareAsync(fileUri, {
                              UTI: 'com.apple.pkpass',
                              mimeType: 'application/vnd.apple.pkpass',
                              dialogTitle: 'Add to Apple Wallet',
                         });
                    } else {
                         popToast('Unable to open pass', 'Sharing is not available on this device.', 'error');
                    }
               } else {
                    // the server explains failures it can predict, e.g. a barcode format
                    // Apple Wallet cannot render (CODE39) — surface its message when present
                    const message = result?.message ?? 'The library card pass could not be created. Please try again or contact the library.';
                    popToast('Unable to add card to Wallet', message, 'error');
                    logDebugMessage(response);
               }
          } catch (e) {
               logErrorMessage('Error adding card to wallet');
               logErrorMessage(e);
               popToast('Unable to add card to Wallet', 'An unexpected error occurred. Please try again.', 'error');
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <Button mt="$2" size="sm" variant="outline" isDisabled={isLoading || !barcode} onPress={addToWallet}>
               {isLoading ? <Spinner size="small" mr="$1" /> : <ButtonIcon mr="$1" as={MaterialCommunityIcons} name="wallet-plus" color={theme['colors']['primary']['500']} />}
               <ButtonText color={theme['colors']['primary']['500']}>{buttonLabel}</ButtonText>
          </Button>
     );
};
