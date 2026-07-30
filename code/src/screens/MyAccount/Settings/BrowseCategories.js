import { Box, FlatList, HStack, Switch, Text } from '@gluestack-ui/themed';
import React from 'react';
import { LoadingSpinner } from '../../../components/loadingSpinner';
import { DisplayErrorAlertDialog } from '../../../components/loadError';

import { useLibrary } from '../../../hooks/useLibrarySystemData';
import { useBrowseCategoryList, useUpdateBrowseCategoryList, useToggleBrowseCategoryVisibility, useToggleBrowseCategoryVisibilityBatch, useMaxCategories, useUpdateBrowseCategories } from '../../../hooks/useBrowseCategoryData';
import { updateBrowseCategoryStatus } from '../../../util/api/user';
import { getBrowseCategoryListForUser, getHomeScreenFeed } from '../../../util/api/search';
import { logDebugMessage, logErrorMessage, getErrorMessage } from '../../../util/logging';
import { useToast } from '@gluestack-ui/themed';
import { useTheme } from '../../../themes/theme';

export const Settings_BrowseCategories = () => {
     const library = useLibrary();
     const list = useBrowseCategoryList();
     const listRef = React.useRef(list);
     const updateBrowseCategoryList = useUpdateBrowseCategoryList();

     const [isFetching, setIsFetching] = React.useState(false);

     React.useEffect(() => {
          listRef.current = list;
     }, [list]);

     // Fetch category list on mount
     React.useEffect(() => {
          const fetchCategoryList = async () => {
               setIsFetching(true);
               try {
                    const data = await getBrowseCategoryListForUser(library.baseUrl);
                    if (data?.ok) {
                         const categories = [...(data?.data?.result ?? [])].sort((a, b) =>
                              String(a?.title ?? '').localeCompare(String(b?.title ?? ''))
                         );
                          const existing = Array.isArray(listRef.current) ? listRef.current : [];
                          const hasChanged = JSON.stringify(existing) !== JSON.stringify(categories);
                          if (hasChanged) {
                               await updateBrowseCategoryList(categories);
                               logDebugMessage("Loaded Browse Category List");
                          } else {
                               logDebugMessage("Browse Category List unchanged, skipped SQLite update");
                          }
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

     if (isFetching) {
          return <LoadingSpinner />;
     }

     return (
          <FlatList
               keyExtractor={(item, index) => {
                    // `sourceId` is the best unique identifier when present; fallback adds index to avoid key collisions.
                    if (item?.sourceId) {
                         return String(item.sourceId);
                    }
                    return `${item?.key ?? item?.title ?? 'browse_category'}-${index}`;
               }}
               data={list}
               renderItem={({ item }) => <DisplayCategory data={item} />}
          />
     );
};

const DisplayCategory = (data) => {
     const toast = useToast();
     const category = data.data;
     const allCategories = useBrowseCategoryList();
     const [isUpdating, setIsUpdating] = React.useState(false);
     const [showErrorDialog, setShowErrorDialog] = React.useState(false);
     const [errorTitle, setErrorTitle] = React.useState('');
     const [errorMessage, setErrorMessage] = React.useState('');
     const library = useLibrary();
     const { colorMode, textColor, theme} = useTheme();
     const toggleCategoryVisibility = useToggleBrowseCategoryVisibility();
     const toggleCategoryVisibilityBatch = useToggleBrowseCategoryVisibilityBatch();
     const maxNum = useMaxCategories();
     const updateBrowseCategories = useUpdateBrowseCategories();

     const isVisible = !category.isHidden;

     const getCascadeCategories = React.useCallback((selectedCategory) => {
          const title = String(selectedCategory?.title ?? '').trim();
          if (!title) {
               return [selectedCategory];
          }

          const prefix = `${title}:`.toLowerCase();
          const related = (Array.isArray(allCategories) ? allCategories : []).filter((item) => {
               const childTitle = String(item?.title ?? '').trim().toLowerCase();
               return childTitle.startsWith(prefix);
          });

          return [selectedCategory, ...related];
     }, [allCategories]);

     const getCategoryKey = React.useCallback((targetCategory) => {
          return targetCategory?.sourceId ?? targetCategory?.key;
     }, []);

     const getCategoryKeys = React.useCallback((categories) => {
          return (Array.isArray(categories) ? categories : [])
               .map((item) => getCategoryKey(item))
               .filter(Boolean);
     }, [getCategoryKey]);

     const syncVisibilityInBackground = React.useCallback((targetCategory, isHidden, { showFailureToast = true } = {}) => {
          const targetKey = getCategoryKey(targetCategory);
          if (!targetKey) {
               return Promise.resolve(false);
          }

          return updateBrowseCategoryStatus(targetKey, library.baseUrl)
               .then(() => {
                    logDebugMessage(`Category ${targetKey} visibility synced`);
                    return true;
               })
               .catch(async (error) => {
                    // Rollback locally if API fails so UI and cache stay consistent.
                    await toggleCategoryVisibility(targetKey, !isHidden);
                    logErrorMessage(error);

                    if (showFailureToast) {
                         const message = getErrorMessage({ statusCode: error?.status, problem: error?.problem });
                         toast.show({
                              placement: "bottom",
                              duration: 3000,
                              render: () => (
                                   <Box p="$3" bg="$error500" borderRadius="$md">
                                        <Text color="$white" bold>{message.title}</Text>
                                        <Text color="$white">{message.message}</Text>
                                   </Box>
                              )
                         });
                    }

                    return false;
               });
     }, [getCategoryKey, library.baseUrl, toast, toggleCategoryVisibility]);

     React.useEffect(() => {
          setShowErrorDialog(false);
     }, [category?.key, category?.sourceId, category?.isHidden]);

     const updateToggle = async (category) => {
          if (isUpdating) {
               return;
          }

          setIsUpdating(true);

          const nextIsHidden = isVisible;
          const categoriesToToggle = getCascadeCategories(category);
          const categoryKeysToToggle = getCategoryKeys(categoriesToToggle);
          const categoriesNeedingSync = categoriesToToggle.filter((item) => item?.isHidden !== nextIsHidden);

           try {
                const optimisticResult = await toggleCategoryVisibilityBatch(categoryKeysToToggle, nextIsHidden);
                if (!optimisticResult?.success) {
                     const error = getErrorMessage({ statusCode: optimisticResult?.error?.status, problem: optimisticResult?.error?.problem });
                     setErrorTitle(error.title);
                     setErrorMessage(error.message);
                    logErrorMessage(optimisticResult?.error);
                     setShowErrorDialog(true);
                     toast.show({
                          placement: "bottom",
                          duration: 3000,
                          render: () => (
                               <Box p="$3" bg="$error500" borderRadius="$md">
                                    <Text color="$white" bold>{error.title}</Text>
                                    <Text color="$white">{error.message}</Text>
                               </Box>
                          )
                     });
                    return;
               }

               const parentKey = getCategoryKey(category);
               logDebugMessage("Finished local toggle " + parentKey);
          } finally {
               setIsUpdating(false);
          }

          if (categoriesNeedingSync.length === 0) {
               return;
          }

           void Promise.allSettled(
                categoriesNeedingSync.map((targetCategory, index) =>
                     syncVisibilityInBackground(targetCategory, nextIsHidden, {
                          showFailureToast: index === 0,
                     })
                )
           ).then(async (results) => {
                const hadBackgroundFailure = results.some((result) => result.status === 'fulfilled' && result.value === false);

                if (hadBackgroundFailure && categoriesNeedingSync.length > 1) {
                     toast.show({
                          placement: "bottom",
                          duration: 3000,
                          render: () => (
                               <Box p="$3" bg="$error500" borderRadius="$md">
                                    <Text color="$white" bold>Update issue</Text>
                                    <Text color="$white">Some subcategories could not be updated.</Text>
                               </Box>
                          )
                     });
                }

                const requestedMax = maxNum > 0 ? maxNum : 5;
                const homeFeed = await getHomeScreenFeed(requestedMax, library.baseUrl);
                if (homeFeed?.ok) {
                     const nextCategories = homeFeed.data?.result?.browseCategories ?? [];
                     await updateBrowseCategories(nextCategories);
                }
           });
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
                              updateToggle(category);
                         }}
                         value={isVisible}
                         isDisabled={isUpdating}
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
