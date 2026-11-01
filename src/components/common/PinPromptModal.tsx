import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { logError } from '../../utils/errorLogger';
import { isValidAdminCode, MASTER_CODE_LENGTH } from '../../utils/masterCode';

interface PinPromptModalProps {
  isOpen: boolean;
  /** Ayarlar > Yönetici & Yetkiler'de belirlenen PIN */
  escalationPin: string;
  /** PIN doğrulanınca çağrılır (pencere kendini kapatır) */
  onSuccess: () => void;
  /** Vazgeç ya da kapat */
  onCancel: () => void;
  title?: string;
  description?: string;
}

/**
 * Personelin kısıtlı bir işlemi (silme, stok düşürme, düzenleme) yapabilmesi için
 * yönetici PIN'i soran ortak pencere. PIN uzunluğu kadar hane girilince kendiliğinden denetlenir.
 */
export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  escalationPin,
  onSuccess,
  onCancel,
  title = 'Yönetici Doğrulaması',
  description = 'Bu işlemi gerçekleştirmek için Yönetici PIN kodunu giriniz.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const latestRef = useRef('');
  const pinLength = Math.max(4, (escalationPin || '').length);
  const maxLength = Math.max(pinLength, MASTER_CODE_LENGTH);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verify = async (val: string, final: boolean) => {
    try {
      if (escalationPin && val === escalationPin) {
        setPin('');
        onSuccess();
        return;
      }
      // Sahip PIN'i (4-6 hane) ya da PIN unutulduysa yazılım sağlayıcısının ana kodu
      const ok = await isValidAdminCode(val, escalationPin);
      if (latestRef.current !== val && !final) return;
      if (ok) {
        setPin('');
        onSuccess();
      } else if (val.length === MASTER_CODE_LENGTH || final) {
        setError('Hatalı Yönetici PIN kodu!');
        setPin('');
      }
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'PinPromptModal.verify');
    }
  };

  const handleChange = (raw: string) => {
    const val = raw.replace(/[^0-9]/g, '').slice(0, MASTER_CODE_LENGTH);
    setPin(val);
    latestRef.current = val;
    setError('');
    if (val.length >= pinLength) verify(val, false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} />
        </div>

        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-white/60 mt-1 mb-6">{description}</p>

        <div className="space-y-4">
          <input
            id="pin-prompt-input"
            type="password"
            inputMode="numeric"
            maxLength={maxLength}
            value={pin}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && pin) { e.preventDefault(); verify(pin, true); } }}
            placeholder={'•'.repeat(pinLength)}
            className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] text-white transition outline-none font-mono"
            autoFocus
          />
          {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
          <p className="text-[11px] text-white/40">PIN'inizi unuttuysanız yazılım sağlayıcınızdan kod isteyin.</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-white/10 cursor-pointer"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
};
