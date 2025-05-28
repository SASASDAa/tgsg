// telecards-backend/src/services/matchmakingService.ts
import WebSocket from 'ws'; // Import WebSocket type
import { MATCHMAKING_RATING_RANGE_INCREMENT_BE, MATCHMAKING_MAX_RATING_RANGE_BE, MATCHMAKING_INTERVAL_MS_BE, MATCHMAKING_MAX_WAIT_TIME_EXPANSION_MS_BE } from '../constants';

export interface PlayerQueueEntryBE {
  playerId: string;
  rating: number;
  deckId?: string; // Or full deck details
  ws: WebSocket; // Use the imported WebSocket type
  timestamp: number;
}

const matchmakingQueue: PlayerQueueEntryBE[] = [];

export function addPlayerToQueue(playerEntry: PlayerQueueEntryBE): void {
  const existingIndex = matchmakingQueue.findIndex(p => p.playerId === playerEntry.playerId);
  if (existingIndex !== -1) {
    console.log(`MatchmakingService: Player ${playerEntry.playerId} already in queue, updating entry.`);
    matchmakingQueue[existingIndex] = playerEntry; // Update WebSocket object and timestamp
  } else {
    matchmakingQueue.push(playerEntry);
  }
  console.log(`MatchmakingService: Player ${playerEntry.playerId} (Rating: ${playerEntry.rating}) in queue. Queue size: ${matchmakingQueue.length}`);
  if (matchmakingQueue.length >= 2) {
    tryMatchPlayers();
  }
}

export function removePlayerFromQueue(playerId: string): void {
  const index = matchmakingQueue.findIndex(p => p.playerId === playerId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
    console.log(`MatchmakingService: Player ${playerId} removed from queue. Queue size: ${matchmakingQueue.length}`);
  }
}

function tryMatchPlayers() {
  if (matchmakingQueue.length < 2) return;

  console.log(`MatchmakingService: Attempting to match players. Queue size: ${matchmakingQueue.length}`);
  // Sort by rating to try and find closer matches first, then by timestamp for fairness for close ratings
  matchmakingQueue.sort((a, b) => {
    if (a.rating !== b.rating) return a.rating - b.rating;
    return a.timestamp - b.timestamp;
  });

  const matchedIndices = new Set<number>(); // To keep track of matched players' indices

  for (let i = 0; i < matchmakingQueue.length; i++) {
    if (matchedIndices.has(i)) continue; // Player already matched in this cycle

    const playerA = matchmakingQueue[i];

    for (let j = i + 1; j < matchmakingQueue.length; j++) {
      if (matchedIndices.has(j)) continue; // Player already matched

      const playerB = matchmakingQueue[j];

      const timeWaitedA = Date.now() - playerA.timestamp;
      const timeWaitedB = Date.now() - playerB.timestamp;
      const averageTimeWaited = (timeWaitedA + timeWaitedB) / 2;

      // Dynamically adjust rating range based on average wait time
      const currentRatingRange = Math.min(
        MATCHMAKING_MAX_RATING_RANGE_BE,
        MATCHMAKING_RATING_RANGE_INCREMENT_BE + Math.floor(averageTimeWaited / 5000) * MATCHMAKING_RATING_RANGE_INCREMENT_BE // Expand every 5s
      );
      
      const ratingDifference = Math.abs(playerA.rating - playerB.rating);

      if (ratingDifference <= currentRatingRange) {
        console.log(`MatchmakingService: Matched ${playerA.playerId} (Rating ${playerA.rating}, Waited ${Math.round(timeWaitedA/1000)}s) with ${playerB.playerId} (Rating ${playerB.rating}, Waited ${Math.round(timeWaitedB/1000)}s). Diff: ${ratingDifference}, Allowed: ${currentRatingRange}`);
        
        if (onMatchFoundCallback) {
          // Ensure to pass copies or ensure the original ws object isn't closed prematurely by the queue
          onMatchFoundCallback(playerA, playerB);
        }
        
        matchedIndices.add(i);
        matchedIndices.add(j);
        break; // playerA is matched, move to next in outer loop
      }
    }
  }
  
  // Remove matched players from the queue (iterate backwards to avoid index issues)
  for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
    if (matchedIndices.has(i)) {
      matchmakingQueue.splice(i, 1);
    }
  }
  if(matchedIndices.size > 0) console.log(`MatchmakingService: Queue size after matching: ${matchmakingQueue.length}`);
}

let onMatchFoundCallback: ((playerA: PlayerQueueEntryBE, playerB: PlayerQueueEntryBE) => void) | null = null;

export function setOnMatchFound(callback: (playerA: PlayerQueueEntryBE, playerB: PlayerQueueEntryBE) => void) {
  onMatchFoundCallback = callback;
}

setInterval(tryMatchPlayers, MATCHMAKING_INTERVAL_MS_BE);

console.log("Matchmaking service (matchmakingService.ts) loaded and running.");
