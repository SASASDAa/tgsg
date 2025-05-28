
import React, { useState, useMemo, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, Card, CardRarity } from '../types';
import CardComponent from './CardComponent';
import CardDetailModal from './CardDetailModal';
import { useTranslations } from '../hooks/useTranslations';
import { ALL_CARDS_POOL_RAW } from '../constants'; // Import all card prototypes
import { TranslationKeys } from '../translations/keys';
import { KrendiDustIcon } from '../assets/icons';

interface DisplayableCollectionCard extends Card {
  isOwned: boolean;
}

const Collection: React.FC = () => {
  const { ownedCards, krendiDust } = useAppState(); // Added krendiDust
  const dispatch = useAppDispatch(); 
  const { t } = useTranslations();
  
  const [filterRarity, setFilterRarity] = useState<CardRarity | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<DisplayableCollectionCard | null>(null);
  const [filterOwnership, setFilterOwnership] = useState<'ALL' | 'OWNED' | 'UNOWNED'>('ALL');

  const pointerDownPos = useRef<{ x: number, y: number } | null>(null);
  const isDraggingForScroll = useRef(false);
  const MAX_DRAG_DISTANCE = 10;

  const allDisplayableCards = useMemo((): DisplayableCollectionCard[] => {
    const ownedCardIdsAndUuids = new Map(ownedCards.map(c => [c.id, c])); // Map ID to full owned card instance
    return ALL_CARDS_POOL_RAW.map(rawCard => {
      const ownedCardInstance = ownedCardIdsAndUuids.get(rawCard.id);
      const isOwned = !!ownedCardInstance;
      return {
        ...rawCard,
        uuid: ownedCardInstance?.uuid || rawCard.id, // Use owned UUID if exists, else prototype ID (modal needs UUID for disenchant)
        currentHealth: ownedCardInstance?.currentHealth ?? rawCard.health,
        maxHealth: ownedCardInstance?.maxHealth ?? rawCard.health,
        isPlayed: ownedCardInstance?.isPlayed || false,
        hasAttacked: ownedCardInstance?.hasAttacked || false,
        isDragging: ownedCardInstance?.isDragging || false,
        isOwned: isOwned,
      };
    });
  }, [ownedCards]);

  const filteredCards = useMemo(() => {
    return allDisplayableCards
      .filter(card => {
        if (filterOwnership === 'OWNED') return card.isOwned;
        if (filterOwnership === 'UNOWNED') return !card.isOwned;
        return true; // ALL
      })
      .filter(card => filterRarity === 'ALL' || card.rarity === filterRarity)
      .filter(card => {
        const cardName = card.name.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        if (cardName.includes(searchLower)) return true;
        
        // For unowned cards, we might only search name and type.
        // For owned, we can search description and abilities.
        // if (card.isOwned) { // Search description/abilities for all cards if available in prototype
          if (t(card.description as keyof TranslationKeys, {defaultValue: card.description} ).toLowerCase().includes(searchLower)) return true;
          if (card.abilities.some(ab => t(ab.description as keyof TranslationKeys, {defaultValue: ab.description}).toLowerCase().includes(searchLower))) return true;
        // }
        return false;
      })
      .sort((a,b) => a.cost - b.cost || a.name.localeCompare(b.name));
  }, [allDisplayableCards, filterRarity, searchTerm, t, filterOwnership]);

  const handleCardClick = (card: DisplayableCollectionCard) => {
    setSelectedCardForDetail(card);
  };
  
  const handlePointerDown = (event: React.PointerEvent) => {
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
    isDraggingForScroll.current = false;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (pointerDownPos.current) {
      const deltaX = Math.abs(event.clientX - pointerDownPos.current.x);
      const deltaY = Math.abs(event.clientY - pointerDownPos.current.y);
      if (deltaX > MAX_DRAG_DISTANCE || deltaY > MAX_DRAG_DISTANCE) {
        isDraggingForScroll.current = true;
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent, card: DisplayableCollectionCard) => {
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    if (!isDraggingForScroll.current && pointerDownPos.current) {
      handleCardClick(card);
    }
    pointerDownPos.current = null;
    isDraggingForScroll.current = false;
  };
  
  const totalUniqueCards = ALL_CARDS_POOL_RAW.length;
  const ownedUniqueCardCount = new Set(ownedCards.map(c => c.id)).size;

  return (
    <div className="p-2 sm:p-3 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-3 mt-1 sm:mt-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-app-primary text-center">{t('collection_title')}</h2>
        <div className="flex items-center space-x-3">
          <p className="text-sm text-app-text-secondary">
            {t('collection_stats_collected', { count: ownedUniqueCardCount })} / {totalUniqueCards}
          </p>
          <div className="flex items-center text-sm text-purple-400" title={t('profile_krendiDustBalance')}>
            <KrendiDustIcon className="w-4 h-4 mr-1" />
            <span className="font-semibold">{krendiDust}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-2 sm:mb-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 items-center text-xs">
        <input 
          type="text"
          placeholder={t('collection_searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-1.5 rounded-lg bg-app-bg border border-app-card-border text-app-text w-full focus:ring-1 focus:ring-app-primary outline-none"
          aria-label={t('collection_searchPlaceholder')}
        />
        <select 
          value={filterRarity} 
          onChange={(e) => setFilterRarity(e.target.value as CardRarity | 'ALL')}
          className="p-1.5 rounded-lg bg-app-bg border border-app-card-border text-app-text w-full focus:ring-1 focus:ring-app-primary outline-none"
          aria-label={t('collection_rarityFilter_label')}
        >
          <option value="ALL">{t('collection_rarityFilter_all')}</option>
          {Object.values(CardRarity).map(rarity => (
            <option key={rarity} value={rarity}>{t(`rarity_${rarity.toLowerCase()}` as keyof TranslationKeys)}</option>
          ))}
        </select>
        <select 
          value={filterOwnership} 
          onChange={(e) => setFilterOwnership(e.target.value as 'ALL' | 'OWNED' | 'UNOWNED')}
          className="p-1.5 rounded-lg bg-app-bg border border-app-card-border text-app-text w-full focus:ring-1 focus:ring-app-primary outline-none"
          aria-label={t('collection_ownershipFilter_label')}
        >
          <option value="ALL">{t('collection_ownershipFilter_all')}</option>
          <option value="OWNED">{t('collection_ownershipFilter_owned')}</option>
          <option value="UNOWNED">{t('collection_ownershipFilter_locked')}</option>
        </select>
      </div>

      {allDisplayableCards.length === 0 && filterOwnership !== 'UNOWNED' ? ( 
         <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <img src="https://picsum.photos/seed/emptycollection/100/100?grayscale&blur=1" alt={t('collection_empty_alt')} className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4 opacity-60 rounded-lg" />
            <p className="text-lg sm:text-xl text-app-text-secondary mb-1">{t('collection_empty_message')}</p>
            <p className="text-xs sm:text-sm text-app-text-secondary opacity-80 mb-3 sm:mb-4">{t('collection_empty_visitShop')}</p>
            <button
                onClick={() => dispatch({ type: 'NAVIGATE_TO', payload: Screen.Shop })}
                className="bg-app-primary hover:opacity-90 text-app-bg font-semibold py-2 px-5 sm:px-6 rounded-lg shadow-md transition-colors text-sm sm:text-base"
            >
                {t('collection_empty_goToShopButton')}
            </button>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto grid grid-cols-3 xs:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-1.5 p-1 bg-app-bg/30 rounded-lg custom-scrollbar">
          {filteredCards.map(card => (
            <div 
              key={card.uuid || card.id} 
              className="flex justify-center items-center"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(e, card)}
              onPointerCancel={() => { 
                pointerDownPos.current = null;
                isDraggingForScroll.current = false;
              }}
              style={{ touchAction: 'pan-y' }} 
            > 
              <CardComponent 
                card={card} 
                isOwned={card.isOwned} 
                isInHand={true} 
                isPlayable={false} 
                isDraggable={false} 
                isForDisplayOnly={true}
                onClick={() => handleCardClick(card)} 
              />
            </div>
          ))}
           {filteredCards.length === 0 && (searchTerm || filterRarity !== 'ALL' || filterOwnership !== 'ALL') && (
            <p className="col-span-full text-center text-app-text-secondary py-10 text-sm sm:text-base">{t('collection_noResults')}</p>
          )}
        </div>
      )}
      <p className="text-center text-xs text-app-text-secondary mt-2 opacity-80">
        {t('collection_stats_showing', { count: filteredCards.length })}
      </p>

      {selectedCardForDetail && ( 
        <CardDetailModal 
          card={selectedCardForDetail} 
          onClose={() => setSelectedCardForDetail(null)} 
        />
      )}
    </div>
  );
};

export default Collection;
