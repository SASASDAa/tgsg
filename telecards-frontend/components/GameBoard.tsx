
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, Card, GameState, WebSocketMessageType, WebSocketMessageFromServer, PlayCardActionPayload, AttackActionPayload, PlayerAction, PlayerState, GameReward, GameRewardType, AvatarFrame, CardBack } from '../types';
import CardComponent from './CardComponent';
import webSocketService from '../services/websocketService';
import telegramSDK from '../services/telegramSDK';
import { OPPONENT_HERO_TARGET_ID, PLAYER_HERO_TARGET_ID, MAX_MINIONS_ON_BOARD, MAX_MANA, SFX_TURN_START, SFX_CARD_PLAY, SFX_CARD_ATTACK, SFX_HERO_DAMAGE, SFX_CARD_DEATH, SFX_GAME_WIN, SFX_GAME_LOSE, SFX_CARD_DAMAGE, SFX_BUTTON_CLICK, getCardById, INITIAL_PLAYER_HEALTH, ALL_AVATAR_FRAMES, ALL_CARD_BACKS, DEFAULT_CARD_BACK_ID, DEFAULT_AVATAR_FRAME_ID } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { ManaGemIcon, MagicBookIcon, HourglassEndTurnIcon, KrendiCoinIcon, XPIcon, RatingIcon, ClockIcon } from '../assets/icons';
import soundService from '../services/soundService';

interface DraggedCardVisualInfo {
  card: Card;
  originalHandIndex: number;
  currentX: number;
  currentY: number;
  draggedElementRect: DOMRect;
}

interface AnimatingCardToBoardInfo {
  card: Card;
  startRect: { x: number, y: number, width: number, height: number };
  targetSlotRect: DOMRect;
  targetSlotIndex: number;
  targetAnimatedCardWidth: number;
  targetAnimatedCardHeight: number;
}

interface GameOverDetails {
  xpChange: number;
  ratingChange: number;
  krendiCoinReward: number;
  cardRewards: Card[];
  turns: number;
}

const TURN_DURATION = 45; // seconds

// Internal component for rendering Hero with Frame
const HeroAvatarWithFrame: React.FC<{heroPlayer: PlayerState, frameUrl?: string, isOpponent?: boolean}> = ({heroPlayer, frameUrl, isOpponent = false}) => (
  <div className="relative mr-2 sm:mr-2.5 w-10 h-10 sm:w-12 sm:h-12">
    <img
      src={heroPlayer.avatarUrl || `https://picsum.photos/seed/${heroPlayer.id}/70/70`}
      alt={heroPlayer.name}
      className="w-full h-full rounded-full object-cover shadow-hero-portrait filter brightness-90 saturate-90"
    />
    {frameUrl && (
      <img
        src={frameUrl}
        alt="Avatar Frame"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
      />
    )}
    <div className="absolute -bottom-1 -right-1 bg-hero-health-bar text-white text-[0.6rem] sm:text-xs font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border border-red-800 shadow-md z-20">{heroPlayer.health}</div>
  </div>
);


const GameBoard: React.FC = () => {
  const { currentMatchData, currentUser, playerProfile, activeScreen } = useAppState();
  const dispatch = useAppDispatch();
  const { t: translate } = useTranslations();

  const [selectedMinionOnBoardUuid, setSelectedMinionOnBoardUuid] = useState<string | null>(null);
  const [targetingMode, setTargetingMode] = useState<boolean>(false);
  const [hoveredHandCardUuid, setHoveredHandCardUuid] = useState<string | null>(null);
  const [selectedHandCardUuid, setSelectedHandCardUuid] = useState<string | null>(null);

  const [draggedCardVisualInfo, setDraggedCardVisualInfo] = useState<DraggedCardVisualInfo | null>(null);
  const [animatingCardToBoard, setAnimatingCardToBoard] = useState<AnimatingCardToBoardInfo | null>(null);

  const [attackerMinionUuidAnim, setAttackerMinionUuidAnim] = useState<string | null>(null);
  const [attackTargetAnim, setAttackTargetAnim] = useState<{ uuid: string, isHero: boolean } | null>(null);
  const [dyingMinionsAnim, setDyingMinionsAnim] = useState<Set<string>>(new Set());
  const [heroTakingDamageAnim, setHeroTakingDamageAnim] = useState<'player' | 'opponent' | null>(null);
  const [turnAnnouncement, setTurnAnnouncement] = useState<string | null>(null);
  const [gameOverDetails, setGameOverDetails] = useState<GameOverDetails | null>(null);
  const [currentTurnTimeLeft, setCurrentTurnTimeLeft] = useState<number | null>(null);
  const turnTimerIntervalRef = useRef<number | null>(null);


  const playerBoardSlotsRef = useRef<(HTMLDivElement | null)[]>(Array(MAX_MINIONS_ON_BOARD).fill(null));
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const prevMatchDataRef = useRef<GameState | null>(null);

  const equippedPlayerAvatarFrame = useMemo(() => {
    const frameId = playerProfile?.equippedAvatarFrameId || DEFAULT_AVATAR_FRAME_ID;
    return ALL_AVATAR_FRAMES.find(f => f.id === frameId);
  }, [playerProfile?.equippedAvatarFrameId]);

  const defaultCardBack = useMemo(() => {
    return ALL_CARD_BACKS.find(cb => cb.id === DEFAULT_CARD_BACK_ID);
  }, []);


  useEffect(() => {
    if (!currentMatchData || !currentUser || !playerProfile) {
      if (activeScreen === Screen.GameBoard) {
        dispatch({ type: 'NAVIGATE_TO', payload: Screen.Play });
        dispatch({ type: 'SET_ERROR', payload: translate('error_gameBoard_missingData') });
      }
      return;
    }
     if (currentMatchData.isGameOver && !gameOverDetails) {
        // Rely on XP_UPDATE to set it.
    }


    if (prevMatchDataRef.current && prevMatchDataRef.current.currentTurn !== currentMatchData.currentTurn) {
      const announcer = currentMatchData.currentTurn === currentMatchData.player.id ? currentMatchData.player.name : currentMatchData.opponent.name;
      setTurnAnnouncement(`${announcer}'s Turn!`);
      soundService.playSound(SFX_TURN_START, 0.6);
      setTimeout(() => setTurnAnnouncement(null), 1300);
      setSelectedHandCardUuid(null);
      setSelectedMinionOnBoardUuid(null);
      setTargetingMode(false);
    }

    if (prevMatchDataRef.current) {
      if (currentMatchData.player.health < prevMatchDataRef.current.player.health) {
          setHeroTakingDamageAnim('player');
          soundService.playSound(SFX_HERO_DAMAGE, 0.7);
          setTimeout(() => setHeroTakingDamageAnim(null), 250);
      }
      if (currentMatchData.opponent.health < prevMatchDataRef.current.opponent.health) {
          setHeroTakingDamageAnim('opponent');
          soundService.playSound(SFX_HERO_DAMAGE, 0.7);
          setTimeout(() => setHeroTakingDamageAnim(null), 250);
      }

      const detectAndAnimateDamage = (prevBoard: Card[], currentBoard: Card[]) => {
          prevBoard.forEach(prevMinion => {
              const currentMinion = currentBoard.find(m => m.uuid === prevMinion.uuid);
              if (currentMinion && prevMinion.currentHealth! > currentMinion.currentHealth!) {
                  setAttackTargetAnim(prev => prev?.uuid === currentMinion.uuid! ? null : ({ uuid: currentMinion.uuid!, isHero: false }));
                  soundService.playSound(SFX_CARD_DAMAGE, 0.6);
                  setTimeout(() => setAttackTargetAnim(null), 200);
              }
              if (!currentMinion && prevMinion.uuid) {
                  setDyingMinionsAnim(prev => new Set(prev).add(prevMinion.uuid!));
                  soundService.playSound(SFX_CARD_DEATH, 0.7);
                  setTimeout(() => setDyingMinionsAnim(s => { const newS = new Set(s); newS.delete(prevMinion.uuid!); return newS; }), 300);
              }
          });
      };
      detectAndAnimateDamage(prevMatchDataRef.current.player.board, currentMatchData.player.board);
      detectAndAnimateDamage(prevMatchDataRef.current.opponent.board, currentMatchData.opponent.board);
    }
    prevMatchDataRef.current = JSON.parse(JSON.stringify(currentMatchData));


    const handleWebSocketMessage = (message: WebSocketMessageFromServer) => {
      if (activeScreen !== Screen.GameBoard || !currentMatchData || !currentMatchData.matchId) return;
      if ((message.type === WebSocketMessageType.GAME_STATE_UPDATE || message.type === WebSocketMessageType.MATCH_FOUND) && message.payload.matchId !== currentMatchData.matchId) {
        return;
      }
      switch (message.type) {
        case WebSocketMessageType.GAME_STATE_UPDATE:
          dispatch({ type: 'UPDATE_GAME_STATE', payload: message.payload as Partial<GameState> });
          break;
        case WebSocketMessageType.GAME_OVER:
          dispatch({ type: 'UPDATE_GAME_STATE', payload: { isGameOver: true, winner: message.payload.winner, matchId: currentMatchData.matchId } });
          const outcome = message.payload.winner === currentMatchData.player.id ? 'win' : 'loss';
          soundService.playSound(outcome === 'win' ? SFX_GAME_WIN : SFX_GAME_LOSE, 0.8);
          setSelectedHandCardUuid(null); setSelectedMinionOnBoardUuid(null); setTargetingMode(false);
          break;
        case WebSocketMessageType.XP_UPDATE:
            const xpData = message.payload;
            const oldXP = playerProfile?.xp || 0;
            const oldRating = playerProfile?.rating || 0;

            setGameOverDetails({
                xpChange: xpData.xp - oldXP,
                ratingChange: xpData.rating - oldRating,
                krendiCoinReward: (xpData.rewardsGranted || []).reduce((acc: number, reward: GameReward) => reward.type === GameRewardType.KrendiCoins && reward.amount ? acc + reward.amount : acc, 0),
                cardRewards: (xpData.rewardsGranted || []).filter((r: GameReward) => r.type === GameRewardType.SpecificCard && r.cardId).map((r: GameReward) => getCardById(r.cardId!)!).filter(Boolean) as Card[],
                turns: currentMatchData.turnNumber || 0,
            });

            dispatch({ type: 'ADD_XP', payload: {
              xpGained: xpData.xp - oldXP,
              opponentType: currentMatchData.opponentType,
              outcome: xpData.rating > oldRating || xpData.xp > oldXP ? 'win' : 'loss'
            }});
            xpData.rewardsGranted?.forEach((reward: any) => { if(reward.type === GameRewardType.KrendiCoins && reward.amount) dispatch({ type: 'ADD_KRENDI_COINS', payload: reward.amount }); });
            break;
        case WebSocketMessageType.ERROR:
            dispatch({ type: 'SET_ERROR', payload: message.payload.message });
            setSelectedHandCardUuid(null); setSelectedMinionOnBoardUuid(null); setTargetingMode(false);
            break;
      }
    };
    webSocketService.setOnMessageCallback(handleWebSocketMessage);
    return () => { webSocketService.setOnMessageCallback(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, currentUser, playerProfile, translate, currentMatchData, activeScreen]);


  // Turn Timer Logic
  useEffect(() => {
    if (turnTimerIntervalRef.current) {
      clearInterval(turnTimerIntervalRef.current);
      turnTimerIntervalRef.current = null;
    }

    if (currentMatchData && !currentMatchData.isGameOver &&
        currentMatchData.currentTurn === currentMatchData.player.id &&
        currentMatchData.opponentType === 'human') {

      setCurrentTurnTimeLeft(TURN_DURATION);
      turnTimerIntervalRef.current = window.setInterval(() => {
        setCurrentTurnTimeLeft(prevTime => {
          if (prevTime === null || prevTime <= 1) {
            if (turnTimerIntervalRef.current) clearInterval(turnTimerIntervalRef.current);
            turnTimerIntervalRef.current = null;
            // Player ran out of time
            if (currentMatchData && currentMatchData.currentTurn === currentMatchData.player.id && !currentMatchData.isGameOver) {
                console.log("Time's up! Player loses.");
                const newLog = [...currentMatchData.log, `${currentMatchData.player.name} ${translate('gameBoard_ranOutOfTime')} ${currentMatchData.opponent.name} ${translate('gameBoard_winsSuffix')}`];
                dispatch({
                    type: 'UPDATE_GAME_STATE',
                    payload: {
                        isGameOver: true,
                        winner: currentMatchData.opponent.id,
                        log: newLog
                    }
                });
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      setCurrentTurnTimeLeft(null); // Not player's turn, bot match, or game over
    }

    return () => {
      if (turnTimerIntervalRef.current) {
        clearInterval(turnTimerIntervalRef.current);
        turnTimerIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchData?.currentTurn, currentMatchData?.isGameOver, currentMatchData?.player.id, currentMatchData?.opponentType, dispatch]);


  const sendPlayerAction = (action: PlayerAction) => {
    if (!currentMatchData || currentMatchData.currentTurn !== currentMatchData.player.id || currentMatchData.isGameOver) return;
    webSocketService.sendMessage({ type: WebSocketMessageType.PLAYER_ACTION, payload: action });
    // Action taken, so timer for this turn is conceptually satisfied / will be reset by turn end
     if (action.type === 'END_TURN' && turnTimerIntervalRef.current) {
        clearInterval(turnTimerIntervalRef.current);
        turnTimerIntervalRef.current = null;
        setCurrentTurnTimeLeft(null);
    }
  };

  const handleActualPlayCard = (cardUuid: string, position?: number) => {
    const cardPlayed = currentMatchData?.player.hand.find(c => c.uuid === cardUuid);
    if (cardPlayed) {
        soundService.playSound(SFX_CARD_PLAY, 0.7);
    }
    sendPlayerAction({ type: 'PLAY_CARD', cardUuid, position } as PlayCardActionPayload);
    setSelectedHandCardUuid(null);
  };

  const handleMinionAttack = (attacker: Card, targetUuid: string) => {
    if (!currentMatchData || !attacker.uuid || attacker.hasAttacked || !attacker.attack) return;
    soundService.playSound(SFX_CARD_ATTACK, 0.65);
    setAttackerMinionUuidAnim(attacker.uuid);
    setAttackTargetAnim({ uuid: targetUuid, isHero: targetUuid === OPPONENT_HERO_TARGET_ID || targetUuid === PLAYER_HERO_TARGET_ID });
    setTimeout(() => {
        sendPlayerAction({ type: 'ATTACK', attackerUuid: attacker.uuid!, targetUuid } as AttackActionPayload);
        setSelectedMinionOnBoardUuid(null); setTargetingMode(false); setSelectedHandCardUuid(null);
        setAttackerMinionUuidAnim(null); setAttackTargetAnim(null);
    }, 200);
  };

  const handleEndTurn = () => {
    soundService.playSound(SFX_BUTTON_CLICK, 0.5);
    sendPlayerAction({ type: 'END_TURN' });
    setSelectedMinionOnBoardUuid(null); setTargetingMode(false); setSelectedHandCardUuid(null);
    if (turnTimerIntervalRef.current) { // Explicitly clear timer on end turn
        clearInterval(turnTimerIntervalRef.current);
        turnTimerIntervalRef.current = null;
        setCurrentTurnTimeLeft(null);
    }
  };

  const selectMinionOnBoard = (minion: Card) => {
    if (!currentMatchData || minion.hasAttacked || !minion.attack || !minion.uuid || draggedCardVisualInfo || animatingCardToBoard || currentMatchData.currentTurn !== currentMatchData.player.id) return;
    soundService.playSound(SFX_BUTTON_CLICK, 0.4);
    setSelectedHandCardUuid(null);
    setSelectedMinionOnBoardUuid(minion.uuid);
    setTargetingMode(true);
  };

  const handleCardDragStart = useCallback((card: Card, event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handIndex: number) => {
    if (!currentMatchData || currentMatchData.currentTurn !== currentMatchData.player.id || currentMatchData.player.mana < card.cost || (card.attack !== undefined && currentMatchData.player.board.length >= MAX_MINIONS_ON_BOARD) || animatingCardToBoard) return;
    event.preventDefault();

    setSelectedHandCardUuid(null);
    setTargetingMode(false);
    setSelectedMinionOnBoardUuid(null);

    const point = 'touches' in event ? event.touches[0] : event;
    const cardElement = (event.currentTarget as HTMLElement).querySelector('.relative.flex.flex-col') || event.currentTarget;
    const rect = cardElement.getBoundingClientRect();

    setDraggedCardVisualInfo({
      card, originalHandIndex: handIndex,
      currentX: point.clientX, currentY: point.clientY,
      draggedElementRect: rect
    });
  }, [currentMatchData, animatingCardToBoard]);

  const handleCardDragging = useCallback((event: MouseEvent | TouchEvent) => {
    if (!draggedCardVisualInfo) return;
    event.preventDefault();
    const point = 'touches' in event ? event.touches[0] : event;
    setDraggedCardVisualInfo(prev => prev ? { ...prev, currentX: point.clientX, currentY: point.clientY } : null);
  }, [draggedCardVisualInfo]);

  const handleCardDragEnd = useCallback(() => {
    if (!draggedCardVisualInfo || !currentMatchData || !gameBoardRef.current || !playerBoardSlotsRef.current) {
        setDraggedCardVisualInfo(null);
        return;
    }

    let droppedOnValidSlot = false;
    const playerBoard = currentMatchData.player.board;

    if (draggedCardVisualInfo.card.attack !== undefined && playerBoard.length < MAX_MINIONS_ON_BOARD) {
        for (let i = 0; i < MAX_MINIONS_ON_BOARD; i++) {
            const slotElement = playerBoardSlotsRef.current[i];
            const isSlotOccupiedByExisting = playerBoard.some((m, boardIdx) => playerBoardSlotsRef.current[boardIdx] === slotElement);
            if (slotElement && !isSlotOccupiedByExisting) {
                const slotRect = slotElement.getBoundingClientRect();
                if (
                  draggedCardVisualInfo.currentX >= slotRect.left && draggedCardVisualInfo.currentX <= slotRect.right &&
                  draggedCardVisualInfo.currentY >= slotRect.top && draggedCardVisualInfo.currentY <= slotRect.bottom
                ) {
                  const isSmallViewport = window.matchMedia("(max-width: 639px)").matches;
                  const targetAnimatedCardWidth = isSmallViewport ? 48 : 56;
                  const targetAnimatedCardHeight = isSmallViewport ? 70 : 80;

                  setAnimatingCardToBoard({
                    card: draggedCardVisualInfo.card,
                    startRect: {
                        x: draggedCardVisualInfo.currentX - draggedCardVisualInfo.draggedElementRect.width / 2,
                        y: draggedCardVisualInfo.currentY - draggedCardVisualInfo.draggedElementRect.height / 2,
                        width: draggedCardVisualInfo.draggedElementRect.width,
                        height: draggedCardVisualInfo.draggedElementRect.height,
                    },
                    targetSlotRect: slotRect,
                    targetSlotIndex: i,
                    targetAnimatedCardWidth,
                    targetAnimatedCardHeight
                  });
                  droppedOnValidSlot = true;
                  break;
                }
            }
        }
    }
    setDraggedCardVisualInfo(null);

  }, [draggedCardVisualInfo, currentMatchData, playerBoardSlotsRef]);

  useEffect(() => {
    if (draggedCardVisualInfo) {
      document.addEventListener('mousemove', handleCardDragging);
      document.addEventListener('touchmove', handleCardDragging, { passive: false });
      document.addEventListener('mouseup', handleCardDragEnd);
      document.addEventListener('touchend', handleCardDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleCardDragging);
        document.removeEventListener('touchmove', handleCardDragging);
        document.removeEventListener('mouseup', handleCardDragEnd);
        document.removeEventListener('touchend', handleCardDragEnd);
      };
    }
  }, [draggedCardVisualInfo, handleCardDragging, handleCardDragEnd]);

  const handleHandCardClick = (card: Card, cardElement?: HTMLElement) => {
    if (!currentMatchData || currentMatchData.currentTurn !== currentMatchData.player.id || currentMatchData.isGameOver || animatingCardToBoard || draggedCardVisualInfo) return;

    soundService.playSound(SFX_BUTTON_CLICK, 0.3);

    if (targetingMode) {
      setSelectedMinionOnBoardUuid(null);
      setTargetingMode(false);
    }

    const isPlayableCard = currentMatchData.player.mana >= card.cost && (!card.attack || currentMatchData.player.board.length < MAX_MINIONS_ON_BOARD);

    if (selectedHandCardUuid === card.uuid) {
      if (isPlayableCard && card.attack !== undefined) {
        let playToSlotIndex = currentMatchData.player.board.length;
        if (playToSlotIndex < MAX_MINIONS_ON_BOARD) {
          const slotElement = playerBoardSlotsRef.current[playToSlotIndex];
          const handCardElement = cardElement || gameBoardRef.current?.querySelector(`[data-hand-card-uuid="${card.uuid}"]`) as HTMLElement;

          if (slotElement && handCardElement) {
              const handCardRect = handCardElement.getBoundingClientRect();
              const slotRect = slotElement.getBoundingClientRect();
              const isSmallViewport = window.matchMedia("(max-width: 639px)").matches;
              const targetAnimatedCardWidth = isSmallViewport ? 48 : 56;
              const targetAnimatedCardHeight = isSmallViewport ? 70 : 80;

              setAnimatingCardToBoard({
                  card: card,
                  startRect: { x: handCardRect.left, y: handCardRect.top, width: handCardRect.width, height: handCardRect.height },
                  targetSlotRect: slotRect,
                  targetSlotIndex: playToSlotIndex,
                  targetAnimatedCardWidth,
                  targetAnimatedCardHeight
              });
          } else {
             handleActualPlayCard(card.uuid!, playToSlotIndex);
          }
        } else {
            dispatch({ type: 'SET_ERROR', payload: "Board is full." });
        }
      } else {
        setSelectedHandCardUuid(null);
      }
    } else {
      if (isPlayableCard) {
        setSelectedHandCardUuid(card.uuid);
      } else {
        setSelectedHandCardUuid(null);
      }
    }
    setHoveredHandCardUuid(null);
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === gameBoardRef.current) {
        soundService.playSound(SFX_BUTTON_CLICK, 0.2);
        setSelectedHandCardUuid(null);
        setSelectedMinionOnBoardUuid(null);
        setTargetingMode(false);
    }
  };


  if (!currentMatchData || !currentUser || !playerProfile) return <div className="p-4 text-center font-display text-xl text-app-text">{translate('gameBoard_loading')}</div>;

  const player = currentMatchData.player;
  const opponent = currentMatchData.opponent;
  const currentTurn = currentMatchData.currentTurn;
  const log = currentMatchData.log;
  const isGameOver = currentMatchData.isGameOver;
  const winner = currentMatchData.winner;
  const isPlayerTurn = currentTurn === player.id;

  const renderHeroZone = (heroPlayer: PlayerState, isOpponentSide: boolean, isInBattlefield?: boolean) => {
    const canTargetHeroForAttack = isOpponentSide && targetingMode && selectedMinionOnBoardUuid && isPlayerTurn && !draggedCardVisualInfo && !selectedHandCardUuid;
    const heroTargetId = isOpponentSide ? OPPONENT_HERO_TARGET_ID : PLAYER_HERO_TARGET_ID;
    const isTakingDamage = heroTakingDamageAnim === (isOpponentSide ? 'opponent' : 'player');
    const isBurnoutActive = heroPlayer.deck.length === 0 && heroPlayer.burnoutDamageCounter > 0;

    let frameUrlToUse: string | undefined = undefined;
    if (!isOpponentSide && equippedPlayerAvatarFrame) { // Only player gets equipped frame
        frameUrlToUse = equippedPlayerAvatarFrame.imageUrl;
    }
    // Opponent will not have a frame from playerProfile

    const baseClasses = `flex items-center p-1.5 sm:p-2 rounded-lg transition-all duration-200 ease-in-out`;
    const conditionalClasses = `
      ${isInBattlefield ? 'w-full max-w-xs sm:max-w-sm my-0.5 sm:my-1 bg-app-panel/60'
                       : `min-w-[180px] sm:min-w-[220px] ${isOpponentSide ? 'bg-app-panel/50' : 'bg-app-panel/70'}`}
      ${canTargetHeroForAttack ? 'bg-app-accent/50 hover:bg-app-accent/60 cursor-crosshair ring-2 ring-app-accent shadow-lg' : ''}
      ${isPlayerTurn && !isOpponentSide && !isInBattlefield ? 'shadow-glow-mystic ring-1 ring-mystic-blue/50' : ''}
      ${!isPlayerTurn && isOpponentSide && (isInBattlefield || !isInBattlefield) ? 'shadow-glow-mystic ring-1 ring-mystic-blue/50' : ''}
      ${isTakingDamage ? 'animate-hero-damage-flash' : ''}
      ${isBurnoutActive ? 'animate-pulse-burnout' : ''}
    `;

    return (
      <div
        className={`${baseClasses} ${conditionalClasses}`}
        onClick={() => { if (canTargetHeroForAttack && selectedMinionOnBoardUuid) { const attacker = player.board.find(m => m.uuid === selectedMinionOnBoardUuid); if (attacker) handleMinionAttack(attacker, heroTargetId); }}}
        title={canTargetHeroForAttack && selectedMinionOnBoardUuid ? translate('gameBoard_attackHeroTitle', { minionName: player.board.find(m=>m.uuid === selectedMinionOnBoardUuid)?.name || 'Minion'}) : heroPlayer.name}
      >
        <HeroAvatarWithFrame heroPlayer={heroPlayer} frameUrl={frameUrlToUse} isOpponent={isOpponentSide} />
        <div className="flex flex-col justify-center flex-grow">
          <p className="text-[0.65rem] sm:text-xs font-bold text-app-text text-shadow-sm truncate max-w-[70px] sm:max-w-[90px]">{heroPlayer.name}</p>
          <div className="flex items-center space-x-0.5 mt-0.5">
            {Array.from({ length: MAX_MANA }).map((_, i) => <ManaGemIcon key={`${heroPlayer.id}-mana-${i}`} className="w-3.5 h-[18px] sm:w-4 sm:h-5" isFilled={i < heroPlayer.mana} isLocked={i >= heroPlayer.maxMana} animateFill={i < heroPlayer.mana && prevMatchDataRef.current && i >= (isOpponentSide ? prevMatchDataRef.current.opponent.mana : prevMatchDataRef.current.player.mana)} />)}
          </div>
        </div>
        <div className="flex flex-col items-center ml-auto p-0.5 bg-app-bg-secondary/30 rounded-md">
            <MagicBookIcon className="w-6 h-6 sm:w-7 sm:h-7 text-app-text-secondary filter drop-shadow-sm" count={heroPlayer.deck.length} />
            {isBurnoutActive && <span className="text-[0.5rem] text-red-400 font-bold -mt-1">🔥{heroPlayer.burnoutDamageCounter}</span>}
        </div>
      </div>
    );
  };

  const renderBattlefield = (boardMinions: Card[], isPlayerSide: boolean) => (
    <div className={`grid grid-cols-7 gap-0.5 sm:gap-1 p-1 sm:p-1.5 w-full rounded-lg border-2 border-app-card-border/30 ${isPlayerSide ? 'bg-board-surface-player' : 'bg-board-surface-opponent'} min-h-[80px] sm:min-h-[95px]`}>
      {Array.from({ length: MAX_MINIONS_ON_BOARD }).map((_, index) => {
        const minion = boardMinions[index];
        const slotRefCallback = (el: HTMLDivElement | null) => { if (isPlayerSide) playerBoardSlotsRef.current[index] = el; };

        const isMinionExhausted = minion?.hasAttacked || (minion?.isPlayed && !minion.abilities.some(a => a.type === 'CHARGE') && currentMatchData.turnNumber === 1 && currentMatchData.currentTurn === minion.uuid );

        const canBeSelectedByPlayer = isPlayerSide && isPlayerTurn && minion && !isMinionExhausted && minion.attack && !draggedCardVisualInfo && !selectedHandCardUuid && !animatingCardToBoard;
        const canBeTargetedByPlayerAttack = targetingMode && selectedMinionOnBoardUuid && !isPlayerSide && minion && isPlayerTurn && !draggedCardVisualInfo && !selectedHandCardUuid && !animatingCardToBoard;

        const isSlotHighlightedForDragDrop = isPlayerSide && draggedCardVisualInfo && !minion && currentMatchData.player.board.length < MAX_MINIONS_ON_BOARD && draggedCardVisualInfo.card.attack !== undefined;
        const isSlotHighlightedForClickPlay = isPlayerSide && selectedHandCardUuid && !minion && currentMatchData.player.board.length < MAX_MINIONS_ON_BOARD && currentMatchData.player.hand.find(c => c.uuid === selectedHandCardUuid)?.attack !== undefined;
        const isSlotHighlighted = isSlotHighlightedForDragDrop || isSlotHighlightedForClickPlay;

        return (
          <div
            key={minion?.uuid || `slot-${index}-${isPlayerSide ? 'p' : 'o'}`}
            ref={slotRefCallback}
            className={`minion-board-slot flex justify-center items-center ${isSlotHighlighted ? 'minion-board-slot-highlight' : ''} ${selectedMinionOnBoardUuid === minion?.uuid ? 'scale-105 ring-1 ring-app-primary z-20' : ''} transition-all duration-150 transform`}
            onClick={(e) => {
                e.stopPropagation();
                if (canBeSelectedByPlayer && minion?.uuid) {
                    if (selectedMinionOnBoardUuid === minion.uuid) {
                        setSelectedMinionOnBoardUuid(null);
                        setTargetingMode(false);
                    } else {
                        selectMinionOnBoard(minion);
                    }
                } else if (canBeTargetedByPlayerAttack && minion?.uuid && selectedMinionOnBoardUuid) {
                    const attacker = player.board.find(m => m.uuid === selectedMinionOnBoardUuid);
                    if (attacker) handleMinionAttack(attacker, minion.uuid);
                } else if (isPlayerSide && selectedHandCardUuid && !minion && playerBoardSlotsRef.current[index]) {
                    const cardToPlay = player.hand.find(c => c.uuid === selectedHandCardUuid);
                    if (cardToPlay && cardToPlay.attack !== undefined && player.mana >= cardToPlay.cost && player.board.length < MAX_MINIONS_ON_BOARD) {
                        const handCardElement = gameBoardRef.current?.querySelector(`[data-hand-card-uuid="${selectedHandCardUuid}"]`) as HTMLElement;
                        const slotElement = playerBoardSlotsRef.current[index]!;

                        if (slotElement && handCardElement) {
                            const handCardRect = handCardElement.getBoundingClientRect();
                            const slotRect = slotElement.getBoundingClientRect();
                            const isSmallViewport = window.matchMedia("(max-width: 639px)").matches;
                            const targetAnimatedCardWidth = isSmallViewport ? 48 : 56;
                            const targetAnimatedCardHeight = isSmallViewport ? 70 : 80;

                            setAnimatingCardToBoard({
                                card: cardToPlay,
                                startRect: { x: handCardRect.left, y: handCardRect.top, width: handCardRect.width, height: handCardRect.height },
                                targetSlotRect: slotRect,
                                targetSlotIndex: index,
                                targetAnimatedCardWidth,
                                targetAnimatedCardHeight
                            });
                        } else {
                           handleActualPlayCard(cardToPlay.uuid!, index);
                        }
                    }
                }
            }}
          >
            {minion &&
              <CardComponent
                card={minion}
                isPlayable={false}
                isInHand={false}
                animateEntry={!prevMatchDataRef.current?.player.board.find(pm => pm.uuid === minion.uuid) && !prevMatchDataRef.current?.opponent.board.find(pm => pm.uuid === minion.uuid)}
                isAttackingAnim={attackerMinionUuidAnim === minion.uuid}
                isTakingDamageAnim={attackTargetAnim?.uuid === minion.uuid && !attackTargetAnim?.isHero}
                isDyingAnim={dyingMinionsAnim.has(minion.uuid!)}
                isExhausted={isPlayerSide && minion.hasAttacked}
                canBeTargeted={canBeTargetedByPlayerAttack}
              />
            }
          </div>
        );
      })}
    </div>
  );

  if (isGameOver && gameOverDetails) {
    const isVictory = winner === player.id;
    const gameOutcomeShareButtonText = isVictory ? translate('gameBoard_share_victory') : translate('gameBoard_share_defeat');
    const opponentNameForShare = opponent.name || 'Opponent';
    const shareMessage = isVictory
        ? translate('gameBoard_shareMessage_victory', { opponentName: opponentNameForShare })
        : translate('gameBoard_shareMessage_defeat', { opponentName: opponentNameForShare });
    const gameLink = `https://t.me/${(window as any).Telegram?.WebApp?.initDataUnsafe?.bot?.username || 'your_bot_username'}`;

    return (
      <div className={`flex flex-col items-center justify-center h-full p-3 sm:p-4 text-center text-app-text
                       ${isVictory ? 'bg-gradient-to-br from-yellow-600/30 via-app-bg to-yellow-900/40' : 'bg-gradient-to-br from-red-700/30 via-app-bg to-red-900/50'}`}>
        <h2 className={`text-4xl sm:text-5xl font-bold font-display mb-3 sm:mb-4 tracking-wide
                       ${isVictory ? 'text-yellow-400 animate-pulse-glow' : 'text-red-500'}`}>
          {isVictory ? translate('gameBoard_victoryExcl') : translate('gameBoard_defeatExcl')}
        </h2>

        <div className="flex justify-around items-center w-full max-w-sm mb-3 sm:mb-4">
          <div className="flex flex-col items-center">
            <HeroAvatarWithFrame heroPlayer={player} frameUrl={equippedPlayerAvatarFrame?.imageUrl} />
            <p className="text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px]">{player.name}</p>
             <p className="text-xs text-red-400">{INITIAL_PLAYER_HEALTH - player.health} DMG Taken</p>
          </div>
          <span className={`text-2xl sm:text-3xl font-bold ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>VS</span>
          <div className="flex flex-col items-center">
            <HeroAvatarWithFrame heroPlayer={opponent} isOpponent={true}/>
            <p className="text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px]">{opponent.name}</p>
            <p className="text-xs text-green-400">{INITIAL_PLAYER_HEALTH - opponent.health} DMG Dealt</p>
          </div>
        </div>

        <p className="text-sm text-app-text-secondary mb-3 sm:mb-4">Match lasted {gameOverDetails.turns} turns. Opponent: {currentMatchData.opponentType}.</p>

        <div className="bg-app-bg-secondary/50 p-3 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm mb-4 sm:mb-6 space-y-2">
          <h3 className="text-md sm:text-lg font-semibold text-app-primary mb-2">Match Rewards:</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center"><XPIcon className="w-4 h-4 mr-1.5 text-green-400"/>XP Gained:</span>
            <span className={`font-bold ${gameOverDetails.xpChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {gameOverDetails.xpChange >= 0 ? '+' : ''}{gameOverDetails.xpChange}
            </span>
          </div>
           <div className="flex items-center justify-between text-sm">
            <span className="flex items-center"><RatingIcon className="w-4 h-4 mr-1.5 text-yellow-400"/>Rating Change:</span>
            <span className={`font-bold ${gameOverDetails.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {gameOverDetails.ratingChange >= 0 ? '+' : ''}{gameOverDetails.ratingChange}
            </span>
          </div>
          {gameOverDetails.krendiCoinReward > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center"><KrendiCoinIcon className="w-4 h-4 mr-1.5"/>KrendiCoins:</span>
              <span className="font-bold text-app-primary">+{gameOverDetails.krendiCoinReward}</span>
            </div>
          )}
          {gameOverDetails.cardRewards.length > 0 && (
            <div className="pt-2 border-t border-app-card-border/50">
              <p className="text-xs text-app-text-secondary mb-1">New Cards from Level Up:</p>
              <div className="flex flex-wrap justify-center gap-1">
                {gameOverDetails.cardRewards.map(card => (
                  <CardComponent key={card.id} card={card} isInHand={false} isPlayable={false} isForDisplayOnly />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm">
            <button
                onClick={() => {
                    soundService.playSound(SFX_BUTTON_CLICK);
                    dispatch({ type: 'NAVIGATE_TO', payload: Screen.Play });
                    dispatch({ type: 'SET_MATCH_DATA', payload: null });
                    setGameOverDetails(null);
                }}
                className={`flex-1 bg-app-primary text-app-bg font-semibold py-2.5 sm:py-3 px-6 rounded-lg shadow-xl hover:opacity-90 transition-opacity text-sm sm:text-base`}
            >
                {translate('gameBoard_backToMenuButton')}
            </button>
             <button
              onClick={() => {
                soundService.playSound(SFX_BUTTON_CLICK);
                telegramSDK.shareViaTelegram(shareMessage, gameLink);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-lg shadow-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              {gameOutcomeShareButtonText}
            </button>
        </div>
      </div>
    );
  }


  return (
    <div ref={gameBoardRef} onClick={handleBoardClick} className="flex flex-col h-full game-board-bg border-2 border-app-card-border overflow-hidden relative select-none font-body">
      {turnAnnouncement && ( <div className="absolute inset-x-0 top-1/3 z-50 pointer-events-none flex justify-center"> <p className="px-6 py-3 bg-app-panel/80 text-xl sm:text-2xl font-display text-white rounded-lg shadow-2xl animate-turn-announce text-shadow-lg tracking-wider">{turnAnnouncement}</p> </div> )}

      <div className="flex items-center justify-between px-1 sm:px-1.5 py-0.5 border-b-2 border-app-card-border/70 bg-app-panel/50 shadow-lg backdrop-blur-sm min-h-[50px] sm:min-h-[60px]">
         {/* Opponent Hero - Battlefield HUD */}
        {renderHeroZone(opponent, true, false)}
        <div className="flex justify-end items-center p-1 min-h-[50px] sm:min-h-[60px] relative w-[70px] sm:w-[90px]">
          {opponent.hand.map((_, index) =>  <div key={`opp-hand-${index}`} className="absolute transform transition-transform duration-100" style={{ right: `${index * 7}px`, zIndex: opponent.hand.length - index, transform: `translateY(${(index % 2) * 1}px) rotate(${Math.random()*1.5 - 0.75}deg)` }}><CardComponent card={{id:`opp-placeholder-${index}`} as any} isTransparent equippedCardBackUrl={defaultCardBack?.cardBackImageUrl} /></div> )}
          {opponent.hand.length > 0 && <span className="absolute -bottom-0.5 -right-0.5 text-[0.5rem] bg-app-bg-secondary/60 px-1 py-0.5 rounded text-white font-semibold">{opponent.hand.length}</span>}
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center p-0.5 sm:p-1 space-y-1 sm:space-y-1.5">
        {renderHeroZone(opponent, true, true)}
        {renderBattlefield(opponent.board, false)}
        {currentMatchData.opponentType === 'human' && !isPlayerTurn && currentTurnTimeLeft === null && (
            <div className="text-center text-xs text-app-text-secondary my-1">{translate('gameBoard_opponentThinking')}</div>
        )}
        {renderBattlefield(player.board, true)}
        {renderHeroZone(player, false, true)}
      </div>
       {/* Player Hero - Hand HUD */}
      <div className="flex items-center justify-between px-1 sm:px-1.5 py-0.5 border-t-2 border-app-card-border/70 bg-app-panel/50 shadow-top-lg backdrop-blur-sm relative z-10 min-h-[130px] sm:min-h-[150px]">
        {renderHeroZone(player, false, false)}
        <div className="w-full flex justify-center items-end relative h-full max-w-[calc(100%-200px)] sm:max-w-[calc(100%-240px)]">
            {player.hand.map((card, index) => {
                const totalCards = player.hand.length;
                const isBeingDragged = draggedCardVisualInfo?.card.uuid === card.uuid;

                const baseCardSpacing = 50;
                const rotationAngleMultiplier = totalCards > 1 ? 2.5 : 0;
                const rotationAngle = (index - (totalCards - 1) / 2) * rotationAngleMultiplier;
                const handYOffset = 0;
                const translateYBase = Math.abs(index - (totalCards - 1) / 2) * (totalCards > 3 ? 2.5 : 1.5);
                const isCardSelectedInHand = selectedHandCardUuid === card.uuid && !isBeingDragged;
                const isHovered = hoveredHandCardUuid === card.uuid && !draggedCardVisualInfo && !isCardSelectedInHand;
                const isPlayableCard = isPlayerTurn && player.mana >= card.cost && (!card.attack || player.board.length < MAX_MINIONS_ON_BOARD) && !animatingCardToBoard;

                const xSpacingMultiplier = (isHovered || isCardSelectedInHand) ? baseCardSpacing + 8 : baseCardSpacing;

                return (
                <div
                    key={card.uuid}
                    data-hand-card-uuid={card.uuid}
                    className={`absolute bottom-0 transform transition-all duration-200 ease-out origin-bottom card-drag-wrapper
                                ${isHovered && !selectedHandCardUuid ? `z-40 shadow-card-in-hand-hover` : `z-${10 + index}`}
                                ${isCardSelectedInHand ? 'z-50 !scale-[1.22] ring-2 ring-app-primary ring-offset-2 ring-offset-app-panel shadow-xl': ''}
                                `}
                    style={{
                      left: '50%',
                      transform: `
                        translateX(calc(-50% + ${(index - (totalCards - 1) / 2) * xSpacingMultiplier}px))
                        translateY(${(isHovered || isCardSelectedInHand) ? -40 - translateYBase - handYOffset : -translateYBase - handYOffset}px)
                        rotate(${rotationAngle}deg)
                        scale(${(isHovered || isCardSelectedInHand) ? 1.22 : 1})
                      `,
                    }}
                    onMouseEnter={() => !draggedCardVisualInfo && !selectedHandCardUuid && setHoveredHandCardUuid(card.uuid || null)}
                    onMouseLeave={() => setHoveredHandCardUuid(null)}
                >
                    <CardComponent
                        card={card}
                        isSelected={isCardSelectedInHand}
                        isPlayable={isPlayableCard}
                        isInHand
                        isDraggable={isPlayableCard}
                        onDragStart={(draggedCard, event) => handleCardDragStart(draggedCard, event, index)}
                        onClick={handleHandCardClick}
                        isGhostPlaceholder={isBeingDragged} />
                </div>);
            })}
        </div>
      </div>


      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2 p-0.5 bg-app-panel/30 text-center rounded-t-md z-0"><p className="text-[0.55rem] sm:text-xs text-app-text-secondary truncate text-shadow-sm">{log.length > 0 ? log[log.length-1] : translate('gameBoard_gameStartedLog')}</p></div>

      {/* Turn Timer Display */}
      {isPlayerTurn && currentMatchData.opponentType === 'human' && currentTurnTimeLeft !== null && !isGameOver && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1 sm:top-2 z-30 bg-app-bg-secondary/80 text-app-text px-3 py-1.5 rounded-full shadow-lg flex items-center">
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 text-app-primary animate-pulse" />
          <span className="font-mono text-sm sm:text-base font-semibold">{String(Math.floor(currentTurnTimeLeft / 60)).padStart(2, '0')}:{String(currentTurnTimeLeft % 60).padStart(2, '0')}</span>
        </div>
      )}

      <button onClick={handleEndTurn} disabled={!isPlayerTurn || isGameOver || !!draggedCardVisualInfo || !!animatingCardToBoard || !!selectedHandCardUuid || !!selectedMinionOnBoardUuid} className={`absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-30 w-10 h-24 sm:w-12 sm:h-28 text-xs font-bold rounded-lg shadow-xl transition-all duration-300 ease-in-out transform flex flex-col items-center justify-center space-y-0.5 border-2 ${isPlayerTurn ? 'bg-app-primary border-orange-300 text-app-bg hover:opacity-90 animate-pulse-glow end-turn-button-active-shape filter brightness-110' : 'bg-app-bg-secondary border-app-card-border text-app-text-secondary cursor-not-allowed end-turn-button-inactive-shape filter saturate-50'} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-app-bg-secondary disabled:animate-none disabled:filter-none`}><HourglassEndTurnIcon className="w-4 h-4 sm:w-5 sm:h-5"/><span className="text-[0.55rem] sm:text-[0.6rem] tracking-tight uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)'}}>{isPlayerTurn ? translate('gameBoard_endTurnButton') : translate('gameBoard_opponentsTurnButton')}</span></button>

      {targetingMode && selectedMinionOnBoardUuid && isPlayerTurn && (
        <div className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 z-30">
            <button
                onClick={() => {
                    soundService.playSound(SFX_BUTTON_CLICK, 0.4);
                    setSelectedMinionOnBoardUuid(null);
                    setTargetingMode(false);
                }}
                className="px-3 py-1.5 bg-app-accent/80 text-white rounded-lg shadow-xl hover:bg-app-accent hover:opacity-90 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-app-accent/70"
                title={translate('gameBoard_cancelAttackButton', { minionName: player.board.find(m => m.uuid === selectedMinionOnBoardUuid)?.name || 'Minion'})}
            >
                {translate('gameBoard_cancelAttackButtonLabel')}
            </button>
        </div>
      )}

      {draggedCardVisualInfo && ( <div className="fixed pointer-events-none z-[200] transition-transform duration-75" style={{ transform: `translate(${draggedCardVisualInfo.currentX - draggedCardVisualInfo.draggedElementRect.width / 2}px, ${draggedCardVisualInfo.currentY - draggedCardVisualInfo.draggedElementRect.height / 2}px) scale(1.2)` }}><CardComponent card={draggedCardVisualInfo.card} isInHand isPlayable /></div> )}
      {animatingCardToBoard && gameBoardRef.current && (
        <div className="fixed pointer-events-none z-[190] animate-card-fling"
          style={{
            width: `${animatingCardToBoard.startRect.width}px`,
            height: `${animatingCardToBoard.startRect.height}px`,
            '--card-fling-start-transform': `translate(${animatingCardToBoard.startRect.x}px, ${animatingCardToBoard.startRect.y}px) scale(1.2)`,
            '--card-fling-end-transform': `translate(${
                animatingCardToBoard.targetSlotRect.left + (animatingCardToBoard.targetSlotRect.width - animatingCardToBoard.targetAnimatedCardWidth) / 2
            }px, ${
                animatingCardToBoard.targetSlotRect.top + (animatingCardToBoard.targetSlotRect.height - animatingCardToBoard.targetAnimatedCardHeight) / 2
            }px) scale(${
                animatingCardToBoard.targetAnimatedCardWidth / animatingCardToBoard.startRect.width
            })`,
          } as React.CSSProperties}
          onAnimationEnd={() => { handleActualPlayCard(animatingCardToBoard.card.uuid!, animatingCardToBoard.targetSlotIndex); setAnimatingCardToBoard(null); }}
        ><CardComponent card={animatingCardToBoard.card} isInHand isPlayable={false} /></div>
      )}
    </div>
  );
};

export default GameBoard;
