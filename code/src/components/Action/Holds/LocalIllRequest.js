import {Button, ButtonText} from '@gluestack-ui/themed';
import React from 'react';
import {navigate} from '../../../helpers/RootNavigator';
import { ThemeContext } from '../../../context/initialContext';

export const StartLocalIllRequest = (props) => {
     //console.log("Props for StartLocalIllRequest");
     //console.log(props);
     const openLocalIllRequest = () => {
          navigate('CreateLocalIllRequest', {
               id: props.record,
               workTitle: props.workTitle,
               volumeId: props.volumeId ?? null,
               volumeName: props.volumeName ?? null
          });
     };
     const { theme } = React.useContext(ThemeContext);

     return (
          <Button
               size="md"
               bgColor={theme['colors']['primary']['500']}
               variant="solid"
               minWidth="100%"
               maxWidth="100%"
               onPress={openLocalIllRequest}>
               <ButtonText color={theme['colors']['primary']['500-text']} textAlign="center">
                    {props.title}
               </ButtonText>
          </Button>
     );
};
