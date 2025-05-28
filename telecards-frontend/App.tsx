
import React, { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from './context/AppStateContext';
import { Screen, TelegramUser, Language, DragItem, AppTheme, PlayerAchievementProgress, Deck, ChallengeIncomingPayload } from './types';
import PlayScreen from './components/PlayScreen'; 
import MatchmakingSpinner from './components/MatchmakingSpinner';
import GameBoard from './components/GameBoard';
import Shop from './components/Shop';
import Collection from './components/Collection';
import SettingsScreen from './components/SettingsScreen';
import ProfileScreen from './components/ProfileScreen'; 
import SocialScreen from './components/SocialScreen';   
import LeaderboardScreen from './components/LeaderboardScreen'; 
import ThemeSelectionScreen from './components/ThemeSelectionScreen';
import DeckBuilderScreen from './components/DeckBuilderScreen';
import TutorialScreen from './components/TutorialScreen';
import DailyQuestsModal from './components/DailyQuestsModal';
import ChallengeNotificationModal from './components/ChallengeNotificationModal'; // New Import
import BottomNavBar from './components/BottomNavBar';   
import telegramSDK from './services/telegramSDK';
import apiService from './services/apiService'; 
import { useTranslations } from './hooks/useTranslations';
import { INITIAL_PLAYER_PROFILE, calculateXpToNextLevel, ALL_ACHIEVEMENTS, MAX_CARDS_PER_DECK, MUSIC_MAIN_MENU, MUSIC_SHOP, MUSIC_COLLECTION, MUSIC_GAME_BOARD, ALL_DAILY_QUESTS_POOL, DAILY_QUEST_COUNT, DAILY_QUEST_REFRESH_INTERVAL } from './constants';
import soundService from './services/soundService';
import webSocketService from './services/websocketService'; // For ChallengeNotificationModal
import { WebSocketMessageType } from './types'; // For ChallengeNotificationModal

const App: React.FC = () => {
  const { 
    activeScreen, currentUser, krendiCoins, krendiDust, ownedCards, error, isLoading, language,
    currentTheme, playerProfile, draggingItem, achievements, playerAchievements,
    playerDecks, dailyQuests, lastDailyQuestRefresh, availableQuestsPool, incomingChallenge
  } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  useEffect(() => {
    telegramSDK.ready();
    
    const storedLang = localStorage.getItem('telecards_language') as Language;
    if (storedLang && Object.values(Language).includes(storedLang)) {
      if (language !== storedLang) dispatch({ type: 'SET_LANGUAGE', payload: storedLang });
    } else {
      document.documentElement.lang = language;
    }

    const storedTheme = localStorage.getItem('telecards_theme') as AppTheme;
    if (storedTheme && Object.values(AppTheme).includes(storedTheme)) {
        if (currentTheme !== storedTheme) dispatch({ type: 'SET_THEME', payload: storedTheme });
    }
    document.documentElement.dataset.theme = currentTheme;

    const user = telegramSDK.getUserData();
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      Promise.all([
        apiService.fetchPlayerData(user.id.toString()),
        apiService.fetchFriendRequests(user.id.toString()) 
      ]).then(([playerData, friendRequestsData]) => {
          dispatch({ type: 'SET_KRENDI_COINS', payload: playerData.krendiCoins });
          dispatch({ type: 'SET_KRENDI_DUST', payload: playerData.krendiDust });
          dispatch({ type: 'SET_OWNED_CARDS', payload: playerData.ownedCards });
          
          const initialProfile = playerData.playerProfile || { ...INITIAL_PLAYER_PROFILE, friendCode: playerData.playerProfile.friendCode || apiService.generateNewFriendCode() };
          initialProfile.avatarUrl = user.photoUrl || initialProfile.avatarUrl;
          initialProfile.name = user.firstName; 
          if (initialProfile.pvpWins === undefined) initialProfile.pvpWins = 0; 
          
          const {xpForNextDisplay} = calculateXpToNextLevel(initialProfile.level, initialProfile.xp);
          initialProfile.xpToNextLevel = xpForNextDisplay;

          dispatch({ type: 'SET_PROFILE_DATA', payload: initialProfile });
          dispatch({ type: 'SET_FRIENDS_LIST', payload: playerData.friendsList });
          
          let currentAchievementsProgress = playerData.playerAchievements;
          if (!currentAchievementsProgress || currentAchievementsProgress.length !== ALL_ACHIEVEMENTS.length) {
            currentAchievementsProgress = ALL_ACHIEVEMENTS.map(ach => ({
              achievementId: ach.id, currentValue: 0, isCompleted: false, isClaimed: false,
            }));
          }
          dispatch({ type: 'LOAD_ACHIEVEMENTS', payload: { achievements: ALL_ACHIEVEMENTS, progress: currentAchievementsProgress } });
          dispatch({ type: 'SET_FRIEND_REQUESTS', payload: friendRequestsData });
          
          let loadedDecks = playerData.playerDecks || []; 
          if (loadedDecks.length === 0 && playerData.ownedCards.length >= MAX_CARDS_PER_DECK) {
            const starterDeckCardIds = playerData.ownedCards.slice(0, MAX_CARDS_PER_DECK).map(c => c.id);
            loadedDecks.push({
                id: crypto.randomUUID(), name: t('deckBuilder_defaultStarterDeckName'), cardIds: starterDeckCardIds,
                isActive: true, createdAt: Date.now(), updatedAt: Date.now()
            });
          } else if (loadedDecks.length > 0 && !loadedDecks.some(d => d.isActive)) {
            loadedDecks[0].isActive = true;
          }
          dispatch({ type: 'LOAD_DECKS', payload: loadedDecks });

          // Load daily quests data
          let questsToLoad = playerData.dailyQuests || [];
          let lastRefreshToLoad = playerData.lastDailyQuestRefresh || 0;
          const now = Date.now();
          if (now - lastRefreshToLoad >= DAILY_QUEST_REFRESH_INTERVAL || questsToLoad.length === 0) {
            const shuffledPool = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
            const newQuestDefs = shuffledPool.slice(0, DAILY_QUEST_COUNT);
            questsToLoad = newQuestDefs.map(def => ({
                questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
            }));
            lastRefreshToLoad = now;
          }
          dispatch({ type: 'LOAD_DAILY_QUESTS_DATA', payload: { quests: questsToLoad, lastRefresh: lastRefreshToLoad, pool: ALL_DAILY_QUESTS_POOL } });

          apiService.setCurrentUser(user, playerData.krendiCoins, playerData.krendiDust, playerData.ownedCards, initialProfile, playerData.friendsList, currentAchievementsProgress, friendRequestsData.incoming, friendRequestsData.outgoing, loadedDecks, questsToLoad, lastRefreshToLoad);
        })
        .catch(err => dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load player data' }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: false }));

    } else { 
      const mockUserTg: TelegramUser = { id: 1, firstName: 'MockPlayer', username: 'mockplayer', photoUrl: 'https://picsum.photos/seed/mockuser/100/100' };
      dispatch({ type: 'SET_USER', payload: mockUserTg });
      const mockProfile = { ...INITIAL_PLAYER_PROFILE, avatarUrl: mockUserTg.photoUrl, friendCode: apiService.generateNewFriendCode(), name: mockUserTg.firstName, pvpWins: 0 };
      const {xpForNextDisplay} = calculateXpToNextLevel(mockProfile.level, mockProfile.xp);
      mockProfile.xpToNextLevel = xpForNextDisplay;

      dispatch({ type: 'SET_PROFILE_DATA', payload: mockProfile });
      
      const initialAchievementsProgress = ALL_ACHIEVEMENTS.map(ach => ({
        achievementId: ach.id, currentValue: 0, isCompleted: false, isClaimed: false,
      }));
      dispatch({ type: 'LOAD_ACHIEVEMENTS', payload: { achievements: ALL_ACHIEVEMENTS, progress: initialAchievementsProgress }});
      dispatch({ type: 'SET_FRIEND_REQUESTS', payload: { incoming: [], outgoing: [] } });
      
      const initialDecks: Deck[] = [];
      dispatch({type: 'LOAD_DECKS', payload: initialDecks });
      
      // Initial daily quests for mock user
      const shuffledQuests = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
      const initialDailyQuestDefs = shuffledQuests.slice(0, DAILY_QUEST_COUNT);
      const initialPlayerDailyQuests = initialDailyQuestDefs.map(def => ({
          questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
      }));
      const now = Date.now();
      dispatch({ type: 'LOAD_DAILY_QUESTS_DATA', payload: { quests: initialPlayerDailyQuests, lastRefresh: now, pool: ALL_DAILY_QUESTS_POOL } });
      apiService.setCurrentUser(mockUserTg, krendiCoins, krendiDust, ownedCards, mockProfile, [], initialAchievementsProgress, [], [], initialDecks, initialPlayerDailyQuests, now );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);


  useEffect(() => { 
    if (activeScreen === Screen.Shop) soundService.playMusic(MUSIC_SHOP);
    else if (activeScreen === Screen.Collection || activeScreen === Screen.DeckBuilder) soundService.playMusic(MUSIC_COLLECTION);
    else if (activeScreen === Screen.GameBoard) soundService.playMusic(MUSIC_GAME_BOARD, true, 0.4);
    else if (soundService.getCurrentMusicName() !== MUSIC_MAIN_MENU && 
             (activeScreen === Screen.Play || activeScreen === Screen.Profile || activeScreen === Screen.Leaderboard || activeScreen === Screen.Social || activeScreen === Screen.Settings)) {
      soundService.playMusic(MUSIC_MAIN_MENU);
    }
  }, [activeScreen]);

  const handleChallengeResponse = (challengeId: string, accepted: boolean) => {
    if (!currentUser || !playerProfile) return; // Should not happen if modal is shown
    webSocketService.sendMessage({
        type: WebSocketMessageType.CHALLENGE_RESPONSE,
        payload: { challengeId, accepted }
    });
    dispatch({ type: 'CLEAR_INCOMING_CHALLENGE' });
  };


  const renderError = () => (
    error && (
      <div className="fixed top-0 left-0 right-0 p-2 bg-app-accent text-white text-xs text-center z-50 shadow-lg flex justify-between items-center">
        <span>{t('app_errorPrefix')}: {error}</span>
        <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/40 rounded text-xs">
          {t('app_dismissErrorButton')}
        </button>
      </div>
    )
  );

  const renderScreen = () => {
    if (isLoading && !currentUser) return <div className="flex items-center justify-center h-full text-app-primary">{t('app_loadingUserData')}</div>;
    switch (activeScreen) {
      case Screen.Play: return <PlayScreen />;
      case Screen.Matchmaking: return <MatchmakingSpinner />;
      case Screen.GameBoard: return <GameBoard />;
      case Screen.Shop: return <Shop />;
      case Screen.Collection: return <Collection />;
      case Screen.Settings: return <SettingsScreen />;
      case Screen.Profile: return <ProfileScreen />;
      case Screen.Social: return <SocialScreen />;
      case Screen.Leaderboard: return <LeaderboardScreen />;
      case Screen.ThemeSelection: return <ThemeSelectionScreen />;
      case Screen.DeckBuilder: return <DeckBuilderScreen />;
      case Screen.Tutorial: return <TutorialScreen />;
      case Screen.DailyQuests: return <DailyQuestsModal />;
      default: return <PlayScreen />;
    }
  };

  const isNavVisible = ![Screen.GameBoard, Screen.Matchmaking, Screen.Tutorial, Screen.DailyQuests].includes(activeScreen);

  return (
    <div className="flex flex-col h-full w-full shadow-2xl bg-app-bg text-app-text overflow-hidden relative">
      {renderError()}
      {incomingChallenge && (
        <ChallengeNotificationModal
            challenge={incomingChallenge}
            onAccept={() => handleChallengeResponse(incomingChallenge.challengeId, true)}
            onDecline={() => handleChallengeResponse(incomingChallenge.challengeId, false)}
        />
      )}
      <div 
        className={`flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar
                    ${draggingItem ? 'cursor-grabbing' : ''}
                    ${activeScreen === Screen.GameBoard ? 'game-board-container-no-scrollbar' : ''}
                   `}
        style={{ WebkitOverflowScrolling: 'touch' }} 
      >
        {renderScreen()}
      </div>
      {isNavVisible && <BottomNavBar />}
      <div id="drag-layer" className="fixed inset-0 pointer-events-none z-[1000]"></div>
      <p className="absolute bottom-1 right-1 text-[0.5rem] text-app-text-secondary opacity-30 pointer-events-none">{t('app_parodyDisclaimer')}</p>
    </div>
  );
};

export default App;
