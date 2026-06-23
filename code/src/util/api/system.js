import { LIBRARY } from '../globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logDebugMessage, logErrorMessage, logInfoMessage, logWarnMessage } from '../logging';
import { GLOBALS } from '../globals';
import { popToast } from '../../components/loadError';
import { createApiClient } from './apiFactory';
import { generateSwatches } from '../../helpers/helpers';

/**
 * Return basic information about the library
 * @param url
 * @param id
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}>}
 */
export async function getLibraryInfo(url = null, id = null) {
     let libraryId;

     try {
          libraryId = await AsyncStorage.getItem('@libraryId');
     } catch (e) {
          logErrorMessage('Error loading library info');
          logErrorMessage(e);
     }

     if (id) {
          libraryId = id;
     }

     if (typeof libraryId === 'string') {
          libraryId = libraryId.replace(/['"]+/g, '');
          libraryId = parseInt(libraryId, 10);
     }

     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });

     let result = await client.get('/SystemAPI?method=getLibraryInfo', { id: libraryId });

     if (result?.data?.result?.success === false && result?.data?.result?.message === 'Library not found') {
          logDebugMessage('Original library ID not found, trying global library ID');
          libraryId = GLOBALS.libraryId;
          result = await client.get('/SystemAPI?method=getLibraryInfo', { id: libraryId });
     }

     return result;
}

/**
 * Return list of library menu links
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getLibraryLinks(url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });
     return await client.post('/SystemAPI?method=getLibraryLinks');
}

/**
 * Return list of available languages
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getLibraryLanguages(url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });
     return await client.get('/SystemAPI?method=getLanguages');
}

/**
 * Return array of pre-validated system messages
 * @param libraryId
 * @param locationId
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getSystemMessages(libraryId = null, locationId = null, url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });
     return await client.post(
          '/SystemAPI?method=getSystemMessages',
          {},
          {
               params: { libraryId, locationId },
          }
     );
}

/**
 * Dismiss given system message from displaying again
 * @param systemMessageId
 * @param url
 * @returns {Promise<*|*[]>}
 */
export async function dismissSystemMessage(systemMessageId, url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });

     const response = await client.post(
          '/SystemAPI?method=dismissSystemMessage',
          {},
          {
               params: { systemMessageId },
          }
     );

     if (response.ok && response?.data?.result) {
          return response.data.result;
     }

     return [];
}

/**
 * Check if Aspen Discovery is in offline mode
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getCatalogStatus(url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage });
     return await client.get('/SystemAPI?method=getCatalogStatus');
}

/**
 * Fetch settings for app that are maintained by the library
 * @param url
 * @param timeout
 * @param slug
 * @returns {Promise<*|*[]>}
 */
export async function getAppSettings(url, timeout, slug) {
     logDebugMessage(`Getting App Settings from url: ${url} slug: ${slug}`);

     try {
          const client = createApiClient({ url, timeout });
          const response = await client.get('/SystemAPI?method=getAppSettings', { slug });

          if (response?.ok) {
               LIBRARY.appSettings = response.data?.result?.settings ?? [];
               return LIBRARY.appSettings;
          }

          logWarnMessage(`Did not get valid response from getAppSettings url: ${url} slug: ${slug}`);
          logWarnMessage(response);
          return [];
     } catch (err) {
          popToast(getTermFromDictionary('en', 'error_no_server_connection'), 'Could not retrieve App Settings, please try again later.', 'error');
          logErrorMessage(`Exception in getAppSettings ${err}`);
          return [];
     }
}

/**
 * Return local ILL form details
 * @param url
 * @param id
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}>}
 */
export async function getLocalIllForm(url = null, id) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage });

     const response = await client.post(
          '/SystemAPI?method=getLocalIllForm',
          {},
          {
               params: { formId: id },
          }
     );

     if (response.ok) {
          LIBRARY.localIll = response.data?.result;
     }

     return response;
}

/**
 * Return information about the library location/branch
 * @param url
 * @param locationId
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getLocationInfo(url = null, locationId = null) {
     if (!locationId) {
          try {
               locationId = await AsyncStorage.getItem('@locationId');
          } catch (e) {
               logDebugMessage(e);
          }
     }

     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });

     return await client.get('/SystemAPI?method=getLocationInfo', {
          id: locationId,
          version: GLOBALS.appVersion,
     });
}

/**
 * Return self check settings for the library
 * @param url
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getSelfCheckSettings(url = null) {
     let locationId;

     try {
          locationId = await AsyncStorage.getItem('@locationId');
     } catch (e) {
          logDebugMessage(e);
     }

     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });

     return await client.get('/SystemAPI?method=getSelfCheckSettings', {
          locationId,
     });
}

/**
 * Return nearby library locations based on latitude and longitude
 * @param url
 * @param language
 * @param latitude
 * @param longitude
 * @returns {Promise<*|{ok: boolean, status, problem: string, data, config: {}}|undefined>}
 */
export async function getLocations(url = null, language = 'en', latitude, longitude) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast, language });

     return await client.get('/SystemAPI?method=getLocations', {
          latitude,
          longitude,
          language,
     });
}

/**
 * Check if the provided URL is valid and has a working connection to Aspen Discovery by making a test API call
 * @param url
 * @returns {Promise<boolean>}
 */
export async function checkCachedUrl(url) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutFast });
     const response = await client.post('/SystemAPI?method=getCatalogStatus');
     return !!response.ok;
}

/**
 * Return information about the library system which may include multiple branches/locations
 * @param data
 * @returns {Promise<null|[]|*|*[]>}
 */
export async function getLibrarySystem(data) {
     const client = createApiClient({
          url: data?.patronsLibrary?.baseUrl,
          timeout: GLOBALS.timeoutFast,
     });

     const response = await client.get('/SystemAPI?method=getLibraryInfo', {
          id: data?.patronsLibrary?.libraryId,
     });

     if (response.ok && response?.data?.result) {
          return response.data.result.library;
     }

     return [];
}

/**
 * Return information about the library branch/location the patron is associated with
 * @param data
 * @returns {Promise<*|*[]>}
 */
export async function getLibraryBranch(data) {
     const client = createApiClient({
          url: data?.patronsLibrary?.baseUrl,
          timeout: GLOBALS.timeoutFast,
     });

     const response = await client.get('/SystemAPI?method=getLocationInfo', {
          id: data?.patronsLibrary?.locationId,
          library: data?.patronsLibrary?.solrScope,
          version: GLOBALS.appVersion,
     });

     if (response.ok && response?.data?.result) {
          return response.data.result.location;
     }

     return [];
}

/**
 * Fetch theme information for the library and generate color swatches for the app
 * with fallback to a default theme if there are any issues with the request or response
 * @param url
 * @returns {Promise<unknown[]>}
 */
export async function getThemeInfo(url = null) {
     let libraryUrl = LIBRARY.url ?? GLOBALS.url;
     if (url !== null && url !== '') {
          libraryUrl = url;
     }

     if (!libraryUrl) {
          logWarnMessage('No library URL provided, returning backup theme');
          const COLOR_SCHEMES = ['#3dbdd6', '#9acf87', '#c1adcc'];
          return COLOR_SCHEMES.map(generateSwatches);
     }

     await getAppSettings(libraryUrl, 10000, GLOBALS.slug);

     const client = createApiClient({
          url: GLOBALS.url,
          timeout: 10000,
     });

     const response = await client.get('/SystemAPI?method=getThemeInfo', {
          id: GLOBALS.themeId ?? 1,
     });

     if (response.ok) {
          const result = response.data?.result?.theme;
          if (result !== undefined) {
               const COLOR_SCHEMES = [result.primaryBackgroundColor, result.secondaryBackgroundColor, result.tertiaryBackgroundColor];
               const palettes = COLOR_SCHEMES.map(generateSwatches);
               logDebugMessage('Theme downloaded and swatches generated.');
               return palettes;
          }

          const COLOR_SCHEMES = ['#3dbdd6', '#9acf87', '#c1adcc'];
          const palettes = COLOR_SCHEMES.map(generateSwatches);
          logInfoMessage('Backup theme loaded due to unexpected response.');
          logErrorMessage(response);
          return palettes;
     }

     const COLOR_SCHEMES = ['#3dbdd6', '#9acf87', '#c1adcc'];
     const palettes = COLOR_SCHEMES.map(generateSwatches);
     logInfoMessage('Backup theme loaded due to server or client issue.');
     logErrorMessage(response);
     return palettes;
}
