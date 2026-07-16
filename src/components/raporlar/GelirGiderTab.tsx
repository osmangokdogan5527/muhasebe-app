import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { Expense } from '../../types';

interface GelirGiderTabProps {
  incomeExpenseStats: {
    categoryData: any[];
  };
  filteredExpenses: Expense[];
  summaryStats: {
    totalExpenses: number;
    employeeSalaries: number;
  };
  formatMoney: (val: number) => string;
}

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#64748b'];

export function GelirGiderTab({ incomeExpenseStats, filteredExpenses, summaryStats, formatMoney }: GelirGiderTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* EXPENSE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EXPENSE PIE CHART */}
        <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
              <PieIcon size={14} className="text-teal-400" />
              Gider Kategorileri Dağılımı
            </h3>
            <p className="text-[10px] text-zinc-500">Maliyet kalemlerinin oransal analizi</p>
          </div>

          {incomeExpenseStats.categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              Bu dönemde girilmiş gider masraf bulunmuyor.
            </div>
          ) : (
            <div className="h-60 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeExpenseStats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {incomeExpenseStats.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* LEGENDS */}
          <div className="mt-4 space-y-1 max-h-36 overflow-y-auto">
            {incomeExpenseStats.categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-zinc-400">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">{formatMoney(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EXPENSES BREAKDOWN TABLE */}
        <div className="lg:col-span-2 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Seçili Dönem Gider Listesi</h3>
              <span className="text-[10px] text-zinc-400">Tüm harcamaların dökümü</span>
            </div>
            
            <div className="overflow-y-auto max-h-[350px]">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Tarih</th>
                    <th className="px-4 py-2.5">Başlık / Detay</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5">Hesap</th>
                    <th className="px-4 py-2.5 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 font-sans">
                        Seçilen tarih aralığında masraf kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-400 font-sans">{exp.date}</td>
                        <td className="px-4 py-2.5 text-white font-sans font-medium">{exp.title}</td>
                        <td className="px-4 py-2.5 text-zinc-400 font-sans">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-sans text-zinc-300">
                          {exp.account === 'cash' ? 'Kasa' : exp.account === 'pos' ? 'POS' : 'Banka'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-400 font-bold">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: exp.currency || 'TRY' }).format(exp.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTAL ROW */}
          <div className="p-4 bg-zinc-900 border-t border-white/5 flex items-center justify-between mt-auto">
            <span className="text-xs font-semibold text-zinc-300">Dönem Toplam Masrafı (Personel Dahil):</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {formatMoney(summaryStats.totalExpenses + summaryStats.employeeSalaries)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
