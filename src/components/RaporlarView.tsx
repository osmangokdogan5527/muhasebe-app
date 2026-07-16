
import { OzetTab } from './raporlar/OzetTab';
import { StokTab } from './raporlar/StokTab';
import { CariTab } from './raporlar/CariTab';
import { useRaporlarStats } from './raporlar/useRaporlarStats';
import { getExportFunctions } from './raporlar/exportUtils';
import { GelirGiderTab } from './raporlar/GelirGiderTab';
import { KdvTab } from './raporlar/KdvTab';
import { EkstreTab } from './raporlar/EkstreTab';

import React, { useState, useMemo } from 'react';
import { Cari, Stock, Transaction, CekSenet, Expense, EmployeeTransaction } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  DollarSign, 
  Package, 
  Users, 
  Wallet, 
  Layers, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  PieChart as PieIcon,
  AlertTriangle,
  Percent,
  FileText,
  Share2,
  Mail
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface RaporlarViewProps {
  cariler: Cari[];
  stoklar: Stock[];
  islemler: Transaction[];
  ceksenet: CekSenet[];
  expenses: Expense[];
  employeeTransactions?: EmployeeTransaction[];
}

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
type ReportTab = 'ozet' | 'stok' | 'cari' | 'gelirgider' | 'kdvkarzarar' | 'cariekstre';

const DASHBOARD_BG_COLORS = [
  { id: 'white', name: 'Saf Beyaz', bg: '#ffffff', headerBg: '#f8fafc', theme: 'light' },
  { id: 'default', name: 'Klasik Siyah', bg: '#111111', headerBg: '#11111180', theme: 'dark' },
  { id: 'sampi10-blue', name: 'Sadece Mavi', bg: '#22315b', headerBg: '#1a224080', theme: 'dark' },
];

export default function RaporlarView({
  cariler,
  stoklar,
  islemler,
  ceksenet: _ceksenet,
  expenses,
  employeeTransactions = []
}: RaporlarViewProps) {
  const widgetBgColor = (() => {
    const saved = localStorage.getItem("storm_muhasebe_widget_bg");
    if (saved === "midnight") return "white";
    return saved || "default";
  })();
  
  const selectedColorDef = DASHBOARD_BG_COLORS.find(c => c.id === widgetBgColor) || DASHBOARD_BG_COLORS[0];

  const [activeTab, setActiveTab] = useState<ReportTab>('ozet');
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  
  // Custom date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Search/Filter states for subgroups
  const [stockSearch, setStockSearch] = useState('');
  const [stockValuationType, setStockValuationType] = useState<'purchase' | 'sales'>('purchase');
  const [cariSearch, setCariSearch] = useState('');
  const [cariTypeFilter, setCariTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [selectedCariId, setSelectedCariId] = useState<string>('');

  // Helpers to resolve date ranges based on preset
  const resolvedDates = useMemo(() => {
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    switch (datePreset) {
      case 'today':
        return { start: formatYMD(today), end: formatYMD(today) };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { start: formatYMD(yesterday), end: formatYMD(yesterday) };
      }
      case 'last7days': {
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        return { start: formatYMD(last7), end: formatYMD(today) };
      }
      case 'thisMonth': {
        const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        return { start, end: formatYMD(today) };
      }
      case 'lastMonth': {
        let year = today.getFullYear();
        let month = today.getMonth(); // 0-indexed, meaning previous month is naturally today's month index - 1
        if (month === 0) {
          month = 12;
          year -= 1;
        }
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { start, end };
      }
      case 'thisYear': {
        return { start: `${today.getFullYear()}-01-01`, end: formatYMD(today) };
      }
      case 'custom':
      default:
        return { start: startDate, end: endDate };
    }
  }, [datePreset, startDate, endDate]);

  // Translate Turkish characters to Latin equivalents for standard PDF export
  const turkishToPdf = (text: string): string => {
    if (!text) return '';
    const map: Record<string, string> = {
      'ğ': 'g', 'Ğ': 'G',
      'ü': 'u', 'Ü': 'U',
      'ş': 's', 'Ş': 'S',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ç': 'c', 'Ç': 'C'
    };
    return text.replace(/[ğĞüÜşŞıİöÖçÇ]/g, (char) => map[char] || char);
  };

  // Convert foreign amounts to the selected report currency
  // Simple rate converter (in-app fallback rates, or user manual exchangeRate in records)
  const { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats } = useRaporlarStats({ islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency, stockValuationType, stockSearch, cariSearch, cariTypeFilter });


  // COLOR THEMES FOR CHART CELLS
  const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#64748b'];

  // EXCEL DOWNLOAD IMPLEMENTATION
  const { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKdvPdf } = getExportFunctions({ activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler, incomeExpenseStats, stoklar, islemler, expenses });

  return (
    <div 
      className="space-y-6 dashboard-wrapper" 
      id="reporting-dashboard"
      data-theme={selectedColorDef.theme}
      style={{
        '--widget-bg': selectedColorDef.bg,
        '--widget-header-bg': selectedColorDef.headerBg
      } as React.CSSProperties}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-rose-500/10 pointer-events-none opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-teal-400 w-6 h-6" />
            <h2 className="text-xl font-bold text-white tracking-tight">Finansal Raporlar ve Analiz Modülü</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            İşletmenizin finansal durumunu detaylı filtreleme, grafikler ve Excel/PDF indirme araçlarıyla yönetin.
          </p>
        </div>

        {/* QUICK EXPORT ACTIONS */}
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <button
            onClick={exportAllToExcel}
            title="Cari, Stok, Fatura ve Gider listelerini tek tıkla Excel tablosu olarak yedekler."
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-emerald-900/20"
          >
            <Download size={14} />
            Tüm Listeleri Excel'e Aktar
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-emerald-900/20"
          >
            <Download size={14} />
            Excel İndir (.xlsx)
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-rose-900/20"
          >
            <Download size={14} />
            PDF İndir (.pdf)
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-white/80 font-semibold text-xs uppercase tracking-wider">
          <Filter size={14} className="text-teal-400" />
          <span>Rapor Kriterleri ve Filtreler</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Presets */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
              <Calendar size={12} /> Tarih Aralığı
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="w-full bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 outline-none"
            >
              <option value="today">Bugün</option>
              <option value="yesterday">Dün</option>
              <option value="last7days">Son 7 Gün</option>
              <option value="thisMonth">Bu Ay</option>
              <option value="lastMonth">Geçen Ay</option>
              <option value="thisYear">Bu Yıl</option>
              <option value="custom">Özel Tarih Aralığı</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Başlangıç Tarihi</label>
            <input
              type="date"
              value={resolvedDates.start}
              onChange={(e) => {
                setDatePreset('custom');
                setStartDate(e.target.value);
              }}
              className="w-full bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 outline-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Bitiş Tarihi</label>
            <input
              type="date"
              value={resolvedDates.end}
              onChange={(e) => {
                setDatePreset('custom');
                setEndDate(e.target.value);
              }}
              className="w-full bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 outline-none"
            />
          </div>

          {/* Currency Target */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
              <DollarSign size={12} /> Rapor Döviz Cinsi
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as 'TRY' | 'USD' | 'EUR')}
              className="w-full bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 outline-none"
            >
              <option value="TRY">TRY (Türk Lirası)</option>
              <option value="USD">USD (Amerikan Doları)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* REPORT TABS NAVIGATION */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('ozet')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'ozet'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          Genel Finansal Özet / Kar-Zarar
        </button>
        <button
          onClick={() => setActiveTab('stok')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'stok'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Package size={14} />
          Stok Durumu & Envanter
        </button>
        <button
          onClick={() => setActiveTab('cari')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'cari'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={14} />
          Cari Hesap Bakiyeleri
        </button>
        <button
          onClick={() => setActiveTab('gelirgider')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'gelirgider'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Wallet size={14} />
          Gelir-Gider & Masraflar
        </button>
        <button
          onClick={() => setActiveTab('kdvkarzarar')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'kdvkarzarar'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Percent size={14} />
          KDV ve Kâr-Zarar Raporu
        </button>
        <button
          onClick={() => setActiveTab('cariekstre')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'cariekstre'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          Cari Hesap Ekstresi
        </button>
      </div>

      {/* TAB CONTENT: GENEL FİNANSAL ÖZET / KAR-ZARAR */}
      {activeTab === 'ozet' && (
        <OzetTab 
          summaryStats={summaryStats}
          incomeExpenseStats={incomeExpenseStats}
          formatMoney={formatMoney}
        />
      )}

      {/* TAB CONTENT: STOK ENVANTER ANALİZİ */}
      {activeTab === 'stok' && (
        <StokTab 
          stockStats={stockStats}
          stockSearch={stockSearch}
          setStockSearch={setStockSearch}
          stockValuationType={stockValuationType}
          setStockValuationType={setStockValuationType}
          formatMoney={formatMoney}
        />
      )}

      {/* TAB CONTENT: CARİ HESAP BAKİYELERİ ANALİZİ */}
      {activeTab === 'cari' && (
        <CariTab 
          cariStats={cariStats}
          cariSearch={cariSearch}
          setCariSearch={setCariSearch}
          cariTypeFilter={cariTypeFilter}
          setCariTypeFilter={setCariTypeFilter}
          selectedCurrency={selectedCurrency}
          formatMoney={formatMoney}
        />
      )}

      {/* TAB CONTENT: GELİR-GİDER & MASRAF ANALİZİ */}
      {activeTab === 'gelirgider' && (
        <GelirGiderTab 
          incomeExpenseStats={incomeExpenseStats}
          filteredExpenses={filteredExpenses}
          summaryStats={summaryStats}
          formatMoney={formatMoney}
        />
      )}

      {/* KDV VE KAR-ZARAR RAPORU TAB CONTENT */}
      {activeTab === 'kdvkarzarar' && (
        <KdvTab 
          kdvStats={kdvStats}
          summaryStats={summaryStats}
          formatMoney={formatMoney}
          downloadKdvPdf={downloadKdvPdf}
        />
      )}

      {/* CARI HESAP EKSTRESI (HESAP DÖKÜMÜ) TAB CONTENT */}
      {activeTab === 'cariekstre' && (
        <div className="space-y-6 animate-fade-in">
          {/* CARI SELECTOR & INFO SUMMARY */}
          <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 w-full md:w-80">
                <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                  <Users size={12} /> Cari Hesap Seçimi
                </label>
                <select
                  value={selectedCariId}
                  onChange={(e) => setSelectedCariId(e.target.value)}
                  className="w-full bg-[#121316] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-teal-400 outline-none font-sans"
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
                        cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.borc, 0),
                        selectedCari.currency
                      )}\n` +
                      `• Dönem Alacak (-): ${formatMoney(
                        cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.alacak, 0),
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
                  </a >

                  {/* Mail Share Link */}
                  <a
                    href={`mailto:${selectedCari.email || ''}?subject=${encodeURIComponent('Cari Hesap Ekstresi - Mutabakat')}&body=${encodeURIComponent(
                      `Sayın Yetkili,\n\n${selectedCari.name} cari hesabınızın ${resolvedDates.start} - ${resolvedDates.end} dönemi hesap dökümü detayları ve mutabakat bakiyesi aşağıda yer almaktadır:\n\n` +
                      `• Önceki Dönem Devreden Bakiye: ${formatMoney(cariEkstreStats.priorBalance, selectedCari.currency)}\n` +
                      `• Dönem İçi Borç Toplamı (+): ${formatMoney(
                        cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.borc, 0),
                        selectedCari.currency
                      )}\n` +
                      `• Dönem İçi Alacak Toplamı (-): ${formatMoney(
                        cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.alacak, 0),
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
                      cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.borc, 0),
                      selectedCari.currency
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Dönem içi borçlandırılan tutar</p>
                </div>

                <div className="bg-[#0b0c0e] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">DÖNEM ALACAK (-)</span>
                  <div className="mt-2 text-rose-400 font-bold text-sm font-mono">
                    {formatMoney(
                      cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.alacak, 0),
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
                  <p className="text-[9px] text-zinc-500 mt-0.5">
                    {cariEkstreStats.finalBalance > 0 ? 'Alacaklıyız (Cari Borçlu)' : cariEkstreStats.finalBalance < 0 ? 'Borçluyuz (Cari Alacaklı)' : 'Bakiye Sıfır / Kapatılmış'}
                  </p>
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
                        cariEkstreStats.periodTransactions.map((t, idx) => (
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
                              t.runningBalance > 0 ? 'text-emerald-400' : t.runningBalance < 0 ? 'text-rose-400' : 'text-white'
                            }`}>
                              {formatMoney(t.runningBalance, selectedCari.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#0b0c0e] p-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <div>Dönem Toplam Borç: <span className="text-emerald-400 font-bold font-mono">
                      {formatMoney(cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.borc, 0), selectedCari.currency)}
                    </span></div>
                    <div>Dönem Toplam Alacak: <span className="text-rose-400 font-bold font-mono">
                      {formatMoney(cariEkstreStats.periodTransactions.reduce((acc, t) => acc + t.alacak, 0), selectedCari.currency)}
                    </span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-semibold">Mutabakat Bakiyesi:</span>
                    <span className={`text-base font-bold font-mono ${
                      cariEkstreStats.finalBalance > 0 ? 'text-emerald-400' : cariEkstreStats.finalBalance < 0 ? 'text-rose-400' : 'text-white'
                    }`}>
                      {formatMoney(cariEkstreStats.finalBalance, selectedCari.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
