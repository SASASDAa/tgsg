// telecards-backend/src/websocket/challengeHandler.ts
import WebSocket from 'ws';
import { GameSession, PlayerConnectionInfo } from '../game/GameSession';
import { WebSocketMessageTypeBE, ChallengeFriendPayloadBE, ChallengeResponsePayloadBE } from '../types';
import { getPlayerData } from '../services/playerService';

// Map: userId -> WebSocket connection
const onlineUsersForChallenge: Map<string, WebSocket> = new Map();
// Map: challengeId -> { challengerId: string, challengedId: string, challengerWs: WebSocket (snapshot), challengedWs?: WebSocket (snapshot), deckCardIdsChallenger: string[] }
const pendingChallenges: Map<string, { 
    challengerId: string, 
    challengedId: string, 
    challengerWsSnapshot: WebSocket, // Store the WS at time of challenge
    challengedWsSnapshot?: WebSocket, // Store when/if they connect or respond
    deckCardIdsChallenger: string[] 
}> = new Map();

// Keep track of active game sessions initiated from challenges to prevent duplicate handling if GameSession map is global
// const activeChallengeGames: Set<string> = new Set(); // Or use the global activeGameSessions from matchmakingHandler if shared

export async function handleNewChallengeConnection(ws: WebSocket, userId: string) {
  const playerData = await getPlayerData(userId);
  if (!playerData) {
      console.error(`ChallengeHandler: Player data not found for ${userId}. Connection rejected.`);
      ws.send(JSON.stringify({type: WebSocketMessageTypeBE.ERROR, payload: {message: "User data not found for challenge system."}}));
      ws.close();
      return;
  }
  
  onlineUsersForChallenge.set(userId, ws);
  console.log(`ChallengeHandler: User ${userId} (${playerData.name}) connected for challenges. Total online: ${onlineUsersForChallenge.size}`);

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case WebSocketMessageTypeBE.CHALLENGE_FRIEND:
          await handleChallengeFriendMessage(userId, ws, data.payload as ChallengeFriendPayloadBE);
          break;
        case WebSocketMessageTypeBE.CHALLENGE_RESPONSE:
          await handleChallengeResponseMessage(userId, ws, data.payload as ChallengeResponsePayloadBE);
          break;
        default:
          if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'Unknown challenge message type' } }));
      }
    } catch (error) {
      console.error(`ChallengeHandler: Error parsing message from ${userId}:`, message, error);
      if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'Invalid message format.' } }));
    }
  });

  ws.on('close', () => handleDisconnect(userId));
  ws.on('error', (error) => {
    console.error(`ChallengeHandler: WebSocket error for ${userId}:`, error);
    handleDisconnect(userId);
  });

  if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.CHALLENGE_SYSTEM_CONNECTED, payload: { userId } }));
}

async function handleChallengeFriendMessage(challengerId: string, challengerWs: WebSocket, payload: ChallengeFriendPayloadBE) {
  const { friendId: challengedFriendId } = payload;
  
  const challengerData = await getPlayerData(challengerId);
  if (!challengerData) {
    if(challengerWs.readyState === WebSocket.OPEN) challengerWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: "Your player data not found." } }));
    return;
  }
  const challengerActiveDeck = challengerData.decks.find(d => d.isActive);
  if (!challengerActiveDeck || challengerActiveDeck.cardIds.length === 0) {
    if(challengerWs.readyState === WebSocket.OPEN) challengerWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: "You have no active deck selected." } }));
    return;
  }

  const challengedWs = onlineUsersForChallenge.get(challengedFriendId);
  if (!challengedWs || challengedWs.readyState !== WebSocket.OPEN) {
    if(challengerWs.readyState === WebSocket.OPEN) challengerWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: `Friend ${challengedFriendId} is not online or available.` } }));
    return;
  }

  const challengeId = `chall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  pendingChallenges.set(challengeId, { 
      challengerId, 
      challengedId: challengedFriendId, 
      challengerWsSnapshot: challengerWs, 
      deckCardIdsChallenger: challengerActiveDeck.cardIds
    });
  
  challengedWs.send(JSON.stringify({
    type: WebSocketMessageTypeBE.CHALLENGE_INCOMING,
    payload: {
      challengeId,
      challengerId,
      challengerName: challengerData.name || challengerId,
      challengerAvatarUrl: challengerData.avatarUrl,
      challengerRating: challengerData.rating,
    }
  }));

  if(challengerWs.readyState === WebSocket.OPEN) challengerWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.CHALLENGE_SENT, payload: { challengeId, challengedFriendId } }));
  console.log(`ChallengeHandler: ${challengerId} challenged ${challengedFriendId}. Challenge ID: ${challengeId}`);
}

async function handleChallengeResponseMessage(responderId: string, responderWs: WebSocket, payload: ChallengeResponsePayloadBE) {
  const { challengeId, accepted } = payload;
  const challenge = pendingChallenges.get(challengeId);

  if (!challenge || challenge.challengedId !== responderId) {
    if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'Invalid or expired challenge ID.' } }));
    return;
  }
  
  challenge.challengedWsSnapshot = responderWs;

  const challengerOriginalWs = challenge.challengerWsSnapshot; 
  const challengerCurrentWs = onlineUsersForChallenge.get(challenge.challengerId); 

  if (!challengerCurrentWs || challengerCurrentWs.readyState !== WebSocket.OPEN) {
    if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'Challenger is no longer online.' } }));
    pendingChallenges.delete(challengeId);
    return;
  }
  
  const responderData = await getPlayerData(responderId); // Fetch responder data for name, deck, etc.
  if(!responderData) {
      const errMsg = {type: WebSocketMessageTypeBE.ERROR, payload: {message: "Your player data not found."}};
      if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify(errMsg));
      if(challengerCurrentWs.readyState === WebSocket.OPEN) challengerCurrentWs.send(JSON.stringify({type: WebSocketMessageTypeBE.CHALLENGE_CANCELLED, payload: {challengeId, reason: "Responder data could not be retrieved."}}));
      pendingChallenges.delete(challengeId);
      return;
  }


  if (accepted) {
    console.log(`ChallengeHandler: ${responderId} accepted challenge ${challengeId} from ${challenge.challengerId}. Preparing game...`);
    
    const challengerData = await getPlayerData(challenge.challengerId);

    if (!challengerData) { // ResponderData already fetched
        const errMsg = {type: WebSocketMessageTypeBE.ERROR, payload: {message: "Failed to get challenger data for game start."}};
        if(challengerCurrentWs.readyState === WebSocket.OPEN) challengerCurrentWs.send(JSON.stringify(errMsg));
        if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify(errMsg)); // Send to responder too
        pendingChallenges.delete(challengeId);
        return;
    }
    const responderActiveDeck = responderData.decks.find(d => d.isActive);
    if (!responderActiveDeck || responderActiveDeck.cardIds.length === 0) {
         const errMsg = {type: WebSocketMessageTypeBE.ERROR, payload: {message: "Opponent (responder) has no active deck."}};
         if(challengerCurrentWs.readyState === WebSocket.OPEN) challengerCurrentWs.send(JSON.stringify(errMsg));
         if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify({...errMsg, message: "You have no active deck."}));
         pendingChallenges.delete(challengeId);
         return;
    }

    const p1ConnInfo: PlayerConnectionInfo = {
        ws: challengerCurrentWs, 
        playerId: challengerData.id,
        name: challengerData.name || challengerData.id,
        avatarUrl: challengerData.avatarUrl,
        deckCardIds: challenge.deckCardIdsChallenger, 
        rating: challengerData.rating,
    };
    const p2ConnInfo: PlayerConnectionInfo = {
        ws: responderWs, 
        playerId: responderData.id,
        name: responderData.name || responderData.id,
        avatarUrl: responderData.avatarUrl,
        deckCardIds: responderActiveDeck.cardIds,
        rating: responderData.rating,
    };

    const gameSession = new GameSession(p1ConnInfo, p2ConnInfo);
    console.log(`ChallengeHandler: GameSession ${gameSession.getGameId()} for challenge ${challengeId} started.`);
  
  } else { // Declined
    console.log(`ChallengeHandler: ${responderId} declined challenge ${challengeId} from ${challenge.challengerId}.`);
    if(challengerCurrentWs.readyState === WebSocket.OPEN) {
        challengerCurrentWs.send(JSON.stringify({ 
            type: WebSocketMessageTypeBE.CHALLENGE_DECLINED_NOTICE, 
            payload: { challengeId, responderName: responderData.name || responderId } 
        }));
    }
    if(responderWs.readyState === WebSocket.OPEN) responderWs.send(JSON.stringify({type: WebSocketMessageTypeBE.CHALLENGE_RESPONSE, payload: {message: 'You declined the challenge.', accepted: false}}));
  }
  pendingChallenges.delete(challengeId);
}

function handleDisconnect(userId: string) {
    onlineUsersForChallenge.delete(userId);
    console.log(`ChallengeHandler: User ${userId} disconnected. Total online: ${onlineUsersForChallenge.size}`);
    
    const challengesToRemove: string[] = [];
    pendingChallenges.forEach((challenge, challengeId) => {
      if (challenge.challengerId === userId || challenge.challengedId === userId) {
        const otherPartyId = challenge.challengerId === userId ? challenge.challengedId : challenge.challengerId;
        const otherPartyWs = onlineUsersForChallenge.get(otherPartyId); 
        
        if (otherPartyWs && otherPartyWs.readyState === WebSocket.OPEN) {
          otherPartyWs.send(JSON.stringify({ 
            type: WebSocketMessageTypeBE.CHALLENGE_CANCELLED, 
            payload: { challengeId, reason: `User ${userId} disconnected during challenge.` }
          }));
        }
        challengesToRemove.push(challengeId);
      }
    });
    challengesToRemove.forEach(id => pendingChallenges.delete(id));
    if(challengesToRemove.length > 0) console.log(`ChallengeHandler: Removed ${challengesToRemove.length} pending challenges involving ${userId}.`);
}

console.log("Challenge handler (challengeHandler.ts) loaded.");