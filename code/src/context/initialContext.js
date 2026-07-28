import _ from 'lodash';
import React, { useState } from 'react';
import { logDebugMessage } from '../util/logging.js';
export const DiscoveryContext = React.createContext();
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
