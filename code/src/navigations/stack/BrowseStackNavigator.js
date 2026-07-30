import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Icon } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import Scanner from '../../components/Scanner';
import TitleWithLogo from '../../components/TitleWithLogo'
import { LanguageContext, ThemeContext } from '../../context/initialContext';

import { DiscoverHomeScreen } from '../../screens/Home/Home';
import { EventScreen } from '../../screens/Event/Event';
import { CreateLocalIllRequest } from '../../screens/GroupedWork/CreateLocalIllRequest';
import { CreateLocalIllRequestEmail } from '../../screens/GroupedWork/CreateLocalIllRequestEmail';
import { Editions } from '../../screens/GroupedWork/Editions';
import { GroupedWorkScreen } from '../../screens/GroupedWork/GroupedWork';
import { WhereIsIt } from '../../screens/GroupedWork/WhereIsIt';
import { Facet } from '../../screens/Search/Facet';
import { SearchIndexScreen } from '../../screens/Search/Facets/SearchIndex';
import { SearchSourceScreen } from '../../screens/Search/Facets/SearchSource';
import { FiltersScreen } from '../../screens/Search/Filters';
import { SearchResultsForBrowseCategory } from '../../screens/Search/SearchByCategory';
import { SearchResultsForList } from '../../screens/Search/SearchByList';
import { SearchResultsForSavedSearch } from '../../screens/Search/SearchBySavedSearch';
import { SearchResults } from '../../screens/Search/SearchResults';
import { BackIcon } from '../../themes/theme';
import { getTermFromDictionary } from '../../translations/TranslationService';

const BrowseStackNavigator = () => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     const Stack = createNativeStackNavigator();
     return (
          <Stack.Navigator
               id="BrowseStack"
               initialRouteName="HomeScreen"
               screenOptions={() => ({
                    headerShown: true,
                    gestureEnabled: false,
                    headerBackButtonDisplayMode: 'minimal',
                    headerBackImage: () => <BackIcon />,
               })}>
               <Stack.Screen
                    name="HomeScreen"
                    component={DiscoverHomeScreen}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'nav_discover');
                              return <TitleWithLogo title={title} hideBack={true} />;
                         },
                         //title: getTermFromDictionary(language, 'nav_discover'),
                    }}
               />
               <Stack.Screen
                    name="GroupedWorkScreen"
                    component={GroupedWorkScreen}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params.title ?? getTermFromDictionary(language, 'item_details');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params.title ?? getTermFromDictionary(language, 'item_details'),
                    })}
                    initialParams={{ prevRoute: 'HomeScreen' }}
               />
               <Stack.Screen
                    name="CopyDetails"
                    component={WhereIsIt}
                    options={({ navigation }) => ({
                         title: getTermFromDictionary(language, 'where_is_it'),
                         headerShown: true,
                         presentation: 'modal',
                         headerLeft: () => {
                              return <></>;
                         },
                         headerRight: () => (
                              <Pressable onPress={() => navigation.goBack()} mr="$3" p="$1">
                                   <Icon as={MaterialIcons} name="close" size="md" color={textColor} />
                              </Pressable>
                         ),
                    })}
               />
               <Stack.Screen
                    name="CreateLocalIllRequest"
                    component={CreateLocalIllRequest}
                    options={({ navigation }) => ({
                         title: getTermFromDictionary(language, 'ill_request_title'),
                         presentation: 'modal',
                         headerLeft: () => {
                              return <></>;
                         },
                         headerRight: () => (
                              <Pressable onPress={() => navigation.goBack()} mr="$3" p="$1">
                                   <Icon as={MaterialIcons} name="close" size="md" color={textColor} />
                              </Pressable>
                         ),
                    })}
               />
               <Stack.Screen
                    name="CreateLocalIllRequestEmail"
                    component={CreateLocalIllRequestEmail}
                    options={({ navigation }) => ({
                         title: getTermFromDictionary(language, 'ill_request_title'),
                         presentation: 'modal',
                         headerLeft: () => {
                              return <></>;
                         },
                         headerRight: () => (
                              <Pressable onPress={() => navigation.goBack()} mr="$3" p="$1">
                                   <Icon as={MaterialIcons} name="close" size="md" color={textColor} />
                              </Pressable>
                         ),
                    })}
               />

               <Stack.Screen
                    name="EditionsModal"
                    component={EditionsModal}
                    options={{
                         headerShown: false,
                         presentation: 'modal',
                    }}
               />
               <Stack.Screen
                    name="SearchByCategory"
                    component={SearchResultsForBrowseCategory}
                    options={({ route }) => ({
                         //title: getTermFromDictionary(language, 'results_for') + ' ' + route.params.title,
                         header: () => {
                              const title = getTermFromDictionary(language, 'results_for') + ' ' + route.params.title;
                              return <TitleWithLogo title={title} />;
                         },
                    })}
               />
               <Stack.Screen
                    name="CategoryResultItem"
                    component={GroupedWorkScreen}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params.title ?? getTermFromDictionary(language, 'item_details');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params.title ?? getTermFromDictionary(language, 'item_details'),
                    })}
                    initialParams={{ prevRoute: 'SearchResults' }}
               />
               <Stack.Screen
                    name="SearchByList"
                    component={SearchResultsForList}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params?.title ? getTermFromDictionary(language, 'results_for') + ' ' + route.params.title : getTermFromDictionary(language, 'search_results');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params?.title ? getTermFromDictionary(language, 'results_for') + ' ' + route.params.title : getTermFromDictionary(language, 'search_results'),
                    })}
               />
               <Stack.Screen
                    name="ListResults"
                    component={SearchResultsForList}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params?.title ? getTermFromDictionary(language, 'results_for') + ' ' + route.params.title : getTermFromDictionary(language, 'search_results');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params?.title ? getTermFromDictionary(language, 'results_for') + ' ' + route.params.title : getTermFromDictionary(language, 'search_results'),
                    })}
               />
               <Stack.Screen
                    name="ListResultItem"
                    component={GroupedWorkScreen}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params?.title ?? getTermFromDictionary(language, 'item_details');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params?.title ?? getTermFromDictionary(language, 'item_details'),
                    })}
                    initialParams={{ prevRoute: 'SearchResults' }}
               />

               <Stack.Screen
                    name="SearchBySavedSearch"
                    component={SearchResultsForSavedSearch}
                    options={({ route }) => ({
                         header: () => {
                              const title = getTermFromDictionary(language, 'results_for') + ' ' + route.params.title;
                              return <TitleWithLogo title={title} />;
                         },
                         //title: getTermFromDictionary(language, 'results_for') + ' ' + route.params.title,
                    })}
               />
               <Stack.Screen
                    name="SavedSearchResultItem"
                    component={GroupedWorkScreen}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params.title ?? getTermFromDictionary(language, 'item_details');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params.title ?? getTermFromDictionary(language, 'item_details'),
                    })}
                    initialParams={{ prevRoute: 'SearchResults' }}
               />
               <Stack.Screen
                    name="SearchResults"
                    component={SearchResults}
                    options={({ route }) => ({
                         header: () => {
                              const title = getTermFromDictionary(language, 'results_for') + ' ' + route.params.term;
                              return <TitleWithLogo title={title} />;
                         },
                         //                         title: getTermFromDictionary(language, 'results_for') + ' ' + route.params.term,
                         params: {
                              pendingParams: [],
                         },
                    })}
               />
               <Stack.Screen
                    name="modal"
                    component={FilterModal}
                    options={{
                         headerShown: false,
                         presentation: 'modal',
                    }}
               />
               <Stack.Screen
                    name="Scanner"
                    component={Scanner}
                    options={{
                         gestureEnabled: false,
                         presentation: 'modal',
                    }}
               />
               <Stack.Screen
                    name="EventScreen"
                    component={EventScreen}
                    options={({ route }) => ({
                         header: () => {
                              const title = route.params.title ?? getTermFromDictionary(language, 'event_details');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: route.params.title ?? getTermFromDictionary(language, 'event_details'),
                    })}
                    initialParams={{ prevRoute: 'HomeScreen' }}
               />
          </Stack.Navigator>
     );
};

const EditionsStack = createNativeStackNavigator();
export const EditionsModal = () => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     return (
          <EditionsStack.Navigator
               id="EditionsStack"
               screenOptions={({ navigation, route }) => ({
                    headerShown: false,
                    animationTypeForReplace: 'push',
                    gestureEnabled: false,
                    headerLeft: () => {
                         if (route.name !== 'Editions') {
                              return (
                                   <Pressable onPress={() => navigation.goBack()} mr="$3" p="$1">
                                        <Icon as={MaterialIcons} name="chevron-left" size="md" />
                                   </Pressable>
                              );
                         } else {
                              return null;
                         }
                    },
                    headerRight: () => (
                         <Pressable onPress={() => navigation.getParent().pop()} mr="$3" p="$1">
                              <Icon as={MaterialIcons} name="close" size="md" color={textColor}/>
                         </Pressable>
                    ),
               })}>
               <EditionsStack.Screen
                    name="Editions"
                    component={Editions}
                    options={{
                         title: getTermFromDictionary(language, 'editions'),
                         headerShown: true,
                         presentation: 'card',
                    }}
               />
               <EditionsStack.Screen
                    name="WhereIsIt"
                    component={WhereIsIt}
                    options={{
                         title: getTermFromDictionary(language, 'where_is_it'),
                         headerShown: true,
                         presentation: 'card',
                    }}
               />
          </EditionsStack.Navigator>
     );
};

const FilterModalStack = createNativeStackNavigator();
const FilterModal = () => {
     const { language } = React.useContext(LanguageContext);
     const {textColor} = React.useContext(ThemeContext);
     return (
          <FilterModalStack.Navigator
               id="SearchFilters"
               screenOptions={({ navigation }) => ({
                    headerShown: true,
                    animation: 'slide_from_right',
                    headerBackButtonDisplayMode: 'minimal',
                    headerRight: () => (
                         <Pressable onPress={() => navigation.getParent().pop()} mr="$3" p="$1">
                              <Icon as={MaterialIcons} name="close" size="md" color={textColor} />
                         </Pressable>
                    ),
               })}>
               <FilterModalStack.Screen
                    name="Filters"
                    component={FiltersScreen}
                    options={{
                         title: getTermFromDictionary(language, 'filters'),
                         headerLeft: () => null,
                    }}
               />
               <FilterModalStack.Screen
                    name="Facet"
                    component={Facet}
                    options={({ route }) => ({
                         title: route.params.title,
                    })}
               />
               <FilterModalStack.Screen
                    name="SearchSource"
                    component={SearchSourceScreen}
                    options={{
                         title: getTermFromDictionary(language, 'search_in'),
                    }}
               />
               <FilterModalStack.Screen
                    name="SearchIndex"
                    component={SearchIndexScreen}
                    options={{
                         title: getTermFromDictionary(language, 'search_by'),
                    }}
               />
          </FilterModalStack.Navigator>
     );
};

export default BrowseStackNavigator;
