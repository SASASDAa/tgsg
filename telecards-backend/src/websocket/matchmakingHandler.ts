// telecards-backend/src/websocket/matchmakingHandler.ts
import WebSocket from 'ws';
import { addPlayerToQueue, removePlayerFromQueue, setOnMatchFound, PlayerQueueEntryBE } from '../services/matchmakingService';
import { GameSession, PlayerConnectionInfo } from '../game/GameSession';
import { WebSocketMessageTypeBE } from '../types';
import { getPlayerData } from '../services/playerService'; // To fetch player name, deck etc.

// Store active game sessions (in-memory, consider a more robust solution for production)
const activeGameSessions: Map<string, GameSession> = new Map();

setOnMatchFound(async (playerA_QueueEntry: PlayerQueueEntryBE, playerB_QueueEntry: PlayerQueueEntryBE) => {
  console.log(`MatchmakingHandler: Match found between ${playerA_QueueEntry.playerId} and ${playerB_QueueEntry.playerId}. Preparing GameSession.`);
  
  if (playerA_QueueEntry.ws.readyState !== WebSocket.OPEN || playerB_QueueEntry.ws.readyState !== WebSocket.OPEN) {
    console.error("MatchmakingHandler: One or both player WebSockets closed before game session creation.");
    // Notify the still connected player if possible
    const notifyPlayer = (p: PlayerQueueEntryBE) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {reason: "Opponent disconnected before match start."}}));
      }
    };
    if(playerA_QueueEntry.ws.readyState !== WebSocket.OPEN) notifyPlayer(playerB_QueueEntry);
    if(playerB_QueueEntry.ws.readyState !== WebSocket.OPEN) notifyPlayer(playerA_QueueEntry);
    // Re-queue players if they are still connected and want to find another match (not implemented here)
    return;
  }

  // Fetch full player data for names, avatars, and proper deck IDs (if not already in queue entry)
  const playerAData = await getPlayerData(playerA_QueueEntry.playerId);
  const playerBData = await getPlayerData(playerB_QueueEntry.playerId);

  if (!playerAData || !playerBData) {
    console.error("MatchmakingHandler: Failed to fetch player data for one or both matched players. Aborting match.");
    // Notify players
     if (playerA_QueueEntry.ws.readyState === WebSocket.OPEN) playerA_QueueEntry.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {reason: "Error preparing match."}}));
     if (playerB_QueueEntry.ws.readyState === WebSocket.OPEN) playerB_QueueEntry.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {reason: "Error preparing match."}}));
    return;
  }
  
  const playerA_ActiveDeck = playerAData.decks.find(d => d.isActive);
  const playerB_ActiveDeck = playerBData.decks.find(d => d.isActive);

  if (!playerA_ActiveDeck || !playerB_ActiveDeck) {
    console.error("MatchmakingHandler: One or both players do not have an active deck. Aborting match.");
     if (playerA_QueueEntry.ws.readyState === WebSocket.OPEN) playerA_QueueEntry.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {reason: "Active deck not found."}}));
     if (playerB_QueueEntry.ws.readyState === WebSocket.OPEN) playerB_QueueEntry.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {reason: "Active deck not found for opponent."}}));
    return;
  }

  const p1ConnInfo: PlayerConnectionInfo = {
    ws: playerA_QueueEntry.ws,
    playerId: playerAData.id,
    name: playerAData.name || `Player ${playerAData.id.slice(0,4)}`,
    avatarUrl: playerAData.avatarUrl,
    deckCardIds: playerA_ActiveDeck.cardIds,
    rating: playerAData.rating,
  };
  const p2ConnInfo: PlayerConnectionInfo = {
    ws: playerB_QueueEntry.ws,
    playerId: playerBData.id,
    name: playerBData.name || `Player ${playerBData.id.slice(0,4)}`,
    avatarUrl: playerBData.avatarUrl,
    deckCardIds: playerB_ActiveDeck.cardIds,
    rating: playerBData.rating,
  };

  const gameSession = new GameSession(p1ConnInfo, p2ConnInfo);
  activeGameSessions.set(gameSession.getGameId(), gameSession);

  console.log(`MatchmakingHandler: GameSession ${gameSession.getGameId()} started.`);
  // GameSession constructor will send initial GAME_STATE_UPDATE (which acts as MATCH_FOUND with game data)
});


export async function handleNewMatchmakingConnection(ws: WebSocket, userId: string) {
  const playerData = await getPlayerData(userId); // Fetch player data to get rating
  if (!playerData) {
    console.error(`MatchmakingHandler: Player data not found for ${userId}. Cannot add to queue.`);
    ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'Player data not found. Cannot join matchmaking.' }}));
    ws.close();
    return;
  }
  
  const activeDeck = playerData.decks.find(d => d.isActive);
  if (!activeDeck || activeDeck.cardIds.length === 0) {
      console.error(`MatchmakingHandler: Player ${userId} has no active/valid deck. Cannot add to queue.`);
      ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.ERROR, payload: { message: 'No active or valid deck found. Please set one up.' }}));
      ws.close();
      return;
  }


  const playerEntry: PlayerQueueEntryBE = {
    playerId: userId,
    rating: playerData.rating || 1000, // Default rating if not set
    deckId: activeDeck.id,
    ws,
    timestamp: Date.now()
  };

  addPlayerToQueue(playerEntry);

  ws.on('message', (message: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === WebSocketMessageTypeBE.CANCEL_FIND_MATCH) {
        removePlayerFromQueue(userId);
        if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.MATCHMAKING_CANCELLED, payload: {message: "Matchmaking cancelled by user."} }));
        console.log(`MatchmakingHandler: Player ${userId} cancelled matchmaking.`);
      }
    } catch (error) {
      console.error("MatchmakingHandler: Error parsing message:", message, error);
      if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({type: WebSocketMessageTypeBE.ERROR, payload: {message: "Invalid message format."}}));
    }
  });

  ws.on('close', () => {
    removePlayerFromQueue(userId);
    console.log(`MatchmakingHandler: Client ${userId} disconnected from matchmaking.`);
  });

  ws.on('error', (error) => {
    console.error(`MatchmakingHandler: WebSocket error for ${userId}:`, error);
    removePlayerFromQueue(userId);
  });

  if(ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: WebSocketMessageTypeBE.MATCHMAKING_QUEUED, payload: { message: 'You are in the matchmaking queue.'}}));
}

// Function to clean up finished game sessions (could be called periodically)
export function cleanupGameSession(gameId: string) {
    if(activeGameSessions.has(gameId)){
        activeGameSessions.delete(gameId);
        console.log(`MatchmakingHandler: Cleaned up GameSession ${gameId}.`);
    }
}


console.log("Matchmaking handler (matchmakingHandler.ts) loaded.");
