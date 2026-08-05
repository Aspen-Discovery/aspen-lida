import { GLOBALS, LIBRARY, SearchGlobal } from '../globals';
import { logErrorMessage } from '../logging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient } from './apiFactory';
import { addAppliedFilter, buildParamsForUrl, setDefaultFacets } from './searchHelper';

const homeScreenFeedInFlight = new Map();

function getHomeScreenFeedRequestKey(maxCategories, url) {
     return `${url ?? ''}|${maxCategories === 9999 ? 'all' : maxCategories}`;
}

/** *******************************************************************
 * General
 ******************************************************************* **/

/**
 * Fetch search results for a given search term with optional filters and pagination
 * @param searchTerm
 * @param pageSize
 * @param page
 * @param libraryUrl
 * @param filters
 * @param language
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}>}
 */
export async function searchResults(searchTerm, pageSize = 100, page, libraryUrl, filters = '', language = 'en') {
     let solrScope = '';
     if (GLOBALS.solrScope !== 'unknown') {
          solrScope = GLOBALS.solrScope;
     } else {
          try {
               solrScope = await AsyncStorage.getItem('@solrScope');
          } catch (e) {
               logErrorMessage('Could not get solr scope');
               logErrorMessage(e);
          }
     }

     const client = createApiClient({ url: libraryUrl, timeout: GLOBALS.timeoutSlow, language });

     const response = await client.get(`/SearchAPI?method=getAppSearchResults${filters}`, {
          library: solrScope,
          lookfor: searchTerm,
          pageSize,
          page,
          language,
     });

     if (response.ok && response.data?.result) {
          SearchGlobal.term = response.data.result.lookfor;
     }

     return response;
}

/** *******************************************************************
 * Search specific drivers
 ******************************************************************* **/

/**
 * Fetch search results for a given browse category
 * @param category
 * @param page
 * @param limit
 * @param url
 * @param language
 * @returns {Promise<{results: *|*[], totalRecords, curPage, totalPages, hasMore: boolean, message: null, error: boolean}>}
 */
export async function fetchSearchResultsForBrowseCategory(category, page, limit = 25, url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutSlow, language });

     const response = await client.post(
          '/SearchAPI?method=getAppBrowseCategoryResults',
          {},
          {
               params: {
                    limit,
                    id: category,
                    page,
                    language,
               },
          }
     );

     const data = response.ok ? (response.data?.result ?? {}) : {};
     const items = category === 'system_recommended_for_you' ? (data.records ?? []) : (data.items ?? []);
     const message = data.message ?? null;

     const hasMore = !(data?.page_current === data?.page_total || data?.page_total === 1);

     return {
          results: items,
          totalRecords: data.totalResults ?? 0,
          curPage: data.page_current ?? 0,
          totalPages: data.page_total ?? 0,
          hasMore,
          message,
          error: false,
     };
}

/**
 * Fetch search results for a given saved search
 * @param id
 * @param page
 * @param limit
 * @param url
 * @param language
 * @returns {Promise<{results: unknown[]|*[], totalRecords, curPage, totalPages, hasMore: boolean, message: null, error: boolean}>}
 */
export async function fetchSearchResultsForSavedSearch(id, page, limit = 25, url = null, language = 'en') {
     let searchId = id;

     if (typeof searchId === 'string' && searchId.includes('system_saved_search')) {
          const parts = searchId.split('_');
          searchId = parts[3];
     }

     const client = createApiClient({ url, timeout: GLOBALS.timeoutSlow, language });

     const response = await client.post(
          '/SearchAPI?method=getSavedSearchResults',
          {},
          {
               params: {
                    limit,
                    id: searchId,
                    page,
                    language,
               },
          }
     );

     const data = response.ok ? (response.data?.result ?? {}) : {};
     const message = data.message ?? null;

     const hasMore = !(data?.page_current === data?.page_total || data?.page_total === 1);

     const items = data.items ? Object.values(data.items) : [];

     return {
          results: items,
          totalRecords: data.totalResults ?? 0,
          curPage: data.page_current ?? 0,
          totalPages: data.page_total ?? 0,
          hasMore,
          message,
          error: false,
     };
}

/**
 * Fetch search results for a given list
 * @param listId
 * @param page
 * @param url
 * @param language
 * @returns {Promise<{id, items: unknown[]}>}
 */
export async function fetchSearchResultsForList(listId, page = 1, url = null, language = 'en') {
     let id = listId;
     if (typeof id === 'string' && id.includes('system_user_list')) {
          const myArray = id.split('_');
          id = myArray[myArray.length - 1];
     }

     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutAverage,
          language,
     });

     const response = await client.get('/SearchAPI?method=getListResults', {
          id,
          limit: 25,
          page,
          language,
     });

     if (!response.ok || !response.data) {
          logErrorMessage(response);
     }

     return {
          id: response.data?.result?.id ?? id,
          items: Object.values(response.data?.result?.items ?? {}),
     };
}

/** *******************************************************************
 * Discovery/Home Screen
 ******************************************************************* **/

/**
 * Fetch home screen feed items for the library
 * @param maxCat
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getHomeScreenFeed(maxCat = 5, url = null) {
     const maxCategories = maxCat ?? 5;
     const requestKey = getHomeScreenFeedRequestKey(maxCategories, url);
     const existingRequest = homeScreenFeedInFlight.get(requestKey);

     if (existingRequest) {
          return existingRequest;
     }

     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage });

     const params = maxCategories !== 9999 ? { maxCategories, LiDARequest: true } : { LiDARequest: true };

     const request = client
          .post('/SearchAPI?method=getHomeScreenFeed', {}, { params })
          .finally(() => {
               if (homeScreenFeedInFlight.get(requestKey) === request) {
                    homeScreenFeedInFlight.delete(requestKey);
               }
          });

     homeScreenFeedInFlight.set(requestKey, request);

     return await request;
}

/** *******************************************************************
 * User Preferences
 ******************************************************************* **/

/**
 * Fetch browse categories that a user has selected to display on the home screen for Manage Browse Categories
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getBrowseCategoryListForUser(url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });

     return await client.post(
          '/SearchAPI?method=getBrowseCategoryListForUser',
          {},
          {
               params: { checkIfValid: false },
          }
     );
}

/** *******************************************************************
 * Search Configuration
 ******************************************************************* **/

/**
 * Fetch default facets to display for a search based on the library's configuration
 * @param url
 * @param limit
 * @param language
 * @returns {Promise<*|{}|{success: boolean, data: *[]}>}
 */
export async function getDefaultFacets(url = null, limit = 5, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getDefaultFacets', { limit, language });

     if (response.ok) {
          const result = response.data?.result ?? {};
          SearchGlobal.defaultFacets = result?.data ?? [];
          return result;
     }

     return {
          success: false,
          data: [],
     };
}

/**
 * Fetch search results for a given search term and save search configuration (facets, sort, etc.) to global state for use in other API calls
 * @param searchTerm
 * @param pageSize
 * @param page
 * @param url
 * @param language
 * @returns {Promise<{success: boolean, data: *[], error}|{success: *, data: *}>}
 */
export async function getSearchResults(searchTerm, pageSize = 25, page, url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage, language });
     let solrScope = '';
     if (GLOBALS.solrScope !== 'unknown') {
          solrScope = GLOBALS.solrScope;
     } else {
          try {
               solrScope = await AsyncStorage.getItem('@solrScope');
          } catch (e) {
               logErrorMessage('Could not get solr scope');
               logErrorMessage(e);
          }
     }

     const response = await client.post(
          `/SearchAPI?method=searchLite${SearchGlobal.appendedParams ?? ''}`,
          {},
          {
               params: {
                    library: solrScope ?? null,
                    lookfor: searchTerm ?? '',
                    pageSize,
                    page,
                    type: 'catalog',
                    language,
                    searchIndex: SearchGlobal.searchIndex,
                    source: SearchGlobal.searchSource,
               },
          }
     );

     if (response.ok && response.data?.result) {
          const result = response.data.result;

          if (result.success) {
               SearchGlobal.id = result.id;
               SearchGlobal.sortMethod = result.sort;
               SearchGlobal.term = result.lookfor;

               const baseUrl = url ?? LIBRARY.url;
               await getSortList(baseUrl, language);
               await getAvailableFacets(baseUrl, language);
               await getAppliedFilters(baseUrl, language);
          }

          return {
               success: result.success,
               data: result,
          };
     }

     return {
          success: false,
          data: [],
          error: response.error ?? [],
     };
}

/**
 * Fetch currently applied filters for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @returns {Promise<*|*[]>}
 */
export async function getAppliedFilters(url = null, language = 'en') {
     SearchGlobal.appliedFilters = [];

     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getAppliedFilters', {
          id: SearchGlobal.id,
          language,
     });

     if (response.ok) {
          const appliedFilters = response.data?.result?.data ?? {};
          SearchGlobal.appliedFilters = appliedFilters;

          Object.values(appliedFilters).forEach((facetList) => {
               if (!Array.isArray(facetList)) return;

               facetList.forEach((facet) => {
                    if (!facet || typeof facet !== 'object') return;
                    if (facet.field == null || facet.value == null) return;

                    addAppliedFilter(facet.field, facet.value, true);
               });
          });

          buildParamsForUrl();
          return appliedFilters;
     }

     return [];
}

/**
 * Fetch available sort options for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @returns {Promise<[]|*[]>}
 */
export async function getSortList(url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getSortList', {
          id: SearchGlobal.id,
          language,
     });

     if (response.ok) {
          SearchGlobal.sortList = response.data?.result ?? [];
          return SearchGlobal.sortList;
     }

     return [];
}

/**
 * Fetch available facets for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @returns {Promise<[]|*[]>}
 */
export async function getAvailableFacets(url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getAvailableFacets', {
          includeSortList: true,
          id: SearchGlobal.id,
          language,
     });

     if (response.ok) {
          await getAvailableFacetsKeys(url, language);
          SearchGlobal.availableFacets = response.data?.result ?? {};
          setDefaultFacets(SearchGlobal.availableFacets?.data ?? []);
          return SearchGlobal.availableFacets;
     }

     return [];
}

/**
 * Fetch available facets for a given facet and search term, returning in a format compatible with SearchGlobal.pendingFilters for use in building filter params for search results API calls
 * @param facet
 * @param label
 * @param term
 * @param url
 * @param language
 * @returns {Promise<{success: boolean, facets: *[]}|*|{key: number, field: *, facets: *[]}>}
 */
export async function searchAvailableFacets(facet, label, term, url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=searchAvailableFacets', {
          includeSortList: false,
          id: SearchGlobal.id,
          facet,
          term,
          language,
     });

     if (response.ok) {
          return (
               response.data?.result?.data?.[label] ?? {
                    key: 1,
                    field: facet,
                    facets: [],
               }
          );
     }

     return {
          success: false,
          facets: [],
     };
}

/**
 * Fetch available facet keys for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @returns {Promise<{field: *, key: *, facets: []}[]|*[]>}
 */
export async function getAvailableFacetsKeys(url = null, language = 'en') {
     const client = createApiClient({
          url,
          timeout: GLOBALS.timeoutFast,
          language,
     });

     const response = await client.get('/SearchAPI?method=getAvailableFacetsKeys', {
          id: SearchGlobal.id,
          language,
     });

     if (!response.ok) {
          SearchGlobal.availableFacetKeys = [];
          return [];
     }

     const rawOptions = response.data?.result?.options;

     const options = Array.isArray(rawOptions) ? rawOptions : rawOptions && typeof rawOptions === 'object' ? Object.values(rawOptions) : [];

     SearchGlobal.availableFacetKeys = options;
     return options;
}

/**
 * Fetch available search indexes for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @param source
 * @returns {Promise<*|{success: boolean, indexes: *[]}>}
 */
export async function getSearchIndexes(url = null, language = 'en', source = 'local') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getSearchIndexes', {
          searchSource: source,
          language,
     });

     if (response.ok && response?.data?.result?.indexes?.[source]) {
          SearchGlobal.validIndexes = response.data.result.indexes[source];
          return SearchGlobal.validIndexes;
     }

     return {
          success: false,
          indexes: [],
     };
}

/**
 * Fetch available search sources for a search and save to global state for use in other API calls
 * @param url
 * @param language
 * @returns {Promise<*|{success: boolean, sources: *[]}>}
 */
export async function getSearchSources(url = null, language = 'en') {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     const response = await client.get('/SearchAPI?method=getSearchSources', { language });

     if (response.ok && response?.data?.result?.sources) {
          SearchGlobal.validSources = response.data.result.sources;
          return SearchGlobal.validSources;
     }

     return {
          success: false,
          sources: [],
     };
}

/**
 * Fetch browse categories and home links to display on the home screen based on user preferences and library configuration
 * @param data
 * @param user
 * @param pass
 * @returns {Promise<*|*[]>}
 */
export async function getBrowseCategoriesAndHomeLinks(data, user, pass) {
     const baseUrl = data?.patronsLibrary?.baseUrl ?? null;
     const client = createApiClient({ url: baseUrl, timeout: GLOBALS.timeoutAverage });

     const response = await client.post(
          '/SearchAPI?method=getHomeScreenFeed',
          {
               username: user?.valueUser,
               password: pass?.valueSecret,
          },
          {
               params: {
                    maxCategories: 5,
                    LiDARequest: true,
               },
          }
     );

     if (response.ok && response.data?.result) {
          return response.data.result;
     }

     return [];
}