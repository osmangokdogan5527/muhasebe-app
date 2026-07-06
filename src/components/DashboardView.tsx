import React, { useMemo, useState, useRef } from "react";
import {
  Cari,
  Stock,
  Transaction,
  DashboardStats,
  Expense,
  EmployeeTransaction,
  CekSenet,
} from "../types";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  AlertTriangle,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Settings,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

const DASHBOARD_BG_COLORS = [
  { id: 'white', name: 'Saf Beyaz', bg: '#ffffff', headerBg: '#f8fafc', theme: 'light' },
  { id: 'default', name: 'Klasik Siyah', bg: '#111111', headerBg: '#11111180', theme: 'dark' },
  { id: 'sampi10-blue', name: 'Sampi10 Mavisi', bg: '#22315b', headerBg: '#1a224080', theme: 'dark' },
  { id: 'emerald', name: 'Koyu Orman', bg: '#022c22', headerBg: '#064e3b80', theme: 'dark' },
  { id: 'storm-red', name: 'Storm Kırmızı', bg: '#b91c1c', headerBg: '#7f1d1d80', theme: 'dark' },
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

  const [widgetBgColor, setWidgetBgColor] = useState<string>(() => {
    const saved = localStorage.getItem("storm_muhasebe_widget_bg");
    if (saved === "midnight") return "white";
    return saved || "default";
  });
  
  const selectedColorDef = DASHBOARD_BG_COLORS.find(c => c.id === widgetBgColor) || DASHBOARD_BG_COLORS[0];

  const [showManager, setShowManager] = useState<boolean>(false);

  // Live Currency Rates State
  const [rates, setRates] = useState<{
    usd: number | null;
    eur: number | null;
  }>({ usd: null, eur: null });
  const [ratesLoading, setRatesLoading] = useState<boolean>(true);
  const [ratesError, setRatesError] = useState<boolean>(false);

  const fetchRatesAbortCtrl = useRef<AbortController | null>(null);

  const fetchRates = async () => {
    if (fetchRatesAbortCtrl.current) {
        fetchRatesAbortCtrl.current.abort();
    }
    fetchRatesAbortCtrl.current = new AbortController();
    const signal = fetchRatesAbortCtrl.current.signal;

    setRatesLoading(true);
    setRatesError(false);
    try {
      // Use exchangerate-api for free TRY base rates
      const response = await fetch("https://open.er-api.com/v6/latest/TRY", { signal });
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();

      if (!signal.aborted && data && data.rates) {
        // Since base is TRY, USD rate in TRY is 1 / data.rates.USD
        const usdRate = 1 / data.rates.USD;
        const eurRate = 1 / data.rates.EUR;
        setRates({ usd: usdRate, eur: eurRate });
      } else if (!signal.aborted) {
        setRatesError(true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Kurlar alınamadı (Çevrimdışı olabilir):", err);
      if (!signal.aborted) setRatesError(true);
    } finally {
      if (!signal.aborted) setRatesLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRates();
    return () => {
        if (fetchRatesAbortCtrl.current) fetchRatesAbortCtrl.current.abort();
    };
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
    <div 
      className="space-y-8 dashboard-wrapper"
      data-theme={selectedColorDef.theme}
      style={{
        '--widget-bg': selectedColorDef.bg,
        '--widget-header-bg': selectedColorDef.headerBg
      } as React.CSSProperties}
    >
      {/* Top Welcome Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#111111] p-8 rounded-xl border border-white/5 gap-4 shadow-xl bg-gradient-to-br from-teal-500/5 via-transparent to-rose-500/5 relative overflow-hidden">
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative z-10">
          {/* Mini Currency Ticker */}
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            {ratesLoading ? (
              <span className="text-white/40 flex items-center gap-1">
                <RotateCcw size={10} className="animate-spin" /> Kurlar
                Yükleniyor...
              </span>
            ) : ratesError ? (
              <span className="text-rose-400">Kur Hatası</span>
            ) : (
              <>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">$</span>
                    <div className="flex flex-col text-[10px] tabular-nums font-mono">
                      <div className="flex justify-between gap-3 text-white/40 uppercase text-[8px] leading-tight mb-0.5"><span>Alış</span><span>Satış</span></div>
                      <div className="flex justify-between gap-3 text-white/80 leading-none whitespace-nowrap">
                        <span>{rates.usd ? (rates.usd * 0.995).toFixed(2) : "-"}₺</span>
                        <span>{rates.usd ? (rates.usd * 1.005).toFixed(2) : "-"}₺</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold">€</span>
                    <div className="flex flex-col text-[10px] tabular-nums font-mono">
                      <div className="flex justify-between gap-3 text-white/40 uppercase text-[8px] leading-tight mb-0.5"><span>Alış</span><span>Satış</span></div>
                      <div className="flex justify-between gap-3 text-white/80 leading-none whitespace-nowrap">
                        <span>{rates.eur ? (rates.eur * 0.995).toFixed(2) : "-"}₺</span>
                        <span>{rates.eur ? (rates.eur * 1.005).toFixed(2) : "-"}₺</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={fetchRates}
                  disabled={ratesLoading}
                  className="ml-2 text-white/40 hover:text-teal-400 transition cursor-pointer"
                >
                  <RotateCcw size={12} className={ratesLoading ? "animate-spin" : ""} />
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setShowManager(!showManager)}
            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              showManager
                ? "bg-teal-500 text-black border-teal-500 font-bold shadow-[0_0_12px_rgba(45,212,191,0.2)]"
                : "bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10"
            }`}
          >
            <Settings
              size={12}
              className={showManager ? "animate-spin" : "text-teal-400"}
            />
            <span>{showManager ? "Düzenlemeyi Kapat" : "Paneli Düzenle"}</span>
          </button>

          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest bg-white/5 text-white/60 px-3 py-1.5 rounded-lg border border-white/10">
            <Calendar size={12} className="text-teal-400" />
            <span>
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
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
          
          {/* Widget Renk Yönetimi */}
          <div className="border-t border-white/10 pt-4 mt-4">
            <h3 className="text-[10px] uppercase tracking-widest font-extrabold text-white/50 mb-3">Pano Arka Plan Rengi</h3>
            <div className="flex flex-wrap gap-2">
              {DASHBOARD_BG_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => {
                    setWidgetBgColor(color.id);
                    localStorage.setItem("storm_muhasebe_widget_bg", color.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    widgetBgColor === color.id 
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400' 
                      : 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: color.bg }} />
                  {color.name}
                </button>
              ))}
            </div>
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
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        ÖZET FİNANSAL GÖSTERGELER
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                      {/* Safe & Bank card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Kasa, Banka & POS Mevcudu
                            </span>
                            <h3
                              className="text-3xl font-light italic tracking-tight text-teal-400 mt-2"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(
                                stats.cashBalance + stats.bankBalance + stats.posBalance,
                              )}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Wallet size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-[10px] text-white/40 font-mono tracking-wider uppercase text-center">
                          <span>
                            Kasa:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.cashBalance)}
                            </strong>
                          </span>
                          <span>
                            Banka:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.bankBalance)}
                            </strong>
                          </span>
                          <span>
                            POS:<br />
                            <strong className="text-white/80">
                              {formatCurrency(stats.posBalance)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Receivables & Payables card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Net Alacak / Borç
                            </span>
                            <h3
                              className={`text-3xl font-light italic tracking-tight mt-2 ${stats.totalReceivables - stats.totalPayables >= 0 ? "text-teal-400" : "text-red-400/80"}`}
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(
                                stats.totalReceivables - stats.totalPayables,
                              )}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Users size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] uppercase tracking-wider font-mono">
                          <span>
                            Alacak:{" "}
                            <strong className="text-teal-400">
                              {formatCurrency(stats.totalReceivables)}
                            </strong>
                          </span>
                          <span>
                            Borç:{" "}
                            <strong className="text-red-400/80">
                              {formatCurrency(stats.totalPayables)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Monthly Net Profit / Loss card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative">
                        <div className="absolute top-2 right-2 bg-teal-500/10 text-teal-400 px-2 py-1 rounded text-[8px] uppercase tracking-widest font-mono border border-teal-500/20">
                          Bu Ay (
                          {new Date().toLocaleDateString("tr-TR", {
                            month: "long",
                          })}
                          )
                        </div>
                        <div className="flex justify-between items-start mt-2">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Aylık Net Kar / Zarar
                            </span>
                            <h3
                              className={`text-3xl font-light italic tracking-tight mt-2 ${stats.monthlyNetProfit >= 0 ? "text-teal-400" : "text-red-400/80"}`}
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(stats.monthlyNetProfit)}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <TrendingUp size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1 text-[9px] uppercase tracking-wider font-mono">
                          <div className="flex justify-between">
                            <span>Bu Ayki Satış:</span>
                            <strong className="text-teal-400">
                              {formatCurrency(stats.monthlySales)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Bu Ayki Alış/Gider:</span>
                            <strong className="text-red-400/80">
                              {formatCurrency(
                                stats.monthlyPurchases +
                                  stats.monthlyExpenses +
                                  stats.monthlySalaries,
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Stock Value Card */}
                      <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
                              Stok Toplam Değeri
                            </span>
                            <h3
                              className="text-3xl font-light italic tracking-tight text-teal-400 mt-2"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {formatCurrency(stats.stockValue, "TRY")}
                            </h3>
                          </div>
                          <div className="p-2 bg-teal-500/10 text-teal-400 rounded">
                            <Package size={18} />
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[10px] uppercase tracking-wider font-mono">
                          <span>
                            Tür:{" "}
                            <strong className="text-white/80">
                              {stoklar.length} Ürün
                            </strong>
                          </span>
                          <span>
                            Kritik:{" "}
                            <strong className="text-red-400/80">
                              {
                                stoklar.filter(
                                  (s) => s.quantity <= s.minQuantity,
                                ).length
                              }
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case "ceksenet_calendar":
                return (
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        ÇEK & SENET VADE VE ÖDEME TAKVİMİ
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                        <div>
                          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                            Çek & Senet Vade ve Ödeme Takvimi
                          </h2>
                          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                            Ödenmesine / Tahsilatına kalan gün sayısı ve durum
                            analizi
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate("ceksenet")}
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-black text-[10px] uppercase font-bold tracking-wider rounded transition cursor-pointer self-start sm:self-auto shadow-md animate-pulse"
                        >
                          Tüm Çek/Senetleri Gör →
                        </button>
                      </div>

                      {activeCekSenetList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                          <Calendar className="text-white/10 mb-3" size={32} />
                          <span className="text-xs uppercase tracking-widest text-white/50 font-medium">
                            Aktif Çek veya Senet Yok
                          </span>
                          <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                            Portföyde vadesi bekleyen evrak bulunmamaktadır.
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {activeCekSenetList.slice(0, 4).map((item) => {
                            const daysLeft = getDaysRemaining(item.dueDate);
                            const isOverdue = daysLeft < 0;
                            const isToday = daysLeft === 0;

                            let dayBadgeClass = "";
                            let dayText = "";
                            if (isOverdue) {
                              dayBadgeClass =
                                "bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold";
                              dayText = `Günü Geçti (${Math.abs(daysLeft)} Gün)`;
                            } else if (isToday) {
                              dayBadgeClass =
                                "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold animate-pulse";
                              dayText = "BUGÜN ÖDENECEK";
                            } else if (daysLeft <= 7) {
                              dayBadgeClass =
                                "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 font-bold";
                              dayText = `${daysLeft} Gün Kaldı`;
                            } else {
                              dayBadgeClass =
                                "bg-teal-500/10 border-teal-500/20 text-teal-400 font-semibold";
                              dayText = `${daysLeft} Gün Kaldı`;
                            }

                            const docLabel =
                              item.docType === "cheque" ? "Çek" : "Senet";
                            const directionLabel =
                              item.type === "receivable" ? "Alınan" : "Verilen";

                            return (
                              <div
                                key={item.id}
                                className="p-4 rounded-lg bg-black/30 border border-white/5 flex flex-col justify-between hover:border-white/10 transition"
                              >
                                <div className="flex justify-between items-start gap-2 mb-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                                          item.type === "receivable"
                                            ? "bg-teal-500/10 text-teal-400"
                                            : "bg-rose-500/10 text-rose-400"
                                        }`}
                                      >
                                        {directionLabel} {docLabel}
                                      </span>
                                      {item.status === "unpaid" && (
                                        <span className="text-[9px] uppercase font-bold bg-red-600/20 text-red-400 border border-red-500/20 px-1 py-0.2 rounded">
                                          Karşılıksız/Ödenmemiş
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-bold text-white/90 truncate mt-2">
                                      {item.debtor}
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-0.5 truncate uppercase tracking-wider font-mono">
                                      Portföy No: {item.portfolioNo}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex flex-col gap-2.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-white/30 uppercase font-mono">
                                      Vade Tarihi:
                                    </span>
                                    <span className="text-[10px] font-mono text-white/70 font-semibold">
                                      {item.dueDate}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-end">
                                    <div>
                                      <span className="text-[9px] text-white/30 uppercase font-mono block">
                                        Tutar:
                                      </span>
                                      <span
                                        className="text-sm font-bold text-white font-mono"
                                        style={{ fontFamily: "Georgia, serif" }}
                                      >
                                        {formatCurrency(
                                          item.amount,
                                          item.currency,
                                        )}
                                      </span>
                                    </div>
                                    <div
                                      className={`px-2.5 py-1 text-[10px] font-mono rounded border ${dayBadgeClass}`}
                                    >
                                      {dayText}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );

              case "analysis_chart":
                return (
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        SATIŞ VE ALIŞ ANALİZİ GRAFİĞİ
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div className="mb-6">
                        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                          Satış ve Alış Analizi
                        </h2>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                          Son 6 aylık faturalandırılmış hacim trendi
                        </p>
                      </div>

                      <div className="h-64 sm:h-80 w-full text-[10px] font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorSatis"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#2dd4bf"
                                  stopOpacity={0.25}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#2dd4bf"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorAlis"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#f43f5e"
                                  stopOpacity={0.25}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#f43f5e"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="var(--chart-grid, rgba(255,255,255,0.03))"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="var(--chart-axis, rgba(255,255,255,0.3))"
                              tickLine={false}
                            />
                            <YAxis
                              stroke="var(--chart-axis, rgba(255,255,255,0.3))"
                              tickLine={false}
                              tickFormatter={(v) => `₺${v / 1000}k`}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                formatCurrency(Number(value)),
                                "",
                              ]}
                              contentStyle={{
                                backgroundColor: "var(--bg-card, #111111)",
                                borderRadius: "12px",
                                border:
                                  "1px solid var(--border-color, rgba(255,255,255,0.1))",
                                color: "var(--text-primary, #ffffff)",
                              }}
                              itemStyle={{
                                color: "var(--text-primary, #ffffff)",
                              }}
                            />
                            <Area
                              type="monotone"
                              name="Satış (TL)"
                              dataKey="satis"
                              stroke="#2dd4bf"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorSatis)"
                            />
                            <Area
                              type="monotone"
                              name="Alış (TL)"
                              dataKey="alis"
                              stroke="#f43f5e"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorAlis)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );

              case "stock_alerts":
                return (
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        KRİTİK STOK LİMİTLERİ
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                              Kritik Stok Uyarıları
                            </h2>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                              Miktarı azalan ürünler
                            </p>
                          </div>
                          <span className="p-2 bg-red-500/10 text-red-400 rounded animate-pulse">
                            <AlertTriangle size={18} />
                          </span>
                        </div>

                        {criticalStocks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                            <Package className="text-white/20 mb-3" size={32} />
                            <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                              Kritik Stok Yok
                            </span>
                            <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                              Tüm stoklar güvenli.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {criticalStocks.map((stok) => (
                              <div
                                key={stok.id}
                                className="p-3 bg-red-950/20 rounded-lg border border-red-500/10 flex justify-between items-center hover:border-red-500/30 transition"
                              >
                                <div>
                                  <div className="text-xs font-medium text-white/95">
                                    {stok.name}
                                  </div>
                                  <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                                    Kod: {stok.code || "-"}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-red-400">
                                    {stok.quantity} {stok.unit}
                                  </div>
                                  <div className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">
                                    MİN LİMİT: {stok.minQuantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-goto-stocks"
                        onClick={() => onNavigate("stoklar")}
                        className="w-full mt-6 text-center text-[10px] uppercase tracking-widest font-semibold text-teal-400 hover:text-teal-300 bg-white/5 hover:bg-white/10 py-3 rounded-lg border border-white/5 transition cursor-pointer"
                      >
                        Stok Durumunu Gör →
                      </button>
                    </div>
                  </div>
                );

              case "flow_summary":
                return (
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        FİNANSAL NAKİT AKIŞI ÖZETİ
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70 mb-6 shrink-0">
                          Finansal Akış Özeti
                        </h2>
                        <div className="flex flex-col justify-between flex-1 gap-4">
                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded shrink-0">
                              <ArrowUpRight size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Tahsilat Hacmi
                              </div>
                              <div
                                className="text-xs font-semibold text-white/90 mt-0.5"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                {formatCurrency(stats.totalCollections)}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-teal-400 shrink-0 text-right w-20">
                              Para Girişi
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-red-500/10 text-red-400 rounded shrink-0">
                              <ArrowDownLeft size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Ödeme Hacmi
                              </div>
                              <div
                                className="text-xs font-semibold text-white/90 mt-0.5"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                {formatCurrency(stats.totalPayments)}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-red-400/80 shrink-0 text-right w-20">
                              Para Çıkışı
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/10 transition h-full">
                            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded shrink-0">
                              <DollarSign size={14} />
                            </span>
                            <div className="flex flex-col items-center text-center flex-1">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-white/40">
                                Alacak / Borç Oranı
                              </div>
                              <div className="text-xs font-semibold text-white/90 mt-0.5">
                                {stats.totalPayables > 0
                                  ? `${(stats.totalReceivables / stats.totalPayables).toFixed(2)}x`
                                  : "Borç Yok"}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 shrink-0 text-right w-20">
                              Kapsama
                            </span>
                          </div>
                        </div>
                    </div>
                  </div>
                );

              case "recent_movements":
                return (
                  <div
                    key={widgetId}
                    className={`${spanClass} h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        SON FİNANSAL HAREKETLER
                      </span>
                      {renderWidgetControls(widgetId, index)}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                          <div>
                            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                              Son Hareketler (Cari, Maaş & Gider)
                            </h2>
                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                              Sisteme kaydedilen son 5 finansal hareket (
                              {dashboardCurrency})
                            </p>
                          </div>
                        </div>

                        {filteredRecentMovements.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                            <CreditCard
                              className="text-white/20 mb-3"
                              size={32}
                            />
                            <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                              Kayıtlı İşlem Yok
                            </span>
                            <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">
                              Seçilen para biriminde hareket bulunamadı.
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5 text-zinc-100">
                            {filteredRecentMovements.map((movement) => {
                              const isIncoming = movement.isIncoming;
                              return (
                                <div
                                  key={movement.id}
                                  className="py-3.5 flex justify-between items-center gap-4 first:pt-0 last:pb-0 hover:bg-white/[0.02] px-2 rounded transition"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span
                                      className={`p-1.5 rounded ${
                                        isIncoming
                                          ? "bg-teal-500/10 text-teal-400"
                                          : "bg-red-500/10 text-red-400"
                                      }`}
                                    >
                                      {isIncoming ? (
                                        <ArrowUpRight size={14} />
                                      ) : (
                                        <ArrowDownLeft size={14} />
                                      )}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-white/95 truncate">
                                        {movement.title}
                                      </div>
                                      <div className="text-[9px] text-white/40 mt-1 flex items-center gap-2 uppercase tracking-wider font-mono">
                                        <span
                                          className={
                                            isIncoming
                                              ? "text-teal-400 font-semibold"
                                              : "text-red-400 font-semibold"
                                          }
                                        >
                                          {movement.subtitle}
                                        </span>
                                        <span className="bg-white/5 border border-white/10 px-1 py-0.2 rounded text-white/70 font-bold font-mono text-[8px] tracking-wide">
                                          {movement.currency}
                                        </span>
                                        <span>•</span>
                                        <span>{movement.date}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div
                                      className={`text-xs font-semibold ${isIncoming ? "text-teal-400" : "text-red-400/80"}`}
                                      style={{ fontFamily: "Georgia, serif" }}
                                    >
                                      {isIncoming ? "+" : "-"}
                                      {formatCurrency(
                                        movement.amount,
                                        movement.currency,
                                      )}
                                    </div>
                                    <div className="text-[9px] uppercase tracking-wider text-white/30 mt-0.5">
                                      {movement.account || "Açık Hesap"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-goto-transactions"
                        onClick={() => onNavigate("islemler")}
                        className="w-full mt-6 text-center text-[10px] uppercase tracking-widest font-semibold text-teal-400 hover:text-teal-300 bg-white/5 hover:bg-white/10 py-3 rounded-lg border border-white/5 transition cursor-pointer"
                      >
                        Tüm Hareketleri Görüntüle →
                      </button>
                    </div>
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
