// telecards-backend/src/constants.ts
import { CardPrototypeBE, CardRarityBE, CardAbilityTypeBE, PlayerProfileBE, GameRewardBE, GameRewardTypeBE } from './types';

// --- Game Rules & Balance ---
export const INITIAL_PLAYER_HEALTH_BE = 30;
export const INITIAL_PLAYER_MANA_BE = 1; // Player 1 starts with 1 mana available on turn 1
export const MAX_MANA_BE = 10;
export const MAX_CARDS_IN_HAND_BE = 10;
export const MAX_MINIONS_ON_BOARD_BE = 7;
export const STARTING_HAND_SIZE_P1_BE = 3;
export const STARTING_HAND_SIZE_P2_BE = 4; // Player going second often gets an extra card + "coin"
export const BURNOUT_DAMAGE_START_BE = 1;


// --- Targeting IDs ---
export const OPPONENT_HERO_TARGET_ID_BE = "opponent_hero";
export const PLAYER_HERO_TARGET_ID_BE = "player_hero";


// --- Card Definitions (adapted from frontend ALL_CARDS_POOL_RAW) ---
// This structure matches CardPrototypeBE
export const ALL_CARDS_POOL_BE_RAW: CardPrototypeBE[] = [
  { id: 'c001', name: 'Noob Trader', description: 'card_c001_desc', imageUrl: 'https://picsum.photos/seed/c001_art/360/240', rarity: CardRarityBE.Common, cost: 1, attack: 1, health: 2, abilities: [], cardType: "Trader" },
  { id: 'c002', name: 'Shill Bot', description: 'card_c002_desc', imageUrl: 'https://picsum.photos/seed/c002_art/360/240', rarity: CardRarityBE.Common, cost: 2, attack: 2, health: 1, abilities: [], cardType: "Bot" },
  { id: 'c003', name: 'Doge Pup', description: 'card_c003_desc', imageUrl: 'https://picsum.photos/seed/c003_art/360/240', rarity: CardRarityBE.Common, cost: 1, attack: 1, health: 1, abilities: [], cardType: "Meme Coin" },
  { id: 'c004', name: 'DeFi Degenerate', description: 'card_c004_desc', imageUrl: 'https://picsum.photos/seed/c004_art/360/240', rarity: CardRarityBE.Common, cost: 3, attack: 3, health: 3, abilities: [], cardType: "DeFi User" },
  { id: 'r001', name: 'Diamond Hands Holder', description: 'card_r001_desc', imageUrl: 'https://picsum.photos/seed/r001_art/360/240', rarity: CardRarityBE.Rare, cost: 4, attack: 2, health: 6, abilities: [{ type: CardAbilityTypeBE.Taunt, description: 'cardability_taunt_full' }], cardType: "Investor" },
  { id: 'r002', name: 'FOMO Buyer', description: 'card_r002_desc', imageUrl: 'https://picsum.photos/seed/r002_art/360/240', rarity: CardRarityBE.Rare, cost: 2, attack: 3, health: 2, abilities: [{ type: CardAbilityTypeBE.Charge, description: 'cardability_charge_full' }], cardType: "Trader" },
  { id: 'r003', name: 'Community Mod', description: 'card_r003_desc', imageUrl: 'https://picsum.photos/seed/r003_art/360/240', rarity: CardRarityBE.Rare, cost: 3, attack: 1, health: 4, abilities: [{ type: CardAbilityTypeBE.DivineShield, description: 'cardability_divine_shield_full' }], cardType: "Community Mod" },
  { id: 'r004', name: 'Tapping Hamster', description: 'card_r004_desc', imageUrl: 'https://picsum.photos/seed/r004_art/360/240', rarity: CardRarityBE.Rare, cost: 3, attack: 2, health: 2, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_r004_battlecry_desc'}], cardType: "Crypto Critter"}, // Battlecry: Draw 2 cards
  { id: 'e001', name: 'Smooth Scammer', description: 'card_e001_desc', imageUrl: 'https://picsum.photos/seed/e001_art/360/240', rarity: CardRarityBE.Epic, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_e001_battlecry_desc' }], cardType: "Scammer" }, // Battlecry: Summons a 'Shill Bot'
  { id: 'e002', name: 'Rug Pull Rugrat', description: 'card_e002_desc', imageUrl: 'https://picsum.photos/seed/e002_art/360/240', rarity: CardRarityBE.Epic, cost: 4, attack: 2, health: 1, abilities: [{ type: CardAbilityTypeBE.Deathrattle, description: 'card_e002_deathrattle_desc' }], cardType: "Scammer" }, // Deathrattle: Deal 2 damage to ALL other minions
  { id: 'l001', name: 'Sleepy Joe King', description: 'card_l001_desc', imageUrl: 'https://picsum.photos/seed/l001_art/360/240', rarity: CardRarityBE.Legendary, cost: 7, attack: 6, health: 8, abilities: [{type: CardAbilityTypeBE.Taunt, description: 'cardability_taunt_full'}], cardType: "Figurehead" },
  { id: 'l002', name: 'Elongated Muskrat', description: 'card_l002_desc', imageUrl: 'https://picsum.photos/seed/l002_art/360/240', rarity: CardRarityBE.Legendary, cost: 8, attack: 7, health: 7, abilities: [{type: CardAbilityTypeBE.Charge, description: 'cardability_charge_full'}], cardType: "Visionary" },
  { id: 'l003', name: 'Pavel Turov', description: 'card_l003_desc', imageUrl: 'https://picsum.photos/seed/l003_art/360/240', rarity: CardRarityBE.Legendary, cost: 6, attack: 5, health: 5, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_l003_battlecry_desc'}], cardType: "Founder" }, // Battlecry: Give your other minions +1/+1
  { id: 'c005', name: 'Chad Influencer', description: 'card_c005_desc', imageUrl: 'https://picsum.photos/seed/c005_art/360/240', rarity: CardRarityBE.Common, cost: 2, attack: 2, health: 2, abilities: [], cardType: "Influencer" },
  { id: 'c006', name: 'Keyboard Warrior', description: 'card_c006_desc', imageUrl: 'https://picsum.photos/seed/c006_art/360/240', rarity: CardRarityBE.Common, cost: 1, attack: 1, health: 1, abilities: [{ type: CardAbilityTypeBE.Taunt, description: 'cardability_taunt_full' }], cardType: "DeFi User" },
  { id: 'c007', name: 'NFT Bro', description: 'card_c007_desc', imageUrl: 'https://picsum.photos/seed/c007_art/360/240', rarity: CardRarityBE.Common, cost: 3, attack: 3, health: 2, abilities: [], cardType: "Investor" },
  { id: 'c008', name: 'Liquidity Farmer', description: 'card_c008_desc', imageUrl: 'https://picsum.photos/seed/c008_art/360/240', rarity: CardRarityBE.Common, cost: 2, attack: 1, health: 3, abilities: [], cardType: "DeFi User" },
  { id: 'c009', name: 'NotCoin Tapper', description: 'card_c009_desc', imageUrl: 'https://picsum.photos/seed/c009_art/360/240', rarity: CardRarityBE.Common, cost: 1, attack: 0, health: 2, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_c009_battlecry_desc'}], cardType: "Meme Coin" }, // Battlecry: Gain +1 Attack for each other NotCoin Tapper you control.
  { id: 'r005', name: 'Telegram Channel Admin', description: 'card_r005_desc', imageUrl: 'https://picsum.photos/seed/r005_art/360/240', rarity: CardRarityBE.Rare, cost: 4, attack: 3, health: 3, abilities: [{ type: CardAbilityTypeBE.Stealth, description: 'cardability_stealth_full' }], cardType: "Community Mod" },
  { id: 'r006', name: 'Whale Watcher', description: 'card_r006_desc', imageUrl: 'https://picsum.photos/seed/r006_art/360/240', rarity: CardRarityBE.Rare, cost: 2, attack: 1, health: 1, abilities: [{ type: CardAbilityTypeBE.Airdrop, description: 'cardability_airdrop_full' }], cardType: "Trader" }, // Battlecry: Add a random Common card to your hand.
  { id: 'r007', name: 'Shitcoin Shaman', description: 'card_r007_desc', imageUrl: 'https://picsum.photos/seed/r007_art/360/240', rarity: CardRarityBE.Rare, cost: 3, attack: 2, health: 3, abilities: [{ type: CardAbilityTypeBE.Deathrattle, description: 'card_r007_deathrattle_desc'}], cardType: "Scammer" }, // Deathrattle: Add a 'Rug Pull Rugrat' to your hand.
  { id: 'r008', name: 'Gigachad Dev', description: 'card_r008_desc', imageUrl: 'https://picsum.photos/seed/r008_art/360/240', rarity: CardRarityBE.Rare, cost: 5, attack: 3, health: 5, abilities: [{ type: CardAbilityTypeBE.HODL, description: 'cardability_hodl_full' }], cardType: "Founder" }, // Whenever this minion takes damage and survives, gain +1 Attack.
  { id: 'r009', name: 'Concerned Citizen', description: 'card_r009_desc', imageUrl: 'https://picsum.photos/seed/r009_art/360/240', rarity: CardRarityBE.Rare, cost: 3, attack: 1, health: 5, abilities: [{ type: CardAbilityTypeBE.Taunt, description: 'cardability_taunt_full' }], cardType: "Community Mod" },
  { id: 'e003', name: 'The Zucc', description: 'card_e003_desc', imageUrl: 'https://picsum.photos/seed/e003_art/360/240', rarity: CardRarityBE.Epic, cost: 6, attack: 5, health: 5, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_e003_battlecry_desc'}], cardType: "Visionary" }, // Battlecry: If you control 2 or more 'Bot' type minions, summon two more 1/1 Shill Bots.
  { id: 'e004', name: 'Captain Hindsight', description: 'card_e004_desc', imageUrl: 'https://picsum.photos/seed/e004_art/360/240', rarity: CardRarityBE.Epic, cost: 4, attack: 3, health: 3, abilities: [{ type: CardAbilityTypeBE.Silence, description: 'cardability_silence_full_enemy'}], cardType: "Influencer" }, // Battlecry: Silence an enemy minion.
  { id: 'e005', name: 'DeFi Chef', description: 'card_e005_desc', imageUrl: 'https://picsum.photos/seed/e005_art/360/240', rarity: CardRarityBE.Epic, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_e005_battlecry_desc'}], cardType: "DeFi User" }, // Battlecry: Give a friendly minion +2/+2.
  { id: 'e006', name: 'DAO Voter', description: 'card_e006_desc', imageUrl: 'https://picsum.photos/seed/e006_art/360/240', rarity: CardRarityBE.Epic, cost: 2, attack: 2, health: 1, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_e006_battlecry_desc'}], cardType: "Investor" }, // Battlecry: Draw a card. Your opponent sees it and draws a card too.
  { id: 'l004', name: 'Donald Pump', description: 'card_l004_desc', imageUrl: 'https://picsum.photos/seed/l004_art/360/240', rarity: CardRarityBE.Legendary, cost: 7, attack: 6, health: 6, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_l004_battlecry_desc'}], cardType: "Figurehead" }, // Battlecry: Give your minions +2 Attack this turn.
  { id: 'l005', name: 'Vitalik\'s Ethereum Rainbow', description: 'card_l005_desc', imageUrl: 'https://picsum.photos/seed/l005_art/360/240', rarity: CardRarityBE.Legendary, cost: 4, attack: 2, health: 4, abilities: [{ type: CardAbilityTypeBE.Stealth, description: 'cardability_stealth_full' }, { type: CardAbilityTypeBE.Deathrattle, description: 'card_l005_deathrattle_desc' }], cardType: "Crypto Critter" }, // Deathrattle: Give another random friendly minion Divine Shield.
  { id: 'l006', name: 'CZ "4"', description: 'card_l006_desc', imageUrl: 'https://picsum.photos/seed/l006_art/360/240', rarity: CardRarityBE.Legendary, cost: 8, attack: 4, health: 4, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_l006_battlecry_desc'}], cardType: "Founder" }, // Battlecry: If your opponent has 4 or more cards in hand, they discard 2 at random.
  { id: 'l007', name: 'The Hamster CEO', description: 'card_l007_desc', imageUrl: 'https://picsum.photos/seed/l007_art/360/240', rarity: CardRarityBE.Legendary, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_l007_battlecry_desc'}], cardType: "Visionary" }, // Battlecry: If you played a 'Tapping Hamster' this game, gain Charge and Divine Shield.
  { id: 'l008', name: 'Giga Brain NotVatalik', description: 'card_l008_desc', imageUrl: 'https://picsum.photos/seed/l008_art/360/240', rarity: CardRarityBE.Legendary, cost: 9, attack: 7, health: 7, abilities: [{ type: CardAbilityTypeBE.Battlecry, description: 'card_l008_battlecry_desc'}], cardType: "Visionary" }, // Battlecry: Summon three 2/2 'Altchain Clones' with Charge.
  { id: 'l009', name: 'Satoshi\'s Ghost', description: 'card_l009_desc', imageUrl: 'https://picsum.photos/seed/l009_art/360/240', rarity: CardRarityBE.Legendary, cost: 3, attack: 1, health: 1, abilities: [{ type: CardAbilityTypeBE.Stealth, description: 'cardability_stealth_full' }, { type: CardAbilityTypeBE.Deathrattle, description: 'card_l009_deathrattle_desc' }], cardType: "Founder" }, // Deathrattle: Your other minions have +1 Attack.
];

export function getCardPrototypeByIdBE(id: string): CardPrototypeBE | undefined {
  return ALL_CARDS_POOL_BE_RAW.find(card => card.id === id);
}

// --- Shop Constants ---
export const KRENDI_COIN_CHEST_COST_BE = 500;
export const CARDS_PER_CHEST_BE = 3;
export const RARITY_DISENCHANT_VALUES_BE: Record<CardRarityBE, number> = {
  [CardRarityBE.Common]: 5,
  [CardRarityBE.Rare]: 20,
  [CardRarityBE.Epic]: 100,
  [CardRarityBE.Legendary]: 400,
};

// --- Player Progression ---
export const INITIAL_RATING_BE = 1000;
export const MAX_CARDS_PER_DECK_BE = 8;

export const INITIAL_PLAYER_PROFILE_BE: Omit<PlayerProfileBE, 'id' | 'friendCode' | 'name' | 'avatarUrl'> = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100, // Should align with LEVEL_XP_THRESHOLDS_BE if defined
  rating: INITIAL_RATING_BE,
  totalWins: 0,
  botWins: 0,
  pvpWins: 0,
  equippedAvatarFrameId: null, // Default handled by frontend
  ownedAvatarFrameIds: [], // Default handled by frontend
  equippedCardBackId: null, // Default handled by frontend
  ownedCardBackIds: [], // Default handled by frontend
};

// --- Matchmaking ---
export const MATCHMAKING_RATING_RANGE_INCREMENT_BE = 100;
export const MATCHMAKING_MAX_RATING_RANGE_BE = 500;
export const MATCHMAKING_INTERVAL_MS_BE = 3000;
export const MATCHMAKING_MAX_WAIT_TIME_EXPANSION_MS_BE = 30000; // Time after which rating range might expand faster

// --- XP and Rewards ---
export const MOCK_XP_PER_WIN_BE = 30;
export const MOCK_XP_PER_BOT_WIN_BE = 15;
export const MOCK_XP_PER_LOSS_BE = 10;
export const MOCK_XP_PER_BOT_LOSS_BE = 5;
export const MOCK_RATING_CHANGE_WIN_BE = 15;
export const MOCK_RATING_CHANGE_LOSS_BE = -10;

export const LEVEL_XP_THRESHOLDS_BE: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1000, 6: 1750, 7: 2800, 8: 4200, 9: 6000, 10: 8500,
  // ... add more levels as needed
};

export const REWARDS_PER_LEVEL_BE: Record<number, GameRewardBE[]> = {
  2: [{ type: GameRewardTypeBE.KrendiCoins, amount: 100, description: "reward_level_2_coins" }],
  3: [{ type: GameRewardTypeBE.SpecificCard, cardId: 'c001', description: "reward_level_3_card_c001" }],
  4: [{ type: GameRewardTypeBE.KrendiCoins, amount: 200, description: "reward_level_4_coins" }],
  5: [{ type: GameRewardTypeBE.SpecificCard, cardId: 'r001', description: "reward_level_5_card_r001" }, { type: GameRewardTypeBE.KrendiCoins, amount: 150, description: "reward_level_5_coins_extra" }],
};


console.log("Backend constants (constants.ts) loaded.");
