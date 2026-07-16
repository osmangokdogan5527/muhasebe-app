import { useState, useEffect } from 'react';
import {
  subscribeCariler,
  subscribeStoklar,
  subscribeIslemler,
  subscribeCekSenet,
  subscribeExpenses,
  subscribeEmployees,
  subscribeEmployeeTransactions,
  subscribeCredits,
  subscribeBankAccounts,
  subscribeAccountTransactions,
  saveBankAccount,
  User as FirebaseUser
} from '../firebase';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit, BankAccount, AccountTransaction } from '../types';

export function useAppData(user: FirebaseUser | null) {
  // App data state
  const [cariler, setCariler] = useState<Cari[]>([]);
  const [stoklar, setStoklar] = useState<Stock[]>([]);
  const [islemler, setIslemler] = useState<Transaction[]>([]);
  const [ceksenet, setCeksenet] = useState<CekSenet[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  
  // Loading & connection state
  const [loading, setLoading] = useState(true);

  // Real-time synchronization when user is signed in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let carilerLoaded = false;
    let stoklarLoaded = false;
    let islemlerLoaded = false;
    let ceksenetLoaded = false;
    let expensesLoaded = false;
    let employeesLoaded = false;
    let employeeTransactionsLoaded = false;
    let creditsLoaded = false;
    let bankAccountsLoaded = false;
    let accountTransactionsLoaded = false;

    const checkLoadingFinished = () => {
      if (
        carilerLoaded && 
        stoklarLoaded && 
        islemlerLoaded && 
        ceksenetLoaded && 
        expensesLoaded &&
        employeesLoaded &&
        employeeTransactionsLoaded &&
        creditsLoaded &&
        bankAccountsLoaded &&
        accountTransactionsLoaded
      ) {
        setLoading(false);
      }
    };

    const unsubscribeCari = subscribeCariler((data) => {
      setCariler(data);
      carilerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeStok = subscribeStoklar((data) => {
      setStoklar(data);
      stoklarLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeIslem = subscribeIslemler((data) => {
      setIslemler(data);
      islemlerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeCek = subscribeCekSenet((data) => {
      setCeksenet(data);
      ceksenetLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeExpenses = subscribeExpenses((data) => {
      setExpenses(data);
      expensesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployees = subscribeEmployees((data) => {
      setEmployees(data);
      employeesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployeeTxs = subscribeEmployeeTransactions((data) => {
      setEmployeeTransactions(data);
      employeeTransactionsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeCredits = subscribeCredits((data) => {
      setCredits(data);
      creditsLoaded = true;
      checkLoadingFinished();
    });

    let isSeeding = false;
    const unsubscribeBankAccounts = subscribeBankAccounts(async (data) => {
      const missingDefaults = [];
      const hasKasa = data.some(acc => acc.id === 'merkez_kasa');
      const hasBanka = data.some(acc => acc.id === 'merkez_banka');
      const hasPos = data.some(acc => acc.id === 'merkez_pos');
      
      if (!hasKasa) missingDefaults.push({ id: 'merkez_kasa', name: 'MERKEZ KASA', type: 'kasa', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });
      if (!hasBanka) missingDefaults.push({ id: 'merkez_banka', name: 'MERKEZ BANKA', type: 'banka', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });
      if (!hasPos) missingDefaults.push({ id: 'merkez_pos', name: 'MERKEZ POS', type: 'pos', currency: 'TRY', initialBalance: 0, isDefault: true, createdAt: new Date().toISOString() });

      if (missingDefaults.length > 0 && !isSeeding) {
        isSeeding = true;
        try {
          for (const acc of missingDefaults) {
            await saveBankAccount(acc, acc.id);
          }
        } catch (e) {
          // ignore
        } finally {
          isSeeding = false;
        }
      }
      setBankAccounts(data);
      bankAccountsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeAccountTxs = subscribeAccountTransactions((data) => {
      setAccountTransactions(data);
      accountTransactionsLoaded = true;
      checkLoadingFinished();
    });

    return () => {
      unsubscribeCari();
      unsubscribeStok();
      unsubscribeIslem();
      unsubscribeCek();
      unsubscribeExpenses();
      unsubscribeEmployees();
      unsubscribeEmployeeTxs();
      unsubscribeCredits();
      unsubscribeBankAccounts();
      unsubscribeAccountTxs();
    };
  }, [user]);

  return {
    cariler, setCariler,
    stoklar, setStoklar,
    islemler, setIslemler,
    ceksenet, setCeksenet,
    expenses, setExpenses,
    employees, setEmployees,
    employeeTransactions, setEmployeeTransactions,
    credits, setCredits,
    bankAccounts, setBankAccounts,
    accountTransactions, setAccountTransactions,
    loading, setLoading
  };
}
