import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation, CommonActions, StackActions } from '@react-navigation/native';
import { Box, FlatList, HStack, Switch, Text, Pressable, ChevronLeftIcon } from '@gluestack-ui/themed';
import React from 'react';
import { BackHandler } from 'react-native';
import { LoadingSpinner } from '../../../components/loadingSpinner';
import { DisplayErrorAlertDialog } from '../../../components/loadError';
import { BrowseCategoryContext, LanguageContext, ThemeContext } from '../../../context/initialContext';

import { updateBrowseCategoryStatus } from '../../../util/api/user';
import { getBrowseCategoryListForUser } from '../../../util/api/search';

import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';
import _ from 'lodash';

export const Settings_BrowseCategories = () => {
     const navigation = useNavigation();
     const [loading, setLoading] = React.useState(false);
     const library = useLibrary();
     const { language } = React.useContext(LanguageContext);
     const { list, updateBrowseCategoryList } = React.useContext(BrowseCategoryContext);
     const { theme } = React.useContext(ThemeContext);
     const route = useRoute();

     const handleGoBack = () => {
          if (route?.params?.prevRoute === 'HomeScreen') {
               navigation.dispatch(CommonActions.setParams({ prevRoute: null }));
               navigation.goBack();
          } else if (route?.params?.prevRoute === 'Preferences') {
               navigation.dispatch(CommonActions.setParams({ prevRoute: null }));
               navigation.goBack();
          } else {
               if (navigation.canGoBack()) {
                    navigation.goBack();
               } else {
                    navigation.dispatch(StackActions.replace('MoreMenu'));
               }
          }
     };

     React.useEffect(() => {
          const backAction = () => {
               handleGoBack();
               return true;
          };

          const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

          return () => backHandler.remove();
     }, [route?.params?.prevRoute, navigation]);

     React.useLayoutEffect(() => {
          navigation.setOptions({
               headerLeft: () => (
                    <Pressable onPress={handleGoBack} mr={3} p="$1">
                         <ChevronLeftIcon size="md" ml={1} color={theme['tokens']['colors']['primary']['baseContrast']} />
                    </Pressable>
               ),
          });
     }, [navigation, theme]);

     const { isFetching } = useQuery(['browse_categories_list', library.baseUrl, language], () => getBrowseCategoryListForUser(library.baseUrl), {
          initialData: list,
          onSuccess: (data) => {
               if(data.ok){
                    const categories = _.sortBy(data.data.result, ['title']);
                    updateBrowseCategoryList(categories);
               } else {
                    logDebugMessage("Error fetching browse category list for user");
                    logDebugMessage(data);
                    getErrorMessage(data.code, data.problem)
               }
          },
          onError: (error) => {
               logDebugMessage("Error fetching browse category list for user");
               logErrorMessage(error);
          },
          onSettle: () => {
               setLoading(false);
          },
          placeholderData: [],
     });

     if (loading || isFetching) {
          return <LoadingSpinner />;
     }

     return <FlatList keyExtractor={(item) => item.key} data={list} renderItem={({ item }) => <DisplayCategory data={item} setLoading={setLoading} />} />;
};

const DisplayCategory = (data) => {
     const queryClient = useQueryClient();
     const category = data.data;
     const [toggled, setToggle] = React.useState(!category.isHidden);
     const [showErrorDialog, setShowErrorDialog] = React.useState(false);
     const [errorTitle, setErrorTitle] = React.useState('');
     const [errorMessage, setErrorMessage] = React.useState('');
     const toggleSwitch = () => setToggle((previousState) => !previousState);
     const library = useLibrary();
     const { language } = React.useContext(LanguageContext);
     const { maxNum } = React.useContext(BrowseCategoryContext);
     const { colorMode, textColor, theme} = React.useContext(ThemeContext);

     React.useEffect(() => {
          setToggle(!category.isHidden);
     }, [category.isHidden]);

     const updateToggle = async (category) => {
          const key = category['key'] ?? category['sourceId'];
          await updateBrowseCategoryStatus(key, library.baseUrl).then(async (response) => {
               if (!response.ok) {
                    const error = getErrorMessage({ statusCode: response.status, problem: response.problem });
                    setErrorTitle(error.title);
                    setErrorMessage(error.message);
                    logErrorMessage(response);
                    setShowErrorDialog(true);
                    setToggle(!category.isHidden);
               } else {
                    await queryClient.invalidateQueries({ queryKey: ['browse_categories', library.baseUrl, language, maxNum] });
                    await queryClient.invalidateQueries({ queryKey: ['browse_categories_list', library.baseUrl, language] });
               }
          });
          logDebugMessage("Finished toggling " + key);
     };
     return (
          <Box borderBottomWidth="$1" _dark={{ borderColor: 'gray.600' }} borderColor="coolGray.200" pl="$4" pr="$5" py="$2">
               <HStack space={3} alignItems="center" justifyContent="space-between" pb={1}>
                    <Text
                         flexWrap="wrap"
                         flex={1}
                         color={textColor}
                         bold
                         fontSize="$lg">
                         {category.title}
                    </Text>
                    <Switch
                         size="md"
                         name={category.key}
                         onToggle={() => {
                              toggleSwitch();
                              updateToggle(category);
                         }}
                         value={toggled}
                         trackColor={{
                              true: theme.tokens.colors.primary['500'],
                              false: colorMode === 'light' ? '$backgroundLight300' : '$backgroundLight700'
                         }}

                    />
               </HStack>
               {showErrorDialog && (
                    <DisplayErrorAlertDialog title={errorTitle} message={errorMessage} />
               )}
          </Box>
     );
};
