import React, { useMemo, useState, Suspense } from 'react';
import { lazyWithReload } from '../../utils/lazyWithReload';
import { Minus, Plus, Trash2, Package, User, Banknote, CreditCard, BookOpen, CheckCircle2, ShoppingCart, ChevronRight, FileText } from 'lucide-react';
import { formatQuantity } from '../../pdf/format';
import { Cari, Stock, BankAccount } from '../../types';
import { PosCartItem, PosPaymentSplit, PosSaleSummary } from '../../types/pos';
import { calculateLineTotal, calculateCartSummary, findStockByBarcodeOrSearch, generateReceiptNo } from '../../utils/posUtils';
import { parseScannedQrCode } from '../../utils/formatters';
import { getTodayISO } from '../../utils/dateUtils';
import { logError } from '../../utils/errorLogger';
import { QuantityInput } from '../common/QuantityInput';
import { ReceiptPdfModal, ReceiptInvoiceSource, invoiceSourceFromSummary } from '../pdf/ReceiptPdfModal';
import { ReceiptSaleData, receiptDataFromPosSummary } from '../../pdf/posReceiptPdf';
import { Card, SectionTitle, PrimaryButton, SegmentedControl, SearchBox, EmptyState, CariPickerSheet, formatMoney, norm, parseAmount } from './fieldUi';
import { grossSalesPrice } from '../../utils/stockPricing';
import { checkCreditLimit, confirmCreditLimit } from '../../utils/creditLimit';
import { QuickCariModal } from '../common/QuickCariModal';
import { roundMoney } from '../../utils/invoiceMath';

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
  const [lastSale, setLastSale] = useState<{ receiptNo: string; total: number; cariName: string; receipt: ReceiptSaleData; invoice?: ReceiptInvoiceSource } | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  // Veresiyede peşin alınan (nakit) kısım; kalanı açık hesaba yazılır
  const [downPaymentText, setDownPaymentText] = useState('');
  const [quickCariName, setQuickCariName] = useState<string | null>(null);
  // Seçili carinin güncel hâli (bakiye başka cihazdan değişmiş olabilir)
  const liveCari = useMemo(() => (cari ? cariler.find(c => c.id === cari.id) || cari : null), [cari, cariler]);

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

  /** +/- ile miktar değiştirir; sıfıra/eksiye düşecekse miktar korunur (masaüstü kasa ile aynı). Silmek için removeFromCart. */
  const changeQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const quantity = Math.round((item.quantity + delta) * 1000) / 1000;
      if (quantity <= 0) return item;
      const { discountAmount, totalLine } = calculateLineTotal(item.unitPrice, quantity, item.discountRate);
      return { ...item, quantity, discountAmount, totalLine };
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  /** Adet kutusuna doğrudan yazılan miktar (0 ya da geçersizse değişmez; silmek için çöp kutusu) */
  const setQuantity = (id: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const quantity = Math.round(value * 1000) / 1000;
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const { discountAmount, totalLine } = calculateLineTotal(item.unitPrice, quantity, item.discountRate);
      return { ...item, quantity, discountAmount, totalLine };
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
    if (payMethod === 'credit' && !liveCari) {
      setIsCariPickerOpen(true);
      return;
    }
    if (payMethod === 'card' && !cardAccount) {
      showToast('Kartla satış için önce Kasa ekranından bir POS veya banka hesabı tanımlayın.', 'error');
      return;
    }
    const total = summary.grandTotal;
    const downPayment = payMethod === 'credit' ? Math.min(total, Math.max(0, roundMoney(parseAmount(downPaymentText)))) : 0;
    const openAmount = payMethod === 'credit' ? roundMoney(total - downPayment) : 0;
    const split: PosPaymentSplit = {
      cashAmount: payMethod === 'cash' ? total : downPayment,
      cashReceived: payMethod === 'cash' ? total : downPayment,
      changeGiven: 0,
      posAmount: payMethod === 'card' ? total : 0,
      posAccountId: payMethod === 'card' ? cardAccount?.id : undefined,
      openAccountAmount: openAmount,
    };
    if (openAmount > 0.004 && !(await confirmCreditLimit(liveCari, openAmount))) return;
    const balanceBefore = Number(liveCari?.balance) || 0;
    setIsProcessing(true);
    try {
      const receiptNo = generateReceiptNo();
      const cariName = liveCari ? liveCari.name : 'Perakende Müşteri';
      const saleData: FieldSaleData = {
        receiptNo,
        cariId: liveCari?.id,
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
        const summaryForDocs: PosSaleSummary = {
          ...saleData,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          credit: openAmount > 0.004 && liveCari
            ? { amount: openAmount, balanceBefore, balanceAfter: roundMoney(balanceBefore + openAmount) }
            : undefined,
        };
        const receipt = receiptDataFromPosSummary(summaryForDocs);
        setLastSale({ receiptNo, total, cariName, receipt, invoice: invoiceSourceFromSummary(summaryForDocs, cariler) });
        setCart([]);
        setCari(null);
        setPayMethod('cash');
        setDownPaymentText('');
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
                  Stok: {formatQuantity(stock.quantity)} {stock.unit} • {stock.code}
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
            <div className="sale-done-meta mt-1 space-y-0.5 text-xs">
              <div className="text-white/80 font-semibold truncate">{lastSale.cariName}</div>
              <div className="text-white/70 tabular-nums break-words">Fiş No: <span className="font-semibold text-white/80">{lastSale.receiptNo}</span></div>
            </div>
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
        <ReceiptPdfModal data={lastSale.receipt} invoice={lastSale.invoice} title="Satış Belgesi" onClose={() => setIsReceiptOpen(false)} />
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
                      {overStock && <div className="text-[11px] text-amber-400">Stokta {formatQuantity(stock!.quantity)} {item.unit} var</div>}
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums shrink-0">{formatMoney(item.totalLine)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 rounded-xl bg-black/30 border border-white/10">
                      <button type="button" onClick={() => changeQuantity(item.id, -1)} className="p-2.5 text-white cursor-pointer" aria-label="Azalt"><Minus size={16} /></button>
                      <QuantityInput value={item.quantity} onCommit={(v) => setQuantity(item.id, v)} label={`${item.stockName} miktarı`} className="qty-input w-16 bg-transparent text-center text-sm font-bold text-white tabular-nums outline-none rounded-lg focus:bg-white/10 py-1.5" />
                      <button type="button" onClick={() => changeQuantity(item.id, 1)} className="p-2.5 text-white cursor-pointer" aria-label="Artır"><Plus size={16} /></button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="p-2.5 text-rose-400 cursor-pointer" aria-label="Kaldır"><Trash2 size={17} /></button>
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
                <div className="text-sm font-semibold text-white">{liveCari ? liveCari.name : 'Perakende Müşteri'}</div>
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
          {payMethod === 'credit' && !liveCari && <p className="text-[11px] text-amber-400 -mt-1">Veresiye satış için müşteri seçin ya da yeni müşteri ekleyin.</p>}

          {liveCari && (() => {
            const downPayment = payMethod === 'credit' ? Math.min(summary.grandTotal, Math.max(0, parseAmount(downPaymentText))) : 0;
            const openAmount = payMethod === 'credit' ? roundMoney(summary.grandTotal - downPayment) : 0;
            const credit = checkCreditLimit(liveCari, openAmount);
            const cur = liveCari.currency;
            return (
              <Card className="!p-3 space-y-2" >
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-500">Mevcut bakiye</div>
                    <div className={`text-sm font-bold tabular-nums ${credit.balanceBefore > 0.004 ? 'text-rose-400' : credit.balanceBefore < -0.004 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {formatMoney(Math.abs(credit.balanceBefore), cur)} {credit.balanceBefore > 0.004 ? 'Borç' : credit.balanceBefore < -0.004 ? 'Alacak' : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Veresiye limiti</div>
                    <div className="text-sm font-bold text-white tabular-nums">{credit.limit === null ? 'Sınırsız' : formatMoney(credit.limit, cur)}</div>
                  </div>
                </div>
                {payMethod === 'credit' && (
                  <>
                    <label className="block">
                      <span className="block text-[11px] text-slate-500 mb-1">Peşin alınan (nakit, isteğe bağlı)</span>
                      <input
                        id="field-down-payment"
                        inputMode="decimal"
                        value={downPaymentText}
                        onChange={(e) => setDownPaymentText(e.target.value)}
                        placeholder="0,00"
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-base font-bold text-white tabular-nums outline-none"
                      />
                    </label>
                    <div className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${credit.exceeded ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.04] text-slate-300'}`}>
                      Veresiye: <span className="font-bold tabular-nums">{formatMoney(openAmount, cur)}</span> • Yeni bakiye: <span className="font-bold tabular-nums">{formatMoney(credit.balanceAfter, cur)}</span>
                      {credit.exceeded && <span className="block">Limit {formatMoney(credit.overBy, cur)} aşılıyor — onay istenecek.</span>}
                    </div>
                  </>
                )}
              </Card>
            );
          })()}

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
        onCreateNew={(name) => setQuickCariName(name)}
      />
      {quickCariName !== null && (
        <QuickCariModal
          initialName={quickCariName}
          existingCount={cariler.length}
          onClose={() => setQuickCariName(null)}
          onCreated={(created) => {
            setCari(created);
            setQuickCariName(null);
            showToast(`${created.name} eklendi ve seçildi.`, 'success');
          }}
        />
      )}
    </div>
  );
};
