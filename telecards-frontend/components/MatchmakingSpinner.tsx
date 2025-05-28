import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import webSocketService from '../services/websocketService';
import { Screen, WebSocketMessageType, WebSocketMessageFromServer, GameState, Deck } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { MAX_CARDS_PER_DECK, MATCHMAKING_TIPS } from '../constants';
import { TranslationKeys } from '../translations/keys'; // For typing error messages

const MatchmakingSpinner: React.FC = () => {
  const { currentUser, playerProfile, activeScreen, playerDecks } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  
  const [isSearchingLocally, setIsSearchingLocally] = useState(false);
  const sessionActiveRef = useRef(false); 
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  // tipIntervalRef is no longer needed as the interval is managed by a local variable in its own useEffect.

  const activeDeck = useMemo((): Deck | undefined => {
    return playerDecks.find(deck => deck.isActive);
  }, [playerDecks]);

  const endSessionForCancelOrError = (errorKey?: keyof TranslationKeys | string, navigateBack: boolean = true) => {
    if (sessionActiveRef.current) {
      webSocketService.sendMessage({ type: WebSocketMessageType.CANCEL_FIND_MATCH }); 
      webSocketService.close(); 
      sessionActiveRef.current = false;
    }
    setIsSearchingLocally(false); // This will trigger the tip interval's cleanup effect
    dispatch({ type: 'SET_LOADING', payload: false });

    if (errorKey) {
      const errorMessage = t(errorKey as keyof TranslationKeys, { defaultValue: errorKey as string });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }

    if (navigateBack && activeScreen === Screen.Matchmaking) {
      dispatch({ type: 'NAVIGATE_TO', payload: Screen.Play });
    }
  };
  
  const handleCancelByUser = () => {
    endSessionForCancelOrError(undefined, true); 
  };

  // Effect for managing the tip interval based on isSearchingLocally
  useEffect(() => {
    let localIntervalId: number | null = null;

    if (isSearchingLocally && MATCHMAKING_TIPS.length > 1) { // Only animate if there's more than one tip
      // currentTipIndex is reset to 0 when a new search starts (in the main useEffect)
      localIntervalId = window.setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % MATCHMAKING_TIPS.length);
      }, 6000);
    }

    return () => {
      if (localIntervalId !== null) {
        window.clearInterval(localIntervalId);
      }
    };
  }, [isSearchingLocally]); // Only depends on isSearchingLocally

  // Main useEffect for WebSocket logic and controlling search state
  useEffect(() => {
    if (activeScreen === Screen.Matchmaking) {
      if (!currentUser || !playerProfile) {
        endSessionForCancelOrError('error_userNotFoundForMatchmaking');
        return;
      }
      if (!activeDeck) {
        endSessionForCancelOrError('deckBuilder_error_noActiveDeck');
        return;
      }
      if (activeDeck.cardIds.length !== MAX_CARDS_PER_DECK) {
        const errMsg = t('deckBuilder_error_incompleteActiveDeck', { 
          deckName: activeDeck.name, 
          current: activeDeck.cardIds.length, 
          required: MAX_CARDS_PER_DECK 
        });
        endSessionForCancelOrError(errMsg);
        return;
      }

      if (!sessionActiveRef.current) { // Start a new matchmaking session
        sessionActiveRef.current = true; 
        setCurrentTipIndex(0); // Reset tip index for the new search session
        setIsSearchingLocally(true); // Triggers tip interval effect to start
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' }); 

        const messageHandler = (message: WebSocketMessageFromServer) => {
          if (!sessionActiveRef.current && activeScreen !== Screen.Matchmaking) { 
             // If session ended or screen changed before message processing, ignore.
             // sessionActiveRef can be set to false by match found, error, or cancel.
            return;
          }

          if (message.type === WebSocketMessageType.MATCH_FOUND) {
            webSocketService.setExternalGameState(message.payload as GameState, currentUser, playerProfile);
            
            sessionActiveRef.current = false; 
            setIsSearchingLocally(false); // Triggers tip interval effect to stop
            dispatch({ type: 'SET_LOADING', payload: false });
            
            dispatch({ type: 'SET_MATCH_DATA', payload: message.payload as GameState });
            dispatch({ type: 'NAVIGATE_TO', payload: Screen.GameBoard });
          } else if (message.type === WebSocketMessageType.ERROR) {
            endSessionForCancelOrError(message.payload?.message as keyof TranslationKeys || 'error_webSocketConnection');
          }
        };

        const openHandler = () => {
          if (sessionActiveRef.current && activeScreen === Screen.Matchmaking && activeDeck && playerProfile) {
            webSocketService.sendMessage({ 
              type: WebSocketMessageType.FIND_MATCH, 
              payload: { rating: playerProfile.rating, deckId: activeDeck.id } 
            });
          } else if (sessionActiveRef.current) { 
            endSessionForCancelOrError(); 
          }
        };
        
        const errorHandler = (errorEvent: Event | {message: string}) => {
          if (sessionActiveRef.current && activeScreen === Screen.Matchmaking) {
            const errorMsg = (errorEvent as {message: string})?.message || 'error_webSocketConnection';
            endSessionForCancelOrError(errorMsg as keyof TranslationKeys);
          }
        };

        const closeHandler = () => {
            if (sessionActiveRef.current && activeScreen === Screen.Matchmaking) {
                endSessionForCancelOrError('error_webSocketClosed');
            }
        };
        
        webSocketService.connect(
            'wss://darkborn.example.com/ws_matchmaking_pvp', 
            currentUser, playerProfile, activeDeck, 
            openHandler, messageHandler, errorHandler, closeHandler
        );
      }
    } else { // activeScreen is NOT Matchmaking
        if (sessionActiveRef.current) {
            endSessionForCancelOrError(undefined, false); 
        }
    }

    return () => { // Cleanup for this main effect
      if (sessionActiveRef.current) { 
        // This ensures that if the component unmounts or activeScreen changes away from Matchmaking
        // while a search session was active, it gets cleaned up.
        endSessionForCancelOrError(undefined, false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreen, currentUser, playerProfile, activeDeck, dispatch, t]);


  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-app-bg-secondary">
      <div className="animate-pulse text-6xl mb-6 sm:mb-8 text-app-primary">⚔️</div>
      <h2 className="text-xl sm:text-2xl font-bold text-app-text mb-3 sm:mb-4">{t('matchmaking_title')}</h2>
      
      {isSearchingLocally ? (
        <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-dashed border-app-primary rounded-full animate-spin mb-6 sm:mb-8"></div>
      ) : (
        <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-app-text-secondary rounded-full flex items-center justify-center mb-6 sm:mb-8">
             <span className="text-app-text-secondary text-xl">⏳</span>
        </div>
      )}
      
      <p className="text-sm text-app-text-secondary mb-6 sm:mb-8 px-4 text-center">
        {isSearchingLocally ? t('matchmaking_status') : (activeScreen === Screen.Matchmaking ? t('matchmaking_button_cancel') : "Search ended.")}
      </p>
      
      <button
        onClick={handleCancelByUser}
        className="bg-app-accent hover:opacity-90 text-white font-semibold py-2.5 px-10 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-app-accent/70"
        aria-label={t('matchmaking_button_cancel')}
      >
        {t('matchmaking_button_cancel')}
      </button>

      {isSearchingLocally && MATCHMAKING_TIPS.length > 0 && (
        <div className="mt-6 text-center w-full max-w-xs sm:max-w-sm px-2">
          <p className="text-xs sm:text-sm text-app-text-secondary italic transition-opacity duration-500" key={currentTipIndex}>
            {t(MATCHMAKING_TIPS[currentTipIndex])}
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchmakingSpinner;