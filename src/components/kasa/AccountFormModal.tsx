/**
 * Hesap ekle / düzenle: tür, banka, kısa ad, IBAN, para birimi, açılış bakiyesi, POS'un bankası,
 * varsayılan (★) ve arşiv.
 */
import React, { useMemo, useState } from 'react';
import { Landmark, Loader2, Trash2 } from 'lucide-react';
import { BankAccount } from '../../types';
import { deleteBankAccount, saveBankAccount, setPrimaryBankAccount } from '../../firebase';
import { confirmDialog } from '../../utils/dialogs';
import { logError } from '../../utils/errorLogger';
import {
  AccountType, KNOWN_BANKS, TYPE_LABEL, accountDisplayName, formatIban, isCentralAccount, isPrimaryAccount, isValidIbanOrEmpty, normalizeIban, selectableAccounts,
} from '../../utils/cashAccounts';
import { AccountBadge, KasaModal, amountToInput, fieldInput, fieldLabel, ghostBtn, primaryBtn } from './kasaUi';
import { parseLocaleNumber } from '../../utils/excelParser';

interface AccountFormModalProps {
  accounts: BankAccount[];
  /** Düzenlenecek hesap; yoksa yeni */
  editing?: BankAccount | null;
  initialType?: AccountType;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({ accounts, editing, initialType = 'banka', onClose, onSaved }) => {
  const [type, setType] = useState<AccountType>(editing?.type || initialType);
  const [bankName, setBankName] = useState(editing?.bankName || '');
  const [name, setName] = useState(editing?.name || '');
  const [iban, setIban] = useState(editing?.iban ? formatIban(editing.iban) : '');
  const [currency, setCurrency] = useState<BankAccount['currency']>(editing?.currency || 'TRY');
  const [openingText, setOpeningText] = useState(editing ? amountToInput(editing.initialBalance || 0) : '');
  const [linkedBank, setLinkedBank] = useState(editing?.linkedBankAccountId || '');
  const [makePrimary, setMakePrimary] = useState(editing ? isPrimaryAccount(accounts, editing) : false);
  const [archived, setArchived] = useState(!!editing?.archived);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const central = editing ? isCentralAccount(editing.id) : false;
  const bankAccounts = useMemo(() => selectableAccounts(accounts, 'banka'), [accounts]);
  const preview = { type, name: name || TYPE_LABEL[type], bankName: type === 'kasa' ? '' : bankName };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName && !bankName.trim()) return setError('Hesaba bir ad verin.');
    if (type === 'banka' && !isValidIbanOrEmpty(iban)) return setError('IBAN hatalı (TR ile başlar, 26 karakterdir).');
    setSaving(true);
    setError(null);
    try {
      const data: Omit<BankAccount, 'id'> = {
        ...(editing || {}),
        name: trimmedName || bankName.trim(),
        type,
        currency,
        initialBalance: (() => { const n = parseLocaleNumber(openingText); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; })(),
        createdAt: editing?.createdAt || new Date().toISOString(),
        bankName: type === 'kasa' ? undefined : (bankName.trim() || undefined),
        iban: type === 'banka' ? (normalizeIban(iban) || undefined) : undefined,
        linkedBankAccountId: type === 'pos' ? (linkedBank || undefined) : undefined,
        archived: central ? false : archived,
        isPrimary: editing?.isPrimary,
      };
      delete (data as any).id;
      const id = await saveBankAccount(data, editing?.id);
      const wasPrimary = editing ? isPrimaryAccount(accounts, editing) : false;
      if (makePrimary && !archived && !wasPrimary) {
        await setPrimaryBankAccount(id, [...accounts.filter((a) => a.id !== id), { ...data, id }]);
      }
      onSaved(editing ? `${accountDisplayName({ ...data })} güncellendi.` : `${accountDisplayName({ ...data })} eklendi.`);
      onClose();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AccountFormModal.save');
      setError(`Kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || central) return;
    const ok = await confirmDialog({
      title: 'Hesabı sil',
      message: `${accountDisplayName(editing)} silinsin mi? Bu hesaba yazılmış hareketler başka hesaba geçmez, bakiyelerde görünmez olur. Kullanmıyorsanız silmek yerine "Arşivle" daha güvenlidir.`,
      confirmText: 'Sil',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBankAccount(editing.id);
      onSaved(`${accountDisplayName(editing)} silindi.`);
      onClose();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AccountFormModal.delete');
      setError(`Silinemedi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <KasaModal
      id="account-form-modal"
      title={editing ? 'Hesabı Düzenle' : 'Yeni Hesap'}
      subtitle="Kasa, banka hesabı ya da POS cihazı."
      icon={<Landmark size={20} />}
      onClose={onClose}
      footer={<>
        {editing && !central && (
          <button type="button" onClick={handleDelete} className="sm:mr-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold cursor-pointer">
            <Trash2 size={14} /> Sil
          </button>
        )}
        <button type="button" className={ghostBtn} onClick={onClose}>Vazgeç</button>
        <button id="account-form-save" type="button" className={primaryBtn} disabled={saving} onClick={handleSave}>
          {saving && <Loader2 size={14} className="animate-spin" />} Kaydet
        </button>
      </>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
          <AccountBadge account={preview} />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{accountDisplayName(preview)}</div>
            <div className="text-[11px] text-white/50">{TYPE_LABEL[type]} · {currency}{type === 'banka' && normalizeIban(iban).length >= 4 ? ` · •••• ${normalizeIban(iban).slice(-4)}` : ''}</div>
          </div>
        </div>

        {!central && (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Hesap türü">
            {(['kasa', 'banka', 'pos'] as AccountType[]).map((t) => (
              <button key={t} type="button" data-account-type={t} aria-pressed={type === t} onClick={() => setType(t)}
                className={`py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer transition ${type === t ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}>
                {t === 'kasa' ? 'Kasa' : t === 'banka' ? 'Banka hesabı' : 'POS cihazı'}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {type !== 'kasa' && (
            <label className="block">
              <span className={fieldLabel}>Banka</span>
              <input id="account-bank-name" list="known-banks" className={fieldInput} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ör. Ziraat Bankası" />
              <datalist id="known-banks">{KNOWN_BANKS.map((b) => <option key={b.name} value={b.name} />)}</datalist>
            </label>
          )}
          <label className={`block ${type === 'kasa' ? 'sm:col-span-2' : ''}`}>
            <span className={fieldLabel}>{type === 'kasa' ? 'Kasa adı' : 'Kısa ad'}</span>
            <input id="account-name" className={fieldInput} value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'kasa' ? 'Ör. Mağaza Kasası' : type === 'pos' ? 'Ör. Mağaza POS' : 'Ör. Ticari, Maaş'} />
          </label>
          {type === 'banka' && (
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>IBAN (isteğe bağlı)</span>
              <input id="account-iban" className={`${fieldInput} font-mono`} value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} onBlur={() => setIban(formatIban(iban))} placeholder="TR00 0000 0000 0000 0000 0000 00" />
            </label>
          )}
          <label className="block">
            <span className={fieldLabel}>Para birimi</span>
            <select className={fieldInput} value={currency} onChange={(e) => setCurrency(e.target.value as BankAccount['currency'])} disabled={central}>
              <option value="TRY">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="block">
            <span className={fieldLabel}>Açılış bakiyesi</span>
            <input id="account-opening" inputMode="decimal" className={fieldInput} value={openingText} onChange={(e) => setOpeningText(e.target.value.replace(/[^0-9.,-]/g, ''))} placeholder="0,00" />
          </label>
          {type === 'pos' && (
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>Parası hangi bankaya geçiyor?</span>
              <select id="account-linked-bank" className={fieldInput} value={linkedBank} onChange={(e) => setLinkedBank(e.target.value)}>
                <option value="">Seçilmedi (varsayılan banka)</option>
                {bankAccounts.map((b) => <option key={b.id} value={b.id}>{accountDisplayName(b)}</option>)}
              </select>
            </label>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 cursor-pointer">
          <input id="account-primary" type="checkbox" className="accent-teal-500 mt-0.5" checked={makePrimary} disabled={archived} onChange={() => setMakePrimary(!makePrimary)} />
          <span>
            <span className="block text-xs font-bold text-white">Varsayılan {TYPE_LABEL[type].toLocaleLowerCase('tr-TR')} hesabı ★</span>
            <span className="block text-[11px] text-white/50">Satış, tahsilat ve masraflarda hesap seçilmezse para bu hesaba yazılır.</span>
          </span>
        </label>

        {editing && !central && (
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 cursor-pointer">
            <input id="account-archived" type="checkbox" className="accent-teal-500 mt-0.5" checked={archived} onChange={() => { setArchived(!archived); if (!archived) setMakePrimary(false); }} />
            <span>
              <span className="block text-xs font-bold text-white">Arşivle (kullanılmıyor)</span>
              <span className="block text-[11px] text-white/50">Listede gizlenir ve seçim listelerinde çıkmaz; hareketleri ve bakiyesi silinmez.</span>
            </span>
          </label>
        )}

        {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
      </div>
    </KasaModal>
  );
};
