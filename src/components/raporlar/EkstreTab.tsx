import React from 'react';
import { Download, Share2, Mail, Users } from 'lucide-react';
import { Cari } from '../../types';

interface EkstreTabProps {
  cariler: Cari[];
  selectedCariId: string;
  setSelectedCariId: (val: string) => void;
  selectedCari: Cari | null | undefined;
  cariEkstreStats: any;
  downloadCariEkstrePDF: () => void;
  resolvedDates: { start: string; end: string };
  formatMoney: (val: number, currency?: string) => string;
}

export function EkstreTab({ 
  cariler, 
  selectedCariId, 
  setSelectedCariId, 
  selectedCari, 
  cariEkstreStats, 
  downloadCariEkstrePDF, 
  resolvedDates, 
  formatMoney 
}: EkstreTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* CARI SELECTOR & INFO SUMMARY */}
      <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Hesap Ekstresi İçin Cari Seçimi</h3>
            <select
              value={selectedCariId}
              onChange={(e) => setSelectedCariId(e.target.value)}
              className="w-full sm:max-w-md bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-teal-400 outline-none font-sans"
            >
              <option value="">-- Hesap Seçiniz --</option>
              {cariler.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'customer' ? 'Müşteri' : c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi'})
                </option>
              ))}
            </select>
          </div>

          {selectedCari && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadCariEkstrePDF}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                <Download size={14} /> PDF Ekstre İndir
              </button>
                
              {/* WhatsApp Share Link */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Sayın Yetkili,\n\n${selectedCari.name} cari hesabınızın hesap dökümü özeti aşağıda yer almaktadır:\n\n` +
                  `• Önceki Devir: ${formatMoney(cariEkstreStats.priorBalance, selectedCari.currency)}\n` +
                  `• Dönem Borç (+): ${formatMoney(
                    cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.borc, 0),
                    selectedCari.currency
                  )}\n` +
                  `• Dönem Alacak (-): ${formatMoney(
                    cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.alacak, 0),
                    selectedCari.currency
                  )}\n` +
                  `• Güncel Mutabakat Bakiyesi: ${formatMoney(cariEkstreStats.finalBalance, selectedCari.currency)}\n\n` +
                  `Detaylı mutabakat ekstresi PDF formatında ekte yer almaktadır. İyi çalışmalar dileriz.\n\nStorm Ön Muhasebe Raporlama Sistemi`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                <Share2 size={14} /> WhatsApp ile Paylaş
              </a>

              {/* Mail Share Link */}
              <a
                href={`mailto:${selectedCari.email || ''}?subject=${encodeURIComponent('Cari Hesap Ekstresi - Mutabakat')}&body=${encodeURIComponent(
                  `Sayın Yetkili,\n\n${selectedCari.name} cari hesabınızın ${resolvedDates.start} - ${resolvedDates.end} dönemi hesap dökümü detayları ve mutabakat bakiyesi aşağıda yer almaktadır:\n\n` +
                  `• Önceki Dönem Devreden Bakiye: ${formatMoney(cariEkstreStats.priorBalance, selectedCari.currency)}\n` +
                  `• Dönem İçi Borç Toplamı (+): ${formatMoney(
                    cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.borc, 0),
                    selectedCari.currency
                  )}\n` +
                  `• Dönem İçi Alacak Toplamı (-): ${formatMoney(
                    cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.alacak, 0),
                    selectedCari.currency
                  )}\n` +
                  `• GÜNCEL MUTABAKAT BAKİYESİ: ${formatMoney(cariEkstreStats.finalBalance, selectedCari.currency)}\n\n` +
                  `Hesap hareketlerinin detaylı dökümünü ekte bulabilirsiniz. Lütfen hesaplarınızı kontrol ederek 7 iş günü içinde mutabakat teyidi sağlayınız.\n\nİyi çalışmalar dileriz.\n\nStorm Ön Muhasebe Raporlama Birimi`
                )}`}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                <Mail size={14} /> E-posta ile Gönder
              </a>
            </div>
          )}
        </div>
      </div>

      {!selectedCari ? (
        <div className="bg-[#0b0c0e] border border-white/5 p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-3">
          <Users size={36} className="text-zinc-600" />
          <h3 className="text-zinc-300 font-semibold text-sm">Cari Ekstresi Hazırlama</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Lütfen detaylı hesap ekstresini görüntülemek, PDF olarak indirmek veya WhatsApp üzerinden paylaşmak için yukarıdan bir Cari Hesap seçiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MINI BENTO CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0c0e] border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">ÖNCEKİ DEVİR</span>
              <div className="mt-2 text-white font-bold text-sm font-mono">
                {formatMoney(cariEkstreStats.priorBalance, selectedCari.currency)}
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Seçilen tarihten önceki bakiye</p>
            </div>

            <div className="bg-[#0b0c0e] border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">DÖNEM BORÇ (+)</span>
              <div className="mt-2 text-emerald-400 font-bold text-sm font-mono">
                {formatMoney(
                  cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.borc, 0),
                  selectedCari.currency
                )}
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Dönem içi borçlandırılan tutar</p>
            </div>

            <div className="bg-[#0b0c0e] border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">DÖNEM ALACAK (-)</span>
              <div className="mt-2 text-rose-400 font-bold text-sm font-mono">
                {formatMoney(
                  cariEkstreStats.periodTransactions.reduce((acc: any, t: any) => acc + t.alacak, 0),
                  selectedCari.currency
                )}
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Dönem içi alacaklandırılan tutar</p>
            </div>

            <div className={`border p-4 rounded-xl ${
              cariEkstreStats.finalBalance > 0 ? 'bg-emerald-950/20 border-emerald-500/20' : cariEkstreStats.finalBalance < 0 ? 'bg-red-950/20 border-red-500/20' : 'bg-[#0b0c0e] border-white/5'
            }`}>
              <span className="text-[10px] text-zinc-400 font-bold uppercase">DÖNEM SONU BAKİYE</span>
              <div className={`mt-2 font-bold text-sm font-mono ${
                cariEkstreStats.finalBalance > 0 ? 'text-emerald-400' : cariEkstreStats.finalBalance < 0 ? 'text-rose-400' : 'text-white'
              }`}>
                {formatMoney(cariEkstreStats.finalBalance, selectedCari.currency)}
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Güncel mutabakat tutarı</p>
            </div>
          </div>

          {/* DETAILED TRANSACTION TABLE */}
          <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Dönem Hesap Hareketleri Dökümü</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Seçilen tarih aralığındaki tüm faturalar, tahsilat ve ödeme işlemleri</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">İşlem No / Evrak</th>
                    <th className="px-4 py-3">İşlem Tipi</th>
                    <th className="px-4 py-3">Açıklama</th>
                    <th className="px-4 py-3 text-right">Borç (+)</th>
                    <th className="px-4 py-3 text-right">Alacak (-)</th>
                    <th className="px-4 py-3 text-right">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Initial balance row */}
                  <tr className="bg-white/5 font-medium">
                    <td className="px-4 py-2.5 text-zinc-400 font-sans">{resolvedDates.start}</td>
                    <td className="px-4 py-2.5 text-zinc-500">-</td>
                    <td className="px-4 py-2.5 text-teal-400 font-semibold">DEVİR BAKİYESİ</td>
                    <td className="px-4 py-2.5 text-zinc-400 font-sans">Dönem başı devreden hesap bakiyesi</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">-</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">-</td>
                    <td className={`px-4 py-2.5 text-right font-bold font-mono ${
                      cariEkstreStats.priorBalance > 0 ? 'text-emerald-400' : cariEkstreStats.priorBalance < 0 ? 'text-rose-400' : 'text-white'
                    }`}>
                      {formatMoney(cariEkstreStats.priorBalance, selectedCari.currency)}
                    </td>
                  </tr>

                  {cariEkstreStats.periodTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 font-sans">
                        Seçilen tarih aralığında hesap hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    cariEkstreStats.periodTransactions.map((t: any, idx: number) => (
                      <tr key={t.id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-400 font-sans">{t.date}</td>
                        <td className="px-4 py-2.5 text-white font-sans font-medium">{t.invoiceNo || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.type === 'purchase' ? 'bg-rose-500/10 text-rose-400' :
                            t.type === 'collection' ? 'bg-blue-500/10 text-blue-400' :
                            t.type === 'payment' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {t.type === 'sale' ? 'Satış' :
                             t.type === 'purchase' ? 'Alış' :
                             t.type === 'collection' ? 'Tahsilat' :
                             t.type === 'payment' ? 'Ödeme' :
                             t.type === 'sale_return' ? 'Satış İade' : 'Alış İade'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400 font-sans max-w-xs truncate" title={t.description}>
                          {t.description || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-400 font-mono">
                          {t.borc > 0 ? formatMoney(t.borc, selectedCari.currency) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-rose-400 font-mono">
                          {t.alacak > 0 ? formatMoney(t.alacak, selectedCari.currency) : '-'}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold font-mono ${
                          t.runningBalance > 0 ? 'text-emerald-400' : t.runningBalance < 0 ? 'text-rose-400' : 'text-zinc-400'
                        }`}>
                          {formatMoney(t.runningBalance, selectedCari.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
