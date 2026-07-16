import React from 'react';
import { User, ShieldCheck, Download, Upload, FolderOpen, RotateCcw } from 'lucide-react';

export interface ProfileSettingsProps {
  profileName: string;
  setProfileName: (name: string) => void;
  profilePhoto: string;
  setProfilePhoto: (photo: string) => void;
  profilePassword: string;
  setProfilePassword: (password: string) => void;
  settingsPasswordSuccess: string | null;
  settingsPasswordError: string | null;
  handleProfileUpdate: () => void;
  handleManualBackup: () => void;
  handleRestoreBackup: () => void;
  isBackupLoading: boolean;
  toggleAutoBackup: () => void;
  autoBackupEnabled: boolean;
  handleOpenBackupFolder: () => void;
  backupMessage: { text: string; type: 'success' | 'error' } | null;
  setResetModalOpen: (open: boolean) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profileName,
  setProfileName,
  profilePhoto,
  setProfilePhoto,
  profilePassword,
  setProfilePassword,
  settingsPasswordSuccess,
  settingsPasswordError,
  handleProfileUpdate,
  handleManualBackup,
  handleRestoreBackup,
  isBackupLoading,
  toggleAutoBackup,
  autoBackupEnabled,
  handleOpenBackupFolder,
  backupMessage,
  setResetModalOpen
}) => {
  return (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Card 5: Kullanıcı Profil Ayarları */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profil Ayarları</h3>
                    <p className="text-xs text-white/50 mt-0.5">Uygulama üzerindeki profil isminizi, resminizi ve şifrenizi (6 haneli PIN) değiştirin</p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Firma / Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Adınızı girin..."
                      className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-white transition outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Profil Resmi (URL)</label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="https://... (Resim bağlantısı)"
                      className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-white transition outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Yeni PIN Şifresi (6 Hane)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Değiştirmek istemiyorsanız boş bırakın"
                      className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-white transition outline-none font-semibold"
                    />
                  </div>
                </div>
                
                {settingsPasswordSuccess && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg text-xs font-bold">
                    {settingsPasswordSuccess}
                  </div>
                )}
                {settingsPasswordError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold">
                    {settingsPasswordError}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <span>Bilgileri Güncelle</span>
                </button>
              </div>
            </div>
            
            {/* Card: Veri Güvenliği ve Yedekleme Yönetimi */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Veri Güvenliği ve Yedekleme Yönetimi</h3>
                  <p className="text-xs text-white/50 mt-0.5">Veritabanı dosyalarınızı yedekleyin veya eski yedekten verilerinizi geri yükleyin</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleManualBackup}
                  disabled={isBackupLoading}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition group cursor-pointer disabled:opacity-50"
                >
                  <Download className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Yedek Dosyası Oluştur (Manuel)</span>
                  <span className="text-[10px] text-white/50 text-center">Aktif veritabanınızı güvenli bir konuma .db/.json dosyası olarak indirin</span>
                </button>
                
                <button
                  onClick={handleRestoreBackup}
                  disabled={isBackupLoading}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition group cursor-pointer disabled:opacity-50"
                >
                  <Upload className="text-rose-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Yedekten Veri Yükle (Manuel)</span>
                  <span className="text-[10px] text-rose-600 font-bold text-center">Dikkat: Mevcut verileriniz silinecektir! Eski veritabanını yükler</span>
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex items-center cursor-pointer" onClick={toggleAutoBackup}>
                    <input type="checkbox" className="sr-only peer" checked={autoBackupEnabled} readOnly />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white/90">Otomatik Yedekleme</span>
                    <p className="text-[10px] text-white/50">Sistem kapanırken (son 5 yedek tutulur)</p>
                  </div>
                </div>
                
                <button
                  onClick={handleOpenBackupFolder}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-slate-200 text-white/80 rounded-lg text-xs font-bold transition"
                >
                  <FolderOpen size={16} />
                  Otomatik Yedek Klasörünü Aç
                </button>
              </div>
              
              {backupMessage && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-bold whitespace-pre-wrap ${
                  backupMessage.type === 'success' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {backupMessage.text}
                </div>
              )}
            </div>

            {/* Card 2: Verileri Sıfırlama */}
            <div className="bg-white/5 p-6 rounded-2xl border border-rose-500/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider">Sistem Verilerini Sıfırla</h3>
                    <p className="text-xs text-white/50 mt-0.5">Tüm kayıtlı cari hesapları, stokları ve hareketleri temizleyin</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
                  Bu işlem STORM MUHASEBE üzerindeki tüm cari hesapları, stok durumlarını, finansal hareketleri ve çek/senet verilerini tamamen temizler. 
                  <strong className="block text-rose-600 mt-1 uppercase font-bold">Bu işlem geri alınamaz!</strong>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button
                  id="reset-database-btn-settings"
                  onClick={() => setResetModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <RotateCcw size={14} />
                  <span>Veritabanını Sıfırla</span>
                </button>
              </div>
            </div>
          </div>

  );
};
