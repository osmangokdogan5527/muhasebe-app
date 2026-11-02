import React from 'react';
import { Repeat, LogOut, Lock, ChevronDown, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';
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
  /** Kullanıcı sistemi açıkken giriş yapan kişinin adı */
  staffUserName?: string | null;
  /** Kullanıcı sistemi açıkken: oturumu kapatıp "Kim kullanıyor?" ekranına döner */
  onSwitchUser?: () => void;
  /** Yalnızca sahipte: Çalışan Takibi ekranını açar */
  onOpenStaffActivity?: () => void;
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
  staffUserName,
  onSwitchUser,
  onOpenStaffActivity,
}) => {
  const isPusula = designStyle === 'pusula';

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col text-white shrink-0 transition-all duration-500 ease-in-out z-40 border shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5)] relative my-4 ml-4 rounded-3xl w-72 ${isLightSidebar ? 'sidebar-light' : ''}`}
        style={{ 
          backgroundColor: sidebarBg,
          ...sidebarPatternStyle,
          borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Sidebar Brand Logo Header */}
        <div className={`pt-5 pb-4 transition-all duration-500 ease-in-out flex items-center justify-between relative z-10 px-6`}>
          <div className="flex items-center justify-center min-w-0 flex-1">
            {isPusula || designStyle === 'fluid-mesh' ? (
              // Büyük kare logo yerine yatay marka satırı (simge + yazı); logo yazı içermez
              <div className="pusula-brand flex items-center gap-3 w-full min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-[0_6px_16px_-6px_var(--accent-500)]">
                  <StormLogo className="w-full h-full" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern="none" sidebarPatternOpacity={0} designStyle={designStyle} sidebarBg={sidebarBg} onlySvg={true} />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="pusula-brand-title text-[15px] font-extrabold tracking-tight">Storm</div>
                  <div className="pusula-brand-sub text-[10.5px] font-medium">Ön Muhasebe</div>
                </div>
              </div>
            ) : (
              <StormLogo className="w-36 h-auto mx-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} sidebarBg={sidebarBg} />
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 py-2 overflow-y-auto sidebar-nav-left-scroll custom-scrollbar overflow-x-hidden transition-all duration-500 ease-in-out px-4`}>
          <div className="space-y-1 w-full" style={{ direction: 'ltr' }}>
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
                            title={def.label}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                              isActive 
                                ? 'text-white font-semibold' 
                                : 'text-white hover:bg-white/5'
                            }`}
                            style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                          >
                            <div className={`flex items-center gap-3 min-w-0`}>
                              <StormIconWrapper iconElement={def.icon} isActive={isActive} designStyle={designStyle} />
                              {(
                                <span className="whitespace-nowrap truncate capitalize">{def.label}</span>
                              )}
                            </div>
                            {(
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                                }}
                                className={`p-1 rounded-lg hover:bg-black/15 transition-transform duration-200 ${isIslemlerSubMenuOpen ? 'rotate-180' : ''}`}
                              >
                                <ChevronDown size={14} />
                              </div>
                            )}
                          </button>
                        </div>
                        
                        {isIslemlerSubMenuOpen && (
                          <div className="pl-3 pr-1 py-1 space-y-1 bg-black/15 rounded-xl border border-white/5 animate-fade-in my-1 mx-1">
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('sale');
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider cursor-pointer"
                            >
                              <span className="text-[10px]">📈</span>
                              <span>Satış Faturası</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('purchase');
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider cursor-pointer"
                            >
                              <span className="text-[10px]">📉</span>
                              <span>Alış Faturası</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('collection');
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider cursor-pointer"
                            >
                              <span className="text-[10px]">💰</span>
                              <span>Tahsilat Girişi</span>
                            </button>
                            <button
                              onClick={() => {
                                handleNavigate('islemler');
                                setPendingIslemModal('payment');
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider cursor-pointer"
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
                        title={def.label}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                          isActive 
                            ? 'text-white font-semibold' 
                            : 'text-white hover:bg-white/5'
                        }`}
                        style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                      >
                        <div className={`flex items-center gap-3 min-w-0`}>
                          <StormIconWrapper iconElement={def.icon} isActive={isActive} designStyle={designStyle} />
                          {(
                            <span className="whitespace-nowrap truncate capitalize">{def.label}</span>
                          )}
                        </div>
                        {isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId) && (
                          <Lock size={12} className="text-zinc-400 group-hover:text-red-400 transition-colors shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </nav>

        {/* Sidebar User & Cloud Sync Info Footer */}
        <div className={`p-3 mt-auto space-y-2 transition-all duration-500 ease-in-out px-3`}>
          <div className={`rounded-2xl border border-white/5 bg-black/20 shadow-lg relative z-10 transition-all duration-500 ease-in-out p-3 space-y-2.5`}>
            {(
              <>
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
                      <img src={(user as any).photoURL} alt="Profile" className="w-7 h-7 object-cover rounded-lg" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0 uppercase" style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
                        {(staffUserName || user?.displayName || 'K').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-zinc-50 block truncate" title={staffUserName || user?.displayName || 'Kullanıcı'}>{staffUserName || user?.displayName || 'Kullanıcı'}</span>
                      <span className="text-[8px] font-mono text-zinc-300 block truncate">{staffUserName ? (user?.displayName || 'Aktif Oturum') : 'Aktif Oturum'}</span>
                    </div>
                  </div>
                  <button
                    onClick={onSwitchUser || handleSignOut}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer shrink-0"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-500) 15%, transparent)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={onSwitchUser ? 'Kullanıcı Değiştir' : 'Çıkış Yap'}
                  >
                    {onSwitchUser ? <Repeat size={14} /> : <LogOut size={14} />}
                  </button>
                </div>
                
                {onOpenStaffActivity && (
                  <button
                    id="sidebar-staff-activity"
                    onClick={onOpenStaffActivity}
                    className={`w-full flex items-center justify-center gap-2 p-2 rounded-xl border transition cursor-pointer ${activeTab === 'takip' ? 'border-teal-500/40 text-teal-300' : 'border-white/5 text-zinc-300 hover:text-white'}`}
                    style={{ backgroundColor: activeTab === 'takip' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <UserCheck size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Çalışan Takibi</span>
                  </button>
                )}
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
                      if (sensitiveTabs.includes(activeTab === 'tahsilat' && !onSwitchUser ? 'islemler' : activeTab)) {
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
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
