import Constants from 'expo-constants';
import { Center, Image, Spinner, VStack } from '@gluestack-ui/themed';
import { getTermFromDictionary } from '../../translations/TranslationService';

const splashImage = Constants.expoConfig.extra.loginLogo;
const splashBackgroundColor = Constants.expoConfig.splash.backgroundColor;

export const SplashScreen = () => {
     return (
          <Center testID="splash-center" flex={1} px="$3" style={{ backgroundColor: splashBackgroundColor }}>
               <VStack space="md" alignItems="center">
                    <Image source={{ uri: splashImage }} size="2xl" alt={getTermFromDictionary('en', 'app_name')} />
                    <Spinner size="small" />
               </VStack>
          </Center>
     );
};
