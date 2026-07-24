import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  ColumnTargetType,
  RawExcelData,
  CariImportItem,
  ImportAnalysisSummary
} from '../types/excelImport';

/**
 * Normalizes header strings for intelligent fuzzy matching
 */
export function normalizeHeader(header: string): string {
  return header
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşıöç]/gi, '');
}

/**
 * Normalizes string for Turkish case-insensitive comparison
 */
function cleanStr(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .replace(/[^a-z0-9ğüşıöç]/gi, '');
}

/**
 * Checks if string is purely a date, time, or date header string
 */
export function isDateString(val: string): boolean {
  if (!val) return false;
  const raw = val.trim();
  const lower = raw.toLowerCase();

  // Date regexes: 22.07.2026, 22/07/2026, 2026-07-22, 22-07-2026, 22.07.26, 07.2026, etc.
  const datePattern = /^\s*(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}|\d{1,2}\.\d{1,2}\.\d{2,4})\s*$/;
  if (datePattern.test(raw)) return true;

  // Date with time or words: "Tarih: 22.07.2026", "22 Temmuz 2026", "2026-07-22 14:30"
  if (/^\s*(tarih|rapor tarihi|işlem tarihi|kayıt tarihi|vade tarihi|gün|saat)\b/i.test(lower)) return true;

  // Single date phrases: "22 temmuz 2026", "22.07.2026 saat 10:00"
  if (/^\d{1,2}\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+\d{2,4}$/i.test(lower)) return true;

  // Pure numeric timestamps or dates formatted as numeric e.g. 20260722
  if (/^\d{8}$/.test(raw)) {
    const year = parseInt(raw.substring(0, 4), 10);
    if (year >= 2000 && year <= 2100) return true;
  }

  return false;
}

/**
 * Checks if string is a table header label instead of an actual data row
 */
export function isHeaderLabel(val: string): boolean {
  if (!val) return false;
  const norm = cleanStr(val);

  const headerTerms = [
    'isimunvan', 'musterifirmaadi', 'musteriadi', 'firmaadi',
    'cariadi', 'cariunvani', 'unvani', 'firmaunvani', 'carikodu', 'musterikodu',
    'adsoyad', 'adisoyadi', 'musteritedarikci', 'musteri', 'tedarikci',
    'telefon', 'vergino', 'vergidairesi', 'bakiye', 'acilisbakiyesi',
    'borc', 'alacak', 'parabirimi', 'eposta', 'adres', 'aciklama',
    'sirano', 'sno', 'caritanimi', 'unvan', 'isim', 'ad', 'carihesabi',
    'cariisim', 'musteriunvani', 'firmaunvan', 'carilistesi', 'musterilistesi',
    'tarih', 'islemtarihi', 'vadetarihi', 'kayittarihi',
    'evrakno', 'dokumanno', 'faturano', 'carikategorisi'
  ];

  return headerTerms.some((term) => norm === term || (norm.length <= 25 && norm.includes('isimunvan')));
}

/**
 * Checks if string is a total, summary, or report metadata banner
 */
export function isTotalOrSummaryLabel(val: string): boolean {
  if (!val) return false;
  const norm = cleanStr(val);
  const lower = val.trim().toLowerCase();

  if (
    lower.startsWith('toplam') ||
    lower.startsWith('genel toplam') ||
    lower.startsWith('ara toplam') ||
    lower.startsWith('dip toplam') ||
    lower.startsWith('nakil') ||
    lower.startsWith('devir') ||
    lower.startsWith('son bakiye') ||
    lower.startsWith('sayfa toplam') ||
    lower.startsWith('rapor tarihi') ||
    lower.startsWith('filtre:') ||
    lower.startsWith('liste tarihi') ||
    lower.startsWith('sayfa:')
  ) {
    return true;
  }

  const summaryTerms = [
    'toplam', 'geneltoplam', 'aratoplam', 'nakil', 'devir',
    'sonbakiye', 'diptoplam', 'sayfatoplami', 'toplamlar',
    'total', 'grandtotal', 'subtotal', 'balance', 'toplamborc', 'toplamalacak'
  ];

  return summaryTerms.some((term) => norm === term);
}

/**
 * Validates whether string is a genuine customer / company name
 */
export function isValidCariName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;

  // Check date, header, total
  if (isDateString(trimmed)) return false;
  if (isHeaderLabel(trimmed)) return false;
  if (isTotalOrSummaryLabel(trimmed)) return false;

  // Purely numeric or pure symbols
  if (/^\d+$/.test(trimmed)) return false;
  if (/^[^\w\sğüşıöçĞÜŞİÖÇ]+$/gi.test(trimmed)) return false;

  return true;
}

/**
 * Intelligent AI heuristic matching for Excel header columns and sample row values
 */
export function predictColumnMappings(headers: string[], rows?: Record<string, any>[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  const patterns: Record<ColumnTargetType, string[]> = {
    name: ['musteri', 'cari', 'firma', 'unvan', 'ad', 'isim', 'musteriadi', 'cariadi', 'firmaadi', 'unvani', 'company', 'name', 'client', 'customer', 'caritanimi', 'musteritunvani', 'firmaunvani', 'cariunvani', 'cariisim'],
    phone: ['telefon', 'tel', 'gsm', 'cep', 'mobil', 'phone', 'mobile', 'contact', 'iletisim', 'telefonno', 'telno'],
    email: ['eposta', 'email', 'mail', 'e-posta', 'epostaadresi'],
    address: ['adres', 'address', 'il', 'ilce', 'sehir', 'lokasyon', 'adres1', 'faturaadresi'],
    taxNo: ['vergino', 'vkn', 'tckn', 'tc', 'taxno', 'tcno', 'vergikimlikno', 'tckimlikno', 'verginumarasi'],
    taxOffice: ['vergidairesi', 'vd', 'taxoffice', 'vergi'],
    receivable: ['alacak', 'alacakli', 'alacaklimiz', 'alacagimiz', 'musteriborcu', 'receivable', 'alacaktutari', 'alacakbakiye'],
    payable: ['borc', 'borclu', 'borcumuz', 'tedarikcialacagi', 'payable', 'borctutari', 'borcbakiye'],
    openingBalance: [
      'acilisbakiyesi', 'bakiye', 'bakiye1', 'netbakiye', 'tutar', 'balance', 'openingbalance',
      'devir', 'devirbakiyesi', 'acilis', 'acilisbakiye', 'bakiyedevir', 'sonbakiye',
      'tutar1', 'tutari', 'toplambakiye', 'tlbakiye', 'dovizbakiye', 'tutartl', 'bakiyetl', 'toplamtutar', 'bakiyedurumu', 'gecenbakiye'
    ],
    currency: ['parabirimi', 'doviz', 'dovizcinsi', 'currency', 'birim', 'parabirim', 'dovizturu', 'birimi'],
    balance: ['bakiye', 'netbakiye', 'sonbakiye', 'bakiyedurumu'],
    notes: ['not', 'notlar', 'aciklama', 'detay', 'bilgi', 'note', 'notes', 'description', 'aciklamalar'],
    type: ['tur', 'tip', 'caritip', 'carituru', 'tipi', 'type', 'category', 'musteritip', 'carikategorisi'],
    ignore: []
  };

  const assignedTargets = new Set<ColumnTargetType>();

  // Extract up to 25 non-empty string samples for a header
  const getSamples = (header: string): string[] => {
    if (!rows || rows.length === 0) return [];
    const samples: string[] = [];
    for (const r of rows) {
      if (r && r[header] !== undefined && r[header] !== null) {
        const val = String(r[header]).trim();
        if (val) {
          samples.push(val);
          if (samples.length >= 25) break;
        }
      }
    }
    return samples;
  };

  headers.forEach((header) => {
    const norm = normalizeHeader(header);
    const samples = getSamples(header);

    let bestMatch: ColumnTargetType = 'ignore';
    let highestScore = 0;

    const isDateHeader = norm.includes('tarih') || norm.includes('date') || norm.includes('vade') || norm.includes('zaman') || norm.includes('saat');

    // Analyze sample values
    const dateCount = samples.filter((s) => isDateString(s)).length;
    const isDateColumnByData = samples.length > 0 && (dateCount / samples.length) >= 0.5;

    if (isDateHeader || isDateColumnByData) {
      // It's a date column -> FORCE ignore
      mappings.push({
        columnHeader: header,
        targetField: 'ignore',
        confidenceScore: 100
      });
      return;
    }

    // Try header keyword matching first
    (Object.keys(patterns) as ColumnTargetType[]).forEach((targetKey) => {
      if (targetKey === 'ignore' || assignedTargets.has(targetKey)) return;

      const keywords = patterns[targetKey];
      for (const kw of keywords) {
        if (norm === kw) {
          bestMatch = targetKey;
          highestScore = 100;
          break;
        } else if (kw.length <= 3 && norm === kw) {
          bestMatch = targetKey;
          highestScore = 100;
          break;
        } else if (norm.includes(kw) || kw.includes(norm)) {
          const score = 80;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = targetKey;
          }
        }
      }
    });

    // If header didn't match or score was low, analyze sample data patterns!
    if (highestScore < 80 && samples.length > 0) {
      // 1. Phone number check
      const phoneCount = samples.filter((s) => /^(\+90|0)?\s*[25]\d{2}\s*\d{3}\s*\d{2}\s*\d{2}$/.test(s) || /^\d{10,11}$/.test(s.replace(/\D/g, ''))).length;
      if (!assignedTargets.has('phone') && (phoneCount / samples.length) >= 0.5) {
        bestMatch = 'phone';
        highestScore = 90;
      }

      // 2. Email check
      const emailCount = samples.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)).length;
      if (!assignedTargets.has('email') && (emailCount / samples.length) >= 0.5) {
        bestMatch = 'email';
        highestScore = 90;
      }

      // 3. Tax / TCKN check
      const taxCount = samples.filter((s) => /^\d{10,11}$/.test(s.trim())).length;
      if (!assignedTargets.has('taxNo') && (taxCount / samples.length) >= 0.5) {
        bestMatch = 'taxNo';
        highestScore = 85;
      }

      // 4. Currency check
      const currCount = samples.filter((s) => /^(TL|TRY|USD|\$|EUR|€)$/i.test(s.trim())).length;
      if (!assignedTargets.has('currency') && (currCount / samples.length) >= 0.5) {
        bestMatch = 'currency';
        highestScore = 90;
      }

      // 5. Valid Cari Name check
      const nameCount = samples.filter((s) => isValidCariName(s)).length;
      if (!assignedTargets.has('name') && (nameCount / samples.length) >= 0.6) {
        bestMatch = 'name';
        highestScore = 90;
      }

      // 6. Balance / Amount check
      const amountCount = samples.filter((s) => parseAmount(s) !== 0 || /^\d+([.,]\d+)?\s*(TL|USD|EUR)?$/i.test(s)).length;
      if (!assignedTargets.has('openingBalance') && (amountCount / samples.length) >= 0.6) {
        bestMatch = 'openingBalance';
        highestScore = 80;
      }
    }

    if (bestMatch !== 'ignore' && highestScore >= 70) {
      assignedTargets.add(bestMatch);
      mappings.push({
        columnHeader: header,
        targetField: bestMatch,
        confidenceScore: highestScore
      });
    } else {
      mappings.push({
        columnHeader: header,
        targetField: 'ignore',
        confidenceScore: 0
      });
    }
  });

  // CRITICAL SAFETY NET FOR NAME COLUMN:
  // If NO column was assigned to 'name', inspect sample data for ALL unassigned columns and pick the best one!
  if (!assignedTargets.has('name')) {
    let bestNameHeader = '';
    let maxValidNames = 0;

    headers.forEach((h) => {
      const isDateH = normalizeHeader(h).includes('tarih') || normalizeHeader(h).includes('date');
      if (isDateH) return;

      const samples = getSamples(h);
      const validNames = samples.filter((s) => isValidCariName(s)).length;
      if (validNames > maxValidNames) {
        maxValidNames = validNames;
        bestNameHeader = h;
      }
    });

    if (bestNameHeader) {
      const idx = mappings.findIndex((m) => m.columnHeader === bestNameHeader);
      if (idx !== -1) {
        mappings[idx].targetField = 'name';
        mappings[idx].confidenceScore = 95;
      }
    }
  }

  return mappings;
}

/**
 * Parses numeric currency/amount values from diverse formats
 * Handles "1.250,50 TL", "(500.00)", " -1.200,00 ", "+500", "1500 (B)", "2000 (A)"
 */
export function parseAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const rawStr = String(val).trim();
  if (!rawStr) return 0;

  let str = rawStr.replace(/[^\d,.+-]/g, '');
  if (!str) return 0;

  // Check if string contains explicit indicators of Borç (payable/negative) or Alacak (receivable/positive)
  const lowerRaw = rawStr.toLowerCase();
  const isBorc = lowerRaw.includes('(b)') || lowerRaw.includes(' borç') || lowerRaw.includes('borc') || lowerRaw.includes('(borç)') || lowerRaw.includes('b.') || lowerRaw.includes('-') || /^\(.*\)$/.test(rawStr);
  const isAlacak = lowerRaw.includes('(a)') || lowerRaw.includes(' alacak') || lowerRaw.includes('(alacak)') || lowerRaw.includes('a.');

  // Handle Turkish formatting 1.250,50 vs Western 1,250.50
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Turkish format: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Western format: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  let num = parseFloat(str);
  if (isNaN(num)) return 0;

  if (isBorc && !isAlacak && num > 0) {
    num = -Math.abs(num);
  } else if (isAlacak && num < 0) {
    num = Math.abs(num);
  }

  return num;
}

/**
 * Converts Raw Excel rows into typed CariImportItem array based on column mapping rules
 */
export function processExcelToCariItems(
  rawData: RawExcelData,
  mappings: ColumnMapping[]
): CariImportItem[] {
  const mappingMap = new Map<ColumnTargetType, string>();
  mappings.forEach((m) => {
    if (m.targetField !== 'ignore') {
      mappingMap.set(m.targetField, m.columnHeader);
    }
  });

  const nameCol = mappingMap.get('name');
  const phoneCol = mappingMap.get('phone');
  const emailCol = mappingMap.get('email');
  const addressCol = mappingMap.get('address');
  const taxNoCol = mappingMap.get('taxNo');
  const taxOfficeCol = mappingMap.get('taxOffice');
  const openingBalCol = mappingMap.get('openingBalance') || mappingMap.get('balance');
  const receivableCol = mappingMap.get('receivable');
  const payableCol = mappingMap.get('payable');
  const typeCol = mappingMap.get('type');
  const currencyCol = mappingMap.get('currency');
  const notesCol = mappingMap.get('notes');

  return rawData.rows.map((row, index) => {
    const rawName = nameCol ? String(row[nameCol] || '').trim() : '';
    const rawPhone = phoneCol ? String(row[phoneCol] || '').trim() : '';
    const rawEmail = emailCol ? String(row[emailCol] || '').trim() : '';
    const rawAddress = addressCol ? String(row[addressCol] || '').trim() : '';
    const rawTaxNo = taxNoCol ? String(row[taxNoCol] || '').trim() : '';
    const rawTaxOffice = taxOfficeCol ? String(row[taxOfficeCol] || '').trim() : '';
    const rawNotes = notesCol ? String(row[notesCol] || '').trim() : '';

    let openingBalance = 0;
    let rawBalStr = '';
    if (openingBalCol && row[openingBalCol] !== undefined) {
      rawBalStr = String(row[openingBalCol]);
      openingBalance = parseAmount(row[openingBalCol]);
    } else {
      const rec = receivableCol ? parseAmount(row[receivableCol]) : 0;
      const pay = payableCol ? parseAmount(row[payableCol]) : 0;
      openingBalance = rec - pay;
    }

    // Currency Detection (TRY, USD, EUR)
    let currency: 'TRY' | 'USD' | 'EUR' = 'TRY';
    const curVal = currencyCol ? String(row[currencyCol] || '').toUpperCase() : '';
    const combinedSearchStr = `${curVal} ${rawBalStr} ${rawNotes}`.toUpperCase();

    if (combinedSearchStr.includes('USD') || combinedSearchStr.includes('DOLAR') || combinedSearchStr.includes('$')) {
      currency = 'USD';
    } else if (combinedSearchStr.includes('EUR') || combinedSearchStr.includes('EURO') || combinedSearchStr.includes('€')) {
      currency = 'EUR';
    } else {
      currency = 'TRY';
    }

    let balanceType: 'receivable' | 'payable' | 'neutral' = 'neutral';
    if (openingBalance > 0) balanceType = 'receivable';
    else if (openingBalance < 0) balanceType = 'payable';

    // Type detection (müşteri vs tedarikçi vs ikisi)
    let type: 'customer' | 'supplier' | 'both' = 'customer';
    if (typeCol && row[typeCol]) {
      const tVal = String(row[typeCol]).toLowerCase();
      if (tVal.includes('tedarik') || tVal.includes('satıcı') || tVal.includes('supplier')) {
        type = 'supplier';
      } else if (tVal.includes('hem') || tVal.includes('both') || tVal.includes('ikisi')) {
        type = 'both';
      } else {
        type = 'customer';
      }
    } else {
      // Infer type from balance: negative opening balance usually means supplier
      if (openingBalance < 0) {
        type = 'supplier';
      }
    }

    const validName = isValidCariName(rawName);
    const isValid = validName;
    const validationError = !isValid ? 'Tarih, başlık veya geçersiz cari ismi satırı.' : undefined;

    return {
      tempId: `import-${index}-${Date.now()}`,
      name: rawName,
      type,
      phone: rawPhone,
      email: rawEmail,
      address: rawAddress,
      taxNo: rawTaxNo,
      taxOffice: rawTaxOffice,
      openingBalance,
      balanceType,
      currency,
      notes: rawNotes,
      isValid,
      validationError,
      isExcluded: !isValid
    };
  });
}

/**
 * Calculates summary statistics for the preview confirmation screen
 */
export function calculateImportSummary(items: CariImportItem[]): ImportAnalysisSummary {
  const activeItems = items.filter((i) => !i.isExcluded && i.isValid);

  let totalReceivable = 0;
  let totalPayable = 0;
  let detectedCustomerCount = 0;
  let detectedSupplierCount = 0;

  activeItems.forEach((item) => {
    if (item.openingBalance > 0) {
      totalReceivable += item.openingBalance;
    } else if (item.openingBalance < 0) {
      totalPayable += Math.abs(item.openingBalance);
    }

    if (item.type === 'customer') detectedCustomerCount++;
    else if (item.type === 'supplier') detectedSupplierCount++;
    else {
      detectedCustomerCount++;
      detectedSupplierCount++;
    }
  });

  return {
    totalCount: items.length,
    validCount: activeItems.length,
    invalidCount: items.length - activeItems.length,
    totalReceivable,
    totalPayable,
    netOpeningBalance: totalReceivable - totalPayable,
    detectedCustomerCount,
    detectedSupplierCount
  };
}

/**
 * Reads arrayBuffer from file and converts to RawExcelData with intelligent header row detection
 */
export async function parseExcelFile(file: File): Promise<RawExcelData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel dosyasında okunabilir çalışma sayfası bulunamadı.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Çalışma sayfası okunamadı.');
  }

  // Parse worksheet as 2D array to locate the actual table header row
  const raw2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!raw2D || raw2D.length === 0) {
    throw new Error('Yüklenen dosya boş veya geçerli veri içermiyor.');
  }

  // Find the row that best matches table headers (looking at top 15 rows)
  let bestHeaderIndex = 0;
  let maxMatchScore = 0;

  const headerKeywords = [
    'musteri', 'cari', 'firma', 'unvan', 'ad', 'isim', 'telefon', 'tel',
    'bakiye', 'borc', 'alacak', 'vergi', 'eposta', 'email', 'adres', 'tutar'
  ];

  const maxScanRows = Math.min(raw2D.length, 15);
  for (let r = 0; r < maxScanRows; r++) {
    const rowCells = raw2D[r];
    if (!Array.isArray(rowCells)) continue;

    let matchCount = 0;
    rowCells.forEach((cell) => {
      const cellStr = cleanStr(cell);
      if (!cellStr) return;
      if (headerKeywords.some((kw) => cellStr.includes(kw))) {
        matchCount++;
      }
    });

    if (matchCount > maxMatchScore) {
      maxMatchScore = matchCount;
      bestHeaderIndex = r;
    }
  }

  // Extract actual headers from the best header row
  const headerRow = raw2D[bestHeaderIndex] || [];
  const headers: string[] = headerRow.map((cell: any, idx: number) => {
    const val = String(cell || '').trim();
    return val || `Sütun_${idx + 1}`;
  });

  // Extract data rows starting right after the detected header row
  const dataRows2D = raw2D.slice(bestHeaderIndex + 1);
  const rows: Record<string, any>[] = [];

  dataRows2D.forEach((rowCells) => {
    if (!Array.isArray(rowCells) || rowCells.every((c) => !String(c || '').trim())) {
      return; // Skip empty rows
    }

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = rowCells[colIdx] !== undefined ? rowCells[colIdx] : '';
    });
    rows.push(rowObj);
  });

  if (rows.length === 0) {
    throw new Error('Excel dosyasında geçerli veri satırı bulunamadı.');
  }

  return {
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    headers,
    rows,
    totalRowCount: rows.length
  };
}
