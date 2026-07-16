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

