import React from 'react';
import { X, Menu, ChevronDown, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { StormLogo, StormIconWrapper, TAB_DEFS, SIDEBAR_BG_PRESETS } from '../constants';

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
  sidebarBg,
  activeLogoTheme,
  activeTheme,
  sidebarPattern,
  sidebarPatternOpacity,
  designStyle,
  isOnline,
  mobileMenuOpen,
  setMobileMenuOpen,
  isLightSidebar,
  sidebarPatternStyle,
  tabOrder,
  hiddenTabs,
  activeTab,
  handleNavigate,
  isIslemlerSubMenuOpen,
  setIsIslemlerSubMenuOpen,
  userRole,
  sensitiveTabs,
  handleSignOut,
  setAdminPinError,
  setAdminPinInput,
  setIsAdminPinModalOpen,
  setUserRole,
  user,
  setPendingIslemModal,
  showToast,
  setActiveTab,
  isSecurityActive
}) => {
  return (
    <>
{/* 2. MOBILE HEADER & NAVIGATION BAR */}
      <div 
        className="md:hidden px-5 py-2.5 flex items-center justify-between border-b sticky top-0 z-40 bg-[#070709]/95 backdrop-blur-md border-white/5 text-white"
      >
        <div className="flex items-center gap-3">
          <button 
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg transition-colors text-zinc-300 hover:text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isOnline ? '#2dd4bf' : '#f43f5e', boxShadow: isOnline ? '0 0 8px #2dd4bf' : 'none' }} title={isOnline ? 'Sistem Çevrimiçi' : 'Çevrimdışı'}></span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <StormLogo className="w-14 h-14" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} sidebarBg="#070709" />
        </div>
      </div>

      {/* Mobile Drawer Menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#070709]/98 backdrop-blur-md flex flex-col justify-between p-5 overflow-y-auto animate-fade-in text-white">
          <div className="w-full flex flex-col">
            {/* Top Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
              <StormLogo className="w-24 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} sidebarBg="#070709" />
              <button 
                id="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg transition-colors text-zinc-300 hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Grid - 3 Columns */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {tabOrder
                .filter((tabId) => !hiddenTabs.includes(tabId))
                .map((tabId) => {
                  const def = TAB_DEFS[tabId];
                  if (!def) return null;
                  const isActive = activeTab === tabId;
                  
                  return (
                    <React.Fragment key={tabId}>
                      {tabId === 'islemler' && isIslemlerSubMenuOpen ? (
                        <div className="col-span-3 bg-white/[0.02] border border-teal-500/10 rounded-2xl p-4 flex flex-col gap-4 animate-slide-down">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                                {def.icon}
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">{def.label}</span>
                                <span className="text-[8px] font-medium text-zinc-400 block mt-0.5">Finansal Girişler</span>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsIslemlerSubMenuOpen(false);
                              }}
                              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <ChevronDown size={14} className="rotate-180" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('sale');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.035] hover:bg-teal-500/10 text-white transition-all duration-200 text-left"
                            >
                              <span className="text-sm">📈</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">Satış Faturası</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('purchase');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.035] hover:bg-teal-500/10 text-white transition-all duration-200 text-left"
                            >
                              <span className="text-sm">📉</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">Alış Faturası</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('collection');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.035] hover:bg-teal-500/10 text-white transition-all duration-200 text-left"
                            >
                              <span className="text-sm">💰</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">Tahsilat Girişi</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('payment');
                                setMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.035] hover:bg-teal-500/10 text-white transition-all duration-200 text-left"
                            >
                              <span className="text-sm">💸</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">Ödeme Girişi</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          id={`mob-nav-${tabId}`}
                          onClick={() => {
                            if (tabId === 'islemler') {
                                handleNavigate('islemler');
                                setIsIslemlerSubMenuOpen(true);
                            } else {
                                handleNavigate(tabId as any);
                                setMobileMenuOpen(false);
                            }
                          }}
                          className={`relative flex flex-col items-center justify-center p-3 py-4 rounded-2xl transition-all duration-200 group min-h-[110px] ${
                            isActive 
                              ? 'bg-teal-500/10 text-white shadow-[0_0_15px_rgba(45,212,191,0.15)] ring-1 ring-teal-500/25' 
                              : 'bg-white/[0.035] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-200 ${
                            isActive 
                              ? 'bg-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.25)]' 
                              : 'bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white'
                          }`}>
                            {React.isValidElement(def.icon) 
                              ? React.cloneElement(def.icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.2 }) 
                              : def.icon}
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-center leading-tight whitespace-normal break-words w-full px-1">{def.label}</span>
                          {isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId) && (
                            <Lock size={10} className="absolute top-2 right-2 text-rose-500 animate-pulse" />
                          )}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
          </div>

          {/* Footer - Profile & Security */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
              <div className="flex items-center gap-2 min-w-0">
                { (user as any)?.photoURL ? (
                  <img src={(user as any).photoURL} alt="Profile" className="w-7 h-7 object-cover rounded-lg" />
                ) : (
                  <div className="w-7 h-7 rounded-lg text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase" style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
                    {user?.displayName ? user.displayName.charAt(0) : 'K'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-zinc-50 block truncate">{user?.displayName || 'Kullanıcı'}</span>
                  <span className="text-[9px] font-mono text-zinc-300 block truncate">Aktif Oturum</span>
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
                <LogOut size={13} />
              </button>
            </div>

            {isSecurityActive && (userRole === 'employee' ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
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
                  setMobileMenuOpen(false);
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
      )}

    </>
  );
};
