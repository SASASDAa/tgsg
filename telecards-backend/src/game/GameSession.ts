
// telecards-backend/src/game/GameSession.ts
import WebSocket from 'ws';
import { GameStateBE, PlayerActionBE, WebSocketMessageTypeBE, CardPrototypeBE, CardAbilityTypeBE, GameRewardBE } from '../types';
import { initializeGame, processPlayerAction } from './gameLogic';
import { PLAYER_HERO_TARGET_ID_BE, OPPONENT_HERO_TARGET_ID_BE, MOCK_XP_PER_WIN_BE, MOCK_XP_PER_BOT_WIN_BE, MOCK_XP_PER_LOSS_BE, MOCK_XP_PER_BOT_LOSS_BE, MOCK_RATING_CHANGE_WIN_BE, MOCK_RATING_CHANGE_LOSS_BE } from '../constants';
import { getPlayerData, updatePlayerXPAndLevel, addKrendiCoins } from '../services/playerService'; // For post-game updates
import PlayerModel from '../models/Player'; // Added import


export interface PlayerConnectionInfo {
  ws: WebSocket;
  playerId: string; // This should be the persistent user ID (e.g., Telegram User ID)
  name: string;
  avatarUrl?: string;
  deckCardIds: string[]; // Array of CardPrototypeBE IDs
  rating?: number; // For XP/rating changes
  isBot?: boolean; // Flag for bot players
}

export class GameSession {
  private gameId: string;
  private player1: PlayerConnectionInfo;
  private player2: PlayerConnectionInfo;
  private gameState: GameStateBE;
  private turnTimer: NodeJS.Timeout | null = null;
  private readonly TURN_DURATION_MS = 45000; // 45 seconds per turn


  constructor(p1ConnInfo: PlayerConnectionInfo, p2ConnInfo: PlayerConnectionInfo) {
    this.gameId = `gs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.player1 = p1ConnInfo;
    this.player2 = p2ConnInfo;

    this.gameState = initializeGame(
      { id: p1ConnInfo.playerId, name: p1ConnInfo.name, avatarUrl: p1ConnInfo.avatarUrl, deckCardIds: p1ConnInfo.deckCardIds },
      { id: p2ConnInfo.playerId, name: p2ConnInfo.name, avatarUrl: p2ConnInfo.avatarUrl, deckCardIds: p2ConnInfo.deckCardIds },
      p2ConnInfo.isBot ? 'bot' : 'human' // Assuming player2 could be a bot
    );
    // Ensure correct player assignment in GameStateBE if initializeGame is generic
    if (this.gameState.player.id !== p1ConnInfo.playerId) {
        // Swap if initializeGame assigned p2 as "player" and p1 as "opponent"
        [this.gameState.player, this.gameState.opponent] = [this.gameState.opponent, this.gameState.player];
    }


    console.log(`GameSession ${this.gameId} created for ${p1ConnInfo.name} vs ${p2ConnInfo.name}`);
    this.setupMessageHandlers();
    this.broadcastFullGameState("Initial game state");
    this.startTurnTimer();
  }

  private setupMessageHandlers() {
    [this.player1, this.player2].forEach(playerConn => {
      if (playerConn.isBot) return; // Bots don't send messages

      playerConn.ws.on('message', (message: string) => {
        try {
          const actionData = JSON.parse(message);
          if (actionData.type === WebSocketMessageTypeBE.PLAYER_ACTION) {
            if (this.gameState.currentTurnPlayerId === playerConn.playerId && !this.gameState.isGameOver) {
              this.handlePlayerAction(playerConn.playerId, actionData.payload as PlayerActionBE);
            } else if (this.gameState.isGameOver) {
                playerConn.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.ERROR, payload: {message: 'Game is over. No more actions allowed.'}}));
            } else {
                playerConn.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.ERROR, payload: {message: 'Not your turn.'}}));
            }
          }
        } catch (error) {
          console.error(`GameSession ${this.gameId}: Failed to parse message from ${playerConn.playerId}:`, message, error);
          if(playerConn.ws.readyState === WebSocket.OPEN) playerConn.ws.send(JSON.stringify({type: WebSocketMessageTypeBE.ERROR, payload: {message: 'Invalid message format.'}}));
        }
      });

      playerConn.ws.on('close', () => this.handlePlayerDisconnect(playerConn.playerId));
      playerConn.ws.on('error', (error) => {
        console.error(`GameSession ${this.gameId}: WebSocket error for player ${playerConn.playerId}:`, error);
        this.handlePlayerDisconnect(playerConn.playerId); // Treat error as disconnect
      });
    });
  }

  private handlePlayerAction(playerId: string, action: PlayerActionBE) {
    console.log(`GameSession ${this.gameId}: Player ${playerId} action:`, action.type, action);
    const previousTurnPlayerId = this.gameState.currentTurnPlayerId;
    this.gameState = processPlayerAction(this.gameState, action);

    if (this.gameState.currentTurnPlayerId !== previousTurnPlayerId || action.type === 'END_TURN') {
      this.startTurnTimer(); // Reset timer for new turn or if turn ended
    }

    this.broadcastFullGameState(`Action: ${action.type}`);

    if (this.gameState.isGameOver) {
      this.endGame();
    } else if (this.gameState.opponentType === 'bot' && this.gameState.currentTurnPlayerId === this.player2.playerId && this.player2.isBot) {
        this.scheduleBotAction();
    }
  }

  private scheduleBotAction() {
    if (!this.player2.isBot || this.gameState.isGameOver) return;
    console.log(`GameSession ${this.gameId}: Scheduling bot action for ${this.player2.name}`);
    setTimeout(() => {
        if (this.gameState.isGameOver || this.gameState.currentTurnPlayerId !== this.player2.playerId) return; // Check again before acting
        const botAction = this.determineBotAction();
        if(botAction) {
            this.handlePlayerAction(this.player2.playerId, botAction);
        } else { // If bot has no action, end turn
            this.handlePlayerAction(this.player2.playerId, {type: 'END_TURN'});
        }
    }, 1000 + Math.random() * 1500); // Simulate bot thinking time
  }

  private determineBotAction(): PlayerActionBE | null {
      const bot = this.gameState.currentTurnPlayerId === this.gameState.player.id ? this.gameState.player : this.gameState.opponent;
      if (bot.id !== this.player2.playerId) return {type: 'END_TURN'}; // Safety: ensure it's bot's turn

      // 1. Try to play a card if possible
      const playableCards = bot.hand.filter(c => c.cost <= bot.mana && (c.attack === undefined || bot.board.length < 7));
      if (playableCards.length > 0) {
          playableCards.sort((a,b) => b.cost - a.cost); // Play highest cost card first (simple strategy)
          const cardToPlay = playableCards[0];
          return { type: 'PLAY_CARD', cardUuid: cardToPlay.uuid };
      }

      // 2. Try to attack with an available minion
      const availableAttackers = bot.board.filter(m => !m.hasAttacked && m.attack && m.currentHealth && m.currentHealth > 0);
      if (availableAttackers.length > 0) {
          const attacker = availableAttackers[0]; // Simplistic: first available attacker
          // Simplistic target: opponent hero if no taunts, otherwise first taunt, else first minion
          const opponentPlayer = this.gameState.player.id === bot.id ? this.gameState.opponent : this.gameState.player;
          const opponentTaunts = opponentPlayer.board.filter(m => m.abilities.some(a => a.type === CardAbilityTypeBE.Taunt) && m.currentHealth && m.currentHealth > 0);
          
          let targetUuid: string;
          if (opponentTaunts.length > 0) {
              targetUuid = opponentTaunts[0].uuid;
          } else if (opponentPlayer.board.length > 0) {
              targetUuid = opponentPlayer.board[0].uuid;
          } else {
              targetUuid = opponentPlayer.id === this.gameState.player.id ? PLAYER_HERO_TARGET_ID_BE : OPPONENT_HERO_TARGET_ID_BE;
          }
          return { type: 'ATTACK', attackerUuid: attacker.uuid, targetUuid };
      }
      
      // 3. If nothing else, end turn
      return { type: 'END_TURN' };
  }


  private broadcastFullGameState(reason: string) {
    const stateMessage = JSON.stringify({
      type: WebSocketMessageTypeBE.GAME_STATE_UPDATE,
      payload: this.gameState
    });
    if(this.player1.ws.readyState === WebSocket.OPEN && !this.player1.isBot) this.player1.ws.send(stateMessage);
    if(this.player2.ws.readyState === WebSocket.OPEN && !this.player2.isBot) this.player2.ws.send(stateMessage);
    console.log(`GameSession ${this.gameId}: Broadcasted game state (${reason}). Turn: ${this.gameState.turnNumber}, Current: ${this.gameState.currentTurnPlayerId}`);
  }
  
  private startTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    if (this.gameState.isGameOver) return;

    const currentPlayerIsBot = (this.gameState.currentTurnPlayerId === this.player1.playerId && this.player1.isBot) ||
                               (this.gameState.currentTurnPlayerId === this.player2.playerId && this.player2.isBot);
    if(currentPlayerIsBot) return; // No timer for bot turns in this simplified version

    this.turnTimer = setTimeout(() => {
      if (this.gameState.isGameOver) return;
      
      console.log(`GameSession ${this.gameId}: Player ${this.gameState.currentTurnPlayerId} timed out.`);
      this.gameState.log.push(`${this.gameState.currentTurnPlayerId} ran out of time!`);
      // Auto-end turn
      this.handlePlayerAction(this.gameState.currentTurnPlayerId, { type: 'END_TURN' });
    }, this.TURN_DURATION_MS);
  }


  private async handlePlayerDisconnect(disconnectedPlayerId: string) {
    if (this.gameState.isGameOver) return; // Game already ended

    console.log(`GameSession ${this.gameId}: Player ${disconnectedPlayerId} disconnected.`);
    this.gameState.isGameOver = true;
    this.gameState.winnerId = disconnectedPlayerId === this.player1.playerId ? this.player2.playerId : this.player1.playerId;
    this.gameState.log.push(`Player ${disconnectedPlayerId} disconnected. ${this.gameState.winnerId} wins by default.`);
    
    this.endGame();
  }

  private async endGame() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    console.log(`GameSession ${this.gameId}: Game ended. Winner: ${this.gameState.winnerId}`);
    
    const gameOverMessage = JSON.stringify({
      type: WebSocketMessageTypeBE.GAME_OVER,
      payload: { winnerId: this.gameState.winnerId, matchId: this.gameId }
    });

    if (!this.player1.isBot && this.player1.ws.readyState === WebSocket.OPEN) this.player1.ws.send(gameOverMessage);
    if (!this.player2.isBot && this.player2.ws.readyState === WebSocket.OPEN) this.player2.ws.send(gameOverMessage);

    // Process XP and rewards for human players
    await this.processPostGameUpdates(this.player1);
    await this.processPostGameUpdates(this.player2);

    // Clean up resources (e.g., notify a GameSessionManager to remove this session)
    // For now, just log. The WebSocket connections might be closed by clients or server after a delay.
     console.log(`GameSession ${this.gameId}: Cleaned up.`);
  }
  
  private async processPostGameUpdates(playerConnInfo: PlayerConnectionInfo) {
    if (playerConnInfo.isBot) return;

    const playerCurrentData = await getPlayerData(playerConnInfo.playerId);
    if (!playerCurrentData || !this.gameState.winnerId) return;

    const isWinner = playerConnInfo.playerId === this.gameState.winnerId;
    const opponentWasBot = (playerConnInfo.playerId === this.player1.playerId && this.player2.isBot) || (playerConnInfo.playerId === this.player2.playerId && this.player1.isBot);

    let xpGained = 0;
    let ratingChange = 0;

    if (isWinner) {
      xpGained = opponentWasBot ? MOCK_XP_PER_BOT_WIN_BE : MOCK_XP_PER_WIN_BE;
      ratingChange = opponentWasBot ? 0 : MOCK_RATING_CHANGE_WIN_BE;
    } else {
      xpGained = opponentWasBot ? MOCK_XP_PER_BOT_LOSS_BE : MOCK_XP_PER_LOSS_BE;
      ratingChange = opponentWasBot ? 0 : MOCK_RATING_CHANGE_LOSS_BE;
    }
    
    const { updatedPlayer, grantedRewards } = await updatePlayerXPAndLevel(playerConnInfo.playerId, xpGained);
    
    if (updatedPlayer && ratingChange !== 0 && PlayerModel) { // Check if PlayerModel is defined
        await PlayerModel.update(playerConnInfo.playerId, { rating: Math.max(0, (updatedPlayer.rating || 0) + ratingChange) });
    }


    if (playerConnInfo.ws.readyState === WebSocket.OPEN) {
        playerConnInfo.ws.send(JSON.stringify({
            type: WebSocketMessageTypeBE.XP_UPDATE,
            payload: {
                xp: updatedPlayer?.xp,
                newLevel: updatedPlayer?.level,
                xpToNextLevel: updatedPlayer?.xpToNextLevel,
                rating: updatedPlayer?.rating, 
                rewardsGranted: grantedRewards, // Corrected: assign the variable itself
            }
        }));
    }
}


  public getGameId(): string {
    return this.gameId;
  }

  // Method to allow external check if a player is part of this session
  public hasPlayer(playerId: string): boolean {
      return this.player1.playerId === playerId || this.player2.playerId === playerId;
  }
}

console.log("GameSession class (GameSession.ts) loaded.");
