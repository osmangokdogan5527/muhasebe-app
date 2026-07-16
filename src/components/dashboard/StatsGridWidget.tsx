import React from 'react';
import { Wallet, CreditCard, Package, TrendingUp, Users } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatsGridWidgetProps {
  stats: DashboardStats;
  dashboardCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  renderWidgetControls: () => React.ReactNode;
  stoklar: any[];
}

export const StatsGridWidget = React.memo<StatsGridWidgetProps>(({
  stats,
  dashboardCurrency,
  formatCurrency,
  renderWidgetControls,
  stoklar
}) => {
  return (
                  <div
                    
                    className={`h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        ÖZET FİNANSAL GÖSTERGELER
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                      {/* Safe & Bank card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Kasa, Banka & POS Mevcudu
                            </span>
                            <h3
                              className="text-3xl font-light italic tracking-tight text-teal-400 mt-2"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(
                                stats.cashBalance + stats.bankBalance + stats.posBalance,
                              )}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Wallet size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] text-white/40 font-mono tracking-wider uppercase text-center">
                          <span>
                            Kasa:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.cashBalance)}
                            </strong>
                          </span>
                          <span>
                            Banka:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.bankBalance)}
                            </strong>
                          </span>
                          <span>
                            POS:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.posBalance)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Receivables & Payables card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Net Alacak / Borç
                            </span>
                            <h3
                              className={`text-3xl font-light italic tracking-tight mt-2 ${stats.totalReceivables - stats.totalPayables >= 0 ? "text-teal-400" : "text-red-400/80"}`}
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(
                                stats.totalReceivables - stats.totalPayables,
                              )}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Users size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] uppercase tracking-wider font-mono">
                          <span>
                            Alacak:{" "}
                            <strong className="text-teal-400">
                              {formatCurrency(stats.totalReceivables)}
                            </strong>
                          </span>
                          <span>
                            Borç:{" "}
                            <strong className="text-red-400/80">
                              {formatCurrency(stats.totalPayables)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Monthly Net Profit / Loss card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative">
                        <div className="absolute top-2 right-2 bg-teal-500/10 text-teal-400 px-2 py-1 rounded text-[8px] uppercase tracking-widest font-mono border border-teal-500/20">
                          Bu Ay (
                          {new Date().toLocaleDateString("tr-TR", {
                            month: "long",
                          })}
                          )
                        </div>
                        <div className="flex justify-between items-start mt-2">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Aylık Net Kar / Zarar
                            </span>
                            <h3
                              className={`text-3xl font-light italic tracking-tight mt-2 ${stats.monthlyNetProfit >= 0 ? "text-teal-400" : "text-red-400/80"}`}
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(stats.monthlyNetProfit)}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <TrendingUp size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1 text-[9px] uppercase tracking-wider font-mono">
                          <div className="flex justify-between">
                            <span>Bu Ayki Satış:</span>
                            <strong className="text-teal-400">
                              {formatCurrency(stats.monthlySales)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Bu Ayki Alış/Gider:</span>
                            <strong className="text-red-400/80">
                              {formatCurrency(
                                stats.monthlyPurchases +
                                  stats.monthlyExpenses +
                                  stats.monthlySalaries,
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Stock Value Card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Stok Toplam Değeri
                            </span>
                            <h3
                              className="text-3xl font-light italic tracking-tight text-teal-400 mt-2"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(stats.stockValue, "TRY")}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Package size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] uppercase tracking-wider font-mono">
                          <span>
                            Tür:{" "}
                            <strong className="text-white/80">
                              {stoklar.length} Ürün
                            </strong>
                          </span>
                          <span>
                            Kritik:{" "}
                            <strong className="text-red-400/80">
                              {
                                stoklar.filter(
                                  (s) => s.quantity <= s.minQuantity,
                                ).length
                              }
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
  );
});

