import React, { useState, useMemo, useEffect } from 'react';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';
import { Stock } from '../types';
import { saveStock, deleteStock } from '../firebase';
import { compressImage } from '../utils/imageCompressor';
import { 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  Tag, 
  DollarSign,
  Printer, 
  TrendingUp, 
  TrendingDown,
  Layers,
  AlertCircle,
  Image as ImageIcon,
  Download,
  FileSpreadsheet,
  Scan
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

interface StoklarViewProps {
  stoklar: Stock[];
  aiPrefilledData?: any;
  onClearAiPrefilledData?: () => void;
}

export default function StoklarView({
  stoklar,
  aiPrefilledData,
  onClearAiPrefilledData,
}: StoklarViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'instock' | 'outstock'>('all');
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingStock, setPrintingStock] = useState<Stock | null>(null);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

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
        stok.code.toLowerCase().includes(searchTerm.toLowerCase());

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
    if (window.confirm(`"${name}" isimli stok kartını silmek istediğinize emin misiniz?`)) {
      try {
        await deleteStock(id);
      } catch (err) {
        console.error(err);
        alert('Stok kartı silinirken bir hata oluştu.');
      }
    }
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  const handleExportBarTender = (stock: Stock) => {
    const activeTemplate = printTemplates.find(tpl => tpl.id === selectedTemplateId);
    const customText = activeTemplate?.showCustomText ? (activeTemplate.customTextContent || '') : '';
    
    // BarTender friendly TXT (Tab Separated) with BOM
    const headers = ['UrunAdi', 'StokKodu', 'Barkod', 'Fiyat', 'Birim', 'OzelMetin'];
    const row = [
      stock.name.replace(/\t/g, ' ').replace(/\r?\n|\r/g, ' '),
      stock.code.replace(/\t/g, ' '),
      (stock.barcode || stock.code).replace(/\t/g, ' '),
      stock.salesPrice.toString(),
      stock.unit,
      customText.replace(/\t/g, ' ').replace(/\r?\n|\r/g, ' ')
    ];

    const txtContent = "\uFEFF" + [headers.join('\t'), row.join('\t')].join('\r\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bartender_${stock.code}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            title="Kamera ile Barkod Tara"
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
                              <div className="font-bold text-white/95 text-sm">{stok.name}</div>
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
                            <div className="font-bold text-white/90 text-sm leading-tight">{stok.name}</div>
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
                      title="Kamera ile Barkod Tara"
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
                          className="font-bold text-center whitespace-nowrap truncate leading-tight uppercase w-full px-1 text-black"
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
                          className="font-medium text-gray-700 text-center whitespace-nowrap truncate leading-tight uppercase w-full px-1"
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
                          className="font-medium text-gray-800 text-center whitespace-nowrap truncate leading-tight uppercase w-full px-1"
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
                          className="font-black text-center text-black"
                          style={{
                            fontSize: t.barcodePriceSize ? `${t.barcodePriceSize * 0.5}px` : (is60x40 || is80x50 ? '16px' : '14px'),
                          }}
                        >
                          {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                      ) : null;
                      
                      const barcodeEl = (
                        <div key="barcode" className="flex justify-center w-full overflow-hidden barcode-svg-container">
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
                          const pos = positions[key] || { x: 50, y: 50 };
                          return (
                            <div 
                              key={key} 
                              className="absolute"
                              style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: 'translate(-50%, -50%)',
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
                className="font-bold w-full px-1 text-center whitespace-nowrap truncate leading-tight uppercase text-black"
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
                className="font-medium text-gray-700 w-full px-1 text-center whitespace-nowrap truncate leading-tight uppercase"
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
                className="font-medium text-gray-800 w-full px-1 text-center whitespace-nowrap truncate leading-tight uppercase"
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
                className="font-black text-black text-center"
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
              <div key="barcode" className="flex justify-center w-full barcode-svg-container">
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
                const pos = positions[key] || { x: 50, y: 50 };
                return (
                  <div 
                    key={key} 
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
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
          if (scannerTarget === 'search') {
            setSearchTerm(code);
          } else {
            setFormData(prev => ({ ...prev, barcode: code }));
          }
        }}
        title={scannerTarget === 'search' ? 'Stoklarda Barkod Ara' : 'Stok Kartı Barkodu Tara'}
        multiScan={false}
      />
    </div>
  );
}
