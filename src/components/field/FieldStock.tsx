import React, { useMemo, useState, Suspense } from 'react';
import { lazyWithReload } from '../../utils/lazyWithReload';
import { Package, AlertTriangle, X, Tag } from 'lucide-react';
import { Stock } from '../../types';
import { findStockByBarcodeOrSearch } from '../../utils/posUtils';
import { parseScannedQrCode } from '../../utils/formatters';
import { Card, SectionTitle, SegmentedControl, SearchBox, EmptyState, formatMoney, norm } from './fieldUi';

// Kamera/barkod kütüphanesi büyük olduğu için tarayıcı ilk açıldığında indirilir
const BarcodeScannerModal = lazyWithReload(() => import('../BarcodeScannerModal'));
// Etiket tasarımı yalnızca açıldığında indirilir
const LabelDesignerModal = lazyWithReload(() => import('../labels/LabelDesignerModal').then((m) => ({ default: m.LabelDesignerModal })));

interface FieldStockProps {
  stoklar: Stock[];
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void;
}

type StockFilter = 'all' | 'critical';

export const FieldStock: React.FC<FieldStockProps> = ({ stoklar, showToast }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelStock, setLabelStock] = useState<Stock | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const list = useMemo(() => {
    const q = norm(query);
    return stoklar
      .filter(s => filter === 'all' || (s.quantity || 0) <= (s.minQuantity || 0))
      .filter(s => !q || norm(s.name).includes(q) || norm(s.code).includes(q) || norm(s.barcode || '').includes(q))
      .slice(0, 60);
  }, [stoklar, query, filter]);

  const selected = stoklar.find(s => s.id === selectedId) || null;

  const handleScan = (code: string) => {
    const parsed = parseScannedQrCode(code);
    const stock = findStockByBarcodeOrSearch(stoklar, parsed);
    if (stock) setSelectedId(stock.id);
    else showToast(`"${parsed}" barkodlu ürün bulunamadı.`, 'error');
  };

  return (
    <div className="space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="Ürün adı, kod veya barkod..." onScan={() => setIsScannerOpen(true)} />
      <SegmentedControl<StockFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `Tümü (${stoklar.length})` },
          { value: 'critical', label: 'Kritik Stok', icon: <AlertTriangle size={14} /> },
        ]}
      />

      {selected && (
        <Card className="!p-4 space-y-3" >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-bold text-white">{selected.name}</div>
              <div className="text-[11px] text-slate-500">{selected.code}{selected.barcode ? ` • ${selected.barcode}` : ''}</div>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} className="p-1 text-slate-500 cursor-pointer" aria-label="Kapat"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl p-3 ${selected.quantity <= selected.minQuantity ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-black/30 border border-white/10'}`}>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Stok</div>
              <div className={`text-xl font-black tabular-nums ${selected.quantity <= selected.minQuantity ? 'text-amber-300' : 'text-white'}`}>{selected.quantity} <span className="text-xs font-semibold">{selected.unit}</span></div>
              <div className="text-[10px] text-slate-500">Kritik seviye: {selected.minQuantity}</div>
            </div>
            <div className="rounded-xl p-3 bg-black/30 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Satış Fiyatı</div>
              <div className="text-xl font-black text-white tabular-nums">{formatMoney(selected.salesPrice)}</div>
              <div className="text-[10px] text-slate-500">Alış: {formatMoney(selected.purchasePrice)}{selected.taxRate ? ` • KDV %${selected.taxRate}` : ''}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLabelStock(selected)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black/30 border border-white/10 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            <Tag size={15} /> Etiket (barkod / QR) PDF
          </button>
          {(selected.category || selected.brand) && (
            <div className="text-[11px] text-slate-400">{[selected.category, selected.brand].filter(Boolean).join(' • ')}</div>
          )}
        </Card>
      )}

      <div>
        <SectionTitle>{filter === 'critical' ? 'Kritik Seviyedeki Ürünler' : 'Ürünler'}</SectionTitle>
        <div className="space-y-2">
          {list.map(stock => {
            const critical = (stock.quantity || 0) <= (stock.minQuantity || 0);
            return (
              <Card key={stock.id} onClick={() => setSelectedId(stock.id)} className="!p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{stock.name}</div>
                  <div className="text-[11px] text-slate-500">{stock.code} • {formatMoney(stock.salesPrice)}</div>
                </div>
                <span className={`text-sm font-bold tabular-nums shrink-0 ${critical ? 'text-amber-400' : 'text-slate-200'}`}>
                  {stock.quantity} {stock.unit}
                </span>
              </Card>
            );
          })}
          {list.length === 0 && <EmptyState icon={<Package size={28} />} text={filter === 'critical' ? 'Kritik seviyede ürün yok.' : 'Ürün bulunamadı.'} />}
        </div>
      </div>

      {labelStock && (
        <Suspense fallback={null}>
          <LabelDesignerModal initialStocks={[labelStock]} allStocks={stoklar} onClose={() => setLabelStock(null)} />
        </Suspense>
      )}

      {isScannerOpen && (
        <Suspense fallback={null}>
        <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} title="Stok Sorgula" />
        </Suspense>
      )}
    </div>
  );
};
