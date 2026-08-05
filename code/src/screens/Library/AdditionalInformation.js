import { Box, Divider, Heading, Text } from '@gluestack-ui/themed';
import React from 'react';

import { getTermFromDictionary } from '../../translations/TranslationService';

// custom components and helper files
import { decodeHTML, stripHTML } from '../../helpers/helpers';
import { useActiveLanguage } from '../../hooks/useLanguageData';
import { useTheme } from '../../themes/theme';

const AdditionalInformation = (data) => {
     const location = data.data;
     const language = useActiveLanguage();
     const { textColor } = useTheme();

     if (location.description) {
          return (
               <Box>
                    <Divider mb="$2" />
                    <Heading color={textColor} mb="$2">{getTermFromDictionary(language, 'additional_information')}</Heading>
                    <Text color={textColor}>{stripHTML(decodeHTML(location.description))}</Text>
               </Box>
          );
     }

     return null;
};

export default AdditionalInformation;
