import React, { useMemo, useState, Suspense } from 'react';
import { lazyWithReload } from '../../utils/lazyWithReload';
import { Minus, Plus, Trash2, Package, User, Banknote, CreditCard, BookOpen, CheckCircle2, ShoppingCart, ChevronRight, FileText } from 'lucide-react';
import { Cari, Stock, BankAccount } from '../../types';
import { PosCartItem, PosPaymentSplit } from '../../types/pos';
import { calculateLineTotal, calculateCartSummary, findStockByBarcodeOrSearch, generateReceiptNo } from '../../utils/posUtils';
import { parseScannedQrCode } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dateUtils';
import { logError } from '../../utils/errorLogger';
import { ReceiptPdfModal } from '../pdf/ReceiptPdfModal';
import { ReceiptSaleData, receiptDataFromPosSummary } from '../../pdf/posReceiptPdf';
import { Card, SectionTitle, PrimaryButton, SegmentedControl, SearchBox, EmptyState, CariPickerSheet, formatMoney, norm } from './fieldUi';
import { grossSalesPrice } from '../../utils/stockPricing';

// Kamera/barkod kütüphanesi büyük olduğu için tarayıcı ilk açıldığında indirilir
const BarcodeScannerModal = lazyWithReload(() => import('../BarcodeScannerModal'));

export interface FieldSaleData {
  receiptNo: string;
  cariId?: string;
  cariName: string;
  items: PosCartItem[];
  paymentSplit: PosPaymentSplit;
  grandTotal: number;
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  date: string;
}

interface FieldSaleProps {
  stoklar: Stock[];
  cariler: Cari[];
  bankAccounts: BankAccount[];
  presetCari: Cari | null;
  onPresetConsumed: () => void;
  onCompleteSale: (sale: FieldSaleData) => Promise<boolean>;
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void;
}

type PayMethod = 'cash' | 'card' | 'credit';

export const FieldSale: React.FC<FieldSaleProps> = ({ stoklar, cariler, bankAccounts, presetCari, onPresetConsumed, onCompleteSale, showToast }) => {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [cari, setCari] = useState<Cari | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCariPickerOpen, setIsCariPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<{ receiptNo: string; total: number; cariName: string; receipt: ReceiptSaleData } | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Cari ekranından "Satış Yap" ile gelindiyse cariyi seç
  React.useEffect(() => {
    if (presetCari) {
      setCari(presetCari);
      setPayMethod('credit');
      onPresetConsumed();
    }
  }, [presetCari, onPresetConsumed]);

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return stoklar
      .filter(s => norm(s.name).includes(q) || norm(s.code).includes(q) || norm(s.barcode || '').includes(q))
      .slice(0, 20);
  }, [stoklar, query]);

  const summary = calculateCartSummary(cart, 0, 'percent', 0);
  const cardAccount = bankAccounts.find(a => a.type === 'pos') || bankAccounts.find(a => a.type === 'banka');

  const addToCart = (stock: Stock) => {
    try {
      setLastSale(null);
      setCart(prev => {
        const existing = prev.find(item => item.stockId === stock.id);
        if (existing) {
          return prev.map(item => {
            if (item.stockId !== stock.id) return item;
            const quantity = item.quantity + 1;
            const { discountAmount, totalLine } = calculateLineTotal(item.unitPrice, quantity, item.discountRate);
            return { ...item, quantity, discountAmount, totalLine };
          });
        }
        const unitPrice = grossSalesPrice(stock);
        const { discountAmount, totalLine } = calculateLineTotal(unitPrice, 1, 0);
        return [...prev, {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          stockId: stock.id,
          stockCode: stock.code,
          stockName: stock.name,
          unit: stock.unit || 'Adet',
          unitPrice,
          taxRate: 0, // KDV zorunlu değil: saha satışında fiyat etiketteki gibidir
          quantity: 1,
          discountRate: 0,
          discountAmount,
          totalLine,
          barcode: stock.barcode,
          imageUrl: stock.imageUrl,
        }];
      });
      setQuery('');
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FieldSale.addToCart');
    }
  };

  const changeQuantity = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return [item];
      const quantity = Math.round((item.quantity + delta) * 1000) / 1000;
      if (quantity <= 0) return [];
      const { discountAmount, totalLine } = calculateLineTotal(item.unitPrice, quantity, item.discountRate);
      return [{ ...item, quantity, discountAmount, totalLine }];
    }));
  };

  const handleScan = (code: string) => {
    const parsed = parseScannedQrCode(code);
    const stock = findStockByBarcodeOrSearch(stoklar, parsed);
    if (stock) {
      addToCart(stock);
      showToast(`${stock.name} sepete eklendi.`, 'success');
    } else {
      showToast(`"${parsed}" barkodlu ürün bulunamadı.`, 'error');
    }
  };

  const handleComplete = async () => {
    if (cart.length === 0 || isProcessing) return;
    if (payMethod === 'credit' && !cari) {
      setIsCariPickerOpen(true);
      return;
    }
    if (payMethod === 'card' && !cardAccount) {
      showToast('Kartla satış için önce Kasa ekranından bir POS veya banka hesabı tanımlayın.', 'error');
      return;
    }
    const total = summary.grandTotal;
    const split: PosPaymentSplit = {
      cashAmount: payMethod === 'cash' ? total : 0,
      cashReceived: payMethod === 'cash' ? total : 0,
      changeGiven: 0,
      posAmount: payMethod === 'card' ? total : 0,
      posAccountId: payMethod === 'card' ? cardAccount?.id : undefined,
      openAccountAmount: payMethod === 'credit' ? total : 0,
    };
    setIsProcessing(true);
    try {
      const receiptNo = generateReceiptNo();
      const cariName = cari ? cari.name : 'Perakende Müşteri';
      const saleData: FieldSaleData = {
        receiptNo,
        cariId: cari?.id,
        cariName,
        items: cart,
        paymentSplit: split,
        grandTotal: total,
        subtotal: summary.subtotalAfterLineDiscounts,
        totalTax: summary.totalTax,
        totalDiscount: summary.totalDiscount,
        date: getTodayISO(),
      };
      const ok = await onCompleteSale(saleData);
      if (ok) {
        const receipt = receiptDataFromPosSummary({
          ...saleData,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        });
        setLastSale({ receiptNo, total, cariName, receipt });
        setCart([]);
        setCari(null);
        setPayMethod('cash');
      }
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FieldSale.handleComplete');
      showToast('Satış kaydedilemedi: ' + (err?.message || err), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="Ürün adı, kod veya barkod..." onScan={() => setIsScannerOpen(true)} />

      {query && (
        <div className="space-y-2">
          {results.map(stock => (
            <Card key={stock.id} onClick={() => addToCart(stock)} className="!p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{stock.name}</div>
                <div className={`text-[11px] ${stock.quantity <= stock.minQuantity ? 'text-amber-400' : 'text-slate-500'}`}>
                  Stok: {stock.quantity} {stock.unit} • {stock.code}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-white tabular-nums">{formatMoney(grossSalesPrice(stock))}</span>
                <Plus size={18} className="text-[color:var(--accent-400,#38bdf8)]" />
              </div>
            </Card>
          ))}
          {results.length === 0 && <EmptyState icon={<Package size={28} />} text="Ürün bulunamadı." />}
        </div>
      )}

      {lastSale && cart.length === 0 && (
        <Card className="!border-emerald-500/30 !bg-emerald-500/10 flex items-center gap-3">
          <CheckCircle2 size={28} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">Satış tamamlandı — {formatMoney(lastSale.total)}</div>
            <div className="text-[11px] text-emerald-200/80 truncate">{lastSale.cariName} • Fiş {lastSale.receiptNo}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <FileText size={15} /> Fiş
          </button>
        </Card>
      )}
      {lastSale && isReceiptOpen && (
        <ReceiptPdfModal data={lastSale.receipt} onClose={() => setIsReceiptOpen(false)} />
      )}

      <div>
        <SectionTitle right={cart.length > 0 && (
          <button type="button" onClick={() => setCart([])} className="text-[11px] font-bold text-rose-400 cursor-pointer">Sepeti Boşalt</button>
        )}>Sepet ({cart.length})</SectionTitle>
        {cart.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={30} />} text="Ürün arayın veya barkod okutun." />
        ) : (
          <div className="space-y-2">
            {cart.map(item => {
              const stock = stoklar.find(s => s.id === item.stockId);
              const overStock = stock && item.quantity > stock.quantity;
              return (
                <Card key={item.id} className="!p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{item.stockName}</div>
                      <div className="text-[11px] text-slate-500">{formatMoney(item.unitPrice)} / {item.unit}</div>
                      {overStock && <div className="text-[11px] text-amber-400">Stokta {stock!.quantity} {item.unit} var</div>}
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums shrink-0">{formatMoney(item.totalLine)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 rounded-xl bg-black/30 border border-white/10">
                      <button type="button" onClick={() => changeQuantity(item.id, -1)} className="p-2.5 text-white cursor-pointer" aria-label="Azalt"><Minus size={16} /></button>
                      <span className="w-10 text-center text-sm font-bold text-white tabular-nums">{item.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(item.id, 1)} className="p-2.5 text-white cursor-pointer" aria-label="Artır"><Plus size={16} /></button>
                    </div>
                    <button type="button" onClick={() => changeQuantity(item.id, -item.quantity)} className="p-2.5 text-rose-400 cursor-pointer" aria-label="Kaldır"><Trash2 size={17} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="space-y-3">
          <Card onClick={() => setIsCariPickerOpen(true)} className="!p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-400" />
              <div>
                <div className="text-[11px] text-slate-500">Müşteri</div>
                <div className="text-sm font-semibold text-white">{cari ? cari.name : 'Perakende Müşteri'}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </Card>

          <SegmentedControl<PayMethod>
            value={payMethod}
            onChange={setPayMethod}
            options={[
              { value: 'cash', label: 'Nakit', icon: <Banknote size={15} /> },
              { value: 'card', label: 'Kart', icon: <CreditCard size={15} /> },
              { value: 'credit', label: 'Veresiye', icon: <BookOpen size={15} /> },
            ]}
          />
          {payMethod === 'credit' && !cari && <p className="text-[11px] text-amber-400 -mt-1">Veresiye satış için müşteri seçin.</p>}

          <div className="flex items-end justify-between px-1">
            <span className="text-sm text-slate-400">Toplam</span>
            <span className="text-3xl font-black text-white tabular-nums">{formatMoney(summary.grandTotal)}</span>
          </div>
          <PrimaryButton type="button" onClick={handleComplete} disabled={isProcessing}>
            {isProcessing ? 'Kaydediliyor...' : `Satışı Tamamla • ${formatMoney(summary.grandTotal)}`}
          </PrimaryButton>
        </div>
      )}

      {isScannerOpen && (
        <Suspense fallback={null}>
        <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} title="Ürün Barkodu Okut" multiScan />
        </Suspense>
      )}
      <CariPickerSheet
        isOpen={isCariPickerOpen}
        cariler={cariler}
        allowNone={payMethod !== 'credit'}
        onSelect={setCari}
        onClose={() => setIsCariPickerOpen(false)}
        title="Müşteri Seçin"
      />
    </div>
  );
};
