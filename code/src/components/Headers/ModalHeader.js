import React from 'react';
import { HStack, Pressable, Text, Box, useToken } from '@gluestack-ui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../themes/theme';

export const ModalHeader = ({ title, onBack, onClose, showBack = true, showClose = true, centerTitle = true }) => {
     const { textColor, colorMode } = useTheme();
     const iconColor = useToken('colors', colorMode === 'light' ? 'coolGray600' : 'coolGray200');
     const bg = colorMode === 'light' ? '$warmGray50' : '$coolGray700';

     return (
          <Box bg={bg} px="$3" py="$3">
               <HStack alignItems="center" justifyContent="space-between">
                    <Box minWidth={40}>
                         {showBack && onBack ? (
                              <Pressable onPress={onBack} p="$1">
                                   <MaterialIcons name="chevron-left" size={28} color={iconColor} />
                              </Pressable>
                         ) : null}
                    </Box>

                    <Box flex={1} alignItems={centerTitle ? 'center' : 'flex-start'}>
                         <Text bold color={textColor} numberOfLines={1}>
                              {title}
                         </Text>
                    </Box>

                    <Box minWidth={40} alignItems="flex-end">
                         {showClose && onClose ? (
                              <Pressable onPress={onClose} p="$1">
                                   <MaterialIcons name="close" size={24} color={iconColor} />
                              </Pressable>
                         ) : null}
                    </Box>
               </HStack>
          </Box>
     );
};
