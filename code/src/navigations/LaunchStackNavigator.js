import { useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
     CheckoutsContext,
     HoldsContext,
     LanguageContext,
     SearchContext,
     SystemMessagesContext,
     ThemeContext,
} from '../context/initialContext';
import { useCatalogStatus, useLibrary, useLibraryMenu, useLibraryUrl, useLibraryVersion } from '../hooks/useLibrarySystemData';
import { LoadingScreen } from '../screens/Auth/Loading';
import AccountDrawer from './drawer/DrawerNavigator';

const LaunchStackNavigator = () => {
     const Stack = createNativeStackNavigator();
     const route = useRoute();
     const refreshUserData = route.params?.refreshUserData ?? false;

     const { colorMode: mode, updateColorMode } = React.useContext(ThemeContext);
     const { systemMessages, updateSystemMessages } = React.useContext(SystemMessagesContext);
     const {
          language,
          updateLanguage,
          languages,
          updateLanguages,
          dictionary,
          updateDictionary,
          languageDisplayName,
          updateLanguageDisplayName,
     } = React.useContext(LanguageContext);
     const { checkouts } = React.useContext(CheckoutsContext);
     const { holds } = React.useContext(HoldsContext);
     const {
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
     } = React.useContext(SearchContext);

     const library = useLibrary();
     const version = useLibraryVersion();
     const url = useLibraryUrl();
     const menu = useLibraryMenu();
     const { status: catalogStatus, message: catalogStatusMessage } = useCatalogStatus();

     return (
          <Stack.Navigator
               initialRouteName="LoadingScreen"
               screenOptions={{
                    headerShown: false,
                    headerBackTitleVisible: false,
                    gestureEnabled: false,
               }}>
               {refreshUserData ? (
                    <Stack.Screen
                         name="LoadingScreen"
                         component={LoadingScreen}
                         options={{
                              animationEnabled: false,
                              header: () => null,
                         }}
                    />
               ) : null}
               <Stack.Screen
                    name="DrawerStack"
                    component={AccountDrawer}
                    options={{
                         libraryContext: {
                              library,
                              version,
                              url,
                              menu,
                              catalogStatus,
                              catalogStatusMessage,
                         },
                         checkoutsContext: { checkouts },
                         holdsContext: { holds },
                         languageContext: {
                              language,
                              updateLanguage,
                              languages,
                              updateLanguages,
                              dictionary,
                              updateDictionary,
                              languageDisplayName,
                              updateLanguageDisplayName,
                         },
                         systemMessagesContext: { systemMessages, updateSystemMessages },
                         themeContext: { mode, updateColorMode },
                         searchContext: {
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
                         },
                    }}
               />
          </Stack.Navigator>
     );
};

export default LaunchStackNavigator;
