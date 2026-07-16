import React from 'react';
import { Download, ArrowUpRight, ArrowDownLeft, Percent, TrendingUp } from 'lucide-react';

interface KdvTabProps {
  kdvStats: any;
  summaryStats: any;
  formatMoney: (val: number) => string;
  downloadKdvPdf: () => void;
}

export function KdvTab({ kdvStats, summaryStats, formatMoney, downloadKdvPdf }: KdvTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Toplam Hesaplanan KDV (Satış)</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-lg font-bold text-white font-mono">{formatMoney(kdvStats.salesKdvTotal)}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Faturalandırılmış satış KDV matrahı toplamı</p>
          </div>
        </div>

        <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Toplam İndirilecek KDV (Alış)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-lg font-bold text-white font-mono">{formatMoney(kdvStats.purchaseKdvTotal)}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Faturalandırılmış alış KDV matrahı toplamı</p>
          </div>
        </div>

        <div className={`border p-5 rounded-2xl flex flex-col justify-between ${
          kdvStats.netKdvDifference > 0 ? 'bg-red-950/20 border-red-500/20' : 'bg-emerald-950/20 border-emerald-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">
              {kdvStats.netKdvDifference > 0 ? 'Ödenecek KDV' : 'Devreden KDV'}
            </span>
            <div className={`p-2 rounded-xl ${
              kdvStats.netKdvDifference > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-lg font-bold font-mono ${
              kdvStats.netKdvDifference > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {kdvStats.netKdvDifference > 0 ? formatMoney(kdvStats.payableKdv) : formatMoney(kdvStats.devredenKdv)}
            </span>
            <p className="text-[10px] text-zinc-500 mt-1">
              {kdvStats.netKdvDifference > 0 ? 'Maliye Bakanlığına ödenecek net tutar' : 'Gelecek döneme aktarılan devir KDV'}
            </p>
          </div>
        </div>

        <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">KDV Hariç Net Kâr / Zarar</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-lg font-bold font-mono ${
              (summaryStats.sales - kdvStats.salesKdvTotal - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - summaryStats.totalExpenses - summaryStats.employeeSalaries) >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}>
              {formatMoney(
                (summaryStats.sales - kdvStats.salesKdvTotal) - 
                (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - 
                summaryStats.totalExpenses - 
                summaryStats.employeeSalaries
              )}
            </span>
            <p className="text-[10px] text-zinc-500 mt-1">Tüm vergiler hariç net faaliyet kârlılığı</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KDV BREAKDOWNS */}
        <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent size={14} className="text-teal-400" />
                KDV Matrahı ve Hesaplama Detayları
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Oran bazında matrah ve KDV dağılımları</p>
            </div>
            <button
              onClick={downloadKdvPdf}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Download size={10} /> PDF Raporu
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* SALES KDV DETAYLARI */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-teal-400 tracking-wider uppercase">Hesaplanan KDV (Satış Faturaları)</h4>
              <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-white/5 p-2 font-medium text-zinc-400 border-b border-white/5">
                  <span>KDV Oranı</span>
                  <span className="text-right">KDV Matrahı (KDV Hariç)</span>
                  <span className="text-right">KDV Tutarı</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%20 Standart Oran</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase20)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv20)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%10 İndirimli Oran</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase10)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv10)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%1 Gıda / Temel</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase1)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv1)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">Diğer / Karışık Oranlar</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBaseOther)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdvOther)}</span>
                </div>
                <div className="grid grid-cols-3 bg-teal-500/5 p-2 font-bold border-t border-teal-500/20">
                  <span className="text-teal-400">Toplam Satış KDV</span>
                  <span className="text-right text-zinc-400 font-mono">
                    {formatMoney(kdvStats.salesBase20 + kdvStats.salesBase10 + kdvStats.salesBase1 + kdvStats.salesBaseOther)}
                  </span>
                  <span className="text-right text-teal-400 font-mono">{formatMoney(kdvStats.salesKdvTotal)}</span>
                </div>
              </div>
            </div>

            {/* PURCHASE KDV DETAYLARI */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-rose-400 tracking-wider uppercase">İndirilecek KDV (Alış Faturaları ve Giderler)</h4>
              <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-white/5 p-2 font-medium text-zinc-400 border-b border-white/5">
                  <span>KDV Oranı</span>
                  <span className="text-right">KDV Matrahı (KDV Hariç)</span>
                  <span className="text-right">KDV Tutarı</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%20 Standart Oran</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase20)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv20)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%10 İndirimli Oran</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase10)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv10)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">%1 Gıda / Temel</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase1)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv1)}</span>
                </div>
                <div className="grid grid-cols-3 p-2 border-b border-white/5">
                  <span className="text-zinc-300">Diğer / Karışık Oranlar</span>
                  <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBaseOther)}</span>
                  <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdvOther)}</span>
                </div>
                <div className="grid grid-cols-3 bg-rose-500/5 p-2 font-bold border-t border-rose-500/20">
                  <span className="text-rose-400">Toplam İndirilecek KDV</span>
                  <span className="text-right text-zinc-400 font-mono">
                    {formatMoney(kdvStats.purchaseBase20 + kdvStats.purchaseBase10 + kdvStats.purchaseBase1 + kdvStats.purchaseBaseOther)}
                  </span>
                  <span className="text-right text-rose-400 font-mono">{formatMoney(kdvStats.purchaseKdvTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED P&L STATEMENT (KDV EXCLUDED) */}
        <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Kar / Zarar Tablosu (KDV Hariç)</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Gelir Tablosu formatında net karlılık (EBITDA)</p>
            </div>
          </div>

          <div className="p-5 space-y-4 flex-1 text-xs">
            {/* Sales Section */}
            <div>
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>A. BRÜT SATIŞLAR (KDV Hariç Matrah)</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formatMoney(summaryStats.sales - kdvStats.salesKdvTotal)}
                </span>
              </div>
            </div>

            {/* COGS Section */}
            <div>
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>B. SATIŞLARIN MALİYETİ (-)</span>
                <span className="font-mono text-amber-500 font-bold text-sm">
                  {formatMoney(summaryStats.costOfSales - kdvStats.purchaseKdvTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-zinc-400 bg-white/5 px-2 rounded mt-1">
                <span className="pl-4 text-[10px]">Net Brüt Kâr / Zarar</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney((summaryStats.sales - kdvStats.salesKdvTotal) - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal))}
                </span>
              </div>
            </div>

            {/* OPEX Section */}
            <div className="pt-2">
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>C. FAALİYET GİDERLERİ (-)</span>
                <span className="font-mono text-rose-400 font-bold text-sm">
                  {formatMoney(summaryStats.totalExpenses + summaryStats.employeeSalaries)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-zinc-400">
                <span className="pl-4">Genel Yönetim / Çeşitli Giderler</span>
                <span className="font-mono">{formatMoney(summaryStats.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-zinc-400">
                <span className="pl-4">Personel Maaş Hak Edişleri</span>
                <span className="font-mono">{formatMoney(summaryStats.employeeSalaries)}</span>
              </div>
            </div>

            {/* NET INCOME */}
            <div className="pt-4 mt-4 border-t-2 border-white/10">
              <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-white/5 shadow-inner">
                <span className="text-sm font-bold text-white">NET FAALİYET KÂRI / ZARARI</span>
                <span className={`text-lg font-bold font-mono ${
                  (summaryStats.sales - kdvStats.salesKdvTotal - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - summaryStats.totalExpenses - summaryStats.employeeSalaries) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {formatMoney(
                    (summaryStats.sales - kdvStats.salesKdvTotal) - 
                    (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - 
                    summaryStats.totalExpenses - 
                    summaryStats.employeeSalaries
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
