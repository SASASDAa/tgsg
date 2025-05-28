
import React from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, GameState, Deck } from '../types'; // Added Deck
import { KrendiCoinIcon, SettingsIcon, RatingIcon, XPIcon, CollectionIcon as DeckIcon } from '../assets/icons'; // Added DeckIcon
import telegramSDK from '../services/telegramSDK';
import { useTranslations } from '../hooks/useTranslations';
import { generateMockBotGameState, calculateXpToNextLevel, MAX_CARDS_PER_DECK } from '../constants';
import webSocketService from '../services/websocketService';

// Note: The component is named PlayScreen but the file is MainMenu.tsx as per the prompt.
const PlayScreen: React.FC = () => {
  const { currentUser, playerProfile, krendiCoins, playerDecks } = useAppState(); // Added playerDecks
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const navigate = (screen: Screen) => {
    dispatch({ type: 'NAVIGATE_TO', payload: screen });
  };

  const getActiveDeck = (): Deck | undefined => {
    return playerDecks.find(deck => deck.isActive);
  };

  const validateActiveDeck = (): boolean => {
    const activeDeck = getActiveDeck();
    if (!activeDeck) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_noActiveDeck') });
      return false;
    }
    if (activeDeck.cardIds.length !== MAX_CARDS_PER_DECK) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_incompleteActiveDeck', { deckName: activeDeck.name, required: MAX_CARDS_PER_DECK, current: activeDeck.cardIds.length }) });
      return false;
    }
    return true;
  };

  const handlePlayVsBot = () => {
    if (!currentUser || !playerProfile) {
      dispatch({type: 'SET_ERROR', payload: t('error_userNotFoundForBotMatch')});
      return;
    }
    if (!validateActiveDeck()) return;

    const activeDeck = getActiveDeck();
    if (!activeDeck) { // Should be caught by validateActiveDeck, but good for safety
        dispatch({type: 'SET_ERROR', payload: t('deckBuilder_error_noActiveDeck')});
        return;
    }

    // Line 25 in the original prompt's MainMenu.tsx was the call below, now corrected.
    const botGameState = generateMockBotGameState(currentUser, playerProfile, activeDeck.cardIds);
    webSocketService.setExternalGameState(botGameState, currentUser, playerProfile); 
    
    dispatch({ type: 'SET_MATCH_DATA', payload: botGameState as GameState });
    navigate(Screen.GameBoard);
  };
  
  const getLevelBadgeColor = (level: number) => {
    if (level >= 10) return 'bg-legendary-rarity text-white shadow-orange-400/50';
    if (level >= 7) return 'bg-epic-rarity text-white shadow-purple-400/50';
    if (level >= 4) return 'bg-rare-rarity text-white shadow-blue-400/50';
    return 'bg-common-rarity text-gray-700 shadow-gray-400/50';
  }

  const xpProgress = playerProfile ? calculateXpToNextLevel(playerProfile.level, playerProfile.xp).progressPercentage : 0;


  return (
    <div className="flex flex-col h-full p-3 sm:p-4 bg-darkborn-bg text-darkborn-text">
      <header className="mb-4 sm:mb-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={playerProfile?.avatarUrl || currentUser?.photoUrl || 'https://picsum.photos/seed/avatar/80/80'} 
              alt="Player Avatar" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-darkborn-primary object-cover shadow-md"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-darkborn-text truncate max-w-[150px] sm:max-w-[200px]">
                {currentUser?.firstName || t('mainMenu_title')}
              </h1>
              <div className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-block shadow-sm ${getLevelBadgeColor(playerProfile?.level || 1)}`}>
                {t('profile_level')} {playerProfile?.level || 1}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(Screen.Settings)}
            className="p-1.5 sm:p-2 bg-darkborn-bg-secondary hover:bg-darkborn-card-border rounded-full transition-colors shadow"
            aria-label={t('settings_aria_label')}
            title={t('settings_title')}
          >
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-darkborn-text-secondary hover:text-darkborn-primary" />
          </button>
        </div>
        
        {playerProfile && (
            <div className="my-2 sm:my-3">
                <div className="flex justify-between text-xs text-darkborn-text-secondary mb-0.5">
                    <span>{t('profile_xp')}</span>
                    <span>{playerProfile.xp} / {playerProfile.xpToNextLevel}</span>
                </div>
                <div className="w-full bg-darkborn-bg-secondary rounded-full h-2 sm:h-2.5 shadow-inner">
                    <div 
                        className="bg-darkborn-primary h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${xpProgress}%` }}
                    ></div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm bg-darkborn-bg-secondary p-2 rounded-lg shadow">
          <div className="flex items-center space-x-1">
            <RatingIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-darkborn-primary">{playerProfile?.rating || 'N/A'}</span>
            <span className="text-darkborn-text-secondary hidden sm:inline">{t('profile_rating')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <KrendiCoinIcon className="w-4 h-4" />
            <span className="font-semibold text-darkborn-primary">{krendiCoins}</span>
            <span className="text-darkborn-text-secondary hidden sm:inline">{t('mainMenu_krendiCoinsBalance')}</span>
          </div>
        </div>
      </header>

      <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 content-start py-2">
        <button
          onClick={() => navigate(Screen.Matchmaking)}
          className="w-full bg-darkborn-primary hover:bg-orange-400 text-darkborn-bg font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {t('mainMenu_button_findGame')}
        </button>
        <button
          onClick={handlePlayVsBot}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {t('mainMenu_button_playVsBot')}
        </button>
         {/* Added Deck Management Button for consistency with PlayScreen.tsx if this file is intended to be similar */}
        <button
            onClick={() => navigate(Screen.DeckBuilder)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center"
        >
            <DeckIcon className="w-5 h-5 mr-2" /> 
            {t('mainMenu_button_manageDecks')}
        </button>
        <button
          onClick={() => {
            dispatch({ type: 'NAVIGATE_TO', payload: Screen.Social });
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {t('mainMenu_button_challengeFriend')}
        </button>
      </div>

      <div className="mt-auto pt-3 sm:pt-4">
        <button
          onClick={() => telegramSDK.closeApp()}
          className="w-full bg-darkborn-accent/80 hover:bg-darkborn-accent text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {t('mainMenu_button_exit')}
        </button>
      </div>
    </div>
  );
};

export default PlayScreen;
