import moment from 'moment';
import { Badge, BadgeText, Box, HStack, Text } from '@gluestack-ui/themed';
import React from 'react';

import { LanguageContext, LibrarySystemContext, UserContext } from '../context/initialContext';
import { getTermFromDictionary } from '../translations/TranslationService';

export const isOverdue = (overdue) => {
     const { language } = React.useContext(LanguageContext);
     if (overdue) {
          return (
               <Badge action="error" borderRadius="$sm" mt={-2}>
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
     const { language } = React.useContext(LanguageContext);
     if (callNumber) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'call_number')}:
                    </Text>
                    <Text fontSize="$xs">
                         {callNumber}
                    </Text>
               </HStack>
          );
     }
     return null;
}

export const getVolume = (volume) => {
     const { language } = React.useContext(LanguageContext);
     if (volume) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'volume')}:
                    </Text>
                    <Text fontSize="$xs">
                         {volume}
                    </Text>
               </HStack>
          );
     }
     return null;
}

export const getAuthor = (author) => {
     const { language } = React.useContext(LanguageContext);
     if (author) {
          let displayAuthor = author;
          const countComma = displayAuthor.split(',').length - 1;
          if (countComma > 1) {
               displayAuthor = displayAuthor.substring(0, displayAuthor.lastIndexOf(','));
          }

          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'author')}:
                    </Text>
                    <Text fontSize="$xs">
                         {displayAuthor}
                    </Text>
               </HStack>
          );
     }
     return null;
};

export const getFormat = (format, source = null) => {
     const { language } = React.useContext(LanguageContext);
     const { library } = React.useContext(LibrarySystemContext);
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
                         <HStack
                              space="xs"
                              maxW="$full"
                              flexWrap="wrap">
                              <Text bold fontSize="$xs">
                                   {getTermFromDictionary(language, 'format')}:
                              </Text>
                              <Text fontSize="$xs">
                                   {format !== '' ? format : 'Unknown'} - {source}
                              </Text>
                         </HStack>
                    );
               }
          }
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'format')}:
                    </Text>
                    <Text fontSize="$xs">
                         {format}
                    </Text>
               </HStack>
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
                    <Badge colorScheme="yellow" borderRadius="$sm" mt={-0.5}>
                         <BadgeText>
                              {statusMessage}
                         </BadgeText>
                    </Badge>
               );
          }
          return (
               <Badge colorScheme="yellow" borderRadius="$sm" mt={-0.5}>
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
               <Badge colorScheme="green" borderRadius="$sm" mt={-0.5}>
                    <BadgeText>
                         {message}
                    </BadgeText>
               </Badge>
          );
     } else {
          if (status) {
               return (
                    <Badge colorScheme="orange" borderRadius="$sm" mt={-0.5}>
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
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'hold_source')}:
                    </Text>
                    <Text fontSize="$xs">
                         {type}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getOnHoldFor = (user) => {
     const { language } = React.useContext(LanguageContext);
     if (user) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'on_hold_for')}:
                    </Text>
                    <Text fontSize="$xs">
                         {user}
                    </Text>
               </HStack>
          );
     }
     return null;
};

export const getCheckedOutTo = (props) => {
     const { language } = React.useContext(LanguageContext);
     const { user } = React.useContext(UserContext);
     const [checkedOutTo, setCheckedOutTo] = React.useState();
     if (user.id !== checkedOutTo) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'checked_out_to')}:
                    </Text>
                    <Text fontSize="$xs">
                         {props}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getDueDate = (date) => {
     const { language } = React.useContext(LanguageContext);
     if (date && date !== 0) {
          //offset is in minutes we multiple 60 to get seconds
          const timezoneOffset = new Date().getTimezoneOffset() * 60;
          const dueDate = moment.unix(date - timezoneOffset);
          const itemDueOn = moment(dueDate).format('MMM D, YYYY');
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'checkout_due')}:
                    </Text>
                    <Text fontSize="$xs">
                         {itemDueOn}
                    </Text>
               </HStack>
          );
     }

     return null;
};

export const getDateLastUsed = (date, checkedOut) => {
     const { language } = React.useContext(LanguageContext);
     if (date && date !== 0) {
          const dateLastUsed = moment.unix(date);
          let itemLastUsedOn = moment(dateLastUsed).format('MMM D, YYYY');
          if (checkedOut) {
               itemLastUsedOn = getTermFromDictionary(language, 'in_use');
          }
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'last_used')}:
                    </Text>
                    <Text fontSize="$xs">
                         {itemLastUsedOn}
                    </Text>
               </HStack>
          );
     }

     return null;
};

export const willAutoRenew = (props) => {
     const { language } = React.useContext(LanguageContext);
     if (props.autoRenew === 1 || props.autoRenew === '1') {
          return (
               <Box mt={1} p={0.5} bgColor="muted.100">
                    <HStack space="xs" maxW="$full" flexWrap="wrap">
                         <Text
                              bold
                              fontSize="$xs">
                              {getTermFromDictionary(language, 'if_eligible_auto_renew')}:
                         </Text>
                         <Text
                              fontSize="$xs">
                              {props.renewalDate}
                         </Text>
                    </HStack>
               </Box>
          );
     } else {
          return null;
     }
};

export const getPickupLocation = (location, source) => {
     const { language } = React.useContext(LanguageContext);
     if (location && source === 'ils') {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'hold_pickup_at')}:
                    </Text>
                    <Text fontSize="$xs">
                         {location}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getOutOfHoldGroupMessage = (outOfHoldGroupMessage) => {
     const { language } = React.useContext(LanguageContext);
     //console.log("Out of hold group message is " + outOfHoldGroupMessage);
     if (outOfHoldGroupMessage) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'interlibrary_loan')}:
                    </Text>
                    <Text fontSize="$xs">
                         {outOfHoldGroupMessage}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
}

export const getPosition = (position, available, length, holdPosition, usesHoldPosition, outOfHoldGroupMessage) => {
     const { language } = React.useContext(LanguageContext);
     if (!outOfHoldGroupMessage && position && !available && position !== 0 && position !== '0') {
          if (length && usesHoldPosition) {
               return (
                    <HStack space="xs" maxW="$full" flexWrap="wrap">
                         <Text
                              bold
                              fontSize="$xs">
                              {getTermFromDictionary(language, 'hold_position')}:
                         </Text>
                         <Text
                              fontSize="$xs">
                              {holdPosition}
                         </Text>
                    </HStack>
               );
          }
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'hold_position')}:
                    </Text>
                    <Text fontSize="$xs">
                         {position}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getExpirationDate = (expiration, available) => {
     const { language } = React.useContext(LanguageContext);
     if (expiration && available) {
          const expirationDateUnix = moment.unix(expiration);
          let expirationDate = moment(expirationDateUnix).format('MMM D, YYYY');
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'hold_pickup_by')}:
                    </Text>
                    <Text fontSize="$xs">
                         {expirationDate}
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getRenewalCount = (count, available = null) => {
     const { language } = React.useContext(LanguageContext);
     if (available) {
          return (
               <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text fontSize="$xs" bold>
                         {getTermFromDictionary(language, 'checkout_renewed')}:
                    </Text>
                    <Text fontSize="$xs">
                         {count} of {available} times
                    </Text>
               </HStack>
          );
     } else {
          return null;
     }
};

export const getCollectionName = (source, collectionName = null) => {
	const { language } = React.useContext(LanguageContext);
	if (source === 'overdrive' && collectionName) {
		return (
		     <HStack space="xs" maxW="$full" flexWrap="wrap">
                    <Text bold fontSize="$xs">
                         {getTermFromDictionary(language, 'collection')}:
                    </Text>
                    <Text fontSize="$xs">
                         {collectionName}
                    </Text>
               </HStack>
		);
	} else {
		return null;
	}
}
