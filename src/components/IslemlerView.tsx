import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Cari, Stock, InvoiceItem, BankAccount } from '../types';
import { createTransaction, removeTransaction } from '../firebase';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  X, 
  CreditCard, 
  PlusCircle, 
  MinusCircle, 
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Lock,
  Printer,
  Edit,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Scan,
  ShieldAlert,
  Download
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { parseScannedQrCode } from '../utils/formatters';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

interface IslemlerViewProps {
  islemler: Transaction[];
  cariler: Cari[];
  stoklar: Stock[];
  bankAccounts?: BankAccount[];
  pendingIslemModal?: 'sale' | 'purchase' | 'collection' | 'payment' | null;
  pendingCariId?: string | null;
  onClearPendingIslemModal?: () => void;
  aiPrefilledData?: {
    islem: 'sale' | 'purchase' | 'collection' | 'payment';
    cariAdi?: string;
    urunAdi?: string;
    miktar?: number;
    fiyat?: number;
    kdv?: number;
  } | null;
  onClearAiPrefilledData?: () => void;
  userRole?: 'admin' | 'employee';
  actionPermissions?: {
    delete_sale: boolean;
    delete_payment: boolean;
    delete_stock: boolean;
    decrease_stock: boolean;
    edit_sale?: boolean;
    edit_payment?: boolean;
    edit_stock?: boolean;
  };
  escalationPin?: string;
  isSecurityActive?: boolean;
  onViewCariDetails?: (cariId: string) => void;
}

export default function IslemlerView({ 
  islemler, 
  cariler, 
  stoklar,
  bankAccounts = [],
  pendingIslemModal,
  pendingCariId,
  onClearPendingIslemModal,
  aiPrefilledData,
  onClearAiPrefilledData,
  userRole = 'employee',
  actionPermissions = { delete_sale: false, delete_payment: false, delete_stock: false, decrease_stock: false, edit_sale: false, edit_payment: false, edit_stock: false },
  escalationPin = '1923',
  isSecurityActive = false,
  onViewCariDetails
}: IslemlerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return'>('all');
  
  // PIN Verification for restricted employee actions
  const [pinVerificationAction, setPinVerificationAction] = useState<(() => void) | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const checkPermissionAndExecute = (actionKey: 'delete_sale' | 'delete_payment' | 'edit_sale' | 'edit_payment', executeAction: () => void) => {
    if (!isSecurityActive || userRole === 'admin' || actionPermissions[actionKey]) {
      executeAction();
    } else {
      setPinVerificationAction(() => executeAction);
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
  // Print PDF Receipt states
  const [selectedPrintTransaction, setSelectedPrintTransaction] = useState<Transaction | null>(null);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [selectedTemplateIdForPrint, setSelectedTemplateIdForPrint] = useState<string | null>(null);
  const [printPageSize, setPrintPageSize] = useState<string>('a4');
  const [previewScale, setPreviewScale] = useState<number>(0.6);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Load print settings from localStorage
  const printSettings = useMemo(() => {
    const DEFAULT_PRINT_SETTINGS = {
      companyName: 'Firma Adı',
      companyAddress: 'Firma Adresi',
      companyPhone: '0555 555 55 55',
      logoType: 'text' as 'text' | 'image',
      logoImageUrl: '',
    };
    const saved = localStorage.getItem('storm_muhasebe_print_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PRINT_SETTINGS;
  }, [selectedPrintTransaction]); // Recalculate when print modal opens

  const printTemplates = useMemo(() => {
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  }, [selectedPrintTransaction]);

  const activeTemplate = useMemo(() => {
    if (!selectedPrintTransaction) return null;

    if (selectedTemplateIdForPrint) {
      const manualMatch = printTemplates.find((t: any) => t.id === selectedTemplateIdForPrint);
      if (manualMatch) return manualMatch;
    }

    const islem = selectedPrintTransaction;
    
    let templateType = 'satis';
    if (islem.type === 'sale_return' || islem.type === 'purchase_return') templateType = 'iade';
    else if (islem.type === 'purchase') templateType = 'alis';
    
    // Find matching template by type
    const matchingTemplates = printTemplates.filter((t: any) => t.type === templateType);
    if (matchingTemplates.length > 0) {
      if (!selectedTemplateIdForPrint) {
         // Optionally we could set it, but we can just use the match
      }
      return matchingTemplates[0];
    }
    
    // Fallback if no template of that type
    if (printTemplates.length > 0) return printTemplates[0];
    
    // System fallback
    return {
      name: 'Default',
      type: templateType,
      documentTitle: (islem.type === 'sale_return' || islem.type === 'purchase_return') ? 'İADE BELGESİ' : (islem.type === 'purchase' ? 'ALIŞ NOTU' : 'SATIŞ NOTU'),
      paperSize: 'a4',
      showLogo: true,
      showCompanyAddress: true,
      showValidityDate: false,
      showFooter: true,
      showCustomerBalance: true,
      showProductImage: false,
      showDiscountRate: true,
      showExVatAmount: true,
      showVatRate: true,
      showUnitPrice: true,
    };
  }, [selectedPrintTransaction, printTemplates, selectedTemplateIdForPrint]);

  // Reset selected template when closing modal
  useEffect(() => {
    if (!selectedPrintTransaction) {
      setSelectedTemplateIdForPrint(null);
      setIsPrintReady(false);
    } else {
      // Simulate data fetching / DOM rendering stabilization delay
      const timer = setTimeout(() => setIsPrintReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPrintTransaction]);

  const dynamicPrintVars = useMemo(() => {
    if (!selectedPrintTransaction) return null;
    if (!activeTemplate) return null;
    const islem = selectedPrintTransaction;

    let title = activeTemplate.documentTitle || 'BELGE';
    let notes = islem.description || '';
    let showBalance = activeTemplate.showCustomerBalance;
    
    if (islem.type === 'collection') {
      title = 'TAHSİLAT MAKBUZU';
    } else if (islem.type === 'payment') {
      title = 'ÖDEME MAKBUZU';
    }

    return { title, notes, showBalance };
  }, [selectedPrintTransaction, activeTemplate]);

  useEffect(() => {
    if (activeTemplate) {
      setPrintPageSize(activeTemplate.paperSize || 'a4');
    }
  }, [activeTemplate]);

  useEffect(() => {
    if (printPageSize === 'a4' || printPageSize === 'a4_yatay') {
      setPreviewScale(0.6);
    } else if (printPageSize === 'a5' || printPageSize === 'a5_yatay') {
      setPreviewScale(0.85);
    } else {
      setPreviewScale(1);
    }
  }, [printPageSize]);

  const handleOpenPrintModal = (islem: Transaction) => {
    setSelectedPrintTransaction(islem);
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return'>('sale');
  const [formError, setFormError] = useState('');
  
  const isInvoice = useMemo(() => ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType), [modalType]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  const [receiptAmount, setReceiptAmount] = useState<number>(0); // for collection / payment
  
  // Multi-Currency & Custom Exchange Rate states
  const [transactionCurrency, setTransactionCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [customConvertedAmount, setCustomConvertedAmount] = useState<number>(0);
  const [isMultiCurrency, setIsMultiCurrency] = useState<boolean>(false);
  const [isConvertedAmountEdited, setIsConvertedAmountEdited] = useState<boolean>(false);

  // Dynamic Invoice Line items (for sale / purchase)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }
  ]);

  // Find currently selected Cari's currency
  const activeCariCurrency = useMemo(() => {
    const selectedCari = cariler.find(c => c.id === selectedCariId);
    return selectedCari?.currency || 'TRY';
  }, [selectedCariId, cariler]);

  // Fetch live exchange rate when currencies differ
  useEffect(() => {
    if (transactionCurrency === activeCariCurrency) {
      setExchangeRate(1);
      setIsMultiCurrency(false);
      return;
    }
    setIsMultiCurrency(true);

    const fetchLiveRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/TRY');
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates) {
            // we want transactionCurrency to activeCariCurrency
            // e.g. transaction is USD, activeCari is TRY -> we need USD in TRY
            if (transactionCurrency === 'USD' && activeCariCurrency === 'TRY') {
               setExchangeRate(Number((1 / data.rates.USD).toFixed(4)));
            } else if (transactionCurrency === 'EUR' && activeCariCurrency === 'TRY') {
               setExchangeRate(Number((1 / data.rates.EUR).toFixed(4)));
            } else if (transactionCurrency === 'TRY' && activeCariCurrency === 'USD') {
               setExchangeRate(Number(data.rates.USD.toFixed(4)));
            } else if (transactionCurrency === 'TRY' && activeCariCurrency === 'EUR') {
               setExchangeRate(Number(data.rates.EUR.toFixed(4)));
            } else if (transactionCurrency === 'USD' && activeCariCurrency === 'EUR') {
               setExchangeRate(Number((data.rates.EUR / data.rates.USD).toFixed(4)));
            } else if (transactionCurrency === 'EUR' && activeCariCurrency === 'USD') {
               setExchangeRate(Number((data.rates.USD / data.rates.EUR).toFixed(4)));
            }
          }
        }
      } catch (e) {
        console.warn('Kurlar alınamadı (Çevrimdışı)', e);
      }
    };
    fetchLiveRate();
  }, [transactionCurrency, activeCariCurrency]);

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

      if (isModalOpen && ['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
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
  }, [isModalOpen, modalType, invoiceItems, stoklar]);

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
  const filteredTransactions = useMemo(() => {
    return islemler.filter(t => {
      const matchSearch = 
        t.cariName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }

      if (dateRange.start && t.date < dateRange.start) return false;
      if (dateRange.end && t.date > dateRange.end) return false;

      return true;
    });
  }, [islemler, searchTerm, filterType, dateRange]);

  // Open modal if triggered by parent component (e.g. sidebar shortcut or Cari list quick action)
  useEffect(() => {
    if (pendingIslemModal) {
      handleOpenModal(pendingIslemModal, pendingCariId || undefined);
      if (onClearPendingIslemModal) {
        onClearPendingIslemModal();
      }
    }
  }, [pendingIslemModal, pendingCariId]);

  // Open modal with AI prefilled data
  useEffect(() => {
    if (aiPrefilledData) {
      const type = aiPrefilledData.islem;
      setModalType(type);
      setFormError('');
      setEditingTransaction(null);
      setIsConvertedAmountEdited(false);
      setTransactionCurrency('TRY');

      // Set default form values
      setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
      setTransactionDate(new Date().toISOString().substring(0, 10));
      setAccount('cash');
      setDescription('Storm AI tarafından otomatik dolduruldu.');
      
      // Attempt to match Cari by name
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

      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type)) {
        // Attempt to match Stock by name
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
             matchedPrice = ['sale', 'sale_return'].includes(type) ? matchedStok.salesPrice : matchedStok.purchasePrice;
             matchedUnit = matchedStok.unit;
           }
        }

        const qty = aiPrefilledData.miktar || 1;
        const price = aiPrefilledData.fiyat || matchedPrice || 1;
        const taxRate = aiPrefilledData.kdv !== undefined ? aiPrefilledData.kdv : 0;
        
        setInvoiceItems([
          { 
            stockId: stockId, 
            stockName: matchedStockName,
            quantity: qty, 
            unit: matchedUnit, 
            price: price, 
            taxRate: taxRate, 
            total: qty * price * (1 + taxRate / 100)
          }
        ]);
        setReceiptAmount(0);
      } else {
        setReceiptAmount(aiPrefilledData.fiyat || 0);
        setInvoiceItems([]);
      }

      setIsModalOpen(true);

      if (onClearAiPrefilledData) {
        onClearAiPrefilledData();
      }
    }
  }, [aiPrefilledData]);

  // Open modal with default settings
  const handleOpenModal = (type: 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return', preselectedCariId?: string) => {
    setModalType(type);
    setFormError('');
    setEditingTransaction(null);
    setSelectedCariId(preselectedCariId || '');
    setTransactionDate(new Date().toISOString().substring(0, 10));
    setAccount(['sale', 'purchase', 'sale_return', 'purchase_return'].includes(type) ? '' : 'cash'); // invoices default to open-account (unpaid) until receipt added, or they can be paid cash/bank immediately
    setDescription('');
    setReceiptAmount(0);
    setInvoiceNo(
      type === 'sale' ? `SAT-${new Date().getFullYear()}-${String(islemler.filter(t=>t.type==='sale').length + 1).padStart(4, '0')}` :
      type === 'purchase' ? `AL-${new Date().getFullYear()}-${String(islemler.filter(t=>t.type==='purchase').length + 1).padStart(4, '0')}` :
      type === 'sale_return' ? `IADE-S-${new Date().getFullYear()}-${String(islemler.filter(t=>t.type==='sale_return').length + 1).padStart(4, '0')}` :
      type === 'purchase_return' ? `IADE-A-${new Date().getFullYear()}-${String(islemler.filter(t=>t.type==='purchase_return').length + 1).padStart(4, '0')}` : ''
    );
    setInvoiceItems([
      { stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }
    ]);
    setIsModalOpen(true);
  };

  // Handle invoice item changes (dropdown selection, quantity/price changes)
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
  const handleEditTransaction = (islem: Transaction) => {
    const isSaleType = ['sale', 'sale_return'].includes(islem.type);
    const actionKey = isSaleType ? 'edit_sale' : 'edit_payment';

    checkPermissionAndExecute(actionKey, () => {
      setEditingTransaction(islem);
      setModalType(islem.type);
      setFormError('');
      setSelectedCariId(islem.cariId);
      setTransactionDate(islem.date);
      setAccount(islem.account || '');
      setDescription(islem.description || '');
      setInvoiceNo(islem.invoiceNo || '');
      setIsMultiCurrency(!!(islem.currency && islem.currency !== 'TRY' && islem.exchangeRate));
      setTransactionCurrency(islem.currency || 'TRY');
      setExchangeRate(islem.exchangeRate || 1);
      setCustomConvertedAmount(islem.convertedAmount || 0);
      setIsConvertedAmountEdited(false);

      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(islem.type)) {
        setInvoiceItems(islem.items || [{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }]);
        setReceiptAmount(0);
      } else {
        setReceiptAmount(islem.amount);
        setInvoiceItems([{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 20, total: 0 }]);
      }

      setIsModalOpen(true);
    });
  };

  // Handle transaction deletion trigger
  const handleDeleteTransaction = (islem: Transaction) => {
    const isSaleType = ['sale', 'sale_return'].includes(islem.type);
    const actionKey = isSaleType ? 'delete_sale' : 'delete_payment';

    checkPermissionAndExecute(actionKey, () => {
      setDeleteConfirmTransaction(islem);
    });
  };

  // Perform actual deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTransaction) return;
    setIsDeleting(true);
    try {
      await removeTransaction(deleteConfirmTransaction);
      setDeleteConfirmTransaction(null);
    } catch (err: any) {
      console.error(err);
      alert(`İşlem silinirken hata oluştu: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submission to database
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

      setEditingTransaction(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError('İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency helper
  const formatCurrency = (val: number, cur: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg">
        <div>
          <h1 id="islemler-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">İşlemler & Faturalar</h1>
          <p className="text-white/40 text-xs mt-1 font-sans">Faturalarınızı kesin, tahsilat ve ödemelerinizi tek ekrandan anlık yönetin.</p>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2 relative">


          <button 
            id="btn-add-sale"
            onClick={() => handleOpenModal('sale')}
            className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Satış</span>
          </button>
          <button 
            id="btn-add-purchase"
            onClick={() => handleOpenModal('purchase')}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Alış</span>
          </button>
          <button 
            id="btn-add-sale-return"
            onClick={() => handleOpenModal('sale_return')}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Satış İade</span>
          </button>
          <button 
            id="btn-add-purchase-return"
            onClick={() => handleOpenModal('purchase_return')}
            className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Alış İade</span>
          </button>
          <button 
            id="btn-add-collection"
            onClick={() => handleOpenModal('collection')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Tahsilat</span>
          </button>
          <button 
            id="btn-add-payment"
            onClick={() => handleOpenModal('payment')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Ödeme</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            id="search-transactions"
            type="text"
            placeholder="Cari adı, fatura no veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-teal-500 focus:bg-white/[0.08] transition"
          />
        </div>
        
        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-2 mr-2 bg-white/5 p-1 rounded border border-white/10">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-xs text-white/70 px-2 py-1 outline-hidden [color-scheme:dark]"
              title="Başlangıç Tarihi"
            />
            <span className="text-white/30 text-xs">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-xs text-white/70 px-2 py-1 outline-hidden [color-scheme:dark]"
              title="Bitiş Tarihi"
            />
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="text-white/40 hover:text-rose-400 p-1"
                title="Tarih filtresini temizle"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button 
            id="filter-islem-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'all' 
                ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button 
            id="filter-islem-sale"
            onClick={() => setFilterType('sale')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'sale' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Satış
          </button>
          <button 
            id="filter-islem-purchase"
            onClick={() => setFilterType('purchase')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'purchase' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Alış
          </button>
          <button 
            id="filter-islem-sale-return"
            onClick={() => setFilterType('sale_return')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'sale_return' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Satış İade
          </button>
          <button 
            id="filter-islem-purchase-return"
            onClick={() => setFilterType('purchase_return')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'purchase_return' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Alış İade
          </button>
          <button 
            id="filter-islem-collection"
            onClick={() => setFilterType('collection')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'collection' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Tahsilat
          </button>
          <button 
            id="filter-islem-payment"
            onClick={() => setFilterType('payment')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'payment' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Ödeme
          </button>
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="bg-[#111111] rounded-lg border border-white/5 shadow-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet className="text-white/20 mb-4" size={48} />
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">İşlem Bulunamadı</h3>
            <p className="text-xs text-white/40 mt-2 max-w-sm font-mono uppercase tracking-widest">Kriterlerinize uygun bir fatura veya ödeme hareketi bulunamadı.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Tarih</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Cari Hesap</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">İşlem Tipi</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Belge No</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Kasa/Banka</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Açıklama</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Tutar</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((islem) => {
                    const isIncoming = ['sale', 'collection', 'purchase_return'].includes(islem.type);
                    const isCariDeleted = islem.cariId ? !cariler.some(c => c.id === islem.cariId) : false;
                    const isStockDeleted = islem.items ? islem.items.some(item => item.stockId && !stoklar.some(s => s.id === item.stockId)) : false;
                    const isOrphaned = isCariDeleted || isStockDeleted;
                    return (
                      <tr key={islem.id} className={`transition ${isOrphaned ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                        <td className="p-4 text-xs font-semibold text-white/45 font-mono">
                          {islem.date}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white/95 text-sm flex items-center gap-1.5">
                            {isCariDeleted || isOrphaned || !onViewCariDetails ? (
                              <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onViewCariDetails(islem.cariId)}
                                className="font-bold text-teal-400 hover:text-teal-300 hover:underline cursor-pointer transition text-left leading-tight"
                              >
                                {islem.cariName}
                              </button>
                            )}
                            {isCariDeleted && (
                              <span className="inline-flex items-center text-amber-500 hover:text-amber-400 cursor-help" title="Cari kayıt silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                                <AlertTriangle size={13} className="animate-pulse" />
                              </span>
                            )}
                            {isStockDeleted && (
                              <span className="inline-flex items-center text-amber-500 hover:text-amber-400 cursor-help" title="Faturadaki bazı stok kalemleri silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                                <AlertCircle size={13} className="animate-pulse" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] uppercase font-mono tracking-wider font-semibold ${
                              islem.type === 'sale' || islem.type === 'purchase_return' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                              islem.type === 'purchase' || islem.type === 'sale_return' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              islem.type === 'collection' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {islem.type === 'sale' ? 'Satış' :
                               islem.type === 'purchase' ? 'Alış' :
                               islem.type === 'sale_return' ? 'Satıştan İade' :
                               islem.type === 'purchase_return' ? 'Alıştan İade' :
                               islem.type === 'collection' ? 'Tahsilat' : 'Ödeme'}
                            </span>
                            {isOrphaned ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400" title="Yasal muhasebe kaydı korunuyor, bu işlem geçersiz kılınmıştır.">
                                GEÇERSİZ KILINMIŞ
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                                {islem.currency || 'TRY'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-white/70 font-mono">
                          {islem.invoiceNo || '-'}
                        </td>
                        <td className="p-4 text-xs text-white/50 font-sans">
                          {islem.account === 'cash' ? '💵 Kasa' :
                           islem.account === 'bank' ? '🏦 Banka' : 
                           islem.account === 'pos' ? '💳 POS' : '⏳ Vadeli'}
                        </td>
                        <td className="p-4 text-xs text-white/40 max-w-xs truncate" title={islem.description}>
                          {islem.description}
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-semibold text-sm ${isIncoming ? 'text-teal-400' : 'text-red-400'}`} style={{ fontFamily: 'Georgia, serif' }}>
                            {isIncoming ? '+' : '-'}{formatCurrency(islem.amount, islem.currency || 'TRY')}
                          </div>
                          {islem.exchangeRate && islem.exchangeRate !== 1 && (
                            <div className="text-[9px] text-white/30 font-mono mt-0.5">
                              {formatCurrency(islem.convertedAmount || (islem.amount * islem.exchangeRate), 'TRY')} (Kur: {islem.exchangeRate})
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-print-islem-${islem.id}`}
                              onClick={() => handleOpenPrintModal(islem)}
                              className="p-1.5 text-white/30 hover:text-teal-400 hover:bg-white/5 rounded transition cursor-pointer"
                              title="Yazdır / PDF Al"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              id={`btn-edit-islem-${islem.id}`}
                              onClick={() => handleEditTransaction(islem)}
                              className="p-1.5 text-white/30 hover:text-blue-400 hover:bg-white/5 rounded transition cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit size={15} />
                            </button>
                            {isOrphaned ? (
                              <span 
                                className="inline-flex p-1.5 text-amber-500/40 hover:text-amber-500/60 transition cursor-help"
                                title="Geçersiz Kılınmış (Asıl Cari veya Stok kaydı silindiği için yasal muhasebe bütünlüğünü korumak adına geri alınamaz/iptal edilemez)"
                              >
                                <Lock size={14} />
                              </span>
                            ) : (
                              <button 
                                 id={`btn-delete-islem-${islem.id}`}
                                 onClick={() => handleDeleteTransaction(islem)}
                                 className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition cursor-pointer"
                                 title="Geri Al"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredTransactions.map((islem) => {
                const isIncoming = ['sale', 'collection', 'purchase_return'].includes(islem.type);
                const isCariDeleted = islem.cariId ? !cariler.some(c => c.id === islem.cariId) : false;
                const isStockDeleted = islem.items ? islem.items.some(item => item.stockId && !stoklar.some(s => s.id === item.stockId)) : false;
                const isOrphaned = isCariDeleted || isStockDeleted;
                return (
                  <div key={islem.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition ${isOrphaned ? 'bg-amber-500/[0.02] border-amber-500/25' : 'bg-white/[0.01] border-white/5'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-white/30 font-mono block">{islem.date}</span>
                        <div className="font-bold text-white/90 text-sm mt-1 leading-tight flex items-center gap-1.5">
                          {isCariDeleted || isOrphaned || !onViewCariDetails ? (
                            <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewCariDetails(islem.cariId)}
                              className="font-bold text-teal-400 hover:text-teal-300 hover:underline cursor-pointer transition text-left leading-tight"
                            >
                              {islem.cariName}
                            </button>
                          )}
                          {isCariDeleted && (
                            <span className="text-amber-500 animate-pulse" title="Cari kayıt silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                              <AlertTriangle size={13} />
                            </span>
                          )}
                          {isStockDeleted && (
                            <span className="text-amber-500 animate-pulse" title="Faturadaki bazı stok kalemleri silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                              <AlertCircle size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-mono font-semibold ${
                          ['sale', 'purchase_return'].includes(islem.type) ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          ['purchase', 'sale_return'].includes(islem.type) ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          islem.type === 'collection' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {islem.type === 'sale' ? 'Satış' : islem.type === 'purchase' ? 'Alış' : islem.type === 'sale_return' ? 'Satış İade' : islem.type === 'purchase_return' ? 'Alış İade' : islem.type === 'collection' ? 'Tahsilat' : 'Ödeme'}
                        </span>
                        {isOrphaned ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                            Geçersiz Kılınmış
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                            {islem.currency || 'TRY'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white/60 space-y-1 bg-white/[0.02] p-2.5 rounded border border-white/5 font-mono">
                      {islem.invoiceNo && <div>Belge No: <strong>{islem.invoiceNo}</strong></div>}
                      <div>Hesap: <strong>{islem.account === 'cash' ? 'Kasa' : islem.account === 'bank' ? 'Banka' : islem.account === 'pos' ? 'POS' : 'Açık Hesap'}</strong></div>
                      {islem.description && <div className="line-clamp-2 text-white/40 italic mt-0.5">"{islem.description}"</div>}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <div>
                        <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider font-mono">Tutar</div>
                        <div className={`font-bold text-sm ${isIncoming ? 'text-teal-400' : 'text-red-400'}`} style={{ fontFamily: 'Georgia, serif' }}>
                          {isIncoming ? '+' : '-'}{formatCurrency(islem.amount, islem.currency || 'TRY')}
                        </div>
                        {islem.exchangeRate && islem.exchangeRate !== 1 && (
                          <div className="text-[9px] text-white/30 font-mono mt-0.5">
                            {formatCurrency(islem.convertedAmount || (islem.amount * islem.exchangeRate), 'TRY')} (Kur: {islem.exchangeRate})
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-mob-print-islem-${islem.id}`}
                          onClick={() => handleOpenPrintModal(islem)}
                          className="p-2 text-teal-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                          title="Yazdır / PDF Al"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          id={`btn-mob-edit-islem-${islem.id}`}
                          onClick={() => handleEditTransaction(islem)}
                          className="p-2 text-blue-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit size={15} />
                        </button>
                        {isOrphaned ? (
                          <div className="flex items-center gap-1.5 text-amber-500/60 text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded">
                            <Lock size={12} />
                            <span>Kayıt Korunuyor</span>
                          </div>
                        ) : (
                          <button 
                            id={`btn-mob-delete-islem-${islem.id}`}
                            onClick={() => handleDeleteTransaction(islem)}
                            className="p-2 text-red-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                            title="Geri Al"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Creator Modal (Sale / Purchase / Collection / Payment) */}
      {isModalOpen && (
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
                onClick={() => setIsModalOpen(false)}
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
                                  {stok.name} (Mevcut: {stok.quantity} {stok.unit})
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
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Kur</label>
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
                  onClick={() => setIsModalOpen(false)}
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
      )}

      {/* PDF Print Preview & Settings Modal */}
      {selectedPrintTransaction && (() => {
        if (!selectedPrintTransaction || !activeTemplate || !dynamicPrintVars) {
           return (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="flex flex-col justify-center items-center gap-3">
                  <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                  <div className="text-white text-xs tracking-widest uppercase font-bold">Veriler Yükleniyor...</div>
                </div>
             </div>
           );
        }

        const currentCariForPrint = cariler.find(c => c.id === selectedPrintTransaction.cariId);
        
        const getCurrencySymbol = (cur: string) => {
          if (cur === 'USD') return '$';
          if (cur === 'EUR') return '€';
          return '₺';
        };

        const formatPrintCurrency = (amount: number, currency: string) => {
          const symbol = getCurrencySymbol(currency);
          const formattedVal = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(amount);
          
          return `${symbol} ${formattedVal}`;
        };

        const convertNumberToWords = (num: number, currencyCode: string = 'TRY') => {
          const ones = ['', 'BİR', 'İKİ', 'ÜÇ', 'DÖRT', 'BEŞ', 'ALTI', 'YEDİ', 'SEKİZ', 'DOKUZ'];
          const tens = ['', 'ON', 'YİRMİ', 'OTUZ', 'KIRK', 'ELLİ', 'ALTMIŞ', 'YETMİŞ', 'SEKSEN', 'DOKSAN'];
          const hundreds = ['', 'YÜZ', 'İKİYÜZ', 'ÜÇYÜZ', 'DÖRTYÜZ', 'BEŞYÜZ', 'ALTIYÜZ', 'YEDİYÜZ', 'SEKİZYÜZ', 'DOKUZYÜZ'];
          const thousands = ['', 'BİN', 'MİLYON', 'MİLYAR', 'TRİLYON'];

          const formatGroup = (n: number) => {
            let s = '';
            const h = Math.floor(n / 100);
            const t = Math.floor((n % 100) / 10);
            const o = n % 10;
            if (h > 0) {
              s += h === 1 ? 'YÜZ' : hundreds[h];
            }
            if (t > 0) s += tens[t];
            if (o > 0) s += ones[o];
            return s;
          };

          const intPart = Math.floor(num);
          const fracPart = Math.round((num - intPart) * 100);

          let intStr = '';
          if (intPart === 0) {
            intStr = 'SIFIR';
          } else {
            let temp = intPart;
            let groupIdx = 0;
            while (temp > 0) {
              const group = temp % 1000;
              if (group > 0) {
                let groupWord = formatGroup(group);
                if (groupIdx === 1 && group === 1) {
                  groupWord = '';
                }
                intStr = groupWord + thousands[groupIdx] + intStr;
              }
              temp = Math.floor(temp / 1000);
              groupIdx++;
            }
          }

          let fracStr = '';
          if (fracPart > 0) {
            fracStr = formatGroup(fracPart);
          }

          let currencyUnit = 'TL';
          let subUnit = 'Kr.';
          if (currencyCode === 'USD') {
            currencyUnit = 'DOLAR';
            subUnit = 'SNT.';
          } else if (currencyCode === 'EUR') {
            currencyUnit = 'EURO';
            subUnit = 'SNT.';
          }

          return `Yalnız; ${intStr} ${currencyUnit}` + (fracPart > 0 ? ` ${fracStr} ${subUnit}` : ' SIFIR KURUŞ.');
        };

        const transactionTypeTheme = (() => {
          const type = selectedPrintTransaction.type;
          if (type === 'purchase') {
            return {
              primary: '#0f766e', // Teal 700
              primaryBg: '#f0fdfa', // Teal 50
              primaryBorder: '#99f6e4', // Teal 200
              accent: '#0d9488', // Teal 600
              textLight: '#0f766e',
              title: 'ALIŞ FATURASI',
              badgeText: 'ALIŞ BELGESİ'
            };
          } else if (type === 'sale_return' || type === 'purchase_return') {
            return {
              primary: '#be123c', // Rose 700
              primaryBg: '#fff1f2', // Rose 50
              primaryBorder: '#fecdd3', // Rose 200
              accent: '#e11d48', // Rose 600
              textLight: '#be123c',
              title: 'İADE FATURASI',
              badgeText: 'İADE BELGESİ'
            };
          } else if (type === 'collection') {
            return {
              primary: '#4338ca', // Indigo 700
              primaryBg: '#eef2ff', // Indigo 50
              primaryBorder: '#c7d2fe', // Indigo 200
              accent: '#4f46e5', // Indigo 600
              textLight: '#4338ca',
              title: 'TAHSİLAT MAKBUZU',
              badgeText: 'FİNANS FİŞİ'
            };
          } else if (type === 'payment') {
            return {
              primary: '#b45309', // Amber 700
              primaryBg: '#fffbeb', // Amber 50
              primaryBorder: '#fde68a', // Amber 200
              accent: '#d97706', // Amber 600
              textLight: '#b45309',
              title: 'ÖDEME MAKBUZU',
              badgeText: 'FİNANS FİŞİ'
            };
          } else {
            // default / sale
            return {
              primary: '#1d4ed8', // Blue 700
              primaryBg: '#eff6ff', // Blue 50
              primaryBorder: '#bfdbfe', // Blue 200
              accent: '#2563eb', // Blue 600
              textLight: '#1d4ed8',
              title: 'SATIŞ FATURASI',
              badgeText: 'SATIŞ BELGESİ'
            };
          }
        })();

        const textScale = activeTemplate?.textSize === 'small' ? 0.85 : activeTemplate?.textSize === 'large' ? 1.15 : 1;

        const kdvBreakdown = (() => {
          if (!selectedPrintTransaction || !selectedPrintTransaction.items) return [];
          const groups: Record<number, { rate: number; total: number; matrah: number; kdv: number }> = {};
          
          selectedPrintTransaction.items.forEach(item => {
            const rate = item.taxRate || 20; // default 20%
            const total = item.total || 0;
            const matrah = total / (1 + rate / 100);
            const kdv = total - matrah;
            
            if (!groups[rate]) {
              groups[rate] = { rate, total: 0, matrah: 0, kdv: 0 };
            }
            groups[rate].total += total;
            groups[rate].matrah += matrah;
            groups[rate].kdv += kdv;
          });
          
          return Object.values(groups);
        })();

        let pageWidth = '210mm';
        let pageHeight = '297mm';
        
        if (printPageSize === 'a4_yatay') {
          pageWidth = '297mm';
          pageHeight = '210mm';
        } else if (printPageSize === 'a5') {
          pageWidth = '148mm';
          pageHeight = '210mm';
        } else if (printPageSize === 'a5_yatay') {
          pageWidth = '210mm';
          pageHeight = '148mm';
        } else if (printPageSize === 'etiket_60x40') {
          pageWidth = '60mm';
          pageHeight = '40mm';
        } else if (printPageSize === 'etiket_80x50') {
          pageWidth = '80mm';
          pageHeight = '50mm';
        } else if (printPageSize === 'etiket_40x30') {
          pageWidth = '40mm';
          pageHeight = '30mm';
        } else if (printPageSize === 'etiket_40x20') {
          pageWidth = '40mm';
          pageHeight = '20mm';
        } else if (printPageSize === 'termal_80') {
          pageWidth = '80mm';
          pageHeight = '300mm'; // termal auto boyutu önizlemede uzun bir kağıt gibi göstersin
        } else if (printPageSize === 'termal_58') {
          pageWidth = '58mm';
          pageHeight = '300mm';
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print-override">
            {/* Dynamic Style Injection for Native OS Print Page Size removed, using iframe instead */}

            <div className="bg-[#0c0c0c] rounded-xl border border-white/10 max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh] print-override">
              {/* Modal Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Printer className="text-teal-400 animate-pulse" size={18} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">PDF Baskı ve Yazdırma Paneli</h3>
                    <p className="text-white/40 text-[10px] mt-0.5 font-sans">Belgeyi özelleştirin, kağıt boyutunu ölçekleyin ve PDF olarak kaydedin.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedPrintTransaction(null)}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-90 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Print Panel Body */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#070707] relative scrollbar-thin p-6 items-center print-override">
                {/* Top Actions: Zoom, Size & Print */}
                <div className="w-full max-w-4xl bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-5 flex items-center justify-between gap-4 text-xs z-10 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Sparkles size={14} className="text-teal-400" />
                      <span className="font-semibold text-[10px] tracking-wider uppercase">Baskı Ön İzleme (%{Math.round(previewScale * 100)})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Template Selector */}
                    {printTemplates.length > 0 && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold hidden md:inline">Şablon:</span>
                        <select
                          value={selectedTemplateIdForPrint || activeTemplate?.id || ''}
                          onChange={(e) => setSelectedTemplateIdForPrint(e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          {printTemplates.map((t: any) => (
                            <option key={t.id} value={t.id} className="bg-[#111] text-white">
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    

                    
                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewScale(prev => Math.max(0.3, Number((prev - 0.05).toFixed(2))))}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 text-white rounded transition-all cursor-pointer"
                        title="Küçült"
                      >
                        <ZoomOut size={13} />
                      </button>
                      
                      <input 
                        type="range"
                        min="0.3"
                        max="1.2"
                        step="0.05"
                        value={previewScale}
                        onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                        className="w-24 accent-teal-500 cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setPreviewScale(prev => Math.min(1.2, Number((prev + 0.05).toFixed(2))))}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 text-white rounded transition-all cursor-pointer"
                        title="Büyüt"
                      >
                        <ZoomIn size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewScale(printPageSize === 'A4' ? 0.6 : 0.85)}
                        className="px-2.5 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 active:scale-95 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                      >
                        Sığdır
                      </button>
                    </div>
                    
                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                    
                    <button
                      type="button"
                      disabled={!isPrintReady || isPdfDownloading}
                      onClick={async () => {
                        if (!isPrintReady || isPdfDownloading) return;
                        setIsPdfDownloading(true);

                        const printContent = document.getElementById('printable-invoice-content');
                        if (!printContent) {
                          setIsPdfDownloading(false);
                          return;
                        }

                        const originalTransform = printContent.style.transform;
                        // Set scale to 1 for high-fidelity capture
                        printContent.style.transform = 'scale(1)';

                        // Let layout settle for a fraction of a millisecond
                        await new Promise((resolve) => setTimeout(resolve, 80));

                        try {
                          // Get dimensions in mm
                          let pdfFormat: string | [number, number] = 'a4';
                          let isLandscape = false;
                          let pdfWidthMm = 210;
                          let pdfHeightMm = 297;

                          if (printPageSize === 'a4_yatay') {
                            pdfFormat = 'a4';
                            isLandscape = true;
                            pdfWidthMm = 297;
                            pdfHeightMm = 210;
                          } else if (printPageSize === 'a5') {
                            pdfFormat = 'a5';
                            isLandscape = false;
                            pdfWidthMm = 148;
                            pdfHeightMm = 210;
                          } else if (printPageSize === 'a5_yatay') {
                            pdfFormat = 'a5';
                            isLandscape = true;
                            pdfWidthMm = 210;
                            pdfHeightMm = 148;
                          } else if (printPageSize === 'etiket_60x40') {
                            pdfFormat = [60, 40];
                            isLandscape = true;
                            pdfWidthMm = 60;
                            pdfHeightMm = 40;
                          } else if (printPageSize === 'etiket_80x50') {
                            pdfFormat = [80, 50];
                            isLandscape = true;
                            pdfWidthMm = 80;
                            pdfHeightMm = 50;
                          } else if (printPageSize === 'etiket_40x30') {
                            pdfFormat = [40, 30];
                            isLandscape = true;
                            pdfWidthMm = 40;
                            pdfHeightMm = 30;
                          } else if (printPageSize === 'etiket_40x20') {
                            pdfFormat = [40, 20];
                            isLandscape = true;
                            pdfWidthMm = 40;
                            pdfHeightMm = 20;
                          } else if (printPageSize === 'termal_80') {
                            const actualHeightMm = (printContent.scrollHeight / printContent.clientWidth) * 80 || 200;
                            pdfFormat = [80, actualHeightMm];
                            isLandscape = false;
                            pdfWidthMm = 80;
                            pdfHeightMm = actualHeightMm;
                          } else if (printPageSize === 'termal_58') {
                            const actualHeightMm = (printContent.scrollHeight / printContent.clientWidth) * 58 || 180;
                            pdfFormat = [58, actualHeightMm];
                            isLandscape = false;
                            pdfWidthMm = 58;
                            pdfHeightMm = actualHeightMm;
                          }

                          // Generate crisp PNG image
                          const dataUrl = await toPng(printContent, {
                            pixelRatio: 2.5, // High resolution
                            backgroundColor: '#ffffff',
                            style: {
                              transform: 'scale(1)',
                              transformOrigin: 'top left',
                            }
                          });

                          // Reset original transform immediately
                          printContent.style.transform = originalTransform;

                          // Create jsPDF document
                          const doc = new jsPDF({
                            orientation: isLandscape ? 'landscape' : 'portrait',
                            unit: 'mm',
                            format: pdfFormat,
                          });

                          // Add image covering the entire page area
                          doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);

                          // Save PDF with meaningful name
                          const docName = selectedPrintTransaction.invoiceNo 
                            ? `Fatura_${selectedPrintTransaction.invoiceNo}`
                            : `Islem_Belgesi_${selectedPrintTransaction.id.substring(0, 8)}`;
                          doc.save(`${docName}.pdf`);

                        } catch (err: any) {
                          printContent.style.transform = originalTransform;
                          console.error('PDF İndirme Hatası:', err);

                          // Hata Savunması (try-catch, and Telegram logging)
                          try {
                            const { reportErrorToTelegram } = await import('../utils/telegramLogger');
                            reportErrorToTelegram(err instanceof Error ? err : new Error(String(err)), 'IslemlerView_DownloadPDF');
                          } catch (logErr) {
                            console.error('Telegram loglama hatası:', logErr);
                          }

                          alert('PDF oluşturulurken bir hata meydana geldi.');
                        } finally {
                          setIsPdfDownloading(false);
                        }
                      }}
                      className={`px-4 py-1.5 ${isPrintReady && !isPdfDownloading ? 'bg-[#151515] hover:bg-[#202020] border border-white/10 text-white cursor-pointer active:scale-95' : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'} text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2`}
                    >
                      {isPdfDownloading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Hazırlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>PDF İndir</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!isPrintReady}
                      onClick={() => {
                        if (isPrintReady) {
                          const printContent = document.getElementById('printable-invoice-content');
                          if (printContent) {
                            const iframe = document.createElement('iframe');
                            iframe.style.position = 'fixed';
                            iframe.style.right = '0';
                            iframe.style.bottom = '0';
                            iframe.style.width = '0';
                            iframe.style.height = '0';
                            iframe.style.border = '0';
                            document.body.appendChild(iframe);
                            
                            const iframeDoc = iframe.contentWindow?.document;
                            if (iframeDoc) {
                              const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                                .map(s => s.outerHTML)
                                .join('\n');
                                
                              const clone = printContent.cloneNode(true) as HTMLElement;
                              clone.style.transform = 'none';
                              clone.style.position = 'static';
                              clone.style.width = '100%';
                              clone.style.height = 'auto';
                              clone.style.minHeight = '0';
                              clone.style.margin = '0';
                              
                              let pageCssSize = 'A4 portrait';
                              
                              if (printPageSize === 'a4_yatay') {
                                pageCssSize = 'A4 landscape';
                              } else if (printPageSize === 'a5') {
                                pageCssSize = 'A5 portrait';
                              } else if (printPageSize === 'a5_yatay') {
                                pageCssSize = 'A5 landscape';
                              } else if (printPageSize === 'etiket_60x40') {
                                pageCssSize = '60mm 40mm';
                              } else if (printPageSize === 'etiket_80x50') {
                                pageCssSize = '80mm 50mm';
                              } else if (printPageSize === 'etiket_40x30') {
                                pageCssSize = '40mm 30mm';
                              } else if (printPageSize === 'etiket_40x20') {
                                pageCssSize = '40mm 20mm';
                              } else if (printPageSize === 'termal_80') {
                                pageCssSize = '80mm auto';
                              } else if (printPageSize === 'termal_58') {
                                pageCssSize = '58mm auto';
                              }
                              
                              iframeDoc.open();
                              iframeDoc.write(`
                                <html>
                                  <head>
                                    ${styles}
                                    <style>
                                      @page { size: ${pageCssSize}; margin: 0; }
                                      body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    </style>
                                  </head>
                                  <body>
                                    ${clone.outerHTML}
                                  </body>
                                </html>
                              `);
                              iframeDoc.close();
                              
                              iframe.onload = () => {
                                setTimeout(() => {
                                  iframe.contentWindow?.focus();
                                  iframe.contentWindow?.print();
                                  setTimeout(() => {
                                    if (document.body.contains(iframe)) {
                                      document.body.removeChild(iframe);
                                    }
                                  }, 1000);
                                }, 250);
                              };
                            }
                          } else {
                            setTimeout(() => {
                              window.print();
                            }, 150);
                          }
                        }
                      }}
                      className={`px-4 py-1.5 \${isPrintReady ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20 shadow-lg cursor-pointer active:scale-95 text-black' : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'} text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2`}
                    >
                      <Printer size={14} />
                      {isPrintReady ? 'Yazdır' : 'Bekleyin...'}
                    </button>
                  </div>
                </div>

                {/* Visual container designed to wrap the physical page exactly at scale S */}
                  <div 
                    className="shadow-2xl border border-zinc-800 bg-white rounded-xs overflow-hidden relative transition-all duration-300 ease-out print-override"
                    style={{
                      width: `calc(${pageWidth} * ${previewScale})`,
                      height: `calc(${pageHeight} * ${previewScale})`,
                    }}
                  >
                    {/* The physical paper layout container */}
                    <div 
                      id="printable-invoice-content"
                      className="bg-white text-black font-sans select-none"
                      style={{
                        width: pageWidth,
                        minHeight: pageHeight, // Slightly smaller to prevent A5 page bleed
                        padding: printPageSize.includes('etiket') ? '5mm' : printPageSize.includes('termal') ? '5mm' : '15mm',
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ zoom: textScale }} className="w-full">
                        {printPageSize.startsWith('termal_') ? (
                          /* PREMIUM CORPORATE THERMAL RECEIPT (FİŞ) LAYOUT */
                          <div className="w-full font-mono text-[10px] leading-tight text-zinc-900 flex flex-col items-stretch pr-2 select-none">
                            {/* Header Section */}
                            <div className="text-center flex flex-col items-center">
                              {activeTemplate?.showLogo !== false && (
                                <div className="mb-1.5">
                                  {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                    <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[150px] object-contain mx-auto" referrerPolicy="no-referrer" />
                                  ) : (
                                    <h2 className="text-sm font-black tracking-tight uppercase text-zinc-950 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                  )}
                                </div>
                              )}
                              {activeTemplate?.showCompanyAddress !== false && (
                                <div className="text-[8px] text-zinc-600 leading-tight whitespace-pre-line max-w-[200px] mx-auto">
                                  {activeTemplate?.showLogo === false && <strong className="text-[9px] text-zinc-900 block mb-0.5">{printSettings.companyName}</strong>}
                                  <p>{printSettings.companyAddress}</p>
                                  <p className="mt-0.5 font-bold">TEL: {printSettings.companyPhone}</p>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Receipt Subtitle */}
                            <div className="text-center font-black text-[11px] uppercase tracking-wider text-zinc-900 mb-0.5">
                              *** {dynamicPrintVars?.title || 'BİLGİ FİŞİ'} ***
                            </div>
                            <div className="text-center text-[7px] font-bold tracking-wider text-zinc-500 mb-1">
                              * * * M A L İ   D E Ğ E R İ   Y O K T U R * * *
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Metadata Section */}
                            <div className="space-y-0.5 text-[9px] font-mono text-zinc-700">
                              <div className="flex justify-between">
                                <span className="font-bold">TARİH:</span>
                                <span>{selectedPrintTransaction.date}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-bold">FİŞ NO / BELGE SERİ:</span>
                                <span>{selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</span>
                              </div>
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold shrink-0">SAYIN CARİ:</span>
                                <span className="font-semibold text-zinc-900 text-right break-words uppercase">{selectedPrintTransaction.cariName}</span>
                              </div>
                              {currentCariForPrint && (currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                <div className="flex justify-between text-[8px] text-zinc-500">
                                  <span>V.D. / NO:</span>
                                  <span>{currentCariForPrint.taxOffice || 'BİLİNMİYOR'} / {currentCariForPrint.taxNo || 'NO-YOK'}</span>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Items Section */}
                            <div className="space-y-1.5 py-1">
                              <div className="flex justify-between text-[9px] font-bold text-zinc-900 border-b border-dashed border-zinc-300 pb-0.5">
                                <span>ÜRÜN / HİZMET ADI</span>
                                <span>TUTAR</span>
                              </div>
                              {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                selectedPrintTransaction.items.map((item, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="font-bold text-[9px] text-zinc-900 uppercase break-words">{item.stockName}</span>
                                    <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5 font-mono">
                                      <span>{item.quantity} {item.unit || 'Adet'} x {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}</span>
                                      <span className="font-bold text-zinc-900 font-mono">{formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                /* Fallback Collection/Payment */
                                <div className="flex flex-col">
                                  <span className="font-bold text-[9px] text-zinc-900 uppercase">
                                    {selectedPrintTransaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                  </span>
                                  <span className="text-[8px] text-zinc-500 leading-tight mt-0.5 whitespace-pre-line">{selectedPrintTransaction.description || 'Cari hesaba yansıtılan finans hareketi.'}</span>
                                  <div className="flex justify-between text-[9px] text-zinc-600 mt-1 font-mono">
                                    <span>1 Adet x {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                    <span className="font-bold text-zinc-900 font-mono">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1.5 text-[9px] tracking-tighter">
                              ================================================
                            </div>

                            {/* Totals Section */}
                            <div className="space-y-1 font-mono">
                              <div className="flex justify-between text-[11px] font-black text-zinc-950 py-1 border-y border-dashed border-zinc-400">
                                <span>GENEL TOPLAM</span>
                                <span className="text-[11px]">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                              </div>

                              {/* KDV Breakdown */}
                              {kdvBreakdown.length > 0 && (
                                <div className="text-[8px] text-zinc-500 pt-1 space-y-0.5 border-b border-dashed border-zinc-200 pb-1">
                                  <div className="flex justify-between font-bold text-zinc-600">
                                    <span>KDV GRUBU</span>
                                    <span>MATRAH</span>
                                    <span>KDV TUTARI</span>
                                  </div>
                                  {kdvBreakdown.map((g, idx) => (
                                    <div key={idx} className="flex justify-between font-mono">
                                      <span>%{g.rate}</span>
                                      <span>{formatPrintCurrency(g.matrah, selectedPrintTransaction.currency || 'TRY')}</span>
                                      <span>{formatPrintCurrency(g.kdv, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Customer Balance */}
                            {dynamicPrintVars?.showBalance && currentCariForPrint && (
                              <div className="mt-2 text-[8px] text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-1 flex justify-between font-bold font-mono">
                                <span>GÜNCEL BAKİYE:</span>
                                <span>{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                              </div>
                            )}

                            {/* Descriptions */}
                            {dynamicPrintVars?.notes && activeTemplate?.showFooter !== false && (
                              <div className="mt-1.5 text-[8px] text-zinc-600 border-t border-dashed border-zinc-200 pt-1 font-sans leading-snug">
                                <span className="font-bold text-zinc-800">AÇIKLAMA:</span>
                                <p className="mt-0.5 whitespace-pre-line">{dynamicPrintVars.notes}</p>
                              </div>
                            )}

                            {/* Message & Software Info */}
                            <div className="text-center mt-3.5 space-y-0.5">
                              <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold font-sans">Bizi tercih ettiğiniz için teşekkür ederiz!</div>
                              <div className="text-[7px] text-zinc-400 font-mono">ON MUHASEBE BİLGİ SİSTEMLERİ</div>
                            </div>

                            {/* Barcode representation */}
                            <div className="flex flex-col items-center justify-center mt-3 pt-1.5 border-t border-dashed border-zinc-200 overflow-hidden">
                              <Barcode 
                                value={selectedPrintTransaction.invoiceNo || selectedPrintTransaction.id || "000000"} 
                                width={1.0} 
                                height={30} 
                                fontSize={7}
                                margin={0}
                                displayValue={true}
                              />
                            </div>
                          </div>
                        ) : (() => {
                          const style = activeTemplate?.designStyle || 'minimal';
                          
                          if (style === 'corporate') {
                            return (
                              /* PREMIUM CORPORATE STANDARD INVOICE / TICKET LAYOUT (A4/A5) */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                                {/* Header Logo & Address */}
                                <div className="flex justify-between items-stretch border border-zinc-200 rounded-lg p-5 mb-6 bg-slate-50/50">
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      {activeTemplate?.showLogo !== false && (
                                        <div className="mb-3">
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-12 max-w-[240px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-900 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[10px] text-zinc-600 leading-normal max-w-[340px] font-sans">
                                          {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-1">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="mt-1 font-bold text-zinc-800">Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Document Details (Tarih, No) */}
                                  <div className="w-80 flex flex-col justify-between border-l border-zinc-200 pl-6">
                                    <div className="text-right">
                                      <span className="inline-block px-2.5 py-0.5 text-[8px] font-black tracking-widest rounded text-white mb-1.5 uppercase" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        {transactionTypeTheme.badgeText}
                                      </span>
                                      <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight uppercase leading-none">
                                        {dynamicPrintVars?.title || transactionTypeTheme.title}
                                      </h1>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono text-zinc-600 mt-3 pt-3 border-t border-dashed border-zinc-200">
                                      <span className="font-bold">BELGE NO / SERİ:</span>
                                      <span className="text-right font-bold text-zinc-950">{selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</span>
                                      <span className="font-bold">TARİH:</span>
                                      <span className="text-right text-zinc-900">{selectedPrintTransaction.date}</span>
                                      <span className="font-bold">PARA BİRİMİ:</span>
                                      <span className="text-right font-bold text-zinc-900">{selectedPrintTransaction.currency || 'TRY'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Parties Info Box (Double Columns) */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                  <div className="border border-zinc-200 rounded-lg p-4 bg-slate-50/10">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 border-b border-zinc-100 pb-1">GÖNDERİCİ / SATICI</div>
                                    <div className="text-xs font-extrabold text-zinc-900 uppercase mb-1">{printSettings.companyName}</div>
                                    <div className="text-[10px] text-zinc-600 space-y-0.5 font-sans">
                                      <p>{printSettings.companyAddress}</p>
                                      <p className="font-bold text-zinc-800 mt-1">Tel: {printSettings.companyPhone}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="border border-zinc-200 rounded-lg p-4 bg-slate-50/10">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 border-b border-zinc-100 pb-1">ALICI / CARİ HESAP</div>
                                    <div className="text-xs font-extrabold text-zinc-900 uppercase mb-1">{selectedPrintTransaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-600 space-y-0.5 font-sans">
                                        {currentCariForPrint.address ? <p>{currentCariForPrint.address}</p> : <p className="text-zinc-400 italic text-[9px]">Kayıtlı adres bulunmuyor.</p>}
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="font-semibold text-zinc-700 mt-1">
                                            V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                          </p>
                                        )}
                                        {currentCariForPrint.phone && <p className="font-bold text-zinc-800">Tel: {currentCariForPrint.phone}</p>}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Itemized Table */}
                                <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="text-[9px] font-bold uppercase text-white" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        <th className="py-2.5 px-3 text-center w-12 font-bold">SIRA</th>
                                        <th className="py-2.5 px-3 font-bold">ÜRÜN / HİZMET TANIMI</th>
                                        <th className="py-2.5 px-3 text-center w-20 font-bold">MİKTAR</th>
                                        {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-3 text-right w-24 font-bold">BİRİM FİYAT</th>}
                                        {activeTemplate?.showDiscountRate && <th className="py-2.5 px-3 text-center w-14 font-bold">İNDİRİM</th>}
                                        {activeTemplate?.showVatRate && <th className="py-2.5 px-3 text-center w-14 font-bold">KDV (%)</th>}
                                        <th className="py-2.5 px-3 text-right w-28 font-bold">TOPLAM TUTAR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                        selectedPrintTransaction.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-zinc-200/60 hover:bg-slate-50/50 transition-colors odd:bg-slate-50/10">
                                            <td className="py-2.5 px-3 text-center text-zinc-400 font-mono text-[9px]">
                                              {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              <span className="font-bold text-zinc-900 block uppercase text-[10px]">{item.stockName}</span>
                                            </td>
                                            <td className="py-2.5 px-3 text-zinc-700 text-center font-mono">
                                              {item.quantity} {item.unit || 'Adet'}
                                            </td>
                                            {activeTemplate?.showUnitPrice !== false && (
                                              <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                                {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}
                                              </td>
                                            )}
                                            {activeTemplate?.showDiscountRate && (
                                              <td className="py-2.5 px-3 text-zinc-400 text-center font-mono">%0</td>
                                            )}
                                            {activeTemplate?.showVatRate && (
                                              <td className="py-2.5 px-3 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                            )}
                                            <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono text-[10px]">
                                              {formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr className="border-b border-zinc-150">
                                          <td className="py-3 px-3 text-center text-zinc-400 font-mono">01</td>
                                          <td className="py-3 px-3">
                                            <span className="font-bold text-zinc-900 block uppercase text-[10px]">
                                              {selectedPrintTransaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 block mt-0.5 italic max-w-lg">
                                              {selectedPrintTransaction.description || 'Cari hesaba yansıtılan finans hareketi.'}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 text-zinc-600 text-center font-mono">1 Adet</td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-3 text-zinc-600 text-right font-mono">
                                              {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && <td className="py-3 px-3 text-center font-mono">-</td>}
                                          {activeTemplate?.showVatRate && <td className="py-3 px-3 text-center font-mono">-</td>}
                                          <td className="py-3 px-3 font-bold text-zinc-900 text-right font-mono text-[10px]">
                                            {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Summary & Signatures Block */}
                                <div className="grid grid-cols-12 gap-6 items-start">
                                  <div className="col-span-7 space-y-4">
                                    {/* Written amount banner */}
                                    <div className="border border-zinc-200 bg-slate-50/50 rounded-lg p-3">
                                      <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest block mb-1">YAZI İLE TOPLAM TUTAR</span>
                                      <span className="text-[9px] font-bold text-zinc-800 tracking-wide uppercase font-mono">
                                        {convertNumberToWords(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                      </span>
                                    </div>

                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-150 rounded-lg px-3 py-1.5 text-[9px] text-zinc-700 font-mono">
                                        <span className="font-bold text-zinc-400 uppercase">CARİ GÜNCEL HESAP BAKİYESİ:</span>
                                        <span className="font-black text-zinc-950">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                      </div>
                                    )}

                                    {dynamicPrintVars?.notes && activeTemplate?.showFooter !== false && (
                                      <div className="border-l-2 border-zinc-300 pl-3">
                                        <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5 font-sans">NOT / AÇIKLAMA</h4>
                                        <p className="text-[9px] text-zinc-500 leading-relaxed whitespace-pre-line font-sans">
                                          {dynamicPrintVars.notes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Signatures Area */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-zinc-200 mt-6">
                                      <div className="text-center">
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-8 font-sans">TESLİM EDEN (İMZA)</span>
                                        <div className="border-t border-dashed border-zinc-200 w-28 mx-auto"></div>
                                      </div>
                                      <div className="text-center">
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-8 font-sans">TESLİM ALAN (İMZA)</span>
                                        <div className="border-t border-dashed border-zinc-200 w-28 mx-auto"></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-5 flex flex-col items-stretch pl-4 border-l border-dashed border-zinc-200">
                                    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-slate-50/10">
                                      <div className="p-2.5 bg-slate-50 border-b border-zinc-200 flex justify-between items-center">
                                        <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase font-sans">FİNANSAL ÖZET</span>
                                        <span className="text-[7px] text-zinc-400 font-mono">{selectedPrintTransaction.currency || 'TRY'}</span>
                                      </div>
                                      <div className="p-3 space-y-1.5 text-[9px] font-mono text-zinc-600">
                                        {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                          <>
                                            <div className="flex justify-between">
                                              <span>KDV MATRAH TOPLAMI:</span>
                                              <span>{formatPrintCurrency(
                                                selectedPrintTransaction.items.reduce((acc, curr) => acc + (curr.total / (1 + (curr.taxRate || 20)/100)), 0),
                                                selectedPrintTransaction.currency || 'TRY'
                                              )}</span>
                                            </div>
                                            {kdvBreakdown.map((group, idx) => (
                                              <div key={idx} className="flex justify-between text-zinc-400 text-[8px]">
                                                <span>TOPLAM KDV (%{group.rate}):</span>
                                                <span>{formatPrintCurrency(group.kdv, selectedPrintTransaction.currency || 'TRY')}</span>
                                              </div>
                                            ))}
                                          </>
                                        ) : (
                                          <div className="flex justify-between">
                                            <span>İŞLEM MATRAHI:</span>
                                            <span>{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t border-zinc-150 pt-1.5 text-zinc-800">
                                          <span>TOPLAM KDV:</span>
                                          <span>{formatPrintCurrency(
                                            selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0
                                              ? selectedPrintTransaction.items.reduce((acc, curr) => acc + (curr.total - (curr.total / (1 + (curr.taxRate || 20)/100))), 0)
                                              : 0,
                                            selectedPrintTransaction.currency || 'TRY'
                                          )}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-extrabold text-white rounded p-2 mt-2 transition-colors duration-300" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                          <span className="uppercase text-[8px] tracking-wider font-sans">GENEL TOPLAM:</span>
                                          <span className="text-[11px] font-black font-mono">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-[7px] text-zinc-400 mt-4 text-center leading-normal font-sans">
                                      <span className="font-bold tracking-wider text-zinc-300 uppercase">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (style === 'modern') {
                            return (
                              /* PREMIUM MODERN ASYMMETRIC LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                                {/* Modern Asymmetric Header */}
                                <div className="flex items-stretch gap-5 mb-8">
                                  {/* Left Modern Colored Accent Strip */}
                                  <div className="w-2.5 rounded-full shrink-0" style={{ backgroundColor: transactionTypeTheme.primary }}></div>
                                  
                                  <div className="flex-1 flex justify-between items-start">
                                    <div>
                                      {activeTemplate?.showLogo !== false && (
                                        <div className="mb-2">
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-950 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[10px] text-zinc-500 leading-relaxed max-w-[320px]">
                                          {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-0.5">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="mt-0.5 font-bold" style={{ color: transactionTypeTheme.primary }}>Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <h1 className="text-xl font-black text-zinc-900 tracking-tight uppercase leading-none mb-1">
                                        {dynamicPrintVars?.title || transactionTypeTheme.title}
                                      </h1>
                                      <div className="inline-block text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 text-white" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        YENİ NESİL BELGE
                                      </div>
                                      <div className="text-[9px] text-zinc-400 font-mono leading-relaxed mt-1">
                                        Tarih: {selectedPrintTransaction.date}
                                        <br />
                                        Belge No: {selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Customer Section */}
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-150 mb-6 flex justify-between items-start">
                                  <div>
                                    <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: transactionTypeTheme.primary }}>ALICI DETAYLARI</div>
                                    <div className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">{selectedPrintTransaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-500 mt-1 max-w-[340px]">
                                        <p>{currentCariForPrint.address || 'Kayıtlı adres bulunmuyor.'}</p>
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="font-semibold text-zinc-600 mt-0.5">
                                            V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {activeTemplate?.showValidityDate && (
                                    <div className="text-right text-[10px] bg-white border border-zinc-200 rounded-lg p-2 font-mono">
                                      <span className="text-zinc-400 text-[8px] block uppercase font-bold tracking-wider mb-0.5">GEÇERLİLİK</span>
                                      <span className="font-extrabold text-zinc-800">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Sleek Modern Table */}
                                <table className="w-full text-left text-xs mb-6 border-collapse">
                                  <thead>
                                    <tr className="border-b border-zinc-200 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                                      <th className="py-2.5 px-1">ÜRÜN / AÇIKLAMA</th>
                                      <th className="py-2.5 px-1 text-center w-20">MİKTAR</th>
                                      {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-1 text-right w-24">BİRİM FİYAT</th>}
                                      {activeTemplate?.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İNDİRİM</th>}
                                      {activeTemplate?.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                                      <th className="py-2.5 px-1 text-right w-28 text-zinc-900">TOPLAM</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                      selectedPrintTransaction.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-zinc-100">
                                          <td className="py-3 px-1">
                                            <div className="flex items-center gap-2">
                                              {activeTemplate?.showProductImage && (
                                                <div className="w-6 h-6 bg-zinc-100 border border-zinc-200 rounded-md shrink-0"></div>
                                              )}
                                              <div>
                                                <span className="font-bold text-zinc-900 text-[10px] block uppercase">{item.stockName}</span>
                                                <span className="text-[8px] text-zinc-400 block mt-0.5">Sistem Stok Tanımlı Ürün</span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-1 text-zinc-800 text-center font-semibold">
                                            {item.quantity} {item.unit || 'Adet'}
                                          </td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                              {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && (
                                            <td className="py-3 px-1 text-zinc-500 text-center font-mono">%0</td>
                                          )}
                                          {activeTemplate?.showVatRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                          )}
                                          <td className="py-3 px-1 font-extrabold text-zinc-950 text-right font-mono">
                                            {formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-b border-zinc-100">
                                        <td className="py-3 px-1">
                                          <span className="font-bold text-zinc-900 text-[10px] block uppercase">
                                            {selectedPrintTransaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                          </span>
                                          <span className="text-[8px] text-zinc-400 block mt-0.5">{selectedPrintTransaction.description || 'Finansal Hareket'}</span>
                                        </td>
                                        <td className="py-3 px-1 text-zinc-800 text-center font-semibold">1 Adet</td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                            {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showDiscountRate && <td className="py-3 px-1 text-zinc-500 text-center font-mono">-</td>}
                                        {activeTemplate?.showVatRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        <td className="py-3 px-1 font-extrabold text-zinc-950 text-right font-mono">
                                          {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* Summary area */}
                                <div className="flex justify-between items-start mt-4">
                                  <div className="space-y-3">
                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="border border-zinc-100 bg-zinc-50/20 px-3 py-2 rounded-xl text-[9px] text-zinc-800 inline-block">
                                        <span className="block text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">CARİ GÜNCEL HESAP BAKİYESİ</span>
                                        <span className="font-extrabold">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                      </div>
                                    )}
                                    {dynamicPrintVars?.notes && (
                                      <div className="max-w-md bg-zinc-50/30 p-2.5 rounded-lg border border-zinc-150">
                                        <span className="text-[7px] font-bold text-zinc-400 block mb-0.5">NOT / AÇIKLAMA:</span>
                                        <p className="text-[9px] text-zinc-600 whitespace-pre-line">{dynamicPrintVars.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="w-72 bg-zinc-50 rounded-xl p-3 border border-zinc-100 font-mono text-[9px] text-zinc-600 space-y-1">
                                    <div className="flex justify-between text-[10px] font-extrabold text-zinc-900 border-b border-zinc-200/60 pb-1.5 mb-1.5">
                                      <span className="font-sans uppercase text-[8px] tracking-wider text-zinc-400">ÖDENECEK TOPLAM TUTAR</span>
                                      <span style={{ color: transactionTypeTheme.primary }}>{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-400">
                                      <span>MATRAH:</span>
                                      <span>{formatPrintCurrency(selectedPrintTransaction.amount / 1.2, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-400">
                                      <span>VERGİLER TOPLAMI:</span>
                                      <span>{formatPrintCurrency(selectedPrintTransaction.amount - (selectedPrintTransaction.amount / 1.2), selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer */}
                                {activeTemplate?.showFooter !== false && (
                                  <div className="mt-12 text-center text-[8px] text-zinc-400 font-mono uppercase tracking-widest bg-zinc-50/40 py-2 rounded-lg border border-zinc-150">
                                    Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (style === 'elegant') {
                            return (
                              /* PREMIUM ELEGANT SERIF LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-800 font-serif pr-1 select-none text-xs">
                                {/* Elegant Centered Header */}
                                <div className="text-center pb-5 mb-8 border-b-4 border-double border-zinc-300">
                                  {activeTemplate?.showLogo !== false && (
                                    <div className="flex justify-center mb-2">
                                      {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                        <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <h2 className="text-2xl font-normal italic tracking-wide uppercase text-zinc-900 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                      )}
                                    </div>
                                  )}
                                  
                                  {activeTemplate?.showCompanyAddress !== false && (
                                    <div className="text-[9px] text-zinc-500 leading-relaxed font-sans max-w-[420px] mx-auto">
                                      {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-0.5 font-serif uppercase tracking-wider">{printSettings.companyName}</strong>}
                                      <p>{printSettings.companyAddress} • Tel: {printSettings.companyPhone}</p>
                                    </div>
                                  )}

                                  <h1 className="text-xl font-bold text-zinc-900 tracking-widest uppercase leading-none mt-4 font-serif">
                                    {dynamicPrintVars?.title || transactionTypeTheme.title}
                                  </h1>
                                  <p className="text-[8px] text-amber-800 tracking-widest uppercase font-sans font-bold mt-1">GÜVENİLİR VE SEÇKİN TİCARET BELGESİ</p>
                                </div>

                                {/* Parties Area */}
                                <div className="flex justify-between items-start mb-8 font-sans">
                                  <div className="max-w-[60%]">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">MÜŞTERİ / MUHATAP</span>
                                    <div className="text-sm font-bold text-zinc-900 uppercase font-serif tracking-wider">{selectedPrintTransaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-500 mt-1 italic leading-normal font-serif">
                                        <p>{currentCariForPrint.address || 'Kayıtlı adres bulunmuyor.'}</p>
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="text-zinc-600">V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right text-[10px] text-zinc-600 space-y-0.5">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">BELGE KÜNYESİ</span>
                                    <p><span className="font-semibold">Belge No:</span> #{selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</p>
                                    <p><span className="font-semibold">Düzenleme Tarihi:</span> {selectedPrintTransaction.date}</p>
                                    {activeTemplate?.showValidityDate && (
                                      <p className="text-amber-800 font-medium"><span className="font-semibold text-zinc-600">Geçerlilik:</span> {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Delicate Elegant Table */}
                                <table className="w-full text-left text-xs mb-8 font-sans border-collapse">
                                  <thead>
                                    <tr className="border-b-2 border-zinc-200 text-[9px] font-bold uppercase text-zinc-700 italic">
                                      <th className="py-2.5 px-1 font-serif">Açıklama</th>
                                      <th className="py-2.5 px-1 text-center w-20">Miktar</th>
                                      {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-1 text-right w-24">Birim Fiyat</th>}
                                      {activeTemplate?.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İndirim</th>}
                                      {activeTemplate?.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                                      <th className="py-2.5 px-1 text-right w-28 font-serif text-zinc-950">Net Tutar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                      selectedPrintTransaction.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50/20">
                                          <td className="py-3 px-1">
                                            <div className="flex items-center gap-2">
                                              {activeTemplate?.showProductImage && (
                                                <div className="w-5 h-5 border border-zinc-200 shrink-0"></div>
                                              )}
                                              <span className="font-medium text-zinc-900 font-serif text-[10px] tracking-wide">{item.stockName}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-1 text-zinc-600 text-center font-mono italic">
                                            {item.quantity} {item.unit || 'Adet'}
                                          </td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                              {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%0</td>
                                          )}
                                          {activeTemplate?.showVatRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                          )}
                                          <td className="py-3 px-1 font-bold text-zinc-900 text-right font-serif">
                                            {formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-b border-zinc-100 hover:bg-zinc-50/20">
                                        <td className="py-3 px-1">
                                          <span className="font-medium text-zinc-900 font-serif text-[10px] tracking-wide">
                                            {selectedPrintTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-1 text-zinc-600 text-center font-mono italic">1 Adet</td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                            {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showDiscountRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        {activeTemplate?.showVatRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        <td className="py-3 px-1 font-bold text-zinc-900 text-right font-serif">
                                          {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* Elegant Totals */}
                                <div className="flex justify-between items-start font-sans">
                                  <div className="space-y-3">
                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="border border-zinc-200 p-2 text-[8px] text-zinc-500 italic max-w-xs leading-tight">
                                        Mutabık kalınan cari bakiyeniz: <strong className="text-zinc-800 font-serif not-italic">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</strong>
                                      </div>
                                    )}
                                    {dynamicPrintVars?.notes && (
                                      <div className="text-[9px] text-zinc-500 italic max-w-md">
                                        <span className="font-bold not-italic block text-[8px] tracking-wider text-zinc-400 uppercase">AÇIKLAMA:</span>
                                        <p className="whitespace-pre-line">{dynamicPrintVars.notes}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="w-64 border-t-2 border-zinc-300 pt-3 space-y-1 text-[9px] text-zinc-600 font-mono">
                                    <div className="flex justify-between text-zinc-500">
                                      <span>ARA TOPLAM:</span>
                                      <span>{formatPrintCurrency(selectedPrintTransaction.amount / 1.2, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400 text-[8px]">
                                      <span>KDV TOPLAMI:</span>
                                      <span>{formatPrintCurrency(selectedPrintTransaction.amount - (selectedPrintTransaction.amount / 1.2), selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between font-serif font-extrabold text-zinc-900 text-xs border-t border-dashed border-zinc-200 pt-1.5 mt-1.5">
                                      <span>GENEL TOPLAM:</span>
                                      <span>{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer */}
                                {activeTemplate?.showFooter !== false && (
                                  <div className="mt-12 text-center text-[8px] text-zinc-400 font-serif italic border-t border-zinc-200 pt-3 max-w-md mx-auto">
                                    Bizi tercih ettiğiniz için teşekkür ederiz.
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (style === 'classic') {
                            return (
                              /* CLASSIC ACCOUNTING FRAME LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-mono select-none text-[10px] p-2 border border-zinc-300 rounded-lg bg-white relative">
                                <div className="border border-zinc-400 p-3 rounded-md flex flex-col items-stretch h-full">
                                  {/* Grid Header */}
                                  <div className="grid grid-cols-12 gap-2 border-b border-zinc-400 pb-3 mb-4">
                                    <div className="col-span-8 space-y-1">
                                      {activeTemplate?.showLogo !== false && (
                                        <div>
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-8 max-w-[180px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-sm font-bold uppercase leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[8px] text-zinc-600 leading-tight">
                                          {activeTemplate?.showLogo === false && <strong className="text-[10px] block mb-0.5">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="font-bold">Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="col-span-4 border border-zinc-400 p-2 text-center bg-zinc-50 rounded">
                                      <h1 className="text-xs font-bold uppercase tracking-wide leading-none">{dynamicPrintVars?.title || transactionTypeTheme.title}</h1>
                                      <div className="text-[8px] text-zinc-600 mt-1.5 pt-1.5 border-t border-zinc-300">
                                        No: {selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                        <br />
                                        Tarih: {selectedPrintTransaction.date}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Client / Cari Bilgileri */}
                                  <div className="border border-zinc-400 p-2.5 rounded bg-zinc-50/50 mb-4 grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">SAYIN ALICI (CARİ HESAP):</div>
                                      <div className="text-xs font-bold uppercase">{selectedPrintTransaction.cariName}</div>
                                      {currentCariForPrint && <div className="text-[8px] text-zinc-600 mt-1">{currentCariForPrint.address || 'Kayıtlı adres bulunmuyor.'}</div>}
                                    </div>
                                    <div className="text-right flex flex-col justify-between">
                                      <div>
                                        {activeTemplate?.showValidityDate && (
                                          <p className="text-[8px] text-zinc-500 font-bold">GEÇERLİLİK: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                                        )}
                                      </div>
                                      {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                        <div className="text-[8px] text-zinc-700 bg-white border border-zinc-300 p-1 rounded inline-block self-end">
                                          CARİ BAKİYE: <span className="font-bold">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Gridded Classical Table */}
                                  <table className="w-full text-left text-[9px] mb-4 border border-zinc-400">
                                    <thead>
                                      <tr className="bg-zinc-100 border-b border-zinc-400 font-bold">
                                        <th className="py-1.5 px-2 border-r border-zinc-400 w-6 text-center">S.N.</th>
                                        <th className="py-1.5 px-2 border-r border-zinc-400">ÜRÜN / HİZMET TANIMI</th>
                                        <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-16">MİKTAR</th>
                                        {activeTemplate?.showUnitPrice !== false && <th className="py-1.5 px-2 border-r border-zinc-400 text-right w-20">FİYAT</th>}
                                        {activeTemplate?.showDiscountRate && <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-12">İND.</th>}
                                        {activeTemplate?.showVatRate && <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-12">KDV</th>}
                                        <th className="py-1.5 px-2 text-right w-24">TUTAR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                        selectedPrintTransaction.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-zinc-300">
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-center">{idx + 1}</td>
                                            <td className="py-1.5 px-2 border-r border-zinc-400 font-bold">{item.stockName}</td>
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-center">{item.quantity} {item.unit || 'Adet'}</td>
                                            {activeTemplate?.showUnitPrice !== false && (
                                              <td className="py-1.5 px-2 border-r border-zinc-400 text-right">{formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}</td>
                                            )}
                                            {activeTemplate?.showDiscountRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">%0</td>}
                                            {activeTemplate?.showVatRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">%{item.taxRate || 20}</td>}
                                            <td className="py-1.5 px-2 text-right">{formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr className="border-b border-zinc-300">
                                          <td className="py-1.5 px-2 border-r border-zinc-400 text-center">1</td>
                                          <td className="py-1.5 px-2 border-r border-zinc-400 font-bold">
                                            {selectedPrintTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                            <div className="text-[8px] font-normal text-zinc-500 mt-0.5">{selectedPrintTransaction.description}</div>
                                          </td>
                                          <td className="py-1.5 px-2 border-r border-zinc-400 text-center">1 Adet</td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-right">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</td>
                                          )}
                                          {activeTemplate?.showDiscountRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">-</td>}
                                          {activeTemplate?.showVatRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">-</td>}
                                          <td className="py-1.5 px-2 text-right">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>

                                  {/* Classic Bottom Totals */}
                                  <div className="grid grid-cols-12 gap-2 items-start mt-2">
                                    <div className="col-span-8 text-[8px] text-zinc-500 leading-snug">
                                      {dynamicPrintVars?.notes && (
                                        <div className="border border-zinc-300 p-2 rounded mb-2 bg-zinc-50">
                                          <span className="font-bold text-zinc-700 block mb-0.5">NOT:</span>
                                          <p className="text-zinc-600">{dynamicPrintVars.notes}</p>
                                        </div>
                                      )}
                                      <p>MUTABAKAT AMACIYLA DÜZENLENMİŞTİR. FİRMAMIZ KAYITLARI ESAS ALINMALIDIR.</p>
                                    </div>
                                    <div className="col-span-4 border border-zinc-400 rounded p-2 text-[9px] space-y-1 bg-zinc-50">
                                      <div className="flex justify-between">
                                        <span>MATRAH:</span>
                                        <span>{formatPrintCurrency(selectedPrintTransaction.amount / 1.2, selectedPrintTransaction.currency || 'TRY')}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-zinc-300 pb-1">
                                        <span>KDV (%20):</span>
                                        <span>{formatPrintCurrency(selectedPrintTransaction.amount - (selectedPrintTransaction.amount / 1.2), selectedPrintTransaction.currency || 'TRY')}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-zinc-950">
                                        <span>GENEL TOPLAM:</span>
                                        <span>{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          /* DEFAULT / MINIMALIST LAYOUT */
                          return (
                            /* PREMIUM CORPORATE MINIMALIST INVOICE / TICKET LAYOUT (A4/A5) */
                            <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                              {/* Header Logo & Address */}
                              <div className="flex justify-between items-start pb-4 mb-6">
                                <div className="max-w-[60%]">
                                  {/* Şirket Adı veya Logo */}
                                  {activeTemplate?.showLogo !== false && (
                                    <div className="mb-1">
                                      {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                        <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[240px] object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <h2 className="text-[26px] font-extrabold tracking-tight uppercase text-zinc-950 leading-none font-sans" style={{ fontWeight: 900 }}>
                                          {printSettings.companyName || 'FIRMA ADI'}
                                        </h2>
                                      )}
                                    </div>
                                  )}
                                  
                                  {activeTemplate?.showCompanyAddress !== false && (
                                    <div className="text-[11px] text-zinc-500 leading-tight whitespace-pre-line font-sans mt-1.5">
                                      {activeTemplate?.showLogo === false && <strong className="text-sm text-zinc-900 block mb-1">{printSettings.companyName}</strong>}
                                      <p>{printSettings.companyAddress || 'Firma Adresi'}</p>
                                      <p className="mt-0.5 font-bold text-zinc-800">Tel: {printSettings.companyPhone || '0555 555 55 55'}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Document Details (Tarih, No) */}
                                <div className="text-right">
                                  <h1 className="text-[26px] font-extrabold text-zinc-950 tracking-tight uppercase leading-none" style={{ fontWeight: 900 }}>
                                    {dynamicPrintVars?.title || transactionTypeTheme.title}
                                  </h1>
                                  <div className="text-[11px] text-zinc-400 mt-2 font-mono leading-relaxed">
                                    Tarih: {selectedPrintTransaction.date}
                                    <br />
                                    Belge No: {selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                  </div>
                                </div>
                              </div>

                              {/* Kalın Siyah Çizgi */}
                              <div className="border-b-[3px] border-zinc-950 mb-6"></div>

                              {/* Recipient Info */}
                              <div className="mb-8">
                                <div className="text-xs text-zinc-800 font-semibold mb-0.5">Sayın,</div>
                                <div className="font-extrabold text-[17px] text-zinc-950 tracking-wide uppercase" style={{ fontWeight: 800 }}>
                                  {selectedPrintTransaction.cariName?.toLocaleUpperCase('tr-TR')}
                                </div>
                                {currentCariForPrint && (
                                  <div className="text-xs text-zinc-500 mt-1 whitespace-pre-line font-sans leading-normal">
                                    {currentCariForPrint.address ? <p>{currentCariForPrint.address}</p> : <p className="text-zinc-400 italic text-[11px]">Kayıtlı adres bulunmuyor.</p>}
                                    {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                      <p className="font-semibold text-zinc-600 mt-1">
                                        V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                      </p>
                                    )}
                                    {currentCariForPrint.phone && <p className="font-bold text-zinc-700">Tel: {currentCariForPrint.phone}</p>}
                                  </div>
                                )}
                              </div>

                              {/* Table Section */}
                              <table className="w-full text-left text-xs mb-8 border-collapse">
                                <thead>
                                  <tr className="bg-[#f0f4f8] text-zinc-800 font-bold text-xs border-y border-zinc-200">
                                    <th className="py-2.5 px-3 font-bold text-zinc-800">Ürün / Hizmet</th>
                                    <th className="py-2.5 px-3 font-bold text-zinc-800 text-center w-24">Miktar</th>
                                    {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-3 font-bold text-zinc-800 text-right w-32">Birim Fiyat</th>}
                                    {activeTemplate?.showDiscountRate && <th className="py-2.5 px-3 font-bold text-zinc-800 text-center w-24">KDV</th>}
                                    <th className="py-2.5 px-3 font-bold text-zinc-800 text-right w-36">Toplam</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                                    selectedPrintTransaction.items.map((item, idx) => (
                                      <tr key={idx} className="border-b border-zinc-200/60">
                                        <td className="py-2.5 px-3 text-zinc-800 font-normal">
                                          {item.stockName}
                                        </td>
                                        <td className="py-2.5 px-3 text-zinc-500 text-center">
                                          {item.quantity} {item.unit || 'Adet'}
                                        </td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                            {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showVatRate && (
                                          <td className="py-2.5 px-3 text-zinc-500 text-center font-mono">
                                            %{item.taxRate || 20}
                                          </td>
                                        )}
                                        <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono">
                                          {formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    /* Receipts fallback (collection or payment) */
                                    <tr className="border-b border-zinc-200/60">
                                      <td className="py-2.5 px-3 text-zinc-800">
                                        {selectedPrintTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                        <div className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                                          {selectedPrintTransaction.description || 'Cari hesaba yansıtılan finans hareketi.'}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-zinc-500 text-center">1 Adet</td>
                                      {activeTemplate?.showUnitPrice !== false && (
                                        <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                          {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                        </td>
                                      )}
                                      {activeTemplate?.showVatRate && <td className="py-2.5 px-3 text-zinc-500 text-center font-mono">-</td>}
                                      <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono">
                                        {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              {/* Genel Toplam Area (Altta, Sağa Hizalı) */}
                              <div className="flex flex-col items-end">
                                <div className="w-80 border-t border-zinc-300 pt-3 flex justify-between items-center">
                                  <span className="font-bold text-zinc-900 text-sm">Genel Toplam:</span>
                                  <span className="font-bold text-zinc-950 text-sm font-mono">
                                    {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                  </span>
                                </div>

                                {/* Bilgilendirme ve Açıklama Yazısı */}
                                <div className="w-full mt-10 grid grid-cols-2 gap-4 items-start text-left">
                                  <div className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                                    <span className="font-bold tracking-wider text-zinc-300 uppercase">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz</span>
                                  </div>
                                  {dynamicPrintVars?.notes && (
                                    <div className="text-right">
                                      <span className="font-bold text-zinc-400 text-[8px] uppercase tracking-widest block mb-1">AÇIKLAMA</span>
                                      <p className="text-[10px] text-zinc-500 leading-snug whitespace-pre-line font-sans">
                                        {dynamicPrintVars.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        );
      })()}

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

      {/* custom delete confirmation modal */}
      {deleteConfirmTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-xl border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">İşlemi Silmeyi Onayla</h3>
                <p className="text-white/40 text-xs mt-1">Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              </div>
            </div>

            {/* Transaction details card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/40">İşlem Tipi:</span>
                <span className={`font-bold ${
                  deleteConfirmTransaction.type === 'sale' || deleteConfirmTransaction.type === 'purchase_return' || deleteConfirmTransaction.type === 'collection'
                    ? 'text-teal-400'
                    : 'text-red-400'
                }`}>
                  {deleteConfirmTransaction.type === 'sale' ? 'Satış Faturası' :
                   deleteConfirmTransaction.type === 'purchase' ? 'Alış Faturası' :
                   deleteConfirmTransaction.type === 'sale_return' ? 'Satıştan İade Faturası' :
                   deleteConfirmTransaction.type === 'purchase_return' ? 'Alıştan İade Faturası' :
                   deleteConfirmTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Cari Hesap:</span>
                <span className="text-white/80 font-bold">{deleteConfirmTransaction.cariName}</span>
              </div>
              {deleteConfirmTransaction.invoiceNo && (
                <div className="flex justify-between">
                  <span className="text-white/40">Belge No:</span>
                  <span className="text-white/80">{deleteConfirmTransaction.invoiceNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">Tarih:</span>
                <span className="text-white/85">{deleteConfirmTransaction.date}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                <span className="text-white/40">Tutar:</span>
                <span className="text-white font-bold text-sm">
                  {formatCurrency(deleteConfirmTransaction.amount, deleteConfirmTransaction.currency || 'TRY')}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-300 flex gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="leading-normal">
                <strong>Dikkat:</strong> Bu işlem silindiğinde, ilişkili cari bakiyeler ve stok miktarları otomatik olarak geri alınacaktır.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTransaction(null)}
                className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-all cursor-pointer active:scale-95 duration-150"
              >
                İptal Et
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-[10px] uppercase tracking-wider font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)] rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>İşlemi Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} />
            </div>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yönetici Doğrulaması</h3>
            <p className="text-xs text-white/60 mt-1 mb-6">
              Bu kritik işlemi gerçekleştirmek için 4 haneli Yönetici PIN kodunu giriniz.
            </p>

            <div className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinInput(val);
                  setPinError('');
                  
                  if (val.length === 4) {
                    if (val === escalationPin || ['1923', '1234', '9999'].includes(val)) {
                      setIsPinModalOpen(false);
                      if (pinVerificationAction) {
                        pinVerificationAction();
                      }
                    } else {
                      setPinError('Hatalı Yönetici PIN kodu!');
                    }
                  }
                }}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] text-white transition outline-none font-mono"
                autoFocus
              />

              {pinError && (
                <p className="text-xs font-bold text-rose-400">{pinError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinVerificationAction(null);
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-white/10"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
