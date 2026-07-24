export type ColumnTargetType = 
  | 'name'
  | 'type'
  | 'phone'
  | 'email'
  | 'address'
  | 'taxNo'
  | 'taxOffice'
  | 'balance'
  | 'receivable'
  | 'payable'
  | 'openingBalance'
  | 'currency'
  | 'notes'
  | 'ignore';

export interface ColumnMapping {
  targetField: ColumnTargetType;
  columnHeader: string;
  confidenceScore?: number; // AI match confidence (0-100%)
}

export interface RawExcelData {
  fileName: string;
  fileSize: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRowCount: number;
}

export interface CariImportItem {
  tempId: string;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  phone: string;
  email: string;
  address: string;
  taxNo: string;
  taxOffice: string;
  openingBalance: number; // Signed balance (positive = alacaklıyız/müşteri borçlu, negative = borçluyuz)
  balanceType: 'receivable' | 'payable' | 'neutral'; // alacak / borç / sıfır
  currency: 'TRY' | 'USD' | 'EUR';
  notes?: string;
  isValid: boolean;
  validationError?: string;
  isExcluded?: boolean; // User unchecked this item
}

export interface ImportAnalysisSummary {
  totalCount: number;
  validCount: number;
  invalidCount: number;
  totalReceivable: number; // Müşterilerden toplam alacağımız (TL)
  totalPayable: number;    // Tedarikçilere toplam borcumuz (TL)
  netOpeningBalance: number;
  detectedCustomerCount: number;
  detectedSupplierCount: number;
}

export type ExcelImportStep = 'upload' | 'analyzing' | 'mapping' | 'preview' | 'importing' | 'completed';
