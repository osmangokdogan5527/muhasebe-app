import React from 'react';
import { LogOut, Lock, ChevronDown, MessageSquare, ShieldCheck } from 'lucide-react';
import { StormLogo, StormIconWrapper, TAB_DEFS, SIDEBAR_BG_PRESETS } from '../constants';

interface DesktopSidebarProps {
  isLightSidebar: boolean;
  sidebarBg: string;
  sidebarPatternStyle: React.CSSProperties;
  activeLogoTheme: string;
  activeTheme: string;
  sidebarPattern: string;
  sidebarPatternOpacity: number;
  designStyle: string;
  tabOrder: string[];
  hiddenTabs: string[];
  activeTab: string;
  handleNavigate: (tab: any) => void;
  isIslemlerSubMenuOpen: boolean;
  setIsIslemlerSubMenuOpen: (open: boolean) => void;
  userRole: string;
  sensitiveTabs: string[];
  showToast: (msg: string, type: string) => void;
  setPendingIslemModal: (modal: any) => void;
  isSecurityActive: boolean;
  isOnline: boolean;
  user: any;
  handleSignOut: () => void;
  setShowFeedbackModal: (show: boolean) => void;
  setAdminPinError: (error: string | null) => void;
  setAdminPinInput: (pin: string) => void;
  setIsAdminPinModalOpen: (open: boolean) => void;
  setUserRole: (role: any) => void;
  setActiveTab: (tab: any) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isLightSidebar,
  sidebarBg,
  sidebarPatternStyle,
  activeLogoTheme,
  activeTheme,
  sidebarPattern,
  sidebarPatternOpacity,
  designStyle,
  tabOrder,
  hiddenTabs,
  activeTab,
  handleNavigate,
  isIslemlerSubMenuOpen,
  setIsIslemlerSubMenuOpen,
  userRole,
  sensitiveTabs,
  showToast,
  setPendingIslemModal,
  isSecurityActive,
  isOnline,
  user,
  handleSignOut,
  setShowFeedbackModal,
  setAdminPinError,
  setAdminPinInput,
  setIsAdminPinModalOpen,
  setUserRole,
  setActiveTab,
}) => {
  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col w-64 text-white shrink-0 transition-all duration-300 relative z-20 shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5)] my-4 ml-4 rounded-3xl border ${isLightSidebar ? 'sidebar-light' : ''}`}
        style={{ 
          backgroundColor: sidebarBg,
          ...sidebarPatternStyle,
          borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Sidebar Brand Logo */}
        <div className="pt-7 pb-4 px-6 flex items-center justify-center relative z-10">
          <StormLogo className="w-38 h-auto mx-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {tabOrder
            .filter((tabId) => !hiddenTabs.includes(tabId))
            .map((tabId) => {
              const def = TAB_DEFS[tabId];
            if (!def) return null;
            const isActive = activeTab === tabId;
            return (
              <div key={tabId} className="space-y-1">
                {tabId === 'islemler' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button 
                        id={`tab-btn-${tabId}`}
                        onClick={() => {
                          handleNavigate('islemler');
                          setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                        }}
                        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                          isActive 
                            ? 'text-white font-semibold' 
                            : 'text-white hover:bg-white/5'
                        }`}
                        style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StormIconWrapper iconElement={def.icon} isActive={isActive} />
                          <span className="whitespace-nowrap truncate">{def.label}</span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                          }}
                          className={`p-1 rounded-lg hover:bg-black/15 transition-transform duration-200 ${isIslemlerSubMenuOpen ? 'rotate-180' : ''}`}
                        >
                          <ChevronDown size={14} />
                        </div>
                      </button>
                    </div>
                    
                    {isIslemlerSubMenuOpen && (
                      <div className="pl-3 pr-1 py-1 space-y-1 bg-black/15 rounded-xl border border-white/5 animate-fade-in my-1 mx-1">
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('sale');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">📈</span>
                          <span>Satış Faturası</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('purchase');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">📉</span>
                          <span>Alış Faturası</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('collection');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">💰</span>
                          <span>Tahsilat Girişi</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('payment');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">💸</span>
                          <span>Ödeme Girişi</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    id={`tab-btn-${tabId}`}
                    onClick={() => handleNavigate(tabId as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                      isActive 
                        ? 'text-white font-semibold' 
                        : 'text-white hover:bg-white/5'
                    }`}
                    style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StormIconWrapper iconElement={def.icon} isActive={isActive} />
                      <span className="whitespace-nowrap truncate">{def.label}</span>
                    </div>
                    {isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId) && (
                      <Lock size={12} className="text-zinc-400 group-hover:text-red-400 transition-colors shrink-0" />
                    )}
                  </button>
                )}
              </div>
  );
          })}
        </nav>

        {/* Sidebar User & Cloud Sync Info Footer */}
        <div className="p-3 mt-auto space-y-2">
          <div className="p-3 rounded-2xl border border-white/5 space-y-2.5 bg-black/20 shadow-lg relative z-10">
            <div className="flex items-center justify-between text-[8px] font-mono tracking-widest uppercase px-1">
              <span className="text-zinc-400">CLOUD STATUS</span>
              <span className="inline-flex items-center gap-1 font-bold" style={{ color: isOnline ? '#2dd4bf' : '#f43f5e' }}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-400' : 'bg-rose-500'}`} style={{ boxShadow: isOnline ? '0 0 8px #2dd4bf' : 'none' }}></span>
                {isOnline ? 'SİSTEM ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                { (user as any)?.photoURL ? (
                  <img src={(user as any).photoURL} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase" style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
                    {user?.displayName ? user.displayName.charAt(0) : 'K'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-zinc-50 block truncate" title={user?.displayName || 'Kullanıcı'}>{user?.displayName || 'Kullanıcı'}</span>
                  <span className="text-[8px] font-mono text-zinc-300 block truncate">Aktif Oturum</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer shrink-0"
                style={{ backgroundColor: 'transparent' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-500) 15%, transparent)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Çıkış Yap"
              >
                <LogOut size={14} />
              </button>
            </div>
            
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <MessageSquare size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hata / İstek Bildir</span>
            </button>

            {isSecurityActive && (userRole === 'employee' ? (
              <button
                onClick={() => {
                  setAdminPinError(null);
                  setAdminPinInput('');
                  setIsAdminPinModalOpen(true);
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-teal-500/20 text-teal-400 hover:text-teal-300 transition cursor-pointer font-bold"
                style={{ backgroundColor: 'rgba(45, 212, 191, 0.08)' }}
              >
                <ShieldCheck size={12} />
                <span className="text-[10px] uppercase tracking-widest">Yönetici Girişi</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setUserRole('employee');
                  showToast('Yönetici yetkilerinden çıkış yapıldı. Personel moduna dönüldü.', 'info');
                  const sensitiveTabs = ['dashboard', 'kasa', 'ceksenet', 'masraflar', 'calisanlar', 'krediler', 'raporlar', 'ayarlar'];
                  if (sensitiveTabs.includes(activeTab)) {
                    setActiveTab('cariler');
                  }
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer font-bold animate-pulse"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
              >
                <Lock size={12} />
                <span className="text-[10px] uppercase tracking-widest">Yönetici Çıkışı</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

    </>
  );
};
