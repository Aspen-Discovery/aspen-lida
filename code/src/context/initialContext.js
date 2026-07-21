import { useToken } from '@gluestack-ui/themed';
import * as Device from 'expo-device';
import _ from 'lodash';
import React, { useState } from 'react';
import { getTermFromDictionary } from '../translations/TranslationHelper';
import { BRANCH, PATRON } from '../util/globals';
import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../util/logging.js';
import { formatDiscoveryVersion } from '../helpers/helpers';

export const ThemeContext = React.createContext({
     theme: [],
     updateTheme: () => {},
     colorMode: 'light',
     updateColorMode: () => {},
     resetTheme: () => {},
});
export const DiscoveryContext = React.createContext();
export const UserContext = React.createContext({
     updateUser: () => {},
     user: [],
     updateLinkedAccounts: () => {},
     accounts: [],
     updateLists: () => {},
     lists: [],
     listGroups: [],
     updateListGroups: () => {},
     updateLanguage: () => {},
     language: [],
     updatePickupLocations: () => {},
     locations: [],
     updateSublocations: () => {},
     sublocations: [],
     readingHistory: [],
     updateReadingHistory: () => {},
     savedEvents: [],
     updateSavedEvents: () => {},
     cards: [],
     updateCards: () => {},
     notificationSettings: [],
     updateNotificationSettings: () => {},
     expoToken: false,
     userDebugMessage: '',
     updateUserDebugMessage: () => {},
     resetUser: () => {},
     updateExpoToken: () => {},
     notificationOnboard: 0,
     updateNotificationOnboard: () => {},
     notificationOnboardStatus: false,
     updateNotificationOnboardStatus: () => {},
     appPreferences: [],
     updateAppPreferences: () => {},
     notificationHistory: [],
     updateNotificationHistory: () => {},
     inbox: [],
     updateInbox: () => {},
     userCheckoutSortMethod: 'dueAsc',
     updateUserCheckoutSortMethod: () => {},
     userHoldPendingSortMethod: 'sortTitle',
     updateUserHoldReadySortMethod: 'expire',
     updateUserHoldPendingSortMethod: () => {},
     preferredPickupLocationIsValid: true,
     updatePreferredPickupLocationIsValid: () => {},
     preferredPickupLocationWarning: "",
     updatePreferredPickupLocationWarning: () => {},
     savedSearches: [],
     updateSavedSearches: () => {},
});
export const LibrarySystemContext = React.createContext({
     updateLibrary: () => {},
     library: [],
     version: '',
     url: '',
     menu: [],
     catalogStatus: 0,
     catalogStatusMessage: '',
     updateCatalogStatus: () => {},
     updateCatalogStatusMessage: () => {},
     updateMenu: () => {},
     updateHomeScreenLinks: () => {},
     homeScreenLinks: [],
     resetLibrary: () => {},
});
export const LibraryBranchContext = React.createContext({
     updateLocation: () => {},
     location: [],
     resetLocation: () => {},
     scope: '',
     updateScope: () => {},
     enableSelfCheck: false,
     updateEnableSelfCheck: () => {},
     selfCheckSettings: [],
     updateSelfCheckSettings: () => {},
     locations: [],
     updateLocations: () => {},
});
export const BrowseCategoryContext = React.createContext({
     updateBrowseCategories: () => {},
     category: [],
     updateBrowseCategoryList: () => {},
     list: [],
     updateMaxCategories: () => {},
     maxNum: 5,
     resetBrowseCategories: () => {},
});
export const CheckoutsContext = React.createContext({
     updateCheckouts: () => {},
     checkouts: [],
     resetCheckouts: () => {},
});
export const HoldsContext = React.createContext({
     updateHolds: () => {},
     holds: [],
     resetHolds: () => {},
});
export const GroupedWorkContext = React.createContext({
     updateGroupedWork: () => {},
     updateFormat: () => {},
     updateLanguage: () => {},
     groupedWork: [],
     format: [],
     language: [],
     resetGroupedWork: () => {},
});
export const LanguageContext = React.createContext({
     updateLanguage: () => {},
     language: '',
     languageDisplayName: '',
     languages: [],
     dictionary: [],
     updateLanguages: () => {},
     updateDictionary: () => {},
     resetLanguage: () => {},
     updateLanguageDisplayName: () => {},
});
export const SystemMessagesContext = React.createContext({
     updateSystemMessages: () => {},
     systemMessages: [],
     resetSystemMessages: () => {},
});

export const SearchContext = React.createContext({
     query: '',
     currentIndex: 'Keyword',
     currentSource: 'local',
     sources: [],
     indexes: [],
     facets: [],
     sort: 'relevance',
     updateQuery: () => {},
     updateCurrentIndex: () => {},
     updateCurrentSource: () => {},
     updateIndexes: () => {},
     updateSources: () => {},
     updateFacets: () => {},
     updateSort: () => {},
     resetSearch: () => {},
});

export const ThemeProvider = ({ children }) => {
     const [theme, setTheme] = useState([]);
     const [colorMode, setColorMode] = useState('light');
     const [textColor, setTextColor] = useState('textLight50');
     const darkText = useToken('colors', 'textLight950');
     const lightText = useToken('colors', 'textLight50');

     const updateTheme = (data) => {
          setTheme(data);
     };

     const updateColorMode = (data) => {
          if (data !== colorMode) {
               setColorMode(data);
               logDebugMessage('Updated color mode in context to ' + data);
          }
          if (data === 'light') {
               updateTextColor(darkText);
          }

          if (data === 'dark') {
               updateTextColor(lightText);
          }
     };

     const updateTextColor = (data) => {
          if (data != textColor) {
               setTextColor(data);
               logDebugMessage('Updated text color in context');
          }
     };

     const resetTheme = () => {
          setTheme([]);
     };

     return (
          <ThemeContext.Provider
               value={{
                    theme,
                    updateTheme,
                    colorMode,
                    updateColorMode,
                    textColor,
                    updateTextColor,
                    resetTheme,
               }}>
               {children}
          </ThemeContext.Provider>
     );
};

export const DiscoveryProvider = ({ children }) => {
     const [version, setVersion] = useState();
     const [url, setUrl] = useState();

     const updateUrl = (data) => {
          setUrl(data);
     };

     return (
          <DiscoveryContext.Provider
               value={{
                    version,
                    url,
                    updateUrl,
               }}>
               {children}
          </DiscoveryContext.Provider>
     );
};

export const LibrarySystemProvider = ({ children }) => {
     const [library, setLibrary] = useState();
     const [version, setVersion] = useState();
     const [url, setUrl] = useState();
     const [menu, setMenu] = useState();
     const [catalogStatus, setCatalogStatus] = useState();
     const [catalogStatusMessage, setCatalogStatusMessage] = useState();
     const [homeScreenLinks, setHomeScreenLinks] = useState();

     const updateLibrary = (data) => {
          if (!_.isUndefined(data.discoveryVersion)) {
               logInfoMessage("Setting discovery version to " + data.discoveryVersion);
               const discovery = formatDiscoveryVersion(data.discoveryVersion);
               if (version != discovery) {
                    setVersion(discovery);
                    logDebugMessage('updated version in LibrarySystemContext');
               }
          }else{
               logInfoMessage("discoveryVersion was undefined");
               logDebugMessage(data);
          }

          if (!_.isUndefined(data.baseUrl)) {
               setUrl(data.baseUrl);
               logDebugMessage('updated url in LibrarySystemContext');
          }
          setLibrary(data);
          logDebugMessage('updated LibrarySystemContext');
     };

     const updateHomeScreenLinks = (data) => {
          setHomeScreenLinks(data);
          logDebugMessage('updated home screen links in LibrarySystemContext');
     }

     const resetLibrary = () => {
          setLibrary({});
          setVersion({});
          setUrl({});
          setMenu({});
          setCatalogStatus(0);
          setCatalogStatusMessage('');
          setHomeScreenLinks([]);
          logDebugMessage('reset LibrarySystemContext');
     };

     const updateMenu = (data) => {
          setMenu(data);
          logDebugMessage('updated menu in LibrarySystemContext');
     };

     const updateCatalogStatus = (data) => {
          logDebugMessage(data);

          if (data.status) {
               setCatalogStatus(data.status);
               logDebugMessage('updated catalog status');
          } else {
               setCatalogStatus(0);
          }

          if (data.message) {
               setCatalogStatusMessage(data.message);
               logDebugMessage('updated catalog status message');
          } else {
               setCatalogStatusMessage('');
          }
     };

     return (
          <LibrarySystemContext.Provider
               value={{
                    library,
                    version,
                    url,
                    updateLibrary,
                    resetLibrary,
                    menu,
                    updateMenu,
                    catalogStatus,
                    catalogStatusMessage,
                    updateCatalogStatus,
                    homeScreenLinks,
                    updateHomeScreenLinks,
               }}>
               {children}
          </LibrarySystemContext.Provider>
     );
};

export const LibraryBranchProvider = ({ children }) => {
     const [location, setLocation] = useState();
     const [scope, setScope] = useState();
     const [enableSelfCheck, setEnableSelfCheck] = useState(false);
     const [selfCheckSettings, setSelfCheckSettings] = useState([]);
     const [locations, setLocations] = useState();

     const updateLocation = (data) => {
          setLocation(data);

          logDebugMessage('updated LibraryBranchContext');
     };

     const updateScope = (data) => {
          setScope(data);
          logDebugMessage('updated scope in LibraryBranchContext');
     };

     const resetLocation = () => {
          setLocation({});
          setScope({});
          logDebugMessage('reset LibraryBranchContext');
     };

     const updateEnableSelfCheck = (status) => {
          setEnableSelfCheck(status);
          logDebugMessage('updated self check in LibraryBranchContext');
     };

     const updateSelfCheckSettings = (data) => {
          setSelfCheckSettings(data);
          logDebugMessage('updated self check settings in LibraryBranchContext');
     };

     const updateLocations = (data) => {
          setLocations(data);
          logDebugMessage('updated locations in LibraryBranchContext');
     };

     return (
          <LibraryBranchContext.Provider
               value={{
                    location,
                    scope,
                    enableSelfCheck,
                    selfCheckSettings,
                    locations,
                    updateLocation,
                    resetLocation,
                    updateScope,
                    updateEnableSelfCheck,
                    updateSelfCheckSettings,
                    updateLocations,
               }}>
               {children}
          </LibraryBranchContext.Provider>
     );
};

export const UserProvider = ({ children }) => {
     const [user, setUser] = useState([]);
     const [accounts, setLinkedAccounts] = useState([]);
     const [viewers, setLinkedViewerAccounts] = useState([]);
     const [lists, setLists] = useState([]);
     const [listGroups, setListGroups] = useState([]);
     const [language, setLanguage] = useState('en');
     const [languageDisplayName, setLanguageDisplayName] = useState('English');
     const [locations, setPickupLocations] = useState([]);
     const [readingHistory, setReadingHistory] = useState([]);
     const [savedEvents, setSavedEvents] = useState([]);
     const [cards, setCards] = useState([]);
     const [notificationSettings, setNotificationSettings] = useState([]);
     const [notificationOnboard, setNotificationOnboard] = useState(0);
     const [appPreferences, setAppPreferences] = useState([]);
     const [expoToken, setExpoToken] = useState(false);
     const [userDebugMessage, setUserDebugMessage] = useState([]);
     const [seenNotificationOnboardPrompt, setSeenNotificationOnboardPrompt] = useState(true);
     const [notificationHistory, setNotificationHistory] = useState([]);
     const [inbox, setInbox] = useState([]);
     const [sublocations, setSublocations] = useState([]);
     const [userCheckoutSortMethod, setUserCheckoutSortMethod] = useState('dueAsc');
     const [userHoldPendingSortMethod, setUserHoldPendingSortMethod] = useState('sortTitle');
     const [userHoldReadySortMethod, setUserHoldReadySortMethod] = useState('expire');
     const [preferredPickupLocationIsValid, setPreferredPickupLocationIsValid] = useState(true);
     const [preferredPickupLocationWarning, setPreferredPickupLocationWarning] = useState("");
     const [savedSearches, setSavedSearches] = useState([]);

     const updateUser = (data) => {
          if (user !== data) {
               logDebugMessage("User data changed, updating user");
               if (_.isObject(data) && !_.isUndefined(data.lastListUsed)) {
                    PATRON.listLastUsed = data.lastListUsed;
               }

               if (_.isObject(data) && !_.isUndefined(data.numHolds)) {
                    PATRON.num.holds = data.numHolds;
               }

               if (_.isObject(data) && !_.isUndefined(data.hideSoftDeleteListUI)) {
                    PATRON.hideSoftDeleteListUI = data.hideSoftDeleteListUI;
               }

               setUser(data);

               if (_.isObject(data) && !_.isUndefined(data.holdSortUnavailable)) {
                    updateUserHoldPendingSortMethod(data.holdSortUnavailable);
               }
               if (_.isObject(data) && !_.isUndefined(data.holdSortAvailable)) {
                    updateUserHoldReadySortMethod(data.holdSortAvailable);
               }
               if (_.isObject(data) && !_.isUndefined(data.checkoutSort)) {
                    updateUserCheckoutSortMethod(data.checkoutSort);
               }

               logDebugMessage('Finished updating UserContext');
          } else {
               logDebugMessage("User data hasn't changed");
          }
     };

     const resetUser = () => {
          setUser({});
          setLists({});
          setListGroups({});
          setLinkedAccounts({});
          setLanguage({});
          logDebugMessage('reset UserContext');
     };

     const updateLists = (data) => {
          setLists(data);
          //logDebugMessage('updated lists in UserContext');
     };

     const updateListGroups = (data) => {
          setListGroups(data);
          //logDebugMessage('updated list groups in UserContext');
     }

     const updateLinkedAccounts = (data) => {
          setLinkedAccounts(data);
          //logDebugMessage('updated linked accounts in UserContext');
     };

     const updateLinkedViewerAccounts = (data) => {
          setLinkedViewerAccounts(data);
          //logDebugMessage('updated linked viewer accounts in UserContext');
     };

     const updateLanguage = (data) => {
          setLanguage(data);
          //logDebugMessage('updated language in UserContext');
     };

     const updateLanguageDisplayName = (data) => {
          setLanguageDisplayName(data);
          //logDebugMessage('updated language display in UserContext');
     };

     const updatePickupLocations = (data) => {
          setPickupLocations(data);
          //logDebugMessage('updated pickup locations in UserContext');
     };

     const updateSublocations = (data) => {
          setSublocations(data);
          //logDebugMessage('updated sublocations in UserContext');
     };

     const updateReadingHistory = (data) => {
          setReadingHistory(data);
          //logDebugMessage('updated reading history in UserContext');
     };

     const updateSavedEvents = (data) => {
          setSavedEvents(data);
          //logDebugMessage('updated saved events in UserContext');
     };

     const updateLibraryCards = (data) => {
          setCards(data);
          //logDebugMessage('updated library cards in UserContext');
     };

     const updatePreferredPickupLocationIsValid = (data) => {
          setPreferredPickupLocationIsValid(data);
          //logDebugMessage('updated preferredPickupLocationIsValid in UserContext');
     };

     const updatePreferredPickupLocationWarning = (data) => {
          setPreferredPickupLocationWarning(data);
          //logDebugMessage('updated preferredPickupLocationWarning to ' + data + ' in UserContext');
     };

     const updateSavedSearches = (data) => {
          setSavedSearches(data);
          //logDebugMessage('updated updateSavedSearches to ' + data + ' in UserContext');
     };

     const updateNotificationSettings = async (data, language, userOnboardStatus) => {
          if (!_.isEmpty(data)) {
               const device = Device.modelName;
               if (_.find(data, _.matchesProperty('device', device))) {
                    logDebugMessage('Found settings for this device model');
                    const deviceSettings = _.filter(data, { device: device });
                    const savedSearches = await getTermFromDictionary(language, 'saved_searches');
                    const alertsFromLibrary = await getTermFromDictionary(language, 'alerts_from_library');
                    const alertsAboutAccount = await getTermFromDictionary(language, 'alerts_about_account');
                    const settings = [];
                    settings.push(
                         {
                              id: 0,
                              label: savedSearches,
                              option: 'notifySavedSearch',
                              description: null,
                              allow: deviceSettings[0].notifySavedSearch ?? 0,
                         },
                         {
                              id: 1,
                              label: alertsFromLibrary,
                              option: 'notifyCustom',
                              description: null,
                              allow: deviceSettings[0].notifyCustom ?? 0,
                         },
                         {
                              id: 2,
                              label: alertsAboutAccount,
                              option: 'notifyAccount',
                              description: null,
                              allow: deviceSettings[0].notifyAccount ?? 0,
                         }
                    );
                    setNotificationSettings(settings);
                    setExpoToken(deviceSettings[0]?.token ?? false);

                    if (deviceSettings && _.isObject(deviceSettings)) {
                         if (_.isObject(deviceSettings[0])) {
                              const settings = deviceSettings[0];
                              if (!_.isUndefined(settings.onboardStatus)) {
                                   setNotificationOnboard(settings.onboardStatus);
                              }
                         }
                    } else {
                         // probably connecting to a Discovery version earlier than 23.07.00
                         setNotificationOnboard(0);
                    }
               } else {
                    logDebugMessage('No settings found for this device model yet');
                    setExpoToken(false);

                    const deviceSettings = _.filter(data, { device: 'Unknown' });
                    if (deviceSettings && _.isObject(deviceSettings)) {
                         if (_.isObject(deviceSettings[0])) {
                              const settings = deviceSettings[0];
                              logDebugMessage(settings);
                              if (!_.isUndefined(settings.onboardStatus)) {
                                   setNotificationOnboard(settings.onboardStatus);
                              }
                         }
                    } else {
                         // fall back to the fall back
                         const savedSearches = await getTermFromDictionary(language, 'saved_searches');
                         const alertsFromLibrary = await getTermFromDictionary(language, 'alerts_from_library');
                         const alertsAboutAccount = await getTermFromDictionary(language, 'alerts_about_account');
                         const settings = [];
                         settings.push(
                              {
                                   id: 0,
                                   label: savedSearches,
                                   option: 'notifySavedSearch',
                                   description: null,
                                   allow: 0,
                              },
                              {
                                   id: 1,
                                   label: alertsFromLibrary,
                                   option: 'notifyCustom',
                                   description: null,
                                   allow: 0,
                              },
                              {
                                   id: 2,
                                   label: alertsAboutAccount,
                                   option: 'notifyAccount',
                                   description: null,
                                   allow: 0,
                              }
                         );
                         setNotificationSettings(settings);
                         setExpoToken(false);
                    }

                    if (userOnboardStatus) {
                         setNotificationOnboard(userOnboardStatus);
                    }
               }
          } else {
               // something went wrong when receiving data from Discovery API
               setExpoToken(false);
               setNotificationOnboard(0);
          }

          //maybe set allowNotifications at this point for initial load?
          logDebugMessage('updated notification settings in UserContext');
     };

     const updateSeenNotificationOnboardPrompt = (data) => {
          setSeenNotificationOnboardPrompt(data);
          //logDebugMessage('updated seenNotificationOnboardPrompt UserContext');
     };

     const updateAppPreferences = (data) => {
          setAppPreferences(data);
          updateNotificationSettings(data.notification_preferences, 'en', data.onboardAppNotifications);
     };

     const updateExpoToken = (data) => {
          setExpoToken(data);
          //logDebugMessage('updated expo token UserContext');
     };

     const updateUserDebugMessage = (data) => {
          logDebugMessage(data);
          setUserDebugMessage(userDebugMessage => {
               const newArray = [data, ...userDebugMessage];
               if (newArray.length > 50) {
                    // Return only the first 50 elements (indices 0 through 49)
                    return newArray.slice(0, 50);
               }
               return newArray;
          });
     }

     const updateNotificationOnboard = (data) => {
          setNotificationOnboard(data);
          //logDebugMessage('updated notification onboard status in UserContext');
     };

     const updateNotificationHistory = (data) => {
          setNotificationHistory(data);
          //logDebugMessage('updated notification history in UserContext');
     };

     const updateInbox = (data) => {
          setInbox(data);
          //logDebugMessage('updated notification inbox in UserContext');
     };

     const updateUserCheckoutSortMethod = (data) => {
          setUserCheckoutSortMethod(data);
          //logDebugMessage('Updated user checkout sort to ' + data);
     };

     const updateUserHoldReadySortMethod = (data) => {
          setUserHoldReadySortMethod(data);
          //logDebugMessage('Updated user checkout sort to ' + data);
     };

     const updateUserHoldPendingSortMethod = (data) => {
          setUserHoldPendingSortMethod(data);
          //logDebugMessage('Updated user checkout sort to ' + data);
     };

     return (
          <UserContext.Provider
               value={{
                    user,
                    updateUser,
                    resetUser,
                    lists,
                    updateLists,
                    listGroups,
                    updateListGroups,
                    accounts,
                    updateLinkedAccounts,
                    viewers,
                    updateLinkedViewerAccounts,
                    language,
                    updateLanguage,
                    languageDisplayName,
                    updateLanguageDisplayName,
                    locations,
                    updatePickupLocations,
                    readingHistory,
                    updateReadingHistory,
                    savedEvents,
                    updateSavedEvents,
                    cards,
                    updateLibraryCards,
                    notificationSettings,
                    updateNotificationSettings,
                    expoToken,
                    updateExpoToken,
                    userDebugMessage,
                    updateUserDebugMessage,
                    notificationOnboard,
                    updateNotificationOnboard,
                    seenNotificationOnboardPrompt,
                    updateSeenNotificationOnboardPrompt,
                    updateAppPreferences,
                    appPreferences,
                    notificationHistory,
                    updateNotificationHistory,
                    inbox,
                    updateInbox,
                    sublocations,
                    updateSublocations,
                    userCheckoutSortMethod,
                    updateUserCheckoutSortMethod,
                    userHoldPendingSortMethod,
                    userHoldReadySortMethod,
                    updateUserHoldPendingSortMethod,
                    updateUserHoldReadySortMethod,
                    updatePreferredPickupLocationIsValid,
                    preferredPickupLocationIsValid,
                    updatePreferredPickupLocationWarning,
                    preferredPickupLocationWarning,
                    savedSearches,
                    updateSavedSearches,
               }}>
               {children}
          </UserContext.Provider>
     );
};

export const BrowseCategoryProvider = ({ children }) => {
     const [category, setCategories] = useState();
     const [list, setCategoryList] = useState();
     const [maxNum, setMaxCategories] = useState();

     const updateBrowseCategories = (data) => {
          setCategories(data);
          logDebugMessage('updated BrowseCategoryContext');
     };

     const updateBrowseCategoryList = (data) => {
          setCategoryList(data);
          logDebugMessage('updated list in BrowseCategoryContext');
     };

     const updateMaxCategories = (data) => {
          setMaxCategories(data);
          logDebugMessage('updated max categories in BrowseCategoryContext');
     };

     const resetBrowseCategories = () => {
          setCategories({});
          setCategoryList({});
          logDebugMessage('reset BrowseCategoryContext');
     };

     return (
          <BrowseCategoryContext.Provider
               value={{
                    category,
                    list,
                    maxNum,
                    updateBrowseCategories,
                    updateBrowseCategoryList,
                    updateMaxCategories,
                    resetBrowseCategories,
               }}>
               {children}
          </BrowseCategoryContext.Provider>
     );
};

export const CheckoutsProvider = ({ children }) => {
     const [checkouts, setCheckouts] = useState();

     const updateCheckouts = (data) => {
          setCheckouts(data);
          logDebugMessage('updated CheckoutsContext');
     };

     const resetCheckouts = () => {
          setCheckouts({});
          logDebugMessage('reset CheckoutsContext');
     };

     return (
          <CheckoutsContext.Provider
               value={{
                    checkouts,
                    updateCheckouts,
                    resetCheckouts,
               }}>
               {children}
          </CheckoutsContext.Provider>
     );
};

export const HoldsProvider = ({ children }) => {
     const [holds, setHolds] = useState();

     const updateHolds = (data) => {
          setHolds(data);
          logDebugMessage('updated HoldsContext');
     };

     const resetHolds = () => {
          setHolds({});
          logDebugMessage('reset HoldsContext');
     };

     return (
          <HoldsContext.Provider
               value={{
                    holds,
                    updateHolds,
                    resetHolds,
               }}>
               {children}
          </HoldsContext.Provider>
     );
};

export const GroupedWorkProvider = ({ children }) => {
     const [groupedWork, setGroupedWork] = useState();
     const [format, setFormat] = useState();
     const [language, setLanguage] = useState();

     const updateGroupedWork = (data) => {
          setGroupedWork(data);
          logDebugMessage('updated GroupedWorkContext');

          const keys = _.keys(data.formats);
          setFormat(_.first(keys));
          logDebugMessage('updated format in GroupedWorkContext:updateGroupedWork');

          setLanguage(data.language);
          logDebugMessage('updated language in GroupedWorkContext:updateGroupedWork');
     };

     const updateFormat = (data) => {
          setFormat(data);
          logDebugMessage('updated format in GroupedWorkContext');
     };

     const updateLanguage = (data) => {
          setLanguage(data);
          logDebugMessage('updated language in GroupedWorkContext');
     };

     const resetGroupedWork = () => {
          setGroupedWork([]);
          logDebugMessage('reset GroupedWorkContext');
     };

     return <GroupedWorkContext.Provider value={{ groupedWork, format, language, updateGroupedWork, updateFormat, updateLanguage, resetGroupedWork }}>{children}</GroupedWorkContext.Provider>;
};

export const LanguageProvider = ({ children }) => {
     const [language, setLanguage] = useState();
     const [languages, setLanguages] = useState();
     const [dictionary, setDictionary] = useState();
     const [languageDisplayName, setLanguageDisplayName] = useState();

     const updateLanguage = (data) => {
          logDebugMessage('updated language to ' + data + ' in LanguageContext');
          PATRON.language = data;
          setLanguage(data);
     };

     const updateLanguages = (data) => {
          logDebugMessage('updated available library languages in LanguageContext');
          setLanguages(data);
     };

     const updateDictionary = (data) => {
          logDebugMessage('updated dictionary in LanguageContext');
          setDictionary(data);
     };

     const updateLanguageDisplayName = (data) => {
          logDebugMessage('updated language display name in LanguageContext');
          setLanguageDisplayName(data);
     };

     return (
          <LanguageContext.Provider
               value={{
                    language,
                    updateLanguage,
                    languages,
                    updateLanguages,
                    dictionary,
                    updateDictionary,
                    languageDisplayName,
                    updateLanguageDisplayName,
               }}>
               {children}
          </LanguageContext.Provider>
     );
};

export const SystemMessagesProvider = ({ children }) => {
     const [systemMessages, setSystemMessages] = useState();

     const updateSystemMessages = (data) => {
          setSystemMessages(data);
          logDebugMessage('updated SystemMessagesContext');
     };

     const resetSystemMessages = () => {
          setSystemMessages({});
          logDebugMessage('reset SystemMessagesContext');
     };

     return (
          <SystemMessagesContext.Provider
               value={{
                    systemMessages,
                    updateSystemMessages,
                    resetSystemMessages,
               }}>
               {children}
          </SystemMessagesContext.Provider>
     );
};

export const SearchProvider = ({ children }) => {
     const [currentIndex, setCurrentIndex] = useState();
     const [currentSource, setCurrentSource] = useState();
     const [indexes, setIndexes] = useState();
     const [sources, setSources] = useState();
     const [facets, setFacets] = useState();
     const [sort, setSort] = useState();
     const [query, setQuery] = useState();

     const updateCurrentIndex = (data) => {
          setCurrentIndex(data);
          logDebugMessage('updated currentIndex in SearchContext');
     };

     const updateCurrentSource = (data) => {
          setCurrentSource(data);
          logDebugMessage('updated currentSource in SearchContext');
     };

     const updateIndexes = (data) => {
          setIndexes(data);
          logDebugMessage('updated indexes in SearchContext');
     };

     const updateSources = (data) => {
          setSources(data);
          logDebugMessage('updated sources in SearchContext');
     };

     const updateFacets = (data) => {
          setFacets(data);
          logDebugMessage('updated facets in SearchContext');
     };

     const updateSort = (data) => {
          setSort(data);
          logDebugMessage('updated sort in SearchContext');
     };

     const updateQuery = (data) => {
          setQuery(data);
          logDebugMessage('updated query in SearchContext');
     };

     const resetSearch = () => {
          setCurrentIndex('Keyword');
          setCurrentSource('local');
          setIndexes({});
          setSources({});
          setQuery('');
          setFacets({});
          setSort('relevance');
          logDebugMessage('reset SearchContext');
     };

     return (
          <SearchContext.Provider
               value={{
                    currentIndex,
                    updateCurrentIndex,
                    currentSource,
                    updateCurrentSource,
                    indexes,
                    updateIndexes,
                    sources,
                    updateSources,
                    facets,
                    updateFacets,
                    query,
                    updateQuery,
                    sort,
                    updateSort,
                    resetSearch,
               }}>
               {children}
          </SearchContext.Provider>
     );
};
