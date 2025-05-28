
import React from 'react';
import { Deck } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { MAX_CARDS_PER_DECK } from '../constants';
import { EditIcon, TrashIcon, CheckCircleIcon } from '../assets/icons';

interface DeckListItemProps {
  deck: Deck;
  onEdit: () => void;
  onDelete: () => void;
  onSetActive: () => void;
}

const DeckListItem: React.FC<DeckListItemProps> = ({ deck, onEdit, onDelete, onSetActive }) => {
  const { t } = useTranslations();
  const cardCount = deck.cardIds.length;
  const isComplete = cardCount === MAX_CARDS_PER_DECK;

  return (
    <div className={`bg-app-bg-secondary p-3 rounded-lg shadow-md flex items-center space-x-3 border ${deck.isActive ? 'border-app-primary ring-1 ring-app-primary' : 'border-app-card-border'}`}>
      <div className="flex-grow">
        <p className={`font-semibold text-app-text truncate ${deck.isActive ? 'text-app-primary' : ''}`}>{deck.name}</p>
        <p className={`text-xs ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
          {cardCount} / {MAX_CARDS_PER_DECK} {t('deckBuilder_cardsLabel')}
        </p>
      </div>
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {deck.isActive ? (
          <span className="flex items-center text-xs px-2 py-1 bg-green-600/30 text-green-300 rounded-full font-semibold">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
            {t('deckBuilder_activeDeck')}
          </span>
        ) : (
          <button
            onClick={onSetActive}
            disabled={!isComplete}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={isComplete ? t('deckBuilder_setActive') : t('deckBuilder_error_incompleteActiveDeck', {deckName: deck.name, current:cardCount, required:MAX_CARDS_PER_DECK})}
          >
           {t('deckBuilder_setActive')}
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-md shadow-sm transition-colors"
          title={t('deckBuilder_editButton')}
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md shadow-sm transition-colors"
          title={t('deckBuilder_deleteDeck')}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DeckListItem;
