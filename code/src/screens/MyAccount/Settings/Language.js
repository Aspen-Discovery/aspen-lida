import { Box, HStack, Text } from '@gluestack-ui/themed';
import React from 'react';
// custom components and helper files
import { getLanguageDisplayName, getTranslatedTermsForUserPreferredLanguage, LanguageSwitcher, translationsLibrary } from '../../../translations/TranslationService';
import { saveLanguage } from '../../../util/api/user';
import {logErrorMessage} from "../../../util/logging";
import { useLibrary } from '../../../hooks/useLibrarySystemData';
import {
     useActiveLanguage,
     useAvailableLanguages,
     useUpdateActiveLanguage,
     useUpdateDictionary,
} from '../../../hooks/useLanguageData';

export const Settings_LanguageScreen = () => {
     const library = useLibrary();
     const language = useActiveLanguage();
     const languages = useAvailableLanguages();
     const updateLanguage = useUpdateActiveLanguage();
     const updateDictionary = useUpdateDictionary();
     const [label, setLabel] = React.useState(getLanguageDisplayName(language, languages));

     const changeLanguage = async (val) => {
          await saveLanguage(val, library.baseUrl).then(async (result) => {
               if (result) {
                    await updateLanguage(val);
                    setLabel(getLanguageDisplayName(val, languages));
                    await getTranslatedTermsForUserPreferredLanguage(val, library.baseUrl).then(() => {
                         return updateDictionary(translationsLibrary);
                    });
               } else {
                    logErrorMessage('there was an error updating the language...');
               }
          });
     };

     return (
          <Box safeArea={5}>
               <HStack justifyContent="space-between" alignItems="center">
                    <Text bold>Language</Text>
                    <LanguageSwitcher />
               </HStack>
          </Box>
     );
};
