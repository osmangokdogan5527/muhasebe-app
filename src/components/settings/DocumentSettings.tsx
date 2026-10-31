/**
 * Ayarlar > Belge Görünümü: PDF belgelerinde (fatura, makbuz, ekstre, fiş, rapor) kullanılan
 * logo, firma bilgileri, renk, alt not ve seçenekler. Firmaya ortak kaydedilir.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Trash2, Save, Check, Loader2, AlertTriangle, Eye, Palette, Building2, SlidersHorizontal, Receipt } from 'lucide-react';
import { saveDocumentBranding } from '../../firebase';
import { logError } from '../../utils/errorLogger';
import { DEFAULT_ACCENT_COLOR, DocumentBranding, normalizeBranding } from '../../pdf/branding';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { prepareLogo } from '../../pdf/logo';
import { createInvoicePdf } from '../../pdf/invoicePdf';
import { createReceiptPdf } from '../../pdf/receiptPdf';
import { createPosReceiptPdf } from '../../pdf/posReceiptPdf';
import { Cari, Transaction } from '../../types';
import { PdfPreviewModal } from '../pdf/PdfPreviewModal';
import { PdfOptionTabs } from '../pdf/PdfOptionTabs';
import { getTodayISO } from '../../utils/dateUtils';

const ACCENT_PRESETS = ['#0f4c81', '#1e3a8a', '#0e7490', '#047857', '#7c2d12', '#9f1239', '#6d28d9', '#334155', '#111827'];

const SAMPLE_CARI: Cari = {
  id: 'ornek', name: 'Örnek Müşteri Ltd. Şti.', code: 'CAR-0001', type: 'customer', phone: '0555 123 45 67', email: 'muhasebe@ornek.com',
  address: 'Atatürk Mah. Cumhuriyet Cad. No: 10 Çankaya / Ankara', balance: 0, openingBalance: 0, createdAt: '', taxOffice: 'Çankaya', taxNo: '1234567890',
};
const sampleItems = [
  { stockId: '', stockName: 'Ürün A', quantity: 2, unit: 'Adet', price: 250, taxRate: 20, total: 600 },
  { stockId: '', stockName: 'Ürün B (uzun ürün açıklaması örneği)', quantity: 1, unit: 'Adet', price: 1000, taxRate: 10, total: 1100 },
];
const SAMPLE_INVOICE: Transaction = {
  id: 'ornek-fatura', invoiceNo: 'FTR-ORNEK-0001', type: 'sale', cariId: 'ornek', cariName: SAMPLE_CARI.name, date: getTodayISO(),
  amount: 1700, account: '', description: 'Örnek açıklama: ödeme 30 gün vadelidir.', items: sampleItems, createdAt: '', currency: 'TRY',
};
const SAMPLE_COLLECTION: Transaction = {
  id: 'ornek-tahsilat', type: 'collection', cariId: 'ornek', cariName: SAMPLE_CARI.name, date: getTodayISO(),
  amount: 1000, account: 'cash', description: 'Örnek tahsilat', createdAt: '', currency: 'TRY',
};
const SAMPLE_BALANCE = { before: 2500, effect: 1700, after: 4200, current: 3200 };

type SampleKind = 'invoice' | 'receipt' | 'pos';

const inputClass = 'w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-hidden focus:border-teal-500';
const labelClass = 'block text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1.5';

const Card: React.FC<{ icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }> = ({ icon, title, description, children }) => (
  <div className="bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        {description && <p className="text-xs text-white/50 mt-0.5 leading-tight">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Switch: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, hint, checked, onChange }) => (
  <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-4 text-left cursor-pointer py-1">
    <span>
      <span className="block text-sm font-semibold text-white">{label}</span>
      {hint && <span className="block text-[11px] text-white/50 leading-snug">{hint}</span>}
    </span>
    <span className={`relative w-11 h-6 rounded-full transition shrink-0 ${checked ? 'bg-teal-500' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  </button>
);

export const DocumentSettings: React.FC = () => {
  const { branding: saved, isLoaded } = useDocumentBranding();
  const [form, setForm] = useState<DocumentBranding>(saved);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoError, setLogoError] = useState('');
  const [sample, setSample] = useState<SampleKind | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Kaydedilmiş ayar gelince (kullanıcı düzenlemiyorsa) forma yansıt
  useEffect(() => {
    if (!dirty) setForm(saved);
  }, [saved, dirty]);

  const update = <K extends keyof DocumentBranding>(key: K, value: DocumentBranding[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMessage(null);
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoError('');
    try {
      update('logoDataUrl', await prepareLogo(file));
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'DocumentSettings.handleLogo');
      setLogoError(err?.message || 'Logo yüklenemedi.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveDocumentBranding({ ...normalizeBranding(form) });
      setDirty(false);
      setMessage({ type: 'success', text: 'Belge görünümü kaydedildi. Tüm cihazlarda yeni belgeler bu ayarla üretilir.' });
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'DocumentSettings.handleSave');
      setMessage({ type: 'error', text: 'Kaydedilemedi: ' + (err?.message || 'bilinmeyen hata') });
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => normalizeBranding(form), [form]);
  const generateSample = useCallback(() => {
    if (sample === 'receipt') return createReceiptPdf(SAMPLE_COLLECTION, SAMPLE_CARI, preview, { balance: { before: 4200, effect: -1000, after: 3200, current: 3200 }, accountName: 'Merkez Kasa' });
    if (sample === 'pos') {
      return createPosReceiptPdf({
        receiptNo: 'POS-ORNEK-0001', date: SAMPLE_INVOICE.date, time: '14:30', cariName: 'Perakende Müşteri', isRetail: true,
        lines: [{ name: 'Ürün A', quantity: 2, unit: 'Adet', unitPrice: 300, discountAmount: 0, discountRate: 0, lineTotal: 600 }, { name: 'Ürün B', quantity: 1, unit: 'Adet', unitPrice: 1100, discountAmount: 100, discountRate: 0, lineTotal: 1000 }],
        totalTax: 191.0, grandTotal: 1600, payments: [{ label: 'Nakit', amount: 1600 }], cashReceived: 2000, change: 400, currency: 'TRY',
      }, preview);
    }
    return createInvoicePdf(SAMPLE_INVOICE, SAMPLE_CARI, preview, { balance: SAMPLE_BALANCE });
  }, [sample, preview]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Belge Görünümü</h2>
          <p className="text-xs text-white/50 mt-1 max-w-2xl">Fatura, makbuz, cari ekstre, fiş ve raporların PDF'lerinde kullanılır. Ayarlar firmanıza ortaktır: bilgisayarda ve telefonda aynı belge üretilir.</p>
        </div>
        <button type="button" onClick={() => setSample('invoice')} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white text-xs font-bold hover:bg-white/10 transition cursor-pointer shrink-0">
          <Eye size={15} /> Örnek PDF Gör
        </button>
      </div>

      {!isLoaded && <div className="flex items-center gap-2 text-xs text-white/60"><Loader2 size={14} className="animate-spin" /> Ayarlar yükleniyor...</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card icon={<Building2 size={18} />} title="Firma Bilgileri" description="Belgelerin üst kısmında görünür.">
          <div className="flex items-center gap-4">
            <div className="w-36 h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: '#ffffff' }}>
              {form.logoDataUrl
                ? <img src={form.logoDataUrl} alt="Firma logosu" className="max-w-full max-h-full object-contain" />
                : <span className="text-[11px] font-bold px-2 text-center" style={{ color: form.accentColor }}>{form.firmName || 'Logo yok'}</span>}
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer">
                <Upload size={14} /> Logo Yükle
              </button>
              {form.logoDataUrl && (
                <button type="button" onClick={() => update('logoDataUrl', '')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-300 hover:bg-white/5 text-xs font-semibold cursor-pointer">
                  <Trash2 size={13} /> Logoyu Kaldır
                </button>
              )}
              <p className="text-[10px] text-white/45">PNG (saydam) önerilir. Logo yoksa firma adı yazılır.</p>
            </div>
          </div>
          {logoError && <p className="text-xs text-rose-300 flex items-center gap-1.5"><AlertTriangle size={13} /> {logoError}</p>}

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2 block"><span className={labelClass}>Firma Adı / Unvan</span><input className={inputClass} value={form.firmName} onChange={(e) => update('firmName', e.target.value)} placeholder="Örn: Yılmaz Ticaret A.Ş." /></label>
            <label className="sm:col-span-2 block"><span className={labelClass}>Adres</span><textarea className={inputClass} rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} /></label>
            <label className="block"><span className={labelClass}>Telefon</span><input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
            <label className="block"><span className={labelClass}>E-posta</span><input className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
            <label className="block"><span className={labelClass}>Vergi Dairesi</span><input className={inputClass} value={form.taxOffice} onChange={(e) => update('taxOffice', e.target.value)} /></label>
            <label className="block"><span className={labelClass}>VKN / TCKN</span><input className={inputClass} inputMode="numeric" value={form.taxNumber} onChange={(e) => update('taxNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 11))} /></label>
            <label className="sm:col-span-2 block"><span className={labelClass}>Web Sitesi</span><input className={inputClass} value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="www.firmaniz.com" /></label>
          </div>
        </Card>

        <div className="space-y-6">
          <Card icon={<Palette size={18} />} title="Renk ve Alt Not">
            <div>
              <span className={labelClass}>Vurgu Rengi</span>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Renk ${color}`}
                    onClick={() => update('accentColor', color)}
                    className="w-8 h-8 rounded-full border-2 transition cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: color, borderColor: form.accentColor === color ? '#ffffff' : 'transparent' }}
                  >
                    {form.accentColor === color && <Check size={14} color="#ffffff" />}
                  </button>
                ))}
                <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer ml-1">
                  <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" aria-label="Özel renk" />
                  Özel
                </label>
                {form.accentColor !== DEFAULT_ACCENT_COLOR && (
                  <button type="button" onClick={() => update('accentColor', DEFAULT_ACCENT_COLOR)} className="text-[11px] text-white/50 underline cursor-pointer">Varsayılan</button>
                )}
              </div>
              {/* Basit önizleme: belge başlığının görünümü */}
              <div className="mt-4 rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: '#ffffff' }}>
                <div className="h-1.5" style={{ backgroundColor: form.accentColor }} />
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" className="h-7 object-contain mb-1" /> : null}
                    <div className="text-xs font-bold truncate" style={{ color: form.logoDataUrl ? '#111827' : form.accentColor }}>{form.firmName || 'Firma Adı'}</div>
                    <div className="text-[9px] truncate" style={{ color: '#64748b' }}>{form.address || 'Adres'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black" style={{ color: form.accentColor }}>SATIŞ FATURASI</div>
                    <div className="text-[9px]" style={{ color: '#64748b' }}>FTR-0001 · {new Date().toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
                <div className="mx-3 mb-3 rounded-md h-4" style={{ backgroundColor: form.accentColor }} />
              </div>
            </div>
            <label className="block">
              <span className={labelClass}>Belgelerin Alt Notu</span>
              <textarea className={inputClass} rows={2} maxLength={400} value={form.footerNote} onChange={(e) => update('footerNote', e.target.value)} placeholder="Örn: IBAN: TR00 0000 ... · Bizi tercih ettiğiniz için teşekkür ederiz." />
            </label>
          </Card>

          <Card icon={<SlidersHorizontal size={18} />} title="Belgede Neler Olsun">
            <Switch label="Cari hesap durumu" hint="Fatura ve makbuzda önceki / sonraki / güncel bakiye kutusu" checked={form.showBalance} onChange={(v) => update('showBalance', v)} />
            <Switch label="Yazıyla tutar" hint='"Yalnız: Bin iki yüz Türk lirası..." satırı' checked={form.showAmountInWords} onChange={(v) => update('showAmountInWords', v)} />
            <Switch label="İmza alanı" hint="Teslim Eden / Teslim Alan, Ödemeyi Yapan / Tahsil Eden" checked={form.showSignatureArea} onChange={(v) => update('showSignatureArea', v)} />
          </Card>

          <Card icon={<Receipt size={18} />} title="POS Fişi" description="Kasadaki fiş yazıcısının kağıt genişliği (fiş penceresinde ayrıca değiştirilebilir).">
            <PdfOptionTabs<'80' | '58'>
              value={String(form.receiptWidth) as '80' | '58'}
              options={[{ value: '80', label: '80 mm' }, { value: '58', label: '58 mm' }]}
              onChange={(v) => update('receiptWidth', v === '58' ? 58 : 80)}
            />
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-end gap-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-4">
        {message && (
          <p className={`flex-1 text-xs font-semibold flex items-center gap-1.5 ${message.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />} {message.text}
          </p>
        )}
        {!message && dirty && <p className="flex-1 text-xs text-amber-300">Kaydedilmemiş değişiklikler var.</p>}
        <button type="button" onClick={handleSave} disabled={!dirty || saving} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Kaydet
        </button>
      </div>

      {sample && (
        <PdfPreviewModal
          isOpen
          title="Örnek Belge"
          subtitle="Kaydedilmemiş değişiklikler dahil önizleme"
          generate={generateSample}
          toolbar={
            <PdfOptionTabs<SampleKind>
              label="Belge"
              value={sample}
              options={[{ value: 'invoice', label: 'Fatura' }, { value: 'receipt', label: 'Makbuz' }, { value: 'pos', label: 'Fiş' }]}
              onChange={setSample}
            />
          }
          onClose={() => setSample(null)}
        />
      )}
    </div>
  );
};
