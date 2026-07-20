import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Cari, Stock, BankAccount, InvoiceItem } from '../../types';
import { createTransaction, removeTransaction } from '../../firebase';
import { Plus, Trash2, X, Search, FileText, CreditCard, Wallet, AlertCircle, Check, ScanBarcode, ArrowRightLeft, DollarSign, FileCheck, Scan, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import BarcodeScannerModal from '../BarcodeScannerModal';
import { parseScannedQrCode } from '../../utils/formatters';
import { fetchTCMBRates, calculateExchangeRate } from '../../utils/tcmbService';

export interface IslemModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return';
  editingTransaction: Transaction | null;
  preselectedCariId?: string;
  cariler: Cari[];
  stoklar: Stock[];
  bankAccounts?: BankAccount[];
  aiPrefilledData?: any;
  onClearAiData?: () => void;
}

export function IslemModal({
  isOpen,
  onClose,
  modalType,
  editingTransaction,
  preselectedCariId,
  cariler,
  stoklar,
  bankAccounts = [],
  aiPrefilledData,
  onClearAiData
}: IslemModalProps) {
const theme = useMemo(() => {
    switch (modalType) {
      case 'sale':
        return {
          color: 'teal',
          badge: 'Satış',
          typeLabel: 'Gelir Belgesi',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          hover: 'hover:bg-emerald-600',
          btnBg: 'bg-emerald-500',
          focusRing: 'focus:border-emerald-500/50 focus:ring-emerald-500/20',
          accentColor: '#10b981'
        };
      case 'purchase':
        return {
          color: 'rose',
          badge: 'Alış',
          typeLabel: 'Gider Belgesi',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          hover: 'hover:bg-rose-600',
          btnBg: 'bg-rose-500',
          focusRing: 'focus:border-rose-500/50 focus:ring-rose-500/20',
          accentColor: '#f43f5e'
        };
      case 'sale_return':
        return {
          color: 'amber',
          badge: 'Satış İade',
          typeLabel: 'Giriş/İade Belgesi',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          hover: 'hover:bg-amber-600',
          btnBg: 'bg-amber-500',
          focusRing: 'focus:border-amber-500/50 focus:ring-amber-500/20',
          accentColor: '#f59e0b'
        };
      case 'purchase_return':
        return {
          color: 'cyan',
          badge: 'Alış İade',
          typeLabel: 'Çıkış/İade Belgesi',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/20',
          hover: 'hover:bg-cyan-600',
          btnBg: 'bg-cyan-500',
          focusRing: 'focus:border-cyan-500/50 focus:ring-cyan-500/20',
          accentColor: '#06b6d4'
        };
      case 'collection':
        return {
          color: 'teal',
          badge: 'Tahsilat',
          typeLabel: 'Kasa Girişi',
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          border: 'border-teal-500/20',
          hover: 'hover:bg-teal-600',
          btnBg: 'bg-teal-500',
          focusRing: 'focus:border-teal-500/50 focus:ring-teal-500/20',
          accentColor: '#14b8a6'
        };
      case 'payment':
        return {
          color: 'rose',
          badge: 'Ödeme',
          typeLabel: 'Kasa Çıkışı',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          hover: 'hover:bg-rose-600',
          btnBg: 'bg-rose-500',
          focusRing: 'focus:border-rose-500/50 focus:ring-rose-500/20',
          accentColor: '#f43f5e'
        };
      default:
        return {
          color: 'teal',
          badge: 'İşlem',
          typeLabel: 'Belge',
          bg: 'bg-white/5',
          text: 'text-white',
          border: 'border-white/10',
          hover: 'hover:bg-white/10',
          btnBg: 'bg-white',
          focusRing: 'focus:border-white/30',
          accentColor: '#ffffff'
        };
    }
  }, [modalType]);
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states
  const [invoiceNo, setInvoiceNo] = useState('');
  const [selectedCariId, setSelectedCariId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().substring(0, 10));
  const [account, setAccount] = useState<'cash' | 'bank' | ''>('cash');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [receiptAmount, setReceiptAmount] = useState<number>(0);

  // Multi-Currency & Custom Exchange Rate states
  const [transactionCurrency, setTransactionCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [customConvertedAmount, setCustomConvertedAmount] = useState<number>(0);
  const [isMultiCurrency, setIsMultiCurrency] = useState<boolean>(false);
  const [isConvertedAmountEdited, setIsConvertedAmountEdited] = useState<boolean>(false);

  // Dynamic Invoice Line items
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }
  ]);

  const isInvoice = useMemo(() => ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType), [modalType]);
const activeCariCurrency = useMemo(() => {
    const selectedCari = cariler.find(c => c.id === selectedCariId);
    return selectedCari?.currency || 'TRY';
  }, [selectedCariId, cariler]);

  const [tcmbLoading, setTcmbLoading] = useState(false);

  // Fetch live TCMB exchange rate when currencies differ
  useEffect(() => {
    if (transactionCurrency === activeCariCurrency) {
      setExchangeRate(1);
      setIsMultiCurrency(false);
      return;
    }
    setIsMultiCurrency(true);

    const fetchLiveRate = async () => {
      try {
        const ratesResult = await fetchTCMBRates(false);
        const rate = calculateExchangeRate(ratesResult, transactionCurrency, activeCariCurrency);
        setExchangeRate(rate);
      } catch (e) {
        console.warn('TCMB kurları alınamadı (Çevrimdışı)', e);
      }
    };
    fetchLiveRate();
  }, [transactionCurrency, activeCariCurrency]);

  const handleForceTcmbRate = async () => {
    setTcmbLoading(true);
    try {
      const ratesResult = await fetchTCMBRates(true);
      const rate = calculateExchangeRate(ratesResult, transactionCurrency, activeCariCurrency);
      setExchangeRate(rate);
    } catch (e) {
      console.warn('TCMB kurları güncellenemedi', e);
    } finally {
      setTcmbLoading(false);
    }
  };

  // Sync transaction currency when a Cari is selected
  useEffect(() => {
    const selectedCari = cariler.find(c => c.id === selectedCariId);
    if (selectedCari) {
      const cur = selectedCari.currency || 'TRY';
      setTransactionCurrency(cur);
      setCustomConvertedAmount(0);
      setIsConvertedAmountEdited(false);
    }
  }, [selectedCariId, cariler]);

  // Handle physical barcode scanner input globally
  useEffect(() => {
    const handleHardwareScan = (e: Event) => {
      const customEvent = e as CustomEvent;
      const code = (customEvent.detail.code || '').trim();
      if (!code) return;

      if (isOpen && ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
        const scannedStock = stoklar.find(s => s.barcode === code || s.code === code);
        if (scannedStock) {
          const existingItemIndex = invoiceItems.findIndex(item => item.stockId === scannedStock.id);
          if (existingItemIndex >= 0) {
            const updatedItems = [...invoiceItems];
            const item = updatedItems[existingItemIndex];
            const newQty = (item.quantity || 0) + 1;
            updatedItems[existingItemIndex] = {
              ...item,
              quantity: newQty,
              total: newQty * item.price * (1 + item.taxRate / 100)
            };
            setInvoiceItems(updatedItems);
          } else {
            const price = modalType === 'sale' || modalType === 'sale_return' 
              ? scannedStock.salesPrice 
              : scannedStock.purchasePrice;
            const emptyRowIndex = invoiceItems.findIndex(item => !item.stockId);
            const newItem = {
              stockId: scannedStock.id,
              stockName: scannedStock.name,
              quantity: 1,
              unit: scannedStock.unit,
              price: price,
              taxRate: scannedStock.taxRate,
              total: price * (1 + scannedStock.taxRate / 100)
            };
            if (emptyRowIndex >= 0) {
              const updatedItems = [...invoiceItems];
              updatedItems[emptyRowIndex] = newItem;
              setInvoiceItems(updatedItems);
            } else {
              setInvoiceItems([...invoiceItems, newItem]);
            }
          }
          setFormError('');

          // Electronic beep audio confirmation
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
          } catch (soundErr) {
            console.warn('Scan sound play failed', soundErr);
          }
        } else {
          setFormError(`"${code}" barkoduna sahip ürün bulunamadı.`);
        }
      }
    };

    window.addEventListener('global-hardware-barcode-scan', handleHardwareScan);
    return () => {
      window.removeEventListener('global-hardware-barcode-scan', handleHardwareScan);
    };
  }, [isOpen, modalType, invoiceItems, stoklar]);

  // Calculate default converted amount based on rate & currencies
  const invoiceTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let grandTotal = 0;

    invoiceItems.forEach(item => {
      const itemSubtotal = (item.quantity || 0) * (item.price || 0);
      const itemTax = itemSubtotal * ((item.taxRate || 0) / 100);
      subtotal += itemSubtotal;
      totalTax += itemTax;
      grandTotal += item.total || 0;
    });

    return { subtotal, totalTax, grandTotal };
  }, [invoiceItems]);

  const autoConvertedAmount = useMemo(() => {
    const amt = (modalType === 'sale' || modalType === 'purchase') ? invoiceTotals.grandTotal : receiptAmount;
    if (transactionCurrency === activeCariCurrency) return amt;
    if (exchangeRate <= 0) return amt;
    
    // Turkish accounting patterns:
    if ((transactionCurrency === 'USD' || transactionCurrency === 'EUR') && activeCariCurrency === 'TRY') {
      return Number((amt * exchangeRate).toFixed(2));
    }
    if (transactionCurrency === 'TRY' && (activeCariCurrency === 'USD' || activeCariCurrency === 'EUR')) {
      return Number((amt / exchangeRate).toFixed(2));
    }
    return Number((amt * exchangeRate).toFixed(2));
  }, [receiptAmount, invoiceTotals.grandTotal, transactionCurrency, activeCariCurrency, exchangeRate, modalType, invoiceTotals]);

  // Sync customConvertedAmount with autoConvertedAmount when not manually overridden
  useEffect(() => {
    if (!isConvertedAmountEdited) {
      setCustomConvertedAmount(autoConvertedAmount);
    }
  }, [autoConvertedAmount, isConvertedAmountEdited]);

  // Search and filter transactions
  
  // Init state when modal opens or editingTransaction/aiPrefilledData changes
  useEffect(() => {
    if (!isOpen) return;

    if (aiPrefilledData) {
      setFormError('');
      setIsConvertedAmountEdited(false);
      setTransactionCurrency('TRY');
      setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
      setTransactionDate(new Date().toISOString().substring(0, 10));
      setAccount('cash');
      setDescription('Storm AI tarafından otomatik dolduruldu.');

      let cariId = '';
      if (aiPrefilledData.cariAdi) {
        const query = aiPrefilledData.cariAdi.toLocaleLowerCase('tr-TR').trim();
        let matchedCari = cariler.find(c => c.name.toLocaleLowerCase('tr-TR').includes(query));
        if (!matchedCari) {
          const words = query.split(' ').filter(w => w.length > 2);
          if (words.length > 0) {
            matchedCari = cariler.find(c => words.some(w => c.name.toLocaleLowerCase('tr-TR').includes(w)));
          }
        }
        if (matchedCari) {
          cariId = matchedCari.id;
        }
      }
      setSelectedCariId(cariId);

      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
        let stockId = '';
        let matchedPrice = 0;
        let matchedUnit = 'Adet';
        let matchedStockName = aiPrefilledData.urunAdi || '';

        if (aiPrefilledData.urunAdi) {
           const query = aiPrefilledData.urunAdi.toLocaleLowerCase('tr-TR').trim();
           let matchedStok = stoklar.find(s => s.name.toLocaleLowerCase('tr-TR').includes(query));
           if (!matchedStok) {
             const words = query.split(' ').filter(w => w.length > 2);
             if (words.length > 0) {
               matchedStok = stoklar.find(s => words.some(w => s.name.toLocaleLowerCase('tr-TR').includes(w)));
             }
           }
           if (matchedStok) {
             stockId = matchedStok.id;
             matchedStockName = matchedStok.name;
             matchedPrice = ['sale', 'sale_return'].includes(modalType) ? matchedStok.salesPrice : matchedStok.purchasePrice;
             matchedUnit = matchedStok.unit || 'Adet';
           }
        }

        const qty = aiPrefilledData.miktar || 1;
        const price = aiPrefilledData.fiyat || matchedPrice || 1;
        const taxRate = aiPrefilledData.kdv !== undefined ? aiPrefilledData.kdv : 0;
        
        setInvoiceItems([{ stockId, stockName: matchedStockName, quantity: qty, unit: matchedUnit, price, taxRate, total: qty * price }]);
      }
      
      if (onClearAiData) onClearAiData();
      return;
    }

    if (editingTransaction) {
      setFormError('');
      setSelectedCariId(editingTransaction.cariId);
      setTransactionDate(editingTransaction.date);
      setAccount(editingTransaction.account || '');
      setSelectedBankAccountId(editingTransaction.bankAccountId || '');
      setDescription(editingTransaction.description || '');
      setInvoiceNo(editingTransaction.invoiceNo || '');
      setIsMultiCurrency(!!(editingTransaction.currency && editingTransaction.currency !== 'TRY' && editingTransaction.exchangeRate));
      setTransactionCurrency(editingTransaction.currency || 'TRY');
      setExchangeRate(editingTransaction.exchangeRate || 1);
      if (editingTransaction.exchangeRate && editingTransaction.exchangeRate !== 1) {
          setIsConvertedAmountEdited(true);
          setCustomConvertedAmount(editingTransaction.convertedAmount || (editingTransaction.amount * editingTransaction.exchangeRate));
      } else {
          setIsConvertedAmountEdited(false);
          setCustomConvertedAmount(0);
      }
      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
        if (editingTransaction.items && editingTransaction.items.length > 0) {
          setInvoiceItems(editingTransaction.items);
        } else {
          setInvoiceItems([{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }]);
        }
      } else {
        setReceiptAmount(editingTransaction.amount);
      }
    } else {
      setFormError('');
      // No editingTransaction means it's a "New" action
      setSelectedCariId(preselectedCariId || '');
      setTransactionDate(new Date().toISOString().substring(0, 10));
      setAccount(['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType) ? '' : 'cash');
      setDescription('');
      setReceiptAmount(0);
      
      const pad = (n) => String(n).padStart(4, '0');
      const year = new Date().getFullYear();
      
      let prefix = '';
      if (modalType === 'sale') prefix = `SAT-${year}-`;
      else if (modalType === 'purchase') prefix = `AL-${year}-`;
      else if (modalType === 'sale_return') prefix = `IADE-S-${year}-`;
      else if (modalType === 'purchase_return') prefix = `IADE-A-${year}-`;
      
      if (prefix) {
        setInvoiceNo(`${prefix}${pad(Math.floor(Math.random()*10000))}`); // Simple random or keep blank for now
      } else {
        setInvoiceNo('');
      }
      setInvoiceItems([{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }]);
    }
  }, [isOpen, editingTransaction, aiPrefilledData, modalType, preselectedCariId]);

const handleItemFieldChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceItems];
    const item = updated[index];

    if (field === 'stockId') {
      const selectedStock = stoklar.find(s => s.id === value);
      if (selectedStock) {
        item.stockId = selectedStock.id;
        item.stockName = selectedStock.name;
        item.unit = selectedStock.unit;
        // set default price: sale invoice uses salesPrice, purchase invoice uses purchasePrice
        item.price = modalType === 'sale' ? selectedStock.salesPrice : selectedStock.purchasePrice;
        item.taxRate = selectedStock.taxRate;
      } else {
        item.stockId = '';
        item.stockName = '';
        item.unit = 'Adet';
        item.price = 0;
        item.taxRate = 20;
      }
    } else {
      (item as any)[field] = value;
    }

    // Recalculate total for this row
    const qty = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.taxRate || 0;
    item.total = qty * price * (1 + tax / 100);

    setInvoiceItems(updated);
  };

  // Add line item to invoice
  const addInvoiceItemRow = () => {
    setInvoiceItems([
      ...invoiceItems,
      { stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }
    ]);
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const parsed = parseScannedQrCode(barcodeInput);
    const scannedStock = stoklar.find(s => s.barcode === parsed || s.code === parsed);
    
    if (scannedStock) {
      // Check if already in invoice
      const existingItemIndex = invoiceItems.findIndex(item => item.stockId === scannedStock.id);
      
      if (existingItemIndex >= 0) {
        // Increment quantity
        const updatedItems = [...invoiceItems];
        const item = updatedItems[existingItemIndex];
        const newQty = (item.quantity || 0) + 1;
        
        updatedItems[existingItemIndex] = {
          ...item,
          quantity: newQty,
          total: newQty * item.price * (1 + item.taxRate / 100)
        };
        setInvoiceItems(updatedItems);
      } else {
        // Add new line item
        const price = modalType === 'sale' ? scannedStock.salesPrice : scannedStock.purchasePrice;
        
        // Check if there is an empty row we can fill
        const emptyRowIndex = invoiceItems.findIndex(item => !item.stockId);
        
        const newItem = {
          stockId: scannedStock.id,
          stockName: scannedStock.name,
          quantity: 1,
          unit: scannedStock.unit,
          price: price,
          taxRate: scannedStock.taxRate,
          total: price * (1 + scannedStock.taxRate / 100)
        };

        if (emptyRowIndex >= 0) {
          const updatedItems = [...invoiceItems];
          updatedItems[emptyRowIndex] = newItem;
          setInvoiceItems(updatedItems);
        } else {
          setInvoiceItems([...invoiceItems, newItem]);
        }
      }
      setBarcodeInput('');
    } else {
      setFormError(`"${parsed}" kodlu/barkodlu ürün bulunamadı.`);
    }
  };

  // Remove line item from invoice
  const removeInvoiceItemRow = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Handle transaction editing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCariId) {
      setFormError('Lütfen bir cari hesap seçin.');
      return;
    }

    const selectedCari = cariler.find(c => c.id === selectedCariId);
    if (!selectedCari) {
      setFormError('Seçilen cari hesap sistemde bulunamadı.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
        // Validate Invoice Rows
        const validItems = invoiceItems.filter(item => item.stockId !== '');
        if (validItems.length === 0) {
          setFormError('Faturaya en az bir ürün veya hizmet eklemelisiniz.');
          setIsSubmitting(false);
          return;
        }

        const islemData: Omit<Transaction, 'id'> = {
          invoiceNo: invoiceNo || undefined,
          type: modalType,
          cariId: selectedCari.id,
          cariName: selectedCari.name,
          date: transactionDate,
          amount: invoiceTotals.grandTotal,
          account: account, // optional payment account if paid immediately
          bankAccountId: (account === 'cash' || account === 'bank' || account === 'pos') && selectedBankAccountId ? selectedBankAccountId : undefined,
          description: description || (modalType === 'sale' ? 'Satış Faturası' : modalType === 'purchase' ? 'Alış Faturası' : modalType === 'sale_return' ? 'Satıştan İade Faturası' : 'Alıştan İade Faturası'),
          items: validItems,
          createdAt: editingTransaction?.createdAt || new Date().toISOString(),
          currency: isMultiCurrency ? transactionCurrency : (selectedCari.currency || 'TRY'),
          exchangeRate: isMultiCurrency ? exchangeRate : undefined,
          convertedAmount: isMultiCurrency ? customConvertedAmount : undefined
        };

        if (editingTransaction) {
          await removeTransaction(editingTransaction);
        }
        await createTransaction(islemData);
      } else {
        // Receipt (collection or payment)
        if (receiptAmount <= 0) {
          setFormError('Lütfen sıfırdan büyük bir tutar girin.');
          setIsSubmitting(false);
          return;
        }

        if (!account) {
          setFormError('Lütfen ödeme hesabını (Kasa/Banka) seçin.');
          setIsSubmitting(false);
          return;
        }

        const islemData: Omit<Transaction, 'id'> = {
          type: modalType,
          cariId: selectedCari.id,
          cariName: selectedCari.name,
          date: transactionDate,
          amount: receiptAmount,
          account: account,
          bankAccountId: (account === 'cash' || account === 'bank' || account === 'pos') && selectedBankAccountId ? selectedBankAccountId : undefined,
          description: description || `${modalType === 'collection' ? 'Tahsilat' : 'Ödeme'} Makbuzu`,
          createdAt: editingTransaction?.createdAt || new Date().toISOString(),
          currency: isMultiCurrency ? transactionCurrency : (selectedCari.currency || 'TRY'),
          exchangeRate: isMultiCurrency ? exchangeRate : undefined,
          convertedAmount: isMultiCurrency ? customConvertedAmount : undefined
        };

        if (editingTransaction) {
          await removeTransaction(editingTransaction);
        }
        await createTransaction(islemData);
      }

      
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError('İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const formatCurrency = (val: number, cur: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };
  
  if (!isOpen) return null;

  return (
    <>
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className={`bg-white rounded-xl border border-slate-200 w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in transition-all duration-300 ${isInvoice ? 'max-w-5xl' : 'max-w-lg'}`}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white border-l-4" style={{ borderLeftColor: 'var(--accent-500)' }}>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
                  {editingTransaction ? (
                    `GÜNCELLE: ${theme.badge} ${isInvoice ? 'FATURASI' : 'MAKBUZU'}`
                  ) : (
                    `YENİ ${theme.badge} ${isInvoice ? 'FATURASI' : 'MAKBUZU'}`
                  )}
                </h3>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1 block">
                  {modalType === 'sale' ? 'Müşterinize keseceğiniz faturayı ve kalemleri girin.' :
                   modalType === 'purchase' ? 'Tedarikçinizden aldığınız faturayı ve kalemleri girin.' :
                   modalType === 'sale_return' ? 'Müşterinizden gelen iade faturası ve kalemleri girin.' :
                   modalType === 'purchase_return' ? 'Tedarikçinize gönderdiğiniz iade faturası ve kalemleri girin.' :
                   modalType === 'collection' ? 'Müşterinizden yaptığınız tahsilat bilgilerini girin.' :
                   'Tedarikçinize yaptığınız ödeme bilgilerini girin.'}
                </span>
              </div>
              <button 
                id="btn-close-islem-modal"
                type="button"
                onClick={() => onClose()}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-600 font-medium animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Bir hata oluştu:</span>
                    <p className="mt-0.5 text-rose-700">{formError}</p>
                  </div>
                </div>
              )}

              {isInvoice ? (
                // Elegant Integrated Layout for Invoices (Single clean stream, no black bento boxes)
                <div className="space-y-6">
                  {/* Row 1: Cari, Tarih, Ödeme Durumu/Tipi */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cari Hesap Seçimi */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-mono">Cari Hesap Seçimi *</label>
                      <select 
                        id="form-islem-cari"
                        required
                        value={selectedCariId}
                        onChange={(e) => setSelectedCariId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-xs text-slate-900 transition font-medium cursor-pointer"
                      >
                        <option value="">-- Cari Seçin --</option>
                        {cariler.filter(cari => cari.isActive !== false).map(cari => (
                          <option key={cari.id} value={cari.id}>
                            {cari.name} ({cari.type === 'customer' ? 'Müşteri' : cari.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi'}) - [{cari.currency || 'TRY'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* İşlem Tarihi */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-mono">İşlem Tarihi</label>
                      <input 
                        id="form-islem-date"
                        type="date"
                        required
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-xs text-slate-900 transition font-medium"
                      />
                    </div>

                    {/* Ödeme Durumu / Tipi */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-mono">Ödeme Durumu / Tipi</label>
                      <select 
                        id="form-islem-account"
                        value={account}
                        onChange={(e) => {
                          setAccount(e.target.value as any);
                          setSelectedBankAccountId('');
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-xs text-slate-900 transition font-medium cursor-pointer"
                      >
                        <option value="">⏳ Açık Hesap / Vadeli (Borçlandır)</option>
                        <option value="cash">💵 Kasa (Nakit)</option>
                        <option value="bank">🏦 Banka (Havale/EFT)</option>
                        <option value="pos">💳 POS (Kredi Kartı)</option>
                      </select>
                    </div>
                  </div>

                  {/* Kasa/Banka Detay */}
                  {(account === 'cash' || account === 'bank' || account === 'pos') && bankAccounts.length > 0 && (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1.5 font-mono">İşlem Yapılacak Kasa/Banka *</label>
                      <select 
                        required
                        value={selectedBankAccountId}
                        onChange={(e) => setSelectedBankAccountId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-teal-50 border border-teal-200 focus:border-teal-500 focus:ring-teal-500 text-teal-950 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <option value="">-- Kasa/Banka Seçiniz --</option>
                        {bankAccounts.filter(a => account === 'cash' ? a.type === 'kasa' : account === 'pos' ? a.type === 'pos' : a.type === 'banka').map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fatura / Belge Numarası */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-mono">Fatura / Belge Numarası</label>
                    <input 
                      id="form-islem-invoice-no"
                      type="text"
                      placeholder="Örn: FT-2026-0001"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-xs text-slate-900 font-mono transition"
                    />
                  </div>

                  {/* Fatura Kalemleri (Ürün / Hizmet Satırları) */}
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fatura Kalemleri (Ürün / Hizmet Satırları)</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Barcode scan box */}
                        <div className="relative flex-1 sm:w-48">
                          <input 
                            type="text"
                            placeholder="Barkod okutun..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleBarcodeScan(e as any);
                              }
                            }}
                            className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-[11px] font-mono focus:border-teal-500 focus:ring-teal-500 transition placeholder-slate-400"
                          />
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            title="Kamera ile Barkod / QR Oku"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-700 transition cursor-pointer animate-pulse"
                          >
                            <Scan size={12} />
                          </button>
                        </div>

                        <button 
                          id="btn-add-row"
                          type="button"
                          onClick={addInvoiceItemRow}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition cursor-pointer shrink-0"
                        >
                          <PlusCircle size={13} />
                          <span>Satır Ekle</span>
                        </button>
                      </div>
                    </div>

                    {/* Items Row list */}
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {invoiceItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="group flex flex-col md:flex-row gap-3 items-stretch md:items-end bg-slate-50 hover:bg-slate-100/70 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition duration-150 relative"
                        >
                          {/* Product Select */}
                          <div className="flex-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Seçilen Ürün *</label>
                            <select 
                              id={`form-row-stock-${index}`}
                              required
                              value={item.stockId}
                              onChange={(e) => handleItemFieldChange(index, 'stockId', e.target.value)}
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 text-slate-900 rounded-md text-xs focus:outline-hidden focus:border-teal-500 transition font-medium"
                            >
                              <option value="">
                                {item.stockId === '' && item.stockName ? `🤖 Bulunamadı: "${item.stockName}"` : '-- Ürün / Hizmet Seçin --'}
                              </option>
                              {stoklar.map(stok => (
                                <option key={stok.id} value={stok.id}>
                                  {stok.name} {stok.brand ? `[${stok.brand}]` : ''} {stok.category ? `(${stok.category})` : ''} (Mevcut: {stok.quantity} {stok.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Miktar */}
                          <div className="w-full md:w-28">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Miktar</label>
                            <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden focus-within:border-teal-500 transition">
                              <input 
                                id={`form-row-qty-${index}`}
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity || ''}
                                onChange={(e) => handleItemFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-2 bg-transparent text-xs text-center text-slate-900 focus:outline-hidden font-mono font-semibold"
                              />
                              <span className="px-2 text-[10px] bg-slate-50 font-bold text-slate-400 border-l border-slate-100">{item.unit}</span>
                            </div>
                          </div>

                          {/* Birim Fiyat */}
                          <div className="w-full md:w-36">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Birim Fiyat (KDV Hariç)</label>
                            <div className="relative">
                              <input 
                                id={`form-row-price-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={item.price || ''}
                                onChange={(e) => handleItemFieldChange(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full pl-2 pr-7 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-bold font-mono focus:outline-hidden focus:border-teal-500 transition"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                                {isMultiCurrency ? transactionCurrency : activeCariCurrency}
                              </span>
                            </div>
                          </div>

                          {/* KDV % */}
                          <div className="w-full md:w-20">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">KDV %</label>
                            <select 
                              id={`form-row-tax-${index}`}
                              value={item.taxRate}
                              onChange={(e) => handleItemFieldChange(index, 'taxRate', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-2 bg-white border border-slate-200 text-slate-900 rounded-md text-xs focus:outline-hidden focus:border-teal-500 font-mono transition cursor-pointer"
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="10">10</option>
                              <option value="20">20</option>
                            </select>
                          </div>

                          {/* Satır Toplamı */}
                          <div className="w-full md:w-32 text-right">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Satır Toplamı</label>
                            <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-2.5 rounded-md border border-slate-200 font-mono">
                              {formatCurrency(item.total, isMultiCurrency ? transactionCurrency : activeCariCurrency)}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="flex items-center justify-end md:justify-center md:pb-1">
                            <button 
                              id={`btn-remove-row-${index}`}
                              type="button"
                              disabled={invoiceItems.length === 1}
                              onClick={() => removeInvoiceItemRow(index)}
                              className="p-2 text-slate-300 hover:text-rose-500 disabled:opacity-25 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Satırı Sil"
                            >
                              <MinusCircle size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Calculations Panel & Currencies split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 items-end">
                      {/* Exchange Rates if needed */}
                      <div className="text-left text-slate-500 text-[10px] space-y-1 font-sans">
                        {isMultiCurrency && (
                          <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 font-mono space-y-1 animate-fade-in">
                            <div className="font-bold uppercase tracking-wider text-[8px] text-teal-600">Dövizli İşlem Aktif</div>
                            <div>Seçilen Kur: 1 {transactionCurrency} = {exchangeRate} {activeCariCurrency}</div>
                            <div>Cariye Yansıyacak Tutar: <span className="font-bold text-slate-900">{formatCurrency(customConvertedAmount, activeCariCurrency)}</span></div>
                          </div>
                        )}
                      </div>

                      {/* Beautiful Calculations Receipt */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs space-y-2.5 relative overflow-hidden max-w-sm ml-auto w-full">
                        <div className="flex justify-between text-[11px] font-mono text-slate-500">
                          <span>Matrah:</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(invoiceTotals.subtotal, isMultiCurrency ? transactionCurrency : activeCariCurrency)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-500 pb-2 border-b border-dashed border-slate-200">
                          <span>KDV Toplamı:</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(invoiceTotals.totalTax, isMultiCurrency ? transactionCurrency : activeCariCurrency)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono">Genel Toplam:</span>
                          <span className="font-extrabold font-mono text-red-700" style={{ fontSize: '18px' }}>
                            {formatCurrency(invoiceTotals.grandTotal, isMultiCurrency ? transactionCurrency : activeCariCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Clean Standard Layout for Simple Receipt (Collection / Payment)
                <div className="space-y-6 animate-fade-in font-sans">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <CreditCard size={15} className={theme.text} />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{theme.badge} Bilgileri</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cari */}
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Cari Hesap *</label>
                      <select 
                        id="form-islem-cari"
                        required
                        value={selectedCariId}
                        onChange={(e) => setSelectedCariId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 transition font-medium cursor-pointer font-sans"
                      >
                        <option value="">-- Cari Hesap Seçin --</option>
                        {cariler.filter(cari => cari.isActive !== false).map(cari => (
                          <option key={cari.id} value={cari.id}>
                            {cari.name} ({cari.type === 'customer' ? 'Müşteri' : cari.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi'}) - [{cari.currency || 'TRY'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tarih */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">İşlem Tarihi</label>
                      <input 
                        id="form-islem-date"
                        type="date"
                        required
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 transition font-medium font-mono"
                      />
                    </div>

                    {/* Hesap Tipi */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Kasa / Banka Türü *</label>
                      <select 
                        id="form-islem-account"
                        required
                        value={account}
                        onChange={(e) => {
                          setAccount(e.target.value as any);
                          setSelectedBankAccountId('');
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 transition cursor-pointer font-sans"
                      >
                        <option value="cash">💵 Kasa (Nakit)</option>
                        <option value="bank">🏦 Banka (Havale/EFT)</option>
                        <option value="pos">💳 POS (Kredi Kartı)</option>
                      </select>
                    </div>

                    {/* Kasa/Banka Detay */}
                    {(account === 'cash' || account === 'bank' || account === 'pos') && bankAccounts.length > 0 && (
                      <div className="sm:col-span-2 animate-fade-in">
                        <label className="block text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-1.5 font-mono">İşlem Yapılacak Hesap</label>
                        <select 
                          required
                          value={selectedBankAccountId}
                          onChange={(e) => setSelectedBankAccountId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs focus:outline-hidden transition font-medium cursor-pointer font-sans"
                        >
                          <option value="">-- Hesap Seçiniz --</option>
                          {bankAccounts.filter(a => account === 'cash' ? a.type === 'kasa' : account === 'pos' ? a.type === 'pos' : a.type === 'banka').map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Receipt Amount Input */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">İşlem Tutarı *</label>
                    <div className="relative">
                      <input 
                        id="form-receipt-amount"
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={receiptAmount || ''}
                        onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-xl font-bold focus:outline-hidden transition font-mono ${
                          modalType === 'collection' ? 'text-emerald-600 border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10' : 'text-rose-600 border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                        {isMultiCurrency ? transactionCurrency : activeCariCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Farklı Para Birimi checkbox trigger */}
              {!isInvoice && selectedCariId && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isMultiCurrency}
                        onChange={(e) => {
                          setIsMultiCurrency(e.target.checked);
                          if (e.target.checked) {
                            const selectedCari = cariler.find(c => c.id === selectedCariId);
                            setTransactionCurrency(selectedCari?.currency || 'TRY');
                          }
                        }}
                        className="rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500"
                      />
                      <span>Farklı Para Birimi / Döviz Kuru Uygula</span>
                    </label>
                    <span className="text-[10px] text-slate-450 font-mono">Cari Para Birimi: <span className="font-bold text-teal-600">{activeCariCurrency}</span></span>
                  </div>

                  {isMultiCurrency && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 animate-fade-in">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">İşlem Birimi</label>
                        <select
                          value={transactionCurrency}
                          onChange={(e) => setTransactionCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded text-xs focus:outline-hidden focus:border-teal-500 font-medium cursor-pointer"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Kur</label>
                          <button
                            type="button"
                            onClick={handleForceTcmbRate}
                            disabled={tcmbLoading}
                            className="text-[9px] text-teal-600 hover:text-teal-800 font-bold font-sans flex items-center gap-1 transition cursor-pointer"
                          >
                            <RefreshCw size={8} className={tcmbLoading ? 'animate-spin' : ''} />
                            TCMB'den Çek
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.0001"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded text-xs focus:outline-hidden focus:border-teal-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Yansıyacak Tutar ({activeCariCurrency})</label>
                        <input
                          type="number"
                          step="0.01"
                          value={customConvertedAmount || ''}
                          onChange={(e) => {
                            setIsConvertedAmountEdited(true);
                            setCustomConvertedAmount(parseFloat(e.target.value) || 0);
                          }}
                          className="w-full px-3 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded text-xs focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Description Textarea */}
              <div className="w-full">
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 font-mono">İşlem Açıklaması</label>
                <textarea 
                  id="form-islem-desc"
                  rows={2}
                  placeholder="İşlem ile ilgili detaylı not veya açıklama girin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 transition font-sans"
                />
              </div>

              {/* Form Action Controls */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end w-full bg-transparent">
                <button 
                  id="btn-islem-cancel"
                  type="button"
                  onClick={() => onClose()}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  id="btn-islem-save"
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 text-[10px] uppercase tracking-wider font-extrabold text-white rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer ${
                    isSubmitting 
                      ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                      : 'bg-teal-600 hover:bg-teal-700 active:scale-98'
                  }`}
                >
                  {isSubmitting ? (editingTransaction ? 'Güncelleniyor...' : 'Kaydediliyor...') : (
                    <span className="flex items-center gap-1.5 font-sans">
                      <FileCheck size={14} /> 
                      {editingTransaction ? 'Değişiklikleri Kaydet' : 'İşlemi Onayla & Bitir'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      
<BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          const parsed = parseScannedQrCode(code);
          const scannedStock = stoklar.find(s => s.barcode === parsed || s.code === parsed);
          if (scannedStock) {
            const existingItemIndex = invoiceItems.findIndex(item => item.stockId === scannedStock.id);
            if (existingItemIndex >= 0) {
              const updatedItems = [...invoiceItems];
              const item = updatedItems[existingItemIndex];
              const newQty = (item.quantity || 0) + 1;
              updatedItems[existingItemIndex] = {
                ...item,
                quantity: newQty,
                total: newQty * item.price * (1 + item.taxRate / 100)
              };
              setInvoiceItems(updatedItems);
            } else {
              const price = modalType === 'sale' ? scannedStock.salesPrice : scannedStock.purchasePrice;
              const emptyRowIndex = invoiceItems.findIndex(item => !item.stockId);
              const newItem = {
                stockId: scannedStock.id,
                stockName: scannedStock.name,
                quantity: 1,
                unit: scannedStock.unit,
                price: price,
                taxRate: scannedStock.taxRate,
                total: price * (1 + scannedStock.taxRate / 100)
              };
              if (emptyRowIndex >= 0) {
                const updatedItems = [...invoiceItems];
                updatedItems[emptyRowIndex] = newItem;
                setInvoiceItems(updatedItems);
              } else {
                setInvoiceItems([...invoiceItems, newItem]);
              }
            }
            setFormError('');
          } else {
            setFormError(`"${parsed}" kodlu/barkodlu ürün bulunamadı.`);
          }
        }}
        title="Faturaya Ürün Barkod/QR Kod Okut"
        multiScan={true}
      />
    </>
  );
}
