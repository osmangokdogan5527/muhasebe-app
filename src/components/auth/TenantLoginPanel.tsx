import React, { useState } from 'react';
import { User, ChevronDown, Plus, LogIn, X, Loader2 } from 'lucide-react';
import { DeviceAccount, removeDeviceAccount } from '../../utils/accountStore';
import {
  TenantAuthResult,
  MIN_PASSWORD_LENGTH,
  createTenant,
  connectTenant,
  signInTenant,
  suggestTenantCode,
  validateTenantCode
} from '../../utils/tenantAuth';
import { logError } from '../../utils/errorLogger';

export interface TenantLoginStyles {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  cardBgClass: string;
  buttonBgClass: string;
  userIconBg: string;
  inputStyleClass: string;
}

interface TenantLoginPanelProps {
  accounts: DeviceAccount[];
  onAccountsChange: (accounts: DeviceAccount[]) => void;
  onLoggedIn: (account: DeviceAccount, offline: boolean) => void;
  styles: TenantLoginStyles;
}

type Mode = 'list' | 'login' | 'create' | 'connect';

export const TenantLoginPanel: React.FC<TenantLoginPanelProps> = ({ accounts, onAccountsChange, onLoggedIn, styles }) => {
  const { textPrimary, textSecondary, textTertiary, textMuted, cardBgClass, buttonBgClass, userIconBg, inputStyleClass } = styles;

  const [mode, setMode] = useState<Mode>(accounts.length === 0 ? 'create' : 'list');
  const [selectedAccount, setSelectedAccount] = useState<DeviceAccount | null>(null);
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmCode, setFirmCode] = useState('');
  const [isCodeEdited, setIsCodeEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const resetForm = (nextMode: Mode) => {
    setMode(nextMode);
    setPassword('');
    setPasswordRepeat('');
    setFirmName('');
    setFirmCode('');
    setIsCodeEdited(false);
    setError(null);
  };

  const finish = (result: TenantAuthResult) => {
    if (result.status === 'failed') {
      setError(result.message);
      setPassword('');
      return;
    }
    onAccountsChange(
      accounts.some((a) => a.id === result.account.id)
        ? accounts.map((a) => (a.id === result.account.id ? result.account : a))
        : [...accounts, result.account]
    );
    onLoggedIn(result.account, result.status === 'offline');
  };

  const run = async (action: () => Promise<TenantAuthResult>) => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      finish(await action());
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'TenantLoginPanel');
      setError(err?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !password) return;
    run(() => signInTenant(selectedAccount, password));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordRepeat) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }
    run(() => createTenant(firmName, firmCode, password));
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => connectTenant(firmCode, password));
  };

  // Onay tarayıcı penceresiyle (window.confirm) değil sayfa içinde sorulur: AI Studio önizlemesi gibi
  // gömülü çerçevelerde tarayıcı onay pencereleri engellenir ve düğme hiçbir şey yapmıyormuş gibi görünür.
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const handleRemove = (account: DeviceAccount) => {
    try {
      const next = removeDeviceAccount(account.id);
      onAccountsChange(next);
      setPendingRemoveId(null);
      if (next.length === 0) resetForm('create');
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'TenantLoginPanel.handleRemove');
      setError('Firma listeden kaldırılamadı.');
    }
  };

  const inputClass = `w-full transition outline-none px-4 py-3 rounded-xl text-sm ${inputStyleClass}`;
  const labelClass = `block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${textTertiary}`;
  const primaryBtn = 'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition disabled:opacity-50 cursor-pointer';
  const linkBtn = `text-xs font-bold uppercase tracking-widest transition cursor-pointer ${textTertiary} hover:text-teal-500`;

  const backButton = (target: Mode) => (
    <button
      type="button"
      onClick={() => { setSelectedAccount(null); resetForm(target); }}
      className={`flex items-center gap-2 mb-8 ${linkBtn}`}
    >
      <ChevronDown className="rotate-90" size={14} />
      Geri Dön
    </button>
  );

  const errorBox = error && <p className="text-rose-500 text-xs text-center mt-3 font-bold">{error}</p>;

  if (mode === 'list') {
    return (
      <div className="space-y-3 animate-fade-in">
        <h2 className={`text-xs font-bold uppercase tracking-widest mb-6 text-center ${textSecondary}`}>Hesabınızı Seçin</h2>
        {accounts.map((account) => (
          pendingRemoveId === account.id ? (
            <div key={account.id} className={`p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 animate-fade-in`}>
              <p className={`text-xs leading-relaxed mb-3 ${textPrimary}`}>
                <b>{account.name}</b> bu cihazın giriş listesinden kaldırılsın mı? Firmanın verileri silinmez; daha sonra
                "Mevcut Firmaya Bağlan" ile tekrar ekleyebilirsiniz.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRemove(account)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
                >
                  Listeden Kaldır
                </button>
                <button
                  onClick={() => setPendingRemoveId(null)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${buttonBgClass} ${textSecondary}`}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
          <div key={account.id} className="flex items-stretch gap-2 group">
            <button
              onClick={() => { setSelectedAccount(account); resetForm('login'); }}
              className={`flex-1 min-w-0 flex items-center justify-between p-4 rounded-xl transition cursor-pointer ${buttonBgClass}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition ${userIconBg}`}>
                  {account.photoURL ? <img src={account.photoURL} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
                </div>
                <div className="text-left">
                  <span className={`block font-bold tracking-wide ${textPrimary}`}>{account.name}</span>
                  <span className={`block text-[10px] font-mono ${textTertiary}`}>{account.id}</span>
                </div>
              </div>
              <ChevronDown className={`${textMuted} group-hover:text-teal-500 -rotate-90 transition`} size={18} />
            </button>
            {/* Telefonda fareyle üzerine gelme olmadığı için kaldırma düğmesi her zaman görünür */}
            <button
              onClick={() => setPendingRemoveId(account.id)}
              title="Bu cihazın listesinden kaldır"
              aria-label={`${account.name} firmasını bu cihazın listesinden kaldır`}
              className={`shrink-0 w-11 flex items-center justify-center rounded-xl transition cursor-pointer ${buttonBgClass} ${textTertiary} hover:text-rose-500`}
            >
              <X size={16} />
            </button>
          </div>
          )
        ))}
        <div className="flex items-center justify-center gap-6 pt-4">
          <button onClick={() => resetForm('create')} className={`flex items-center gap-1.5 ${linkBtn}`}>
            <Plus size={14} /> Yeni Firma
          </button>
          <button onClick={() => resetForm('connect')} className={`flex items-center gap-1.5 ${linkBtn}`}>
            <LogIn size={14} /> Mevcut Firmaya Bağlan
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'login' && selectedAccount) {
    return (
      <form onSubmit={handleLogin} className={`${cardBgClass} rounded-2xl p-8 animate-fade-in`}>
        {backButton('list')}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto mb-4">
            <User size={24} />
          </div>
          <h3 className={`text-lg font-bold tracking-wider ${textPrimary}`}>{selectedAccount.name}</h3>
          <p className={`text-xs mt-1 ${textTertiary}`}>Lütfen firma şifrenizi girin</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
          placeholder="••••••"
          className={`w-full text-center text-2xl tracking-[0.4em] transition outline-none font-mono px-4 py-4 rounded-xl ${inputStyleClass}`}
          autoFocus
          disabled={isBusy}
        />
        <button type="submit" disabled={isBusy || !password} className={`${primaryBtn} mt-4`}>
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Giriş Yap
        </button>
        {errorBox}
      </form>
    );
  }

  if (mode === 'create') {
    const codeError = firmCode ? validateTenantCode(firmCode) : null;
    return (
      <form onSubmit={handleCreate} className={`${cardBgClass} rounded-2xl p-8 animate-fade-in space-y-4`}>
        {accounts.length > 0 && backButton('list')}
        <div className="text-center mb-2">
          <h3 className={`text-lg font-bold tracking-wider ${textPrimary}`}>Yeni Firma Oluştur</h3>
          <p className={`text-xs mt-1 ${textTertiary}`}>Firmanız ve giriş şifreniz oluşturulur (internet gerekir)</p>
        </div>
        <div>
          <label className={labelClass}>Firma Adı</label>
          <input
            value={firmName}
            onChange={(e) => {
              setFirmName(e.target.value);
              if (!isCodeEdited) setFirmCode(suggestTenantCode(e.target.value));
            }}
            placeholder="Örn: Yılmaz Ticaret"
            className={inputClass}
            autoFocus
            disabled={isBusy}
          />
        </div>
        <div>
          <label className={labelClass}>Firma Kodu (başka cihazdan bağlanırken kullanılır)</label>
          <input
            value={firmCode}
            onChange={(e) => { setIsCodeEdited(true); setFirmCode(e.target.value.toLowerCase()); }}
            placeholder="yilmaz_ticaret"
            className={`${inputClass} font-mono`}
            disabled={isBusy}
          />
          {codeError && <p className="text-amber-500 text-[10px] mt-1 font-bold">{codeError}</p>}
        </div>
        <div>
          <label className={labelClass}>Şifre (en az {MIN_PASSWORD_LENGTH} karakter)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={isBusy} />
        </div>
        <div>
          <label className={labelClass}>Şifre (Tekrar)</label>
          <input type="password" value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} className={inputClass} disabled={isBusy} />
        </div>
        <button type="submit" disabled={isBusy || !firmName.trim() || !!codeError || !firmCode || password.length < MIN_PASSWORD_LENGTH} className={primaryBtn}>
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Firmayı Oluştur
        </button>
        {errorBox}
        <div className="text-center pt-2">
          <button type="button" onClick={() => resetForm('connect')} className={linkBtn}>Firmam zaten var, bağlan</button>
        </div>
      </form>
    );
  }

  // mode === 'connect'
  return (
    <form onSubmit={handleConnect} className={`${cardBgClass} rounded-2xl p-8 animate-fade-in space-y-4`}>
      {backButton(accounts.length > 0 ? 'list' : 'create')}
      <div className="text-center mb-2">
        <h3 className={`text-lg font-bold tracking-wider ${textPrimary}`}>Mevcut Firmaya Bağlan</h3>
        <p className={`text-xs mt-1 ${textTertiary}`}>Başka cihazda oluşturulmuş firmanızı bu cihaza ekleyin (internet gerekir)</p>
      </div>
      <div>
        <label className={labelClass}>Firma Kodu</label>
        <input
          value={firmCode}
          onChange={(e) => setFirmCode(e.target.value.toLowerCase().trim())}
          placeholder="yilmaz_ticaret"
          className={`${inputClass} font-mono`}
          autoFocus
          disabled={isBusy}
        />
      </div>
      <div>
        <label className={labelClass}>Şifre</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={isBusy} />
      </div>
      <button type="submit" disabled={isBusy || !firmCode || !password} className={primaryBtn}>
        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Bağlan ve Giriş Yap
      </button>
      {errorBox}
    </form>
  );
};
