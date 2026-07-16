import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogBackdrop, Button, ButtonGroup, ButtonText, Center, Heading, Text } from '@gluestack-ui/themed';
import React from 'react';
import { AuthContext } from '../../context/AuthContext';
import _ from 'lodash';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { logInfoMessage } from '../../util/logging';

export const CatalogOffline = () => {
     const { language } = React.useContext(LanguageContext);
     const { catalogStatus, catalogStatusMessage } = React.useContext(LibrarySystemContext);
     const { signOut } = React.useContext(AuthContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const [isOpen, setIsOpen] = React.useState(true);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);

     logInfoMessage('CatalogOffline: ' + catalogStatus);

     if (catalogStatus > 0 && !_.isUndefined(theme)) {
          return (
               <Center>
                    <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                         <AlertDialogBackdrop />

                         <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                              <AlertDialogHeader>
                                   <Heading color={textColor}>{getTermFromDictionary(language, 'catalog_offline')}</Heading>
                              </AlertDialogHeader>
                              <AlertDialogBody>
                                   <Text color={textColor}>{catalogStatusMessage ? catalogStatusMessage : getTermFromDictionary(language, 'catalog_offline_message')}</Text>
                              </AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="md">
                                        <Button onPress={signOut} bgColor={theme.tokens.colors.primary['500']} ref={cancelRef}>
                                             <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
               </Center>
          );
     }

     if (catalogStatus > 0) {
          return (
               <Center>
                    <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                         <AlertDialogBackdrop />

                         <AlertDialogContent>
                              <AlertDialogHeader>
                                   <Heading>{getTermFromDictionary(language, 'catalog_offline')}</Heading>
                              </AlertDialogHeader>
                              <AlertDialogBody>
                                   <Text>{catalogStatusMessage ? catalogStatusMessage : getTermFromDictionary(language, 'catalog_offline_message')}</Text>
                              </AlertDialogBody>
                              <AlertDialogFooter>
                                   <ButtonGroup space="md">
                                        <Button onPress={signOut} ref={cancelRef}>
                                             <ButtonText>{getTermFromDictionary(language, 'button_ok')}</ButtonText>
                                        </Button>
                                   </ButtonGroup>
                              </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
               </Center>
          );
     }

     return null;
};
