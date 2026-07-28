import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerActions } from '@react-navigation/native';
import { HStack, Pressable, Text, VStack, useToken } from '@gluestack-ui/themed';
import React from 'react';
import { Platform } from 'react-native';
import { ThemeContext } from '../../context/initialContext';
import { useSelfCheckEnabled } from '../../hooks/useLibraryBranchData';
import { getTermFromDictionary } from '../../translations/TranslationService';

import AccountStackNavigator from '../stack/AccountStackNavigator';
import BrowseStackNavigator from '../stack/BrowseStackNavigator';
import LibraryCardStackNavigator from '../stack/LibraryCardStackNavigator';
import MoreStackNavigator from '../stack/MoreStackNavigator';
import SelfCheckOutStackNavigator from '../stack/SelfCheckOutStackNavigator';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveLanguage } from '../../hooks/useLanguageData';

export default function TabNavigator() {
     const Tab = createBottomTabNavigator();

     const enableSelfCheck = useSelfCheckEnabled();
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);

     const activeIcon = colorMode === 'light' ? "$coolGray900" : "$warmGray300";
     const inactiveIcon = colorMode === 'light' ? "$coolGray700" : "$warmGray100";
     const tabBarBackgroundColor = colorMode === 'light' ? "$coolGray100" : "$coolGray900";

     return (
          <Tab.Navigator
               tabBar={(props) => <TabItem {...props} />}
               initialRouteName="BrowseTab"
               screenOptions={({ route }) => ({
                    headerShown: false,
                    backBehavior: 'none',
                    tabBarHideOnKeyboard: true,
                    tabBarActiveTintColor: activeIcon,
                    tabBarInactiveTintColor: inactiveIcon,
                    tabBarLabelStyle: {
                         fontWeight: '400',
                    },
                    tabBarStyle: {
                         backgroundColor: tabBarBackgroundColor,
                         elevation: 0,
                    },
               })}>
               <Tab.Screen
                    name="BrowseTab"
                    component={BrowseStackNavigator}
                    options={
                         {
                              //tabBarLabel: browseTabLabel,
                         }
                    }
                    screenOptions={{
                         headerShown: false,
                    }}
               />
               <Tab.Screen
                    name="LibraryCardTab"
                    component={LibraryCardStackNavigator}
                    options={
                         {
                              //tabBarLabel: cardTabLabel,
                         }
                    }
               />
               {enableSelfCheck ? (
                    <Tab.Screen
                         name="SelfCheckTab"
                         component={SelfCheckOutStackNavigator}
                         options={
                              {
                                   //tabBarLabel: selfCheckTabLabel,
                              }
                         }
                    />
               ) : null}
               <Tab.Screen
                    name="AccountTab"
                    component={AccountStackNavigator}
                    options={
                         {
                              //tabBarLabel: accountTabLabel,
                              //tabBarBadge: 3,
                         }
                    }
                    listeners={({ navigation }) => ({
                         tabPress: (e) => {
                              navigation.dispatch(DrawerActions.toggleDrawer());
                              e.preventDefault();
                         },
                    })}
               />
               <Tab.Screen
                    name="AccountScreenTab"
                    component={AccountStackNavigator}
                    options={{
                         tabBarButton: () => null,
                    }}
               />
               <Tab.Screen
                    name="MoreTab"
                    component={MoreStackNavigator}
                    options={
                         {
                              //tabBarLabel: moreTabLabel,
                         }
                    }
                    listeners={({ navigation }) => ({
                         tabPress: (e) => {
                              e.preventDefault();
                              navigation.navigate('MoreTab', {
                                   screen: 'MoreMenu',
                              });
                         },
                    })}
               />
          </Tab.Navigator>
     );
}

export const TabItem = ({ state, descriptors, navigation }) => {
     const language = useActiveLanguage();
     const { colorMode, theme, textColor } = React.useContext(ThemeContext);

     // Resolve tokens to actual color strings for native components
     const activeIconColor = useToken('colors', colorMode === 'light' ? 'coolGray700' : 'coolGray300');
     const inactiveIconColor = useToken('colors', colorMode === 'light' ? 'coolGray500' : 'coolGray400');

     // Keep tokens for Gluestack components (HStack, etc.)
     const tabBarBackgroundColor = colorMode === 'light' ? "$coolGray100" : "$coolGray900";
     const tabBarBorderColor = colorMode === 'light' ? "$coolGray200" : "$coolGray300";

     const [browseTabLabel, setBrowseTabLabel] = React.useState(getTermFromDictionary(language, 'nav_discover'));
     const [cardTabLabel, setCardTabLabel] = React.useState(getTermFromDictionary(language, 'nav_card'));
     const [accountTabLabel, setAccountTabLabel] = React.useState(getTermFromDictionary(language, 'nav_account'));
     const [scoTabLabel, setScoTabLabel] = React.useState(getTermFromDictionary(language, 'nav_sco'));
     const [moreTabLabel, setMoreTabLabel] = React.useState(getTermFromDictionary(language, 'nav_more'));

     const insets = useSafeAreaInsets();

     React.useEffect(() => {
          setTimeout(() => {
               setBrowseTabLabel(getTermFromDictionary(language, 'nav_discover'));
               setCardTabLabel(getTermFromDictionary(language, 'nav_card'));
               setAccountTabLabel(getTermFromDictionary(language, 'nav_account'));
               setScoTabLabel(getTermFromDictionary(language, 'nav_sco'));
               setMoreTabLabel(getTermFromDictionary(language, 'nav_more'));
          }, 1500);
     }, [language]);

     const bottomPaddingToken = Platform.OS === 'android' ? "$3" : "$8";

     return (
          <HStack px="$7" pt="$2" pb={insets.bottom} gap="$4" alignItems="center" justifyContent="space-between" backgroundColor={tabBarBackgroundColor} borderTopWidth="$1" borderColor={tabBarBorderColor}>
               {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    //let label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                    const isFocused = state.index === index;

                    let iconName;
                    let dictionaryKey;
                    if (route.name === 'BrowseTab') {
                         iconName = isFocused ? 'library' : 'library-outline';
                         dictionaryKey = browseTabLabel;
                    } else if (route.name === 'LibraryCardTab') {
                         iconName = isFocused ? 'card' : 'card-outline';
                         dictionaryKey = cardTabLabel;
                    } else if (route.name === 'AccountTab') {
                         iconName = isFocused ? 'person' : 'person-outline';
                         dictionaryKey = accountTabLabel;
                    } else if (route.name === 'MoreTab') {
                         iconName = isFocused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
                         dictionaryKey = moreTabLabel;
                    } else if (route.name === 'SelfCheckTab') {
                         iconName = isFocused ? 'barcode' : 'barcode-outline';
                         dictionaryKey = scoTabLabel;
                    }

                    let iconColor = inactiveIconColor;
                    if (isFocused) {
                         iconColor = activeIconColor;
                    }
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
                         <Pressable key={index} accessibilityRole="button" accessibilityState={isFocused ? { selected: true } : {}} accessibilityLabel={options.tabBarAccessibilityLabel} testID={options.tabBarTestID} onPress={onPress} onLongPress={onLongPress}>
                              <VStack gap="$1" alignItems="center">
                                   <Ionicons name={iconName} size={22} color={iconColor} />
                                   <Text size="2xs" color={iconColor} fontWeight="$normal">
                                        {dictionaryKey}
                                   </Text>
                              </VStack>
                         </Pressable>
                    );
               })}
          </HStack>
     );
};
