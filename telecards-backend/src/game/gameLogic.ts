// telecards-backend/src/game/gameLogic.ts
import { GameStateBE, PlayerBE, CardPrototypeBE, CardInstanceBE, PlayerActionBE, PlayCardActionPayloadBE, AttackActionPayloadBE, CardAbilityTypeBE } from '../types';
import { INITIAL_PLAYER_HEALTH_BE, MAX_MANA_BE, MAX_CARDS_IN_HAND_BE, MAX_MINIONS_ON_BOARD_BE, STARTING_HAND_SIZE_P1_BE, STARTING_HAND_SIZE_P2_BE, OPPONENT_HERO_TARGET_ID_BE, PLAYER_HERO_TARGET_ID_BE, BURNOUT_DAMAGE_START_BE, getCardPrototypeByIdBE, ALL_CARDS_POOL_BE_RAW } from '../constants';

function createCardInstance(prototype: CardPrototypeBE): CardInstanceBE {
  return {
    ...prototype,
    uuid: crypto.randomUUID(),
    currentHealth: prototype.health,
    maxHealth: prototype.health,
    isPlayed: false,
    hasAttacked: false,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function initializeGame(
  player1Data: { id: string, name: string, avatarUrl?: string, deckCardIds: string[] },
  player2Data: { id: string, name: string, avatarUrl?: string, deckCardIds: string[] },
  opponentType: 'human' | 'bot' = 'human'
): GameStateBE {
  
  const p1DeckPrototypes = player1Data.deckCardIds.map(id => getCardPrototypeByIdBE(id)).filter(Boolean) as CardPrototypeBE[];
  const p2DeckPrototypes = player2Data.deckCardIds.map(id => getCardPrototypeByIdBE(id)).filter(Boolean) as CardPrototypeBE[];

  const player1: PlayerBE = {
    id: player1Data.id,
    name: player1Data.name,
    avatarUrl: player1Data.avatarUrl,
    health: INITIAL_PLAYER_HEALTH_BE,
    maxHealth: INITIAL_PLAYER_HEALTH_BE,
    mana: 0, // Will be set to 1 before their first turn starts
    maxMana: 0,
    deck: shuffleArray([...p1DeckPrototypes]),
    hand: [],
    board: [],
    burnoutDamageCounter: 0,
  };

  const player2: PlayerBE = {
    id: player2Data.id,
    name: player2Data.name,
    avatarUrl: player2Data.avatarUrl,
    health: INITIAL_PLAYER_HEALTH_BE,
    maxHealth: INITIAL_PLAYER_HEALTH_BE,
    mana: 0,
    maxMana: 0,
    deck: shuffleArray([...p2DeckPrototypes]),
    hand: [],
    board: [],
    burnoutDamageCounter: 0,
  };

  // Initial hand draw
  for (let i = 0; i < STARTING_HAND_SIZE_P1_BE; i++) {
    if (player1.deck.length > 0) player1.hand.push(createCardInstance(player1.deck.shift()!));
  }
  for (let i = 0; i < STARTING_HAND_SIZE_P2_BE; i++) {
    if (player2.deck.length > 0) player2.hand.push(createCardInstance(player2.deck.shift()!));
  }
  
  // Player 1 (current player) starts with 1 mana
  player1.maxMana = 1;
  player1.mana = 1;

  console.log(`Game initialized: ${player1.name} vs ${player2.name}. ${player1.name} starts.`);

  return {
    gameId: `game_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
    player: player1, // This might change based on which player the GameSession considers "self"
    opponent: player2,
    currentTurnPlayerId: player1.id,
    turnNumber: 1,
    log: [`Game started! ${player1.name} vs ${player2.name}. ${player1.name} goes first.`],
    isGameOver: false,
    winnerId: undefined,
    opponentType: opponentType,
  };
}

export function processPlayerAction(currentGameState: GameStateBE, action: PlayerActionBE): GameStateBE {
  const newState: GameStateBE = JSON.parse(JSON.stringify(currentGameState)); // Deep copy
  
  const actingPlayer = newState.currentTurnPlayerId === newState.player.id ? newState.player : newState.opponent;
  const otherPlayer = newState.currentTurnPlayerId === newState.player.id ? newState.opponent : newState.player;

  if (newState.isGameOver) {
    newState.log.push("Action attempted after game over.");
    return newState;
  }
  
  switch (action.type) {
    case 'PLAY_CARD': {
      const { cardUuid, position, targetUuid } = action as PlayCardActionPayloadBE;
      const cardIndex = actingPlayer.hand.findIndex(c => c.uuid === cardUuid);
      if (cardIndex === -1) {
        newState.log.push(`${actingPlayer.name} tried to play a card not in hand: ${cardUuid}.`);
        return newState;
      }
      const cardToPlay = actingPlayer.hand[cardIndex];

      if (actingPlayer.mana < cardToPlay.cost) {
        newState.log.push(`${actingPlayer.name} has not enough mana for ${cardToPlay.name} (needs ${cardToPlay.cost}, has ${actingPlayer.mana}).`);
        return newState;
      }
      if (cardToPlay.attack !== undefined && actingPlayer.board.length >= MAX_MINIONS_ON_BOARD_BE) {
        newState.log.push(`${actingPlayer.name}'s board is full, cannot play ${cardToPlay.name}.`);
        return newState;
      }

      actingPlayer.mana -= cardToPlay.cost;
      actingPlayer.hand.splice(cardIndex, 1);
      
      const playedInstance = createCardInstance(cardToPlay); // Re-create instance for board
      playedInstance.isPlayed = true;
      // Minions enter board unable to attack unless they have Charge.
      playedInstance.hasAttacked = !playedInstance.abilities.some(a => a.type === CardAbilityTypeBE.Charge);


      if (playedInstance.attack !== undefined) { // It's a minion
        actingPlayer.board.splice(position ?? actingPlayer.board.length, 0, playedInstance);
        newState.log.push(`${actingPlayer.name} played minion ${playedInstance.name}.`);
      } else { // It's a spell (conceptual, apply effect immediately)
        newState.log.push(`${actingPlayer.name} cast spell ${playedInstance.name}.`);
        // Apply spell effect here (e.g. deal damage, draw card)
        // This part needs to be significantly expanded for actual spell effects.
        // For now, let's imagine a simple "Deal 2 damage" spell if cost is 1 and no attack.
        if (playedInstance.cost === 1 && targetUuid === OPPONENT_HERO_TARGET_ID_BE) {
            otherPlayer.health -=2;
            newState.log.push(`${playedInstance.name} dealt 2 damage to ${otherPlayer.name}.`);
        }
      }

      // Basic Battlecry examples (can be expanded)
      if (playedInstance.abilities.some(a => a.type === CardAbilityTypeBE.Battlecry)) {
        if (playedInstance.id === 'r004') { // Tapping Hamster: Draw 2 cards
          for (let i = 0; i < 2; i++) drawCard(actingPlayer, newState.log);
        } else if (playedInstance.id === 'e001') { // Smooth Scammer: Summons a 'Shill Bot'
            if (actingPlayer.board.length < MAX_MINIONS_ON_BOARD_BE) {
                const shillBotProto = getCardPrototypeByIdBE('c002');
                if (shillBotProto) {
                    const shillBotInstance = createCardInstance(shillBotProto);
                    shillBotInstance.isPlayed = true;
                    shillBotInstance.hasAttacked = true; // Assume summoning sickness
                    actingPlayer.board.push(shillBotInstance);
                    newState.log.push(`${playedInstance.name}'s Battlecry summoned a Shill Bot.`);
                }
            }
        }
        // Add more battlecries
      }

      break;
    }

    case 'ATTACK': {
      const { attackerUuid, targetUuid } = action as AttackActionPayloadBE;
      const attacker = actingPlayer.board.find(m => m.uuid === attackerUuid);
      if (!attacker || attacker.hasAttacked || !attacker.currentHealth || attacker.currentHealth <= 0 || !attacker.attack) {
        newState.log.push(`${actingPlayer.name} tried to attack with an invalid/exhausted minion: ${attacker?.name || attackerUuid}.`);
        return newState;
      }

      let targetIsHero = false;
      let targetEntity: PlayerBE | CardInstanceBE | null = null;

      if (targetUuid === OPPONENT_HERO_TARGET_ID_BE) {
        targetEntity = otherPlayer;
        targetIsHero = true;
      } else if (targetUuid === PLAYER_HERO_TARGET_ID_BE) { // Should not happen if attacking own hero
        newState.log.push(`${actingPlayer.name} cannot attack their own hero.`);
        return newState;
      } else {
        targetEntity = otherPlayer.board.find(m => m.uuid === targetUuid && m.currentHealth && m.currentHealth > 0);
      }

      if (!targetEntity) {
        newState.log.push(`${actingPlayer.name}'s target ${targetUuid} not found or invalid.`);
        return newState;
      }
      
      newState.log.push(`${actingPlayer.name}'s ${attacker.name} (Atk: ${attacker.attack}) attacks ${targetIsHero ? otherPlayer.name : (targetEntity as CardInstanceBE).name}.`);

      // Damage dealing
      if (targetIsHero) {
        (targetEntity as PlayerBE).health -= attacker.attack;
      } else { // Target is a minion
        const targetMinion = targetEntity as CardInstanceBE;
        if (targetMinion.currentHealth) targetMinion.currentHealth -= attacker.attack;
        if (attacker.currentHealth && targetMinion.attack && targetMinion.currentHealth > 0) { // Minion retaliates if it survives
          attacker.currentHealth -= targetMinion.attack;
          newState.log.push(`${targetMinion.name} retaliates for ${targetMinion.attack} damage.`);
        }
      }
      attacker.hasAttacked = true;

      // Check for deaths (minions)
      otherPlayer.board = otherPlayer.board.filter(m => {
          if(m.currentHealth && m.currentHealth <= 0) {
              newState.log.push(`${otherPlayer.name}'s ${m.name} was destroyed.`);
              // Trigger Deathrattles here if any
              return false;
          }
          return true;
      });
      actingPlayer.board = actingPlayer.board.filter(m => {
          if(m.currentHealth && m.currentHealth <= 0) {
              newState.log.push(`${actingPlayer.name}'s ${m.name} was destroyed.`);
              // Trigger Deathrattles here if any
              return false;
          }
          return true;
      });
      break;
    }

    case 'END_TURN': {
      newState.log.push(`${actingPlayer.name} ended their turn.`);
      newState.currentTurnPlayerId = otherPlayer.id;
      
      if (newState.currentTurnPlayerId === newState.player.id) { // Assuming player1 is `newState.player`
        newState.turnNumber += 1;
      }
      
      // New current player (otherPlayer) starts their turn
      otherPlayer.maxMana = Math.min(MAX_MANA_BE, otherPlayer.maxMana + 1);
      otherPlayer.mana = otherPlayer.maxMana;
      otherPlayer.board.forEach(m => m.hasAttacked = false); // Ready minions for new turn
      
      drawCard(otherPlayer, newState.log);
      
      newState.log.push(`It's now ${otherPlayer.name}'s turn (Turn ${newState.turnNumber}). Mana: ${otherPlayer.mana}/${otherPlayer.maxMana}.`);
      break;
    }
  }

  // Check for game over
  if (newState.player.health <= 0) {
    newState.isGameOver = true;
    newState.winnerId = newState.opponent.id;
    newState.log.push(`${newState.player.name} has been defeated! ${newState.opponent.name} wins!`);
  } else if (newState.opponent.health <= 0) {
    newState.isGameOver = true;
    newState.winnerId = newState.player.id;
    newState.log.push(`${newState.opponent.name} has been defeated! ${newState.player.name} wins!`);
  }

  return newState;
}

function drawCard(player: PlayerBE, log: string[]): void {
  if (player.hand.length < MAX_CARDS_IN_HAND_BE) {
    if (player.deck.length > 0) {
      const drawnCardPrototype = player.deck.shift()!;
      player.hand.push(createCardInstance(drawnCardPrototype));
      log.push(`${player.name} drew a card.`);
    } else {
      // Burnout damage
      player.burnoutDamageCounter += BURNOUT_DAMAGE_START_BE; // Or make it increment (1, then 2, then 3)
      player.health -= player.burnoutDamageCounter;
      log.push(`🔥 ${player.name} is out of cards and takes ${player.burnoutDamageCounter} Burnout damage!`);
    }
  } else {
    log.push(`${player.name}'s hand is full, card burned!`);
    if (player.deck.length > 0) player.deck.shift(); // Burn the card from deck
  }
}


console.log("Game logic (gameLogic.ts) loaded.");
