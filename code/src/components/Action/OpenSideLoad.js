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
               bgColor="$primary500"
               variant="solid"
               minWidth="100%"
               maxWidth="100%"
               onPress={async () => {
                    setLoading(true);
                    await openSideLoad(props.url).then((r) => setLoading(false));
               }}>
               {loading ? <ButtonSpinner color="$textLight200" /> : <ButtonText color="$textLight200">{props.title}</ButtonText>}
          </Button>
     );
};
