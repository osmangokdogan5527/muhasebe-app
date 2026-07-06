import React, { useState, useMemo, useEffect } from 'react';
import Barcode from 'react-barcode';
import { Stock } from '../types';
import { saveStock, deleteStock } from '../firebase';
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
  AlertCircle
} from 'lucide-react';

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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
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

  // Open modal for creating new Stock item
  const handleOpenCreateModal = () => {
    setEditingStock(null);
    setFormData({
      name: '',
      code: `STK-${String(stoklar.length + 1).padStart(4, '0')}`,
      barcode: '',
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
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-teal-500 focus:bg-white/[0.08] transition"
          />
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
                          <div className="font-bold text-white/95 text-sm">{stok.name}</div>
                          <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider flex items-center gap-2">
                            <span>{stok.code}</span>
                            {stok.barcode && (
                              <span className="text-teal-400/70">| Barkod: {stok.barcode}</span>
                            )}
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
                        <div>
                          <div className="font-bold text-white/90 text-sm leading-tight">{stok.name}</div>
                          <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider flex items-center gap-2 flex-wrap">
                            <span>{stok.code}</span>
                            {stok.barcode && (
                              <span className="text-teal-400/70">| Barkod: {stok.barcode}</span>
                            )}
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
                      onClick={() => setFormData({...formData, barcode: Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')})}
                      className="px-3 bg-white/10 hover:bg-white/20 text-white rounded transition text-xs font-semibold whitespace-nowrap"
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
                  <p className="text-[10px] text-white/40">Sol menüdeki <b>Ayarlar &gt; Baskı & Şablon Tasarımcısı</b> bölümünden yeni bir barkod şablonu ekleyebilirsiniz.</p>
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
                  <div className="mt-4 p-4 bg-white rounded-lg flex flex-col items-center justify-center text-black">
                    {(() => {
                      const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
                      if (!t) return null;
                      
                      const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
                      const is40x20 = t.paperSize === 'etiket_40x20';
                      
                      return (
                        <div className="text-center flex flex-col items-center justify-center">
                          {t.showBarcodeName !== false && (
                            <div className={`font-bold ${is40x20 ? 'text-[9px]' : 'text-[10px]'} mb-1 line-clamp-2 leading-tight uppercase`}>
                              {printingStock.name}
                            </div>
                          )}
                          {t.showBarcodeCode !== false && printingStock.code && (
                            <div className={`font-medium text-gray-700 ${is40x20 ? 'text-[8px]' : 'text-[9px]'} mb-0.5 line-clamp-1 leading-tight uppercase`}>
                              {printingStock.code}
                            </div>
                          )}
                          {t.showBarcodePrice !== false && (
                            <div className={`font-black ${is40x20 ? 'text-xs' : 'text-sm'} mb-1`}>
                              {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                          )}
                          <div className="flex justify-center w-full mt-1">
                            <Barcode 
                              value={barcodeValue} 
                              format={t.barcodeFormat || "CODE128"} 
                              width={is40x20 ? 1.2 : 1.5} 
                              height={is40x20 ? 30 : 40} 
                              fontSize={is40x20 ? 8 : 10}
                              margin={0}
                              background="transparent"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2">
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded text-xs font-semibold text-white/70 hover:bg-white/5 transition"
              >
                İptal
              </button>
              <button 
                onClick={() => {
                  window.print();
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
      )}

      {/* Hidden Print Area */}
      {isPrintModalOpen && printingStock && selectedTemplateId && (
        <div className="hidden print:flex fixed inset-0 bg-white z-[9999] flex-col items-center justify-center text-black">
          {(() => {
            const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
            if (!t) return null;
            
            const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
            const is40x20 = t.paperSize === 'etiket_40x20';
            
            return (
              <div className={`text-center ${is40x20 ? 'w-[40mm] h-[20mm]' : 'w-[40mm] h-[30mm]'} flex flex-col items-center justify-center overflow-hidden`}>
                {t.showBarcodeName !== false && (
                  <div className={`font-bold ${is40x20 ? 'text-[7px]' : 'text-[8px]'} mb-0.5 leading-tight uppercase line-clamp-1`}>
                    {printingStock.name}
                  </div>
                )}
                {t.showBarcodeCode !== false && printingStock.code && (
                  <div className={`font-medium text-gray-700 ${is40x20 ? 'text-[6px]' : 'text-[7px]'} mb-0.5 line-clamp-1 leading-tight uppercase`}>
                    {printingStock.code}
                  </div>
                )}
                {t.showBarcodePrice !== false && (
                  <div className={`font-black ${is40x20 ? 'text-[10px]' : 'text-[12px]'} mb-0.5`}>
                    {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </div>
                )}
                <div className="flex justify-center w-full">
                  <Barcode 
                    value={barcodeValue} 
                    format={t.barcodeFormat || "CODE128"} 
                    width={is40x20 ? 1 : 1.2} 
                    height={is40x20 ? 20 : 30} 
                    fontSize={is40x20 ? 6 : 8}
                    margin={0}
                    background="transparent"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
