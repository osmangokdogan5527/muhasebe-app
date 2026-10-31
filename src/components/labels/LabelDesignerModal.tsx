/**
 * Etiket Tasarla: ölçü (rulo / A4 çoklu / özel), içerik, canlı önizleme, ürün ve kopya seçimi.
 * Tasarım firmaya ortak kaydedilir; "PDF Oluştur" ile etiketler PDF olarak verilir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Plus, Minus, Trash2, Search, Ruler, LayoutGrid, Type, Check, Loader2, AlertTriangle, FileText, Package } from 'lucide-react';
import { Stock } from '../../types';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { useLabelSettings } from '../../pdf/labels/useLabelSettings';
import {
  CUSTOM_PRESET_ID,
  LABEL_PRESETS,
  LabelFontScale,
  LabelLayoutMode,
  LabelPriceMode,
  LabelQrContent,
  LabelSettings,
  applyPreset,
  labelsPerPage,
} from '../../pdf/labels/labelSettings';
import { LabelProduct, productFromStock } from '../../pdf/labels/labelLayout';
import { LabelPrintItem, MAX_LABELS_PER_PDF, createLabelsPdf } from '../../pdf/labels/labelPdf';
import { formatMoney } from '../../pdf/format';
import { LabelPreview } from './LabelPreview';
import { PdfPreviewModal } from '../pdf/PdfPreviewModal';

export interface LabelDesignerModalProps {
  /** Başlangıçta seçili ürünler (stok satırından açıldığında tek ürün) */
  initialStocks: Stock[];
  /** Ürün eklemek için tüm stok listesi */
  allStocks: Stock[];
  onClose: () => void;
}

const SAMPLE_PRODUCT: LabelProduct = { name: 'Örnek Ürün Adı', code: 'STK-0001', unit: 'Adet', price: 149.9, barcode: '8690000000001' };

const PANEL_BG = '#0f1225';
// Kutu içindeki yazı alanları: uygulamanın genel input stili ikinci bir kutu çizmesin
const INNER_INPUT_STYLE: React.CSSProperties = { color: '#ffffff', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' };
const TEXT = '#e2e8f0';
const MUTED = '#94a3b8';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>{icon}{title}</h3>
    {children}
  </section>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer text-left"
    style={checked
      ? { borderColor: 'var(--accent-500, #0ea5e9)', backgroundColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 18%, transparent)', color: '#ffffff' }
      : { borderColor: 'rgba(255,255,255,0.1)', color: MUTED }}
  >
    <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: checked ? 'var(--accent-500, #0ea5e9)' : 'rgba(255,255,255,0.08)' }}>
      {checked && <Check size={12} color="#ffffff" strokeWidth={3} />}
    </span>
    {label}
  </button>
);

const NumberField: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }> = ({ label, value, min, max, step = 0.5, onChange, suffix = 'mm' }) => {
  const [text, setText] = useState(String(value).replace('.', ','));
  useEffect(() => { setText(String(value).replace('.', ',')); }, [value]);
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>{label}</span>
      <div className="flex items-center rounded-xl border border-white/10 px-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9.,]/g, ''))}
          onBlur={() => {
            const n = Number(text.replace(',', '.'));
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
            else setText(String(value).replace('.', ','));
          }}
          className="w-full bg-transparent py-2 text-sm outline-none"
          style={INNER_INPUT_STYLE}
        />
        <span className="text-[11px]" style={{ color: MUTED }}>{suffix}</span>
      </div>
    </label>
  );
};

const selectClass = 'w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm outline-none cursor-pointer';
const selectStyle: React.CSSProperties = { backgroundColor: '#161a33', color: '#ffffff' };

const norm = (v: string) => (v || '').toLocaleLowerCase('tr-TR').trim();

export const LabelDesignerModal: React.FC<LabelDesignerModalProps> = ({ initialStocks, allStocks, onClose }) => {
  const { branding } = useDocumentBranding();
  const { settings, updateSettings, isLoaded, saveState } = useLabelSettings();
  const [items, setItems] = useState<LabelPrintItem[]>(() => initialStocks.map((stock) => ({ stock, copies: 1 })));
  const [query, setQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const firmName = branding.firmName;

  const set = useCallback(<K extends keyof LabelSettings>(key: K, value: LabelSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value, ...(key === 'widthMm' || key === 'heightMm' || key === 'mode' ? { presetId: CUSTOM_PRESET_ID } : {}) }));
  }, [updateSettings]);

  const setSheet = useCallback((key: keyof LabelSettings['sheet'], value: number) => {
    updateSettings((prev) => ({ ...prev, presetId: CUSTOM_PRESET_ID, sheet: { ...prev.sheet, [key]: value } }));
  }, [updateSettings]);

  // Esc ile kapat (PDF penceresi açıkken onunki çalışır)
  useEffect(() => {
    if (isPdfOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPdfOpen, onClose]);

  const perPage = labelsPerPage(settings);
  useEffect(() => { if (startIndex >= perPage) setStartIndex(0); }, [perPage, startIndex]);

  const totalLabels = items.reduce((sum, i) => sum + Math.max(0, i.copies), 0);
  const pageCount = settings.mode === 'sheet' ? Math.ceil((totalLabels + startIndex) / perPage) : totalLabels;
  const previewProduct = useMemo(
    () => (items[0] ? productFromStock(items[0].stock, settings) : SAMPLE_PRODUCT),
    [items, settings],
  );

  const searchResults = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    const selected = new Set(items.map((i) => i.stock.id));
    return allStocks
      .filter((s) => !selected.has(s.id))
      .filter((s) => norm(s.name).includes(q) || norm(s.code).includes(q) || norm(s.barcode || '').includes(q))
      .slice(0, 8);
  }, [query, allStocks, items]);

  const setCopies = (id: string, copies: number) => setItems((prev) => prev.map((i) => (i.stock.id === id ? { ...i, copies: Math.max(0, Math.min(999, Math.floor(copies) || 0)) } : i)));

  const generate = useCallback(() => createLabelsPdf(items, settings, firmName, startIndex), [items, settings, firmName, startIndex]);

  const presetValue = LABEL_PRESETS.some((p) => p.id === settings.presetId) ? settings.presetId : CUSTOM_PRESET_ID;
  const tooMany = totalLabels > MAX_LABELS_PER_PDF;

  const saveLabel = saveState === 'saving' || saveState === 'pending'
    ? <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Tasarım kaydediliyor...</span>
    : saveState === 'saved'
      ? <span className="flex items-center gap-1.5"><Check size={12} /> Tasarım kaydedildi (tüm cihazlarda)</span>
      : saveState === 'error'
        ? <span className="flex items-center gap-1.5" style={{ color: '#fda4af' }}><AlertTriangle size={12} /> Tasarım kaydedilemedi</span>
        : <span>Yaptığınız değişiklikler kendiliğinden kaydedilir.</span>;

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Etiket Tasarla"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-5xl h-[94vh] sm:h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: PANEL_BG, color: TEXT }}>
        {/* Başlık */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(56,189,248,0.14)', color: '#7dd3fc' }}><Tag size={20} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold" style={{ color: '#ffffff' }}>Etiket Tasarla</h2>
            <p className="text-xs truncate" style={{ color: MUTED }}>Ölçüyü ve içeriği seçin, önizlemeyi kontrol edip PDF alın.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition cursor-pointer" aria-label="Kapat" style={{ color: '#cbd5e1' }}><X size={20} /></button>
        </div>

        {/* İçerik */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 p-4 sm:p-5">
            {/* Önizleme ve ürünler (telefonda üstte) */}
            <div className="space-y-4 lg:order-2">
              <div className="rounded-2xl border border-white/10 p-4 sm:p-6 flex flex-col items-center gap-3" style={{ background: 'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%) 50% / 16px 16px' }}>
                <div className="w-full flex justify-center" style={{ maxWidth: Math.min(420, settings.widthMm * 6) }}>
                  {isLoaded ? (
                    <LabelPreview product={previewProduct} settings={settings} firmName={firmName} />
                  ) : (
                    <div className="py-10 flex items-center gap-2 text-sm" style={{ color: MUTED }}><Loader2 size={16} className="animate-spin" /> Tasarım yükleniyor...</div>
                  )}
                </div>
                <p className="text-xs" style={{ color: MUTED }}>
                  {String(settings.widthMm).replace('.', ',')} × {String(settings.heightMm).replace('.', ',')} mm
                  {settings.mode === 'sheet' ? ` · A4 sayfada ${settings.sheet.columns} × ${settings.sheet.rows} = ${perPage} etiket` : ' · Rulo (her etiket ayrı sayfa)'}
                </p>
              </div>

              {settings.mode === 'sheet' && (
                <div className="rounded-2xl border border-white/10 p-4 flex gap-4 items-start" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <svg viewBox="0 0 210 297" className="w-24 shrink-0 rounded" style={{ backgroundColor: '#ffffff' }} aria-label="A4 sayfa düzeni">
                    {Array.from({ length: perPage }, (_, i) => {
                      const col = i % settings.sheet.columns;
                      const row = Math.floor(i / settings.sheet.columns);
                      const x = settings.sheet.marginLeftMm + col * (settings.widthMm + settings.sheet.gapXMm);
                      const y = settings.sheet.marginTopMm + row * (settings.heightMm + settings.sheet.gapYMm);
                      const used = i < startIndex;
                      return (
                        <rect
                          key={i}
                          x={x + 0.8}
                          y={y + 0.8}
                          width={settings.widthMm - 1.6}
                          height={settings.heightMm - 1.6}
                          rx={2}
                          onClick={() => setStartIndex(i)}
                          style={{ cursor: 'pointer' }}
                          fill={used ? '#cbd5e1' : i === startIndex ? 'var(--accent-500, #0ea5e9)' : '#e0f2fe'}
                          stroke="#64748b"
                          strokeWidth={0.6}
                        />
                      );
                    })}
                  </svg>
                  <div className="text-xs space-y-2" style={{ color: MUTED }}>
                    <p className="font-semibold" style={{ color: TEXT }}>Başlangıç konumu: {startIndex + 1}. etiket</p>
                    <p>Yarısı kullanılmış bir sayfaya basacaksanız, sayfa çiziminde ilk boş etikete dokunun. Gri olanlar boş bırakılır.</p>
                    {startIndex > 0 && <button type="button" onClick={() => setStartIndex(0)} className="underline cursor-pointer" style={{ color: '#7dd3fc' }}>Baştan başla</button>}
                  </div>
                </div>
              )}

              <Section icon={<Package size={14} />} title={`Ürünler (${items.length})`}>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <Search size={15} style={{ color: MUTED }} />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün ekle: ad, kod veya barkod..." className="w-full bg-transparent py-2.5 text-sm outline-none" style={INNER_INPUT_STYLE} />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-2xl overflow-hidden" style={{ backgroundColor: '#161a33' }}>
                      {searchResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setItems((prev) => [...prev, { stock: s, copies: 1 }]); setQuery(''); }}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5 cursor-pointer"
                        >
                          <span className="min-w-0"><span className="block truncate" style={{ color: '#ffffff' }}>{s.name}</span><span className="text-[11px]" style={{ color: MUTED }}>{s.code}</span></span>
                          <Plus size={16} style={{ color: '#7dd3fc' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {items.length === 0 && <p className="text-xs py-2" style={{ color: MUTED }}>Etiket basmak için yukarıdan ürün ekleyin.</p>}
                <div className="space-y-2">
                  {items.map(({ stock, copies }) => (
                    <div key={stock.id} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate" style={{ color: '#ffffff' }}>{stock.name}</div>
                        <div className="text-[11px] truncate" style={{ color: MUTED }}>{stock.code} · {formatMoney(productFromStock(stock, settings).price)} · Stok: {stock.quantity}</div>
                      </div>
                      <div className="flex items-center rounded-lg border border-white/10 shrink-0">
                        <button type="button" aria-label="Azalt" onClick={() => setCopies(stock.id, copies - 1)} className="p-1.5 cursor-pointer" style={{ color: TEXT }}><Minus size={14} /></button>
                        <input
                          aria-label={`${stock.name} kopya sayısı`}
                          value={copies}
                          inputMode="numeric"
                          onChange={(e) => setCopies(stock.id, Number(e.target.value.replace(/\D/g, '')))}
                          className="w-10 bg-transparent text-center text-sm font-bold outline-none"
                          style={INNER_INPUT_STYLE}
                        />
                        <button type="button" aria-label="Artır" onClick={() => setCopies(stock.id, copies + 1)} className="p-1.5 cursor-pointer" style={{ color: TEXT }}><Plus size={14} /></button>
                      </div>
                      <button type="button" title="Stok miktarı kadar" onClick={() => setCopies(stock.id, Math.max(1, Math.round(stock.quantity || 0)))} className="hidden sm:block text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 cursor-pointer shrink-0" style={{ color: MUTED }}>Stok kadar</button>
                      <button type="button" aria-label={`${stock.name} kaldır`} onClick={() => setItems((prev) => prev.filter((i) => i.stock.id !== stock.id))} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer shrink-0" style={{ color: '#fda4af' }}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Ayarlar */}
            <div className="space-y-4 lg:order-1">
              <Section icon={<Ruler size={14} />} title="Ölçü">
                <select
                  aria-label="Etiket ölçüsü"
                  value={presetValue}
                  onChange={(e) => (e.target.value === CUSTOM_PRESET_ID ? set('presetId', CUSTOM_PRESET_ID) : updateSettings((prev) => applyPreset(prev, e.target.value)))}
                  className={selectClass}
                  style={selectStyle}
                >
                  <optgroup label="Rulo etiket (etiket yazıcısı)">
                    {LABEL_PRESETS.filter((p) => p.mode === 'roll').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                  <optgroup label="A4 etiket kağıdı (normal yazıcı)">
                    {LABEL_PRESETS.filter((p) => p.mode === 'sheet').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                  <option value={CUSTOM_PRESET_ID}>Özel ölçü...</option>
                </select>
                {presetValue === CUSTOM_PRESET_ID && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(['roll', 'sheet'] as LabelLayoutMode[]).map((mode) => (
                        <Toggle key={mode} label={mode === 'roll' ? 'Rulo etiket' : 'A4 sayfa'} checked={settings.mode === mode} onChange={() => set('mode', mode)} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField label="Genişlik" value={settings.widthMm} min={15} max={settings.mode === 'sheet' ? 210 : 150} onChange={(v) => set('widthMm', v)} />
                      <NumberField label="Yükseklik" value={settings.heightMm} min={10} max={settings.mode === 'sheet' ? 297 : 150} onChange={(v) => set('heightMm', v)} />
                    </div>
                    {settings.mode === 'sheet' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <NumberField label="Sütun" value={settings.sheet.columns} min={1} max={10} step={1} suffix="adet" onChange={(v) => setSheet('columns', v)} />
                        <NumberField label="Satır" value={settings.sheet.rows} min={1} max={30} step={1} suffix="adet" onChange={(v) => setSheet('rows', v)} />
                        <NumberField label="Üst boşluk" value={settings.sheet.marginTopMm} min={0} max={50} step={0.1} onChange={(v) => setSheet('marginTopMm', v)} />
                        <NumberField label="Sol boşluk" value={settings.sheet.marginLeftMm} min={0} max={50} step={0.1} onChange={(v) => setSheet('marginLeftMm', v)} />
                        <NumberField label="Yatay ara" value={settings.sheet.gapXMm} min={0} max={20} step={0.1} onChange={(v) => setSheet('gapXMm', v)} />
                        <NumberField label="Dikey ara" value={settings.sheet.gapYMm} min={0} max={20} step={0.1} onChange={(v) => setSheet('gapYMm', v)} />
                      </div>
                    )}
                  </div>
                )}
              </Section>

              <Section icon={<LayoutGrid size={14} />} title="Etikette Neler Olsun">
                <div className="grid grid-cols-2 gap-2">
                  <Toggle label="Ürün adı" checked={settings.showName} onChange={(v) => set('showName', v)} />
                  <Toggle label="Fiyat" checked={settings.showPrice} onChange={(v) => set('showPrice', v)} />
                  <Toggle label="Ürün kodu" checked={settings.showCode} onChange={(v) => set('showCode', v)} />
                  <Toggle label="Birim" checked={settings.showUnit} onChange={(v) => set('showUnit', v)} />
                  <Toggle label="Barkod" checked={settings.showBarcode} onChange={(v) => set('showBarcode', v)} />
                  <Toggle label="Barkod numarası" checked={settings.showBarcodeText} onChange={(v) => set('showBarcodeText', v)} />
                  <Toggle label="QR kod" checked={settings.showQr} onChange={(v) => set('showQr', v)} />
                  <Toggle label="Firma adı" checked={settings.showFirmName} onChange={(v) => set('showFirmName', v)} />
                  <Toggle label="Kesim çerçevesi" checked={settings.showBorder} onChange={(v) => set('showBorder', v)} />
                </div>
                {settings.showPrice && (
                  <label className="block">
                    <span className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Fiyat</span>
                    <select value={settings.priceMode} onChange={(e) => set('priceMode', e.target.value as LabelPriceMode)} className={selectClass} style={selectStyle}>
                      <option value="withTax">Satış fiyatı (kasada alınan fiyat)</option>
                      <option value="withoutTax">KDV hariç fiyat</option>
                    </select>
                  </label>
                )}
                {settings.showQr && (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>QR kodun içeriği</span>
                      <select value={settings.qrContent} onChange={(e) => set('qrContent', e.target.value as LabelQrContent)} className={selectClass} style={selectStyle}>
                        <option value="code">Barkod / ürün kodu</option>
                        <option value="info">Ürün bilgisi (ad, kod, fiyat)</option>
                        <option value="custom">Özel metin / web adresi</option>
                      </select>
                    </label>
                    {settings.qrContent === 'custom' && (
                      <input value={settings.qrCustomText} onChange={(e) => set('qrCustomText', e.target.value)} placeholder="ör. https://firmaniz.com" className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff' }} />
                    )}
                  </div>
                )}
              </Section>

              <Section icon={<Type size={14} />} title="Yazı Boyutu">
                <div className="grid grid-cols-3 gap-2">
                  {([['small', 'Küçük'], ['normal', 'Normal'], ['large', 'Büyük']] as [LabelFontScale, string][]).map(([value, label]) => (
                    <Toggle key={value} label={label} checked={settings.fontScale === value} onChange={() => set('fontScale', value)} />
                  ))}
                </div>
                <p className="text-[11px]" style={{ color: MUTED }}>Yazılar etikete sığmazsa kendiliğinden küçültülür; uzun ürün adları "…" ile kısaltılır.</p>
              </Section>
            </div>
          </div>
        </div>

        {/* Alt çubuk */}
        <div className="shrink-0 border-t border-white/10 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 text-[11px]" style={{ color: MUTED }}>
            <div className="font-semibold text-sm" style={{ color: tooMany ? '#fda4af' : '#ffffff' }}>
              {totalLabels} etiket{totalLabels > 0 ? ` · ${pageCount} sayfa` : ''}
              {tooMany ? ` (en fazla ${MAX_LABELS_PER_PDF})` : ''}
            </div>
            {saveLabel}
          </div>
          <button
            type="button"
            disabled={totalLabels === 0 || tooMany || !isLoaded}
            onClick={() => setIsPdfOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-600, #0284c7)', color: '#ffffff' }}
          >
            <FileText size={17} /> PDF Oluştur
          </button>
        </div>
      </div>

      {isPdfOpen && (
        <PdfPreviewModal
          isOpen
          title="Ürün Etiketleri"
          subtitle={`${totalLabels} etiket · ${String(settings.widthMm).replace('.', ',')} × ${String(settings.heightMm).replace('.', ',')} mm`}
          shareText="Ürün etiketleri"
          generate={generate}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </div>,
    document.body,
  );
};
