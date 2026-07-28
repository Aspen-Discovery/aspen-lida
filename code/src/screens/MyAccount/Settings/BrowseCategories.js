import { useNavigation } from '@react-navigation/native';
import { Box, FlatList, HStack, Switch, Text } from '@gluestack-ui/themed';
import React from 'react';
import { LoadingSpinner } from '../../../components/loadingSpinner';
import { DisplayErrorAlertDialog } from '../../../components/loadError';
import { LanguageContext, ThemeContext } from '../../../context/initialContext';
import { useLibrary } from '../../../hooks/useLibrarySystemData';
import { useBrowseCategoryList, useUpdateBrowseCategoryList, useToggleBrowseCategoryVisibility, useMaxCategories, useUpdateBrowseCategories } from '../../../hooks/useBrowseCategoryData';
import { updateBrowseCategoryStatus } from '../../../util/api/user';
import { getBrowseCategoryListForUser, getHomeScreenFeed } from '../../../util/api/search';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';
import _ from 'lodash';
import { useToast } from '@gluestack-ui/themed';

export const Settings_BrowseCategories = () => {
     const navigation = useNavigation();
     const [loading, setLoading] = React.useState(false);
     const library = useLibrary();
     const { language } = React.useContext(LanguageContext);
     const list = useBrowseCategoryList();
     const updateBrowseCategoryList = useUpdateBrowseCategoryList();
     const { theme } = React.useContext(ThemeContext);

     const [isFetching, setIsFetching] = React.useState(false);

     // Fetch category list on mount
     React.useEffect(() => {
          const fetchCategoryList = async () => {
               setIsFetching(true);
               try {
                    const data = await getBrowseCategoryListForUser(library.baseUrl);
                    if (data?.ok) {
                         const categories = _.sortBy(data.data.result, ['title']);
                         await updateBrowseCategoryList(categories);
                         logDebugMessage("Loaded Browse Category List");
                    } else {
                         logDebugMessage("Error fetching browse category list for user");
                         logDebugMessage(data);
                         getErrorMessage(data?.code, data?.problem);
                    }
               } catch (error) {
                    logDebugMessage("Error fetching browse category list for user");
                    logErrorMessage(error);
               } finally {
                    setIsFetching(false);
               }
          };

          fetchCategoryList();
     }, [library.baseUrl, updateBrowseCategoryList]);

     if (loading || isFetching) {
          return <LoadingSpinner />;
     }

     return <FlatList keyExtractor={(item) => item.key} data={list} renderItem={({ item }) => <DisplayCategory data={item} setLoading={setLoading} />} />;
};

const DisplayCategory = (data) => {
     const toast = useToast();
     const category = data.data;
     const [toggled, setToggle] = React.useState(!category.isHidden);
     const [showErrorDialog, setShowErrorDialog] = React.useState(false);
     const [errorTitle, setErrorTitle] = React.useState('');
     const [errorMessage, setErrorMessage] = React.useState('');
     const toggleSwitch = () => setToggle((previousState) => !previousState);
     const library = useLibrary();
     const { language } = React.useContext(LanguageContext);
     const { colorMode, textColor, theme} = React.useContext(ThemeContext);
     const toggleCategoryVisibility = useToggleBrowseCategoryVisibility();
     const maxNum = useMaxCategories();
     const updateBrowseCategories = useUpdateBrowseCategories();

     React.useEffect(() => {
          setToggle(!category.isHidden);
     }, [category.isHidden]);

     const updateToggle = async (category) => {
          const key = category['key'] ?? category['sourceId'];
          // Optimistic update: toggle visibility immediately
          const result = await toggleCategoryVisibility(key, !toggled, () =>
               updateBrowseCategoryStatus(key, library.baseUrl)
          );

          if (!result.success) {
               const error = getErrorMessage({ statusCode: result.error?.status, problem: result.error?.problem });
               setErrorTitle(error.title);
               setErrorMessage(error.message);
               logErrorMessage(result.error);
               setShowErrorDialog(true);
               setToggle(!toggled); // Revert the toggle
               toast.show({
                    placement: "bottom",
                    duration: 3000,
                    render: ({ id }) => (
                         <Box p="$3" bg="$error500" borderRadius="$md">
                              <Text color="$white" bold>{error.title}</Text>
                              <Text color="$white">{error.message}</Text>
                         </Box>
                    ),
               });
          } else {
               // Keep Home screen in sync by refreshing visible browse categories.
               const requestedMax = maxNum > 0 ? maxNum : 5;
               const homeFeed = await getHomeScreenFeed(requestedMax, library.baseUrl);
               if (homeFeed?.ok) {
                    const nextCategories = homeFeed.data?.result?.browseCategories ?? [];
                    await updateBrowseCategories(nextCategories);
               }
          }
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
