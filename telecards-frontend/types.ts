
import { TranslationKeys } from './translations/keys';

export enum Screen {
  Play = 'PLAY', 
  Matchmaking = 'MATCHMAKING',
  GameBoard = 'GAME_BOARD',
  Shop = 'SHOP',
  Collection = 'COLLECTION',
  Settings = 'SETTINGS',
  Profile = 'PROFILE', 
  Social = 'SOCIAL', 
  Leaderboard = 'LEADERBOARD',
  ThemeSelection = 'THEME_SELECTION',
  DeckBuilder = 'DECK_BUILDER',
  Tutorial = 'TUTORIAL',
  DailyQuests = 'DAILY_QUESTS',
  ProfileCustomization = 'PROFILE_CUSTOMIZATION', // New screen/tab
}

export enum AppTheme {
  Default = 'default',
  Telegram = 'telegram',
  Doge = 'doge',
  Elon = 'elon',
  Ton = 'ton',
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string; 
}

export enum CardRarity {
  Common = 'COMMON',
  Rare = 'RARE',
  Epic = 'EPIC',
  Legendary = 'LEGENDARY',
}

export enum CardAbilityType {
  Taunt = 'TAUNT',
  DivineShield = 'DIVINE_SHIELD',
  Charge = 'CHARGE',
  Battlecry = 'BATTLECRY',
  Deathrattle = 'DEATHRATTLE',
  Lifesteal = 'LIFESTEAL',
  Poison = 'POISON',
  Stealth = 'STEALTH',   // New Ability
  Silence = 'SILENCE',   // New Ability
  Airdrop = 'AIRDROP',   // New Ability
  HODL = 'HODL',       // New Ability
}

export interface CardAbility {
  type: CardAbilityType;
  description: string; 
}

export interface Card {
  id: string; 
  name: string; 
  description: string; 
  imageUrl: string;
  rarity: CardRarity;
  cost: number;
  attack?: number; 
  health?: number; 
  maxHealth?: number; 
  abilities: CardAbility[];
  cardType?: string; 
  
  uuid?: string; 
  isPlayed?: boolean; 
  hasAttacked?: boolean; 
  isDragging?: boolean; 
  currentHealth?: number; 
}

export interface PlayerState {
  id: string; 
  name: string;
  avatarUrl?: string; 
  health: number;
  maxHealth: number; 
  mana: number;
  maxMana: number;
  hand: Card[]; 
  deck: Card[]; 
  board: Card[]; 
  burnoutDamageCounter: number; 
}

export interface GameState {
  matchId: string;
  player: PlayerState;
  opponent: PlayerState;
  currentTurn: string; 
  turnNumber: number;
  log: string[]; 
  winner?: string; 
  isGameOver: boolean;
  opponentType?: 'human' | 'bot'; 
}

export enum Language {
  EN = 'en',
  RU = 'ru',
  FR = 'fr',
}

// --- Customization Item Types ---
export enum CustomizationItemType {
  AvatarFrame = 'AVATAR_FRAME',
  CardBack = 'CARD_BACK',
}

interface BaseCustomizationItem {
  id: string;
  nameKey: keyof TranslationKeys;
  descriptionKey?: keyof TranslationKeys;
  imageUrl: string; // For preview
  cost: number;
  currency: 'KRENDI_COINS'; // For now, only KrendiCoins
  isPremium?: boolean; // For items that might be special/event later
}

export interface AvatarFrame extends BaseCustomizationItem {
  itemType: CustomizationItemType.AvatarFrame;
}

export interface CardBack extends BaseCustomizationItem {
  itemType: CustomizationItemType.CardBack;
  cardBackImageUrl: string; // Actual image used for card backs
}

export type CustomizationItem = AvatarFrame | CardBack;


export interface PlayerProfile {
  name?: string; 
  level: number;
  xp: number;
  xpToNextLevel: number;
  rating: number;
  friendCode: string;
  avatarUrl?: string; 
  totalWins?: number; 
  botWins?: number; 
  pvpWins?: number;
  // Customization fields
  equippedAvatarFrameId?: string | null; // null if default/none
  ownedAvatarFrameIds: string[];
  equippedCardBackId?: string | null; // null if default/none
  ownedCardBackIds: string[];
}

export interface Friend {
  id: string; 
  name: string;
  friendCode: string;
  avatarUrl?: string;
  isOnline: boolean; 
  rating: number;
  level: number;
}

export enum GameRewardType {
  KrendiCoins = 'KRENDI_COINS',
  CardPack = 'CARD_PACK', 
  SpecificCard = 'SPECIFIC_CARD',
  AvatarFrame = 'AVATAR_FRAME', // New reward type
  CardBack = 'CARD_BACK',       // New reward type
  KrendiDust = 'KRENDI_DUST', // New reward type for crafting
}

export interface GameReward {
  type: GameRewardType;
  amount?: number; 
  cardId?: string; 
  customizationItemId?: string; // For frames/backs
  description: string; 
  isClaimed?: boolean; 
}

export interface DragItem {
  type: 'CARD';
  card: Card; 
  sourceZone: 'hand' | 'board'; 
}

export enum AchievementIconType {
  GameWin = 'GAME_WIN',
  CardCollect = 'CARD_COLLECT',
  RatingReach = 'RATING_REACH',
  BotWin = 'BOT_WIN',
  LevelUp = 'LEVEL_UP',
  KrendiCoinsEarned = 'KRENDI_COINS_EARNED',
  QuestGeneric = 'QUEST_GENERIC', 
  CardsPlayed = 'CARDS_PLAYED', 
  DamageDealt = 'DAMAGE_DEALT', 
  CosmeticUnlock = 'COSMETIC_UNLOCK',
  KrendiDust = 'KRENDI_DUST', // New icon for dust related achievements
}

export interface Achievement {
  id: string;
  nameKey: string; 
  descriptionKey: string;
  iconType: AchievementIconType;
  targetValue: number;
  reward?: GameReward;
  category: 'gameplay' | 'collection' | 'progression' | 'social' | 'customization' | 'crafting';
}

export interface PlayerAchievementProgress {
  achievementId: string;
  currentValue: number;
  isCompleted: boolean;
  isClaimed?: boolean; 
}

export enum FriendRequestStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Cancelled = 'CANCELLED', 
  Error = 'ERROR', 
}

export interface FriendRequest {
  id: string; 
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderFriendCode: string;
  receiverId: string;
  receiverFriendCode: string; 
  status: FriendRequestStatus;
  createdAt: number; 
}

export interface Deck {
  id: string;
  name: string;
  cardIds: string[]; 
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TutorialStepContent {
  id: number;
  titleKey: keyof TranslationKeys;
  contentKey: keyof TranslationKeys;
  imageName?: string;
}

export enum QuestProgressType {
  MatchesWon = 'MATCHES_WON', 
  PvpMatchesWon = 'PVP_MATCHES_WON',
  BotMatchesWon = 'BOT_MATCHES_WON',
  CardsPlayed = 'CARDS_PLAYED',
  MinionsPlayed = 'MINIONS_PLAYED',
  SpellsPlayed = 'SPELLS_PLAYED', 
  DamageDealtToEnemyHero = 'DAMAGE_DEALT_TO_ENEMY_HERO',
  EnemyMinionsDestroyed = 'ENEMY_MINIONS_DESTROYED',
}

export interface DailyQuestDefinition { 
  id: string;
  nameKey: keyof TranslationKeys;
  descriptionKey: keyof TranslationKeys; 
  iconType: AchievementIconType; 
  progressType: QuestProgressType;
  targetValue: number;
  reward: GameReward;
}

export interface PlayerDailyQuest {
  questDefId: string; 
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

// --- Shop Specific Types ---
export enum ShopSection {
  Chests = 'CHESTS',
  Design = 'DESIGN', // For cosmetics like frames and card backs
  KrendiCoins = 'KRENDI_COINS', // For "Donate" / KrendiCoin packages
}

export interface ShopChestItem { // Currently only one type of chest
  id: string; // e.g., 'standard_chest'
  nameKey: keyof TranslationKeys;
  descriptionKey: keyof TranslationKeys;
  cost: number; // KrendiCoins
  cardsPerChest: number;
  iconUrl: string; // Image for the chest itself
}

export interface DonateKrendiCoinPackage {
  id: string;
  nameKey: keyof TranslationKeys;
  descriptionKey: keyof TranslationKeys;
  krendiCoinAmount: number;
  costDisplay: string; // e.g., "$0.99" or "Special Offer"
  iconUrl?: string; // Image for the package
  isBestValue?: boolean;
}

export interface ChallengeIncomingPayload {
  challengeId: string;
  challengerId: string;
  challengerName: string;
  challengerAvatarUrl?: string;
  challengerRating?: number;
}

export interface AppState {
  currentUser: TelegramUser | null;
  playerProfile: PlayerProfile;
  krendiCoins: number;
  krendiDust: number; // New crafting currency
  ownedCards: Card[]; 
  activeScreen: Screen;
  currentMatchData: GameState | null;
  isLoading: boolean;
  error: string | null;
  lastChestResult: ChestOpeningResponse | null; 
  language: Language;
  currentTheme: AppTheme;
  friendsList: Friend[];
  
  draggingItem: DragItem | null; 
  dropTargetInfo: { zone: 'playerBoard' | 'opponentMinion' | 'opponentHero' | null; canDrop: boolean; targetId?: string } | null;

  achievements: Achievement[];
  playerAchievements: PlayerAchievementProgress[];

  incomingFriendRequests: FriendRequest[];
  outgoingFriendRequests: FriendRequest[];
  incomingChallenge: ChallengeIncomingPayload | null; // For friend challenges

  playerDecks: Deck[];
  selectedDeckId: string | null;

  isTutorialActive: boolean;
  currentTutorialStep: number;

  isMuted: boolean;
  globalVolume: number;

  dailyQuests: PlayerDailyQuest[]; 
  availableQuestsPool: DailyQuestDefinition[]; 
  lastDailyQuestRefresh: number; 
}

export type AppAction =
  | { type: 'SET_USER'; payload: TelegramUser }
  | { type: 'SET_PROFILE_DATA'; payload: Partial<PlayerProfile> } 
  | { type: 'UPDATE_PLAYER_PROFILE'; payload: Partial<PlayerProfile> } 
  | { type: 'ADD_XP'; payload: { xpGained: number, opponentType?: 'bot' | 'human', outcome: 'win' | 'loss' } } 
  | { type: 'SET_KRENDI_COINS'; payload: number }
  | { type: 'ADD_KRENDI_COINS'; payload: number }
  | { type: 'SET_KRENDI_DUST'; payload: number } // New action for dust
  | { type: 'ADD_KRENDI_DUST'; payload: number }  // New action for dust
  | { type: 'SET_OWNED_CARDS'; payload: Card[] }
  | { type: 'ADD_CARDS_TO_COLLECTION'; payload: Card[] } 
  | { type: 'NAVIGATE_TO'; payload: Screen }
  | { type: 'SET_MATCH_DATA'; payload: GameState | null }
  | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameState> } 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LAST_CHEST_RESULT'; payload: ChestOpeningResponse | null }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_THEME'; payload: AppTheme }
  | { type: 'SET_FRIENDS_LIST'; payload: Friend[] }
  | { type: 'ADD_FRIEND'; payload: Friend }
  | { type: 'REMOVE_FRIEND'; payload: string } 
  | { type: 'START_DRAG_ITEM'; payload: DragItem }
  | { type: 'END_DRAG_ITEM' }
  | { type: 'SET_DROP_TARGET'; payload: AppState['dropTargetInfo'] }
  | { type: 'LOAD_ACHIEVEMENTS'; payload: { achievements: Achievement[], progress: PlayerAchievementProgress[] } }
  | { type: 'UPDATE_ACHIEVEMENT_PROGRESS'; payload: { achievementId: string; value?: number; increment?: number } }
  | { type: 'CLAIM_ACHIEVEMENT_REWARD'; payload: string } 
  | { type: 'SET_FRIEND_REQUESTS'; payload: { incoming: FriendRequest[], outgoing: FriendRequest[] } }
  | { type: 'ADD_OUTGOING_FRIEND_REQUEST'; payload: FriendRequest }
  | { type: 'UPDATE_FRIEND_REQUEST_STATUS'; payload: { requestId: string; status: FriendRequestStatus; newFriend?: Friend } }
  | { type: 'SET_INCOMING_CHALLENGE'; payload: ChallengeIncomingPayload | null } // Friend Challenge
  | { type: 'CLEAR_INCOMING_CHALLENGE' } // Friend Challenge
  // Deck Building Actions
  | { type: 'LOAD_DECKS'; payload: Deck[] }
  | { type: 'CREATE_DECK'; payload: { name: string } }
  | { type: 'UPDATE_DECK'; payload: Deck }
  | { type: 'DELETE_DECK'; payload: string } 
  | { type: 'SET_ACTIVE_DECK'; payload: string } 
  | { type: 'SET_SELECTED_DECK_ID'; payload: string | null }
  // Tutorial Actions
  | { type: 'START_TUTORIAL' }
  | { type: 'END_TUTORIAL' }
  | { type: 'SET_TUTORIAL_STEP'; payload: number }
  // Sound Actions
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_GLOBAL_VOLUME'; payload: number }
  // Daily Quest Actions
  | { type: 'LOAD_DAILY_QUESTS_DATA'; payload: { quests: PlayerDailyQuest[], lastRefresh: number, pool: DailyQuestDefinition[] } }
  | { type: 'UPDATE_DAILY_QUEST_PROGRESS'; payload: { questDefId: string; progressType: QuestProgressType; increment?: number; absoluteValue?: number; data?: any } }
  | { type: 'CLAIM_DAILY_QUEST_REWARD'; payload: string } 
  | { type: 'REFRESH_DAILY_QUESTS' }
  // Customization Actions
  | { type: 'BUY_AVATAR_FRAME'; payload: AvatarFrame }
  | { type: 'EQUIP_AVATAR_FRAME'; payload: string | null } // frameId or null for default
  | { type: 'BUY_CARD_BACK'; payload: CardBack }
  | { type: 'EQUIP_CARD_BACK'; payload: string | null } // cardBackId or null for default
  // Crafting Actions
  | { type: 'CRAFT_CARD'; payload: { cardId: string } };


export interface ChestOpeningResponse {
  newCards: Card[]; // Cards actually added to collection
  updatedKrendiCoins: number;
  krendiDustGained: number; // Dust gained from duplicates
  duplicatesConverted: number; // Number of cards that were duplicates and converted to dust
}

export enum WebSocketMessageType {
  FIND_MATCH = 'FIND_MATCH',
  CANCEL_FIND_MATCH = 'CANCEL_FIND_MATCH',
  MATCH_FOUND = 'MATCH_FOUND',
  PLAYER_ACTION = 'PLAYER_ACTION',
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR',
  CHALLENGE_FRIEND = 'CHALLENGE_FRIEND', // Player A sends to Player B
  CHALLENGE_INCOMING = 'CHALLENGE_INCOMING', // Server sends to Player B
  CHALLENGE_RESPONSE = 'CHALLENGE_RESPONSE', // Player B sends to Server (Accept/Decline)
  CHALLENGE_DECLINED_NOTICE = 'CHALLENGE_DECLINED_NOTICE', // Server sends to Player A if B declined
  // CHALLENGE_ACCEPTED is covered by MATCH_FOUND for simplicity in this mock
  XP_UPDATE = 'XP_UPDATE',
}

export interface ChallengeFriendPayload {
  friendId: string;
  // Server will add challenger's details
}
export interface ChallengeResponsePayload {
  challengeId: string;
  accepted: boolean;
  // Server will know responder details from connection
}
export interface ChallengeDeclinedNoticePayload {
    challengeId: string;
    responderName: string;
}


export interface PlayCardActionPayload {
  type: 'PLAY_CARD';
  cardUuid: string;
  position?: number; 
  targetUuid?: string; 
}

export interface AttackActionPayload {
  type: 'ATTACK';
  attackerUuid: string;
  targetUuid: string; 
}

export interface EndTurnActionPayload {
  type: 'END_TURN';
}

export type PlayerAction = PlayCardActionPayload | AttackActionPayload | EndTurnActionPayload;

export interface WebSocketMessageToServer {
  type: WebSocketMessageType;
  payload?: any;
}

export interface WebSocketMessageFromServer {
  type: WebSocketMessageType;
  payload?: any;
}
