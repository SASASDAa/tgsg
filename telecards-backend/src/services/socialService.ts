// telecards-backend/src/services/socialService.ts
import { PlayerModel } from '../models';
import { FriendRequestBE, FriendRequestStatusBE, FriendBE, StoredPlayerDataBE } from '../types';

// Mock in-memory store for friend requests for simplicity
// In a real app, this would be a database table/collection.
const mockFriendRequestsDB: Map<string, FriendRequestBE> = new Map();

export async function sendFriendRequest(senderId: string, receiverFriendCode: string): Promise<{ success: boolean, messageKey: string, request?: FriendRequestBE }> {
  console.log(`SocialService: User ${senderId} sending friend request to code ${receiverFriendCode}`);
  const sender = await PlayerModel.findById(senderId);
  const receiver = await PlayerModel.findByFriendCode(receiverFriendCode);

  if (!sender) return { success: false, messageKey: 'social_error_senderProfileNotFound' };
  if (!receiver) return { success: false, messageKey: 'social_error_friendNotFound' };
  if (sender.id === receiver.id) return { success: false, messageKey: 'social_error_cantAddSelf' };

  // Check if already friends (This requires friend list data on PlayerModel or a separate Friendships model)
  // For mock: if (sender.friends?.includes(receiver.id)) return { success: false, messageKey: 'social_error_alreadyFriends' };
  
  // Check if a pending request already exists
  for (const req of mockFriendRequestsDB.values()) {
    if (req.status === FriendRequestStatusBE.Pending &&
        ((req.senderId === senderId && req.receiverId === receiver.id) ||
         (req.senderId === receiver.id && req.receiverId === senderId))) {
      return { success: false, messageKey: 'social_error_requestAlreadyExists' };
    }
  }

  const newRequest: FriendRequestBE = {
    id: `fr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderId: sender.id,
    senderName: sender.name || sender.id, // Use name if available
    senderAvatarUrl: sender.avatarUrl,
    senderFriendCode: sender.friendCode,
    receiverId: receiver.id,
    receiverFriendCode: receiver.friendCode,
    status: FriendRequestStatusBE.Pending,
    createdAt: Date.now(),
  };
  mockFriendRequestsDB.set(newRequest.id, newRequest);
  
  console.log(`SocialService: Friend request ${newRequest.id} created from ${senderId} to ${receiver.id}`);
  return { success: true, messageKey: 'social_success_requestSent', request: newRequest };
}

export async function respondToFriendRequest(requestId: string, responderId: string, action: 'accept' | 'decline'): Promise<{ success: boolean, messageKey: string, newFriend?: FriendBE }> {
  console.log(`SocialService: User ${responderId} responding ${action} to request ${requestId}`);
  const request = mockFriendRequestsDB.get(requestId);

  if (!request || request.receiverId !== responderId || request.status !== FriendRequestStatusBE.Pending) {
    return { success: false, messageKey: 'social_error_requestNotFound' };
  }
  
  if (action === 'accept') {
    request.status = FriendRequestStatusBE.Accepted;
    
    // Add each other to friend lists (conceptual for mock)
    const sender = await PlayerModel.findById(request.senderId);
    const responder = await PlayerModel.findById(responderId);

    if (sender && responder) {
        // This part is highly dependent on how friends are stored in PlayerModel.
        // For this mock, we're not actually updating PlayerModel with friend lists.
        // In a real system, you'd update both players' friend lists.
        console.log(`SocialService: ${sender.name} and ${responder.name} are now friends (mock).`);
        
        const newFriendDataForResponder: FriendBE = {
            id: sender.id,
            name: sender.name || sender.id,
            friendCode: sender.friendCode,
            avatarUrl: sender.avatarUrl,
            isOnline: true, // Mock online status
            rating: sender.rating,
            level: sender.level,
        };
        // In a real app:
        // await PlayerModel.addFriend(responder.id, sender.id);
        // await PlayerModel.addFriend(sender.id, responder.id);
        mockFriendRequestsDB.delete(requestId); // Remove processed request
        return { success: true, messageKey: 'social_success_requestAccepted', newFriend: newFriendDataForResponder };
    } else {
        request.status = FriendRequestStatusBE.Error; // Failed to finalize
        return { success: false, messageKey: 'social_error_userDataNotFoundOnAccept' };
    }
  } else { // Decline
    request.status = FriendRequestStatusBE.Declined;
    mockFriendRequestsDB.delete(requestId); // Remove processed request
    return { success: true, messageKey: 'social_success_requestDeclined' };
  }
}

export async function getFriendRequestsForUser(userId: string): Promise<{ incoming: FriendRequestBE[], outgoing: FriendRequestBE[] }> {
    const incoming: FriendRequestBE[] = [];
    const outgoing: FriendRequestBE[] = [];
    for (const req of mockFriendRequestsDB.values()) {
        if (req.status === FriendRequestStatusBE.Pending) {
            if (req.receiverId === userId) incoming.push(req);
            if (req.senderId === userId) outgoing.push(req);
        }
    }
    return { incoming, outgoing };
}


export async function getFriendsList(userId: string): Promise<FriendBE[]> {
  console.log(`SocialService: Fetching friends list for ${userId}`);
  // This is a placeholder. In a real system, PlayerModel would store friend IDs,
  // and this service would fetch the profiles for those IDs.
  const player = await PlayerModel.findById(userId);
  if (!player) return [];

  // Simulate a small, static list of friends for any user for now
  const mockFriendsOfUser: FriendBE[] = [];
  const allPlayerIds = await PlayerModel.getAllPlayerIds();
  const otherPlayerIds = allPlayerIds.filter(id => id !== userId).slice(0,3); // Max 3 mock friends

  for (const friendId of otherPlayerIds) {
      const friendData = await PlayerModel.findById(friendId);
      if (friendData) {
          mockFriendsOfUser.push({
              id: friendData.id,
              name: friendData.name || `Friend ${friendData.id.slice(0,3)}`,
              friendCode: friendData.friendCode,
              avatarUrl: friendData.avatarUrl,
              isOnline: Math.random() > 0.5, // Mock online status
              rating: friendData.rating,
              level: friendData.level,
          });
      }
  }
  return mockFriendsOfUser;
}

export async function removeFriend(userId: string, friendIdToRemove: string): Promise<boolean> {
  console.log(`SocialService: User ${userId} attempting to remove friend ${friendIdToRemove}`);
  // In a real system, update PlayerModel for both users.
  // For this mock, we don't have persistent friend lists in PlayerModel, so we just return true.
  console.log(`SocialService: Mock removal of friend ${friendIdToRemove} for user ${userId} successful.`);
  return true;
}

console.log("Social service (socialService.ts) loaded.");
