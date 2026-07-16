import React from 'react';
import { Calendar } from 'lucide-react';

interface CekSenetCalendarWidgetProps {
  activeCekSenetList: any[];
  getDaysRemaining: (date: string) => number;
  onNavigate: (view: any) => void;
  dashboardCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  renderWidgetControls: () => React.ReactNode;
}

export const CekSenetCalendarWidget: React.FC<CekSenetCalendarWidgetProps> = ({
  activeCekSenetList,
  getDaysRemaining,
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
                        ÇEK & SENET VADE VE ÖDEME TAKVİMİ
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                        <div>
                          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                            Çek & Senet Vade ve Ödeme Takvimi
                          </h2>
                          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                            Ödenmesine / Tahsilatına kalan gün sayısı ve durum
                            analizi
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate("ceksenet")}
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-black text-[10px] uppercase font-bold tracking-wider rounded transition cursor-pointer self-start sm:self-auto shadow-md animate-pulse"
                        >
                          Tüm Çek/Senetleri Gör →
                        </button>
                      </div>

                      {activeCekSenetList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                          <Calendar className="text-white/10 mb-3" size={32} />
                          <span className="text-xs uppercase tracking-widest text-white/50 font-medium">
                            Aktif Çek veya Senet Yok
                          </span>
                          <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                            Portföyde vadesi bekleyen evrak bulunmamaktadır.
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {activeCekSenetList.slice(0, 4).map((item) => {
                            const daysLeft = getDaysRemaining(item.dueDate);
                            const isOverdue = daysLeft < 0;
                            const isToday = daysLeft === 0;

                            let dayBadgeClass = "";
                            let dayText = "";
                            if (isOverdue) {
                              dayBadgeClass =
                                "bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold";
                              dayText = `Günü Geçti (${Math.abs(daysLeft)} Gün)`;
                            } else if (isToday) {
                              dayBadgeClass =
                                "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold animate-pulse";
                              dayText = "BUGÜN ÖDENECEK";
                            } else if (daysLeft <= 7) {
                              dayBadgeClass =
                                "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 font-bold";
                              dayText = `${daysLeft} Gün Kaldı`;
                            } else {
                              dayBadgeClass =
                                "bg-teal-500/10 border-teal-500/20 text-teal-400 font-semibold";
                              dayText = `${daysLeft} Gün Kaldı`;
                            }

                            const docLabel =
                              item.docType === "cheque" ? "Çek" : "Senet";
                            const directionLabel =
                              item.type === "receivable" ? "Alınan" : "Verilen";

                            return (
                              <div
                                key={item.id}
                                className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col justify-between hover:border-white/10 transition"
                              >
                                <div className="flex justify-between items-start gap-2 mb-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                                          item.type === "receivable"
                                            ? "bg-teal-500/10 text-teal-400"
                                            : "bg-rose-500/10 text-rose-400"
                                        }`}
                                      >
                                        {directionLabel} {docLabel}
                                      </span>
                                      {item.status === "unpaid" && (
                                        <span className="text-[9px] uppercase font-bold bg-red-600/20 text-red-400 border border-red-500/20 px-1 py-0.2 rounded">
                                          Karşılıksız/Ödenmemiş
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-bold text-white/90 truncate mt-2">
                                      {item.debtor}
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-0.5 truncate uppercase tracking-wider font-mono">
                                      Portföy No: {item.portfolioNo}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex flex-col gap-2.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-white/30 uppercase font-mono">
                                      Vade Tarihi:
                                    </span>
                                    <span className="text-[10px] font-mono text-white/70 font-semibold">
                                      {item.dueDate}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-end">
                                    <div>
                                      <span className="text-[9px] text-white/30 uppercase font-mono block">
                                        Tutar:
                                      </span>
                                      <span
                                        className="text-sm font-bold text-white font-mono"
                                        style={{ fontFamily: "Georgia, serif" }}
                                      >
                                        {formatCurrency(
                                          item.amount,
                                          item.currency,
                                        )}
                                      </span>
                                    </div>
                                    <div
                                      className={`px-2.5 py-1 text-[10px] font-mono rounded border ${dayBadgeClass}`}
                                    >
                                      {dayText}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
  );
};

