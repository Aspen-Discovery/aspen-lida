import {Button, ButtonText, useToast, useToken} from '@gluestack-ui/themed';
import { useColorModeValue, useTheme } from '../../themes/theme';

import { useUserState } from '../../hooks/useUserData';
import React from 'react';
import { useLibrary } from '../../hooks/useLibrarySystemData';

// custom components and helper files
import {passUserToDiscovery} from '../../util/api/user';

export const MoreInfo = (props) => {
    const { theme } = useTheme();
    const { data: userState } = useUserState();
    const user = userState?.user ?? {};
    const library = useLibrary();
    const toast = useToast();

    const backgroundColor = useToken('colors', useColorModeValue('warmGray.200', 'coolGray.900'));
    const textColor = useToken('colors', useColorModeValue('gray.800', 'coolGray.200'));

    return (
        <Button
            size="xs"
            minWidth="100%"
            maxWidth="100%"
            variant="link"
            bgColor={backgroundColor}
            onPress={async () => {
                passUserToDiscovery(toast, library?.baseUrl ?? '', props.module, user.id, backgroundColor, textColor, props.recordId)
            }}>
            <ButtonText color={textColor}>{props.title}</ButtonText>
        </Button>
    );
};
