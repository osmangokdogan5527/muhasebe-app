import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stock, Cari, BankAccount, Transaction } from '../../types';
import { PosCartItem, PosPaymentSplit, PosParkedSale, PosSaleSummary } from '../../types/pos';
import { PosProductCatalog } from './PosProductCatalog';
import { PosCartTable } from './PosCartTable';
import { PosSplitPaymentModal } from './PosSplitPaymentModal';
import { PosReceiptModal } from './PosReceiptModal';
import { PosParkedSalesModal } from './PosParkedSalesModal';
import { findStockByBarcodeOrSearch, calculateLineTotal, calculateCartSummary, generateReceiptNo } from '../../utils/posUtils';
import { ShoppingCart, Zap, DollarSign, CreditCard, User, Clock, CheckCircle2, RotateCcw, Search, Plus, Sparkles, HelpCircle, Percent } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosViewProps {
  stocks: Stock[];
  cariler: Cari[];
  bankAccounts: BankAccount[];
  onCompletePosSale: (saleData: {
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
  }) => Promise<boolean>;
}

export const PosView: React.FC<PosViewProps> = ({
  stocks,
  cariler,
  bankAccounts,
  onCompletePosSale,
}) => {
  // SEPET & MÜŞTERİ STATE'LERİ
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [selectedCari, setSelectedCari] = useState<Cari | null>(null);
  const [cariSearchTerm, setCariSearchTerm] = useState<string>('');
  const [isCariDropdownOpen, setIsCariDropdownOpen] = useState<boolean>(false);

  // ÜRÜN ARAMA & BARKOD
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // KDV VE İSKONTO STATE'LERİ (VARSAYILAN KDV: %0)
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount' | 'target'>('percent');
  const [discountVal, setDiscountVal] = useState<number | string>('');

  // PARA BİRİMİ SEÇİMİ (TRY, USD, EUR)
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [exchangeRates] = useState<{ USD: number; EUR: number }>({
    USD: 38.50,
    EUR: 41.20,
  });
  const [customRate, setCustomRate] = useState<string>('');

  // ASKIDAKİ SATIŞLAR (PARKED SALES)
  const [parkedSales, setParkedSales] = useState<PosParkedSale[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_parked_sales');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // MODAL STATE'LERİ
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isParkedModalOpen, setIsParkedModalOpen] = useState<boolean>(false);
  const [completedSaleSummary, setCompletedSaleSummary] = useState<PosSaleSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // PARKED SALES LOCALSTORAGE KAYIT
  useEffect(() => {
    try {
      localStorage.setItem('storm_pos_parked_sales', JSON.stringify(parkedSales));
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:saveParkedSales');
    }
  }, [parkedSales]);

  // SEPET HESAPLAMASI
  const summary = calculateCartSummary(
    cartItems,
    typeof discountVal === 'number' ? discountVal : Number(discountVal) || 0,
    discountMode,
    globalTaxRate
  );

  // KUR VE DÖVİZLİ TUTAR HESAPLAMASI
  const currentRate =
    selectedCurrency === 'TRY'
      ? 1
      : customRate !== ''
      ? Math.max(0.0001, Number(customRate))
      : exchangeRates[selectedCurrency] || 1;

  const convertedTotal = summary.grandTotal / currentRate;
  const currencySymbol =
    selectedCurrency === 'TRY'
      ? '₺'
      : selectedCurrency === 'USD'
      ? '$'
      : '€';

  // SEPETE ÜRÜN EKLE VEYA MİKTAR ARTTIR
  const handleAddToCart = useCallback((stock: Stock) => {
    try {
      setCartItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.stockId === stock.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          const currentItem = updated[existingIndex];
          const newQty = currentItem.quantity + 1;
          const { discountAmount, totalLine } = calculateLineTotal(
            currentItem.unitPrice,
            newQty,
            currentItem.discountRate
          );
          updated[existingIndex] = {
            ...currentItem,
            quantity: newQty,
            discountAmount,
            totalLine,
          };
          return updated;
        } else {
          const unitPrice = stock.salesPrice || 0;
          const { discountAmount, totalLine } = calculateLineTotal(unitPrice, 1, 0);
          const newItem: PosCartItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            stockId: stock.id,
            stockCode: stock.code,
            stockName: stock.name,
            unit: stock.unit || 'Adet',
            unitPrice,
            taxRate: (stock.taxRate !== undefined && stock.taxRate !== null) ? stock.taxRate : 0,
            quantity: 1,
            discountRate: 0,
            discountAmount,
            totalLine,
            barcode: stock.barcode,
            imageUrl: stock.imageUrl,
          };
          return [...prev, newItem];
        }
      });
      setProductSearchTerm('');
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleAddToCart');
    }
  }, []);

  // BARKOD OKUYUCU DİNLEYİCİSİ (Arama kutusuna hızlı yazılan barkodları algılar)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Eğer modal açıksa kısayolları engelle
        if (isSplitModalOpen || isReceiptModalOpen || isParkedModalOpen) return;

        // F1: Arama Kutusuna Odaklan
        if (e.key === 'F1') {
          e.preventDefault();
          searchInputRef.current?.focus();
          return;
        }

        // F2: Hızlı Nakit Satış
        if (e.key === 'F2') {
          e.preventDefault();
          handleQuickCashSale();
          return;
        }

        // F3: Hızlı POS Satış
        if (e.key === 'F3') {
          e.preventDefault();
          handleQuickPosSale();
          return;
        }

        // F4: Parçalı Ödeme Modal
        if (e.key === 'F4') {
          e.preventDefault();
          if (cartItems.length > 0) setIsSplitModalOpen(true);
          return;
        }

        // F8: Askıya Al
        if (e.key === 'F8') {
          e.preventDefault();
          handleParkSale();
          return;
        }

        // ESC: Arama / Temizle
        if (e.key === 'Escape') {
          setProductSearchTerm('');
        }
      } catch (err: any) {
        reportErrorToTelegram(err, 'PosView:handleKeyDown');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isSplitModalOpen, isReceiptModalOpen, isParkedModalOpen]);

  // ARAMA METNİ DEĞİŞTİĞİNDE TAM EŞLEŞEN BARKOD VARSA SEPETE AT
  useEffect(() => {
    if (!productSearchTerm.trim()) return;

    const matched = findStockByBarcodeOrSearch(stocks, productSearchTerm);
    // Yalnızca barkod ile tam birebir eşleşme varsa otomatik sepete ekle
    if (matched && matched.barcode && matched.barcode.toLowerCase() === productSearchTerm.trim().toLowerCase()) {
      handleAddToCart(matched);
      setProductSearchTerm('');
    }
  }, [productSearchTerm, stocks, handleAddToCart]);

  // MİKTAR GÜNCELLEME
  const handleUpdateQuantity = (id: string, delta: number) => {
    try {
      setCartItems((prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = Math.max(1, item.quantity + delta);
              const { discountAmount, totalLine } = calculateLineTotal(
                item.unitPrice,
                newQty,
                item.discountRate
              );
              return { ...item, quantity: newQty, discountAmount, totalLine };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateQuantity');
    }
  };

  const handleSetQuantity = (id: string, qty: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const { discountAmount, totalLine } = calculateLineTotal(
              item.unitPrice,
              qty,
              item.discountRate
            );
            return { ...item, quantity: qty, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleSetQuantity');
    }
  };

  // BİRİM FİYAT GÜNCELLEME (Fiyat Değiştirme)
  const handleUpdateUnitPrice = (id: string, newUnitPrice: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const price = Math.max(0, newUnitPrice);
            const { discountAmount, totalLine } = calculateLineTotal(
              price,
              item.quantity,
              item.discountRate
            );
            return { ...item, unitPrice: price, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateUnitPrice');
    }
  };

  // İSKONTO YÜZDESİ GÜNCELLEME
  const handleUpdateDiscount = (id: string, discountRate: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const rate = Math.min(100, Math.max(0, discountRate));
            const { discountAmount, totalLine } = calculateLineTotal(
              item.unitPrice,
              item.quantity,
              rate
            );
            return { ...item, discountRate: rate, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateDiscount');
    }
  };

  // SATIR SİLME & SEPETİ TEMİZLE
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Sepetteki tüm ürünler silinecek. Onaylıyor musunuz?')) {
      setCartItems([]);
      setSelectedCari(null);
      setDiscountVal('');
    }
  };

  // HIZLI NAKİT SATIŞ (F2)
  const handleQuickCashSale = async () => {
    if (cartItems.length === 0 || isProcessing) return;

    const split: PosPaymentSplit = {
      cashAmount: summary.grandTotal,
      cashReceived: summary.grandTotal,
      changeGiven: 0,
      posAmount: 0,
      openAccountAmount: 0,
    };

    await executeSale(split);
  };

  // HIZLI KREDİ KARTI / POS SATIŞ (F3)
  const handleQuickPosSale = async () => {
    if (cartItems.length === 0 || isProcessing) return;

    const posAccounts = bankAccounts.filter((a) => a.type === 'pos' || a.type === 'banka');

    const split: PosPaymentSplit = {
      cashAmount: 0,
      cashReceived: 0,
      changeGiven: 0,
      posAmount: summary.grandTotal,
      posAccountId: posAccounts.length > 0 ? posAccounts[0].id : '',
      openAccountAmount: 0,
    };

    await executeSale(split);
  };

  // ASKIYA AL (F8)
  const handleParkSale = () => {
    try {
      if (cartItems.length === 0) {
        alert('Askıya almak için sepete en az bir ürün eklemelisiniz.');
        return;
      }

      const newParked: PosParkedSale = {
        id: 'park_' + Date.now(),
        createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        customerName: selectedCari ? selectedCari.name : 'Perakende Müşteri',
        cariId: selectedCari?.id,
        items: [...cartItems],
        totalAmount: summary.grandTotal,
      };

      setParkedSales((prev) => [newParked, ...prev]);
      setCartItems([]);
      setSelectedCari(null);
      alert('Satış başarıyla askıya alındı.');
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleParkSale');
    }
  };

  // ASKIDAKİ SATIŞI GERİ YÜKLE
  const handleRestoreParkedSale = (parked: PosParkedSale) => {
    try {
      setCartItems(parked.items);
      if (parked.cariId) {
        const foundCari = cariler.find((c) => c.id === parked.cariId);
        if (foundCari) setSelectedCari(foundCari);
      } else {
        setSelectedCari(null);
      }
      setParkedSales((prev) => prev.filter((p) => p.id !== parked.id));
      setIsParkedModalOpen(false);
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleRestoreParkedSale');
    }
  };

  // SATIŞI GERÇEKLEŞTİR
  const executeSale = async (paymentSplit: PosPaymentSplit) => {
    try {
      setIsProcessing(true);
      const receiptNo = generateReceiptNo();
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const cariName = selectedCari ? selectedCari.name : 'Perakende Müşteri';

      const success = await onCompletePosSale({
        receiptNo,
        cariId: selectedCari?.id,
        cariName,
        items: cartItems,
        paymentSplit,
        grandTotal: summary.grandTotal,
        subtotal: summary.subtotalAfterLineDiscounts,
        totalTax: summary.totalTax,
        totalDiscount: summary.totalDiscount,
        date,
      });

      if (success) {
        // Fiş Özetini Hazırla ve Fiş Modalını Aç
        const saleSummary: PosSaleSummary = {
          receiptNo,
          date,
          time,
          items: cartItems,
          paymentSplit,
          cariId: selectedCari?.id,
          cariName,
          subtotal: summary.subtotalAfterLineDiscounts,
          totalDiscount: summary.totalDiscount,
          totalTax: summary.totalTax,
          grandTotal: summary.grandTotal,
        };

        setCompletedSaleSummary(saleSummary);
        setIsReceiptModalOpen(true);

        // Sepeti Sıfırla
        setCartItems([]);
        setSelectedCari(null);
        setDiscountVal('');
        setIsSplitModalOpen(false);
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:executeSale');
      alert('Satış kaydı sırasında bir hata oluştu: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // CARİ SÜZGEÇ
  const filteredCariler = cariler.filter((c) =>
    c.name.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(cariSearchTerm.toLowerCase())
  );

  return (
    <div className="pos-terminal-wrapper flex flex-col min-h-[calc(100vh-4rem)] h-auto overflow-y-auto gap-3.5 animate-fade-in p-1.5 bg-slate-950 rounded-2xl pb-10">
      {/* ÜST TERMİNAL BİLGİ & KISAYOL BAR */}
      <div className="p-3.5 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0" style={{ backgroundColor: '#0f172a' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300 font-bold">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>HIZLI SATIŞ TERMİNALİ</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-teal-600 text-white border border-teal-400 font-black shadow-sm">
                v1.8.1 POS Engine
              </span>
            </h2>
            <p className="text-[11px] text-slate-300 font-medium">
              Dokunmatik & Barkod Okuyucu Destekli Perakende Kasasız Satış
            </p>
          </div>
        </div>

        {/* KISAYOL TUŞLARI - YÜKSEK KONTRAST BİLİŞİM/SATIŞ BUTONLARI */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono font-bold">
          <span
            className="px-3 py-1.5 rounded-lg font-black shadow-md flex items-center gap-1.5 border"
            style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#334155' }}
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black" style={{ color: '#2dd4bf', backgroundColor: 'rgba(20,184,166,0.25)' }}>
              F1
            </span>
            <span style={{ color: '#ffffff' }}>Barkod</span>
          </span>

          <span
            className="px-3 py-1.5 rounded-lg font-black shadow-md flex items-center gap-1.5 border"
            style={{ backgroundColor: '#065f46', color: '#ffffff', borderColor: '#10b981' }}
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black" style={{ color: '#a7f3d0', backgroundColor: 'rgba(16,185,129,0.25)' }}>
              F2
            </span>
            <span style={{ color: '#ffffff' }}>Hızlı Nakit</span>
          </span>

          <span
            className="px-3 py-1.5 rounded-lg font-black shadow-md flex items-center gap-1.5 border"
            style={{ backgroundColor: '#1e40af', color: '#ffffff', borderColor: '#3b82f6' }}
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black" style={{ color: '#bfdbfe', backgroundColor: 'rgba(59,130,246,0.25)' }}>
              F3
            </span>
            <span style={{ color: '#ffffff' }}>Hızlı POS</span>
          </span>

          <span
            className="px-3 py-1.5 rounded-lg font-black shadow-md flex items-center gap-1.5 border"
            style={{ backgroundColor: '#6b21a8', color: '#ffffff', borderColor: '#a855f7' }}
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black" style={{ color: '#e9d5ff', backgroundColor: 'rgba(168,85,247,0.25)' }}>
              F4
            </span>
            <span style={{ color: '#ffffff' }}>Parçalı Ödeme</span>
          </span>

          <button
            onClick={() => setIsParkedModalOpen(true)}
            className="px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 border"
            style={{ backgroundColor: '#f59e0b', color: '#020617', borderColor: '#fbbf24' }}
          >
            <Clock size={14} style={{ color: '#020617' }} />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black" style={{ color: '#020617', backgroundColor: 'rgba(2,6,23,0.25)' }}>
              F8
            </span>
            <span style={{ color: '#020617', fontWeight: 900 }}>Askıdaki Satışlar ({parkedSales.length})</span>
          </button>
        </div>
      </div>

      {/* İKİLİ EKRAN YAPISI */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0">
        {/* SOL PANEL: ÜRÜN KATALOĞU VE KASA GÖSTERGESİ / ÖDEME PANELİ */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3.5 min-h-0">
          <PosProductCatalog
            stocks={stocks}
            onAddToCart={handleAddToCart}
            searchTerm={productSearchTerm}
            setSearchTerm={setProductSearchTerm}
            searchInputRef={searchInputRef}
          />

          {/* KASA GÖSTERGESİ VE ÖDEME PANELİ (GÖSTERGE SOL PANEL ALTINA ALINDI) */}
          <div className="p-4 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl space-y-3.5 shrink-0" style={{ backgroundColor: '#0f172a' }}>
            
            {/* KDV ORANI, İSKONTO VE PARA BİRİMİ PANELİ */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center" style={{ backgroundColor: '#020617' }}>
              {/* 1. KDV SEÇİMİ (VARSAYILAN %0) */}
              <div className="md:col-span-3 space-y-1.5">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#cbd5e1' }}>
                  <Percent size={13} className="text-teal-400" style={{ color: '#2dd4bf' }} />
                  KDV Oranı:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                  {[0, 1, 10, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGlobalTaxRate(rate)}
                      className={`flex-1 py-1 rounded text-[11px] font-mono font-black transition-all cursor-pointer text-center ${
                        globalTaxRate === rate
                          ? 'bg-teal-500 text-slate-950 shadow-md scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      style={globalTaxRate === rate ? { backgroundColor: '#2dd4bf', color: '#020617', fontWeight: 900 } : {}}
                    >
                      %{rate}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. İSKONTO SEÇİMİ (% YÜZDE, ₺ İSKONTO, 🎯 NET ALINACAK TUTAR) */}
              <div className="md:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1" style={{ color: '#fcd34d' }}>
                    <Sparkles size={14} />
                    İskonto:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('percent'); setDiscountVal(''); }}
                      className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                        discountMode === 'percent' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'percent' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      % Yüzde
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('amount'); setDiscountVal(''); }}
                      className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                        discountMode === 'amount' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'amount' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      ₺ İskonto
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('target'); setDiscountVal(''); }}
                      className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                        discountMode === 'target' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'target' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      🎯 Net Tutar
                    </button>
                  </div>
                </div>

                {/* İSKONTO GİRİŞ INPUT'U */}
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder={
                      discountMode === 'percent'
                        ? 'İskonto % Oranı Giriniz...'
                        : discountMode === 'amount'
                        ? 'İskonto Tutarı ₺ Giriniz...'
                        : 'Alınacak Net Tutar ₺ Giriniz...'
                    }
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  />
                  <span className="absolute right-2.5 text-xs font-black font-mono text-amber-400" style={{ color: '#fbbf24' }}>
                    {discountMode === 'percent' ? '%' : '₺'}
                  </span>
                </div>
              </div>

              {/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ (SAĞA YANAŞTIRILMIŞ) */}
              <div className="md:col-span-4 space-y-1.5 flex flex-col items-end text-right">
                <div className="flex items-center justify-end gap-2 w-full">
                  <span className="text-[11px] font-black text-teal-300 uppercase tracking-wider flex items-center gap-1" style={{ color: '#5eead4' }}>
                    <DollarSign size={13} />
                    Para Birimi:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                    {[
                      { code: 'TRY', label: '₺ TRY' },
                      { code: 'USD', label: '$ USD' },
                      { code: 'EUR', label: '€ EUR' },
                    ].map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(c.code as any);
                          setCustomRate('');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          selectedCurrency === c.code
                            ? 'bg-teal-400 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        style={selectedCurrency === c.code ? { backgroundColor: '#2dd4bf', color: '#020617', fontWeight: 900 } : {}}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCurrency !== 'TRY' ? (
                  <div className="flex items-center justify-end gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 self-end">
                    <span className="text-[10px] font-bold text-slate-300">
                      1 {selectedCurrency} Kur:
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={customRate !== '' ? customRate : exchangeRates[selectedCurrency as keyof typeof exchangeRates]}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="w-16 py-0.5 bg-slate-950 border border-slate-700 rounded text-right text-xs font-mono font-black text-teal-300"
                        style={{ backgroundColor: '#020617', color: '#2dd4bf' }}
                      />
                      <span className="text-[10px] font-mono text-slate-400">₺</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-mono text-right pt-0.5">Türk Lirası (Standart)</div>
                )}
              </div>
            </div>

            {/* HESAPLAMA ÖZETİ & EKRAN GÖSTERGESİ (2 KOLONLU DÜZEN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center border-y border-slate-800 py-3">
              {/* KALEM DETAYLARI */}
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Ara Toplam:</span>
                  <span className="text-white" style={{ color: '#ffffff' }}>₺{summary.rawTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between text-amber-300 font-bold" style={{ color: '#fcd34d' }}>
                    <span>Toplam İskonto:</span>
                    <span>-₺{summary.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 font-bold">
                  <span>KDV Matrahı (%{globalTaxRate}):</span>
                  <span className="text-white" style={{ color: '#ffffff' }}>₺{summary.taxBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {globalTaxRate > 0 && (
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>KDV Tutarı (%{globalTaxRate}):</span>
                    <span className="text-slate-200">₺{summary.totalTax.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* ANA GENEL TOPLAM GÖSTERGESİ */}
              <div className="bg-slate-950 p-3 rounded-xl border-2 border-teal-500/40 flex flex-col justify-center items-end shadow-inner" style={{ backgroundColor: '#020617' }}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  GENEL TOPLAM (TUTAR)
                </span>
                <span className="text-teal-300 font-black text-3xl font-mono tracking-tight" style={{ color: '#2dd4bf' }}>
                  ₺{summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                {selectedCurrency !== 'TRY' && (
                  <div className="text-amber-300 font-mono text-base font-black pt-1 border-t border-slate-800 w-full text-right" style={{ color: '#fcd34d' }}>
                    Ödenecek: {currencySymbol}{convertedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                  </div>
                )}
              </div>
            </div>

            {/* HIZLI AKSİYON ÖDEME BUTONLARI (TEK SATIR 4 BUTON) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={cartItems.length === 0 || isProcessing}
                onClick={handleQuickCashSale}
                className="py-3 px-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <DollarSign size={16} />
                NAKİT [F2]
              </button>

              <button
                disabled={cartItems.length === 0 || isProcessing}
                onClick={handleQuickPosSale}
                className="py-3 px-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CreditCard size={16} />
                POS [F3]
              </button>

              <button
                disabled={cartItems.length === 0 || isProcessing}
                onClick={() => setIsSplitModalOpen(true)}
                className="py-3 px-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Zap size={15} />
                PARÇALI [F4]
              </button>

              <button
                disabled={cartItems.length === 0 || isProcessing}
                onClick={handleParkSale}
                className="py-3 px-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Clock size={15} />
                ASKI [F8]
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: SEPET & MÜŞTERİ SEÇİMİ (GENİŞ SEPET TABLOSU) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3.5 min-h-0">
          {/* 1. MÜŞTERİ / CARİ SEÇİMİ */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border-2 border-slate-700 relative shrink-0 shadow-xl" style={{ backgroundColor: '#0f172a' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider" style={{ color: '#ffffff' }}>
                <User size={16} className="text-teal-400" style={{ color: '#2dd4bf' }} />
                Müşteri (Cari)
              </label>
              {selectedCari ? (
                <button
                  onClick={() => setSelectedCari(null)}
                  className="text-xs font-black text-amber-300 hover:underline cursor-pointer"
                  style={{ color: '#fcd34d' }}
                >
                  Perakendeye Dön
                </button>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Perakende Satış
                </span>
              )}
            </div>

            {selectedCari ? (
              <div className="p-2.5 bg-teal-500/10 border border-teal-400/40 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-white" style={{ color: '#ffffff' }}>{selectedCari.name}</h5>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {selectedCari.code} • Bakiye:{' '}
                    <strong className={selectedCari.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ₺{selectedCari.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-500/20 text-teal-200 border border-teal-400/50">
                  Seçili Cari
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={cariSearchTerm}
                  onFocus={() => setIsCariDropdownOpen(true)}
                  onChange={(e) => {
                    setCariSearchTerm(e.target.value);
                    setIsCariDropdownOpen(true);
                  }}
                  placeholder="Müşteri Ara veya 'Perakende Müşteri'..."
                  className="w-full px-3 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-bold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                  style={{ backgroundColor: '#020617', color: '#ffffff' }}
                />

                {isCariDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border-2 border-slate-600 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCari(null);
                        setIsCariDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-800 text-xs font-black text-teal-300 border-b border-slate-700 cursor-pointer"
                    >
                      🛒 Perakende Müşteri (Kasasız Anında Satış)
                    </button>
                    {filteredCariler.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCari(c);
                          setIsCariDropdownOpen(false);
                          setCariSearchTerm('');
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-white border-b border-slate-700/60 last:border-none flex justify-between cursor-pointer font-medium"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="font-mono text-xs text-teal-300 font-bold">
                          ₺{c.balance.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SEPET TABLOSU (SAĞ PANELİ TAM KAPLAR VE RAHATÇA UZAR) */}
          <PosCartTable
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onUpdateDiscount={handleUpdateDiscount}
            onUpdateUnitPrice={handleUpdateUnitPrice}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>

      {/* PARÇALI ÖDEME MODALI */}
      <PosSplitPaymentModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        grandTotal={summary.grandTotal}
        bankAccounts={bankAccounts}
        selectedCari={selectedCari}
        onConfirmPayment={executeSale}
      />

      {/* FİŞ / FİŞ YAZDIRMA MODALI */}
      <PosReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleSummary={completedSaleSummary}
      />

      {/* ASKIDAKİ SATIŞLAR MODALI */}
      <PosParkedSalesModal
        isOpen={isParkedModalOpen}
        onClose={() => setIsParkedModalOpen(false)}
        parkedSales={parkedSales}
        onRestoreSale={handleRestoreParkedSale}
        onDeleteSale={(id) => setParkedSales((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  );
};
