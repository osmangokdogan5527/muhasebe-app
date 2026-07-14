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
  const convertAmount = (amount: number, fromCurrency: string = 'TRY', recordRate?: number) => {
    if (fromCurrency === selectedCurrency) return amount;
    
    // Fallback static conversion rates if exchangeRate is missing
    const rates: Record<string, number> = {
      TRY: 1,
      USD: 33.5,
      EUR: 36.0
    };

    const targetRate = rates[selectedCurrency] || 1;
    const sourceRate = recordRate || rates[fromCurrency] || 1;

    // Convert to TRY first, then to target currency
    const amountInTry = amount * sourceRate;
    return amountInTry / targetRate;
  };

  // Format currency output with selected locale format
  const formatMoney = (val: number, currency: string = selectedCurrency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(val);
  };

  // 1. FILTERED DATASETS
  const filteredIslemler = useMemo(() => {
    return islemler.filter(item => {
      const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
      return isWithinDate;
    });
  }, [islemler, resolvedDates]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
      return isWithinDate;
    });
  }, [expenses, resolvedDates]);

  const filteredEmployeeTransactions = useMemo(() => {
    return employeeTransactions.filter(item => {
      const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
      return isWithinDate;
    });
  }, [employeeTransactions, resolvedDates]);

  // Selected Cari info
  const selectedCari = useMemo(() => {
    return cariler.find(c => c.id === selectedCariId);
  }, [cariler, selectedCariId]);

  // KDV Calculations
  const kdvStats = useMemo(() => {
    let salesKdvTotal = 0;
    let purchaseKdvTotal = 0;
    
    // Breakdowns
    let salesKdv20 = 0;
    let salesKdv10 = 0;
    let salesKdv1 = 0;
    let salesKdvOther = 0;

    let purchaseKdv20 = 0;
    let purchaseKdv10 = 0;
    let purchaseKdv1 = 0;
    let purchaseKdvOther = 0;

    // We also track base (KDV Matrahı)
    let salesBase20 = 0;
    let salesBase10 = 0;
    let salesBase1 = 0;
    let salesBaseOther = 0;

    let purchaseBase20 = 0;
    let purchaseBase10 = 0;
    let purchaseBase1 = 0;
    let purchaseBaseOther = 0;

    filteredIslemler.forEach(islem => {
      const isSale = islem.type === 'sale' || islem.type === 'sale_return';
      const isPurchase = islem.type === 'purchase' || islem.type === 'purchase_return';
      
      if (!isSale && !isPurchase) return;

      const sign = (islem.type === 'sale_return' || islem.type === 'purchase_return') ? -1 : 1;
      const rateMultiplier = sign;

      if (islem.items && islem.items.length > 0) {
        islem.items.forEach(item => {
          const qty = item.quantity || 1;
          const taxRate = item.taxRate || 0;
          const convertedExTaxAmount = convertAmount(item.price * qty, islem.currency, islem.exchangeRate) * rateMultiplier;
          const convertedKdvAmount = convertedExTaxAmount * (taxRate / 100);

          if (isSale) {
            salesKdvTotal += convertedKdvAmount;
            if (taxRate === 20) {
              salesKdv20 += convertedKdvAmount;
              salesBase20 += convertedExTaxAmount;
            } else if (taxRate === 10) {
              salesKdv10 += convertedKdvAmount;
              salesBase10 += convertedExTaxAmount;
            } else if (taxRate === 1) {
              salesKdv1 += convertedKdvAmount;
              salesBase1 += convertedExTaxAmount;
            } else {
              salesKdvOther += convertedKdvAmount;
              salesBaseOther += convertedExTaxAmount;
            }
          } else {
            purchaseKdvTotal += convertedKdvAmount;
            if (taxRate === 20) {
              purchaseKdv20 += convertedKdvAmount;
              purchaseBase20 += convertedExTaxAmount;
            } else if (taxRate === 10) {
              purchaseKdv10 += convertedKdvAmount;
              purchaseBase10 += convertedExTaxAmount;
            } else if (taxRate === 1) {
              purchaseKdv1 += convertedKdvAmount;
              purchaseBase1 += convertedExTaxAmount;
            } else {
              purchaseKdvOther += convertedKdvAmount;
              purchaseBaseOther += convertedExTaxAmount;
            }
          }
        });
      } else {
        // Fallback for transactions without items: assume 20% KDV is included in the total amount
        const totalAmt = convertAmount(islem.amount, islem.currency, islem.exchangeRate) * rateMultiplier;
        const taxRate = 20; // fallback standard rate
        const convertedKdvAmount = totalAmt * (taxRate / (100 + taxRate)); // 20/120 of total
        const convertedExTaxAmount = totalAmt - convertedKdvAmount;

        if (isSale) {
          salesKdvTotal += convertedKdvAmount;
          salesKdv20 += convertedKdvAmount;
          salesBase20 += convertedExTaxAmount;
        } else {
          purchaseKdvTotal += convertedKdvAmount;
          purchaseKdv20 += convertedKdvAmount;
          purchaseBase20 += convertedExTaxAmount;
        }
      }
    });

    const netKdvDifference = salesKdvTotal - purchaseKdvTotal;
    const payableKdv = netKdvDifference > 0 ? netKdvDifference : 0;
    const devredenKdv = netKdvDifference < 0 ? Math.abs(netKdvDifference) : 0;

    return {
      salesKdvTotal,
      purchaseKdvTotal,
      salesKdv20,
      salesKdv10,
      salesKdv1,
      salesKdvOther,
      purchaseKdv20,
      purchaseKdv10,
      purchaseKdv1,
      purchaseKdvOther,
      salesBase20,
      salesBase10,
      salesBase1,
      salesBaseOther,
      purchaseBase20,
      purchaseBase10,
      purchaseBase1,
      purchaseBaseOther,
      payableKdv,
      devredenKdv,
      netKdvDifference
    };
  }, [filteredIslemler, selectedCurrency]);

  // Cari Ekstre Calculations
  const cariEkstreStats = useMemo(() => {
    if (!selectedCariId || !selectedCari) {
      return { priorBalance: 0, periodTransactions: [], finalBalance: 0, allTransactions: [] };
    }

    // 1. Get all transactions of this Cari
    const allCariTransactions = islemler
      .filter(t => t.cariId === selectedCariId)
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return a.createdAt.localeCompare(b.createdAt);
      });

    // 2. Calculate sum of all transaction effects
    let sumOfAllTxEffects = 0;
    allCariTransactions.forEach(t => {
      const effectAmount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? t.convertedAmount : (t.amount || 0);
      if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') {
        sumOfAllTxEffects += effectAmount;
      } else if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') {
        sumOfAllTxEffects -= effectAmount;
      }
    });

    // Starting balance of the Cari card before any transactions
    const initialCardBalance = (selectedCari.balance || 0) - sumOfAllTxEffects;

    // 3. Compute running balance for all transactions chronologically
    let currentRunning = initialCardBalance;
    const computedTxList = allCariTransactions.map(t => {
      const effectAmount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? t.convertedAmount : (t.amount || 0);
      let borc = 0; // Debit
      let alacak = 0; // Credit
      
      if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') {
        borc = effectAmount;
        currentRunning += effectAmount;
      } else if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') {
        alacak = effectAmount;
        currentRunning -= effectAmount;
      }

      return {
        ...t,
        borc,
        alacak,
        runningBalance: currentRunning
      };
    });

    // 4. Split into prior (Devreden) and period transactions based on resolvedDates
    let priorBalance = initialCardBalance;
    const periodTransactions: any[] = [];

    computedTxList.forEach(t => {
      if (t.date < resolvedDates.start) {
        priorBalance = t.runningBalance;
      } else if (t.date >= resolvedDates.start && t.date <= resolvedDates.end) {
        periodTransactions.push(t);
      }
    });

    const finalBalance = periodTransactions.length > 0 
      ? periodTransactions[periodTransactions.length - 1].runningBalance 
      : priorBalance;

    return {
      priorBalance,
      periodTransactions,
      finalBalance,
      allTransactions: computedTxList
    };
  }, [selectedCariId, selectedCari, islemler, resolvedDates]);

  // 2. COMPUTATIONS - SUMMARY & P&L
  const summaryStats = useMemo(() => {
    let sales = 0;
    let costOfSales = 0;
    let purchases = 0;
    let collections = 0;
    let payments = 0;
    let totalExpenses = 0;
    let employeeSalaries = 0;

    // Map stocks to code/id for quick lookup
    const stockMap = new Map<string, Stock>();
    stoklar.forEach(s => stockMap.set(s.id, s));

    // Process transactions within date range
    filteredIslemler.forEach(islem => {
      const amt = convertAmount(islem.amount, islem.currency, islem.exchangeRate);
      
      if (islem.type === 'sale') {
        sales += amt;
        // Estimate Cost of Goods Sold (SMM)
        if (islem.items && islem.items.length > 0) {
          islem.items.forEach(item => {
            const st = stockMap.get(item.stockId);
            const costRate = st ? st.purchasePrice : (item.price * 0.7); // 70% of sales price as fallback cost
            costOfSales += convertAmount(costRate * item.quantity, islem.currency, islem.exchangeRate);
          });
        } else {
          costOfSales += amt * 0.7; // Fallback 70% if items details missing
        }
      } else if (islem.type === 'purchase') {
        purchases += amt;
      } else if (islem.type === 'collection') {
        collections += amt;
      } else if (islem.type === 'payment') {
        payments += amt;
      }
    });

    // Process general expenses
    filteredExpenses.forEach(exp => {
      totalExpenses += convertAmount(exp.amount, exp.currency);
    });

    // Process employee salaries (accruals / hak ediş represents cost)
    filteredEmployeeTransactions.forEach(et => {
      if (et.type === 'accrual') {
        employeeSalaries += convertAmount(et.amount, et.currency);
      }
    });

    const grossProfit = sales - costOfSales;
    const netProfit = grossProfit - totalExpenses - employeeSalaries;

    return {
      sales,
      costOfSales,
      grossProfit,
      purchases,
      collections,
      payments,
      totalExpenses,
      employeeSalaries,
      netProfit
    };
  }, [filteredIslemler, stoklar, filteredExpenses, filteredEmployeeTransactions, selectedCurrency]);

  // 3. COMPUTATIONS - STOK ANALYSIS
  const stockStats = useMemo(() => {
    let totalItems = stoklar.length;
    let totalStockCount = 0;
    let totalValuation = 0;
    let criticalStockCount = 0;
    const itemsList: any[] = [];

    stoklar.forEach(s => {
      totalStockCount += s.quantity;
      const unitVal = stockValuationType === 'purchase' ? s.purchasePrice : s.salesPrice;
      const value = s.quantity * unitVal;
      totalValuation += value;
      
      if (s.quantity <= s.minQuantity) {
        criticalStockCount++;
      }

      itemsList.push({
        ...s,
        valuation: value
      });
    });

    // Sort by valuation descending
    itemsList.sort((a, b) => b.valuation - a.valuation);

    return {
      totalItems,
      totalStockCount,
      totalValuation,
      criticalStockCount,
      itemsList: itemsList.filter(s => 
        s.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
        s.code.toLowerCase().includes(stockSearch.toLowerCase())
      )
    };
  }, [stoklar, stockValuationType, stockSearch]);

  // 4. COMPUTATIONS - CARI ANALYSIS
  const cariStats = useMemo(() => {
    let totalCari = cariler.length;
    let totalReceivables = 0; // Alacaklar (Positive balances)
    let totalPayables = 0; // Borclar (Negative balances)
    const itemsList: any[] = [];

    cariler.forEach(c => {
      const balance = convertAmount(c.balance || 0, c.currency || 'TRY');
      if (balance > 0) {
        totalReceivables += balance;
      } else if (balance < 0) {
        totalPayables += Math.abs(balance);
      }

      itemsList.push({
        ...c,
        convertedBalance: balance
      });
    });

    // Filter list
    const filteredList = itemsList.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(cariSearch.toLowerCase()) || 
                            c.code.toLowerCase().includes(cariSearch.toLowerCase());
      const matchesType = cariTypeFilter === 'all' || 
                          c.type === cariTypeFilter || 
                          (cariTypeFilter === 'customer' && c.type === 'both') || 
                          (cariTypeFilter === 'supplier' && c.type === 'both');
      return matchesSearch && matchesType;
    });

    return {
      totalCari,
      totalReceivables,
      totalPayables,
      itemsList: filteredList.sort((a, b) => Math.abs(b.convertedBalance) - Math.abs(a.convertedBalance))
    };
  }, [cariler, cariSearch, cariTypeFilter, selectedCurrency]);

  // 5. COMPUTATIONS - INCOME-EXPENSE & GRAPH DATA
  const incomeExpenseStats = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    let totalExp = 0;

    filteredExpenses.forEach(exp => {
      const amt = convertAmount(exp.amount, exp.currency);
      const cat = exp.category || 'Diğer';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
      totalExp += amt;
    });

    // Convert to Recharts friendly format
    const categoryData = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: Number(expensesByCategory[key].toFixed(2))
    })).sort((a, b) => b.value - a.value);

    // Group sales and expenses by date for trend lines
    const dateTrendMap: Record<string, { date: string; sales: number; expenses: number; collections: number }> = {};
    
    // Fill with empty days in the date range so we don't have gaps
    const startObj = new Date(resolvedDates.start);
    const endObj = new Date(resolvedDates.end);
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Format to DD.MM for chart X-Axis
      const axisLabel = dateStr.split('-').reverse().slice(0, 2).join('/');
      dateTrendMap[dateStr] = { date: axisLabel, sales: 0, expenses: 0, collections: 0 };
    }

    filteredIslemler.forEach(islem => {
      if (dateTrendMap[islem.date]) {
        const amt = convertAmount(islem.amount, islem.currency, islem.exchangeRate);
        if (islem.type === 'sale') {
          dateTrendMap[islem.date].sales += amt;
        } else if (islem.type === 'collection') {
          dateTrendMap[islem.date].collections += amt;
        }
      }
    });

    filteredExpenses.forEach(exp => {
      if (dateTrendMap[exp.date]) {
        dateTrendMap[exp.date].expenses += convertAmount(exp.amount, exp.currency);
      }
    });

    const trendData = Object.keys(dateTrendMap)
      .sort()
      .map(key => dateTrendMap[key]);

    return {
      categoryData,
      trendData,
      totalExp
    };
  }, [filteredExpenses, filteredIslemler, resolvedDates, selectedCurrency]);

  // COLOR THEMES FOR CHART CELLS
  const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#64748b'];

  // EXCEL DOWNLOAD IMPLEMENTATION
  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (activeTab === 'ozet') {
      // 1. P&L Sheet
      const plData = [
        { 'Finansal Rapor Başlığı': 'Satış Gelirleri', 'Tutar': summaryStats.sales, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Satılan Malın Maliyeti (SMM)', 'Tutar': summaryStats.costOfSales, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Brüt Kar', 'Tutar': summaryStats.grossProfit, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Faaliyet Giderleri (Masraflar)', 'Tutar': summaryStats.totalExpenses, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Personel Maaş Hak Edişleri', 'Tutar': summaryStats.employeeSalaries, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Net Kar / Zarar', 'Tutar': summaryStats.netProfit, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Yapılan Alışlar', 'Tutar': summaryStats.purchases, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Yapılan Tahsilatlar', 'Tutar': summaryStats.collections, 'Döviz': selectedCurrency },
        { 'Finansal Rapor Başlığı': 'Yapılan Ödemeler', 'Tutar': summaryStats.payments, 'Döviz': selectedCurrency }
      ];
      const ws = XLSX.utils.json_to_sheet(plData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Kar-Zarar Tablosu');
    } 
    else if (activeTab === 'stok') {
      // 2. Stock Sheet
      const stockData = stockStats.itemsList.map(item => ({
        'Stok Kodu': item.code,
        'Stok Adı': item.name,
        'Miktar': item.quantity,
        'Birim': item.unit,
        'Alış Fiyatı': item.purchasePrice,
        'Satış Fiyatı': item.salesPrice,
        'Stok Değeri': item.valuation,
        'Kritik Seviye': item.minQuantity
      }));
      const ws = XLSX.utils.json_to_sheet(stockData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Stok Durum Raporu');
    } 
    else if (activeTab === 'cari') {
      // 3. Cari Sheet
      const cariData = cariStats.itemsList.map(item => ({
        'Cari Kodu': item.code,
        'Cari Adı': item.name,
        'Cari Tipi': item.type === 'customer' ? 'Müşteri' : item.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi',
        'Telefon': item.phone || '-',
        'E-posta': item.email || '-',
        'Bakiye (Orijinal)': item.balance,
        'Orijinal Döviz': item.currency || 'TRY',
        'Bakiye Rapor Para Birimi': item.convertedBalance
      }));
      const ws = XLSX.utils.json_to_sheet(cariData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Cari Bakiye Analizi');
    } 
    else if (activeTab === 'gelirgider') {
      // 4. Expense Sheet
      const expenseData = filteredExpenses.map(item => ({
        'Tarih': item.date,
        'Başlık': item.title,
        'Kategori': item.category,
        'Ödeme Hesabı': item.account === 'cash' ? 'Kasa' : item.account === 'pos' ? 'POS' : 'Banka',
        'Tutar': item.amount,
        'Döviz': item.currency,
        'Açıklama': item.description || ''
      }));
      const ws = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Gider-Masraf Listesi');
    }
    else if (activeTab === 'kdvkarzarar') {
      const kdvData = [
        { 'Rapor Kalemi': 'Satışlar KDV %20 Matrah', 'Tutar': kdvStats.salesBase20 },
        { 'Rapor Kalemi': 'Satışlar KDV %20 Tutar', 'Tutar': kdvStats.salesKdv20 },
        { 'Rapor Kalemi': 'Satışlar KDV %10 Matrah', 'Tutar': kdvStats.salesBase10 },
        { 'Rapor Kalemi': 'Satışlar KDV %10 Tutar', 'Tutar': kdvStats.salesKdv10 },
        { 'Rapor Kalemi': 'Satışlar KDV %1 Matrah', 'Tutar': kdvStats.salesBase1 },
        { 'Rapor Kalemi': 'Satışlar KDV %1 Tutar', 'Tutar': kdvStats.salesKdv1 },
        { 'Rapor Kalemi': 'Satışlar Diğer KDV Matrah', 'Tutar': kdvStats.salesBaseOther },
        { 'Rapor Kalemi': 'Satışlar Diğer KDV Tutar', 'Tutar': kdvStats.salesKdvOther },
        { 'Rapor Kalemi': 'TOPLAM HESAPLANAN KDV', 'Tutar': kdvStats.salesKdvTotal },
        { 'Rapor Kalemi': 'Alışlar KDV %20 Matrah', 'Tutar': kdvStats.purchaseBase20 },
        { 'Rapor Kalemi': 'Alışlar KDV %20 Tutar', 'Tutar': kdvStats.purchaseKdv20 },
        { 'Rapor Kalemi': 'Alışlar KDV %10 Matrah', 'Tutar': kdvStats.purchaseBase10 },
        { 'Rapor Kalemi': 'Alışlar KDV %10 Tutar', 'Tutar': kdvStats.purchaseKdv10 },
        { 'Rapor Kalemi': 'Alışlar KDV %1 Matrah', 'Tutar': kdvStats.purchaseBase1 },
        { 'Rapor Kalemi': 'Alışlar KDV %1 Tutar', 'Tutar': kdvStats.purchaseKdv1 },
        { 'Rapor Kalemi': 'Alışlar Diğer KDV Matrah', 'Tutar': kdvStats.purchaseBaseOther },
        { 'Rapor Kalemi': 'Alışlar Diğer KDV Tutar', 'Tutar': kdvStats.purchaseKdvOther },
        { 'Rapor Kalemi': 'TOPLAM INDIRILECEK KDV', 'Tutar': kdvStats.purchaseKdvTotal },
        { 'Rapor Kalemi': 'NET KDV FARKI (Ödenecek / Devreden)', 'Tutar': kdvStats.netKdvDifference },
        { 'Rapor Kalemi': 'NET ODENECEK KDV', 'Tutar': kdvStats.payableKdv },
        { 'Rapor Kalemi': 'NET DEVREDEN KDV', 'Tutar': kdvStats.devredenKdv }
      ];
      const ws = XLSX.utils.json_to_sheet(kdvData);
      XLSX.utils.book_append_sheet(workbook, ws, 'KDV Ozeti');
    }
    else if (activeTab === 'cariekstre') {
      if (!selectedCari) {
        alert('Lütfen önce bir cari hesap seçiniz.');
        return;
      }
      const ekstreData = [
        { 'Tarih': resolvedDates.start, 'İşlem Türü': 'DEVİR', 'Borç (+)': 0, 'Alacak (-)': 0, 'Bakiye': cariEkstreStats.priorBalance },
        ...cariEkstreStats.periodTransactions.map(t => ({
          'Tarih': t.date,
          'İşlem Türü': t.type === 'sale' ? 'Satış' : t.type === 'purchase' ? 'Alış' : t.type === 'collection' ? 'Tahsilat' : t.type === 'payment' ? 'Ödeme' : t.type === 'sale_return' ? 'Satış İade' : 'Alış İade',
          'Fatura / İşlem No': t.invoiceNo || '-',
          'Borç (+)': t.borc,
          'Alacak (-)': t.alacak,
          'Bakiye': t.runningBalance
        }))
      ];
      const ws = XLSX.utils.json_to_sheet(ekstreData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Cari Hesap Ekstresi');
    }

    // Save File
    XLSX.writeFile(workbook, `Storm_Muhasebe_Raporu_${activeTab}_${resolvedDates.start}_to_${resolvedDates.end}.xlsx`);
  };

  // PDF DOWNLOAD IMPLEMENTATION (CLEAN & PURE CLIENT-SIDE WITHOUT LIBS ERRORS)
  const downloadPDF = () => {
    if (activeTab === 'kdvkarzarar') {
      downloadKdvPdf();
      return;
    }
    if (activeTab === 'cariekstre') {
      downloadCariEkstrePDF();
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Theme configuration for PDF drawing
    const primaryColor = [225, 29, 72]; // Rose-600 #e11d48
    const darkGray = [30, 41, 59]; // Slate-800
    const lightGray = [241, 245, 249]; // Slate-100

    // Header drawing helper
    const drawHeader = (title: string) => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, 10, 190, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(turkishToPdf('STORM ON MUHASEBE - FINANSAL BI RAPORU'), 15, 15.5);

      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(14);
      doc.text(turkishToPdf(title.toUpperCase()), 10, 26);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(turkishToPdf(`Rapor Araligi: ${resolvedDates.start} / ${resolvedDates.end}`), 10, 31);
      doc.text(turkishToPdf(`Rapor Doviz Cinsi: ${selectedCurrency}`), 10, 35);
      doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 150, 31);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(10, 38, 200, 38);
    };

    // Draw Footer helper
    const drawFooter = (page: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(10, 280, 200, 280);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(turkishToPdf('Bu rapor Storm On Muhasebe programi tarafindan otomatik olarak uretilmistir.'), 10, 284);
      doc.text(turkishToPdf(`Sayfa ${page}`), 190, 284);
    };

    if (activeTab === 'ozet') {
      drawHeader('KAR-ZARAR VE GENEL FINANSAL OZET RAPORU');
      
      // Let's draw table manually for total P&L
      const rows = [
        ['Satış Gelirleri', formatMoney(summaryStats.sales)],
        ['Satılan Malın Maliyeti (SMM)', formatMoney(summaryStats.costOfSales)],
        ['Brüt Kar', formatMoney(summaryStats.grossProfit)],
        ['Faaliyet Giderleri (Masraflar)', formatMoney(summaryStats.totalExpenses)],
        ['Personel Maaşları Gideri', formatMoney(summaryStats.employeeSalaries)],
        ['Net Dönem Karı / Zararı', formatMoney(summaryStats.netProfit)],
        ['Diğer Finansal Hareket Özetleri', ''],
        ['Gerçekleşen Alışlar', formatMoney(summaryStats.purchases)],
        ['Gerçekleşen Cari Tahsilatlar', formatMoney(summaryStats.collections)],
        ['Gerçekleşen Cari Ödemeler', formatMoney(summaryStats.payments)]
      ];

      let y = 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      
      // Table Header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 8, 'F');
      doc.text(turkishToPdf('Kalem / Finansal Hareket Tipi'), 15, y + 5.5);
      doc.text(turkishToPdf('Tutar (' + selectedCurrency + ')'), 150, y + 5.5);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      rows.forEach((row, idx) => {
        // Zebra striping
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 7.5, 'F');
        }

        const isSubHeader = row[1] === '';
        const isHighlight = row[0] === 'Net Dönem Karı / Zararı';

        if (isSubHeader) {
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(241, 245, 249);
          doc.rect(10, y, 190, 7.5, 'F');
          doc.text(turkishToPdf(row[0]), 15, y + 5);
        } else {
          if (isHighlight) {
            doc.setFont('helvetica', 'bold');
            if (summaryStats.netProfit >= 0) {
              doc.setTextColor(16, 185, 129); // Green
            } else {
              doc.setTextColor(225, 29, 72); // Rose/Red
            }
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          }
          doc.text(turkishToPdf(row[0]), 15, y + 5);
          doc.text(turkishToPdf(row[1]), 150, y + 5);
        }

        y += 7.5;
      });

      drawFooter(1);
    } 
    else if (activeTab === 'stok') {
      drawHeader('STOK DURUM VE ENVANTER RAPORU');

      let y = 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // Table Header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 8, 'F');
      doc.text(turkishToPdf('Kod'), 12, y + 5.5);
      doc.text(turkishToPdf('Stok Adi'), 35, y + 5.5);
      doc.text(turkishToPdf('Miktar'), 95, y + 5.5);
      doc.text(turkishToPdf('Alis F.'), 120, y + 5.5);
      doc.text(turkishToPdf('Satis F.'), 145, y + 5.5);
      doc.text(turkishToPdf('Stok Degeri'), 170, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      let totalVal = 0;
      let totalQty = 0;

      stockStats.itemsList.slice(0, 25).forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 7, 'F');
        }

        doc.text(turkishToPdf(item.code || ''), 12, y + 4.5);
        doc.text(turkishToPdf(item.name.substring(0, 30)), 35, y + 4.5);
        doc.text(turkishToPdf(`${item.quantity} ${item.unit}`), 95, y + 4.5);
        doc.text(turkishToPdf(formatMoney(item.purchasePrice)), 120, y + 4.5);
        doc.text(turkishToPdf(formatMoney(item.salesPrice)), 145, y + 4.5);
        doc.text(turkishToPdf(formatMoney(item.valuation)), 170, y + 4.5);

        totalVal += item.valuation;
        totalQty += item.quantity;
        y += 7;
      });

      // Totals
      doc.line(10, y + 1, 200, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishToPdf('Toplam Envanter Miktari ve Degeri:'), 35, y + 6);
      doc.text(turkishToPdf(`${totalQty} adet`), 95, y + 6);
      doc.text(turkishToPdf(formatMoney(totalVal)), 170, y + 6);

      drawFooter(1);
    } 
    else if (activeTab === 'cari') {
      drawHeader('CARI HESAP HAREKET VE BAKIYE ANALIZI');

      let y = 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // Table Header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 8, 'F');
      doc.text(turkishToPdf('Cari Kod'), 12, y + 5.5);
      doc.text(turkishToPdf('Cari Unvan / Ad'), 40, y + 5.5);
      doc.text(turkishToPdf('Telefon'), 115, y + 5.5);
      doc.text(turkishToPdf('Bakiye'), 155, y + 5.5);
      doc.text(turkishToPdf('Doviz'), 185, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      cariStats.itemsList.slice(0, 25).forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 7, 'F');
        }

        doc.text(turkishToPdf(item.code || ''), 12, y + 4.5);
        doc.text(turkishToPdf(item.name.substring(0, 32)), 40, y + 4.5);
        doc.text(turkishToPdf(item.phone || '-'), 115, y + 4.5);
        
        const bal = item.convertedBalance;
        if (bal > 0) {
          doc.setTextColor(16, 185, 129); // Receives (customer owes)
        } else if (bal < 0) {
          doc.setTextColor(225, 29, 72); // Payables
        } else {
          doc.setTextColor(100, 116, 139);
        }
        
        doc.text(turkishToPdf(formatMoney(bal)), 155, y + 4.5);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(turkishToPdf(item.currency || 'TRY'), 185, y + 4.5);

        y += 7;
      });

      // Summary lines
      doc.line(10, y + 1, 200, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishToPdf('Toplam Cari Alacaklarimiz:'), 40, y + 6);
      doc.setTextColor(16, 185, 129);
      doc.text(turkishToPdf(formatMoney(cariStats.totalReceivables)), 155, y + 6);

      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(turkishToPdf('Toplam Borclarimiz:'), 40, y + 11);
      doc.setTextColor(225, 29, 72);
      doc.text(turkishToPdf(formatMoney(cariStats.totalPayables)), 155, y + 11);

      drawFooter(1);
    } 
    else if (activeTab === 'gelirgider') {
      drawHeader('GIDER VE MASRAF RAPORU');

      let y = 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // Table Header
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(10, y, 190, 8, 'F');
      doc.text(turkishToPdf('Tarih'), 12, y + 5.5);
      doc.text(turkishToPdf('Gider / Masraf Basligi'), 35, y + 5.5);
      doc.text(turkishToPdf('Kategori'), 100, y + 5.5);
      doc.text(turkishToPdf('Odeme Tipi'), 145, y + 5.5);
      doc.text(turkishToPdf('Tutar'), 175, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      filteredExpenses.slice(0, 25).forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(10, y, 190, 7, 'F');
        }

        doc.text(turkishToPdf(item.date), 12, y + 4.5);
        doc.text(turkishToPdf(item.title.substring(0, 30)), 35, y + 4.5);
        doc.text(turkishToPdf(item.category || 'Diger'), 100, y + 4.5);
        doc.text(turkishToPdf(item.account === 'cash' ? 'Kasa' : item.account === 'pos' ? 'POS' : 'Banka'), 145, y + 4.5);
        doc.text(turkishToPdf(formatMoney(item.amount, item.currency)), 175, y + 4.5);

        y += 7;
      });

      doc.line(10, y + 1, 200, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishToPdf('Toplam Gider ve Masraf Tutari:'), 100, y + 6);
      doc.text(turkishToPdf(formatMoney(incomeExpenseStats.totalExp)), 175, y + 6);

      drawFooter(1);
    }

    doc.save(`Storm_Muhasebe_Raporu_${activeTab}_${resolvedDates.start}_to_${resolvedDates.end}.pdf`);
  };

  const exportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Cariler Sheet
    const carilerData = cariler.map(c => ({
      'Cari Kod': c.code || '',
      'Cari Unvan / Ad': c.name || '',
      'Cari Tipi': c.type === 'customer' ? 'Müşteri' : c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri+Tedarikçi',
      'Telefon': c.phone || '-',
      'E-posta': c.email || '-',
      'Bakiye': c.balance || 0,
      'Para Birimi': c.currency || 'TRY',
      'Durum': c.isActive !== false ? 'Aktif' : 'Pasif'
    }));
    const wsCariler = XLSX.utils.json_to_sheet(carilerData);
    XLSX.utils.book_append_sheet(workbook, wsCariler, 'Cari Hesaplar');

    // 2. Stoklar Sheet
    const stoklarData = stoklar.map(s => ({
      'Stok Kodu': s.code || '',
      'Ürün / Hizmet Adı': s.name || '',
      'Kategori': s.category || '',
      'Marka / Üretici': s.brand || '',
      'Miktar': s.quantity || 0,
      'Birim': s.unit || 'Adet',
      'Alış Fiyatı (KDV Hariç)': s.purchasePrice || 0,
      'Satış Fiyatı (KDV Hariç)': s.salesPrice || 0,
      'KDV Oranı (%)': s.taxRate || 0,
      'Kritik Seviye': s.minQuantity || 0
    }));
    const wsStoklar = XLSX.utils.json_to_sheet(stoklarData);
    XLSX.utils.book_append_sheet(workbook, wsStoklar, 'Stok Envanteri');

    // 3. Islemler (Faturalar) Sheet
    const islemlerData = islemler.map(i => {
      const itemsDetail = i.items?.map(it => `${it.quantity} ${it.unit} x ${it.price} (${it.taxRate}% KDV)`).join(' | ') || '';
      return {
        'Fatura / İşlem No': i.invoiceNo || '-',
        'Tarih': i.date || '',
        'Cari Adı': i.cariName || '',
        'İşlem Tipi': i.type === 'sale' ? 'Satış' : i.type === 'purchase' ? 'Alış' : i.type === 'collection' ? 'Tahsilat' : i.type === 'payment' ? 'Ödeme' : i.type === 'sale_return' ? 'Satış İade' : 'Alış İade',
        'Tutar': i.amount || 0,
        'Döviz': i.currency || 'TRY',
        'Hesap': i.account === 'cash' ? 'Kasa' : i.account === 'bank' ? 'Banka' : i.account === 'pos' ? 'POS' : 'Açık Hesap',
        'Açıklama': i.description || '',
        'Ürün Detayları': itemsDetail
      };
    });
    const wsIslemler = XLSX.utils.json_to_sheet(islemlerData);
    XLSX.utils.book_append_sheet(workbook, wsIslemler, 'Faturalar ve İşlemler');

    // 4. Masraflar Sheet
    const masraflarData = expenses.map(e => ({
      'Tarih': e.date || '',
      'Açıklama / Başlık': e.title || '',
      'Kategori': e.category || 'Diğer',
      'Tutar': e.amount || 0,
      'Para Birimi': e.currency || 'TRY',
      'Ödeme Hesabı': e.account === 'cash' ? 'Kasa' : e.account === 'pos' ? 'POS' : 'Banka',
      'Detay': e.description || ''
    }));
    const wsMasraflar = XLSX.utils.json_to_sheet(masraflarData);
    XLSX.utils.book_append_sheet(workbook, wsMasraflar, 'Masraflar ve Giderler');

    XLSX.writeFile(workbook, `Storm_On_Muhasebe_Yedek_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadCariEkstrePDF = () => {
    if (!selectedCari) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [20, 184, 166]; // Teal-500
    const darkGray = [30, 41, 59]; // Slate-800
    const lightGray = [241, 245, 249]; // Slate-100

    // Header drawing
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(turkishToPdf('STORM ON MUHASEBE - CARI HESAP EKSTRESI'), 15, 15.5);

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(14);
    doc.text(turkishToPdf('CARI HESAP EKSTRESI (HESAP DOKUMU)'), 10, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(turkishToPdf(`Cari Unvan: ${selectedCari.name}`), 10, 32);
    doc.text(turkishToPdf(`Cari Kod: ${selectedCari.code || '-'}`), 10, 36);
    doc.text(turkishToPdf(`Telefon: ${selectedCari.phone || '-'}`), 10, 40);
    doc.text(turkishToPdf(`E-posta: ${selectedCari.email || '-'}`), 10, 44);

    doc.text(turkishToPdf(`Rapor Donemi: ${resolvedDates.start} / ${resolvedDates.end}`), 120, 32);
    doc.text(turkishToPdf(`Cari Para Birimi: ${selectedCari.currency || 'TRY'}`), 120, 36);
    doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 120, 40);

    doc.line(10, 48, 200, 48);

    // Summary Boxes
    let y = 54;
    doc.setFillColor(248, 250, 252);
    doc.rect(10, y, 190, 15, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, y, 190, 15, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(turkishToPdf('ONCEKI DEVIR'), 15, y + 5);
    doc.text(turkishToPdf('TOPLAM BORC (+)'), 65, y + 5);
    doc.text(turkishToPdf('TOPLAM ALACAK (-)'), 115, y + 5);
    doc.text(turkishToPdf('GUNCEL BAKIYE'), 165, y + 5);

    let periodBorc = 0;
    let periodAlacak = 0;
    cariEkstreStats.periodTransactions.forEach(t => {
      periodBorc += t.borc;
      periodAlacak += t.alacak;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const currSym = selectedCari.currency || 'TRY';
    doc.text(turkishToPdf(formatMoney(cariEkstreStats.priorBalance, currSym)), 15, y + 10);
    doc.text(turkishToPdf(formatMoney(periodBorc, currSym)), 65, y + 10);
    doc.text(turkishToPdf(formatMoney(periodAlacak, currSym)), 115, y + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text(turkishToPdf(formatMoney(cariEkstreStats.finalBalance, currSym)), 165, y + 10);

    y += 22;

    // Table Header
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 8, 'F');
    doc.text(turkishToPdf('Tarih'), 12, y + 5.5);
    doc.text(turkishToPdf('Islem Turu / No'), 32, y + 5.5);
    doc.text(turkishToPdf('Aciklama'), 82, y + 5.5);
    doc.text(turkishToPdf('Borc (+)'), 132, y + 5.5);
    doc.text(turkishToPdf('Alacak (-)'), 157, y + 5.5);
    doc.text(turkishToPdf('Bakiye'), 182, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Initial Row: Devir
    doc.setFillColor(252, 252, 252);
    doc.rect(10, y, 190, 7, 'F');
    doc.text(turkishToPdf(resolvedDates.start), 12, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.text(turkishToPdf('DONEM BASI DEVIR BAKILESI'), 32, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text('-', 132, y + 4.5);
    doc.text('-', 157, y + 4.5);
    doc.text(turkishToPdf(formatMoney(cariEkstreStats.priorBalance, currSym)), 182, y + 4.5);
    y += 7;

    // Transactions loop
    cariEkstreStats.periodTransactions.forEach((t, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 190, 7, 'F');
      }

      const typeLabel = t.type === 'sale' ? 'Satis' : t.type === 'purchase' ? 'Alis' : t.type === 'collection' ? 'Tahsilat' : t.type === 'payment' ? 'Odeme' : t.type === 'sale_return' ? 'Satis Iade' : 'Alis Iade';
      const docNo = t.invoiceNo ? ` (${t.invoiceNo})` : '';

      doc.text(turkishToPdf(t.date), 12, y + 4.5);
      doc.text(turkishToPdf(typeLabel + docNo), 32, y + 4.5);
      doc.text(turkishToPdf((t.description || '').substring(0, 30)), 82, y + 4.5);
      
      doc.text(t.borc > 0 ? turkishToPdf(formatMoney(t.borc, currSym)) : '-', 132, y + 4.5);
      doc.text(t.alacak > 0 ? turkishToPdf(formatMoney(t.alacak, currSym)) : '-', 157, y + 4.5);
      doc.text(turkishToPdf(formatMoney(t.runningBalance, currSym)), 182, y + 4.5);

      y += 7;
    });

    // Footer lines
    doc.line(10, 280, 200, 280);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(turkishToPdf('Isbu hesap dokumu mutabakat amacli olup Storm tarafindan uretilmistir. 7 gun icinde itiraz edilmeyen ekstreler kabul edilmis sayilir.'), 10, 284);
    
    doc.save(`Ekstre_${selectedCari.name.replace(/\s+/g, '_')}_${resolvedDates.start}_${resolvedDates.end}.pdf`);
  };

  const downloadKdvPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [79, 70, 229]; // Indigo-600
    const darkGray = [30, 41, 59]; // Slate-800
    const lightGray = [241, 245, 249]; // Slate-100

    // Header drawing
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(turkishToPdf('STORM ON MUHASEBE - KDV VE KAR-ZARAR RAPORU'), 15, 15.5);

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(14);
    doc.text(turkishToPdf('KDV VE DETAYLI KAR-ZARAR RAPORU'), 10, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(turkishToPdf(`Rapor Araligi: ${resolvedDates.start} / ${resolvedDates.end}`), 10, 32);
    doc.text(turkishToPdf(`Rapor Doviz Cinsi: ${selectedCurrency}`), 10, 36);
    doc.text(turkishToPdf(`Olusturma Tarihi: ${new Date().toLocaleString()}`), 140, 32);
    
    doc.line(10, 40, 200, 40);

    let y = 46;

    // SECTION 1: KDV RAPORU
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(turkishToPdf('1. KDV OZET TABLOSU'), 10, y);
    y += 5;

    const kdvRows = [
      ['Satışlar Hesaplanan KDV (%20)', formatMoney(kdvStats.salesKdv20)],
      ['Satışlar Hesaplanan KDV (%10)', formatMoney(kdvStats.salesKdv10)],
      ['Satışlar Hesaplanan KDV (%1)', formatMoney(kdvStats.salesKdv1)],
      ['Satışlar Hesaplanan KDV (Diğer)', formatMoney(kdvStats.salesKdvOther)],
      ['TOPLAM HESAPLANAN KDV', formatMoney(kdvStats.salesKdvTotal)],
      ['Alışlar İndirilecek KDV (%20)', formatMoney(kdvStats.purchaseKdv20)],
      ['Alışlar İndirilecek KDV (%10)', formatMoney(kdvStats.purchaseKdv10)],
      ['Alışlar İndirilecek KDV (%1)', formatMoney(kdvStats.purchaseKdv1)],
      ['Alışlar İndirilecek KDV (Diğer)', formatMoney(kdvStats.purchaseKdvOther)],
      ['TOPLAM INDIRILECEK KDV', formatMoney(kdvStats.purchaseKdvTotal)],
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 7, 'F');
    doc.text(turkishToPdf('KDV Kalemi'), 15, y + 4.5);
    doc.text(turkishToPdf('Tutar (' + selectedCurrency + ')'), 150, y + 4.5);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    kdvRows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 190, 6.5, 'F');
      }

      const isHighlight = row[0].includes('TOPLAM');
      if (isHighlight) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      doc.text(turkishToPdf(row[0]), 15, y + 4.5);
      doc.text(turkishToPdf(row[1]), 150, y + 4.5);
      y += 6.5;
    });

    y += 2;
    doc.setFillColor(241, 245, 249);
    doc.rect(10, y, 190, 9, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, y, 190, 9, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (kdvStats.netKdvDifference > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(turkishToPdf(`NET ODENECEK KDV: ${formatMoney(kdvStats.payableKdv)}`), 15, y + 6);
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text(turkishToPdf(`SONRAKI DONEME DEVREDEN KDV: ${formatMoney(kdvStats.devredenKdv)}`), 15, y + 6);
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    y += 15;

    // SECTION 2: KAR-ZARAR ANALIZI
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(turkishToPdf('2. DETAYLI KAR-ZARAR TABLOSU (KDV HARIC)'), 10, y);
    y += 5;

    const salesExVat = summaryStats.sales - kdvStats.salesKdvTotal;
    const costExVat = summaryStats.costOfSales - kdvStats.purchaseKdvTotal;
    const grossProfitExVat = salesExVat - costExVat;
    const netProfitExVat = grossProfitExVat - summaryStats.totalExpenses - summaryStats.employeeSalaries;

    const plRows = [
      ['Brüt Satış Gelirleri (KDV Hariç)', formatMoney(salesExVat)],
      ['Satılan Malın Maliyeti (SMM) (KDV Hariç)', formatMoney(costExVat)],
      ['BRUT FAALIYET KARI / ZARARI', formatMoney(grossProfitExVat)],
      ['Genel Yönetim ve Faaliyet Giderleri (-)', formatMoney(summaryStats.totalExpenses)],
      ['Personel ve İşçilik Giderleri (-)', formatMoney(summaryStats.employeeSalaries)],
      ['NET FAALIYET KARI / ZARARI (VERGI ONCESI)', formatMoney(netProfitExVat)],
    ];

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 7, 'F');
    doc.text(turkishToPdf('Gelir / Gider Kalemi'), 15, y + 4.5);
    doc.text(turkishToPdf('Tutar (' + selectedCurrency + ')'), 150, y + 4.5);
    y += 7;

    plRows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, y, 190, 6.5, 'F');
      }

      const isHighlight = row[0].includes('KARI') || row[0].includes('ZARARI');
      if (isHighlight) {
        doc.setFont('helvetica', 'bold');
        if (row[0].includes('NET')) {
          doc.setFillColor(241, 245, 249);
          doc.rect(10, y, 190, 6.5, 'F');
          if (netProfitExVat >= 0) {
            doc.setTextColor(5, 150, 105);
          } else {
            doc.setTextColor(220, 38, 38);
          }
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      }

      doc.text(turkishToPdf(row[0]), 15, y + 4.5);
      doc.text(turkishToPdf(row[1]), 150, y + 4.5);
      y += 6.5;
    });

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    y += 12;

    doc.line(10, 280, 200, 280);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(turkishToPdf('Bu finansal rapor Storm On Muhasebe sistemi tarafindan uretilmistir. Resmi beyanname niteligi tasimaz.'), 10, 284);
    
    doc.save(`KDV_ve_KarZarar_Raporu_${resolvedDates.start}_to_${resolvedDates.end}.pdf`);
  };

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
        <div className="space-y-6 animate-fade-in">
          {/* STATS BENTO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales */}
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Toplam Satış Gelirleri</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.sales)}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Faturalı ve peşin mal/hizmet satışları</p>
              </div>
            </div>

            {/* SMM */}
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Satılan Malın Maliyeti (SMM)</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Layers size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.costOfSales)}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Stok alış fiyatı veya tahmini maliyet</p>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Toplam Genel Giderler</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <TrendingDown size={16} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white font-mono">{formatMoney(summaryStats.totalExpenses + summaryStats.employeeSalaries)}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">Masraflar + personel maaş hak edişleri</p>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`border p-5 rounded-2xl flex flex-col justify-between transition ${
              summaryStats.netProfit >= 0 
                ? 'bg-teal-950/20 border-teal-500/20 text-teal-400' 
                : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Net Dönem Kar / Zararı</span>
                <div className={`p-2 rounded-xl ${
                  summaryStats.netProfit >= 0 ? 'bg-teal-500/10' : 'bg-rose-500/10'
                }`}>
                  {summaryStats.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold font-mono">{formatMoney(summaryStats.netProfit)}</h3>
                <p className="text-[10px] opacity-70 mt-1">Net gelirler ile tüm giderlerin farkı</p>
              </div>
            </div>
          </div>

          {/* NET INCOME TREND AND PROFITABILITY ANALYZER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-950/50 border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Günlük Satış & Gider Trendi</h3>
                <span className="text-[10px] text-zinc-400">Raporlanan dönemin finansal eğrisi</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeExpenseStats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" name="Satış Geliri" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" name="Giderler" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FINANCIAL STATEMENTS BREAKDOWN */}
            <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Mali Özet Tablosu</h3>
              <div className="space-y-3.5 flex-1">
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-zinc-400">Satış Gelirleri (+)</span>
                  <span className="text-emerald-400 font-mono font-semibold">{formatMoney(summaryStats.sales)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-zinc-400">Satılan Malın Maliyeti (-)</span>
                  <span className="text-amber-500 font-mono">{formatMoney(summaryStats.costOfSales)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5 font-semibold">
                  <span className="text-zinc-200">Brüt Kar / Zarar (=)</span>
                  <span className="text-white font-mono">{formatMoney(summaryStats.grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-zinc-400">Genel Giderler / Masraflar (-)</span>
                  <span className="text-rose-400 font-mono">{formatMoney(summaryStats.totalExpenses)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-zinc-400">Personel Maaş Hak Edişleri (-)</span>
                  <span className="text-rose-400 font-mono">{formatMoney(summaryStats.employeeSalaries)}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-t border-white/10 font-bold">
                  <span className="text-zinc-200">Net Dönem Karı (=)</span>
                  <span className={summaryStats.netProfit >= 0 ? 'text-teal-400 font-mono' : 'text-rose-400 font-mono'}>
                    {formatMoney(summaryStats.netProfit)}
                  </span>
                </div>
              </div>

              {/* CASHFLOW SUMS */}
              <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Diğer Finansal Akışlar</div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Yapılan Cari Alışlar</span>
                  <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.purchases)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Gerçekleşen Tahsilatlar</span>
                  <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.collections)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Yapılan Ödemeler</span>
                  <span className="text-zinc-200 font-mono">{formatMoney(summaryStats.payments)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: STOK ENVANTER ANALİZİ */}
      {activeTab === 'stok' && (
        <div className="space-y-6 animate-fade-in">
          {/* STOK METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Farklı Ürün Tipi</span>
              <h3 className="text-xl font-bold text-white font-mono mt-2">{stockStats.totalItems}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Sistemdeki toplam kayıtlı stok kalemi</p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Stok Adet / Miktar</span>
              <h3 className="text-xl font-bold text-white font-mono mt-2">{stockStats.totalStockCount}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Depodaki tüm ürünlerin toplam adetleri</p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Envanter Değeri</span>
              <h3 className="text-xl font-bold text-teal-400 font-mono mt-2">{formatMoney(stockStats.totalValuation)}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Değerleme Tipi: {stockValuationType === 'purchase' ? 'Alış Fiyatı' : 'Satış Fiyatı'}
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Kritik Stok Uyarıları</span>
                {stockStats.criticalStockCount > 0 && <AlertTriangle size={16} className="text-amber-500" />}
              </div>
              <h3 className={`text-xl font-bold mt-2 font-mono ${stockStats.criticalStockCount > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                {stockStats.criticalStockCount}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Minimum stok miktarının altına düşen ürün sayısı</p>
            </div>
          </div>

          {/* STOCK SUB-FILTERING BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 w-full sm:max-w-xs">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Stok adı veya kodu ara..."
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 border-none outline-none focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-400">Envanter Değerleme Tipi:</span>
              <div className="flex bg-[#121316] border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setStockValuationType('purchase')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    stockValuationType === 'purchase' 
                      ? 'bg-teal-500 text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Alış Fiyatı
                </button>
                <button
                  onClick={() => setStockValuationType('sales')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    stockValuationType === 'sales' 
                      ? 'bg-teal-500 text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Satış Fiyatı
                </button>
              </div>
            </div>
          </div>

          {/* STOCK VALUATION TABLE */}
          <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Detaylı Stok Değerleme Listesi</h3>
              <span className="text-[10px] text-zinc-400">Toplam envanter payına göre sıralıdır</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Stok Kodu</th>
                    <th className="px-5 py-3">Stok Adı</th>
                    <th className="px-5 py-3 text-right">Miktar / Birim</th>
                    <th className="px-5 py-3 text-right">Alış Fiyatı</th>
                    <th className="px-5 py-3 text-right">Satış Fiyatı</th>
                    <th className="px-5 py-3 text-right">Stok Envanter Değeri</th>
                    <th className="px-5 py-3 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {stockStats.itemsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 font-sans">
                        Aranan kriterlere uygun stok bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    stockStats.itemsList.map(item => {
                      const isKritik = item.quantity <= item.minQuantity;
                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 text-zinc-400 font-semibold">{item.code}</td>
                          <td className="px-5 py-3 text-white font-sans font-medium">{item.name}</td>
                          <td className="px-5 py-3 text-right text-white font-semibold">{item.quantity} {item.unit}</td>
                          <td className="px-5 py-3 text-right">{formatMoney(item.purchasePrice)}</td>
                          <td className="px-5 py-3 text-right">{formatMoney(item.salesPrice)}</td>
                          <td className="px-5 py-3 text-right text-teal-400 font-bold">{formatMoney(item.valuation)}</td>
                          <td className="px-5 py-3 text-center font-sans">
                            {isKritik ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-semibold border border-amber-500/20">
                                Kritik Seviye ({item.minQuantity})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold border border-emerald-500/20">
                                Yeterli
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CARİ HESAP BAKİYELERİ ANALİZİ */}
      {activeTab === 'cari' && (
        <div className="space-y-6 animate-fade-in">
          {/* CARI SUMMARY TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Kayıtlı Cari Hesap</span>
              <h3 className="text-xl font-bold text-white font-mono mt-2">{cariStats.totalCari}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Sistemdeki toplam müşteri ve tedarikçiler</p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Cari Alacaklarımız (Müşteriler)</span>
              <h3 className="text-xl font-bold text-emerald-400 font-mono mt-2">{formatMoney(cariStats.totalReceivables)}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Bize borcu olan cari kartların toplam bakiyesi</p>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
              <span className="text-xs text-zinc-400 font-medium">Toplam Cari Borçlarımız (Tedarikçiler)</span>
              <h3 className="text-xl font-bold text-rose-400 font-mono mt-2">{formatMoney(cariStats.totalPayables)}</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Bizim ödememiz gereken tedarikçi bakiyeleri</p>
            </div>
          </div>

          {/* CARI FILTERS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 w-full sm:max-w-xs">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                value={cariSearch}
                onChange={(e) => setCariSearch(e.target.value)}
                placeholder="Cari adı veya kodu ara..."
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 border-none outline-none focus:ring-0"
              />
            </div>

            <div className="flex bg-[#121316] border border-white/10 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setCariTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  cariTypeFilter === 'all' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setCariTypeFilter('customer')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  cariTypeFilter === 'customer' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Müşteriler
              </button>
              <button
                onClick={() => setCariTypeFilter('supplier')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  cariTypeFilter === 'supplier' ? 'bg-teal-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tedarikçiler
              </button>
            </div>
          </div>

          {/* CARI BALANCES TABLE */}
          <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cari Bakiyeleri Sıralı Listesi</h3>
              <span className="text-[10px] text-zinc-400">Bakiye büyüklüğüne göre sıralıdır</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Cari Kod</th>
                    <th className="px-5 py-3">Cari Ünvan</th>
                    <th className="px-5 py-3">Kart Tipi</th>
                    <th className="px-5 py-3">Telefon</th>
                    <th className="px-5 py-3 text-right">Bakiye (Orijinal)</th>
                    <th className="px-5 py-3 text-right">Rapor Bakiyesi ({selectedCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {cariStats.itemsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 font-sans">
                        Filtrelere uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    cariStats.itemsList.map(item => {
                      const bal = item.convertedBalance;
                      return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 text-zinc-400 font-semibold">{item.code}</td>
                          <td className="px-5 py-3 text-white font-sans font-medium">{item.name}</td>
                          <td className="px-5 py-3 font-sans">
                            {item.type === 'customer' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Müşteri</span>
                            ) : item.type === 'supplier' ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">Tedarikçi</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20">Müşteri+Tedarikçi</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-zinc-400 font-sans">{item.phone || '-'}</td>
                          <td className="px-5 py-3 text-right font-semibold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: item.currency || 'TRY' }).format(item.balance)}
                          </td>
                          <td className={`px-5 py-3 text-right text-sm font-bold ${
                            bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-rose-400' : 'text-zinc-500'
                          }`}>
                            {formatMoney(bal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GELİR-GİDER & MASRAF ANALİZİ */}
      {activeTab === 'gelirgider' && (
        <div className="space-y-6 animate-fade-in">
          {/* EXPENSE SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* EXPENSE PIE CHART */}
            <div className="bg-zinc-950/50 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                  <PieIcon size={14} className="text-teal-400" />
                  Gider Kategorileri Dağılımı
                </h3>
                <p className="text-[10px] text-zinc-500">Maliyet kalemlerinin oransal analizi</p>
              </div>

              {incomeExpenseStats.categoryData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
                  Bu dönemde girilmiş gider masraf bulunmuyor.
                </div>
              ) : (
                <div className="h-60 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeExpenseStats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {incomeExpenseStats.categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatMoney(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* LEGENDS */}
              <div className="mt-4 space-y-1 max-h-36 overflow-y-auto">
                {incomeExpenseStats.categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-zinc-400">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-white">{formatMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPENSES BREAKDOWN TABLE */}
            <div className="lg:col-span-2 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Seçili Dönem Gider Listesi</h3>
                  <span className="text-[10px] text-zinc-400">Tüm harcamaların dökümü</span>
                </div>
                
                <div className="overflow-y-auto max-h-[350px]">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-[#0b0c0e] text-zinc-400 text-[10px] uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Tarih</th>
                        <th className="px-4 py-2.5">Başlık / Detay</th>
                        <th className="px-4 py-2.5">Kategori</th>
                        <th className="px-4 py-2.5">Hesap</th>
                        <th className="px-4 py-2.5 text-right">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 font-sans">
                            Seçilen tarih aralığında masraf kaydı bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-2.5 text-zinc-400 font-sans">{exp.date}</td>
                            <td className="px-4 py-2.5 text-white font-sans font-medium">{exp.title}</td>
                            <td className="px-4 py-2.5 text-zinc-400 font-sans">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-sans text-zinc-300">
                              {exp.account === 'cash' ? 'Kasa' : exp.account === 'pos' ? 'POS' : 'Banka'}
                            </td>
                            <td className="px-4 py-2.5 text-right text-rose-400 font-bold">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: exp.currency || 'TRY' }).format(exp.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTAL ROW */}
              <div className="bg-[#0b0c0e] p-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Seçili Dönem Toplam Gider:</span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {formatMoney(incomeExpenseStats.totalExp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KDV VE KAR-ZARAR RAPORU TAB CONTENT */}
      {activeTab === 'kdvkarzarar' && (
        <div className="space-y-6 animate-fade-in">
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Toplam Hesaplanan KDV (Satış)</span>
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-bold text-white font-mono">{formatMoney(kdvStats.salesKdvTotal)}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Faturalandırılmış satış KDV matrahı toplamı</p>
              </div>
            </div>

            <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Toplam İndirilecek KDV (Alış)</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <ArrowDownLeft size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-lg font-bold text-white font-mono">{formatMoney(kdvStats.purchaseKdvTotal)}</span>
                <p className="text-[10px] text-zinc-500 mt-1">Faturalandırılmış alış KDV matrahı toplamı</p>
              </div>
            </div>

            <div className={`border p-5 rounded-2xl flex flex-col justify-between ${
              kdvStats.netKdvDifference > 0 ? 'bg-red-950/20 border-red-500/20' : 'bg-emerald-950/20 border-emerald-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">
                  {kdvStats.netKdvDifference > 0 ? 'Ödenecek KDV' : 'Devreden KDV'}
                </span>
                <div className={`p-2 rounded-xl ${
                  kdvStats.netKdvDifference > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <Percent size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-lg font-bold font-mono ${
                  kdvStats.netKdvDifference > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {kdvStats.netKdvDifference > 0 ? formatMoney(kdvStats.payableKdv) : formatMoney(kdvStats.devredenKdv)}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {kdvStats.netKdvDifference > 0 ? 'Maliye Bakanlığına ödenecek net tutar' : 'Gelecek döneme aktarılan devir KDV'}
                </p>
              </div>
            </div>

            <div className="bg-[#0b0c0e] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">KDV Hariç Net Kâr / Zarar</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-lg font-bold font-mono ${
                  (summaryStats.sales - kdvStats.salesKdvTotal - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - summaryStats.totalExpenses - summaryStats.employeeSalaries) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {formatMoney(
                    (summaryStats.sales - kdvStats.salesKdvTotal) - 
                    (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - 
                    summaryStats.totalExpenses - 
                    summaryStats.employeeSalaries
                  )}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">Tüm vergiler hariç net faaliyet kârlılığı</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KDV BREAKDOWNS */}
            <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Percent size={14} className="text-teal-400" />
                    KDV Matrahı ve Hesaplama Detayları
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Oran bazında matrah ve KDV dağılımları</p>
                </div>
                <button
                  onClick={downloadKdvPdf}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Download size={10} /> PDF Raporu
                </button>
              </div>

              <div className="p-5 space-y-5 flex-1">
                {/* SALES KDV DETAYLARI */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-teal-400 tracking-wider uppercase">Hesaplanan KDV (Satış Faturaları)</h4>
                  <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-white/5 p-2 font-medium text-zinc-400 border-b border-white/5">
                      <span>KDV Oranı</span>
                      <span className="text-right">KDV Matrahı (KDV Hariç)</span>
                      <span className="text-right">KDV Tutarı</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%20 Standart Oran</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase20)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv20)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%10 İndirimli Oran</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase10)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv10)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%1 Gıda / Temel</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBase1)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdv1)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">Diğer / Karışık Oranlar</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.salesBaseOther)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.salesKdvOther)}</span>
                    </div>
                    <div className="grid grid-cols-3 bg-teal-500/5 p-2 font-bold border-t border-teal-500/20">
                      <span className="text-teal-400">Toplam Satış KDV</span>
                      <span className="text-right text-zinc-400 font-mono">
                        {formatMoney(kdvStats.salesBase20 + kdvStats.salesBase10 + kdvStats.salesBase1 + kdvStats.salesBaseOther)}
                      </span>
                      <span className="text-right text-teal-400 font-mono">{formatMoney(kdvStats.salesKdvTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* PURCHASE KDV DETAYLARI */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-rose-400 tracking-wider uppercase">İndirilecek KDV (Alış Faturaları ve Giderler)</h4>
                  <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-white/5 p-2 font-medium text-zinc-400 border-b border-white/5">
                      <span>KDV Oranı</span>
                      <span className="text-right">KDV Matrahı (KDV Hariç)</span>
                      <span className="text-right">KDV Tutarı</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%20 Standart Oran</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase20)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv20)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%10 İndirimli Oran</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase10)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv10)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">%1 Gıda / Temel</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBase1)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdv1)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-white/5">
                      <span className="text-zinc-300">Diğer / Karışık Oranlar</span>
                      <span className="text-right text-zinc-400 font-mono">{formatMoney(kdvStats.purchaseBaseOther)}</span>
                      <span className="text-right text-white font-mono">{formatMoney(kdvStats.purchaseKdvOther)}</span>
                    </div>
                    <div className="grid grid-cols-3 bg-rose-500/5 p-2 font-bold border-t border-rose-500/20">
                      <span className="text-rose-400">Toplam İndirilecek KDV</span>
                      <span className="text-right text-zinc-400 font-mono">
                        {formatMoney(kdvStats.purchaseBase20 + kdvStats.purchaseBase10 + kdvStats.purchaseBase1 + kdvStats.purchaseBaseOther)}
                      </span>
                      <span className="text-right text-rose-400 font-mono">{formatMoney(kdvStats.purchaseKdvTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILED P&L STATEMENT (KDV EXCLUDED) */}
            <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp size={14} className="text-indigo-400" />
                  KDV Hariç Net Gelir Tablosu (P&L)
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Gerçek kârlılığınızı vergilerden arındırılmış olarak görün</p>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-zinc-400">Brüt Satış Gelirleri (KDV Hariç)</span>
                    <span className="font-mono text-white font-semibold">{formatMoney(summaryStats.sales - kdvStats.salesKdvTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-zinc-400">Satılan Malın Maliyeti (SMM) (KDV Hariç)</span>
                    <span className="font-mono text-white font-semibold">-{formatMoney(summaryStats.costOfSales - kdvStats.purchaseKdvTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2.5 border-b border-white/5 bg-white/5 px-2 rounded-lg font-bold">
                    <span className="text-teal-400">BRÜT FAALİYET KARI</span>
                    <span className="font-mono text-teal-400">
                      {formatMoney((summaryStats.sales - kdvStats.salesKdvTotal) - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-zinc-400">Genel Yönetim ve Faaliyet Giderleri (-)</span>
                    <span className="font-mono text-white font-semibold">-{formatMoney(summaryStats.totalExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                    <span className="text-zinc-400">Personel ve İşçilik Giderleri (-)</span>
                    <span className="font-mono text-white font-semibold">-{formatMoney(summaryStats.employeeSalaries)}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">NET FAALİYET KARI / ZARARI</span>
                      <h4 className="text-xs text-zinc-400 mt-0.5">Yasal vergilerden arındırılmış net kazanç</h4>
                    </div>
                    <span className={`text-lg font-bold font-mono ${
                      ((summaryStats.sales - kdvStats.salesKdvTotal) - (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - summaryStats.totalExpenses - summaryStats.employeeSalaries) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}>
                      {formatMoney(
                        (summaryStats.sales - kdvStats.salesKdvTotal) - 
                        (summaryStats.costOfSales - kdvStats.purchaseKdvTotal) - 
                        summaryStats.totalExpenses - 
                        summaryStats.employeeSalaries
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
