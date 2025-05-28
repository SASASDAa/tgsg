import React, { useRef } from 'react';
import { Card, CardRarity, CardAbilityType } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { TranslationKeys } from '../translations/keys';

interface CardComponentProps {
  card: Card;
  onClick?: (card: Card, element?: HTMLElement) => void;
  isSelected?: boolean;
  isPlayable?: boolean;
  isInHand?: boolean;
  isDraggable?: boolean;
  onDragStart?: (card: Card, event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  
  isTransparent?: boolean; 
  equippedCardBackUrl?: string; // New prop for card back image

  animateEntry?: boolean;
  isAttackingAnim?: boolean;
  isTakingDamageAnim?: boolean;
  isDyingAnim?: boolean;
  isGhostPlaceholder?: boolean; 
  isForDisplayOnly?: boolean; 
  isExhausted?: boolean; 
  canBeTargeted?: boolean; 
  isOwned?: boolean; 
}

const getRarityGemStyle = (rarity: CardRarity): string => {
  switch (rarity) {
    case CardRarity.Common: return 'bg-common-rarity/60 border-common-rarity/80';
    case CardRarity.Rare: return 'bg-rare-rarity/60 border-rare-rarity/80';
    case CardRarity.Epic: return 'bg-epic-rarity/60 border-epic-rarity/80';
    case CardRarity.Legendary: return 'bg-legendary-rarity/60 border-legendary-rarity/80';
    default: return 'bg-gray-500/60 border-gray-600/80';
  }
};


const CardComponent: React.FC<CardComponentProps> = ({
  card,
  onClick,
  isSelected,
  isPlayable,
  isInHand = true,
  isDraggable,
  onDragStart,
  isTransparent,
  equippedCardBackUrl, // Destructure new prop
  animateEntry,
  isAttackingAnim,
  isTakingDamageAnim,
  isDyingAnim,
  isGhostPlaceholder,
  isForDisplayOnly,
  isExhausted,
  canBeTargeted,
  isOwned = true, 
}) => {
  const { t } = useTranslations();
  const cardElementRef = useRef<HTMLDivElement>(null);

  const handleInteractionStart = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isOwned && isDraggable && onDragStart && card.uuid && isPlayable && isInHand && !isForDisplayOnly && !isExhausted) {
      onDragStart(card, event);
      return; 
    }
  };

  const handleActualClick = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isOwned && onClick && !isForDisplayOnly && !isExhausted) {
        onClick(card, cardElementRef.current || event.currentTarget as HTMLElement);
    } else if (!isOwned && onClick) { 
        onClick(card, cardElementRef.current || event.currentTarget as HTMLElement);
    }
  };


  if (isGhostPlaceholder) {
    return <div className={`rounded-lg bg-app-panel/10 border-2 border-dashed border-app-card-border/30
                           w-[75px] h-[130px] sm:w-[85px] sm:h-[150px]`} 
            />;
  }
  
  if (isTransparent) { 
    const placeholderWidth = isInHand ? "w-[75px] sm:w-[85px]" : "w-[52px] sm:w-[60px]";
    const placeholderHeight = isInHand ? "h-[130px] sm:h-[150px]" : "h-[78px] sm:h-[90px]";

    if (equippedCardBackUrl) {
      return (
        <div className={`${placeholderWidth} ${placeholderHeight} bg-app-bg-secondary rounded-md shadow-sm overflow-hidden border-2 border-app-card-border`}>
          <img src={equippedCardBackUrl} alt={t('cardDetailModal_type', { defaultValue: "Card Back"})} className="w-full h-full object-cover" />
        </div>
      );
    }
    return ( // Fallback to generic placeholder if no equippedCardBackUrl
      <div className={`${placeholderWidth} ${placeholderHeight} bg-slate-700/80 border-2 border-slate-800/70 rounded-md shadow-sm flex items-center justify-center m-0.5 opacity-80 backdrop-blur-xs`}>
        <img src="https://picsum.photos/seed/dblogo_fallback/25/40?grayscale&blur=0.3" alt="Card Back" className="w-6 h-6 opacity-50 rounded-full shadow-inner" />
      </div>
    );
  }

  const cardWidth = isInHand ? "w-[75px] sm:w-[85px]" : "w-[48px] sm:w-[56px]"; 
  const cardHeight = isInHand ? "h-[130px] sm:h-[150px]" : "h-[70px] sm:h-[80px]";

  const manaCostSize = isInHand ? "w-6 h-6 sm:w-7 sm:h-7 text-sm sm:text-base" : "w-4 h-4 text-[0.5rem]";
  const manaCostPosition = isInHand ? "top-1 left-1" : "top-[1px] left-[1px]";

  const artHeight = isInHand ? "h-[40px] sm:h-[50px] mt-1.5 sm:mt-2" : "h-[26px] sm:h-[30px] mt-0.5"; 
  const artPadding = isInHand ? "px-1" : "px-0.5";

  const nameBannerMarginY = isInHand ? "my-0.5" : "my-[0.5px]";
  const nameBannerHeight = isInHand ? "h-5 sm:h-[22px]" : "h-[14px] sm:h-[16px]"; 
  const nameFontSize = isInHand ? "text-[0.6rem] sm:text-[0.68rem]" : "text-[0.45rem] sm:text-[0.5rem]"; 

  const rarityGemVisible = isInHand; 
  const rarityGemSize = "w-2.5 h-2.5 sm:w-3 sm:h-3 my-0.5";
  
  const cardTypeVisible = isInHand && card.attack !== undefined && card.cardType;

  const statGemSize = isInHand ? "w-6 h-6 sm:w-7 sm:h-7 text-sm sm:text-base" : "w-5 h-5 text-[0.6rem] sm:text-[0.65rem]";
  const statGemPosition = "bottom-0.5 sm:bottom-1"; 
  const mainPaddingBottom = isInHand ? "pb-11 sm:pb-[52px]" : "pb-6 sm:pb-7"; 

  const healthTextColor = card.currentHealth != null && card.maxHealth != null && card.currentHealth < card.maxHealth
                          ? (isInHand ? 'text-red-300' : 'text-red-400 font-semibold')
                          : 'text-white';
  const attackTextColor = 'text-white';
  
  let textForDescriptionArea = "";
  
  if (isOwned) {
    const abilityKeywords = card.abilities.length > 0 
      ? card.abilities.map(ability => 
          t(`cardability_${ability.type.toLowerCase()}_short` as keyof TranslationKeys, {defaultValue: ability.type})
        ).join(', ')
      : null;

    if (isInHand && !isForDisplayOnly) { 
      if (abilityKeywords) {
        textForDescriptionArea = abilityKeywords;
      } else {
        textForDescriptionArea = ""; 
      }
    } else if (!isInHand && card.attack !== undefined && !isForDisplayOnly) { 
      if (abilityKeywords) {
        textForDescriptionArea = abilityKeywords;
      } else {
        textForDescriptionArea = "";
      }
    }
  } else { 
    textForDescriptionArea = isInHand ? "???" : ""; 
  }
  
  const showDescriptionArea = !!textForDescriptionArea;
  const canBeClickedDirectly = onClick && !isForDisplayOnly && (isPlayable || (!isInHand && !isDraggable && card.attack !== undefined) || !isOwned);

  const cardImageUrl = isOwned ? (card.imageUrl || `https://picsum.photos/seed/${card.id}/180/120`) : `https://picsum.photos/seed/locked_${card.id}/180/120?grayscale&blur=1`;
  const cardNameDisplay = isOwned ? card.name : (isInHand ? card.name : "?????"); 

  return (
    <div
      ref={cardElementRef}
      className={`
        ${cardWidth} ${cardHeight}
        relative flex flex-col bg-app-panel border-2 border-app-card-border rounded-md shadow-card-on-board
        transition-all duration-150 ease-in-out font-sans text-white select-none
        ${!isOwned && isInHand ? 'filter grayscale opacity-60' : ''}
        ${isOwned && isSelected && !card.isDragging && !isForDisplayOnly ? 'ring-2 ring-offset-1 ring-offset-app-bg-secondary ring-yellow-400 scale-105 shadow-yellow-400/30 z-20' : ''}
        ${isOwned && canBeTargeted && !isForDisplayOnly ? 'ring-2 ring-app-accent/80 shadow-lg shadow-app-accent/30' : ''}
        ${isOwned && isDraggable && isPlayable && !card.isDragging && isInHand && !isForDisplayOnly && !isExhausted ? 'cursor-grab active:cursor-grabbing hover:shadow-card-in-hand-hover hover:border-mystic-blue/60' : ''}
        ${canBeClickedDirectly && (!isOwned || (isOwned && !isExhausted)) ? 'cursor-pointer' : ''}
        ${isOwned && !isDraggable && onClick && isPlayable && !card.isDragging && !isInHand && !isForDisplayOnly && card.attack === undefined /* Spells on board? */ && !isExhausted ? 'hover:shadow-yellow-400/25 hover:border-yellow-500/60' : ''}
        ${isForDisplayOnly && !onClick ? '' : (isForDisplayOnly && onClick ? 'hover:opacity-90 hover:ring-1 hover:ring-app-primary/60 transition-all' : '')}
        ${isOwned && !isPlayable && isInHand && !isForDisplayOnly ? 'opacity-60 filter saturate-60 cursor-not-allowed' : ''}
        ${isOwned && isExhausted && !isInHand ? 'filter grayscale opacity-60 cursor-not-allowed' : ''}
        ${isOwned && animateEntry && !isInHand ? 'animate-scale-in-fade-in' : ''}
        ${isOwned && isAttackingAnim ? 'animate-quick-attack-pulse' : ''}
        ${isOwned && isTakingDamageAnim ? 'animate-quick-impact-flash' : ''}
        ${isOwned && isDyingAnim ? 'animate-minion-board-death' : ''}
        group
        ${mainPaddingBottom}
      `}
      onMouseDown={handleInteractionStart} 
      onTouchStart={handleInteractionStart} 
      onClick={handleActualClick} 
      title={isOwned ? `${card.name}\nCost: ${card.cost}${card.attack !== undefined ? `\nAtk: ${card.attack} / Hp: ${card.currentHealth ?? card.health}` : ''}${showDescriptionArea && textForDescriptionArea ? `\n${textForDescriptionArea}` : ''}` : t('collection_unlockedCardTooltip')}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className={`absolute ${manaCostPosition} ${manaCostSize} bg-blue-600 border-2 border-blue-400 rounded-full flex items-center justify-center text-white font-bold shadow-sm z-20 text-shadow-sm`}>
        {card.cost}
      </div>

      <div className={`w-full ${artHeight} ${artPadding} shrink-0`}>
        <img
            src={cardImageUrl}
            alt={cardNameDisplay}
            className={`object-cover w-full h-full rounded-sm border border-slate-600/70 shadow-inner ${!isOwned && isInHand ? 'opacity-70' : ''}`}
        />
      </div>

      <div className={`relative text-center ${nameBannerMarginY} ${nameBannerHeight} flex items-center justify-center px-0.5 shrink-0`}>
        <div className="absolute inset-x-1 top-0 h-full bg-app-bg-secondary/70 border-y border-app-card-border/50 transform -skew-y-1 shadow-sm"></div>
        <h3 className={`relative font-display font-semibold text-white truncate leading-tight px-0.5 z-10 text-shadow ${nameFontSize} ${!isOwned && isInHand ? 'opacity-80' : ''}`}>
          {cardNameDisplay}
        </h3>
      </div>

      {rarityGemVisible && (
        <div className={`mx-auto ${rarityGemSize} rounded-sm border ${getRarityGemStyle(card.rarity)} shadow-sm shrink-0 z-10 ${!isOwned && isInHand ? 'opacity-70' : ''}`}></div>
      )}

      {showDescriptionArea && ( 
        <div className={`flex-grow flex flex-col justify-start overflow-hidden mx-1 shrink-0 min-h-[28px] sm:min-h-[32px]`}>
            <div className={`text-[0.5rem] sm:text-[0.52rem] leading-tight text-slate-200 overflow-hidden bg-app-bg/50 border border-app-card-border/30 rounded-sm px-1 py-0.5 text-center flex flex-col justify-center text-shadow-sm  ${!isOwned && isInHand ? 'opacity-70' : ''}`}>
              <p className="line-clamp-1 sm:line-clamp-2 hyphens-auto">
                {textForDescriptionArea}
              </p>
            </div>
        </div>
      )}
      {isOwned && cardTypeVisible && ( 
          <div className={`text-center mt-auto pt-0.5`}>
            <span className={`text-[0.45rem] sm:text-[0.5rem] font-semibold text-slate-400 bg-app-bg/60 px-1.5 py-0.5 rounded-full border border-app-card-border/40`}>
                {t(`cardtype_${card.cardType!.toLowerCase().replace(/\s+/g, '')}` as keyof TranslationKeys, { defaultValue: card.cardType })}
            </span>
          </div>
      )}

      {card.attack !== undefined && card.health !== undefined && (
        <>
          <div className={`absolute ${statGemPosition} left-0.5 sm:left-1 ${statGemSize} bg-yellow-600/80 border-2 border-yellow-400 rounded-full flex items-center justify-center ${attackTextColor} font-bold shadow-sm z-10 text-shadow-sm ${!isOwned && isInHand ? 'opacity-70' : ''}`}>
            {isOwned ? card.attack : '?'}
          </div>
          <div className={`absolute ${statGemPosition} right-0.5 sm:right-1 ${statGemSize} bg-red-700/80 border-2 border-red-500 rounded-full flex items-center justify-center ${isOwned ? healthTextColor : 'text-white'} font-bold shadow-sm z-10 text-shadow-sm ${!isOwned && isInHand ? 'opacity-70' : ''}`}>
            {isOwned ? (card.currentHealth ?? card.health) : '?'}
          </div>
        </>
      )}
    </div>
  );
};

export default CardComponent;