import React from 'react';
import { LanguageContext, LibrarySystemContext, ThemeContext, UserContext } from '../../../context/initialContext';
import {getTermFromDictionary} from "../../../translations/TranslationService";
import {Platform} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import _ from "lodash";
import {
	Box,
	ButtonGroup,
	Button,
	ButtonText,
	FormControl,
	FormControlLabel,
	FormControlLabelText,
	Select,
	SelectTrigger,
	SelectInput,
	SelectIcon,
	SelectPortal,
	SelectBackdrop,
	SelectContent,
	SelectDragIndicatorWrapper,
	SelectDragIndicator,
	SelectItem,
	ChevronDownIcon,
	Checkbox,
	CheckboxLabel,
	CheckIcon,
	CheckboxIndicator,
	CheckboxIcon,
	ButtonSpinner
} from '@gluestack-ui/themed';
import {refreshProfile, updateHoldPickupPreferences} from "../../../util/api/user";
import {PATRON} from "../../../util/globals";
import {SelectNewHoldSublocation} from "../../../components/Action/Holds/SelectNewHoldSublocation";

import { logDebugMessage } from '../../../util/logging.js';

export const Settings_PickupLocations = () => {
	const [loading, setLoading] = React.useState(false);
	const { library } = React.useContext(LibrarySystemContext);
	const { language } = React.useContext(LanguageContext);
	const { user, updateUser, locations } = React.useContext(UserContext);
	const { theme, textColor, colorMode } = React.useContext(ThemeContext);
	const insets = useSafeAreaInsets();

	let userPickupLocationId = user.pickupLocationId ?? user.homeLocationId;
	let userPickupLocation1Id = user.myLocation1Id ?? "";
	let userPickupLocation2Id = user.myLocation2Id ?? "";
	let userSublocationPickupId = user.pickupSublocationId ?? "";
	logDebugMessage("Remember Hold Pickup Location in Preferences is " + user.rememberHoldPickupLocation);
	const rememberHoldPickupLocation = user.rememberHoldPickupLocation ? 1 : 0;

	if (_.isNumber(user.pickupLocationId)) {
		userPickupLocationId = _.toString(user.pickupLocationId);
	}

	if (_.isNumber(user.myLocation1Id)) {
		userPickupLocation1Id = _.toString(user.myLocation1Id);
	}

	if (_.isNumber(user.myLocation2Id)) {
		userPickupLocation2Id = _.toString(user.myLocation2Id);
	}

	const [showAlternatePickupLocations, setShowAlternatePickupLocations] = React.useState(true);

	let pickupLocation = '';
	let pickupLocation1 = '';
	let pickupLocation2 = '';
	if (_.size(locations) > 1) {
		const userPickupLocation = _.filter(locations, { locationId: userPickupLocationId });
		const userPickupLocation1 = _.filter(locations, { locationId: userPickupLocation1Id });
		const userPickupLocation2 = _.filter(locations, { locationId: userPickupLocation2Id });
		if (!_.isUndefined(userPickupLocation && !_.isEmpty(userPickupLocation))) {
			pickupLocation = userPickupLocation[0];
			if (_.isObject(pickupLocation)) {
				pickupLocation = pickupLocation.code;
			}
		}
		if (!_.isUndefined(userPickupLocation1 && !_.isEmpty(userPickupLocation1))) {
			pickupLocation1 = userPickupLocation1[0];
			if (_.isObject(pickupLocation1)) {
				pickupLocation1 = pickupLocation1.code;
			}
		}
		if (!_.isUndefined(userPickupLocation2Id && !_.isEmpty(userPickupLocation2Id))) {
			pickupLocation2 = userPickupLocation2[0];
			if (_.isObject(pickupLocation2)) {
				pickupLocation2 = pickupLocation2.code;
			}
		}

		if(pickupLocation1 === 0) {
			pickupLocation1 = -1;
		}

		if(pickupLocation2 === 0) {
			pickupLocation2 = -1;
		}
	} else {
		pickupLocation = locations[0];
		if (_.isObject(pickupLocation)) {
			pickupLocation = pickupLocation.code;
		}
		if(pickupLocation1 === 0) {
			pickupLocation1 = -1;
		}

		if(pickupLocation2 === 0) {
			pickupLocation2 = -1;
		}
		setShowAlternatePickupLocations(false);
	}

	const [location, setLocation] = React.useState(pickupLocation);
	const [location1Id, setLocation1Id] = React.useState(pickupLocation1);
	const [location2Id, setLocation2Id] = React.useState(pickupLocation2);
	const [sublocation, setSublocation] = React.useState(userSublocationPickupId);
	const [rememberPickupLocation, setRememberPickupLocation] = React.useState(rememberHoldPickupLocation);

	const selectedLocationObj = locations.find(loc => loc.code === location);
	const selectedLocation1Obj = locations.find(loc => loc.code === location1Id);
	const selectedLocation2Obj = locations.find(loc => loc.code === location2Id);

	return (
		<Box p="$5">
			<FormControl mb="$3">
				<FormControlLabel>
					<FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'preferred_pickup_branch')}</FormControlLabelText>
				</FormControlLabel>
				<Select
					name="pickupLocations"
					selectedValue={location}
					minWidth="200"
					accessibilityLabel={getTermFromDictionary(language, 'select_pickup_location')}
					mt="$1"
					mb="$2"
					onValueChange={(itemValue) => setLocation(itemValue)}>
					<SelectTrigger variant="outline" size="md">
						{selectedLocationObj ? (
							<SelectInput value={selectedLocationObj.displayName} color={textColor} />
						) : (
							<SelectInput value={getTermFromDictionary(language, 'select_pickup_location')} color={textColor} />
						)}
						<SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
					</SelectTrigger>
					<SelectPortal>
						<SelectBackdrop />
						<SelectContent
							bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
							pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
						>
							<SelectDragIndicatorWrapper>
								<SelectDragIndicator />
							</SelectDragIndicatorWrapper>
								{locations.map((availableLocations, index) => {
									if (availableLocations.code === location) {
										return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} bgColor={theme['colors']['tertiary']['300']} sx={{ _text: { color: theme['colors']['tertiary']['500-text'] } }} />;
									}
									return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} sx={{
										_text: { color: textColor }
									}} />;
								})}
						</SelectContent>
					</SelectPortal>
				</Select>
			</FormControl>
			{showAlternatePickupLocations ? (
				<>
				<FormControl mb="$3">
					<FormControlLabel>
						<FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'alternate_pickup_location_1')}</FormControlLabelText>
					</FormControlLabel>
					<Select
						name="pickupLocations1"
						selectedValue={location1Id}
						accessibilityLabel={getTermFromDictionary(language, 'select_pickup_location')}
						mt="$1"
						mb="$2"
						onValueChange={(itemValue) => setLocation1Id(itemValue)}>
						<SelectTrigger variant="outline" size="md">
							{selectedLocation1Obj ? (
								<SelectInput value={selectedLocation1Obj.displayName} color={textColor} />
							) : (
								<SelectInput value={getTermFromDictionary(language, 'select_pickup_location')} color={textColor} />
							)}
							<SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
						</SelectTrigger>
						<SelectPortal useRNModal={true}>
							<SelectBackdrop />
							<SelectContent
								bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
								pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
							>
								<SelectDragIndicatorWrapper>
									<SelectDragIndicator />
								</SelectDragIndicatorWrapper>
									{locations.map((availableLocations, index) => {
										if (availableLocations.code === location1Id) {
											return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} bgColor={theme['colors']['tertiary']['300']} sx={{ _text: { color: theme['colors']['tertiary']['500-text'] } }} />;
										}
										return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} sx={{
											_text: { color: textColor }
										}} />;
									})}
							</SelectContent>
						</SelectPortal>
					</Select>
				</FormControl>
				<FormControl mb="$5">
					<FormControlLabel>
						<FormControlLabelText color={textColor}>{getTermFromDictionary(language, 'alternate_pickup_location_2')}</FormControlLabelText>
					</FormControlLabel>
					<Select
						name="pickupLocation2"
						selectedValue={location2Id}
						accessibilityLabel={getTermFromDictionary(language, 'select_pickup_location')}
						mt="$1"
						mb="$2"
						onValueChange={(itemValue) => setLocation2Id(itemValue)}>
						<SelectTrigger variant="outline" size="md">
							{selectedLocation2Obj ? (
								<SelectInput value={selectedLocation2Obj.displayName} color={textColor} />
							) : (
								<SelectInput value={getTermFromDictionary(language, 'select_pickup_location')} color={textColor} />
							)}
							<SelectIcon mr="$3" as={ChevronDownIcon} color={textColor} />
						</SelectTrigger>
						<SelectPortal>
							<SelectBackdrop />
							<SelectContent
								bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
								pb={Platform.OS === 'android' ? insets.bottom + 16 : '$4'}
							>
								<SelectDragIndicatorWrapper>
									<SelectDragIndicator />
								</SelectDragIndicatorWrapper>
									{locations.map((availableLocations, index) => {
										if (availableLocations.code === location2Id) {
											return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} bgColor={theme['colors']['tertiary']['300']} sx={{ _text: { color: theme['colors']['tertiary']['500-text'] } }} />;
										}
										return <SelectItem label={availableLocations.displayName} value={availableLocations.code} key={index} sx={{
											_text: { color: textColor }
										}} />;
									})}
							</SelectContent>
						</SelectPortal>
					</Select>
				</FormControl>
			</>
			) : null}
			<SelectNewHoldSublocation sublocations={PATRON.sublocations} location={location} activeSublocation={sublocation} setActiveSublocation={setSublocation} language={language} textColor={textColor} theme={theme} colorMode={colorMode} />
			{library.allowRememberPickupLocation ? (
				<FormControl mb="$3">
					<Checkbox
						size="sm"
						name="rememberHoldPickupLocation"
						defaultIsChecked={rememberPickupLocation}
						onChange={(value) => {
							setRememberPickupLocation(value);
						}}>
						<CheckboxIndicator mr="$2">
							<CheckboxIcon as={CheckIcon} color={textColor} />
						</CheckboxIndicator>
						<CheckboxLabel color={textColor}>{getTermFromDictionary(language, 'bypass_pickup_location_prompt')}</CheckboxLabel>
					</Checkbox>
				</FormControl>
			) : null}
			<ButtonGroup>
				<Button bgColor={theme['colors']['primary']['500']}
                         onPress={async () => {
                              setLoading(true);
                              await updateHoldPickupPreferences(location, location1Id, location2Id, sublocation, rememberPickupLocation, language, library.baseUrl).then(async () => {
                                   setLoading(false);
                                   await refreshProfile(library.baseUrl).then(async (result) => {
                                      updateUser(result);
                                   });
                              })
                         }}
                         isDisabled={loading}>
					{loading ? <ButtonSpinner color={theme['colors']['primary']['500-text']} /> : <ButtonText color={theme['colors']['primary']['500-text']}>{getTermFromDictionary(language, 'update')}</ButtonText>}
				</Button>
			</ButtonGroup>
		</Box>
	)
}
