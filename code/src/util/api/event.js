import { GLOBALS } from '../globals';
import { createApiClient } from './apiFactory';

/**
 * Return the user's saved events
 * @param {number} page
 * @param {number} pageSize
 * @param {string} filter
 * @param {?string} url
 * @param {string} language
 * @returns {Promise<{events: array, total: number}>}
 **/
export async function fetchSavedEvents(page = 1, pageSize = 25, filter = 'upcoming', language = 'en', url = null) {
     const client = createApiClient({ url, language });

     return await client.post(
          '/EventAPI?method=getSavedEvents',
          {},
          {
               params: { page, pageSize, filter, language },
          }
     );
}

/**
 * Returns event data for a given id
 * @param {string} id
 * @param {string} source
 * @param {string} language
 * @param {?string} url
 * @returns {Promise<{id: string, source: string, details: object}>}
 **/
export async function getEventDetails(id, source, language, url = null) {
     const client = createApiClient({ url, language });

     return await client.post(
          '/EventAPI?method=getEventDetails',
          {},
          {
               params: { id, source, language },
          }
     );
}

/**
 * Adds the given event to the user's Saved Events
 * @param {string} id
 * @param {string} language
 * @param {?string} url
 * @returns {Promise<{success: boolean, message: string}>}
 **/
export async function saveEvent(id, language, url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage, language });

     const response = await client.post(
          '/EventAPI?method=saveEvent',
          {},
          {
               params: { id, language },
          }
     );

     return response.ok ? response.data.result : [];
}

/**
 * Removes the given event from the user's Saved Events
 * @param {string} id
 * @param {string} language
 * @param {?string} url
 * @returns {Promise<{success: boolean, message: string}>}
 **/
export async function removeSavedEvent(id, language, url = null) {
     const client = createApiClient({ url, timeout: GLOBALS.timeoutAverage, language });

     const response = await client.post(
          '/EventAPI?method=removeSavedEvent',
          {},
          {
               params: { id, language },
          }
     );

     return response.ok ? response.data : [];
}
