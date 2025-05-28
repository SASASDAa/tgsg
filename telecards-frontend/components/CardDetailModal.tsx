
import React from 'react';
import { Card, CardAbility, CardRarity } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { getAbilityIcon, KrendiCoinIcon, AttackIcon, HealthIcon, KrendiDustIcon, PlusCircleIcon } from '../assets/icons';
import { RARITY_TEXT_COLORS, RARITY_CRAFT_COSTS } from '../constants'; 
import { TranslationKeys } from '../translations/keys';
import { useAppState, useAppDispatch } from '../context/AppStateContext';

interface CardDetailModalProps {
  card: Card & { isOwned?: boolean }; 
  onClose: () => void;
}

const getRarityBadgeStyle = (rarity: CardRarity): string => {
  switch (rarity) {
    case CardRarity.Common: return 'bg-common-rarity/70 text-gray-800 border-common-rarity';
    case CardRarity.Rare: return 'bg-rare-rarity/70 text-blue-800 border-rare-rarity';
    case CardRarity.Epic: return 'bg-epic-rarity/70 text-purple-800 border-epic-rarity';
    case CardRarity.Legendary: return 'bg-legendary-rarity/70 text-orange-800 border-legendary-rarity';
    default: return 'bg-gray-500/70 text-gray-800 border-gray-600';
  }
};

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
  const { t } = useTranslations();
  const { krendiDust } = useAppState(); // Removed ownedCards as direct dependency here, reducer handles ownership check
  const dispatch = useAppDispatch();

  const cardDescription = t(card.description as keyof TranslationKeys, { defaultValue: card.description });
  const highResPortraitUrl = `https://picsum.photos/seed/CARD_DETAIL_${card.id}/400/600`;

  // Logic for when !card.isOwned (i.e., crafting UI is visible)
  const craftCost = RARITY_CRAFT_COSTS[card.rarity];
  const canAffordCraft = krendiDust >= craftCost;
  // If !card.isOwned, it means we don't have any copies, so we can always attempt to craft the first one.
  // The reducer will be the final check if for some reason ownedCopiesCount > 0.
  const canCraft = !card.isOwned && canAffordCraft; 
  
  let craftButtonMessage = "";
  if (!card.isOwned) {
    if (!canAffordCraft) {
      craftButtonMessage = t('cardDetailModal_notEnoughDust');
    }
  }

  const handleCraft = () => {
    if (canCraft) {
        dispatch({ type: 'CRAFT_CARD', payload: { cardId: card.id } });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-detail-title"
    >
      <div 
        className="bg-app-panel rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-5 w-full max-w-lg flex flex-col sm:flex-row gap-3 sm:gap-4 border-2 border-app-card-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:w-[40%] flex-shrink-0 flex justify-center items-start">
          <img 
            src={highResPortraitUrl} 
            alt={card.name} 
            className="rounded-lg shadow-lg w-full max-w-[200px] sm:max-w-none sm:w-full aspect-[2/3] object-cover border border-app-card-border"
          />
        </div>

        <div className="flex-1 space-y-2 sm:space-y-3 text-app-text">
          <div className="flex justify-between items-start">
            <h2 id="card-detail-title" className="text-xl sm:text-2xl font-bold font-display text-app-primary text-shadow-md">{card.name}</h2>
            <button 
              onClick={onClose} 
              className="text-app-text-secondary hover:text-app-primary p-1 -mr-1 -mt-1"
              aria-label={t('cardDetailModal_closeButton')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
            <div className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getRarityBadgeStyle(card.rarity)}`}>
              {t(`rarity_${card.rarity.toLowerCase()}` as keyof TranslationKeys)}
            </div>
            {card.cardType && (
              <div className="px-2 py-0.5 bg-app-bg-secondary rounded-full text-xs text-app-text-secondary font-medium border border-app-card-border">
                 {t(`cardtype_${card.cardType.toLowerCase().replace(/\s+/g, '')}` as keyof TranslationKeys, { defaultValue: card.cardType })}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm sm:text-base">
            <div className="flex items-center" title={t('cardDetailModal_cost')}>
              <KrendiCoinIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-blue-400" />
              <span className="font-semibold">{card.cost}</span>
            </div>
            {card.attack !== undefined && (
              <div className="flex items-center" title={t('cardDetailModal_attack')}>
                <AttackIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-yellow-500" />
                <span className="font-semibold">{card.attack}</span>
              </div>
            )}
            {card.health !== undefined && (
              <div className="flex items-center" title={t('cardDetailModal_health')}>
                <HealthIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-red-500" />
                <span className="font-semibold">{card.isOwned ? (card.currentHealth ?? card.health) : card.health}</span>
              </div>
            )}
          </div>

          {cardDescription && (
            <div>
              <h3 className="text-sm font-semibold text-app-text-secondary mb-0.5">{t('cardDetailModal_description')}</h3>
              <p className="text-xs sm:text-sm text-app-text leading-relaxed bg-app-bg/50 p-2 rounded-md border border-app-card-border/50">
                {cardDescription}
              </p>
            </div>
          )}

          {card.abilities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-app-text-secondary mb-1">{t('cardDetailModal_abilities')}</h3>
              <div className="space-y-1.5">
                {card.abilities.map((ability, index) => {
                  const IconComponent = getAbilityIcon(ability.type);
                  const abilityName = t(`cardability_${ability.type.toLowerCase()}_short` as keyof TranslationKeys, {defaultValue: ability.type});
                  const abilityDesc = t(ability.description as keyof TranslationKeys, { defaultValue: ability.description });
                  return (
                    <div key={index} className="flex items-start text-xs sm:text-sm bg-app-bg/50 p-1.5 rounded-md border border-app-card-border/50">
                      {IconComponent && <IconComponent className="w-4 h-4 mr-1.5 mt-0.5 text-app-primary flex-shrink-0" />}
                      <div>
                        <span className="font-semibold text-app-primary">{abilityName}</span>
                        {abilityName !== abilityDesc && abilityDesc && <span className="text-app-text-secondary ml-1">- {abilityDesc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Crafting UI - Only show if the card is NOT owned */}
          {!card.isOwned && (
            <div className="pt-2 sm:pt-3 border-t border-app-card-border/50 mt-2 sm:mt-3">
              <div className="flex items-center justify-end mb-2 text-sm">
                  <span className="text-app-text-secondary mr-1">{t('profile_krendiDustBalance')}:</span>
                  <KrendiDustIcon className="w-4 h-4 mr-0.5" />
                  <span className="font-bold text-purple-400">{krendiDust}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                  <button
                      onClick={handleCraft}
                      disabled={!canCraft} // Disabled if not enough dust
                      className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-3 rounded-md shadow-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title={craftButtonMessage || `${t('cardDetailModal_craftFor')} ${craftCost} ${t('profile_krendiDust')}`}
                  >
                      <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                      {t('cardDetailModal_craft')} ({craftCost})
                  </button>
              </div>
              {craftButtonMessage && (
                  <p className="text-xs text-center mt-2 text-red-400">
                      {craftButtonMessage}
                  </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
