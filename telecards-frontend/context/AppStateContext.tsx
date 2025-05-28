
import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { AppState, AppAction, Screen, TelegramUser, Card, GameState, Language, PlayerProfile, GameReward, DragItem, Friend, AppTheme, Achievement, PlayerAchievementProgress, FriendRequest, FriendRequestStatus, GameRewardType, AchievementIconType, Deck, DailyQuestDefinition, PlayerDailyQuest, QuestProgressType, AvatarFrame, CardBack, CardRarity, ChestOpeningResponse, ChallengeIncomingPayload } from '../types';
import { 
  INITIAL_PLAYER_PROFILE, 
  LEVEL_XP_THRESHOLDS, 
  REWARDS_PER_LEVEL, 
  calculateXpToNextLevel, 
  getCardById,
  MOCK_RATING_CHANGE_WIN, MOCK_RATING_CHANGE_LOSS, INITIAL_RATING,
  MOCK_FRIENDS, 
  ALL_ACHIEVEMENTS, // Now imported
  MAX_CARDS_PER_DECK, ALL_CARDS_POOL_RAW,
  ALL_DAILY_QUESTS_POOL, DAILY_QUEST_COUNT, DAILY_QUEST_REFRESH_INTERVAL, 
  SFX_QUEST_COMPLETE, SFX_REWARD_CLAIM, SFX_ITEM_PURCHASE, SFX_ITEM_EQUIP,
  RARITY_DISENCHANT_VALUES, RARITY_CRAFT_COSTS, SFX_CARD_DISENCHANT, SFX_CARD_CRAFT,
  MAX_COPIES_LEGENDARY, MAX_COPIES_NON_LEGENDARY,
  createCardInstance as createCardInstanceFromConstants // Import and alias
} from '../constants';
import apiService from '../services/apiService'; 
import soundService from '../services/soundService';

// ALL_ACHIEVEMENTS is now imported from constants.ts

const getInitialLanguage = (): Language => {
  const storedLang = localStorage.getItem('telecards_language') as Language;
  if (storedLang && Object.values(Language).includes(storedLang)) {
    return storedLang;
  }
  const browserLang = navigator.language.split('-')[0] as Language;
  if (Object.values(Language).includes(browserLang)) {
    return browserLang;
  }
  return Language.EN;
};

const getInitialTheme = (): AppTheme => {
  const storedTheme = localStorage.getItem('telecards_theme') as AppTheme;
  if (storedTheme && Object.values(AppTheme).includes(storedTheme)) {
    return storedTheme;
  }
  return AppTheme.Default; 
};

const getInitialMuteState = (): boolean => {
  const storedMute = localStorage.getItem('telecards_isMuted');
  return storedMute ? JSON.parse(storedMute) : false;
};

const getInitialVolume = (): number => {
  const storedVolume = localStorage.getItem('telecards_globalVolume');
  const volume = storedVolume ? parseFloat(storedVolume) : 0.7;
  return Number.isNaN(volume) ? 0.7 : Math.max(0, Math.min(1, volume));
};


const initialState: AppState = {
  currentUser: null,
  playerProfile: { ...INITIAL_PLAYER_PROFILE }, 
  krendiCoins: 1000, 
  krendiDust: 0, // Initial Krendi Dust
  ownedCards: [], 
  activeScreen: Screen.Play, 
  currentMatchData: null,
  isLoading: false,
  error: null,
  lastChestResult: null,
  language: getInitialLanguage(),
  currentTheme: getInitialTheme(),
  friendsList: MOCK_FRIENDS, 
  draggingItem: null,
  dropTargetInfo: null,
  achievements: [], 
  playerAchievements: [], 
  incomingFriendRequests: [],
  outgoingFriendRequests: [],
  incomingChallenge: null, // For friend challenges
  playerDecks: [], 
  selectedDeckId: null, 
  isTutorialActive: false,
  currentTutorialStep: 0,
  isMuted: getInitialMuteState(),
  globalVolume: getInitialVolume(),
  dailyQuests: [],
  availableQuestsPool: [],
  lastDailyQuestRefresh: 0,
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => null);

// Helper function to update quest progress.
// This function will be called from multiple places in the reducer.
const updateQuestProgressInReducer = (
  state: AppState,
  progressType: QuestProgressType,
  incrementAmount: number = 1,
  data?: any // For more complex quest types, e.g., card type played
): PlayerDailyQuest[] => {
  if (state.dailyQuests.length === 0) return state.dailyQuests;

  let questsUpdated = false;
  const newDailyQuests = state.dailyQuests.map(pq => {
    if (pq.isCompleted) return pq;

    const questDef = state.availableQuestsPool.find(q => q.id === pq.questDefId);
    if (!questDef || questDef.progressType !== progressType) return pq;
    
    const newProgress = { ...pq, currentValue: Math.min(pq.currentValue + incrementAmount, questDef.targetValue) };
    if (!newProgress.isCompleted && newProgress.currentValue >= questDef.targetValue) {
      newProgress.isCompleted = true;
      questsUpdated = true;
      soundService.playSound(SFX_QUEST_COMPLETE);
    }
    return newProgress;
  });

  return questsUpdated ? newDailyQuests : state.dailyQuests;
};


const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER': {
      const user = action.payload;
      let profile = { ...state.playerProfile, avatarUrl: user.photoUrl || state.playerProfile.avatarUrl, name: user.firstName };
      if (!profile.friendCode) profile.friendCode = apiService.generateNewFriendCode();
      return { ...state, currentUser: user, playerProfile: profile };
    }
    case 'SET_PROFILE_DATA': {
        const newProfileData = { ...state.playerProfile, ...action.payload };
        const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, newProfileData, state.ownedCards.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0 , 0);
        return { ...state, playerProfile: newProfileData, playerAchievements: updatedAchievements };
    }
    case 'UPDATE_PLAYER_PROFILE': {
        const updatedData = { ...state.playerProfile, ...action.payload };
        const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, updatedData, state.ownedCards.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0, 0);
        return { ...state, playerProfile: updatedData, playerAchievements: updatedAchievements };
    }
    
    case 'ADD_XP': {
      const { xpGained, opponentType, outcome } = action.payload;
      let currentProfile = { ...state.playerProfile };
      currentProfile.xp += xpGained;

      let updatedDailyQuests = [...state.dailyQuests];

      if (outcome === 'win') {
          currentProfile.totalWins = (currentProfile.totalWins || 0) + 1;
          updatedDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: updatedDailyQuests}, QuestProgressType.MatchesWon);
          if (opponentType === 'bot') {
              currentProfile.botWins = (currentProfile.botWins || 0) + 1;
              updatedDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: updatedDailyQuests}, QuestProgressType.BotMatchesWon);
          } else {
              currentProfile.pvpWins = (currentProfile.pvpWins || 0) + 1;
              updatedDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: updatedDailyQuests}, QuestProgressType.PvpMatchesWon);
          }
      }

      let ratingChange = 0;
      if(opponentType !== 'bot') { 
        ratingChange = outcome === 'win' ? MOCK_RATING_CHANGE_WIN : MOCK_RATING_CHANGE_LOSS;
      }
      currentProfile.rating = Math.max(0, (currentProfile.rating || INITIAL_RATING) + ratingChange); 

      const rewardsGranted: GameReward[] = [];
      let { xpForNextDisplay: nextLevelXpThreshold } = calculateXpToNextLevel(currentProfile.level, currentProfile.xp);
      
      while (currentProfile.xp >= nextLevelXpThreshold && LEVEL_XP_THRESHOLDS[currentProfile.level + 1] !== undefined) {
        currentProfile.level += 1;
        const levelRewards = REWARDS_PER_LEVEL[currentProfile.level];
        if (levelRewards) {
          rewardsGranted.push(...levelRewards);
        }
        nextLevelXpThreshold = calculateXpToNextLevel(currentProfile.level, currentProfile.xp).xpForNextDisplay;
      }
      currentProfile.xpToNextLevel = nextLevelXpThreshold; 

      let newKrendiCoins = state.krendiCoins;
      let newKrendiDust = state.krendiDust;
      const newCardsForCollection: Card[] = [];

      rewardsGranted.forEach(reward => {
        if (reward.type === GameRewardType.KrendiCoins && reward.amount) {
          newKrendiCoins += reward.amount;
        } else if (reward.type === GameRewardType.KrendiDust && reward.amount) {
            newKrendiDust += reward.amount;
        } else if (reward.type === GameRewardType.SpecificCard && reward.cardId) {
          const cardProto = getCardById(reward.cardId);
          if (cardProto) { 
             const card = createCardInstanceFromConstants(cardProto.id); // Use the aliased import
             if (card && !state.ownedCards.find(owned => owned.id === card.id)) newCardsForCollection.push(card);
          }
        }
      });
      
      const updatedPlayerAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, currentProfile, state.ownedCards.length + newCardsForCollection.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, newKrendiDust, 0, 0);

      return {
        ...state,
        playerProfile: currentProfile,
        krendiCoins: newKrendiCoins,
        krendiDust: newKrendiDust,
        ownedCards: state.ownedCards.concat(newCardsForCollection.filter(nc => !state.ownedCards.some(oc => oc.id === nc.id))),
        playerAchievements: updatedPlayerAchievements,
        dailyQuests: updatedDailyQuests,
      };
    }

    case 'SET_KRENDI_COINS':
      return { ...state, krendiCoins: action.payload };
    case 'ADD_KRENDI_COINS': {
      const newKrendiCoins = state.krendiCoins + action.payload;
      const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, state.playerProfile, state.ownedCards.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0, 0); // Re-evaluate achievements that might depend on coin total
      return { ...state, krendiCoins: newKrendiCoins, playerAchievements: updatedAchievements };
    }
    case 'SET_KRENDI_DUST':
      return { ...state, krendiDust: action.payload };
    case 'ADD_KRENDI_DUST': {
      const newKrendiDust = state.krendiDust + action.payload;
      const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, state.playerProfile, state.ownedCards.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, newKrendiDust, 0, 0);
      return { ...state, krendiDust: newKrendiDust, playerAchievements: updatedAchievements };
    }

    case 'SET_OWNED_CARDS': {
      const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, state.playerProfile, action.payload.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0, 0);
      let newPlayerDecks = [...state.playerDecks];
      if (newPlayerDecks.length === 0 && action.payload.length >= MAX_CARDS_PER_DECK) {
          const starterDeckCardIds = action.payload.slice(0, MAX_CARDS_PER_DECK).map(c => c.id);
          const starterDeck: Deck = {
              id: crypto.randomUUID(), name: "Starter Deck", cardIds: starterDeckCardIds,
              isActive: true, createdAt: Date.now(), updatedAt: Date.now(),
          };
          newPlayerDecks.push(starterDeck);
      } else if (newPlayerDecks.length > 0 && !newPlayerDecks.some(d => d.isActive)) {
          newPlayerDecks[0].isActive = true;
      }
      return { ...state, ownedCards: action.payload, playerAchievements: updatedAchievements, playerDecks: newPlayerDecks };
    }
    case 'ADD_CARDS_TO_COLLECTION': {
      const existingCardUuids = new Set(state.ownedCards.map(card => card.uuid));
      const newUniqueCardsByUuid = action.payload.filter(card => card.uuid && !existingCardUuids.has(card.uuid));
      
      const finalOwnedCards = [...state.ownedCards, ...newUniqueCardsByUuid];
      const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, state.playerProfile, finalOwnedCards.length, state.playerProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0, 0);
      return { ...state, ownedCards: finalOwnedCards, playerAchievements: updatedAchievements };
    }
    case 'NAVIGATE_TO':
      if (state.isTutorialActive && action.payload !== Screen.Tutorial) {
        return { ...state, activeScreen: action.payload, error: null, selectedDeckId: (action.payload !== Screen.DeckBuilder && action.payload !== Screen.GameBoard) ? null : state.selectedDeckId, isTutorialActive: false, currentTutorialStep: 0 };
      }
      if (action.payload !== Screen.DeckBuilder && action.payload !== Screen.GameBoard && action.payload !== Screen.DailyQuests) {
        return { ...state, activeScreen: action.payload, error: null, selectedDeckId: null };
      }
      return { ...state, activeScreen: action.payload, error: null };

    case 'SET_MATCH_DATA':
      return { ...state, currentMatchData: action.payload };
    case 'UPDATE_GAME_STATE':{
        if (!state.currentMatchData) return state;
        let newDailyQuests = state.dailyQuests;
        const newGameState = action.payload as Partial<GameState>;

        if (newGameState.player?.board) {
          const playedCardsCount = newGameState.player.board.length - (state.currentMatchData.player?.board?.length || 0);
          if (playedCardsCount > 0) {
            newDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: newDailyQuests}, QuestProgressType.CardsPlayed, playedCardsCount);
            // Assuming all cards played to board are minions for this quest. Could be refined.
            newDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: newDailyQuests}, QuestProgressType.MinionsPlayed, playedCardsCount);
          }
        }

        if (newGameState.opponent?.health !== undefined && state.currentMatchData.opponent.health > newGameState.opponent.health) {
            const damageDealt = state.currentMatchData.opponent.health - newGameState.opponent.health;
            if (damageDealt > 0) {
                newDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: newDailyQuests}, QuestProgressType.DamageDealtToEnemyHero, damageDealt);
            }
        }
        if (newGameState.opponent?.board && state.currentMatchData.opponent.board.length > newGameState.opponent.board.length) {
            const minionsDestroyed = state.currentMatchData.opponent.board.length - newGameState.opponent.board.length;
             if (minionsDestroyed > 0) {
                newDailyQuests = updateQuestProgressInReducer({...state, dailyQuests: newDailyQuests}, QuestProgressType.EnemyMinionsDestroyed, minionsDestroyed);
            }
        }
        
        const updatedPlayerState = newGameState.player ? { ...state.currentMatchData.player, ...newGameState.player } : state.currentMatchData.player;
        const updatedOpponentState = newGameState.opponent ? { ...state.currentMatchData.opponent, ...newGameState.opponent } : state.currentMatchData.opponent;

        return { 
            ...state, 
            currentMatchData: { ...state.currentMatchData, ...newGameState, player: updatedPlayerState, opponent: updatedOpponentState },
            dailyQuests: newDailyQuests
        };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LAST_CHEST_RESULT': {
        const chestResult = action.payload;
        if (!chestResult) return { ...state, lastChestResult: null };
    
        const newOwnedCardsAfterChest = [...state.ownedCards];
        // The newCards in chestResult are only those actually added to the collection by ApiService
        chestResult.newCards.forEach(newCard => {
            if (newCard.uuid && !newOwnedCardsAfterChest.find(c => c.uuid === newCard.uuid)) {
                newOwnedCardsAfterChest.push(newCard);
            } else if (!newCard.uuid && !newOwnedCardsAfterChest.find(c => c.id === newCard.id)) { // Should not happen if ApiService assigns UUIDs
                newOwnedCardsAfterChest.push({...newCard, uuid: crypto.randomUUID()});
            }
        });
        
        const newKrendiDustTotal = state.krendiDust + chestResult.krendiDustGained;

        const updatedAchievements = updatePlayerAchievements(
            state.achievements, 
            state.playerAchievements, 
            state.playerProfile, 
            newOwnedCardsAfterChest.length,
            state.playerProfile.ownedAvatarFrameIds.length,
            state.playerProfile.ownedCardBackIds.length,
            newKrendiDustTotal,
            0, // disenchanted in this action (manual disenchant removed)
            0  // crafted in this action
        );
    
        return { 
            ...state, 
            lastChestResult: chestResult,
            krendiCoins: chestResult.updatedKrendiCoins, 
            ownedCards: newOwnedCardsAfterChest,
            krendiDust: newKrendiDustTotal,
            playerAchievements: updatedAchievements,
        };
    }
    case 'SET_LANGUAGE':
      localStorage.setItem('telecards_language', action.payload);
      document.documentElement.lang = action.payload;
      return { ...state, language: action.payload };
    case 'SET_THEME':
      localStorage.setItem('telecards_theme', action.payload);
      document.documentElement.dataset.theme = action.payload;
      return { ...state, currentTheme: action.payload };
    
    case 'SET_FRIENDS_LIST':
      return { ...state, friendsList: action.payload };
    case 'ADD_FRIEND': {
      if (state.friendsList.find(f => f.id === action.payload.id)) return state;
      return { ...state, friendsList: [...state.friendsList, action.payload] };
    }
    case 'REMOVE_FRIEND':
      return { ...state, friendsList: state.friendsList.filter(f => f.id !== action.payload) };

    case 'START_DRAG_ITEM':
      return { ...state, draggingItem: action.payload };
    case 'END_DRAG_ITEM':
      return { ...state, draggingItem: null, dropTargetInfo: null }; 
    case 'SET_DROP_TARGET':
      return { ...state, dropTargetInfo: action.payload };

    case 'LOAD_ACHIEVEMENTS':
      return { ...state, achievements: action.payload.achievements, playerAchievements: action.payload.progress };
    
    case 'UPDATE_ACHIEVEMENT_PROGRESS': {
      const { achievementId, value, increment } = action.payload;
      const achievementDefinition = state.achievements.find(a => a.id === achievementId);
      if (!achievementDefinition) return state;

      const updatedPlayerAchievements = state.playerAchievements.map(progress => {
        if (progress.achievementId === achievementId) {
          if (progress.isCompleted && (!achievementDefinition.reward || progress.isClaimed)) return progress; 
          
          const newValue = value !== undefined ? value : progress.currentValue + (increment || 0);
          const isCompleted = newValue >= achievementDefinition.targetValue;
          return {
            ...progress,
            currentValue: Math.min(newValue, achievementDefinition.targetValue), 
            isCompleted: progress.isCompleted || isCompleted,
            isClaimed: (progress.isCompleted || isCompleted) && !achievementDefinition.reward ? true : progress.isClaimed,
          };
        }
        return progress;
      });
      return { ...state, playerAchievements: updatedPlayerAchievements };
    }
    case 'CLAIM_ACHIEVEMENT_REWARD': {
        const achievementId = action.payload;
        const achievement = state.achievements.find(a => a.id === achievementId);
        const progress = state.playerAchievements.find(p => p.achievementId === achievementId);

        if (!achievement || !progress || !progress.isCompleted || progress.isClaimed || !achievement.reward) {
            return state;
        }
        soundService.playSound(SFX_REWARD_CLAIM);
        let newKrendiCoins = state.krendiCoins;
        let newKrendiDust = state.krendiDust;
        let newOwnedCards = [...state.ownedCards];

        if (achievement.reward.type === GameRewardType.KrendiCoins && achievement.reward.amount) {
            newKrendiCoins += achievement.reward.amount;
        } else if (achievement.reward.type === GameRewardType.KrendiDust && achievement.reward.amount) {
            newKrendiDust += achievement.reward.amount;
        } else if (achievement.reward.type === GameRewardType.SpecificCard && achievement.reward.cardId) {
            const cardProto = getCardById(achievement.reward.cardId);
            if (cardProto ) {
                const card = createCardInstanceFromConstants(cardProto.id); // Use aliased import
                if (card && !newOwnedCards.find(c => c.id === card.id)) newOwnedCards.push(card);
            }
        }
        
        const updatedPlayerAchievementsProgress = state.playerAchievements.map(p =>
            p.achievementId === achievementId ? { ...p, isClaimed: true } : p
        );
        
        const achievementsAfterClaimRewards = updatePlayerAchievements(
            state.achievements, updatedPlayerAchievementsProgress, state.playerProfile,
            newOwnedCards.length, state.playerProfile.ownedAvatarFrameIds.length, 
            state.playerProfile.ownedCardBackIds.length, newKrendiDust, 0, 0
        );

        return {
            ...state,
            krendiCoins: newKrendiCoins,
            krendiDust: newKrendiDust,
            ownedCards: newOwnedCards,
            playerAchievements: achievementsAfterClaimRewards,
        };
    }

    case 'SET_FRIEND_REQUESTS':
      return { ...state, incomingFriendRequests: action.payload.incoming, outgoingFriendRequests: action.payload.outgoing };
    case 'ADD_OUTGOING_FRIEND_REQUEST':
      return { ...state, outgoingFriendRequests: [...state.outgoingFriendRequests, action.payload] };
    case 'UPDATE_FRIEND_REQUEST_STATUS': {
      const { requestId, status, newFriend } = action.payload;
      let updatedState = { ...state };
      updatedState.incomingFriendRequests = state.incomingFriendRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      ).filter(req => status === FriendRequestStatus.Pending ? true : req.id !== requestId); 
      
      updatedState.outgoingFriendRequests = state.outgoingFriendRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      );
      if (status === FriendRequestStatus.Accepted && newFriend) {
        if (!updatedState.friendsList.find(f => f.id === newFriend.id)) {
          updatedState.friendsList = [...updatedState.friendsList, newFriend];
        }
      }
      return updatedState;
    }
    case 'SET_INCOMING_CHALLENGE':
        return { ...state, incomingChallenge: action.payload as ChallengeIncomingPayload | null };
    case 'CLEAR_INCOMING_CHALLENGE':
        return { ...state, incomingChallenge: null };

    case 'LOAD_DECKS':
      return { ...state, playerDecks: action.payload };
    case 'CREATE_DECK': {
      const newDeck: Deck = {
        id: crypto.randomUUID(), name: action.payload.name || `Deck ${state.playerDecks.length + 1}`,
        cardIds: [], isActive: state.playerDecks.length === 0, 
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      const decks = [...state.playerDecks, newDeck];
      if (newDeck.isActive) decks.forEach(d => { if (d.id !== newDeck.id) d.isActive = false; });
      return { ...state, playerDecks: decks, selectedDeckId: newDeck.id };
    }
    case 'UPDATE_DECK': {
      const updatedDeck = action.payload;
      updatedDeck.updatedAt = Date.now();
      const decks = state.playerDecks.map(deck => deck.id === updatedDeck.id ? updatedDeck : deck);
      if (updatedDeck.isActive) decks.forEach(d => { if (d.id !== updatedDeck.id) d.isActive = false; });
      return { ...state, playerDecks: decks };
    }
    case 'DELETE_DECK': {
      const deckIdToDelete = action.payload;
      const remainingDecks = state.playerDecks.filter(deck => deck.id !== deckIdToDelete);
      const deletedDeckWasActive = state.playerDecks.find(d => d.id === deckIdToDelete)?.isActive;
      if (deletedDeckWasActive && remainingDecks.length > 0 && !remainingDecks.some(d => d.isActive)) {
        remainingDecks[0].isActive = true; 
      }
      return { ...state, playerDecks: remainingDecks, selectedDeckId: state.selectedDeckId === deckIdToDelete ? null : state.selectedDeckId };
    }
    case 'SET_ACTIVE_DECK': {
      const deckIdToActivate = action.payload;
      const decks = state.playerDecks.map(deck => ({ ...deck, isActive: deck.id === deckIdToActivate }));
      return { ...state, playerDecks: decks };
    }
    case 'SET_SELECTED_DECK_ID':
      return { ...state, selectedDeckId: action.payload };

    case 'START_TUTORIAL':
      return { ...state, isTutorialActive: true, currentTutorialStep: 1, activeScreen: Screen.Tutorial };
    case 'END_TUTORIAL':
      return { ...state, isTutorialActive: false, currentTutorialStep: 0, activeScreen: Screen.Play };
    case 'SET_TUTORIAL_STEP':
      return { ...state, currentTutorialStep: action.payload };

    case 'TOGGLE_MUTE': {
      const newMuteState = !state.isMuted;
      localStorage.setItem('telecards_isMuted', JSON.stringify(newMuteState));
      soundService.setMute(newMuteState);
      return { ...state, isMuted: newMuteState };
    }
    case 'SET_GLOBAL_VOLUME': {
      const newVolume = Math.max(0, Math.min(1, action.payload)); 
      localStorage.setItem('telecards_globalVolume', newVolume.toString());
      soundService.setVolume(newVolume);
      let newMuteState = state.isMuted;
      if (newVolume === 0 && !state.isMuted) newMuteState = true;
      else if (newVolume > 0 && state.isMuted) newMuteState = false;
      if (newMuteState !== state.isMuted) {
         localStorage.setItem('telecards_isMuted', JSON.stringify(newMuteState));
         soundService.setMute(newMuteState);
      }
      return { ...state, globalVolume: newVolume, isMuted: newMuteState };
    }

    case 'LOAD_DAILY_QUESTS_DATA':
      return { ...state, dailyQuests: action.payload.quests, lastDailyQuestRefresh: action.payload.lastRefresh, availableQuestsPool: action.payload.pool };
    
    case 'UPDATE_DAILY_QUEST_PROGRESS': {
        const { questDefId, progressType, increment, absoluteValue, data } = action.payload;
        let questsUpdated = false;
        const newDailyQuests = state.dailyQuests.map(pq => {
            if (pq.isCompleted || pq.questDefId !== questDefId) return pq;

            const questDef = state.availableQuestsPool.find(q => q.id === pq.questDefId);
            if (!questDef || questDef.progressType !== progressType) return pq;

            let newCurrentValue = pq.currentValue;
            if (absoluteValue !== undefined) {
                newCurrentValue = absoluteValue;
            } else if (increment !== undefined) {
                newCurrentValue += increment;
            }
            newCurrentValue = Math.min(newCurrentValue, questDef.targetValue);

            const updatedQuest = { ...pq, currentValue: newCurrentValue };
            if (!updatedQuest.isCompleted && updatedQuest.currentValue >= questDef.targetValue) {
                updatedQuest.isCompleted = true;
                questsUpdated = true;
                soundService.playSound(SFX_QUEST_COMPLETE);
            }
            return updatedQuest;
        });
        return { ...state, dailyQuests: newDailyQuests };
    }
    
    case 'CLAIM_DAILY_QUEST_REWARD': {
        const questDefIdToClaim = action.payload;
        const playerQuest = state.dailyQuests.find(q => q.questDefId === questDefIdToClaim);
        const questDef = state.availableQuestsPool.find(q => q.id === questDefIdToClaim);

        if (!playerQuest || !questDef || !playerQuest.isCompleted || playerQuest.isClaimed) {
            return state; 
        }
        soundService.playSound(SFX_REWARD_CLAIM);
        let newKrendiCoins = state.krendiCoins;
        let newKrendiDust = state.krendiDust;
        let newOwnedCards = [...state.ownedCards];

        if (questDef.reward.type === GameRewardType.KrendiCoins && questDef.reward.amount) {
            newKrendiCoins += questDef.reward.amount;
        } else if (questDef.reward.type === GameRewardType.KrendiDust && questDef.reward.amount) {
             newKrendiDust += questDef.reward.amount;
        } else if (questDef.reward.type === GameRewardType.SpecificCard && questDef.reward.cardId) {
            const cardPrototype = getCardById(questDef.reward.cardId);
            if (cardPrototype) {
                const card = createCardInstanceFromConstants(cardPrototype.id); // Use aliased import
                if (card && !newOwnedCards.some(c => c.id === card.id)) newOwnedCards.push(card);
            }
        }

        const updatedDailyQuests = state.dailyQuests.map(pq =>
            pq.questDefId === questDefIdToClaim ? { ...pq, isClaimed: true } : pq
        );
        
        const achievementsAfterClaimRewards = updatePlayerAchievements(
            state.achievements, state.playerAchievements, state.playerProfile,
            newOwnedCards.length, state.playerProfile.ownedAvatarFrameIds.length, 
            state.playerProfile.ownedCardBackIds.length, newKrendiDust, 0, 0
        );


        return { ...state, krendiCoins: newKrendiCoins, krendiDust: newKrendiDust, ownedCards: newOwnedCards, dailyQuests: updatedDailyQuests, playerAchievements: achievementsAfterClaimRewards };
    }
    case 'REFRESH_DAILY_QUESTS': {
        const now = Date.now();
        if (now - state.lastDailyQuestRefresh < DAILY_QUEST_REFRESH_INTERVAL && state.dailyQuests.length > 0 && !state.dailyQuests.every(q => q.isCompleted && q.isClaimed)) {
            return state;
        }

        const shuffledPool = [...state.availableQuestsPool].sort(() => 0.5 - Math.random());
        const newQuestDefs = shuffledPool.slice(0, DAILY_QUEST_COUNT);
        const newPlayerQuests: PlayerDailyQuest[] = newQuestDefs.map(def => ({
            questDefId: def.id,
            currentValue: 0,
            isCompleted: false,
            isClaimed: false,
        }));
        return { ...state, dailyQuests: newPlayerQuests, lastDailyQuestRefresh: now };
    }
    
    case 'BUY_AVATAR_FRAME': {
        const frame = action.payload;
        if (state.krendiCoins < frame.cost) return { ...state, error: "Not enough KrendiCoins!" };
        if (state.playerProfile.ownedAvatarFrameIds.includes(frame.id)) return state; 

        soundService.playSound(SFX_ITEM_PURCHASE);
        const newProfile = {
            ...state.playerProfile,
            ownedAvatarFrameIds: [...state.playerProfile.ownedAvatarFrameIds, frame.id],
        };
        const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, newProfile, state.ownedCards.length, newProfile.ownedAvatarFrameIds.length, state.playerProfile.ownedCardBackIds.length, state.krendiDust, 0, 0);
        return {
            ...state,
            krendiCoins: state.krendiCoins - frame.cost,
            playerProfile: newProfile,
            playerAchievements: updatedAchievements,
        };
    }
    case 'EQUIP_AVATAR_FRAME': {
        soundService.playSound(SFX_ITEM_EQUIP);
        return {
            ...state,
            playerProfile: { ...state.playerProfile, equippedAvatarFrameId: action.payload },
        };
    }
    case 'BUY_CARD_BACK': {
        const cardBack = action.payload;
        if (state.krendiCoins < cardBack.cost) return { ...state, error: "Not enough KrendiCoins!" };
        if (state.playerProfile.ownedCardBackIds.includes(cardBack.id)) return state; 

        soundService.playSound(SFX_ITEM_PURCHASE);
        const newProfile = {
            ...state.playerProfile,
            ownedCardBackIds: [...state.playerProfile.ownedCardBackIds, cardBack.id],
        };
        const updatedAchievements = updatePlayerAchievements(state.achievements, state.playerAchievements, newProfile, state.ownedCards.length, state.playerProfile.ownedAvatarFrameIds.length, newProfile.ownedCardBackIds.length, state.krendiDust, 0, 0);
        return {
            ...state,
            krendiCoins: state.krendiCoins - cardBack.cost,
            playerProfile: newProfile,
            playerAchievements: updatedAchievements,
        };
    }
    case 'EQUIP_CARD_BACK': {
        soundService.playSound(SFX_ITEM_EQUIP);
        return {
            ...state,
            playerProfile: { ...state.playerProfile, equippedCardBackId: action.payload },
        };
    }
    case 'CRAFT_CARD': {
        const { cardId } = action.payload;
        const cardPrototype = getCardById(cardId);
        if (!cardPrototype) {
            return { ...state, error: "Card prototype not found for crafting." };
        }

        const craftCost = RARITY_CRAFT_COSTS[cardPrototype.rarity];
        if (state.krendiDust < craftCost) {
            return { ...state, error: "Not enough Krendi Dust to craft this card." };
        }

        const existingCopiesCount = state.ownedCards.filter(c => c.id === cardId).length;
        
        if (existingCopiesCount > 0) { // Changed from: existingCopiesCount >= maxCopiesAllowed
             return { ...state, error: "error_craft_alreadyOwned" }; // Updated error message key
        }

        const newCardInstance = createCardInstanceFromConstants(cardId);
        if (!newCardInstance) {
            return { ...state, error: "Failed to create card instance." };
        }

        const newKrendiDust = state.krendiDust - craftCost;
        const newOwnedCards = [...state.ownedCards, newCardInstance];

        soundService.playSound(SFX_CARD_CRAFT);
        const updatedAchievements = updatePlayerAchievements(
            state.achievements, 
            state.playerAchievements, 
            state.playerProfile, 
            newOwnedCards.length, 
            state.playerProfile.ownedAvatarFrameIds.length, 
            state.playerProfile.ownedCardBackIds.length, 
            newKrendiDust, 
            0, 
            1 
        );
        return { 
            ...state, 
            krendiDust: newKrendiDust, 
            ownedCards: newOwnedCards, 
            playerAchievements: updatedAchievements, 
            error: null 
        };
    }

    default:
      return state;
  }
};

const updatePlayerAchievements = (
    allAchievements: Achievement[],
    currentProgress: PlayerAchievementProgress[],
    updatedProfileFields: Partial<PlayerProfile>,
    newCardsCount?: number,
    ownedFramesCount?: number,
    ownedBacksCount?: number,
    currentKrendiDust?: number,
    cardsDisenchantedIncrement?: number, 
    cardsCraftedIncrement?: number
): PlayerAchievementProgress[] => {
    let newPlayerAchievements = [...currentProgress];

    allAchievements.forEach(achievement => {
        let progress = newPlayerAchievements.find(p => p.achievementId === achievement.id);
        if (!progress) { 
            progress = { achievementId: achievement.id, currentValue: 0, isCompleted: false, isClaimed: false };
            newPlayerAchievements.push(progress);
        }
        if (progress.isCompleted && (!achievement.reward || progress.isClaimed)) return;

        let newValue = progress.currentValue;
        switch (achievement.category) {
            case 'gameplay':
                if (achievement.iconType === AchievementIconType.GameWin && updatedProfileFields.totalWins !== undefined) newValue = updatedProfileFields.totalWins;
                if (achievement.iconType === AchievementIconType.BotWin && updatedProfileFields.botWins !== undefined) newValue = updatedProfileFields.botWins;
                break;
            case 'collection':
                 if (achievement.iconType === AchievementIconType.CardCollect && newCardsCount !== undefined) newValue = newCardsCount; 
                break;
            case 'progression':
                if (achievement.iconType === AchievementIconType.RatingReach && updatedProfileFields.rating !== undefined) newValue = updatedProfileFields.rating;
                if (achievement.iconType === AchievementIconType.LevelUp && updatedProfileFields.level !== undefined) newValue = updatedProfileFields.level;
                break;
            case 'customization':
                if (achievement.id === 'ach_first_custom_frame' && ownedFramesCount !== undefined && ownedFramesCount > 1) newValue = 1; 
                if (achievement.id === 'ach_first_custom_back' && ownedBacksCount !== undefined && ownedBacksCount > 1) newValue = 1;
                break;
            case 'crafting':
                if (achievement.id === 'ach_collect_100_dust' && currentKrendiDust !== undefined) newValue = currentKrendiDust;
                if (achievement.id === 'ach_craft_first_card' && cardsCraftedIncrement && cardsCraftedIncrement > 0) {
                     if (!progress.isCompleted || achievement.targetValue > 1) {
                        newValue = progress.currentValue + cardsCraftedIncrement;
                     }
                }
                break;
        }
        
        if (newValue > progress.currentValue) progress.currentValue = newValue;

        if (!progress.isCompleted && progress.currentValue >= achievement.targetValue) {
            progress.isCompleted = true;
            if (!achievement.reward) progress.isClaimed = true; 
        }
    });
    return newPlayerAchievements;
};


export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  React.useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = state.currentTheme;
  }, [state.currentTheme]);

  React.useEffect(() => {
    soundService.init(state.isMuted, state.globalVolume);
  }, []); 

   React.useEffect(() => {
    if (state.ownedCards.length === 0 && !state.isLoading) { 
        const initialCardsRaw = [
            ALL_CARDS_POOL_RAW.find(c=>c.id==='c001'), ALL_CARDS_POOL_RAW.find(c=>c.id==='c002'), 
            ALL_CARDS_POOL_RAW.find(c=>c.id==='c003'), ALL_CARDS_POOL_RAW.find(c=>c.id==='r002'),
            ALL_CARDS_POOL_RAW.find(c=>c.id==='c004'), ALL_CARDS_POOL_RAW.find(c=>c.id==='r001'),
            ALL_CARDS_POOL_RAW.find(c=>c.id==='r003'), ALL_CARDS_POOL_RAW.find(c=>c.id==='e001'),
        ].filter(Boolean);
        const initialCards = initialCardsRaw.map(raw => createCardInstanceFromConstants(raw!.id)!).filter(Boolean) as Card[];

        dispatch({type: 'SET_OWNED_CARDS', payload: initialCards});
        
        if (state.playerDecks.length === 0 && initialCards.length >= MAX_CARDS_PER_DECK) {
             const starterDeckCardIds = initialCards.slice(0, MAX_CARDS_PER_DECK).map(c => c.id);
             const starterDeck: Deck = {
                 id: crypto.randomUUID(), name: "Starter Deck", cardIds: starterDeckCardIds,
                 isActive: true, createdAt: Date.now(), updatedAt: Date.now(),
             };
             dispatch({type: 'LOAD_DECKS', payload: [starterDeck] }); 
        }
    }

    if (state.achievements.length === 0 && ALL_ACHIEVEMENTS.length > 0 && !state.isLoading) {
        const initialProgress = ALL_ACHIEVEMENTS.map(ach => ({
            achievementId: ach.id, currentValue: 0, isCompleted: false, isClaimed: false,
        }));
        dispatch({ type: 'LOAD_ACHIEVEMENTS', payload: { achievements: ALL_ACHIEVEMENTS, progress: initialProgress } });
    }
    
    if (state.availableQuestsPool.length === 0 && ALL_DAILY_QUESTS_POOL.length > 0 && !state.isLoading && state.currentUser) {
        const now = Date.now();
        let questsToLoad = state.dailyQuests;
        let lastRefreshToLoad = state.lastDailyQuestRefresh;

        if (now - state.lastDailyQuestRefresh >= DAILY_QUEST_REFRESH_INTERVAL || state.dailyQuests.length === 0) {
            const shuffledPool = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
            const newQuestDefs = shuffledPool.slice(0, DAILY_QUEST_COUNT);
            questsToLoad = newQuestDefs.map(def => ({
                questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
            }));
            lastRefreshToLoad = now;
        }
        dispatch({ type: 'LOAD_DAILY_QUESTS_DATA', payload: { quests: questsToLoad, lastRefresh: lastRefreshToLoad, pool: ALL_DAILY_QUESTS_POOL } });
    }


   }, [state.isLoading, state.ownedCards.length, state.playerDecks.length, state.achievements.length, state.availableQuestsPool.length, state.currentUser, state.lastDailyQuestRefresh, state.dailyQuests.length]);


  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

export const useAppDispatch = (): Dispatch<AppAction> => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppStateProvider');
  }
  return context;
};
