// TODO: Remove unused file
import React from 'react';
import { LanguageContext, ThemeContext, UserContext } from '../../context/initialContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { navigateStack } from '../../helpers/RootNavigator';
import { AlertDialog,      AlertDialogBackdrop,
     AlertDialogContent,
     AlertDialogHeader,
     AlertDialogBody,
     AlertDialogFooter, Button, ButtonText, ButtonGroup, Center, Text, Heading } from '@gluestack-ui/themed';
import { getTermFromDictionary } from '../../translations/TranslationService';
import _ from 'lodash';

export const FinishCheckOutSession = () => {
     const navigation = useNavigation();
     const { language } = React.useContext(LanguageContext);
     const { accounts } = React.useContext(UserContext);
     const { textColor, colorMode, theme } = React.useContext(ThemeContext);

     const [isOpen, setIsOpen] = React.useState(useRoute().params?.startNew ?? true);
     const cancelRef = React.useRef(null);

     const StartNewSession = () => {
          setIsOpen(false);
          if (_.size(accounts) >= 1) {
               navigation.replace('StartCheckOutSession', {
                    startNew: true,
               });
          } else {
               navigation.replace('SelfCheckOut', {
                    startNew: true,
                    barcode: null,
               });
          }
     };

     const GoToCheckouts = () => {
          setIsOpen(false);
          navigateStack('AccountScreenTab', 'MyCheckouts');
     };

     return (
          <Center>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={() => StartNewSession()} size="lg">
                    <AlertDialogBackdrop />
                    <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                         <AlertDialogHeader><Heading color={textColor}>{getTermFromDictionary(language, 'finish_checkout_session')}</Heading></AlertDialogHeader>
                         <AlertDialogBody>
                              <Text color={textColor}>{getTermFromDictionary(language, 'finish_checkout_session_body')}</Text>
                         </AlertDialogBody>
                         <AlertDialogFooter>
                              <ButtonGroup space="sm">
                                   <Button size="sm" onPress={() => StartNewSession()} bgColor="$primary500">
                                        <ButtonText color="$textLight200">{getTermFromDictionary(language, 'start_new_session')}</ButtonText>
                                   </Button>
                                   <Button size="sm" bgColor="$primary500" onPress={() => GoToCheckouts()}>
                                        <ButtonText color="$textLight200">{getTermFromDictionary(language, 'view_checkouts')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};
