import moment from 'moment';
import { Badge, Box, Text } from 'native-base';
import React from 'react';

import { LanguageContext, LibrarySystemContext, UserContext } from '../context/initialContext';
import { getTermFromDictionary } from '../translations/TranslationService';

export const isOverdue = (overdue) => {
     const { language } = React.useContext(LanguageContext);
     if (overdue) {
          return (
               <Text>
                    <Badge colorScheme="danger" rounded="4px" mt={-0.5}>
                         {getTermFromDictionary(language, 'checkout_overdue')}
                    </Badge>
               </Text>
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
                    mb={1}
                    pr={3}
                    fontSize={{
                         base: 'sm',
                         lg: 'lg',
                    }}
                    maxW="100%"
                    flexWrap="wrap">
                    {displayTitle}
               </Text>
          );
     } else {
          return null;
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

export const getAuthor = (author) => {
     const { language } = React.useContext(LanguageContext);
     if (author) {
          let displayAuthor = author;
          const countComma = displayAuthor.split(',').length - 1;
          if (countComma > 1) {
               displayAuthor = displayAuthor.substring(0, displayAuthor.lastIndexOf(','));
          }

          return (
               <Text
                    maxW="100%"
                    flexWrap="wrap"
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'author')}:</Text> {displayAuthor}
               </Text>
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
                         <Text
                              fontSize={{
                                   base: 'xs',
                                   lg: 'sm',
                              }}>
                              <Text bold>{getTermFromDictionary(language, 'format')}:</Text> {format !== '' ? format : 'Unknown'} - {source}
                         </Text>
                    );
               }
          }
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'format')}:</Text> {format}
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
                    <Text>
                         <Badge colorScheme="yellow" rounded="4px" mt={-0.5}>
                              {statusMessage}
                         </Badge>
                    </Text>
               );
          }
          return (
               <Text>
                    <Badge colorScheme="yellow" rounded="4px" mt={-0.5}>
                         {status}
                    </Badge>
               </Text>
          );
     } else if (available) {
          let message = getTermFromDictionary(language, 'overdrive_hold_ready');
          if (source === 'ils') {
               message = status;
          }
          return (
               <Text>
                    <Badge colorScheme="green" rounded="4px" mt={-0.5}>
                         {message}
                    </Badge>
               </Text>
          );
     } else {
          if (status) {
               return (
                    <Text>
                         <Badge colorScheme="orange" rounded="4px" mt={-0.5}>
                              {status}
                         </Badge>
                    </Text>
               );
          }
     }
     return null;
};

export const getStatus = (status, source) => {
     const { language } = React.useContext(LanguageContext);
     if (status) {
          if (source === 'vdx') {
               return (
                    <Text
                         fontSize={{
                              base: 'xs',
                              lg: 'sm',
                         }}>
                         <Text bold>{getTermFromDictionary(language, 'hold_status')}:</Text> {status}
                    </Text>
               );
          }
     } else {
          return null;
     }
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
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'hold_source')}:</Text> {type}
               </Text>
          );
     } else {
          return null;
     }
};

export const getOnHoldFor = (user) => {
     const { language } = React.useContext(LanguageContext);
     if (user) {
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'on_hold_for')}:</Text> {user}
               </Text>
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
               <Text
                    maxW="100%"
                    flexWrap="wrap"
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'checked_out_to')}:</Text> {props}
               </Text>
          );
     } else {
          return null;
     }
};

export const getDueDate = (date) => {
     const { language } = React.useContext(LanguageContext);
     if (date && date !== 0) {
          const dueDate = moment.unix(date);
          const itemDueOn = moment(dueDate).format('MMM D, YYYY');
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'checkout_due')}:</Text> {itemDueOn}
               </Text>
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
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'last_used')}:</Text> {itemLastUsedOn}
               </Text>
          );
     }

     return null;
};

export const willAutoRenew = (props) => {
     const { language } = React.useContext(LanguageContext);
     if (props.autoRenew === 1 || props.autoRenew === '1') {
          return (
               <Box mt={1} p={0.5} bgColor="muted.100">
                    <Text
                         fontSize={{
                              base: 'xs',
                              lg: 'sm',
                         }}>
                         <Text bold>{getTermFromDictionary(language, 'if_eligible_auto_renew')}:</Text> {props.renewalDate}
                    </Text>
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
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'hold_pickup_at')}:</Text> {location}
               </Text>
          );
     } else {
          return null;
     }
};

export const getOutOfHoldGroupMessage = (outOfHoldGroupMessage) => {
     const { language } = React.useContext(LanguageContext);
     console.log("Out of hold group message is " + outOfHoldGroupMessage);
     if (outOfHoldGroupMessage) {
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'interlibrary_loan')}:</Text> {outOfHoldGroupMessage}
               </Text>
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
                    <Text
                         fontSize={{
                              base: 'xs',
                              lg: 'sm',
                         }}>
                         <Text bold>{getTermFromDictionary(language, 'hold_position')}:</Text> {holdPosition}
                    </Text>
               );
          }
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'hold_position')}:</Text> {position}
               </Text>
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
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'hold_pickup_by')}:</Text> {expirationDate}
               </Text>
          );
     } else {
          return null;
     }
};

export const getRenewalCount = (count, available = null) => {
     const { language } = React.useContext(LanguageContext);
     if (available) {
          return (
               <Text
                    fontSize={{
                         base: 'xs',
                         lg: 'sm',
                    }}>
                    <Text bold>{getTermFromDictionary(language, 'checkout_renewed')}:</Text> {count} of {available} times
               </Text>
          );
     } else {
          return null;
     }
};

export const getCollectionName = (source, collectionName = null) => {
	const { language } = React.useContext(LanguageContext);
	if (source === 'overdrive' && collectionName) {
		return (
			<Text
				fontSize={{
					base: 'xs',
					lg: 'sm',
				}}>
				<Text bold>{getTermFromDictionary(language, 'collection')}:</Text> {collectionName}
			</Text>
		);
	} else {
		return null;
	}
}
