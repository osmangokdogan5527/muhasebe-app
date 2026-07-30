import React, { useState, useEffect } from 'react';
import { PosPaymentSplit } from '../../types/pos';
import { BankAccount, Cari } from '../../types';
import { DollarSign, CreditCard, User, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosSplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  bankAccounts: BankAccount[];
  selectedCari: Cari | null;
  onConfirmPayment: (split: PosPaymentSplit) => void;
}

export const PosSplitPaymentModal: React.FC<PosSplitPaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  bankAccounts,
  selectedCari,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [posAmount, setPosAmount] = useState<number>(0);
  const [posAccountId, setPosAccountId] = useState<string>('');
  const [openAccountAmount, setOpenAccountAmount] = useState<number>(0);

  // POS Hesaplarını filtrele
  const posAccounts = bankAccounts.filter(a => a.type === 'pos' || a.type === 'banka');

  useEffect(() => {
    try {
      // Varsayılan olarak Nakit tutarını tam toplamla başlat
      setCashAmount(grandTotal);
      setCashReceived(grandTotal);
      setPosAmount(0);
      setOpenAccountAmount(0);
      if (posAccounts.length > 0) {
        setPosAccountId(posAccounts[0].id);
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosSplitPaymentModal:useEffect');
    }
  }, [grandTotal, isOpen]);

  // Toplam ödenen tutar
  const totalAllocated = Number((cashAmount + posAmount + openAccountAmount).toFixed(2));
  const remainingToAllocate = Number((grandTotal - totalAllocated).toFixed(2));
  const changeGiven = cashReceived > cashAmount ? Number((cashReceived - cashAmount).toFixed(2)) : 0;

  // Kalan tutarı tek tıkla belirli ödeme türüne atama yardımcıları
  const fillRemainingTo = (type: 'cash' | 'pos' | 'openAccount') => {
    try {
      if (type === 'cash') {
        const newCash = Number((cashAmount + remainingToAllocate).toFixed(2));
        setCashAmount(Math.max(0, newCash));
        setCashReceived(Math.max(0, newCash));
      } else if (type === 'pos') {
        const newPos = Number((posAmount + remainingToAllocate).toFixed(2));
        setPosAmount(Math.max(0, newPos));
      } else if (type === 'openAccount') {
        if (!selectedCari) return;
        const newOpen = Number((openAccountAmount + remainingToAllocate).toFixed(2));
        setOpenAccountAmount(Math.max(0, newOpen));
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosSplitPaymentModal:fillRemainingTo');
    }
  };

  const handleConfirm = () => {
    try {
      if (remainingToAllocate > 0.01) {
        alert(`Lütfen kalan ₺${remainingToAllocate.toFixed(2)} tutarı ödeme türlerine tam olarak dağıtın.`);
        return;
      }

      if (openAccountAmount > 0 && !selectedCari) {
        alert('Açık Hesap (Veresiye) kalemi için lütfen müşteri (cari) seçiniz!');
        return;
      }

      onConfirmPayment({
        cashAmount,
        cashReceived: Math.max(cashAmount, cashReceived),
        changeGiven,
        posAmount,
        posAccountId,
        openAccountAmount,
      });
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosSplitPaymentModal:handleConfirm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>💳 Parçalı Ödeme & Tahsilat Terminali</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nakit, Kredi Kartı ve Açık Hesap tutarlarını kırılımlı olarak girin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* TOPLAM & KALAN TUTAR ÖZET KARTI */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-700 text-center shadow-lg">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Ödenecek Toplam
              </span>
              <span className="text-xl font-black text-white font-mono block mt-1">
                ₺{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Dağıtılan Ödeme
              </span>
              <span className="text-xl font-black text-teal-300 font-mono block mt-1">
                ₺{totalAllocated.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Kalan Tutar
              </span>
              <span
                className={`text-xl font-black font-mono block mt-1 ${
                  Math.abs(remainingToAllocate) < 0.01
                    ? 'text-emerald-400'
                    : 'text-amber-300 animate-pulse'
                }`}
              >
                ₺{remainingToAllocate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ÖDEME KANALLARI BÖLÜMLERİ */}
          <div className="space-y-4">
            {/* 1. NAKİT ÖDEME */}
            <div className="p-4 rounded-xl bg-slate-800 border-2 border-teal-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-teal-300 flex items-center gap-2">
                  <DollarSign size={16} className="text-teal-400" />
                  Nakit Ödeme Tutarı
                </label>
                {remainingToAllocate > 0 && (
                  <button
                    onClick={() => fillRemainingTo('cash')}
                    className="text-[11px] font-bold text-teal-300 hover:text-white underline cursor-pointer"
                  >
                    Kalanı Nakit Kapat (+₺{remainingToAllocate.toFixed(2)})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-200 font-bold block mb-1">Nakit Tutar (₺)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount || ''}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setCashAmount(val);
                      if (cashReceived < val) setCashReceived(val);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-200 font-bold block mb-1">Alınan Nakit (Para Üstü İçin)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {changeGiven > 0 && (
                <div className="p-2.5 bg-teal-500/20 border border-teal-400/50 rounded-lg flex items-center justify-between text-xs font-black text-teal-200">
                  <span>Müşteriye Verilecek Para Üstü:</span>
                  <span className="text-sm font-mono text-teal-200">
                    ₺{changeGiven.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* 2. KREDİ KARTI / POS ÖDEME */}
            <div className="p-4 rounded-xl bg-slate-800 border-2 border-blue-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-blue-300 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-400" />
                  Kredi Kartı / POS Tutarı
                </label>
                {remainingToAllocate > 0 && (
                  <button
                    onClick={() => fillRemainingTo('pos')}
                    className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer"
                  >
                    Kalanı POS ile Kapat (+₺{remainingToAllocate.toFixed(2)})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-200 font-bold block mb-1">POS Tutarı (₺)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={posAmount || ''}
                    onChange={(e) => setPosAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-200 font-bold block mb-1">POS / Banka Hesabı</span>
                  <select
                    value={posAccountId}
                    onChange={(e) => setPosAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-400"
                  >
                    {posAccounts.length === 0 ? (
                      <option value="">Merkez POS Hesabı</option>
                    ) : (
                      posAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. AÇIK HESAP / VERESİYE */}
            <div className="p-4 rounded-xl bg-slate-800 border-2 border-amber-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 flex items-center gap-2">
                  <User size={16} className="text-amber-400" />
                  Açık Hesap (Cari Borcu / Veresiye)
                </label>
                {remainingToAllocate > 0 && selectedCari && (
                  <button
                    onClick={() => fillRemainingTo('openAccount')}
                    className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                  >
                    Kalanı Veresiye Yaz (+₺{remainingToAllocate.toFixed(2)})
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-200 font-bold">Veresiye Tutar (₺)</span>
                  <span className="text-[11px] text-slate-200 font-medium">
                    Müşteri:{' '}
                    <strong className="text-white font-black">
                      {selectedCari ? selectedCari.name : 'Seçilmedi (Gerekli)'}
                    </strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!selectedCari}
                  value={openAccountAmount || ''}
                  onChange={(e) => setOpenAccountAmount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder={!selectedCari ? 'Açık hesap için önce müşteri seçin' : '0.00'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER & ONAY */}
        <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            Ödemeyi Ve Satışı Tamamla
          </button>
        </div>
      </div>
    </div>
  );
};
