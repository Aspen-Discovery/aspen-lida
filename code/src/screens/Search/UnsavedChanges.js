import { useNavigation } from '@react-navigation/native';
import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, Button, ButtonText, ButtonGroup, Text, Heading, Center, CloseIcon, Pressable } from '@gluestack-ui/themed';
import React from 'react';

import { SearchGlobal } from '../../util/globals';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { useTheme } from '../../themes/theme';

export const UnsavedChangesExit = (props) => {
     const { updateSearch, discardChanges, language, hasPendingChanges } = props;
     const { theme, colorMode, textColor } = useTheme();
     const navigation = useNavigation();
     const [isOpen, setIsOpen] = React.useState(false);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);

     const closeModal = () => {
          navigation.getParent()?.goBack();
     };

     function getStatus() {
          const pendingChanges = typeof hasPendingChanges === 'function' ? hasPendingChanges() : SearchGlobal.hasPendingChanges;
          if (pendingChanges) {
               // if pending changes found, pop alert to confirm close
               setIsOpen(true);
          } else {
               // if no pending changes, just close it
               closeModal();
          }
     }

     // update parameters, then go to search results screen
     const updateClose = () => {
          updateSearch(false);
          SearchGlobal.hasPendingChanges = false;
          setIsOpen(false);
     };

     // remove pending parameters, then go back to original search results screen
     const forceClose = () => {
          discardChanges();
          setIsOpen(false);
          SearchGlobal.hasPendingChanges = false;
          closeModal();
     };

     return (
          <Center>
               <Pressable onPress={() => getStatus()}>
                    <CloseIcon size="lg" color={textColor} />
               </Pressable>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose} useRNModal={true}>
                    <AlertDialogBackdrop/>
                    <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <AlertDialogHeader>
                              <Heading color={textColor}>{getTermFromDictionary(language, 'discard_changes')}</Heading>
                         </AlertDialogHeader>
                         <AlertDialogBody>
                              <Text color={textColor}>{getTermFromDictionary(language, 'unsaved_changes_warning')}</Text>
                         </AlertDialogBody>
                         <AlertDialogFooter>
                              <ButtonGroup space="sm">
                                   <Button bgColor={theme.tokens.colors.primary['500']} onPress={updateClose} ref={cancelRef}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'save')}</ButtonText>
                                   </Button>
                                   <Button variant="link" onPress={forceClose}>
                                        <ButtonText color="$error500">{getTermFromDictionary(language, 'discard')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};
