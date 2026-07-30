import { Box, Text } from "@gluestack-ui/themed";
import React from "react";
import {getTermFromDictionary} from '../../../translations/TranslationService';
import { useActiveLanguage } from '../../../hooks/useLanguageData';

// custom components and helper files

const Profile_Identity = (props) => {
    const language = useActiveLanguage();
  return (
    <Box pb={5}>
      <Text bold>{getTermFromDictionary(language, 'patron_full_name')}</Text>
      <Text>{props.firstName} {props.lastName}</Text>
    </Box>
  );
};

export default Profile_Identity;
