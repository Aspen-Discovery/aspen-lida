import { Box, HStack, Text } from '@gluestack-ui/themed';
import React from 'react';
// custom components and helper files
import { getLanguageDisplayName, getTranslatedTermsForUserPreferredLanguage, LanguageSwitcher, translationsLibrary } from '../../../translations/TranslationService';
import {
     useActiveLanguage,
     useAvailableLanguages,
} from '../../../hooks/useLanguageData';

export const Settings_LanguageScreen = () => {
     return (
          <Box safeArea={5}>
               <HStack justifyContent="space-between" alignItems="center">
                    <Text bold>Language</Text>
                    <LanguageSwitcher />
               </HStack>
          </Box>
     );
};
