import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { TAB_DEFS } from '../constants';

interface MobileHeaderProps {
  sidebarBg: string;
  activeLogoTheme: string;
  activeTheme: string;
  sidebarPattern: string;
  sidebarPatternOpacity: number;
  designStyle: string;
  isOnline: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isLightSidebar: boolean;
  sidebarPatternStyle: React.CSSProperties;
  tabOrder: string[];
  hiddenTabs: string[];
  activeTab: string;
  handleNavigate: (tab: any) => void;
  isIslemlerSubMenuOpen: boolean;
  setIsIslemlerSubMenuOpen: (open: boolean) => void;
  userRole: string;
  sensitiveTabs: string[];
  handleSignOut: () => void;
  setAdminPinError: (error: string | null) => void;
  setAdminPinInput: (pin: string) => void;
  setIsAdminPinModalOpen: (open: boolean) => void;
  setUserRole: (role: any) => void;
  user: any;
  setPendingIslemModal: (modal: any) => void;
  showToast: (msg: string, type: string) => void;
  setActiveTab: (tab: any) => void;
  isSecurityActive: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isOnline,
  activeTab,
  handleNavigate,
}) => {
  // If we are on the main menu view, we do not need the header since MobileMenuView has its own header
  if (activeTab === 'menu') {
    return null;
  }

  const currentTabLabel = TAB_DEFS[activeTab]?.label || 'Storm Muhasebe';

  return (
    <div 
      className="md:hidden px-4 py-3 flex items-center justify-between border-b sticky top-0 z-40 bg-[#070709]/95 backdrop-blur-md border-white/5 text-white"
    >
      {/* Geri (Ana Menüye Dönüş) Button */}
      <button 
        onClick={() => handleNavigate('menu')}
        className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-300 hover:text-white cursor-pointer"
      >
        <ChevronLeft size={16} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Menü</span>
      </button>

      {/* Active Tab Label */}
      <div className="flex-1 text-center px-2">
        <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
          {currentTabLabel}
        </span>
      </div>

      {/* Connection Indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span 
          className="w-2 h-2 rounded-full animate-pulse" 
          style={{ 
            backgroundColor: isOnline ? '#2dd4bf' : '#f43f5e', 
            boxShadow: isOnline ? '0 0 10px #2dd4bf' : '0 0 10px #f43f5e' 
          }} 
          title={isOnline ? 'Sistem Çevrimiçi' : 'Çevrimdışı'}
        />
        <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
          {isOnline ? 'Onl' : 'Off'}
        </span>
      </div>
    </div>
  );
};
