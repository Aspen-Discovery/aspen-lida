import moment from 'moment';

export let translationsLibrary = {
    lastUpdated: moment(),
};

export const getTermFromDictionary = (language = 'en', key, ellipsis = false, dictionaryOverride = null) => {
    if (language && key) {
        let tmpDictionary = dictionaryOverride || translationsLibrary;
        if (tmpDictionary !== undefined) {
            if (tmpDictionary[language]) {
                const thisDictionary = tmpDictionary[language];
                if (thisDictionary[key]) {
                    if (ellipsis) {
                        return tmpDictionary[language][key] + '...';
                    }
                    return tmpDictionary[language][key];
                } else {
                    if (tmpDictionary.en) {
                        const englishDictionary = tmpDictionary.en;
                        if (englishDictionary[key]) {
                            if (ellipsis) {
                                return englishDictionary[key] + '...';
                            }
                            return englishDictionary[key];
                        }
                    }
                }
            }
        }
    }
    let defaults = require('./defaults.json');
    if (ellipsis) {
        return defaults[key] + '...';
    }
    return defaults[key];
};
