import moment from 'moment';
import { Badge, BadgeText, Box, Text, ActionsheetItemText } from '@gluestack-ui/themed';
import React from 'react';
import _ from 'lodash';

import { LanguageContext, LibrarySystemContext, UserContext, ThemeContext } from '../context/initialContext';
import { getTermFromDictionary, getTranslationsWithValues } from '../translations/TranslationService';

export const isOverdue = (overdue) => {
     const { language } = React.useContext(LanguageContext);
     if (overdue) {
          return (
               <Badge action="error" borderRadius="$sm" mt={-2} alignSelf="flex-start">
                    <BadgeText>
                         {getTermFromDictionary(language, 'checkout_overdue')}
                    </BadgeText>
               </Badge>
          );
     } else {
          return null;
     }
};

export const getTitle = (title) => {
     const {textColor} = React.useContext(ThemeContext);
     if (title) {
          let displayTitle = title;
          const countSlash = displayTitle.split('/').length - 1;
          if (countSlash > 0) {
               displayTitle = displayTitle.substring(0, displayTitle.lastIndexOf('/'));
          }
          return (
               <Text
                    bold
                    mb="$1"
                    pr="$3"
                    fontSize="$sm"
                    color={textColor}
                    maxwidth="$full">
                    {displayTitle}
               </Text>
          );
     } else {
          return (
               <Text
                    bold
                    mb="$1"
                    pr="$3"
                    fontSize='$sm'
                    color={textColor}
                    maxwidth="$full">
                    Title Not Available
               </Text>
          );
     }
};

export function getCleanTitle(title) {
     if (title) {
          let displayTitle = title;
          const countSlash = displayTitle.split('/').length - 1;
          if (countSlash > 0) {
               displayTitle = displayTitle.substring(0, displayTitle.lastIndexOf('/'));
          }
          return displayTitle;
     }
     return 'Unknown';
}

export const getCallNumber = (callNumber) => {
     const {textColor} = React.useContext(ThemeContext);
     const { language } = React.useContext(LanguageContext);
     if (callNumber) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'call_number')}:
                    </Text>
                    {' '}{callNumber}
               </Text>
          );
     }
     return null;
}

export const getVolume = (volume) => {
     const {textColor} = React.useContext(ThemeContext);
     const { language } = React.useContext(LanguageContext);
     if (volume) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'volume')}:
                    </Text>
                    {' '}{volume}
               </Text>
          );
     }
     return null;
}

export const getAuthor = (author) => {
     const {textColor} = React.useContext(ThemeContext);
     const { language } = React.useContext(LanguageContext);
     if (author) {
          let displayAuthor = author;
          const countComma = displayAuthor.split(',').length - 1;
          if (countComma > 1) {
               displayAuthor = displayAuthor.substring(0, displayAuthor.lastIndexOf(','));
          }

          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'author')}:
                    </Text>
                    {' '}{displayAuthor}
               </Text>
          );
     }
     return null;
};

export const getFormat = (format, source = null) => {
     const { language } = React.useContext(LanguageContext);
     const { library } = React.useContext(LibrarySystemContext);
     const {textColor} = React.useContext(ThemeContext);
     if (format && format !== 'Unknown') {
          if (source) {
               if (source !== 'ils') {
                    if (source === 'interlibrary_loan') {
                         source = getTermFromDictionary(language, 'interlibrary_loan');
                    } else if (source === 'axis360') {
                         source = getTermFromDictionary(language, 'boundless');
                    } else if (source === 'cloudlibrary') {
                         source = getTermFromDictionary(language, 'cloud_library');
                    } else if (source === 'hoopla') {
                         source = getTermFromDictionary(language, 'hoopla');
                    } else if (source === 'overdrive') {
                         if (library.libbyReaderName) {
                              source = library.libbyReaderName;
                         } else {
                              source = getTermFromDictionary(language, 'libby');
                         }
                    } else if (source === 'palace_project') {
                         source = getTermFromDictionary(language, 'palace_project');
                    }
                    return (
                         <Text fontSize="$xs" color={textColor}>
                              <Text bold>
                                   {getTermFromDictionary(language, 'format')}:
                              </Text>
                              {' '}{format !== '' ? format : 'Unknown'} - {source}
                         </Text>
                    );
               }
          }
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'format')}:
                    </Text>
                    {' '}{format}
               </Text>
          );
     } else {
          return null;
     }
};

export const getBadge = (status, frozen, available, source, statusMessage) => {
     const { language } = React.useContext(LanguageContext);
     if (frozen) {
          if (statusMessage) {
               return (
                    <Badge colorScheme="yellow" borderRadius="$sm" mt={-0.5} alignSelf="flex-start">
                         <BadgeText>
                              {statusMessage}
                         </BadgeText>
                    </Badge>
               );
          }
          return (
               <Badge colorScheme="yellow" borderRadius="$sm" mt={-0.5} alignSelf="flex-start">
                    <BadgeText>
                         {status}
                    </BadgeText>
               </Badge>
          );
     } else if (available) {
          let message = getTermFromDictionary(language, 'overdrive_hold_ready');
          if (source === 'ils') {
               message = status;
          }
          return (
               <Badge colorScheme="green" borderRadius="$sm" mt={-0.5} alignSelf="flex-start">
                    <BadgeText>
                         {message}
                    </BadgeText>
               </Badge>
          );
     } else {
          if (status) {
               return (
                    <Badge colorScheme="orange" borderRadius="$sm" mt={-0.5} alignSelf="flex-start">
                         <BadgeText>
                              {status}
                         </BadgeText>
                    </Badge>
               );
          }
     }
     return null;
};

export const getType = (type) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (type && type !== 'ils') {
          if (type === 'interlibrary_loan') {
               type = getTermFromDictionary(language, 'interlibrary_loan');
          } else if (type === 'axis360') {
               type = getTermFromDictionary(language, 'axis360');
          } else if (type === 'cloudlibrary') {
               type = getTermFromDictionary(language, 'cloud_library');
          } else if (type === 'hoopla') {
               type = getTermFromDictionary(language, 'hoopla');
          } else if (type === 'overdrive') {
               type = getTermFromDictionary(language, 'overdrive');
          } else if (type === 'palace_project') {
               type = getTermFromDictionary(language, 'palace_project');
          }

          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'hold_source')}:
                    </Text>
                    {' '}{type}
               </Text>
          );
     } else {
          return null;
     }
};

export const getOnHoldFor = (user) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (user) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'on_hold_for')}:
                    </Text>
                    {' '}{user}
               </Text>
          );
     }
     return null;
};

export const getCheckedOutTo = (props) => {
     const { language } = React.useContext(LanguageContext);
     const { user } = React.useContext(UserContext);
     const [checkedOutTo] = React.useState();
     const {textColor} = React.useContext(ThemeContext);
     if (user.id !== checkedOutTo) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'checked_out_to')}:
                    </Text>
                    {' '}{props}
               </Text>
          );
     } else {
          return null;
     }
};

export const getDueDate = (date) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (date && date !== 0) {
          //offset is in minutes we multiply 60 to get seconds
          const timezoneOffset = new Date().getTimezoneOffset() * 60;
          const dueDate = moment.unix(date - timezoneOffset);
          const itemDueOn = moment(dueDate).format('MMM D, YYYY');
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'checkout_due')}:
                    </Text>
                    {' '}{itemDueOn}
               </Text>
          );
     }

     return null;
};

export const getDateLastUsed = (date, checkedOut) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (date && date !== 0) {
          const dateLastUsed = moment.unix(date);
          let itemLastUsedOn = moment(dateLastUsed).format('MMM D, YYYY');
          if (checkedOut) {
               itemLastUsedOn = getTermFromDictionary(language, 'in_use');
          }
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'last_used')}:
                    </Text>
                    {' '}{itemLastUsedOn}
               </Text>
          );
     }

     return null;
};

export const willAutoRenew = (props) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (props.autoRenew === 1 || props.autoRenew === '1') {
          return (
               <Box mt={1} p={0.5} bgColor="muted.100">
                    <Text fontSize="$xs" color={textColor}>
                         <Text bold>
                              {getTermFromDictionary(language, 'if_eligible_auto_renew')}:
                         </Text>
                         {' '}{props.renewalDate}
                    </Text>
               </Box>
          );
     } else {
          return null;
     }
};

export const getPickupLocation = (location, source) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (location && source === 'ils') {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'hold_pickup_at')}:
                    </Text>
                    {' '}{location}
               </Text>
          );
     } else {
          return null;
     }
};

export const getOutOfHoldGroupMessage = (outOfHoldGroupMessage) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (outOfHoldGroupMessage) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'interlibrary_loan')}:
                    </Text>
                    {' '}{outOfHoldGroupMessage}
               </Text>
          );
     } else {
          return null;
     }
}

export const getPosition = (position, available, length, holdPosition, usesHoldPosition, outOfHoldGroupMessage) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (!outOfHoldGroupMessage && position && !available && position !== 0 && position !== '0') {
          if (length && usesHoldPosition) {
               return (
                    <Text fontSize="$xs" color={textColor}>
                         <Text bold>
                              {getTermFromDictionary(language, 'hold_position')}:
                         </Text>
                         {' '}{holdPosition}
                    </Text>
               );
          }
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'hold_position')}:
                    </Text>
                    {' '}{position}
               </Text>
          );
     } else {
          return null;
     }
};

export const getExpirationDate = (expiration, available) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (expiration && available) {
          const expirationDateUnix = moment.unix(expiration);
          let expirationDate = moment(expirationDateUnix).format('MMM D, YYYY');
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'hold_pickup_by')}:
                    </Text>
                    {' '}{expirationDate}
               </Text>
          );
     } else {
          return null;
     }
};

export const getRenewalCount = (count, available = null) => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     if (available) {
          return (
               <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'checkout_renewed')}:
                    </Text>
                    {' '}{count} of {available} times
               </Text>
          );
     } else {
          return null;
     }
};

export const getCollectionName = (source, collectionName = null) => {
	const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
	if (source === 'overdrive' && collectionName) {
		return (
		     <Text fontSize="$xs" color={textColor}>
                    <Text bold>
                         {getTermFromDictionary(language, 'collection')}:
                    </Text>
                    {' '}{collectionName}
               </Text>
		);
	} else {
		return null;
	}
}

export const CheckoutAccessLabel = ({ checkout, language, baseUrl, libbyReaderName, color }) => {
     const [label, setLabel] = React.useState('...'); // Fallback / temporary loading text

     React.useEffect(() => {
          let active = true;

          async function fetchLabel() {
               if (!checkout?.checkoutSource) return;

               let translationKey = 'checkout_access_online';
               let dynamicValue = checkout.checkoutSource === 'Axis360' ? 'Boundless' : checkout.checkoutSource;

               if (checkout.checkoutSource === 'OverDrive') {
                    dynamicValue = libbyReaderName;
                    if (checkout.overdriveRead === 1) {
                         translationKey = 'checkout_read_online';
                    } else if (checkout.overdriveListen === 1) {
                         translationKey = 'checkout_listen_online';
                    } else if (checkout.overdriveVideo === 1) {
                         translationKey = 'checkout_watch_online';
                    } else if (checkout.overdriveMagazine === 1) {
                         translationKey = 'checkout_read_online';
                    }
               }

               try {
                    const term = await getTranslationsWithValues(translationKey, dynamicValue, language, baseUrl);
                    if (active) {
                         setLabel(_.toString(term));
                    }
               } catch (error) {
                    console.error("Failed to fetch checkout translation:", error);
               }
          }

          fetchLabel();

          // Cleanup function to prevent setting state on unmounted components
          return () => {
               active = false;
          };
     }, [checkout, language, baseUrl, libbyReaderName]);

     return <ActionsheetItemText color={color} >{label}</ActionsheetItemText>;
};
