process.env.EXPO_OS = 'ios';

// Mock objects
jest.mock('expo-constants', () => {
  return {
    __esModule: true,
    default: {
      expoConfig: {
        ios: {
          buildNumber: '1',
          bundleIdentifier: 'com.placeholder.ios',
        },
        android: {
          versionCode: 1,
          package: 'com.placeholder.android',
        },
        extra: {
          loginLogo: 'mock-logo-path', // Keeps line 5 of Splash.js happy
        },
        splash: {
          backgroundColor: '#010203',
        }
      },
    },
  };
});

/**
 * Mock objects for testing Aspen LiDA
 */
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props) => React.createElement(Text, props, 'MaterialIcons'),
    Ionicons: (props) => React.createElement(Text, props, 'Ionicons'),
    // Add any other specific icons your app throws errors on here
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@sentry/react-native', () => {
  return {
    __esModule: true,
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    captureEvent: jest.fn(),
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    setTags: jest.fn(),
    setExtra: jest.fn(),
    startSpan: jest.fn((ctx, callback) => callback ? callback() : null),
    // Sentry Navigation tracing mocks if your logging setup accesses them
    ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({
      registerNavigationContainer: jest.fn(),
    })),
    ReactNativeTracing: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock('expo-device', () => {
  return {
    __esModule: true,
    brand: 'Apple',
    manufacturer: 'Apple',
    modelName: 'iPhone 15',
    deviceYearClass: 2023,
    totalMemory: 6000000000,
    isDevice: false, // Useful for testing simulator vs physical device paths
    supportedCpuArchitectures: ['arm64'],
    osName: 'iOS',
    osVersion: '17.0',
    osBuildId: '21A328',
    osInternalBuildId: '21A328',
    deviceType: 1, // 1 = PHONE
  };
});

const mockSecureStore = {};
jest.mock('expo-secure-store', () => {
  return {
    __esModule: true,
    setItemAsync: jest.fn((key, value) => {
      mockSecureStore[key] = String(value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => {
      return Promise.resolve(mockSecureStore[key] || null);
    }),
    deleteItemAsync: jest.fn((key) => {
      delete mockSecureStore[key];
      return Promise.resolve();
    }),
    // Common options objects (like keychain accessibility enums) if your app uses them
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
    ALWAYS: 'ALWAYS',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  };
});

jest.mock('expo-sqlite', () => {
  return {
    __esModule: true,
    // Mock the modern asynchronous open method
    openDatabaseAsync: jest.fn().mockResolvedValue({
      execAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 0 }),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
      withTransactionAsync: jest.fn((callback) => callback()),
    }),
    // Mock the legacy synchronous open method (just in case your app or a dependency uses it)
    openDatabase: jest.fn(() => ({
      transaction: jest.fn((callback) => {
        callback({
          executeSql: jest.fn((sql, params, success, error) => {
            if (success) success({}, { rows: { _array: [], length: 0 } });
          }),
        });
      }),
    })),
  };
});

jest.mock('expo-updates', () => {
  return {
    __esModule: true,
    // Add common properties your app might inspect at runtime
    currentlyRunning: {
      isEmbeddedLaunch: true,
      createdAt: new Date().toISOString(),
      updateId: 'mock-update-id',
      manifest: {},
    },
    isEmergencyLaunch: false,
    isMissingRuntimeVersion: false,

    // Mock the common asynchronous methods to prevent unhandled promise rejections
    checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: false }),
    fetchUpdateAsync: jest.fn().mockResolvedValue({ isNew: false }),
    reloadAsync: jest.fn().mockResolvedValue(true),

    // Event listeners
    useUpdates: jest.fn(() => ({
      currentlyRunning: { isEmbeddedLaunch: true },
      isUpdateAvailable: false,
      isUpdatePending: false,
    })),
  };
});

jest.mock('expo-web-browser', () => {
  return {
    __esModule: true,
    openBrowserAsync: jest.fn().mockResolvedValue({ type: 'opened' }),
    openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success', url: 'https://mock-redirect.com' }),
    dismissBrowser: jest.fn(),
    dismissAuthSession: jest.fn(),
    warmUpAsync: jest.fn().mockResolvedValue({}),
    coolDownAsync: jest.fn().mockResolvedValue({}),
    maybeCompleteAuthSession: jest.fn().mockReturnValue({ type: 'success' }),
  };
});
