
import React from 'react';
import { CardAbilityType, AchievementIconType } from '../types'; // Added AchievementIconType

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string; viewBox?: string; onClick?: React.MouseEventHandler<SVGSVGElement> }> = ({ children, className, viewBox = "0 0 20 20", onClick }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox}
    fill="currentColor"
    className={`w-6 h-6 ${className || ''}`}
    aria-hidden="true"
    onClick={onClick}
  >
    {children}
  </svg>
);

export const TauntIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    <path d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06L11.06 12l3.72 3.72a.75.75 0 11-1.06 1.06L10 13.06l-3.72 3.72a.75.75 0 01-1.06-1.06L8.94 12 5.22 8.28a.75.75 0 010-1.06z" />
  </IconWrapper>
);

export const DivineShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.134-3.205A5.985 5.985 0 014 10c0-2.07.993-3.895 2.536-5.082l.001-.002.002-.002.002-.002A5.984 5.984 0 0110 4c.681 0 1.332.119 1.932.338l.002.001.002.001.002.001L16 10a5.985 5.985 0 01-4.866 4.795z" clipRule="evenodd" />
    <path d="M10 2a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM15.25 5.5a.75.75 0 00-1.06-1.06l-1.77 1.77a.75.75 0 101.06 1.06l1.77-1.77zM4.75 5.5a.75.75 0 011.06-1.06l1.77 1.77a.75.75 0 11-1.06 1.06L4.75 5.5zM17.25 10a.75.75 0 00-.75-.75h-2.5a.75.75 0 000 1.5h2.5a.75.75 0 00.75-.75zM2.75 10a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75z" />
  </IconWrapper>
);

export const ChargeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.5 8.085c0-1.303.907-2.43 2.143-2.803l.207-.062a.75.75 0 01.898.898l-.062.207c-.714.255-1.221.88-1.221 1.6V10.5h2.786a.75.75 0 01.53 1.28l-3.786 3.786a.75.75 0 01-1.06-1.06L7.214 12H5.5V8.085zm5.214-3.233L13.5 2.066a.75.75 0 011.06 1.06L11.775 6h2.724a.75.75 0 01.531 1.28l-3.786 3.786a.75.75 0 01-1.06-1.06l2.214-2.214H10.5V4.852z" clipRule="evenodd" />
  </IconWrapper>
);

export const BattlecryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M7.25 3.25A2.25 2.25 0 005 5.5v1.5H4.75a.75.75 0 000 1.5H5v4.25A2.25 2.25 0 007.25 15h5.5A2.25 2.25 0 0015 12.75V8.5h.25a.75.75 0 000-1.5H15V5.5A2.25 2.25 0 0012.75 3.25h-5.5zM6.5 7V5.5c0-.414.336-.75.75-.75h5.5c.414 0 .75.336.75.75V7h-7zm0 1.5h7V12.75c0 .414-.336.75-.75.75h-5.5c-.414 0-.75-.336-.75-.75V8.5z" clipRule="evenodd" />
    <path d="M2 6.5a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5h-.01a.75.75 0 01-.75-.75zm14 0a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5h-.01a.75.75 0 01-.75-.75z" />
  </IconWrapper>
);

export const DeathrattleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 7a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h2a1 1 0 100-2H7z" clipRule="evenodd" />
    <path d="M10 2a.75.75 0 01.75.75V3a2.999 2.999 0 00-3.416 2.273.75.75 0 01-1.412-.446A4.499 4.499 0 019.25 1.51V.75A.75.75 0 0110 0S10 2 10 2zM12.5 5.5a.5.5 0 100-1 .5.5 0 000 1zM7.5 5.5a.5.5 0 100-1 .5.5 0 000 1z" />
    <path d="M7 13.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z" />
  </IconWrapper>
);

export const LifestealIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.001-11.787a.75.75 0 01.998.06L12 7.268l1.003-1.004a.75.75 0 111.06 1.06L13.06 8.33l1.004 1.003a.75.75 0 01-1.06 1.06L12 9.391l-1.003 1.003a.75.75 0 01-1.121-.998L10.94 8.33 9.878 7.268a.75.75 0 01.06-1.121L9.999 6.213z" clipRule="evenodd" />
    <path d="M10 3.5c-1.43 0-2.76.536-3.765 1.425L5 6.166V5.5a.75.75 0 00-1.5 0v2.5a.75.75 0 00.75.75H6.5a.75.75 0 000-1.5H5.707l.828-.828A3.983 3.983 0 0110 5c1.852 0 3.446 1.26 3.898 3H15a.75.75 0 00.75-.75V4.75a.75.75 0 00-1.5 0V5.5A5.48 5.48 0 0010 3.5z" />
  </IconWrapper>
);

export const PoisonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 6.22a.75.75 0 00-1.06 1.06L8.94 9l-1.72 1.72a.75.75 0 101.06 1.06L10 10.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 9l1.72-1.72a.75.75 0 00-1.06-1.06L10 7.94 8.28 6.22z" clipRule="evenodd" />
    </IconWrapper>
);

// New Ability Icons
export const StealthIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" fill="none" stroke="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.995-.643 1.94-1.088 2.825M12 19c-4.478 0-8.268-2.943-9.542-7 .274-.995.643-1.94 1.088-2.825" fill="none" stroke="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18" fill="none" stroke="currentColor"/>
  </IconWrapper>
);

export const SilenceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 19.5l-3.5-4.083m0 0l-3.5 4.083M12.25 15.417V6.75M7.5 6.75h9M5.25 12h13.5M18.75 19.5A2.25 2.25 0 0021 17.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h13.5z" fill="none" stroke="currentColor"/>
  </IconWrapper>
);

export const AirdropIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" fill="none" stroke="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 7.5h9" fill="none" stroke="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.5 3.75h15a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-1.5a.75.75 0 01.75-.75z" fill="currentColor"/>
 </IconWrapper>
);

export const HODLIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.75c0-3.485 2.015-6.375 4.5-6.375S21 3.265 21 6.75c0 .75-.127 1.467-.362 2.135M12 6.75c0-3.485-2.015-6.375-4.5-6.375S3 3.265 3 6.75c0 .75.127 1.467.362 2.135M12 21.75c0 1.036-1.007 1.875-2.25 1.875S7.5 22.786 7.5 21.75M12 21.75c0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875M12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM4.96 15.63A6.75 6.75 0 0112 9.75a6.75 6.75 0 017.04 5.88M4.96 15.63C3.554 16.033 3 16.82 3 17.625c0 1.243 2.015 2.25 4.5 2.25M19.04 15.63c1.405.403 2.04 1.19 2.04 1.995 0 1.243-2.015 2.25-4.5 2.25" fill="none" stroke="currentColor"/>
  </IconWrapper>
);


export const KrendiCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={`text-app-primary ${className}`}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1.474-5.415A.75.75 0 0112 12.17V14a.75.75 0 01-1.5 0v-1.83a.75.75 0 01.526-.707.061.061 0 00.028-.054c0-.032-.025-.058-.057-.058H8.75a.75.75 0 010-1.5h2.193c.208 0 .398.108.508.285.045.074.13.104.211.078.082-.026.13-.105.106-.188a2.249 2.249 0 00-2.268-1.812H8.75a.75.75 0 010-1.5h1.504c.791 0 1.474.452 1.78 1.142A.75.75 0 0112 8.83V6a.75.75 0 011.5 0v2.83a.75.75 0 01-.526.707c-.01.003-.018.01-.023.018a.057.057 0 000 .092c.005.007.013.014.023.018.29.083.526.35.526.707z" clipRule="evenodd" />
  </IconWrapper>
);

export const KrendiDustIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={`text-purple-400 ${className}`} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 5.5C9.25 5.5 7 7.75 7 10.5c0 1.52.67 2.88 1.75 3.81L7.5 19.5h9l-1.25-5.19c1.08-.93 1.75-2.29 1.75-3.81C17 7.75 14.75 5.5 12 5.5zm-2.25 7.5L12 18l2.25-5M9.5 9.25s.5-2.25 2.5-2.25 2.5 2.25 2.5 2.25" />
  </IconWrapper>
);


export const ManaGemIcon: React.FC<{ className?: string; isFilled?: boolean; isLocked?: boolean; animateFill?: boolean }> = ({ className, isFilled = true, isLocked = false, animateFill = false }) => (
    <div className={`relative mana-gem-shape shadow-mana-gem ${className || ''}`}>
      <div className={`absolute inset-0 mana-gem-shape transition-colors duration-300 ease-in-out 
                      ${isLocked ? 'bg-mana-gem-locked border-gray-700' 
                                  : (isFilled ? 'bg-mana-gem-filled border-mana-gem-border' : 'bg-mana-gem-empty border-gray-600')}
                      border-2 ${animateFill && isFilled ? 'animate-mana-fill' : ''}`}>
      </div>
      {isFilled && !isLocked && ( 
        <div className="absolute inset-0.5 mana-gem-shape opacity-50 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
      )}
    </div>
);

export const HealthIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={`text-red-500 ${className}`}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.001-3.787a.75.75 0 01.998-.06l1.001 1.001 1.001-1.001a.75.75 0 111.06 1.06l-1.001 1.001 1.001 1.001a.75.75 0 11-1.06 1.06l-1.001-1.001-1.001 1.001a.75.75 0 01-1.06-1.06l1.001-1.001-1.001-1.001a.75.75 0 01.06-.998z" clipRule="evenodd" />
    </IconWrapper>
);

export const AttackIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={`text-yellow-500 ${className}`} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5M5 12l7-7 7 7" />
    </IconWrapper>
);

export const MagicBookIcon: React.FC<{ className?: string, count?: number }> = ({ className, count }) => (
  <IconWrapper className={`text-purple-400 hover:text-purple-300 ${className}`} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>
    {count !== undefined && (
        <text x="12" y="15" textAnchor="middle" fontSize="8px" fill="var(--app-text-color)" className="font-bold">
          {count}
        </text>
    )}
  </IconWrapper>
);

export const HourglassEndTurnIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 20V4L18 4V20L6 20ZM10 8H14V12H10V8ZM10 12L12 14L14 12V16H10V12Z"></path>
  </IconWrapper>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3l14 9-14 9V3z" />
  </IconWrapper>
);

export const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 2H9C7.89543 2 7 2.89543 7 4V20C7 21.1046 7.89543 22 9 22H19C20.1046 22 21 21.1046 21 20V4C21 2.89543 20.1046 2 19 2Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7H3C2.44772 7 2 7.44772 2 8V16C2 16.5523 2.44772 17 3 17H7" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 6H15" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 10H15" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 14H13" />
  </IconWrapper>
);


export const ShopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 6h18l-2 12H5L3 6zm10 2a4 4 0 00-8 0" />
  </IconWrapper>
);

export const FriendsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20s-1.5-2-5-2-5 2-5 2M12 14a4 4 0 100-8 4 4 0 000 8zm6-8a2 2 0 100-4 2 2 0 000 4zm-12 0a2 2 0 100-4 2 2 0 000 4z" />
  </IconWrapper>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </IconWrapper>
);

export const LeaderboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15l4-4 4 4 4-4 4 4M3 9l4 4L11 9l4 4 4-4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6H20" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 18H20" />
  </IconWrapper>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconWrapper>
);

export const RatingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </IconWrapper>
);

export const XPIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5zM12 21v-7" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v7c0 3.31 4.03 6 9 6s9-2.69 9-6V7" />
  </IconWrapper>
);

export const LanguageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5h12M9 3v2m4 16l-3-3H9V3h6v12m0 0l3 3m-3-3v-6m6 6h-2m-4-6h6m-6 3h2m8-12v16m-2-2l2 2 2-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.56 10.5A9.5 9.5 0 1111 1M13 1v2M13 13v-2" />
  </IconWrapper>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconWrapper>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0V4M5 6l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12H5z" />
  </IconWrapper>
);


export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </IconWrapper>
);

export const AutoAwesomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M19 3v4M17 5h4M12 3l1.09 2.41L15.5 6.5l-2.41 1.09L12 10l-1.09-2.41L8.5 6.5l2.41-1.09L12 3zM12 14l-1.09 2.41L8.5 17.5l2.41 1.09L12 21l1.09-2.41L15.5 17.5l-2.41-1.09L12 17z" />
  </IconWrapper>
);

export const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </IconWrapper>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3h14M5 3a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2M5 3c0 4 2 4 2 4h10s2 0 2-4M12 11v10M9 21h6" />
    </IconWrapper>
);

export const CardStackIcon: React.FC<{ className?: string }> = ({ className }) => ( 
    <IconWrapper className={className} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4M3 7H21M5 9.5h14M7 12h10M9 14.5h6" />
    </IconWrapper>
);

export const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6M9 12c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.657 1.343 3 3 3s3-1.343 3-3zm6 0c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.657 1.343 3 3 3s3-1.343 3-3zM5 16h14M5 16a4 4 0 00-4 4v0a2 2 0 002 2h14a2 2 0 002-2v0a4 4 0 00-4-4M5 16V9a2 2 0 012-2h10a2 2 0 012 2v7" />
    </IconWrapper>
);

export const LevelUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </IconWrapper>
);

export const QuestionMarkCircleIcon: React.FC<{ className?: string; onClick?: React.MouseEventHandler<SVGSVGElement> }> = ({ className, onClick }) => (
    <IconWrapper className={className} viewBox="0 0 24 24" onClick={onClick}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.755 4 3.92C16 12.802 14.903 14 12.955 14c-.893 0-1.358-.594-1.624-1M12 18h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconWrapper>
);

// --- New Icons for Daily Quests ---
export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => ( // For Daily Quest Button
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01" />
  </IconWrapper>
);

export const SwordsIcon: React.FC<{ className?: string }> = ({ className }) => ( // For "Win Matches" or "Deal Damage" quests
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.636 18.364a9 9 0 0012.728 0M12 3v18m0-18a9 9 0 00-9 9h18a9 9 0 00-9-9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 14l-5-5-5 5" />
  </IconWrapper>
);

export const DicesIcon: React.FC<{ className?: string }> = ({ className }) => ( // For generic quests, or "Play X type of card"
    <IconWrapper className={className} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636L16.95 7.05A7 7 0 007.05 16.95l-1.414 1.414M18.364 5.636A9 9 0 0121 12M3 12a9 9 0 012.636-6.364M12 3a9 9 0 016.364 2.636" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 7.5h0m9 9h0m-9-4.5h0m4.5 4.5h0m0-9h0m4.5 4.5h0" />
    </IconWrapper>
);

// --- New Icons for Shop & Customization ---
export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => ( // For Design/Cosmetics section
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2.25a.75.75 0 01.75.75v.008l.003-.001a3.742 3.742 0 001.85 6.452l.008.003a.75.75 0 01-.376 1.393l-.009-.002a2.242 2.242 0 01-2.09-3.086l-.003.008V18a.75.75 0 01-1.5 0V7.768l-.003.008a2.242 2.242 0 01-2.09-3.086l-.009-.002a.75.75 0 01-.375-1.393l.008.003a3.742 3.742 0 001.85-6.452l.003-.001v-.008a.75.75 0 01.75-.75zm0 0V18m5.25-9.75a.75.75 0 000-1.5h-.008a.75.75 0 000 1.5h.008zm-10.5 0a.75.75 0 000-1.5h-.008a.75.75 0 000 1.5h.008z" />
  </IconWrapper>
);

export const TreasureChestIcon: React.FC<{ className?: string }> = ({ className }) => ( // For Chests section
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M4 12L4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V12M4 12V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12M12 6V20M8 6L8 4M16 6L16 4" />
  </IconWrapper>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => ( // For KrendiCoin packages or general "value"
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M19 3v4M17 5h4M12 3l1.09 2.41L15.5 6.5l-2.41 1.09L12 10l-1.09-2.41L8.5 6.5l2.41-1.09L12 3zm0 14l-1.09 2.41L8.5 17.5l2.41 1.09L12 21l1.09-2.41L15.5 17.5l-2.41-1.09L12 17z" />
  </IconWrapper>
);

// --- Icon Utility Functions ---
export const getAbilityIcon = (abilityType: CardAbilityType): React.FC<{ className?: string }> | null => {
  switch (abilityType) {
    case CardAbilityType.Taunt: return TauntIcon;
    case CardAbilityType.DivineShield: return DivineShieldIcon;
    case CardAbilityType.Charge: return ChargeIcon;
    case CardAbilityType.Battlecry: return BattlecryIcon;
    case CardAbilityType.Deathrattle: return DeathrattleIcon;
    case CardAbilityType.Lifesteal: return LifestealIcon;
    case CardAbilityType.Poison: return PoisonIcon;
    case CardAbilityType.Stealth: return StealthIcon;
    case CardAbilityType.Silence: return SilenceIcon;
    case CardAbilityType.Airdrop: return AirdropIcon;
    case CardAbilityType.HODL: return HODLIcon;
    default: return null;
  }
};

export const getAchievementAndQuestIcon = (iconType: AchievementIconType, className?: string): React.ReactNode => {
  switch (iconType) {
    case AchievementIconType.GameWin: return <TrophyIcon className={className} />;
    case AchievementIconType.CardCollect: return <CollectionIcon className={className} />; 
    case AchievementIconType.RatingReach: return <RatingIcon className={className} />;
    case AchievementIconType.BotWin: return <RobotIcon className={className} />;
    case AchievementIconType.LevelUp: return <LevelUpIcon className={className} />;
    case AchievementIconType.KrendiCoinsEarned: return <KrendiCoinIcon className={className} />;
    case AchievementIconType.QuestGeneric: return <DicesIcon className={className} />;
    case AchievementIconType.CardsPlayed: return <CardStackIcon className={className} />;
    case AchievementIconType.DamageDealt: return <SwordsIcon className={className} />;
    case AchievementIconType.CosmeticUnlock: return <SparklesIcon className={className} />; 
    case AchievementIconType.KrendiDust: return <KrendiDustIcon className={className} />; // Added KrendiDustIcon
    default: return <QuestionMarkCircleIcon className={className} />;
  }
};


export const VolumeUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5L6 9H2v6h4l5 4V5zm8.07-.07a7.5 7.5 0 010 10.14M15.535 8.464a3.5 3.5 0 010 4.95" />
  </IconWrapper>
);

export const VolumeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5L6 9H2v6h4l5 4V5zm7.07 1.93L16 9m2.07-2.07L16 5m0 4l2.07 2.07M16 9l-2.07-2.07" />
  </IconWrapper>
);

export const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 7a4 4 0 10-8 0 4 4 0 008 0zm-2 5h4m-2-2v4" />
  </IconWrapper>
);

export const UserCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 7a4 4 0 10-8 0 4 4 0 008 0zm-2 5l2 2 4-4" />
  </IconWrapper>
);

export const UserMinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 7a4 4 0 10-8 0 4 4 0 008 0zm-2 5h4" />
  </IconWrapper>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconWrapper className={className} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);
