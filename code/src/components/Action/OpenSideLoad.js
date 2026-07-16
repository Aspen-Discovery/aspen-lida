import { Button, ButtonText, ButtonSpinner } from '@gluestack-ui/themed';
import React from 'react';
import { ThemeContext } from '../../context/initialContext';
import { openSideLoad } from '../../util/api/userHelper';

// custom components and helper files

export const OpenSideLoad = (props) => {
     const [loading, setLoading] = React.useState(false);
     const { theme } = React.useContext(ThemeContext);

     return (
          <Button
               size="md"
               bgColor={theme.tokens.colors.primary['500']}
               variant="solid"
               minWidth="100%"
               maxWidth="100%"
               onPress={async () => {
                    setLoading(true);
                    await openSideLoad(props.url).then((r) => setLoading(false));
               }}>
               {loading ? <ButtonSpinner color={theme.tokens.colors.primary['500-text']} /> : <ButtonText color={theme.tokens.colors.primary['500-text']}>{props.title}</ButtonText>}
          </Button>
     );
};
