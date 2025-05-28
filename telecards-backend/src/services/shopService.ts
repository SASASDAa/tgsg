// telecards-backend/src/services/shopService.ts
import { PlayerModel, CardDefinitionModel } from '../models';
import { StoredPlayerDataBE, CardPrototypeBE, CardRarityBE } from '../types';
import { KRENDI_COIN_CHEST_COST_BE, CARDS_PER_CHEST_BE, RARITY_DISENCHANT_VALUES_BE } from '../constants';
// Import ALL_AVATAR_FRAMES_BE, ALL_CARD_BACKS_BE if defined in backend constants for shop items

// Mimicking frontend structure for shop items
interface ShopChestItemBE {
  id: string;
  nameKey: string;
  descriptionKey: string;
  cost: number;
  cardsPerChest: number;
  iconUrl: string;
}
const STANDARD_CHEST_ITEM_BE: ShopChestItemBE = {
  id: 'standard_chest_be',
  nameKey: 'shop_chestName', // Assuming same localization keys
  descriptionKey: 'shop_chestDescription',
  cost: KRENDI_COIN_CHEST_COST_BE,
  cardsPerChest: CARDS_PER_CHEST_BE,
  iconUrl: 'https://picsum.photos/seed/chesticon_be/100/100?image=500',
};

// Interface for ChestOpeningResponse from backend perspective
export interface ChestOpeningResponseBE {
  newCards: CardPrototypeBE[]; // Prototypes of cards awarded
  updatedKrendiCoins: number;
  krendiDustGained: number;
  duplicatesConverted: number;
}

export async function getShopItems(): Promise<{ chests: ShopChestItemBE[] /*, cosmetics: any[] */ }> {
  console.log("ShopService: Fetching all shop items.");
  // Currently only supporting chests. Cosmetics would be listed here too.
  return {
    chests: [STANDARD_CHEST_ITEM_BE],
    // cosmetics: [...ALL_AVATAR_FRAMES_BE, ...ALL_CARD_BACKS_BE] // If defined
  };
}

export async function openChest(userId: string, chestId: string = STANDARD_CHEST_ITEM_BE.id): Promise<ChestOpeningResponseBE> {
  console.log(`ShopService: User ${userId} opening chest ${chestId}`);
  const player = await PlayerModel.findById(userId);
  
  if (!player) throw new Error("Player not found.");
  if (chestId !== STANDARD_CHEST_ITEM_BE.id) throw new Error("Invalid chest type.");
  if (player.krendiCoins < STANDARD_CHEST_ITEM_BE.cost) throw new Error("Not enough KrendiCoins.");

  player.krendiCoins -= STANDARD_CHEST_ITEM_BE.cost;
  
  const newCardsAwarded: CardPrototypeBE[] = [];
  let krendiDustGainedThisChest = 0;
  let duplicatesConvertedCount = 0;
  const allCardDefs = await CardDefinitionModel.getAll();

  if (allCardDefs.length === 0) {
    console.warn("ShopService: No card definitions loaded. Chest will be empty.");
  }

  for (let i = 0; i < STANDARD_CHEST_ITEM_BE.cardsPerChest; i++) {
    if (allCardDefs.length === 0) break;

    // Simplified random draw - in a real game, use rarity weighting
    const randomNumber = Math.random() * 100;
    let chosenRarity: CardRarityBE;
    if (randomNumber < 60) chosenRarity = CardRarityBE.Common;      // 60%
    else if (randomNumber < 85) chosenRarity = CardRarityBE.Rare;   // 25%
    else if (randomNumber < 97) chosenRarity = CardRarityBE.Epic;   // 12%
    else chosenRarity = CardRarityBE.Legendary;                     // 3%

    const availableByRarity = allCardDefs.filter(p => p.rarity === chosenRarity);
    const poolToDrawFrom = availableByRarity.length > 0 ? availableByRarity : allCardDefs; // Fallback if no cards of chosen rarity
    
    if (poolToDrawFrom.length === 0) continue; // Should not happen if allCardDefs is not empty

    const drawnCardPrototype = poolToDrawFrom[Math.floor(Math.random() * poolToDrawFrom.length)];

    // Check for duplicates (basic check: if player already owns it)
    // A real system would check max copies (e.g., 2 for non-legendary, 1 for legendary)
    const currentOwnedCount = player.ownedCardIds.filter(id => id === drawnCardPrototype.id).length;
    const maxCopies = drawnCardPrototype.rarity === CardRarityBE.Legendary ? 1 : 2;

    if (currentOwnedCount < maxCopies) {
        newCardsAwarded.push(drawnCardPrototype);
        player.ownedCardIds.push(drawnCardPrototype.id);
    } else {
        krendiDustGainedThisChest += RARITY_DISENCHANT_VALUES_BE[drawnCardPrototype.rarity] || 5; // Fallback dust
        duplicatesConvertedCount++;
    }
  }

  player.krendiDust = (player.krendiDust || 0) + krendiDustGainedThisChest;
  
  await PlayerModel.update(userId, { 
    krendiCoins: player.krendiCoins, 
    krendiDust: player.krendiDust, 
    ownedCardIds: Array.from(new Set(player.ownedCardIds)) // Ensure unique IDs
  });

  return {
    newCards: newCardsAwarded,
    updatedKrendiCoins: player.krendiCoins,
    krendiDustGained: krendiDustGainedThisChest,
    duplicatesConverted: duplicatesConvertedCount,
  };
}

// Add functions for purchasing cosmetics when definitions are available
// export async function purchaseCosmetic(userId: string, itemId: string): Promise<any> { ... }

console.log("Shop service (shopService.ts) loaded.");
