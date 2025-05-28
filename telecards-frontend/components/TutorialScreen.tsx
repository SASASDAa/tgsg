
import React from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { TUTORIAL_STEPS } from '../constants';
import { TutorialStepContent } from '../types'; // Corrected import source
import { useTranslations } from '../hooks/useTranslations';
import { TranslationKeys } from '../translations/keys';

const TutorialScreen: React.FC = () => {
  const { currentTutorialStep } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const totalSteps = TUTORIAL_STEPS.length;
  const currentStepContent: TutorialStepContent | undefined = TUTORIAL_STEPS.find(step => step.id === currentTutorialStep);

  const handleNextStep = () => {
    if (currentTutorialStep < totalSteps) {
      dispatch({ type: 'SET_TUTORIAL_STEP', payload: currentTutorialStep + 1 });
    } else {
      dispatch({ type: 'END_TUTORIAL' });
    }
  };

  const handlePreviousStep = () => {
    if (currentTutorialStep > 1) {
      dispatch({ type: 'SET_TUTORIAL_STEP', payload: currentTutorialStep - 1 });
    }
  };

  const handleSkipTutorial = () => {
    dispatch({ type: 'END_TUTORIAL' });
  };

  if (!currentStepContent) {
    // Should ideally not happen if currentTutorialStep is managed correctly
    // dispatch({ type: 'END_TUTORIAL' }); // Or navigate to an error/fallback
    return <div className="p-4 text-center text-app-text">{t('tutorial_error_notFound')}</div>;
  }
  
  // Placeholder for actual image mapping
  const getImageUrl = (imageName?: string) => {
    if (!imageName) return 'https://picsum.photos/seed/tutorial_generic/400/200?grayscale&blur=1';
    const seed = imageName.split('.')[0]; // e.g. tutorial_mana from tutorial_mana.png
    return `https://picsum.photos/seed/${seed}/400/220?random=${currentStepContent.id}`;
  }


  return (
    <div className="flex flex-col h-full p-3 sm:p-4 bg-app-bg text-app-text">
      <header className="mb-3 sm:mb-4 flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-app-primary">
          {t(currentStepContent.titleKey as keyof TranslationKeys)}
        </h2>
        <p className="text-sm text-app-text-secondary">
          {t('tutorial_step_indicator', { current: currentTutorialStep, total: totalSteps })}
        </p>
      </header>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-3 sm:space-y-4">
        {currentStepContent.imageName && (
          <div className="w-full aspect-video bg-app-bg-secondary rounded-lg overflow-hidden border border-app-card-border shadow-md">
            <img 
              src={getImageUrl(currentStepContent.imageName)} 
              alt={t(currentStepContent.titleKey as keyof TranslationKeys)} 
              className="w-full h-full object-contain sm:object-cover" 
            />
          </div>
        )}
        <p className="text-sm sm:text-base text-app-text-secondary leading-relaxed whitespace-pre-line bg-app-bg-secondary p-3 rounded-md border border-app-card-border/50">
          {t(currentStepContent.contentKey as keyof TranslationKeys)}
        </p>
      </div>

      <footer className="mt-4 pt-3 border-t border-app-card-border flex flex-col sm:flex-row justify-between items-center gap-2">
        <button
          onClick={handleSkipTutorial}
          className="w-full sm:w-auto text-xs sm:text-sm text-app-text-secondary hover:text-app-accent px-3 py-2 rounded-md hover:bg-app-panel transition-colors"
        >
          {t('tutorial_button_skip')}
        </button>
        <div className="flex w-full sm:w-auto space-x-2">
          <button
            onClick={handlePreviousStep}
            disabled={currentTutorialStep === 1}
            className="flex-1 sm:flex-none bg-app-bg-secondary hover:bg-app-panel text-app-text font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {t('tutorial_button_previous')}
          </button>
          <button
            onClick={handleNextStep}
            className="flex-1 sm:flex-none bg-app-primary hover:opacity-90 text-app-bg font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm"
          >
            {currentTutorialStep === totalSteps ? t('tutorial_button_finish') : t('tutorial_button_next')}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TutorialScreen;
