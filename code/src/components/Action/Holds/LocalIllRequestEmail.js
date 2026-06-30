import {Button, ButtonText} from '@gluestack-ui/themed';
import React from 'react';
import {navigate} from '../../../helpers/RootNavigator';
import { ThemeContext } from '../../../context/initialContext';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../../../util/logging.js';

export const StartLocalIllRequestEmail = (props) => {
     const { theme } = React.useContext(ThemeContext);
     //logDebugMessage("Props for StartLocalIllRequest");
     //logDebugMessage(props);
     const openLocalIllRequestEmail = () => {
          navigate('CreateLocalIllRequestEmail', {
               id: props.record,
               workTitle: props.workTitle,
               workAuthor: props.workAuthor,
               volumeName: props.volumeName ?? null,
               recordId: props.recordId
          });
     };

     return (
          <Button
               size="md"
               bgColor="$primary500"
               variant="solid"
               minWidth="100%"
               maxWidth="100%"
               onPress={openLocalIllRequestEmail}>
               <ButtonText color="$textLight200" textAlign="center">
                    {props.title}
               </ButtonText>
          </Button>
     );
};
