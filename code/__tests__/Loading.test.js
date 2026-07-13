global.IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';

//Set up and override globals as needed
import {GLOBALS, LIBRARY} from '../src/util/globals';

LIBRARY.url = 'https://mocklibrary.com';
LIBRARY.name = 'Mock Library'
LIBRARY.id = '123';
LIBRARY.appSettings = {
     loadingMessageType: 1,
     loadingMessage: null
};
GLOBALS.logLevel = 1;

import {render, screen, waitFor} from '@testing-library/react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GluestackUIProvider, createConfig} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';

// Import all contexts used by the component to mock them
import {
     UserContext, LibrarySystemContext, LibraryBranchContext,
     BrowseCategoryContext, LanguageContext, SystemMessagesContext, ThemeContext
} from '../src/context/initialContext';

const {act} = require('@testing-library/react-native');

// Create a helper wrapper for Providers
const createTestQueryClient = () => new QueryClient({
     defaultOptions: {
          queries: {
               retry: false, // turn off retries for faster test failures
               cacheTime: 0, // Prevents stale queries from freezing state transitions
               staleTime: 0,
          },
     },
});

const mockContextValues = {
     user: {
          user: {},
          updateUser: jest.fn(),
          accounts: [],
          updateLinkedAccounts: jest.fn(),
          cards: [],
          updateLibraryCards: jest.fn(),
          updateAppPreferences: jest.fn(),
          notificationHistory: [],
          updateNotificationHistory: jest.fn(),
          updateInbox: jest.fn()
     },
     library: {
          library: {appSettings: {loadingMessageType: 0}},
          updateLibrary: jest.fn(),
          updateMenu: jest.fn(),
          updateCatalogStatus: jest.fn(),
          catalogStatus: 0,
          catalogStatusMessage: '',
          updateHomeScreenLinks: jest.fn()
     },
     branch: {
          location: {},
          updateLocation: jest.fn(),
          updateScope: jest.fn(),
          updateEnableSelfCheck: jest.fn(),
          updateSelfCheckSettings: jest.fn()
     },
     category: {
          category: {},
          updateBrowseCategories: jest.fn(),
          updateBrowseCategoryList: jest.fn(),
          updateMaxCategories: jest.fn()
     },
     language: {
          language: 'en',
          updateLanguage: jest.fn(),
          updateLanguages: jest.fn(),
          updateDictionary: jest.fn(),
          dictionary: {},
          languageDisplayName: 'English',
          updateLanguageDisplayName: jest.fn(),
          languages: []
     },
     messages: {systemMessages: [], updateSystemMessages: jest.fn()},
     theme: {theme: {}, updateTheme: jest.fn(), colorMode: 'light', updateColorMode: jest.fn(), textColor: '#000'}
};

// Mock the API endpoints called by useQuery
jest.mock('../src/themes/theme', () => {
     const {basicThemeObject} = require('../__mocks__/themes');

     return {
          createGlueTheme: jest.fn(() => Promise.resolve(basicThemeObject)),
          createTheme: jest.fn(() => Promise.resolve(basicThemeObject))
     };
});

jest.mock('../src/translations/TranslationService', () => {
     const originalModule = jest.requireActual('../src/translations/TranslationService');
     const {englishTranslations} = require('../__mocks__/translations');

     return {
          ...originalModule, // Keep getTermFromDictionary and everything else intact!
          getTranslatedTermsForUserPreferredLanguage: jest.fn(() => Promise.resolve(true)),
          loadTranslationsFromDiscovery: jest.fn(() => Promise.resolve(englishTranslations)),
     };
});

// Mock the actual React Query custom hooks used in the screen waterfall sequence
jest.mock('../src/util/api/system', () => {
     const {catalogOnlineObject} = require('../__mocks__/catalogStatus');
     const {englishOnlyLanguageObject} = require('../__mocks__/libraryLanguages');
     const {basicLibraryInfoObject} = require('../__mocks__/libraryInfo');
     const {noLibraryLinks} = require('../__mocks__/libraryLinks');
     const {basicLocationInfo} = require('../__mocks__/locationInfo');
     const {selfCheckDisabled} = require('../__mocks__/selfCheckSettings');
     const {noSystemMessages} = require('../__mocks__/systemMessages');

     return {
          getCatalogStatus: jest.fn(() => Promise.resolve(catalogOnlineObject)),
          getLibraryLanguages: jest.fn(() => Promise.resolve(englishOnlyLanguageObject)),
          getLibraryInfo: jest.fn(() => Promise.resolve(basicLibraryInfoObject)),
          getLibraryLinks: jest.fn(() => Promise.resolve(noLibraryLinks)),
          getLocationInfo: jest.fn(() => Promise.resolve(basicLocationInfo)),
          getSelfCheckSettings: jest.fn(() => Promise.resolve(selfCheckDisabled)),
          getSystemMessages: jest.fn(() => Promise.resolve(noSystemMessages)),
     };
});

jest.mock('../src/util/api/user', () => {
     const {basicProfile} = require('../__mocks__/profile');
     const {noLinkedAccounts} = require('../__mocks__/linkedAccounts');
     const {noNotificationPreferences} = require('../__mocks__/appPreferences');
     const {noNotificationHistory} = require('../__mocks__/notificationHistory');
     return {
          // Step 8
          refreshProfile: jest.fn(() => Promise.resolve(basicProfile)),
          // Step 9
          getLinkedAccounts: jest.fn(() => Promise.resolve(noLinkedAccounts)),
          // Step 10
          getAppPreferencesForUser: jest.fn(() => Promise.resolve(noNotificationPreferences)),
          // Step 11
          fetchNotificationHistory: jest.fn(() => Promise.resolve(noNotificationHistory)),
     }
});

jest.mock('../src/util/api/search', () => {
     const {homeScreenFeedWithoutLinks} = require('../__mocks__/homeScreenFeed');
     const {basicBrowseCategoryList} = require('../__mocks__/browseCategoryListForUser');

     return {
          getHomeScreenFeed: jest.fn(() => Promise.resolve(homeScreenFeedWithoutLinks)),
          getBrowseCategoryListForUser: jest.fn(() => Promise.resolve(basicBrowseCategoryList))
     }
});

const mockNavigate = jest.fn();
let triggerFocusEvent = () => { };

jest.mock('@react-navigation/native', () => {
     const actualNav = jest.requireActual('@react-navigation/native');

     // noinspection JSUnusedGlobalSymbols
     return {
          ...actualNav,
          useNavigation: () => ({
               navigate: mockNavigate,
               addListener: jest.fn((event, callback) => {
                    // noinspection JSUnresolvedReference
                    const unsubscribe = jest.fn();
                    if (event === 'focus') {
                         triggerFocusEvent = callback;
                    }
                    return unsubscribe;
               }),
          }),
          useIsFocused: () => true,
          useLinkTo: () => jest.fn(),
     };
});

jest.mock('@react-native-aria/overlays', () => {
     // noinspection JSUnusedGlobalSymbols
     return {
          useOverlayPosition: () => ({
               overlayProps: {},
               positionProps: {style: {}},
               updatePosition: jest.fn(),
          }),
          OverlayContainer: ({children}) => children,
          OverlayProvider: ({children}) => children,
     };
});

jest.mock('react-native-safe-area-context', () => {
     const inset = {top: 0, right: 0, bottom: 0, left: 0};
     // noinspection JSUnusedGlobalSymbols
     return {
          SafeAreaProvider: ({children}) => children,
          SafeAreaView: ({children}) => children,
          useSafeAreaInsets: () => inset,
          useSafeAreaFrame: () => ({x: 0, y: 0, width: 390, height: 844}),
     };
});

const jestGluestackConfig = createConfig(config);

const AllTheProviders = ({children}) => {
     const [testQueryClient] = React.useState(() => createTestQueryClient());
     // noinspection JSValidateTypes
     return (
          <GluestackUIProvider config={jestGluestackConfig}>
               <QueryClientProvider client={testQueryClient}>
                    <ThemeContext.Provider value={mockContextValues.theme}>
                         <UserContext.Provider value={mockContextValues.user}>
                              <LibrarySystemContext.Provider value={mockContextValues.library}>
                                   <LibraryBranchContext.Provider value={mockContextValues.branch}>
                                        <BrowseCategoryContext.Provider value={mockContextValues.category}>
                                             <LanguageContext.Provider value={mockContextValues.language}>
                                                  <SystemMessagesContext.Provider value={mockContextValues.messages}>
                                                       {children}
                                                  </SystemMessagesContext.Provider>
                                             </LanguageContext.Provider>
                                        </BrowseCategoryContext.Provider>
                                   </LibraryBranchContext.Provider>
                              </LibrarySystemContext.Provider>
                         </UserContext.Provider>
                    </ThemeContext.Provider>
               </QueryClientProvider>
          </GluestackUIProvider>
     );
};

beforeEach(() => {
     mockNavigate.mockClear();
});

//Finally, import the actual screen to make sure that all the mocks are set up first.
import {LoadingScreen} from '../src/screens/Auth/Loading';

/*
 * Do a basic test to be sure the screen renders properly
 */
describe('<LoadingScreen />', () => {
     it('renders correctly', async () => {
          const {unmount} = await render(<LoadingScreen/>, {wrapper: AllTheProviders});

          // 1. Assert that the component renders without crashing
          expect(screen.toJSON()).toBeTruthy();

          await unmount();
     });
});

/*
 * Test the happy path startup to ensure the focus listener proceeds properly
 */
it('completes the sequential loading happy path and navigates to DrawerStack', async () => {
     const {unmount} = await render(<LoadingScreen/>, {wrapper: AllTheProviders});

     const progressBar = screen.getByTestId('progress-bar');

     await act(async () => {
          if (typeof triggerFocusEvent === 'function') {
               triggerFocusEvent();
          } else {
               throw new Error("❌ triggerFocusEvent was never populated by the component's addListener!");
          }
     });

     try {
          await waitFor(() => {
               expect(progressBar.props['aria-valuenow']).toEqual(100);
               expect(mockNavigate).toHaveBeenCalledWith('DrawerStack', expect.objectContaining({
                    prevRoute: 'LoadingScreen'
               }));
          }, {timeout: 4000, interval: 50});
     } catch (error) {
          // FORCE JEST TO PRINT THE EXACT DOM STATE BEFORE THE TIMEOUT FAILED
          console.log('❌ TEST STALLED! CURRENT SCREEN STATE VIEW TREE:');
          screen.debug();
          throw error; // Rethrow so the test runner fails clearly
     }

     await unmount();
});
