import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { MyAlternateLibraryCard } from '../../screens/MyAccount/MyLibraryCard/MyAlternateLibraryCard';

import { MyLibraryCard } from '../../screens/MyAccount/MyLibraryCard/MyLibraryCard';
import { LanguageContext } from '../../context/initialContext';
import { getTermFromDictionary } from '../../translations/TranslationService';

import TitleWithLogo from '../../components/TitleWithLogo'

const LibraryCardStackNavigator = () => {
     const Stack = createNativeStackNavigator();
     const { language } = React.useContext(LanguageContext);
     return (
          <Stack.Navigator
               initialRouteName={'LibraryCard'}
               screenOptions={{
                    headerShown: true,
                    headerBackTitleVisible: false,
                    gestureEnabled: false,
               }}>
               <Stack.Screen
                    name="LibraryCard"
                    component={MyLibraryCard}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'library_card');
                              return <TitleWithLogo title={title} hideBack={true} />;
                         },
                         //title: getTermFromDictionary(language, 'library_card')
                    }}
               />
               <Stack.Screen
                    name="MyAlternateLibraryCard"
                    component={MyAlternateLibraryCard}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'alternate_library_card');
                              return <TitleWithLogo title={title} hideBack={false} />;
                         },
                         //title: getTermFromDictionary(language, 'alternate_library_card'),
                    }}
               />
          </Stack.Navigator>
     );
};

export default LibraryCardStackNavigator;
