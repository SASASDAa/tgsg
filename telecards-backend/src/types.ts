// telecards-backend/src/types.ts

// --- Enums from Frontend (can be shared or re-declared) ---
export enum CardRarityBE {
  Common = 'COMMON',
  Rare = 'RARE',
  Epic = 'EPIC',
  Legendary = 'LEGENDARY',
}

export enum CardAbilityTypeBE {
  Taunt = 'TAUNT',
  DivineShield = 'DIVINE_SHIELD',
  Charge = 'CHARGE',
  Battlecry = 'BATTLECRY',
  Deathrattle = 'DEATHRATTLE',
  Lifesteal = 'LIFESTEAL',
  Poison = 'POISON',
  Stealth = 'STEALTH',
  Silence = 'SILENCE',
  Airdrop = 'AIRDROP',
  HODL = 'HODL',
}

// --- Interfaces for Game Entities (Backend Perspective) ---
export interface CardAbilityBE {
  type: CardAbilityTypeBE;
  description: string; // Could be a key for localization if needed later
  // Backend might have more data here, e.g., effect implementation details
}

// Represents a card definition/prototype
export interface CardPrototypeBE {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: CardRarityBE;
  cost: number;
  attack?: number;
  health?: number;
  abilities: CardAbilityBE[];
  cardType?: string;
}

// Represents an instance of a card in game (hand, board)
export interface CardInstanceBE extends CardPrototypeBE {
  uuid: string; // Unique instance identifier
  currentHealth?: number; // Only for minions on board
  maxHealth?: number; // Only for minions on board
  isPlayed: boolean;
  hasAttacked: boolean; // For minions on board
  // Backend might track more state, e.g., enchantments, damage taken this turn
}

export interface PlayerBE {
  id: string; // WebSocket connection ID or user ID from auth
  name: string;
  avatarUrl?: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: CardPrototypeBE[]; // Remaining cards in deck (prototypes)
  hand: CardInstanceBE[]; // Cards in hand (instances)
  board: CardInstanceBE[]; // Minions on board (instances)
  burnoutDamageCounter: number;
  // Backend might track things like fatigue, equipped cosmetics influencing gameplay etc.
}

export interface GameStateBE {
  gameId: string;
  player: PlayerBE; // Represents the "main" player from this server's perspective for a given connection
  opponent: PlayerBE; // Represents the opponent
  currentTurnPlayerId: string; // ID of the player whose turn it is
  turnNumber: number;
  log: string[];
  isGameOver: boolean;
  winnerId?: string; // ID of the winning player
  opponentType: 'human' | 'bot'; // From frontend for context
}


// --- Player Actions (Backend Perspective) ---
export interface PlayCardActionPayloadBE {
  type: 'PLAY_CARD';
  cardUuid: string; // UUID of the card in hand
  position?: number; // Optional: for targeted placement on board
  targetUuid?: string; // Optional: for targeted spells or battlecries (minion UUID or hero ID)
}

export interface AttackActionPayloadBE {
  type: 'ATTACK';
  attackerUuid: string; // UUID of the attacking minion on board
  targetUuid: string; // UUID of the target minion on board, or special ID for hero
}

export interface EndTurnActionPayloadBE {
  type: 'END_TURN';
}

export type PlayerActionBE = PlayCardActionPayloadBE | AttackActionPayloadBE | EndTurnActionPayloadBE;

// --- WebSocket Message Types (copied/adapted from frontend) ---
export enum WebSocketMessageTypeBE {
  // Client to Server
  FIND_MATCH = 'FIND_MATCH',
  CANCEL_FIND_MATCH = 'CANCEL_FIND_MATCH',
  PLAYER_ACTION = 'PLAYER_ACTION', // Payload will be PlayerActionBE
  CHALLENGE_FRIEND = 'CHALLENGE_FRIEND',
  CHALLENGE_RESPONSE = 'CHALLENGE_RESPONSE', // { challengeId: string, accepted: boolean }

  // Server to Client
  MATCHMAKING_QUEUED = 'MATCHMAKING_QUEUED', // Custom for backend
  MATCHMAKING_CANCELLED = 'MATCHMAKING_CANCELLED', // Custom for backend
  MATCH_FOUND = 'MATCH_FOUND', // Payload: GameStateBE
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE', // Payload: GameStateBE
  GAME_OVER = 'GAME_OVER', // Payload: { winnerId: string, matchId: string, rewards?: any }
  ERROR = 'ERROR', // Payload: { message: string }
  CHALLENGE_INCOMING = 'CHALLENGE_INCOMING', // Payload: { challengeId: string, challengerId: string, challengerName?: string, ... }
  CHALLENGE_SENT = 'CHALLENGE_SENT', // Custom for backend: Confirms to challenger their challenge was issued
  CHALLENGE_ACCEPTED_NOTICE = 'CHALLENGE_ACCEPTED_NOTICE', // Notify challenger that their challenge was accepted (might include gameId) - replaced by MATCH_FOUND
  CHALLENGE_DECLINED_NOTICE = 'CHALLENGE_DECLINED_NOTICE', // Payload: { challengeId: string, responderName?: string }
  CHALLENGE_CANCELLED = 'CHALLENGE_CANCELLED', // Custom for backend: If a challenge is void (e.g. user disconnects)
  XP_UPDATE = 'XP_UPDATE', // Payload: { xp: number, newLevel: number, xpToNextLevel: number, rating: number, rewardsGranted: GameRewardBE[] }
  CHALLENGE_SYSTEM_CONNECTED = 'CHALLENGE_SYSTEM_CONNECTED', // Added for challenge handler
}

export interface WebSocketMessageToServerBE {
  type: WebSocketMessageTypeBE;
  payload?: any;
}

export interface WebSocketMessageFromServerBE {
  type: WebSocketMessageTypeBE;
  payload?: any;
}

// --- Player Profile & Data (from frontend, for service layers) ---
export interface PlayerProfileBE {
  id: string; // Usually TelegramUser.id.toString()
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
  equippedAvatarFrameId?: string | null;
  ownedAvatarFrameIds: string[];
  equippedCardBackId?: string | null;
  ownedCardBackIds: string[];
  // Other fields from frontend PlayerProfile if needed by backend logic
}

// --- Game Rewards (from frontend) ---
export enum GameRewardTypeBE {
  KrendiCoins = 'KRENDI_COINS',
  CardPack = 'CARD_PACK', // Placeholder, not fully implemented
  SpecificCard = 'SPECIFIC_CARD',
  KrendiDust = 'KRENDI_DUST',
}
export interface GameRewardBE {
  type: GameRewardTypeBE;
  amount?: number;
  cardId?: string; // ID of CardPrototypeBE
  description: string; // Potentially localization key
}

export interface DeckBE {
  id: string;
  name: string;
  cardIds: string[]; // Array of CardPrototypeBE IDs
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Friend related types (from frontend)
export interface FriendBE {
  id: string;
  name: string;
  friendCode: string;
  avatarUrl?: string;
  isOnline: boolean;
  rating: number;
  level: number;
}

export enum FriendRequestStatusBE {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Cancelled = 'CANCELLED',
  Error = 'ERROR',
}

export interface FriendRequestBE {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderFriendCode: string;
  receiverId: string;
  receiverFriendCode: string;
  status: FriendRequestStatusBE;
  createdAt: number;
}


// Payload for CHALLENGE_FRIEND message from client
export interface ChallengeFriendPayloadBE {
  friendId: string;
}

// Payload for CHALLENGE_RESPONSE message from client
export interface ChallengeResponsePayloadBE {
  challengeId: string;
  accepted: boolean;
}

// Payload for CHALLENGE_INCOMING message to client
export interface ChallengeIncomingPayloadToClientBE {
  challengeId: string;
  challengerId: string;
  challengerName: string;
  challengerAvatarUrl?: string;
  challengerRating?: number;
}

// Payload for CHALLENGE_DECLINED_NOTICE message to client
export interface ChallengeDeclinedNoticePayloadToClientBE {
    challengeId: string;
    responderName: string;
}

// Structure for player data stored in mock DB or real DB
export interface StoredPlayerDataBE extends PlayerProfileBE {
  krendiCoins: number;
  krendiDust: number;
  ownedCardIds: string[]; // IDs of CardPrototypeBE
  decks: DeckBE[];
  // lastLogin: Date;
  // etc.
}


console.log("Backend types (types.ts) loaded.");