import { Checkbox, HStack, Pressable, Text } from 'native-base';
import React, { Component } from 'react';

export default class Facet_Checkbox extends Component {
     render() {
          const item = this.props.data;
          if (item.count) {
               return (
                    <Pressable py={4} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                         <HStack align="center" space={3}>
                              <Checkbox value={item.value} accessibilityLabel={item.display}>
                                   <Text _light={{ color: 'darkText' }} _dark={{ color: 'lightText' }}>
                                        {item.display} ({item.count})
                                   </Text>
                              </Checkbox>
                         </HStack>
                    </Pressable>
               );
          } else {
               return (
                    <Pressable py={4} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                         <HStack align="center" space={3}>
                              <Checkbox value={item.value} accessibilityLabel={item.display}>
                                   <Text _light={{ color: 'darkText' }} _dark={{ color: 'lightText' }}>
                                        {item.display}
                                   </Text>
                              </Checkbox>
                         </HStack>
                    </Pressable>
               );
          }
     }
}