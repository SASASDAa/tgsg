
import { Card, CardRarity, CardAbilityType, TelegramUser, GameState, PlayerState, GameReward, GameRewardType, PlayerProfile, Friend, Achievement, AchievementIconType, Deck, Screen, TutorialStepContent, DailyQuestDefinition, QuestProgressType, AvatarFrame, CardBack, CustomizationItemType, ShopChestItem, DonateKrendiCoinPackage } from './types';
import { TranslationKeys } from './translations/keys';

export const KRENDI_COIN_CHEST_COST = 500;
export const CARDS_PER_CHEST = 3;
export const MAX_CARDS_PER_DECK = 8;
export const MAX_COPIES_NON_LEGENDARY = 2;
export const MAX_COPIES_LEGENDARY = 1;


export const INITIAL_PLAYER_HEALTH = 30;
export const INITIAL_PLAYER_MANA = 1;
export const MAX_MANA = 10;
export const MAX_CARDS_IN_HAND = 10;
export const MAX_MINIONS_ON_BOARD = 7;

export const OPPONENT_HERO_TARGET_ID = "opponent_hero";
export const PLAYER_HERO_TARGET_ID = "player_hero";

// Sound Effects
export const SFX_BUTTON_CLICK = 'button_click';
export const SFX_CARD_PLAY = 'card_play';
export const SFX_CARD_ATTACK = 'card_attack';
export const SFX_CARD_DAMAGE = 'card_damage';
export const SFX_CARD_DEATH = 'card_death';
export const SFX_HERO_DAMAGE = 'hero_damage';
export const SFX_TURN_START = 'turn_start';
export const SFX_GAME_WIN = 'game_win';
export const SFX_GAME_LOSE = 'game_lose';
export const SFX_CHEST_OPEN = 'chest_open';
export const SFX_CARD_REVEAL = 'card_reveal';
export const SFX_NAV_CLICK = 'nav_click';
export const SFX_QUEST_COMPLETE = 'quest_complete';
export const SFX_REWARD_CLAIM = 'reward_claim';
export const SFX_ITEM_PURCHASE = 'item_purchase'; // For shop cosmetics
export const SFX_ITEM_EQUIP = 'item_equip'; // For equipping cosmetics
export const SFX_CARD_DISENCHANT = 'card_disenchant';
export const SFX_CARD_CRAFT = 'card_craft';


export const SOUND_FILES: Record<string, string> = {
  [SFX_BUTTON_CLICK]: 'https://assets.codepen.io/210284/click.wav',
  [SFX_CARD_PLAY]: 'https://assets.codepen.io/210284/card-play.wav',
  [SFX_CARD_ATTACK]: 'https://assets.codepen.io/210284/card-attack.wav',
  [SFX_CARD_DAMAGE]: 'https://assets.codepen.io/210284/damage-deal.wav',
  [SFX_CARD_DEATH]: 'https://assets.codepen.io/210284/card-death.wav',
  [SFX_HERO_DAMAGE]: 'https://assets.codepen.io/210284/hero-hit.wav',
  [SFX_TURN_START]: 'https://assets.codepen.io/210284/turn-start.wav',
  [SFX_GAME_WIN]: 'https://assets.codepen.io/210284/win-sound.wav',
  [SFX_GAME_LOSE]: 'https://assets.codepen.io/210284/lose-sound.wav',
  [SFX_CHEST_OPEN]: 'https://assets.codepen.io/210284/chest-open-sound.wav',
  [SFX_CARD_REVEAL]: 'https://assets.codepen.io/210284/card-reveal-sound.wav',
  [SFX_NAV_CLICK]: 'https://assets.codepen.io/210284/click.wav',
  [SFX_QUEST_COMPLETE]: 'https://assets.codepen.io/210284/quest-complete.wav',
  [SFX_REWARD_CLAIM]: 'https://assets.codepen.io/210284/reward-claim.wav',
  [SFX_ITEM_PURCHASE]: 'https://assets.codepen.io/210284/purchase.wav', // Placeholder
  [SFX_ITEM_EQUIP]: 'https://assets.codepen.io/210284/equip-item.wav', // Placeholder
  [SFX_CARD_DISENCHANT]: 'https://assets.codepen.io/210284/disenchant.wav', // Placeholder
  [SFX_CARD_CRAFT]: 'https://assets.codepen.io/210284/craft-item.wav',    // Placeholder
};

// Music Files
export const MUSIC_MAIN_MENU = 'music_main_menu';
export const MUSIC_GAME_BOARD = 'music_game_board';
export const MUSIC_SHOP = 'music_shop';
export const MUSIC_COLLECTION = 'music_collection';


export const MUSIC_FILES: Record<string, string> = {
  [MUSIC_MAIN_MENU]: 'https://assets.codepen.io/210284/main-menu-music.mp3',
  [MUSIC_GAME_BOARD]: 'https://assets.codepen.io/210284/game-board-music.mp3',
  [MUSIC_SHOP]: 'https://assets.codepen.io/210284/shop-music.mp3',
  [MUSIC_COLLECTION]: 'https://assets.codepen.io/210284/collection-music.mp3',
};


export const RARITY_COLORS: Record<CardRarity, string> = {
  [CardRarity.Common]: 'bg-common-rarity',
  [CardRarity.Rare]: 'bg-rare-rarity',
  [CardRarity.Epic]: 'bg-epic-rarity',
  [CardRarity.Legendary]: 'bg-legendary-rarity',
};

export const RARITY_TEXT_COLORS: Record<CardRarity, string> = {
  [CardRarity.Common]: 'text-gray-700',
  [CardRarity.Rare]: 'text-blue-700',
  [CardRarity.Epic]: 'text-purple-700',
  [CardRarity.Legendary]: 'text-orange-700',
};


export const LEVEL_XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1000, 6: 1750, 7: 2800, 8: 4200, 9: 6000, 10: 8500,
};

export const calculateXpToNextLevel = (currentLevel: number, currentXp: number): { xpForNextDisplay: number, progressPercentage: number, totalXpForNextLevelBracket: number } => {
  const xpNeededForCurrentLevel = LEVEL_XP_THRESHOLDS[currentLevel] || 0;
  const nextLevel = currentLevel + 1;
  const xpNeededForNextLevel = LEVEL_XP_THRESHOLDS[nextLevel];

  if (xpNeededForNextLevel === undefined) {
      return { xpForNextDisplay: 0, progressPercentage: 100, totalXpForNextLevelBracket: 0 };
  }

  const totalXpForThisLevelBracket = xpNeededForNextLevel - xpNeededForCurrentLevel;
  const xpEarnedInThisBracket = currentXp - xpNeededForCurrentLevel;
  const progressPercentage = Math.max(0, Math.min(100, (xpEarnedInThisBracket / totalXpForThisLevelBracket) * 100));

  return { xpForNextDisplay: xpNeededForNextLevel, progressPercentage, totalXpForNextLevelBracket: totalXpForThisLevelBracket };
};


export const REWARDS_PER_LEVEL: Record<number, GameReward[]> = {
  2: [{ type: GameRewardType.KrendiCoins, amount: 100, description: "reward_level_2_coins" as keyof TranslationKeys }],
  3: [{ type: GameRewardType.SpecificCard, cardId: 'c001', description: "reward_level_3_card_c001" as keyof TranslationKeys }],
  4: [{ type: GameRewardType.KrendiCoins, amount: 200, description: "reward_level_4_coins" as keyof TranslationKeys }],
  5: [{ type: GameRewardType.SpecificCard, cardId: 'r001', description: "reward_level_5_card_r001" as keyof TranslationKeys }, { type: GameRewardType.KrendiCoins, amount: 150, description: "reward_level_5_coins_extra" as keyof TranslationKeys }],
};

export const INITIAL_RATING = 1000;
export const MOCK_XP_PER_WIN = 30;
export const MOCK_XP_PER_BOT_WIN = 15;
export const MOCK_XP_PER_LOSS = 10;
export const MOCK_XP_PER_BOT_LOSS = 5;
export const MOCK_RATING_CHANGE_WIN = 15;
export const MOCK_RATING_CHANGE_LOSS = -10;

export const generateMockFriendCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// --- Customization Constants ---
export const DEFAULT_AVATAR_FRAME_ID = 'frame_default';
export const DEFAULT_CARD_BACK_ID = 'back_default';

export const ALL_AVATAR_FRAMES: AvatarFrame[] = [
  { id: DEFAULT_AVATAR_FRAME_ID, nameKey: 'avatarFrame_default_name', imageUrl: 'https://picsum.photos/seed/frame_default_preview/100/100?image=1062', cost: 0, currency: 'KRENDI_COINS', itemType: CustomizationItemType.AvatarFrame },
  { id: 'frame_bronze_ring', nameKey: 'avatarFrame_bronzeRing_name', imageUrl: 'https://picsum.photos/seed/frame_bronze_preview/100/100?image=200', cost: 250, currency: 'KRENDI_COINS', itemType: CustomizationItemType.AvatarFrame },
  { id: 'frame_gold_leaf', nameKey: 'avatarFrame_goldLeaf_name', imageUrl: 'https://picsum.photos/seed/frame_gold_preview/100/100?image=201', cost: 1000, currency: 'KRENDI_COINS', itemType: CustomizationItemType.AvatarFrame },
  { id: 'frame_tech_circuit', nameKey: 'avatarFrame_techCircuit_name', imageUrl: 'https://picsum.photos/seed/frame_tech_preview/100/100?image=202', cost: 750, currency: 'KRENDI_COINS', itemType: CustomizationItemType.AvatarFrame, isPremium: true },
];

export const ALL_CARD_BACKS: CardBack[] = [
  { id: DEFAULT_CARD_BACK_ID, nameKey: 'cardBack_default_name', imageUrl: 'https://picsum.photos/seed/back_default_preview/180/270?image=101', cardBackImageUrl: 'https://picsum.photos/seed/back_default_ingame/300/450?image=101', cost: 0, currency: 'KRENDI_COINS', itemType: CustomizationItemType.CardBack },
  { id: 'back_blue_swirl', nameKey: 'cardBack_blueSwirl_name', imageUrl: 'https://picsum.photos/seed/back_blue_preview/180/270?image=102', cardBackImageUrl: 'https://picsum.photos/seed/back_blue_ingame/300/450?image=102', cost: 300, currency: 'KRENDI_COINS', itemType: CustomizationItemType.CardBack },
  { id: 'back_red_dragon', nameKey: 'cardBack_redDragon_name', imageUrl: 'https://picsum.photos/seed/back_dragon_preview/180/270?image=103', cardBackImageUrl: 'https://picsum.photos/seed/back_dragon_ingame/300/450?image=103', cost: 1200, currency: 'KRENDI_COINS', itemType: CustomizationItemType.CardBack, isPremium: true },
  { id: 'back_krendi_pattern', nameKey: 'cardBack_krendiPattern_name', imageUrl: 'https://picsum.photos/seed/back_krendi_preview/180/270?image=104', cardBackImageUrl: 'https://picsum.photos/seed/back_krendi_ingame/300/450?image=104', cost: 500, currency: 'KRENDI_COINS', itemType: CustomizationItemType.CardBack },
];

// --- Crafting System Constants ---
export const RARITY_DISENCHANT_VALUES: Record<CardRarity, number> = {
  [CardRarity.Common]: 5,
  [CardRarity.Rare]: 20,
  [CardRarity.Epic]: 100,
  [CardRarity.Legendary]: 400,
};

export const RARITY_CRAFT_COSTS: Record<CardRarity, number> = {
  [CardRarity.Common]: 40,
  [CardRarity.Rare]: 100,
  [CardRarity.Epic]: 400,
  [CardRarity.Legendary]: 1600,
};
// --- End Crafting System Constants ---


export const INITIAL_PLAYER_PROFILE: PlayerProfile = {
  level: 1,
  xp: 0,
  xpToNextLevel: LEVEL_XP_THRESHOLDS[2],
  rating: INITIAL_RATING,
  friendCode: generateMockFriendCode(),
  avatarUrl: undefined,
  totalWins: 0,
  botWins: 0,
  pvpWins: 0,
  equippedAvatarFrameId: DEFAULT_AVATAR_FRAME_ID,
  ownedAvatarFrameIds: [DEFAULT_AVATAR_FRAME_ID],
  equippedCardBackId: DEFAULT_CARD_BACK_ID,
  ownedCardBackIds: [DEFAULT_CARD_BACK_ID],
};

export const ALL_CARDS_POOL_RAW: Omit<Card, 'uuid' | 'isPlayed' | 'hasAttacked' | 'isDragging' | 'currentHealth' | 'maxHealth'>[] = [
  // Existing Cards
  { id: 'c001', name: 'Noob Trader', description: 'card_c001_desc', imageUrl: 'https://picsum.photos/seed/c001_art/360/240', rarity: CardRarity.Common, cost: 1, attack: 1, health: 2, abilities: [], cardType: "Trader" },
  { id: 'c002', name: 'Shill Bot', description: 'card_c002_desc', imageUrl: 'https://picsum.photos/seed/c002_art/360/240', rarity: CardRarity.Common, cost: 2, attack: 2, health: 1, abilities: [], cardType: "Bot" },
  { id: 'c003', name: 'Doge Pup', description: 'card_c003_desc', imageUrl: 'https://picsum.photos/seed/c003_art/360/240', rarity: CardRarity.Common, cost: 1, attack: 1, health: 1, abilities: [], cardType: "Meme Coin" },
  { id: 'c004', name: 'DeFi Degenerate', description: 'card_c004_desc', imageUrl: 'https://picsum.photos/seed/c004_art/360/240', rarity: CardRarity.Common, cost: 3, attack: 3, health: 3, abilities: [], cardType: "DeFi User" },
  { id: 'r001', name: 'Diamond Hands Holder', description: 'card_r001_desc', imageUrl: 'https://picsum.photos/seed/r001_art/360/240', rarity: CardRarity.Rare, cost: 4, attack: 2, health: 6, abilities: [{ type: CardAbilityType.Taunt, description: 'cardability_taunt_full' }], cardType: "Investor" },
  { id: 'r002', name: 'FOMO Buyer', description: 'card_r002_desc', imageUrl: 'https://picsum.photos/seed/r002_art/360/240', rarity: CardRarity.Rare, cost: 2, attack: 3, health: 2, abilities: [{ type: CardAbilityType.Charge, description: 'cardability_charge_full' }], cardType: "Trader" },
  { id: 'r003', name: 'Community Mod', description: 'card_r003_desc', imageUrl: 'https://picsum.photos/seed/r003_art/360/240', rarity: CardRarity.Rare, cost: 3, attack: 1, health: 4, abilities: [{ type: CardAbilityType.DivineShield, description: 'cardability_divine_shield_full' }], cardType: "Community Mod" },
  { id: 'r004', name: 'Tapping Hamster', description: 'card_r004_desc', imageUrl: 'https://picsum.photos/seed/r004_art/360/240', rarity: CardRarity.Rare, cost: 3, attack: 2, health: 2, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_r004_battlecry_desc'}], cardType: "Crypto Critter"},
  { id: 'e001', name: 'Smooth Scammer', description: 'card_e001_desc', imageUrl: 'https://picsum.photos/seed/e001_art/360/240', rarity: CardRarity.Epic, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_e001_battlecry_desc' }], cardType: "Scammer" },
  { id: 'e002', name: 'Rug Pull Rugrat', description: 'card_e002_desc', imageUrl: 'https://picsum.photos/seed/e002_art/360/240', rarity: CardRarity.Epic, cost: 4, attack: 2, health: 1, abilities: [{ type: CardAbilityType.Deathrattle, description: 'card_e002_deathrattle_desc' }], cardType: "Scammer" },
  { id: 'l001', name: 'Sleepy Joe King', description: 'card_l001_desc', imageUrl: 'https://picsum.photos/seed/l001_art/360/240', rarity: CardRarity.Legendary, cost: 7, attack: 6, health: 8, abilities: [{type: CardAbilityType.Taunt, description: 'cardability_taunt_full'}], cardType: "Figurehead" },
  { id: 'l002', name: 'Elongated Muskrat', description: 'card_l002_desc', imageUrl: 'https://picsum.photos/seed/l002_art/360/240', rarity: CardRarity.Legendary, cost: 8, attack: 7, health: 7, abilities: [{type: CardAbilityType.Charge, description: 'cardability_charge_full'}], cardType: "Visionary" },
  { id: 'l003', name: 'Pavel Turov', description: 'card_l003_desc', imageUrl: 'https://picsum.photos/seed/l003_art/360/240', rarity: CardRarity.Legendary, cost: 6, attack: 5, health: 5, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_l003_battlecry_desc'}], cardType: "Founder" },
  
  // New Cards (20)
  { id: 'c005', name: 'Chad Influencer', description: 'card_c005_desc', imageUrl: 'https://picsum.photos/seed/c005_art/360/240', rarity: CardRarity.Common, cost: 2, attack: 2, health: 2, abilities: [], cardType: "Influencer" },
  { id: 'c006', name: 'Keyboard Warrior', description: 'card_c006_desc', imageUrl: 'https://picsum.photos/seed/c006_art/360/240', rarity: CardRarity.Common, cost: 1, attack: 1, health: 1, abilities: [{ type: CardAbilityType.Taunt, description: 'cardability_taunt_full' }], cardType: "DeFi User" },
  { id: 'c007', name: 'NFT Bro', description: 'card_c007_desc', imageUrl: 'https://picsum.photos/seed/c007_art/360/240', rarity: CardRarity.Common, cost: 3, attack: 3, health: 2, abilities: [], cardType: "Investor" },
  { id: 'c008', name: 'Liquidity Farmer', description: 'card_c008_desc', imageUrl: 'https://picsum.photos/seed/c008_art/360/240', rarity: CardRarity.Common, cost: 2, attack: 1, health: 3, abilities: [], cardType: "DeFi User" },
  { id: 'c009', name: 'NotCoin Tapper', description: 'card_c009_desc', imageUrl: 'https://picsum.photos/seed/c009_art/360/240', rarity: CardRarity.Common, cost: 1, attack: 0, health: 2, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_c009_battlecry_desc'}], cardType: "Meme Coin" },

  { id: 'r005', name: 'Telegram Channel Admin', description: 'card_r005_desc', imageUrl: 'https://picsum.photos/seed/r005_art/360/240', rarity: CardRarity.Rare, cost: 4, attack: 3, health: 3, abilities: [{ type: CardAbilityType.Stealth, description: 'cardability_stealth_full' }], cardType: "Community Mod" },
  { id: 'r006', name: 'Whale Watcher', description: 'card_r006_desc', imageUrl: 'https://picsum.photos/seed/r006_art/360/240', rarity: CardRarity.Rare, cost: 2, attack: 1, health: 1, abilities: [{ type: CardAbilityType.Airdrop, description: 'cardability_airdrop_full' }], cardType: "Trader" },
  { id: 'r007', name: 'Shitcoin Shaman', description: 'card_r007_desc', imageUrl: 'https://picsum.photos/seed/r007_art/360/240', rarity: CardRarity.Rare, cost: 3, attack: 2, health: 3, abilities: [{ type: CardAbilityType.Deathrattle, description: 'card_r007_deathrattle_desc'}], cardType: "Scammer" },
  { id: 'r008', name: 'Gigachad Dev', description: 'card_r008_desc', imageUrl: 'https://picsum.photos/seed/r008_art/360/240', rarity: CardRarity.Rare, cost: 5, attack: 3, health: 5, abilities: [{ type: CardAbilityType.HODL, description: 'cardability_hodl_full' }], cardType: "Founder" },
  { id: 'r009', name: 'Concerned Citizen', description: 'card_r009_desc', imageUrl: 'https://picsum.photos/seed/r009_art/360/240', rarity: CardRarity.Rare, cost: 3, attack: 1, health: 5, abilities: [{ type: CardAbilityType.Taunt, description: 'cardability_taunt_full' }], cardType: "Community Mod" },
  
  { id: 'e003', name: 'The Zucc', description: 'card_e003_desc', imageUrl: 'https://picsum.photos/seed/e003_art/360/240', rarity: CardRarity.Epic, cost: 6, attack: 5, health: 5, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_e003_battlecry_desc'}], cardType: "Visionary" },
  { id: 'e004', name: 'Captain Hindsight', description: 'card_e004_desc', imageUrl: 'https://picsum.photos/seed/e004_art/360/240', rarity: CardRarity.Epic, cost: 4, attack: 3, health: 3, abilities: [{ type: CardAbilityType.Silence, description: 'cardability_silence_full_enemy'}], cardType: "Influencer" },
  { id: 'e005', name: 'DeFi Chef', description: 'card_e005_desc', imageUrl: 'https://picsum.photos/seed/e005_art/360/240', rarity: CardRarity.Epic, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_e005_battlecry_desc'}], cardType: "DeFi User" },
  { id: 'e006', name: 'DAO Voter', description: 'card_e006_desc', imageUrl: 'https://picsum.photos/seed/e006_art/360/240', rarity: CardRarity.Epic, cost: 2, attack: 2, health: 1, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_e006_battlecry_desc'}], cardType: "Investor" },

  { id: 'l004', name: 'Donald Pump', description: 'card_l004_desc', imageUrl: 'https://picsum.photos/seed/l004_art/360/240', rarity: CardRarity.Legendary, cost: 7, attack: 6, health: 6, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_l004_battlecry_desc'}], cardType: "Figurehead" },
  { id: 'l005', name: 'Vitalik\'s Ethereum Rainbow', description: 'card_l005_desc', imageUrl: 'https://picsum.photos/seed/l005_art/360/240', rarity: CardRarity.Legendary, cost: 4, attack: 2, health: 4, abilities: [{ type: CardAbilityType.Stealth, description: 'cardability_stealth_full' }, { type: CardAbilityType.Deathrattle, description: 'card_l005_deathrattle_desc' }], cardType: "Crypto Critter" },
  { id: 'l006', name: 'CZ "4"', description: 'card_l006_desc', imageUrl: 'https://picsum.photos/seed/l006_art/360/240', rarity: CardRarity.Legendary, cost: 8, attack: 4, health: 4, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_l006_battlecry_desc'}], cardType: "Founder" },
  { id: 'l007', name: 'The Hamster CEO', description: 'card_l007_desc', imageUrl: 'https://picsum.photos/seed/l007_art/360/240', rarity: CardRarity.Legendary, cost: 5, attack: 4, health: 4, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_l007_battlecry_desc'}], cardType: "Visionary" },
  { id: 'l008', name: 'Giga Brain NotVatalik', description: 'card_l008_desc', imageUrl: 'https://picsum.photos/seed/l008_art/360/240', rarity: CardRarity.Legendary, cost: 9, attack: 7, health: 7, abilities: [{ type: CardAbilityType.Battlecry, description: 'card_l008_battlecry_desc'}], cardType: "Visionary" },
  { id: 'l009', name: 'Satoshi\'s Ghost', description: 'card_l009_desc', imageUrl: 'https://picsum.photos/seed/l009_art/360/240', rarity: CardRarity.Legendary, cost: 3, attack: 1, health: 1, abilities: [{ type: CardAbilityType.Stealth, description: 'cardability_stealth_full' }, { type: CardAbilityType.Deathrattle, description: 'card_l009_deathrattle_desc' }], cardType: "Founder" },
];

export const getCardById = (id: string): Omit<Card, 'uuid' | 'isPlayed' | 'hasAttacked' | 'isDragging' | 'currentHealth' | 'maxHealth'> | undefined => {
  return ALL_CARDS_POOL_RAW.find(card => card.id === id);
};

export const createCardInstance = (cardId: string): Card | undefined => {
  const cardPrototype = getCardById(cardId);
  if (!cardPrototype) return undefined;
  return {
      ...cardPrototype,
      uuid: crypto.randomUUID(),
      currentHealth: cardPrototype.health,
      maxHealth: cardPrototype.health,
      isPlayed: false,
      hasAttacked: false,
  };
};

export const ALL_CARDS_POOL: Card[] = ALL_CARDS_POOL_RAW.map(rawCard => createCardInstance(rawCard.id)!).filter(Boolean) as Card[];


export const MOCK_FRIENDS: Friend[] = [
  { id: 'friend1', name: 'Alice DeFi', friendCode: generateMockFriendCode(), avatarUrl: 'https://picsum.photos/seed/alice/80/80', isOnline: true, rating: 1150, level: 5 },
  { id: 'friend2', name: 'Bob NFT', friendCode: generateMockFriendCode(), avatarUrl: 'https://picsum.photos/seed/bob/80/80', isOnline: false, rating: 980, level: 3 },
  { id: 'friend3', name: 'Charlie Crypto', friendCode: generateMockFriendCode(), avatarUrl: 'https://picsum.photos/seed/charlie/80/80', isOnline: true, rating: 1300, level: 8 },
];

export const MOCK_LEADERBOARD_GLOBAL: PlayerProfile[] = [
  { ...INITIAL_PLAYER_PROFILE, name: 'Vitaly Buterbrodov', rating: 1850, level: 10, avatarUrl: 'https://picsum.photos/seed/leader1/40/40', friendCode: generateMockFriendCode() },
  { ...INITIAL_PLAYER_PROFILE, name: 'Satoshi Nakazyvayu', rating: 1700, level: 9, avatarUrl: 'https://picsum.photos/seed/leader2/40/40', friendCode: generateMockFriendCode() },
  { ...INITIAL_PLAYER_PROFILE, name: 'Chad Trader', rating: 1600, level: 8, avatarUrl: 'https://picsum.photos/seed/leader3/40/40', friendCode: generateMockFriendCode() },
  { ...INITIAL_PLAYER_PROFILE, name: 'Laser Eyes Lisa', rating: 1550, level: 8, avatarUrl: 'https://picsum.photos/seed/leader4/40/40', friendCode: generateMockFriendCode() },
  { ...INITIAL_PLAYER_PROFILE, name: 'Hodler Harry', rating: 1500, level: 7, avatarUrl: 'https://picsum.photos/seed/leader5/40/40', friendCode: generateMockFriendCode() },
];


// Achievements Definition
export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_first_win', nameKey: 'achievement_firstWin_name', descriptionKey: 'achievement_firstWin_desc', iconType: AchievementIconType.GameWin, targetValue: 1, reward: { type: GameRewardType.KrendiCoins, amount: 50, description: 'reward_ach_firstWin' }, category: 'gameplay' },
  { id: 'ach_five_wins', nameKey: 'achievement_fiveWins_name', descriptionKey: 'achievement_fiveWins_desc', iconType: AchievementIconType.GameWin, targetValue: 5, reward: { type: GameRewardType.KrendiCoins, amount: 150, description: 'reward_ach_fiveWins' }, category: 'gameplay' },
  { id: 'ach_bot_basher_1', nameKey: 'achievement_botBasher1_name', descriptionKey: 'achievement_botBasher1_desc', iconType: AchievementIconType.BotWin, targetValue: 3, reward: { type: GameRewardType.KrendiCoins, amount: 75, description: 'reward_ach_botBasher1' }, category: 'gameplay' },
  { id: 'ach_collector_novice', nameKey: 'achievement_collectorNovice_name', descriptionKey: 'achievement_collectorNovice_desc', iconType: AchievementIconType.CardCollect, targetValue: 10, reward: { type: GameRewardType.SpecificCard, cardId: 'r002', description: 'reward_ach_collectorNovice' }, category: 'collection' },
  { id: 'ach_rating_1100', nameKey: 'achievement_rating1100_name', descriptionKey: 'achievement_rating1100_desc', iconType: AchievementIconType.RatingReach, targetValue: 1100, reward: { type: GameRewardType.KrendiCoins, amount: 100, description: 'reward_ach_rating1100' }, category: 'progression' },
  { id: 'ach_level_3', nameKey: 'achievement_level3_name', descriptionKey: 'achievement_level3_desc', iconType: AchievementIconType.LevelUp, targetValue: 3, reward: { type: GameRewardType.KrendiCoins, amount: 120, description: 'reward_ach_level3' }, category: 'progression' },
  { id: 'ach_first_custom_frame', nameKey: 'achievement_firstCustomFrame_name', descriptionKey: 'achievement_firstCustomFrame_desc', iconType: AchievementIconType.CosmeticUnlock, targetValue: 1, reward: { type: GameRewardType.KrendiCoins, amount: 50, description: 'reward_ach_firstCustomFrame_coins' }, category: 'customization' },
  { id: 'ach_first_custom_back', nameKey: 'achievement_firstCustomBack_name', descriptionKey: 'achievement_firstCustomBack_desc', iconType: AchievementIconType.CosmeticUnlock, targetValue: 1, reward: { type: GameRewardType.KrendiCoins, amount: 50, description: 'reward_ach_firstCustomBack_coins' }, category: 'customization' },
  { id: 'ach_craft_first_card', nameKey: 'achievement_craftFirstCard_name', descriptionKey: 'achievement_craftFirstCard_desc', iconType: AchievementIconType.CardCollect, targetValue: 1, reward: { type: GameRewardType.KrendiDust, amount: 50, description: 'reward_ach_craftFirstCard_dust' }, category: 'crafting' },
  { id: 'ach_collect_100_dust', nameKey: 'achievement_collect100Dust_name', descriptionKey: 'achievement_collect100Dust_desc', iconType: AchievementIconType.KrendiDust, targetValue: 100, reward: { type: GameRewardType.KrendiCoins, amount: 75, description: 'reward_ach_collect100Dust_coins' }, category: 'crafting' },
];


// Shop Items
export const STANDARD_CHEST_ITEM: ShopChestItem = {
  id: 'standard_chest',
  nameKey: 'shop_chestName',
  descriptionKey: 'shop_chestDescription',
  cost: KRENDI_COIN_CHEST_COST,
  cardsPerChest: CARDS_PER_CHEST,
  iconUrl: 'https://picsum.photos/seed/chesticon/100/100?image=500',
};

export const KRENDI_COIN_PACKAGES: DonateKrendiCoinPackage[] = [
  { id: 'kc_pack_small', nameKey: 'krendiCoinPackage_small_name', descriptionKey: 'krendiCoinPackage_small_desc', krendiCoinAmount: 500, costDisplay: '$0.99', iconUrl: 'https://picsum.photos/seed/kc_small/60/60?image=501' },
  { id: 'kc_pack_medium', nameKey: 'krendiCoinPackage_medium_name', descriptionKey: 'krendiCoinPackage_medium_desc', krendiCoinAmount: 1200, costDisplay: '$1.99', iconUrl: 'https://picsum.photos/seed/kc_medium/60/60?image=502', isBestValue: true },
  { id: 'kc_pack_large', nameKey: 'krendiCoinPackage_large_name', descriptionKey: 'krendiCoinPackage_large_desc', krendiCoinAmount: 3000, costDisplay: '$4.99', iconUrl: 'https://picsum.photos/seed/kc_large/60/60?image=503' },
  { id: 'kc_pack_mystery_test', nameKey: 'krendiCoinPackage_mega_name', descriptionKey: 'krendiCoinPackage_mega_desc', krendiCoinAmount: 10, costDisplay: 'Free Test', iconUrl: 'https://picsum.photos/seed/kc_mystery/60/60?image=504' },
];

// Tutorial Steps
export const TUTORIAL_STEPS: TutorialStepContent[] = [
  { id: 1, titleKey: 'tutorial_title_welcome', contentKey: 'tutorial_content_welcome', imageName: 'tutorial_welcome.png' },
  { id: 2, titleKey: 'tutorial_title_mana', contentKey: 'tutorial_content_mana', imageName: 'tutorial_mana.png' },
  { id: 3, titleKey: 'tutorial_title_card_anatomy', contentKey: 'tutorial_content_card_anatomy', imageName: 'tutorial_card_parts.png' },
  { id: 4, titleKey: 'tutorial_title_hand', contentKey: 'tutorial_content_hand', imageName: 'tutorial_hand.png' },
  { id: 5, titleKey: 'tutorial_title_play_minion', contentKey: 'tutorial_content_play_minion', imageName: 'tutorial_play_minion.png' },
  { id: 6, titleKey: 'tutorial_title_minions_on_board', contentKey: 'tutorial_content_minions_on_board', imageName: 'tutorial_board.png' },
  { id: 7, titleKey: 'tutorial_title_attack', contentKey: 'tutorial_content_attack', imageName: 'tutorial_attack.png' },
  { id: 8, titleKey: 'tutorial_title_end_turn', contentKey: 'tutorial_content_end_turn', imageName: 'tutorial_end_turn.png' },
  { id: 9, titleKey: 'tutorial_title_win_condition', contentKey: 'tutorial_content_win_condition', imageName: 'tutorial_victory.png' },
  { id: 10, titleKey: 'tutorial_title_ready', contentKey: 'tutorial_content_ready', imageName: 'tutorial_final.png' },
];

// Daily Quests
export const DAILY_QUEST_COUNT = 3;
export const DAILY_QUEST_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms

export const ALL_DAILY_QUESTS_POOL: DailyQuestDefinition[] = [
  { id: 'dq_win1', nameKey: 'dailyQuest_win1_name', descriptionKey: 'dailyQuest_win1_desc', iconType: AchievementIconType.GameWin, progressType: QuestProgressType.MatchesWon, targetValue: 1, reward: { type: GameRewardType.KrendiCoins, amount: 50, description: 'reward_daily_win1_coins'} },
  { id: 'dq_win2_pvp', nameKey: 'dailyQuest_win2_pvp_name', descriptionKey: 'dailyQuest_win2_pvp_desc', iconType: AchievementIconType.GameWin, progressType: QuestProgressType.PvpMatchesWon, targetValue: 2, reward: { type: GameRewardType.KrendiCoins, amount: 100, description: 'reward_daily_win2_pvp_coins'} },
  { id: 'dq_play10_cards', nameKey: 'dailyQuest_play10_cards_name', descriptionKey: 'dailyQuest_play10_cards_desc', iconType: AchievementIconType.CardsPlayed, progressType: QuestProgressType.CardsPlayed, targetValue: 10, reward: { type: GameRewardType.KrendiCoins, amount: 60, description: 'reward_daily_play10_cards_coins'} },
  { id: 'dq_play5_minions', nameKey: 'dailyQuest_play5_minions_name', descriptionKey: 'dailyQuest_play5_minions_desc', iconType: AchievementIconType.CardCollect, progressType: QuestProgressType.MinionsPlayed, targetValue: 5, reward: { type: GameRewardType.KrendiCoins, amount: 40, description: 'reward_daily_play5_minions_coins'} },
  { id: 'dq_deal50_hero_dmg', nameKey: 'dailyQuest_deal50_hero_dmg_name', descriptionKey: 'dailyQuest_deal50_hero_dmg_desc', iconType: AchievementIconType.DamageDealt, progressType: QuestProgressType.DamageDealtToEnemyHero, targetValue: 50, reward: { type: GameRewardType.KrendiCoins, amount: 80, description: 'reward_daily_deal50_hero_dmg_coins'} },
  { id: 'dq_destroy3_minions', nameKey: 'dailyQuest_destroy3_minions_name', descriptionKey: 'dailyQuest_destroy3_minions_desc', iconType: AchievementIconType.QuestGeneric, progressType: QuestProgressType.EnemyMinionsDestroyed, targetValue: 3, reward: { type: GameRewardType.SpecificCard, cardId: 'c003', description: 'reward_daily_destroy3_minions_card'} },
  { id: 'dq_win1_bot', nameKey: 'dailyQuest_win1_bot_name', descriptionKey: 'dailyQuest_win1_bot_desc', iconType: AchievementIconType.BotWin, progressType: QuestProgressType.BotMatchesWon, targetValue: 1, reward: { type: GameRewardType.KrendiCoins, amount: 30, description: 'reward_daily_win1_bot_coins'} },
];

export const MATCHMAKING_TIPS: (keyof TranslationKeys)[] = [
  "matchmaking_fact_1", "matchmaking_fact_2", "matchmaking_fact_3", "matchmaking_fact_4",
  "matchmaking_fact_5", "matchmaking_fact_6", "matchmaking_fact_7", "matchmaking_fact_8",
  "matchmaking_fact_9", "matchmaking_fact_10",
];

// --- Mock Game State Generation ---
const createInitialPlayerState = (
  id: string,
  name: string,
  avatarUrl: string | undefined,
  deckCardIds: string[],
  isPlayer: boolean
): PlayerState => {
  const fullDeck: Card[] = [];
  const hand: Card[] = [];

  deckCardIds.forEach(cardId => {
    const cardInstance = createCardInstance(cardId);
    if (cardInstance) {
      fullDeck.push(cardInstance);
    }
  });

  for (let i = fullDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
  }

  const initialHandSize = isPlayer ? 3 : 4;
  for (let i = 0; i < initialHandSize && fullDeck.length > 0; i++) {
    hand.push(fullDeck.shift()!);
  }

  return {
    id, name, avatarUrl,
    health: INITIAL_PLAYER_HEALTH, maxHealth: INITIAL_PLAYER_HEALTH,
    mana: 0, maxMana: 0,
    hand, deck: fullDeck, board: [],
    burnoutDamageCounter: 0,
  };
};

export const generateRandomDeckIds = (count: number = MAX_CARDS_PER_DECK): string[] => {
  const shuffledPool = [...ALL_CARDS_POOL_RAW].sort(() => 0.5 - Math.random());
  const deckIds: string[] = [];
  const cardCounts: { [id: string]: number } = {};

  for (const cardProto of shuffledPool) {
    if (deckIds.length >= count) break;
    const currentCount = cardCounts[cardProto.id] || 0;
    const maxCopies = cardProto.rarity === CardRarity.Legendary ? MAX_COPIES_LEGENDARY : MAX_COPIES_NON_LEGENDARY;
    if (currentCount < maxCopies) {
      deckIds.push(cardProto.id);
      cardCounts[cardProto.id] = currentCount + 1;
    }
  }
  let emergencyFillIndex = 0;
  while(deckIds.length < count && emergencyFillIndex < shuffledPool.length * 2 ) { // Allow re-iterating for fill
    const cardProto = shuffledPool[emergencyFillIndex % shuffledPool.length];
    const currentCount = cardCounts[cardProto.id] || 0;
    const maxCopies = cardProto.rarity === CardRarity.Legendary ? MAX_COPIES_LEGENDARY : MAX_COPIES_NON_LEGENDARY;
     if (currentCount < maxCopies) {
      deckIds.push(cardProto.id);
      cardCounts[cardProto.id] = (currentCount + 1);
    }
    emergencyFillIndex++;
  }
  return deckIds.slice(0, count);
};

export const generateMockGameState = (
  matchId: string,
  playerUser: TelegramUser,
  playerProfile: PlayerProfile,
  playerDeckIdsFromActiveDeck: string[],
  opponentName: string,
  opponentId: string,
  opponentType: 'human' | 'bot',
  opponentAvatarUrl?: string,
  opponentRating?: number,
  opponentLevel?: number
): GameState => {
  const playerActualDeckIds = playerDeckIdsFromActiveDeck.length === MAX_CARDS_PER_DECK
    ? playerDeckIdsFromActiveDeck
    : generateRandomDeckIds();

  const opponentDeckIds = generateRandomDeckIds();

  const playerState = createInitialPlayerState(
    playerUser.id.toString(),
    playerProfile.name || playerUser.firstName,
    playerProfile.avatarUrl || playerUser.photoUrl,
    playerActualDeckIds,
    true
  );

  const opponentState = createInitialPlayerState(
    opponentId,
    opponentName,
    opponentAvatarUrl || `https://picsum.photos/seed/${opponentId}/80/80`,
    opponentDeckIds,
    false
  );

  playerState.mana = 1;
  playerState.maxMana = 1;

  return {
    matchId,
    player: playerState,
    opponent: opponentState,
    currentTurn: playerUser.id.toString(),
    turnNumber: 1,
    log: [`Game started! ${playerState.name} vs ${opponentState.name}. ${playerState.name} goes first.`],
    isGameOver: false,
    winner: undefined,
    opponentType,
  };
};

export const generateMockBotGameState = (playerUser: TelegramUser, playerProfile: PlayerProfile, playerDeckIds: string[]): GameState => {
  const botId = `bot_${crypto.randomUUID().slice(0,4)}`;
  const botName = `KrendiBot ${botId.substring(4,8)}`;
  const botAvatar = `https://picsum.photos/seed/${botId}/80/80`;
  const botRating = Math.max(800, (playerProfile.rating || 1000) + Math.floor(Math.random() * 100) - 50);
  const botLevel = Math.max(1, (playerProfile.level || 1) + Math.floor(Math.random() * 2) -1);

  return generateMockGameState(
    `bot_match_${crypto.randomUUID().slice(0,8)}`,
    playerUser,
    playerProfile,
    playerDeckIds,
    botName,
    botId,
    'bot',
    botAvatar,
    botRating,
    botLevel
  );
};


export type LeaderboardEntry = Pick<PlayerProfile, 'name' | 'avatarUrl' | 'rating' | 'level' | 'friendCode'> | (Friend & {friendCode?: string});

export const MOCK_LEADERBOARD_FRIENDS = (currentPlayerProfile: PlayerProfile, friendsList: Friend[]): LeaderboardEntry[] => {
  const leaderboardEntries: LeaderboardEntry[] = [
    {
      name: currentPlayerProfile.name || `Player ${currentPlayerProfile.friendCode.substring(0,4)}`,
      avatarUrl: currentPlayerProfile.avatarUrl,
      rating: currentPlayerProfile.rating,
      level: currentPlayerProfile.level,
      friendCode: currentPlayerProfile.friendCode,
    },
    ...friendsList.map(friend => ({
      ...friend,
      friendCode: friend.friendCode,
    }))
  ];
  return leaderboardEntries.sort((a, b) => (b.rating || 0) - (a.rating || 0));
};
