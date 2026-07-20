import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { DashboardStats } from '../../types';

interface FlowSummaryWidgetProps {
  stats: DashboardStats;
  dashboardCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  renderWidgetControls: () => React.ReactNode;
}

export const FlowSummaryWidget = React.memo<FlowSummaryWidgetProps>(({
  stats,
  dashboardCurrency,
  formatCurrency,
  renderWidgetControls
}) => {
  return (
                  <div
                    
                    className={`h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        FİNANSAL NAKİT AKIŞI ÖZETİ
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70 mb-6 shrink-0">
                          Finansal Akış Özeti
                        </h2>
                        <div className="flex flex-col justify-between flex-1 gap-4">
                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded shrink-0">
                              <ArrowUpRight size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Tahsilat Hacmi
                              </div>
                              <div
                                className="text-xs font-semibold text-white/90 mt-0.5 tabular-nums font-sans"
                              >
                                {formatCurrency(stats.totalCollections)}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-teal-400 shrink-0 text-right w-20">
                              Para Girişi
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-red-500/10 text-red-400 rounded shrink-0">
                              <ArrowDownLeft size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Ödeme Hacmi
                              </div>
                              <div
                                className="text-xs font-semibold text-white/90 mt-0.5 tabular-nums font-sans"
                              >
                                {formatCurrency(stats.totalPayments)}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-red-400/80 shrink-0 text-right w-20">
                              Para Çıkışı
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded shrink-0">
                              <DollarSign size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Alacak / Borç Oranı
                              </div>
                              <div className="text-xs font-semibold text-white/90 mt-0.5">
                                {stats.totalPayables > 0
                                  ? `${(stats.totalReceivables / stats.totalPayables).toFixed(2)}x`
                                  : "Borç Yok"}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 shrink-0 text-right w-20">
                              Kapsama
                            </span>
                          </div>
                        </div>
                    </div>
                  </div>
  );
});

