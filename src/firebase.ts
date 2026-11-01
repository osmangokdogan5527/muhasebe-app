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
  getDoc,
  where
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
import { logError } from './utils/errorLogger';
import {
  ActivityActor,
  ActivityCategory,
  ActivityEntry,
  ActivityInput,
  ActorStamp,
  currentDevice,
  localDay,
  summarizePlain,
  summarizeTransaction,
  transactionCategory,
  transactionTitle,
} from './users/activityTypes';

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
const AYARLAR_COLL = 'ayarlar';
// Firmanın belgelerde (PDF) kullanılan görünüm ayarları: tüm cihazlarda ortak
const DOCUMENT_BRANDING_DOC_ID = 'belgeGorunumu';
const TEKRARLAYAN_COLL = 'tekrarlayanIslemler';
// Kim ne yaptı günlüğü (yedeğe ve geri yüklemeye dahil değildir; eski yedek dönülse de günlük silinmez)
const HAREKET_COLL = 'hareketGunlugu';

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

// ---------------- HAREKET GÜNLÜĞÜ (kim ne yaptı) ----------------
// Kullanıcı sistemi açıkken giriş yapan kişi buraya bildirilir; kapalıyken null'dır ve hiçbir şey kaydedilmez.
let activityActor: ActivityActor | null = null;
let activitySuppressed = 0;

export function setActivityActor(actor: ActivityActor | null) {
  activityActor = actor;
}

function actorStamp(): ActorStamp | undefined {
  return activityActor ? { id: activityActor.id, name: activityActor.name, at: new Date().toISOString() } : undefined;
}

/** Yeni kayıtlara createdBy, düzenlenenlere updatedBy yazılır */
function stampFields(isNew: boolean): Record<string, ActorStamp> {
  const stamp = actorStamp();
  if (!stamp) return {};
  return isNew ? { createdBy: stamp } : { updatedBy: stamp };
}

function activityEnabled(): boolean {
  return !!activityActor && activitySuppressed === 0;
}

/**
 * Günlüğe kayıt ekler. İşi bekletmez: yazma arka planda yapılır (çevrimdışıyken kuyruğa girer).
 * actorOverride: giriş/çıkış gibi oturum değişirken yapılan kayıtlarda kişi açıkça verilir.
 */
export function recordActivity(input: ActivityInput, actorOverride?: ActivityActor | null): void {
  const actor = actorOverride || activityActor;
  if (!actor || !currentUserId) return;
  if (!actorOverride && activitySuppressed > 0) return;
  try {
    const ref = doc(collection(db, getPath(HAREKET_COLL)));
    const now = new Date();
    const entry: ActivityEntry = cleanUndefined({
      ...input,
      id: ref.id,
      at: now.toISOString(),
      day: localDay(now),
      userId: actor.id,
      userName: actor.name,
      role: actor.role,
      device: currentDevice(),
    });
    setDoc(ref, entry).catch((err) => logError(err instanceof Error ? err : new Error(String(err)), 'recordActivity'));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'recordActivity');
  }
}

/** Toplu işlemlerde (Excel içe aktarma gibi) tek tek kayıt düşmemek için; çağıran tek bir özet kayıt yazar */
export async function runWithoutActivity<T>(fn: () => Promise<T>): Promise<T> {
  activitySuppressed++;
  try {
    return await fn();
  } finally {
    activitySuppressed--;
  }
}

/** Silme/düzenleme öncesi kaydın eski hâli (yalnızca günlük açıkken okunur) */
async function readForLog(collName: string, id: string | undefined): Promise<Record<string, any> | null> {
  if (!id || !activityEnabled()) return null;
  try {
    const snap = await getDoc(doc(db, getPath(collName), id));
    return snap.exists() ? (snap.data() as Record<string, any>) : null;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), `readForLog:${collName}`);
    return null;
  }
}

function logRecordSave(category: ActivityCategory, title: string, refId: string, before: Record<string, any> | null, after: Record<string, any>, amount?: number) {
  if (!activityEnabled()) return;
  recordActivity({
    category,
    action: before ? 'update' : 'create',
    title,
    amount,
    currency: after?.currency,
    refId,
    risky: before ? true : undefined,
    before: before ? summarizePlain(before) : undefined,
    after: summarizePlain(after),
  });
}

function logRecordDelete(category: ActivityCategory, title: string, refId: string, before: Record<string, any> | null, amount?: number) {
  if (!activityEnabled()) return;
  recordActivity({
    category,
    action: 'delete',
    title,
    amount,
    currency: before?.currency,
    refId,
    risky: true,
    before: summarizePlain(before),
  });
}

/** Belirli günler arasındaki günlük kayıtları (en yeni önce) */
export function subscribeActivity(fromDay: string, toDay: string, callback: (entries: ActivityEntry[]) => void) {
  const q = query(collection(db, getPath(HAREKET_COLL)), where('day', '>=', fromDay), where('day', '<=', toDay), orderBy('day', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: ActivityEntry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as ActivityEntry), id: docSnap.id });
    });
    list.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    callback(list);
  }, (error) => {
    logError(error instanceof Error ? error : new Error(String(error)), 'subscribeActivity');
    callback([]);
  });
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
        const storedForLog = existingSnap.data() as Record<string, any>;
        // Düzenleme: bakiye formdaki (açıldığı andaki) değerle EZİLMEZ; form açıkken eklenen
        // işlemler kaybolmasın diye yalnızca açılış bakiyesi farkı bakiyeye artırımlı eklenir.
        const stored = existingSnap.data() as Cari;
        const { balance: _ignoredBalance, ...fields } = cari;
        const openingDiff = (Number(cari.openingBalance) || 0) - (Number(stored.openingBalance) || 0);
        const batch = writeBatch(db);
        batch.set(docRef, cleanUndefined({ id: newId, ...fields, ...stampFields(false) }), { merge: true });
        if (openingDiff !== 0) {
          batch.update(docRef, { balance: increment(openingDiff) });
        }
        await batch.commit();
        logRecordSave('cari', `Cari: ${cari.name || stored.name || ''}`, newId, storedForLog, { ...storedForLog, ...fields });
        return newId;
      }
    }

    // Yeni kayıt: id verilmediyse bakiye açılış bakiyesiyle başlar (id verilen içe aktarmada verilen bakiye kullanılır)
    const finalCari: Cari = cleanUndefined({
      id: newId,
      ...cari,
      balance: id ? cari.balance : cari.openingBalance,
      ...stampFields(true),
    });
    
    await setDoc(docRef, finalCari);
    logRecordSave('cari', `Cari: ${finalCari.name || ''}`, newId, null, finalCari as any);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CARILER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCari(id: string) {
  try {
    const before = await readForLog(CARILER_COLL, id);
    await deleteDoc(doc(db, getPath(CARILER_COLL), id));
    logRecordDelete('cari', `Cari: ${before?.name || id}`, id, before, Number(before?.balance) || undefined);
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

    const before = await readForLog(STOKLAR_COLL, id);

    if (id && originalQuantity !== undefined) {
      const { quantity, ...fields } = stock;
      const quantityDiff = (Number(quantity) || 0) - (Number(originalQuantity) || 0);
      const batch = writeBatch(db);
      batch.set(docRef, cleanUndefined({ id: newId, ...fields, ...stampFields(false) }), { merge: true });
      if (quantityDiff !== 0) {
        batch.update(docRef, { quantity: increment(quantityDiff) });
      }
      await batch.commit();
      const qtyNote = quantityDiff !== 0 ? ` (miktar ${Number(originalQuantity) || 0} → ${Number(quantity) || 0})` : '';
      logRecordSave('stok', `Stok: ${stock.name || ''}${qtyNote}`, newId, before, { ...(before || {}), ...stock });
      return newId;
    }

    const finalStock: Stock = cleanUndefined({
      id: newId,
      ...stock,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalStock);
    logRecordSave('stok', `Stok: ${finalStock.name || ''}`, newId, before, finalStock as any);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${STOKLAR_COLL}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteStock(id: string) {
  try {
    const before = await readForLog(STOKLAR_COLL, id);
    await deleteDoc(doc(db, getPath(STOKLAR_COLL), id));
    logRecordDelete('stok', `Stok: ${before?.name || id}`, id, before);
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

/**
 * Çevrimdışıyken yazma işlemi sunucu onayını beklemez: Firestore kaydı yerel önbelleğe yazar
 * ve bağlantı gelince otomatik gönderir (ekran "Kaydediliyor..." durumunda takılı kalmaz).
 * Çevrimiçiyken sunucu onayı beklenir ve hatalar çağırana iletilir.
 */
async function commitWrite(write: Promise<void>, context: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    write.catch((err) => logError(err instanceof Error ? err : new Error(String(err)), `${context} (çevrimdışı kuyruk)`));
    return;
  }
  await write;
}

export const RETAIL_CARI_ID = 'perakende_musteri';

// POS'ta müşteri seçilmeden yapılan satışlar için sabit "Perakende Müşteri" carisini oluşturur
export async function ensureRetailCari(): Promise<string> {
  try {
    const cariRef = doc(db, getPath(CARILER_COLL), RETAIL_CARI_ID);
    let cariSnap;
    try {
      cariSnap = await getDoc(cariRef);
    } catch (readError) {
      // Çevrimdışı ve kart bu cihazın önbelleğinde yok: sunucudaki olası bakiyeyi ezmemek için
      // bakiye alanı yazılmadan birleştirerek oluşturulur
      await commitWrite(setDoc(cariRef, {
        id: RETAIL_CARI_ID, name: 'Perakende Müşteri', code: 'PERAKENDE', type: 'customer',
        phone: '', email: '', address: '', openingBalance: 0, isActive: true, currency: 'TRY'
      }, { merge: true }), 'ensureRetailCari');
      return RETAIL_CARI_ID;
    }
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
      await commitWrite(setDoc(cariRef, retailCari), 'ensureRetailCari');
    }
    return RETAIL_CARI_ID;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${getPath(CARILER_COLL)}/${RETAIL_CARI_ID}`);
    throw error;
  }
}

// ATOMIC TRANSACTION LOGIC: Save Transaction, Update Stock levels, and Update Cari balances
//
// Her yazma işlemi önce bir "plan" hazırlar (gerekli okumalar + doğrulamalar), sonra planı
// tek bir batch'e uygular. Böylece düzenleme (eski kaydı geri al + yenisini yaz) tek bir
// atomik yazma olur: yeni kayıt doğrulamadan geçemezse eski kayıt da yerinde kalır.
type BatchLike = ReturnType<typeof writeBatch>;

interface TransactionWritePlan {
  islemId: string;
  apply: (batch: BatchLike) => void;
  /** Günlük için: yazılacak ya da geri alınacak kaydın kendisi */
  record?: Transaction;
  /** Günlük için: faturayla birlikte alınan peşin tutar */
  linkedTotal?: number;
}

function stockQuantityDirection(type: Transaction['type']): number {
  if (type === 'sale' || type === 'purchase_return') return -1;
  if (type === 'purchase' || type === 'sale_return') return 1;
  return 0;
}

/** Yeni işlem (ve faturaya bağlı peşin tahsilat/ödemeler) için yazma planı */
async function planCreateTransaction(islemData: Omit<Transaction, 'id'>, linkedReceipts: LinkedReceiptInput[] = [], stamp: Record<string, ActorStamp> = stampFields(true)): Promise<TransactionWritePlan> {
  const islemRef = doc(collection(db, getPath(ISLEMLER_COLL)));
  const islemId = islemRef.id;
  const islem: Transaction = cleanUndefined({
    id: islemId,
    ...islemData,
    ...stamp,
  });

  const receiptInputs = linkedReceipts.filter(r => r && roundMoney(r.amount || 0) > 0);
  if (receiptInputs.length > 0 && !INVOICE_TYPES.includes(islem.type)) {
    throw new Error('Bağlı tahsilat/ödeme yalnızca faturalar için oluşturulabilir.');
  }

  // 1. Cari reference & read (if cariId specified)
  let cariRef = null;
  if (islem.cariId && typeof islem.cariId === 'string' && islem.cariId.trim() !== '') {
    cariRef = doc(db, getPath(CARILER_COLL), islem.cariId.trim());
    const cariSnap = await getDoc(cariRef);
    if (!cariSnap.exists()) {
      throw new Error(`Cari (ID: ${islem.cariId}) bulunamadı. Silinmiş olabilir.`);
    }
  }

  if (receiptInputs.length > 0 && !cariRef) {
    throw new Error('Peşin tahsilat/ödeme kaydı için bir cari seçilmelidir.');
  }

  // 2. Stock existence check if transaction has items (sale/purchase)
  const stockUpdates: { ref: any, delta: number }[] = [];
  const direction = stockQuantityDirection(islem.type);
  if (islem.items && Array.isArray(islem.items) && islem.items.length > 0) {
    for (const item of islem.items) {
      if (item && item.stockId && typeof item.stockId === 'string' && item.stockId.trim() !== '') {
        const stockRef = doc(db, getPath(STOKLAR_COLL), item.stockId.trim());
        const stockSnap = await getDoc(stockRef);
        if (!stockSnap.exists()) {
          throw new Error(`"${item.stockName || item.stockId}" stok kartı bulunamadı. Silinmiş olabilir.`);
        }
        stockUpdates.push({ ref: stockRef, delta: direction * (Number(item.quantity) || 0) });
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
      linkedInvoiceId: islemId,
      ...stamp,
    });
    return { ref: receiptRef, data };
  });
  if (receipts.length > 0) {
    islem.linkedReceiptIds = receipts.map(r => r.data.id);
  }

  // 4. Cari balance delta (invoice + its linked receipts)
  let cariBalanceDelta = 0;
  if (cariRef) {
    cariBalanceDelta += getCariBalanceEffect(islem);
    for (const receipt of receipts) {
      cariBalanceDelta += getCariBalanceEffect(receipt.data);
    }
    cariBalanceDelta = roundMoney(cariBalanceDelta);
  }

  return {
    islemId,
    record: islem,
    linkedTotal: roundMoney(receipts.reduce((sum, r) => sum + (Number(r.data.amount) || 0), 0)),
    apply: (batch) => {
      batch.set(islemRef, islem);
      for (const receipt of receipts) {
        batch.set(receipt.ref, receipt.data);
      }
      // Artırımlı güncelleme: aynı anda başka cihazdan yapılan işlemlerin bakiye etkisi ezilmez
      if (cariRef && cariBalanceDelta !== 0) {
        batch.update(cariRef, { balance: increment(cariBalanceDelta) });
      }
      // Artırımlı güncelleme: aynı anda başka cihazdan yapılan stok hareketleri ezilmez
      for (const update of stockUpdates) {
        if (update.delta !== 0) {
          batch.update(update.ref, { quantity: increment(update.delta) });
        }
      }
    },
  };
}

/** Var olan işlemi (ve bağlı peşin tahsilat/ödemelerini) geri alan yazma planı */
async function planRemoveTransaction(islem: Transaction): Promise<TransactionWritePlan> {
  if (!islem || !islem.id) {
    throw new Error("Geçersiz işlem verisi.");
  }
  const islemRef = doc(db, getPath(ISLEMLER_COLL), islem.id);

  // 1. Check if transaction exists
  const islemSnap = await getDoc(islemRef);
  if (!islemSnap.exists()) {
    throw new Error("İşlem bulunamadı.");
  }
  // Geri alma, ekrandaki kopyaya değil veritabanındaki kayda göre yapılır
  const storedIslem = { ...(islemSnap.data() as Transaction), id: islem.id };
  islem = storedIslem;

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
  if (islem.cariId && typeof islem.cariId === 'string' && islem.cariId.trim() !== '') {
    try {
      const ref = doc(db, getPath(CARILER_COLL), islem.cariId.trim());
      const cariSnap = await getDoc(ref);
      if (cariSnap.exists()) cariRef = ref;
    } catch (cariErr) {
      logError(cariErr instanceof Error ? cariErr : new Error(String(cariErr)), 'planRemoveTransaction: cari okunamadı (silinmiş olabilir)');
    }
  }

  // 4. Read stock cards to reverse quantities (silinmiş stoklar atlanır)
  const stockUpdates: { ref: any, delta: number }[] = [];
  const direction = -stockQuantityDirection(islem.type);
  if (islem.items && Array.isArray(islem.items) && islem.items.length > 0) {
    for (const item of islem.items) {
      if (item && item.stockId && typeof item.stockId === 'string' && item.stockId.trim() !== '') {
        try {
          const stockRef = doc(db, getPath(STOKLAR_COLL), item.stockId.trim());
          const stockSnap = await getDoc(stockRef);
          if (stockSnap.exists()) {
            stockUpdates.push({ ref: stockRef, delta: direction * (Number(item.quantity) || 0) });
          }
        } catch (stockErr) {
          logError(stockErr instanceof Error ? stockErr : new Error(String(stockErr)), `planRemoveTransaction: stok ${item.stockId} okunamadı (silinmiş olabilir)`);
        }
      }
    }
  }

  // 5. Reversed cari balance delta (invoice + its linked receipts)
  let cariBalanceDelta = 0;
  if (cariRef) {
    cariBalanceDelta -= getCariBalanceEffect(islem);
    for (const receipt of linkedReceipts) {
      cariBalanceDelta -= getCariBalanceEffect(receipt.data);
    }
    cariBalanceDelta = roundMoney(cariBalanceDelta);
  }

  return {
    islemId: islem.id,
    record: storedIslem,
    apply: (batch) => {
      batch.delete(islemRef);
      for (const receipt of linkedReceipts) {
        batch.delete(receipt.ref);
      }
      // Artırımlı güncelleme: aynı anda başka cihazdan yapılan işlemlerin bakiye etkisi ezilmez
      if (cariRef && cariBalanceDelta !== 0) {
        batch.update(cariRef, { balance: increment(cariBalanceDelta) });
      }
      // Artırımlı güncelleme: aynı anda başka cihazdan yapılan stok hareketleri ezilmez
      for (const update of stockUpdates) {
        if (update.delta !== 0) {
          batch.update(update.ref, { quantity: increment(update.delta) });
        }
      }
    },
  };
}

// linkedReceipts: faturayla aynı anda oluşturulacak tahsilat/ödemeler (peşin satış, POS)
export async function createTransaction(islemData: Omit<Transaction, 'id'>, linkedReceipts: LinkedReceiptInput[] = []) {
  try {
    const plan = await planCreateTransaction(islemData, linkedReceipts);
    const batch = writeBatch(db);
    plan.apply(batch);
    await commitWrite(batch.commit(), 'createTransaction');
    if (activityEnabled() && plan.record) {
      const after = summarizeTransaction(plan.record);
      if (after && plan.linkedTotal) after.paidNow = plan.linkedTotal;
      recordActivity({
        category: transactionCategory(plan.record.type),
        action: 'create',
        title: transactionTitle(plan.record),
        amount: Number(plan.record.amount) || 0,
        currency: plan.record.currency,
        refId: plan.islemId,
        after,
      });
    }
    return plan.islemId;
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
    const plan = await planRemoveTransaction(islem);
    const batch = writeBatch(db);
    plan.apply(batch);
    await commitWrite(batch.commit(), 'removeTransaction');
    if (activityEnabled() && plan.record) {
      recordActivity({
        category: transactionCategory(plan.record.type),
        action: 'delete',
        title: transactionTitle(plan.record),
        amount: Number(plan.record.amount) || 0,
        currency: plan.record.currency,
        refId: plan.islemId,
        risky: true,
        before: summarizeTransaction(plan.record),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ISLEMLER_COLL)}/${islem.id}`);
    throw error;
  }
}

/**
 * Bir işlemi düzenler: eski kaydı (bağlı tahsilatlarıyla) geri alır ve yenisini yazar.
 * İkisi tek batch'te yazılır; yeni kayıt doğrulamadan geçemezse hiçbir şey değişmez.
 */
export async function replaceTransaction(oldIslem: Transaction, islemData: Omit<Transaction, 'id'>, linkedReceipts: LinkedReceiptInput[] = []) {
  if (!oldIslem || !oldIslem.id) {
    throw new Error("Geçersiz işlem verisi.");
  }
  try {
    const removePlan = await planRemoveTransaction(oldIslem);
    // Düzenlemede ilk kaydı yapan kişi korunur, düzenleyen ayrıca yazılır
    const original = removePlan.record || oldIslem;
    const stamp: Record<string, ActorStamp> = { ...stampFields(false) };
    if ((original as any).createdBy) stamp.createdBy = (original as any).createdBy;
    const createPlan = await planCreateTransaction(islemData, linkedReceipts, stamp);
    const batch = writeBatch(db);
    removePlan.apply(batch);
    createPlan.apply(batch);
    await commitWrite(batch.commit(), 'replaceTransaction');
    if (activityEnabled() && createPlan.record) {
      recordActivity({
        category: transactionCategory(createPlan.record.type),
        action: 'update',
        title: transactionTitle(createPlan.record),
        amount: Number(createPlan.record.amount) || 0,
        currency: createPlan.record.currency,
        refId: createPlan.islemId,
        risky: true,
        before: summarizeTransaction(original),
        after: summarizeTransaction(createPlan.record),
      });
    }
    return createPlan.islemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${getPath(ISLEMLER_COLL)}/${oldIslem.id}`);
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
    const before = await readForLog(CEKSENET_COLL, id);
    const finalItem: CekSenet = cleanUndefined({
      id: newId,
      ...item,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalItem);
    {
      const x: any = finalItem;
      logRecordSave('ceksenet', `${x.docType === 'note' ? 'Senet' : 'Çek'} · ${x.cariName || x.debtor || ''}${x.serialNo ? ` (${x.serialNo})` : ''}`, newId, before, x, Number(x.amount) || 0);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CEKSENET_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCekSenet(id: string) {
  try {
    const before = await readForLog(CEKSENET_COLL, id);
    await deleteDoc(doc(db, getPath(CEKSENET_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('ceksenet', `${x.docType === 'note' ? 'Senet' : 'Çek'} · ${x.cariName || x.debtor || ''}${x.serialNo ? ` (${x.serialNo})` : ''}`, id, before, Number(x.amount) || 0);
    }
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
    const before = await readForLog(GIDERLER_COLL, id);
    const finalExpense: Expense = cleanUndefined({
      id: newId,
      ...expense,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalExpense);
    {
      const x: any = finalExpense;
      logRecordSave('gider', `Gider: ${x.title || x.category || ''}`, newId, before, x, Number(x.amount) || 0);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(GIDERLER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteExpense(id: string) {
  try {
    const before = await readForLog(GIDERLER_COLL, id);
    await deleteDoc(doc(db, getPath(GIDERLER_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('gider', `Gider: ${x.title || x.category || ''}`, id, before, Number(x.amount) || 0);
    }
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
    const before = await readForLog(TEKRARLAYAN_COLL, id);
    const finalItem: RecurringTransaction = cleanUndefined({
      id: newId,
      ...item,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalItem);
    {
      const x: any = finalItem;
      logRecordSave('gider', `Tekrarlayan işlem: ${x.title || ''}`, newId, before, x, Number(x.amount) || 0);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(TEKRARLAYAN_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteRecurringTransaction(id: string) {
  try {
    const before = await readForLog(TEKRARLAYAN_COLL, id);
    await deleteDoc(doc(db, getPath(TEKRARLAYAN_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('gider', `Tekrarlayan işlem: ${x.title || ''}`, id, before, Number(x.amount) || 0);
    }
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
    const before = await readForLog(CALISANLAR_COLL, id);
    const finalEmployee: Employee = cleanUndefined({
      id: newId,
      ...employee,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalEmployee);
    {
      const x: any = finalEmployee;
      logRecordSave('personel', `Personel: ${x.name || ''}`, newId, before, x, undefined);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CALISANLAR_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  try {
    const before = await readForLog(CALISANLAR_COLL, id);
    await deleteDoc(doc(db, getPath(CALISANLAR_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('personel', `Personel: ${x.name || ''}`, id, before, undefined);
    }
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
    const before = await readForLog(CALISAN_ISLEMLER_COLL, id);
    const finalTx: EmployeeTransaction = cleanUndefined({
      id: newId,
      ...transaction,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalTx);
    {
      const x: any = finalTx;
      logRecordSave('personel', `${x.type === 'payment' ? 'Maaş ödemesi' : x.type === 'advance' ? 'Avans' : 'Hak ediş'} · ${x.employeeName || ''}`, newId, before, x, Number(x.amount) || 0);
    }

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
    const before = await readForLog(CALISAN_ISLEMLER_COLL, id);
    await deleteDoc(doc(db, getPath(CALISAN_ISLEMLER_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('personel', `${x.type === 'payment' ? 'Maaş ödemesi' : x.type === 'advance' ? 'Avans' : 'Hak ediş'} · ${x.employeeName || ''}`, id, before, Number(x.amount) || 0);
    }
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
    const before = await readForLog(KREDILER_COLL, id);
    const finalCredit: Credit = cleanUndefined({
      id: newId,
      ...credit,
      ...stampFields(!before),
    });
    await setDoc(docRef, finalCredit);
    {
      const x: any = finalCredit;
      logRecordSave('kredi', `Kredi: ${[x.bank, x.name].filter(Boolean).join(' ')}`, newId, before, x, Number(x.totalAmount) || 0);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(KREDILER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteCredit(id: string) {
  try {
    const before = await readForLog(KREDILER_COLL, id);
    await deleteDoc(doc(db, getPath(KREDILER_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('kredi', `Kredi: ${[x.bank, x.name].filter(Boolean).join(' ')}`, id, before, Number(x.totalAmount) || 0);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(KREDILER_COLL)}/${id}`);
    throw error;
  }
}

// FİRMA AYARLARI (users/{firma}/ayarlar/{ayarId}) - firmanın tüm cihazlarında ortak
// Kullanılanlar: belgeGorunumu (PDF logo, firma bilgileri, renk), etiketTasarimi (etiket ölçü/içerik)
export function subscribeSettingDoc(settingId: string, callback: (data: Record<string, any> | null, meta: { fromCache: boolean }) => void) {
  const ref = doc(db, getPath(AYARLAR_COLL), settingId);
  return onSnapshot(ref, (snapshot) => {
    // fromCache: veri sunucudan doğrulanmadı (çevrimdışı ya da önbellekten ilk okuma)
    const fromCache = !!(snapshot as any).metadata?.fromCache;
    callback(snapshot.exists() ? (snapshot.data() as Record<string, any>) : null, { fromCache });
  }, (error) => handleFirestoreError(error, OperationType.GET, `${getPath(AYARLAR_COLL)}/${settingId}`));
}

export async function saveSettingDoc(settingId: string, data: Record<string, any>) {
  try {
    const ref = doc(db, getPath(AYARLAR_COLL), settingId);
    await commitWrite(setDoc(ref, cleanUndefined({ ...data, id: settingId, updatedAt: new Date().toISOString() })), `saveSettingDoc:${settingId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${getPath(AYARLAR_COLL)}/${settingId}`);
    throw error;
  }
}

export function subscribeDocumentBranding(callback: (data: Record<string, any> | null) => void) {
  return subscribeSettingDoc(DOCUMENT_BRANDING_DOC_ID, callback);
}

export async function saveDocumentBranding(data: Record<string, any>) {
  return saveSettingDoc(DOCUMENT_BRANDING_DOC_ID, data);
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
    const before = await readForLog(HESAPLAR_COLL, id);
    const finalAccount = cleanUndefined({ id: newId, ...account, ...stampFields(!before) });
    await setDoc(docRef, finalAccount);
    {
      const x: any = finalAccount;
      logRecordSave('kasa', `Hesap: ${x.name || x.bankName || ''}`, newId, before, x, undefined);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAPLAR_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteBankAccount(id: string) {
  try {
    const before = await readForLog(HESAPLAR_COLL, id);
    await deleteDoc(doc(db, getPath(HESAPLAR_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('kasa', `Hesap: ${x.name || x.bankName || ''}`, id, before, undefined);
    }
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
    const before = await readForLog(HESAP_ISLEMLER_COLL, id);
    const finalTx = cleanUndefined({ id: newId, ...transaction, ...stampFields(!before) });
    await setDoc(docRef, finalTx);
    {
      const x: any = finalTx;
      logRecordSave('kasa', `Kasa/Banka hareketi: ${x.description || x.title || ''}`, newId, before, x, Number(x.amount) || 0);
    }
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAP_ISLEMLER_COLL)}/${id || 'new'}`);
    throw error;
  }
}

export async function deleteAccountTransaction(id: string) {
  try {
    const before = await readForLog(HESAP_ISLEMLER_COLL, id);
    await deleteDoc(doc(db, getPath(HESAP_ISLEMLER_COLL), id));
    {
      const x: any = before || {};
      logRecordDelete('kasa', `Kasa/Banka hareketi: ${x.description || x.title || ''}`, id, before, Number(x.amount) || 0);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(HESAP_ISLEMLER_COLL)}/${id}`);
    throw error;
  }
}

export async function clearAllDatabaseData() {
  try {
    recordActivity({ category: 'sistem', action: 'reset', title: 'Tüm veriler sıfırlandı', risky: true });
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

// optional: eski yedeklerde bulunmayan koleksiyonlar; yedekte yoksa geri yüklemede dokunulmaz
const ALL_COLLECTIONS: { name: string; backupKey: string; optional?: boolean }[] = [
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
  { name: AYARLAR_COLL, backupKey: 'ayarlar', optional: true },
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
    recordActivity({ category: 'sistem', action: 'import', title: 'Yedekten geri yükleme yapıldı (mevcut veriler yedektekiyle değiştirildi)', risky: true });
    const BATCH_LIMIT = 450;
    for (const { name, backupKey, optional } of ALL_COLLECTIONS) {
      const rawItems = backupJson ? backupJson[backupKey] : undefined;
      if (optional && !Array.isArray(rawItems)) continue;
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

