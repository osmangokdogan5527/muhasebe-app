import { StoklarExtraModals } from './stoklar/StoklarExtraModals';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VirtualTableBody } from './VirtualTableBody';
import { motion } from 'motion/react';
import Barcode from 'react-barcode';
import * as QRCode from 'qrcode';
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
import { StockModal } from './stoklar/StockModal';
import { PrintBarcodeModal } from './stoklar/PrintBarcodeModal';

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

function StoklarView({
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
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

  const checkPermissionAndExecute = useCallback((actionKey: 'delete_stock' | 'decrease_stock' | 'edit_stock', executeAction: () => void) => {
    if (!isSecurityActive || userRole === 'admin' || actionPermissions[actionKey]) {
      executeAction();
    } else {
      setPinVerificationAction(() => executeAction);
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  }, [isSecurityActive, userRole, actionPermissions]);


  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingStock, setPrintingStock] = useState<Stock | null>(null);

  // QR Code State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrStock, setQrStock] = useState<Stock | null>(null);
  const [qrContentMode, setQrContentMode] = useState<'all' | 'barcode' | 'custom'>('all');
  const [qrCustomText, setQrCustomText] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isQrPrinting, setIsQrPrinting] = useState(false);

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

      if (!isModalOpen) {
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


  // Categories list extracted from stoklar
  const categories = useMemo(() => {
    const list = stoklar.map(s => s.category?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [stoklar]);

  // Brands list extracted from stoklar
  const brands = useMemo(() => {
    const list = stoklar.map(s => s.brand?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [stoklar]);

  // Filter and search Stock items
  const filteredStoklar = useMemo(() => {
    return stoklar.filter(stok => {
      const matchSearch = 
        stok.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stok.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stok.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stok.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (stok.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (selectedCategory && stok.category !== selectedCategory) {
        return false;
      }

      if (selectedBrand && stok.brand !== selectedBrand) {
        return false;
      }

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
  }, [stoklar, searchTerm, filterType, selectedCategory, selectedBrand]);

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
    if (aiPrefilledData && aiPrefilledData.islem === "add_product") {
      setEditingStock(null);
      setIsModalOpen(true);
    }
  }, [aiPrefilledData]);

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
  const handleOpenCreateModal = useCallback(() => {
    setEditingStock(null);
    setIsModalOpen(true);
  }, []);

  // Open modal for editing existing Stock item
  const handleOpenEditModal = useCallback((stock: Stock) => {
    checkPermissionAndExecute('edit_stock', () => {
      setEditingStock(stock);
      setIsModalOpen(true);
    });
  }, [checkPermissionAndExecute]);

  // Handle stock deletion
  const handleDelete = useCallback(async (id: string, name: string) => {
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
  }, [checkPermissionAndExecute]);

  // Format currency helper
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  }, []);

  const renderStockRow = useCallback((stok: Stock, index: number) => {
    const isCritical = stok.quantity <= stok.minQuantity;
    const stockValue = (stok.quantity || 0) * (stok.purchasePrice || 0);
    return (
      <tr key={stok.id} className="hover:bg-white/[0.02] transition h-[72px]">
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
              <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider flex flex-wrap items-center gap-2">
                <span>{stok.code}</span>
                {stok.barcode && (
                  <span className="text-teal-400/70">| Barkod: {stok.barcode}</span>
                )}
                {stok.category && (
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                    {stok.category}
                  </span>
                )}
                {stok.brand && (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                    {stok.brand}
                  </span>
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
  }, [formatCurrency, handleOpenEditModal, handleDelete]);


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

      {/* Bento-Grid Stats and Dynamic Filters */}
      <div className="space-y-4">
        {/* Row 1: Statistics & Quick Status Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Bento Card 1: Inventory Stats Summary */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between col-span-1 md:col-span-2 min-h-[140px] relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors duration-300"></div>
            
            <div>
              <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Stok Özeti</span>
              <h4 className="text-white/80 font-semibold text-xs mt-1 uppercase tracking-wider">Genel Envanter Değeri</h4>
            </div>
            <div className="flex justify-between items-end mt-4 z-10">
              <div>
                <span className="text-2xl font-light italic text-teal-400" style={{ fontFamily: 'Georgia, serif' }}>
                  {formatCurrency(invStats.totalStockValue)}
                </span>
                <span className="block text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">Toplam Envanter Maliyeti</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white/90 font-mono">
                  {invStats.totalQuantity} <span className="text-[10px] text-white/40">Birim</span>
                </div>
                <span className="block text-[8px] text-white/40 font-mono uppercase tracking-wider mt-1">Fiziksel Stok ({invStats.totalItems} Çeşit)</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Kritik Stok Risk Durumu */}
          <motion.div 
            onClick={() => setFilterType(filterType === 'critical' ? 'all' : 'critical')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`p-5 rounded-2xl border transition duration-300 cursor-pointer flex flex-col justify-between col-span-1 min-h-[140px] relative overflow-hidden group ${
              filterType === 'critical' 
                ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                : 'bg-[#111111] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono tracking-widest font-bold text-red-400 uppercase">Kritik Sınır</span>
              <AlertTriangle size={14} className={`text-red-400 ${invStats.criticalItemsCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div className="mt-4">
              <span className="text-2xl font-light italic text-red-400" style={{ fontFamily: 'Georgia, serif' }}>
                {invStats.criticalItemsCount}
              </span>
              <span className="block text-[10px] text-white/40 uppercase font-mono tracking-wider mt-1">Kritik Seviyede Ürün</span>
            </div>
          </motion.div>

          {/* Bento Card 3: Hızlı Stok Durum İzleme */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between col-span-1 min-h-[140px] relative overflow-hidden">
            <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block mb-2">Stok Durum İzleme</span>
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <motion.button 
                onClick={() => setFilterType(filterType === 'instock' ? 'all' : 'instock')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-2 rounded-xl border text-left transition duration-300 cursor-pointer flex flex-col justify-between h-[65px] ${
                  filterType === 'instock' 
                    ? 'bg-teal-500/10 border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">Mevcut</span>
                <span className="text-xs font-bold text-teal-400 mt-1 block">
                  {stoklar.filter(s => s.quantity > 0).length} <span className="text-[8px] font-normal text-white/40 font-sans">Ürün</span>
                </span>
              </motion.button>

              <motion.button 
                onClick={() => setFilterType(filterType === 'outstock' ? 'all' : 'outstock')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-2 rounded-xl border text-left transition duration-300 cursor-pointer flex flex-col justify-between h-[65px] ${
                  filterType === 'outstock' 
                    ? 'bg-white/10 border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">Tükendi</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {stoklar.filter(s => s.quantity <= 0).length} <span className="text-[8px] font-normal text-white/40 font-sans">Ürün</span>
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Row 2: Interactive Tag Filters (Categories & Brands) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bento Card 4: Hızlı Kategori Filtresi */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono tracking-widest font-bold text-teal-400 uppercase">KATEGORİLER</span>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory('')}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 pr-1">
                {categories.length === 0 ? (
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-mono py-2">
                    Henüz kategori eklenmedi.
                  </div>
                ) : (
                  categories.map(cat => {
                    const count = stoklar.filter(s => s.category === cat).length;
                    const isSelected = selectedCategory === cat;
                    return (
                      <motion.button
                        key={cat}
                        onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center gap-2 transition duration-300 cursor-pointer border ${
                          isSelected 
                            ? 'bg-teal-500 text-black font-semibold shadow-[0_0_15px_rgba(45,212,191,0.6)] border-teal-400 ring-1 ring-teal-400/30' 
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="uppercase">{cat}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.5 rounded-full transition-colors duration-300 ${isSelected ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/60'}`}>{count}</span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider pt-2 border-t border-white/5 mt-4">
              {selectedCategory ? `Filtre: ${selectedCategory.toUpperCase()}` : 'Kategori Seçin'}
            </div>
          </div>

          {/* Bento Card 5: Hızlı Marka Filtresi */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono tracking-widest font-bold text-purple-400 uppercase">MARKALAR</span>
                {selectedBrand && (
                  <button 
                    onClick={() => setSelectedBrand('')}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 pr-1">
                {brands.length === 0 ? (
                  <div className="text-[10px] text-white/30 uppercase tracking-wider font-mono py-2">
                    Henüz marka eklenmedi.
                  </div>
                ) : (
                  brands.map(brnd => {
                    const count = stoklar.filter(s => s.brand === brnd).length;
                    const isSelected = selectedBrand === brnd;
                    return (
                      <motion.button
                        key={brnd}
                        onClick={() => setSelectedBrand(isSelected ? '' : brnd)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-medium flex items-center gap-2 transition duration-300 cursor-pointer border ${
                          isSelected 
                            ? 'bg-purple-500 text-white font-semibold shadow-[0_0_15px_rgba(168,85,247,0.6)] border-purple-400 ring-1 ring-purple-400/30' 
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="uppercase">{brnd}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.5 rounded-full transition-colors duration-300 ${isSelected ? 'bg-black/20 text-white font-bold' : 'bg-white/10 text-white/60'}`}>{count}</span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider pt-2 border-t border-white/5 mt-4">
              {selectedBrand ? `Filtre: ${selectedBrand.toUpperCase()}` : 'Marka Seçin'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Category & Brand Filters Indicators */}
      {(selectedCategory || selectedBrand) && (
        <div className="flex flex-wrap items-center gap-2 bg-[#111111] p-3 rounded-xl border border-white/5 animate-fade-in">
          <span className="text-[10px] font-mono font-bold tracking-wider text-white/30 uppercase">Aktif Filtreler:</span>
          {selectedCategory && (
            <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-lg text-xs font-medium uppercase flex items-center gap-1.5">
              <span>Kategori: {selectedCategory}</span>
              <button 
                onClick={() => setSelectedCategory('')}
                className="hover:bg-white/10 p-0.5 rounded transition cursor-pointer"
                title="Kategori Filtresini Kaldır"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedBrand && (
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg text-xs font-medium uppercase flex items-center gap-1.5">
              <span>Marka: {selectedBrand}</span>
              <button 
                onClick={() => setSelectedBrand('')}
                className="hover:bg-white/10 p-0.5 rounded transition cursor-pointer"
                title="Marka Filtresini Kaldır"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedBrand('');
            }}
            className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 ml-auto tracking-wider font-mono hover:underline cursor-pointer"
          >
            Tümünü Temizle
          </button>
        </div>
      )}

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
                <VirtualTableBody
                  items={filteredStoklar}
                  rowHeight={72}
                  renderRow={renderStockRow}
                />
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
                              {stok.category && (
                                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                                  {stok.category}
                                </span>
                              )}
                              {stok.brand && (
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                                  {stok.brand}
                                </span>
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

            <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingStock={editingStock}
        stoklar={stoklar}
        checkPermissionAndExecute={checkPermissionAndExecute}
        aiPrefilledData={aiPrefilledData}
        onClearAiPrefilledData={onClearAiPrefilledData}
      />
      
{/* Print Barcode Modal */}
      <PrintBarcodeModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        printingStock={printingStock}
      />
      
      <StoklarExtraModals 
        isQrModalOpen={isQrModalOpen}
        qrStock={qrStock}
        setIsQrModalOpen={setIsQrModalOpen}
        qrContentMode={qrContentMode}
        setQrContentMode={setQrContentMode}
        qrCustomText={qrCustomText}
        setQrCustomText={setQrCustomText}
        qrCodeDataUrl={qrCodeDataUrl}
        isQrPrinting={isQrPrinting}
        setIsQrPrinting={setIsQrPrinting}
        isPinModalOpen={isPinModalOpen}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        setPinError={setPinError}
        escalationPin={escalationPin}
        pinVerificationAction={pinVerificationAction}
        setPinVerificationAction={setPinVerificationAction}
        setIsPinModalOpen={setIsPinModalOpen}
        selectedStockForDetails={selectedStockForDetails}
        setSelectedStockForDetails={setSelectedStockForDetails}
        salesDetails={salesDetails}
        formatCurrency={formatCurrency}
        expandedCariId={expandedCariId}
        setExpandedCariId={setExpandedCariId}
        isPrintModalOpen={isPrintModalOpen}
        setIsPrintModalOpen={setIsPrintModalOpen}
        printingStock={printingStock}
      />
    </div>
  );
}

export default React.memo(StoklarView);
