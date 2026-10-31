/**
 * Storm Ön Muhasebe - AI Asistan Araç Seti
 *
 * Gemini'ye uygulamanın işlevleri "araç" (function calling) olarak tanıtılır.
 * - read : veriyi okur, hemen çalışır.
 * - write: önce prepare() ile girdiler doğrulanıp kullanıcıya özet gösterilir;
 *          kayıt ancak kullanıcı onayladıktan sonra execute() ile yapılır.
 * - ui   : yalnızca sohbet ekranında gösterim (grafik).
 * Kayıtlar, uygulama ekranlarının kullandığı aynı veritabanı fonksiyonlarıyla yapılır.
 */
import {
  Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction,
  BankAccount, AccountTransaction, InvoiceItem, LinkedReceiptInput
} from '../types';
import {
  createTransaction, removeTransaction, saveCari, saveStock, saveExpense, deleteExpense,
  saveEmployeeTransaction, saveCekSenet, saveAccountTransaction
} from '../firebase';
import { calculateInvoiceLine, calculateInvoiceTotals, roundMoney } from '../utils/invoiceMath';
import { grossSalesPrice, netSalesPrice, salesPriceIncludesTax, salesPriceTaxLabel } from '../utils/stockPricing';
import { getTodayISO, parseDateISO } from '../utils/dateUtils';
import { computeRaporlarStats } from '../components/raporlar/useRaporlarStats';
import { computeAccountBalances, createCashCurrencyConverters } from '../utils/cashBalances';
import { TCMBRatesResult, calculateExchangeRate } from '../utils/tcmbService';

export interface AiDataContext {
  cariler: Cari[];
  stoklar: Stock[];
  islemler: Transaction[];
  ceksenet: CekSenet[];
  expenses: Expense[];
  bankAccounts: BankAccount[];
  employees: Employee[];
  employeeTransactions: EmployeeTransaction[];
  accountTransactions: AccountTransaction[];
  fxRates: TCMBRatesResult;
}

export interface AiPermissionContext {
  isRestricted: boolean; // Güvenlik modu açık ve kullanıcı personel rolünde
  sensitiveTabs: string[];
  actionPermissions: Record<string, boolean>;
}

export interface AiToolContext {
  data: AiDataContext;
  permissions: AiPermissionContext;
}

export interface PreparedWrite {
  summary: string[]; // Kullanıcıya onay kartında gösterilecek satırlar
  execute: () => Promise<any>;
}

export interface AiChart {
  tip: 'bar' | 'pie';
  data: { name: string; value: number }[];
}

export type AiToolKind = 'read' | 'write' | 'ui';

export interface AiTool {
  name: string;
  description: string;
  parameters: any;
  kind: AiToolKind;
  tab: string; // Yetki kontrolü için ilgili menü
  run?: (args: any, ctx: AiToolContext) => any; // read
  prepare?: (args: any, ctx: AiToolContext) => PreparedWrite | { error: string }; // write
  chart?: (args: any) => AiChart; // ui
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const S = (description: string, extra: any = {}) => ({ type: 'STRING', description, ...extra });
const N = (description: string) => ({ type: 'NUMBER', description });
const B = (description: string) => ({ type: 'BOOLEAN', description });
const OBJ = (properties: any, required: string[] = []) => ({ type: 'OBJECT', properties, required });
const DATE = (description: string) => S(`${description} (YYYY-MM-DD). Belirtilmezse bugün.`);
const PAYMENT_ACCOUNT = S('Ödeme hesabı: kasa (nakit), banka, pos (kredi kartı).', { enum: ['kasa', 'banka', 'pos'] });

const money = (value: number, currency: string = 'TRY') =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(Number(value) || 0);

const norm = (value: string) => (value || '').toLocaleLowerCase('tr-TR').trim();

/** Kaydı id, kod veya ada göre bulur; ad birden fazla kayda uyuyorsa hata döner. */
function resolveRecord<T extends { id: string }>(
  list: T[],
  ref: string,
  label: string,
  nameOf: (item: T) => string,
  codeOf?: (item: T) => string | undefined
): { item: T } | { error: string } {
  const query = norm(String(ref || ''));
  if (!query) return { error: `${label} belirtilmedi.` };
  const byId = list.find(item => item.id === ref);
  if (byId) return { item: byId };
  const byCode = codeOf ? list.find(item => norm(codeOf(item) || '') === query) : undefined;
  if (byCode) return { item: byCode };
  const exact = list.filter(item => norm(nameOf(item)) === query);
  if (exact.length === 1) return { item: exact[0] };
  const partial = list.filter(item => norm(nameOf(item)).includes(query));
  if (partial.length === 1) return { item: partial[0] };
  if (partial.length > 1 || exact.length > 1) {
    const names = (exact.length > 1 ? exact : partial).slice(0, 8).map(item => `${nameOf(item)} (id: ${item.id})`).join(', ');
    return { error: `"${ref}" birden fazla ${label.toLocaleLowerCase('tr-TR')} ile eşleşti: ${names}. Hangisi olduğunu kullanıcıya sor.` };
  }
  return { error: `"${ref}" adında ${label.toLocaleLowerCase('tr-TR')} bulunamadı. Önce arama aracıyla kontrol et veya kullanıcıya sor.` };
}

const findCari = (ctx: AiToolContext, ref: string) => resolveRecord(ctx.data.cariler, ref, 'Cari', c => c.name, c => c.code);
const findStock = (ctx: AiToolContext, ref: string) => resolveRecord(ctx.data.stoklar, ref, 'Ürün', s => s.name, s => s.barcode || s.code);
const findEmployee = (ctx: AiToolContext, ref: string) => resolveRecord(ctx.data.employees, ref, 'Personel', e => e.name);
const findBankAccount = (ctx: AiToolContext, ref: string) => resolveRecord(ctx.data.bankAccounts, ref, 'Hesap', a => a.name);

function validDate(value: string | undefined): string | null {
  if (!value) return getTodayISO();
  return isNaN(parseDateISO(value).getTime()) ? null : value;
}

const ACCOUNT_MAP: Record<string, 'cash' | 'bank' | 'pos'> = { kasa: 'cash', banka: 'bank', pos: 'pos' };
const ACCOUNT_LABEL: Record<string, string> = { cash: 'Kasa (Nakit)', bank: 'Banka', pos: 'POS / Kredi Kartı', '': 'Açık Hesap (Vadeli)' };
const TYPE_LABEL: Record<string, string> = {
  sale: 'Satış Faturası', purchase: 'Alış Faturası', sale_return: 'Satıştan İade', purchase_return: 'Alıştan İade',
  collection: 'Tahsilat', payment: 'Ödeme'
};

/** Belirtilen hesap kimliğini/adını çözer ve ödeme türüyle uyumunu kontrol eder. */
function resolvePaymentAccount(ctx: AiToolContext, account: 'cash' | 'bank' | 'pos', ref?: string): { bankAccountId?: string; label: string } | { error: string } {
  if (!ref) return { label: ACCOUNT_LABEL[account] };
  const found = findBankAccount(ctx, ref);
  if ('error' in found) return found;
  const expectedType = account === 'cash' ? 'kasa' : account === 'bank' ? 'banka' : 'pos';
  if (found.item.type !== expectedType) {
    return { error: `"${found.item.name}" hesabı ${found.item.type} türünde; seçilen ödeme hesabı (${expectedType}) ile uyuşmuyor.` };
  }
  return { bankAccountId: found.item.id, label: `${ACCOUNT_LABEL[account]} - ${found.item.name}` };
}

function inRange(date: string, start?: string, end?: string) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function denied(ctx: AiToolContext, tool: AiTool): string | null {
  if (ctx.permissions.isRestricted && ctx.permissions.sensitiveTabs.includes(tool.tab)) {
    return 'Yetki Kısıtlaması: Personel rolünde bu menüye ait işlemlere yetkiniz yok. Yönetici girişi gerekir.';
  }
  return null;
}

function actionDenied(ctx: AiToolContext, actionKey: string): string | null {
  if (ctx.permissions.isRestricted && !ctx.permissions.actionPermissions?.[actionKey]) {
    return 'Yetki Kısıtlaması: Personel rolünde bu işlem (silme/düzenleme) için yetkiniz yok. Yönetici girişi gerekir.';
  }
  return null;
}

const nextCode = (prefix: string, count: number) => `${prefix}-${String(count + 1).padStart(4, '0')}`;

// ---------------------------------------------------------------------------
// Okuma araçları
// ---------------------------------------------------------------------------

const readTools: AiTool[] = [
  {
    name: 'cari_ara',
    kind: 'read',
    tab: 'cariler',
    description: 'Müşteri/tedarikçi (cari) hesaplarını arar. Bakiye pozitifse cari bize borçlu, negatifse biz cariye borçluyuz.',
    parameters: OBJ({
      sorgu: S('Ad, kod veya telefonun bir kısmı. Boş bırakılırsa tüm cariler.'),
      tur: S('Cari türü filtresi', { enum: ['musteri', 'tedarikci', 'tumu'] }),
      bakiye: S('Bakiye filtresi', { enum: ['borclu', 'alacakli', 'tumu'] }),
    }),
    run: (args, ctx) => {
      const q = norm(args.sorgu || '');
      let list = ctx.data.cariler.filter(c => !q || norm(c.name).includes(q) || norm(c.code).includes(q) || (c.phone || '').includes(q));
      if (args.tur === 'musteri') list = list.filter(c => c.type !== 'supplier');
      if (args.tur === 'tedarikci') list = list.filter(c => c.type !== 'customer');
      if (args.bakiye === 'borclu') list = list.filter(c => (c.balance || 0) > 0);
      if (args.bakiye === 'alacakli') list = list.filter(c => (c.balance || 0) < 0);
      return {
        toplam: list.length,
        cariler: list.slice(0, 30).map(c => ({ id: c.id, ad: c.name, kod: c.code, tur: c.type, bakiye: roundMoney(c.balance || 0), para_birimi: c.currency || 'TRY', telefon: c.phone || '' })),
      };
    },
  },
  {
    name: 'cari_ekstre',
    kind: 'read',
    tab: 'cariler',
    description: 'Bir carinin dönem ekstresini (borç/alacak hareketleri ve yürüyen bakiye) getirir.',
    parameters: OBJ({
      cari: S('Cari id, kod veya adı'),
      baslangic: S('Başlangıç tarihi YYYY-MM-DD (varsayılan: yılbaşı)'),
      bitis: S('Bitiş tarihi YYYY-MM-DD (varsayılan: bugün)'),
    }, ['cari']),
    run: (args, ctx) => {
      const found = findCari(ctx, args.cari);
      if ('error' in found) return { hata: found.error };
      const today = getTodayISO();
      const stats = computeRaporlarStats({
        ...ctx.data, resolvedDates: { start: args.baslangic || `${today.slice(0, 4)}-01-01`, end: args.bitis || today },
        selectedCariId: found.item.id, selectedCurrency: found.item.currency || 'TRY', stockValuationType: 'purchase',
        stockSearch: '', cariSearch: '', cariTypeFilter: 'all',
      });
      const e = stats.cariEkstreStats;
      return {
        cari: found.item.name, para_birimi: found.item.currency || 'TRY',
        donem_oncesi_bakiye: roundMoney(e.priorBalance || 0), donem_sonu_bakiye: roundMoney(e.finalBalance || 0),
        guncel_bakiye: roundMoney(found.item.balance || 0),
        hareketler: (e.periodTransactions || []).slice(-40).map((t: any) => ({
          id: t.id, tarih: t.date, tur: TYPE_LABEL[t.type] || t.type, aciklama: t.description, borc: roundMoney(t.borc), alacak: roundMoney(t.alacak), bakiye: roundMoney(t.runningBalance),
        })),
      };
    },
  },
  {
    name: 'stok_ara',
    kind: 'read',
    tab: 'stoklar',
    description: 'Ürün/stok kartlarını arar (fiyatlar KDV hariç, stok miktarı ve kritik seviye ile).',
    parameters: OBJ({
      sorgu: S('Ürün adı, kod veya barkodun bir kısmı. Boş bırakılırsa tümü.'),
      sadece_kritik: B('Sadece kritik seviyenin altındaki ürünler'),
    }),
    run: (args, ctx) => {
      const q = norm(args.sorgu || '');
      let list = ctx.data.stoklar.filter(s => !q || norm(s.name).includes(q) || norm(s.code).includes(q) || norm(s.barcode || '').includes(q));
      if (args.sadece_kritik) list = list.filter(s => (s.quantity || 0) <= (s.minQuantity || 0));
      return {
        toplam: list.length,
        urunler: list.slice(0, 30).map(s => ({ id: s.id, ad: s.name, kod: s.code, birim: s.unit, miktar: s.quantity, kritik_seviye: s.minQuantity, alis_fiyati: s.purchasePrice, satis_fiyati_kdv_haric: netSalesPrice(s), satis_fiyati_kdv_dahil: grossSalesPrice(s), kdv: s.taxRate ?? 0, barkod: s.barcode || '' })),
      };
    },
  },
  {
    name: 'islem_listele',
    kind: 'read',
    tab: 'islemler',
    description: 'Fatura, tahsilat ve ödeme kayıtlarını listeler (en yeniden eskiye).',
    parameters: OBJ({
      tur: S('İşlem türü', { enum: ['satis', 'alis', 'satis_iade', 'alis_iade', 'tahsilat', 'odeme', 'tumu'] }),
      cari: S('Cari id, kod veya adı (isteğe bağlı)'),
      baslangic: S('Başlangıç tarihi YYYY-MM-DD'),
      bitis: S('Bitiş tarihi YYYY-MM-DD'),
      adet: N('En fazla kaç kayıt (varsayılan 20, en fazla 50)'),
    }),
    run: (args, ctx) => {
      const typeMap: Record<string, string> = { satis: 'sale', alis: 'purchase', satis_iade: 'sale_return', alis_iade: 'purchase_return', tahsilat: 'collection', odeme: 'payment' };
      let list = [...ctx.data.islemler];
      if (args.tur && args.tur !== 'tumu') list = list.filter(t => t.type === typeMap[args.tur]);
      if (args.cari) {
        const found = findCari(ctx, args.cari);
        if ('error' in found) return { hata: found.error };
        list = list.filter(t => t.cariId === found.item.id);
      }
      list = list.filter(t => inRange(t.date, args.baslangic, args.bitis)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
      const limit = Math.min(Math.max(Number(args.adet) || 20, 1), 50);
      return {
        toplam: list.length,
        toplam_tutar: roundMoney(list.reduce((acc, t) => acc + (t.amount || 0), 0)),
        islemler: list.slice(0, limit).map(t => ({
          id: t.id, tarih: t.date, tur: TYPE_LABEL[t.type] || t.type, cari: t.cariName, tutar: t.amount, para_birimi: t.currency || 'TRY',
          hesap: t.linkedInvoiceId ? 'Faturaya bağlı peşin kayıt' : ACCOUNT_LABEL[t.account || ''], fatura_no: t.invoiceNo || '', aciklama: t.description,
          kalemler: (t.items || []).map(i => `${i.quantity} ${i.unit} ${i.stockName}`).join(', '),
        })),
      };
    },
  },
  {
    name: 'masraf_listele',
    kind: 'read',
    tab: 'masraflar',
    description: 'Masraf/gider kayıtlarını listeler ve toplamını verir.',
    parameters: OBJ({
      baslangic: S('Başlangıç tarihi YYYY-MM-DD'),
      bitis: S('Bitiş tarihi YYYY-MM-DD'),
      kategori: S('Kategori filtresi (isteğe bağlı)'),
    }),
    run: (args, ctx) => {
      let list = ctx.data.expenses.filter(e => inRange(e.date, args.baslangic, args.bitis));
      if (args.kategori) list = list.filter(e => norm(e.category).includes(norm(args.kategori)));
      list.sort((a, b) => b.date.localeCompare(a.date));
      const byCategory: Record<string, number> = {};
      list.forEach(e => { byCategory[e.category] = roundMoney((byCategory[e.category] || 0) + (e.amount || 0)); });
      return {
        toplam_adet: list.length, toplam_tutar: roundMoney(list.reduce((acc, e) => acc + (e.amount || 0), 0)), kategori_dagilimi: byCategory,
        masraflar: list.slice(0, 30).map(e => ({ id: e.id, tarih: e.date, baslik: e.title, kategori: e.category, tutar: e.amount, para_birimi: e.currency || 'TRY', hesap: ACCOUNT_LABEL[e.account] })),
      };
    },
  },
  {
    name: 'kasa_durumu',
    kind: 'read',
    tab: 'kasa',
    description: 'Kasa, banka ve POS hesaplarının güncel bakiyelerini verir.',
    parameters: OBJ({}),
    run: (_args, ctx) => {
      const converters = createCashCurrencyConverters(ctx.data.bankAccounts, ctx.data.cariler, ctx.data.fxRates);
      const balances = computeAccountBalances({ ...ctx.data, converters });
      return {
        hesaplar: ctx.data.bankAccounts.map(a => ({ id: a.id, ad: a.name, tur: a.type, para_birimi: a.currency, bakiye: roundMoney(balances[a.id] || 0) })),
      };
    },
  },
  {
    name: 'finansal_ozet',
    kind: 'read',
    tab: 'raporlar',
    description: 'Seçilen dönemin kâr-zarar özeti (satışlar KDV hariç, iadeler düşülmüş), KDV durumu, alacak/borç toplamları ve stok değeri.',
    parameters: OBJ({
      baslangic: S('Başlangıç tarihi YYYY-MM-DD'),
      bitis: S('Bitiş tarihi YYYY-MM-DD'),
      para_birimi: S('Rapor para birimi', { enum: ['TRY', 'USD', 'EUR'] }),
    }, ['baslangic', 'bitis']),
    run: (args, ctx) => {
      const currency = args.para_birimi || 'TRY';
      const stats = computeRaporlarStats({
        ...ctx.data, resolvedDates: { start: args.baslangic, end: args.bitis }, selectedCariId: '', selectedCurrency: currency,
        stockValuationType: 'purchase', stockSearch: '', cariSearch: '', cariTypeFilter: 'all',
      });
      const s = stats.summaryStats; const k = stats.kdvStats;
      const r = (v: number) => roundMoney(v || 0);
      return {
        para_birimi: currency, donem: `${args.baslangic} - ${args.bitis}`,
        satis_kdv_haric: r(s.sales), satilan_mal_maliyeti: r(s.costOfSales), brut_kar: r(s.grossProfit),
        masraflar: r(s.totalExpenses), personel_hakedis: r(s.employeeSalaries), net_kar: r(s.netProfit),
        alislar: r(s.purchases), tahsilatlar: r(s.collections), odemeler: r(s.payments),
        hesaplanan_kdv: r(k.salesKdvTotal), indirilecek_kdv: r(k.purchaseKdvTotal), odenecek_kdv: r(k.payableKdv), devreden_kdv: r(k.devredenKdv),
        toplam_alacak: r(stats.cariStats.totalReceivables), toplam_borc: r(stats.cariStats.totalPayables),
        stok_degeri_alis_fiyatiyla: r(stats.stockStats.totalValuation), kritik_stok_sayisi: stats.stockStats.criticalStockCount,
        not: 'Satılan malın maliyeti stok kartlarındaki güncel alış fiyatından tahmin edilir.',
      };
    },
  },
  {
    name: 'cek_senet_listele',
    kind: 'read',
    tab: 'ceksenet',
    description: 'Çek ve senetleri listeler; vadesi yaklaşanları bulmak için kullanılır.',
    parameters: OBJ({
      tur: S('Alınan (müşteriden) veya verilen (tedarikçiye)', { enum: ['alinan', 'verilen', 'tumu'] }),
      durum: S('Durum filtresi', { enum: ['portfoyde', 'tahsil_edildi', 'odendi', 'ciro_edildi', 'karsiliksiz', 'tumu'] }),
      vade_gun: N('Bugünden itibaren kaç gün içinde vadesi gelenler (geçmiş vadeler dahil)'),
    }),
    run: (args, ctx) => {
      const statusMap: Record<string, string> = { portfoyde: 'portfolio', tahsil_edildi: 'collected', odendi: 'paid', ciro_edildi: 'endorsed', karsiliksiz: 'unpaid' };
      let list = [...ctx.data.ceksenet];
      if (args.tur === 'alinan') list = list.filter(c => c.type === 'receivable');
      if (args.tur === 'verilen') list = list.filter(c => c.type === 'payable');
      if (args.durum && args.durum !== 'tumu') list = list.filter(c => c.status === statusMap[args.durum]);
      if (args.vade_gun !== undefined && args.vade_gun !== null) {
        const limitDate = new Date(); limitDate.setDate(limitDate.getDate() + Number(args.vade_gun));
        const limitStr = `${limitDate.getFullYear()}-${String(limitDate.getMonth() + 1).padStart(2, '0')}-${String(limitDate.getDate()).padStart(2, '0')}`;
        list = list.filter(c => c.dueDate <= limitStr);
      }
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return {
        toplam: list.length,
        kayitlar: list.slice(0, 30).map(c => ({ id: c.id, belge: c.docType === 'cheque' ? 'Çek' : 'Senet', tur: c.type === 'receivable' ? 'Alınan' : 'Verilen', cari: c.cariName, tutar: c.amount, para_birimi: c.currency, vade: c.dueDate, durum: c.status, seri_no: c.serialNo, banka: c.bankName || '' })),
      };
    },
  },
  {
    name: 'personel_listele',
    kind: 'read',
    tab: 'calisanlar',
    description: 'Personeli ve her birine olan borcumuzu (hak ediş - ödeme - avans) listeler.',
    parameters: OBJ({ sorgu: S('Ad filtresi (isteğe bağlı)') }),
    run: (args, ctx) => {
      const q = norm(args.sorgu || '');
      return {
        personel: ctx.data.employees.filter(e => !q || norm(e.name).includes(q)).map(e => {
          const balance = ctx.data.employeeTransactions.filter(t => t.employeeId === e.id && (t.currency || 'TRY') === (e.currency || 'TRY'))
            .reduce((acc, t) => acc + (t.type === 'accrual' ? t.amount : -t.amount), 0);
          return { id: e.id, ad: e.name, gorev: e.role, maas: e.baseSalary, para_birimi: e.currency, aktif: e.isActive, odenecek_bakiye: roundMoney(balance) };
        }),
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Yazma araçları (onay gerektirir)
// ---------------------------------------------------------------------------

const writeTools: AiTool[] = [
  {
    name: 'fatura_olustur',
    kind: 'write',
    tab: 'islemler',
    description: 'Satış, alış veya iade faturası keser. Stok ve cari bakiyesi otomatik güncellenir. Ödeme hesabı kasa/banka/pos ise fatura peşin ödenmiş sayılır ve cariyi kapatan tahsilat/ödeme otomatik oluşur. Birim fiyatlar KDV hariçtir; KDV belirtilmezse ürün kartındaki oran kullanılır.',
    parameters: OBJ({
      tur: S('Fatura türü', { enum: ['satis', 'alis', 'satis_iade', 'alis_iade'] }),
      cari: S('Cari id, kod veya adı'),
      kalemler: {
        type: 'ARRAY',
        description: 'Fatura kalemleri',
        items: OBJ({
          urun: S('Ürün id, kod, barkod veya adı'),
          miktar: N('Miktar'),
          birim_fiyat: N('KDV hariç birim fiyat (belirtilmezse ürün kartındaki fiyat)'),
          kdv_orani: N('KDV oranı % (belirtilmezse ürün kartındaki oran)'),
        }, ['urun', 'miktar']),
      },
      odeme_hesabi: S('acik_hesap (vadeli) veya peşin ödendiyse kasa/banka/pos', { enum: ['acik_hesap', 'kasa', 'banka', 'pos'] }),
      hesap: S('Belirli bir kasa/banka/POS hesabının adı veya id\'si (isteğe bağlı)'),
      tarih: DATE('Fatura tarihi'),
      fatura_no: S('Fatura numarası (isteğe bağlı)'),
      aciklama: S('Açıklama (isteğe bağlı)'),
    }, ['tur', 'cari', 'kalemler']),
    prepare: (args, ctx) => {
      const typeMap: Record<string, Transaction['type']> = { satis: 'sale', alis: 'purchase', satis_iade: 'sale_return', alis_iade: 'purchase_return' };
      const type = typeMap[args.tur];
      if (!type) return { error: 'Geçersiz fatura türü.' };
      const cariRes = findCari(ctx, args.cari);
      if ('error' in cariRes) return cariRes;
      const cari = cariRes.item;
      const date = validDate(args.tarih);
      if (!date) return { error: 'Tarih YYYY-MM-DD biçiminde olmalı.' };
      if (!Array.isArray(args.kalemler) || args.kalemler.length === 0) return { error: 'En az bir fatura kalemi gerekli.' };

      const items: InvoiceItem[] = [];
      for (const kalem of args.kalemler) {
        const stockRes = findStock(ctx, kalem.urun);
        if ('error' in stockRes) return stockRes;
        const stock = stockRes.item;
        const quantity = Number(kalem.miktar);
        if (!(quantity > 0)) return { error: `"${stock.name}" için miktar sıfırdan büyük olmalı.` };
        const defaultPrice = type === 'sale' || type === 'sale_return' ? netSalesPrice(stock) : stock.purchasePrice;
        const price = kalem.birim_fiyat !== undefined && kalem.birim_fiyat !== null ? Number(kalem.birim_fiyat) : defaultPrice;
        if (!(price >= 0)) return { error: `"${stock.name}" için birim fiyat geçersiz.` };
        const taxRate = kalem.kdv_orani !== undefined && kalem.kdv_orani !== null ? Number(kalem.kdv_orani) : (stock.taxRate ?? 0);
        items.push({ stockId: stock.id, stockName: stock.name, quantity, unit: stock.unit, price, taxRate, total: calculateInvoiceLine(quantity, price, taxRate).total });
      }

      const odeme = args.odeme_hesabi || 'acik_hesap';
      const account: Transaction['account'] = odeme === 'acik_hesap' ? '' : ACCOUNT_MAP[odeme];
      let accountLabel = ACCOUNT_LABEL[account];
      let bankAccountId: string | undefined;
      if (account) {
        const accRes = resolvePaymentAccount(ctx, account, args.hesap);
        if ('error' in accRes) return accRes;
        bankAccountId = accRes.bankAccountId;
        accountLabel = accRes.label;
      }

      const totals = calculateInvoiceTotals(items);
      const currency = cari.currency || 'TRY';
      const islemData: Omit<Transaction, 'id'> = {
        invoiceNo: args.fatura_no || undefined,
        type, cariId: cari.id, cariName: cari.name, date, amount: totals.grandTotal, account, bankAccountId,
        description: args.aciklama || TYPE_LABEL[type], items, createdAt: new Date().toISOString(), currency,
      };
      const linkedReceipts: LinkedReceiptInput[] = account ? [{ amount: totals.grandTotal, account: '' }] : [];

      return {
        summary: [
          `${TYPE_LABEL[type]} — ${cari.name}`,
          ...items.map(i => `• ${i.quantity} ${i.unit} ${i.stockName} × ${money(i.price, currency)}${i.taxRate ? ` + %${i.taxRate} KDV` : ''} = ${money(i.total, currency)}`),
          `Ara toplam: ${money(totals.subtotal, currency)}  KDV: ${money(totals.totalTax, currency)}`,
          `Genel toplam: ${money(totals.grandTotal, currency)}`,
          `Ödeme: ${accountLabel}${account ? ' (peşin, cari bakiyesi değişmez)' : ''}`,
          `Tarih: ${date}${args.fatura_no ? `  Fatura no: ${args.fatura_no}` : ''}`,
        ],
        execute: async () => {
          const id = await createTransaction(islemData, linkedReceipts);
          return { basarili: true, islem_id: id, mesaj: `${TYPE_LABEL[type]} kaydedildi (${money(totals.grandTotal, currency)}).` };
        },
      };
    },
  },
  {
    name: 'tahsilat_odeme',
    kind: 'write',
    tab: 'islemler',
    description: 'Cariden tahsilat (para girişi) veya cariye ödeme (para çıkışı) kaydeder; kasa/banka ve cari bakiyesi güncellenir.',
    parameters: OBJ({
      tur: S('tahsilat: cariden para aldık, odeme: cariye para verdik', { enum: ['tahsilat', 'odeme'] }),
      cari: S('Cari id, kod veya adı'),
      tutar: N('Tutar (carinin para biriminde)'),
      odeme_hesabi: PAYMENT_ACCOUNT,
      hesap: S('Belirli bir kasa/banka/POS hesabının adı veya id\'si (isteğe bağlı)'),
      tarih: DATE('İşlem tarihi'),
      aciklama: S('Açıklama (isteğe bağlı)'),
    }, ['tur', 'cari', 'tutar', 'odeme_hesabi']),
    prepare: (args, ctx) => {
      const type: Transaction['type'] = args.tur === 'odeme' ? 'payment' : 'collection';
      const cariRes = findCari(ctx, args.cari);
      if ('error' in cariRes) return cariRes;
      const cari = cariRes.item;
      const amount = roundMoney(Number(args.tutar));
      if (!(amount > 0)) return { error: 'Tutar sıfırdan büyük olmalı.' };
      const date = validDate(args.tarih);
      if (!date) return { error: 'Tarih YYYY-MM-DD biçiminde olmalı.' };
      const account = ACCOUNT_MAP[args.odeme_hesabi];
      if (!account) return { error: 'Ödeme hesabı kasa, banka veya pos olmalı.' };
      const accRes = resolvePaymentAccount(ctx, account, args.hesap);
      if ('error' in accRes) return accRes;
      const currency = cari.currency || 'TRY';
      const newBalance = (cari.balance || 0) + (type === 'payment' ? amount : -amount);
      return {
        summary: [
          `${TYPE_LABEL[type]} — ${cari.name}`,
          `Tutar: ${money(amount, currency)}`,
          `Hesap: ${accRes.label}`,
          `Tarih: ${date}`,
          `Cari bakiyesi: ${money(cari.balance || 0, currency)} → ${money(newBalance, currency)}`,
        ],
        execute: async () => {
          const id = await createTransaction({
            type, cariId: cari.id, cariName: cari.name, date, amount, account, bankAccountId: accRes.bankAccountId,
            description: args.aciklama || `${TYPE_LABEL[type]} Makbuzu`, createdAt: new Date().toISOString(), currency,
          });
          return { basarili: true, islem_id: id, mesaj: `${TYPE_LABEL[type]} kaydedildi.` };
        },
      };
    },
  },
  {
    name: 'masraf_ekle',
    kind: 'write',
    tab: 'masraflar',
    description: 'Masraf/gider kaydı ekler (kira, elektrik, yakıt vb.). Personel maaşı için personel_islemi aracını kullan.',
    parameters: OBJ({
      baslik: S('Masraf başlığı, ör. "Ekim ayı elektrik faturası"'),
      kategori: S('Kategori', { enum: ['Elektrik', 'Su', 'Doğalgaz', 'Kira', 'Muhasebe Gideri', 'Yemek/Mutfak', 'Ulaşım/Yakıt', 'İnternet/Telefon', 'Vergi/SGK', 'Diğer'] }),
      tutar: N('Tutar'),
      odeme_hesabi: PAYMENT_ACCOUNT,
      hesap: S('Belirli bir kasa/banka/POS hesabının adı veya id\'si (isteğe bağlı)'),
      para_birimi: S('Para birimi (varsayılan TRY)', { enum: ['TRY', 'USD', 'EUR'] }),
      tarih: DATE('Masraf tarihi'),
      aciklama: S('Açıklama (isteğe bağlı)'),
    }, ['baslik', 'kategori', 'tutar', 'odeme_hesabi']),
    prepare: (args, ctx) => {
      const amount = roundMoney(Number(args.tutar));
      if (!(amount > 0)) return { error: 'Tutar sıfırdan büyük olmalı.' };
      const date = validDate(args.tarih);
      if (!date) return { error: 'Tarih YYYY-MM-DD biçiminde olmalı.' };
      const account = ACCOUNT_MAP[args.odeme_hesabi];
      if (!account) return { error: 'Ödeme hesabı kasa, banka veya pos olmalı.' };
      const accRes = resolvePaymentAccount(ctx, account, args.hesap);
      if ('error' in accRes) return accRes;
      const currency = args.para_birimi || 'TRY';
      const category = (args.kategori || 'Diğer') as Expense['category'];
      return {
        summary: [`Masraf — ${args.baslik}`, `Kategori: ${category}`, `Tutar: ${money(amount, currency)}`, `Hesap: ${accRes.label}`, `Tarih: ${date}`],
        execute: async () => {
          const id = await saveExpense({
            title: args.baslik, category, amount, date, account, bankAccountId: accRes.bankAccountId,
            description: args.aciklama || '', currency, createdAt: new Date().toISOString(),
          });
          return { basarili: true, masraf_id: id, mesaj: 'Masraf kaydedildi.' };
        },
      };
    },
  },
  {
    name: 'personel_islemi',
    kind: 'write',
    tab: 'calisanlar',
    description: 'Personel için maaş hak edişi (borçlanma), maaş ödemesi veya avans kaydeder. Ödeme ve avans kasadan/bankadan düşer.',
    parameters: OBJ({
      personel: S('Personel id veya adı'),
      tur: S('hakedis: maaşı hak etti (henüz ödenmedi), odeme: maaş ödendi, avans: avans verildi', { enum: ['hakedis', 'odeme', 'avans'] }),
      tutar: N('Tutar (belirtilmezse hak edişte personelin maaşı)'),
      odeme_hesabi: PAYMENT_ACCOUNT,
      hesap: S('Belirli bir kasa/banka hesabının adı veya id\'si (isteğe bağlı)'),
      tarih: DATE('İşlem tarihi'),
      aciklama: S('Açıklama (isteğe bağlı)'),
    }, ['personel', 'tur']),
    prepare: (args, ctx) => {
      const empRes = findEmployee(ctx, args.personel);
      if ('error' in empRes) return empRes;
      const emp = empRes.item;
      const typeMap: Record<string, EmployeeTransaction['type']> = { hakedis: 'accrual', odeme: 'payment', avans: 'advance' };
      const type = typeMap[args.tur];
      if (!type) return { error: 'Geçersiz personel işlem türü.' };
      const amount = roundMoney(args.tutar !== undefined && args.tutar !== null ? Number(args.tutar) : (type === 'accrual' ? emp.baseSalary : NaN));
      if (!(amount > 0)) return { error: 'Tutar belirtilmeli ve sıfırdan büyük olmalı.' };
      const date = validDate(args.tarih);
      if (!date) return { error: 'Tarih YYYY-MM-DD biçiminde olmalı.' };
      let account: EmployeeTransaction['account'] = '';
      let accLabel = '—';
      let bankAccountId: string | undefined;
      if (type !== 'accrual') {
        const mapped = ACCOUNT_MAP[args.odeme_hesabi];
        if (!mapped) return { error: 'Ödeme ve avans için ödeme hesabı (kasa/banka/pos) belirtilmeli.' };
        const accRes = resolvePaymentAccount(ctx, mapped, args.hesap);
        if ('error' in accRes) return accRes;
        account = mapped; accLabel = accRes.label; bankAccountId = accRes.bankAccountId;
      }
      const label = type === 'accrual' ? 'Maaş Hak Edişi' : type === 'payment' ? 'Maaş Ödemesi' : 'Avans';
      return {
        summary: [`${label} — ${emp.name}`, `Tutar: ${money(amount, emp.currency)}`, `Hesap: ${accLabel}`, `Tarih: ${date}`],
        execute: async () => {
          const id = await saveEmployeeTransaction({
            employeeId: emp.id, employeeName: emp.name, type, amount, currency: emp.currency || 'TRY', date, account, bankAccountId,
            description: args.aciklama || '', createdAt: new Date().toISOString(),
          });
          return { basarili: true, kayit_id: id, mesaj: `${label} kaydedildi.` };
        },
      };
    },
  },
  {
    name: 'cari_ekle',
    kind: 'write',
    tab: 'cariler',
    description: 'Yeni müşteri veya tedarikçi (cari) kartı açar. Açılış bakiyesi pozitifse cari bize borçlu, negatifse biz borçluyuz.',
    parameters: OBJ({
      ad: S('Cari adı / unvanı'),
      tur: S('Cari türü', { enum: ['musteri', 'tedarikci', 'ikisi'] }),
      telefon: S('Telefon'), eposta: S('E-posta'), adres: S('Adres'),
      vergi_dairesi: S('Vergi dairesi'), vergi_no: S('Vergi / TC kimlik no'),
      acilis_bakiyesi: N('Açılış bakiyesi (varsayılan 0)'),
      para_birimi: S('Para birimi (varsayılan TRY)', { enum: ['TRY', 'USD', 'EUR'] }),
    }, ['ad', 'tur']),
    prepare: (args, ctx) => {
      const name = (args.ad || '').trim();
      if (!name) return { error: 'Cari adı boş olamaz.' };
      const duplicate = ctx.data.cariler.find(c => norm(c.name) === norm(name));
      if (duplicate) return { error: `"${duplicate.name}" adında bir cari zaten var (id: ${duplicate.id}). Kullanıcıya yine de yeni kart açılsın mı diye sor; açılacaksa adı farklılaştır.` };
      const typeMap: Record<string, Cari['type']> = { musteri: 'customer', tedarikci: 'supplier', ikisi: 'both' };
      const type = typeMap[args.tur] || 'customer';
      const opening = roundMoney(Number(args.acilis_bakiyesi) || 0);
      const currency = args.para_birimi || 'TRY';
      const code = nextCode('CAR', ctx.data.cariler.length);
      return {
        summary: [
          `Yeni ${type === 'supplier' ? 'tedarikçi' : type === 'both' ? 'müşteri/tedarikçi' : 'müşteri'}: ${name} (${code})`,
          ...(args.telefon ? [`Telefon: ${args.telefon}`] : []), ...(args.eposta ? [`E-posta: ${args.eposta}`] : []), ...(args.adres ? [`Adres: ${args.adres}`] : []),
          `Açılış bakiyesi: ${money(opening, currency)}`,
        ],
        execute: async () => {
          const id = await saveCari({
            name, code, type, phone: args.telefon || '', email: args.eposta || '', address: args.adres || '',
            balance: opening, openingBalance: opening, createdAt: new Date().toISOString(), isActive: true, currency,
            taxOffice: args.vergi_dairesi || undefined, taxNo: args.vergi_no || undefined,
          });
          return { basarili: true, cari_id: id, mesaj: `${name} carisi açıldı.` };
        },
      };
    },
  },
  {
    name: 'cari_guncelle',
    kind: 'write',
    tab: 'cariler',
    description: 'Mevcut carinin iletişim/vergi bilgilerini veya notlarını günceller (bakiye bu araçla değişmez).',
    parameters: OBJ({
      cari: S('Cari id, kod veya adı'),
      ad: S('Yeni ad'), telefon: S('Yeni telefon'), eposta: S('Yeni e-posta'), adres: S('Yeni adres'),
      vergi_dairesi: S('Vergi dairesi'), vergi_no: S('Vergi no'), notlar: S('Notlar'),
    }, ['cari']),
    prepare: (args, ctx) => {
      const cariRes = findCari(ctx, args.cari);
      if ('error' in cariRes) return cariRes;
      const cari = cariRes.item;
      const changes: Partial<Cari> = {};
      const fieldMap: [string, keyof Cari, string][] = [['ad', 'name', 'Ad'], ['telefon', 'phone', 'Telefon'], ['eposta', 'email', 'E-posta'], ['adres', 'address', 'Adres'], ['vergi_dairesi', 'taxOffice', 'Vergi dairesi'], ['vergi_no', 'taxNo', 'Vergi no'], ['notlar', 'notes', 'Notlar']];
      const lines: string[] = [];
      fieldMap.forEach(([arg, field, label]) => {
        if (args[arg] !== undefined && args[arg] !== null && args[arg] !== '') {
          (changes as any)[field] = String(args[arg]);
          lines.push(`${label}: ${(cari as any)[field] || '—'} → ${args[arg]}`);
        }
      });
      if (lines.length === 0) return { error: 'Güncellenecek bir alan belirtilmedi.' };
      return {
        summary: [`Cari güncelleme — ${cari.name}`, ...lines],
        execute: async () => {
          const { id, ...rest } = cari;
          await saveCari({ ...rest, ...changes }, id);
          return { basarili: true, mesaj: `${cari.name} güncellendi.` };
        },
      };
    },
  },
  {
    name: 'stok_ekle',
    kind: 'write',
    tab: 'stoklar',
    description: 'Yeni ürün/stok kartı açar. Fiyatlar KDV hariçtir; KDV belirtilmezse 0 kabul edilir.',
    parameters: OBJ({
      ad: S('Ürün adı'), kod: S('Stok kodu (belirtilmezse otomatik)'), barkod: S('Barkod'),
      birim: S('Birim', { enum: ['Adet', 'KG', 'Litre', 'Metre', 'Kutu', 'Hizmet'] }),
      alis_fiyati: N('KDV hariç alış fiyatı'), satis_fiyati: N('KDV hariç satış fiyatı'),
      kdv_orani: N('KDV oranı % (varsayılan 0)'), miktar: N('Başlangıç stok miktarı (varsayılan 0)'),
      kritik_miktar: N('Kritik stok seviyesi (varsayılan 5)'), kategori: S('Kategori'), marka: S('Marka'),
    }, ['ad']),
    prepare: (args, ctx) => {
      const name = (args.ad || '').trim();
      if (!name) return { error: 'Ürün adı boş olamaz.' };
      const duplicate = ctx.data.stoklar.find(s => norm(s.name) === norm(name));
      if (duplicate) return { error: `"${duplicate.name}" adında bir ürün zaten var (id: ${duplicate.id}). Stok miktarını değiştirmek için stok_guncelle kullan.` };
      const code = (args.kod || '').trim() || nextCode('STK', ctx.data.stoklar.length);
      const stock: Omit<Stock, 'id'> = {
        name, code, unit: (args.birim || 'Adet') as Stock['unit'],
        purchasePrice: Number(args.alis_fiyati) || 0, salesPrice: Number(args.satis_fiyati) || 0, salesPriceIncludesTax: false, taxRate: Number(args.kdv_orani) || 0,
        quantity: Number(args.miktar) || 0, minQuantity: args.kritik_miktar !== undefined ? Number(args.kritik_miktar) || 0 : 5,
        barcode: args.barkod || undefined, category: args.kategori || undefined, brand: args.marka || undefined, createdAt: new Date().toISOString(),
      };
      return {
        summary: [
          `Yeni ürün: ${name} (${code})`,
          `Alış: ${money(stock.purchasePrice)}  Satış: ${money(stock.salesPrice)} (${salesPriceTaxLabel(stock)})  KDV: %${stock.taxRate}`,
          `Stok: ${stock.quantity} ${stock.unit}  Kritik seviye: ${stock.minQuantity}`,
        ],
        execute: async () => {
          const id = await saveStock(stock);
          return { basarili: true, urun_id: id, mesaj: `${name} ürün kartı açıldı.` };
        },
      };
    },
  },
  {
    name: 'stok_guncelle',
    kind: 'write',
    tab: 'stoklar',
    description: 'Mevcut ürünün fiyat, KDV, kritik seviye veya stok miktarını günceller (sayım düzeltmesi). Satış/alış için fatura_olustur kullan.',
    parameters: OBJ({
      urun: S('Ürün id, kod, barkod veya adı'),
      alis_fiyati: N('Yeni KDV hariç alış fiyatı'), satis_fiyati: N('Yeni KDV hariç satış fiyatı'), kdv_orani: N('Yeni KDV oranı %'),
      miktar: N('Yeni stok miktarı (sayım sonucu)'), kritik_miktar: N('Yeni kritik seviye'), ad: S('Yeni ad'), barkod: S('Yeni barkod'),
    }, ['urun']),
    prepare: (args, ctx) => {
      const stockRes = findStock(ctx, args.urun);
      if ('error' in stockRes) return stockRes;
      const stock = stockRes.item;
      const changes: Partial<Stock> = {};
      const lines: string[] = [];
      const numField = (arg: string, field: keyof Stock, label: string, fmt: (v: number) => string) => {
        if (args[arg] !== undefined && args[arg] !== null) {
          const v = Number(args[arg]);
          if (isNaN(v)) return;
          (changes as any)[field] = v;
          lines.push(`${label}: ${fmt((stock as any)[field] || 0)} → ${fmt(v)}`);
        }
      };
      numField('alis_fiyati', 'purchasePrice', 'Alış fiyatı', v => money(v));
      numField('satis_fiyati', 'salesPrice', 'Satış fiyatı', v => money(v));
      // Asistan satış fiyatını KDV hariç verir; kart KDV dahil ise bundan sonra KDV hariç sayılır
      if (changes.salesPrice !== undefined && salesPriceIncludesTax(stock)) {
        changes.salesPriceIncludesTax = false;
        lines.push('Satış fiyatı türü: KDV dahil → KDV hariç');
      }
      numField('kdv_orani', 'taxRate', 'KDV', v => `%${v}`);
      numField('miktar', 'quantity', 'Stok miktarı', v => `${v} ${stock.unit}`);
      numField('kritik_miktar', 'minQuantity', 'Kritik seviye', v => String(v));
      if (args.ad) { changes.name = args.ad; lines.push(`Ad: ${stock.name} → ${args.ad}`); }
      if (args.barkod) { changes.barcode = args.barkod; lines.push(`Barkod: ${stock.barcode || '—'} → ${args.barkod}`); }
      if (lines.length === 0) return { error: 'Güncellenecek bir alan belirtilmedi.' };
      const editDenied = actionDenied(ctx, 'edit_stock');
      if (editDenied) return { error: editDenied };
      if (changes.quantity !== undefined && changes.quantity < stock.quantity) {
        const decreaseDenied = actionDenied(ctx, 'decrease_stock');
        if (decreaseDenied) return { error: decreaseDenied };
      }
      return {
        summary: [`Ürün güncelleme — ${stock.name}`, ...lines],
        execute: async () => {
          const { id, ...rest } = stock;
          await saveStock({ ...rest, ...changes }, id, stock.quantity);
          return { basarili: true, mesaj: `${stock.name} güncellendi.` };
        },
      };
    },
  },
  {
    name: 'islem_sil',
    kind: 'write',
    tab: 'islemler',
    description: 'Bir fatura/tahsilat/ödeme kaydını siler (geri alır); stok ve cari bakiyesi geri döner. Faturaya bağlı peşin tahsilat tek başına silinemez, faturası silinmelidir. Silmeden önce islem_listele ile doğru kaydı bul.',
    parameters: OBJ({ islem_id: S('Silinecek işlemin id\'si (islem_listele sonucundan)') }, ['islem_id']),
    prepare: (args, ctx) => {
      const islem = ctx.data.islemler.find(t => t.id === args.islem_id);
      if (!islem) return { error: 'Bu id ile işlem bulunamadı. Önce islem_listele ile id\'yi bul.' };
      if (islem.linkedInvoiceId) return { error: 'Bu kayıt bir faturaya bağlı peşin tahsilat/ödemedir; tek başına silinemez. Bağlı faturayı silmeyi öner.' };
      const permDenied = actionDenied(ctx, ['sale', 'sale_return'].includes(islem.type) ? 'delete_sale' : 'delete_payment');
      if (permDenied) return { error: permDenied };
      return {
        summary: [
          `SİLİNECEK: ${TYPE_LABEL[islem.type]} — ${islem.cariName}`,
          `Tutar: ${money(islem.amount, islem.currency || 'TRY')}  Tarih: ${islem.date}`,
          ...(islem.linkedReceiptIds?.length ? ['Bağlı peşin tahsilat/ödeme kaydı da silinecek.'] : []),
          'Stok ve cari bakiyesi geri alınacak.',
        ],
        execute: async () => {
          await removeTransaction(islem);
          return { basarili: true, mesaj: 'İşlem silindi; stok ve bakiye geri alındı.' };
        },
      };
    },
  },
  {
    name: 'masraf_sil',
    kind: 'write',
    tab: 'masraflar',
    description: 'Bir masraf kaydını siler. Önce masraf_listele ile doğru kaydı bul.',
    parameters: OBJ({ masraf_id: S('Silinecek masrafın id\'si') }, ['masraf_id']),
    prepare: (args, ctx) => {
      const exp = ctx.data.expenses.find(e => e.id === args.masraf_id);
      if (!exp) return { error: 'Bu id ile masraf bulunamadı.' };
      if (ctx.data.employeeTransactions.some(t => t.id === exp.id)) {
        return { error: 'Bu masraf bir personel maaş/avans ödemesinden otomatik oluşmuştur; Personel ekranından ilgili ödeme silinmelidir.' };
      }
      return {
        summary: [`SİLİNECEK: Masraf — ${exp.title}`, `Tutar: ${money(exp.amount, exp.currency)}  Tarih: ${exp.date}`],
        execute: async () => {
          await deleteExpense(exp.id);
          return { basarili: true, mesaj: 'Masraf silindi.' };
        },
      };
    },
  },
  {
    name: 'kasa_hareketi',
    kind: 'write',
    tab: 'kasa',
    description: 'Kasa/banka hesabına cari dışı manuel para girişi veya çıkışı kaydeder (ör. sermaye girişi, bankadan nakit çekme değil — o transferdir).',
    parameters: OBJ({
      tur: S('giris veya cikis', { enum: ['giris', 'cikis'] }),
      hesap: S('Kasa/banka/POS hesabının adı veya id\'si'),
      tutar: N('Tutar (hesabın para biriminde)'),
      aciklama: S('Açıklama'),
      tarih: DATE('İşlem tarihi'),
    }, ['tur', 'hesap', 'tutar']),
    prepare: (args, ctx) => {
      const accRes = findBankAccount(ctx, args.hesap);
      if ('error' in accRes) return accRes;
      const acc = accRes.item;
      const amount = roundMoney(Number(args.tutar));
      if (!(amount > 0)) return { error: 'Tutar sıfırdan büyük olmalı.' };
      const date = validDate(args.tarih);
      if (!date) return { error: 'Tarih YYYY-MM-DD biçiminde olmalı.' };
      const type = args.tur === 'cikis' ? 'cikis' : 'giris';
      return {
        summary: [`Manuel ${type === 'giris' ? 'para girişi' : 'para çıkışı'} — ${acc.name}`, `Tutar: ${money(amount, acc.currency)}`, `Tarih: ${date}`, ...(args.aciklama ? [`Açıklama: ${args.aciklama}`] : [])],
        execute: async () => {
          await saveAccountTransaction({
            accountId: acc.id, type, amount, date, description: args.aciklama || (type === 'giris' ? 'Manuel Giriş' : 'Manuel Çıkış'), createdAt: new Date().toISOString(),
          });
          return { basarili: true, mesaj: 'Kasa hareketi kaydedildi.' };
        },
      };
    },
  },
  {
    name: 'kasa_transfer',
    kind: 'write',
    tab: 'kasa',
    description: 'İki kasa/banka/POS hesabı arasında para transferi yapar (ör. POS\'tan bankaya, bankadan kasaya). Para birimleri farklıysa güncel kur kullanılır.',
    parameters: OBJ({
      kaynak_hesap: S('Paranın çıktığı hesap (ad veya id)'),
      hedef_hesap: S('Paranın girdiği hesap (ad veya id)'),
      tutar: N('Kaynak hesaptan çıkan tutar'),
      hedef_tutar: N('Para birimleri farklıysa hedef hesaba giren tutar (belirtilmezse kurla hesaplanır)'),
      aciklama: S('Açıklama'),
    }, ['kaynak_hesap', 'hedef_hesap', 'tutar']),
    prepare: (args, ctx) => {
      const srcRes = findBankAccount(ctx, args.kaynak_hesap);
      if ('error' in srcRes) return srcRes;
      const dstRes = findBankAccount(ctx, args.hedef_hesap);
      if ('error' in dstRes) return dstRes;
      const src = srcRes.item; const dst = dstRes.item;
      if (src.id === dst.id) return { error: 'Kaynak ve hedef hesap aynı olamaz.' };
      const amount = roundMoney(Number(args.tutar));
      if (!(amount > 0)) return { error: 'Tutar sıfırdan büyük olmalı.' };
      const targetAmount = src.currency === dst.currency
        ? amount
        : roundMoney(args.hedef_tutar ? Number(args.hedef_tutar) : amount * calculateExchangeRate(ctx.data.fxRates, src.currency, dst.currency));
      const date = getTodayISO();
      const description = args.aciklama || 'Hesaplar arası transfer';
      return {
        summary: [`Transfer: ${src.name} → ${dst.name}`, `Çıkan: ${money(amount, src.currency)}  Giren: ${money(targetAmount, dst.currency)}`, `Tarih: ${date}`],
        execute: async () => {
          await saveAccountTransaction({ accountId: src.id, type: 'transfer_out', amount, date, description, targetAccountId: dst.id, createdAt: new Date().toISOString() });
          await saveAccountTransaction({ accountId: dst.id, type: 'transfer_in', amount: targetAmount, date, description, targetAccountId: src.id, createdAt: new Date().toISOString() });
          return { basarili: true, mesaj: 'Transfer kaydedildi.' };
        },
      };
    },
  },
  {
    name: 'cek_senet_ekle',
    kind: 'write',
    tab: 'ceksenet',
    description: 'Alınan (müşteriden) veya verilen (tedarikçiye) çek/senet kaydeder. Varsayılan olarak cari bakiyesine tahsilat/ödeme olarak işlenir.',
    parameters: OBJ({
      tur: S('alinan veya verilen', { enum: ['alinan', 'verilen'] }),
      belge: S('cek veya senet', { enum: ['cek', 'senet'] }),
      cari: S('Cari id, kod veya adı'),
      tutar: N('Tutar'),
      vade_tarihi: S('Vade tarihi YYYY-MM-DD'),
      duzenleme_tarihi: DATE('Düzenleme tarihi'),
      seri_no: S('Çek/senet seri numarası'),
      banka: S('Banka adı (çek için)'),
      borclu: S('Borçlu kişi/kurum (belirtilmezse cari adı)'),
      cari_bakiyesine_isle: B('Cari bakiyesine tahsilat/ödeme olarak işlensin mi (varsayılan evet)'),
      aciklama: S('Açıklama'),
    }, ['tur', 'belge', 'cari', 'tutar', 'vade_tarihi']),
    prepare: (args, ctx) => {
      const cariRes = findCari(ctx, args.cari);
      if ('error' in cariRes) return cariRes;
      const cari = cariRes.item;
      const amount = roundMoney(Number(args.tutar));
      if (!(amount > 0)) return { error: 'Tutar sıfırdan büyük olmalı.' };
      const issueDate = validDate(args.duzenleme_tarihi);
      const dueDate = args.vade_tarihi && !isNaN(parseDateISO(args.vade_tarihi).getTime()) ? args.vade_tarihi : null;
      if (!issueDate || !dueDate) return { error: 'Tarihler YYYY-MM-DD biçiminde olmalı ve vade tarihi zorunludur.' };
      const type: CekSenet['type'] = args.tur === 'verilen' ? 'payable' : 'receivable';
      const docType: CekSenet['docType'] = args.belge === 'senet' ? 'note' : 'cheque';
      const affect = args.cari_bakiyesine_isle !== false;
      const currency = cari.currency || 'TRY';
      const year = issueDate.slice(0, 4);
      const portfolioNo = `PRT-${year}-${String(ctx.data.ceksenet.length + 1).padStart(4, '0')}`;
      const docLabel = docType === 'cheque' ? 'Çek' : 'Senet';
      const islemLabel = type === 'receivable' ? 'Alınan' : 'Verilen';
      return {
        summary: [
          `${islemLabel} ${docLabel} — ${cari.name}`, `Tutar: ${money(amount, currency)}  Vade: ${dueDate}`,
          `Portföy no: ${portfolioNo}${args.seri_no ? `  Seri no: ${args.seri_no}` : ''}`,
          affect ? `Cari bakiyesine ${type === 'receivable' ? 'tahsilat' : 'ödeme'} olarak işlenecek.` : 'Cari bakiyesi değişmeyecek.',
        ],
        execute: async () => {
          const id = await saveCekSenet({
            type, docType, portfolioNo, serialNo: (args.seri_no || '').trim(), debtor: (args.borclu || '').trim() || cari.name,
            cariId: cari.id, cariName: cari.name, amount, currency, issueDate, dueDate, bankName: (args.banka || '').trim(),
            bankBranch: '', accountNo: '', status: 'portfolio', description: (args.aciklama || '').trim(), createdAt: new Date().toISOString(),
          });
          if (affect) {
            await createTransaction({
              type: type === 'receivable' ? 'collection' : 'payment', cariId: cari.id, cariName: cari.name, date: issueDate, amount, currency,
              account: '', description: `${islemLabel} ${docLabel} Girişi (Seri: ${(args.seri_no || '').trim()}, Portföy: ${portfolioNo})`,
              createdAt: new Date().toISOString(),
            });
          }
          return { basarili: true, kayit_id: id, mesaj: `${islemLabel} ${docLabel.toLocaleLowerCase('tr-TR')} kaydedildi.` };
        },
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Arayüz araçları
// ---------------------------------------------------------------------------

const uiTools: AiTool[] = [
  {
    name: 'grafik_goster',
    kind: 'ui',
    tab: '',
    description: 'Sohbet ekranında grafik gösterir. Veriyi önce okuma araçlarıyla topla, sonra bu araçla çiz.',
    parameters: OBJ({
      tur: S('Grafik türü: bar (karşılaştırma) veya pie (dağılım)', { enum: ['bar', 'pie'] }),
      veriler: { type: 'ARRAY', description: 'Grafik verileri', items: OBJ({ ad: S('Etiket'), deger: N('Değer') }, ['ad', 'deger']) },
    }, ['tur', 'veriler']),
    chart: (args) => ({
      tip: args.tur === 'pie' ? 'pie' : 'bar',
      data: (Array.isArray(args.veriler) ? args.veriler : []).slice(0, 20).map((v: any) => ({ name: String(v.ad), value: Number(v.deger) || 0 })),
    }),
  },
];

export const ALL_AI_TOOLS: AiTool[] = [...readTools, ...writeTools, ...uiTools];

/** Kullanıcının yetkisine göre modele sunulacak araçlar (yasaklı menülerin araçları hiç gösterilmez). */
export function getAvailableTools(permissions: AiPermissionContext): AiTool[] {
  return ALL_AI_TOOLS.filter(tool => !(permissions.isRestricted && tool.tab && permissions.sensitiveTabs.includes(tool.tab)));
}

// Gemini boş parametre şemasını ve boş required listesini kabul etmediği için bunlar gönderilmez
function cleanSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(cleanSchema);
  const out: any = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (key === 'required' && Array.isArray(value) && value.length === 0) return;
    out[key] = cleanSchema(value);
  });
  return out;
}

export function toFunctionDeclarations(tools: AiTool[]) {
  return tools.map(tool => {
    const hasParams = tool.parameters && tool.parameters.properties && Object.keys(tool.parameters.properties).length > 0;
    return hasParams
      ? { name: tool.name, description: tool.description, parameters: cleanSchema(tool.parameters) }
      : { name: tool.name, description: tool.description };
  });
}

/** Yetki kontrolünü araç çalıştırılırken de yapar (model yasaklı aracı çağırmaya çalışırsa). */
export function checkToolPermission(tool: AiTool, ctx: AiToolContext): string | null {
  return denied(ctx, tool);
}
