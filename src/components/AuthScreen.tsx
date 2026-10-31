import React from 'react';
import { User, ChevronDown, Shield, X, CloudLightning, RotateCcw, Download, Trash2, AlertTriangle, Check, ChevronUp, MessageSquare } from 'lucide-react';
import { StormLogo, APP_VERSION } from '../constants';
import { DeviceAccount } from '../utils/accountStore';
import { TenantLoginPanel } from './auth/TenantLoginPanel';
import { InstallAppBanner } from './auth/InstallAppBanner';
import { FluidMeshBackground } from './FluidMeshBackground';
import { confirmDialog, alertDialog } from '../utils/dialogs';

interface AuthScreenProps {
  currentThemeData: any;
  themeCssRules: string;
  activeLogoTheme: string;
  activeTheme: string;
  sidebarPattern: string;
  sidebarPatternOpacity: number;
  designStyle: string;
  accounts: DeviceAccount[];
  setAccounts: (accounts: DeviceAccount[]) => void;
  setUserRole: (role: any) => void;
  setActiveTab: (tab: string) => void;
  setActiveUser: (user: string) => void;
  setUser: (user: any) => void;
  showAdminLogin: boolean;
  setShowAdminLogin: (show: boolean) => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  adminAuthError: string | null;
  setAdminAuthError: (err: string | null) => void;
  showAdminDashboard: boolean;
  setShowAdminDashboard: (show: boolean) => void;
  errorLogs: any[];
  setErrorLogs: (logs: any) => void;
  feedbackList: any[];
  setFeedbackList: (list: any) => void;
  updateStatus: string;
  setUpdateStatus: (status: string) => void;
  updatePercent: number;
  changelogData, setZoomImage: any[];
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentThemeData,
  themeCssRules,
  activeLogoTheme,
  activeTheme,
  sidebarPattern,
  sidebarPatternOpacity,
  designStyle,
  accounts,
  setAccounts,
  setUserRole,
  setActiveTab,
  setActiveUser,
  setUser,
  showAdminLogin,
  setShowAdminLogin,
  adminPin,
  setAdminPin,
  adminAuthError,
  setAdminAuthError,
  showAdminDashboard,
  setShowAdminDashboard,
  errorLogs,
  setErrorLogs,
  feedbackList,
  setFeedbackList,
  updateStatus,
  setUpdateStatus,
  updatePercent,
  changelogData, setZoomImage
}) => {

  const [adminTab, setAdminTab] = React.useState<'errors' | 'feedback'>('errors');
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);

  const isFluidMesh = designStyle === 'fluid-mesh';
  const isCleanLight = designStyle === 'clean-light' || designStyle === 'pro-solid';

  // Tema ve tasarım stiline uygun metin renkleri ve görsel hiyerarşi sınıfları
  const textPrimary = isCleanLight ? 'text-slate-800' : 'text-white';
  const textSecondary = isCleanLight ? 'text-slate-600' : 'text-white/60';
  const textTertiary = isCleanLight ? 'text-slate-500' : 'text-white/40';
  const textMuted = isCleanLight ? 'text-slate-300' : 'text-white/20';
  const textActive = isCleanLight ? 'text-teal-600 font-bold' : 'text-teal-400 font-bold';

  const cardBgClass = isCleanLight 
    ? 'bg-white border border-slate-200/80 shadow-[0_12px_40px_-5px_rgba(15,23,42,0.08)]' 
    : 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl';

  const buttonBgClass = isCleanLight
    ? 'border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-teal-500/40 hover:shadow-sm text-slate-800'
    : 'border border-white/10 bg-white/5 hover:bg-teal-500/10 hover:border-teal-500/30 text-white';

  const userIconBg = isCleanLight
    ? 'bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600'
    : 'bg-white/5 text-white/40 group-hover:bg-teal-500/20 group-hover:text-teal-400';

  const inputStyleClass = isCleanLight
    ? 'bg-slate-50 border border-slate-200/80 focus:border-teal-500/50 text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-teal-500/5'
    : 'bg-white/5 border border-white/10 focus:border-teal-500/50 text-white placeholder-slate-400';

  const adminBtnClass = isCleanLight
    ? 'bg-white border border-slate-200 shadow-sm hover:border-red-500/40 text-slate-600 hover:text-red-600'
    : 'bg-[#0c0c0c] border border-white/10 hover:border-red-500/50 text-white/60 hover:text-red-400';

  const adminBoxClass = isCleanLight
    ? 'bg-white border border-red-200/80 shadow-[0_15px_45px_rgba(239,68,68,0.06)]'
    : 'bg-[#0c0c0c] border border-red-500/30 backdrop-blur-xl';

  const changelogBoxClass = isCleanLight
    ? 'bg-white border border-slate-200/80 shadow-[0_15px_45px_rgba(15,23,42,0.06)]'
    : 'bg-[#0c0c0c] border border-white/20 backdrop-blur-xl';

  const changelogWidgetBg = isCleanLight
    ? 'bg-slate-50/80 border border-slate-100'
    : 'bg-white/[0.03] border border-white/10';

  const changelogBtnClass = isCleanLight
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 shadow-[0_4px_12px_rgba(79,70,229,0.15)]'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_18px_rgba(79,70,229,0.5)]';

  const timelineBorder = isCleanLight ? 'border-slate-100' : 'border-white/10';


  const mainBgStyle = isFluidMesh
    ? { backgroundColor: '#06040e' }
    : {
        background: `
          radial-gradient(circle at 10% 20%, color-mix(in srgb, var(--accent-500) 8%, transparent) 0%, transparent 35%),
          radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--accent-500) 6%, transparent) 0%, transparent 35%),
          radial-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px),
          linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 24px 24px, 100% 100%',
      };

  return (
      <main 
        data-design-style={designStyle}
        className={`min-h-screen flex flex-col items-center p-6 overflow-y-auto relative z-10 w-full`}
        style={mainBgStyle}
      >
        <style>{`
          :root {
            ${themeCssRules}
          }
        `}</style>

        {isFluidMesh && <FluidMeshBackground />}
        
        <div className="w-full max-w-md my-auto relative z-10">
          <div className="text-center mb-10 flex flex-col items-center">
            <StormLogo className="w-44 h-auto mx-auto mb-6" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
            <p className={`text-xs uppercase tracking-widest font-mono ${textTertiary}`}>Güvenli Yönetim Paneli</p>
          </div>

          <TenantLoginPanel
            accounts={accounts}
            onAccountsChange={setAccounts}
            styles={{ textPrimary, textSecondary, textTertiary, textMuted, cardBgClass, buttonBgClass, userIconBg, inputStyleClass }}
            onLoggedIn={(account, offline) => {
              if (offline) {
                alertDialog('İnternet bağlantısı yok: çevrimdışı giriş yapıldı. Yapılan işlemler bağlantı gelince sunucuya eşitlenir.');
              }
              const userData = {
                uid: account.id,
                displayName: account.name,
                photoURL: account.photoURL || '',
                email: `${account.id}@storm.com`
              };
              localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(userData));
              setUserRole('employee');
              const defaultTab = window.innerWidth < 768 ? 'menu' : 'cariler';
              setActiveTab(defaultTab);
              setActiveUser(account.id);
              setUser(userData as any);
            }}
          />
          <InstallAppBanner textPrimary={textPrimary} textTertiary={textTertiary} cardBgClass={cardBgClass} />

        </div>

        {/* Admin Login Section */}
        <div className="hidden md:block absolute top-8 left-8 w-[360px]">
          {!showAdminLogin ? (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all cursor-pointer ${adminBtnClass}`}
            >
              <Shield size={16} />
              Yönetici Paneli
            </button>
          ) : (
            <div className={`rounded-2xl p-6 animate-fade-in ${adminBoxClass}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${textPrimary}`}>
                  <Shield size={16} className="text-red-500 shrink-0" />
                  Yönetici Girişi
                </h3>
                <button onClick={() => { setShowAdminLogin(false); setAdminPin(''); setAdminAuthError(null); }} className={`transition ${textTertiary} hover:${textPrimary}`}>
                  <X size={16} />
                </button>
              </div>
              <p className={`text-xs mb-4 font-mono uppercase tracking-widest ${textTertiary}`}>Sistem Loglarına Erişim</p>
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAdminPin(val);
                  if (adminAuthError) setAdminAuthError(null);
                  
                  // Sistem loglarına erişim, uygulamanın Yönetici PIN'i ile açılır (Ayarlar > Yetkiler)
                  const adminPinCode = localStorage.getItem('storm_muhasebe_admin_pin') || '1923';
                  if (val.length >= 4) {
                    if (val === adminPinCode) { 
                      setShowAdminDashboard(true);
                      setShowAdminLogin(false);
                      setAdminPin('');
                      const logsStr = localStorage.getItem('storm_error_logs');
                      if (logsStr) {
                        try {
                          setErrorLogs(JSON.parse(logsStr));
                        } catch(e) {}
                      }
                      
                      const fLogsStr = localStorage.getItem('storm_feedback_logs');
                      if (fLogsStr) {
                        try {
                          setFeedbackList(JSON.parse(fLogsStr));
                        } catch(e) {}
                      }
                    } else if (val.length === 6) {
                      setAdminAuthError('Hatalı yönetici şifresi.');
                      setAdminPin('');
                    }
                  }
                }}
                placeholder="••••••"
                className={`w-full text-center text-2xl tracking-[0.5em] placeholder-slate-500 transition outline-none font-mono px-4 py-3 rounded-xl focus:border-red-500/50 ${inputStyleClass}`}
                autoFocus
              />
              {adminAuthError && (
                <p className="text-red-500 text-xs text-center mt-3 font-bold">{adminAuthError}</p>
              )}
            </div>
          )}
        </div>

        {/* Changelog Section */}
        <div className={`hidden xl:block absolute top-8 right-8 w-[360px] rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar ${changelogBoxClass}`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${textPrimary}`}>
            <CloudLightning size={16} className="text-teal-500 shrink-0" />
            Sürüm Notları & Güncellemeler
          </h3>

          {/* Active Update Control Widget */}
          <div className={`rounded-xl p-4 mb-6 space-y-3 ${changelogWidgetBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textTertiary}`}>Mevcut Sürüm</span>
                <span className="text-xs font-bold text-teal-500 font-mono">v{APP_VERSION}</span>
              </div>
              {updateStatus === 'downloaded' ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/20 animate-pulse">
                  Güncelleme Hazır
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 text-[9px] font-semibold uppercase tracking-wider rounded border border-teal-500/10">
                  En Güncel Sürüm
                </span>
              )}
            </div>

            <p className={`text-[11px] leading-normal ${textSecondary}`}>
              Uygulamanın yeni bir sürümü olup olmadığını kontrol edebilir ve güncellemeyi indirebilirsiniz. Yeni sürüm hazır olduğunda onayınızla kurulum yapılır.
            </p>

            <div className="pt-1">
              {updateStatus === 'idle' || updateStatus === 'not-available' ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.electronAPI) {
                      alertDialog("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.");
                      return;
                    }
                    setUpdateStatus('checking');
                    try {
                      const result = await (window.electronAPI as any).checkForUpdatesManual();
                      if (result.available) {
                        setUpdateStatus('available');
                      } else {
                        setUpdateStatus('not-available');
                        
                        let errMsg = result.error;
                        if (errMsg && typeof errMsg === 'string') {
                          if (errMsg.includes('No published versions on GitHub')) {
                            errMsg = 'GitHub üzerinde henüz yayınlanmış (Publish edilmiş) bir uygulama sürümü bulunamadı. Lütfen GitHub deponuzun "Releases" kısmında en az bir sürüm oluşturup yayınladığınızdan emin olun.';
                          } else if (errMsg.includes('HttpError: 404')) {
                            errMsg = 'GitHub deponuz bulunamadı (404 Hatası). Lütfen package.json dosyasındaki "owner" ve "repo" bilgilerinin doğruluğunu ve deponun herkese açık (public) olduğunu kontrol edin.';
                          }
                        }
                        
                        alertDialog(errMsg ? `Hata: ${errMsg}` : "Şu an için yeni bir güncelleme bulunmuyor.");
                      }
                    } catch (err) {
                      setUpdateStatus('idle');
                      alertDialog("Güncelleme kontrolü sırasında bir hata oluştu.");
                    }
                  }}
                  className={`w-full py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${changelogBtnClass}`}
                >
                  <RotateCcw size={12} />
                  Güncellemeleri Denetle
                </button>
              ) : updateStatus === 'checking' ? (
                <button disabled className="w-full py-2 bg-indigo-500/40 text-white/50 text-[11px] font-bold uppercase tracking-wider rounded-lg cursor-not-allowed flex items-center justify-center gap-2 border border-indigo-500/20">
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Kontrol Ediliyor...
                </button>
              ) : updateStatus === 'available' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.electronAPI) {
                      window.electronAPI.downloadUpdate();
                      setUpdateStatus('downloading');
                    }
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                >
                  <Download size={12} />
                  Şimdi İndir
                </button>
              ) : updateStatus === 'downloading' ? (
                <div className="space-y-1.5 w-full">
                  <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    <span>İndiriliyor...</span>
                    <span>{Math.round(updatePercent)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full border border-white/5">
                    <div className="h-full bg-indigo-500 transition-all duration-300 animate-pulse" style={{ width: `${updatePercent}%` }} />
                  </div>
                </div>
              ) : updateStatus === 'downloaded' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.electronAPI) {
                      window.electronAPI.restartApp();
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                >
                  <RotateCcw size={12} />
                  Yeniden Başlat & Kur
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {changelogData.map((log, idx) => (
              <div key={idx} className={`relative pl-4 border-l-2 ${idx === 0 ? 'border-teal-500' : timelineBorder}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-bold tracking-widest ${idx === 0 ? textActive : textPrimary}`}>
                    v{log.version}
                  </span>
                  <span className={`text-xs font-mono ${textTertiary}`}>{log.date}</span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 bg-teal-500/10 text-teal-500 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      Yeni
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {log.changes.map((change, cIdx) => (
                    <li key={cIdx} className={`text-xs leading-relaxed flex items-start gap-2 ${isCleanLight ? 'text-slate-600' : 'text-white/95'}`}>
                      <span className="text-teal-500 mt-1 shrink-0">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Dashboard Modal */}
        {showAdminDashboard && (
          <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${isCleanLight ? 'bg-slate-900/50 backdrop-blur-md' : 'bg-black/90 backdrop-blur-md'}`}>
            <div className={`w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in ${
              isCleanLight
                ? 'bg-white border border-slate-200 text-slate-800'
                : 'bg-[#0c0c0c] border border-white/10 text-white'
            }`}>
              {/* Header */}
              <div className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${isCleanLight ? 'border-slate-100' : 'border-white/5'}`}>
                <div>
                  <h2 className={`text-lg font-bold tracking-widest uppercase flex items-center gap-3 ${textPrimary}`}>
                    <Shield className="text-teal-500" size={24} />
                    Yönetim Paneli
                  </h2>
                  <p className={`text-xs font-mono mt-1 uppercase tracking-widest ${textTertiary}`}>Kullanıcı & Sistem Yönetimi</p>
                </div>
                
                <div className={`flex p-1 rounded-xl w-full md:w-auto ${isCleanLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <button
                    onClick={() => setAdminTab('errors')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition cursor-pointer ${
                      adminTab === 'errors' 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/10' 
                        : `${textTertiary} hover:${textPrimary}`
                    }`}
                  >
                    Sistem Hataları
                  </button>
                  <button
                    onClick={() => setAdminTab('feedback')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition cursor-pointer ${
                      adminTab === 'feedback' 
                        ? 'bg-teal-500/10 text-teal-500 border border-teal-500/10' 
                        : `${textTertiary} hover:${textPrimary}`
                    }`}
                  >
                    İstek & Geri Bildirim
                  </button>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <button 
                    onClick={() => {
                      if (adminTab === 'errors') {
                        localStorage.removeItem('storm_error_logs');
                        setErrorLogs([]);
                      } else {
                        localStorage.removeItem('storm_feedback_logs');
                        setFeedbackList([]);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Tümünü Temizle
                  </button>
                  <button 
                    onClick={() => setShowAdminDashboard(false)} 
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      isCleanLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {adminTab === 'errors' && (
                  errorLogs.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <Check size={48} className="mx-auto mb-4 text-teal-500/50" />
                      <p className={`text-sm uppercase tracking-widest font-bold ${textTertiary}`}>Kayıtlı Hata Bulunamadı</p>
                      <p className={`text-xs font-mono mt-2 ${textMuted}`}>Sistem sorunsuz çalışıyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {errorLogs.map((log) => (
                        <div key={log.id} className={`rounded-xl overflow-hidden transition-colors ${
                          isCleanLight 
                            ? 'bg-slate-50 border border-slate-200 hover:border-slate-300' 
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                        }`}>
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <AlertTriangle size={20} />
                              </div>
                              <div>
                                <p className={`text-sm font-bold line-clamp-1 ${textPrimary}`}>{log.message}</p>
                                <div className={`flex items-center gap-3 mt-1 text-xs font-mono ${textTertiary}`}>
                                  <span>{log.date}</span>
                                  <span>•</span>
                                  <span className="text-teal-500/70">{log.user}</span>
                                </div>
                              </div>
                            </div>
                            <div className={`shrink-0 ml-4 flex items-center gap-3 ${textTertiary}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newLogs = errorLogs.filter(l => l.id !== log.id);
                                  localStorage.setItem('storm_error_logs', JSON.stringify(newLogs));
                                  setErrorLogs(newLogs);
                                }}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition cursor-pointer"
                                title="Bu Kaydı Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                              {expandedLogId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                          
                          {/* Expanded Stack Trace */}
                          {expandedLogId === log.id && (
                            <div className={`p-4 border-t ${isCleanLight ? 'border-slate-200 bg-slate-100/50' : 'border-white/5 bg-black/40'}`}>
                              <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${textSecondary}`}>Stack Trace</h4>
                              <pre className="text-[10px] text-red-500/90 font-mono whitespace-pre-wrap overflow-x-auto bg-black p-4 rounded-lg border border-red-500/10">
                                {log.stack || 'Stack trace bulunamadı.'}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}

                {adminTab === 'feedback' && (
                  feedbackList.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <MessageSquare size={48} className="mx-auto mb-4 text-teal-500/50" />
                      <p className={`text-sm uppercase tracking-widest font-bold ${textTertiary}`}>Bildirim Bulunamadı</p>
                      <p className={`text-xs font-mono mt-2 ${textMuted}`}>Kullanıcılardan gelen henüz yeni bir bildirim yok.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackList.map((feedback) => {
                        const currentStatus = feedback.status || 'Okundu';
                        return (
                          <div key={feedback.id} className={`border rounded-xl overflow-hidden transition-colors ${
                            isCleanLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                          } ${feedback.type === 'error' ? 'border-red-500/20' : 'border-teal-500/20'}`}>
                            <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500'}`}>
                                  {feedback.type === 'error' ? <AlertTriangle size={20} /> : <MessageSquare size={20} />}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isCleanLight ? 'text-slate-700' : 'text-white/90'}`}>{feedback.text}</p>
                                  {feedback.image && (
                                    <div className="mt-3">
                                      <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${textTertiary}`}>Ekli Görsel (Büyütmek için tıklayın):</span>
                                      <div className={`relative group max-w-[200px] aspect-video rounded-lg overflow-hidden border transition cursor-zoom-in ${isCleanLight ? 'border-slate-200 hover:border-teal-500/50' : 'border-white/10 hover:border-teal-500/50'}`}>
                                        <img 
                                          src={feedback.image} 
                                          alt="Ekli Görsel" 
                                          onClick={() => setZoomImage(feedback.image)}
                                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-xs font-mono ${textTertiary}`}>
                                    <span>{feedback.date}</span>
                                    <span>•</span>
                                    <span className={feedback.type === 'error' ? 'text-red-500/80' : 'text-teal-500/80'}>{feedback.user}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`${textMuted} text-[10px] uppercase font-bold tracking-wider`}>Durum:</span>
                                      {currentStatus === 'Okundu' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/10 border border-blue-500/20 text-blue-500">Okundu</span>
                                      )}
                                      {currentStatus === 'İşlemde' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">İşlemde</span>
                                      )}
                                      {currentStatus === 'Tamamlandı' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">Tamamlandı</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col md:items-end items-start gap-3 justify-between">
                                <div className="flex flex-col gap-1 w-full">
                                  <span className={`text-[9px] uppercase font-bold tracking-widest block mb-0.5 md:text-right ${textTertiary}`}>Durumu Güncelle</span>
                                  <div className={`flex items-center gap-1 p-1 rounded-lg border ${isCleanLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'Okundu' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'Okundu' ? 'bg-blue-500/20 text-blue-600 border border-blue-500/25 shadow-sm' : `${textTertiary} hover:${textPrimary} border border-transparent`}`}
                                    >
                                      Okundu
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'İşlemde' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'İşlemde' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/25 shadow-sm' : `${textTertiary} hover:${textPrimary} border border-transparent`}`}
                                    >
                                      İşlemde
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'Tamamlandı' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'Tamamlandı' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/25 shadow-sm' : `${textTertiary} hover:${textPrimary} border border-transparent`}`}
                                    >
                                      Tamamlandı
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-start md:self-end mt-1">
                                  <button
                                    onClick={async () => {
                                      if (await confirmDialog("Bu bildirimi silmek istediğinizden emin misiniz?")) {
                                        const newFeedbackList = feedbackList.filter(f => f.id !== feedback.id);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }
                                    }}
                                    className={`p-2 rounded transition cursor-pointer ${isCleanLight ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400'}`}
                                    title="Bu Bildirimi Sil"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>
  );
};
