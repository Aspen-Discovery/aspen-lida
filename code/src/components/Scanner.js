import { useIsFocused } from '@react-navigation/native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { Button, ButtonText, Center, View } from '@gluestack-ui/themed';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import BarcodeMask from 'react-native-barcode-mask';
import { LanguageContext, ThemeContext } from '../context/initialContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { navigateStack, goBack } from '../helpers/RootNavigator';
import { getTermFromDictionary } from '../translations/TranslationService';
import { LoadError } from './loadError';
import { LoadingSpinner } from './loadingSpinner';

export default function Scanner() {
     const navigation = useNavigation();
     const isFocused = useIsFocused();
     const [isLoading, setLoading] = React.useState(false);
     const [permission, requestPermission] = useCameraPermissions();
     const [scanned, setScanned] = React.useState(false);
     const { language } = React.useContext(LanguageContext);
     const { textColor } = React.useContext(ThemeContext);

     let allowedBarcodes = ['upc_a', 'upc_e', 'ean13', 'ean8', 'codabar'];

     React.useEffect(() => {
          if (!permission || permission.status === 'undetermined') {
               requestPermission();
          }
     }, [permission]);

     const handleBarCodeScanned = ({ type, data }) => {
          setLoading(true);
          if (!scanned) {
               data = cleanBarcode(data, type);
               setScanned(true);
               navigateStack('BrowseTab', 'SearchResults', { term: data, type: 'catalog', prevRoute: 'DiscoveryScreen', scannerSearch: true, barcodeType: type });
               setLoading(false);
          } else {
               setLoading(false);
          }
     };

     if (!permission) {
          return (
               <View style={{ flex: 1 }}>
                    <LoadingSpinner message={getTermFromDictionary(language, 'scanner_request_permissions')} />
               </View>
          );
     }

     if (!permission.granted) {
          if (permission.canAskAgain) {
               return (
                    <View style={{ flex: 1 }}>
                         <LoadingSpinner message={getTermFromDictionary(language, 'scanner_request_permissions')} />
                    </View>
               );
          }
          return (
               <View style={{ flex: 1 }}>
                    <LoadError error={getTermFromDictionary(language, 'scanner_denied_permissions')} />
               </View>
          );
     }

     return (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end' }}>
               {isFocused && (
                    <>
                         <CameraView onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} style={[StyleSheet.absoluteFillObject, styles.container]} barcodeScannerSettings={{ barcodeTypes: allowedBarcodes }}>
                              <BarcodeMask edgeColor="#62B1F6" showAnimatedLine={false} />
                              <View style={styles.buttonContainer}>
                                   <Button variant="outline" action="secondary" onPress={() => navigation.goBack()} bgColor="rgba(0,0,0,0.5)" borderColor="$white">
                                        <ButtonText color="$white">Cancel</ButtonText>
                                   </Button>
                                   {scanned && (
                                        <Button onPress={() => setScanned(false)} ml="$4">
                                             <ButtonText>{getTermFromDictionary(language, 'scan_again')}</ButtonText>
                                        </Button>
                                   )}
                              </View>
                         </CameraView>
                    </>
               )}
          </View>
     );
}

const styles = StyleSheet.create({
     container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
     },
     buttonContainer: {
          position: 'absolute',
          bottom: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
     },
});

function cleanBarcode(barcode, type) {
     barcode = barcode.toUpperCase();

     if ((type === 512 || type === '512' || type === 'org.gs1.UPC-A' || type === 'org.gs1.EAN-13') && Platform.OS === 'ios') {
          let firstValue = barcode.charAt(0);
          if (firstValue === '0') {
               barcode = barcode.substring(1);
          }
     }

     return barcode;
}
