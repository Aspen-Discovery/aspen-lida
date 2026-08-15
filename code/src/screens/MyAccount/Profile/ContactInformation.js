import { Box, Text } from "@gluestack-ui/themed";
import React from "react";
import {getTermFromDictionary} from '../../../translations/TranslationService';
import { useActiveLanguage } from '../../../hooks/useLanguageData';

// custom components and helper files

const Profile_ContactInformation = (props) => {
    const language = useActiveLanguage();
  return (
    <Box py={5}>
      <Text bold>{getTermFromDictionary(language, 'patron_primary_phone')}</Text>
      <Text>{props.phone}</Text>
      <Text bold mt={2}>
          {getTermFromDictionary(language, 'patron_email')}
      </Text>
      <Text>{props.email}</Text>
    </Box>
  );
};

export default Profile_ContactInformation;
