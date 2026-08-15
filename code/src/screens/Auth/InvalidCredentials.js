import { Center, AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, ButtonGroup, ButtonText, Heading, Text } from '@gluestack-ui/themed';

import React from 'react';

import { AuthContext } from '../../context/AuthContext';

import {getTermFromDictionary} from '../../translations/TranslationService';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../../util/logging.js';
import { useActiveLanguage } from '../../hooks/useLanguageData';
import { useTheme } from '../../themes/theme';

export const InvalidCredentials = () => {
     const { theme, colorMode, textColor } = useTheme();
     const language = useActiveLanguage();
     const { signOut } = React.useContext(AuthContext);
     const [isOpen, setIsOpen] = React.useState(true);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);
     logDebugMessage('Showing Invalid Credentials Alert');

     return (
          <Center>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                    <AlertDialogBackdrop/>
                    <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <AlertDialogHeader><Heading color={textColor}>{getTermFromDictionary(language, 'error')}</Heading></AlertDialogHeader>
                         <AlertDialogBody><Text color={textColor}>{getTermFromDictionary(language, 'error_invalid_credentials')}</Text></AlertDialogBody>
                         <AlertDialogFooter>
                              <ButtonGroup space="sm">
                                   <Button bgColor={theme.tokens.colors.primary['500']} onPress={signOut} ref={cancelRef}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};
