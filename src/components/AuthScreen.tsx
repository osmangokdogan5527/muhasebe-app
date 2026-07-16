import React from 'react';
import { User, ChevronDown, Shield, X, CloudLightning, RotateCcw, Download, Trash2, AlertTriangle, Check, ChevronUp, MessageSquare } from 'lucide-react';
import { StormLogo, APP_VERSION } from '../constants';

interface AuthScreenProps {
  currentThemeData: any;
  themeCssRules: string;
  activeLogoTheme: string;
  activeTheme: string;
  sidebarPattern: string;
  sidebarPatternOpacity: number;
  designStyle: string;
  selectedPinAccount: any;
  setSelectedPinAccount: (acc: any) => void;
  usersList: any[];
  enteredPin: string;
  setEnteredPin: (pin: string) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
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
  selectedPinAccount,
  setSelectedPinAccount,
  usersList,
  enteredPin,
  setEnteredPin,
  authError,
  setAuthError,
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

  return (
      <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-black'} flex flex-col items-center p-6 overflow-y-auto`}>
        <style>{`
          :root {
            ${themeCssRules}
          }
        `}</style>
        
        <div className="w-full max-w-md my-auto">
          <div className="text-center mb-10 flex flex-col items-center">
            <StormLogo className="w-44 h-auto mx-auto mb-6" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
            <p className="text-xs text-white/40 uppercase tracking-widest font-mono">Güvenli Yönetim Paneli</p>
          </div>

          {!selectedPinAccount ? (
            <div className="space-y-3 animate-fade-in">
              <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6 text-center">Hesabınızı Seçin</h2>
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedPinAccount(u)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-teal-500/10 hover:border-teal-500/30 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 text-white/40 group-hover:text-teal-400 transition">
                      <User size={20} />
                    </div>
                    <span className="font-bold text-white tracking-wide">{u.name}</span>
                  </div>
                  <ChevronDown className="text-white/20 group-hover:text-teal-400 -rotate-90 transition" size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-fade-in">
              <button 
                onClick={() => {
                  setSelectedPinAccount(null);
                  setEnteredPin('');
                  setAuthError(null);
                }}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white uppercase tracking-widest font-bold mb-8 transition cursor-pointer"
              >
                <ChevronDown className="rotate-90" size={14} />
                Geri Dön
              </button>
              
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4">
                  <User size={24} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wider">{selectedPinAccount.name}</h3>
                <p className="text-xs text-white/40 mt-1">Lütfen 6 haneli erişim şifrenizi girin</p>
              </div>

              <div className="space-y-6">
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEnteredPin(val);
                      if (authError) setAuthError(null);
                      
                      if (val.length === 6) {
                        if (val === selectedPinAccount.pin) {
                          const userData = {
                            uid: selectedPinAccount.id,
                            displayName: selectedPinAccount.name,
                            email: `${selectedPinAccount.id}@storm.com`
                          };
                          localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(userData));
                          setUserRole('employee');
                          setActiveTab('cariler');
                          setActiveUser(selectedPinAccount.id);
                          setUser(userData as any);
                        } else {
                          setAuthError('Hatalı şifre girdiniz.');
                          setEnteredPin('');
                        }
                      }
                    }}
                    placeholder="••••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-teal-500/50 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] text-white placeholder-slate-400 transition outline-none font-mono"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-rose-400 text-xs text-center mt-3 font-bold">{authError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Admin Login Section */}
        <div className="hidden md:block absolute top-8 left-8 w-[360px]">
          {!showAdminLogin ? (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="flex items-center gap-2 bg-[#0c0c0c] border border-white/10 hover:border-red-500/50 text-white/60 hover:text-red-400 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all"
            >
              <Shield size={16} />
              Yönetici Paneli
            </button>
          ) : (
            <div className="bg-[#0c0c0c] border border-red-500/30 rounded-2xl p-6 shadow-[0_8px_30px_rgb(185,28,28,0.2)] backdrop-blur-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={16} className="text-red-500 shrink-0" />
                  Yönetici Girişi
                </h3>
                <button onClick={() => { setShowAdminLogin(false); setAdminPin(''); setAdminAuthError(null); }} className="text-white/40 hover:text-white transition">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-white/40 mb-4 font-mono uppercase tracking-widest">Sistem Loglarına Erişim</p>
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAdminPin(val);
                  if (adminAuthError) setAdminAuthError(null);
                  
                  if (val.length >= 4) {
                    // Predefined admin password logic for "XSTORM" or arbitrary secure code
                    // Let's use 270212 for XSTORM or 000000 as fallback
                    if (val === '270212' || val === '000000') { 
                      setShowAdminDashboard(true);
                      setShowAdminLogin(false);
                      setAdminPin('');
                      // Load error logs
                      const logsStr = localStorage.getItem('storm_error_logs');
                      if (logsStr) {
                        try {
                          setErrorLogs(JSON.parse(logsStr));
                        } catch(e) {}
                      }
                      
                      // Load feedback logs
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
                className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 transition outline-none font-mono"
                autoFocus
              />
              {adminAuthError && (
                <p className="text-red-400 text-xs text-center mt-3 font-bold">{adminAuthError}</p>
              )}
            </div>
          )}
        </div>

        {/* Changelog Section */}
        <div className="hidden md:block absolute top-8 right-8 w-[360px] bg-[#0c0c0c] border border-white/20 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CloudLightning size={16} className="text-teal-400 shrink-0" />
            Sürüm Notları & Güncellemeler
          </h3>

          {/* Active Update Control Widget */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Mevcut Sürüm</span>
                <span className="text-xs font-bold text-teal-400 font-mono">v{APP_VERSION}</span>
              </div>
              {updateStatus === 'downloaded' ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-500/20 animate-pulse">
                  Güncelleme Hazır
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[9px] font-semibold uppercase tracking-wider rounded border border-teal-500/10">
                  En Güncel Sürüm
                </span>
              )}
            </div>

            <p className="text-[11px] text-white/60 leading-normal">
              Uygulamanın yeni bir sürümü olup olmadığını kontrol edebilir ve güncellemeyi indirebilirsiniz. Yeni sürüm hazır olduğunda onayınızla kurulum yapılır.
            </p>

            <div className="pt-1">
              {updateStatus === 'idle' || updateStatus === 'not-available' ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.electronAPI) {
                      alert("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.");
                      return;
                    }
                    setUpdateStatus('checking');
                    try {
                      const result = await (window.electronAPI as any).checkForUpdatesManual();
                      if (result.available) {
                        setUpdateStatus('available');
                      } else {
                        setUpdateStatus('not-available');
                        alert(result.error ? `Hata: ${result.error}` : "Şu an için yeni bir güncelleme bulunmuyor.");
                      }
                    } catch (err) {
                      setUpdateStatus('idle');
                      alert("Güncelleme kontrolü sırasında bir hata oluştu.");
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_18px_rgba(79,70,229,0.5)]"
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
              <div key={idx} className={`relative pl-4 border-l-2 ${idx === 0 ? 'border-teal-500' : 'border-white/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-bold tracking-widest ${idx === 0 ? 'text-teal-400' : 'text-white/80'}`}>
                    v{log.version}
                  </span>
                  <span className="text-xs text-white/50 font-mono">{log.date}</span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      Yeni
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {log.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-xs text-white/90 leading-relaxed flex items-start gap-2">
                      <span className="text-teal-400 mt-1 shrink-0">•</span>
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
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-3">
                    <Shield className="text-teal-500" size={24} />
                    Yönetim Paneli
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-widest">Kullanıcı & Sistem Yönetimi</p>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-xl w-full md:w-auto">
                  <button
                    onClick={() => setAdminTab('errors')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${adminTab === 'errors' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Sistem Hataları
                  </button>
                  <button
                    onClick={() => setAdminTab('feedback')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${adminTab === 'feedback' ? 'bg-teal-500/20 text-teal-400' : 'text-white/40 hover:text-white/60'}`}
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
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Tümünü Temizle
                  </button>
                  <button 
                    onClick={() => setShowAdminDashboard(false)} 
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition"
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
                      <p className="text-sm uppercase tracking-widest font-bold">Kayıtlı Hata Bulunamadı</p>
                      <p className="text-xs font-mono mt-2">Sistem sorunsuz çalışıyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {errorLogs.map((log) => (
                        <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-white/20">
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <AlertTriangle size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white line-clamp-1">{log.message}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/40 font-mono">
                                  <span>{log.date}</span>
                                  <span>•</span>
                                  <span className="text-teal-400/70">{log.user}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-white/40 shrink-0 ml-4 flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newLogs = errorLogs.filter(l => l.id !== log.id);
                                  localStorage.setItem('storm_error_logs', JSON.stringify(newLogs));
                                  setErrorLogs(newLogs);
                                }}
                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition cursor-pointer"
                                title="Bu Kaydı Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                              {expandedLogId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                          
                          {/* Expanded Stack Trace */}
                          {expandedLogId === log.id && (
                            <div className="p-4 border-t border-white/5 bg-black/40">
                              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Stack Trace</h4>
                              <pre className="text-[10px] text-red-300/80 font-mono whitespace-pre-wrap overflow-x-auto bg-black p-4 rounded-lg border border-red-500/10">
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
                      <p className="text-sm uppercase tracking-widest font-bold">Bildirim Bulunamadı</p>
                      <p className="text-xs font-mono mt-2">Kullanıcılardan gelen henüz yeni bir bildirim yok.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackList.map((feedback) => {
                        const currentStatus = feedback.status || 'Okundu';
                        return (
                          <div key={feedback.id} className={`bg-white/5 border rounded-xl overflow-hidden transition-colors ${feedback.type === 'error' ? 'border-red-500/20' : 'border-teal-500/20'}`}>
                            <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500'}`}>
                                  {feedback.type === 'error' ? <AlertTriangle size={20} /> : <MessageSquare size={20} />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{feedback.text}</p>
                                  {feedback.image && (
                                    <div className="mt-3">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1">Ekli Görsel (Büyütmek için tıklayın):</span>
                                      <div className="relative group max-w-[200px] aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-teal-500/50 transition cursor-zoom-in">
                                        <img 
                                          src={feedback.image} 
                                          alt="Ekli Görsel" 
                                          onClick={() => setZoomImage(feedback.image)}
                                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-xs text-white/40 font-mono">
                                    <span>{feedback.date}</span>
                                    <span>•</span>
                                    <span className={feedback.type === 'error' ? 'text-red-400/70' : 'text-teal-400/70'}>{feedback.user}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Durum:</span>
                                      {currentStatus === 'Okundu' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">Okundu</span>
                                      )}
                                      {currentStatus === 'İşlemde' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">İşlemde</span>
                                      )}
                                      {currentStatus === 'Tamamlandı' && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Tamamlandı</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col md:items-end items-start gap-3 justify-between">
                                <div className="flex flex-col gap-1 w-full">
                                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/30 block mb-0.5 md:text-right">Durumu Güncelle</span>
                                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'Okundu' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'Okundu' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/25 shadow-sm' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                                    >
                                      Okundu
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'İşlemde' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'İşlemde' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/25 shadow-sm' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                                    >
                                      İşlemde
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newFeedbackList = feedbackList.map(f => f.id === feedback.id ? { ...f, status: 'Tamamlandı' } : f);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }}
                                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${currentStatus === 'Tamamlandı' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 shadow-sm' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                                    >
                                      Tamamlandı
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 self-start md:self-end mt-1">
                                  <button
                                    onClick={() => {
                                      if (confirm("Bu bildirimi silmek istediğinizden emin misiniz?")) {
                                        const newFeedbackList = feedbackList.filter(f => f.id !== feedback.id);
                                        localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                        setFeedbackList(newFeedbackList);
                                      }
                                    }}
                                    className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded transition cursor-pointer"
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
