// TODO: Remove unused file
import React from 'react';
import { ThemeContext } from '../../context/initialContext';
import { useAccounts } from '../../hooks/useUserData';
import { useRoute, useNavigation } from '@react-navigation/native';
import { navigateStack } from '../../helpers/RootNavigator';
import { AlertDialog,      AlertDialogBackdrop,
     AlertDialogContent,
     AlertDialogHeader,
     AlertDialogBody,
     AlertDialogFooter, Button, ButtonText, ButtonGroup, Center, Text, Heading } from '@gluestack-ui/themed';
import { getTermFromDictionary } from '../../translations/TranslationService';
import _ from 'lodash';
import { useActiveLanguage } from '../../hooks/useLanguageData';

export const FinishCheckOutSession = () => {
     const navigation = useNavigation();
     const language = useActiveLanguage();
     const { data: accounts } = useAccounts();
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
                                   <Button size="sm" onPress={() => StartNewSession()} bgColor={theme.tokens.colors.primary['500']}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'start_new_session')}</ButtonText>
                                   </Button>
                                   <Button size="sm" bgColor={theme.tokens.colors.primary['500']} onPress={() => GoToCheckouts()}>
                                        <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'view_checkouts')}</ButtonText>
                                   </Button>
                              </ButtonGroup>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
};
