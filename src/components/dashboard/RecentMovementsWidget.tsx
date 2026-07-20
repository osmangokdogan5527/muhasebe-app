import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Users, CreditCard } from 'lucide-react';
import { Transaction, Expense, EmployeeTransaction } from '../../types';

interface RecentMovementsWidgetProps {
  filteredRecentMovements: any[];
  onNavigate: (view: any) => void;
  dashboardCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  renderWidgetControls: () => React.ReactNode;
}

export const RecentMovementsWidget = React.memo<RecentMovementsWidgetProps>(({
  filteredRecentMovements,
  onNavigate,
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
                        SON FİNANSAL HAREKETLER
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                          <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                              Son Hareketler (Cari, Maaş & Gider)
                            </h2>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                              Sisteme kaydedilen son 5 finansal hareket (
                              {dashboardCurrency})
                            </p>
                          </div>
                        </div>

                        {filteredRecentMovements.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                            <CreditCard
                              className="text-white/20 mb-3"
                              size={32}
                            />
                            <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                              Kayıtlı İşlem Yok
                            </span>
                            <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                              Seçilen para biriminde hareket bulunamadı.
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5 text-zinc-100">
                            {filteredRecentMovements.map((movement) => {
                              const isIncoming = movement.isIncoming;
                              return (
                                <div
                                  key={movement.id}
                                  className="py-3.5 flex justify-between items-center gap-4 first:pt-0 last:pb-0 hover:bg-white/[0.02] px-2 rounded transition"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span
                                      className={`p-1.5 rounded ${
                                        isIncoming
                                          ? "bg-teal-500/10 text-teal-400"
                                          : "bg-red-500/10 text-red-400"
                                      }`}
                                    >
                                      {isIncoming ? (
                                        <ArrowUpRight size={14} />
                                      ) : (
                                        <ArrowDownLeft size={14} />
                                      )}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-white/95 truncate">
                                        {movement.title}
                                      </div>
                                      <div className="text-[9px] text-white/40 mt-1 flex items-center gap-2 uppercase tracking-wider font-mono">
                                        <span
                                          className={
                                            isIncoming
                                              ? "text-teal-400 font-semibold"
                                              : "text-red-400 font-semibold"
                                          }
                                        >
                                          {movement.subtitle}
                                        </span>
                                        <span className="bg-white/5 border border-white/10 px-1 py-0.2 rounded text-white/70 font-bold font-mono text-[8px] tracking-wide">
                                          {movement.currency}
                                        </span>
                                        <span>•</span>
                                        <span>{movement.date}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div
                                      className={`text-xs font-semibold tabular-nums font-sans ${isIncoming ? "text-teal-400" : "text-red-400/80"}`}
                                    >
                                      {isIncoming ? "+" : "-"}
                                      {formatCurrency(
                                        movement.amount,
                                        movement.currency,
                                      )}
                                    </div>
                                    <div className="text-[9px] uppercase tracking-wider text-white/30 mt-0.5">
                                      {movement.account || "Açık Hesap"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-goto-transactions"
                        onClick={() => onNavigate("islemler")}
                        className="w-full mt-6 text-center text-[10px] uppercase tracking-widest font-semibold text-teal-400 hover:text-teal-300 bg-white/5 hover:bg-white/10 py-3 rounded-lg border border-white/5 transition cursor-pointer"
                      >
                        Tüm Hareketleri Görüntüle →
                      </button>
                    </div>
                  </div>
  );
});

