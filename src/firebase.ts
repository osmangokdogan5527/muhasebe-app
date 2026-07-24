import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  writeBatch,
  limit,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  getDocs,
  setLogLevel,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit } from './types';

// Read config from the provisioned project
const firebaseConfig = {
  apiKey: "AIzaSyCcoCQMZBX4TD07jaP4-LOjlDlBWxbnXWo",
  authDomain: "aesthetic-light-cw2h4.firebaseapp.com",
  projectId: "aesthetic-light-cw2h4",
  storageBucket: "aesthetic-light-cw2h4.firebasestorage.app",
  messagingSenderId: "191044825350",
  appId: "1:191044825350:web:7471a7c7c855960490ee87"
};

const app = initializeApp(firebaseConfig);

// Suppress Firestore offline connection warnings in console
setLogLevel('silent');

// Using custom database ID provisioned for AI Studio with deep offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
}, "ai-studio-59bd0d02-f537-4d2e-bf76-4d16ab336635");
export const auth = getAuth();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  signInAnonymously
};
export type { User };

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function reauthenticateWithGoogle() {
  const user = auth.currentUser;
  if (!user) throw new Error("Oturum açmış kullanıcı bulunamadı.");
  const provider = new GoogleAuthProvider();
  return reauthenticateWithPopup(user, provider);
}

// Collection References
const CARILER_COLL = 'cariler';
const STOKLAR_COLL = 'stoklar';
const ISLEMLER_COLL = 'islemler';
const CEKSENET_COLL = 'ceksenet';
const GIDERLER_COLL = 'giderler';
const CALISANLAR_COLL = 'calisanlar';
const CALISAN_ISLEMLER_COLL = 'calisanIslemler';
const KREDILER_COLL = 'krediler';
const HESAPLAR_COLL = 'hesaplar';
const HESAP_ISLEMLER_COLL = 'hesapIslemleri';

let currentUserId: string | null = null;
export function setActiveUser(userId: string | null) {
  currentUserId = userId;
}

// Multi-tenant path helper
function getPath(collectionName: string): string {
  if (!currentUserId) {
    throw new Error("Kullanıcı seçilmedi. Lütfen giriş yapın.");
  }
  return `users/${currentUserId}/${collectionName}`;
}

// Helper to recursively remove undefined properties from objects to prevent Firestore write errors
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  
  const cleaned: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
    throw error;
  console.warn('Firestore Error (Çevrimdışı olabilir): ', JSON.stringify(errInfo));
  // Not throwing to prevent app crash on snapshot errors
}

// Real-time Subscriptions
export function subscribeCariler(callback: (cariler: Cari[]) => void) {
  const q = query(collection(db, getPath(CARILER_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Cari[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Cari);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CARILER_COLL));
  });
}

export function subscribeStoklar(callback: (stoklar: Stock[]) => void) {
  const q = query(collection(db, getPath(STOKLAR_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Stock[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Stock);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(STOKLAR_COLL));
  });
}

export function subscribeIslemler(callback: (islemler: Transaction[]) => void) {
  const q = query(collection(db, getPath(ISLEMLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(ISLEMLER_COLL));
  });
}

// CARI OPERATIONS
export async function saveCari(cari: Omit<Cari, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CARILER_COLL), id) : doc(collection(db, getPath(CARILER_COLL)));
    const newId = id || docRef.id;
    
    // Balance equals opening balance initially if editing doesn't override
    const finalCari: Cari = cleanUndefined({
      id: newId,
      ...cari,
      balance: id ? cari.balance : cari.openingBalance, // Keep balance if editing, use openingBalance if creating
    });
    
    await setDoc(docRef, finalCari);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CARILER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCari(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CARILER_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CARILER_COLL)}/${id}`);
    throw error;
  }
}

// STOCK OPERATIONS
export async function saveStock(stock: Omit<Stock, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(STOKLAR_COLL), id) : doc(collection(db, getPath(STOKLAR_COLL)));
    const newId = id || docRef.id;
    const finalStock: Stock = cleanUndefined({
      id: newId,
      ...stock
    });
    await setDoc(docRef, finalStock);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${STOKLAR_COLL}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteStock(id: string) {
  try {
    await deleteDoc(doc(db, getPath(STOKLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(STOKLAR_COLL)}/${id}`);
    throw error;
  }
}

// ATOMIC TRANSACTION LOGIC: Save Transaction, Update Stock levels, and Update Cari balances
export async function createTransaction(islemData: Omit<Transaction, 'id'>) {
  try {
    const islemRef = doc(collection(db, getPath(ISLEMLER_COLL)));
    const islemId = islemRef.id;
    const islem: Transaction = cleanUndefined({
      id: islemId,
      ...islemData
    });

    // 1. Cari reference & read (if cariId specified)
    let cariRef = null;
    let currentCariBalance = 0;
    let cariExists = false;
    if (islem.cariId && typeof islem.cariId === 'string' && islem.cariId.trim() !== '') {
      cariRef = doc(db, getPath(CARILER_COLL), islem.cariId.trim());
      const cariSnap = await getDoc(cariRef);
      if (cariSnap.exists()) {
        cariExists = true;
        const data = cariSnap.data() as any;
        currentCariBalance = data.balance || 0;
      } else {
        throw new Error(`Cari (ID: ${islem.cariId}) bulunamadı. Silinmiş olabilir.`);
      }
    }

    // 2. Read stock levels if transaction has items (sale/purchase)
    const stockUpdates: { ref: any, newQty: number }[] = [];
    if (islem.items && Array.isArray(islem.items) && islem.items.length > 0) {
      for (const item of islem.items) {
        if (item && item.stockId && typeof item.stockId === 'string' && item.stockId.trim() !== '') {
          const stockRef = doc(db, getPath(STOKLAR_COLL), item.stockId.trim());
          const stockSnap = await getDoc(stockRef);
          if (stockSnap.exists()) {
            const data = stockSnap.data() as any;
            const currentQty = data.quantity || 0;
            let newQty = currentQty;
            if (islem.type === 'sale' || islem.type === 'purchase_return') {
              newQty = currentQty - (item.quantity || 0);
            } else if (islem.type === 'purchase' || islem.type === 'sale_return') {
              newQty = currentQty + (item.quantity || 0);
            }
            stockUpdates.push({ ref: stockRef, newQty });
          } else {
            throw new Error(`Stok (ID: ${item.stockId}) bulunamadı. Silinmiş olabilir.`);
          }
        }
      }
    }

    // 3. Calculate new Cari balance
    let newCariBalance = currentCariBalance;
    if (cariRef && cariExists) {
      const effectAmount = islem.convertedAmount !== undefined && islem.convertedAmount !== 0 ? islem.convertedAmount : (islem.amount || 0);
      if (islem.type === 'sale' || islem.type === 'payment' || islem.type === 'purchase_return') {
        newCariBalance += effectAmount;
      } else if (islem.type === 'purchase' || islem.type === 'collection' || islem.type === 'sale_return') {
        newCariBalance -= effectAmount;
      }
    }

    // 4. Perform writes inside a batch for offline safety and robustness
    const batch = writeBatch(db);
    batch.set(islemRef, islem);

    if (cariRef && cariExists) {
      batch.update(cariRef, { balance: newCariBalance });
    }

    for (const update of stockUpdates) {
      batch.update(update.ref, { quantity: update.newQty });
    }

    await batch.commit();
    return islemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, getPath(ISLEMLER_COLL));
    throw error;
  }
}

export async function removeTransaction(islem: Transaction) {
  if (!islem || !islem.id) {
    throw new Error("Geçersiz işlem verisi.");
  }

  try {
    const islemRef = doc(db, getPath(ISLEMLER_COLL), islem.id);

    // 1. Check if transaction exists
    const islemSnap = await getDoc(islemRef);
    if (!islemSnap.exists()) {
      throw new Error("İşlem bulunamadı.");
    }

    // 2. Cari reference & read to reverse balance
    let cariRef = null;
    let currentCariBalance = 0;
    let cariExists = false;
    if (islem.cariId && typeof islem.cariId === 'string' && islem.cariId.trim() !== '') {
      try {
        cariRef = doc(db, getPath(CARILER_COLL), islem.cariId.trim());
        const cariSnap = await getDoc(cariRef);
        if (cariSnap.exists()) {
          cariExists = true;
          const data = cariSnap.data() as any;
          currentCariBalance = data.balance || 0;
        }
      } catch (cariErr) {
        console.warn("Cari bakiye geri alınırken hata oluştu (cari silinmiş olabilir):", cariErr);
      }
    }

    // 3. Read stock levels to reverse quantities
    const stockUpdates: { ref: any, newQty: number }[] = [];
    if (islem.items && Array.isArray(islem.items) && islem.items.length > 0) {
      for (const item of islem.items) {
        if (item && item.stockId && typeof item.stockId === 'string' && item.stockId.trim() !== '') {
          try {
            const stockRef = doc(db, getPath(STOKLAR_COLL), item.stockId.trim());
            const stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
              const data = stockSnap.data() as any;
              const currentQty = data.quantity || 0;
              let newQty = currentQty;
              // Reverse: sale drops stock, so deleting sale increases stock
              if (islem.type === 'sale' || islem.type === 'purchase_return') {
                newQty = currentQty + (item.quantity || 0);
              } else if (islem.type === 'purchase' || islem.type === 'sale_return') {
                newQty = currentQty - (item.quantity || 0);
              }
              stockUpdates.push({ ref: stockRef, newQty });
            }
          } catch (stockErr) {
            console.warn(`Stok miktarı geri alınırken hata oluştu (stok ${item.stockId} silinmiş olabilir):`, stockErr);
          }
        }
      }
    }

    // 4. Calculate reversed Cari balance
    let newCariBalance = currentCariBalance;
    if (cariRef && cariExists) {
      const effectAmount = islem.convertedAmount !== undefined && islem.convertedAmount !== 0 ? islem.convertedAmount : (islem.amount || 0);
      if (islem.type === 'sale' || islem.type === 'payment' || islem.type === 'purchase_return') {
        newCariBalance -= effectAmount;
      } else if (islem.type === 'purchase' || islem.type === 'collection' || islem.type === 'sale_return') {
        newCariBalance += effectAmount;
      }
    }

    // 5. Perform deletes and updates in a batch
    const batch = writeBatch(db);
    batch.delete(islemRef);

    if (cariRef && cariExists) {
      batch.update(cariRef, { balance: newCariBalance });
    }

    for (const update of stockUpdates) {
      batch.update(update.ref, { quantity: update.newQty });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ISLEMLER_COLL)}/${islem.id}`);
    throw error;
  }
}

// CEK/SENET OPERATIONS
export function subscribeCekSenet(callback: (ceksenet: CekSenet[]) => void) {
  const q = query(collection(db, getPath(CEKSENET_COLL)), orderBy('dueDate', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: CekSenet[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as CekSenet);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CEKSENET_COLL));
  });
}

export async function saveCekSenet(item: Omit<CekSenet, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CEKSENET_COLL), id) : doc(collection(db, getPath(CEKSENET_COLL)));
    const newId = id || docRef.id;
    const finalItem: CekSenet = cleanUndefined({
      id: newId,
      ...item
    });
    await setDoc(docRef, finalItem);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CEKSENET_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCekSenet(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CEKSENET_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CEKSENET_COLL)}/${id}`);
    throw error;
  }
}

// EXPENSE OPERATIONS
export function subscribeExpenses(callback: (expenses: Expense[]) => void) {
  const q = query(collection(db, getPath(GIDERLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Expense[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(GIDERLER_COLL));
  });
}

export async function saveExpense(expense: Omit<Expense, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(GIDERLER_COLL), id) : doc(collection(db, getPath(GIDERLER_COLL)));
    const newId = id || docRef.id;
    const finalExpense: Expense = cleanUndefined({
      id: newId,
      ...expense
    });
    await setDoc(docRef, finalExpense);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(GIDERLER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteExpense(id: string) {
  try {
    await deleteDoc(doc(db, getPath(GIDERLER_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(GIDERLER_COLL)}/${id}`);
    throw error;
  }
}

// EMPLOYEE OPERATIONS
export function subscribeEmployees(callback: (employees: Employee[]) => void) {
  const q = query(collection(db, getPath(CALISANLAR_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Employee[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Employee);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CALISANLAR_COLL));
  });
}

export async function saveEmployee(employee: Omit<Employee, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CALISANLAR_COLL), id) : doc(collection(db, getPath(CALISANLAR_COLL)));
    const newId = id || docRef.id;
    const finalEmployee: Employee = cleanUndefined({
      id: newId,
      ...employee
    });
    await setDoc(docRef, finalEmployee);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CALISANLAR_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CALISANLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CALISANLAR_COLL)}/${id}`);
    throw error;
  }
}

// EMPLOYEE TRANSACTION OPERATIONS
export function subscribeEmployeeTransactions(callback: (transactions: EmployeeTransaction[]) => void) {
  const q = query(collection(db, getPath(CALISAN_ISLEMLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: EmployeeTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as EmployeeTransaction);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CALISAN_ISLEMLER_COLL));
  });
}

export async function saveEmployeeTransaction(transaction: Omit<EmployeeTransaction, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CALISAN_ISLEMLER_COLL), id) : doc(collection(db, getPath(CALISAN_ISLEMLER_COLL)));
    const newId = id || docRef.id;
    const finalTx: EmployeeTransaction = cleanUndefined({
      id: newId,
      ...transaction
    });
    await setDoc(docRef, finalTx);

    // Sync with Expenses (giderler)
    if (finalTx.type === 'payment' || finalTx.type === 'advance') {
      const expenseDocRef = doc(db, getPath(GIDERLER_COLL), newId);
      const title = finalTx.type === 'payment' 
        ? `Maaş Ödemesi: ${finalTx.employeeName}` 
        : `Avans Ödemesi: ${finalTx.employeeName}`;
      
      const expenseData = cleanUndefined({
        id: newId,
        title,
        category: 'Maaş/Personel',
        amount: finalTx.amount,
        date: finalTx.date,
        account: (finalTx.account === 'cash' || finalTx.account === 'bank' || finalTx.account === 'pos') ? finalTx.account : 'cash',
        description: finalTx.description || '',
        currency: finalTx.currency,
        createdAt: finalTx.createdAt || new Date().toISOString()
      });
      await setDoc(expenseDocRef, expenseData);
    } else {
      // If changed to 'accrual', delete any existing synced expense with this transaction ID
      const expenseDocRef = doc(db, getPath(GIDERLER_COLL), newId);
      await deleteDoc(expenseDocRef).catch(() => {});
    }

    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CALISAN_ISLEMLER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteEmployeeTransaction(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CALISAN_ISLEMLER_COLL), id));
    // Also delete any synced expense with this transaction ID
    const expenseDocRef = doc(db, getPath(GIDERLER_COLL), id);
    await deleteDoc(expenseDocRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CALISAN_ISLEMLER_COLL)}/${id}`);
    throw error;
  }
}

// CREDIT OPERATIONS
export function subscribeCredits(callback: (credits: Credit[]) => void) {
  const q = query(collection(db, getPath(KREDILER_COLL)), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Credit[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Credit);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(KREDILER_COLL));
  });
}

export async function saveCredit(credit: Omit<Credit, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(KREDILER_COLL), id) : doc(collection(db, getPath(KREDILER_COLL)));
    const newId = id || docRef.id;
    const finalCredit: Credit = cleanUndefined({
      id: newId,
      ...credit
    });
    await setDoc(docRef, finalCredit);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(KREDILER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCredit(id: string) {
  try {
    await deleteDoc(doc(db, getPath(KREDILER_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(KREDILER_COLL)}/${id}`);
    throw error;
  }
}

// BANK ACCOUNTS & ACCOUNT TRANSACTIONS
export function subscribeBankAccounts(callback: (accounts: any[]) => void) {
  const q = query(collection(db, getPath(HESAPLAR_COLL)), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(HESAPLAR_COLL)));
}

export async function saveBankAccount(account: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(HESAPLAR_COLL), id) : doc(collection(db, getPath(HESAPLAR_COLL)));
    const newId = id || docRef.id;
    const finalAccount = cleanUndefined({ id: newId, ...account });
    await setDoc(docRef, finalAccount);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAPLAR_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteBankAccount(id: string) {
  try {
    await deleteDoc(doc(db, getPath(HESAPLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(HESAPLAR_COLL)}/${id}`);
    throw error;
  }
}

export function subscribeAccountTransactions(callback: (transactions: any[]) => void) {
  const q = query(collection(db, getPath(HESAP_ISLEMLER_COLL)), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(HESAP_ISLEMLER_COLL)));
}

export async function saveAccountTransaction(transaction: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(HESAP_ISLEMLER_COLL), id) : doc(collection(db, getPath(HESAP_ISLEMLER_COLL)));
    const newId = id || docRef.id;
    const finalTx = cleanUndefined({ id: newId, ...transaction });
    await setDoc(docRef, finalTx);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAP_ISLEMLER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function clearAllDatabaseData() {
  try {
    const collections = [CARILER_COLL, STOKLAR_COLL, ISLEMLER_COLL, CEKSENET_COLL, GIDERLER_COLL, CALISANLAR_COLL, CALISAN_ISLEMLER_COLL, KREDILER_COLL, HESAPLAR_COLL, HESAP_ISLEMLER_COLL];
    for (const colName of collections) {
      const q = collection(db, getPath(colName));
      const snapshot = await getDocs(q);
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const docSnap of snapshot.docs) {
        batch.delete(docSnap.ref);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_collections');
    throw error;
  }
}

export async function importAllDatabaseData(backupJson: any) {
  try {
    // 1. Clear first
    await clearAllDatabaseData();

    // 2. Insert collections in batches of 500
    const collectionsMap: { [key: string]: any[] } = {
      [CARILER_COLL]: backupJson.cariler || [],
      [STOKLAR_COLL]: backupJson.stoklar || [],
      [ISLEMLER_COLL]: backupJson.islemler || [],
      [CEKSENET_COLL]: backupJson.ceksenet || [],
      [GIDERLER_COLL]: backupJson.giderler || [],
      [CALISANLAR_COLL]: backupJson.calisanlar || [],
      [CALISAN_ISLEMLER_COLL]: backupJson.calisanIslemler || [],
      [KREDILER_COLL]: backupJson.krediler || [],
      [HESAPLAR_COLL]: backupJson.hesaplar || [],
      [HESAP_ISLEMLER_COLL]: backupJson.hesapIslemleri || [],
    };

    for (const [colName, items] of Object.entries(collectionsMap)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const item of items) {
        if (!item || !item.id) continue;
        const docRef = doc(db, getPath(colName), item.id);
        const cleaned = cleanUndefined(item);
        batch.set(docRef, cleaned);
        count++;
        
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'import_collections');
    throw error;
  }
}

