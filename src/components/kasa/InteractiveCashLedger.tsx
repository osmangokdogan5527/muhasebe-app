import React from 'react';
import { Search, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
export function InteractiveCashLedger({ searchTerm, setSearchTerm, selectedAccountId, setSelectedAccountId, setSelectedCurrency, dateFilter, setDateFilter, filteredMovements, bankAccounts, setEditingAccount, setIsTxModalOpen,  formatCurrency }: any) {
  return (
    <>
            {/* Interactive Cash Ledger */}
      <div id="kasa-defteri-section" className="bg-[#111111] border border-white/5 rounded-lg shadow-lg overflow-hidden flex flex-col scroll-mt-6">
        {/* Table Filters Toolbar */}
        <div className="p-5 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">Kasa & Banka Defteri (Ekstre)</h2>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">Tüm para giriş ve çıkışlarının kronolojik detay dökümü</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Açıklama, cari, masraf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-48 bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder:text-white/30"
              />
            </div>

            {/* Account filter */}
            <select
              value={selectedAccountId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all' || val === 'cash' || val === 'bank' || val === 'pos') {
                  setSelectedAccountId('all');
                } else {
                  setSelectedAccountId(val);
                  const found = bankAccounts.find(a => a.id === val);
                  if (found) {
                    setSelectedCurrency(found.currency);
                  }
                }
              }}
              className="bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 cursor-pointer"
            >
              <optgroup label="Genel Gruplar" className="bg-[#111111] text-white">
                <option value="all">Tüm Hesaplar</option>
                <option value="cash">Sadece Kasa</option>
                <option value="bank">Sadece Banka</option>
                <option value="pos">Sadece POS</option>
              </optgroup>
              <optgroup label="Özel Hesaplar" className="bg-[#111111] text-white">
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </optgroup>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 cursor-pointer"
            >
              <option value="all" className="bg-[#111111] text-white">Tüm Tarihler</option>
              <option value="today" className="bg-[#111111] text-white">Bugün</option>
              <option value="month" className="bg-[#111111] text-white">Bu Ay</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Tarih</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Hesap</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Akış</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Kategori</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Muhatap / Başlık</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Açıklama</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/30 font-medium font-mono">
                    Eşleşen nakit hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIncoming = m.type === 'in';
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.01] transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-white/50 font-mono">
                        {m.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.account === 'cash' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                            : m.account === 'pos'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                        }`}>
                          {bankAccounts.find(a => a.id === m.accountId)?.name || (m.account === 'cash' ? 'Kasa' : m.account === 'pos' ? 'POS' : 'Banka')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          isIncoming 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {isIncoming ? (
                            <>
                              <ArrowUpRight size={10} />
                              GİRİŞ
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft size={10} />
                              ÇIKIŞ
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-white/40 font-mono text-[10px] uppercase">
                        {m.category}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white/80 max-w-xs truncate">
                        {m.title}
                      </td>
                      <td className="py-3.5 px-4 text-white/50 max-w-xs truncate font-mono text-[10px]">
                        {m.description || <span className="text-white/20 italic">—</span>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold font-mono">
                        <span className={isIncoming ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIncoming ? '+' : '-'}{formatCurrency(m.amount, m.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      
    </>
  );
}
