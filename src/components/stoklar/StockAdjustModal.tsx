/**
 * Manuel stok girişi/çıkışı ve stok sayımı penceresi.
 *
 * - Giriş/Çıkış: fatura kesmeden stoğa miktar eklenir ya da düşülür (tedarikçiden gelen mal,
 *   fire, kendi kullanımı vb.). Not alanına sebep yazılır.
 * - Sayım: ürünler barkodla okutulur (her okutma +1) ya da sayılan miktar yazılır; sistemdeki
 *   miktarla fark gösterilir ve "Farkları Uygula" ile stok sayılan miktara getirilir.
 *
 * Miktarlar artırımlı yazılır (adjustStockQuantities): sayım sırasında yapılan satışlar ezilmez.
 * Stok düşüren işlemler, yetkisi olmayan çalışan için sahip onayı ister (decrease_stock).
 */
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Camera, ClipboardCheck, PackagePlus, Search, Trash2, X } from 'lucide-react';
import { Stock } from '../../types';
import { adjustStockQuantities, StockAdjustment } from '../../firebase';
import { logError } from '../../utils/errorLogger';
import { alertDialog, confirmDialog } from '../../utils/dialogs';
import { parseScannedQrCode } from '../../utils/formatters';
import { formatQuantity } from '../../pdf/format';
import { QuantityInput } from '../common/QuantityInput';
import { lazyWithReload } from '../../utils/lazyWithReload';

const BarcodeScannerModal = lazyWithReload(() => import('../BarcodeScannerModal'));

export type StockAdjustMode = 'entry' | 'count';

interface StockAdjustModalProps {
  isOpen: boolean;
  mode: StockAdjustMode;
  stoklar: Stock[];
  onClose: () => void;
  /** Stok düşürme yetkisi yoksa sahip onayı ister; onaylanırsa action çalışır */
  requestDecreaseApproval: (action: () => void) => void;
}

interface Line {
  stockId: string;
  /** Giriş/çıkışta miktar, sayımda sayılan miktar */
  value: number;
}

const toErr = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const norm = (v: string) => (v || '').toLocaleLowerCase('tr-TR').trim();

/** Barkod / kod birebir eşleşmesi; yoksa null (ad araması listeden seçilir) */
function findExact(stoklar: Stock[], code: string): Stock | null {
  const c = norm(code);
  if (!c) return null;
  return stoklar.find((s) => s.barcode && norm(s.barcode) === c) || stoklar.find((s) => s.code && norm(s.code) === c) || null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ isOpen, mode, stoklar, onClose, requestDecreaseApproval }) => {
  const [lines, setLines] = useState<Line[]>([]);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Pencere her açılışta temiz başlar
  useEffect(() => {
    if (isOpen) {
      setLines([]);
      setDirection('in');
      setNote('');
      setQuery('');
    }
  }, [isOpen, mode]);

  const stockById = useMemo(() => new Map(stoklar.map((s) => [s.id, s])), [stoklar]);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return stoklar
      .filter((s) => norm(s.name).includes(q) || norm(s.code).includes(q) || norm(s.barcode || '').includes(q))
      .slice(0, 8);
  }, [query, stoklar]);

  const addStock = (stock: Stock) => {
    try {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.stockId === stock.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], value: round3(next[idx].value + 1) };
          // Son okutulan en üstte
          const [line] = next.splice(idx, 1);
          return [line, ...next];
        }
        return [{ stockId: stock.id, value: 1 }, ...prev];
      });
      setFlashId(stock.id);
      setTimeout(() => setFlashId((id) => (id === stock.id ? null : id)), 600);
      setQuery('');
    } catch (err) {
      logError(toErr(err), 'StockAdjustModal.addStock');
    }
  };

  const handleCode = (raw: string) => {
    const code = parseScannedQrCode(raw);
    const exact = findExact(stoklar, code);
    if (exact) {
      addStock(exact);
      return true;
    }
    return false;
  };

  // El tipi barkod okuyucu
  useEffect(() => {
    if (!isOpen) return;
    const onScan = (e: Event) => {
      const code = String((e as CustomEvent).detail?.code || '').trim();
      if (!code) return;
      if (!handleCode(code)) {
        setQuery(code);
      }
    };
    window.addEventListener('global-hardware-barcode-scan', onScan);
    return () => window.removeEventListener('global-hardware-barcode-scan', onScan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stoklar]);

  const setValue = (stockId: string, value: number) => {
    setLines((prev) => prev.map((l) => (l.stockId === stockId ? { ...l, value: round3(value) } : l)));
  };

  const removeLine = (stockId: string) => setLines((prev) => prev.filter((l) => l.stockId !== stockId));

  /** Uygulanacak farklar (sayımda sistem miktarı uygulama anındaki canlı değerdir) */
  const adjustments: StockAdjustment[] = useMemo(() => lines.flatMap((l) => {
    const stock = stockById.get(l.stockId);
    if (!stock) return [];
    const system = Number(stock.quantity) || 0;
    if (mode === 'count') {
      const delta = round3(l.value - system);
      return [{ stockId: stock.id, stockName: stock.name, unit: stock.unit, delta, systemQuantity: round3(system), countedQuantity: l.value }];
    }
    const delta = direction === 'in' ? l.value : -l.value;
    return [{ stockId: stock.id, stockName: stock.name, unit: stock.unit, delta }];
  }), [lines, stockById, mode, direction]);

  const changed = adjustments.filter((a) => Math.abs(a.delta) > 0.0005);
  const hasDecrease = changed.some((a) => a.delta < 0);

  const apply = async () => {
    setSaving(true);
    try {
      const count = await adjustStockQuantities(changed, mode, note.trim() || undefined);
      await alertDialog({
        title: mode === 'count' ? 'Sayım uygulandı' : 'Stok güncellendi',
        message: mode === 'count' ? `${count} üründe stok sayılan miktara getirildi.` : `${count} ürünün stoğu güncellendi.`,
      });
      onClose();
    } catch (err) {
      logError(toErr(err), 'StockAdjustModal.apply');
      await alertDialog({ title: 'Kaydedilemedi', message: 'Stok güncellenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (changed.length === 0) {
      await alertDialog(mode === 'count' ? 'Sayılan miktarlar sistemdekiyle aynı; uygulanacak fark yok.' : 'Önce ürün ekleyin ve miktar girin.');
      return;
    }
    if (mode === 'count') {
      const ok = await confirmDialog({
        title: 'Sayım farklarını uygula',
        message: `${changed.length} üründe stok, sayılan miktara getirilecek. Sayılmayan ürünlere dokunulmaz. Onaylıyor musunuz?`,
        confirmText: 'Farkları Uygula',
      });
      if (!ok) return;
    }
    // Stok düşürme yetkisi yoksa sahip onayı
    if (hasDecrease) requestDecreaseApproval(() => { void apply(); });
    else await apply();
  };

  if (!isOpen) return null;

  const isCount = mode === 'count';
  const title = isCount ? 'Stok Sayımı' : 'Manuel Stok Girişi / Çıkışı';

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div id="stock-adjust-modal" className="bg-[#18181b] border border-white/10 w-full sm:max-w-3xl h-[94vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0">
              {isCount ? <ClipboardCheck size={20} /> : <PackagePlus size={20} />}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider truncate">{title}</h3>
              <p className="text-[11px] text-white/50">
                {isCount ? 'Ürünleri okutun ya da sayılan miktarı yazın; fark otomatik hesaplanır.' : 'Fatura kesmeden stoğa ekleyin ya da stoktan düşün.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer" aria-label="Kapat"><X size={18} /></button>
        </div>

        {/* Giriş / Çıkış seçimi */}
        {!isCount && (
          <div className="px-5 pt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              id="stock-adjust-in"
              onClick={() => setDirection('in')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition ${direction === 'in' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
            >
              <ArrowDownCircle size={16} /> Stoğa Ekle (Giriş)
            </button>
            <button
              type="button"
              id="stock-adjust-out"
              onClick={() => setDirection('out')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition ${direction === 'out' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
            >
              <ArrowUpCircle size={16} /> Stoktan Düş (Çıkış)
            </button>
          </div>
        )}

        {/* Ürün arama / barkod */}
        <div className="px-5 pt-4 relative">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-teal-500">
              <Search size={16} className="text-white/40 shrink-0" />
              <input
                ref={searchRef}
                id="stock-adjust-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (handleCode(query)) return;
                  if (results.length === 1) addStock(results[0]);
                }}
                placeholder="Ürün adı, kod ya da barkod okutun..."
                className="w-full bg-transparent py-3 text-sm text-white outline-none"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center cursor-pointer"
              aria-label="Kamerayla barkod okut"
              title="Kamerayla barkod okut"
            >
              <Camera size={18} />
            </button>
          </div>
          {results.length > 0 && (
            <div className="absolute left-5 right-5 mt-1 z-10 rounded-xl border border-white/10 bg-[#18181b] shadow-2xl overflow-hidden">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addStock(s)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-white truncate">{s.name}</span>
                    <span className="block text-[11px] text-white/40">{s.code}{s.barcode ? ` · ${s.barcode}` : ''}</span>
                  </span>
                  <span className="text-[11px] text-white/60 shrink-0">Stok: {formatQuantity(s.quantity)} {s.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Satırlar */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 min-h-[160px]">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/40 text-xs py-10">
              {isCount ? <ClipboardCheck size={32} className="mb-2" /> : <PackagePlus size={32} className="mb-2" />}
              {isCount ? 'Rafı saymaya başlayın: her barkod okutma 1 adet sayar.' : 'Ürün arayın ya da barkod okutun.'}
            </div>
          ) : (
            lines.map((line) => {
              const stock = stockById.get(line.stockId);
              if (!stock) return null;
              const system = Number(stock.quantity) || 0;
              const diff = isCount ? round3(line.value - system) : 0;
              const after = isCount ? line.value : round3(system + (direction === 'in' ? line.value : -line.value));
              return (
                <div
                  key={line.stockId}
                  data-line={stock.code}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-2xl border transition ${flashId === line.stockId ? 'border-teal-400 bg-teal-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="text-sm font-semibold text-white truncate">{stock.name}</div>
                    <div className="text-[11px] text-white/45">{stock.code} · Sistemde {formatQuantity(system)} {stock.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/45">{isCount ? 'Sayılan' : direction === 'in' ? 'Eklenecek' : 'Düşülecek'}</span>
                    <QuantityInput
                      value={line.value}
                      onCommit={(v) => setValue(line.stockId, v)}
                      allowZero={isCount}
                      label={`${stock.name} ${isCount ? 'sayılan miktar' : 'miktar'}`}
                      className="stock-adjust-qty w-20 bg-white/5 border border-white/10 rounded-lg text-center text-sm font-bold text-white tabular-nums outline-none py-1.5 focus:border-teal-500"
                    />
                    <span className="text-[11px] text-white/50">{stock.unit}</span>
                  </div>
                  <div className="text-right min-w-[92px]">
                    {isCount ? (
                      <div className={`text-sm font-bold tabular-nums ${diff > 0 ? 'text-emerald-300' : diff < 0 ? 'text-rose-300' : 'text-white/50'}`}>
                        {diff === 0 ? 'Fark yok' : `${diff > 0 ? '+' : ''}${formatQuantity(diff)}`}
                      </div>
                    ) : null}
                    <div className="text-[11px] text-white/45">Sonra: {formatQuantity(after)} {stock.unit}</div>
                  </div>
                  <button type="button" onClick={() => removeLine(line.stockId)} className="p-2 rounded-lg text-rose-300 hover:bg-rose-500/10 cursor-pointer" aria-label="Satırı kaldır">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Alt bilgi */}
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          <input
            id="stock-adjust-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isCount ? 'Not (ör. Ay sonu sayımı, A rafı)' : 'Sebep / not (ör. Tedarikçiden geldi, fire, kendi kullanım)'}
            className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-white/55">
              {lines.length} ürün{isCount ? ` · ${changed.length} üründe fark` : ''}
              {hasDecrease && <span className="block text-rose-300">Stok düşen ürün var</span>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider cursor-pointer">Vazgeç</button>
              <button
                id="btn-stock-adjust-save"
                type="button"
                disabled={saving || lines.length === 0}
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer"
              >
                {saving ? 'Kaydediliyor…' : isCount ? 'Farkları Uygula' : 'Stoğu Güncelle'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onScan={(code: string) => {
              if (!handleCode(code)) {
                setScannerOpen(false);
                setQuery(parseScannedQrCode(code));
                setTimeout(() => searchRef.current?.focus(), 50);
              }
            }}
            title={isCount ? 'Sayım: ürünleri okutun' : 'Ürün barkodu okut'}
            multiScan
          />
        </Suspense>
      )}
    </div>
  );
};
