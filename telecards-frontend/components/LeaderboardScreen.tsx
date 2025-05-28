
import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { PlayerProfile, Friend } from '../types'; 
import { useTranslations } from '../hooks/useTranslations';
import { RatingIcon, UserIcon } from '../assets/icons'; 
import { MOCK_LEADERBOARD_GLOBAL, MOCK_LEADERBOARD_FRIENDS } from '../constants';


type LeaderboardEntry = Pick<PlayerProfile, 'name' | 'avatarUrl' | 'rating' | 'level' | 'friendCode'> | (Friend & {friendCode?: string});


const LeaderboardScreen: React.FC = () => {
  const { playerProfile, friendsList } = useAppState();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  const globalLeaderboard = useMemo(() => {
      const currentIsInGlobal = MOCK_LEADERBOARD_GLOBAL.some(p => p.friendCode === playerProfile.friendCode);
      let combinedGlobal = currentIsInGlobal ? MOCK_LEADERBOARD_GLOBAL : [...MOCK_LEADERBOARD_GLOBAL, playerProfile];
      combinedGlobal = combinedGlobal.map(p => ({...p, name: p.name || p.friendCode.substring(0,6) + "..."}));
      return combinedGlobal.sort((a, b) => b.rating - a.rating).slice(0, 50); 
  }, [playerProfile]);

  const friendsLeaderboard = useMemo(() => {
      return MOCK_LEADERBOARD_FRIENDS(playerProfile, friendsList).map(p => ({...p, name: p.name || (p as PlayerProfile).friendCode?.substring(0,6) + "..." || "Friend"}));
  }, [playerProfile, friendsList]);

  const displayedLeaderboard: LeaderboardEntry[] = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 font-bold';
    if (rank === 2) return 'text-gray-300 font-semibold';
    if (rank === 3) return 'text-orange-400 font-semibold';
    return 'text-app-text-secondary';
  };

  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-app-primary text-center mb-3 sm:mb-4 mt-1 sm:mt-2">{t('leaderboard_title')}</h2>

      <div className="flex mb-3 sm:mb-4 border-b-2 border-app-card-border">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'global' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}
        >
          {t('leaderboard_globalTab')}
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'friends' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}
        >
          {t('leaderboard_friendsTab')}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
        {displayedLeaderboard.length === 0 ? (
          <p className="text-center text-app-text-secondary py-6">{t('leaderboard_noData')}</p>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {displayedLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.friendCode === playerProfile.friendCode || (entry as Friend).id === playerProfile.friendCode; 
              return (
                <div 
                    key={entry.friendCode || (entry as Friend).id || index} 
                    className={`bg-app-bg-secondary p-2 sm:p-2.5 rounded-lg shadow-md flex items-center space-x-2 sm:space-x-3
                                ${isCurrentUser ? 'border-2 border-app-primary ring-1 ring-app-primary' : 'border border-transparent'}`}
                >
                  <span className={`w-6 sm:w-8 text-center font-mono text-sm sm:text-base ${getRankColor(rank)}`}>{rank}.</span>
                  <img 
                    src={entry.avatarUrl || 'https://picsum.photos/seed/leaderboardavatar/40/40'} 
                    alt={entry.name || 'Player'} 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-app-card-border"
                  />
                  <div className="flex-grow">
                    <p className={`font-semibold truncate text-sm sm:text-base ${isCurrentUser ? 'text-app-primary' : 'text-app-text'}`}>{entry.name || 'Anonymous Player'}</p>
                    <p className="text-xs text-app-text-secondary">
                        {t('leaderboard_levelHeader')}: {entry.level}
                    </p>
                  </div>
                  <div className="flex items-center text-sm sm:text-base text-yellow-400 font-semibold">
                    <RatingIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    {entry.rating}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;