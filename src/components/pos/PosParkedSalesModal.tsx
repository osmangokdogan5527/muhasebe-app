import React from 'react';
import { PosParkedSale } from '../../types/pos';
import { Clock, Play, Trash2, X, ShoppingBag } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosParkedSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkedSales: PosParkedSale[];
  onRestoreSale: (sale: PosParkedSale) => void;
  onDeleteSale: (id: string) => void;
}

export const PosParkedSalesModal: React.FC<PosParkedSalesModalProps> = ({
  isOpen,
  onClose,
  parkedSales,
  onRestoreSale,
  onDeleteSale,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Askıya Alınan (Park Edilen) Satışlar ({parkedSales.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* LIST */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {parkedSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
              <ShoppingBag size={40} className="text-slate-600 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-400">Askıda bekleyen herhangi bir satış bulunmuyor.</p>
            </div>
          ) : (
            parkedSales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 rounded-xl bg-slate-800/80 border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {sale.customerName || 'Perakende Müşteri'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-950 border border-white/10">
                      {sale.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {sale.items.length} Kalem Ürün ({sale.items.reduce((acc, i) => acc + i.quantity, 0)} Adet)
                  </p>
                  <span className="text-sm font-extrabold text-teal-400 font-mono block">
                    ₺{sale.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRestoreSale(sale)}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Play size={14} />
                    Sepete Al
                  </button>
                  <button
                    onClick={() => onDeleteSale(sale.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
