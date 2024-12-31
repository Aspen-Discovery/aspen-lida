import { create } from 'apisauce';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import _ from 'lodash';
import { Platform } from 'react-native';

import { popToast } from '../components/loadError';
import { createAuthTokens, getHeaders, problemCodeMap } from './apiAuth';
import { GLOBALS } from './globals';
import { getAppSettings, LIBRARY } from './loadLibrary';
import { PATRON } from './loadPatron';

/**
 * Fetch libraries to log into
 **/
export async function makeGreenhouseRequest(method, fetchAll = false) {
     const slug = GLOBALS.slug;
     let greenhouseUrl;
     if (slug === 'aspen-lida') {
          greenhouseUrl = Constants.expoConfig.extra.greenhouse;
     } else {
          greenhouseUrl = GLOBALS.url;
     }
     let latitude = await SecureStore.getItemAsync('latitude');
     let longitude = await SecureStore.getItemAsync('longitude');

     if (fetchAll) {
          latitude = 0;
          longitude = 0;
     }

     const api = create({
          baseURL: greenhouseUrl + '/API',
          timeout: 10000,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               latitude,
               longitude,
               release_channel: await SecureStore.getItemAsync('releaseChannel'),
          },
     });
     const response = await api.post('/GreenhouseAPI?method=' + method);
     if (response.ok) {
          return response.data;
     } else {
          const problem = problemCodeMap(response.problem);
          popToast(problem.title, problem.message, 'error');
     }
}

/**
 * Updates Aspen LiDA Build Tracker with patch information
 * @param {string} updateId
 * @param {string} updateChannel
 * @param {date} updateDate
 **/
export async function updateAspenLiDABuild(updateId, updateChannel, updateDate) {
     const greenhouseUrl = Constants.expoConfig.extra.greenhouseUrl;
     const iOSDist = Constants.expoConfig.ios.buildNumber;
     const androidDist = Constants.expoConfig.android.versionCode;

     const api = create({
          baseURL: greenhouseUrl + 'API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               app: Constants.expoConfig.name,
               version: Constants.expoConfig.version,
               build: Platform.OS === 'android' ? androidDist : iOSDist,
               channel: __DEV__ ? 'development' : updateChannel,
               platform: Platform.OS,
               id: updateId,
               patch: GLOBALS.appPatch,
               timestamp: updateDate,
          },
     });

     const response = await api.post('/GreenhouseAPI?method=updateAspenLiDABuild');
     console.log(response);
     return response;
}

export async function fetchNearbyLibrariesFromGreenhouse() {
     let isBranded = false;
     let channel = GLOBALS.releaseChannel;
     if (channel === 'DEV' || 'alpha' || 'beta' || 'internal') {
          channel = 'any';
     }
     let method = 'getLibraries';
     let url = Constants.expoConfig.extra.greenhouseUrl;
     let latitude,
          longitude = 0;
     let slug = GLOBALS.slug;
     if (!slug.startsWith('aspen-lida')) {
          method = 'getLibrary';
          isBranded = true;
          url = Constants.expoConfig.extra.apiUrl;
     }
     if (GLOBALS.slug === 'aspen-lida-bws') {
          method = 'getLibrary';
          url = Constants.expoConfig.extra.apiUrl;
     }
     if (GLOBALS.slug === 'aspen-lida-alpha') {
          channel = 'alpha';
     } else if (GLOBALS.slug === 'aspen-lida-beta') {
          channel = 'beta';
     } else if (GLOBALS.slug === 'aspen-lida-zeta') {
          channel = 'zeta';
     } else if (GLOBALS.slug === 'aspen-lida-bws') {
          channel = 'any';
     }

     if (_.isNull(PATRON.coords.lat) && _.isNull(PATRON.coords.long)) {
          try {
               latitude = await SecureStore.getItemAsync('latitude');
               longitude = await SecureStore.getItemAsync('longitude');
               PATRON.coords.lat = latitude;
               PATRON.coords.long = longitude;
          } catch (e) {
               console.log(e);
          }
     }
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutSlow,
          headers: getHeaders(),
     });
     //console.log("Calling " + url + '/API/GreenhouseAPI?method=' + method);
     let params = {
          latitude: PATRON.coords.lat,
          longitude: PATRON.coords.long,
          release_channel: channel,
     };
     console.log("Making call with fetch");
     try {
          const response1 = await fetch(url + '/API/GreenhouseAPI?method=' + method).then((response) => {
               if (response.status === 200) {
                    const json = response.json();
                    console.log("Response from fetch");
                    console.log(json);
               } else {
                    console.log("Something went wrong on API server!" + response.status);
               }
          });
     }catch (e) {
          console.log("Error getting libraries with fetch");
          console.log(e);
     }

     const response = await api.get('/GreenhouseAPI?method=' + method, params);

     if (response.ok) {
          const data = response.data;
          let libraries;
          if (_.includes(GLOBALS.slug, 'aspen-lida') && GLOBALS.slug !== 'aspen-lida-bws') {
               libraries = data.libraries;
          } else {
               libraries = _.values(data.library);
          }

          libraries = _.sortBy(libraries, ['distance', 'name', 'librarySystem']);

          let showSelectLibrary = true;
          if (data.count <= 1) {
               showSelectLibrary = false;
          }

          if (isBranded) {
               await getAppSettings(GLOBALS.url, GLOBALS.timeoutAverage, GLOBALS.slug);
               console.log(LIBRARY.appSettings);
               let autoPickUserHomeLocation = false;

               if (LIBRARY.appSettings.autoPickUserHomeLocation) {
                    autoPickUserHomeLocation = LIBRARY.appSettings.autoPickUserHomeLocation;
               }

               console.log('autoPickUserHomeLocation: ' + autoPickUserHomeLocation);
               if (autoPickUserHomeLocation) {
                    showSelectLibrary = false;
               }
          }

          return {
               success: true,
               libraries: libraries ?? [],
               shouldShowSelectLibrary: showSelectLibrary,
          };
     } else {
          console.log("Fetching nearby libraries failed " + response.originalError);
          //console.log("Status " + response.status);
          console.log(response);
          const problem = problemCodeMap(response.problem);
          popToast(problem.title, problem.message, 'error');
     }

     return {
          success: false,
          shouldShowSelectLibrary: false,
          libraries: [],
     };
}

export async function fetchAllLibrariesFromGreenhouse() {
     let channel = GLOBALS.releaseChannel;
     if (channel === 'DEV' || 'alpha' || 'beta' || 'internal') {
          channel = 'any';
     }
     let url = Constants.expoConfig.extra.greenhouseUrl;
     if (!_.includes(GLOBALS.slug, 'aspen-lida') || GLOBALS.slug === 'aspen-lida-bws') {
          url = Constants.expoConfig.extra.apiUrl;
     }

     if (GLOBALS.slug === 'aspen-lida-alpha') {
          channel = 'alpha';
     } else if (GLOBALS.slug === 'aspen-lida-beta') {
          channel = 'beta';
     } else if (GLOBALS.slug === 'aspen-lida-zeta') {
          channel = 'zeta';
     } else if (GLOBALS.slug === 'aspen-lida-bws') {
          channel = 'any';
     }

     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutSlow,
          headers: getHeaders(),
     });
     const response = await api.get('/GreenhouseAPI?method=getLibraries', {
          release_channel: channel,
     });
     if (response.ok) {
          const data = response.data;
          const libraries = _.sortBy(data.libraries, ['name', 'librarySystem']);
          return {
               success: true,
               libraries: libraries ?? [],
          };
     }
     return {
          success: false,
          libraries: [],
     };
}
