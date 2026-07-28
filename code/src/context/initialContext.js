import { useToken } from '@gluestack-ui/themed';
import _ from 'lodash';
import React, { useState } from 'react';
import { GLOBALS } from '../util/globals';
import { logDebugMessage, logInfoMessage } from '../util/logging.js';
import { formatDiscoveryVersion } from '../helpers/helpers';

export const ThemeContext = React.createContext({
     theme: [],
     updateTheme: () => {},
     colorMode: 'light',
     updateColorMode: () => {},
     resetTheme: () => {},
});
export const DiscoveryContext = React.createContext();
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
          GLOBALS.language = data;
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
