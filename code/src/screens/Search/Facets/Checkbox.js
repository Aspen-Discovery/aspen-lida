import { Checkbox, CheckboxIndicator, CheckboxLabel, HStack, Text, Icon } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { logDebugMessage } from '../../../util/logging.js';
import { useTheme } from '../../../themes/theme';


export const Facet_Checkbox = ({ data, category, values = [], updateCheckboxFacet }) => {
     const {theme, textColor, colorMode } = useTheme();
     const isChecked = values.includes(data.value);
     const handleChange = (newValue) => {
          logDebugMessage("Clicked on " + data.value + " isChecked is " + isChecked + " newValue is " + newValue);
          updateCheckboxFacet(category, data.value, newValue);
     };

     return (
          <HStack alignItems="center" px="$3" py="$4">
               <Checkbox
                    value={data.value}
                    accessibilityLabel={data.display}
                    isChecked={isChecked}
                    onChange={(value) => {
                       handleChange(value);
                    }}
               >
                    <CheckboxIndicator
                         sx={{
                              ':checked': {
                                   borderColor: theme['tokens']['colors']['primary']['500'],
                                   backgroundColor: theme['tokens']['colors']['primary']['500'] } }}
                    >
                         {isChecked && <Icon as={MaterialIcons} name="check" color={theme.tokens.colors.primary['500-text']} size="sm" />}
                    </CheckboxIndicator>
                    <CheckboxLabel pl="$2">
                         <Text color={textColor}>
                              {data.display}{data.count ? ` (${data.count})` : ''}
                         </Text>
                    </CheckboxLabel>
               </Checkbox>
          </HStack>
     );
};
