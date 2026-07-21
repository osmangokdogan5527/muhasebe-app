import { StatsGridWidget } from './dashboard/StatsGridWidget';
import { CekSenetCalendarWidget } from './dashboard/CekSenetCalendarWidget';
import { AnalysisChartWidget } from './dashboard/AnalysisChartWidget';
import { StockAlertsWidget } from './dashboard/StockAlertsWidget';
import { FlowSummaryWidget } from './dashboard/FlowSummaryWidget';
import { RecentMovementsWidget } from './dashboard/RecentMovementsWidget';
import React, { useMemo, useState, useRef } from "react";
import { fetchTCMBRates, TCMBRatesResult } from '../utils/tcmbService';
import {
  Cari,
  Stock,
  Transaction,
  DashboardStats,
  Expense,
  EmployeeTransaction,
  CekSenet
} from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Calendar, ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw, Settings } from "lucide-react";

interface DashboardViewProps {
  cariler: Cari[];
  stoklar: Stock[];
  islemler: Transaction[];
  ceksenet?: CekSenet[];
  expenses?: Expense[];
  employeeTransactions?: EmployeeTransaction[];
  onNavigate: (view: any) => void;
}

interface WidgetDef {
  id: string;
  label: string;
  description: string;
  span: string; // Tailwind grid span
}

const ALL_WIDGETS: WidgetDef[] = [
  {
    id: "stats_grid",
    label: "Özet Finansal Göstergeler",
    description:
      "Kasa, Banka mevcudu, Net alacak/borç durumu, Net kar/zarar ve Stok toplam değer özet kartları.",
    span: "lg:col-span-3",
  },
  {
    id: "ceksenet_calendar",
    label: "Çek & Senet Vadesi ve Ödeme Takvimi",
    description:
      "Vadesi bekleyen alınan/verilen çek ve senetlerin kalan gün sayısına göre durum analizi.",
    span: "lg:col-span-3",
  },
  {
    id: "analysis_chart",
    label: "Satış ve Alış Analizi Grafiği",
    description:
      "Son 6 aylık satış ve alış fatura tutarlarının aylık trend ve hacim analizi.",
    span: "lg:col-span-2",
  },
  {
    id: "stock_alerts",
    label: "Kritik Stok Limitleri",
    description:
      "Minimum limitin altına inmiş, tedarik edilmesi gereken ürünler.",
    span: "lg:col-span-1",
  },
  {
    id: "flow_summary",
    label: "Finansal Nakit Akışı Özeti",
    description:
      "Toplam para girişi (tahsilat), çıkışı (ödeme) ve alacak/borç oran analizi.",
    span: "lg:col-span-1",
  },
  {
    id: "recent_movements",
    label: "Son Finansal Hareketler Listesi",
    description:
      "Cari fatura, ödeme, tahsilat, masraf ve personel maaş hareketlerinden son 5 kayıt.",
    span: "lg:col-span-2",
  },
];

const DEFAULT_WIDGET_ORDER = [
  "stats_grid",
  "ceksenet_calendar",
  "analysis_chart",
  "stock_alerts",
  "flow_summary",
  "recent_movements",
];

export default function DashboardView({
  cariler,
  stoklar,
  islemler,
  ceksenet = [],
  expenses = [],
  employeeTransactions = [],
  onNavigate,
}: DashboardViewProps) {
  const [dashboardCurrency, setDashboardCurrency] = useState<
    "TRY" | "USD" | "EUR"
  >("TRY");

  // Custom Dashboard Widgets State
  const [widgetsOrder, setWidgetsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("storm_muhasebe_dashboard_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("storm_muhasebe_dashboard_hidden");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [showManager, setShowManager] = useState<boolean>(false);

  // Live Currency Rates State
  const [rates, setRates] = useState<TCMBRatesResult | null>(null);
  const [ratesLoading, setRatesLoading] = useState<boolean>(true);
  const [ratesError, setRatesError] = useState<boolean>(false);

  const fetchRates = async (force: boolean = false) => {
    setRatesLoading(true);
    setRatesError(false);
    try {
      const data = await fetchTCMBRates(force);
      setRates(data);
    } catch (err: any) {
      console.warn("Kurlar alınamadı (Çevrimdışı olabilir):", err);
      setRatesError(true);
    } finally {
      setRatesLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRates(false);
  }, []);

  const moveWidget = (index: number, direction: "up" | "down") => {
    const newOrder = [...widgetsOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setWidgetsOrder(newOrder);
      localStorage.setItem(
        "storm_muhasebe_dashboard_order",
        JSON.stringify(newOrder),
      );
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setHiddenWidgets((prev) => {
      const next = prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId];
      localStorage.setItem(
        "storm_muhasebe_dashboard_hidden",
        JSON.stringify(next),
      );
      return next;
    });
  };

  const resetWidgets = () => {
    setWidgetsOrder(DEFAULT_WIDGET_ORDER);
    setHiddenWidgets([]);
    localStorage.setItem(
      "storm_muhasebe_dashboard_order",
      JSON.stringify(DEFAULT_WIDGET_ORDER),
    );
    localStorage.setItem("storm_muhasebe_dashboard_hidden", JSON.stringify([]));
  };

  // Calculate accounting statistics
  const stats: DashboardStats = useMemo(() => {
    let totalSales = 0;
    let totalPurchases = 0;
    let totalCollections = 0;
    let totalPayments = 0;

    let cashBalance = 0;
    let bankBalance = 0;
    let posBalance = 0;

    let monthlySales = 0;
    let monthlyPurchases = 0;
    let monthlyExpenses = 0;
    let monthlySalaries = 0;

    const now = new Date();
    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();

    // Process transactions matching active currency
    islemler.forEach((islem) => {
      const cur = islem.currency || "TRY";
      if (cur !== dashboardCurrency) return;

      const islemAmount = islem.amount || 0;
      const islemDate = new Date(islem.date).getTime();
      const isCurrentMonth =
        islemDate >= currentMonthStart && islemDate <= currentMonthEnd;

      if (islem.type === "sale") {
        totalSales += islemAmount;
        if (isCurrentMonth) monthlySales += islemAmount;
        if (islem.account === "cash") cashBalance += islemAmount;
        if (islem.account === "bank") bankBalance += islemAmount;
        if (islem.account === "pos") posBalance += islemAmount;
      } else if (islem.type === "purchase") {
        totalPurchases += islemAmount;
        if (isCurrentMonth) monthlyPurchases += islemAmount;
        if (islem.account === "cash") cashBalance -= islemAmount;
        if (islem.account === "bank") bankBalance -= islemAmount;
        if (islem.account === "pos") posBalance -= islemAmount;
      } else if (islem.type === "sale_return") {
        totalSales -= islemAmount;
        if (isCurrentMonth) monthlySales -= islemAmount;
        if (islem.account === "cash") cashBalance -= islemAmount;
        if (islem.account === "bank") bankBalance -= islemAmount;
        if (islem.account === "pos") posBalance -= islemAmount;
      } else if (islem.type === "purchase_return") {
        totalPurchases -= islemAmount;
        if (isCurrentMonth) monthlyPurchases -= islemAmount;
        if (islem.account === "cash") cashBalance += islemAmount;
        if (islem.account === "bank") bankBalance += islemAmount;
        if (islem.account === "pos") posBalance += islemAmount;
      } else if (islem.type === "collection") {
        totalCollections += islemAmount;
        if (islem.account === "cash") cashBalance += islemAmount;
        if (islem.account === "bank") bankBalance += islemAmount;
        if (islem.account === "pos") posBalance += islemAmount;
      } else if (islem.type === "payment") {
        totalPayments += islemAmount;
        if (islem.account === "cash") cashBalance -= islemAmount;
        if (islem.account === "bank") bankBalance -= islemAmount;
        if (islem.account === "pos") posBalance -= islemAmount;
      }
    });

    // Subtract expenses from Cash & Bank balances based on payment account and currency
    let totalExpenses = 0;
    expenses.forEach((exp) => {
      const cur = exp.currency || "TRY";
      if (cur !== dashboardCurrency) return;

      const amt = exp.amount || 0;
      totalExpenses += amt;

      const expDate = new Date(exp.date).getTime();
      if (expDate >= currentMonthStart && expDate <= currentMonthEnd) {
        monthlyExpenses += amt;
      }

      if (exp.account === "cash") {
        cashBalance -= amt;
      } else if (exp.account === "bank") {
        bankBalance -= amt;
      } else if (exp.account === "pos") {
        posBalance -= amt;
      }
    });

    // Add employee transactions for monthly salaries
    employeeTransactions?.forEach((et) => {
      // Basic assumption: employee transactions are in TRY since no currency field in EmployeeTransaction
      if (dashboardCurrency !== "TRY") return;

      if (et.type === "payment") {
        const etDate = new Date(et.date).getTime();
        if (etDate >= currentMonthStart && etDate <= currentMonthEnd) {
          monthlySalaries += et.amount;
        }
      }
    });

    // Calculate Receivables & Payables from Cariler matching active currency
    let totalReceivables = 0;
    let totalPayables = 0;
    cariler.forEach((cari) => {
      const cur = cari.currency || "TRY";
      if (cur !== dashboardCurrency) return;

      const balance = cari.balance || 0;
      if (balance > 0) {
        totalReceivables += balance;
      } else if (balance < 0) {
        totalPayables += Math.abs(balance);
      }
    });

    // Stock value (purchase price * quantity) - stocks remain in base TRY
    let stockValue = 0;
    stoklar.forEach((stok) => {
      stockValue += (stok.quantity || 0) * (stok.purchasePrice || 0);
    });

    const netProfit = totalSales - totalPurchases - totalExpenses;
    const monthlyNetProfit =
      monthlySales - monthlyPurchases - monthlyExpenses - monthlySalaries;

    return {
      totalSales,
      totalPurchases,
      totalCollections,
      totalPayments,
      netProfit,
      monthlySales,
      monthlyPurchases,
      monthlyExpenses,
      monthlySalaries,
      monthlyNetProfit,
      totalReceivables,
      totalPayables,
      cashBalance,
      bankBalance,
      posBalance,
      stockValue,
    };
  }, [
    cariler,
    stoklar,
    islemler,
    expenses,
    employeeTransactions,
    dashboardCurrency,
  ]);

  // Chart data: Group sales and purchases by month for the last 6 months
  const chartData = useMemo(() => {
    const monthlyData: {
      [key: string]: { month: string; satis: number; alis: number };
    } = {};

    // Initialize last 6 months
    const months = [
      "Oca",
      "Şub",
      "Mar",
      "Nis",
      "May",
      "Haz",
      "Tem",
      "Ağu",
      "Eyl",
      "Eki",
      "Kas",
      "Ara",
    ];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      monthlyData[key] = { month: label, satis: 0, alis: 0 };
    }

    // Populate from transactions
    islemler.forEach((islem) => {
      if (!islem.date) return;
      const cur = islem.currency || "TRY";
      if (cur !== dashboardCurrency) return;

      const monthKey = islem.date.substring(0, 7); // "YYYY-MM"
      if (monthlyData[monthKey]) {
        if (islem.type === "sale") {
          monthlyData[monthKey].satis += islem.amount;
        } else if (islem.type === "purchase") {
          monthlyData[monthKey].alis += islem.amount;
        } else if (islem.type === "sale_return") {
          monthlyData[monthKey].satis -= islem.amount;
        } else if (islem.type === "purchase_return") {
          monthlyData[monthKey].alis -= islem.amount;
        }
      }
    });

    return Object.values(monthlyData);
  }, [islemler, dashboardCurrency]);

  // Critical stock levels
  const criticalStocks = useMemo(() => {
    return stoklar.filter((s) => s.quantity <= s.minQuantity).slice(0, 5);
  }, [stoklar]);

  // Combine and sort recent financial movements
  const recentMovements = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      date: string;
      amount: number;
      currency: string;
      account: string;
      isIncoming: boolean;
      source: "cari" | "expense" | "employee";
    }> = [];

    // 1. Add normal transactions (islemler)
    islemler.forEach((islem) => {
      const isIncoming = ["sale", "collection", "purchase_return"].includes(islem.type);
      list.push({
        id: `islem-${islem.id}`,
        title: islem.cariName,
        subtitle:
          islem.type === "sale"
            ? "Satış Faturası"
            : islem.type === "purchase"
              ? "Alış Faturası"
              : islem.type === "sale_return"
                ? "Satış İade Faturası"
                : islem.type === "purchase_return"
                  ? "Alış İade Faturası"
                  : islem.type === "collection"
                    ? "Tahsilat"
                    : "Cari Ödeme",
        date: islem.date,
        amount: islem.amount,
        currency: islem.currency || "TRY",
        account:
          islem.account === "cash"
            ? "Kasa"
            : islem.account === "bank"
              ? "Banka"
              : "Açık Hesap",
        isIncoming,
        source: "cari",
      });
    });

    // 2. Add expenses (giderler)
    expenses.forEach((exp) => {
      // Avoid double counting if this expense is synced from employee transactions
      const isSyncedEmployeeTx = employeeTransactions?.some(
        (et) => et.id === exp.id,
      );
      if (isSyncedEmployeeTx) return;

      list.push({
        id: `expense-${exp.id}`,
        title: exp.title,
        subtitle: `${exp.category} Gideri`,
        date: exp.date,
        amount: exp.amount,
        currency: exp.currency || "TRY",
        account: exp.account === "cash" ? "Kasa" : "Banka",
        isIncoming: false,
        source: "expense",
      });
    });

    // 3. Add employee transactions
    employeeTransactions?.forEach((et) => {
      list.push({
        id: `employee-${et.id}`,
        title: et.employeeName,
        subtitle:
          et.type === "accrual"
            ? "Personel Maaş Tahakkuku"
            : et.type === "payment"
              ? "Personel Maaş Ödemesi"
              : "Personel Avansı",
        date: et.date,
        amount: et.amount,
        currency: et.currency || "TRY",
        account:
          et.account === "cash"
            ? "Kasa"
            : et.account === "bank"
              ? "Banka"
              : "Borç Tahakkuku",
        isIncoming: false,
        source: "employee",
      });
    });

    // Sort descending by date, then id
    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  }, [islemler, expenses, employeeTransactions]);

  const filteredRecentMovements = useMemo(() => {
    return recentMovements
      .filter((m) => m.currency === dashboardCurrency)
      .slice(0, 5);
  }, [recentMovements, dashboardCurrency]);

  // Helper to calculate days remaining
  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter active checks/bonds and calculate remaining days
  const activeCekSenetList = useMemo(() => {
    return ceksenet
      .filter((item) => item.status === "portfolio" || item.status === "unpaid")
      .sort((a, b) => {
        const aDays = getDaysRemaining(a.dueDate);
        const bDays = getDaysRemaining(b.dueDate);
        return aDays - bDays;
      });
  }, [ceksenet]);

  // Format currency helper
  const formatCurrency = (val: number, cur: string = dashboardCurrency) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: cur,
    }).format(val);
  };

  const renderWidgetControls = (widgetId: string, index: number) => {
    const isFirst = index === 0;
    const isLast = index === widgetsOrder.length - 1;
    return (
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
        <button
          disabled={isFirst}
          onClick={() => moveWidget(index, "up")}
          className={`p-1 rounded hover:bg-white/10 text-white/40 hover:text-teal-400 transition ${isFirst ? "opacity-20 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
          title="Yukarı Taşı"
        >
          <ChevronUp size={13} />
        </button>
        <button
          disabled={isLast}
          onClick={() => moveWidget(index, "down")}
          className={`p-1 rounded hover:bg-white/10 text-white/40 hover:text-teal-400 transition ${isLast ? "opacity-20 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
          title="Aşağı Taşı"
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={() => toggleWidgetVisibility(widgetId)}
          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-rose-400 transition cursor-pointer active:scale-90"
          title="Bileşeni Gizle"
        >
          <EyeOff size={13} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 dashboard-wrapper">
      {/* Top Welcome Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center bg-[#111111] p-5 sm:p-8 rounded-2xl border border-white/5 gap-6 shadow-xl bg-gradient-to-br from-teal-500/5 via-transparent to-rose-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h1
            id="dashboard-heading"
            className="text-lg font-bold tracking-tight text-white/90"
          >
            Gösterge Paneli
          </h1>
          <p className="text-white/50 text-xs mt-1.5 font-medium">
            İşletmenizin anlık finansal ve operasyonel durumunu buradan
            izleyebilirsiniz.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto relative z-10">
          {/* Mini Currency Ticker */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 text-[10px] font-mono uppercase tracking-widest bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto scrollbar-none">
            {ratesLoading ? (
              <span className="text-white/40 flex items-center gap-1 shrink-0">
                <RotateCcw size={10} className="animate-spin" /> Kurlar Yükleniyor...
              </span>
            ) : ratesError || !rates ? (
              <span className="text-rose-400 shrink-0">Kur Hatası</span>
            ) : (
              <>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">$</span>
                    <div className="flex flex-col text-[10px] tabular-nums font-mono">
                      <div className="flex justify-between gap-3 text-white/40 uppercase text-[8px] leading-tight mb-0.5"><span>Alış</span><span>Satış</span></div>
                      <div className="flex justify-between gap-2.5 text-white/80 leading-none whitespace-nowrap">
                        <span>{rates.USD ? rates.USD.buying.toFixed(4) : "-"}₺</span>
                        <span>{rates.USD ? rates.USD.selling.toFixed(4) : "-"}₺</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-px h-6 bg-white/20 mx-1.5 sm:mx-2 shrink-0"></div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">€</span>
                    <div className="flex flex-col text-[10px] tabular-nums font-mono">
                      <div className="flex justify-between gap-3 text-white/40 uppercase text-[8px] leading-tight mb-0.5"><span>Alış</span><span>Satış</span></div>
                      <div className="flex justify-between gap-2.5 text-white/80 leading-none whitespace-nowrap">
                        <span>{rates.EUR ? rates.EUR.buying.toFixed(4) : "-"}₺</span>
                        <span>{rates.EUR ? rates.EUR.selling.toFixed(4) : "-"}₺</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-px h-6 bg-white/20 mx-1 sm:mx-1.5 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[8px] px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20 font-bold font-sans self-center whitespace-nowrap uppercase tracking-wider">
                    {rates.source === 'ExchangeRateAPI' ? 'Yedek' : rates.source === 'Fallback' ? 'Önbellek' : rates.source}
                  </span>
                  <button
                    onClick={() => fetchRates(true)}
                    disabled={ratesLoading}
                    title="Kurları Güncelle"
                    className="p-1 text-white/40 hover:text-teal-400 transition cursor-pointer"
                  >
                    <RotateCcw size={12} className={ratesLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowManager(!showManager)}
              className={`flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3 py-2.5 rounded-xl border transition cursor-pointer w-full md:w-auto ${
                showManager
                  ? "bg-teal-500 text-black border-teal-500 font-bold shadow-[0_0_12px_rgba(45,212,191,0.2)]"
                  : "bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10"
              }`}
            >
              <Settings
                size={12}
                className={showManager ? "animate-spin" : "text-teal-400"}
              />
              <span className="truncate">{showManager ? "Kaydet" : "Paneli Düzenle"}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest bg-white/5 text-white/60 px-3 py-2.5 rounded-xl border border-white/10 w-full md:w-auto">
              <Calendar size={12} className="text-teal-400 shrink-0" />
              <span className="truncate">
                {new Date().toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Bileşen Yönetim Paneli */}
      {showManager && (
        <div className="bg-[#111111] p-6 rounded-xl border border-teal-500/20 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] font-extrabold text-teal-400 flex items-center gap-2">
                <Settings size={14} className="animate-spin" />
                GÖSTERGE PANELİ BİLEŞEN YÖNETİMİ
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono mt-1">
                Bileşenleri görünür yapabilir, sıralamasını değiştirebilir veya
                varsayılana sıfırlayabilirsiniz.
              </p>
            </div>
            <button
              onClick={resetWidgets}
              className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold text-rose-400 hover:text-rose-300 transition hover:underline cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Bileşen Düzenini Sıfırla</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgetsOrder.map((widgetId, index) => {
              const widgetDef = ALL_WIDGETS.find((w) => w.id === widgetId);
              if (!widgetDef) return null;
              const isHidden = hiddenWidgets.includes(widgetId);
              const isFirst = index === 0;
              const isLast = index === widgetsOrder.length - 1;

              return (
                <div
                  key={widgetId}
                  className={`p-4 rounded-lg border transition-all ${
                    isHidden
                      ? "bg-black/20 border-white/5 opacity-50"
                      : "bg-black/60 border-teal-500/10 hover:border-teal-500/30 shadow-lg"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-white/30">
                          {index + 1}.
                        </span>
                        <h4
                          className={`text-xs font-bold uppercase tracking-wide truncate ${isHidden ? "text-white/40 line-through" : "text-white/90"}`}
                        >
                          {widgetDef.label}
                        </h4>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 line-clamp-2">
                        {widgetDef.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    <button
                      onClick={() => toggleWidgetVisibility(widgetId)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold transition cursor-pointer active:scale-95 ${
                        isHidden
                          ? "bg-teal-500/15 text-teal-400 border border-teal-500/20 hover:bg-teal-500/25"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25"
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <Eye size={12} />
                          <span>Ekle (Göster)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          <span>Gizle / Kaldır</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={isFirst}
                        onClick={() => moveWidget(index, "up")}
                        className={`p-1 rounded bg-white/5 border border-white/10 text-white/50 hover:text-teal-400 hover:border-teal-500/30 transition ${
                          isFirst
                            ? "opacity-20 cursor-not-allowed"
                            : "cursor-pointer active:scale-90"
                        }`}
                        title="Yukarı Taşı"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        disabled={isLast}
                        onClick={() => moveWidget(index, "down")}
                        className={`p-1 rounded bg-white/5 border border-white/10 text-white/50 hover:text-teal-400 hover:border-teal-500/30 transition ${
                          isLast
                            ? "opacity-20 cursor-not-allowed"
                            : "cursor-pointer active:scale-90"
                        }`}
                        title="Aşağı Taşı"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Currency Selection Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#111111] p-3 rounded-lg border border-white/5 shadow-md">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-bold ml-2">
          FİNANSAL GÖSTERGE PARA BİRİMİ SEÇİMİ
        </span>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1 w-full sm:w-auto">
          {(["TRY", "USD", "EUR"] as const).map((cur) => (
            <button
              key={cur}
              id={`tab-dashboard-cur-${cur}`}
              onClick={() => setDashboardCurrency(cur)}
              className={`flex-1 sm:flex-none px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer ${
                dashboardCurrency === cur
                  ? "bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.2)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {cur === "TRY" ? "₺ TL" : cur === "USD" ? "$ USD" : "€ EUR"}
            </button>
          ))}
        </div>
      </div>

      {/* Customizable Master Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgetsOrder
          .filter((widgetId) => !hiddenWidgets.includes(widgetId))
          .map((widgetId, index) => {
            const widgetDef = ALL_WIDGETS.find((w) => w.id === widgetId);
            const spanClass = widgetDef?.span || "lg:col-span-3";

            switch (widgetId) {
              case "stats_grid":
                return (
                  <div key="stats_grid" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <StatsGridWidget stats={stats} stoklar={stoklar} dashboardCurrency={dashboardCurrency} formatCurrency={formatCurrency} renderWidgetControls={() => renderWidgetControls("stats_grid", index)} />
                  </div>
                );

              case "ceksenet_calendar":
                return (
                  <div key="ceksenet_calendar" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <CekSenetCalendarWidget activeCekSenetList={activeCekSenetList} getDaysRemaining={getDaysRemaining} onNavigate={onNavigate} dashboardCurrency={dashboardCurrency} formatCurrency={formatCurrency} renderWidgetControls={() => renderWidgetControls("ceksenet_calendar", index)} />
                  </div>
                );

              case "analysis_chart":
                return (
                  <div key="analysis_chart" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <AnalysisChartWidget chartData={chartData} dashboardCurrency={dashboardCurrency} formatCurrency={formatCurrency} renderWidgetControls={() => renderWidgetControls("analysis_chart", index)} />
                  </div>
                );

              case "stock_alerts":
                return (
                  <div key="stock_alerts" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <StockAlertsWidget criticalStocks={criticalStocks} onNavigate={onNavigate} renderWidgetControls={() => renderWidgetControls("stock_alerts", index)} />
                  </div>
                );

              case "flow_summary":
                return (
                  <div key="flow_summary" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <FlowSummaryWidget stats={stats} dashboardCurrency={dashboardCurrency} formatCurrency={formatCurrency} renderWidgetControls={() => renderWidgetControls("flow_summary", index)} />
                  </div>
                );

              case "recent_movements":
                return (
                  <div key="recent_movements" className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}>
                    <RecentMovementsWidget filteredRecentMovements={filteredRecentMovements} onNavigate={onNavigate} dashboardCurrency={dashboardCurrency} formatCurrency={formatCurrency} renderWidgetControls={() => renderWidgetControls("recent_movements", index)} />
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>
    </div>
  );
}
