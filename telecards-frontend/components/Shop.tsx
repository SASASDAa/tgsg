
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import apiService from '../services/apiService';
import { Screen, Card, ShopSection, AvatarFrame, CardBack, CustomizationItemType, PlayerProfile, ChestOpeningResponse } from '../types';
import { KRENDI_COIN_CHEST_COST, CARDS_PER_CHEST, SFX_CHEST_OPEN, SFX_CARD_REVEAL, SFX_BUTTON_CLICK, STANDARD_CHEST_ITEM, ALL_AVATAR_FRAMES, ALL_CARD_BACKS, KRENDI_COIN_PACKAGES, DEFAULT_AVATAR_FRAME_ID, DEFAULT_CARD_BACK_ID, SFX_ITEM_PURCHASE, SFX_ITEM_EQUIP, SFX_CARD_DISENCHANT } from '../constants';
import CardComponent from './CardComponent';
import { KrendiCoinIcon, PaletteIcon, SparklesIcon, TreasureChestIcon, KrendiDustIcon } from '../assets/icons';
import { useTranslations } from '../hooks/useTranslations';
import soundService from '../services/soundService';
import { TranslationKeys } from '../translations/keys';

type RevealedItem = Card | { type: 'dust'; amount: number; duplicatesConverted: number };
type ChestAnimationState = 'idle' | 'shaking' | 'revealing' | 'finished';

const Shop: React.FC = () => {
  const { currentUser, krendiCoins, playerProfile } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();
  
  const [activeTab, setActiveTab] = useState<ShopSection>(ShopSection.Chests);
  
  // Chest Opening States
  const [isOpeningChest, setIsOpeningChest] = useState(false); // General loading state for the button
  const [chestAnimationState, setChestAnimationState] = useState<ChestAnimationState>('idle');
  const [revealedItems, setRevealedItems] = useState<RevealedItem[]>([]);
  const [apiResponseForAnimation, setApiResponseForAnimation] = useState<ChestOpeningResponse | null>(null);
  const [chestError, setChestError] = useState<string | null>(null);
  
  const [designError, setDesignError] = useState<string | null>(null);
  const [krendiCoinError, setKrendiCoinError] = useState<string | null>(null);

  const resetChestAnimation = () => {
    setIsOpeningChest(false);
    setChestAnimationState('idle');
    setRevealedItems([]);
    setApiResponseForAnimation(null);
    setChestError(null);
    // Also clear the global lastChestResult for a fresh state if user re-opens shop
    dispatch({type: 'SET_LAST_CHEST_RESULT', payload: null});
  };

  const handleOpenChest = async () => {
    soundService.playSound(SFX_BUTTON_CLICK);
    if (!currentUser) {
      setChestError(t('shop_error_userNotAuthenticated'));
      return;
    }
    if (krendiCoins < KRENDI_COIN_CHEST_COST) {
      setChestError(t('shop_error_notEnoughCoins'));
      return;
    }

    resetChestAnimation(); // Clear previous results before starting
    setIsOpeningChest(true); // Disables button
    setChestAnimationState('shaking');
    soundService.playSound(SFX_CHEST_OPEN, 0.8); // Initial open/shake sound

    // Simulate shake duration before calling API
    setTimeout(async () => {
      try {
        const response = await apiService.openChest(currentUser.id.toString());
        // The reducer (SET_LAST_CHEST_RESULT) will update global krendiCoins, krendiDust, and ownedCards
        dispatch({ type: 'SET_LAST_CHEST_RESULT', payload: response }); 
        setApiResponseForAnimation(response); // Store for animation sequence
        setChestAnimationState('revealing'); // Start revealing items
      } catch (err: any) {
        const errorMessage = err.message || t('shop_error_failedToOpen');
        setChestError(errorMessage);
        setIsOpeningChest(false); // Re-enable button on error
        setChestAnimationState('idle');
      }
    }, 700); // Duration of shake animation + a little buffer
  };
  
  useEffect(() => {
    if (chestAnimationState === 'revealing' && apiResponseForAnimation) {
      const itemsToReveal: RevealedItem[] = [...apiResponseForAnimation.newCards];
      if (apiResponseForAnimation.krendiDustGained > 0) {
        itemsToReveal.push({ 
          type: 'dust', 
          amount: apiResponseForAnimation.krendiDustGained, 
          duplicatesConverted: apiResponseForAnimation.duplicatesConverted 
        });
      }

      if (itemsToReveal.length === 0) { // Edge case: chest yields nothing new and no dust
        setChestAnimationState('finished');
        setIsOpeningChest(false); // Re-enable open button
        return;
      }

      let revealIndex = 0;
      const revealNextItem = () => {
        if (revealIndex < itemsToReveal.length) {
          const item = itemsToReveal[revealIndex];
          setRevealedItems(prev => [...prev, item]);
          if ((item as Card).id) { // It's a card
            soundService.playSound(SFX_CARD_REVEAL, 0.7);
          } else { // It's dust
            soundService.playSound(SFX_CARD_DISENCHANT, 0.6); // Sound for dust reveal
          }
          revealIndex++;
          setTimeout(revealNextItem, 600); // Delay between reveals
        } else {
          setChestAnimationState('finished');
          setIsOpeningChest(false); // All items revealed, re-enable open button
        }
      };
      revealNextItem();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chestAnimationState, apiResponseForAnimation]);


  const handleBuyCosmetic = (item: AvatarFrame | CardBack) => {
    soundService.playSound(SFX_BUTTON_CLICK);
    setDesignError(null);
    if (krendiCoins < item.cost) {
      setDesignError(t('shop_insufficientFunds'));
      return;
    }
    if (item.itemType === CustomizationItemType.AvatarFrame) {
      dispatch({ type: 'BUY_AVATAR_FRAME', payload: item as AvatarFrame });
    } else if (item.itemType === CustomizationItemType.CardBack) {
      dispatch({ type: 'BUY_CARD_BACK', payload: item as CardBack });
    }
  };

  const handleEquipCosmetic = (item: AvatarFrame | CardBack) => {
    soundService.playSound(SFX_BUTTON_CLICK);
    if (item.itemType === CustomizationItemType.AvatarFrame) {
      dispatch({ type: 'EQUIP_AVATAR_FRAME', payload: item.id });
    } else if (item.itemType === CustomizationItemType.CardBack) {
      dispatch({ type: 'EQUIP_CARD_BACK', payload: item.id });
    }
  };
  
  const handleBuyKrendiCoinPackage = (packageAmount: number) => {
    soundService.playSound(SFX_BUTTON_CLICK);
    setKrendiCoinError(null);
    dispatch({type: 'ADD_KRENDI_COINS', payload: packageAmount});
    // Simulate a success message for donation packages
    // In a real app, this would involve payment processing.
    // For now, just add a visual feedback.
    setTimeout(() => {
      // This is a mock success, usually you'd have a proper notification system
      alert(`Mock Purchase: Added ${packageAmount} KrendiCoins!`);
    }, 200);
  };

  const TabButton: React.FC<{section: ShopSection, label: string, icon: React.ReactNode}> = ({ section, label, icon }) => (
    <button
      onClick={() => { 
        soundService.playSound(SFX_BUTTON_CLICK); 
        setActiveTab(section); 
        if (section !== ShopSection.Chests) { 
            resetChestAnimation();
        }
      }}
      className={`flex-1 py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors duration-200 ease-in-out flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-t-md
                  ${activeTab === section 
                    ? 'bg-app-panel text-app-primary border-b-2 border-app-primary' 
                    : 'bg-app-bg-secondary text-app-text-secondary hover:text-app-text hover:bg-app-panel/70'}`}
      aria-current={activeTab === section ? 'page' : undefined}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="px-3 sm:px-4 pt-3 sm:pt-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-app-primary text-center mb-2 sm:mb-3">
          {t('shop_title')}
        </h2>
        <div className="mb-3 sm:mb-4 flex items-center justify-center bg-app-bg-secondary p-2 rounded-lg shadow-sm">
          <span className="mr-2 text-sm sm:text-base text-app-text-secondary">{t('shop_yourKrendiCoins')}</span>
          <KrendiCoinIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-1 text-app-primary" />
          <span className="text-md sm:text-lg font-bold text-app-primary">{krendiCoins}</span>
        </div>
      </header>
      
      <nav className="flex mx-3 sm:mx-4 border-b-2 border-app-card-border">
        <TabButton section={ShopSection.Chests} label={t('shop_section_chests')} icon={<TreasureChestIcon className="w-4 h-4 sm:w-5 sm:h-5"/>} />
        <TabButton section={ShopSection.Design} label={t('shop_section_design')} icon={<PaletteIcon className="w-4 h-4 sm:w-5 sm:h-5"/>} />
        <TabButton section={ShopSection.KrendiCoins} label={t('shop_section_krendiCoins')} icon={<SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5"/>} />
      </nav>

      <div className="flex-grow overflow-y-auto p-3 sm:p-4 custom-scrollbar">
        {activeTab === ShopSection.Chests && (
          <div className="flex flex-col items-center">
            <div className="bg-app-panel p-4 sm:p-6 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm mb-4">
              <img 
                src={STANDARD_CHEST_ITEM.iconUrl} 
                alt={t(STANDARD_CHEST_ITEM.nameKey)} 
                className={`mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-app-primary/50 shadow-md object-cover transition-all duration-300 
                            ${chestAnimationState === 'shaking' ? 'animate-shake' : ''} 
                            ${chestAnimationState === 'revealing' || chestAnimationState === 'finished' ? 'animate-chest-glow-pulse' : ''}`} />
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{t(STANDARD_CHEST_ITEM.nameKey)}</h3>
              <p className="text-xs sm:text-sm text-app-text-secondary mb-2 sm:mb-3">{t(STANDARD_CHEST_ITEM.descriptionKey, { count: STANDARD_CHEST_ITEM.cardsPerChest })}</p>
              <div className="flex items-center justify-center text-xl sm:text-2xl font-bold text-app-primary mb-3 sm:mb-4">
                <KrendiCoinIcon className="w-6 h-6 sm:w-7 sm:h-7 mr-1 sm:mr-1.5" />
                {STANDARD_CHEST_ITEM.cost}
              </div>
              
              {chestAnimationState !== 'finished' ? (
                <button
                  onClick={handleOpenChest}
                  disabled={isOpeningChest || krendiCoins < KRENDI_COIN_CHEST_COST || !currentUser || chestAnimationState === 'revealing'}
                  className="w-full bg-app-primary hover:opacity-90 text-app-bg font-bold py-2.5 sm:py-3 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOpeningChest && chestAnimationState !== 'revealing' ? t('shop_button_opening') : t('shop_button_buyChest')}
                </button>
              ) : (
                <button
                  onClick={resetChestAnimation}
                  className="w-full bg-app-accent hover:opacity-90 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg shadow-md transition duration-150"
                >
                  {t('cardDetailModal_closeButton')}
                </button>
              )}
              {chestError && <p className="text-red-400 mt-2 text-xs sm:text-sm">{chestError}</p>}
            </div>

            {chestAnimationState === 'shaking' && !apiResponseForAnimation && (
              <div className="mt-3 sm:mt-4 text-center">
                <p className="mt-2 text-xs sm:text-sm text-app-text-secondary">{t('shop_status_shufflingFates')}</p>
              </div>
            )}
            
            {revealedItems.length > 0 && (
              <div className="mt-4 w-full max-w-md">
                <h3 className="text-md sm:text-lg font-semibold text-center mb-2">{t('shop_cardsFoundTitle')}</h3>
                
                <div className={`grid gap-1.5 p-1 bg-app-bg/50 rounded-lg max-h-[260px] sm:max-h-[300px] overflow-y-auto custom-scrollbar
                                ${revealedItems.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'}`}>
                  {revealedItems.map((item, index) => {
                    if ((item as any).type === 'dust') {
                      const dustItem = item as { amount: number, duplicatesConverted: number };
                      return (
                        <div key={`dust-${index}`} className="col-span-full flex flex-col items-center justify-center p-2 bg-app-bg-secondary rounded-md animate-dust-appear my-2">
                          <KrendiDustIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-1" />
                          <p className="text-lg sm:text-xl font-bold text-purple-400">+{dustItem.amount}</p>
                          <p className="text-xs text-app-text-secondary">{t('profile_krendiDust')} from {dustItem.duplicatesConverted} {dustItem.duplicatesConverted === 1 ? "duplicate" : "duplicates"}</p>
                        </div>
                      );
                    } else {
                      const cardItem = item as Card;
                      return (
                        <div key={cardItem.uuid || cardItem.id || index} className="animate-card-fly-in" style={{animationDelay: `${index * 0.1}s`}}>
                           <CardComponent card={cardItem} isInHand={false} isPlayable={false}/>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
            {chestAnimationState === 'finished' && revealedItems.length === 0 && apiResponseForAnimation && apiResponseForAnimation.newCards.length === 0 && apiResponseForAnimation.krendiDustGained === 0 && (
               <p className="mt-3 text-center text-xs sm:text-sm text-app-text-secondary">{t('shop_status_noNewCards')}</p>
            )}
          </div>
        )}

        {activeTab === ShopSection.Design && (
          <div className="space-y-6">
            {designError && <p className="text-red-400 text-center text-xs sm:text-sm mb-2">{designError}</p>}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-app-primary mb-2 sm:mb-3">{t('shop_avatarFramesTitle')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {ALL_AVATAR_FRAMES.map(frame => {
                  const isOwned = playerProfile.ownedAvatarFrameIds.includes(frame.id);
                  const isEquipped = playerProfile.equippedAvatarFrameId === frame.id;
                  return (
                    <div key={frame.id} className="bg-app-panel p-2.5 rounded-lg shadow-lg text-center flex flex-col justify-between">
                      <img src={frame.imageUrl} alt={t(frame.nameKey)} className="w-full aspect-square rounded-md border border-app-card-border object-cover mb-2"/>
                      <p className="text-xs sm:text-sm font-medium mb-1 truncate">{t(frame.nameKey)}</p>
                      {!isOwned ? (
                        <button 
                          onClick={() => handleBuyCosmetic(frame)} 
                          disabled={krendiCoins < frame.cost}
                          className="w-full bg-app-primary hover:opacity-90 text-app-bg text-xs font-semibold py-1.5 px-2 rounded shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <KrendiCoinIcon className="w-3.5 h-3.5 mr-1 inline-block"/> {frame.cost}
                        </button>
                      ) : isEquipped ? (
                        <button className="w-full bg-green-600 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-md opacity-70 cursor-default" disabled>{t('shop_equippedButton')}</button>
                      ) : (
                        <button onClick={() => handleEquipCosmetic(frame)} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-md transition">{t('shop_equipButton')}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-app-primary mb-2 sm:mb-3">{t('shop_cardBacksTitle')}</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {ALL_CARD_BACKS.map(back => {
                  const isOwned = playerProfile.ownedCardBackIds.includes(back.id);
                  const isEquipped = playerProfile.equippedCardBackId === back.id;
                  return (
                    <div key={back.id} className="bg-app-panel p-2.5 rounded-lg shadow-lg text-center flex flex-col justify-between">
                      <img src={back.imageUrl} alt={t(back.nameKey)} className="w-full aspect-[2/3] rounded-md border border-app-card-border object-cover mb-2"/>
                      <p className="text-xs sm:text-sm font-medium mb-1 truncate">{t(back.nameKey)}</p>
                       {!isOwned ? (
                        <button 
                          onClick={() => handleBuyCosmetic(back)} 
                          disabled={krendiCoins < back.cost}
                          className="w-full bg-app-primary hover:opacity-90 text-app-bg text-xs font-semibold py-1.5 px-2 rounded shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <KrendiCoinIcon className="w-3.5 h-3.5 mr-1 inline-block"/> {back.cost}
                        </button>
                      ) : isEquipped ? (
                        <button className="w-full bg-green-600 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-md opacity-70 cursor-default" disabled>{t('shop_equippedButton')}</button>
                      ) : (
                        <button onClick={() => handleEquipCosmetic(back)} className="w-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-md transition">{t('shop_equipButton')}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === ShopSection.KrendiCoins && (
          <div className="space-y-4">
            {krendiCoinError && <p className="text-red-400 text-center text-xs sm:text-sm mb-2">{krendiCoinError}</p>}
            <h3 className="text-lg sm:text-xl font-semibold text-app-primary mb-2 sm:mb-3">{t('shop_krendiCoinPackagesTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {KRENDI_COIN_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`bg-app-panel p-3 sm:p-4 rounded-lg shadow-xl flex items-center space-x-3 ${pkg.isBestValue ? 'border-2 border-yellow-400 ring-2 ring-yellow-400/50 relative' : 'border border-app-card-border'}`}>
                  {pkg.isBestValue && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full transform rotate-6 shadow-md">{t('shop_bestValue')}</div>}
                  <img src={pkg.iconUrl || 'https://picsum.photos/seed/kcoinpkg/60/60'} alt={t(pkg.nameKey)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-app-card-border object-contain flex-shrink-0"/>
                  <div className="flex-grow">
                    <p className="font-semibold text-sm sm:text-base text-app-text">{t(pkg.nameKey)}</p>
                    <p className="text-xs text-app-text-secondary mb-1">{t(pkg.descriptionKey)}</p>
                    <p className="text-lg sm:text-xl font-bold text-app-primary flex items-center">
                      <KrendiCoinIcon className="w-5 h-5 mr-1"/> {pkg.krendiCoinAmount > 0 ? pkg.krendiCoinAmount : 'Ads'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBuyKrendiCoinPackage(pkg.krendiCoinAmount)}
                    className="bg-app-primary hover:opacity-90 text-app-bg text-xs sm:text-sm font-semibold py-2 px-3 rounded-md shadow-md transition whitespace-nowrap"
                  >
                    {pkg.costDisplay}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-app-text-secondary mt-4">{t('shop_comingSoon')} (Real purchases are not implemented).</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
