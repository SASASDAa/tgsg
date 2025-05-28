
import React from 'react';
import { ChallengeIncomingPayload } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { UserIcon, RatingIcon } from '../assets/icons'; // Assuming you have these or similar

interface ChallengeNotificationModalProps {
  challenge: ChallengeIncomingPayload;
  onAccept: () => void;
  onDecline: () => void;
}

const ChallengeNotificationModal: React.FC<ChallengeNotificationModalProps> = ({ challenge, onAccept, onDecline }) => {
  const { t } = useTranslations();

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-title"
    >
      <div className="bg-app-panel rounded-xl shadow-2xl p-5 sm:p-6 w-full max-w-sm border-2 border-app-primary/50">
        <h2 id="challenge-title" className="text-xl sm:text-2xl font-bold text-app-primary text-center mb-4">
          {t('social_challenge_incomingTitle', {name: challenge.challengerName})}
        </h2>
        
        <div className="flex items-center justify-center mb-4">
            <img 
                src={challenge.challengerAvatarUrl || 'https://picsum.photos/seed/challenger/80/80'} 
                alt={challenge.challengerName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-app-primary shadow-md"
            />
        </div>

        <p className="text-center text-app-text-secondary mb-1">
            {t('social_challenge_rating', {rating: challenge.challengerRating || 'N/A'})}
        </p>
        <p className="text-center text-app-text-secondary mb-5">
          {t('social_challenge_message', {name: challenge.challengerName})}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors text-sm"
          >
            {t('social_challenge_acceptButton')}
          </button>
          <button
            onClick={onDecline}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors text-sm"
          >
            {t('social_challenge_declineButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeNotificationModal;
