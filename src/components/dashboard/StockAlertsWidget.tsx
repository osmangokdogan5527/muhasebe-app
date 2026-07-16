import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { Stock } from '../../types';

interface StockAlertsWidgetProps {
  criticalStocks: Stock[];
  renderWidgetControls: () => React.ReactNode;
  onNavigate: (view: any) => void;
}

export const StockAlertsWidget = React.memo<StockAlertsWidgetProps>(({
  criticalStocks,
  renderWidgetControls,
  onNavigate
}) => {
  return (
                  <div
                    
                    className={`h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        KRİTİK STOK LİMİTLERİ
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                              Kritik Stok Uyarıları
                            </h2>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                              Miktarı azalan ürünler
                            </p>
                          </div>
                          <span className="p-2 bg-red-500/10 text-red-400 rounded animate-pulse">
                            <AlertTriangle size={18} />
                          </span>
                        </div>

                        {criticalStocks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                            <Package className="text-white/20 mb-3" size={32} />
                            <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                              Kritik Stok Yok
                            </span>
                            <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                              Tüm stoklar güvenli.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {criticalStocks.map((stok) => (
                              <div
                                key={stok.id}
                                className="p-3 bg-red-950/20 rounded-lg border border-red-500/10 flex justify-between items-center hover:border-red-500/30 transition"
                              >
                                <div>
                                  <div className="text-xs font-medium text-white/95">
                                    {stok.name}
                                  </div>
                                  <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                                    Kod: {stok.code || "-"}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-red-400">
                                    {stok.quantity} {stok.unit}
                                  </div>
                                  <div className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">
                                    MİN LİMİT: {stok.minQuantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-goto-stocks"
                        onClick={() => onNavigate("stoklar")}
                        className="w-full mt-6 text-center text-[10px] uppercase tracking-widest font-semibold text-teal-400 hover:text-teal-300 bg-white/5 hover:bg-white/10 py-3 rounded-lg border border-white/5 transition cursor-pointer"
                      >
                        Stok Durumunu Gör →
                      </button>
                    </div>
                  </div>
  );
});

