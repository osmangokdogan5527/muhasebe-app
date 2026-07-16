import React from 'react';
import { Search } from 'lucide-react';

interface CariTabProps {
  cariStats: {
    totalCari: number;
    totalReceivables: number;
    totalPayables: number;
    itemsList: any[];
  };
  cariSearch: string;
  setCariSearch: (val: string) => void;
  cariTypeFilter: 'all' | 'customer' | 'supplier';
  setCariTypeFilter: (val: 'all' | 'customer' | 'supplier') => void;
  selectedCurrency: 'TRY' | 'USD' | 'EUR';
  formatMoney: (val: number) => string;
}

export function CariTab({ cariStats, cariSearch, setCariSearch, cariTypeFilter, setCariTypeFilter, selectedCurrency, formatMoney }: CariTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* CARI SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-zinc-400 font-medium">Toplam Kayıtlı Cari Hesap</span>
          <h3 className="text-xl font-bold text-white font-mono mt-2">{cariStats.totalCari}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Sistemdeki toplam müşteri ve tedarikçiler</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-zinc-400 font-medium">Toplam Cari Alacaklarımız (Müşteriler)</span>
          <h3 className="text-xl font-bold text-emerald-400 font-mono mt-2">{formatMoney(cariStats.totalReceivables)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Bize borcu olan cari kartların toplam bakiyesi</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
          <span className="text-xs text-zinc-400 font-medium">Toplam Cari Borçlarımız (Tedarikçiler)</span>
          <h3 className="text-xl font-bold text-rose-400 font-mono mt-2">{formatMoney(cariStats.totalPayables)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Bizim ödememiz gereken tedarikçi bakiyeleri</p>
        </div>
      </div>

      {/* CARI FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 w-full sm:max-w-xs">
          <Search size={14} className="text-zinc-500" />
          <input
            type="text"
            value={cariSearch}
            onChange={(e) => setCariSearch(e.target.value)}
            placeholder="Cari adı veya kodu ara..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 border-none outline-none focus:ring-0"
          />
        </div>

        <div className="flex bg-[#121316] border border-white/10 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setCariTypeFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              cariTypeFilter === 'all' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setCariTypeFilter('customer')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              cariTypeFilter === 'customer' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Müşteriler
          </button>
          <button
            onClick={() => setCariTypeFilter('supplier')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              cariTypeFilter === 'supplier' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tedarikçiler
          </button>
        </div>
      </div>

      {/* CARI BALANCES TABLE */}
      <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cari Bakiyeleri Sıralı Listesi</h3>
          <span className="text-[10px] text-zinc-400">Bakiye büyüklüğüne göre sıralıdır</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Cari Kod</th>
                <th className="px-5 py-3">Cari Ünvan</th>
                <th className="px-5 py-3">Kart Tipi</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3 text-right">Bakiye (Orijinal)</th>
                <th className="px-5 py-3 text-right">Rapor Bakiyesi ({selectedCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {cariStats.itemsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 font-sans">
                    Filtrelere uygun kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                cariStats.itemsList.map(item => {
                  const bal = item.convertedBalance;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-zinc-400 font-semibold">{item.code}</td>
                      <td className="px-5 py-3 text-white font-sans font-medium">{item.name}</td>
                      <td className="px-5 py-3 font-sans">
                        {item.type === 'customer' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Müşteri</span>
                        ) : item.type === 'supplier' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">Tedarikçi</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20">Müşteri+Tedarikçi</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 font-sans">{item.phone || '-'}</td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: item.currency || 'TRY' }).format(item.balance)}
                      </td>
                      <td className={`px-5 py-3 text-right text-sm font-bold ${
                        bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-rose-400' : 'text-zinc-500'
                      }`}>
                        {formatMoney(bal)}
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
