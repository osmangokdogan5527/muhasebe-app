import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Cari, Stock, InvoiceItem, BankAccount } from '../types';
import { createTransaction, removeTransaction, saveAccountTransaction } from '../firebase';
import { 
  Plus, 
  Search, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  X, 
  Calendar, 
  User, 
  CreditCard, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Lock,
  Globe,
  Printer,
  Edit,
  Pencil,
  ZoomIn,
  ZoomOut,
  Upload,
  Sparkles,
  ChevronDown,
  Zap
} from 'lucide-react';

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
  onClearAiPrefilledData
}: IslemlerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isQuickDropdownOpen, setIsQuickDropdownOpen] = useState(false);
  
  // Print PDF Receipt states
  const [selectedPrintTransaction, setSelectedPrintTransaction] = useState<Transaction | null>(null);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [selectedTemplateIdForPrint, setSelectedTemplateIdForPrint] = useState<string | null>(null);
  const [printPageSize, setPrintPageSize] = useState<string>('a4');
  const [previewScale, setPreviewScale] = useState<number>(0.6);

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

  const templatesStr = localStorage.getItem('storm_print_templates');
  const printTemplates = useMemo(() => {
    if (templatesStr) {
      try {
        return JSON.parse(templatesStr);
      } catch (e) {}
    }
    return [];
  }, [templatesStr]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('');

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

    const scannedStock = stoklar.find(s => s.barcode === barcodeInput.trim() || s.code === barcodeInput.trim());
    
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
      setFormError(`"${barcodeInput}" barkoduna sahip ürün bulunamadı.`);
    }
  };

  // Remove line item from invoice
  const removeInvoiceItemRow = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Handle transaction editing
  const handleEditTransaction = (islem: Transaction) => {
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
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (islem: Transaction) => {
    let typeName = islem.type === 'sale' ? 'Satış Faturası' :
                   islem.type === 'purchase' ? 'Alış Faturası' :
                   islem.type === 'sale_return' ? 'Satıştan İade Faturası' :
                   islem.type === 'purchase_return' ? 'Alıştan İade Faturası' :
                   islem.type === 'collection' ? 'Tahsilat' : 'Ödeme';
    
    if (window.confirm(`Bu "${typeName}" işlemini silmek istediğinize emin misiniz? Cari bakiyeler ve stok miktarları otomatik olarak geri alınacaktır!`)) {
      try {
        await removeTransaction(islem);
      } catch (err: any) {
        console.error(err);
        alert(`İşlem silinirken hata oluştu: ${err.message || err}`);
      }
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
                            <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
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
                          <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                  {editingTransaction ? (
                    modalType === 'sale' ? 'Satış Faturası Düzenle' :
                    modalType === 'purchase' ? 'Alış Faturası Düzenle' :
                    modalType === 'sale_return' ? 'Satış İade Faturası Düzenle' :
                    modalType === 'purchase_return' ? 'Alış İade Faturası Düzenle' :
                    modalType === 'collection' ? 'Tahsilat Makbuzu Düzenle' : 'Ödeme Makbuzu Düzenle'
                  ) : (
                    modalType === 'sale' ? 'Yeni Satış Faturası' :
                    modalType === 'purchase' ? 'Yeni Alış Faturası' :
                    modalType === 'sale_return' ? 'Yeni Satış İade Faturası' :
                    modalType === 'purchase_return' ? 'Yeni Alış İade Faturası' :
                    modalType === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'
                  )}
                </h3>
                <p className="text-white/40 text-[10px] mt-1 font-mono uppercase tracking-wider">
                  {modalType === 'sale' ? 'Müşterinize keseceğiniz faturayı ve kalemleri girin.' :
                   modalType === 'purchase' ? 'Aldığınız mal veya hizmet faturasını kaydedin.' :
                   modalType === 'sale_return' ? 'Müşteriden size iade edilen ürünleri kaydedin.' :
                   modalType === 'purchase_return' ? 'Tedarikçiye iade ettiğiniz ürünleri kaydedin.' :
                   'Kasa veya bankaya giren/çıkan nakit ödeme makbuzu.'}
                </p>
              </div>
              <button 
                id="btn-close-islem-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2 text-xs text-red-400 font-medium">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Core Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Cari Hesap Seçimi *</label>
                  <select 
                    id="form-islem-cari"
                    required
                    value={selectedCariId}
                    onChange={(e) => setSelectedCariId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
                  >
                    <option value="" className="bg-[#0c0c0c]">-- Cari Seçin --</option>
                    {cariler.filter(cari => cari.isActive !== false).map(cari => (
                      <option key={cari.id} value={cari.id} className="bg-[#0c0c0c]">
                        {cari.name} ({cari.type === 'customer' ? 'Müşteri' : cari.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi'}) - [{cari.currency || 'TRY'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">İşlem Tarihi</label>
                  <input 
                    id="form-islem-date"
                    type="date"
                    required
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                {/* Account (Cash/Bank) or Credit terms */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    {modalType === 'sale' || modalType === 'purchase' ? 'Ödeme Durumu / Tipi' : 'Kasa / Banka Türü'}
                  </label>
                  <select 
                    id="form-islem-account"
                    value={account}
                    onChange={(e) => {
                      setAccount(e.target.value as any);
                      setSelectedBankAccountId('');
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 mb-3"
                  >
                    {(modalType === 'sale' || modalType === 'purchase') && (
                      <option value="" className="bg-[#0c0c0c]">⏳ Açık Hesap / Vadeli (Borçlandır)</option>
                    )}
                    <option value="cash" className="bg-[#0c0c0c]">💵 Kasa (Nakit)</option>
                    <option value="bank" className="bg-[#0c0c0c]">🏦 Banka (Havale/EFT)</option>
                    <option value="pos" className="bg-[#0c0c0c]">💳 POS (Kredi Kartı)</option>
                  </select>

                  {(account === 'cash' || account === 'bank' || account === 'pos') && bankAccounts.length > 0 && (
                    <div className="mt-2 animate-fade-in">
                      <label className="block text-[9px] font-semibold text-teal-400/80 uppercase tracking-widest mb-1.5 font-mono">İşlem Yapılacak Hesap</label>
                      <select 
                        required
                        value={selectedBankAccountId}
                        onChange={(e) => setSelectedBankAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-100 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                      >
                        <option value="" className="bg-[#0c0c0c]">-- Hesap Seçiniz --</option>
                        {bankAccounts.filter(a => account === 'cash' ? a.type === 'kasa' : account === 'pos' ? a.type === 'pos' : a.type === 'banka').map(a => (
                          <option key={a.id} value={a.id} className="bg-[#0c0c0c]">{a.name} ({a.currency})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {(modalType === 'sale' || modalType === 'purchase') && (
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Fatura / Belge Numarası</label>
                    <input 
                      id="form-islem-invoice-no"
                      type="text"
                      placeholder="Örn: FT-2026-0001"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-mono focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Farklı Para Birimi ve Manuel Kur Bölümü */}
              {selectedCariId && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/80 cursor-pointer select-none">
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
                        className="rounded border-white/10 bg-white/5 text-teal-600 focus:ring-teal-500 focus:ring-offset-[#0c0c0c]"
                      />
                      <span>Farklı Para Birimi / Manuel Kur Uygula</span>
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">
                      Cari Para Birimi: <span className="font-bold text-teal-400">{activeCariCurrency}</span>
                    </span>
                  </div>

                  {isMultiCurrency && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5 animate-fade-in">
                      <div>
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">İşlem Para Birimi</label>
                        <select
                          value={transactionCurrency}
                          onChange={(e) => setTransactionCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
                        >
                          <option value="TRY" className="bg-[#0c0c0c]">TRY (Türk Lirası)</option>
                          <option value="USD" className="bg-[#0c0c0c]">USD (Amerikan Doları)</option>
                          <option value="EUR" className="bg-[#0c0c0c]">EUR (Euro)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Manuel Döviz Kuru</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            value={exchangeRate}
                            onChange={(e) => {
                              setExchangeRate(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 font-mono font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono font-medium">
                            {activeCariCurrency}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                            Cariye Yansıyacak Tutar ({activeCariCurrency})
                          </label>
                          {isConvertedAmountEdited && (
                            <button
                              type="button"
                              onClick={() => setIsConvertedAmountEdited(false)}
                              className="text-[9px] text-teal-400 hover:underline cursor-pointer"
                            >
                              Sıfırla
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={customConvertedAmount || ''}
                            onChange={(e) => {
                              setIsConvertedAmountEdited(true);
                              setCustomConvertedAmount(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full px-3 py-2 bg-teal-950/20 border border-teal-500/30 text-teal-300 rounded text-xs focus:outline-hidden focus:border-teal-400 font-mono font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-teal-400/50 font-mono font-bold">
                            {activeCariCurrency}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1 font-sans">
                          {transactionCurrency === activeCariCurrency ? (
                            "Para birimleri aynı olduğu için kur etkisi yoktur."
                          ) : (
                            `Hesaplama: 1 ${
                              transactionCurrency === 'TRY' ? (activeCariCurrency === 'TRY' ? 'USD' : activeCariCurrency) : transactionCurrency
                            } = ${exchangeRate} TRY/Birim`
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Product/Stock Rows Builder (FOR INVOICES ONLY) */}
              {(modalType === 'sale' || modalType === 'purchase') && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
                    <h4 className="text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono">Fatura Kalemleri (Ürün / Hizmet Satırları)</h4>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
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
                          className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 text-white rounded text-[10px] font-mono focus:outline-hidden focus:border-teal-500 placeholder-white/30"
                        />
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                      </div>
                      <button 
                        id="btn-add-row"
                        type="button"
                        onClick={addInvoiceItemRow}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-teal-400 hover:text-teal-300 hover:bg-white/5 px-2 py-1 rounded transition cursor-pointer shrink-0"
                      >
                        <PlusCircle size={14} />
                        <span>Satır Ekle</span>
                      </button>
                    </div>
                  </div>

                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end bg-white/[0.01] p-3 rounded border border-white/5">
                      {/* Select Product */}
                      <div className="flex-1">
                        <label className="block text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Seçilen Ürün *</label>
                        <select 
                          id={`form-row-stock-${index}`}
                          value={item.stockId}
                          onChange={(e) => handleItemFieldChange(index, 'stockId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 text-white rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                        >
                          <option value="" className="bg-[#0c0c0c]">
                            {item.stockId === '' && item.stockName ? `🤖 Bulunamadı: "${item.stockName}" (Lütfen Seçin)` : '-- Ürün / Hizmet Seçin --'}
                          </option>
                          {stoklar.map(stok => (
                            <option key={stok.id} value={stok.id} className="bg-[#0c0c0c]">
                              {stok.name} (Mevcut: {stok.quantity} {stok.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-24">
                        <label className="block text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Miktar</label>
                        <div className="flex items-center border border-white/10 rounded bg-white/5 overflow-hidden">
                          <input 
                            id={`form-row-qty-${index}`}
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-transparent text-xs text-center text-white focus:outline-hidden"
                          />
                          <span className="px-1.5 text-[10px] bg-white/5 font-semibold text-white/40 border-l border-white/10">{item.unit}</span>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="w-32">
                        <label className="block text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Birim Fiyat (KDV Hariç)</label>
                        <div className="relative">
                          <input 
                            id={`form-row-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price || ''}
                            onChange={(e) => handleItemFieldChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-2 pr-6 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white font-semibold focus:outline-hidden focus:border-teal-500"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">{isMultiCurrency ? transactionCurrency : activeCariCurrency}</span>
                        </div>
                      </div>

                      {/* Tax Rate */}
                      <div className="w-20">
                        <label className="block text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">KDV %</label>
                        <select 
                          id={`form-row-tax-${index}`}
                          value={item.taxRate}
                          onChange={(e) => handleItemFieldChange(index, 'taxRate', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-mono"
                        >
                          <option value="0" className="bg-[#0c0c0c]">0</option>
                          <option value="1" className="bg-[#0c0c0c]">1</option>
                          <option value="10" className="bg-[#0c0c0c]">10</option>
                          <option value="20" className="bg-[#0c0c0c]">20</option>
                        </select>
                      </div>

                      {/* Line Total */}
                      <div className="w-32 text-right">
                        <label className="block text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Satır Toplamı</label>
                        <div className="text-xs font-bold text-white/90 bg-white/5 px-2.5 py-1.5 rounded border border-white/5 font-mono">
                          {formatCurrency(item.total, isMultiCurrency ? transactionCurrency : activeCariCurrency)}
                        </div>
                      </div>

                      {/* Delete Row Button */}
                      <div className="flex items-center justify-center pb-0.5">
                        <button 
                          id={`btn-remove-row-${index}`}
                          type="button"
                          disabled={invoiceItems.length === 1}
                          onClick={() => removeInvoiceItemRow(index)}
                          className="p-1.5 text-white/30 hover:text-red-400 disabled:opacity-20 hover:bg-white/5 rounded transition cursor-pointer"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Summary Calculations Container */}
                  <div className="flex justify-end pt-3">
                    <div className="w-64 bg-white/[0.01] border border-white/5 p-4 rounded-lg space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-white/40">
                        <span>Matrah:</span>
                        <span className="font-semibold text-white/85">{formatCurrency(invoiceTotals.subtotal, isMultiCurrency ? transactionCurrency : activeCariCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-white/40 pb-1.5 border-b border-white/5">
                        <span>KDV Toplamı:</span>
                        <span className="font-semibold text-white/85">{formatCurrency(invoiceTotals.totalTax, isMultiCurrency ? transactionCurrency : activeCariCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-white font-bold">
                        <span>Genel Toplam:</span>
                        <span className="font-bold text-teal-400" style={{ fontSize: '13px' }}>{formatCurrency(invoiceTotals.grandTotal, isMultiCurrency ? transactionCurrency : activeCariCurrency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Simple Receipt Amount Box (FOR COLLECTIONS / PAYMENTS) */}
              {(modalType === 'collection' || modalType === 'payment') && (
                <div className="pt-4 border-t border-white/5">
                  <div className="max-w-md mx-auto">
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Ödeme / Makbuz Tutarı *</label>
                    <div className="relative">
                      <input 
                        id="form-receipt-amount"
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={receiptAmount || ''}
                        onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3 bg-white/5 border rounded text-lg font-bold focus:outline-hidden focus:border-teal-500 font-mono ${
                          modalType === 'collection' ? 'text-teal-400 border-teal-500/20' : 'text-red-400 border-red-500/20'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-white/30 font-mono">{isMultiCurrency ? transactionCurrency : activeCariCurrency}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* General Description */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">İşlem Açıklaması</label>
                <textarea 
                  id="form-islem-desc"
                  rows={2}
                  placeholder="İşlem ile ilgili not veya açıklama girin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-transparent">
                <button 
                  id="btn-islem-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/40 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  id="btn-islem-save"
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 text-[10px] uppercase tracking-wider font-bold text-black rounded transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                    isSubmitting 
                      ? 'bg-teal-800 text-teal-200' 
                      : 'bg-teal-500 hover:bg-teal-600 shadow-[0_0_8px_rgba(45,212,191,0.2)]'
                  }`}
                >
                  {isSubmitting ? (editingTransaction ? 'Güncelleniyor...' : 'Kaydediliyor...') : (
                    <span className="flex items-center gap-1">
                      <FileCheck size={14} /> 
                      {editingTransaction ? 'Değişiklikleri Güncelle' : 'İşlemi Tamamla'}
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

        const textScale = activeTemplate?.textSize === 'small' ? 0.85 : activeTemplate?.textSize === 'large' ? 1.15 : 1;

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
                              
                              let pageWidth = '210mm';
                              let pageHeight = '297mm';
                              let pageCssSize = 'A4 portrait';
                              
                              if (printPageSize === 'a4_yatay') {
                                pageWidth = '297mm';
                                pageHeight = '210mm';
                                pageCssSize = 'A4 landscape';
                              } else if (printPageSize === 'a5') {
                                pageWidth = '148mm';
                                pageHeight = '210mm';
                                pageCssSize = 'A5 portrait';
                              } else if (printPageSize === 'a5_yatay') {
                                pageWidth = '210mm';
                                pageHeight = '148mm';
                                pageCssSize = 'A5 landscape';
                              } else if (printPageSize === 'etiket_60x40') {
                                pageWidth = '60mm';
                                pageHeight = '40mm';
                                pageCssSize = '60mm 40mm';
                              } else if (printPageSize === 'etiket_80x50') {
                                pageWidth = '80mm';
                                pageHeight = '50mm';
                                pageCssSize = '80mm 50mm';
                              } else if (printPageSize === 'etiket_40x30') {
                                pageWidth = '40mm';
                                pageHeight = '30mm';
                                pageCssSize = '40mm 30mm';
                              } else if (printPageSize === 'etiket_40x20') {
                                pageWidth = '40mm';
                                pageHeight = '20mm';
                                pageCssSize = '40mm 20mm';
                              } else if (printPageSize === 'termal_80') {
                                pageWidth = '80mm';
                                pageHeight = 'auto';
                                pageCssSize = '80mm auto';
                              } else if (printPageSize === 'termal_58') {
                                pageWidth = '58mm';
                                pageHeight = 'auto';
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
                      className={`px-4 py-1.5 ${isPrintReady ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20 shadow-lg cursor-pointer active:scale-95 text-black' : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'} text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2`}
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
                      <div style={{ zoom: textScale }}>
                        {/* Header Logo & Address */}
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                        <div className="max-w-[50%]">
                          {/* Changeable Logo renderer */}
                          {activeTemplate?.showLogo !== false && (
                            <div className="mb-3">
                              {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-12 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <h2 className="text-2xl font-extrabold tracking-tight uppercase text-zinc-900 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                              )}
                            </div>
                          )}
                          
                          {activeTemplate?.showCompanyAddress !== false && (
                            <div className="text-[10px] text-slate-600 leading-tight whitespace-pre-line font-sans">
                              {activeTemplate?.showLogo === false && <strong className="text-sm text-slate-900 block mb-1">{printSettings.companyName}</strong>}
                              <p>{printSettings.companyAddress}</p>
                              <p className="mt-1 font-bold">Tel: {printSettings.companyPhone}</p>
                            </div>
                          )}
                        </div>

                        {/* Document Details (Tarih, No) */}
                        <div className="text-right">
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            {dynamicPrintVars?.title || 'BELGE'}
                          </h1>
                          <div className="text-xs text-slate-500 mt-2 font-mono">
                            Tarih: {selectedPrintTransaction.date}
                            <br />
                            Belge No / Seri: {selectedPrintTransaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                          </div>
                        </div>
                      </div>

                      {/* Customer Account / Recipient */}
                      <div className="flex justify-between mb-8">
                        <div className="text-sm">
                          <div className="font-bold text-slate-900 mb-1">Sayın,</div>
                          <div className="text-slate-700">{selectedPrintTransaction.cariName}</div>
                          {currentCariForPrint && (
                            <div className="text-xs text-slate-500 mt-1 whitespace-pre-line font-sans">
                              {currentCariForPrint.address && <p>{currentCariForPrint.address}</p>}
                              {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                <p className="mt-1">
                                  {currentCariForPrint.taxOffice ? `${currentCariForPrint.taxOffice} V.D.` : ""}
                                  {currentCariForPrint.taxNo ? ` / No: ${currentCariForPrint.taxNo}` : ""}
                                </p>
                              )}
                              {currentCariForPrint.phone && <p>Tel: {currentCariForPrint.phone}</p>}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs">
                          {activeTemplate?.showValidityDate && (
                            <div className="text-slate-600 mb-1">
                              Geçerlilik Tarihi: <span className="font-bold">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Itemized Table */}
                      <table className="w-full text-left text-xs mb-8">
                        <thead className="bg-slate-100 border-y border-slate-300">
                          <tr>
                            <th className="py-2 px-2 font-bold text-slate-700">Ürün / Hizmet</th>
                            <th className="py-2 px-2 font-bold text-slate-700 text-center">Miktar</th>
                            {activeTemplate?.showUnitPrice !== false && <th className="py-2 px-2 font-bold text-slate-700 text-right">Birim Fiyat</th>}
                            {activeTemplate?.showDiscountRate && <th className="py-2 px-2 font-bold text-slate-700 text-center">İndirim</th>}
                            {activeTemplate?.showVatRate && <th className="py-2 px-2 font-bold text-slate-700 text-center">KDV</th>}
                            {activeTemplate?.showExVatAmount && <th className="py-2 px-2 font-bold text-slate-700 text-right">KDV Hariç</th>}
                            <th className="py-2 px-2 font-bold text-slate-700 text-right">Toplam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPrintTransaction.items && selectedPrintTransaction.items.length > 0 ? (
                            selectedPrintTransaction.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-100">
                                <td className="py-2 px-2 text-slate-800">
                                  {item.stockName}
                                </td>
                                <td className="py-2 px-2 text-slate-600 text-center">
                                  {item.quantity} {item.unit || 'Adet'}
                                </td>
                                {activeTemplate?.showUnitPrice !== false && (
                                  <td className="py-2 px-2 text-slate-600 text-right font-mono">
                                    {formatPrintCurrency(item.price, selectedPrintTransaction.currency || 'TRY')}
                                  </td>
                                )}
                                {activeTemplate?.showDiscountRate && (
                                  <td className="py-2 px-2 text-slate-600 text-center font-mono">%0</td>
                                )}
                                {activeTemplate?.showVatRate && (
                                  <td className="py-2 px-2 text-slate-600 text-center font-mono">%{item.taxRate || 0}</td>
                                )}
                                {activeTemplate?.showExVatAmount && (
                                  <td className="py-2 px-2 text-slate-600 text-right font-mono">
                                    {formatPrintCurrency(item.price * item.quantity, selectedPrintTransaction.currency || 'TRY')}
                                  </td>
                                )}
                                <td className="py-2 px-2 font-bold text-slate-900 text-right font-mono">
                                  {formatPrintCurrency(item.total, selectedPrintTransaction.currency || 'TRY')}
                                </td>
                              </tr>
                            ))
                          ) : (
                            /* Receipts fallback (collection or payment) */
                            <tr className="border-b border-slate-100">
                              <td className="py-2 px-2 text-slate-800">
                                {selectedPrintTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {selectedPrintTransaction.description || 'Cari hesaba yansıtılan finans hareketi.'}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-slate-600 text-center font-mono">1 Adet</td>
                              {activeTemplate?.showUnitPrice !== false && (
                                <td className="py-2 px-2 text-slate-600 text-right font-mono">
                                  {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                                </td>
                              )}
                              {activeTemplate?.showDiscountRate && <td className="py-2 px-2"></td>}
                              {activeTemplate?.showVatRate && <td className="py-2 px-2"></td>}
                              {activeTemplate?.showExVatAmount && <td className="py-2 px-2"></td>}
                              <td className="py-2 px-2 font-bold text-slate-900 text-right font-mono">
                                {formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Summary (Bakiye & Toplam) */}
                      <div className="flex justify-between mb-12">
                        <div className="w-1/2 flex flex-col justify-end">
                          {dynamicPrintVars?.showBalance && currentCariForPrint && (
                            <div className="text-xs text-slate-600 border border-slate-200 p-3 rounded bg-slate-50 inline-block w-max font-mono">
                              Güncel Bakiye: <span className="font-bold text-slate-900">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                            </div>
                          )}
                          {dynamicPrintVars?.notes && activeTemplate?.showFooter !== false && (
                            <div className="mt-4">
                              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1">AÇIKLAMA</h4>
                              <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line font-sans">
                                {dynamicPrintVars.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="w-64">
                          <div className="flex justify-between py-1 text-sm border-b border-slate-200 font-bold">
                            <span className="text-slate-900 uppercase">Toplam Tutar:</span>
                            <span className="text-slate-900 font-mono">{formatPrintCurrency(selectedPrintTransaction.amount, selectedPrintTransaction.currency || 'TRY')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subtle footer credit */}
                      {activeTemplate?.showFooter !== false && (
                        <div className="text-[10px] text-slate-500 text-center font-mono uppercase tracking-widest pt-4">
                          On Muhasebe Bilgi Sistemi Tarafından Üretilmiştir.
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        );
      })()}
    </div>
  );
}
