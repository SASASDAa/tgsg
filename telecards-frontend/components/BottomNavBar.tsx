
import React from 'react';
import { useAppState, useAppDispatch } from '../context/AppStateContext';
import { Screen } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { PlayIcon, CollectionIcon, ShopIcon, FriendsIcon, UserIcon, LeaderboardIcon } from '../assets/icons'; 
import soundService from '../services/soundService';
import { SFX_NAV_CLICK } from '../constants';

interface NavItemProps {
  screen: Screen;
  label: string;
  icon: React.ReactNode;
  currentScreen: Screen;
  onClick: (screen: Screen) => void;
}

const NavItem: React.FC<NavItemProps> = ({ screen, label, icon, currentScreen, onClick }) => {
  const isActive = screen === currentScreen;
  return (
    <button
      onClick={() => onClick(screen)}
      className={`flex flex-col items-center justify-center flex-1 p-1 pt-1.5 pb-1 transition-all duration-200 ease-in-out
                  ${isActive ? 'text-app-primary scale-110' : 'text-app-text-secondary hover:text-app-text'}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <div className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 ${isActive ? 'text-app-primary' : ''}`}>
        {icon}
      </div>
      <span className={`text-[0.6rem] sm:text-xs font-medium ${isActive ? 'text-app-primary' : ''}`}>{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC = () => {
  const { activeScreen } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useTranslations();

  const handleNavigate = (screen: Screen) => {
    soundService.playSound(SFX_NAV_CLICK);
    dispatch({ type: 'NAVIGATE_TO', payload: screen });
  };

  const navItems = [
    { screen: Screen.Play, label: t('nav_play'), icon: <PlayIcon /> },
    { screen: Screen.Collection, label: t('nav_collection'), icon: <CollectionIcon /> },
    { screen: Screen.Shop, label: t('nav_shop'), icon: <ShopIcon /> },
    { screen: Screen.Social, label: t('nav_social'), icon: <FriendsIcon /> },
    { screen: Screen.Profile, label: t('nav_profile'), icon: <UserIcon /> },
    { screen: Screen.Leaderboard, label: t('nav_leaderboard'), icon: <LeaderboardIcon /> },
  ];

  return (
    <nav className="w-full bg-app-bg-secondary border-t-2 border-app-card-border shadow-top flex justify-around items-stretch h-14 sm:h-16 mt-auto flex-shrink-0">
      {navItems.map(item => (
        <NavItem
          key={item.screen}
          screen={item.screen}
          label={item.label}
          icon={item.icon}
          currentScreen={activeScreen}
          onClick={handleNavigate}
        />
      ))}
    </nav>
  );
};

export default BottomNavBar;
