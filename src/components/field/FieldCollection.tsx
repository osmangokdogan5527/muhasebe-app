import React, { useEffect, useState } from 'react';
import { User, ChevronRight, Wallet, Landmark, CreditCard, CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Cari, BankAccount, Transaction } from '../../types';
import { createTransaction } from '../../firebase';
import { getTodayISO } from '../../utils/dateUtils';
import { roundMoney } from '../../utils/invoiceMath';
import { logError } from '../../utils/errorLogger';
import { Card, SectionTitle, PrimaryButton, SegmentedControl, CariPickerSheet, BalanceText, balanceLabel, formatMoney, parseAmount } from './fieldUi';

interface FieldCollectionProps {
  cariler: Cari[];
  bankAccounts: BankAccount[];
  presetCari: Cari | null;
  onPresetConsumed: () => void;
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void;
}

type ReceiptType = 'collection' | 'payment';
type AccountType = 'cash' | 'bank' | 'pos';

const ACCOUNT_TYPE_MAP: Record<AccountType, BankAccount['type']> = { cash: 'kasa', bank: 'banka', pos: 'pos' };

export const FieldCollection: React.FC<FieldCollectionProps> = ({ cariler, bankAccounts, presetCari, onPresetConsumed, showToast }) => {
  const [type, setType] = useState<ReceiptType>('collection');
  const [cariId, setCariId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [account, setAccount] = useState<AccountType>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ text: string } | null>(null);

  // Güncel bakiye için cari her zaman canlı listeden okunur
  const cari = cariler.find(c => c.id === cariId) || null;

  useEffect(() => {
    if (presetCari) {
      setCariId(presetCari.id);
      setType((presetCari.balance || 0) < 0 ? 'payment' : 'collection');
      onPresetConsumed();
    }
  }, [presetCari, onPresetConsumed]);

  const accountsOfType = bankAccounts.filter(a => a.type === ACCOUNT_TYPE_MAP[account]);
  useEffect(() => {
    if (bankAccountId && !accountsOfType.some(a => a.id === bankAccountId)) setBankAccountId('');
  }, [account, bankAccountId, accountsOfType]);

  const amount = roundMoney(parseAmount(amountText));
  const currentBalance = cari?.balance || 0;
  const newBalance = currentBalance + (type === 'payment' ? amount : -amount);

  const handleSave = async () => {
    if (!cari) { setIsPickerOpen(true); return; }
    if (!(amount > 0)) { showToast('Lütfen sıfırdan büyük bir tutar girin.', 'error'); return; }
    setIsSaving(true);
    try {
      const islem: Omit<Transaction, 'id'> = {
        type,
        cariId: cari.id,
        cariName: cari.name,
        date: getTodayISO(),
        amount,
        account,
        bankAccountId: bankAccountId || undefined,
        description: description.trim() || `${type === 'collection' ? 'Tahsilat' : 'Ödeme'} (Saha)`,
        createdAt: new Date().toISOString(),
        currency: cari.currency || 'TRY',
      };
      await createTransaction(islem);
      const text = `${cari.name} — ${formatMoney(amount, cari.currency)} ${type === 'collection' ? 'tahsil edildi' : 'ödendi'}`;
      setLastSaved({ text });
      showToast(text, 'success');
      setAmountText('');
      setDescription('');
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'FieldCollection.handleSave');
      showToast('Kayıt yapılamadı: ' + (err?.message || err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SegmentedControl<ReceiptType>
        value={type}
        onChange={setType}
        options={[
          { value: 'collection', label: 'Tahsilat (Para Girişi)', icon: <ArrowDownLeft size={15} /> },
          { value: 'payment', label: 'Ödeme (Para Çıkışı)', icon: <ArrowUpRight size={15} /> },
        ]}
      />

      <div>
        <SectionTitle>Cari</SectionTitle>
        <Card onClick={() => setIsPickerOpen(true)} className="!p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <User size={18} className="text-slate-400 shrink-0" />
            {cari ? (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{cari.name}</div>
                <div className="text-[11px] text-slate-500">{balanceLabel(currentBalance)}: <BalanceText value={currentBalance} currency={cari.currency} /></div>
              </div>
            ) : (
              <span className="text-sm text-slate-400">Cari seçmek için dokunun</span>
            )}
          </div>
          <ChevronRight size={18} className="text-slate-500 shrink-0" />
        </Card>
      </div>

      <div>
        <SectionTitle>Tutar</SectionTitle>
        <div className="flex items-center gap-2 px-4 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[color:var(--accent-500,#0ea5e9)]">
          <input
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ''))}
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 text-2xl font-bold text-white placeholder-slate-600 outline-none min-w-0 tabular-nums"
          />
          <span className="text-slate-500 font-bold">{cari?.currency || 'TRY'}</span>
        </div>
      </div>

      <div>
        <SectionTitle>Hesap</SectionTitle>
        <SegmentedControl<AccountType>
          value={account}
          onChange={setAccount}
          options={[
            { value: 'cash', label: 'Kasa', icon: <Wallet size={15} /> },
            { value: 'bank', label: 'Banka', icon: <Landmark size={15} /> },
            { value: 'pos', label: 'POS', icon: <CreditCard size={15} /> },
          ]}
        />
        {accountsOfType.length > 1 && (
          <select
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-3.5 py-3 text-sm text-white outline-none"
          >
            <option value="">Varsayılan hesap</option>
            {accountsOfType.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </select>
        )}
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Açıklama (isteğe bağlı)"
        className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
      />

      {cari && amount > 0 && (
        <Card className="!p-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">İşlem sonrası bakiye</span>
          <BalanceText value={newBalance} currency={cari.currency} />
        </Card>
      )}

      <PrimaryButton type="button" onClick={handleSave} disabled={isSaving || !cari || !(amount > 0)}>
        {isSaving ? 'Kaydediliyor...' : type === 'collection' ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}
      </PrimaryButton>

      {lastSaved && (
        <Card className="!border-emerald-500/30 !bg-emerald-500/10 flex items-center gap-3 !p-3">
          <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
          <span className="text-sm text-white">{lastSaved.text}</span>
        </Card>
      )}

      <CariPickerSheet isOpen={isPickerOpen} cariler={cariler} onSelect={(c) => setCariId(c ? c.id : null)} onClose={() => setIsPickerOpen(false)} />
    </div>
  );
};
