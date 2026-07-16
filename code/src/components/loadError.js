import React from 'react';
import { Button, ButtonText, Center, Heading, HStack, Icon, Text, ButtonIcon, AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, ButtonGroup } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// custom components and helper files
import { getTermFromDictionary } from '../translations/TranslationHelper';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../context/initialContext';
import { AuthContext } from '../context/AuthContext';
import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../util/logging.js';

/**
 * Catch an error and display it to the user
 * <ul>
 *     <li>error - The error array that contains title and message objects</li>
 *     <li>reloadAction - The name of the component that would result in a reload of the screen (optional)</li>
 * </ul>
 * @param {string} error
 * @param {string} reloadAction
 **/
export const LoadError = (props) => {
     const { error, reloadAction } = props;
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);

     return (
          <Center flex={1}>
               <HStack>
                    <Icon as={MaterialIcons} name="error" size="md" mr="$1" color="$error500" />
                    <Heading color="$error500" mb="$2">
                         {getTermFromDictionary('en', 'error')}
                    </Heading>
               </HStack>
               <Text bold w="75%" textAlign="center" color={textColor}>
                    {getTermFromDictionary('en', 'error_loading_results')}
               </Text>
               {reloadAction ? (
                    <Button mt="$5" colorScheme="primary" onPress={reloadAction} bgColor={theme.tokens.colors.primary['500']}>
                         <ButtonIcon><Icon as={MaterialIcons} name="refresh" size="sm" color={theme.tokens.colors.primary['500-text']} /></ButtonIcon>
                         <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary('en', 'button_reload')}</ButtonText>
                    </Button>
               ) : null}
               <Text size="xs" w="75%" mt="$5" color="$muted500" textAlign="center">
                    ERROR: {error}
               </Text>
          </Center>
     );
}

export function loadError(error, reloadAction = '') {
     return <LoadError error={error} reloadAction={reloadAction} />;
}

/**
 * <b>Toast: low priority messages</b>
 *
 * <ul>
 * <li>Use Case: A brief error or update regarding an app process</li>
 * <li>User Action: Optional and minimal</li>
 * <li>Closes On: Disappears automatically, should be brief</li>
 * <li>Example Use: Bad API fetches or server connection troubles/timeouts</li>
 * </ul>
 * - - - -
 * Available statuses:
 * <ul>
 * <li>Success</li>
 * <li>Error</li>
 * <li>Info</li>
 * <li>Warning</li>
 * </ul>
 * @param {string} title
 * @param {string} description
 * @param {string} status
 **/
export function popToast(title, description, status) {
     logDebugMessage("Popping a toast");
     Toast.show({
          position: 'bottom',
          type: status,
          text1: title,
          text2: description,
     });
}

/**
 * <b>Alert: prominent, medium priority messages</b>
 *
 * <ul>
 * <li>Use Case: An error or notice occurs because of an action that a user has taken</li>
 * <li>User Action: Optional, buttons do not need to be displayed</li>
 * <li>Closes On: When dismissed or the state that caused the alert is resolved</li>
 * <li>Example Use: Checkout renewal, freeze or thaw hold, or hold cancelled</li>
 * </ul>
 * - - - -
 * Available statuses:
 * <ul>
 * <li>Success</li>
 * <li>Error</li>
 * <li>Info</li>
 * </ul>
 * @param {string} title
 * @param {string} description
 * @param {string} status
 **/
export function popAlert(title, description, status) {
     logDebugMessage("Popping an alert");
     Toast.show({
          position: 'bottom',
          type: status,
          text1: title,
          text2: description,
     });
}

export const DisplayErrorAlertDialog = (props) => {
     const { title, message } = props;
     const { language } = React.useContext(LanguageContext);
     const { theme, textColor, colorMode } = React.useContext(ThemeContext);
     const [isOpen, setIsOpen] = React.useState(true);
     const onClose = () => setIsOpen(false);
     const cancelRef = React.useRef(null);

     return (
          <Center>
               <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
                    <AlertDialogBackdrop />
                    <AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
                    <AlertDialogHeader>
                        <Heading color={textColor}>{title}</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text color={textColor}>{message}</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup space="md">
                            <Button onPress={onClose} bgColor={theme.tokens.colors.primary['500']} ref={cancelRef}>
                                <ButtonText color={theme.tokens.colors.primary['500-text']}>{getTermFromDictionary(language, 'close_window')}</ButtonText>
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </Center>
     );
}
