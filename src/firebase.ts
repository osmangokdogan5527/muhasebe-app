import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  writeBatch,
  increment,
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
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit, RecurringTransaction, LinkedReceiptInput } from './types';

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
  reauthenticateWithCredential,
  EmailAuthProvider,
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
const TEKRARLAYAN_COLL = 'tekrarlayanIslemler';

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
  const q = query(collection(db, getPath(CARILER_COLL)), orderBy('name', 'asc'));
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
  const q = query(collection(db, getPath(STOKLAR_COLL)), orderBy('name', 'asc'));
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
  const q = query(collection(db, getPath(ISLEMLER_COLL)), orderBy('date', 'desc'));
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

    if (id) {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        // Düzenleme: bakiye formdaki (açıldığı andaki) değerle EZİLMEZ; form açıkken eklenen
        // işlemler kaybolmasın diye yalnızca açılış bakiyesi farkı bakiyeye artırımlı eklenir.
        const stored = existingSnap.data() as Cari;
        const { balance: _ignoredBalance, ...fields } = cari;
        const openingDiff = (Number(cari.openingBalance) || 0) - (Number(stored.openingBalance) || 0);
        const batch = writeBatch(db);
        batch.set(docRef, cleanUndefined({ id: newId, ...fields }), { merge: true });
        if (openingDiff !== 0) {
          batch.update(docRef, { balance: increment(openingDiff) });
        }
        await batch.commit();
        return newId;
      }
    }

    // Yeni kayıt: id verilmediyse bakiye açılış bakiyesiyle başlar (id verilen içe aktarmada verilen bakiye kullanılır)
    const finalCari: Cari = cleanUndefined({
      id: newId,
      ...cari,
      balance: id ? cari.balance : cari.openingBalance,
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
// originalQuantity: düzenleme formu açıldığında stokta görünen miktar. Verilirse miktar mutlak
// değer olarak yazılmaz, yalnızca kullanıcının yaptığı değişiklik (fark) artırımlı uygulanır;
// böylece form açıkken yapılan satış/alışların stok hareketi ezilmez.
export async function saveStock(stock: Omit<Stock, 'id'>, id?: string, originalQuantity?: number) {
  try {
    const docRef = id ? doc(db, getPath(STOKLAR_COLL), id) : doc(collection(db, getPath(STOKLAR_COLL)));
    const newId = id || docRef.id;

    if (id && originalQuantity !== undefined) {
      const { quantity, ...fields } = stock;
      const quantityDiff = (Number(quantity) || 0) - (Number(originalQuantity) || 0);
      const batch = writeBatch(db);
      batch.set(docRef, cleanUndefined({ id: newId, ...fields }), { merge: true });
      if (quantityDiff !== 0) {
        batch.update(docRef, { quantity: increment(quantityDiff) });
      }
      await batch.commit();
      return newId;
    }

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

// Cari bakiyesine etki (pozitif = cari bize borçlanır)
function getCariBalanceEffect(t: Pick<Transaction, 'type' | 'amount' | 'convertedAmount'>): number {
  const effectAmount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? t.convertedAmount : (t.amount || 0);
  if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') {
    return effectAmount;
  }
  if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') {
    return -effectAmount;
  }
  return 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const INVOICE_TYPES: Transaction['type'][] = ['sale', 'purchase', 'sale_return', 'purchase_return'];

// Satış ve alıştan iade için para bize girer (tahsilat); alış ve satıştan iade için para çıkar (ödeme)
function getLinkedReceiptType(invoiceType: Transaction['type']): 'collection' | 'payment' {
  return invoiceType === 'sale' || invoiceType === 'purchase_return' ? 'collection' : 'payment';
}

export const RETAIL_CARI_ID = 'perakende_musteri';

// POS'ta müşteri seçilmeden yapılan satışlar için sabit "Perakende Müşteri" carisini oluşturur
export async function ensureRetailCari(): Promise<string> {
  try {
    const cariRef = doc(db, getPath(CARILER_COLL), RETAIL_CARI_ID);
    const cariSnap = await getDoc(cariRef);
    if (!cariSnap.exists()) {
      const retailCari: Cari = {
        id: RETAIL_CARI_ID,
        name: 'Perakende Müşteri',
        code: 'PERAKENDE',
        type: 'customer',
        phone: '',
        email: '',
        address: '',
        balance: 0,
        openingBalance: 0,
        createdAt: new Date().toISOString(),
        isActive: true,
        currency: 'TRY'
      };
      await setDoc(cariRef, retailCari);
    }
    return RETAIL_CARI_ID;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${getPath(CARILER_COLL)}/${RETAIL_CARI_ID}`);
    throw error;
  }
}

// ATOMIC TRANSACTION LOGIC: Save Transaction, Update Stock levels, and Update Cari balances
// linkedReceipts: faturayla aynı anda oluşturulacak tahsilat/ödemeler (peşin satış, POS)
export async function createTransaction(islemData: Omit<Transaction, 'id'>, linkedReceipts: LinkedReceiptInput[] = []) {
  try {
    const islemRef = doc(collection(db, getPath(ISLEMLER_COLL)));
    const islemId = islemRef.id;
    const islem: Transaction = cleanUndefined({
      id: islemId,
      ...islemData
    });

    const receiptInputs = linkedReceipts.filter(r => r && roundMoney(r.amount || 0) > 0);
    if (receiptInputs.length > 0 && !INVOICE_TYPES.includes(islem.type)) {
      throw new Error('Bağlı tahsilat/ödeme yalnızca faturalar için oluşturulabilir.');
    }

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

    if (receiptInputs.length > 0 && !cariExists) {
      throw new Error('Peşin tahsilat/ödeme kaydı için bir cari seçilmelidir.');
    }

    // 2. Read stock levels if transaction has items (sale/purchase)
    const stockUpdates: { ref: any, delta: number }[] = [];
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
            stockUpdates.push({ ref: stockRef, delta: newQty - currentQty });
          } else {
            throw new Error(`Stok (ID: ${item.stockId}) bulunamadı. Silinmiş olabilir.`);
          }
        }
      }
    }

    // 3. Build linked receipts (same currency/rate as the invoice)
    const receipts: { ref: any, data: Transaction }[] = receiptInputs.map((input) => {
      const receiptRef = doc(collection(db, getPath(ISLEMLER_COLL)));
      const amount = roundMoney(input.amount);
      const convertedAmount = islem.convertedAmount !== undefined && islem.convertedAmount !== 0 && islem.amount
        ? roundMoney(islem.convertedAmount * amount / islem.amount)
        : undefined;
      const receiptType = getLinkedReceiptType(islem.type);
      const data: Transaction = cleanUndefined({
        id: receiptRef.id,
        type: receiptType,
        cariId: islem.cariId,
        cariName: islem.cariName,
        date: islem.date,
        amount,
        account: input.account,
        bankAccountId: input.bankAccountId,
        description: input.description || `${islem.invoiceNo ? islem.invoiceNo + ' nolu ' : ''}faturanın peşin ${receiptType === 'collection' ? 'tahsilatı' : 'ödemesi'}`,
        createdAt: islem.createdAt || new Date().toISOString(),
        currency: islem.currency,
        exchangeRate: islem.exchangeRate,
        convertedAmount,
        linkedInvoiceId: islemId
      });
      return { ref: receiptRef, data };
    });
    if (receipts.length > 0) {
      islem.linkedReceiptIds = receipts.map(r => r.data.id);
    }

    // 4. Calculate new Cari balance
    let newCariBalance = currentCariBalance;
    if (cariRef && cariExists) {
      newCariBalance += getCariBalanceEffect(islem);
      for (const receipt of receipts) {
        newCariBalance += getCariBalanceEffect(receipt.data);
      }
    }

    // 5. Perform writes inside a batch for offline safety and robustness
    const batch = writeBatch(db);
    batch.set(islemRef, islem);

    for (const receipt of receipts) {
      batch.set(receipt.ref, receipt.data);
    }

    // Artırımlı güncelleme: aynı anda başka cihazdan yapılan işlemlerin bakiye etkisi ezilmez
    const cariBalanceDelta = roundMoney(newCariBalance - currentCariBalance);
    if (cariRef && cariExists && cariBalanceDelta !== 0) {
      batch.update(cariRef, { balance: increment(cariBalanceDelta) });
    }

    // Artırımlı güncelleme: aynı anda başka cihazdan yapılan stok hareketleri ezilmez
    for (const update of stockUpdates) {
      if (update.delta !== 0) {
        batch.update(update.ref, { quantity: increment(update.delta) });
      }
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
    const storedIslem = islemSnap.data() as Transaction;

    // Faturaya bağlı otomatik tahsilat/ödeme tek başına silinemez; fatura ile birlikte yönetilir
    if (storedIslem.linkedInvoiceId) {
      throw new Error("Bu kayıt bir faturaya bağlı otomatik tahsilat/ödemedir. Değiştirmek veya silmek için bağlı faturayı düzenleyin ya da silin.");
    }

    // 2. Read linked receipts (deleted together with the invoice)
    const linkedReceipts: { ref: any, data: Transaction }[] = [];
    if (Array.isArray(storedIslem.linkedReceiptIds)) {
      for (const receiptId of storedIslem.linkedReceiptIds) {
        if (!receiptId) continue;
        const receiptRef = doc(db, getPath(ISLEMLER_COLL), receiptId);
        const receiptSnap = await getDoc(receiptRef);
        if (receiptSnap.exists()) {
          linkedReceipts.push({ ref: receiptRef, data: receiptSnap.data() as Transaction });
        }
      }
    }

    // 3. Cari reference & read to reverse balance
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

    // 4. Read stock levels to reverse quantities
    const stockUpdates: { ref: any, delta: number }[] = [];
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
              stockUpdates.push({ ref: stockRef, delta: newQty - currentQty });
            }
          } catch (stockErr) {
            console.warn(`Stok miktarı geri alınırken hata oluştu (stok ${item.stockId} silinmiş olabilir):`, stockErr);
          }
        }
      }
    }

    // 5. Calculate reversed Cari balance (invoice + its linked receipts)
    let newCariBalance = currentCariBalance;
    if (cariRef && cariExists) {
      newCariBalance -= getCariBalanceEffect(islem);
      for (const receipt of linkedReceipts) {
        newCariBalance -= getCariBalanceEffect(receipt.data);
      }
    }

    // 6. Perform deletes and updates in a batch
    const batch = writeBatch(db);
    batch.delete(islemRef);

    for (const receipt of linkedReceipts) {
      batch.delete(receipt.ref);
    }

    // Artırımlı güncelleme: aynı anda başka cihazdan yapılan işlemlerin bakiye etkisi ezilmez
    const cariBalanceDelta = roundMoney(newCariBalance - currentCariBalance);
    if (cariRef && cariExists && cariBalanceDelta !== 0) {
      batch.update(cariRef, { balance: increment(cariBalanceDelta) });
    }

    // Artırımlı güncelleme: aynı anda başka cihazdan yapılan stok hareketleri ezilmez
    for (const update of stockUpdates) {
      if (update.delta !== 0) {
        batch.update(update.ref, { quantity: increment(update.delta) });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ISLEMLER_COLL)}/${islem.id}`);
    throw error;
  }
}

// CEK/SENET OPERATIONS
export function subscribeCekSenet(callback: (ceksenet: CekSenet[]) => void) {
  const q = query(collection(db, getPath(CEKSENET_COLL)), orderBy('dueDate', 'asc'));
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
  const q = query(collection(db, getPath(GIDERLER_COLL)), orderBy('date', 'desc'));
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

// RECURRING TRANSACTIONS (TEKRARLAYAN İŞLEMLER) OPERATIONS
export function subscribeRecurringTransactions(callback: (items: RecurringTransaction[]) => void) {
  const q = query(collection(db, getPath(TEKRARLAYAN_COLL)), orderBy('nextDueDate', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: RecurringTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as RecurringTransaction);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(TEKRARLAYAN_COLL));
  });
}

export async function saveRecurringTransaction(item: Omit<RecurringTransaction, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(TEKRARLAYAN_COLL), id) : doc(collection(db, getPath(TEKRARLAYAN_COLL)));
    const newId = id || docRef.id;
    const finalItem: RecurringTransaction = cleanUndefined({
      id: newId,
      ...item
    });
    await setDoc(docRef, finalItem);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(TEKRARLAYAN_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteRecurringTransaction(id: string) {
  try {
    await deleteDoc(doc(db, getPath(TEKRARLAYAN_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(TEKRARLAYAN_COLL)}/${id}`);
    throw error;
  }
}

// EMPLOYEE OPERATIONS
export function subscribeEmployees(callback: (employees: Employee[]) => void) {
  const q = query(collection(db, getPath(CALISANLAR_COLL)), orderBy('name', 'asc'));
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
  const q = query(collection(db, getPath(CALISAN_ISLEMLER_COLL)), orderBy('date', 'desc'));
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
  const q = query(collection(db, getPath(KREDILER_COLL)), orderBy('createdAt', 'desc'));
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
  const q = query(collection(db, getPath(HESAPLAR_COLL)), orderBy('createdAt', 'desc'));
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
  const q = query(collection(db, getPath(HESAP_ISLEMLER_COLL)), orderBy('createdAt', 'desc'));
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
    const collections = [CARILER_COLL, STOKLAR_COLL, ISLEMLER_COLL, CEKSENET_COLL, GIDERLER_COLL, CALISANLAR_COLL, CALISAN_ISLEMLER_COLL, KREDILER_COLL, HESAPLAR_COLL, HESAP_ISLEMLER_COLL, TEKRARLAYAN_COLL];
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

const ALL_COLLECTIONS: { name: string; backupKey: string }[] = [
  { name: CARILER_COLL, backupKey: 'cariler' },
  { name: STOKLAR_COLL, backupKey: 'stoklar' },
  { name: ISLEMLER_COLL, backupKey: 'islemler' },
  { name: CEKSENET_COLL, backupKey: 'ceksenet' },
  { name: GIDERLER_COLL, backupKey: 'giderler' },
  { name: CALISANLAR_COLL, backupKey: 'calisanlar' },
  { name: CALISAN_ISLEMLER_COLL, backupKey: 'calisanIslemler' },
  { name: KREDILER_COLL, backupKey: 'krediler' },
  { name: HESAPLAR_COLL, backupKey: 'hesaplar' },
  { name: HESAP_ISLEMLER_COLL, backupKey: 'hesapIslemleri' },
  { name: TEKRARLAYAN_COLL, backupKey: 'tekrarlayanIslemler' },
];

// Yedek için tüm koleksiyonları ekrandaki listelerden bağımsız olarak doğrudan veritabanından okur
export async function exportAllDatabaseData(): Promise<{ [backupKey: string]: any[] }> {
  try {
    const result: { [backupKey: string]: any[] } = {};
    for (const { name, backupKey } of ALL_COLLECTIONS) {
      const snapshot = await getDocs(collection(db, getPath(name)));
      result[backupKey] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'export_collections');
    throw error;
  }
}

// Yedeği geri yükler. Önce yedekteki kayıtlar yazılır, ardından yedekte olmayan kayıtlar silinir;
// işlem yarıda kesilirse veritabanı boş kalmaz (yalnızca fazladan kayıtlar kalabilir).
export async function importAllDatabaseData(backupJson: any) {
  try {
    const BATCH_LIMIT = 450;
    for (const { name, backupKey } of ALL_COLLECTIONS) {
      const rawItems = backupJson ? backupJson[backupKey] : undefined;
      const items: any[] = Array.isArray(rawItems) ? rawItems.filter(item => item && item.id) : [];
      const backupIds = new Set(items.map(item => String(item.id)));

      // 1. Yedekteki kayıtları yaz
      let batch = writeBatch(db);
      let count = 0;
      for (const item of items) {
        batch.set(doc(db, getPath(name), String(item.id)), cleanUndefined(item));
        count++;
        if (count === BATCH_LIMIT) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      // 2. Yedekte olmayan mevcut kayıtları sil
      const snapshot = await getDocs(collection(db, getPath(name)));
      batch = writeBatch(db);
      count = 0;
      for (const docSnap of snapshot.docs) {
        if (backupIds.has(docSnap.id)) continue;
        batch.delete(docSnap.ref);
        count++;
        if (count === BATCH_LIMIT) {
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

