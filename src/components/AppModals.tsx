import React from 'react';
import { RotateCcw, CloudLightning, Check, MessageSquare, ImageIcon, ShieldCheck, X, Download, ShieldAlert, Info } from 'lucide-react';
import { StormLogo, } from '../constants';
import AiAssistant from "./AiAssistant";

interface AppModalsProps {
  resetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
  resetConfirmationText: string;
  setResetConfirmationText: (text: string) => void;
  resetError: string | null;
  setResetError: (error: string | null) => void;
  isResetting: boolean;
  handleResetAllData: () => void;
  updateStatus: string;
  updatePercent: number;
  activeLogoTheme: string;
  activeTheme: string;
  sidebarPattern: string;
  sidebarPatternOpacity: number;
  designStyle: string;
  showChangelog: boolean;
  handleCloseChangelog: () => void;
  isAdminPinModalOpen: boolean;
  setIsAdminPinModalOpen: (open: boolean) => void;
  adminPinInput: string;
  setAdminPinInput: (pin: string) => void;
  adminPinError: string | null;
  setAdminPinError: (error: string | null) => void;
  escalationPin: string;
  setUserRole: (role: any) => void;
  showToast: (msg: string, type: string) => void;
  toastMessage: { text: string; type: "success" | "error" | "info" } | null;
  setToastMessage: (msg: any) => void;
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
  availableUpdateVersion: string;
  setUpdateStatus: (status: string) => void;
  CHANGELOG: any;
  showFeedbackModal: boolean;
  setShowFeedbackModal: (show: boolean) => void;
  feedbackType: string;
  setFeedbackType: (type: string) => void;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  feedbackImage: string | null;
  setFeedbackImage: (img: string | null) => void;
  feedbackImageLoading: boolean;
  setFeedbackImageLoading: (loading: boolean) => void;
  compressImage: any;
  user: any;
  zoomImage: string | null;
  setZoomImage: (img: string | null) => void;
  geminiApiKey: string;
  setActiveTab: (tab: any) => void;
  setAiPrefilledData,
  setFeedbackList: (data: any) => void;
  userRole: 'admin' | 'employee';
  isSecurityActive: boolean;
  sensitiveTabs: string[];
  actionPermissions: any;
  handleNavigate: (tabId: string) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  resetModalOpen,
  setResetModalOpen,
  resetConfirmationText,
  setResetConfirmationText,
  resetError,
  setResetError,
  isResetting,
  handleResetAllData,
  updateStatus,
  updatePercent,
  activeLogoTheme,
  activeTheme,
  sidebarPattern,
  sidebarPatternOpacity,
  designStyle,
  showChangelog,
  handleCloseChangelog,
  isAdminPinModalOpen,
  setIsAdminPinModalOpen,
  adminPinInput,
  setAdminPinInput,
  adminPinError,
  setAdminPinError,
  escalationPin,
  setUserRole,
  showToast,
  toastMessage,
  setToastMessage,
  showUpdateModal,
  setShowUpdateModal,
  availableUpdateVersion,
  setUpdateStatus,
  CHANGELOG,
  showFeedbackModal,
  setShowFeedbackModal,
  feedbackType,
  setFeedbackType,
  feedbackText,
  setFeedbackText,
  feedbackImage,
  setFeedbackImage,
  feedbackImageLoading,
  setFeedbackImageLoading,
  compressImage,
  user,
  zoomImage,
  setZoomImage,
  geminiApiKey,
  setActiveTab,
  setAiPrefilledData,
  setFeedbackList,
  userRole,
  isSecurityActive,
  sensitiveTabs,
  actionPermissions,
  handleNavigate
}) => {
  return (
    <>
{/* RESET DATABASE MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">Verileri Sıfırla</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bu işlem STORM MUHASEBE üzerindeki <strong>tüm Cari Hesapları, Stokları, Finansal Hareketleri, Ödemeleri/Tahsilatları ve Çek/Senet</strong> verilerini kalıcı olarak silecektir. 
              <br />
              <span className="text-rose-600 font-semibold block mt-2">Bu işlem geri alınamaz!</span>
            </p>

            <div className="mb-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Onaylamak için aşağıdaki kutuya <span className="text-rose-600 font-extrabold">SIFIRLA</span> yazın:
              </label>
              <input
                type="text"
                placeholder="SIFIRLA"
                value={resetConfirmationText}
                onChange={(e) => {
                  setResetConfirmationText(e.target.value);
                  if (resetError) setResetError(null);
                }}
                disabled={isResetting}
                className="w-full text-center tracking-widest uppercase font-extrabold border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 bg-slate-50 text-slate-900"
              />
              {resetError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5">{resetError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmationText('');
                  setResetError(null);
                }}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                disabled={isResetting || resetConfirmationText.trim().toUpperCase() !== 'SIFIRLA'}
                className={`px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider rounded-lg transition shadow-md flex items-center gap-2 ${
                  resetConfirmationText.trim().toUpperCase() === 'SIFIRLA' && !isResetting
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isResetting ? 'Sıfırlanıyor...' : 'Her Şeyi Sıfırla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE DOWNLOADED MODAL */}
      {updateStatus === 'downloaded' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 overflow-hidden text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <StormLogo className="w-28 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Güncelleme Hazır</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Yeni özellikler hazır! Uygulamayı güncel sürüme geçirmek için yeniden başlatın.
            </p>

            <button
              onClick={() => {
                if (window.electronAPI) {
                  window.electronAPI.restartApp();
                }
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Şimdi Yeniden Başlat
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL UPDATE NOTIFICATION MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CloudLightning size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Yeni Güncelleme Bulundu
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">
                  Versiyon {availableUpdateVersion}
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Uygulamanın yeni bir sürümü mevcut. Performans iyileştirmeleri ve yeni özelliklerden faydalanmak için hemen güncelleyebilirsiniz.
              </p>
              
              <div className="mt-2">
                {updateStatus === 'available' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition uppercase text-xs tracking-wider cursor-pointer"
                    >
                      Daha Sonra
                    </button>
                    <button
                      onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.downloadUpdate();
                          setUpdateStatus('downloading');
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Şimdi İndir
                    </button>
                  </div>
                ) : updateStatus === 'downloading' ? (
                  <div className="flex flex-col gap-2 w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
                        İndiriliyor...
                      </span>
                      <span>{Math.round(updatePercent)}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden w-full shadow-inner">
                      <div className="h-full bg-indigo-600 transition-all duration-300 relative" style={{ width: `${updatePercent}%` }}>
                        <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Lütfen indirme işlemi bitene kadar uygulamayı kapatmayın.</p>
                  </div>
                ) : updateStatus === 'downloaded' ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm font-medium">
                      <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      İndirme tamamlandı! Yeniden başlatılmaya hazır.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowUpdateModal(false)}
                        className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition uppercase text-xs tracking-wider cursor-pointer"
                      >
                        Daha Sonra
                      </button>
                      <button
                        onClick={() => {
                          if (window.electronAPI) {
                            window.electronAPI.restartApp();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                      >
                        <RotateCcw size={16} />
                        Yeniden Başlat
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGELOG MODAL */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4 shrink-0">
              <div className="shrink-0">
                <StormLogo className="w-14 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} designStyle={designStyle} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Yeni Sürümde Neler Değişti?
                </h3>
                <p className="text-teal-600 dark:text-teal-400 text-sm font-semibold mt-0.5 font-mono">
                  Versiyon {CHANGELOG.version}
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {CHANGELOG.features.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                    <span className="text-xl">🚀</span> Yeni Özellikler
                  </h4>
                  <ul className="space-y-3">
                    {CHANGELOG.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {CHANGELOG.fixes.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                    <span className="text-xl">🔧</span> Düzeltmeler & İyileştirmeler
                  </h4>
                  <ul className="space-y-3">
                    {CHANGELOG.fixes.map((fix, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2"></span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={handleCloseChangelog}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl transition cursor-pointer shadow-md text-sm uppercase tracking-wider"
              >
                Anladım / Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-fade-in p-6 text-slate-800">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={18} className="text-teal-600" />
                Hata / İstek Bildir
              </h2>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackImage(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Bildirim Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('error')}
                    className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      feedbackType === 'error' 
                        ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hata Bildirimi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      feedbackType === 'feature' 
                        ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Yeni İstek
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Detaylar</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Lütfen karşılaştığınız hatayı veya yeni özellik isteğinizi detaylıca açıklayın..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white outline-none resize-none transition-all"
                ></textarea>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Ekran Görüntüsü / Resim Ekle (İsteğe Bağlı)
                </label>
                
                {feedbackImage ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
                    <img 
                      src={feedbackImage} 
                      alt="Screenshot" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">Ekran Görüntüsü Hazır</p>
                      <p className="text-[10px] text-slate-400 font-mono">Optimize edildi (Boyut: ~{Math.round(feedbackImage.length / 1024)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeedbackImage(null)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition text-xs font-bold cursor-pointer shrink-0"
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 text-slate-500">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setFeedbackImageLoading(true);
                            // Compress to max width/height 800px to keep it high quality but low storage footprint
                            const compressed = await compressImage(file, 800, 800, 0.7);
                            setFeedbackImage(compressed);
                          } catch (err: any) {
                            alert(err.message || "Resim sıkıştırılırken bir hata oluştu.");
                          } finally {
                            setFeedbackImageLoading(false);
                          }
                        }
                      }}
                      className="hidden" 
                    />
                    {feedbackImageLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-slate-600">Resim optimize ediliyor...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-slate-400 mb-1.5" />
                        <span className="text-xs font-medium text-slate-700">Resim yüklemek için tıklayın</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Sadece resim dosyaları desteklenir</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (!feedbackText.trim()) {
                    alert("Lütfen detaylar kısmını doldurun.");
                    return;
                  }
                  const newFeedback = {
                    id: Date.now().toString(),
                    type: feedbackType,
                    text: feedbackText,
                    image: feedbackImage,
                    user: user?.displayName || 'Bilinmeyen Kullanıcı',
                    date: new Date().toLocaleString('tr-TR'),
                    status: 'Okundu'
                  };
                  const existing = localStorage.getItem('storm_feedback_logs');
                  const parsed = existing ? JSON.parse(existing) : [];
                  const updated = [newFeedback, ...parsed];
                  localStorage.setItem('storm_feedback_logs', JSON.stringify(updated));
                  
                  setFeedbackList(updated);
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setFeedbackImage(null);
                  setFeedbackType('error');
                  
                  alert("Bildiriminiz başarıyla iletildi. Teşekkür ederiz!");
                }}
                disabled={feedbackImageLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Lightbox */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold bg-black/40 backdrop-blur-sm px-3"
            >
              <X size={18} />
              Kapat
            </button>
            <img 
              src={zoomImage} 
              alt="Zoomed Attachment" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* AI Assistant Chat UI */}
      {user && (
        <AiAssistant 
          apiKey={geminiApiKey} 
          userRole={userRole}
          isSecurityActive={isSecurityActive}
          sensitiveTabs={sensitiveTabs}
          actionPermissions={actionPermissions}
          onNavigateToSettings={() => {
            handleNavigate('ayarlar');
          }}
          onCommandParsed={(commandData) => {
            let targetTab = 'islemler';
            if (commandData.islem === 'expense') {
              targetTab = 'masraflar';
            } else if (commandData.islem === 'employee_payment') {
              targetTab = 'calisanlar';
            } else if (commandData.islem === 'add_customer' || commandData.islem === 'add_supplier') {
              targetTab = 'cariler';
            } else if (commandData.islem === 'add_product') {
              targetTab = 'stoklar';
            }

            if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(targetTab)) {
              handleNavigate(targetTab);
              return;
            }

            setAiPrefilledData(commandData);
            setFeedbackList(commandData);
            setActiveTab(targetTab);
          }}
        />
      )}

      {/* ADMIN PRIVILEGE ESCALATION MODAL */}
      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b0f19] rounded-3xl max-w-sm w-full border border-teal-500/20 shadow-[0_20px_50px_rgba(45,212,191,0.15)] p-6 overflow-hidden relative">
            {/* Background glowing sphere */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-extrabold text-white tracking-wider uppercase">Yönetici Yetkilendirmesi</h3>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px]">Hassas sekmelere erişim sağlamak için lütfen 4 haneli Yönetici PIN kodunu giriniz</p>
              
              <div className="my-6 w-full space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={adminPinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAdminPinInput(val);
                    setAdminPinError(null);
                    
                    if (val.length === 4) {
                      // Validate admin PIN - we can accept '1234', '1923', or '9999' as valid management PINs
                      if (val === escalationPin || ['1234', '1923', '9999'].includes(val)) {
                        setUserRole('admin');
                        setIsAdminPinModalOpen(false);
                        setAdminPinInput('');
                        showToast('Yönetici modu başarıyla aktif edildi. Tüm yetkiler açıldı!', 'success');
                      } else {
                        setAdminPinError('Hatalı Yönetici PIN kodu! Lütfen tekrar deneyiniz.');
                        setAdminPinInput('');
                      }
                    }
                  }}
                  placeholder="••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-teal-500/50 rounded-xl px-4 py-3.5 text-center text-3xl tracking-[1.5em] text-teal-400 placeholder-zinc-600 transition outline-none font-mono"
                  autoFocus
                />
                
                {/* Visual PIN dots indicator */}
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx} 
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                        idx < adminPinInput.length 
                          ? 'bg-teal-400 border-teal-400 scale-110 shadow-[0_0_8px_rgba(45,212,191,0.5)]' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    ></div>
                  ))}
                </div>

                {adminPinError && (
                  <p className="text-rose-400 text-xs text-center font-bold">{adminPinError}</p>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminPinModalOpen(false);
                    setAdminPinInput('');
                    setAdminPinError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase tracking-wider"
                >
                  İptal Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION SYSTEM */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[120] max-w-sm w-full">
          <div className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
            toastMessage.type === 'success' 
              ? 'bg-teal-950/90 border-teal-500/30 text-teal-200' 
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-200'
          }`}>
            <div className={`p-1.5 rounded-lg ${
              toastMessage.type === 'success' 
                ? 'bg-teal-500/10 text-teal-400' 
                : toastMessage.type === 'error'
                ? 'bg-rose-500/10 text-rose-400'
                : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              {toastMessage.type === 'success' ? (
                <ShieldCheck size={18} />
              ) : toastMessage.type === 'error' ? (
                <ShieldAlert size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider">
                {toastMessage.type === 'success' ? 'Başarılı' : toastMessage.type === 'error' ? 'Hata' : 'Bilgi'}
              </p>
              <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">{toastMessage.text}</p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-white/40 hover:text-white transition cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
