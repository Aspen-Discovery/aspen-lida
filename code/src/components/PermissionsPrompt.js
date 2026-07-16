import * as Linking from 'expo-linking';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, ButtonGroup, ButtonText, Heading, Text } from '@gluestack-ui/themed';
import React from 'react';
import { LanguageContext, ThemeContext } from '../context/initialContext';
import { getTermFromDictionary } from '../translations/TranslationService';

export const PermissionsPrompt = (data) => {
     const { promptTitle, promptBody, setShouldRequestPermissions, updateStatus } = data;
     const { textColor, theme, colorMode } = React.useContext(ThemeContext);
     const { language } = React.useContext(LanguageContext);
     const [isOpen, setIsOpen] = React.useState(true);
     const onClose = () => {
          updateStatus();
          setShouldRequestPermissions(false);
          setIsOpen(false);
     };
     const cancelRef = React.useRef(null);
     return (
          <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
               <AlertDialogBackdrop />
               <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                    <AlertDialogHeader><Heading size="md" color={textColor}>{getTermFromDictionary(language, promptTitle)}</Heading></AlertDialogHeader>
                    <AlertDialogBody><Text color={textColor}>{getTermFromDictionary(language, promptBody)}</Text></AlertDialogBody>
                    <AlertDialogFooter>
                         <ButtonGroup space="md">
                              <Button bgColor={"$coolGray200"} onPress={onClose} ref={cancelRef}>
                                   <ButtonText color={"$coolGray800"}>{getTermFromDictionary(language, 'permissions_cancel')}</ButtonText>
                              </Button>
                              <Button
                                   bgColor="$error700"
                                   onPress={() => {
                                        onClose();
                                        Linking.openSettings();
                                   }}>
                                   <ButtonText color="$white">{getTermFromDictionary(language, 'permissions_update_settings')}</ButtonText>
                              </Button>
                         </ButtonGroup>
                    </AlertDialogFooter>
               </AlertDialogContent>
          </AlertDialog>
     );
};
