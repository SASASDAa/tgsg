// telecards-backend/src/models/Card.ts
import { CardPrototypeBE, CardRarityBE as CardRarityBE_Type } from '../types'; // Renamed to avoid conflict if CardRarity enum is also here
import { ALL_CARDS_POOL_BE_RAW } from '../constants';

// Re-export or redefine enums if they are closely tied to this model and not just types
export const CardRarityBE = CardRarityBE_Type;


class CardDefinitionModel {
  private static cardDefinitions: CardPrototypeBE[] = [];

  static async findById(id: string): Promise<CardPrototypeBE | null> {
    return this.cardDefinitions.find(c => c.id === id) || null;
  }

  static async getAll(): Promise<CardPrototypeBE[]> {
    return [...this.cardDefinitions]; // Return a copy
  }

  static loadDefinitions(definitions: CardPrototypeBE[]) {
    this.cardDefinitions = definitions;
    console.log(`CardDefinitionModel: ${definitions.length} card definitions loaded.`);
  }
}

// Load card definitions on startup
if (ALL_CARDS_POOL_BE_RAW) {
  CardDefinitionModel.loadDefinitions(ALL_CARDS_POOL_BE_RAW);
} else {
  console.warn("CardDefinitionModel: ALL_CARDS_POOL_BE_RAW not found in constants. No cards loaded.");
}

export default CardDefinitionModel;

console.log("Card definition model (Card.ts) loaded.");
