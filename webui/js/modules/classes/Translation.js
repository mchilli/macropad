'use strict';

export default class Translation {
    constructor() {
        this.translations = {};
        this.currentLanguage = null;
    }

    async loadLanguage(language) {
        try {
            if (language !== 'en') {
                const response = await fetch(`lang/${language}.json`);
                this.translations[language] = await response.json();
            }
            this.currentLanguage = language;
        } catch (error) {
            console.error(`Failed to load translations for '${language}', loaded 'en' instead`);
        }
    }

    translate(key) {
        const language = this.currentLanguage;

        if (!language || language === 'en') {
            return key;
        }

        const translationsForLanguage = this.translations[language];
        if (!translationsForLanguage) {
            return key;
        }

        const translation = translationsForLanguage[key];
        return translation || key;
    }
}
