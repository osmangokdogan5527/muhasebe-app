import React, { useState, useEffect } from 'react';
import { Stock } from '../../types';
import { saveStock } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';
import { X, Package, ScanLine, AlertCircle, ImageIcon, Scan } from 'lucide-react';
import BarcodeScannerModal from '../BarcodeScannerModal';

export interface StockModalProps {
  aiPrefilledData?: any;
  onClearAiPrefilledData?: () => void;
  isOpen: boolean;
  onClose: () => void;
  editingStock: Stock | null;
  stoklar: Stock[];
  checkPermissionAndExecute: (actionKey: 'delete_stock' | 'decrease_stock' | 'edit_stock', executeAction: () => void) => void;
}

export function StockModal({
  isOpen,
  onClose,
  editingStock,
  stoklar,
  checkPermissionAndExecute,
  aiPrefilledData,
  onClearAiPrefilledData
}: StockModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    imageUrl: '',
    unit: 'Adet' as 'Adet' | 'KG' | 'Litre' | 'Metre' | 'Kutu' | 'Hizmet',
    purchasePrice: 0,
    salesPrice: 0,
    taxRate: 0,
    quantity: 0,
    minQuantity: 5,
    category: '',
    brand: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingStock) {
        setFormData({
          name: editingStock.name,
          code: editingStock.code,
          barcode: editingStock.barcode || '',
          imageUrl: editingStock.imageUrl || '',
          unit: editingStock.unit,
          purchasePrice: editingStock.purchasePrice,
          salesPrice: editingStock.salesPrice,
          taxRate: editingStock.taxRate,
          quantity: editingStock.quantity,
          minQuantity: editingStock.minQuantity,
          category: editingStock.category || '',
          brand: editingStock.brand || ''
        });
      } else {
        setFormData({
          name: '',
          code: `STK-${String(stoklar.length + 1).padStart(4, '0')}`,
          barcode: '',
          imageUrl: '',
          unit: 'Adet',
          purchasePrice: 0,
          salesPrice: 0,
          taxRate: 0,
          quantity: 0,
          minQuantity: 5,
          category: '',
          brand: ''
        });
      }
      setFormError('');
    }
  }, [isOpen, editingStock, stoklar.length]);

  // Handle form submission
  const categories = Array.from(new Set(stoklar.map(s => s.category).filter(Boolean))) as string[];
  const brands = Array.from(new Set(stoklar.map(s => s.brand).filter(Boolean))) as string[];

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

  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('form');

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
          category: formData.category,
          brand: formData.brand,
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
          category: formData.category,
          brand: formData.brand,
          createdAt: new Date().toISOString()
        };
        await saveStock(newStock);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError('Stok kartı kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <>
{/* Add / Edit Stock Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                {editingStock ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı'}
              </h3>
              <button 
                id="btn-close-stock-modal"
                onClick={() => onClose()}
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
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Kategori</label>
                  <input 
                    id="form-stock-category"
                    type="text"
                    placeholder="Örn: Mobilya, Kırtasiye..."
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Marka / Üretici</label>
                  <input 
                    id="form-stock-brand"
                    type="text"
                    placeholder="Örn: Storm, Samsung..."
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                    list="brand-suggestions"
                  />
                  <datalist id="brand-suggestions">
                    {brands.map(brnd => <option key={brnd} value={brnd} />)}
                  </datalist>
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
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Alış Fiyatı (KDV Hariç)</label>
                  <div className="relative">
                    <input 
                      id="form-stock-purchase-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.purchasePrice || ''}
                      onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">TL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Satış Fiyatı (KDV Hariç)</label>
                  <div className="relative">
                    <input 
                      id="form-stock-sales-price"
                      type="number"
                      step="0.01"
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
                  onClick={() => onClose()}
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

      
    </>
  );
}
