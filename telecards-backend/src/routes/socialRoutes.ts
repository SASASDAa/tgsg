// telecards-backend/src/routes/socialRoutes.ts
import { Router, Request, Response } from 'express';
import { 
    sendFriendRequest, 
    respondToFriendRequest, 
    getFriendsList,
    getFriendRequestsForUser,
    removeFriend
} from '../services/socialService';
import { authenticate } from '../services/authService'; // Basic mock auth

const router = Router();

// Get friends list for a user
router.get('/friends/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const friends = await getFriendsList(userId);
    res.json(friends);
  } catch (error: any) {
    console.error("Error in GET /social/friends/:userId :", error);
    res.status(500).json({ message: 'Error fetching friends list', error: error.message });
  }
});

// Send friend request
router.post('/friends/request', authenticate, async (req: Request, res: Response) => {
  try {
    // Assuming senderId comes from authenticated user context or body
    const senderId = req.body.senderId; // Or (req as any).user.id if auth middleware sets it
    const { receiverFriendCode } = req.body;

    if (!senderId || !receiverFriendCode) {
        return res.status(400).json({ message: "Missing senderId or receiverFriendCode."});
    }

    const result = await sendFriendRequest(senderId, receiverFriendCode);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.error("Error in POST /social/friends/request :", error);
    res.status(500).json({ message: 'Error sending friend request', error: error.message });
  }
});

// Respond to friend request
router.post('/friends/respond', authenticate, async (req: Request, res: Response) => {
  try {
    // Assuming responderId comes from authenticated user context or body
    const responderId = req.body.responderId; // Or (req as any).user.id
    const { requestId, action } = req.body; // action: 'accept' | 'decline'

    if (!responderId || !requestId || !action || (action !== 'accept' && action !== 'decline')) {
        return res.status(400).json({ message: "Missing responderId, requestId, or valid action."});
    }

    const result = await respondToFriendRequest(requestId, responderId, action);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.error("Error in POST /social/friends/respond :", error);
    res.status(500).json({ message: 'Error responding to friend request', error: error.message });
  }
});

// Get pending friend requests for a user
router.get('/friends/requests/:userId', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const requests = await getFriendRequestsForUser(userId);
        res.json(requests);
    } catch (error: any) {
        console.error("Error in GET /social/friends/requests/:userId :", error);
        res.status(500).json({ message: 'Error fetching friend requests', error: error.message });
    }
});

// Remove a friend
router.delete('/friends/:userId/:friendIdToRemove', authenticate, async (req: Request, res: Response) => {
    try {
        const { userId, friendIdToRemove } = req.params;
        const success = await removeFriend(userId, friendIdToRemove);
        if (success) {
            res.status(200).json({ success: true, message: 'Friend removed successfully.' });
        } else {
            res.status(400).json({ success: false, message: 'Failed to remove friend or friend not found.' });
        }
    } catch (error: any) {
        console.error("Error in DELETE /social/friends/:userId/:friendIdToRemove :", error);
        res.status(500).json({ message: 'Error removing friend', error: error.message });
    }
});


// Challenge-related routes might be primarily handled via WebSockets.
// An API could be used for things like getting challenge history if needed.

export default router;