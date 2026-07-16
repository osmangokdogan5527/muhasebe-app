import { useMemo } from 'react';
import { Transaction as Islem, Expense, EmployeeTransaction, Cari, Stock } from '../../types';

export const useRaporlarStats = (deps: any) => {
  const { islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency, stockValuationType, stockSearch, cariSearch, cariTypeFilter } = deps;

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
  
  return { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats };
}
