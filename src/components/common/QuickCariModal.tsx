import React, { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { Cari } from '../../types';
import { saveCari } from '../../firebase';
import { logError } from '../../utils/errorLogger';

interface QuickCariModalProps {
  /** Önerilen ad (arama kutusuna yazılan) */
  initialName: string;
  /** Kod üretmek için mevcut cari sayısı */
  existingCount: number;
  onClose: () => void;
  /** Oluşturulan cari (kayıt bittiğinde) */
  onCreated: (cari: Cari) => void;
}

/** Kasada / sahada veresiye için hızlı müşteri kartı: yalnızca ad ve telefon */
export const QuickCariModal: React.FC<QuickCariModalProps> = ({ initialName, existingCount, onClose, onCreated }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setName(initialName), [initialName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Müşteri adını girin.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const data: Omit<Cari, 'id'> = {
        name: trimmed,
        code: `CAR-${String(existingCount + 1).padStart(4, '0')}`,
        type: 'customer',
        phone: phone.trim(),
        email: '',
        address: '',
        balance: 0,
        openingBalance: 0,
        isActive: true,
        currency: 'TRY',
        createdAt: new Date().toISOString(),
      };
      const id = await saveCari(data);
      onCreated({ id, ...data });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'QuickCariModal.handleSave');
      setError('Müşteri kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[135] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center"><UserPlus size={18} /></span>
            <div>
              <h3 className="text-sm font-bold">Yeni Müşteri</h3>
              <p className="text-[11px] text-white/50">Veresiye için hızlı cari kartı</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Kapat"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="block text-[11px] font-semibold text-white/60 mb-1">Ad / Unvan</span>
            <input
              id="quick-cari-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-white/60 mb-1">Telefon (isteğe bağlı)</span>
            <input
              id="quick-cari-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="05xx xxx xx xx"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
            />
          </label>
          {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={onClose} className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold cursor-pointer">Vazgeç</button>
            <button type="button" disabled={isSaving} onClick={handleSave} className="py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
              {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Seç'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
