import React from 'react';
import { useRoute, useNavigation, StackActions } from '@react-navigation/native';
import { getCleanTitle } from '../../../helpers/item';
import { useLibrary } from '../../../hooks/useLibrarySystemData';

export const LoadSavedSearch = () => {
     const navigation = useNavigation();
     const id = useRoute().params.search ?? 0;
     const title = useRoute().params.name ?? 'Saved Search Results';
     const library = useLibrary();
     const url = library.baseUrl;

     const pushAction = StackActions.push('MySavedSearch',
         {
              id: id,
              title: getCleanTitle(title),
              libraryUrl: url,
              prevRoute: 'NONE'
         });

     navigation.dispatch(pushAction);

}