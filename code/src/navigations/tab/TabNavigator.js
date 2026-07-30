import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerActions } from '@react-navigation/native';
import { HStack, Pressable, Text, VStack, useToken } from '@gluestack-ui/themed';
import React from 'react';

import { useSelfCheckEnabled } from '../../hooks/useLibraryBranchData';
import { getTermFromDictionary } from '../../translations/TranslationService';

import AccountStackNavigator from '../stack/AccountStackNavigator';
import BrowseStackNavigator from '../stack/BrowseStackNavigator';
import LibraryCardStackNavigator from '../stack/LibraryCardStackNavigator';
import MoreStackNavigator from '../stack/MoreStackNavigator';
import SelfCheckOutStackNavigator from '../stack/SelfCheckOutStackNavigator';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveLanguage } from '../../hooks/useLanguageData';
import { useTheme } from '../../themes/theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
     const enableSelfCheck = useSelfCheckEnabled();
     const { colorMode } = useTheme();

     const activeIcon = colorMode === 'light' ? '$coolGray900' : '$warmGray300';
     const inactiveIcon = colorMode === 'light' ? '$coolGray700' : '$warmGray100';
     const tabBarBackgroundColor = colorMode === 'light' ? '$coolGray100' : '$coolGray900';

     return (
          <Tab.Navigator
               tabBar={(props) => <TabItem {...props} />}
               initialRouteName="BrowseTab"
               screenOptions={{
                    headerShown: false,
                    backBehavior: 'none',
                    tabBarHideOnKeyboard: true,
                    tabBarActiveTintColor: activeIcon,
                    tabBarInactiveTintColor: inactiveIcon,
                    tabBarLabelStyle: { fontWeight: '400' },
                    tabBarStyle: { backgroundColor: tabBarBackgroundColor, elevation: 0 },
               }}>
               <Tab.Screen name="BrowseTab" component={BrowseStackNavigator} />
               <Tab.Screen name="LibraryCardTab" component={LibraryCardStackNavigator} />
               {enableSelfCheck ? <Tab.Screen name="SelfCheckTab" component={SelfCheckOutStackNavigator} /> : null}
               <Tab.Screen
                    name="AccountTab"
                    component={AccountStackNavigator}
                    listeners={({ navigation }) => ({
                         tabPress: (e) => {
                              navigation.dispatch(DrawerActions.toggleDrawer());
                              e.preventDefault();
                         },
                    })}
               />
               <Tab.Screen name="AccountScreenTab" component={AccountStackNavigator} options={{ tabBarButton: () => null }} />
               <Tab.Screen
                    name="MoreTab"
                    component={MoreStackNavigator}
                    listeners={({ navigation }) => ({
                         tabPress: (e) => {
                              e.preventDefault();
                              navigation.navigate('MoreTab', { screen: 'MoreMenu' });
                         },
                    })}
               />
          </Tab.Navigator>
     );
}

export const TabItem = ({ state, descriptors, navigation }) => {
     const language = useActiveLanguage();
     const { colorMode } = useTheme();
     const activeIconColor = useToken('colors', colorMode === 'light' ? 'coolGray700' : 'coolGray300');
     const inactiveIconColor = useToken('colors', colorMode === 'light' ? 'coolGray500' : 'coolGray400');
     const tabBarBackgroundColor = colorMode === 'light' ? '$coolGray100' : '$coolGray900';
     const tabBarBorderColor = colorMode === 'light' ? '$coolGray200' : '$coolGray300';
     const insets = useSafeAreaInsets();

     const [browseTabLabel, setBrowseTabLabel] = React.useState(getTermFromDictionary(language, 'nav_discover'));
     const [cardTabLabel, setCardTabLabel] = React.useState(getTermFromDictionary(language, 'nav_card'));
     const [accountTabLabel, setAccountTabLabel] = React.useState(getTermFromDictionary(language, 'nav_account'));
     const [scoTabLabel, setScoTabLabel] = React.useState(getTermFromDictionary(language, 'nav_sco'));
     const [moreTabLabel, setMoreTabLabel] = React.useState(getTermFromDictionary(language, 'nav_more'));

     React.useEffect(() => {
          const timer = setTimeout(() => {
               setBrowseTabLabel(getTermFromDictionary(language, 'nav_discover'));
               setCardTabLabel(getTermFromDictionary(language, 'nav_card'));
               setAccountTabLabel(getTermFromDictionary(language, 'nav_account'));
               setScoTabLabel(getTermFromDictionary(language, 'nav_sco'));
               setMoreTabLabel(getTermFromDictionary(language, 'nav_more'));
          }, 1500);

          return () => clearTimeout(timer);
     }, [language]);

     return (
          <HStack
               px="$7"
               pt="$2"
               pb={insets.bottom}
               gap="$4"
               alignItems="center"
               justifyContent="space-between"
               backgroundColor={tabBarBackgroundColor}
               borderTopWidth="$1"
               borderColor={tabBarBorderColor}>
               {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    let iconName = 'ellipse-outline';
                    let label = route.name;

                    if (route.name === 'BrowseTab') {
                         iconName = isFocused ? 'library' : 'library-outline';
                         label = browseTabLabel;
                    } else if (route.name === 'LibraryCardTab') {
                         iconName = isFocused ? 'card' : 'card-outline';
                         label = cardTabLabel;
                    } else if (route.name === 'AccountTab') {
                         iconName = isFocused ? 'person' : 'person-outline';
                         label = accountTabLabel;
                    } else if (route.name === 'MoreTab') {
                         iconName = isFocused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
                         label = moreTabLabel;
                    } else if (route.name === 'SelfCheckTab') {
                         iconName = isFocused ? 'barcode' : 'barcode-outline';
                         label = scoTabLabel;
                    }

                    const iconColor = isFocused ? activeIconColor : inactiveIconColor;

                    const onPress = () => {
                         const event = navigation.emit({
                              type: 'tabPress',
                              target: route.key,
                              canPreventDefault: true,
                         });

                         if (!isFocused && !event.defaultPrevented) {
                              navigation.navigate(route.name, route.params);
                         }
                    };

                    const onLongPress = () => {
                         navigation.emit({
                              type: 'tabLongPress',
                              target: route.key,
                         });
                    };

                    if (route.name === 'AccountScreenTab') {
                         return null;
                    }

                    return (
                         <Pressable
                              key={route.key}
                              accessibilityRole="button"
                              accessibilityState={isFocused ? { selected: true } : {}}
                              accessibilityLabel={options.tabBarAccessibilityLabel}
                              testID={options.tabBarTestID}
                              onPress={onPress}
                              onLongPress={onLongPress}>
                              <VStack gap="$1" alignItems="center">
                                   <Ionicons name={iconName} size={22} color={iconColor} />
                                   <Text size="2xs" color={iconColor} fontWeight="$normal">
                                        {label}
                                   </Text>
                              </VStack>
                         </Pressable>
                    );
               })}
          </HStack>
     );
};
