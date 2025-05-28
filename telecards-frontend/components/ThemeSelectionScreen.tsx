
import React from 'react';
import { useAppDispatch, useAppState } from '../context/AppStateContext';
import { AppTheme, Screen } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const ThemeSelectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentTheme } = useAppState();
  const { t } = useTranslations(); // Assuming you might add translations for theme names

  const handleThemeChange = (selectedTheme: AppTheme) => {
    dispatch({ type: 'SET_THEME', payload: selectedTheme });
  };

  const themeOptions = [
    { code: AppTheme.Default, name: "Default (DarkBorn)" },
    { code: AppTheme.Telegram, name: "Telegram" },
    { code: AppTheme.Doge, name: "Doge" },
    { code: AppTheme.Elon, name: "Elon Musk" },
    { code: AppTheme.Ton, name: "TON" },
  ];

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center h-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-app-primary mb-6 sm:mb-8 mt-2 sm:mt-4">Select Theme</h2>

      <div className="w-full max-w-xs sm:max-w-sm bg-app-bg p-5 sm:p-6 rounded-lg shadow-xl">
        <div className="space-y-2 sm:space-y-3">
          {themeOptions.map(option => (
            <button
              key={option.code}
              onClick={() => handleThemeChange(option.code)}
              className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base
                ${currentTheme === option.code 
                  ? 'bg-app-primary text-app-bg-secondary ring-2 ring-orange-300 shadow-md' // Ensure app-bg-secondary contrasts
                  : 'bg-app-bg-secondary hover:bg-app-panel text-app-text'}`}
              aria-pressed={currentTheme === option.code}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
      
      <button
          onClick={() => dispatch({ type: 'NAVIGATE_TO', payload: Screen.Settings })}
          className="mt-6 sm:mt-8 bg-app-accent hover:bg-opacity-80 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md transition duration-150"
        >
          {t('settings_backButton')}
        </button>
    </div>
  );
};

export default ThemeSelectionScreen;