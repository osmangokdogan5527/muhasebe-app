/**
 * Yönetim Paneli > Firmalar (yalnızca sistem kurucusu).
 *
 * Kurucu hesabıyla girilir; firmalar listelenir, şifre kasasındaki şifre gösterilir, firma
 * dondurulur / yeniden başlatılır, silinir ya da yeni firma kurulur. İlk kurulumda kurucu
 * hesabı açılır ve Firebase'e yapıştırılacak güvenlik kuralları gösterilir.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2, Check, Copy, Eye, EyeOff, KeyRound, Loader2, LogOut, Pause, Play, Plus, RefreshCw, ShieldCheck, Trash2, AlertTriangle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { logError } from '../utils/errorLogger';
import { suggestTenantCode } from '../utils/tenantAuth';
import {
  FirmRecord, MIN_FOUNDER_PASSWORD_LENGTH, buildFirestoreRules, createFirmFromPanel, createFounderAccount, deleteFirm,
  isPermissionDenied, listFirms, setFirmStatus, signInFounder, signOutFounder, watchFounder,
} from './founderAuth';
import { openSealedPassword, unlockVault } from './passwordVault';

interface FirmsPanelProps {
  /** Panele girilen ana kod (şifre kasasını açmak için; yalnızca bellekte) */
  masterCode: string;
  isLight: boolean;
}

type View = 'loading' | 'login' | 'create' | 'setup' | 'list';

const toErr = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

const STATUS_LABEL: Record<FirmRecord['status'], string> = { active: 'Aktif', suspended: 'Durduruldu', deleted: 'Silindi' };

export const FirmsPanel: React.FC<FirmsPanelProps> = ({ masterCode, isLight }) => {
  const [view, setView] = useState<View>('loading');
  const [founder, setFounder] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firms, setFirms] = useState<FirmRecord[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ code: string; typed: string; progress: number | null } | null>(null);
  const [newFirm, setNewFirm] = useState<{ name: string; code: string; password: string; codeTouched: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const vaultKeyRef = useRef<Promise<CryptoKey> | null>(null);
  const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const card = isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/5 border border-white/10';
  const text = isLight ? 'text-slate-800' : 'text-white';
  const sub = isLight ? 'text-slate-500' : 'text-white/55';
  const input = `w-full px-3 py-2.5 rounded-xl text-sm outline-none transition ${isLight ? 'bg-white border border-slate-300 focus:border-teal-500 text-slate-800' : 'bg-white/5 border border-white/10 focus:border-teal-500 text-white'}`;
  const btn = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60';
  const btnGhost = `${btn} ${isLight ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'}`;
  const btnPrimary = `${btn} bg-teal-600 hover:bg-teal-700 text-white`;

  const loadFirms = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setFirms(await listFirms());
      setView('list');
    } catch (err) {
      logError(toErr(err), 'FirmsPanel.loadFirms');
      if (isPermissionDenied(err)) {
        setError('Firmalar okunamadı: Firebase kuralları henüz yüklenmemiş. Aşağıdaki adımları izleyin.');
        setView('setup');
      } else {
        setError(`Firmalar okunamadı: ${toErr(err).message}`);
        setView('list');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let first = true;
    const unsub = watchFounder((user) => {
      setFounder(user);
      if (first) {
        first = false;
        if (user) loadFirms();
        else setView('login');
      } else if (!user) {
        setView('login');
      }
    });
    const timers = hideTimers.current;
    return () => {
      unsub();
      Object.values(timers).forEach(clearTimeout);
    };
  }, [loadFirms]);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    const res = await signInFounder(password);
    setBusy(false);
    if ('message' in res) return setError(res.message);
    setPassword('');
    loadFirms();
  };

  const handleCreateFounder = async () => {
    setError(null);
    if (password.length < MIN_FOUNDER_PASSWORD_LENGTH) return setError(`Kurucu şifresi en az ${MIN_FOUNDER_PASSWORD_LENGTH} karakter olmalıdır.`);
    if (password !== password2) return setError('Şifreler eşleşmiyor.');
    setBusy(true);
    const res = await createFounderAccount(password);
    setBusy(false);
    if ('message' in res) return setError(res.message);
    setPassword('');
    setPassword2('');
    setView('setup');
  };

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch (err) {
      logError(toErr(err), 'FirmsPanel.copy');
    }
  };

  const revealPassword = async (firm: FirmRecord) => {
    if (revealed[firm.code]) {
      setRevealed((r) => { const n = { ...r }; delete n[firm.code]; return n; });
      return;
    }
    if (!firm.sealedPassword) return;
    setRevealing(firm.code);
    setError(null);
    try {
      if (!vaultKeyRef.current) vaultKeyRef.current = unlockVault(masterCode);
      const key = await vaultKeyRef.current;
      const value = await openSealedPassword(firm.sealedPassword, key);
      setRevealed((r) => ({ ...r, [firm.code]: value }));
      clearTimeout(hideTimers.current[firm.code]);
      // Ekranda açık kalmasın: 30 sn sonra gizlenir
      hideTimers.current[firm.code] = setTimeout(() => {
        setRevealed((r) => { const n = { ...r }; delete n[firm.code]; return n; });
      }, 30_000);
    } catch (err) {
      vaultKeyRef.current = null;
      logError(toErr(err), 'FirmsPanel.revealPassword');
      setError('Şifre açılamadı. Şifre kasası bu ana kodla eşleşmiyor ya da kayıt bozuk.');
    } finally {
      setRevealing(null);
    }
  };

  const toggleStatus = async (firm: FirmRecord) => {
    setRowBusy(firm.code);
    setError(null);
    try {
      await setFirmStatus(firm.code, firm.status === 'active' ? 'suspended' : 'active');
      await loadFirms();
    } catch (err) {
      logError(toErr(err), 'FirmsPanel.toggleStatus');
      setError(`Durum değiştirilemedi: ${toErr(err).message}`);
    } finally {
      setRowBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || deleting.typed.trim() !== deleting.code) return;
    const code = deleting.code;
    setDeleting({ ...deleting, progress: 0 });
    setError(null);
    try {
      await deleteFirm(code, (n) => setDeleting((d) => (d ? { ...d, progress: n } : d)));
      setDeleting(null);
      await loadFirms();
    } catch (err) {
      logError(toErr(err), 'FirmsPanel.deleteFirm');
      setError(`Silme yarıda kaldı: ${toErr(err).message}. Tekrar deneyebilirsiniz.`);
      setDeleting((d) => (d ? { ...d, progress: null } : d));
    }
  };

  const handleCreateFirm = async () => {
    if (!newFirm) return;
    setBusy(true);
    setError(null);
    const res = await createFirmFromPanel(newFirm.name, newFirm.code, newFirm.password);
    setBusy(false);
    if ('message' in res) return setError(res.message);
    setNewFirm(null);
    loadFirms();
  };

  const errorBox = error && (
    <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/25 text-rose-500">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
    </div>
  );

  if (view === 'loading') {
    return <div className={`flex items-center justify-center gap-2 py-12 text-sm ${sub}`}><Loader2 size={16} className="animate-spin" /> Yükleniyor…</div>;
  }

  if (view === 'login' || view === 'create') {
    const creating = view === 'create';
    return (
      <div className="max-w-md mx-auto py-6">
        <div className={`p-5 rounded-2xl ${card}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-teal-500" />
            <h3 className={`text-sm font-extrabold ${text}`}>{creating ? 'Kurucu Hesabı Oluştur' : 'Kurucu Girişi'}</h3>
          </div>
          <p className={`text-xs mb-4 ${sub}`}>
            {creating
              ? 'Firmaları yönetmek için size özel bir hesap açılır. Bu şifreyi kimseyle paylaşmayın; ana koddan farklı ve en az 8 karakter olsun.'
              : 'Firmaları görmek ve yönetmek için kurucu şifrenizi girin.'}
          </p>
          {errorBox}
          <input id="founder-password" type="password" autoComplete="off" className={input} placeholder="Kurucu şifresi" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !creating) handleLogin(); }} />
          {creating && (
            <input id="founder-password2" type="password" autoComplete="off" className={`${input} mt-2`} placeholder="Şifre tekrar" value={password2} onChange={(e) => setPassword2(e.target.value)} />
          )}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" className={`text-xs font-bold underline underline-offset-2 cursor-pointer ${sub}`} onClick={() => { setError(null); setView(creating ? 'login' : 'create'); }}>
              {creating ? 'Hesabım var, giriş yap' : 'İlk kez mi? Kurucu hesabı oluştur'}
            </button>
            <button id="founder-submit" type="button" disabled={busy || !password} onClick={creating ? handleCreateFounder : handleLogin} className={btnPrimary}>
              {busy && <Loader2 size={14} className="animate-spin" />} {creating ? 'Oluştur' : 'Giriş'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    const uid = founder?.uid || '';
    const rules = buildFirestoreRules(uid);
    return (
      <div className="space-y-4">
        {errorBox}
        <div className={`p-5 rounded-2xl ${card}`}>
          <h3 className={`text-sm font-extrabold mb-1 ${text}`}>Son adım: Firebase güvenlik kuralları (bir kerelik)</h3>
          <p className={`text-xs mb-3 ${sub}`}>Bu kurallar firmaları yalnızca sizin hesabınızın yönetmesini ve durdurulan firmanın veriye erişememesini sunucu tarafında garanti eder.</p>
          <ol className={`text-xs space-y-1.5 list-decimal pl-5 mb-4 ${text}`}>
            <li><b>console.firebase.google.com</b> adresinde projenizi açın (aesthetic-light-cw2h4).</li>
            <li>Sol menüden <b>Firestore Database</b>'e girin; üstteki veritabanı seçicisinde <b>ai-studio-…</b> veritabanının seçili olduğundan emin olun.</li>
            <li><b>Kurallar (Rules)</b> sekmesini açın, içindeki her şeyi silin.</li>
            <li>Aşağıdaki <b>Kuralları Kopyala</b> düğmesine basıp oraya yapıştırın ve <b>Yayınla (Publish)</b> deyin.</li>
            <li>Buraya dönüp <b>Firmaları Göster</b>'e basın.</li>
          </ol>
          <div className={`flex flex-wrap items-center gap-2 mb-2 text-xs ${sub}`}>
            <span>Kurucu kimliğiniz (UID):</span>
            <code id="founder-uid" className={`px-2 py-1 rounded-lg font-mono ${isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-black/40 text-white'}`}>{uid}</code>
          </div>
          <textarea readOnly value={rules} rows={10} className={`${input} font-mono text-[11px] leading-snug`} />
          <div className="mt-3 flex flex-wrap gap-2 justify-end">
            <button type="button" className={btnGhost} onClick={() => copy('rules', rules)}>
              {copied === 'rules' ? <Check size={14} /> : <Copy size={14} />} {copied === 'rules' ? 'Kopyalandı' : 'Kuralları Kopyala'}
            </button>
            <button id="founder-show-firms" type="button" className={btnPrimary} disabled={busy} onClick={loadFirms}>
              {busy && <Loader2 size={14} className="animate-spin" />} Firmaları Göster
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Liste
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className={`text-sm font-extrabold ${text}`}>Firmalar ({firms.filter((f) => f.status !== 'deleted').length})</h3>
          <p className={`text-[11px] ${sub}`}>Eski firmalar bu sürümle bir kez giriş yaptıktan sonra listede görünür.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={loadFirms} disabled={busy}><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Yenile</button>
          <button id="firm-new" type="button" className={btnPrimary} onClick={() => setNewFirm({ name: '', code: '', password: '', codeTouched: false })}><Plus size={14} /> Yeni Firma</button>
          <button type="button" className={btnGhost} onClick={() => setView('setup')}><KeyRound size={14} /> Kurallar</button>
          <button type="button" className={btnGhost} onClick={() => signOutFounder()}><LogOut size={14} /> Kurucu Çıkışı</button>
        </div>
      </div>

      {errorBox}

      {newFirm && (
        <div className={`p-4 rounded-2xl ${card}`}>
          <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${text}`}>Yeni firma kur</h4>
          <div className="grid sm:grid-cols-3 gap-2">
            <input id="new-firm-name" className={input} placeholder="Firma adı" value={newFirm.name} onChange={(e) => setNewFirm({ ...newFirm, name: e.target.value, code: newFirm.codeTouched ? newFirm.code : suggestTenantCode(e.target.value) })} />
            <input id="new-firm-code" className={`${input} font-mono`} placeholder="firma_kodu" value={newFirm.code} onChange={(e) => setNewFirm({ ...newFirm, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''), codeTouched: true })} />
            <input id="new-firm-password" className={input} placeholder="Şifre (en az 6)" value={newFirm.password} onChange={(e) => setNewFirm({ ...newFirm, password: e.target.value })} />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setNewFirm(null)}>Vazgeç</button>
            <button id="new-firm-save" type="button" className={btnPrimary} disabled={busy} onClick={handleCreateFirm}>{busy && <Loader2 size={14} className="animate-spin" />} Firmayı Kur</button>
          </div>
        </div>
      )}

      {firms.length === 0 ? (
        <div className={`text-center py-10 text-sm ${sub}`}>
          <Building2 size={36} className="mx-auto mb-3 opacity-50" />
          Henüz kayıtlı firma yok. Firmalar bu sürümle giriş yaptıkça burada görünür.
        </div>
      ) : (
        <div className="space-y-2">
          {firms.map((firm) => {
            const deleted = firm.status === 'deleted';
            const pw = revealed[firm.code];
            const statusTone = firm.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
              : firm.status === 'suspended' ? 'bg-orange-500/10 text-orange-500 border-orange-500/25' : 'bg-slate-500/10 text-slate-400 border-slate-500/25';
            return (
              <div key={firm.code} id={`firm-row-${firm.code}`} className={`p-4 rounded-2xl ${card} ${deleted ? 'opacity-60' : ''}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-extrabold ${text}`}>{firm.name}</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusTone}`}>{STATUS_LABEL[firm.status]}</span>
                    </div>
                    <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono ${sub}`}>
                      <span>Kod: {firm.code}</span>
                      <span>Kuruluş: {formatDateTime(firm.createdAt)}</span>
                      <span>Son giriş: {formatDateTime(firm.lastLoginAt)}{firm.lastDevice ? ` · ${firm.lastDevice}` : ''}</span>
                      {firm.appVersion && <span>Sürüm: {firm.appVersion}</span>}
                    </div>
                    {pw && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25">
                        <span className="text-[11px] font-bold text-teal-500">Şifre:</span>
                        <code className={`text-sm font-mono ${text}`} data-firm-password={firm.code}>{pw}</code>
                        <button type="button" className="text-teal-500 cursor-pointer" title="Kopyala" onClick={() => copy(firm.code, pw)}>{copied === firm.code ? <Check size={14} /> : <Copy size={14} />}</button>
                      </div>
                    )}
                  </div>
                  {!deleted && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        data-action="reveal"
                        className={btnGhost}
                        disabled={!firm.sealedPassword || revealing === firm.code}
                        title={firm.sealedPassword ? '' : 'Şifre kasada yok: firma bu sürümle bir kez giriş yapınca görünür'}
                        onClick={() => revealPassword(firm)}
                      >
                        {revealing === firm.code ? <Loader2 size={14} className="animate-spin" /> : pw ? <EyeOff size={14} /> : <Eye size={14} />}
                        {firm.sealedPassword ? (pw ? 'Gizle' : 'Şifreyi Göster') : 'Şifre kayıtlı değil'}
                      </button>
                      <button type="button" data-action="toggle" className={btnGhost} disabled={rowBusy === firm.code} onClick={() => toggleStatus(firm)}>
                        {rowBusy === firm.code ? <Loader2 size={14} className="animate-spin" /> : firm.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        {firm.status === 'active' ? 'Durdur' : 'Başlat'}
                      </button>
                      <button type="button" data-action="delete" className={`${btn} bg-rose-500/10 text-rose-500 hover:bg-rose-500/20`} onClick={() => setDeleting({ code: firm.code, typed: '', progress: null })}>
                        <Trash2 size={14} /> Sil
                      </button>
                    </div>
                  )}
                </div>

                {deleting?.code === firm.code && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <p className="text-xs font-bold text-rose-500 mb-2">
                      Firmanın bütün verisi (cariler, stoklar, işlemler, ayarlar, kullanıcılar) kalıcı olarak silinir ve firma bir daha giriş yapamaz. Geri alınamaz.
                      Onaylamak için firma kodunu yazın: <code className="font-mono">{firm.code}</code>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input data-delete-confirm={firm.code} className={`${input} font-mono`} value={deleting.typed} onChange={(e) => setDeleting({ ...deleting, typed: e.target.value })} disabled={deleting.progress !== null} />
                      <div className="flex gap-2 shrink-0">
                        <button type="button" className={btnGhost} onClick={() => setDeleting(null)} disabled={deleting.progress !== null}>Vazgeç</button>
                        <button type="button" data-delete-go={firm.code} className={`${btn} bg-rose-600 hover:bg-rose-700 text-white`} disabled={deleting.typed.trim() !== firm.code || deleting.progress !== null} onClick={confirmDelete}>
                          {deleting.progress !== null ? <><Loader2 size={14} className="animate-spin" /> {deleting.progress} kayıt silindi…</> : <><Trash2 size={14} /> Kalıcı Olarak Sil</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
