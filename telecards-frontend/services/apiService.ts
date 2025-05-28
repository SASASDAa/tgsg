
import { Card, ChestOpeningResponse, TelegramUser, PlayerProfile, Friend, GameReward, FriendRequest, FriendRequestStatus, PlayerAchievementProgress, Deck, DailyQuestDefinition, PlayerDailyQuest, QuestProgressType, CardRarity } from '../types';
import { ALL_CARDS_POOL_RAW, KRENDI_COIN_CHEST_COST, CARDS_PER_CHEST, INITIAL_PLAYER_PROFILE, MOCK_FRIENDS, generateMockFriendCode as genFriendCodeUtil, createCardInstance, getCardById, ALL_ACHIEVEMENTS, MAX_CARDS_PER_DECK, ALL_DAILY_QUESTS_POOL, DAILY_QUEST_COUNT, DAILY_QUEST_REFRESH_INTERVAL, MAX_COPIES_LEGENDARY, MAX_COPIES_NON_LEGENDARY, RARITY_DISENCHANT_VALUES } from '../constants';
import { TranslationKeys } from '../translations/keys';

const API_DELAY = 300;

interface MockPlayerData {
  krendiCoins: number;
  krendiDust: number;
  ownedCards: Card[];
  playerProfile: PlayerProfile;
  friendsList: Friend[];
  playerAchievements: PlayerAchievementProgress[];
  incomingFriendRequests: FriendRequest[];
  outgoingFriendRequests: FriendRequest[];
  playerDecks: Deck[];
  dailyQuests: PlayerDailyQuest[];
  lastDailyQuestRefresh: number;
}

class ApiService {
  private mockUserStore: Record<string, MockPlayerData> = {};
  private mockFriendRequestsStore: FriendRequest[] = []; 

  constructor() {
    const defaultUserId = '123456789';
    const initialOwnedCards = ALL_CARDS_POOL_RAW.slice(0, 8).map(c => createCardInstance(c.id)!);
    const initialDecks: Deck[] = [];
    if (initialOwnedCards.length >= MAX_CARDS_PER_DECK) {
        initialDecks.push({
            id: crypto.randomUUID(), name: "Starter Deck", cardIds: initialOwnedCards.slice(0, MAX_CARDS_PER_DECK).map(c => c.id),
            isActive: true, createdAt: Date.now(), updatedAt: Date.now(),
        });
    }
    // Initial daily quests for mock user
    const shuffledQuests = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
    const initialDailyQuestDefs = shuffledQuests.slice(0, DAILY_QUEST_COUNT);
    const initialPlayerDailyQuests: PlayerDailyQuest[] = initialDailyQuestDefs.map(def => ({
        questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
    }));

    this.mockUserStore[defaultUserId] = {
      krendiCoins: 1200,
      krendiDust: 50,
      ownedCards: initialOwnedCards,
      playerProfile: {
        ...INITIAL_PLAYER_PROFILE, level: 3, xp: 280, xpToNextLevel: 500, rating: 1050,
        friendCode: this.generateNewFriendCode(), avatarUrl: 'https://picsum.photos/seed/mockuser/100/100',
        name: 'DarkBorn Tester Profile', totalWins: 2, botWins: 1, pvpWins: 1,
      },
      friendsList: MOCK_FRIENDS.map(f => ({...f, friendCode: this.generateNewFriendCode()})),
      playerAchievements: ALL_ACHIEVEMENTS.map(ach => ({ achievementId: ach.id, currentValue: ach.id === 'ach_first_win' ? 2 : 0, isCompleted: ach.id === 'ach_first_win' ? true : false, isClaimed: ach.id === 'ach_first_win' ? false : false })),
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      playerDecks: initialDecks,
      dailyQuests: initialPlayerDailyQuests,
      lastDailyQuestRefresh: Date.now() - (DAILY_QUEST_REFRESH_INTERVAL / 2), // Refreshed 12 hours ago
    };
  }
  
  public generateNewFriendCode(): string {
    return genFriendCodeUtil();
  }

  public setCurrentUser(user: TelegramUser, coins: number, dust:number, cards: Card[], profile: PlayerProfile, friends: Friend[], achievements: PlayerAchievementProgress[], incomingFR: FriendRequest[], outgoingFR: FriendRequest[], playerDecks: Deck[], dailyQuests: PlayerDailyQuest[], lastRefresh: number): void {
    if (!this.mockUserStore[user.id.toString()]) {
        this.mockUserStore[user.id.toString()] = {
            krendiCoins: coins, krendiDust: dust, ownedCards: cards, playerProfile: profile, friendsList: friends,
            playerAchievements: achievements, incomingFriendRequests: incomingFR, outgoingFriendRequests: outgoingFR,
            playerDecks: playerDecks, dailyQuests, lastDailyQuestRefresh: lastRefresh,
        };
    } else {
        const userData = this.mockUserStore[user.id.toString()];
        userData.krendiCoins = coins; userData.krendiDust = dust; userData.ownedCards = cards; userData.playerProfile = profile;
        userData.friendsList = friends; userData.playerAchievements = achievements;
        userData.incomingFriendRequests = incomingFR; userData.outgoingFriendRequests = outgoingFR;
        userData.playerDecks = playerDecks; userData.dailyQuests = dailyQuests; userData.lastDailyQuestRefresh = lastRefresh;
    }
  }

  public async fetchPlayerData(userId: string): Promise<MockPlayerData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`API: Fetching player data for ${userId}`);
        if (!this.mockUserStore[userId]) {
          const newProfile: PlayerProfile = {
            ...INITIAL_PLAYER_PROFILE, friendCode: this.generateNewFriendCode(),
            name: `Player ${userId.substring(0,4)}`, totalWins:0, botWins:0, pvpWins: 0,
          };
          const initialAchievements = ALL_ACHIEVEMENTS.map(ach => ({ achievementId: ach.id, currentValue: 0, isCompleted: false, isClaimed: false, }));
          const initialOwnedCardsForNewUser = [createCardInstance('c001')!, createCardInstance('c002')!].filter(Boolean) as Card[];
          const initialDecksForNewUser: Deck[] = [];
            if (initialOwnedCardsForNewUser.length >= MAX_CARDS_PER_DECK) {
                initialDecksForNewUser.push({
                    id: crypto.randomUUID(), name: "Starter Deck", cardIds: initialOwnedCardsForNewUser.slice(0, MAX_CARDS_PER_DECK).map(c => c.id),
                    isActive: true, createdAt: Date.now(), updatedAt: Date.now(),
                });
            }
          const shuffledQuests = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
          const initialDailyQuestDefs = shuffledQuests.slice(0, DAILY_QUEST_COUNT);
          const newPlayerDailyQuests = initialDailyQuestDefs.map(def => ({
            questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
          }));

          this.mockUserStore[userId] = {
            krendiCoins: 500, krendiDust: 0, ownedCards: initialOwnedCardsForNewUser, playerProfile: newProfile, friendsList: [],
            playerAchievements: initialAchievements, incomingFriendRequests: [], outgoingFriendRequests: [],
            playerDecks: initialDecksForNewUser, dailyQuests: newPlayerDailyQuests, lastDailyQuestRefresh: Date.now(),
          };
        }
        // Check and refresh daily quests if needed
        const userData = this.mockUserStore[userId];
        const now = Date.now();
        if (now - userData.lastDailyQuestRefresh >= DAILY_QUEST_REFRESH_INTERVAL) {
            const shuffledPool = [...ALL_DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
            const newQuestDefs = shuffledPool.slice(0, DAILY_QUEST_COUNT);
            userData.dailyQuests = newQuestDefs.map(def => ({
                questDefId: def.id, currentValue: 0, isCompleted: false, isClaimed: false,
            }));
            userData.lastDailyQuestRefresh = now;
            console.log(`API: Daily quests refreshed for user ${userId}`);
        }
        
        const allRequests = this.mockFriendRequestsStore;
        userData.incomingFriendRequests = allRequests.filter(r => r.receiverId === userId && r.status === FriendRequestStatus.Pending);
        userData.outgoingFriendRequests = allRequests.filter(r => r.senderId === userId && r.status === FriendRequestStatus.Pending);

        resolve(userData);
      }, API_DELAY);
    });
  }

  public async openChest(userId: string): Promise<ChestOpeningResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const playerData = this.mockUserStore[userId];
        if (!playerData) { reject(new Error('User data not found')); return; }
        if (playerData.krendiCoins < KRENDI_COIN_CHEST_COST) { reject(new Error('Not enough KrendiCoins!')); return; }
        
        playerData.krendiCoins -= KRENDI_COIN_CHEST_COST;
        
        const newlyObtainedCards: Card[] = []; // Cards that are actually added to collection
        let krendiDustGainedThisChest = 0;
        let duplicatesConvertedCount = 0;

        for (let i = 0; i < CARDS_PER_CHEST; i++) {
            if (ALL_CARDS_POOL_RAW.length === 0) break;

            const randomNumber = Math.random() * 100;
            let chosenRarity: CardRarity;
            if (randomNumber < 60) chosenRarity = CardRarity.Common;      // 60%
            else if (randomNumber < 85) chosenRarity = CardRarity.Rare;   // 25%
            else if (randomNumber < 97) chosenRarity = CardRarity.Epic;   // 12%
            else chosenRarity = CardRarity.Legendary;                     // 3%
            
            const availableByRarity = ALL_CARDS_POOL_RAW.filter(p => p.rarity === chosenRarity);
            const poolToDrawFrom = availableByRarity.length > 0 ? availableByRarity : ALL_CARDS_POOL_RAW;
            
            const randomProtoIndex = Math.floor(Math.random() * poolToDrawFrom.length);
            const drawnCardPrototype = poolToDrawFrom[randomProtoIndex];

            // Count existing copies of this card ID in the player's collection
            const currentOwnedCountOfThisCardId = playerData.ownedCards.filter(c => c.id === drawnCardPrototype.id).length;
            const maxCopiesAllowed = drawnCardPrototype.rarity === CardRarity.Legendary ? MAX_COPIES_LEGENDARY : MAX_COPIES_NON_LEGENDARY;

            if (currentOwnedCountOfThisCardId < maxCopiesAllowed) {
                const newCardInstance = createCardInstance(drawnCardPrototype.id);
                if (newCardInstance) {
                    newlyObtainedCards.push(newCardInstance); // This card is added to collection
                    playerData.ownedCards.push(newCardInstance); // Update live data
                }
            } else {
                // Max copies owned, convert to dust
                krendiDustGainedThisChest += RARITY_DISENCHANT_VALUES[drawnCardPrototype.rarity];
                duplicatesConvertedCount++;
            }
        }
        playerData.krendiDust += krendiDustGainedThisChest; // Update player's live dust

        resolve({ 
            newCards: newlyObtainedCards, // Only cards actually added
            updatedKrendiCoins: playerData.krendiCoins,
            krendiDustGained: krendiDustGainedThisChest,
            duplicatesConverted: duplicatesConvertedCount,
        });
      }, API_DELAY * 2); 
    });
  }

  public async sendFriendRequest(currentUserId: string, targetFriendCode: string): Promise<{ success: boolean, messageKey: keyof TranslationKeys, request?: FriendRequest }> {
    return new Promise(resolve => {
      setTimeout(() => {
        const senderProfile = this.mockUserStore[currentUserId]?.playerProfile;
        if (!senderProfile) { resolve({ success: false, messageKey: 'social_error_senderProfileNotFound' }); return; }
        if (senderProfile.friendCode === targetFriendCode) { resolve({ success: false, messageKey: 'social_error_cantAddSelf' }); return; }
        let targetUserEntry = Object.entries(this.mockUserStore).find(([_, data]) => data.playerProfile.friendCode === targetFriendCode);
        if (!targetUserEntry) {
            const mockFriendTarget = MOCK_FRIENDS.find(f => f.friendCode === targetFriendCode);
            if (mockFriendTarget) targetUserEntry = [mockFriendTarget.id, { playerProfile: {...INITIAL_PLAYER_PROFILE, ...mockFriendTarget}, friendsList:[], krendiCoins:0, krendiDust:0, ownedCards:[], playerAchievements:[], incomingFriendRequests:[], outgoingFriendRequests:[], playerDecks: [], dailyQuests: [], lastDailyQuestRefresh: 0 }];
        }
        if (!targetUserEntry) { resolve({ success: false, messageKey: 'social_error_friendNotFound' }); return; }
        const [targetUserId, targetUserData] = targetUserEntry;
        if (this.mockUserStore[currentUserId]?.friendsList.find(f => f.id === targetUserId)) { resolve({ success: false, messageKey: 'social_error_alreadyFriends' }); return; }
        const existingRequest = this.mockFriendRequestsStore.find(r => ((r.senderId === currentUserId && r.receiverId === targetUserId) || (r.senderId === targetUserId && r.receiverId === currentUserId)) && r.status === FriendRequestStatus.Pending);
        if (existingRequest) { resolve({ success: false, messageKey: 'social_error_requestAlreadyExists' }); return; }
        const newRequest: FriendRequest = {
          id: crypto.randomUUID(), senderId: currentUserId, senderName: senderProfile.name || senderProfile.friendCode,
          senderAvatarUrl: senderProfile.avatarUrl, senderFriendCode: senderProfile.friendCode,
          receiverId: targetUserId, receiverFriendCode: targetUserData.playerProfile.friendCode,
          status: FriendRequestStatus.Pending, createdAt: Date.now(),
        };
        this.mockFriendRequestsStore.push(newRequest);
        resolve({ success: true, messageKey: 'social_success_requestSent', request: newRequest });
      }, API_DELAY);
    });
  }

  public async fetchFriendRequests(userId: string): Promise<{ incoming: FriendRequest[], outgoing: FriendRequest[] }> {
      return new Promise(resolve => {
          setTimeout(() => {
              const incoming = this.mockFriendRequestsStore.filter(r => r.receiverId === userId && r.status === FriendRequestStatus.Pending);
              const outgoing = this.mockFriendRequestsStore.filter(r => r.senderId === userId && r.status === FriendRequestStatus.Pending);
              resolve({ incoming, outgoing });
          }, API_DELAY / 2);
      });
  }

  public async respondToFriendRequest(currentUserId: string, requestId: string, response: 'accept' | 'decline'): Promise<{ success: boolean, messageKey: keyof TranslationKeys, newFriend?: Friend }> {
      return new Promise(resolve => {
          setTimeout(() => {
              const requestIndex = this.mockFriendRequestsStore.findIndex(r => r.id === requestId && r.receiverId === currentUserId && r.status === FriendRequestStatus.Pending);
              if (requestIndex === -1) { resolve({ success: false, messageKey: 'social_error_requestNotFound' }); return; }
              const request = this.mockFriendRequestsStore[requestIndex];
              if (response === 'accept') {
                  this.mockFriendRequestsStore[requestIndex].status = FriendRequestStatus.Accepted;
                  const currentUserData = this.mockUserStore[currentUserId];
                  const friendUserData = this.mockUserStore[request.senderId]; 
                  if (!currentUserData || !friendUserData) { resolve({ success: false, messageKey: 'social_error_userDataNotFoundOnAccept' }); return; }
                  const newFriendForCurrentUser: Friend = {
                      id: request.senderId, name: friendUserData.playerProfile.name || request.senderName, friendCode: friendUserData.playerProfile.friendCode,
                      avatarUrl: friendUserData.playerProfile.avatarUrl, isOnline: Math.random() > 0.3, rating: friendUserData.playerProfile.rating, level: friendUserData.playerProfile.level,
                  };
                  if (!currentUserData.friendsList.find(f => f.id === newFriendForCurrentUser.id)) currentUserData.friendsList.push(newFriendForCurrentUser);
                  const newFriendForSender: Friend = {
                      id: currentUserId, name: currentUserData.playerProfile.name || 'Player', friendCode: currentUserData.playerProfile.friendCode,
                      avatarUrl: currentUserData.playerProfile.avatarUrl, isOnline: Math.random() > 0.3, rating: currentUserData.playerProfile.rating, level: currentUserData.playerProfile.level,
                  };
                  if (!friendUserData.friendsList.find(f => f.id === newFriendForSender.id)) friendUserData.friendsList.push(newFriendForSender);
                  resolve({ success: true, messageKey: 'social_success_requestAccepted', newFriend: newFriendForCurrentUser });
              } else { 
                  this.mockFriendRequestsStore[requestIndex].status = FriendRequestStatus.Declined;
                  resolve({ success: true, messageKey: 'social_success_requestDeclined' });
              }
          }, API_DELAY);
      });
  }
  
  public async removeFriend(userId: string, friendIdToRemove: string): Promise<boolean> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const playerData = this.mockUserStore[userId];
            if (playerData) {
                const initialLength = playerData.friendsList.length;
                playerData.friendsList = playerData.friendsList.filter(f => f.id !== friendIdToRemove);
                const friendData = this.mockUserStore[friendIdToRemove];
                if (friendData) friendData.friendsList = friendData.friendsList.filter(f => f.id !== userId);
                resolve(playerData.friendsList.length < initialLength);
            } else { resolve(false); }
        }, API_DELAY / 2);
    });
  }
}

const apiService = new ApiService();
export default apiService;