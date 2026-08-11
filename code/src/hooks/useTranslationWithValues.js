import React from 'react';

import { useLibrary } from './useLibrarySystemData';
import { useActiveLanguage } from './useLanguageData';
import { getTranslationWithValuesText, formatTranslationWithValues, getTermFromDictionary } from '../translations/TranslationService';

export function useTranslationWithValues(key, values, options = {}) {
     const {
          enabled = true,
          addToDictionary = false,
          initialValue = ''
     } = options;

     const language = useActiveLanguage();
     const library = useLibrary();
     const [text, setText] = React.useState(initialValue);
     const [isLoading, setIsLoading] = React.useState(false);
     const [error, setError] = React.useState(null);

     const valuesSignature = React.useMemo(() => JSON.stringify(values ?? null), [values]);

     React.useEffect(() => {
          let isActive = true;

          const fallbackText = formatTranslationWithValues(
               getTermFromDictionary(language, key, false),
               values
          );

          const fetchTranslation = async () => {
               if (!enabled || !key || !library?.baseUrl) {
                    if (isActive) {
                         setText(fallbackText);
                         setError(null);
                         setIsLoading(false);
                    }
                    return;
               }

               setIsLoading(true);
               setError(null);

               try {
                    const translatedText = await getTranslationWithValuesText(
                         key,
                         values,
                         language,
                         library.baseUrl,
                         addToDictionary
                    );

                    if (isActive) {
                         setText(translatedText || fallbackText);
                    }
               } catch (caughtError) {
                    if (isActive) {
                         setError(caughtError);
                         setText(fallbackText);
                    }
               } finally {
                    if (isActive) {
                         setIsLoading(false);
                    }
               }
          };

          fetchTranslation();

          return () => {
               isActive = false;
          };
     }, [enabled, key, language, library?.baseUrl, addToDictionary, valuesSignature]);

     return {
          text,
          isLoading,
          error
     };
}

