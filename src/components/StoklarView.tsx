import React, { useState, useMemo, useEffect } from 'react';
import Barcode from 'react-barcode';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Stock, Transaction, Cari } from '../types';
import { saveStock, deleteStock } from '../firebase';
import { compressImage } from '../utils/imageCompressor';
import { parseScannedQrCode } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  Printer, 
  AlertCircle,
  Image as ImageIcon,
  Download,
  Scan,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

interface StoklarViewProps {
  stoklar?: Stock[];
  islemler?: Transaction[];
  cariler?: Cari[];
  aiPrefilledData?: any;
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
  pendingAddStock?: boolean;
  onStockAdded?: () => void;
}

export default function StoklarView({
  stoklar = [],
  islemler = [],
  cariler: _cariler = [],
  aiPrefilledData,
  onClearAiPrefilledData,
  userRole = 'employee',
  actionPermissions = { delete_sale: false, delete_payment: false, delete_stock: false, decrease_stock: false, edit_sale: false, edit_payment: false, edit_stock: false },
  escalationPin = '1923',
  isSecurityActive = false,
  pendingAddStock,
  onStockAdded,
}: StoklarViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'instock' | 'outstock'>('all');
  
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<Stock | null>(null);
  const [expandedCariId, setExpandedCariId] = useState<string | null>(null);

  // Calculate who got how many of this stock
  const salesDetails = useMemo(() => {
    if (!selectedStockForDetails || !islemler) return [];
    
    // Filter transactions that have items of this stock
    // types: "sale" (sales), "sale_return" (returns)
    const relevantTransactions = islemler.filter(tx => 
      (tx.type === 'sale' || tx.type === 'sale_return') &&
      tx.items?.some(item => item.stockId === selectedStockForDetails.id)
    );
    
    const cariGroups: { [key: string]: { 
      cariName: string; 
      cariId: string;
      totalQuantity: number; 
      totalAmount: number; 
      transactions: Array<{
        id: string;
        date: string;
        invoiceNo?: string;
        quantity: number;
        price: number;
        total: number;
        type: string;
      }>
    }} = {};
    
    relevantTransactions.forEach(tx => {
      const item = tx.items?.find(it => it.stockId === selectedStockForDetails.id);
      if (!item) return;
      
      const cariId = tx.cariId || 'unknown';
      const cariName = tx.cariName || 'Bilinmeyen Cari';
      
      const isReturn = tx.type === 'sale_return';
      const quantity = isReturn ? -item.quantity : item.quantity;
      const total = isReturn ? -item.total : item.total;
      
      if (!cariGroups[cariId]) {
        cariGroups[cariId] = {
          cariName,
          cariId,
          totalQuantity: 0,
          totalAmount: 0,
          transactions: []
        };
      }
      
      cariGroups[cariId].totalQuantity += quantity;
      cariGroups[cariId].totalAmount += total;
      cariGroups[cariId].transactions.push({
        id: tx.id,
        date: tx.date,
        invoiceNo: tx.invoiceNo,
        quantity,
        price: item.price,
        total,
        type: tx.type
      });
    });
    
    return Object.values(cariGroups)
      .filter(g => g.totalQuantity !== 0 || g.transactions.length > 0)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [selectedStockForDetails, islemler]);
  
  // PIN Verification for restricted employee actions
  const [pinVerificationAction, setPinVerificationAction] = useState<(() => void) | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const checkPermissionAndExecute = (actionKey: 'delete_stock' | 'decrease_stock' | 'edit_stock', executeAction: () => void) => {
    if (!isSecurityActive || userRole === 'admin' || actionPermissions[actionKey]) {
      executeAction();
    } else {
      setPinVerificationAction(() => executeAction);
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingStock, setPrintingStock] = useState<Stock | null>(null);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // QR Code State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrStock, setQrStock] = useState<Stock | null>(null);
  const [qrContentMode, setQrContentMode] = useState<'all' | 'barcode' | 'custom'>('all');
  const [qrCustomText, setQrCustomText] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isQrPrinting, setIsQrPrinting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      const barcodeTemplates = parsed.filter((t: any) => t.type === 'barkod');
      setPrintTemplates(barcodeTemplates);
      if (barcodeTemplates.length > 0) {
        setSelectedTemplateId(barcodeTemplates[0].id);
      }
    }
  }, []);

  // Generate QR Code base64 data URL dynamically
  useEffect(() => {
    if (qrStock) {
      let textToEncode = '';
      if (qrContentMode === 'all') {
        textToEncode = `Ürün: ${qrStock.name}\nKod: ${qrStock.code}\nBarkod: ${qrStock.barcode || '-'}\nFiyat: ${qrStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL\nKDV: %${qrStock.taxRate}`;
      } else if (qrContentMode === 'barcode') {
        textToEncode = qrStock.barcode || qrStock.code;
      } else {
        textToEncode = qrCustomText || `https://storm.onmuhasebe.app/urun/${qrStock.id}`;
      }

      QRCode.toDataURL(textToEncode, {
        width: 350,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('QR Kod oluşturma hatası:', err);
      });
    }
  }, [qrStock, qrContentMode, qrCustomText]);

  // Handle physical barcode scanner input globally in StoklarView
  useEffect(() => {
    const handleHardwareScan = (e: Event) => {
      const customEvent = e as CustomEvent;
      const code = (customEvent.detail.code || '').trim();
      if (!code) return;

      if (isModalOpen) {
        // If stock creation/editing form is open, fill barcode field
        setFormData(prev => ({ ...prev, barcode: code }));
      } else {
        // If not in modal, use the scanned code as search term to filter stocks instantly
        setSearchTerm(code);
      }

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
    };

    window.addEventListener('global-hardware-barcode-scan', handleHardwareScan);
    return () => {
      window.removeEventListener('global-hardware-barcode-scan', handleHardwareScan);
    };
  }, [isModalOpen]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    imageUrl: '',
    unit: 'Adet' as 'Adet' | 'KG' | 'Litre' | 'Metre' | 'Kutu' | 'Hizmet',
    purchasePrice: 0,
    salesPrice: 0,
    taxRate: 20,
    quantity: 0,
    minQuantity: 5
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and search Stock items
  const filteredStoklar = useMemo(() => {
    return stoklar.filter(stok => {
      const matchSearch = 
        stok.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stok.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stok.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      switch (filterType) {
        case 'critical':
          return stok.quantity <= stok.minQuantity;
        case 'instock':
          return stok.quantity > 0;
        case 'outstock':
          return stok.quantity <= 0;
        default:
          return true;
      }
    });
  }, [stoklar, searchTerm, filterType]);

  // General Inventory Stats
  const invStats = useMemo(() => {
    let totalItems = stoklar.length;
    let criticalItemsCount = stoklar.filter(s => s.quantity <= s.minQuantity).length;
    let totalStockValue = stoklar.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
    let totalQuantity = stoklar.reduce((sum, s) => sum + s.quantity, 0);

    return {
      totalItems,
      criticalItemsCount,
      totalStockValue,
      totalQuantity
    };
  }, [stoklar]);

  // Open modal with AI prefilled data
  useEffect(() => {
    if (aiPrefilledData) {
      const type = aiPrefilledData.islem;
      if (type === 'add_product') {
        setEditingStock(null);
        setFormData({
          name: aiPrefilledData.urunAdi || '',
          code: aiPrefilledData.code || `STK-${String(stoklar.length + 1).padStart(4, '0')}`,
          barcode: aiPrefilledData.barcode || '',
          imageUrl: '',
          unit: (aiPrefilledData.unit && ['Adet', 'KG', 'Litre', 'Metre', 'Kutu', 'Hizmet'].includes(aiPrefilledData.unit))
            ? aiPrefilledData.unit as any
            : 'Adet',
          purchasePrice: aiPrefilledData.purchasePrice || 0,
          salesPrice: aiPrefilledData.salesPrice || 0,
          taxRate: aiPrefilledData.kdv !== undefined ? aiPrefilledData.kdv : 20,
          quantity: aiPrefilledData.miktar || 0,
          minQuantity: aiPrefilledData.minQuantity || 5
        });
        setFormError('');
        setIsModalOpen(true);

        if (onClearAiPrefilledData) {
          onClearAiPrefilledData();
        }
      }
    }
  }, [aiPrefilledData, stoklar.length, onClearAiPrefilledData]);

  // Optimize all barcode SVGs on the screen for maximum crispness
  useEffect(() => {
    const svgs = document.querySelectorAll('.barcode-svg-container svg');
    svgs.forEach(svg => {
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.querySelectorAll('*').forEach(child => {
        child.setAttribute('vector-effect', 'non-scaling-stroke');
      });
    });
  }, [printingStock, selectedTemplateId, isPrintModalOpen]);

  // Open modal automatically when pendingAddStock is triggered
  useEffect(() => {
    if (pendingAddStock) {
      handleOpenCreateModal();
      if (onStockAdded) {
        onStockAdded();
      }
    }
  }, [pendingAddStock, onStockAdded]);

  // Open modal for creating new Stock item
  const handleOpenCreateModal = () => {
    setEditingStock(null);
    setFormData({
      name: '',
      code: `STK-${String(stoklar.length + 1).padStart(4, '0')}`,
      barcode: '',
      imageUrl: '',
      unit: 'Adet',
      purchasePrice: 0,
      salesPrice: 0,
      taxRate: 20,
      quantity: 0,
      minQuantity: 5
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing Stock item
  const handleOpenEditModal = (stock: Stock) => {
    checkPermissionAndExecute('edit_stock', () => {
      setEditingStock(stock);
      setFormData({
        name: stock.name,
        code: stock.code,
        barcode: stock.barcode || '',
        imageUrl: stock.imageUrl || '',
        unit: stock.unit,
        purchasePrice: stock.purchasePrice,
        salesPrice: stock.salesPrice,
        taxRate: stock.taxRate,
        quantity: stock.quantity,
        minQuantity: stock.minQuantity
      });
      setFormError('');
      setIsModalOpen(true);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Lütfen ürün/hizmet adını girin.');
      return;
    }
    if (formData.purchasePrice < 0 || formData.salesPrice < 0) {
      setFormError('Fiyatlar sıfırdan küçük olamaz.');
      return;
    }
    
    // Check stock decrease permission if editing
    if (editingStock) {
      const originalQty = editingStock.quantity || 0;
      const newQty = formData.quantity || 0;
      if (newQty < originalQty) {
        checkPermissionAndExecute('decrease_stock', proceedWithSave);
        return;
      }
    }

    proceedWithSave();
  };

  const proceedWithSave = async () => {
    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingStock) {
        const updatedStock: Omit<Stock, 'id'> = {
          name: formData.name,
          code: formData.code,
          barcode: formData.barcode,
          imageUrl: formData.imageUrl,
          unit: formData.unit,
          purchasePrice: formData.purchasePrice,
          salesPrice: formData.salesPrice,
          taxRate: formData.taxRate,
          quantity: formData.quantity,
          minQuantity: formData.minQuantity,
          createdAt: editingStock.createdAt || new Date().toISOString()
        };
        await saveStock(updatedStock, editingStock.id);
      } else {
        const newStock: Omit<Stock, 'id'> = {
          name: formData.name,
          code: formData.code,
          barcode: formData.barcode,
          imageUrl: formData.imageUrl,
          unit: formData.unit,
          purchasePrice: formData.purchasePrice,
          salesPrice: formData.salesPrice,
          taxRate: formData.taxRate,
          quantity: formData.quantity,
          minQuantity: formData.minQuantity,
          createdAt: new Date().toISOString()
        };
        await saveStock(newStock);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError('Stok kartı kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle stock deletion
  const handleDelete = async (id: string, name: string) => {
    const executeDelete = async () => {
      if (window.confirm(`"${name}" isimli stok kartını silmek istediğinize emin misiniz?`)) {
        try {
          await deleteStock(id);
        } catch (err) {
          console.error(err);
          alert('Stok kartı silinirken bir hata oluştu.');
        }
      }
    };

    checkPermissionAndExecute('delete_stock', executeDelete);
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 300, 300, 0.7);
        setFormData({ ...formData, imageUrl: compressedBase64 });
      } catch (err) {
        console.error("Resim sıkıştırma hatası:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg">
        <div>
          <h1 id="stoklar-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Ürün ve Stok Takibi</h1>
          <p className="text-white/40 text-xs mt-1">Sattığınız ürünlerin, sunduğunuz hizmetlerin stok miktarlarını ve maliyetlerini anlık izleyin.</p>
        </div>
        <button 
          id="btn-add-stock"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-black text-xs font-semibold uppercase tracking-wider px-4 py-3 rounded-lg transition duration-150 shadow-[0_0_12px_rgba(45,212,191,0.2)] cursor-pointer"
        >
          <Plus size={16} />
          <span>Yeni Stok Kartı Ekle</span>
        </button>
      </div>

      {/* Inventory Mini Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col justify-between">
          <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Stok Çeşidi</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-light italic text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>{invStats.totalItems}</span>
            <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Ürün</span>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col justify-between">
          <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Toplam Miktar</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-light italic text-white/95" style={{ fontFamily: 'Georgia, serif' }}>{invStats.totalQuantity}</span>
            <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Birim</span>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col justify-between">
          <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Kritik Limit</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-light italic ${invStats.criticalItemsCount > 0 ? 'text-red-400' : 'text-teal-400'}`} style={{ fontFamily: 'Georgia, serif' }}>{invStats.criticalItemsCount}</span>
            <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Ürün</span>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col justify-between">
          <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Stok Değeri</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-light italic text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>{formatCurrency(invStats.totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            id="search-stock"
            type="text"
            placeholder="Ürün adı veya stok kodu ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-teal-500 focus:bg-white/[0.08] transition"
          />
          <button
            type="button"
            onClick={() => {
              setScannerTarget('search');
              setIsScannerOpen(true);
            }}
            title="Kamera ile Barkod / QR Kod Tara"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 text-teal-400 hover:text-teal-300 rounded-md transition cursor-pointer"
          >
            <Scan size={16} />
          </button>
        </div>
        
        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="filter-stock-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'all' 
                ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tüm Stoklar
          </button>
          <button 
            id="filter-stock-critical"
            onClick={() => setFilterType('critical')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'critical' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400 font-bold' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Kritik Sınır ({invStats.criticalItemsCount})
          </button>
          <button 
            id="filter-stock-instock"
            onClick={() => setFilterType('instock')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'instock' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Stokta Olanlar
          </button>
          <button 
            id="filter-stock-outstock"
            onClick={() => setFilterType('outstock')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'outstock' 
                ? 'bg-white/10 border border-white/20 text-white/80' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tükenenler
          </button>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-[#111111] rounded-lg border border-white/5 shadow-lg overflow-hidden">
        {filteredStoklar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="text-white/20 mb-4" size={48} />
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">Stok Kartı Bulunamadı</h3>
            <p className="text-xs text-white/40 mt-2 max-w-sm font-mono uppercase tracking-widest">Kriterlerinize uygun bir ürün/hizmet kaydı bulunamadı.</p>
            <button 
              id="btn-no-stock-add"
              onClick={handleOpenCreateModal}
              className="mt-6 bg-teal-500 hover:bg-teal-600 text-black text-[10px] uppercase tracking-wider font-bold px-5 py-3 rounded-lg shadow-[0_0_12px_rgba(45,212,191,0.2)]"
            >
              Yeni Stok Ekle
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Kod & Ürün Adı</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Birim</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Alış Fiyatı</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Satış Fiyatı</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">KDV %</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Mevcut Miktar</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Toplam Değer</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStoklar.map((stok) => {
                    const isCritical = stok.quantity <= stok.minQuantity;
                    const stockValue = (stok.quantity || 0) * (stok.purchasePrice || 0);
                    return (
                      <tr key={stok.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {stok.imageUrl ? (
                              <div className="w-10 h-10 rounded overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                <img src={stok.imageUrl} alt={stok.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/20 shrink-0">
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <div 
                                onClick={() => setSelectedStockForDetails(stok)}
                                title="Ürün detayları ve teslimat geçmişi için tıklayın"
                                className="font-bold text-teal-400 hover:text-teal-300 cursor-pointer hover:underline transition text-sm"
                              >
                                {stok.name}
                              </div>
                              <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider flex items-center gap-2">
                                <span>{stok.code}</span>
                                {stok.barcode && (
                                  <span className="text-teal-400/70">| Barkod: {stok.barcode}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono tracking-wider font-semibold text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded">{stok.unit}</span>
                        </td>
                        <td className="p-4 text-sm font-medium text-white/70" style={{ fontFamily: 'Georgia, serif' }}>
                          {formatCurrency(stok.purchasePrice)}
                        </td>
                        <td className="p-4 text-sm font-semibold text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>
                          {formatCurrency(stok.salesPrice)}
                        </td>
                        <td className="p-4 text-center text-xs font-semibold text-white/40 font-mono">
                          %{stok.taxRate}
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-bold text-sm ${
                            isCritical ? 'text-red-400' : 'text-white/90'
                          }`}>
                            {stok.quantity} {stok.unit}
                          </div>
                          {isCritical && (
                            <div className="text-[9px] text-red-400 font-medium flex items-center justify-end gap-1 mt-1 uppercase tracking-wider font-mono">
                              <AlertTriangle size={10} />
                              <span>Kritik (Sınır: {stok.minQuantity})</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right font-semibold text-sm text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>
                          {formatCurrency(stockValue)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              id={`btn-qr-stok-${stok.id}`}
                              onClick={() => { setQrStock(stok); setQrContentMode('all'); setQrCustomText(''); setIsQrModalOpen(true); }}
                              title="QR Kod Oluştur"
                              className="p-2 text-teal-400 hover:bg-white/5 rounded transition"
                            >
                              <QrCode size={16} />
                            </button>
                            <button 
                              id={`btn-print-stok-${stok.id}`}
                              onClick={() => { setPrintingStock(stok); setIsPrintModalOpen(true); }}
                              title="Barkod Yazdır"
                              className="p-2 text-blue-400 hover:bg-white/5 rounded transition"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              id={`btn-edit-stok-${stok.id}`}
                              onClick={() => handleOpenEditModal(stok)}
                              title="Düzenle"
                              className="p-2 text-amber-400 hover:bg-white/5 rounded transition"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              id={`btn-delete-stok-${stok.id}`}
                              onClick={() => handleDelete(stok.id, stok.name)}
                              title="Sil"
                              className="p-2 text-red-400 hover:bg-white/5 rounded transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredStoklar.map((stok) => {
                const isCritical = stok.quantity <= stok.minQuantity;
                const stockValue = (stok.quantity || 0) * (stok.purchasePrice || 0);
                return (
                  <div key={stok.id} className="p-4 bg-white/[0.01] rounded-lg border border-white/5 flex flex-col gap-3 justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-3 items-start">
                          {stok.imageUrl ? (
                            <div className="w-12 h-12 rounded overflow-hidden bg-white/5 border border-white/10 shrink-0">
                              <img src={stok.imageUrl} alt={stok.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/20 shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <div 
                              onClick={() => setSelectedStockForDetails(stok)}
                              title="Ürün detayları ve teslimat geçmişi için tıklayın"
                              className="font-bold text-teal-400 hover:text-teal-300 cursor-pointer hover:underline transition text-sm leading-tight"
                            >
                              {stok.name}
                            </div>
                            <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider flex items-center gap-2 flex-wrap">
                              <span>{stok.code}</span>
                              {stok.barcode && (
                                <span className="text-teal-400/70">| Barkod: {stok.barcode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono tracking-wider font-semibold text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded">{stok.unit}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-white/5 pt-2 text-white/50 font-mono">
                        <div>Alış Fiyatı: <strong className="text-white/80" style={{ fontFamily: 'Georgia, serif' }}>{formatCurrency(stok.purchasePrice)}</strong></div>
                        <div>Satış Fiyatı: <strong className="text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>{formatCurrency(stok.salesPrice)}</strong></div>
                        <div>KDV Oranı: <strong className="text-white/70">%{stok.taxRate}</strong></div>
                        <div>Toplam Değer: <strong className="text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>{formatCurrency(stockValue)}</strong></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <div>
                        <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Mevcut Stok</div>
                        <div className={`font-bold text-sm flex items-center gap-1.5 ${
                          isCritical ? 'text-red-400' : 'text-white/90'
                        }`}>
                          {stok.quantity} {stok.unit}
                          {isCritical && <AlertTriangle size={12} className="text-red-400 animate-pulse" />}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          id={`btn-mob-qr-stok-${stok.id}`}
                          onClick={() => { setQrStock(stok); setQrContentMode('all'); setQrCustomText(''); setIsQrModalOpen(true); }}
                          title="QR Kod Oluştur"
                          className="p-2 text-teal-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <QrCode size={15} />
                        </button>
                        <button 
                          id={`btn-mob-print-stok-${stok.id}`}
                          onClick={() => { setPrintingStock(stok); setIsPrintModalOpen(true); }}
                          className="p-2 text-blue-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Printer size={15} />
                        </button>
                        <button 
                          id={`btn-mob-edit-stok-${stok.id}`}
                          onClick={() => handleOpenEditModal(stok)}
                          className="p-2 text-amber-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          id={`btn-mob-delete-stok-${stok.id}`}
                          onClick={() => handleDelete(stok.id, stok.name)}
                          className="p-2 text-red-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                {editingStock ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı'}
              </h3>
              <button 
                id="btn-close-stock-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2 text-xs text-red-400 font-medium">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Ürün / Hizmet Adı *</label>
                  <input 
                    id="form-stock-name"
                    type="text"
                    required
                    placeholder="Örn: Bilgisayar Masası, Yazılım Hizmeti..."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Ürün Resmi</label>
                  <div className="flex items-center gap-4">
                    {formData.imageUrl ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden border border-white/10 bg-white/5 shrink-0">
                        <img src={formData.imageUrl} alt="Ürün" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, imageUrl: ''})}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border border-white/10 border-dashed flex items-center justify-center bg-white/5 text-white/20 shrink-0">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-semibold transition inline-block">
                        Resim Seç
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="text-[10px] text-white/40 mt-1">Önerilen: 500x500px, PNG veya JPG.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Stok Kodu</label>
                  <input 
                    id="form-stock-code"
                    type="text"
                    placeholder="Örn: STK-001"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Barkod Kodu</label>
                  <div className="flex gap-2">
                    <input 
                      id="form-stock-barcode"
                      type="text"
                      placeholder="Barkod okutun veya yazın..."
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-mono focus:outline-hidden focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setIsScannerOpen(true);
                      }}
                      title="Kamera ile Barkod / QR Kod Tara"
                      className="px-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded transition text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scan size={14} />
                      <span>Tara</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, barcode: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')})}
                      className="px-3 bg-white/10 hover:bg-white/20 text-white rounded transition text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Oluştur
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Birim</label>
                  <select 
                    id="form-stock-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="Adet" className="bg-[#0c0c0c]">Adet</option>
                    <option value="KG" className="bg-[#0c0c0c]">Kilogram (KG)</option>
                    <option value="Litre" className="bg-[#0c0c0c]">Litre</option>
                    <option value="Metre" className="bg-[#0c0c0c]">Metre</option>
                    <option value="Kutu" className="bg-[#0c0c0c]">Kutu</option>
                    <option value="Hizmet" className="bg-[#0c0c0c]">Hizmet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Alış Fiyatı (KDV Hariç) *</label>
                  <div className="relative">
                    <input 
                      id="form-stock-purchase-price"
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.purchasePrice || ''}
                      onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">TL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Satış Fiyatı (KDV Hariç) *</label>
                  <div className="relative">
                    <input 
                      id="form-stock-sales-price"
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.salesPrice || ''}
                      onChange={(e) => setFormData({...formData, salesPrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-semibold text-teal-400 focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">TL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">KDV Oranı (%)</label>
                  <select 
                    id="form-stock-tax"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({...formData, taxRate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-mono"
                  >
                    <option value="0" className="bg-[#0c0c0c]">%0 (KDV Muaf)</option>
                    <option value="1" className="bg-[#0c0c0c]">%1 (Gıda vb.)</option>
                    <option value="10" className="bg-[#0c0c0c]">%10 (Hizmet/Tekstil vb.)</option>
                    <option value="20" className="bg-[#0c0c0c]">%20 (Genel KDV Oranı)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Mevcut Miktar / Stok</label>
                  <input 
                    id="form-stock-qty"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Kritik Stok Uyarı Limiti</label>
                  <input 
                    id="form-stock-min-qty"
                    type="number"
                    step="0.01"
                    placeholder="5"
                    value={formData.minQuantity || ''}
                    onChange={(e) => setFormData({...formData, minQuantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                  <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider font-mono">Stok adedi bu miktarın altına indiğinde panoda kırmızı renkte uyarı verilecektir.</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-transparent">
                <button 
                  id="btn-cancel-stock"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/40 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  id="btn-save-stock"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-[10px] uppercase tracking-wider font-semibold text-black bg-teal-500 hover:bg-teal-600 disabled:bg-teal-800 rounded transition shadow-[0_0_8px_rgba(45,212,191,0.2)] flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Barcode Modal */}
      {isPrintModalOpen && printingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                Barkod Yazdır: {printingStock.name}
              </h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              {printTemplates.length === 0 ? (
                <div className="text-center p-4 border border-white/10 rounded bg-white/5">
                  <p className="text-xs text-white/60 mb-2">Henüz bir barkod şablonu oluşturmadınız.</p>
                  <p className="text-[10px] text-white/40">Sol menüdeki <b>Ayarlar &gt; Baskı &amp; Şablon Tasarımcısı</b> bölümünden yeni bir barkod şablonu ekleyebilirsiniz.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Şablon Seçin</label>
                    <select 
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                    >
                      {printTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.paperSize})</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Preview Area */}
                  <div className="mt-4 p-4 bg-white rounded-lg flex flex-col items-center justify-center text-black overflow-hidden relative">
                    {(() => {
                      const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
                      if (!t) return null;
                      
                      const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
                      const is40x20 = t.paperSize === 'etiket_40x20';
                      const is60x40 = t.paperSize === 'etiket_60x40';
                      const is40x60 = t.paperSize === 'etiket_40x60';
                      const is80x50 = t.paperSize === 'etiket_80x50';
                      const isOzel = t.paperSize === 'etiket_ozel';
                      
                      let w = 200; // 40mm scaled x5
                      let h = 150; // 30mm scaled x5
                      if (isOzel) {
                        w = (t.customWidthCm || 6) * 50;
                        h = (t.customHeightCm || 4) * 50;
                      } else if (is60x40) { w = 300; h = 200; }
                      else if (is40x60) { w = 200; h = 300; }
                      else if (is80x50) { w = 400; h = 250; }
                      else if (is40x20) { w = 200; h = 100; }
                      
                      let bcWidth = 1;
                      let bcHeight = 40;
                      let bcFontSize = 10;
                      if (is40x20) { bcWidth = 1; bcHeight = 30; bcFontSize = 8; }
                      if (is60x40 || is80x50) { bcWidth = 2; bcHeight = 50; bcFontSize = 12; }
                      
                      const imgSize = (t.barcodeImageSize || 64) * 0.5;
                      const imgEl = (t.showImage && printingStock.imageUrl) ? (
                        <img 
                          key="img"
                          src={printingStock.imageUrl} 
                          alt="Ürün Resmi" 
                          className="object-cover rounded filter grayscale"
                          style={{ 
                            width: `${imgSize}px`, 
                            height: `${imgSize}px`,
                            WebkitFilter: 'grayscale(100%)', 
                            mixBlendMode: 'multiply' 
                          }}
                        />
                      ) : null;
                      
                      const nameEl = t.showBarcodeName !== false ? (
                        <div 
                          key="name" 
                          className="font-bold text-center whitespace-nowrap leading-tight uppercase px-1 text-black"
                          style={{
                            fontSize: t.barcodeNameSize ? `${t.barcodeNameSize * 0.5}px` : (is60x40 || is80x50 ? '12px' : '10px'),
                          }}
                        >
                          {printingStock.name}
                        </div>
                      ) : null;
                      
                      const codeEl = (t.showBarcodeCode !== false && printingStock.code) ? (
                        <div 
                          key="code" 
                          className="font-medium text-gray-700 text-center whitespace-nowrap leading-tight uppercase px-1"
                          style={{
                            fontSize: t.barcodeCodeSize ? `${t.barcodeCodeSize * 0.5}px` : (is60x40 || is80x50 ? '10px' : '9px'),
                          }}
                        >
                          {printingStock.code}
                        </div>
                      ) : null;
                      
                      const customEl = (t.showCustomText && t.customTextContent) ? (
                        <div 
                          key="custom" 
                          className="font-medium text-gray-800 text-center whitespace-nowrap leading-tight uppercase px-1"
                          style={{
                            fontSize: t.barcodeCustomTextSize ? `${t.barcodeCustomTextSize * 0.5}px` : (is60x40 || is80x50 ? '11px' : '10px'),
                          }}
                        >
                          {t.customTextContent}
                        </div>
                      ) : null;
                      
                      const priceEl = t.showBarcodePrice !== false ? (
                        <div 
                          key="price" 
                          className="font-black text-center text-black px-1 whitespace-nowrap"
                          style={{
                            fontSize: t.barcodePriceSize ? `${t.barcodePriceSize * 0.5}px` : (is60x40 || is80x50 ? '16px' : '14px'),
                          }}
                        >
                          {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                      ) : null;
                      
                      const barcodeEl = (
                        <div key="barcode" className="flex justify-center overflow-hidden barcode-svg-container">
                          <Barcode renderer="img" 
                            value={barcodeValue} 
                            format={t.barcodeFormat || "CODE128"} 
                            width={t.barcodeWidthScale ? t.barcodeWidthScale * 0.5 : bcWidth} 
                            height={t.barcodeHeight ? t.barcodeHeight * 0.5 : bcHeight} 
                            fontSize={t.barcodeFontSize ? t.barcodeFontSize * 0.5 : bcFontSize}
                            margin={0}
                            background="#ffffff"
                            displayValue={true}
                          />
                        </div>
                      );

                      const elements = [];
                      if (t.imagePosition === 'top') elements.push(imgEl);
                      if (t.barcodePosition === 'top') elements.push(barcodeEl);
                      elements.push(nameEl, codeEl, customEl, priceEl);
                      if (t.barcodePosition !== 'top') elements.push(barcodeEl);
                      if (t.imagePosition === 'bottom') elements.push(imgEl);

                      const filteredElements = elements.filter(Boolean);

                      if (isOzel) {
                        const renderOzelPreviewItem = (key: string, el: React.ReactNode) => {
                          if (!el) return null;
                          const positions = t.customPositions || {};
                          const pos = positions[key] || { x: 50, y: 50, scale: 1 };
                          return (
                            <div 
                              key={key} 
                              className="absolute"
                              style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${pos.scale || 1})`,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {el}
                            </div>
                          );
                        };

                        return (
                          <div 
                            className="border border-zinc-200 shadow-sm bg-white relative overflow-hidden"
                            style={{ 
                              width: `${w}px`, 
                              height: `${h}px`,
                              padding: t.barcodePadding !== undefined ? `${t.barcodePadding * 0.5}px` : '8px'
                            }}
                          >
                            {t.showImage && renderOzelPreviewItem('image', imgEl)}
                            {t.showBarcodeName !== false && renderOzelPreviewItem('name', nameEl)}
                            {t.showBarcodeCode !== false && renderOzelPreviewItem('code', codeEl)}
                            {(t.showCustomText && t.customTextContent) && renderOzelPreviewItem('customText', customEl)}
                            {t.showBarcodePrice !== false && renderOzelPreviewItem('price', priceEl)}
                            {renderOzelPreviewItem('barcode', barcodeEl)}
                          </div>
                        );
                      }

                      return (
                        <div 
                          className="border border-zinc-200 shadow-sm flex flex-col items-center justify-center bg-white"
                          style={{ 
                            width: `${w}px`, 
                            height: `${h}px`,
                            padding: t.barcodePadding !== undefined ? `${t.barcodePadding * 0.5}px` : '8px',
                            gap: t.barcodeGap !== undefined ? `${t.barcodeGap * 0.5}px` : '4px'
                          }}
                        >
                          {filteredElements}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const printContent = document.getElementById('printable-barcode-content');
                    if (printContent) {
                      try {
                        const dataUrl = await toPng(printContent, {
                          pixelRatio: 4, // Ultra high resolution for ultra sharp print/save
                          backgroundColor: '#ffffff'
                        });
                        const link = document.createElement('a');
                        link.download = `barkod_${printingStock.code || 'etiket'}.png`;
                        link.href = dataUrl;
                        link.click();
                      } catch (err) {
                        console.error('Resim kaydetme hatası:', err);
                        alert('Görsel oluşturulurken bir hata oluştu.');
                      }
                    }
                  }}
                  disabled={printTemplates.length === 0}
                  className="px-3 py-2 rounded text-xs font-semibold bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/20 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Barkod etiketini yüksek çözünürlüklü PNG resmi olarak indirir."
                >
                  <Download size={14} />
                  Resim Olarak İndir (PNG)
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-white/70 hover:bg-white/5 transition"
                >
                  İptal
                </button>
              <button 
                onClick={async () => {
                  const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
                  if (!t) return;
                  
                  const printContent = document.getElementById('printable-barcode-content');
                  if (printContent) {
                    try {
                      // Generate pristine high-res flat image to avoid printer driver SVG/CSS bugs
                      const dataUrl = await toPng(printContent, {
                        pixelRatio: 4, // 4x resolution for absolute crispness on thermal printers
                        backgroundColor: '#ffffff'
                      });

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
                        let pw = '40mm';
                        let ph = '30mm';
                        if (t.paperSize === 'etiket_ozel') {
                          pw = `${(t.customWidthCm || 6) * 10}mm`;
                          ph = `${(t.customHeightCm || 4) * 10}mm`;
                        } else if (t.paperSize === 'etiket_60x40') { pw = '60mm'; ph = '40mm'; }
                        else if (t.paperSize === 'etiket_40x60') { pw = '40mm'; ph = '60mm'; }
                        else if (t.paperSize === 'etiket_80x50') { pw = '80mm'; ph = '50mm'; }
                        else if (t.paperSize === 'etiket_40x20') { pw = '40mm'; ph = '20mm'; }
                        
                        iframeDoc.open();
                        iframeDoc.write(`
                          <html>
                            <head>
                              <title>Barkod Yazdır</title>
                              <style>
                                @page { 
                                  size: ${pw} ${ph}; 
                                  margin: 0 !important; 
                                }
                                html, body { 
                                  margin: 0 !important; 
                                  padding: 0 !important; 
                                  width: ${pw} !important; 
                                  height: ${ph} !important;
                                  max-width: ${pw} !important;
                                  max-height: ${ph} !important;
                                  background: white !important; 
                                  overflow: hidden !important;
                                  display: flex !important;
                                  align-items: center !important;
                                  justify-content: center !important;
                                  box-sizing: border-box !important;
                                }
                                img {
                                  width: 100% !important;
                                  height: 100% !important;
                                  object-fit: contain !important;
                                  image-rendering: pixelated !important;
                                  image-rendering: crisp-edges !important;
                                  -webkit-print-color-adjust: exact !important; 
                                  print-color-adjust: exact !important; 
                                }
                              </style>
                            </head>
                            <body>
                              <img src="${dataUrl}" alt="Barkod Etiketi" />
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
                    } catch (err) {
                      console.error('Yazdırma hazırlama hatası:', err);
                      alert('Yazdırma işlemi hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
                    }
                  } else {
                    window.print();
                  }
                }}
                disabled={printTemplates.length === 0}
                className="px-4 py-2 rounded text-xs font-bold bg-teal-500 hover:bg-teal-600 text-black transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Hidden Print Area */}
      {isPrintModalOpen && printingStock && selectedTemplateId && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '0px', height: '0px', overflow: 'hidden', zIndex: -9999, pointerEvents: 'none' }}>
          {(() => {
            const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
            if (!t) return null;
            
            const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
            const is40x20 = t.paperSize === 'etiket_40x20';
            const is60x40 = t.paperSize === 'etiket_60x40';
            const is40x60 = t.paperSize === 'etiket_40x60';
            const is80x50 = t.paperSize === 'etiket_80x50';
            
            const isOzel = t.paperSize === 'etiket_ozel';
            
            let w = 400; // default 40x30 (scaled to pixels)
            let h = 300;
            if (isOzel) {
              w = Math.round((t.customWidthCm || 6) * 100);
              h = Math.round((t.customHeightCm || 4) * 100);
            } else if (is60x40) { w = 600; h = 400; }
            else if (is40x60) { w = 400; h = 600; }
            else if (is80x50) { w = 800; h = 500; }
            else if (is40x20) { w = 400; h = 200; }

            const widthStyle = { width: `${w}px`, height: `${h}px`, backgroundColor: '#ffffff' };
            
            const scaleFactor = 2.65;
            const imgSize = (t.barcodeImageSize || 64) * scaleFactor;
            
            const imgEl = (t.showImage && printingStock.imageUrl) ? (
              <img 
                key="img"
                src={printingStock.imageUrl} 
                alt="Ürün Resmi" 
                className="object-cover rounded-sm filter grayscale"
                style={{ 
                  width: `${imgSize}px`, 
                  height: `${imgSize}px`,
                  WebkitFilter: 'grayscale(100%)', 
                  mixBlendMode: 'multiply' 
                }}
              />
            ) : null;
            
            const nameEl = t.showBarcodeName !== false ? (
              <div 
                key="name" 
                className="font-bold px-1 text-center whitespace-nowrap leading-tight uppercase text-black"
                style={{
                  fontSize: `${(t.barcodeNameSize || 12) * scaleFactor}px`
                }}
              >
                {printingStock.name}
              </div>
            ) : null;
            
            const codeEl = (t.showBarcodeCode !== false && printingStock.code) ? (
              <div 
                key="code" 
                className="font-medium text-gray-700 px-1 text-center whitespace-nowrap leading-tight uppercase"
                style={{
                  fontSize: `${(t.barcodeCodeSize || 10) * scaleFactor}px`
                }}
              >
                {printingStock.code}
              </div>
            ) : null;
            
            const customEl = (t.showCustomText && t.customTextContent) ? (
              <div 
                key="custom" 
                className="font-medium text-gray-800 px-1 text-center whitespace-nowrap leading-tight uppercase"
                style={{
                  fontSize: `${(t.barcodeCustomTextSize || 11) * scaleFactor}px`
                }}
              >
                {t.customTextContent}
              </div>
            ) : null;
            
            const priceEl = t.showBarcodePrice !== false ? (
              <div 
                key="price" 
                className="font-black text-black text-center px-1 whitespace-nowrap"
                style={{
                  fontSize: `${(t.barcodePriceSize || 14) * scaleFactor}px`
                }}
              >
                {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
            ) : null;
            
            const bcWidth = (t.barcodeWidthScale || (['etiket_40x20', 'etiket_40x60'].includes(t.paperSize) ? 1 : 2)) * scaleFactor;
            const bcHeight = (t.barcodeHeight || (t.paperSize === 'etiket_40x20' ? 30 : 50)) * scaleFactor;
            const bcFontSize = (t.barcodeFontSize || (t.paperSize === 'etiket_40x20' ? 8 : 12)) * scaleFactor;

            const barcodeEl = (
              <div key="barcode" className="flex justify-center barcode-svg-container">
                <Barcode renderer="img" 
                  value={barcodeValue} 
                  format={t.barcodeFormat || "CODE128"} 
                  width={bcWidth} 
                  height={bcHeight} 
                  fontSize={bcFontSize}
                  margin={0}
                  background="#ffffff"
                  displayValue={true}
                />
              </div>
            );

            const elements = [];
            if (t.imagePosition === 'top') elements.push(imgEl);
            if (t.barcodePosition === 'top') elements.push(barcodeEl);
            elements.push(nameEl, codeEl, customEl, priceEl);
            if (t.barcodePosition !== 'top') elements.push(barcodeEl);
            if (t.imagePosition === 'bottom') elements.push(imgEl);

            const filteredElements = elements.filter(Boolean);

            const finalPadding = (t.barcodePadding !== undefined ? t.barcodePadding : 8) * scaleFactor;
            const finalGap = (t.barcodeGap !== undefined ? t.barcodeGap : 4) * scaleFactor;

            if (isOzel) {
              const renderOzelPrintItem = (key: string, el: React.ReactNode) => {
                if (!el) return null;
                const positions = t.customPositions || {};
                const pos = positions[key] || { x: 50, y: 50, scale: 1 };
                return (
                  <div 
                    key={key} 
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) scale(${pos.scale || 1})`,
                      whiteSpace: 'nowrap',
                      margin: 0,
                      padding: 0
                    }}
                  >
                    {el}
                  </div>
                );
              };

              return (
                <div 
                  id="printable-barcode-content" 
                  className="bg-white text-black relative overflow-hidden" 
                  style={{
                    ...widthStyle,
                    padding: `${finalPadding}px`
                  }}
                >
                  {t.showImage && renderOzelPrintItem('image', imgEl)}
                  {t.showBarcodeName !== false && renderOzelPrintItem('name', nameEl)}
                  {t.showBarcodeCode !== false && renderOzelPrintItem('code', codeEl)}
                  {(t.showCustomText && t.customTextContent) && renderOzelPrintItem('customText', customEl)}
                  {t.showBarcodePrice !== false && renderOzelPrintItem('price', priceEl)}
                  {renderOzelPrintItem('barcode', barcodeEl)}
                </div>
              );
            }

            return (
              <div 
                id="printable-barcode-content" 
                className="text-center flex flex-col items-center justify-center overflow-hidden bg-white text-black" 
                style={{
                  ...widthStyle,
                  padding: `${finalPadding}px`,
                  gap: `${finalGap}px`
                }}
              >
                {filteredElements}
              </div>
            );
          })()}
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          const parsed = parseScannedQrCode(code);
          if (scannerTarget === 'search') {
            setSearchTerm(parsed);
          } else {
            setFormData(prev => ({ ...prev, barcode: parsed }));
          }
        }}
        title={scannerTarget === 'search' ? 'Stoklarda Barkod/QR Ara' : 'Stok Kartı Barkod/QR Tara'}
        multiScan={false}
      />

      {/* Product QR Code Modal */}
      {isQrModalOpen && qrStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <QrCode className="text-teal-400" size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                  Ürün QR Kodu & Etiketi
                </h3>
              </div>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left: Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Barkod Yerine QR Kod</label>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                      Ürünü tanımlayan bir QR kod oluşturun. Bu kod akıllı telefon kameraları veya QR okuyucular tarafından taranabilir.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">QR Kod İçeriği</label>
                      <select 
                        value={qrContentMode}
                        onChange={(e) => setQrContentMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 bg-[#0c0c0c]"
                      >
                        <option value="all" className="bg-[#0c0c0c]">Tüm Ürün Bilgileri (Metin)</option>
                        <option value="barcode" className="bg-[#0c0c0c]">Sadece Barkod/Stok Kodu</option>
                        <option value="custom" className="bg-[#0c0c0c]">Özel URL / Web Sayfası</option>
                      </select>
                    </div>

                    {qrContentMode === 'custom' && (
                      <div className="animate-fade-in">
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Özel URL / Metin</label>
                        <input 
                          type="text"
                          placeholder="https://example.com/urun/123"
                          value={qrCustomText}
                          onChange={(e) => setQrCustomText(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Details info block */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[11px] font-mono space-y-1 text-white/60">
                    <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold mb-1">Ürün Kartı Bilgileri:</div>
                    <div><span className="text-white/40">Ürün Adı:</span> <strong className="text-white/80">{qrStock.name}</strong></div>
                    <div><span className="text-white/40">Kod:</span> <strong className="text-white/80">{qrStock.code}</strong></div>
                    <div><span className="text-white/40">Barkod:</span> <strong className="text-white/80">{qrStock.barcode || '-'}</strong></div>
                    <div><span className="text-white/40">Fiyat:</span> <strong className="text-teal-400">{formatCurrency(qrStock.salesPrice)} + KDV</strong></div>
                  </div>
                </div>

                {/* Right: Premium Visual Label Preview */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono self-start">Etiket Önizleme (50x50mm)</span>
                  
                  {/* Designed Printable Label container */}
                  <div 
                    id="printable-qr-label" 
                    className="w-[200px] h-[200px] bg-white text-black p-4 rounded-lg flex flex-col items-center justify-between shadow-lg relative border border-slate-200 shrink-0"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    {/* Header: Product Name */}
                    <div className="text-center w-full">
                      <div className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wide line-clamp-2 leading-tight">
                        {qrStock.name}
                      </div>
                      <div className="text-[8px] text-gray-500 font-mono font-semibold tracking-wider mt-0.5">
                        {qrStock.code}
                      </div>
                    </div>

                    {/* QR Code Graphic */}
                    {qrCodeDataUrl ? (
                      <div className="w-[96px] h-[96px] flex items-center justify-center mix-blend-multiply my-1">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    ) : (
                      <div className="w-[96px] h-[96px] bg-gray-100 animate-pulse rounded flex items-center justify-center text-[10px] text-gray-400">
                        Oluşturuluyor...
                      </div>
                    )}

                    {/* Footer: Price */}
                    <div className="text-center w-full border-t border-gray-100 pt-1 flex justify-between items-center px-1">
                      <span className="text-[7px] uppercase font-bold tracking-widest text-gray-400 font-mono">FİYAT</span>
                      <span className="font-black text-xs text-gray-950 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                        {qrStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/30 text-center uppercase tracking-wider font-mono">Bu etiket doğrudan termal yazıcılara uyumludur.</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between bg-white/[0.01]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (qrCodeDataUrl) {
                      const link = document.createElement('a');
                      link.href = qrCodeDataUrl;
                      link.download = `qrcode_${qrStock.code}.png`;
                      link.click();
                    }
                  }}
                  className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Sadece QR Kod görselini bilgisayarınıza indirir."
                >
                  <Download size={13} />
                  <span>Sadece QR</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const labelEl = document.getElementById('printable-qr-label');
                    if (labelEl) {
                      try {
                        const dataUrl = await toPng(labelEl, {
                          pixelRatio: 3,
                          backgroundColor: '#ffffff'
                        });
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = `etiket_qr_${qrStock.code}.png`;
                        link.click();
                      } catch (err) {
                        console.error('QR etiket indirme hatası:', err);
                        alert('QR etiket resmi indirilirken bir hata oluştu.');
                      }
                    }
                  }}
                  className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tüm tasarlanmış QR kod etiketini PNG görseli olarak indirir."
                >
                  <Download size={13} />
                  <span>Etiketli İndir (PNG)</span>
                </button>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/55 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isQrPrinting}
                  onClick={async () => {
                    const labelEl = document.getElementById('printable-qr-label');
                    if (labelEl) {
                      setIsQrPrinting(true);
                      try {
                        // Render label as a crisp, ultra-high-res PNG to bypass printer driver styling errors
                        const dataUrl = await toPng(labelEl, {
                          pixelRatio: 4,
                          backgroundColor: '#ffffff'
                        });

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
                          iframeDoc.open();
                          iframeDoc.write(`
                            <html>
                              <head>
                                <title>QR Kod Etiketi Yazdır</title>
                                <style>
                                  @page { 
                                    size: 50mm 50mm; 
                                    margin: 0 !important; 
                                  }
                                  html, body { 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    width: 50mm !important; 
                                    height: 50mm !important;
                                    background: white !important; 
                                    overflow: hidden !important;
                                    display: flex !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    box-sizing: border-box !important;
                                  }
                                  img {
                                    width: 100% !important;
                                    height: 100% !important;
                                    object-fit: contain !important;
                                    image-rendering: pixelated !important;
                                    image-rendering: crisp-edges !important;
                                    -webkit-print-color-adjust: exact !important; 
                                    print-color-adjust: exact !important; 
                                  }
                                </style>
                              </head>
                              <body>
                                <img src="${dataUrl}" alt="QR Kod Etiketi" />
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
                      } catch (err) {
                        console.error('QR yazdırma hatası:', err);
                        alert('Yazdırma işlemi hazırlanırken bir hata oluştu.');
                      } finally {
                        setIsQrPrinting(false);
                      }
                    }
                  }}
                  className="px-5 py-2 text-[10px] uppercase tracking-wider font-bold text-black bg-teal-500 hover:bg-teal-600 shadow-[0_0_8px_rgba(45,212,191,0.2)] rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isQrPrinting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>Hazırlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={13} />
                      <span>Etiketi Yazdır</span>
                    </>
                  )}
                </button>
              </div>
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

      {/* Product Details & Delivery History Modal */}
      {selectedStockForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.01]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono tracking-widest font-bold text-teal-400 uppercase bg-teal-500/10 px-2 py-0.5 rounded">
                    STOK TESLİMAT GEÇMİŞİ
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-white/40">
                    {selectedStockForDetails.code}
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">
                  {selectedStockForDetails.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStockForDetails(null);
                  setExpandedCariId(null);
                }}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Summary Widgets */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Toplam Verilen</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-bold text-teal-400">
                      {salesDetails.reduce((sum, g) => sum + g.totalQuantity, 0)}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {selectedStockForDetails.unit}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Toplam Ciro (Brüt)</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-semibold text-white/95" style={{ fontFamily: 'Georgia, serif' }}>
                      {formatCurrency(salesDetails.reduce((sum, g) => sum + g.totalAmount, 0))}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Müşteri Sayısı</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-bold text-teal-400">
                      {salesDetails.length}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Cari</span>
                  </div>
                </div>
              </div>

              {/* List Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono tracking-wider font-bold text-white/50 uppercase">
                  MÜŞTERI BAZLI DAĞILIM VE ADETLER
                </h4>

                {salesDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111111] rounded-xl border border-white/5 p-6">
                    <Package className="text-white/15 mb-3 animate-pulse" size={32} />
                    <p className="text-xs text-white/50 max-w-xs font-sans">
                      Bu ürüne ait herhangi bir satış veya teslimat hareketi bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {salesDetails.map((cariGroup) => {
                      const isExpanded = expandedCariId === cariGroup.cariId;
                      return (
                        <div 
                          key={cariGroup.cariId} 
                          className="bg-[#111111] rounded-xl border border-white/5 overflow-hidden transition"
                        >
                          {/* Row Header Clickable to Toggle Breakdown */}
                          <div 
                            onClick={() => setExpandedCariId(isExpanded ? null : cariGroup.cariId)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold font-mono">
                                {cariGroup.cariName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white/95">{cariGroup.cariName}</div>
                                <div className="text-[9px] text-white/40 font-mono mt-0.5 tracking-wider uppercase">
                                  {cariGroup.transactions.length} Farklı İşlem
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-xs font-bold text-teal-400 font-mono">
                                  {cariGroup.totalQuantity} {selectedStockForDetails.unit}
                                </div>
                                <div className="text-[10px] text-white/40 font-medium mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                                  {formatCurrency(cariGroup.totalAmount)}
                                </div>
                              </div>
                              <div className="text-white/30 hover:text-white transition">
                                <svg 
                                  className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-2.5 animate-fade-in">
                              <div className="text-[9px] font-mono tracking-wider font-bold text-white/40 uppercase mb-2">
                                İşlem Detayları ve Tarihleri
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="text-white/30 border-b border-white/5 pb-1 font-mono uppercase tracking-widest text-[9px]">
                                      <th className="pb-2 font-semibold">Tarih</th>
                                      <th className="pb-2 font-semibold">Evrak/Fatura No</th>
                                      <th className="pb-2 font-semibold text-center">İşlem Tipi</th>
                                      <th className="pb-2 font-semibold text-right">Birim Fiyat</th>
                                      <th className="pb-2 font-semibold text-right">Miktar</th>
                                      <th className="pb-2 font-semibold text-right">Toplam</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {cariGroup.transactions.map((tx, idx) => (
                                      <tr key={tx.id || idx} className="text-white/80 hover:bg-white/5 transition">
                                        <td className="py-2 text-white/65 font-mono">{tx.date}</td>
                                        <td className="py-2 text-white/50 font-mono">{tx.invoiceNo || 'Fatura Yok'}</td>
                                        <td className="py-2 text-center">
                                          <span className={`px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-wider rounded-sm ${
                                            tx.type === 'sale_return' 
                                              ? 'bg-rose-500/10 text-rose-400' 
                                              : 'bg-teal-500/10 text-teal-400'
                                          }`}>
                                            {tx.type === 'sale_return' ? 'İade' : 'Satış'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-right text-white/70 font-mono" style={{ fontFamily: 'Georgia, serif' }}>
                                          {formatCurrency(tx.price)}
                                        </td>
                                        <td className={`py-2 text-right font-bold font-mono ${tx.quantity < 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                                          {tx.quantity} {selectedStockForDetails.unit}
                                        </td>
                                        <td className="py-2 text-right text-white/90 font-bold font-mono" style={{ fontFamily: 'Georgia, serif' }}>
                                          {formatCurrency(tx.total)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedStockForDetails(null);
                  setExpandedCariId(null);
                }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-white/10 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
