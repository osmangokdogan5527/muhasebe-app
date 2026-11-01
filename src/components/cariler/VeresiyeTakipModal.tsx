import React, { useMemo, useState } from 'react';
import { X, BookOpen, Search, MessageCircle, FileText, ExternalLink, AlertTriangle, Users, Clock, Wallet } from 'lucide-react';
import type { Cari, Transaction } from '../../types';
import { computeDebtAging, DebtAging } from '../../utils/debtAging';
import { creditLimitOf } from '../../utils/creditLimit';
import { whatsAppUrl, openExternalLink } from '../../utils/whatsapp';
import { formatDate } from '../../pdf/format';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { StatementPdfModal } from '../pdf/StatementPdfModal';
import { logError } from '../../utils/errorLogger';

interface VeresiyeTakipModalProps {
  cariler: Cari[];
  islemler: Transaction[];
  onClose: () => void;
  /** Cari kartını (ekstre çekmecesini) açar */
  onOpenCari: (cari: Cari) => void;
}

type SortKey = 'balance' | 'age' | 'name';

interface Row {
  cari: Cari;
  aging: DebtAging;
  limit: number | null;
}

const money = (value: number, currency = 'TRY') =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(Number(value) || 0);

function ageTone(days: number): string {
  if (days > 90) return 'text-rose-400';
  if (days > 60) return 'text-orange-400';
  if (days > 30) return 'text-amber-400';
  return 'text-emerald-400';
}

/**
 * Veresiye takibi: borcu olan müşteriler, bakiyeleri, limit doluluğu ve borcun kaç gündür
 * beklediği; WhatsApp ile hatırlatma ve ekstre PDF'i.
 */
export const VeresiyeTakipModal: React.FC<VeresiyeTakipModalProps> = ({ cariler, islemler, onClose, onOpenCari }) => {
  const { branding } = useDocumentBranding();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [statementCari, setStatementCari] = useState<Cari | null>(null);

  const rows: Row[] = useMemo(() => {
    try {
      return cariler
        .filter((c) => c.isActive !== false && (Number(c.balance) || 0) > 0.004)
        .map((cari) => ({ cari, aging: computeDebtAging(cari, islemler), limit: creditLimitOf(cari) }));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'VeresiyeTakipModal.rows');
      return [];
    }
  }, [cariler, islemler]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const list = rows.filter((r) => !q
      || r.cari.name.toLocaleLowerCase('tr-TR').includes(q)
      || (r.cari.code || '').toLocaleLowerCase('tr-TR').includes(q)
      || (r.cari.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')));
    return [...list].sort((a, b) => {
      if (sortKey === 'age') return b.aging.oldestAgeDays - a.aging.oldestAgeDays;
      if (sortKey === 'name') return a.cari.name.localeCompare(b.cari.name, 'tr');
      return b.aging.balance - a.aging.balance;
    });
  }, [rows, query, sortKey]);

  const totals = useMemo(() => {
    const tryRows = rows.filter((r) => (r.cari.currency || 'TRY') === 'TRY');
    return {
      total: tryRows.reduce((sum, r) => sum + r.aging.balance, 0),
      count: rows.length,
      over30: tryRows.reduce((sum, r) => sum + r.aging.buckets.d31_60 + r.aging.buckets.d61_90 + r.aging.buckets.d90p, 0),
      overLimit: rows.filter((r) => r.limit !== null && r.aging.balance > r.limit + 0.005).length,
    };
  }, [rows]);

  const sendReminder = (row: Row) => {
    try {
      const firm = branding.firmName || 'Firmamız';
      const currency = row.cari.currency || 'TRY';
      const lines = [
        `Merhaba ${row.cari.name},`,
        `${firm} nezdindeki güncel bakiyeniz ${money(row.aging.balance, currency)} borçtur.`,
      ];
      if (row.aging.oldestOpenDate) lines.push(`En eski ödenmemiş tutar ${formatDate(row.aging.oldestOpenDate)} tarihli.`);
      lines.push('Uygun olduğunuzda ödemenizi rica ederiz. Hesap ekstrenizi isterseniz iletebiliriz.');
      lines.push('İyi çalışmalar dileriz.');
      openExternalLink(whatsAppUrl(row.cari.phone, lines.join('\n')));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'VeresiyeTakipModal.sendReminder');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center shrink-0"><BookOpen size={20} /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Veresiye Takibi</h2>
              <p className="text-[11px] text-white/50 truncate">Borcu olan müşteriler, bekleme süreleri ve hatırlatma</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Kapat"><X size={18} /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Özet */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <Wallet size={17} />, tone: 'bg-rose-500/15 text-rose-300', label: 'Toplam Veresiye (TL)', value: money(totals.total) },
              { icon: <Users size={17} />, tone: 'bg-teal-500/15 text-teal-300', label: 'Borçlu Müşteri', value: `${totals.count}` },
              { icon: <Clock size={17} />, tone: 'bg-amber-500/15 text-amber-300', label: '30 Günü Geçen', value: money(totals.over30) },
              { icon: <AlertTriangle size={17} />, tone: 'bg-orange-500/15 text-orange-300', label: 'Limiti Aşan', value: `${totals.overLimit}` },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}>{card.icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 truncate">{card.label}</div>
                  <div className="text-base font-bold text-white tabular-nums truncate">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Arama ve sıralama */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl bg-white/5 border border-white/10">
              <Search size={15} className="text-white/40 shrink-0" />
              <input
                id="veresiye-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Müşteri adı, kod veya telefon..."
                className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none min-w-0"
              />
            </div>
            <select
              id="veresiye-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none cursor-pointer"
            >
              <option value="balance">Borca göre (en yüksek)</option>
              <option value="age">Bekleme süresine göre (en eski)</option>
              <option value="name">Ada göre</option>
            </select>
          </div>

          {/* Liste */}
          {visible.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
              {rows.length === 0 ? 'Veresiye borcu olan müşteri yok.' : 'Aramayla eşleşen müşteri yok.'}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-white/50">
                    <th className="px-3 py-2.5 font-semibold">Müşteri</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Borç</th>
                    <th className="px-3 py-2.5 font-semibold">Limit</th>
                    <th className="px-3 py-2.5 font-semibold">En Eski Borç</th>
                    <th className="px-3 py-2.5 font-semibold">Son Tahsilat</th>
                    <th className="px-3 py-2.5 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const currency = row.cari.currency || 'TRY';
                    const usage = row.limit ? Math.min(100, (row.aging.balance / row.limit) * 100) : 0;
                    const over = row.limit !== null && row.aging.balance > row.limit + 0.005;
                    return (
                      <tr key={row.cari.id} className="border-t border-white/5 align-middle">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-white">{row.cari.name}</div>
                          <div className="text-[11px] text-white/40">{row.cari.code}{row.cari.phone ? ` • ${row.cari.phone}` : ''}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold tabular-nums text-rose-400 whitespace-nowrap">{money(row.aging.balance, currency)}</td>
                        <td className="px-3 py-3 min-w-[130px]">
                          {row.limit === null ? (
                            <span className="text-[11px] text-white/40">Sınırsız</span>
                          ) : (
                            <div>
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full ${over ? 'bg-rose-500' : usage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${usage}%` }} />
                              </div>
                              <div className={`text-[11px] mt-1 tabular-nums ${over ? 'text-rose-400 font-semibold' : 'text-white/50'}`}>
                                {money(row.limit, currency)}{over ? ' • aşıldı' : ''}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {row.aging.oldestOpenDate ? (
                            <>
                              <div className={`font-semibold ${ageTone(row.aging.oldestAgeDays)}`}>{row.aging.oldestAgeDays} gün</div>
                              <div className="text-[11px] text-white/40">{formatDate(row.aging.oldestOpenDate)}</div>
                            </>
                          ) : <span className="text-white/40">-</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-white/60">
                          {row.aging.lastCollectionDate ? formatDate(row.aging.lastCollectionDate) : <span className="text-white/40">Yok</span>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => sendReminder(row)}
                              title={row.cari.phone ? 'WhatsApp ile hatırlat' : 'Telefon kayıtlı değil: WhatsApp kişi seçtirecek'}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                            >
                              <MessageCircle size={14} /> Hatırlat
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatementCari(row.cari)}
                              title="Ekstre PDF'i (paylaşılabilir)"
                              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer"
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { onClose(); onOpenCari(row.cari); }}
                              title="Cari kartını aç"
                              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer"
                            >
                              <ExternalLink size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-white/40">
            En eski borç: tahsilatlar en eski borçtan başlayarak düşülür; kalan ilk borcun tarihi gösterilir. Dövizli carilerin tutarları kendi para biriminde yazılır, toplamlara yalnızca TL cariler dahildir.
          </p>
        </div>
      </div>

      {statementCari && (
        <StatementPdfModal cari={statementCari} islemler={islemler} onClose={() => setStatementCari(null)} />
      )}
    </div>
  );
};
