import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Layers } from 'lucide-react';

interface OzetTabProps {
  summaryStats: {
    sales: number;
    costOfSales: number;
    grossProfit: number;
    totalExpenses: number;
    employeeSalaries: number;
    netProfit: number;
    purchases: number;
    collections: number;
    payments: number;
  };
  incomeExpenseStats: {
    trendData: any[];
  };
  formatMoney: (val: number) => string;
}

export function OzetTab({ summaryStats, incomeExpenseStats, formatMoney }: OzetTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* STATS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between transition hover:border-emerald-500/30 hover:bg-emerald-500/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Toplam Satışlar</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.sales)}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Sadece gerçekleşen (satış) tutarları</p>
          </div>
        </div>

        {/* SMM */}
        <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between transition hover:border-amber-500/30 hover:bg-amber-500/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Satılan Malın Maliyeti</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.costOfSales)}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Stok çıkışlarından hesaplanan maliyet</p>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between transition hover:border-rose-500/30 hover:bg-rose-500/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Toplam Genel Giderler</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.totalExpenses + summaryStats.employeeSalaries)}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Masraflar + personel maaş hak edişleri</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`border p-5 rounded-2xl flex flex-col justify-between transition ${
          summaryStats.netProfit >= 0 
            ? 'bg-teal-950/20 border-teal-500/20 text-teal-400' 
            : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Net Dönem Kar / Zararı</span>
            <div className={`p-2 rounded-xl ${
              summaryStats.netProfit >= 0 ? 'bg-teal-500/10' : 'bg-rose-500/10'
            }`}>
              {summaryStats.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-mono">{formatMoney(summaryStats.netProfit)}</h3>
            <p className="text-[10px] opacity-70 mt-1">Net gelirler ile tüm giderlerin farkı</p>
          </div>
        </div>
      </div>

      {/* NET INCOME TREND AND PROFITABILITY ANALYZER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-950/50 border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Günlük Satış & Gider Trendi</h3>
            <span className="text-[10px] text-zinc-400">Raporlanan dönemin finansal eğrisi</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeExpenseStats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" name="Satış Geliri" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" name="Giderler" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FINANCIAL STATEMENTS BREAKDOWN */}
        <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Mali Özet Tablosu</h3>
          <div className="space-y-3.5 flex-1">
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-zinc-400">Satış Gelirleri (+)</span>
              <span className="text-emerald-400 font-mono font-semibold">{formatMoney(summaryStats.sales)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-zinc-400">Satılan Malın Maliyeti (-)</span>
              <span className="text-amber-500 font-mono">{formatMoney(summaryStats.costOfSales)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5 font-semibold">
              <span className="text-zinc-200">Brüt Kar / Zarar (=)</span>
              <span className="text-white font-mono">{formatMoney(summaryStats.grossProfit)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-zinc-400">Genel Giderler / Masraflar (-)</span>
              <span className="text-rose-400 font-mono">{formatMoney(summaryStats.totalExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-zinc-400">Personel Maaş Hak Edişleri (-)</span>
              <span className="text-rose-400 font-mono">{formatMoney(summaryStats.employeeSalaries)}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-t border-white/10 font-bold">
              <span className="text-zinc-200">Net Dönem Karı (=)</span>
              <span className={summaryStats.netProfit >= 0 ? 'text-teal-400 font-mono' : 'text-rose-400 font-mono'}>
                {formatMoney(summaryStats.netProfit)}
              </span>
            </div>
          </div>

          {/* CASHFLOW SUMS */}
          <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Diğer Finansal Akışlar</div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Yapılan Cari Alışlar</span>
              <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.purchases)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Gerçekleşen Tahsilatlar</span>
              <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.collections)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Yapılan Ödemeler</span>
              <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.payments)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
