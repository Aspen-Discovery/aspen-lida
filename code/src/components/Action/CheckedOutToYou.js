import { Button, ButtonText } from '@gluestack-ui/themed';
import React from 'react';


// custom components and helper files
import { navigate, navigateStack } from '../../helpers/RootNavigator';
import { useTheme } from '../../themes/theme';

export const CheckedOutToYou = (props) => {
     const { theme } = useTheme();
     const handleNavigation = () => {
          if (props.prevRoute === 'DiscoveryScreen' || props.prevRoute === 'SearchResults' || props.prevRoute === 'HomeScreen') {
               navigateStack('AccountScreenTab', 'MyCheckouts', {});
          } else {
               navigate('MyCheckouts', {});
          }
     };

     return (
          <Button minWidth="100%" maxWidth="100%" mb="$1" size="md" bgColor={theme.tokens.colors.primary['500']} variant="solid" onPress={handleNavigation}>
               <ButtonText textAlign="center" p="$0" color={theme.tokens.colors.primary['500-text']}>
                    {props.title}
               </ButtonText>
          </Button>
     );
};
