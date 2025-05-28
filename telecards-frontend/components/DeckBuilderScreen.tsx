
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen, Deck } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import DeckListItem from './DeckListItem';
import DeckEditor from './DeckEditor';
import { PlusCircleIcon } from '../assets/icons';

const DeckBuilderScreen: React.FC = () => {
  const { playerDecks, selectedDeckId, ownedCards } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null); // deckId to delete

  const handleCreateNewDeck = () => {
    dispatch({ type: 'CREATE_DECK', payload: { name: t('deckBuilder_deckNamePlaceholder') } });
    // The reducer should set selectedDeckId
  };

  const handleEditDeck = (deckId: string) => {
    dispatch({ type: 'SET_SELECTED_DECK_ID', payload: deckId });
  };

  const handleDeleteDeck = (deckId: string) => {
    setShowConfirmDelete(deckId);
  };

  const confirmDelete = () => {
    if (showConfirmDelete) {
      dispatch({ type: 'DELETE_DECK', payload: showConfirmDelete });
      setShowConfirmDelete(null);
    }
  };

  const handleSetActiveDeck = (deckId: string) => {
    dispatch({ type: 'SET_ACTIVE_DECK', payload: deckId });
  };

  if (selectedDeckId) {
    const deckToEdit = playerDecks.find(d => d.id === selectedDeckId);
    if (deckToEdit) {
      return <DeckEditor deck={deckToEdit} ownedCards={ownedCards} />;
    } else {
      // Should not happen if selectedDeckId is valid, but as a fallback:
      dispatch({ type: 'SET_SELECTED_DECK_ID', payload: null });
      return null; // Or some error message
    }
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 sm:mb-4 mt-1 sm:mt-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-app-primary">{t('deckBuilder_title')}</h2>
        <button
          onClick={() => dispatch({ type: 'NAVIGATE_TO', payload: Screen.Play })}
          className="text-sm text-app-text-secondary hover:text-app-primary"
        >
          {t('deckBuilder_backToDeckList')} {/* Or a more generic "Back" */}
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={handleCreateNewDeck}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition duration-150 flex items-center justify-center text-sm sm:text-base"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          {t('deckBuilder_createNewDeck')}
        </button>
      </div>

      {playerDecks.length === 0 ? (
        <p className="text-center text-app-text-secondary py-6">{t('deckBuilder_noDecks')}</p>
      ) : (
        <div className="flex-grow overflow-y-auto space-y-2 sm:space-y-3 custom-scrollbar pr-1">
          {playerDecks.map(deck => (
            <DeckListItem
              key={deck.id}
              deck={deck}
              onEdit={() => handleEditDeck(deck.id)}
              onDelete={() => handleDeleteDeck(deck.id)}
              onSetActive={() => handleSetActiveDeck(deck.id)}
            />
          ))}
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-panel p-4 sm:p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h3 className="text-lg font-semibold text-app-primary mb-3">{t('deckBuilder_confirmDeleteTitle')}</h3>
            <p className="text-app-text-secondary mb-4 text-sm">
              {t('deckBuilder_confirmDeleteMsg', { deckName: playerDecks.find(d => d.id === showConfirmDelete)?.name || '' })}
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowConfirmDelete(null)} className="px-4 py-2 text-sm rounded-md bg-app-bg-secondary hover:bg-app-card-border text-app-text-secondary transition-colors">
                {t('deckBuilder_button_cancel')}
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-md bg-app-accent hover:opacity-90 text-white transition-colors">
                {t('deckBuilder_button_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckBuilderScreen;
