// telecards-backend/src/services/playerService.ts
import { PlayerModel } from '../models';
import { StoredPlayerDataBE, DeckBE, CardPrototypeBE, GameRewardBE, GameRewardTypeBE } from '../types';
import { getCardPrototypeByIdBE, LEVEL_XP_THRESHOLDS_BE, REWARDS_PER_LEVEL_BE, MAX_CARDS_PER_DECK_BE, INITIAL_PLAYER_PROFILE_BE } from '../constants';

export async function getPlayerData(userId: string): Promise<StoredPlayerDataBE | null> {
  console.log(`PlayerService: Fetching data for user ${userId}`);
  let player = await PlayerModel.findById(userId);
  if (!player) {
    // Create new player if not found (common for Telegram Mini Apps)
    console.warn(`PlayerService: Player ${userId} not found. Creating new entry.`);
    player = await PlayerModel.create({
        id: userId,
        name: `Player ${userId.substring(0, 5)}`, // Default name
        // Other fields will use defaults from PlayerModel.create or INITIAL_PLAYER_PROFILE_BE
    });
  }
  return player;
}

export async function updatePlayerProfile(userId: string, updates: Partial<StoredPlayerDataBE>): Promise<StoredPlayerDataBE | null> {
  console.log(`PlayerService: Updating profile for user ${userId} with`, updates);
  // Add validation for updates here
  const updatedPlayer = await PlayerModel.update(userId, updates);
  if (!updatedPlayer) {
    console.warn(`PlayerService: Failed to update profile for ${userId}, player not found.`);
  }
  return updatedPlayer;
}

export async function addKrendiCoins(userId: string, amount: number): Promise<StoredPlayerDataBE | null> {
  console.log(`PlayerService: Adding ${amount} KrendiCoins to user ${userId}`);
  const player = await PlayerModel.findById(userId);
  if (!player) return null;
  
  const newBalance = (player.krendiCoins || 0) + amount;
  return PlayerModel.update(userId, { krendiCoins: newBalance });
}

export async function addKrendiDust(userId: string, amount: number): Promise<StoredPlayerDataBE | null> {
  console.log(`PlayerService: Adding ${amount} Krendi Dust to user ${userId}`);
  const player = await PlayerModel.findById(userId);
  if (!player) return null;
  
  const newBalance = (player.krendiDust || 0) + amount;
  return PlayerModel.update(userId, { krendiDust: newBalance });
}

export async function addCardsToCollection(userId: string, cardIds: string[]): Promise<StoredPlayerDataBE | null> {
  const player = await PlayerModel.findById(userId);
  if (!player) return null;

  const newOwnedCardIds = Array.from(new Set([...player.ownedCardIds, ...cardIds]));
  return PlayerModel.update(userId, { ownedCardIds: newOwnedCardIds });
}

export async function updatePlayerXPAndLevel(userId: string, xpGained: number): Promise<{ updatedPlayer: StoredPlayerDataBE | null, grantedRewards: GameRewardBE[] }> {
  const player = await PlayerModel.findById(userId);
  if (!player) return { updatedPlayer: null, grantedRewards: [] };

  const currentLevel = player.level;
  const currentXP = player.xp + xpGained;
  let newLevel = currentLevel;
  const grantedRewards: GameRewardBE[] = [];

  // Level up logic
  while (LEVEL_XP_THRESHOLDS_BE[newLevel + 1] !== undefined && currentXP >= LEVEL_XP_THRESHOLDS_BE[newLevel + 1]) {
    newLevel++;
    if (REWARDS_PER_LEVEL_BE[newLevel]) {
      grantedRewards.push(...REWARDS_PER_LEVEL_BE[newLevel]);
      // Process rewards immediately (e.g., add coins, cards)
      for (const reward of REWARDS_PER_LEVEL_BE[newLevel]) {
        if (reward.type === GameRewardTypeBE.KrendiCoins && reward.amount) {
          player.krendiCoins = (player.krendiCoins || 0) + reward.amount;
        } else if (reward.type === GameRewardTypeBE.SpecificCard && reward.cardId) {
          if (!player.ownedCardIds.includes(reward.cardId)) {
            player.ownedCardIds.push(reward.cardId);
          }
        } else if (reward.type === GameRewardTypeBE.KrendiDust && reward.amount) {
            player.krendiDust = (player.krendiDust || 0) + reward.amount;
        }
      }
    }
  }

  const xpToNextLevel = LEVEL_XP_THRESHOLDS_BE[newLevel + 1] || currentXP; // If max level, currentXP or a very high number

  const updates: Partial<StoredPlayerDataBE> = {
    xp: currentXP,
    level: newLevel,
    xpToNextLevel,
    krendiCoins: player.krendiCoins, // Updated if rewards included coins
    ownedCardIds: player.ownedCardIds, // Updated if rewards included cards
    krendiDust: player.krendiDust, // Updated if rewards included dust
  };

  const updatedPlayer = await PlayerModel.update(userId, updates);
  return { updatedPlayer, grantedRewards };
}


// --- Deck Management ---
export async function getPlayerDecks(userId: string): Promise<DeckBE[]> {
    const player = await PlayerModel.findById(userId);
    return player?.decks || [];
}

export async function savePlayerDeck(userId: string, deckData: DeckBE): Promise<StoredPlayerDataBE | null> {
    const player = await PlayerModel.findById(userId);
    if (!player) return null;

    const deckIndex = player.decks.findIndex(d => d.id === deckData.id);
    if (deckIndex > -1) {
        player.decks[deckIndex] = deckData;
    } else {
        player.decks.push(deckData);
    }
    // If this deck is set active, deactivate others
    if (deckData.isActive) {
        player.decks.forEach(d => { if (d.id !== deckData.id) d.isActive = false; });
    }

    return PlayerModel.update(userId, { decks: player.decks });
}

export async function deletePlayerDeck(userId: string, deckId: string): Promise<StoredPlayerDataBE | null> {
    const player = await PlayerModel.findById(userId);
    if (!player) return null;

    const initialLength = player.decks.length;
    player.decks = player.decks.filter(d => d.id !== deckId);

    // If the deleted deck was active, and there are other decks, make the first one active.
    if (initialLength > player.decks.length && player.decks.length > 0 && !player.decks.some(d => d.isActive)) {
        player.decks[0].isActive = true;
    }
    return PlayerModel.update(userId, { decks: player.decks });
}

export async function setActiveDeck(userId: string, deckId: string): Promise<StoredPlayerDataBE | null> {
    const player = await PlayerModel.findById(userId);
    if (!player) return null;

    let deckFound = false;
    player.decks.forEach(d => {
        d.isActive = d.id === deckId;
        if (d.isActive) deckFound = true;
    });

    if (!deckFound && player.decks.length > 0) { // Fallback if specified deckId wasn't found but decks exist
        console.warn(`PlayerService: setActiveDeck - deckId ${deckId} not found for user ${userId}. Setting first deck as active.`);
        player.decks[0].isActive = true;
    } else if (!deckFound && player.decks.length === 0) {
        console.warn(`PlayerService: setActiveDeck - no decks available for user ${userId} to set active.`);
    }


    return PlayerModel.update(userId, { decks: player.decks });
}


console.log("Player service (playerService.ts) loaded.");
