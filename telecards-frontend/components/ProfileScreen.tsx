import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, GameReward, GameRewardType, AchievementIconType, PlayerAchievementProgress, Achievement, AvatarFrame } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { UserIcon, XPIcon, RatingIcon, KrendiCoinIcon, CopyIcon, CheckCircleIcon, TrophyIcon, CardStackIcon, RobotIcon, LevelUpIcon, QuestionMarkCircleIcon } from '../assets/icons';
import { calculateXpToNextLevel, REWARDS_PER_LEVEL, getCardById, ALL_AVATAR_FRAMES, DEFAULT_AVATAR_FRAME_ID } from '../constants';
import CardComponent from './CardComponent'; 
import { TranslationKeys } from '../translations/keys';

const getAchievementIcon = (iconType: AchievementIconType, className?: string): React.ReactNode => {
  switch (iconType) {
    case AchievementIconType.GameWin: return <TrophyIcon className={className} />;
    case AchievementIconType.CardCollect: return <CardStackIcon className={className} />;
    case AchievementIconType.RatingReach: return <RatingIcon className={className} />;
    case AchievementIconType.BotWin: return <RobotIcon className={className} />;
    case AchievementIconType.LevelUp: return <LevelUpIcon className={className} />;
    case AchievementIconType.KrendiCoinsEarned: return <KrendiCoinIcon className={className} />;
    // Ensure CosmeticUnlock has an icon if it's used, or map it to a generic one
    case AchievementIconType.CosmeticUnlock: return <UserIcon className={className} />; // Placeholder, update if a specific icon is available
    default: return <QuestionMarkCircleIcon className={className} />;
  }
}

// Adapted PlayerAvatarWithFrame for ProfileScreen (similar to PlayScreen's)
const PlayerAvatarWithFrame: React.FC<{avatarUrl?: string, frameUrl?: string, name?: string, sizeClass?: string, frameSizeClass?: string, avatarClass?: string }> = 
  ({avatarUrl, frameUrl, name, sizeClass = "w-16 h-16 sm:w-20 sm:h-20", frameSizeClass = "w-full h-full", avatarClass }) => (
    <div className={`relative ${sizeClass}`}>
        <img
            src={avatarUrl || 'https://picsum.photos/seed/profile/100/100'}
            alt={name || "Player Avatar"}
            className={`w-full h-full rounded-full object-cover ${avatarClass || 'border-2 border-app-primary'}`}
        />
        {frameUrl && (
            <img
                src={frameUrl}
                alt="Avatar Frame"
                className={`absolute inset-0 object-contain pointer-events-none ${frameSizeClass}`}
            />
        )}
    </div>
);


const ProfileScreen: React.FC = () => {
  const { playerProfile, currentUser, achievements, playerAchievements } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements'>('profile');

  const equippedFrame = useMemo((): AvatarFrame | undefined => {
    if (!playerProfile || !playerProfile.equippedAvatarFrameId) {
      return ALL_AVATAR_FRAMES.find(f => f.id === DEFAULT_AVATAR_FRAME_ID);
    }
    return ALL_AVATAR_FRAMES.find(f => f.id === playerProfile.equippedAvatarFrameId);
  }, [playerProfile]);

  if (!playerProfile || !currentUser) {
    return (
      <div className="p-4 text-center">
        <p>{t('app_loadingUserData')}</p>
      </div>
    );
  }

  const { level, xp, xpToNextLevel, rating, friendCode, avatarUrl } = playerProfile;
  const { progressPercentage } = calculateXpToNextLevel(level, xp);

  const handleCopyFriendCode = () => {
    navigator.clipboard.writeText(friendCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy friend code: ', err));
  };
  
  const getPlayerRewardsHistory = (): { level: number, rewards: GameReward[] }[] => {
    const history = [];
    for (let i = 2; i <= playerProfile.level; i++) { 
        if (REWARDS_PER_LEVEL[i]) {
            history.push({level: i, rewards: REWARDS_PER_LEVEL[i]});
        }
    }
    return history;
  }
  const rewardsHistory = getPlayerRewardsHistory();

  const handleClaimReward = (achievementId: string) => {
    dispatch({ type: 'CLAIM_ACHIEVEMENT_REWARD', payload: achievementId });
  };
  
  const sortedPlayerAchievements = [...playerAchievements].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1; 
    const achA = achievements.find(ach => ach.id === a.achievementId);
    const achB = achievements.find(ach => ach.id === b.achievementId);
    if (achA && achB) return achA.nameKey.localeCompare(achB.nameKey);
    return 0;
  });


  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-app-primary text-center mb-3 sm:mb-4 mt-1 sm:mt-2">{t('profile_title')}</h2>
      
      <div className="flex mb-3 sm:mb-4 border-b-2 border-app-card-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'profile' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}
        >
          {t('profile_tab_main')}
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2 px-3 text-sm sm:text-base font-semibold transition-colors ${activeTab === 'achievements' ? 'text-app-primary border-b-2 border-app-primary' : 'text-app-text-secondary hover:text-app-text'}`}
        >
          {t('profile_tab_achievements')}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-0.5">
        {activeTab === 'profile' && (
          <>
            <div className="bg-app-bg-secondary p-3 sm:p-4 rounded-lg shadow-xl mb-4 sm:mb-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <PlayerAvatarWithFrame
                  avatarUrl={avatarUrl || currentUser.photoUrl}
                  frameUrl={equippedFrame?.imageUrl}
                  name={currentUser.firstName}
                  avatarClass="border-2 border-app-primary"
                />
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xl sm:text-2xl font-semibold text-app-text">{playerProfile.name || currentUser.firstName}</h3>
                  <p className="text-sm text-app-text-secondary">@{currentUser.username || 'player'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-app-primary" />
                  <span>{t('profile_level')}: <span className="font-bold">{level}</span></span>
                </div>
                <div className="flex items-center">
                  <XPIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                  <span>{t('profile_xp')}: <span className="font-bold">{xp} / {xpToNextLevel}</span></span>
                </div>
                <div className="w-full bg-app-bg rounded-full h-2 sm:h-2.5 mt-1">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="flex items-center">
                  <RatingIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-400" />
                  <span>{t('profile_rating')}: <span className="font-bold">{rating}</span></span>
                </div>
              </div>
            </div>

            <div className="bg-app-bg-secondary p-3 sm:p-4 rounded-lg shadow-xl mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-app-text-secondary mb-1">{t('profile_friendCode')}</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={friendCode} 
                  readOnly 
                  className="flex-grow p-2 bg-app-bg border border-app-card-border rounded-md text-app-text focus:outline-none text-sm sm:text-base"
                />
                <button 
                  onClick={handleCopyFriendCode}
                  className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-app-primary hover:opacity-90'}`}
                  title={copied ? t('profile_copiedCode') : t('profile_copyCodeButton')}
                >
                  {copied ? <CheckCircleIcon className="w-5 h-5 text-app-bg" /> : <CopyIcon className="w-5 h-5 text-app-bg" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mt-1">{t('profile_copiedCode')}</p>}
            </div>
            
            <div className="bg-app-bg-secondary p-3 sm:p-4 rounded-lg shadow-xl">
              <h4 className="text-md sm:text-lg font-semibold text-app-primary mb-2 sm:mb-3">{t('profile_levelRewardsTitle')}</h4>
              {rewardsHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {rewardsHistory.map(entry => (
                    <div key={entry.level} className="text-xs sm:text-sm border-b border-app-card-border/50 pb-1 mb-1">
                      <p className="font-semibold text-app-text-secondary"> {t('profile_level')} {entry.level}:</p>
                      {entry.rewards.map((reward, idx) => (
                        <div key={idx} className="ml-2 flex items-center text-app-text">
                          {reward.type === GameRewardType.KrendiCoins && <KrendiCoinIcon className="w-3 h-3 mr-1 text-app-primary inline-block"/>}
                          {reward.type === GameRewardType.SpecificCard && getCardById(reward.cardId || '') && (
                              <div className="inline-block transform scale-50 -ml-3 -my-3"> 
                                <CardComponent card={getCardById(reward.cardId || '')!} isForDisplayOnly={true} isInHand={false} />
                              </div>
                          )}
                          <span className="ml-1">{t(reward.description as keyof TranslationKeys, {defaultValue: reward.description})}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-app-text-secondary">{t('profile_noRewardsYet')}</p>
              )}
            </div>
          </>
        )}
        {activeTab === 'achievements' && (
          <div className="space-y-2 sm:space-y-3">
            {sortedPlayerAchievements.length === 0 && <p className="text-app-text-secondary text-center py-4">{t('profile_noAchievementsYet')}</p>}
            {sortedPlayerAchievements.map(progress => {
              const achievement = achievements.find(a => a.id === progress.achievementId);
              if (!achievement) return null;
              const progressPercent = Math.min(100, (progress.currentValue / achievement.targetValue) * 100);
              return (
                <div key={achievement.id} className={`bg-app-bg-secondary p-2.5 sm:p-3 rounded-lg shadow-md border ${progress.isCompleted ? 'border-app-primary/50 opacity-80' : 'border-app-card-border'}`}>
                  <div className="flex items-center mb-1.5">
                    <div className={`mr-2 sm:mr-3 p-1.5 bg-app-bg rounded-md ${progress.isCompleted ? 'text-app-primary' : 'text-app-text-secondary'}`}>
                      {getAchievementIcon(achievement.iconType, "w-5 h-5 sm:w-6 sm:h-6")}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-sm sm:text-base ${progress.isCompleted ? 'text-app-primary' : 'text-app-text'}`}>{t(achievement.nameKey as keyof TranslationKeys)}</h4>
                      <p className="text-xs text-app-text-secondary">{t(achievement.descriptionKey as keyof TranslationKeys, { target: achievement.targetValue })}</p>
                    </div>
                  </div>
                  {!progress.isCompleted && (
                    <div className="my-1">
                      <div className="flex justify-between text-xs text-app-text-secondary mb-0.5">
                        <span>{progress.currentValue} / {achievement.targetValue}</span>
                        <span>{Math.floor(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-app-bg rounded-full h-1.5 sm:h-2">
                        <div className="bg-app-primary h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  )}
                   {achievement.reward && progress.isCompleted && (
                    <div className="mt-2 pt-2 border-t border-app-card-border/30 text-center">
                      {progress.isClaimed ? (
                        <p className="text-xs text-green-400 font-semibold flex items-center justify-center"><CheckCircleIcon className="w-4 h-4 mr-1"/> {t('profile_rewardClaimed')}</p>
                      ) : (
                        <button
                          onClick={() => handleClaimReward(achievement.id)}
                          className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow transition-colors w-full sm:w-auto"
                        >
                          {t('profile_claimRewardButton')} (+{achievement.reward.amount} {achievement.reward.type === GameRewardType.KrendiCoins ? 'KrendiCoins' : 'Card'})
                        </button>
                      )}
                    </div>
                  )}
                   {progress.isCompleted && !achievement.reward && (
                     <p className="text-xs text-green-400 font-semibold text-center mt-1 flex items-center justify-center"><CheckCircleIcon className="w-4 h-4 mr-1"/> {t('profile_achievementCompleted')}</p>
                   )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;