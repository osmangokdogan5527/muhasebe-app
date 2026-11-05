/**
 * İlk giriş penceresi: Firma Bilgileri.
 *
 * Firma kurulduktan sonra (ya da bilgileri hiç girilmemiş firmada) sahibe bir kez açılır.
 * Girilen bilgiler Belge Görünümü ayarına yazılır; fiş, fatura, makbuz ve ekstreler bu bilgilerle
 * üretilir. Sonradan Ayarlar > Belge Görünümü'nden değiştirilebilir.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Building2, Upload, Trash2, Loader2, X, AlertTriangle, Receipt } from 'lucide-react';
import { saveDocumentBranding } from '../firebase';
import { DocumentBranding, brandingFromLegacySettings } from '../pdf/branding';
import { prepareLogo } from '../pdf/logo';
import { logError } from '../utils/errorLogger';
import { FirmInfoErrors, FirmInfoForm, applyFirmInfo, formFromBranding, formatIban, formatPhone, validateFirmInfo } from './firmInfo';

interface FirmInfoModalProps {
  isOpen: boolean;
  /** Mevcut belge ayarı (yoksa varsayılan) */
  branding: DocumentBranding | null;
  /** Kayıt yoksa önerilecek firma adı (firma kurulurken yazılan ad) */
  suggestedFirmName: string;
  /** saved: bilgiler kaydedildi mi (false: "Sonra doldururum") */
  onClose: (saved: boolean) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-teal-500 transition';
const labelClass = 'block text-[10px] font-extrabold text-white/70 uppercase tracking-wider mb-1.5';

const Field: React.FC<{ label: string; required?: boolean; error?: string; className?: string; children: React.ReactNode }> = ({ label, required, error, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className={labelClass}>
      {label}
      {required && <span className="text-rose-400"> *</span>}
    </span>
    {children}
    {error && <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-400"><AlertTriangle size={12} /> {error}</span>}
  </label>
);

export const FirmInfoModal: React.FC<FirmInfoModalProps> = ({ isOpen, branding, suggestedFirmName, onClose, showToast }) => {
  // Kayıt yoksa bu cihazdaki eski yazdırma ayarlarından (adres, telefon, logo) başlanır
  const [base] = useState<DocumentBranding>(() => branding || brandingFromLegacySettings(suggestedFirmName || ''));
  const [form, setForm] = useState<FirmInfoForm>(() => {
    const initial = formFromBranding(base);
    return { ...initial, firmName: initial.firmName || suggestedFirmName || '' };
  });
  const [errors, setErrors] = useState<FirmInfoErrors>({});
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FirmInfoForm>(key: K, value: FirmInfoForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const preview = useMemo(() => {
    try {
      return applyFirmInfo(base, { ...form, iban: '' });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FirmInfoModal.preview');
      return base;
    }
  }, [base, form]);

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoError('');
    try {
      update('logoDataUrl', await prepareLogo(file));
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FirmInfoModal.handleLogo');
      setLogoError(err?.message || 'Logo yüklenemedi.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const found = validateFirmInfo(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setSaving(true);
    try {
      await saveDocumentBranding({ ...applyFirmInfo(base, form) });
      showToast('Firma bilgileri kaydedildi. Fiş, fatura ve ekstreler bu bilgilerle çıkacak.', 'success');
      onClose(true);
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FirmInfoModal.handleSave');
      showToast(`Kaydedilemedi: ${err?.message || 'bilinmeyen hata'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const ibanPreview = form.iban.trim() ? formatIban(form.iban) : '';

  return (
    <div className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div id="firm-info-modal" className="bg-[#18181b] border border-white/10 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Firma Bilgileri</h3>
              <p className="text-xs text-white/55 mt-0.5">Fiş, fatura ve ekstrelerin üstünde görünür. Müşterileriniz adresinizi ve telefonunuzu fişten öğrenir.</p>
            </div>
          </div>
          <button type="button" aria-label="Kapat" onClick={() => onClose(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_260px] gap-5">
          <div className="grid sm:grid-cols-2 gap-3 content-start">
            <Field label="Firma adı / unvan" required error={errors.firmName} className="sm:col-span-2">
              <input id="firm-info-name" className={inputClass} value={form.firmName} onChange={(e) => update('firmName', e.target.value)} placeholder="Örn: Yılmaz Ticaret" />
            </Field>
            <Field label="Telefon" required error={errors.phone}>
              <input
                id="firm-info-phone"
                className={inputClass}
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                onBlur={() => update('phone', formatPhone(form.phone))}
                placeholder="0532 123 45 67"
              />
            </Field>
            <Field label="E-posta" error={errors.email}>
              <input id="firm-info-email" className={inputClass} type="email" inputMode="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="info@firmaniz.com" />
            </Field>
            <Field label="Adres" className="sm:col-span-2">
              <textarea id="firm-info-address" className={inputClass} rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Mahalle, cadde, no — İlçe / İl" />
            </Field>
            <Field label="Vergi dairesi">
              <input id="firm-info-tax-office" className={inputClass} value={form.taxOffice} onChange={(e) => update('taxOffice', e.target.value)} />
            </Field>
            <Field label="Vergi no / TC kimlik no" error={errors.taxNumber}>
              <input id="firm-info-tax-number" className={inputClass} inputMode="numeric" value={form.taxNumber} onChange={(e) => update('taxNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 11))} placeholder="10 ya da 11 hane" />
            </Field>
            <Field label="IBAN (fişin altında görünür)" error={errors.iban} className="sm:col-span-2">
              <input
                id="firm-info-iban"
                className={`${inputClass} font-mono`}
                value={form.iban}
                onChange={(e) => update('iban', e.target.value.toUpperCase())}
                onBlur={() => form.iban.trim() && update('iban', formatIban(form.iban))}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </Field>
            <div className="sm:col-span-2">
              <span className={labelClass}>Logo (isteğe bağlı)</span>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 text-xs font-bold cursor-pointer">
                  <Upload size={14} /> {form.logoDataUrl ? 'Logoyu Değiştir' : 'Logo Yükle'}
                </button>
                {form.logoDataUrl && (
                  <button type="button" onClick={() => update('logoDataUrl', '')} className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-rose-300 hover:bg-white/5 text-xs font-semibold cursor-pointer">
                    <Trash2 size={13} /> Kaldır
                  </button>
                )}
              </div>
              {logoError && <p className="mt-1 text-[11px] font-bold text-rose-400">{logoError}</p>}
            </div>
          </div>

          {/* Fiş önizlemesi (kağıt her temada beyaz) */}
          <div>
            <span className={`${labelClass} flex items-center gap-1.5`}><Receipt size={12} /> Fişte böyle görünecek</span>
            <div id="firm-info-preview" className="rounded-xl border border-white/10 p-4 text-center font-mono text-[11px] leading-snug shadow-inner" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
              {preview.logoDataUrl
                ? <img src={preview.logoDataUrl} alt="Firma logosu" className="mx-auto mb-2 max-h-12 max-w-[160px] object-contain" />
                : null}
              <div className="text-[13px] font-bold break-words" style={{ color: '#111827' }}>{preview.firmName || 'Firma Adı'}</div>
              {preview.address && <div className="mt-1 whitespace-pre-line break-words" style={{ color: '#374151' }}>{preview.address}</div>}
              {preview.phone && <div className="mt-1" style={{ color: '#374151' }}>Tel: {preview.phone}</div>}
              {preview.email && <div style={{ color: '#374151' }}>{preview.email}</div>}
              {(preview.taxOffice || preview.taxNumber) && (
                <div className="mt-1" style={{ color: '#374151' }}>
                  {[preview.taxOffice && `${preview.taxOffice} V.D.`, preview.taxNumber].filter(Boolean).join(' · ')}
                </div>
              )}
              <div className="my-2 border-t border-dashed" style={{ borderColor: '#9ca3af' }} />
              <div className="flex justify-between" style={{ color: '#374151' }}><span>Ürün A x2</span><span>600,00</span></div>
              <div className="flex justify-between font-bold" style={{ color: '#111827' }}><span>TOPLAM</span><span>600,00 ₺</span></div>
              {ibanPreview && (
                <>
                  <div className="my-2 border-t border-dashed" style={{ borderColor: '#9ca3af' }} />
                  <div className="break-all" style={{ color: '#374151' }}>IBAN: {ibanPreview}</div>
                </>
              )}
            </div>
            <p className="mt-2 text-[10px] text-white/45">Renk, imza alanı ve fiş genişliği gibi ayrıntılar Ayarlar &gt; Belge Görünümü'nde.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button id="firm-info-later" type="button" onClick={() => onClose(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider cursor-pointer">
            Sonra doldururum
          </button>
          <button
            id="firm-info-save"
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
