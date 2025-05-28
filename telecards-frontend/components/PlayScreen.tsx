import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, GameState, Deck, AvatarFrame } from '../types';
import { KrendiCoinIcon, SettingsIcon, RatingIcon, XPIcon, CollectionIcon as DeckIcon, QuestionMarkCircleIcon, CalendarDaysIcon } from '../assets/icons'; 
import telegramSDK from '../services/telegramSDK';
import { useTranslations } from '../hooks/useTranslations';
import { generateMockBotGameState, calculateXpToNextLevel, MAX_CARDS_PER_DECK, SFX_BUTTON_CLICK, ALL_AVATAR_FRAMES, DEFAULT_AVATAR_FRAME_ID } from '../constants';
import webSocketService from '../services/websocketService';
import soundService from '../services/soundService';

// Enhanced PlayerAvatarWithFrame to use frameUrl
const PlayerAvatarWithFrame: React.FC<{avatarUrl?: string, frameUrl?: string, name?: string, sizeClass?: string, frameSizeClass?: string, avatarClass?: string }> = 
  ({avatarUrl, frameUrl, name, sizeClass = "w-12 h-12 sm:w-14 sm:h-14", frameSizeClass = "w-full h-full", avatarClass }) => (
    <div className={`relative ${sizeClass}`}>
        <img
            src={avatarUrl || 'https://picsum.photos/seed/avatar/80/80'}
            alt={name || "Player Avatar"}
            className={`w-full h-full rounded-full object-cover shadow-md ${avatarClass || 'border-2 border-app-primary'}`}
        />
        {frameUrl && (
            <img
                src={frameUrl}
                alt="Avatar Frame"
                className={`absolute inset-0 object-contain pointer-events-none ${frameSizeClass}`}
            />
        )}
    </div>
);

const PlayScreen: React.FC = () => {
  const { currentUser, playerProfile, krendiCoins, playerDecks, dailyQuests, availableQuestsPool } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const navigate = (screen: Screen) => {
    soundService.playSound(SFX_BUTTON_CLICK);
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
    soundService.playSound(SFX_BUTTON_CLICK);
    if (!currentUser || !playerProfile) {
      dispatch({type: 'SET_ERROR', payload: t('error_userNotFoundForBotMatch')});
      return;
    }
    if (!validateActiveDeck()) return;

    const activeDeck = getActiveDeck();
    if (!activeDeck) return; 

    const botGameState = generateMockBotGameState(currentUser, playerProfile, activeDeck.cardIds);
    webSocketService.setExternalGameState(botGameState, currentUser, playerProfile); 
    
    dispatch({ type: 'SET_MATCH_DATA', payload: botGameState as GameState });
    dispatch({ type: 'NAVIGATE_TO', payload: Screen.GameBoard }); 
  };

  const handleFindRankedMatch = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    if (!currentUser || !playerProfile) {
      dispatch({type: 'SET_ERROR', payload: t('error_userNotFoundForMatchmaking')});
      return;
    }
    if (!validateActiveDeck()) return;
    
    dispatch({ type: 'NAVIGATE_TO', payload: Screen.Matchmaking }); 
  };
  
  const handleStartTutorial = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'START_TUTORIAL' });
  };

  const handleCloseApp = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    telegramSDK.closeApp();
  };

  const handleOpenDailyQuests = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'NAVIGATE_TO', payload: Screen.DailyQuests });
  };

  const getLevelBadgeColor = (level: number) => { 
    if (level >= 10) return 'bg-legendary-rarity text-white shadow-orange-400/50';
    if (level >= 7) return 'bg-epic-rarity text-white shadow-purple-400/50';
    if (level >= 4) return 'bg-rare-rarity text-white shadow-blue-400/50';
    return 'bg-common-rarity text-gray-700 shadow-gray-400/50';
  }

  const xpProgress = playerProfile ? calculateXpToNextLevel(playerProfile.level, playerProfile.xp).progressPercentage : 0;

  const claimableQuestsCount = dailyQuests.filter(pq => {
    const def = availableQuestsPool.find(qDef => qDef.id === pq.questDefId);
    return def && pq.isCompleted && !pq.isClaimed;
  }).length;

  const equippedFrame = useMemo((): AvatarFrame | undefined => {
    if (!playerProfile || !playerProfile.equippedAvatarFrameId) {
      return ALL_AVATAR_FRAMES.find(f => f.id === DEFAULT_AVATAR_FRAME_ID);
    }
    return ALL_AVATAR_FRAMES.find(f => f.id === playerProfile.equippedAvatarFrameId);
  }, [playerProfile]);

  return (
    <div className="flex flex-col h-full p-3 sm:p-4 bg-app-bg text-app-text">
      <header className="mb-4 sm:mb-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <PlayerAvatarWithFrame 
              avatarUrl={playerProfile?.avatarUrl || currentUser?.photoUrl}
              frameUrl={equippedFrame?.imageUrl}
              name={currentUser?.firstName}
              avatarClass='border-2 border-app-primary'
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-app-text truncate max-w-[150px] sm:max-w-[200px]">
                {currentUser?.firstName || t('mainMenu_title')}
              </h1>
              <div className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-block shadow-sm ${getLevelBadgeColor(playerProfile?.level || 1)}`}>
                {t('profile_level')} {playerProfile?.level || 1}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(Screen.Settings)}
            className="p-1.5 sm:p-2 bg-app-bg-secondary hover:bg-app-card-border rounded-full transition-colors shadow"
            aria-label={t('settings_aria_label')}
            title={t('settings_title')}
          >
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-app-text-secondary hover:text-app-primary" />
          </button>
        </div>
        
        {playerProfile && (
            <div className="my-2 sm:my-3">
                <div className="flex justify-between text-xs text-app-text-secondary mb-0.5">
                    <span>{t('profile_xp')}</span>
                    <span>{playerProfile.xp} / {playerProfile.xpToNextLevel}</span>
                </div>
                <div className="w-full bg-app-bg-secondary rounded-full h-2 sm:h-2.5 shadow-inner">
                    <div 
                        className="bg-app-primary h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${xpProgress}%` }}
                    ></div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm bg-app-bg-secondary p-2 rounded-lg shadow">
          <div className="flex items-center space-x-1">
            <RatingIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-app-primary">{playerProfile?.rating || 'N/A'}</span>
            <span className="text-app-text-secondary hidden sm:inline">{t('profile_rating')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <KrendiCoinIcon className="w-4 h-4" />
            <span className="font-semibold text-app-primary">{krendiCoins}</span>
            <span className="text-app-text-secondary hidden sm:inline">{t('mainMenu_krendiCoinsBalance')}</span>
          </div>
        </div>
      </header>

      <div className="flex-grow grid grid-cols-1 gap-3 sm:gap-4 content-start py-2">
        <button
          onClick={handleFindRankedMatch}
          className="w-full bg-app-primary hover:opacity-90 text-app-bg font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-app-primary/70"
        >
          {t('mainMenu_button_findGame')}
        </button>
        <button
          onClick={handlePlayVsBot}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {t('mainMenu_button_playVsBot')}
        </button>
        <button
          onClick={() => navigate(Screen.DeckBuilder)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center"
        >
          <DeckIcon className="w-5 h-5 mr-2" />
          {t('mainMenu_button_manageDecks')}
        </button>
         <button
          onClick={handleOpenDailyQuests}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-400 flex items-center justify-center relative"
        >
          <CalendarDaysIcon className="w-5 h-5 mr-2" />
          {t('mainMenu_button_dailyQuests')}
          {claimableQuestsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {claimableQuestsCount}
            </span>
          )}
        </button>
        <button
          onClick={handleStartTutorial}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 sm:py-4 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center justify-center"
        >
          <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
          {t('mainMenu_button_tutorial')}
        </button>
      </div>

      <div className="mt-auto pt-3 sm:pt-4">
        <button
          onClick={handleCloseApp}
          className="w-full bg-app-accent/80 hover:bg-app-accent text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-app-accent/70"
        >
          {t('mainMenu_button_exit')}
        </button>
      </div>
    </div>
  );
};

export default PlayScreen;