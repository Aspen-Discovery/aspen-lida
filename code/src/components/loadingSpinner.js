import React from 'react';
import { Center, Heading, HStack, VStack, Spinner } from '@gluestack-ui/themed';
import { ThemeContext } from '../context/initialContext';
import {isEmpty, isUndefined} from 'lodash';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../util/logging.js';
/*
TODO: Translate the accessibility labels
*/

export function loadingSpinner(message = '') {
     return <LoadingSpinner message={message} />;
}

export const LoadingSpinner = (props) => {
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);
     if (!isUndefined(props) && !isEmpty(props) && !isUndefined(props.message) && !isEmpty(props.message)) {
          logDebugMessage("Showing loading spinner with message: " + props.message);
          return (
               <Center flex={1} px="$3">
                    <VStack space="md" alignItems="center">
                         <Spinner size="large" color={theme.tokens.colors.primary['500']} accessibilityLabel="Loading..." />
                         <Heading size="md" color={textColor}>
                              {props.message}
                         </Heading>
                    </VStack>
               </Center>
          );
     }

     return (
          <Center flex={1}>
               <HStack>
                    <Spinner color={theme.tokens.colors.primary['500']} size="large" accessibilityLabel="Loading..." />
               </HStack>
          </Center>
     );
};
