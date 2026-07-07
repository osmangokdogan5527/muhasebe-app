declare global {
  interface Window {
    electronAPI?: {
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      restartApp: () => void;
      downloadUpdate?: () => void;
      setAutoBackup?: (enabled: boolean) => void;
      createManualBackup?: () => Promise<{success: boolean, path?: string, error?: string, canceled?: boolean}>;
      restoreFromBackup?: () => Promise<{success: boolean, error?: string, canceled?: boolean}>;
      openAutoBackupFolder?: () => Promise<{success: boolean, error?: string}>;
      onDownloadProgress?: (callback: (percent: number) => void) => () => void;
    };
  }
}

export interface Cari {
  id: string;
  name: string;
  code: string;
  type: "customer" | "supplier" | "both";
  phone: string;
  email: string;
  address: string;
  balance: number; // positive = customer owes us, negative = we owe supplier
  openingBalance: number;
  createdAt: string;
  isActive?: boolean;
  currency?: "TRY" | "USD" | "EUR";
  taxOffice?: string;
  taxNo?: string;
  imageUrl?: string; // Profil/Logo resmi
}

export interface Stock {
  id: string;
  name: string;
  code: string;
  unit: "Adet" | "KG" | "Litre" | "Metre" | "Kutu" | "Hizmet";
  purchasePrice: number;
  salesPrice: number;
  taxRate: number; // e.g., 0, 1, 10, 20 (%)
  quantity: number;
  minQuantity: number;
  barcode?: string; // Optional barcode support
  imageUrl?: string; // Product image
  createdAt: string;
}

export interface InvoiceItem {
  stockId: string;
  stockName: string;
  quantity: number;
  unit: string;
  price: number; // unit price (excluding tax)
  taxRate: number; // percentage (e.g. 20)
  total: number; // including tax (quantity * price * (1 + taxRate/100))
}

export interface Transaction {
  id: string;
  invoiceNo?: string; // Optional, only for sales/purchases
  type: "sale" | "purchase" | "collection" | "payment" | "sale_return" | "purchase_return";
  cariId: string;
  cariName: string;
  date: string; // YYYY-MM-DD
  amount: number; // grand total or receipt amount
  account: "cash" | "bank" | "pos" | ""; // Kasa, Banka, POS, or empty for unpaid/partially paid
  bankAccountId?: string; // Links to the specific bank account if account is "cash" or "bank"
  description: string;
  items?: InvoiceItem[]; // only populated for sale / purchase
  createdAt: string;
  currency?: "TRY" | "USD" | "EUR";
  exchangeRate?: number; // Manual exchange rate for multi-currency transactions
  convertedAmount?: number; // Amount after applying exchange rate to modify Cari's native balance
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalCollections: number;
  totalPayments: number;
  netProfit: number;
  monthlySales: number;
  monthlyPurchases: number;
  monthlyExpenses: number;
  monthlySalaries: number;
  monthlyNetProfit: number;
  totalReceivables: number; // ne kadar alacağımız var (positive cari balances sum)
  totalPayables: number; // ne kadar borcumuz var (negative cari balances sum)
  cashBalance: number;
  bankBalance: number;
  posBalance: number;
  stockValue: number; // calculated as sum of (quantity * purchasePrice)
}

export interface CekSenet {
  id: string;
  type: "receivable" | "payable"; // Alınan / Verilen
  docType: "cheque" | "note"; // Çek / Senet
  portfolioNo: string; // Portföy No
  serialNo: string; // Seri/Çek No
  debtor: string; // Borçlu / Ödeyecek Kişi
  cariId: string; // Kimden alındı / Kime verildi
  cariName: string; // Cari Adı
  amount: number; // Tutar
  currency: "TRY" | "USD" | "EUR";
  issueDate: string; // Düzenleme Tarihi (YYYY-MM-DD)
  dueDate: string; // Vade Tarihi (YYYY-MM-DD)
  bankName?: string; // Banka Adı
  bankBranch?: string; // Şube
  accountNo?: string; // Hesap No
  status: "portfolio" | "collected" | "paid" | "endorsed" | "unpaid"; // Durum
  description?: string; // Açıklama
  createdAt: string;
  exchangeRate?: number; // Manual exchange rate for multi-currency checks
  convertedAmount?: number; // Amount after applying exchange rate to modify Cari's native balance
}

export interface Expense {
  id: string;
  title: string;
  category:
    | "Elektrik"
    | "Su"
    | "Doğalgaz"
    | "Kira"
    | "Muhasebe Gideri"
    | "Maaş/Personel"
    | "Yemek/Mutfak"
    | "Ulaşım/Yakıt"
    | "İnternet/Telefon"
    | "Personel Maaş/Avans"
    | "Vergi/SGK"
    | "Diğer";
  amount: number;
  date: string; // YYYY-MM-DD
  account: "cash" | "bank" | "pos"; // Kasa / Banka / POS
  bankAccountId?: string;
  description?: string;
  currency: "TRY" | "USD" | "EUR";
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  hireDate: string;
  baseSalary: number;
  currency: "TRY" | "USD" | "EUR";
  isActive: boolean;
  createdAt: string;
}

export interface Credit {
  id: string;
  bank: string;
  name: string;
  totalAmount: number;
  remainingInstallments: number;
  monthlyPayment: number;
  status: "active" | "closed";
  createdAt: string;
}

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "accrual" | "payment" | "advance"; // Hak ediş, Ödeme, Avans
  amount: number;
  currency: "TRY" | "USD" | "EUR";
  date: string;
  account: "cash" | "bank" | "pos" | "cek_portfoy" | "cek_firma" | ""; // Ödeme kaynağı (hak ediş için boş kalabilir)
  bankAccountId?: string;
  description?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: "kasa" | "banka" | "pos";
  currency: "TRY" | "USD" | "EUR";
  initialBalance: number;
  createdAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  type: "giris" | "cikis" | "transfer_out" | "transfer_in";
  amount: number;
  date: string;
  description: string;
  targetAccountId?: string;
  createdAt: string;
}
