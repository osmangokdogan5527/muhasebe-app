import { useMemo } from 'react';
import { Transaction as Islem, Expense, EmployeeTransaction, Cari, Stock } from '../../types';
import { getSyncedEmployeeExpenseIds } from '../../utils/expenseUtils';
import { formatDateISO, parseDateISO } from '../../utils/dateUtils';
import { splitInvoiceVat, isOpeningBalanceTransaction } from '../../utils/invoiceMath';
import { convertWithRates, convertTransactionAmount } from '../../utils/currencyUtils';
import { getCachedOrFallbackRates } from '../../utils/tcmbService';

type Memo = <T>(factory: () => T, deps: any[]) => T;

// Rapor hesapları tek yerde: ekran useMemo ile, AI asistan gibi React dışı kullanımlar
// computeRaporlarStats ile aynı kodu çalıştırır (ekrandaki ve AI'daki rakamlar birebir aynı olur).
const buildRaporlarStats = (deps: any, memo: Memo) => {
  const { islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency, stockValuationType, stockSearch, cariSearch, cariTypeFilter } = deps;
  const fxRates = deps.fxRates || getCachedOrFallbackRates();

    // Masraf, maaş, stok ve cari bakiyesi gibi işlem dışı tutarları rapor para birimine çevirir
    const convertAmount = (amount: number, fromCurrency: string = 'TRY') => {
      return convertWithRates(amount, fromCurrency || 'TRY', selectedCurrency, fxRates);
    };

    // Cari işlemlerinde kullanıcının girdiği kurla hesaplanan tutar (convertedAmount) esas alınır
    const cariCurrencyMap = new Map<string, string>();
    (cariler as Cari[]).forEach(c => cariCurrencyMap.set(c.id, c.currency || 'TRY'));
    const convertIslemAmount = (islem: Islem, amount: number = islem.amount) => {
      return convertTransactionAmount(islem, amount, selectedCurrency, cariCurrencyMap.get(islem.cariId), fxRates);
    };
  
    // Format currency output with selected locale format
    const formatMoney = (val: number, currency: string = selectedCurrency) => {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(val);
    };
  
    // 1. FILTERED DATASETS
    const filteredIslemler = memo(() => {
      return islemler.filter(item => {
        const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
        return isWithinDate;
      });
    }, [islemler, resolvedDates]);
  
    const filteredExpenses = memo(() => {
      return expenses.filter(item => {
        const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
        return isWithinDate;
      });
    }, [expenses, resolvedDates]);
  
    const filteredEmployeeTransactions = memo(() => {
      return employeeTransactions.filter(item => {
        const isWithinDate = item.date >= resolvedDates.start && item.date <= resolvedDates.end;
        return isWithinDate;
      });
    }, [employeeTransactions, resolvedDates]);
  
    // Selected Cari info
    const selectedCari = memo(() => {
      return cariler.find(c => c.id === selectedCariId);
    }, [cariler, selectedCariId]);
  
    // KDV Calculations
    const kdvStats = memo(() => {
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
        // Açılış bakiyesi kayıtları gerçek satış/alış değildir, KDV doğurmaz
        if (isOpeningBalanceTransaction(islem)) return;
  
        const sign = (islem.type === 'sale_return' || islem.type === 'purchase_return') ? -1 : 1;
  
        // Matrah ve KDV satır toplamlarından (KDV dahil) geri hesaplanır ve faturanın gerçek tutarına oranlanır
        splitInvoiceVat(islem).forEach(group => {
          const convertedExTaxAmount = convertIslemAmount(islem, group.net) * sign;
          const convertedKdvAmount = convertIslemAmount(islem, group.tax) * sign;
          const taxRate = group.rate;
  
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
    }, [filteredIslemler, cariler, selectedCurrency, fxRates]);
  
    // Cari Ekstre Calculations
    const cariEkstreStats = memo(() => {
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
    const summaryStats = memo(() => {
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
  
      // Satılan malın maliyeti (SMM): stok kartındaki alış fiyatı KDV hariç ve TL'dir.
      // Stok kartı bulunamazsa satırın KDV hariç tutarının %70'i tahmini maliyet sayılır.
      const ESTIMATED_COST_RATIO = 0.7;
      const estimateCostOfItems = (islem: Islem) => {
        const items = islem.items || [];
        if (items.length === 0) {
          const net = splitInvoiceVat(islem).reduce((acc, g) => acc + g.net, 0);
          return convertIslemAmount(islem, net) * ESTIMATED_COST_RATIO;
        }
        let cost = 0;
        items.forEach(item => {
          const st = item.stockId ? stockMap.get(item.stockId) : undefined;
          if (st) {
            cost += convertAmount((st.purchasePrice || 0) * (item.quantity || 0), 'TRY');
          } else {
            const rate = Number(item.taxRate) || 0;
            const lineNet = (Number(item.total) || 0) / (1 + rate / 100);
            cost += convertIslemAmount(islem, lineNet) * ESTIMATED_COST_RATIO;
          }
        });
        return cost;
      };

      // Process transactions within date range
      filteredIslemler.forEach(islem => {
        const amt = convertIslemAmount(islem);
        const isInvoice = islem.type === 'sale' || islem.type === 'sale_return' || islem.type === 'purchase' || islem.type === 'purchase_return';
        // Açılış bakiyesi kayıtları satış/alış değildir
        if (isInvoice && isOpeningBalanceTransaction(islem)) return;

        if (islem.type === 'sale' || islem.type === 'sale_return') {
          // Satış geliri KDV hariç; KDV devlete ait olduğu için kâra dahil edilmez. İadeler düşülür.
          const sign = islem.type === 'sale_return' ? -1 : 1;
          const netSales = splitInvoiceVat(islem).reduce((acc, g) => acc + g.net, 0);
          sales += convertIslemAmount(islem, netSales) * sign;
          costOfSales += estimateCostOfItems(islem) * sign;
        } else if (islem.type === 'purchase') {
          purchases += amt;
        } else if (islem.type === 'purchase_return') {
          purchases -= amt;
        } else if (islem.type === 'collection') {
          collections += amt;
        } else if (islem.type === 'payment') {
          payments += amt;
        }
      });
  
      // Process general expenses (maaş maliyeti aşağıda hak edişten sayıldığı için
      // maaş/avans ödemesinden otomatik oluşan masraflar atlanır)
      const syncedExpenseIds = getSyncedEmployeeExpenseIds(employeeTransactions);
      filteredExpenses.forEach(exp => {
        if (syncedExpenseIds.has(exp.id)) return;
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
    }, [filteredIslemler, stoklar, filteredExpenses, filteredEmployeeTransactions, employeeTransactions, cariler, selectedCurrency, fxRates]);
  
    // 3. COMPUTATIONS - STOK ANALYSIS
    const stockStats = memo(() => {
      let totalItems = stoklar.length;
      let totalStockCount = 0;
      let totalValuation = 0;
      let criticalStockCount = 0;
      const itemsList: any[] = [];
  
      stoklar.forEach(s => {
        totalStockCount += s.quantity;
        const unitVal = stockValuationType === 'purchase' ? s.purchasePrice : s.salesPrice;
        // Stok fiyatları TL tutulur; rapor para birimine çevrilir
        const value = convertAmount(s.quantity * unitVal, 'TRY');
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
    }, [stoklar, stockValuationType, stockSearch, selectedCurrency, fxRates]);
  
    // 4. COMPUTATIONS - CARI ANALYSIS
    const cariStats = memo(() => {
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
    }, [cariler, cariSearch, cariTypeFilter, selectedCurrency, fxRates]);
  
    // 5. COMPUTATIONS - INCOME-EXPENSE & GRAPH DATA
    const incomeExpenseStats = memo(() => {
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
      const startObj = parseDateISO(resolvedDates.start);
      const endObj = parseDateISO(resolvedDates.end);
      for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateISO(d);
        // Format to DD.MM for chart X-Axis
        const axisLabel = dateStr.split('-').reverse().slice(0, 2).join('/');
        dateTrendMap[dateStr] = { date: axisLabel, sales: 0, expenses: 0, collections: 0 };
      }
  
      filteredIslemler.forEach(islem => {
        if (dateTrendMap[islem.date] && !isOpeningBalanceTransaction(islem)) {
          const amt = convertIslemAmount(islem);
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
    }, [filteredExpenses, filteredIslemler, resolvedDates, cariler, selectedCurrency, fxRates]);
  
  return { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats };
}

export const useRaporlarStats = (deps: any) => buildRaporlarStats(deps, useMemo as Memo);

export const computeRaporlarStats = (deps: any) => buildRaporlarStats(deps, (factory) => factory());
