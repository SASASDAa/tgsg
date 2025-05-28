
import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch } from '../context/AppStateContext';
import { Deck, Card, CardRarity } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import CardComponent from './CardComponent';
import { MAX_CARDS_PER_DECK, getCardById } from '../constants'; // Removed ALL_CARDS_POOL_RAW as it's not directly used for auto-deck logic based on available ownedCards
import { SaveIcon, AutoAwesomeIcon, TrashIcon, QuestionMarkCircleIcon } from '../assets/icons';
import { TranslationKeys } from '../translations/keys';

interface DeckEditorProps {
  deck: Deck;
  ownedCards: Card[];
}

const DeckEditor: React.FC<DeckEditorProps> = ({ deck: initialDeck, ownedCards }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const [deckName, setDeckName] = useState(initialDeck.name);
  const [currentDeckCards, setCurrentDeckCards] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState<CardRarity | 'ALL'>('ALL');
  const [showAutoDeckInfo, setShowAutoDeckInfo] = useState(false);

  useEffect(() => {
    setDeckName(initialDeck.name);
    const hydratedDeckCards = initialDeck.cardIds
      .map(id => {
        // Find the card prototype from ownedCards to ensure we use the up-to-date card definition
        const cardPrototype = ownedCards.find(c => c.id === id) || getCardById(id);
        return cardPrototype ? { ...cardPrototype, uuid: crypto.randomUUID() } : null;
      })
      .filter(Boolean) as Card[];
    setCurrentDeckCards(hydratedDeckCards);
  }, [initialDeck, ownedCards]);

  const availableOwnedCards = useMemo(() => {
    return ownedCards
      .filter(card => filterRarity === 'ALL' || card.rarity === filterRarity)
      .filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t(card.description as keyof TranslationKeys).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  }, [ownedCards, filterRarity, searchTerm, t]);

  const addCardToDeck = (cardToAdd: Card) => {
    if (currentDeckCards.length < MAX_CARDS_PER_DECK) {
      setCurrentDeckCards(prev => [...prev, { ...cardToAdd, uuid: crypto.randomUUID() }]);
    } else {
      dispatch({type: 'SET_ERROR', payload: t('deckBuilder_error_maxCardsReached', {max: MAX_CARDS_PER_DECK})});
    }
  };

  const removeCardFromDeck = (cardUuidToRemove: string) => {
    setCurrentDeckCards(prev => prev.filter(c => c.uuid !== cardUuidToRemove));
  };

  const handleSaveDeck = () => {
    if (!deckName.trim()) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_deckNameRequired') });
      return;
    }
    if (currentDeckCards.length !== MAX_CARDS_PER_DECK) {
      dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_error_deckNotEnoughCards', { max: MAX_CARDS_PER_DECK }) });
      return;
    }
    const updatedDeck: Deck = {
      ...initialDeck,
      name: deckName.trim(),
      cardIds: currentDeckCards.map(c => c.id),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'UPDATE_DECK', payload: updatedDeck });
    dispatch({ type: 'SET_SELECTED_DECK_ID', payload: null }); 
    // Using SET_ERROR for success message is a temporary hack, ideally use a proper notification system
    dispatch({ type: 'SET_ERROR', payload: t('deckBuilder_status_deckSaved', {deckName: updatedDeck.name})}); 
  };

  const handleCancel = () => {
    dispatch({ type: 'SET_SELECTED_DECK_ID', payload: null });
  };

  const handleAutoDeck = () => {
    if (ownedCards.length === 0) return;

    const sortedOwnedCards = [...ownedCards].sort((a, b) => {
        // Prioritize lower cost, then higher rarity for some variety
        if (a.cost !== b.cost) return a.cost - b.cost;
        const rarityOrder = { [CardRarity.Legendary]: 0, [CardRarity.Epic]: 1, [CardRarity.Rare]: 2, [CardRarity.Common]: 3 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
    
    let newDeck: Card[] = [];
    const cardCountsInDeck: { [cardId: string]: number } = {};

    // Fill the deck, allowing up to 2 copies of non-Legendary, 1 copy of Legendary
    for (const card of sortedOwnedCards) {
        if (newDeck.length >= MAX_CARDS_PER_DECK) break;

        const currentCount = cardCountsInDeck[card.id] || 0;
        const maxCopies = card.rarity === CardRarity.Legendary ? 1 : 2;

        if (currentCount < maxCopies) {
            newDeck.push({ ...card, uuid: crypto.randomUUID() });
            cardCountsInDeck[card.id] = currentCount + 1;
        }
    }
    
    // If deck is still not full (e.g. small collection), fill with any available cards respecting copy limits
    let emergencyFillIndex = 0;
    while (newDeck.length < MAX_CARDS_PER_DECK && emergencyFillIndex < sortedOwnedCards.length) {
        const card = sortedOwnedCards[emergencyFillIndex];
        const currentCount = cardCountsInDeck[card.id] || 0;
        const maxCopies = card.rarity === CardRarity.Legendary ? 1 : 2;

        if (currentCount < maxCopies) {
             newDeck.push({ ...card, uuid: crypto.randomUUID() });
             cardCountsInDeck[card.id] = currentCount + 1;
        }
        emergencyFillIndex++;
    }
    setCurrentDeckCards(newDeck.slice(0, MAX_CARDS_PER_DECK)); // Ensure strictly MAX_CARDS_PER_DECK
  };


  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      {/* Header: Title and Back Button */}
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xl sm:text-2xl font-bold text-app-primary truncate max-w-[calc(100%-80px)] sm:max-w-[calc(100%-100px)]">
          {t('deckBuilder_editDeckTitle', { deckName: initialDeck.name })}
        </h3>
        <button onClick={handleCancel} className="text-sm text-app-text-secondary hover:text-app-primary px-2 py-1">
          {t('deckBuilder_backToDeckList')}
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-3">
        {/* Deck Name & Auto-Deck */}
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder={t('deckBuilder_deckNamePlaceholder')}
            className="flex-grow p-2 rounded-lg bg-app-bg border border-app-card-border text-app-text focus:ring-1 focus:ring-app-primary outline-none text-sm w-full"
          />
          <div className="relative w-full sm:w-auto">
              <button
              onClick={handleAutoDeck}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center"
              >
              <AutoAwesomeIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
              {t('deckBuilder_autoDeck')}
              </button>
              <QuestionMarkCircleIcon 
                  className="absolute top-1 right-1 w-4 h-4 text-purple-200 hover:text-white cursor-pointer"
                  onClick={() => setShowAutoDeckInfo(!showAutoDeckInfo)}
              />
          </div>
        </div>
        {showAutoDeckInfo && (
          <p className="text-xs text-app-text-secondary bg-app-bg/50 p-1.5 rounded-md mt-1 border border-app-card-border/30">
              {t('deckBuilder_autoDeckInfo', {max: MAX_CARDS_PER_DECK})}
          </p>
        )}

        {/* Card Count */}
        <h4 className="text-sm font-semibold text-app-text-secondary mb-1 mt-2">
          {t('deckBuilder_cardsInDeck', { count: currentDeckCards.length, max: MAX_CARDS_PER_DECK })}
        </h4>

        {/* Current Deck Display */}
        <div className="min-h-[90px] sm:min-h-[100px] bg-app-bg/40 p-1.5 rounded-lg border border-app-card-border flex flex-wrap gap-1.5 justify-center items-start overflow-y-auto custom-scrollbar max-h-[160px] sm:max-h-[180px]">
          {currentDeckCards.length === 0 && <p className="text-xs text-app-text-secondary/70 p-4 text-center w-full">{t('collection_empty_message')}</p>} {/* Re-use translation if appropriate */}
          {currentDeckCards.map((card) => (
            <div key={card.uuid} className="relative group cursor-pointer" onClick={() => removeCardFromDeck(card.uuid!)}>
              <CardComponent card={card} isInHand={false} isPlayable={false} />
              <div className="absolute inset-0 bg-red-700/70 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Collection View for Adding Cards */}
        <div className="flex-grow flex flex-col overflow-hidden mt-2"> {/* Added mt-2 for spacing */}
          <h4 className="text-sm font-semibold text-app-text-secondary mb-1">{t('deckBuilder_yourCollection')}</h4>
          <div className="mb-2 flex flex-col sm:flex-row gap-1.5 text-xs">
            <input
              type="text"
              placeholder={t('collection_searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-1.5 rounded-md bg-app-bg border border-app-card-border/70 text-app-text focus:ring-1 focus:ring-app-primary outline-none"
            />
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as CardRarity | 'ALL')}
              className="p-1.5 rounded-md bg-app-bg border border-app-card-border/70 text-app-text focus:ring-1 focus:ring-app-primary outline-none sm:w-auto"
            >
              <option value="ALL">{t('collection_rarityFilter_all')}</option>
              {Object.values(CardRarity).map(rarity => (
                <option key={rarity} value={rarity}>{t(`rarity_${rarity.toLowerCase()}` as keyof TranslationKeys)}</option>
              ))}
            </select>
          </div>
          <div className="flex-grow overflow-y-auto grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-1.5 bg-app-bg/30 p-1.5 rounded-lg border border-app-card-border/50 custom-scrollbar min-h-[150px]"> {/* Added min-h */}
            {availableOwnedCards.map((card) => (
              <div key={card.id} onClick={() => addCardToDeck(card)} className="cursor-pointer">
                <CardComponent card={card} isInHand={false} isPlayable={currentDeckCards.length < MAX_CARDS_PER_DECK} />
              </div>
            ))}
            {availableOwnedCards.length === 0 && (
              <p className="col-span-full text-center text-app-text-secondary py-6 text-xs">{t('collection_noResults')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer for Save */}
      <div className="mt-auto pt-3 border-t border-app-card-border flex-shrink-0">
        <button
          onClick={handleSaveDeck}
          disabled={currentDeckCards.length !== MAX_CARDS_PER_DECK || !deckName.trim()}
          className="w-full bg-app-primary hover:opacity-90 text-app-bg font-bold py-2.5 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
        >
          <SaveIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          {t('deckBuilder_saveDeck')}
        </button>
      </div>
    </div>
  );
};

export default DeckEditor;
