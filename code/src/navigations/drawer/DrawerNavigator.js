import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { Dimensions } from 'react-native';
import { DrawerContent } from './DrawerContent';
import TabNavigator from '../tab/TabNavigator';

const Drawer = createDrawerNavigator();

const AccountDrawer = () => {
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
                    component={TabNavigator}
                    options={{
                         headerShown: false,
                         lazy: false,
                    }}
               />
          </Drawer.Navigator>
     );
};

export default AccountDrawer;
