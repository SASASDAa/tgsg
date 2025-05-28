
import React, { useEffect, useState } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, DailyQuestDefinition, PlayerDailyQuest, GameRewardType } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { KrendiCoinIcon, getAchievementAndQuestIcon } from '../assets/icons';
import { DAILY_QUEST_REFRESH_INTERVAL, SFX_BUTTON_CLICK, getCardById } from '../constants';
import CardComponent from './CardComponent';
import soundService from '../services/soundService';

const DailyQuestsModal: React.FC = () => {
  const { dailyQuests, availableQuestsPool, lastDailyQuestRefresh, krendiCoins } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const [timeToReset, setTimeToReset] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const resetTime = lastDailyQuestRefresh + DAILY_QUEST_REFRESH_INTERVAL;
      const timeLeftMs = Math.max(0, resetTime - now);

      if (timeLeftMs === 0) {
        setTimeToReset(t('dailyQuests_resetTimer_now'));
        // Optionally, trigger a refresh dispatch if not already handled by AppStateContext
        // dispatch({ type: 'REFRESH_DAILY_QUESTS' });
        return;
      }

      const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      // const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
      setTimeToReset(`${hours}h ${minutes}m`);
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [lastDailyQuestRefresh, t]);

  const handleClaimQuest = (questDefId: string) => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'CLAIM_DAILY_QUEST_REWARD', payload: questDefId });
  };

  const handleClose = () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    dispatch({ type: 'NAVIGATE_TO', payload: Screen.Play });
  };

  const getQuestDefinition = (questDefId: string): DailyQuestDefinition | undefined => {
    return availableQuestsPool.find(q => q.id === questDefId);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-app-panel w-full rounded-xl shadow-2xl border-2 border-app-card-border flex flex-col max-h-[90vh]">
        <header className="p-3 sm:p-4 border-b border-app-card-border/70">
          <h2 id="daily-quests-title" className="text-xl sm:text-2xl font-bold text-app-primary text-center">
            {t('dailyQuests_modalTitle')}
          </h2>
        </header>

        <div className="flex-grow p-3 sm:p-4 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4">
          {dailyQuests.length === 0 && (
            <p className="text-center text-app-text-secondary py-6">{t('dailyQuests_noQuests')}</p>
          )}
          {dailyQuests.map((pq) => {
            const questDef = getQuestDefinition(pq.questDefId);
            if (!questDef) return null;

            const progressPercent = Math.min(100, (pq.currentValue / questDef.targetValue) * 100);
            const rewardCard = questDef.reward.type === GameRewardType.SpecificCard && questDef.reward.cardId ? getCardById(questDef.reward.cardId) : null;

            return (
              <div key={pq.questDefId} className="bg-app-bg-secondary p-2.5 sm:p-3 rounded-lg shadow-md border border-app-card-border/50">
                <div className="flex items-start mb-1.5 sm:mb-2">
                  <div className={`mr-2 sm:mr-3 p-1.5 bg-app-bg rounded-md ${pq.isCompleted ? 'text-app-primary' : 'text-app-text-secondary'}`}>
                    {getAchievementAndQuestIcon(questDef.iconType, "w-6 h-6 sm:w-7 sm:h-7")}
                  </div>
                  <div className="flex-grow">
                    <h4 className={`font-semibold text-sm sm:text-base ${pq.isCompleted ? 'text-app-primary' : 'text-app-text'}`}>
                      {t(questDef.nameKey)}
                    </h4>
                    <p className="text-xs text-app-text-secondary line-clamp-2">
                      {t(questDef.descriptionKey, { targetValue: questDef.targetValue })}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-right">
                    {pq.isCompleted ? (
                      pq.isClaimed ? (
                        <span className="text-xs px-2 py-1 bg-green-700/50 text-green-300 rounded-full font-semibold">
                          {t('dailyQuests_claimedButton')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaimQuest(pq.questDefId)}
                          className="bg-green-500 hover:bg-green-400 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow transition-colors"
                        >
                          {t('dailyQuests_claimButton')}
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-app-text-secondary">
                        {t('dailyQuests_progress', { current: pq.currentValue, target: questDef.targetValue })}
                      </span>
                    )}
                  </div>
                </div>
                {!pq.isCompleted && (
                  <div className="w-full bg-app-bg rounded-full h-2 sm:h-2.5 mb-1.5">
                    <div className="bg-app-primary h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                )}
                <div className="text-xs text-app-text-secondary flex items-center justify-start">
                  <span className="font-medium mr-1">Reward:</span>
                  {questDef.reward.type === GameRewardType.KrendiCoins && questDef.reward.amount && (
                    <span className="flex items-center">
                      <KrendiCoinIcon className="w-3.5 h-3.5 mr-0.5 text-app-primary" />
                      {questDef.reward.amount}
                    </span>
                  )}
                  {rewardCard && (
                    <div className="flex items-center ml-1 transform scale-[0.4] -translate-x-[25%] -translate-y-[25%] origin-top-left">
                       <CardComponent card={rewardCard} isInHand={false} isPlayable={false} isForDisplayOnly={true} />
                       <span className="ml-1 text-xs text-app-text-secondary whitespace-nowrap -translate-x-2 transform scale-[2.5]">({rewardCard.name})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="p-3 sm:p-4 border-t border-app-card-border/70 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
          <p className="text-xs text-app-text-secondary order-2 sm:order-1">
            {t('dailyQuests_resetTimer_prefix')} <span className="font-semibold text-app-primary">{timeToReset}</span>
          </p>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto bg-app-accent hover:bg-opacity-80 text-white font-semibold py-2 px-5 sm:px-6 rounded-lg shadow-md transition-colors text-sm order-1 sm:order-2"
          >
            {t('dailyQuests_closeButton')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DailyQuestsModal;
