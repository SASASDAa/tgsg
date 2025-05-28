// telecards-backend/src/models/Player.ts
import { StoredPlayerDataBE, DeckBE, PlayerProfileBE } from '../types';
import { INITIAL_PLAYER_PROFILE_BE, ALL_CARDS_POOL_BE_RAW, MAX_CARDS_PER_DECK_BE, LEVEL_XP_THRESHOLDS_BE } from '../constants';

// Mock in-memory store for players
const mockPlayersDB: Map<string, StoredPlayerDataBE> = new Map();

// Initialize with a couple of mock players for testing
const initialMockPlayer1Id = "mockUser123";
const initialMockPlayer2Id = "mockUser456";

function generateMockFriendCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

if (!mockPlayersDB.has(initialMockPlayer1Id)) {
  const starterDeckCards1 = ALL_CARDS_POOL_BE_RAW.slice(0, MAX_CARDS_PER_DECK_BE).map(c => c.id);
  const starterDeck1: DeckBE = { id: `deck_${initialMockPlayer1Id}_1`, name: "Starter Deck", cardIds: starterDeckCards1, isActive: true, createdAt: Date.now(), updatedAt: Date.now()};
  mockPlayersDB.set(initialMockPlayer1Id, {
    id: initialMockPlayer1Id,
    name: "Mock Player One",
    friendCode: generateMockFriendCode(),
    ...INITIAL_PLAYER_PROFILE_BE,
    level: 2,
    xp: 150,
    xpToNextLevel: LEVEL_XP_THRESHOLDS_BE[3] || 250,
    rating: 1050,
    krendiCoins: 500,
    krendiDust: 100,
    ownedCardIds: ALL_CARDS_POOL_BE_RAW.slice(0, 10).map(c => c.id),
    decks: [starterDeck1],
    avatarUrl: 'https://picsum.photos/seed/mockplayer1/100/100',
    ownedAvatarFrameIds: [],
    ownedCardBackIds: []
  });
}

if (!mockPlayersDB.has(initialMockPlayer2Id)) {
   const starterDeckCards2 = ALL_CARDS_POOL_BE_RAW.slice(MAX_CARDS_PER_DECK_BE, MAX_CARDS_PER_DECK_BE * 2).map(c => c.id);
   const starterDeck2: DeckBE = { id: `deck_${initialMockPlayer2Id}_1`, name: "Aggro Starter", cardIds: starterDeckCards2, isActive: true, createdAt: Date.now(), updatedAt: Date.now()};
  mockPlayersDB.set(initialMockPlayer2Id, {
    id: initialMockPlayer2Id,
    name: "Mock Player Two",
    friendCode: generateMockFriendCode(),
    ...INITIAL_PLAYER_PROFILE_BE,
    krendiCoins: 250,
    krendiDust: 50,
    ownedCardIds: ALL_CARDS_POOL_BE_RAW.slice(5, 15).map(c => c.id),
    decks: [starterDeck2],
    avatarUrl: 'https://picsum.photos/seed/mockplayer2/100/100',
    ownedAvatarFrameIds: [],
    ownedCardBackIds: []
  });
}


class PlayerModel {
  static async findById(id: string): Promise<StoredPlayerDataBE | null> {
    return mockPlayersDB.get(id) || null;
  }

  static async findByFriendCode(friendCode: string): Promise<StoredPlayerDataBE | null> {
    for (const player of mockPlayersDB.values()) {
      if (player.friendCode === friendCode) {
        return player;
      }
    }
    return null;
  }

  static async create(playerData: Partial<PlayerProfileBE> & { id: string; name: string; telegramUserId?: number }): Promise<StoredPlayerDataBE> {
    if (mockPlayersDB.has(playerData.id)) {
      throw new Error(`Player with id ${playerData.id} already exists.`);
    }
    const newPlayer: StoredPlayerDataBE = {
      ...INITIAL_PLAYER_PROFILE_BE,
      id: playerData.id,
      name: playerData.name,
      avatarUrl: playerData.avatarUrl,
      friendCode: playerData.friendCode || generateMockFriendCode(),
      krendiCoins: 200, // Starting coins
      krendiDust: 0,   // Starting dust
      ownedCardIds: ALL_CARDS_POOL_BE_RAW.slice(0, MAX_CARDS_PER_DECK_BE).map(c => c.id), // Basic starter cards
      decks: [{
        id: `deck_${playerData.id}_default`,
        name: "My First Deck",
        cardIds: ALL_CARDS_POOL_BE_RAW.slice(0, MAX_CARDS_PER_DECK_BE).map(c => c.id),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }],
      ...playerData, // Override defaults with provided data
    };
    mockPlayersDB.set(newPlayer.id, newPlayer);
    console.log(`PlayerModel: Created new player ${newPlayer.id}`);
    return newPlayer;
  }

  static async update(id: string, updates: Partial<StoredPlayerDataBE>): Promise<StoredPlayerDataBE | null> {
    const player = mockPlayersDB.get(id);
    if (!player) {
      console.warn(`PlayerModel: Player ${id} not found for update.`);
      return null;
    }
    // Merge updates carefully
    const updatedPlayer = { ...player };
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            // Ensure specific handling for arrays if needed (e.g. merging vs replacing)
             if (key === 'ownedCardIds' && Array.isArray((updates as any)[key])) {
                updatedPlayer.ownedCardIds = Array.from(new Set([...player.ownedCardIds, ...(updates as any)[key]]));
            } else if (key === 'decks' && Array.isArray((updates as any)[key])) {
                 updatedPlayer.decks = (updates as any)[key]; // Replace decks array
            } else {
                (updatedPlayer as any)[key] = (updates as any)[key];
            }
        }
    }
    mockPlayersDB.set(id, updatedPlayer);
    console.log(`PlayerModel: Updated player ${id}`);
    return updatedPlayer;
  }

  static async getAllPlayerIds(): Promise<string[]> {
    return Array.from(mockPlayersDB.keys());
  }
}

export default PlayerModel;

console.log("Player model (Player.ts) loaded with mock DB. Initial players:", Array.from(mockPlayersDB.keys()));