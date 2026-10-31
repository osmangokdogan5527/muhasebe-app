import { getTodayISO } from '../../utils/dateUtils';
import { logError } from '../../utils/errorLogger';
import { alertDialog } from '../../utils/dialogs';
import { salesPriceTaxLabel } from '../../utils/stockPricing';

// Excel kütüphanesi büyük olduğu için yalnızca dışa aktarma istendiğinde indirilir (PDF: src/pdf/reportPdf.ts)
const reportLoadError = (err: unknown, what: string): never => {
  logError(err instanceof Error ? err : new Error(String(err)), `exportUtils.load ${what}`);
  alertDialog(`${what} modülü yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.`);
  throw err;
};
const loadXlsx = () => import('xlsx').catch((err) => reportLoadError(err, 'Excel'));

export const getExportFunctions = (deps: any) => {
  const { activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, cariler, incomeExpenseStats, stoklar, islemler, expenses } = deps;

    const downloadExcel = async () => {
      const XLSX = await loadXlsx();
      const workbook = XLSX.utils.book_new();
  
      if (activeTab === 'ozet') {
        // 1. P&L Sheet
        const plData = [
          { 'Finansal Rapor Başlığı': 'Satış Gelirleri (KDV Hariç)', 'Tutar': summaryStats.sales, 'Döviz': selectedCurrency },
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
          alertDialog('Lütfen önce bir cari hesap seçiniz.');
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
  
    const exportAllToExcel = async () => {
      const XLSX = await loadXlsx();
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
        'Satış Fiyatı': s.salesPrice || 0,
        'Satış Fiyatı Türü': salesPriceTaxLabel(s),
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
  
      XLSX.writeFile(workbook, `Storm_On_Muhasebe_Yedek_Export_${getTodayISO()}.xlsx`);
    };
  
  return { downloadExcel, exportAllToExcel };
}
