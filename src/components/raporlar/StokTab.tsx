import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';

interface StokTabProps {
  stockStats: {
    totalItems: number;
    totalStockCount: number;
    totalValuation: number;
    criticalStockCount: number;
    itemsList: any[];
  };
  stockSearch: string;
  setStockSearch: (val: string) => void;
  stockValuationType: 'purchase' | 'sales';
  setStockValuationType: (val: 'purchase' | 'sales') => void;
  formatMoney: (val: number) => string;
}

export function StokTab({ stockStats, stockSearch, setStockSearch, stockValuationType, setStockValuationType, formatMoney }: StokTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* STOK METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">Toplam Farklı Ürün Tipi</span>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{stockStats.totalItems}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Sistemdeki toplam kayıtlı stok kalemi</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-zinc-400 font-medium">Toplam Stok Adet / Miktar</span>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{stockStats.totalStockCount}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Depodaki tüm ürünlerin toplam adetleri</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-zinc-400 font-medium">Toplam Envanter Değeri</span>
          <h3 className="text-xl font-bold text-teal-400 font-mono mt-2">{formatMoney(stockStats.totalValuation)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Değerleme Tipi: {stockValuationType === 'purchase' ? 'Alış Fiyatı' : 'Satış Fiyatı'}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Kritik Stok Uyarıları</span>
            {stockStats.criticalStockCount > 0 && <AlertTriangle size={16} className="text-amber-500" />}
          </div>
          <h3 className={`text-xl font-bold mt-2 font-mono ${stockStats.criticalStockCount > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {stockStats.criticalStockCount}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">Minimum stok miktarının altına düşen ürün sayısı</p>
        </div>
      </div>

      {/* STOCK SUB-FILTERING BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 w-full sm:max-w-xs">
          <Search size={14} className="text-zinc-500" />
          <input
            type="text"
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
            placeholder="Stok adı veya kodu ara..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 border-none outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-400">Envanter Değerleme Tipi:</span>
          <div className="flex bg-[#121316] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setStockValuationType('purchase')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                stockValuationType === 'purchase' 
                  ? 'bg-teal-500 text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Alış Fiyatı
            </button>
            <button
              onClick={() => setStockValuationType('sales')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                stockValuationType === 'sales' 
                  ? 'bg-teal-500 text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Satış Fiyatı
            </button>
          </div>
        </div>
      </div>

      {/* STOCK VALUATION TABLE */}
      <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Detaylı Stok Değerleme Listesi</h3>
          <span className="text-[10px] text-zinc-400">Toplam envanter payına göre sıralıdır</span>
        </div>
          
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Stok Kodu</th>
                <th className="px-5 py-3">Stok Adı</th>
                <th className="px-5 py-3 text-right">Miktar / Birim</th>
                <th className="px-5 py-3 text-right">Alış Fiyatı</th>
                <th className="px-5 py-3 text-right">Satış Fiyatı</th>
                <th className="px-5 py-3 text-right">Stok Envanter Değeri</th>
                <th className="px-5 py-3 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {stockStats.itemsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 font-sans">
                    Aranan kriterlere uygun stok bulunamadı.
                  </td>
                </tr>
              ) : (
                stockStats.itemsList.map(item => {
                  const isKritik = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-zinc-400 font-semibold">{item.code}</td>
                      <td className="px-5 py-3 text-white font-sans font-medium">{item.name}</td>
                      <td className="px-5 py-3 text-right text-white font-semibold">{item.quantity} {item.unit}</td>
                      <td className="px-5 py-3 text-right">{formatMoney(item.purchasePrice)}</td>
                      <td className="px-5 py-3 text-right">{formatMoney(item.salesPrice)}</td>
                      <td className="px-5 py-3 text-right text-teal-400 font-bold">{formatMoney(item.valuation)}</td>
                      <td className="px-5 py-3 text-center font-sans">
                        {isKritik ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-semibold border border-amber-500/20">
                            Kritik Seviye ({item.minQuantity})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold border border-emerald-500/20">
                            Yeterli
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
