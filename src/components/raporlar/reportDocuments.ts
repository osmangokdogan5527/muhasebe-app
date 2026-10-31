/**
 * Raporlar ekranındaki sekmelerin PDF içeriği: özet kartları ve tablolar.
 * Tutarlar useRaporlarStats'ın hesapladığı değerlerden alınır (ekranla aynı rakamlar).
 */
import { Expense } from '../../types';
import { ReportDocument } from '../../pdf/reportPdf';
import { formatDate, formatMoney, formatQuantity, normalizeCurrency } from '../../pdf/format';
import { statementPeriodLabel } from '../../pdf/statementPdf';

export type ReportTabId = 'ozet' | 'stok' | 'cari' | 'gelirgider' | 'kdvkarzarar';

export interface ReportDocumentDeps {
  activeTab: ReportTabId;
  selectedCurrency: string;
  resolvedDates: { start: string; end: string };
  summaryStats: any;
  stockStats: any;
  cariStats: any;
  kdvStats: any;
  incomeExpenseStats: any;
  filteredExpenses: Expense[];
  stockValuationType: 'purchase' | 'sales';
  cariTypeFilter: 'all' | 'customer' | 'supplier';
  stockSearch: string;
  cariSearch: string;
}

const ACCOUNT_LABELS: Record<string, string> = { cash: 'Kasa', bank: 'Banka', pos: 'POS' };
const CARI_TYPES: Record<string, string> = { customer: 'Müşteri', supplier: 'Tedarikçi', both: 'Müşteri / Tedarikçi' };
const CURRENCY_NAMES: Record<string, string> = { TRY: 'Türk Lirası (TRY)', USD: 'ABD Doları (USD)', EUR: 'Avro (EUR)' };

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function buildReportDocument(deps: ReportDocumentDeps): ReportDocument {
  const currency = normalizeCurrency(deps.selectedCurrency);
  const money = (v: unknown) => formatMoney(num(v), currency);
  const tl = (v: unknown) => formatMoney(num(v), 'TRY');
  const base = {
    periodLabel: statementPeriodLabel(deps.resolvedDates.start, deps.resolvedDates.end),
    currencyLabel: CURRENCY_NAMES[currency] || currency,
  };
  const filterNote = (parts: (string | false)[]) => {
    const active = parts.filter(Boolean) as string[];
    return active.length ? [{ kind: 'note' as const, text: `Filtre: ${active.join(' · ')}` }] : [];
  };

  switch (deps.activeTab) {
    case 'stok': {
      const s = deps.stockStats;
      const items: any[] = s.itemsList || [];
      const valueLabel = deps.stockValuationType === 'sales' ? 'Satış Değeri' : 'Maliyet Değeri';
      const totalQty = items.reduce((sum, i) => sum + num(i.quantity), 0);
      const totalValue = items.reduce((sum, i) => sum + num(i.valuation), 0);
      return {
        ...base,
        periodLabel: undefined,
        title: 'Stok Durum Raporu',
        fileKey: 'Stok_Durum',
        cards: [
          { label: 'Ürün Çeşidi', value: String(s.totalItems ?? items.length) },
          { label: 'Toplam Miktar', value: formatQuantity(num(s.totalStockCount)) },
          { label: `Toplam ${valueLabel}`, value: money(s.totalValuation) },
          { label: 'Kritik Seviyede', value: `${num(s.criticalStockCount)} ürün`, tone: num(s.criticalStockCount) > 0 ? 'negative' : 'neutral' },
        ],
        sections: [
          ...filterNote([deps.stockSearch && `Arama: "${deps.stockSearch}"`]),
          {
            kind: 'table',
            title: `Ürünler (${items.length})`,
            columns: [
              { header: 'Kod', width: 24 },
              { header: 'Ürün / Hizmet' },
              { header: 'Miktar', align: 'right', width: 22 },
              { header: 'Kritik', align: 'right', width: 15 },
              { header: 'Alış F.', align: 'right', width: 24 },
              { header: 'Satış F.', align: 'right', width: 24 },
              { header: valueLabel, align: 'right', width: 28, emphasis: true },
            ],
            rows: items.map((i) => [
              i.code || '',
              i.name || '',
              `${formatQuantity(num(i.quantity))} ${i.unit || ''}`.trim(),
              formatQuantity(num(i.minQuantity)),
              tl(i.purchasePrice),
              tl(i.salesPrice),
              money(i.valuation),
            ]),
            foot: ['', 'TOPLAM', formatQuantity(totalQty), '', '', '', money(totalValue)],
            emptyText: 'Kayıtlı ürün yok.',
          },
          { kind: 'note', text: `Alış ve satış fiyatları TL'dir; ${valueLabel.toLocaleLowerCase('tr-TR')} rapor para birimine çevrilmiştir. Miktarı kritik seviyede ya da altında olan ürünler "Kritik Seviyede" sayılır.` },
        ],
      };
    }

    case 'cari': {
      const c = deps.cariStats;
      const items: any[] = c.itemsList || [];
      const net = num(c.totalReceivables) - num(c.totalPayables);
      return {
        ...base,
        periodLabel: undefined,
        title: 'Cari Bakiye Raporu',
        fileKey: 'Cari_Bakiye',
        cards: [
          { label: 'Cari Sayısı', value: String(c.totalCari ?? items.length) },
          { label: 'Toplam Alacağımız', value: money(c.totalReceivables), tone: 'positive', hint: 'Bize borçlu cariler' },
          { label: 'Toplam Borcumuz', value: money(c.totalPayables), tone: 'negative', hint: 'Bizim borçlu olduğumuz' },
          { label: 'Net Durum', value: money(net), tone: net >= 0 ? 'positive' : 'negative' },
        ],
        sections: [
          ...filterNote([
            deps.cariTypeFilter !== 'all' && `Tür: ${deps.cariTypeFilter === 'customer' ? 'Müşteriler' : 'Tedarikçiler'}`,
            deps.cariSearch && `Arama: "${deps.cariSearch}"`,
          ]),
          {
            kind: 'table',
            title: `Cariler (${items.length})`,
            columns: [
              { header: 'Kod', width: 22 },
              { header: 'Cari Unvan / Ad' },
              { header: 'Tür', width: 26 },
              { header: 'Telefon', width: 28 },
              { header: 'Alacağımız', align: 'right', width: 28 },
              { header: 'Borcumuz', align: 'right', width: 28 },
            ],
            rows: items.map((i) => {
              const bal = num(i.convertedBalance);
              return [
                i.code || '',
                `${i.name || ''}${i.currency && i.currency !== 'TRY' ? ` (${i.currency})` : ''}`,
                CARI_TYPES[i.type] || '',
                i.phone || '',
                bal > 0.004 ? money(bal) : '',
                bal < -0.004 ? money(-bal) : '',
              ];
            }),
            foot: ['', 'TOPLAM', '', '', money(items.reduce((s, i) => s + Math.max(0, num(i.convertedBalance)), 0)), money(items.reduce((s, i) => s + Math.max(0, -num(i.convertedBalance)), 0))],
            emptyText: 'Kayıtlı cari yok.',
          },
          { kind: 'note', text: 'Dövizli carilerin bakiyesi güncel kurla rapor para birimine çevrilmiştir. "Alacağımız" carinin bize borcunu, "Borcumuz" bizim cariye borcumuzu gösterir.' },
        ],
      };
    }

    case 'gelirgider': {
      const ie = deps.incomeExpenseStats;
      const expenses = [...deps.filteredExpenses].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      const categories: { name: string; value: number }[] = ie.categoryData || [];
      const total = num(ie.totalExp);
      return {
        ...base,
        title: 'Gider ve Masraf Raporu',
        fileKey: 'Gider_Masraf',
        cards: [
          { label: 'Toplam Gider', value: money(total), tone: 'negative' },
          { label: 'Kayıt Sayısı', value: String(expenses.length) },
          { label: 'En Büyük Kalem', value: categories[0]?.name || '-', hint: categories[0] ? money(categories[0].value) : undefined },
          { label: 'Net Kâr / Zarar', value: money(deps.summaryStats?.netProfit), tone: num(deps.summaryStats?.netProfit) >= 0 ? 'positive' : 'negative' },
        ],
        sections: [
          {
            kind: 'table',
            title: 'Kategorilere Göre',
            columns: [{ header: 'Kategori' }, { header: 'Tutar', align: 'right', width: 40, emphasis: true }, { header: 'Pay', align: 'right', width: 22 }],
            rows: categories.map((cat) => [cat.name, money(cat.value), total ? `%${formatQuantity(Math.round((cat.value / total) * 1000) / 10)}` : '']),
            foot: ['TOPLAM', money(total), categories.length ? '%100' : ''],
          },
          {
            kind: 'table',
            title: `Gider Kayıtları (${expenses.length})`,
            columns: [
              { header: 'Tarih', width: 20 },
              { header: 'Gider / Masraf' },
              { header: 'Kategori', width: 32 },
              { header: 'Hesap', width: 18 },
              { header: 'Tutar', align: 'right', width: 30, emphasis: true },
            ],
            rows: expenses.map((e) => [
              formatDate(e.date),
              e.description ? `${e.title}\n${e.description}` : e.title,
              e.category || 'Diğer',
              ACCOUNT_LABELS[(e as any).account] || '',
              formatMoney(num(e.amount), normalizeCurrency(e.currency)),
            ]),
            emptyText: 'Bu dönemde gider kaydı yok.',
          },
        ],
      };
    }

    case 'kdvkarzarar': {
      const k = deps.kdvStats;
      const sm = deps.summaryStats;
      const vatRow = (label: string, b: unknown, v: unknown) => [label, money(b), money(v)];
      const payable = num(k.payableKdv);
      return {
        ...base,
        title: 'KDV ve Kâr-Zarar Raporu',
        fileKey: 'KDV_Kar_Zarar',
        cards: [
          { label: 'Hesaplanan KDV', value: money(k.salesKdvTotal), hint: 'Satışlardan' },
          { label: 'İndirilecek KDV', value: money(k.purchaseKdvTotal), hint: 'Alışlardan' },
          payable > 0
            ? { label: 'Ödenecek KDV', value: money(payable), tone: 'negative' }
            : { label: 'Devreden KDV', value: money(k.devredenKdv), tone: 'positive', hint: 'Sonraki döneme' },
          { label: 'Net Kâr / Zarar', value: money(sm.netProfit), tone: num(sm.netProfit) >= 0 ? 'positive' : 'negative', hint: 'KDV hariç' },
        ],
        sections: [
          {
            kind: 'table',
            title: '1. KDV Özeti',
            columns: [{ header: 'Kalem' }, { header: 'Matrah (KDV hariç)', align: 'right', width: 42 }, { header: 'KDV', align: 'right', width: 36, emphasis: true }],
            rows: [
              ['Satışlar (Hesaplanan KDV)', '', ''],
              vatRow('  %20', k.salesBase20, k.salesKdv20),
              vatRow('  %10', k.salesBase10, k.salesKdv10),
              vatRow('  %1', k.salesBase1, k.salesKdv1),
              vatRow('  Diğer oranlar', k.salesBaseOther, k.salesKdvOther),
              vatRow('Toplam Hesaplanan KDV', num(k.salesBase20) + num(k.salesBase10) + num(k.salesBase1) + num(k.salesBaseOther), k.salesKdvTotal),
              ['Alışlar (İndirilecek KDV)', '', ''],
              vatRow('  %20', k.purchaseBase20, k.purchaseKdv20),
              vatRow('  %10', k.purchaseBase10, k.purchaseKdv10),
              vatRow('  %1', k.purchaseBase1, k.purchaseKdv1),
              vatRow('  Diğer oranlar', k.purchaseBaseOther, k.purchaseKdvOther),
              vatRow('Toplam İndirilecek KDV', num(k.purchaseBase20) + num(k.purchaseBase10) + num(k.purchaseBase1) + num(k.purchaseBaseOther), k.purchaseKdvTotal),
              payable > 0 ? ['ÖDENECEK KDV', '', money(payable)] : ['SONRAKİ DÖNEME DEVREDEN KDV', '', money(k.devredenKdv)],
            ],
            rowStyles: ['heading', 'normal', 'normal', 'normal', 'normal', 'subtotal', 'heading', 'normal', 'normal', 'normal', 'normal', 'subtotal', 'total'],
          },
          {
            kind: 'table',
            title: '2. Kâr-Zarar Tablosu (KDV hariç)',
            columns: [{ header: 'Kalem' }, { header: 'Tutar', align: 'right', width: 42, emphasis: true }],
            rows: [
              ['Satış gelirleri (iadeler düşülmüş)', money(sm.sales)],
              ['Satılan malın maliyeti (−)', money(sm.costOfSales)],
              ['Brüt kâr', money(sm.grossProfit)],
              ['Genel giderler / masraflar (−)', money(sm.totalExpenses)],
              ['Personel giderleri (−)', money(sm.employeeSalaries)],
              ['NET KÂR / ZARAR (vergi öncesi)', money(sm.netProfit)],
            ],
            rowStyles: ['normal', 'normal', 'subtotal', 'normal', 'normal', 'total'],
          },
          { kind: 'note', text: 'Bu rapor bilgi amaçlıdır, resmî beyanname yerine geçmez. KDV tutarları kayıtlı fatura ve POS satışlarından hesaplanmıştır.' },
        ],
      };
    }

    case 'ozet':
    default: {
      const sm = deps.summaryStats;
      return {
        ...base,
        title: 'Kâr-Zarar ve Finansal Özet',
        fileKey: 'Finansal_Ozet',
        cards: [
          { label: 'Satış Gelirleri', value: money(sm.sales), hint: 'KDV hariç, iadeler düşülmüş' },
          { label: 'Brüt Kâr', value: money(sm.grossProfit), tone: num(sm.grossProfit) >= 0 ? 'positive' : 'negative' },
          { label: 'Toplam Gider', value: money(num(sm.totalExpenses) + num(sm.employeeSalaries)), tone: 'negative', hint: 'Masraf + personel' },
          { label: 'Net Kâr / Zarar', value: money(sm.netProfit), tone: num(sm.netProfit) >= 0 ? 'positive' : 'negative' },
        ],
        sections: [
          {
            kind: 'table',
            title: 'Kâr-Zarar Tablosu',
            columns: [{ header: 'Kalem' }, { header: 'Tutar', align: 'right', width: 44, emphasis: true }],
            rows: [
              ['Satış gelirleri (KDV hariç)', money(sm.sales)],
              ['Satılan malın maliyeti (−)', money(sm.costOfSales)],
              ['Brüt kâr', money(sm.grossProfit)],
              ['Faaliyet giderleri / masraflar (−)', money(sm.totalExpenses)],
              ['Personel maaş giderleri (−)', money(sm.employeeSalaries)],
              ['NET DÖNEM KÂRI / ZARARI', money(sm.netProfit)],
            ],
            rowStyles: ['normal', 'normal', 'subtotal', 'normal', 'normal', 'total'],
          },
          {
            kind: 'table',
            title: 'Diğer Hareketler',
            columns: [{ header: 'Hareket' }, { header: 'Tutar', align: 'right', width: 44 }],
            rows: [
              ['Alışlar', money(sm.purchases)],
              ['Cari tahsilatlar', money(sm.collections)],
              ['Cari ödemeler', money(sm.payments)],
            ],
          },
          { kind: 'note', text: 'Satılan malın maliyeti stok kartlarındaki alış fiyatlarından hesaplanır. Bu rapor bilgi amaçlıdır.' },
        ],
      };
    }
  }
}
