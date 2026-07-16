import React from 'react';
import { PieChart as ChartIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
export function CashFlowAnalysis({ flowStats, COLORS, formatCurrency }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Outflow Analysis (Neye Ödeme Yaptık) */}
      <div className="bg-[#111111] p-6 rounded-lg border border-white/5 lg:col-span-2 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">Neye Ödeme Yaptık? (Ödeme Dağılımı)</h2>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">Yapılan tüm ödeme ve masrafların kategorilere göre analizi</p>
              </div>
              <span className="p-2 bg-white/5 text-white/50 rounded-lg border border-white/10">
                <ChartIcon size={16} />
              </span>
            </div>

            {flowStats.pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                <TrendingDown className="text-white/20 mb-3" size={32} />
                <span className="text-xs uppercase tracking-widest text-white/60 font-medium">Ödeme Kaydı Yok</span>
                <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">Seçili filtrelerde ödeme/gider bulunamadı.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Pie Chart */}
                <div className="h-48 md:h-56 relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={flowStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {flowStats.pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Tutar']}
                        contentStyle={{ 
                          backgroundColor: '#111111', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-widest">Toplam Gider</span>
                    <span className="text-base font-bold text-white font-mono">{formatCurrency(flowStats.totalOut)}</span>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-3.5">
                  {flowStats.pieData.slice(0, 5).map((entry, idx) => (
                    <div key={entry.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="text-white/80 font-medium truncate">{entry.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-white/95 font-mono">{formatCurrency(entry.value)}</span>
                        <span className="text-[9px] text-white/40 ml-2 font-mono">
                          ({((entry.value / flowStats.totalOut) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {flowStats.pieData.length > 5 && (
                    <div className="text-[10px] text-white/40 italic pl-4.5">
                      + {flowStats.pieData.length - 5} kategori daha var
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[11px] text-white/50">
            <span>Dönem İçi Gider / Ödeme Dağılımı</span>
            <span className="text-teal-400 font-mono font-bold uppercase tracking-wider">Otomatik Sentez</span>
          </div>
        </div>

        {/* Period Cash Flow Stats */}
        <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70 mb-6">Dönem Nakit Akışı</h2>
            <div className="space-y-4">
              {/* Girişler */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <ArrowUpRight size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">TOPLAM GİRİŞ (TAHSİLAT)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{formatCurrency(flowStats.totalIn)}</span>
                  </div>
                </div>
              </div>

              {/* Çıkışlar */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                    <ArrowDownLeft size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">TOPLAM ÇIKIŞ (ÖDEME)</span>
                    <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">{formatCurrency(flowStats.totalOut)}</span>
                  </div>
                </div>
              </div>

              {/* Net Akış */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${flowStats.netFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">NET NAKİT AKIŞI (DÖNEMLİK)</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${flowStats.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {flowStats.netFlow >= 0 ? '+' : ''}{formatCurrency(flowStats.netFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg text-[10px] text-white/40 text-center font-mono uppercase mt-6 tracking-wider">
            {flowStats.netFlow >= 0 
              ? 'Nakit rezerviniz bu dönem büyüyor.' 
              : 'Nakit rezervlerinizde net azalma var.'}
          </div>
        </div>
      </div>
  );
}
