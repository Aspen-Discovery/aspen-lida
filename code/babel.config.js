module.exports = function (api) {
     api.cache(true);
     return {
          presets: ['babel-preset-expo'],
          plugins: [
               [
                    'module:react-native-dotenv',
                    {
                         envName: 'APP_ENV',
                         moduleName: '@env',
                         path: '.env',
                    },
               ],
               'transform-inline-environment-variables',
               '@babel/plugin-transform-class-static-block',
               'react-native-reanimated/plugin',
          ],
     };
};
