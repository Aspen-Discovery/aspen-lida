import React from 'react';
import { Button, ButtonText, Center, Heading, HStack, Icon, Text, ButtonIcon, AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, ButtonGroup } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';

// custom components and helper files
import { getTermFromDictionary } from '../translations/TranslationHelper';

import { useActiveLanguage } from '../hooks/useLanguageData';
import { useTheme } from '../themes/theme';

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
     const { theme, textColor } = useTheme();

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


export const DisplayErrorAlertDialog = (props) => {
     const { title, message } = props;
     const language = useActiveLanguage();
     const { theme, textColor, colorMode } = useTheme();
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
