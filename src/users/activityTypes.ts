/**
 * Hareket günlüğü (kim, ne zaman, ne yaptı).
 *
 * Kullanıcı sistemi açıkken giriş/çıkışlar ve veri değiştiren her işlem
 * users/{firma}/hareketGunlugu koleksiyonuna yazılır. Silme ve düzenlemelerde
 * kaydın eski hâli de saklanır; sahip "Çalışan Takibi" ekranından inceler.
 */

export type ActivityCategory =
  | 'oturum'
  | 'satis'
  | 'tahsilat'
  | 'cari'
  | 'stok'
  | 'gider'
  | 'ceksenet'
  | 'personel'
  | 'kredi'
  | 'kasa'
  | 'yetki'
  | 'sistem';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'auto_logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'elevate'
  | 'import'
  | 'reset';

export interface ActivityActor {
  id: string;
  name: string;
  role: 'owner' | 'staff';
}

/** Kayıtların üzerine yazılan "kim yaptı" bilgisi */
export interface ActorStamp {
  id: string;
  name: string;
  at: string;
}

export interface ActivityEntry {
  id: string;
  /** ISO zaman damgası */
  at: string;
  /** Yerel gün (YYYY-MM-DD); günlük sorgular bununla yapılır */
  day: string;
  userId: string;
  userName: string;
  role: 'owner' | 'staff';
  category: ActivityCategory;
  action: ActivityAction;
  /** İnsan okunur açıklama, ör. "Satış Faturası · Öztürk Ltd (FT-0012)" */
  title: string;
  amount?: number;
  currency?: string;
  /** İlgili kaydın id'si */
  refId?: string;
  /** Silme, düzenleme, yetki yükseltme, PIN onayı gibi sahibin dikkat etmesi gereken işlemler */
  risky?: boolean;
  /** Silinen/düzenlenen kaydın önceki hâli (özet) */
  before?: Record<string, any>;
  /** Düzenlenen kaydın yeni hâli (özet) */
  after?: Record<string, any>;
  device?: 'Telefon' | 'Bilgisayar';
}

export type ActivityInput = Omit<ActivityEntry, 'id' | 'at' | 'day' | 'userId' | 'userName' | 'role' | 'device'>;

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  oturum: 'Oturum',
  satis: 'Satış / Alış',
  tahsilat: 'Tahsilat / Ödeme',
  cari: 'Cari',
  stok: 'Stok',
  gider: 'Gider',
  ceksenet: 'Çek / Senet',
  personel: 'Personel',
  kredi: 'Kredi',
  kasa: 'Kasa / Banka',
  yetki: 'Yetki',
  sistem: 'Sistem',
};

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  login: 'Giriş yaptı',
  logout: 'Çıkış yaptı',
  auto_logout: 'Oturumu kapandı (20 dk işlem yok)',
  create: 'Ekledi',
  update: 'Düzenledi',
  delete: 'Sildi',
  approve: 'Sahip onayı aldı',
  elevate: 'Yönetici yetkisi aldı',
  import: 'İçe aktardı',
  reset: 'Sıfırladı',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  sale: 'Satış Faturası',
  purchase: 'Alış Faturası',
  sale_return: 'Satıştan İade',
  purchase_return: 'Alıştan İade',
  collection: 'Tahsilat',
  payment: 'Ödeme',
};

/** Yerel saatle YYYY-MM-DD */
export function localDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function currentDevice(): 'Telefon' | 'Bilgisayar' {
  try {
    if (typeof window === 'undefined') return 'Bilgisayar';
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|Mobile/i.test(ua) || window.innerWidth < 768 ? 'Telefon' : 'Bilgisayar';
  } catch {
    return 'Bilgisayar';
  }
}

/** Günlükte saklanacak kısa işlem özeti (kalemler dahil, gereksiz alanlar hariç) */
export function summarizeTransaction(t: Record<string, any> | null | undefined): Record<string, any> | undefined {
  if (!t) return undefined;
  return {
    type: t.type,
    typeLabel: TRANSACTION_TYPE_LABELS[t.type] || t.type,
    cariName: t.cariName || '',
    date: t.date || '',
    amount: Number(t.amount) || 0,
    currency: t.currency || 'TRY',
    invoiceNo: t.invoiceNo || '',
    account: t.account || '',
    description: t.description || '',
    items: Array.isArray(t.items)
      ? t.items.slice(0, 50).map((i: any) => ({ name: i.stockName || '', qty: Number(i.quantity) || 0, price: Number(i.price) || 0, total: Number(i.total) || 0 }))
      : undefined,
  };
}

/** Basit kayıtlar için özet: yalnızca düz (sayı/metin/mantıksal) alanlar */
export function summarizePlain(obj: Record<string, any> | null | undefined, max = 25): Record<string, any> | undefined {
  if (!obj) return undefined;
  const out: Record<string, any> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (count >= max) break;
    if (k === 'createdBy' || k === 'updatedBy' || k === 'imageUrl') continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = typeof v === 'string' && v.length > 200 ? `${v.slice(0, 200)}…` : v;
      count++;
    }
  }
  return out;
}

export function transactionTitle(t: Record<string, any>): string {
  const label = TRANSACTION_TYPE_LABELS[t.type] || 'İşlem';
  const parts = [label];
  if (t.cariName) parts.push(t.cariName);
  const base = parts.join(' · ');
  return t.invoiceNo ? `${base} (${t.invoiceNo})` : base;
}

export function transactionCategory(type: string): ActivityCategory {
  return type === 'collection' || type === 'payment' ? 'tahsilat' : 'satis';
}
