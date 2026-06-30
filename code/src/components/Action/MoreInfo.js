import { Button, ButtonText, useToken } from '@gluestack-ui/themed';
import { useColorModeValue } from '../../themes/theme';
import { LibrarySystemContext, UserContext, ThemeContext } from '../../context/initialContext';
import React from 'react';

// custom components and helper files
import {passUserToDiscovery} from '../../util/api/user';

export const MoreInfo = (props) => {
    const { theme } = React.useContext(ThemeContext);
    const { user } = React.useContext(UserContext);
    const { library } = React.useContext(LibrarySystemContext);

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
                passUserToDiscovery(library.baseUrl, props.module, user.id, backgroundColor, textColor, props.recordId)
            }}>
            <ButtonText color={textColor}>{props.title}</ButtonText>
        </Button>
    );
};
