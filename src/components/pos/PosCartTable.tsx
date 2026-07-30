import React from 'react';
import { PosCartItem } from '../../types/pos';
import { Trash2, Plus, Minus } from 'lucide-react';

interface PosCartTableProps {
  items: PosCartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, discountRate: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const PosCartTable: React.FC<PosCartTableProps> = ({
  items,
  onUpdateQuantity,
  onSetQuantity,
  onUpdateDiscount,
  onUpdateUnitPrice,
  onRemoveItem,
  onClearCart,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-[320px] bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#0f172a' }}>
      {/* BAŞLIK VE SEPETİ TEMİZLE */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-700 flex items-center justify-between shrink-0" style={{ backgroundColor: '#020617' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" style={{ backgroundColor: '#2dd4bf' }}></span>
          <h4 className="text-xs font-black uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>
            SEPETTEKİ ÜRÜNLER <span className="text-teal-400 font-mono font-black" style={{ color: '#2dd4bf' }}>({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
          </h4>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-black text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: '#f87171' }}
          >
            <Trash2 size={14} />
            Sepeti Temizle
          </button>
        )}
      </div>

      {/* SEPET LİSTESİ */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar bg-slate-950" style={{ backgroundColor: '#020617' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 space-y-2">
            <span className="text-4xl">🛒</span>
            <p className="text-xs font-black text-white">Sepetiniz Boş</p>
            <p className="text-[11px] text-slate-300 font-medium text-center">
              Sol taraftan ürün seçebilir veya barkod okutabilirsiniz.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-teal-400 transition-all shadow-xl space-y-2.5 group"
              style={{ backgroundColor: '#0f172a' }}
            >
              {/* SATIR 1: Ürün İsmi, Kod & Silme Butonu */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="px-2 py-0.5 text-[10px] font-black font-mono border rounded-md shrink-0"
                    style={{ backgroundColor: 'rgba(20, 184, 166, 0.25)', color: '#2dd4bf', borderColor: 'rgba(45, 212, 191, 0.6)' }}
                  >
                    {item.stockCode || 'STK'}
                  </span>
                  <h5 className="text-xs font-black text-white truncate leading-snug">
                    {item.stockName}
                  </h5>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-colors shrink-0 cursor-pointer"
                  title="Satırı Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* SATIR 2: Birim Fiyat, Miktar (Adet) & Net Tutar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* 1. Birim Fiyat Kutusu */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Birim Fiyat
                  </span>
                  <div className="flex items-center bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 focus-within:border-teal-400 transition-colors">
                    <span className="text-xs font-black text-teal-400 font-mono mr-1" style={{ color: '#2dd4bf' }}>₺</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        onUpdateUnitPrice(item.id, Math.max(0, Number(e.target.value) || 0))
                      }
                      className="pos-number-input w-20 text-xs font-black font-mono text-white"
                      title="Birim Fiyat"
                      style={{ color: '#ffffff' }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 ml-1">/{item.unit || 'Adet'}</span>
                  </div>
                </div>

                {/* 2. Miktar / Adet Stepper Kutusu */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">
                    Miktar (Adet)
                  </span>
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 overflow-hidden">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700"
                      title="1 Azalt"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onSetQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                      className="pos-number-input w-12 text-center text-xs font-black font-mono text-white"
                      title="Adet"
                      style={{ color: '#ffffff' }}
                    />
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700"
                      title="1 Arttır"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* 3. Satır Toplam Tutar */}
                <div className="flex flex-col gap-1 text-right min-w-[90px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tutar
                  </span>
                  <span className="text-sm font-black text-teal-300 font-mono tracking-tight" style={{ color: '#2dd4bf' }}>
                    ₺{item.totalLine.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
