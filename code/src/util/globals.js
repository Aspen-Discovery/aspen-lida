import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

const iOSDist = Constants.expoConfig.ios.buildNumber;
const androidDist = Constants.expoConfig.android.versionCode;
const iOSBundle = Constants.expoConfig.ios.bundleIdentifier;
const androidBundle = Constants.expoConfig.android.package;
const releaseChannel = Updates.channel ?? Updates.releaseChannel;

export const GLOBALS = {
     timeoutAverage: 60000,
     timeoutSlow: 100000,
     timeoutFast: 30000,
     // for boot-critical calls the user is staring at a splash screen; fail fast and fall back
     timeoutBoot: 8000,
     appVersion: Constants.expoConfig.version,
     appBuild: Platform.OS === 'android' ? androidDist : iOSDist,
     appSessionId: Constants.expoConfig.sessionid,
     appPatch: Constants.expoConfig.extra.patch,
     appStage: Constants.expoConfig.extra.stage,
     showSelectLibrary: true,
     runGreenhouse: true,
     slug: Constants.expoConfig.slug,
     url: Constants.expoConfig.extra.apiUrl,
     releaseChannel: __DEV__ ? 'DEV' : releaseChannel,
     language: 'en',
     country: 'us',
     lastSeen: null,
     prevLaunched: false,
     pendingSearchFilters: [],
     availableFacetClusters: [],
     hasPendingChanges: false,
     solrScope: 'unknown',
     libraryId: Constants.expoConfig.extra.libraryId,
     themeId: Constants.expoConfig.extra.themeId,
     bundleId: Platform.OS === 'android' ? androidBundle : iOSBundle,
     greenhouse: Constants.expoConfig.extra.greenhouseUrl,
     privacyPolicy: 'https://bywatersolutions.com/lida-app-privacy-policy',
     iosStoreUrl: Constants.expoConfig.extra.iosStoreUrl,
     androidStoreUrl: Constants.expoConfig.extra.androidStoreUrl,
     logLevel: !Constants.expoConfig.extra.logLevel ? 0 : parseInt(Constants.expoConfig.extra.logLevel)
};

export const LOGIN_DATA = {
     showSelectLibrary: true,
     runGreenhouse: true,
     num: 0,
     nearbyLocations: [],
     allLocations: [],
     extra: [],
     hasPendingChanges: false,
     loadedInitialData: false,
     themeSaved: false,
};

export const PATRON = {
     userToken: null,
     scope: null,
     library: null,
     location: null,
     listLastUsed: null,
     fines: 0,
     messages: [],
     num: {
          checkedOut: 0,
          holds: 0,
          lists: 0,
          overdue: 0,
          ready: 0,
          savedSearches: 0,
          updatedSearches: 0,
     },
     promptForOverdriveEmail: 1,
     rememberHoldPickupLocation: 0,
     pickupLocations: [],
     language: 'en',
     coords: {
          lat: null,
          long: null,
     },
     linkedAccounts: [],
     holds: [],
     lists: [],
     browseCategories: [],
     sublocations: [],
     hideSoftDeleteListUI: false,
};


export const SearchGlobal = {
     term: null,
     id: null,
     hasPendingChanges: false,
     sortMethod: 'relevance',
     appliedFilters: [],
     sortList: [],
     availableFacets: [],
     defaultFacets: [],
     pendingFilters: [],
     appendedParams: '',
     searchSource: 'local',
     searchIndex: 'Keyword',
};

export function resetSearchGlobals() {
     SearchGlobal.term = null;
     SearchGlobal.id = null;
     SearchGlobal.hasPendingChanges = false;
     SearchGlobal.sortMethod = 'relevance';
     SearchGlobal.appliedFilters = [];
     SearchGlobal.sortList = [];
     SearchGlobal.availableFacets = [];
     SearchGlobal.pendingFilters = [];
     SearchGlobal.appendedParams = '';
     //logDebugMessage('Reset global search variables'); // this creates a require cycle even though we aren't even using it
}

export const LIBRARY = {
     url: '',
     name: '',
     favicon: '',
     languages: [],
     vdx: [],
     localIll: [],
     id: 0,
     version: null,
     appSettings: {},
};

export const BRANCH = {
     name: '',
     vdxFormId: null,
     vdxLocation: null,
     vdx: [],
     localIllFormId: null,
};

export const ALL_LOCATIONS = {
     branches: [],
};

export const ALL_BRANCHES = {};

