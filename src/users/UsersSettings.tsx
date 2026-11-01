import React, { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Power, ShieldCheck, Trash2, User as UserIcon, Users, X } from 'lucide-react';
import { TAB_DEFS } from '../constants';
import { logError } from '../utils/errorLogger';
import { confirmDialog } from '../utils/dialogs';
import type { StaffSession } from './useStaffSession';
import {
  IDLE_LOGOUT_MINUTES,
  MAX_PIN_LENGTH,
  STAFF_ACTIONS,
  StaffActions,
  StaffRole,
  StaffUser,
  emptyActions,
  hashPin,
  newUserId,
  validatePin,
} from './staffUsers';

/** Kullanıcıya verilebilecek ekranlar (Tahsilat ayrı bir ekran olarak yetkilendirilir) */
export const STAFF_TAB_OPTIONS: { id: string; label: string }[] = [
  ...Object.entries(TAB_DEFS).map(([id, def]) => ({ id, label: def.label })),
  { id: 'tahsilat', label: 'Tahsilat / Ödeme (hızlı ekran)' },
];

export const ALL_STAFF_TAB_IDS = STAFF_TAB_OPTIONS.map((t) => t.id);

interface UsersSettingsProps {
  staff: StaffSession;
  /** Eski tek PIN'li yetki ayarlarından gelen, yeni çalışanlar için varsayılan yetkiler */
  legacyDefaults: { allowedTabs: string[]; actions: StaffActions };
  /** Sahip hesabı oluşturulurken önerilen ad */
  suggestedOwnerName: string;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

interface Draft {
  id: string | null;
  name: string;
  role: StaffRole;
  active: boolean;
  pin: string;
  pinConfirm: string;
  allowedTabs: string[];
  actions: StaffActions;
}

const pinInputClass =
  'w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.4em] text-white transition outline-none font-mono';
const textInputClass =
  'w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white transition outline-none';

const toErr = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

export const UsersSettings: React.FC<UsersSettingsProps> = ({ staff, legacyDefaults, suggestedOwnerName, showToast }) => {
  const { users, currentUser, systemActive } = staff;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // İlk kurulum (sahip hesabı)
  const [ownerName, setOwnerName] = useState(suggestedOwnerName || 'Sahip');
  const [ownerPin, setOwnerPin] = useState('');
  const [ownerPinConfirm, setOwnerPinConfirm] = useState('');

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, 'tr') : a.role === 'owner' ? -1 : 1)),
    [users],
  );
  const activeOwnerCount = users.filter((u) => u.role === 'owner' && u.active).length;

  const persist = async (next: StaffUser[], successText: string): Promise<boolean> => {
    setSaving(true);
    try {
      await staff.saveUsers(next);
      showToast(successText, 'success');
      return true;
    } catch (err) {
      logError(toErr(err), 'UsersSettings.persist');
      setError('Kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const nameTaken = (name: string, exceptId: string | null) =>
    users.some((u) => u.id !== exceptId && u.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));

  // ---- İlk kurulum ----
  const handleCreateOwner = async () => {
    setError(null);
    const name = ownerName.trim();
    if (!name) return setError('Sahip adını yazın.');
    const pinError = validatePin(ownerPin);
    if (pinError) return setError(pinError);
    if (ownerPin !== ownerPinConfirm) return setError('PIN kodları eşleşmiyor.');
    try {
      setSaving(true);
      const owner: StaffUser = {
        id: newUserId(),
        name,
        role: 'owner',
        pin: await hashPin(ownerPin),
        active: true,
        allowedTabs: [...ALL_STAFF_TAB_IDS],
        actions: STAFF_ACTIONS.reduce((acc, a) => ({ ...acc, [a.key]: true }), {} as StaffActions),
        createdAt: new Date().toISOString(),
      };
      const ok = await persist([owner], 'Kullanıcı sistemi açıldı. Şimdi çalışanlarınızı ekleyebilirsiniz.');
      if (ok) {
        staff.login(owner);
        setOwnerPin('');
        setOwnerPinConfirm('');
      }
    } catch (err) {
      logError(toErr(err), 'UsersSettings.handleCreateOwner');
      setError('Sahip hesabı oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Düzenleme ----
  const openNew = () => {
    setError(null);
    setDraft({
      id: null,
      name: '',
      role: 'staff',
      active: true,
      pin: '',
      pinConfirm: '',
      allowedTabs: [...legacyDefaults.allowedTabs],
      actions: { ...emptyActions(), ...legacyDefaults.actions },
    });
  };

  const openEdit = (u: StaffUser) => {
    setError(null);
    setDraft({
      id: u.id,
      name: u.name,
      role: u.role,
      active: u.active,
      pin: '',
      pinConfirm: '',
      allowedTabs: [...u.allowedTabs],
      actions: { ...u.actions },
    });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setError(null);
    const name = draft.name.trim();
    if (!name) return setError('Kullanıcı adını yazın.');
    if (nameTaken(name, draft.id)) return setError('Bu adla başka bir kullanıcı var.');
    const isNew = draft.id === null;
    if (isNew || draft.pin) {
      const pinError = validatePin(draft.pin);
      if (pinError) return setError(pinError);
      if (draft.pin !== draft.pinConfirm) return setError('PIN kodları eşleşmiyor.');
    }
    const existing = draft.id ? users.find((u) => u.id === draft.id) : undefined;
    if (existing) {
      const losesOwner = existing.role === 'owner' && existing.active && (draft.role !== 'owner' || !draft.active);
      if (losesOwner && activeOwnerCount <= 1) return setError('En az bir aktif sahip kalmalıdır.');
      if (existing.id === currentUser?.id && (!draft.active || draft.role !== 'owner')) {
        return setError('Kendi hesabınızı pasif yapamaz veya çalışana çeviremezsiniz.');
      }
    }
    if (draft.role === 'staff' && draft.allowedTabs.length === 0) return setError('Çalışana en az bir ekran verin.');

    try {
      setSaving(true);
      const pin = draft.pin ? await hashPin(draft.pin) : existing?.pin;
      if (!pin) return setError('PIN belirlenmelidir.');
      const saved: StaffUser = {
        id: existing?.id || newUserId(),
        name,
        role: draft.role,
        pin,
        active: draft.active,
        allowedTabs: draft.allowedTabs,
        actions: draft.actions,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      const next = existing ? users.map((u) => (u.id === existing.id ? saved : u)) : [...users, saved];
      const ok = await persist(next, existing ? `${name} güncellendi.` : `${name} eklendi.`);
      if (ok) setDraft(null);
    } catch (err) {
      logError(toErr(err), 'UsersSettings.handleSaveDraft');
      setError('Kullanıcı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: StaffUser) => {
    setError(null);
    if (u.id === currentUser?.id) return setError('Kendi hesabınızı silemezsiniz.');
    if (u.role === 'owner' && u.active && activeOwnerCount <= 1) return setError('En az bir aktif sahip kalmalıdır.');
    try {
      const ok = await confirmDialog({
        title: 'Kullanıcıyı sil',
        message: `${u.name} silinsin mi? Bu kişi artık giriş yapamaz. Geçmiş kayıtlar silinmez.`,
        confirmText: 'Sil',
        danger: true,
      });
      if (!ok) return;
      const done = await persist(users.filter((x) => x.id !== u.id), `${u.name} silindi.`);
      if (done && draft?.id === u.id) setDraft(null);
    } catch (err) {
      logError(toErr(err), 'UsersSettings.handleDelete');
    }
  };

  const handleToggleActive = async (u: StaffUser) => {
    setError(null);
    if (u.active) {
      if (u.id === currentUser?.id) return setError('Kendi hesabınızı pasif yapamazsınız.');
      if (u.role === 'owner' && activeOwnerCount <= 1) return setError('En az bir aktif sahip kalmalıdır.');
    }
    await persist(
      users.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)),
      u.active ? `${u.name} pasif yapıldı, giriş yapamaz.` : `${u.name} tekrar aktif.`,
    );
  };

  const handleDisableSystem = async () => {
    try {
      const ok = await confirmDialog({
        title: 'Kullanıcı sistemini kapat',
        message: 'Tüm kullanıcılar ve PIN kodları silinir; uygulama herkes için tek hesap olarak açılır. Emin misiniz?',
        confirmText: 'Sistemi kapat',
        danger: true,
      });
      if (!ok) return;
      const done = await persist([], 'Kullanıcı sistemi kapatıldı.');
      if (done) staff.logout();
    } catch (err) {
      logError(toErr(err), 'UsersSettings.handleDisableSystem');
    }
  };

  // ---------------- İlk kurulum ekranı ----------------
  if (!systemActive) {
    return (
      <div id="users-settings" className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-sm max-w-2xl mx-auto animate-fade-in my-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4">
          <Users size={28} />
        </div>
        <h3 className="text-lg font-extrabold text-white uppercase tracking-wider text-center">Kullanıcılar ve Yetkiler</h3>
        <p className="text-sm text-white/60 mt-2 text-center leading-relaxed">
          Her çalışan kendi adı ve PIN koduyla girer. Hangi ekranları görüp hangi işlemleri yapabileceğini tek tek siz belirlersiniz.
          {` ${IDLE_LOGOUT_MINUTES} dakika işlem yapılmazsa oturum kendiliğinden kapanır.`}
        </p>
        <ul className="my-6 space-y-2 text-xs text-white/70 bg-white/5 border border-white/5 rounded-2xl p-4">
          <li className="flex gap-2"><Check size={14} className="text-teal-400 shrink-0 mt-0.5" /> Önce kendi sahip hesabınızı oluşturun; sahip tüm ekranlara erişir.</li>
          <li className="flex gap-2"><Check size={14} className="text-teal-400 shrink-0 mt-0.5" /> Ardından çalışanları ekleyip ekran ve işlem yetkilerini verin.</li>
          <li className="flex gap-2"><Check size={14} className="text-teal-400 shrink-0 mt-0.5" /> Eski tek PIN'li yönetici sistemi bunun yerini alır; eski personel ayarlarınız yeni çalışanlar için varsayılan olur.</li>
        </ul>
        <div className="max-w-sm mx-auto space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">Sahip adı</label>
            <input id="owner-name-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={textInputClass} placeholder="Adınız" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">PIN (4-6 hane)</label>
              <input id="owner-pin-input" type="password" inputMode="numeric" maxLength={MAX_PIN_LENGTH} value={ownerPin} onChange={(e) => setOwnerPin(e.target.value.replace(/[^0-9]/g, ''))} className={pinInputClass} placeholder="••••" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">PIN tekrar</label>
              <input id="owner-pin-confirm" type="password" inputMode="numeric" maxLength={MAX_PIN_LENGTH} value={ownerPinConfirm} onChange={(e) => setOwnerPinConfirm(e.target.value.replace(/[^0-9]/g, ''))} className={pinInputClass} placeholder="••••" />
            </div>
          </div>
          {error && <p className="text-xs font-bold text-rose-400 text-center">{error}</p>}
          <button
            id="btn-create-owner"
            type="button"
            disabled={saving}
            onClick={handleCreateOwner}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
          >
            <ShieldCheck size={15} /> {saving ? 'Kaydediliyor…' : 'Sahip hesabını oluştur ve aç'}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Kullanıcı listesi ----------------
  return (
    <div id="users-settings" className="space-y-4 animate-fade-in">
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2"><Users size={16} className="text-teal-400" /> Kullanıcılar</h3>
          <p className="text-xs text-white/50 mt-1">
            Her kişi kendi PIN'iyle girer. {IDLE_LOGOUT_MINUTES} dakika işlem yapılmazsa oturum kapanır. Çalışanın günlük işlerini yalnızca sahipler görür.
          </p>
        </div>
        <button
          id="btn-add-user"
          type="button"
          onClick={openNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
        >
          <Plus size={15} /> Kullanıcı ekle
        </button>
      </div>

      {error && !draft && <p className="text-xs font-bold text-rose-400">{error}</p>}

      <div className="grid gap-2">
        {sortedUsers.map((u) => (
          <div
            key={u.id}
            id={`user-row-${u.id}`}
            className={`flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 ${u.active ? '' : 'opacity-55'}`}
          >
            <span className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center font-bold shrink-0">
              {u.name.charAt(0).toLocaleUpperCase('tr-TR')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                {u.name}
                {u.id === currentUser?.id && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300">Siz</span>}
              </div>
              <div className="text-[11px] text-white/50 flex flex-wrap gap-x-2">
                <span className="inline-flex items-center gap-1">
                  {u.role === 'owner' ? <ShieldCheck size={12} className="text-amber-300" /> : <UserIcon size={12} />}
                  {u.role === 'owner' ? 'Sahip · tüm yetkiler' : `Çalışan · ${u.allowedTabs.length} ekran, ${STAFF_ACTIONS.filter((a) => u.actions[a.key]).length} işlem yetkisi`}
                </span>
                {!u.active && <span className="text-rose-300">Pasif</span>}
              </div>
            </div>
            <button type="button" title={u.active ? 'Pasif yap' : 'Aktif yap'} onClick={() => handleToggleActive(u)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer" aria-label={u.active ? 'Pasif yap' : 'Aktif yap'}>
              <Power size={16} className={u.active ? 'text-emerald-400' : 'text-white/40'} />
            </button>
            <button type="button" id={`btn-edit-user-${u.id}`} title="Düzenle" onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-white/10 text-white/70 cursor-pointer" aria-label="Düzenle">
              <Pencil size={16} />
            </button>
            <button type="button" title="Sil" onClick={() => handleDelete(u)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300 cursor-pointer" aria-label="Sil">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button type="button" onClick={handleDisableSystem} className="text-[11px] font-bold text-rose-300/80 hover:text-rose-300 cursor-pointer">
          Kullanıcı sistemini kapat
        </button>
      </div>

      {draft && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div id="user-editor" className="bg-[#18181b] border border-white/10 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{draft.id ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı'}</h3>
              <button type="button" onClick={() => setDraft(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 cursor-pointer" aria-label="Kapat"><X size={18} /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">Ad</label>
                <input id="user-name-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={textInputClass} placeholder="Örn. Ahmet" autoFocus />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['staff', 'owner'] as StaffRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      id={`user-role-${r}`}
                      onClick={() => setDraft({ ...draft, role: r })}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition ${draft.role === r ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
                    >
                      {r === 'owner' ? 'Sahip' : 'Çalışan'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block truncate">{draft.id ? 'Yeni PIN (boş bırakılırsa değişmez)' : 'PIN (4-6 hane)'}</label>
                <input id="user-pin-input" type="password" inputMode="numeric" maxLength={MAX_PIN_LENGTH} value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value.replace(/[^0-9]/g, '') })} className={pinInputClass} placeholder="••••" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider block">PIN tekrar</label>
                <input id="user-pin-confirm" type="password" inputMode="numeric" maxLength={MAX_PIN_LENGTH} value={draft.pinConfirm} onChange={(e) => setDraft({ ...draft, pinConfirm: e.target.value.replace(/[^0-9]/g, '') })} className={pinInputClass} placeholder="••••" />
              </div>
            </div>

            {draft.role === 'owner' ? (
              <p className="mt-4 text-xs text-white/60 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                Sahip tüm ekranlara ve işlemlere erişir, kullanıcıları yönetir ve çalışan takibini görür. Sahip PIN'i çalışanların onay isteyen işlemlerinde de kullanılır.
              </p>
            ) : (
              <>
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-extrabold text-white/80 uppercase tracking-wider">Görebileceği ekranlar</h4>
                    <div className="flex gap-2 text-[11px]">
                      <button type="button" onClick={() => setDraft({ ...draft, allowedTabs: [...ALL_STAFF_TAB_IDS] })} className="text-teal-300 cursor-pointer">Tümü</button>
                      <button type="button" onClick={() => setDraft({ ...draft, allowedTabs: [] })} className="text-white/50 cursor-pointer">Hiçbiri</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {STAFF_TAB_OPTIONS.map((t) => {
                      const on = draft.allowedTabs.includes(t.id);
                      return (
                        <label key={t.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition ${on ? 'bg-teal-500/10 border-teal-500/30 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          <input
                            type="checkbox"
                            className="accent-teal-500"
                            data-tab={t.id}
                            checked={on}
                            onChange={() => setDraft({ ...draft, allowedTabs: on ? draft.allowedTabs.filter((x) => x !== t.id) : [...draft.allowedTabs, t.id] })}
                          />
                          {t.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5">
                  <h4 className="text-[11px] font-extrabold text-white/80 uppercase tracking-wider mb-2">Yapabileceği işlemler</h4>
                  <p className="text-[11px] text-white/45 mb-2">Kapalı işlemler için sahip PIN'i istenir.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {STAFF_ACTIONS.map((a) => {
                      const on = !!draft.actions[a.key];
                      return (
                        <label key={a.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition ${on ? 'bg-teal-500/10 border-teal-500/30 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          <input
                            type="checkbox"
                            className="accent-teal-500"
                            data-action={a.key}
                            checked={on}
                            onChange={() => setDraft({ ...draft, actions: { ...draft.actions, [a.key]: !on } })}
                          />
                          {a.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <label className="mt-4 flex items-center gap-2 text-xs text-white/70 cursor-pointer">
              <input type="checkbox" className="accent-teal-500" checked={draft.active} onChange={() => setDraft({ ...draft, active: !draft.active })} />
              Aktif (giriş yapabilir)
            </label>

            {error && <p className="mt-3 text-xs font-bold text-rose-400">{error}</p>}

            <div className="mt-5 flex gap-2 justify-end">
              <button type="button" onClick={() => setDraft(null)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider cursor-pointer">Vazgeç</button>
              <button
                id="btn-save-user"
                type="button"
                disabled={saving}
                onClick={handleSaveDraft}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer"
              >
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
