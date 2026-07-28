import React from 'react';
import { ButtonSpinner, Button, ButtonText, useToast } from '@gluestack-ui/themed';

// custom components and helper files
import { ThemeContext } from '../../context/initialContext';
import { useUserState } from '../../hooks/useUserData';
import { completeAction } from '../../util/api/userHelper';
import {logDebugMessage} from "../../util/logging";
import { useLibrary } from '../../hooks/useLibrarySystemData';

export const LoadOverDriveSample = (props) => {
     const { data: userState } = useUserState();
     const user = userState?.user ?? {};
     const library = useLibrary();
     const [loading, setLoading] = React.useState(false);
     const { theme } = React.useContext(ThemeContext);
     const toast = useToast();

     logDebugMessage("Showing overdrive sample, properties are");
     logDebugMessage(props);

     return (
          <Button
               size="xs"
               minWidth="100%"
               maxWidth="100%"
               variant="link"
               mb="$1"
               borderWidth="$1"
               borderColor={theme.tokens.colors.primary['500']}
               onPress={() => {
                    setLoading(true);
                    completeAction(toast, props.id, props.type, user.id, props.formatId, props.sampleNumber, '', '', '', library?.baseUrl ?? '', '', '', '', '').then((r) => {
                         setLoading(false);
                    });
               }}>
               {loading ? <ButtonSpinner color={theme.tokens.colors.primary['500']} /> : <ButtonText color={theme.tokens.colors.primary['500']}>{props.title}</ButtonText>}
          </Button>
     );
};
