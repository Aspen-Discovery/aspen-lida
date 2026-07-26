import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Icon } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';

import { LanguageContext, ThemeContext } from '../../context/initialContext';
import { useAccounts } from '../../hooks/useUserData';
import { getTermFromDictionary } from '../../translations/TranslationService';
import { StartCheckOutSession } from '../../screens/SCO/StartCheckOutSession';
import { SelfCheckOut } from '../../screens/SCO/SelfCheckOut';
/*import { FinishCheckOutSession } from '../../screens/SCO/FinishSelfCheckoutSession';*/
import _ from 'lodash';
import SelfCheckScanner from '../../screens/SCO/SelfCheckScanner';

import TitleWithLogo from '../../components/TitleWithLogo'

const SelfCheckOutStackNavigator = () => {
     const { language } = React.useContext(LanguageContext);
     const { data: accounts } = useAccounts();
     const {textColor} = React.useContext(ThemeContext);

     let defaultRoute = 'SelfCheckOut';
     if (_.size(accounts) >= 1) {
          defaultRoute = 'StartCheckOutSession';
     }

     const Stack = createNativeStackNavigator();
     return (
          <Stack.Navigator
               initialRouteName={defaultRoute}
               screenOptions={({ navigation, route }) => ({
                    headerShown: true,
                    headerBackTitleVisible: false,
                    gestureEnabled: false,
               })}>
               <Stack.Screen
                    name="StartCheckOutSession"
                    component={StartCheckOutSession}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'nav_discover');
                              return <TitleWithLogo title={title} />;
                         },
                         //title: getTermFromDictionary(language, 'self_checkout')
                    }}
                    initialParams={{ startNew: true }}
               />
               <Stack.Screen
                    name="SelfCheckOut"
                    component={SelfCheckOut}
                    options={({ navigation }) => ({
                         header: () => {
                              const title = getTermFromDictionary(language, 'self_checkout');
                              return <TitleWithLogo title={title} hideBack={true} />;
                         },
                         //title: getTermFromDictionary(language, 'self_checkout')
                    })}
                    initialParams={{ startNew: true }}
               />
               <Stack.Screen
                    name="SelfCheckOutScanner"
                    component={SelfCheckScanner}
                    options={({ navigation }) => ({
                         presentation: 'modal',
                         title: 'Scanner',
                         headerLeft: () => {
                              return <></>;
                         },
                         headerRight: () => (
                              <Pressable onPress={() => navigation.goBack()} mr="$3" p="$1">
                                   <Icon as={MaterialIcons} name="close" size="md" color={textColor} />
                              </Pressable>
                         ),
                    })}
               />
               {/*
               <Stack.Screen
                    name="FinishCheckOutSession"
                    component={FinishCheckOutSession}
                    options={{
                         header: () => {
                              const title = getTermFromDictionary(language, 'finish_checkout_session');
                              return <TitleWithLogo title={title} hideBack={true} />;
                         },
                         //title: getTermFromDictionary(language, 'finish_checkout_session')
                    }}
               />
               */}
          </Stack.Navigator>
     );
};

export default SelfCheckOutStackNavigator;
