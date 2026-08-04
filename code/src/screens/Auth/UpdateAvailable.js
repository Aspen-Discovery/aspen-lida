import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, ButtonText, ButtonGroup, Center, Heading, Text } from '@gluestack-ui/themed';
import React from 'react';
import * as Linking from 'expo-linking';
import {getTermFromDictionary} from '../../translations/TranslationService';
import { useActiveLanguage } from '../../hooks/useLanguageData';

export const UpdateAvailable = (props) => {
	const language = useActiveLanguage();
	const { url, latest, setHasUpdate } = props;
	const [isOpen, setIsOpen] = React.useState(true);
	const onClose = () => {
		setHasUpdate(false);
		setIsOpen(false);
	};
	const cancelRef = React.useRef(null);

	const openAppStore = async () => {
		onClose();
		await Linking.openURL(url);
	}

	return (
		<Center>
			<AlertDialog isOpen={isOpen} onClose={onClose} finalFocusRef={cancelRef}>
				<AlertDialogBackdrop />
				<AlertDialogContent>
					<AlertDialogHeader>
						<Heading size="lg">{getTermFromDictionary(language, 'update_available')}</Heading>
					</AlertDialogHeader>
					<AlertDialogBody>
						<Text size="sm">{getTermFromDictionary(language, 'update_message')}</Text>
					</AlertDialogBody>
					<AlertDialogFooter>
						<ButtonGroup space="md">
							<Button variant="outline" action="secondary" onPress={onClose} ref={cancelRef}>
								<ButtonText>{getTermFromDictionary(language, 'cancel')}</ButtonText>
							</Button>
							<Button action="primary" onPress={() => openAppStore()}>
								<ButtonText>{getTermFromDictionary(language, 'update_now')}</ButtonText>
							</Button>
						</ButtonGroup>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Center>
	);
};
