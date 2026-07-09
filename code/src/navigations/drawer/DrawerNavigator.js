import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/initialContext';
import { DrawerContent } from './DrawerContent';
import { useToken } from '@gluestack-ui/themed';
import { logDebugMessage, logWarnMessage, logErrorMessage, getErrorMessage } from '../../util/logging.js';

const Drawer = createDrawerNavigator();

const AccountDrawer = () => {
     const insets = useSafeAreaInsets();
     const { height: screenHeight } = Dimensions.get('window');
     return (
          <Drawer.Navigator
               initialRouteName="TabsNavigator"
               screenOptions={{
                    drawerType: 'front',
                    drawerHideStatusBarOnOpen: false,
                    drawerPosition: 'left',
                    headerShown: false,
                    backBehavior: 'none',
                    lazy: false,
                    drawerStyle: {
                         width: Dimensions.get('window').width * 0.8,
                    },
               }}
               drawerContent={(props) => <DrawerContent {...props} />}>
               <Drawer.Screen
                    name="TabsNavigator"
                    getComponent={() => require('../tab/TabNavigator').default}
                    screenOptions={{
                         headerShown: false,
                         lazy: false,
                    }}
                    options={({ props }) => ({
                         params: { ...props },
                    })}
               />
          </Drawer.Navigator>
     );
};

export default AccountDrawer;
