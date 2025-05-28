
import React from 'react';
import { useAppDispatch, useAppState } from '../context/AppStateContext';
import { Language, Screen } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { LanguageIcon, VolumeUpIcon, VolumeOffIcon } from '../assets/icons'; 
import soundService from '../services/soundService';
import { SFX_BUTTON_CLICK } from '../constants';

const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { language, isMuted, globalVolume } = useAppState();
  const { t } = useTranslations();

  const handleLanguageChange = (selectedLanguage: Language) => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'SET_LANGUAGE', payload: selectedLanguage });
  };

  const navigateToThemes = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'NAVIGATE_TO', payload: Screen.ThemeSelection });
  };

  const toggleMute = () => {
    soundService.playSound(SFX_BUTTON_CLICK, -1); // Play even if muted
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    dispatch({ type: 'SET_GLOBAL_VOLUME', payload: newVolume });
  };

  const languageOptions = [
    { code: Language.EN, name: t('settings_language_en') },
    { code: Language.RU, name: t('settings_language_ru') },
    { code: Language.FR, name: t('settings_language_fr') },
  ];

  return (
    <div className="p-3 sm:p-4 flex flex-col items-center h-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-app-primary mb-6 sm:mb-8 mt-2 sm:mt-4">{t('settings_pageTitle')}</h2>

      <div className="w-full max-w-xs sm:max-w-sm space-y-5 sm:space-y-6">
        {/* Language Settings Card */}
        <div className="bg-app-panel/50 p-4 sm:p-5 rounded-lg shadow-md">
          <div className="mb-3 flex items-center">
            <LanguageIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-app-primary" />
            <label htmlFor="language-select" className="text-md font-semibold text-app-text">
              {t('settings_languageSelectionLabel')}
            </label>
          </div>
          <div className="space-y-2">
            {languageOptions.map(option => (
              <button
                key={option.code}
                onClick={() => handleLanguageChange(option.code)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors font-medium text-sm
                  ${language === option.code 
                    ? 'bg-app-primary text-app-bg-secondary ring-1 ring-app-primary/70 shadow-sm' 
                    : 'bg-app-bg-secondary hover:bg-app-panel/70 text-app-text'}`}
                aria-pressed={language === option.code}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Settings Button Card */}
        <div className="bg-app-panel/50 p-4 sm:p-5 rounded-lg shadow-md">
            <button
              onClick={navigateToThemes}
              className="w-full text-left px-3 py-2 rounded-md transition-colors font-medium text-sm bg-app-bg-secondary hover:bg-app-panel/70 text-app-text flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-app-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.486H7.343v-2.343z" /></svg>
              Themes
            </button>
        </div>
        
        {/* Sound Settings Card */}
        <div className="bg-app-panel/50 p-4 sm:p-5 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-app-text">
              {t('settings_soundSettingsTitle')}
            </h3>
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-app-panel
                ${isMuted ? 'bg-app-accent/30 hover:bg-app-accent/50 focus:ring-app-accent/70' : 'bg-app-bg-secondary hover:bg-app-panel/70 focus:ring-app-primary/50'}`}
              aria-label={isMuted ? t('settings_muteButton_unmute') : t('settings_muteButton_mute')}
              aria-pressed={isMuted}
            >
              {isMuted 
                ? <VolumeOffIcon className="w-5 h-5 text-app-accent" /> 
                : <VolumeUpIcon className="w-5 h-5 text-app-text-secondary" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`text-xs font-medium w-10 text-center tabular-nums ${isMuted ? 'text-app-text-secondary/70' : 'text-app-primary'}`}>
              {Math.round(globalVolume * 100)}%
            </span>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={globalVolume}
              onChange={handleVolumeChange}
              className={`
                flex-grow h-2 rounded-lg appearance-none cursor-pointer transition-all duration-150
                ${isMuted 
                  ? 'bg-app-bg accent-app-text-secondary/60' 
                  : 'bg-app-bg-secondary accent-app-primary'
                }
                focus:outline-none focus:ring-1 ${isMuted ? 'focus:ring-app-text-secondary/40' : 'focus:ring-app-primary/50'}
              `}
              aria-label={t('settings_volumeSliderLabel')}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
