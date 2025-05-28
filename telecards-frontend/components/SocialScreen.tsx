
import React, { useState, FormEvent, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, Friend, WebSocketMessageType, GameState, FriendRequest, FriendRequestStatus, Deck, WebSocketMessageFromServer, ChallengeDeclinedNoticePayload } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { UserIcon, RatingIcon, PlusCircleIcon, KrendiCoinIcon as LevelIcon, UserPlusIcon, UserCheckIcon, UserMinusIcon, ClockIcon } from '../assets/icons'; 
import apiService from '../services/apiService'; 
import webSocketService from '../services/websocketService';
import { MAX_CARDS_PER_DECK } from '../constants';
import { TranslationKeys } from '../translations/keys';

const SocialScreen: React.FC = () => {
  const { friendsList, currentUser, playerProfile, incomingFriendRequests, outgoingFriendRequests, playerDecks, activeScreen } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [friendCode, setFriendCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [waitingForChallengeResponse, setWaitingForChallengeResponse] = useState<string | null>(null); // Friend ID being challenged


  useEffect(() => { 
    if (currentUser && activeTab === 'requests') { 
      setIsLoading(true);
      apiService.fetchFriendRequests(currentUser.id.toString())
        .then(data => dispatch({ type: 'SET_FRIEND_REQUESTS', payload: data }))
        .catch(err => setFeedbackMessage({ type: 'error', message: err.message || 'Failed to load friend requests' }))
        .finally(() => setIsLoading(false));
    }
  }, [currentUser, dispatch, activeTab]);

  useEffect(() => {
    // Cleanup WebSocket connection if user navigates away while challenging
    return () => {
      if (waitingForChallengeResponse && webSocketService) { // Check if webSocketService is defined
        webSocketService.close(); // This also clears pending challenges in the service
        setWaitingForChallengeResponse(null);
      }
    };
  }, [waitingForChallengeResponse, activeScreen]);


  const getActiveDeck = (): Deck | undefined => {
    return playerDecks.find(deck => deck.isActive);
  };

  const validateActiveDeck = (): boolean => {
    const activeDeck = getActiveDeck();
    if (!activeDeck) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_noActiveDeck') });
      return false;
    }
    if (activeDeck.cardIds.length !== MAX_CARDS_PER_DECK) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_incompleteActiveDeck', { deckName: activeDeck.name, required: MAX_CARDS_PER_DECK, current: activeDeck.cardIds.length }) });
      return false;
    }
    return true;
  };

  const handleSendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!friendCode.trim() || !currentUser) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const response = await apiService.sendFriendRequest(currentUser.id.toString(), friendCode);
      setFeedbackMessage({ type: response.success ? 'success' : 'error', message: t(response.messageKey as keyof TranslationKeys) });
      if (response.success && response.request) {
        dispatch({ type: 'ADD_OUTGOING_FRIEND_REQUEST', payload: response.request });
        setFriendCode('');
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', message: err.message || 'Failed to send request' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
        const response = await apiService.respondToFriendRequest(currentUser.id.toString(), requestId, action);
        setFeedbackMessage({ type: response.success ? 'success' : 'error', message: t(response.messageKey as keyof TranslationKeys) });
        if (response.success) {
            dispatch({ type: 'UPDATE_FRIEND_REQUEST_STATUS', payload: { requestId, status: action === 'accept' ? FriendRequestStatus.Accepted : FriendRequestStatus.Declined, newFriend: response.newFriend } });
        }
    } catch (err: any) {
        setFeedbackMessage({ type: 'error', message: err.message || 'Failed to respond to request'});
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to remove ${friendName}?`)) return;

    setIsLoading(true);
    try {
        const success = await apiService.removeFriend(currentUser.id.toString(), friendId);
        if (success) {
            dispatch({ type: 'REMOVE_FRIEND', payload: friendId });
            setFeedbackMessage({ type: 'success', message: t('social_success_friendRemoved', {name: friendName}) });
        } else {
            setFeedbackMessage({ type: 'error', message: t('social_error_removeFriendFailed') });
        }
    } catch (err: any) {
        setFeedbackMessage({ type: 'error', message: err.message || 'Error removing friend.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleChallengeFriend = (friend: Friend) => {
    if (!currentUser || !playerProfile) {
        setFeedbackMessage({ type: 'error', message: "User profile not loaded."});
        return;
    }
    if (!validateActiveDeck()) return;
    
    const activeDeck = getActiveDeck();
    if(!activeDeck) return;

    setWaitingForChallengeResponse(friend.id);
    setFeedbackMessage({type: 'success', message: t('social_challenge_waitingFor', {name: friend.name}) });

    const socialScreenMessageHandler = (message: WebSocketMessageFromServer) => {
        // Check if still waiting for THIS friend's response and on social screen
        if (activeScreen !== Screen.Social || waitingForChallengeResponse !== friend.id) { 
            if(webSocketService) webSocketService.close(); 
            setWaitingForChallengeResponse(null);
            return;
        }

        if (message.type === WebSocketMessageType.MATCH_FOUND) {
            webSocketService.setExternalGameState(message.payload as GameState, currentUser, playerProfile);
            dispatch({ type: 'SET_MATCH_DATA', payload: message.payload as GameState });
            dispatch({ type: 'NAVIGATE_TO', payload: Screen.GameBoard });
            setWaitingForChallengeResponse(null); 
            // WS connection remains open for GameBoard
        } else if (message.type === WebSocketMessageType.CHALLENGE_DECLINED_NOTICE) {
            const notice = message.payload as ChallengeDeclinedNoticePayload;
            // Potentially check notice.challengeId if we stored it when initiating
            setFeedbackMessage({ type: 'error', message: t('social_challenge_declinedBy', {name: notice.responderName}) });
            setWaitingForChallengeResponse(null);
            if(webSocketService) webSocketService.close();
        } else if (message.type === WebSocketMessageType.ERROR) {
            setFeedbackMessage({ type: 'error', message: message.payload.message || t('social_challenge_failed') });
            setWaitingForChallengeResponse(null);
            if(webSocketService) webSocketService.close();
        }
    };
    
    webSocketService.connect(
        'wss://darkborn.example.com/ws_challenge', 
        currentUser, playerProfile, activeDeck,
        () => { 
            webSocketService.sendMessage({
                type: WebSocketMessageType.CHALLENGE_FRIEND,
                payload: { friendId: friend.id } 
            });
        },
        socialScreenMessageHandler, 
        (errorEvent) => { 
            const errMsg = (errorEvent as {message: string})?.message || t('error_webSocketConnection');
            setFeedbackMessage({ type: 'error', message: errMsg });
            setWaitingForChallengeResponse(null);
            if(webSocketService) webSocketService.close();
        },
        () => { // onClose handler
            if (waitingForChallengeResponse === friend.id) { // If connection closed while waiting
                setFeedbackMessage({ type: 'error', message: t('social_challenge_cancelledOrTimedOut')});
                setWaitingForChallengeResponse(null);
            }
        } 
    );
  };

  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-app-primary text-center mb-3 sm:mb-4 mt-1 sm:mt-2">{t('social_title')}</h2>

      <div className="flex mb-3 sm:mb-4 border-b-2 border-app-card-border">
        <button onClick={() => setActiveTab('friends')} className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'friends' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}>{t('social_friendsTab')} ({friendsList.length})</button>
        <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'requests' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}>{t('social_requestsTab')} ({incomingFriendRequests.length})</button>
        <button onClick={() => setActiveTab('add')} className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'add' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}>{t('social_addFriendTab')}</button>
      </div>

      {feedbackMessage && (
        <div className={`p-2 mb-3 rounded-md text-sm text-center ${feedbackMessage.type === 'success' ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'}`}>
          {feedbackMessage.message}
        </div>
      )}

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'friends' && (
            friendsList.length === 0 ? (
                <p className="text-center text-app-text-secondary py-6">{t('social_noFriendsMessage')}</p>
            ) : (
                <div className="space-y-2">
                {friendsList.map(friend => (
                    <div key={friend.id} className="bg-app-bg-secondary p-2.5 sm:p-3 rounded-lg shadow-md flex items-center space-x-2 sm:space-x-3">
                    <img src={friend.avatarUrl || 'https://picsum.photos/seed/friendavatar/50/50'} alt={friend.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-app-card-border"/>
                    <div className="flex-grow">
                        <p className="font-semibold text-app-text text-sm sm:text-base truncate">{friend.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-app-text-secondary">
                        <span className="flex items-center"><LevelIcon className="w-3 h-3 mr-0.5 text-blue-400"/> {friend.level}</span>
                        <span className="flex items-center"><RatingIcon className="w-3 h-3 mr-0.5 text-yellow-400"/> {friend.rating}</span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1.5">
                        <button 
                          onClick={() => handleChallengeFriend(friend)} 
                          className="bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded text-xs font-semibold shadow transition-colors disabled:opacity-50" 
                          disabled={isLoading || !!waitingForChallengeResponse}
                        >
                          {waitingForChallengeResponse === friend.id ? t('social_challenge_waitingButton') : t('social_challengeButton')}
                        </button>
                        <button onClick={() => handleRemoveFriend(friend.id, friend.name)} className="bg-app-accent hover:opacity-90 text-white px-2.5 py-1 rounded text-xs font-semibold shadow transition-colors" disabled={isLoading || !!waitingForChallengeResponse}>{t('social_removeButton')}</button>
                    </div>
                    </div>
                ))}
                </div>
            )
        )}

        {activeTab === 'requests' && (
            isLoading && incomingFriendRequests.length === 0 && outgoingFriendRequests.length === 0 ? <p className="text-center text-app-text-secondary py-6">{t('social_loadingRequests')}</p> :
            incomingFriendRequests.length === 0 && outgoingFriendRequests.length === 0 ? <p className="text-center text-app-text-secondary py-6">{t('social_noPendingRequests')}</p> :
            (
                <div className="space-y-3">
                    {incomingFriendRequests.length > 0 && (
                        <div>
                            <h3 className="text-md font-semibold text-app-text-secondary mb-1.5">{t('social_incomingRequestsTitle')} ({incomingFriendRequests.length})</h3>
                            <div className="space-y-2">
                            {incomingFriendRequests.map(req => (
                                <div key={req.id} className="bg-app-bg-secondary p-2.5 rounded-lg shadow flex items-center space-x-2">
                                <img src={req.senderAvatarUrl || `https://picsum.photos/seed/${req.senderId}/40/40`} alt={req.senderName} className="w-8 h-8 rounded-full object-cover border border-app-card-border"/>
                                <div className="flex-grow">
                                    <p className="text-sm font-medium text-app-text">{req.senderName} <span className="text-xs text-app-text-secondary">({req.senderFriendCode})</span></p>
                                </div>
                                <button onClick={() => handleRespondToRequest(req.id, 'accept')} className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded shadow disabled:opacity-50" disabled={isLoading}><UserCheckIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleRespondToRequest(req.id, 'decline')} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded shadow disabled:opacity-50" disabled={isLoading}><UserMinusIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                    {outgoingFriendRequests.length > 0 && (
                         <div>
                            <h3 className="text-md font-semibold text-app-text-secondary mb-1.5 mt-3">{t('social_outgoingRequestsTitle')} ({outgoingFriendRequests.length})</h3>
                            <div className="space-y-2">
                            {outgoingFriendRequests.map(req => (
                                <div key={req.id} className="bg-app-bg-secondary p-2.5 rounded-lg shadow flex items-center space-x-2 opacity-80">
                                <img src={req.receiverFriendCode ? `https://picsum.photos/seed/${req.receiverFriendCode}/40/40` : `https://picsum.photos/seed/${req.receiverId}/40/40`} alt="Receiver" className="w-8 h-8 rounded-full object-cover border border-app-card-border"/>
                                <div className="flex-grow">
                                    <p className="text-sm font-medium text-app-text">To: {req.receiverFriendCode}</p>
                                </div>
                                <ClockIcon className="w-4 h-4 text-app-text-secondary"/>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            )
        )}

        {activeTab === 'add' && (
            <form onSubmit={handleSendRequest} className="space-y-3 sm:space-y-4 p-1">
            <div>
                <label htmlFor="friendCode" className="block text-sm font-medium text-app-text-secondary mb-1">{t('social_friendCodeInputPlaceholder')}</label>
                <input type="text" id="friendCode" value={friendCode} onChange={(e) => setFriendCode(e.target.value.toUpperCase())} className="w-full p-2.5 rounded-lg bg-app-bg border border-app-card-border text-app-text focus:ring-1 focus:ring-app-primary outline-none text-sm sm:text-base" placeholder="ABCXYZ" maxLength={6} disabled={isLoading} required />
            </div>
            <button type="submit" disabled={isLoading || !friendCode.trim()} className="w-full bg-app-primary hover:opacity-90 text-app-bg font-bold py-2.5 sm:py-3 rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 mr-1.5"/>
                {isLoading ? t('social_sendingRequest') : t('social_sendRequestButton')}
            </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default SocialScreen;
