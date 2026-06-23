import { MaterialIcons } from '@expo/vector-icons';
import _ from 'lodash';
import moment from 'moment';
import { Box, Button, ButtonText, ButtonIcon, Menu, MenuItem, MenuItemLabel } from '@gluestack-ui/themed';
import React from 'react';
import { LanguageContext, LibrarySystemContext, ThemeContext } from '../context/initialContext';
import { saveLanguage } from '../util/api/user';

import {decodeHTML } from '../helpers/helpers';
import { GLOBALS } from '../util/globals';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage, getErrorMessage } from '../util/logging.js';
import { createApiClient } from '../util/api/apiFactory';

/** *******************************************************************
 * General
 ******************************************************************* **/
export const LanguageSwitcher = () => {
     const { theme, colorMode, textColor } = React.useContext(ThemeContext);
     const { library } = React.useContext(LibrarySystemContext);
     const { language, updateLanguage, languages, updateDictionary, languageDisplayName, updateLanguageDisplayName } = React.useContext(LanguageContext);
     const [label, setLabel] = React.useState(getLanguageDisplayName(language, languages));

     const [isLanguageMenuOpen, setIsLanguageMenuOpen] = React.useState(false);

     const changeLanguage = async (val) => {
          const tmp = val;
          await saveLanguage(tmp, library.baseUrl).then(async (result) => {
               if (result) {
                    updateLanguage(tmp);
                    updateLanguageDisplayName(getLanguageDisplayName(tmp, languages));
                    await getTranslatedTermsForUserPreferredLanguage(tmp, library.baseUrl).then(() => {
                         updateDictionary(translationsLibrary);
                    });
               } else {
                    logErrorMessage('there was an error updating the language...');
               }
          });
     };

     if (_.isArray(languages) && _.size(languages) > 1) {
          return (
               <Box>
                    <Menu
                         bgColor={colorMode === 'light' ? theme['colors']['warmGray']['50'] : theme['colors']['coolGray']['700']}
                         isOpen={isLanguageMenuOpen}
                         onClose={() => setIsLanguageMenuOpen(false)}
                         onOpen={() => setIsLanguageMenuOpen(true)}
                         placement="top"
                         selectedKeys={language} selectionMode="single"
                         trigger={(triggerProps) => {
                              return (
                                   <Button size="sm" variant="link" {...triggerProps} onPress={() => {setIsLanguageMenuOpen(true)}}>
                                        <ButtonIcon as={MaterialIcons} name="language" color={theme['colors']['secondary']['500']} />
                                        <ButtonText color={theme['colors']['secondary']['500']}>{languageDisplayName}</ButtonText>
                                   </Button>
                              );
                         }}>
                         {_.isArray(languages) ? (
                              <>
                                   {languages.map((language, index) => {
                                        return (
                                             <MenuItem
                                                  key={language.code}
                                                  textValue={language.code}
                                                  onPress={() => {
                                                       setIsLanguageMenuOpen(false);
                                                       changeLanguage(language.code);
                                                  }}
                                             >
                                                  <MenuItemLabel color={textColor}>{language.displayName}</MenuItemLabel>
                                             </MenuItem>
                                        );
                                   })}
                              </>
                         ) : null}
                    </Menu>
               </Box>
          );
     }

     return null;
};

/**
 * Returns translation of a single term for the given language
 * @param term
 * @param language
 * @param url
 * @returns {Promise<*|unknown[]>}
 */
export async function getTranslation(term, language, url) {
     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutAverage,
          language,
     });

     const response = await client.get('/SystemAPI?method=getTranslation', { term, language });
     if (response.ok) {
          if (response.data?.success) {
               if (response?.data?.result?.[language]?.[term]) {
                    logDebugMessage('Got translation for term: ' + term + ' in language: ' + language);
                    logDebugMessage(response?.data?.result?.[language]?.[term]);
                    return Object.values(response?.data?.result?.[language]?.[term]);
               }
          }
     }
     return term;
}

/**
 * Returns translation of an array of terms for the given language
 * @param terms
 * @param language
 * @param url
 * @returns {Promise<*>}
 */
export async function getTranslations(terms, language, url) {
     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutAverage,
          language,
     });

     const response = await client.get('/SystemAPI?method=getTranslation', {
          terms,
          language,
     });

     if (response.ok) {
          return response.data?.result?.translations;
     }

     logWarnMessage('getTranslations failed');
     logWarnMessage(response);
}

/**
 * Returns translation of a term with interchangeable values in the given language
 * getTranslationsWithValues('last_updated_on', $value, 'en', $url)
 * getTranslationsWithValues('filter_by_source', [$value1, $value2], 'en', $url)
 * @param key
 * @param values
 * @param language
 * @param url
 * @param addToDictionary
 * @returns {Promise<unknown[]|string>}
 */
export async function getTranslationsWithValues(key, values, language, url, addToDictionary = false) {
     const defaults = require('../translations/defaults.json');
     const term = defaults[key];

     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutAverage,
          language,
     });

     const response = await client.get('/SystemAPI?method=getTranslationWithValues', {
          term,
          values,
          language,
     });

     if (response.ok) {
          if (response.data?.result?.translation) {
               if (Object.values(response.data?.result?.translation) && addToDictionary) {
                    const lastUpdated = {
                         lastUpdated: moment(),
                    };
                    translationsLibrary = _.merge(translationsLibrary, lastUpdated);

                    const translation = Object.values(response.data?.result?.translation);
                    const obj = {
                         [language]: {
                              [key]: translation[0],
                         },
                    };
                    translationsLibrary = _.merge(translationsLibrary, obj);
               }
               return Object.values(response.data?.result?.translation);
          }
     }

     return decodeHTML(term);
}

/**
 * Returns the display name for the given language code
 * @param {string} code
 * @param {string} languages
 **/
export function getLanguageDisplayName(code, languages) {
     let language = _.filter(languages, ['code', code]);
     language = _.values(language[0]);
     return language[3];
}

/**
 * Local storage for translated terms
 */
export let translationsLibrary = {
     lastUpdated: moment(),
};

// Make sure we only load translations once.
const activeTranslationRequests = {};
/**
 * Returns translation of terms used in Aspen LiDA for the given language
 * @param language
 * @param url
 * @returns {Promise<void>}
 */
export async function loadTranslationsFromDiscovery(language, url) {
     const defaults = require('../translations/defaults.json');

     const isEmptyDefaults =
          !defaults ||
          (Array.isArray(defaults) && defaults.length === 0) ||
          (typeof defaults === 'object' && Object.keys(defaults).length === 0);

     if (isEmptyDefaults) {
          logInfoMessage("Skipping getBulkTranslations because defaults.json is empty.");
          const obj = {
               [language]: {},
          };
          translationsLibrary = _.merge(translationsLibrary, obj);
          return;
     }

     let numDefaultTerms;
     if (Array.isArray(defaults)) {
          numDefaultTerms = defaults.length
     }else{
          numDefaultTerms = Object.keys(defaults).length;
     }

     if (activeTranslationRequests[language]) {
          logInfoMessage(`[Sync] Request for "${language}" is already loading. Joining existing queue.`);
          return activeTranslationRequests[language];
     }

     activeTranslationRequests[language] = (async () => {
          try {
               const client = createApiClient({
                    url,
                    timeout: GLOBALS.timeoutFast,
                    language,
               });

               logDebugMessage("Loading bulk translations for " + numDefaultTerms + " terms");
               const response = await client.post(
                    '/SystemAPI?method=getBulkTranslations',
                    { terms: defaults },
                    {
                         params: { language },
                         headers: { 'Content-Type': 'application/json' },
                    },
                    false
               );

               if (response.ok) {
                    const translation = response?.data?.result?.[language] ?? defaults;
                    const lastUpdated = {
                         lastUpdated: moment(),
                    };
                    translationsLibrary = _.merge(translationsLibrary, lastUpdated);

                    if (_.isObject(translation)) {
                         const obj = {
                              [language]: translation,
                         };
                         translationsLibrary = _.merge(translationsLibrary, obj);
                    }
               } else {
                    const obj = {
                         [language]: defaults,
                    };
                    translationsLibrary = _.merge(translationsLibrary, obj);
                    logDebugMessage('loadTranslationsFromDiscovery failed');
                    logDebugMessage(response);
                    getErrorMessage(response.code, response.problem);
               }
          } catch (error) {
               logErrorMessage("Uncaught error inside synchronized loadTranslationsFromDiscovery: " + error.message);
               // Fallback to defaults on catastrophic crash
               const obj = {
                    [language]: defaults,
               };

               translationsLibrary = _.merge(translationsLibrary, obj);
          } finally {
               // 4. Cleanup: Clear the lock once done so future updates can trigger if needed
               delete activeTranslationRequests[language];
          }
     })();

     // Execute the promise for the first caller
     return activeTranslationRequests[language];
}

/**
 * Returns translation of terms used in Aspen LiDA for the given language
 * @param {array} terms
 * @param {string} language
 * @param {string} url
 **/
async function getTranslatedTermWithValues(terms, language, url) {
     _.map(terms, async function (term) {
          await getTranslationsWithValues(term.key, term.value, language, url, true);
     });
}

/**
 * Updates dictionary for translations used in Aspen LiDA for the given language
 * @param {string} language // the language code used in Aspen Discovery
 * @param {string} url
 **/
export async function getTranslatedTermsForUserPreferredLanguage(language, url) {
     logDebugMessage('Getting translations for ' + language + '...');
     await loadTranslationsFromDiscovery(language, url);
     logDebugMessage('getTranslatedTermsForUserPreferredLanguage:' + translationsLibrary.lastUpdated);
     return true;
}

export const getTermFromDictionary = (language = 'en', key, ellipsis = false) => {
     if (language && key) {
          let tmpDictionary = translationsLibrary;
          try {
               const { dictionary } = React.useContext(LanguageContext);
               if (!_.isUndefined(dictionary)) {
                    tmpDictionary = dictionary;
               }
          } catch (e) {
               // can't use context in this scenario
          }
          if (!_.isUndefined(tmpDictionary)) {
               if (tmpDictionary[language]) {
                    const thisDictionary = tmpDictionary[language];
                    if (thisDictionary[key]) {
                         if (ellipsis) {
                              return tmpDictionary[language][key] + '...';
                         }
                         return tmpDictionary[language][key];
                    } else {
                         if (tmpDictionary.en) {
                              const englishDictionary = tmpDictionary.en;
                              if (englishDictionary[key]) {
                                   if (ellipsis) {
                                        return englishDictionary[key] + '...';
                                   }
                                   return englishDictionary[key];
                              }
                         }
                    }
               }
          }
     }
     let defaults = require('../translations/defaults.json');
     if (ellipsis) {
          return defaults[key] + '...';
     }
     return defaults[key];
};

export const getVariableTermFromDictionary = async (language, key, url) => {
     if (language && key) {
          let tmpDictionary = translationsLibrary;
          try {
               const { dictionary } = React.useContext(LanguageContext);
               if (!_.isUndefined(dictionary)) {
                    tmpDictionary = dictionary;
               }
          } catch (e) {
               // can't use context in this scenario
          }
          if (tmpDictionary[language]) {
               const thisDictionary = tmpDictionary[language];
               if (thisDictionary[key]) {
                    logDebugMessage("Got variable term from dictionary");
                    logDebugMessage(Object.values(tmpDictionary[language][key]));
                    return Object.values(tmpDictionary[language][key]);
               } else {
                    // fetch translated term from Discovery and add to dictionary for later
                    //const {library} = React.useContext(LibrarySystemContext);
                    let localDictionary = tmpDictionary;
                    const term = await getTranslation(key, language, url);
                    const obj = {
                         [language]: {
                              [key]: term,
                         },
                    };
                    localDictionary = _.merge(localDictionary, obj);
                    translationsLibrary = _.merge(translationsLibrary, obj);
                    //updateDictionary(localDictionary);
               }
          }
     }
     return key;
};
