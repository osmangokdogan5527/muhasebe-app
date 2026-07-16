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
        className="md:hidden px-5 py-3 flex items-center justify-between border-b sticky top-0 z-40 transition-colors duration-300"
        style={{ 
          backgroundColor: sidebarBg,
          borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
          color: '#ffffff'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StormLogo className="w-14 h-14" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isOnline ? '#2dd4bf' : '#f43f5e', boxShadow: isOnline ? '0 0 8px #2dd4bf' : 'none' }} title={isOnline ? 'Sistem Çevrimiçi' : 'Çevrimdışı'}></span>
          <button 
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-zinc-200 hover:text-white rounded-lg hover:bg-white/10"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-xs flex justify-start animate-fade-in">
          <aside 
            className={`text-white w-64 h-full p-5 flex flex-col justify-between shadow-2xl animate-slide-right border-r transition-colors duration-300 relative z-40 ${isLightSidebar ? 'sidebar-light' : ''}`}
            style={{ 
              backgroundColor: sidebarBg,
              ...sidebarPatternStyle,
              borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
              borderRightWidth: '1px'
            }}
          >
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <StormLogo className="w-28 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
                <button 
                  id="mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-zinc-200 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-0.5">
                {tabOrder
                  .filter((tabId) => !hiddenTabs.includes(tabId))
                  .map((tabId) => {
                    const def = TAB_DEFS[tabId];
                  if (!def) return null;
                  const isActive = activeTab === tabId;
                  return (
                    <div key={tabId} className="space-y-0.5">
                      {tabId === 'islemler' ? (
                        <div className="space-y-0.5">
                          <button 
                            id={`mob-nav-${tabId}`}
                            onClick={() => {
                              handleNavigate('islemler');
                              setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-150 group ${
                              isActive ? 'text-white font-semibold' : 'text-white hover:bg-white/5'
                            }`}
                            style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <StormIconWrapper iconElement={def.icon} isActive={isActive} />
                              <span className="whitespace-nowrap truncate">{def.label}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isIslemlerSubMenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isIslemlerSubMenuOpen && (
                            <div className="pl-2.5 py-0.5 space-y-0.5 bg-black/15 rounded-lg border border-white/5">
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('sale');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">📈</span>
                                <span>Satış Faturası</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('purchase');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">📉</span>
                                <span>Alış Faturası</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('collection');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">💰</span>
                                <span>Tahsilat Girişi</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('payment');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">💸</span>
                                <span>Ödeme Girişi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          id={`mob-nav-${tabId}`}
                          onClick={() => handleNavigate(tabId as any)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-150 group ${
                            isActive ? 'text-white font-semibold' : 'text-white hover:bg-white/5'
                          }`}
                          style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <StormIconWrapper iconElement={def.icon} isActive={isActive} />
                            <span className="whitespace-nowrap truncate">{def.label}</span>
                          </div>
                          {isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId) && (
                            <Lock size={11} className="text-zinc-400 group-hover:text-red-400 shrink-0 animate-pulse" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
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
          </aside>
        </div>
      )}

    </>
  );
};
