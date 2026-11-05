/**
 * Para transferi: kasadan bankaya, bankadan kasaya, hesaplar arası ve POS'u bankaya aktarma.
 *
 * POS aktarımı: POS bakiyesi (varsayılan "tümü") bankaya geçer; komisyon %, ₺ ya da "bankaya
 * geçen tutar" olarak girilir, diğerleri hesaplanır. Kayıt: POS'tan çıkan tutar bankaya girer,
 * komisyon bankadan gider olarak düşülür (100.000 → banka net +98.000, 2.000 komisyon gideri).
 * POS'un bankası ve son komisyon oranı hatırlanır.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowRightLeft, Loader2 } from 'lucide-react';
import { BankAccount } from '../../types';
import { recordCashTransfer, saveBankAccount, undoCashTransfer } from '../../firebase';
import { getTodayISO } from '../../utils/dateUtils';
import { logError } from '../../utils/errorLogger';
import { convertWithRates } from '../../utils/currencyUtils';
import { TCMBRatesResult } from '../../utils/tcmbService';
import { AccountType, KIND_OF_TYPE, accountDisplayName, primaryAccountId, roundMoney, selectableAccounts } from '../../utils/cashAccounts';
import { AccountOption, AmountField, KasaModal, amountToInput, fieldInput, fieldLabel, formatMoney, ghostBtn, parseAmountInput, primaryBtn } from './kasaUi';
import type { UndoAction } from './MoneyMoveModal';

export type TransferMode = 'deposit' | 'withdraw' | 'between' | 'pos';

const MODES: { id: TransferMode; label: string; from: AccountType[]; to: AccountType[] }[] = [
  { id: 'deposit', label: 'Kasadan bankaya', from: ['kasa'], to: ['banka'] },
  { id: 'withdraw', label: 'Bankadan kasaya', from: ['banka'], to: ['kasa'] },
  { id: 'between', label: 'Hesaplar arası', from: ['kasa', 'banka', 'pos'], to: ['kasa', 'banka'] },
  { id: 'pos', label: "POS'u bankaya", from: ['pos'], to: ['banka'] },
];

type FeeMode = 'percent' | 'amount' | 'net';

interface TransferModalProps {
  accounts: BankAccount[];
  balances: Record<string, number>;
  fxRates: TCMBRatesResult;
  initialMode?: TransferMode;
  initialFromId?: string;
  onClose: () => void;
  onDone: (message: string, undo: UndoAction) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ accounts, balances, fxRates, initialMode = 'between', initialFromId, onClose, onDone }) => {
  const usable = useMemo(() => selectableAccounts(accounts), [accounts]);
  const [mode, setMode] = useState<TransferMode>(initialMode);
  const modeDef = MODES.find((m) => m.id === mode)!;
  const fromOptions = usable.filter((a) => modeDef.from.includes(a.type));
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const toOptions = usable.filter((a) => modeDef.to.includes(a.type) && a.id !== fromId);
  const from = usable.find((a) => a.id === fromId);
  const to = usable.find((a) => a.id === toId);

  const [amountText, setAmountText] = useState('');
  const [feeMode, setFeeMode] = useState<FeeMode>('percent');
  const [feeText, setFeeText] = useState('');
  const [rateText, setRateText] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromBalance = from ? balances[from.id] || 0 : 0;

  // Mod değişince (ve ilk açılışta) hesaplar ve varsayılanlar hazırlanır
  useEffect(() => {
    const fromList = usable.filter((a) => modeDef.from.includes(a.type));
    let nextFrom = initialFromId && fromList.some((a) => a.id === initialFromId) ? initialFromId : '';
    if (!nextFrom) {
      if (mode === 'pos') nextFrom = (fromList.find((a) => (balances[a.id] || 0) > 0) || fromList[0])?.id || '';
      else if (mode === 'deposit') nextFrom = fromList.find((a) => a.id === primaryAccountId(accounts, 'cash'))?.id || fromList[0]?.id || '';
      else nextFrom = fromList.find((a) => a.id === primaryAccountId(accounts, 'bank'))?.id || fromList[0]?.id || '';
    }
    setFromId(nextFrom);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Gönderen değişince alıcı ve (POS'ta) tutar / komisyon önerilir
  useEffect(() => {
    if (!from) return;
    const list = usable.filter((a) => modeDef.to.includes(a.type) && a.id !== from.id);
    let nextTo = list.some((a) => a.id === toId) ? toId : '';
    if (mode === 'pos') {
      nextTo = list.find((a) => a.id === from.linkedBankAccountId)?.id || list.find((a) => a.id === primaryAccountId(accounts, 'bank'))?.id || list[0]?.id || '';
      setAmountText(fromBalance > 0 ? amountToInput(fromBalance) : '');
      setFeeMode('percent');
      setFeeText(from.lastCommissionRate ? amountToInput(from.lastCommissionRate) : '');
    } else if (!nextTo) {
      const preferred = mode === 'withdraw' ? primaryAccountId(accounts, 'cash') : primaryAccountId(accounts, 'bank');
      // Hesaplar arasında önce başka bir banka hesabı önerilir (bankadan bankaya en sık işlem)
      nextTo = list.find((a) => a.id === preferred)?.id
        || (mode === 'between' ? list.find((a) => a.type === 'banka')?.id : undefined)
        || list[0]?.id || '';
    }
    setToId(nextTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId, mode]);

  const crossCurrency = !!(from && to && from.currency !== to.currency);
  useEffect(() => {
    if (!crossCurrency || !from || !to) { setRateText(''); return; }
    const rate = convertWithRates(1, from.currency, to.currency, fxRates);
    setRateText(rate > 0 ? String(Math.round(rate * 10000) / 10000).replace('.', ',') : '');
  }, [crossCurrency, from?.currency, to?.currency, fxRates]); // eslint-disable-line react-hooks/exhaustive-deps

  const amountOut = parseAmountInput(amountText);
  const rate = crossCurrency ? parseAmountInput(rateText) : 1;
  const grossIn = roundMoney(amountOut * (rate || 0));

  // Komisyon / masraf
  const feeValue = parseAmountInput(feeText);
  let fee = 0;
  let net = grossIn;
  if (mode === 'pos') {
    if (feeMode === 'percent') fee = roundMoney(grossIn * feeValue / 100);
    else if (feeMode === 'amount') fee = roundMoney(feeValue);
    else fee = feeValue > 0 ? roundMoney(grossIn - feeValue) : 0;
    net = roundMoney(grossIn - fee);
  } else {
    fee = roundMoney(feeValue);
  }
  const feeRate = grossIn > 0 ? roundMoney((fee / grossIn) * 100) : 0;

  const swap = () => {
    if (!from || !to || mode === 'pos') return;
    if (mode === 'deposit') setMode('withdraw');
    else if (mode === 'withdraw') setMode('deposit');
    setFromId(to.id);
    setToId(from.id);
  };

  const validate = (): string | null => {
    if (!from || !to) return 'Gönderen ve alan hesabı seçin.';
    if (!(amountOut > 0)) return 'Tutarı yazın.';
    if (crossCurrency && !(rate > 0)) return 'Kuru yazın.';
    if (mode === 'pos' && crossCurrency) return 'POS ve banka hesabı aynı para biriminde olmalıdır.';
    if (fee < 0 || (mode === 'pos' && fee >= grossIn)) return 'Komisyon tutarı geçersiz.';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    if (!from || !to) return;
    setSaving(true);
    setError(null);
    try {
      const fromName = accountDisplayName(from);
      const toName = accountDisplayName(to);
      const description = note.trim() || (mode === 'pos' ? `POS aktarımı: ${fromName} → ${toName}` : `${fromName} → ${toName}`);
      const feeEntry = fee > 0
        ? (mode === 'pos'
          ? { accountId: to.id, kind: KIND_OF_TYPE[to.type], amount: fee, currency: to.currency, title: `POS komisyonu · ${fromName}`, category: 'Banka/POS Komisyonu' as const }
          : { accountId: from.id, kind: KIND_OF_TYPE[from.type], amount: fee, currency: from.currency, title: `Havale/EFT masrafı · ${fromName}`, category: 'Banka/POS Komisyonu' as const })
        : undefined;
      const result = await recordCashTransfer({ date, description, fromAccountId: from.id, amountOut, toAccountId: to.id, amountIn: grossIn, fee: feeEntry });
      if (mode === 'pos') {
        // POS'un bankası ve oranı bir dahaki aktarım için hatırlanır (başarısızlık aktarımı bozmaz)
        saveBankAccount({ ...from, linkedBankAccountId: to.id, lastCommissionRate: feeRate }, from.id).catch((err) => logError(err instanceof Error ? err : new Error(String(err)), 'TransferModal.rememberPos'));
      }
      const message = mode === 'pos'
        ? `${fromName} → ${toName}: bankaya ${formatMoney(net, to.currency)} geçti${fee > 0 ? `, komisyon ${formatMoney(fee, to.currency)}` : ''}.`
        : `${fromName} → ${toName}: ${formatMoney(amountOut, from.currency)} aktarıldı.`;
      onDone(message, { label: 'Transfer geri alındı.', run: () => undoCashTransfer(result) });
      onClose();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'TransferModal.save');
      setError(`Kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const toBalance = to ? balances[to.id] || 0 : 0;
  const afterFrom = roundMoney(fromBalance - amountOut - (mode !== 'pos' ? fee : 0));
  const afterTo = roundMoney(toBalance + (mode === 'pos' ? net : grossIn));

  return (
    <KasaModal
      id="transfer-modal"
      title="Para Transferi"
      subtitle="Hesaplar arasında para aktarın."
      icon={<ArrowRightLeft size={20} />}
      onClose={onClose}
      wide
      footer={<>
        <button type="button" className={ghostBtn} onClick={onClose}>Vazgeç</button>
        <button id="transfer-save" type="button" className={primaryBtn} disabled={saving} onClick={handleSave}>
          {saving && <Loader2 size={14} className="animate-spin" />} {mode === 'pos' ? 'Aktar' : 'Transfer Et'}
        </button>
      </>}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist" aria-label="Transfer türü">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            data-mode={m.id}
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold border cursor-pointer transition ${mode === m.id ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-start">
        <div>
          <span className={fieldLabel}>Kimden</span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {fromOptions.length === 0 && <p className="text-xs text-white/50">Bu türde hesap yok.</p>}
            {fromOptions.map((a) => <AccountOption key={a.id} account={a} accounts={accounts} balance={balances[a.id] || 0} selected={a.id === fromId} onSelect={() => setFromId(a.id)} compact />)}
          </div>
        </div>
        <button
          type="button"
          aria-label="Yönü çevir"
          title={mode === 'pos' ? '' : 'Yönü çevir'}
          disabled={mode === 'pos'}
          onClick={swap}
          className="self-center mx-auto mt-5 w-10 h-10 rounded-full border border-white/10 bg-white/5 text-teal-400 flex items-center justify-center cursor-pointer disabled:opacity-30"
        >
          <ArrowLeftRight size={18} />
        </button>
        <div>
          <span className={fieldLabel}>Kime</span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {toOptions.length === 0 && <p className="text-xs text-white/50">Bu türde hesap yok. Önce hesap ekleyin.</p>}
            {toOptions.map((a) => (
              <AccountOption
                key={a.id}
                account={a}
                accounts={accounts}
                balance={balances[a.id] || 0}
                selected={a.id === toId}
                onSelect={() => setToId(a.id)}
                hint={mode === 'pos' && from?.linkedBankAccountId === a.id ? "bu POS'un bankası" : undefined}
                compact
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AmountField
          id="transfer-amount"
          label={mode === 'pos' ? "POS'tan çıkan" : 'Tutar'}
          value={amountText}
          onChange={setAmountText}
          currency={from?.currency}
          right={from && fromBalance > 0 ? (
            <button type="button" id="transfer-all" onClick={() => setAmountText(amountToInput(fromBalance))} className="text-teal-400 normal-case tracking-normal font-bold cursor-pointer">Tümü ({formatMoney(fromBalance, from.currency)})</button>
          ) : undefined}
          hint={from && amountOut > fromBalance + 0.001 ? <span className="text-rose-400 font-bold">Bakiye yetersiz görünüyor.</span> : undefined}
        />
        {mode === 'pos' ? (
          <div>
            <span className={`${fieldLabel} flex items-center justify-between`}>
              <span>Komisyon</span>
              <span className="inline-flex rounded-lg bg-white/5 border border-white/10 p-0.5 normal-case tracking-normal">
                {([['percent', '%'], ['amount', '₺'], ['net', 'Bankaya geçen']] as [FeeMode, string][]).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    data-fee-mode={m}
                    onClick={() => {
                      // Mod değişince aynı komisyon yeni biçimde gösterilir
                      setFeeText(m === 'percent' ? amountToInput(feeRate) : m === 'amount' ? amountToInput(fee) : amountToInput(net));
                      setFeeMode(m);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${feeMode === m ? 'bg-teal-600 text-white' : 'text-white/60'}`}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </span>
            <span className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-teal-500">
              <span className="text-lg font-bold text-white/50">{feeMode === 'percent' ? '%' : '₺'}</span>
              <input
                id="transfer-fee"
                inputMode="decimal"
                value={feeText}
                onChange={(e) => setFeeText(e.target.value.replace(/[^0-9.,]/g, ''))}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xl font-extrabold text-white tabular-nums"
                style={{ boxShadow: 'none' }}
                placeholder={feeMode === 'percent' ? '2' : '0,00'}
              />
            </span>
            <span className="block mt-1 text-[11px] text-white/50">{from?.lastCommissionRate ? `Son kullanılan oran: %${String(from.lastCommissionRate).replace('.', ',')}` : 'Komisyon yoksa boş bırakın.'}</span>
          </div>
        ) : (
          <AmountField id="transfer-fee" label="Havale / EFT masrafı (isteğe bağlı)" value={feeText} onChange={setFeeText} currency={from?.currency} hint="Masraf gider olarak yazılır." />
        )}
      </div>

      {crossCurrency && mode !== 'pos' && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={fieldLabel}>Kur (1 {from?.currency} = ? {to?.currency})</span>
            <input id="transfer-rate" inputMode="decimal" className={fieldInput} value={rateText} onChange={(e) => setRateText(e.target.value.replace(/[^0-9.,]/g, ''))} />
          </label>
          <div>
            <span className={fieldLabel}>Hesaba geçen</span>
            <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-extrabold text-white tabular-nums">{formatMoney(grossIn, to?.currency)}</div>
          </div>
        </div>
      )}

      {from && to && amountOut > 0 && (
        <div id="transfer-summary" className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm space-y-2">
          <div className="flex justify-between gap-3"><span className="text-white/60">{accountDisplayName(from)} hesabından çıkan</span><b className="tabular-nums text-white">−{formatMoney(amountOut, from.currency)}</b></div>
          {fee > 0 && (
            <div className="flex justify-between gap-3"><span className="text-white/60">{mode === 'pos' ? 'Komisyon' : 'Masraf'} (gider olarak yazılır{mode === 'pos' ? `, %${String(feeRate).replace('.', ',')}` : ''})</span><b className="tabular-nums text-rose-400">{formatMoney(fee, mode === 'pos' ? to.currency : from.currency)}</b></div>
          )}
          <div className="flex justify-between gap-3 pt-2 border-t border-dashed border-white/15">
            <span className="font-bold text-white">{accountDisplayName(to)} hesabına geçen</span>
            <b id="transfer-net" className="tabular-nums text-emerald-400">+{formatMoney(mode === 'pos' ? net : grossIn, to.currency)}</b>
          </div>
          <p className="text-[11px] text-white/45">Sonra: {accountDisplayName(from)} {formatMoney(afterFrom, from.currency)} · {accountDisplayName(to)} {formatMoney(afterTo, to.currency)}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
        <label className="block">
          <span className={fieldLabel}>Tarih</span>
          <input type="date" className={fieldInput} value={date} onChange={(e) => setDate(e.target.value || getTodayISO())} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Açıklama (isteğe bağlı)</span>
          <input id="transfer-note" className={fieldInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'pos' ? 'Ör. POS gün sonu' : 'Ör. kira için'} />
        </label>
      </div>

      {error && <p id="transfer-error" className="mt-3 text-xs font-bold text-rose-400">{error}</p>}
    </KasaModal>
  );
};
