// telecards-backend/src/routes/playerRoutes.ts
import { Router, Request, Response } from 'express';
import { 
    getPlayerData, 
    updatePlayerProfile, 
    getPlayerDecks, 
    savePlayerDeck,
    deletePlayerDeck,
    setActiveDeck
} from '../services/playerService';
import { authenticate } from '../services/authService'; // Basic mock auth

const router = Router();

// Example: Apply auth middleware to all player routes if needed
// router.use(authenticate); 

// Get player data (profile, coins, cards, decks etc.)
router.get('/data/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const playerData = await getPlayerData(userId);
    if (!playerData) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(playerData);
  } catch (error: any) {
    console.error("Error in GET /player/data/:userId :", error);
    res.status(500).json({ message: 'Error fetching player data', error: error.message });
  }
});

// Update player profile (e.g., name, avatar if allowed)
router.put('/profile/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const profileUpdates = req.body; // Should be Partial<StoredPlayerDataBE> or specific profile fields
    const updatedProfile = await updatePlayerProfile(userId, profileUpdates);
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Player not found or update failed' });
    }
    res.json(updatedProfile);
  } catch (error: any) {
    console.error("Error in PUT /player/profile/:userId :", error);
    res.status(500).json({ message: 'Error updating player profile', error: error.message });
  }
});

// --- Deck Management Routes ---
router.get('/decks/:userId', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const decks = await getPlayerDecks(userId);
        res.json(decks);
    } catch (error: any) {
        console.error("Error in GET /player/decks/:userId :", error);
        res.status(500).json({ message: 'Error fetching player decks', error: error.message });
    }
});

router.post('/decks/:userId', authenticate, async (req: Request, res: Response) => { // Create or Update deck
    try {
        const userId = req.params.userId;
        const deckData = req.body; // Should be DeckBE
        const updatedPlayer = await savePlayerDeck(userId, deckData);
         if (!updatedPlayer) {
            return res.status(400).json({ message: 'Failed to save deck or player not found.' });
        }
        res.status(200).json(updatedPlayer.decks.find(d => d.id === deckData.id) || deckData);
    } catch (error: any) {
        console.error("Error in POST /player/decks/:userId :", error);
        res.status(500).json({ message: 'Error saving player deck', error: error.message });
    }
});

router.delete('/decks/:userId/:deckId', authenticate, async (req: Request, res: Response) => {
    try {
        const { userId, deckId } = req.params;
        const updatedPlayer = await deletePlayerDeck(userId, deckId);
        if (!updatedPlayer) {
            return res.status(400).json({ message: 'Failed to delete deck or player/deck not found.' });
        }
        res.status(200).json({ message: `Deck ${deckId} deleted successfully.`, decks: updatedPlayer.decks });
    } catch (error: any) {
        console.error("Error in DELETE /player/decks/:userId/:deckId :", error);
        res.status(500).json({ message: 'Error deleting player deck', error: error.message });
    }
});

router.put('/decks/:userId/activate/:deckId', authenticate, async (req: Request, res: Response) => {
    try {
        const { userId, deckId } = req.params;
        const updatedPlayer = await setActiveDeck(userId, deckId);
         if (!updatedPlayer) {
            return res.status(400).json({ message: 'Failed to activate deck or player/deck not found.' });
        }
        res.status(200).json({ message: `Deck ${deckId} activated successfully.`, decks: updatedPlayer.decks});
    } catch (error: any) {
        console.error("Error in PUT /player/decks/:userId/activate/:deckId :", error);
        res.status(500).json({ message: 'Error activating player deck', error: error.message });
    }
});


export default router;