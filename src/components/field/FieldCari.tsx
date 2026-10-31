import React, { useMemo, useState } from 'react';
import { User, Phone, X, ArrowDownLeft, ShoppingCart, FileText } from 'lucide-react';
import { Cari, Transaction } from '../../types';
import { StatementPdfModal } from '../pdf/StatementPdfModal';
import { Card, SectionTitle, SegmentedControl, SearchBox, EmptyState, BalanceText, balanceLabel, formatMoney, norm } from './fieldUi';

interface FieldCariProps {
  cariler: Cari[];
  islemler: Transaction[];
  canCollect: boolean;
  canSell: boolean;
  onCollect: (cari: Cari) => void;
  onSell: (cari: Cari) => void;
}

type CariFilter = 'all' | 'receivable' | 'payable';

const TYPE_LABEL: Record<string, string> = {
  sale: 'Satış', purchase: 'Alış', sale_return: 'Satıştan İade', purchase_return: 'Alıştan İade', collection: 'Tahsilat', payment: 'Ödeme',
};

export const FieldCari: React.FC<FieldCariProps> = ({ cariler, islemler, canCollect, canSell, onCollect, onSell }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CariFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statementCari, setStatementCari] = useState<Cari | null>(null);

  const list = useMemo(() => {
    const q = norm(query);
    return cariler
      .filter(c => filter === 'all' || (filter === 'receivable' ? (c.balance || 0) > 0 : (c.balance || 0) < 0))
      .filter(c => !q || norm(c.name).includes(q) || norm(c.code).includes(q) || (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0))
      .slice(0, 60);
  }, [cariler, query, filter]);

  const selected = cariler.find(c => c.id === selectedId) || null;
  const movements = useMemo(() => {
    if (!selected) return [];
    return islemler
      .filter(t => t.cariId === selected.id)
      .sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')))
      .slice(0, 10);
  }, [islemler, selected]);

  const totals = useMemo(() => {
    let receivable = 0; let payable = 0;
    cariler.forEach(c => { const b = c.balance || 0; if ((c.currency || 'TRY') !== 'TRY') return; if (b > 0) receivable += b; else payable += -b; });
    return { receivable, payable };
  }, [cariler]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Card className="!p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Toplam Alacak</div>
          <div className="text-lg font-black text-emerald-400 tabular-nums">{formatMoney(totals.receivable)}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Toplam Borç</div>
          <div className="text-lg font-black text-rose-400 tabular-nums">{formatMoney(totals.payable)}</div>
        </Card>
      </div>

      <SearchBox value={query} onChange={setQuery} placeholder="Ad, kod veya telefon..." />
      <SegmentedControl<CariFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'receivable', label: 'Bize Borçlu' },
          { value: 'payable', label: 'Borçluyuz' },
        ]}
      />

      {selected && (
        <Card className="!p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-base font-bold text-white">{selected.name}</div>
              <div className="text-[11px] text-slate-500">{selected.code}</div>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} className="p-1 text-slate-500 cursor-pointer" aria-label="Kapat"><X size={18} /></button>
          </div>
          <div className="rounded-xl p-3 bg-black/30 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">{balanceLabel(selected.balance || 0)}</div>
            <BalanceText value={selected.balance || 0} currency={selected.currency} className="text-2xl" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {selected.phone ? (
              <a href={`tel:${selected.phone.replace(/[^0-9+]/g, '')}`} className="flex flex-col items-center gap-1 rounded-xl bg-black/30 border border-white/10 py-2.5 text-[11px] font-bold text-white">
                <Phone size={17} /> Ara
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1 rounded-xl bg-black/20 border border-white/5 py-2.5 text-[11px] text-slate-600"><Phone size={17} /> Tel yok</div>
            )}
            <button type="button" disabled={!canCollect} onClick={() => onCollect(selected)} className="flex flex-col items-center gap-1 rounded-xl bg-black/30 border border-white/10 py-2.5 text-[11px] font-bold text-white disabled:opacity-30 cursor-pointer">
              <ArrowDownLeft size={17} /> Tahsilat
            </button>
            <button type="button" disabled={!canSell} onClick={() => onSell(selected)} className="flex flex-col items-center gap-1 rounded-xl bg-black/30 border border-white/10 py-2.5 text-[11px] font-bold text-white disabled:opacity-30 cursor-pointer">
              <ShoppingCart size={17} /> Satış
            </button>
            <button type="button" onClick={() => setStatementCari(selected)} className="flex flex-col items-center gap-1 rounded-xl bg-black/30 border border-white/10 py-2.5 text-[11px] font-bold text-white cursor-pointer">
              <FileText size={17} /> Ekstre
            </button>
          </div>
          <div>
            <SectionTitle>Son Hareketler</SectionTitle>
            {movements.length === 0 ? (
              <p className="text-xs text-slate-500">Hareket yok.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {movements.map(t => {
                  const increases = t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return';
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="min-w-0">
                        <div className="text-white">{TYPE_LABEL[t.type] || t.type}{t.linkedInvoiceId ? ' (peşin)' : ''}</div>
                        <div className="text-[11px] text-slate-500">{t.date.split('-').reverse().join('.')}{t.invoiceNo ? ` • ${t.invoiceNo}` : ''}</div>
                      </div>
                      <span className={`font-bold tabular-nums ${increases ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {increases ? '+' : '−'}{formatMoney(t.amount, t.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {list.map(c => (
          <Card key={c.id} onClick={() => setSelectedId(c.id)} className="!p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0"><User size={17} /></div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                <div className="text-[11px] text-slate-500">{c.phone || c.code}</div>
              </div>
            </div>
            <BalanceText value={c.balance || 0} currency={c.currency} className="text-sm shrink-0" />
          </Card>
        ))}
        {list.length === 0 && <EmptyState icon={<User size={28} />} text="Cari bulunamadı." />}
      </div>
      {statementCari && (
        <StatementPdfModal cari={statementCari} islemler={islemler} onClose={() => setStatementCari(null)} />
      )}
    </div>
  );
};
