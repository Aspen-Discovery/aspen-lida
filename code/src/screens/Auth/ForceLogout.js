import { Center, AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, ButtonGroup, ButtonText, Heading, Text } from '@gluestack-ui/themed';

import React from 'react';

import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/initialContext';
import {getTermFromDictionary} from '../../translations/TranslationService';
import { useActiveLanguage } from '../../hooks/useLanguageData';

export const ForceLogout = (props) => {
     const { title, reason } = props;
	const { theme, colorMode, textColor } = React.useContext(ThemeContext);
	const language = useActiveLanguage();
	const { signOut } = React.useContext(AuthContext);
	const [isOpen, setIsOpen] = React.useState(true);
	const onClose = () => setIsOpen(false);
	const cancelRef = React.useRef(null);

	return (
		<Center>
			<AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
				<AlertDialogBackdrop/>
				<AlertDialogContent bgColor={colorMode === 'light' ? "$warmGray50" : "$coolGray700"}>
					<AlertDialogHeader><Heading color={textColor}>{title ?? getTermFromDictionary(language, 'error')}</Heading></AlertDialogHeader>
					<AlertDialogBody><Text color={textColor}>{reason ?? getTermFromDictionary(language, 'error_invalid_session')}</Text></AlertDialogBody>
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
