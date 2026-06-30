import { Button, ButtonText } from '@gluestack-ui/themed';
import React, {useContext} from 'react';
import { ThemeContext } from '../../context/initialContext';

// custom components and helper files
import { navigate, navigateStack } from '../../helpers/RootNavigator';

export const OnHoldForYou = (props) => {
     const { theme } = React.useContext(ThemeContext);
     const handleNavigation = () => {
          if (props.prevRoute === 'DiscoveryScreen' || props.prevRoute === 'SearchResults' || props.prevRoute === 'HomeScreen') {
               navigateStack('AccountScreenTab', 'MyHolds', {});
          } else {
               navigate('MyHolds', {});
          }
     };

     return (
          <Button minWidth="100%" maxWidth="100%" mb="$1" size="md" bgColor="$primary500" variant="solid" onPress={handleNavigation}>
               <ButtonText textAlign="center" p="$0" color="$textLight200">
                    {props.title}
               </ButtonText>
          </Button>
     );
};
