import React, { useState } from 'react';
import { ArrowLeft, Delete, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { StaffUser, MAX_PIN_LENGTH, MIN_PIN_LENGTH, checkPin } from './staffUsers';
import { isMasterCode } from '../utils/masterCode';
import { logError } from '../utils/errorLogger';

interface StaffLoginScreenProps {
  firmName: string;
  users: StaffUser[];
  designStyle: string;
  onLogin: (user: StaffUser) => void;
  /** Firma oturumunu kapatır (cihazı firmadan ayırır) */
  onSignOutFirm: () => void;
}

/** "Kim kullanıyor?" ekranı: kişi adını seçer, kendi PIN'ini girer */
export const StaffLoginScreen: React.FC<StaffLoginScreenProps> = ({ firmName, users, designStyle, onLogin, onSignOutFirm }) => {
  const [selected, setSelected] = useState<StaffUser | null>(users.length === 1 ? users[0] : null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const owners = users.filter((u) => u.role === 'owner');
  const staff = users.filter((u) => u.role !== 'owner');

  const tryPin = async (value: string, final: boolean) => {
    if (!selected) return;
    setChecking(true);
    try {
      const ok = (await checkPin(selected, value))
        // Sahip PIN'ini unutursa yazılım sağlayıcısının ana kodu sahip hesabını açar
        || (selected.role === 'owner' && (await isMasterCode(value)));
      if (ok) {
        setPin('');
        onLogin(selected);
        return;
      }
      if (final) {
        setError('PIN hatalı.');
        setPin('');
      }
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'StaffLoginScreen.tryPin');
      if (final) setError('Giriş yapılamadı, tekrar deneyin.');
    } finally {
      setChecking(false);
    }
  };

  const press = (digit: string) => {
    if (checking) return;
    const next = (pin + digit).slice(0, MAX_PIN_LENGTH);
    setPin(next);
    setError('');
    if (next.length >= MIN_PIN_LENGTH) tryPin(next, next.length === MAX_PIN_LENGTH);
  };

  return (
    <main
      data-design-style={designStyle}
      className="staff-login min-h-screen flex items-center justify-center p-4 bg-[#05060d] text-white"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-[11px] uppercase tracking-widest text-slate-400">{firmName}</div>
          <h1 className="text-2xl font-extrabold mt-1">{selected ? `Merhaba, ${selected.name}` : 'Kim kullanıyor?'}</h1>
          <p className="text-xs text-slate-400 mt-1">{selected ? 'PIN kodunuzu girin' : 'Adınızı seçip kendi PIN kodunuzla girin'}</p>
        </div>

        {!selected ? (
          <div className="space-y-2">
            {[...owners, ...staff].map((u) => (
              <button
                key={u.id}
                type="button"
                id={`staff-pick-${u.id}`}
                onClick={() => { setSelected(u); setPin(''); setError(''); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-left cursor-pointer transition"
              >
                <span className="w-11 h-11 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center text-lg font-bold shrink-0">
                  {u.name.charAt(0).toLocaleUpperCase('tr-TR')}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white truncate">{u.name}</span>
                  <span className="block text-[11px] text-slate-400">{u.role === 'owner' ? 'Sahip' : 'Çalışan'}</span>
                </span>
                {u.role === 'owner' ? <ShieldCheck size={18} className="text-amber-300" /> : <UserIcon size={18} className="text-slate-400" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <div className="flex justify-center gap-3 mb-3" aria-live="polite">
              {Array.from({ length: Math.max(MIN_PIN_LENGTH, pin.length) }, (_, i) => (
                <span key={i} className={`w-3.5 h-3.5 rounded-full border ${i < pin.length ? 'bg-teal-400 border-teal-400' : 'border-white/30'}`} />
              ))}
            </div>
            <input
              id="staff-pin-input"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              maxLength={MAX_PIN_LENGTH}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, MAX_PIN_LENGTH);
                setPin(val);
                setError('');
                if (val.length >= MIN_PIN_LENGTH) tryPin(val, val.length === MAX_PIN_LENGTH);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && pin) tryPin(pin, true); }}
              className="sr-only"
              aria-label="PIN"
            />
            {error && <p className="text-center text-xs font-bold text-rose-400 mb-2">{error}</p>}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} type="button" onClick={() => press(d)} className="py-4 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold cursor-pointer active:scale-95 transition">{d}</button>
              ))}
              <button type="button" onClick={() => { setSelected(null); setPin(''); setError(''); }} className="py-4 rounded-2xl text-slate-300 flex items-center justify-center cursor-pointer" aria-label="Geri"><ArrowLeft size={20} /></button>
              <button type="button" onClick={() => press('0')} className="py-4 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold cursor-pointer active:scale-95 transition">0</button>
              <button type="button" onClick={() => { setPin((p) => p.slice(0, -1)); setError(''); }} className="py-4 rounded-2xl text-slate-300 flex items-center justify-center cursor-pointer" aria-label="Sil"><Delete size={20} /></button>
            </div>
            {pin.length >= MIN_PIN_LENGTH && pin.length < MAX_PIN_LENGTH && (
              <button type="button" onClick={() => tryPin(pin, true)} className="mt-3 w-full py-3 rounded-2xl bg-teal-600 text-white text-sm font-bold cursor-pointer">Giriş</button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onSignOutFirm}
          className="mt-6 mx-auto flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          <LogOut size={14} /> Firmadan çıkış yap
        </button>
      </div>
    </main>
  );
};
