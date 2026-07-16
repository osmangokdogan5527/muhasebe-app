import React from 'react';
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, Save, Check, ShieldAlert } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';
import { TAB_DEFS } from '../../constants';

export interface PermissionsSettingsProps {
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  isSecurityActive: boolean;
  initialPinInput: string;
  setInitialPinInput: (val: string) => void;
  setupError: string | null;
  handleActivateSecurity: () => void;
  currentAdminPinInput: string;
  setCurrentAdminPinInput: (val: string) => void;
  newAdminPinInput: string;
  setNewAdminPinInput: (val: string) => void;
  confirmAdminPinInput: string;
  setConfirmAdminPinInput: (val: string) => void;
  setAdminPinChangeError: (val: string | null) => void;
  setAdminPinChangeSuccess: (val: string | null) => void;
  setSensitiveTabs: (val: string[]) => void;
  handleAdminPinChangeSubmit: () => void;
  adminPinChangeSuccess: string | null;
  adminPinChangeError: string | null;
  tempSensitiveTabs: string[];
  setTempSensitiveTabs: (val: string[] | ((prev: string[]) => string[])) => void;
  tempActionPermissions: Record<string, boolean>;
  setTempActionPermissions: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  handleSaveActionPermissionsSubmit: () => void;
  confirmDeactivate: boolean;
  setConfirmDeactivate: (val: boolean) => void;
  handleDeactivateSecurity: () => void;
}

export const PermissionsSettings: React.FC<PermissionsSettingsProps> = ({
  showToast,
  isSecurityActive,
  initialPinInput,
  setInitialPinInput,
  setupError,
  handleActivateSecurity,
  currentAdminPinInput,
  setCurrentAdminPinInput,
  newAdminPinInput,
  setNewAdminPinInput,
  confirmAdminPinInput,
  setConfirmAdminPinInput,
  setAdminPinChangeError,
  setAdminPinChangeSuccess,
  setSensitiveTabs,
  handleAdminPinChangeSubmit,
  adminPinChangeSuccess,
  adminPinChangeError,
  tempSensitiveTabs,
  setTempSensitiveTabs,
  tempActionPermissions,
  setTempActionPermissions,
  handleSaveActionPermissionsSubmit,
  confirmDeactivate,
  setConfirmDeactivate,
  handleDeactivateSecurity
}) => {
  return (
    <>
      {!isSecurityActive ? (
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-sm max-w-2xl mx-auto text-center animate-fade-in my-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">Yönetici & Personel Yetki Sistemi</h3>
              <p className="text-sm text-white/50 mt-2 max-w-lg mx-auto leading-relaxed">
                Sistemi aktifleştirerek personelinizin hassas finansal verilere, kasalara ve raporlara erişmesini kısıtlayabilir; silme ve stok düşürme gibi kritik eylemleri şifreli izne bağlayabilirsiniz.
              </p>

              <div className="my-8 max-w-md mx-auto space-y-4 text-left border border-white/5 bg-white/5 p-5 rounded-2xl">
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Personelin görebileceği sekmeleri ve modülleri sınırlandırın.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Satış silme, ödeme silme ve stok kartı silme işlemlerini izne bağlayın.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Sistem yetkilerini yükseltmek için 4 haneli Yönetici PIN belirleyin.</p>
                </div>
              </div>

              <div className="max-w-xs mx-auto space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider block text-center">İlk Yönetici PIN Şifresini Belirleyin</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={initialPinInput}
                    onChange={(e) => setInitialPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] text-white transition outline-none font-mono"
                  />
                </div>

                {setupError && (
                  <p className="text-xs font-bold text-rose-500">{setupError}</p>
                )}

                <button
                  onClick={handleActivateSecurity}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <Lock size={14} />
                  <span>Sistemi Aktifleştir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Card 1: Yönetici PIN Değiştirme */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yönetici Giriş PIN Değiştirme</h3>
                      <p className="text-xs text-white/50 mt-0.5">Yönetici yetkilerine yükselmek için kullanılan 4 haneli PIN şifresini güncelleyin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Mevcut Yönetici PIN Kodu</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={currentAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCurrentAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-white transition outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Yeni Yönetici PIN Kodu (4 Hane)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-white transition outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Yeni Yönetici PIN Kodu Tekrar</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setConfirmAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-white transition outline-none font-mono"
                      />
                    </div>
                  </div>

                  {adminPinChangeSuccess && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-bold">
                      {adminPinChangeSuccess}
                    </div>
                  )}
                  {adminPinChangeError && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                      {adminPinChangeError}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAdminPinChangeSubmit}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>PIN Güncelle</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Personel Yetkilendirme */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personel Yetki Sınırlandırmaları</h3>
                      <p className="text-xs text-white/50 mt-0.5">Çalışan/personel rolündeki kullanıcıların hangi modüllere erişebileceğini belirleyin</p>
                    </div>
                  </div>

                  <div className="my-6 space-y-2">
                    <p className="text-xs text-white/50 bg-white/5 p-3 rounded-xl leading-relaxed border border-white/5">
                      💡 <strong>Not:</strong> Kilidi aktif olan modüllere çalışanlar doğrudan erişemez. Bu sekmelere tıklamak istediklerinde, geçici yükseltme için Yönetici PIN kodu istenir.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {Object.keys(TAB_DEFS).map((tabId) => {
                        const def = TAB_DEFS[tabId];
                        if (!def) return null;

                        const isLocked = tempSensitiveTabs.includes(tabId);
                        const isMandatory = tabId === 'ayarlar'; // Ayarlar must always be restricted

                        return (
                          <div
                            key={tabId}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isLocked
                                ? 'bg-rose-50/40 border-rose-200/60 font-semibold'
                                : 'bg-emerald-50/10 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={isLocked ? 'text-rose-500' : 'text-emerald-500 scale-90 shrink-0'}>
                                {def.icon}
                              </div>
                              <span className="text-xs font-bold text-white/80 truncate uppercase tracking-wide">
                                {def.label}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isMandatory}
                              onClick={() => {
                                if (isLocked) {
                                  setTempSensitiveTabs(tempSensitiveTabs.filter((t) => t !== tabId));
                                } else {
                                  setTempSensitiveTabs([...tempSensitiveTabs, tabId]);
                                }
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-extrabold tracking-wider transition ${
                                isMandatory
                                  ? 'bg-rose-100 text-rose-600 border border-rose-200 cursor-not-allowed font-black'
                                  : isLocked
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs active:scale-95'
                                  : 'bg-white/10 text-white/50 hover:bg-slate-200 cursor-pointer hover:text-white/80 active:scale-95'
                              }`}
                            >
                              {isMandatory ? (
                                <>
                                  <Lock size={10} />
                                  <span>Zorunlu</span>
                                </>
                              ) : isLocked ? (
                                <>
                                  <Lock size={10} />
                                  <span>Kilitli</span>
                                </>
                              ) : (
                                <>
                                  <Unlock size={10} />
                                  <span>Açık</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to standard defaults
                      setTempSensitiveTabs(['dashboard', 'kasa', 'ceksenet', 'masraflar', 'calisanlar', 'krediler', 'raporlar', 'ayarlar']);
                    }}
                    className="text-xs font-bold text-white/50 hover:text-white/90 transition uppercase tracking-wider cursor-pointer"
                  >
                    Varsayılana Dön
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        // Force ayarlar to be in the restricted tabs just in case
                        let finalRestricted = [...tempSensitiveTabs];
                        if (!finalRestricted.includes('ayarlar')) {
                          finalRestricted.push('ayarlar');
                        }
                        localStorage.setItem('storm_muhasebe_sensitive_tabs', JSON.stringify(finalRestricted));
                        setSensitiveTabs(finalRestricted);
                        showToast('Personel yetki sınırlandırmaları başarıyla güncellendi.', 'success');
                      } catch (err: any) {
                        reportErrorToTelegram(err, 'SaveSensitiveTabs');
                        showToast('Yetkiler kaydedilirken hata oluştu!', 'error');
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>Yetkileri Kaydet</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Personel Detaylı Eylem Yetkileri */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personel Hassas Eylem Yetkileri</h3>
                      <p className="text-xs text-white/50 mt-0.5">Çalışan rolündeki kullanıcıların gerçekleştirebileceği kritik eylemleri yetkilendirin</p>
                    </div>
                  </div>

                  <div className="my-6 space-y-4">
                    <p className="text-xs text-white/50 bg-white/5 p-3 rounded-xl leading-relaxed border border-white/5">
                      💡 <strong>Bilgi:</strong> Aşağıdaki seçenekler <strong>işaretli olduğunda</strong> çalışanlar bu eylemi gerçekleştirebilir. İşaret <strong>kaldırıldığında</strong>, eylem sırasında Yönetici PIN şifresi doğrulaması istenir.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Yetki 1: Satış Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_sale}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_sale: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Satış Silme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların satış ve satış iade faturası/işlemlerini silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 5: Satış Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_sale}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_sale: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Satış Düzenleme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların satış ve satış iade faturası/işlemlerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 2: Ödeme/Tahsilat Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_payment}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_payment: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Ödeme ve Tahsilat Silme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların tahsilat, ödeme, alış ve alış iade işlemlerini silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 6: Ödeme/Tahsilat Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_payment}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_payment: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Ödeme ve Tahsilat Düzenleme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların tahsilat, ödeme, alış ve alış iade işlemlerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 3: Stok Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Stok Kartı Silme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların mevcut ürün veya hizmet stok kartlarını silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 7: Stok Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Stok Kartı Düzenleme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların mevcut ürün veya hizmet stok kartı bilgilerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 4: Stok Düşürme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5/50 hover:bg-white/5 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.decrease_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            decrease_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-white/20 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">Stok Azaltma/Düşürme İzni</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block leading-normal">Çalışanların stok kartlarındaki mevcut miktarları manuel olarak azaltmasına izin ver.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setTempActionPermissions({
                        delete_sale: false,
                        delete_payment: false,
                        delete_stock: false,
                        decrease_stock: false,
                        edit_sale: false,
                        edit_payment: false,
                        edit_stock: false,
                      });
                    }}
                    className="text-xs font-bold text-white/50 hover:text-white/90 transition uppercase tracking-wider cursor-pointer"
                  >
                    Tümünü Kısıtla
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveActionPermissionsSubmit}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>Eylem Yetkilerini Kaydet</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Güvenlik Sistemini Devre Dışı Bırak */}
              <div className="bg-white/5 p-6 rounded-2xl border border-rose-500/20 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider">Güvenlik ve Yetki Sistemini Kapat</h3>
                      <p className="text-xs text-white/50 mt-0.5">Yönetici şifresi ve tüm personel yetki kısıtlamalarını tamamen devre dışı bırakın</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
                    Sistemi kapattığınızda, çalışanlarınız ve personeliniz şifresiz olarak her modüle erişebilir ve tüm kritik işlemleri (silme, stok düşürme vb.) gerçekleştirebilir.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeactivateSecurity}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98 ${
                      confirmDeactivate ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    <Lock size={14} />
                    <span>{confirmDeactivate ? 'Devre Dışı Bırakmayı Onayla!' : 'Güvenlik Sistemini Devre Dışı Bırak'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

    </>
  );
};
