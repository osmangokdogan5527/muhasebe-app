/**
 * Hesabı belli olmayan eski hareketler: eski sürümde "Banka / Kasa / POS" seçilip hangi hesap
 * olduğu belirtilmeden kaydedilenler. Tür başına toplu ya da satır satır hesap atanır.
 */
import React, { useMemo, useState } from 'react';
import { ListChecks, Loader2 } from 'lucide-react';
import { BankAccount } from '../../types';
import { assignAccountToRecords } from '../../firebase';
import { logError } from '../../utils/errorLogger';
import { CashKind, TYPE_OF_KIND, accountDisplayName, primaryAccountId, selectableAccounts } from '../../utils/cashAccounts';
import { CashMovement } from '../../utils/cashMovements';
import { KasaModal, fieldInput, formatMoney, ghostBtn, primaryBtn } from './kasaUi';

const KIND_TITLE: Record<CashKind, string> = { cash: 'Kasa', bank: 'Banka', pos: 'POS' };
const ROW_LIMIT = 200;

interface AssignAccountsModalProps {
  accounts: BankAccount[];
  items: CashMovement[];
  onClose: () => void;
  onDone: (message: string) => void;
}

export const AssignAccountsModal: React.FC<AssignAccountsModalProps> = ({ accounts, items, onClose, onDone }) => {
  const kinds = useMemo(() => (['bank', 'pos', 'cash'] as CashKind[]).filter((k) => items.some((m) => m.kind === k)), [items]);
  const [groupTarget, setGroupTarget] = useState<Record<CashKind, string>>(() => ({
    cash: primaryAccountId(accounts, 'cash'),
    bank: primaryAccountId(accounts, 'bank'),
    pos: primaryAccountId(accounts, 'pos'),
  }));
  const [rowTarget, setRowTarget] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetFor = (m: CashMovement) => rowTarget[m.id] || groupTarget[m.kind];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const byAccount = new Map<string, { kind: 'islem' | 'gider' | 'personel'; id: string }[]>();
      items.forEach((m) => {
        if (m.source.kind === 'hesap') return;
        const target = targetFor(m);
        if (!target) return;
        const list = byAccount.get(target) || [];
        list.push({ kind: m.source.kind, id: m.source.id });
        byAccount.set(target, list);
      });
      let total = 0;
      for (const [accountId, list] of byAccount) total += await assignAccountToRecords(list, accountId);
      onDone(`${total} hareketin hesabı belirlendi.`);
      onClose();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AssignAccountsModal.save');
      setError(`Kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KasaModal
      id="assign-accounts-modal"
      title="Hesabı belli olmayan hareketler"
      subtitle="Eski sürümde hesap seçilmeden kaydedildikleri için merkez hesapta görünüyorlar. Doğru hesabı seçin."
      icon={<ListChecks size={20} />}
      onClose={onClose}
      wide
      footer={<>
        <button type="button" className={ghostBtn} onClick={onClose}>Sonra</button>
        <button id="assign-save" type="button" className={primaryBtn} disabled={saving} onClick={handleSave}>
          {saving && <Loader2 size={14} className="animate-spin" />} Hesapları Kaydet
        </button>
      </>}
    >
      <div className="space-y-5">
        {kinds.map((kind) => {
          const rows = items.filter((m) => m.kind === kind);
          const options = selectableAccounts(accounts, TYPE_OF_KIND[kind]);
          return (
            <section key={kind} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-extrabold text-white">{KIND_TITLE[kind]} · {rows.length} hareket</h4>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  Hepsini şuna:
                  <select data-assign-group={kind} className={`${fieldInput} py-2 w-auto`} value={groupTarget[kind]} onChange={(e) => setGroupTarget({ ...groupTarget, [kind]: e.target.value })}>
                    {options.map((a) => <option key={a.id} value={a.id}>{accountDisplayName(a)}</option>)}
                  </select>
                </label>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {rows.slice(0, ROW_LIMIT).map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{m.title} <span className="font-normal text-white/50">· {m.category}</span></div>
                      <div className="text-[11px] text-white/45">{new Date(`${m.date}T00:00:00`).toLocaleDateString('tr-TR')}{m.description ? ` · ${m.description}` : ''}</div>
                    </div>
                    <span className={`text-xs font-extrabold tabular-nums ${m.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>{m.direction === 'in' ? '+' : '−'}{formatMoney(m.amount, m.currency)}</span>
                    <select className={`${fieldInput} py-1.5 text-xs sm:w-48`} value={targetFor(m)} onChange={(e) => setRowTarget({ ...rowTarget, [m.id]: e.target.value })}>
                      {options.map((a) => <option key={a.id} value={a.id}>{accountDisplayName(a)}</option>)}
                    </select>
                  </div>
                ))}
                {rows.length > ROW_LIMIT && <p className="pt-2 text-[11px] text-white/50">İlk {ROW_LIMIT} hareket gösteriliyor; kalanlar "Hepsini şuna" seçimine göre atanır.</p>}
              </div>
            </section>
          );
        })}
        {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
      </div>
    </KasaModal>
  );
};
