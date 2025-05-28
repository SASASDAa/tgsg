
import { GameState, TelegramUser, WebSocketMessageToServer, WebSocketMessageFromServer, WebSocketMessageType, PlayerAction, Card, PlayerState, PlayCardActionPayload, AttackActionPayload, EndTurnActionPayload, GameReward, PlayerProfile, Deck, Friend, ChallengeIncomingPayload, ChallengeResponsePayload, ChallengeDeclinedNoticePayload } from '../types';
import { 
    generateMockGameState, 
    MAX_MANA, 
    MAX_CARDS_IN_HAND, 
    MAX_MINIONS_ON_BOARD,
    OPPONENT_HERO_TARGET_ID, 
    PLAYER_HERO_TARGET_ID,
    createCardInstance,
    MOCK_XP_PER_WIN, MOCK_XP_PER_BOT_WIN, MOCK_XP_PER_LOSS, MOCK_XP_PER_BOT_LOSS,
    MOCK_RATING_CHANGE_WIN, MOCK_RATING_CHANGE_LOSS,
    INITIAL_PLAYER_PROFILE, // Added import
    REWARDS_PER_LEVEL, LEVEL_XP_THRESHOLDS, calculateXpToNextLevel,
    generateRandomDeckIds,
    MAX_CARDS_PER_DECK,
    MOCK_FRIENDS 
} from '../constants';

type MessageCallback = (message: WebSocketMessageFromServer) => void;

class WebSocketService {
  private socket: WebSocket | null = null; // Mock, not a real WebSocket object
  private onMessageCallback: MessageCallback | null = null;
  private isConnected: boolean = false;
  private mockLatency = 250; 
  private mockGameState: GameState | null = null;
  
  private findingMatchTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private mockUser: TelegramUser | null = null;
  private mockUserProfile: PlayerProfile | null = null; 
  private mockPlayerDeckIds: string[] = [];
  private pendingChallenges: Map<string, { challengerId: string, challengerName: string, challengerAvatarUrl?:string, challengerRating?: number, friendId: string }> = new Map();


  // Connect now primarily sets context and the onMessage callback for the current flow
  public connect(
    url: string, // URL is mostly for show in this mock
    user: TelegramUser, 
    profile: PlayerProfile, 
    playerActiveDeck: Deck | undefined, 
    onOpen: () => void, 
    onMessage: MessageCallback, 
    onError: (error: Event | { message: string }) => void, // Allow custom error object
    onClose: () => void 
  ): void {
    console.log(`WS: Mock connect initiated for user ${user.firstName} (Rating: ${profile.rating}). URL: ${url}`);
    
    this.mockUser = user;
    this.mockUserProfile = profile;
    this.mockPlayerDeckIds = playerActiveDeck ? playerActiveDeck.cardIds : generateRandomDeckIds(); // Fallback
    
    // Clear previous message callback if any, to avoid stale handlers
    this.onMessageCallback = null;
    this.setOnMessageCallback(onMessage);

    setTimeout(() => {
      this.isConnected = true;
      onOpen(); // Call onOpen to trigger actions like sending FIND_MATCH
      console.log('WS: Mock connection "established". Context set.');
    }, this.mockLatency / 2); // Shorter latency for connect itself
  }

  public setOnMessageCallback(callback: MessageCallback | null): void {
    this.onMessageCallback = callback;
  }

  // Used by GameBoard to set its game state directly (e.g., for bot matches or after MATCH_FOUND)
  public setExternalGameState(gameState: GameState, user?: TelegramUser, profile?: PlayerProfile): void {
    this.mockGameState = gameState;
    if (user) this.mockUser = user; // Update context if provided
    if (profile) this.mockUserProfile = profile; // Update context if provided
    
    // For bot games or externally set games, mark as "connected" for action processing.
    this.isConnected = true; 

    console.log('WS: External game state set. Current Turn:', this.mockGameState.currentTurn, "Opponent type:", this.mockGameState.opponentType);

    if (this.mockGameState &&
        this.mockGameState.opponentType === 'bot' &&
        this.mockGameState.currentTurn === this.mockGameState.opponent.id &&
        !this.mockGameState.isGameOver) {
      this.simulateOpponentTurn();
    }
  }

  public sendMessage(message: WebSocketMessageToServer): void {
    if (message.type === WebSocketMessageType.PLAYER_ACTION && !this.mockGameState) {
        const connectionContext = this.isConnected ? "connected" : "not connected";
        console.error(`WS: PLAYER_ACTION attempted when ${connectionContext} and no game state:`, message);
        this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: `Cannot perform player action: no game is active.`}});
        return;
    }

    console.log('WS: Sending message:', message);

    switch (message.type) {
      case WebSocketMessageType.FIND_MATCH:
        if (!this.mockUser || !this.mockUserProfile) { 
            this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: "User context not set for matchmaking."}});
            return;
        }
        this.handleFindMatch(this.mockUserProfile.rating, this.mockPlayerDeckIds);
        break;
      case WebSocketMessageType.CANCEL_FIND_MATCH:
        if (this.findingMatchTimeout) {
            clearTimeout(this.findingMatchTimeout);
            this.findingMatchTimeout = null;
            console.log('WS: Matchmaking cancelled by client.');
        }
        break;
      case WebSocketMessageType.PLAYER_ACTION:
        this.handlePlayerAction(message.payload);
        break;
      case WebSocketMessageType.CHALLENGE_FRIEND:
        if (!this.mockUser || !this.mockUserProfile || !this.mockPlayerDeckIds) { 
            this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: "User context not set for friend challenge."}});
            return;
        }
        this.handleChallengeFriend(message.payload.friendId);
        break;
      case WebSocketMessageType.CHALLENGE_RESPONSE:
        this.handleChallengeResponse(message.payload as ChallengeResponsePayload);
        break;
    }
  }
  
  private handleFindMatch(playerRating: number | undefined, playerDeckIds: string[]): void {
    if (!this.onMessageCallback || !this.mockUser || !this.mockUserProfile) return;

    console.log('WS: Server received FIND_MATCH. Simulating matchmaking (player rating:', playerRating || 'N/A', ')');
    
    if (this.findingMatchTimeout) clearTimeout(this.findingMatchTimeout);
    
    this.findingMatchTimeout = setTimeout(() => {
      if (!this.mockUser || !this.onMessageCallback || !this.mockUserProfile) return;
      
      const opponentRating = Math.max(0, (playerRating || 1000) + Math.floor(Math.random() * 300) - 150);
      
      const foundGameState = generateMockGameState(
        `pvp_match_${crypto.randomUUID().slice(0,8)}`, 
        this.mockUser,
        this.mockUserProfile, 
        playerDeckIds,
        `Opponent ${opponentRating}`, 
        `human_opp_${crypto.randomUUID().slice(0,4)}`,
        'human', 
        `https://picsum.photos/seed/pvpopp_found/80/80`,
        opponentRating,
        Math.max(1, this.mockUserProfile.level + Math.floor(Math.random()*2)-1) 
      );
      this.onMessageCallback({
        type: WebSocketMessageType.MATCH_FOUND,
        payload: foundGameState, 
      });
      this.findingMatchTimeout = null;
      console.log('WS: PvP Match found! Sending initial game state.');
    }, this.mockLatency * 6);
  }

  private handleChallengeFriend(friendId: string): void {
    if (!this.onMessageCallback || !this.mockUser || !this.mockUserProfile) {
        console.error("WS: Critical data missing for friend challenge initiation.");
        this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: "Context for friend challenge missing."}});
        return;
    }
    const challengeId = `challenge_${crypto.randomUUID().slice(0,8)}`;
    this.pendingChallenges.set(challengeId, { 
        challengerId: this.mockUser.id.toString(), 
        challengerName: this.mockUserProfile.name || this.mockUser.firstName,
        challengerAvatarUrl: this.mockUserProfile.avatarUrl || this.mockUser.photoUrl,
        challengerRating: this.mockUserProfile.rating,
        friendId: friendId 
    });

    console.log(`WS: Simulating challenge (ID: ${challengeId}) to friend ${friendId}. Sending CHALLENGE_INCOMING to current client.`);
    
    // Simulate server sending CHALLENGE_INCOMING to the challenged friend (which is the current client in this mock)
    const payload: ChallengeIncomingPayload = {
      challengeId,
      challengerId: this.mockUser.id.toString(),
      challengerName: this.mockUserProfile.name || this.mockUser.firstName,
      challengerAvatarUrl: this.mockUserProfile.avatarUrl || this.mockUser.photoUrl,
      challengerRating: this.mockUserProfile.rating,
    };
    this.onMessageCallback({ type: WebSocketMessageType.CHALLENGE_INCOMING, payload });
  }

  private handleChallengeResponse(payload: ChallengeResponsePayload): void {
    if (!this.onMessageCallback || !this.mockUser || !this.mockUserProfile) {
      console.error("WS: Critical data missing for handling challenge response.");
      return;
    }
    
    const challengeDetails = this.pendingChallenges.get(payload.challengeId);
    if (!challengeDetails) {
        console.warn(`WS: Received response for unknown or expired challenge ID: ${payload.challengeId}`);
        this.onMessageCallback({ type: WebSocketMessageType.ERROR, payload: { message: `Challenge ID ${payload.challengeId} not found or expired.`}});
        return;
    }

    if (payload.accepted) {
        console.log(`WS: Challenge ${payload.challengeId} accepted by ${this.mockUser.firstName}. Generating match...`);
        
        const challengerUser: TelegramUser = { id: parseInt(challengeDetails.challengerId), firstName: challengeDetails.challengerName, photoUrl: challengeDetails.challengerAvatarUrl };
        const challengerProfile: PlayerProfile = { ...INITIAL_PLAYER_PROFILE, // Create a minimal profile for the challenger based on stored details
            name: challengeDetails.challengerName, 
            avatarUrl: challengeDetails.challengerAvatarUrl, 
            rating: challengeDetails.challengerRating || INITIAL_PLAYER_PROFILE.rating,
            level: MOCK_FRIENDS.find(f=>f.id === challengeDetails.challengerId)?.level || 1, // Mock level if available
            friendCode: MOCK_FRIENDS.find(f=>f.id === challengeDetails.challengerId)?.friendCode || "CHLNGER", // Mock friendcode
        };
        // The current user is the responder
        const responderUser = this.mockUser;
        const responderProfile = this.mockUserProfile;

        // Find a deck for the challenger (mock or fetch if possible)
        const challengerDeckIds = generateRandomDeckIds(); 

        const foundGameState = generateMockGameState(
            `friend_match_${payload.challengeId}`, 
            challengerUser, // Challenger is player1
            challengerProfile,
            challengerDeckIds, // Challenger's deck
            responderUser.firstName, // Responder is player2 (opponent for challenger)
            responderUser.id.toString(),
            'human',
            responderProfile.avatarUrl || responderUser.photoUrl,
            responderProfile.rating,
            responderProfile.level
        );
        
        // In a real scenario, MATCH_FOUND would be sent to *both* clients.
        // Here, we send it to the current client, which will handle it.
        this.onMessageCallback({ type: WebSocketMessageType.MATCH_FOUND, payload: foundGameState });
        console.log(`WS: Friend Match ${payload.challengeId} accepted & found! Sending initial game state.`);

    } else {
        console.log(`WS: Challenge ${payload.challengeId} declined by ${this.mockUser.firstName}. Notifying challenger.`);
        const declinedNoticePayload: ChallengeDeclinedNoticePayload = {
            challengeId: payload.challengeId,
            responderName: this.mockUser.firstName
        };
        // In a real scenario, this would be sent to the original challenger.
        // Here, we send it to the current client to be handled by SocialScreen.
        this.onMessageCallback({ type: WebSocketMessageType.CHALLENGE_DECLINED_NOTICE, payload: declinedNoticePayload });
    }
    this.pendingChallenges.delete(payload.challengeId); // Clean up processed challenge
}


  private handlePlayerAction(payload: PlayerAction): void {
    if (!this.mockGameState || !this.mockUser || !this.mockUserProfile) {
        this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: "Game state or user context missing for player action."}});
        return;
    }

    let gameChanged = false;
    const isBotMatch = this.mockGameState.opponentType === 'bot';
    const currentPlayerId = this.mockGameState.currentTurn;
    const actingPlayer = currentPlayerId === this.mockGameState.player.id ? this.mockGameState.player : this.mockGameState.opponent;
    const otherPlayer = currentPlayerId === this.mockGameState.player.id ? this.mockGameState.opponent : this.mockGameState.player;
    
    if (payload.type === 'PLAY_CARD') {
        const cardToPlay = actingPlayer.hand.find(c => c.uuid === payload.cardUuid);
        if (cardToPlay && actingPlayer.mana >= cardToPlay.cost) {
            if (cardToPlay.attack !== undefined && actingPlayer.board.length >= MAX_MINIONS_ON_BOARD) {
                 this.onMessageCallback?.({type: WebSocketMessageType.ERROR, payload: {message: "Board is full."}});
                 return; 
            }
            actingPlayer.mana -= cardToPlay.cost;
            actingPlayer.hand = actingPlayer.hand.filter(c => c.uuid !== payload.cardUuid);
            const playedCardInstance: Card = { ...cardToPlay, isPlayed: true, currentHealth: cardToPlay.health, maxHealth: cardToPlay.health, hasAttacked: cardToPlay.abilities.some(a => a.type === 'CHARGE') ? false : true, };
            if (playedCardInstance.attack !== undefined) { actingPlayer.board.splice(payload.position ?? actingPlayer.board.length, 0, playedCardInstance); }
            this.mockGameState.log.push(`${actingPlayer.name} played ${cardToPlay.name}.`);
            gameChanged = true;

            if (cardToPlay.id === 'r004') {
              const cardsToDraw = 2;
              for (let i = 0; i < cardsToDraw; i++) {
                if (actingPlayer.deck.length > 0 && actingPlayer.hand.length < MAX_CARDS_IN_HAND) {
                  const drawnCard = actingPlayer.deck.shift();
                  if (drawnCard) {
                    actingPlayer.hand.push(drawnCard);
                    this.mockGameState.log.push(`${actingPlayer.name} drew a card due to ${cardToPlay.name}'s Battlecry.`);
                  }
                } else if (actingPlayer.deck.length === 0) { // Check for burnout even during battlecry draw attempt
                    actingPlayer.burnoutDamageCounter++;
                    actingPlayer.health -= actingPlayer.burnoutDamageCounter;
                    this.mockGameState.log.push(`⚠️ ${actingPlayer.name} is in Burnout and took ${actingPlayer.burnoutDamageCounter} damage attempting to draw for ${cardToPlay.name}!`);
                    if (actingPlayer.burnoutDamageCounter === 1 && actingPlayer.deck.length === 0) { // Only initial warning if truly out of deck
                         this.mockGameState.log.push(`⚠️ ${actingPlayer.name} has exhausted their deck! Burnout has begun. Each turn will now hurt!`);
                    }
                }
              }
            }
        }
    } else if (payload.type === 'ATTACK') {
        const attacker = actingPlayer.board.find(m => m.uuid === payload.attackerUuid);
        if (attacker && attacker.attack && !attacker.hasAttacked && attacker.currentHealth && attacker.currentHealth > 0) {
            let targetEntity: Card | PlayerState | null = null; 
            const targetIsPlayerHero = payload.targetUuid === PLAYER_HERO_TARGET_ID;
            const targetIsOpponentHero = payload.targetUuid === OPPONENT_HERO_TARGET_ID;
            if ((targetIsOpponentHero && actingPlayer.id === this.mockGameState.player.id) || (targetIsPlayerHero && actingPlayer.id === this.mockGameState.opponent.id)) { targetEntity = otherPlayer; } 
            else { targetEntity = otherPlayer.board.find(m => m.uuid === payload.targetUuid && m.currentHealth && m.currentHealth > 0) || null; }

            if (targetEntity && attacker.attack && (targetEntity as PlayerState).health !== undefined) {
                 const targetIsHero = 'deck' in targetEntity;
                 if (targetIsHero) (targetEntity as PlayerState).health -= attacker.attack;
                 else { 
                    const targetMinion = targetEntity as Card;
                    if (targetMinion.currentHealth) targetMinion.currentHealth -= attacker.attack;
                    if (targetMinion.attack && attacker.currentHealth && targetMinion.currentHealth > 0) attacker.currentHealth -= targetMinion.attack;
                 }
                 if (!targetIsHero && (targetEntity as Card).currentHealth! <= 0) otherPlayer.board = otherPlayer.board.filter(m => m.uuid !== payload.targetUuid);
                 else if (targetIsHero && (targetEntity as PlayerState).health <=0) { this.mockGameState.isGameOver = true; this.mockGameState.winner = actingPlayer.id; }
                 if (attacker.currentHealth! <=0) actingPlayer.board = actingPlayer.board.filter(m => m.uuid !== attacker.uuid);
                 else if (attacker.uuid){ const attackerOnBoard = actingPlayer.board.find(m => m.uuid === attacker.uuid); if (attackerOnBoard) attackerOnBoard.hasAttacked = true; }
                 this.mockGameState.log.push(`${actingPlayer.name}'s ${attacker.name} attacked.`);
                 gameChanged = true;
            }
        }
    } else if (payload.type === 'END_TURN') {
        this.mockGameState.currentTurn = otherPlayer.id; 
        if(this.mockGameState.currentTurn === this.mockGameState.player.id) this.mockGameState.turnNumber += 1;
        
        otherPlayer.board.forEach(m => m.hasAttacked = false); 
        otherPlayer.maxMana = Math.min(MAX_MANA, otherPlayer.maxMana + 1);
        otherPlayer.mana = otherPlayer.maxMana;

        // Burnout/Draw Logic for otherPlayer (who is starting their turn)
        if (otherPlayer.deck.length === 0) {
            otherPlayer.burnoutDamageCounter++;
            otherPlayer.health -= otherPlayer.burnoutDamageCounter;
            this.mockGameState.log.push(`🔥 ${otherPlayer.name} takes ${otherPlayer.burnoutDamageCounter} Burnout damage.`);
            if (otherPlayer.burnoutDamageCounter === 1) {
                this.mockGameState.log.push(`⚠️ ${otherPlayer.name} has exhausted their deck! Burnout has begun. Each turn will now hurt!`);
            }
        } else if (otherPlayer.hand.length < MAX_CARDS_IN_HAND) {
            const drawnCard = otherPlayer.deck.shift();
            if (drawnCard) {
                otherPlayer.hand.push(drawnCard);
                // this.mockGameState.log.push(`${otherPlayer.name} drew a card.`); // Optional: Can be noisy
            }
        }
        
        this.mockGameState.log.push(`${actingPlayer.name} ended turn. ${otherPlayer.name}'s turn.`);
        gameChanged = true;
        if (this.mockGameState.currentTurn === this.mockGameState.opponent.id && !this.mockGameState.isGameOver && isBotMatch) this.simulateOpponentTurn();
    }

    if (!this.mockGameState.isGameOver) { 
        if (this.mockGameState.player.health <= 0) { this.mockGameState.isGameOver = true; this.mockGameState.winner = this.mockGameState.opponent.id; }
        else if (this.mockGameState.opponent.health <= 0) { this.mockGameState.isGameOver = true; this.mockGameState.winner = this.mockGameState.player.id; }
    }

    if (gameChanged && this.onMessageCallback) {
        setTimeout(() => { 
            if (!this.onMessageCallback || !this.mockGameState) return;
            this.onMessageCallback({ type: WebSocketMessageType.GAME_STATE_UPDATE, payload: { ...this.mockGameState } });
            if (this.mockGameState.isGameOver) {
                this.onMessageCallback({ type: WebSocketMessageType.GAME_OVER, payload: { winner: this.mockGameState.winner!, matchId: this.mockGameState.matchId }});
                this.sendXpUpdate(this.mockGameState.winner === this.mockGameState.player.id ? 'win' : 'loss', isBotMatch);
            }
        }, this.mockLatency / (isBotMatch ? 2 : 1) ); 
    }
  }

  private sendXpUpdate(outcome: 'win' | 'loss', isBotGame: boolean) {
    if (!this.mockUser || !this.mockUserProfile || !this.onMessageCallback) return;
    const xpGained = outcome === 'win' ? (isBotGame ? MOCK_XP_PER_BOT_WIN : MOCK_XP_PER_WIN) : (isBotGame ? MOCK_XP_PER_BOT_LOSS : MOCK_XP_PER_LOSS);
    const ratingChange = isBotGame ? 0 : (outcome === 'win' ? MOCK_RATING_CHANGE_WIN : MOCK_RATING_CHANGE_LOSS);
    let tempProfile = { ...this.mockUserProfile };
    tempProfile.xp += xpGained;
    tempProfile.rating = Math.max(0, tempProfile.rating + ratingChange);
    const rewardsGranted: GameReward[] = [];
    let { xpForNextDisplay: nextLevelXpThresholdCurrent } = calculateXpToNextLevel(tempProfile.level, tempProfile.xp);
    while (tempProfile.xp >= nextLevelXpThresholdCurrent && LEVEL_XP_THRESHOLDS[tempProfile.level + 1] !== undefined) {
        tempProfile.level += 1;
        const levelRewards = REWARDS_PER_LEVEL[tempProfile.level];
        if (levelRewards) rewardsGranted.push(...levelRewards);
        nextLevelXpThresholdCurrent = calculateXpToNextLevel(tempProfile.level, tempProfile.xp).xpForNextDisplay;
    }
    tempProfile.xpToNextLevel = nextLevelXpThresholdCurrent;
    this.onMessageCallback({ type: WebSocketMessageType.XP_UPDATE, payload: { xp: tempProfile.xp, newLevel: tempProfile.level, xpToNextLevel: tempProfile.xpToNextLevel, rating: tempProfile.rating, rewardsGranted: rewardsGranted }});
    this.mockUserProfile = tempProfile; // Update internal profile state
  }

  private simulateOpponentTurn(): void { // Bot's turn logic
    if (!this.mockGameState || this.mockGameState.currentTurn !== this.mockGameState.opponent.id || this.mockGameState.isGameOver || this.mockGameState.opponentType !== 'bot') return;
    console.log("WS: Simulating Bot's turn...");
    setTimeout(() => { 
        if (!this.mockGameState || this.mockGameState.currentTurn !== this.mockGameState.opponent.id || this.mockGameState.isGameOver) return; 
        const opponent = this.mockGameState.opponent;
        // Note: Burnout/Draw for bot is handled when turn passes TO bot in handlePlayerAction 'END_TURN'
        
        // Bot play card logic
        const playableCards = opponent.hand.filter(c => c.cost <= opponent.mana && (c.attack === undefined || opponent.board.length < MAX_MINIONS_ON_BOARD));
        if (playableCards.length > 0) {
            const cardToPlay = playableCards.sort((a,b) => b.cost - a.cost)[0]; 
            this.handlePlayerAction({ type: 'PLAY_CARD', cardUuid: cardToPlay.uuid! }); 
            if (this.mockGameState.isGameOver) return;
        }
        
        // Bot attack logic
        const availableAttackers = opponent.board.filter(m => m.attack && !m.hasAttacked && m.currentHealth && m.currentHealth > 0);
        if (availableAttackers.length > 0 && !this.mockGameState.isGameOver) {
             for (const attacker of availableAttackers) { 
                if(this.mockGameState.isGameOver || attacker.hasAttacked) continue; // Check hasAttacked again as previous action might have been an attack
                let targetUuid: string;
                const playerMinionsWithTaunt = this.mockGameState.player.board.filter(m => m.abilities.some(a => a.type === 'TAUNT') && m.currentHealth && m.currentHealth > 0);
                const playerMinions = this.mockGameState.player.board.filter(m => m.currentHealth && m.currentHealth > 0);
                if (playerMinionsWithTaunt.length > 0) targetUuid = playerMinionsWithTaunt[Math.floor(Math.random() * playerMinionsWithTaunt.length)].uuid!;
                else if (playerMinions.length > 0) targetUuid = playerMinions[Math.floor(Math.random() * playerMinions.length)].uuid!;
                else targetUuid = PLAYER_HERO_TARGET_ID; 
                this.handlePlayerAction({ type: 'ATTACK', attackerUuid: attacker.uuid!, targetUuid });
                if (this.mockGameState.isGameOver) break; 
            }
        }

        // Bot end turn
        if (!this.mockGameState.isGameOver) this.handlePlayerAction({type: 'END_TURN'});
    }, this.mockLatency * 2 ); 
  }

  public close(): void {
    this.isConnected = false;
    if (this.findingMatchTimeout) {
      clearTimeout(this.findingMatchTimeout);
      this.findingMatchTimeout = null;
    }
    this.onMessageCallback = null; 
    this.mockUser = null;
    this.mockUserProfile = null;
    this.mockPlayerDeckIds = [];
    this.mockGameState = null; 
    this.pendingChallenges.clear();
    console.log('WS: Mock connection closed and context reset (mockGameState nulled, challenges cleared).');
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
