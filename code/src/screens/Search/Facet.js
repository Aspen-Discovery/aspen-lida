import _ from 'lodash';
import { Box, Button, ButtonGroup, ButtonText, Center, Checkbox, CheckboxGroup, ChevronLeftIcon, Input, InputField, Pressable, VStack } from '@gluestack-ui/themed';
import React from 'react';

// custom components and helper files
import { ScrollView, View } from 'react-native';

import { LoadingSpinner } from '../../components/loadingSpinner';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { LIBRARY, SearchGlobal } from '../../util/globals';
import { searchAvailableFacets } from '../../util/api/search';
import { addAppliedFilter, buildParamsForUrl, removeAppliedFilter } from '../../util/api/searchHelper';
import { Facet_Checkbox } from './Facets/Checkbox';
import { Facet_Date } from './Facets/Date';
import { Facet_RadioGroup } from './Facets/RadioGroup';
import { Facet_Rating } from './Facets/Rating';
import { Facet_Slider } from './Facets/Slider';
import { Facet_Year } from './Facets/Year';
import { UnsavedChangesExit } from './UnsavedChanges';
import { logDebugMessage } from '../../util/logging.js';
import { ThemeContext } from '../../context/initialContext';

export const Facet = ({ route, navigation }) => {
     const _isMounted = React.useRef(false);
     const [isLoading, setIsLoading] = React.useState(true);
     const [title] = React.useState(route.params?.extra['label'] ?? 'Filter');
     const [facets, setFacets] = React.useState(route.params?.facets ?? []);
     const [numFacets, setNumFacets] = React.useState(0);
     const [category] = React.useState(route.params?.extra['field'] ?? '');
     const [multiSelect] = React.useState(Boolean(route.params?.extra['multiSelect']));
     const [filterByQuery, setFilterByQuery] = React.useState('');
     const [isUpdating, setIsUpdating] = React.useState(false);
     const [values, setValues] = React.useState([]);
     const [valuesDefault, setValuesDefault] = React.useState([]);
     const [language] = React.useState(route.params?.language ?? 'en');
     const {theme, textColor, colorMode } = React.useContext(ThemeContext);

     const preselectValues = () => {
          let newValues = [];
          const cluster = _.filter(SearchGlobal.pendingFilters, ['field', category]);
          _.map(cluster, function (item, index, collection) {
               const facets = item['facets'];
               if (_.size(facets) > 0) {
                    _.forEach(facets, function (value, key) {
                         if (multiSelect) {
                              newValues = _.concat(newValues, value);
                         } else {
                              newValues = value;
                         }
                    });
               }
          });
          setValues(newValues);
          setValuesDefault(newValues);
     };

     React.useEffect(() => {
          _isMounted.current = true;

          const initData = async () => {
               const data = _.filter(SearchGlobal.availableFacets, ['field', category]);
               if (data[0]) {
                    setFacets(data[0]['facets']);
                    setNumFacets(_.size(data[0]['facets']));
               }

               preselectValues();
               setIsLoading(false);
          };

          initData();

          return () => {
               _isMounted.current = false;
          };
     }, []);

     React.useEffect(() => {
          const routes = navigation.getState()?.routes;
          const prevRoute = routes[routes.length - 2];
          if (prevRoute) {
               navigation.setOptions({
                    headerLeft: () => (
                         <Pressable
                              mr={3}
                              onPress={() => {
                                   updateGlobal();
                                   navigation.navigate('Filters', {
                                        pendingFilters: SearchGlobal.pendingFilters,
                                   });
                              }}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                              <ChevronLeftIcon size={5} color="primary.baseContrast" />
                         </Pressable>
                    ),
                    headerRight: () => <UnsavedChangesExit updateSearch={updateSearch} discardChanges={discardChanges} updateGlobal={updateGlobal} prevRoute="Filters" language={language} />,
               });
          } else {
               navigation.setOptions({
                    headerLeft: () => <Box />,
                    headerRight: () => <UnsavedChangesExit updateSearch={updateSearch} discardChanges={discardChanges} prevRoute="Filters" language={language} />,
               });
          }
     });

     const filterFacets = async () => {
          await searchAvailableFacets(category, title, filterByQuery, LIBRARY.url, language).then((result) => {
               if (result.success === false) {
                    setIsLoading(false);
               } else {
                    setFacets(result['facets']);
                    setNumFacets(_.size(result['facets']));
                    setIsLoading(false);
               }
          });
     };

     const searchBar = () => {
          const placeHolder = getTermFromDictionary(language, 'search') + ' ' + title;
          /* always display the search bar */
          if (numFacets >= 0) {
               return (
                    <Box p="$5">
                         <Input
                              size="lg"
                              borderColor={colorMode === 'light' ? theme['colors']['coolGray']['500'] : theme['colors']['gray']['300']}
                              color={textColor}
                              variant="outline"
                         >
                              <InputField
                                   value={filterByQuery}
                                   onChangeText={(filterByQuery) => setFilterByQuery(filterByQuery)}
                                   autoCorrect={false}
                                   returnKeyType="search"
                                   placeholder={placeHolder}
                                   color={textColor}
                                   onSubmitEditing={async () => {
                                        setIsLoading(true);
                                        await filterFacets();
                                   }}
                              />
                         </Input>
                    </Box>
               );
          } else {
               return <Box pb="$5" />;
          }
     };

     const updateSearch = (resetFacetGroup = false, toFilters = false) => {
          const params = buildParamsForUrl();
          //console.log(params);
          SearchGlobal.hasPendingChanges = false;
          if (toFilters) {
               navigation.navigate('Filters', {
                    term: SearchGlobal.term,
               });
          } else {
               navigation.navigate('SearchResults', {
                    term: SearchGlobal.term,
                    pendingParams: params,
               });
          }
     };

     const updateCheckboxFacet = (group, value, newValue) => {
          logDebugMessage("Updating facet " + group + " with value " + value + " to " + newValue);
          logDebugMessage("Existing values are " + values);
          let newValues = values;
          if (newValue) {
               newValues = [...values, value];
          }else{
               newValues = newValues.filter(n=>n !== value)
          }
          logDebugMessage("Updated values are " + newValues);
          setValues(newValues);
          SearchGlobal.hasPendingChanges = true;
          updateGlobal(group, newValues);
     };

     const updateLocalValues = (group, newValues) => {
          setValues(newValues);
          logDebugMessage("Updating local values for " + group + " with values " + newValues);
          SearchGlobal.hasPendingChanges = true;
          updateGlobal(group, newValues);
     };

     const updateGlobal = (group, newValues) => {
          logDebugMessage("Updating global values for " + group + " with values " + newValues);
          if (group == 'sort_by') {
               SearchGlobal.sortMethod = newValues;
          }else{
               const prevSelections = values;
               addAppliedFilter(group, newValues, multiSelect);
               if (multiSelect) {
                    const difference = _.difference(prevSelections, newValues);
                    if (difference) {
                         removeAppliedFilter(group, difference);
                    }
               }
          }
     };

     const discardChanges = () => {
          SearchGlobal.hasPendingChanges = true;
          const difference = _.difference(values, valuesDefault);
          if (difference) {
               removeAppliedFilter(category, difference);
          }
          setValues([]);
     };

     const resetCluster = () => {
          SearchGlobal.hasPendingChanges = true;
          removeAppliedFilter(category, values);
          setValues([]);
          updateSearch();
     };

     const actionButtons = () => {
          return (
               <Box p="$3" bgColor={colorMode === 'light' ? theme['colors']['coolGray']['50'] : theme['colors']['coolGray']['700']} shadowOpacity={0.1} shadowRadius={1}>
                    <Center>
                         <ButtonGroup size="lg">
                              <Button variant="link" onPress={() => resetCluster()}>
                                   <ButtonText color={theme['colors']['primary']['500']}>{getTermFromDictionary(language, 'reset')}</ButtonText>
                              </Button>
                              <Button
                                   bgColor={theme['colors']['primary']['500']}
                                   isDisabled={isUpdating}
                                   onPress={() => {
                                        updateSearch();
                                   }}>
                                   <ButtonText color={theme['colors']['primary']['500-text']}>
                                        {isUpdating ? getTermFromDictionary(language, 'updating', true) : getTermFromDictionary(language, 'update')}
                                   </ButtonText>
                              </Button>
                         </ButtonGroup>
                    </Center>
               </Box>
          );
     };

     if (isLoading) {
          return <LoadingSpinner />;
     }

     if (category === 'publishDate' || category === 'birthYear' || category === 'deathYear' || category === 'publishDateSort') {
          return (
               <VStack flex={1}>
                    <ScrollView>
                         <Box p="$5">
                              <Facet_Year category={category} updater={updateLocalValues} data={facets} language={language} />
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     } else if (category === 'start_date') {
          return (
               <VStack flex={1}>
                    <ScrollView>
                         <Box p="$5">
                              <Facet_Date category={category} updater={updateLocalValues} data={facets} />
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     } else if (category === 'rating_facet') {
          return (
               <VStack flex={1}>
                    <ScrollView>
                         <Box p="$5">
                              <Facet_Rating category={category} updater={updateLocalValues} data={facets} />
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     } else if (category === 'lexile_score' || category === 'accelerated_reader_point_value' || category === 'accelerated_reader_reading_level') {
          return (
               <VStack flex={1}>
                    <ScrollView>
                         <Box p="$5">
                              <Facet_Slider category={category} data={facets} updater={updateLocalValues} language={language} />
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     } else if (multiSelect) {
          //console.log("Showing Multi-Select facet");
          //console.log(facets);
          return (
               <VStack flex={1}>
                    {searchBar()}
                    <ScrollView>
                         <Box px="$5">
                              <CheckboxGroup
                                   value={values}
                                   accessibilityLabel={getTermFromDictionary(language, 'filter_by')}
                              >
                                   {facets.map((item, index) => {
                                        return <Facet_Checkbox
                                             key={index}
                                             data={item}
                                             language={language}
                                             updateCheckboxFacet={updateCheckboxFacet}
                                             category={category}
                                             values={values}
                                             />;
                                   })}
                              </CheckboxGroup>
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     } else {
          return (
               <VStack flex={1}>
                    {searchBar()}
                    <ScrollView>
                         <Box px="$5">
                              <Facet_RadioGroup data={facets} category={category} title={title} applied={values} updater={updateLocalValues} language={language} />
                         </Box>
                    </ScrollView>
                    {actionButtons()}
               </VStack>
          );
     }
};
