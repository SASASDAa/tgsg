// telecards-backend/src/routes/shopRoutes.ts
import { Router, Request, Response } from 'express';
import { getShopItems, openChest } from '../services/shopService';
import { authenticate } from '../services/authService'; // Basic mock auth

const router = Router();

// Get available shop items (chests, cosmetics, etc.)
router.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await getShopItems();
    res.json(items);
  } catch (error: any) {
    console.error("Error in GET /shop/items :", error);
    res.status(500).json({ message: 'Error fetching shop items', error: error.message });
  }
});

// Open a chest for a user
router.post('/chest/open/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const chestType = req.body.chestType || 'standard_chest_be'; // Default to standard chest
    
    const chestResult = await openChest(userId, chestType);
    res.json(chestResult);
  } catch (error: any) {
    console.error("Error in POST /shop/chest/open/:userId :", error);
    if (error.message === "Player not found." || error.message === "Invalid chest type.") {
        return res.status(404).json({ message: error.message });
    }
    if (error.message === "Not enough KrendiCoins.") {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error opening chest', error: error.message });
  }
});

// Future routes:
// POST /shop/purchase/cosmetic/:userId - for buying avatar frames, card backs
// POST /shop/purchase/krendicoins/:userId - for "donating" for KrendiCoins (if IAP is ever considered)

export default router;