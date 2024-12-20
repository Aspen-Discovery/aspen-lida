import React from 'react';
import _ from 'lodash';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';

import { loadingSpinner } from '../../components/loadingSpinner';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { getSelfRegistrationForm, submitSelfRegistration } from '../../util/api/library';

import { ScrollView, Box, Button, Center, FormControl, Input, Text, Select, CheckIcon } from 'native-base';

export const SelfRegistration = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const libraryUrl = route?.params?.libraryUrl ?? '';
	const [isLoading, setIsLoading] = React.useState(true);
	const [fields, setFields] = React.useState([]);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [valuesToSubmit, setValuesToSubmit] = React.useState([]);
	const [values, setValues] = React.useState([]);
	const [showResults, setShowResults] = React.useState(false);
	const [results, setResults] = React.useState('');

	React.useEffect(() => {
		(async () => {
			await getSelfRegistrationForm(libraryUrl).then((fields) => {
				setFields(fields);
				let object = {};
				_.map(fields, function(section, index, collection) {
					const properties = section.properties;
					_.forEach(properties, function (field, key) {
						let prop = field.property;
						const property = {
							[prop]: '',
						};
						_.merge(object, property);
					});
				});
				setValues(object);
			});
			setIsLoading(false);
		})();
	}, []);

	const handleInputChange = (index, value) => {
		let tmp = values;
		tmp[index] = value;
		setValuesToSubmit(tmp);
	}

	const getFields = () => {
		if(_.size(fields) > 0) {
			return (
				<>
					{_.map(fields, function(section, index, collection) {
						const {label, properties} = section;
						return (
							<Box mb={5}>
							<Text bold fontSize="16">{label}</Text>
							{_.map(properties, function(field, key) {
							const {type, description, maxLength, required, property} = field;
							const fieldLabel = field.label;
							if (type === 'text') {
								return (
									<FormControl my={2} isRequired={required}>
										<FormControl.Label>{fieldLabel}</FormControl.Label>
										<Input
											type='text'
											key={key}
											name={property}
											maxLength={maxLength}
											accessibilityLabel={description}
											returnKeyType="next"
											onChangeText={(value) => {
												console.log(property, value);
												handleInputChange(property, value);
											}}
										/>
										{!_.isEmpty(description) ? (
											<FormControl.HelperText>
												{description}
											</FormControl.HelperText>
										) : null}
									</FormControl>
								)
							} else if (type === 'password') {
								return (
									<FormControl my={2} isRequired={required}>
										<FormControl.Label>{fieldLabel}</FormControl.Label>
										<Input
											type='password'
											key={property}
											name={property}
											maxLength={maxLength}
											accessibilityLabel={description}
											onChangeText={(value) => {
												handleInputChange(property, value);
											}}
										/>
										{!_.isEmpty(description) ? (
											<FormControl.HelperText>
												{description}
											</FormControl.HelperText>
										) : null}
									</FormControl>
								)
							}  else if (type === 'email') {
								return (
									<FormControl my={2} isRequired={required}>
										<FormControl.Label>{fieldLabel}</FormControl.Label>
										<Input
											type='email'
											key={property}
											name={property}
											maxLength={maxLength}
											accessibilityLabel={description}
											onChangeText={(value) => {
												handleInputChange(property, value);
											}}
										/>
										{!_.isEmpty(description) ? (
											<FormControl.HelperText>
												{description}
											</FormControl.HelperText>
										) : null}
									</FormControl>
								)
							} else if (type === 'enum') {
								const values = field.values ?? {};
								return (
									<FormControl my={2} isRequired={required}>
										<FormControl.Label>{fieldLabel}</FormControl.Label>
										<Select
											name={property}
											isReadOnly={Platform.OS === 'android'}
											accessibilityLabel={description}
											_selectedItem={{
												bg: 'tertiary.300',
												endIcon: <CheckIcon size="5" />,
											}}
											onValueChange={(value) => {
												handleInputChange(property, value);
											}}
										>
											{_.map(values, function (item, index, array) {
												console.log(item);
												console.log(index);
												return <Select.Item key={index} value={index} label={item} />;
											})}
										</Select>
										{!_.isEmpty(description) ? (
											<FormControl.HelperText>
												{description}
											</FormControl.HelperText>
										) : null}
									</FormControl>
								)
							}
						})}
							</Box>
						)
					})}
				</>
			)
		}

		return null;
	}

	const handleSubmission = async () => {
		await submitSelfRegistration(libraryUrl, valuesToSubmit).then((result) => {
			setResults(result);
			if(result) {
				setShowResults(true);
			}
			setIsSubmitting(false);
		});
	};

	return (
		<>
			{isLoading ? (
				loadingSpinner()
			) : (
				<ScrollView>
					<Box safeArea={5}>
						{!showResults ? (
							<Text mb="3">{getTermFromDictionary('en', 'self_registration_message')}</Text>
						) : null}
						{showResults ? (
							<>
								{results.success === true ? (
									<Text mb="3">{getTermFromDictionary('en', 'self_registration_success')}</Text>
								) : (
									<Text mb="3">{getTermFromDictionary('en', 'self_registration_error')}</Text>
								)}

								{results.message ? (
									<Text mb="3">{results.message}</Text>
								) : null}

								{results.barcode ? (
									<Text mb="3">Your library card is <Text bold>{results.barcode}</Text></Text>
								) : null}

								{results.username ? (
									<Text mb="3">Your username is <Text bold>{results.username}</Text></Text>
								) : null}

								{results.password ? (
									<Text mb="3">Your initial password is <Text bold>{results.password}</Text></Text>
								) : null}

								{results.requirePinReset ? (
									<Text mb="3">To login to the catalog, you must reset your PIN.</Text>
								) : null}

								<Button colorScheme="secondary" variant="outline" onPress={() => {
									navigation.goBack();
									setShowResults(false);
									setResults('');
								}}>
									{getTermFromDictionary('en', 'close_window')}
								</Button>
							</>
						) : (
							<>
								{getFields()}
								<Button.Group pt={3} pb={5}>
									<Button
										colorScheme="secondary"
										isLoading={isSubmitting}
										isLoadingText="Registering..."
										onPress={() => {
											setIsSubmitting(true);
											handleSubmission();
										}}>
										{getTermFromDictionary('en', 'register')}
									</Button>
									<Button colorScheme="secondary" variant="outline" onPress={() => navigation.goBack()}>
										{getTermFromDictionary('en', 'cancel')}
									</Button>
								</Button.Group>
							</>
						)}
					</Box>
				</ScrollView>
			)}
		</>
	);
};