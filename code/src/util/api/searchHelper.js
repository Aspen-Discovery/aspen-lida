import { SearchGlobal } from '../globals';
import { logDebugMessage } from '../logging';
import { toArray, uniquePrimitiveArray } from '../../helpers/helpers';

/**
 * Build URL parameters based on pending filters in SearchGlobal, encoding values as needed
 * @returns {string}
 */
export function buildParamsForUrl() {
     logDebugMessage('Building Search Parameters');
     const filters = SearchGlobal.pendingFilters ?? [];
     const params = [];

     filters.forEach((filter) => {
          const field = filter.field;
          logDebugMessage('Processing field ' + field);
          const facets = filter.facets ?? [];

          if (facets.length > 0) {
               facets.forEach((rawFacet) => {
                    let facet = rawFacet;

                    if (field === 'publishDateSort' || field === 'birthYear' || field === 'deathYear' || field === 'publishDate' || field === 'lexile_score' || field === 'accelerated_reader_point_value' || field === 'accelerated_reader_reading_level' || field === 'start_date') {
                         facet = String(facet).replaceAll(' ', '+');
                         params.push(`&filter[]=${field}:${facet}`);
                    } else {
                         params.push(`&filter[]=${field}:${facet}`);
                    }
               });
          }
     });

     if (SearchGlobal.sortMethod.length > 0) {
          const sortMethod = SearchGlobal.sortMethod;
          logDebugMessage('Processing sort method ' + sortMethod);
          if (String(sortMethod).includes(',')) {
               params.push(`&sort=${encodeURIComponent(sortMethod)}`);
          } else {
               params.push(`&sort=${sortMethod}`);
          }
     }else{
          logDebugMessage('No sort method found');
     }

     const joined = params.join('');
     SearchGlobal.appendedParams = joined;
     logDebugMessage(`buildParamsForUrl: ${joined}`);
     return joined;
}

/**
 * Set default facets for search results, excluding 'sort_by' and limiting to 5 items
 * @param options
 * @returns {*[]}
 */
export function setDefaultFacets(options) {
     const optionList = options && typeof options === 'object' && !Array.isArray(options) ? Object.values(options) : Array.isArray(options) ? options : [];

     const defaults = optionList.filter((facetGroup) => {
          if (!facetGroup || typeof facetGroup !== 'object') return false;

          const field = facetGroup.field ?? '';
          const label = facetGroup.label ?? '';

          return field === 'availability_toggle' || label === 'Search Within';
     });

     SearchGlobal.defaultFacets = defaults;
     return defaults;
}

/**
 * Extract formats from facet data, handling both array and object structures
 * @param data
 * @returns {*|unknown[]}
 */
export function getFormats(data) {
     if (Array.isArray(data) || (data && typeof data === 'object')) {
          const values = Array.isArray(data) ? data : Object.values(data);

          const formats = values.map((item) => {
               if (typeof item === 'string' && item.includes('#')) {
                    const parts = item.split('#');
                    return parts[parts.length - 1];
               }
               return item;
          });

          return [...new Set(formats)];
     }

     return data;
}

/**
 * Add applied filter values to a given group in SearchGlobal.pendingFilters,
 * handling both multi-select and single-select scenarios, and ensuring values are unique.
 * Also logs the action and rebuilds URL parameters after updating filters.
 * @param group
 * @param values
 * @param multiSelect
 * @returns {boolean}
 */
export function addAppliedFilter(group, values, multiSelect = false) {
     if (!group) return false;
     logDebugMessage('addAppliedFilter: ' + group + ' values:' + values + ' multiselect? ' + multiSelect);

     let index = (SearchGlobal.pendingFilters ?? []).findIndex((f) => f.field === group);
     if (index === -1) {
          logDebugMessage('Group not found in pendingFilters, adding it');
          if (!SearchGlobal.pendingFilters) {
               SearchGlobal.pendingFilters = [];
          }
          SearchGlobal.pendingFilters.push({ field: group, facets: [] });
          index = SearchGlobal.pendingFilters.length - 1;
     }

     const incomingValues = toArray(values);
     const existing = SearchGlobal.pendingFilters[index].facets ?? [];

     if (multiSelect) {
          SearchGlobal.pendingFilters[index].facets = uniquePrimitiveArray([...existing, ...incomingValues]);
     } else {
          SearchGlobal.pendingFilters[index].facets = uniquePrimitiveArray([...incomingValues]);
     }

     logDebugMessage(`Added ${JSON.stringify(incomingValues)} to ${group} (multiSelect: ${multiSelect})`);
     buildParamsForUrl();
     return true;
}

/**
 * Remove applied filter values from a given group in SearchGlobal.pendingFilters,
 * handling both multi-select and single-select scenarios.
 * Also logs the action and rebuilds URL parameters after updating filters.
 * @param group
 * @param values
 * @returns {boolean}
 */
export function removeAppliedFilter(group, values) {
     if (!group) return false;

     let index = (SearchGlobal.pendingFilters ?? []).findIndex((f) => f.field === group);
     if (index === -1) {
          logDebugMessage('Group not found in pendingFilters, adding it');
          if (!SearchGlobal.pendingFilters) {
               SearchGlobal.pendingFilters = [];
          }
          SearchGlobal.pendingFilters.push({ field: group, facets: [] });
          index = SearchGlobal.pendingFilters.length - 1;
     }

     const removeValues = new Set(toArray(values));
     const existing = SearchGlobal.pendingFilters[index].facets ?? [];

     SearchGlobal.pendingFilters[index].facets = existing.filter((v) => !removeValues.has(v));

     logDebugMessage(`Removed ${JSON.stringify(values)} from ${group}`);
     buildParamsForUrl();
     return true;
}
