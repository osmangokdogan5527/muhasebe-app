import React, { useState, useMemo, useEffect } from 'react';
import { Stock } from '../../types';
import { Search, Package, Check, Tag, Filter, Zap, Barcode, Plus, FolderPlus, Layers, LayoutGrid, ListFilter, X, Edit2 } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosProductCatalogProps {
  stocks: Stock[];
  onAddToCart: (stock: Stock) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

// Varsayılan / Standart Bölüm Listesi (Kullanıcı tamamen serbestçe tanımlar)
const DEFAULT_DEPARTMENTS: string[] = [];

export const PosProductCatalog: React.FC<PosProductCatalogProps> = ({
  stocks,
  onAddToCart,
  searchTerm,
  setSearchTerm,
  searchInputRef,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid'); // 'grid' or 'grouped'
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState<boolean>(false);
  const [newDepartmentName, setNewDepartmentName] = useState<string>('');

  // Yerel Stok-Kategori Eşleme Hafızası (Stoklara dinamik kategori atama)
  const [stockCategoryMap, setStockCategoryMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_stock_category_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

// Özel Eklenen Bölümler (Kullanıcı tamamen serbestçe tanımlar)
  const [customDepartments, setCustomDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_custom_departments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Eşlemeyi Kaydet
  const updateStockCategory = (stockId: string, categoryName: string) => {
    const updated = { ...stockCategoryMap, [stockId]: categoryName };
    setStockCategoryMap(updated);
    try {
      localStorage.setItem('storm_pos_stock_category_map', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Yeni Bölüm Ekle
  const handleAddDepartment = () => {
    if (!newDepartmentName.trim()) return;
    const trimmed = newDepartmentName.trim();
    if (!customDepartments.includes(trimmed)) {
      const updated = [...customDepartments, trimmed];
      setCustomDepartments(updated);
      try {
        localStorage.setItem('storm_pos_custom_departments', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setNewDepartmentName('');
  };

  // Bölüm Sil
  const handleDeleteDepartment = (depName: string) => {
    const updated = customDepartments.filter((d) => d !== depName);
    setCustomDepartments(updated);
    try {
      localStorage.setItem('storm_pos_custom_departments', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Stokların Güncel Kategorilerini Birleştir (DB + Map)
  const stocksWithCategory = useMemo(() => {
    return stocks.map((s) => ({
      ...s,
      category: stockCategoryMap[s.id] || s.category || 'Kategorisiz',
    }));
  }, [stocks, stockCategoryMap]);

  // Benzersiz Kategorileri ve Stok Sayılarını Çek
  const categoryCounts = useMemo(() => {
    try {
      const counts: Record<string, number> = {};
      stocksWithCategory.forEach((s) => {
        const cat = s.category || 'Kategorisiz';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return counts;
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosProductCatalog:categoryCounts');
      return {};
    }
  }, [stocksWithCategory]);

  // Tüm kategorilerin birleşik listesi
  const allCategories = useMemo(() => {
    const set = new Set<string>([...customDepartments, ...Object.keys(categoryCounts)]);
    return Array.from(set).filter(Boolean);
  }, [customDepartments, categoryCounts]);

  // Arama ve Kategoriye Göre Filtrelenmiş Ürün Listesi
  const filteredStocks = useMemo(() => {
    try {
      return stocksWithCategory.filter((stock) => {
        const matchesCategory =
          selectedCategory === 'all' || stock.category === selectedCategory;

        if (!matchesCategory) return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase().trim();
        const nameMatch = stock.name.toLowerCase().includes(term);
        const codeMatch = stock.code.toLowerCase().includes(term);
        const barcodeMatch = stock.barcode
          ? stock.barcode.toLowerCase().includes(term)
          : false;

        return nameMatch || codeMatch || barcodeMatch;
      });
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosProductCatalog:filteredStocks');
      return stocksWithCategory;
    }
  }, [stocksWithCategory, selectedCategory, searchTerm]);

  // Gruplandırılmış Ürünler
  const groupedStocks = useMemo(() => {
    const groups: Record<string, (typeof stocksWithCategory)[number][]> = {};
    filteredStocks.forEach((s) => {
      const cat = s.category || 'Kategorisiz';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [filteredStocks]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
      {/* ÜST ARAMA & BARKOD BAR */}
      <div className="p-3.5 border-b border-slate-700 space-y-3 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-400">
              <Barcode size={20} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Barkod Okutun veya Ürün Ara (Ad, Kod, Barkod)... [F1]"
              className="w-full pl-11 pr-10 py-2.5 bg-slate-950 border-2 border-teal-500/80 rounded-xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 font-mono font-black shadow-inner transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white font-black cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* GÖRÜNÜM MODU TOGGLE (IZGARA vs BÖLÜM BÖLÜM GRUPLI) */}
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 gap-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Izgara Liste Görünümü"
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">Izgara</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                viewMode === 'grouped'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Bölümlere Göre Gruplı Görünüm"
            >
              <Layers size={14} />
              <span className="hidden md:inline">Bölümlü</span>
            </button>
          </div>

          {/* BÖLÜM / KATEGORİ YÖNETİMİ BUTONU */}
          <button
            onClick={() => setIsDepartmentModalOpen(true)}
            className="px-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Bölümler ve Kategorileri Yönet"
          >
            <FolderPlus size={16} />
            <span className="hidden sm:inline">Bölüm Ekle</span>
          </button>
        </div>

        {/* KATEGORİ / BÖLÜM PİLL BAR BARCODE */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-teal-400 text-slate-950 border-teal-300 shadow-md shadow-teal-500/30'
                : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Tüm Ürünler ({stocks.length})
          </button>

          {allCategories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedCategory === cat
                    ? 'bg-teal-400 text-slate-950 border-teal-300 shadow-md shadow-teal-500/30'
                    : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    selectedCategory === cat
                      ? 'bg-slate-950 text-teal-300'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ÜRÜN KARTLARI LİSTESİ */}
      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar bg-slate-950">
        {filteredStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300 space-y-3">
            <Package size={48} className="text-slate-500 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-200">Aranan kriterlere uygun ürün bulunamadı.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-xs text-teal-400 font-bold underline hover:text-teal-300 cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : viewMode === 'grouped' ? (
          /* BÖLÜMLERE GÖRE GRUPLI GÖRÜNÜM */
          <div className="space-y-6">
            {(Object.entries(groupedStocks) as [string, typeof stocksWithCategory][]).map(([catName, catStocks]) => (
              <div key={catName} className="space-y-2">
                {/* BÖLÜM BAŞLIK BANDI */}
                <div className="px-3.5 py-2 bg-slate-900 border-2 border-slate-700 rounded-xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      📁 {catName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 font-black">
                      {catStocks.length} Ürün
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(catName)}
                    className="text-[11px] font-bold text-teal-400 hover:underline cursor-pointer"
                  >
                    Yalnızca Bu Bölümü Süz
                  </button>
                </div>

                {/* BÖLÜM GRİDİ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {catStocks.map((stock) => (
                    <ProductCard
                      key={stock.id}
                      stock={stock}
                      onAddToCart={onAddToCart}
                      allCategories={allCategories}
                      onUpdateStockCategory={updateStockCategory}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* STANDART IZGARA GÖRÜNÜMÜ */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStocks.map((stock) => (
              <ProductCard
                key={stock.id}
                stock={stock}
                onAddToCart={onAddToCart}
                allCategories={allCategories}
                onUpdateStockCategory={updateStockCategory}
              />
            ))}
          </div>
        )}
      </div>

      {/* BÖLÜM / KATEGORİ YÖNETİMİ MODALI */}
      {isDepartmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus size={20} className="text-amber-400" />
                <h3 className="text-sm font-black text-white">Bölüm & Kategori Yönetimi</h3>
              </div>
              <button
                onClick={() => setIsDepartmentModalOpen(false)}
                className="text-slate-400 hover:text-white font-black cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* 1. YENİ BÖLÜM OLUŞTURMA */}
              <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-2">
                <label className="text-xs font-black text-amber-300 block">Yeni Bölüm / Kategori Oluştur</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDepartment();
                      }
                    }}
                    placeholder="Örn: Unlu Mamüller, Soğuk İçecekler..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleAddDepartment}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* 2. MEVCUT BÖLÜMLER LİSTESİ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-200">Tanımlı Bölümler ({allCategories.length})</h4>
                  {customDepartments.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Tüm özel tanımlı bölümleri silmek istediğinize emin misiniz?')) {
                          setCustomDepartments([]);
                          localStorage.removeItem('storm_pos_custom_departments');
                        }
                      }}
                      className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer"
                    >
                      Tüm Bölümleri Temizle
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {allCategories.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 font-medium">
                      Henüz eklenmiş özel bölüm bulunmuyor. Yukarıdaki kutudan dilediğiniz bölüm adını yazıp ekleyebilirsiniz.
                    </p>
                  ) : (
                    allCategories.map((cat) => {
                      const isCustom = customDepartments.includes(cat);
                      return (
                        <span
                          key={cat}
                          className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs rounded-lg flex items-center gap-1.5 group"
                        >
                          <span>📁 {cat}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({categoryCounts[cat] || 0})</span>
                          {isCustom && (
                            <button
                              onClick={() => handleDeleteDepartment(cat)}
                              className="text-slate-400 hover:text-red-400 transition-colors ml-1 cursor-pointer font-black"
                              title="Bu Bölümü Sil"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. HIZLI ÜRÜN - BÖLÜM ATAMASI */}
              <div>
                <h4 className="text-xs font-black text-slate-200 mb-2">Ürünleri Bölümlere Atayın</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {stocksWithCategory.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-black text-white block truncate">{st.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{st.code}</span>
                      </div>
                      <select
                        value={st.category}
                        onChange={(e) => updateStockCategory(st.id, e.target.value)}
                        className="bg-slate-950 text-teal-300 border border-slate-700 text-xs rounded-md px-2 py-1 font-bold focus:outline-none"
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-700 text-right">
              <button
                onClick={() => setIsDepartmentModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BİRE BİR YÜKSEK KONTRASTLI ÜRÜN KARTI BİLEŞENİ
interface ProductCardProps {
  stock: Stock & { category: string };
  onAddToCart: (stock: Stock) => void;
  allCategories: string[];
  onUpdateStockCategory: (id: string, category: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  stock,
  onAddToCart,
  allCategories,
  onUpdateStockCategory,
}) => {
  const isLowStock = stock.quantity <= (stock.minQuantity || 5);
  const isOutOfStock = stock.quantity <= 0;
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState<boolean>(false);

  return (
    <div
      onClick={() => onAddToCart(stock)}
      className={`group relative flex flex-col justify-between p-3 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
        isOutOfStock
          ? 'bg-slate-900 border-red-500/60 hover:border-red-400'
          : 'bg-slate-900 border-slate-700 hover:border-teal-400 hover:bg-slate-850'
      }`}
      style={{ backgroundColor: '#0f172a' }} // Explicit fallback override against light mode themes
    >
      <div className="w-full">
        {/* Görsel veya İkon */}
        <div className="w-full h-24 mb-2.5 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center relative">
          {stock.imageUrl ? (
            <img
              src={stock.imageUrl}
              alt={stock.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package
              size={32}
              className="text-slate-400 group-hover:text-teal-300 transition-colors"
            />
          )}

          {/* STOK ROZETİ */}
          <div
            className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-black border shadow-md ${
              isOutOfStock
                ? 'bg-red-600 text-white border-red-400'
                : isLowStock
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                : 'bg-teal-400 text-slate-950 border-teal-200 font-black'
            }`}
          >
            {stock.quantity} {stock.unit}
          </div>

          {/* BÖLÜM ROZETİ */}
          <div className="absolute bottom-1.5 left-1.5 max-w-[85%]">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsCategorySelectorOpen(!isCategorySelectorOpen);
              }}
              className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-teal-300 border border-teal-500/50 text-[9px] font-black truncate block cursor-pointer"
              title="Bölümü Değiştirmek İçin Tıklayın"
            >
              🏷️ {stock.category}
            </span>
          </div>
        </div>

        {/* HIZLI KATEGORİ DEĞİŞTİRİCİ DROPDOWN */}
        {isCategorySelectorOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-12 left-2 right-2 z-20 bg-slate-950 border-2 border-teal-400 rounded-xl shadow-2xl p-2 max-h-36 overflow-y-auto custom-scrollbar"
          >
            <span className="text-[10px] font-black text-amber-300 block mb-1">Bölüm Seçin:</span>
            {allCategories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onUpdateStockCategory(stock.id, c);
                  setIsCategorySelectorOpen(false);
                }}
                className={`w-full text-left px-2 py-1 text-[11px] font-bold rounded mb-1 last:mb-0 cursor-pointer ${
                  stock.category === c
                    ? 'bg-teal-500 text-slate-950 font-black'
                    : 'text-white hover:bg-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* ÜRÜN ADI VE KODU - ULTRA YÜKSEK KONTRAST BEYAZ YAZI */}
        <h4 className="text-xs font-black text-white line-clamp-2 leading-tight group-hover:text-teal-300 transition-colors min-h-[2rem]">
          {stock.name}
        </h4>
        <span className="text-[10px] font-mono font-bold text-slate-300 block mt-0.5">
          {stock.code}
        </span>
      </div>

      {/* FİYAT & EKLEME BUTONU */}
      <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between w-full">
        <div>
          <span className="text-xs sm:text-sm font-black text-teal-300 tracking-tight block font-mono">
            ₺{stock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-slate-300 block font-mono font-bold">
            %{stock.taxRate ?? 0} KDV Dahil
          </span>
        </div>

        <div className="w-7 h-7 rounded-lg bg-teal-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md group-hover:bg-teal-300 transition-all shrink-0">
          +
        </div>
      </div>
    </div>
  );
};
