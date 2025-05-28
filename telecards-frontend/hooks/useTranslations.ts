
import { useAppState } from '../context/AppStateContext';
import { en } from '../translations/en';
import { ru } from '../translations/ru';
import { fr } from '../translations/fr';
import { Language } from '../types';
import { TranslationKeys, TranslationVariables } from '../translations/keys';

const translations = {
  [Language.EN]: en,
  [Language.RU]: ru,
  [Language.FR]: fr,
};

export const useTranslations = () => {
  const { language } = useAppState();

  const t = (key: keyof TranslationKeys, variables?: TranslationVariables): string => {
    let translation = translations[language]?.[key] || translations[Language.EN]?.[key] || key.toString();
    
    if (variables) {
      Object.keys(variables).forEach((varKey) => {
        const regex = new RegExp(`{{\\s*${varKey}\\s*}}`, 'g');
        translation = translation.replace(regex, String(variables[varKey]));
      });
    }
    return translation;
  };

  return { t, currentLanguage: language };
};