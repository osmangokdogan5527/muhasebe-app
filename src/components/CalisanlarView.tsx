import { CalisanlarModals } from './calisanlar/CalisanlarModals';
import React, { useState, useMemo, useEffect } from "react";
import { Employee, EmployeeTransaction, CekSenet } from "../types";
import {
  saveEmployee,
  deleteEmployee,
  saveEmployeeTransaction,
  deleteEmployeeTransaction,
  saveCekSenet,
} from "../firebase";
import {
  Plus,
  Search,
  Users,
  Calendar,
  Edit2,
  Trash2,
  X,
  TrendingDown,
  Phone,
  Mail,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
} from "lucide-react";
interface CalisanlarViewProps {
  employees: Employee[];
  transactions: EmployeeTransaction[];
  ceksenet: CekSenet[];
  aiPrefilledData?: {
    islem: 'expense' | 'sale' | 'purchase' | 'collection' | 'payment' | 'employee_payment';
    cariAdi?: string;
    urunAdi?: string;
    miktar?: number;
    fiyat?: number;
    kdv?: number;
  } | null;
  onClearAiPrefilledData?: () => void;
}
export default function CalisanlarView({
  employees,
  transactions,
  ceksenet,
  aiPrefilledData,
  onClearAiPrefilledData
}: CalisanlarViewProps) {
  const [activeTab, setActiveTab] = useState<"employees" | "transactions">(
    "employees",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<EmployeeTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  // Form Employee state
  const [empFormData, setEmpFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    hireDate: new Date().toISOString().split("T")[0],
    baseSalary: 0,
    currency: "TRY" as "TRY" | "USD" | "EUR",
    isActive: true,
  });
  // Form Transaction state
  const [txFormData, setTxFormData] = useState({
    employeeId: "",
    type: "accrual" as "accrual" | "payment" | "advance",
    amount: 0,
    currency: "TRY" as "TRY" | "USD" | "EUR",
    date: new Date().toISOString().split("T")[0],
    account: "" as "cash" | "bank" | "pos" | "cek_portfoy" | "cek_firma" | "",
    description: "",
    selectedPortfolioCekId: "",
    newCekDueDate: "",
    newCekBank: "",
  });
  // Derived portfolio checks for dropdown
  const portfolioCekler = useMemo(() => {
    return ceksenet.filter(
      (c) => c.status === "portfolio" && c.type === "receivable",
    );
  }, [ceksenet]);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.islem === 'employee_payment') {
      setActiveTab('transactions');
      setEditingTx(null);
      setFormError('');
      let empId = '';
      if (aiPrefilledData.cariAdi || aiPrefilledData.urunAdi) {
        const query = (aiPrefilledData.cariAdi || aiPrefilledData.urunAdi || '').toLocaleLowerCase('tr-TR').trim();
        let matchedEmp = employees.find(e => e.name.toLocaleLowerCase('tr-TR').includes(query));
        if (!matchedEmp) {
          const words = query.split(' ').filter(w => w.length > 2);
          if (words.length > 0) {
            matchedEmp = employees.find(e => words.some(w => e.name.toLocaleLowerCase('tr-TR').includes(w)));
          }
        }
        if (matchedEmp) empId = matchedEmp.id;
      }
      let txType = 'advance' as "accrual" | "payment" | "advance";
      if (aiPrefilledData.cariAdi?.toLowerCase().includes('maaş') || aiPrefilledData.urunAdi?.toLowerCase().includes('maaş')) {
        txType = 'payment';
      }
      setTxFormData({
        employeeId: empId,
        type: txType,
        amount: aiPrefilledData.fiyat || 0,
        currency: 'TRY',
        date: new Date().toISOString().split("T")[0],
        account: 'cash',
        description: 'Storm AI tarafından dolduruldu.',
        selectedPortfolioCekId: "",
        newCekDueDate: "",
        newCekBank: "",
      });
      setIsTxModalOpen(true);
      if (onClearAiPrefilledData) {
        onClearAiPrefilledData();
      }
    }
  }, [aiPrefilledData, employees]);
  // Calculate Balances for each employee
  // Balance = Accruals - Payments - Advances
  const employeeBalances = useMemo(() => {
    const balances = {} as Record<
      string,
      Record<"TRY" | "USD" | "EUR", number>
    >;
    // Initialize
    employees.forEach((emp) => {
      balances[emp.id] = { TRY: 0, USD: 0, EUR: 0 };
    });
    transactions.forEach((tx) => {
      if (!balances[tx.employeeId]) {
        balances[tx.employeeId] = { TRY: 0, USD: 0, EUR: 0 };
      }
      const amt = tx.amount || 0;
      const curr = tx.currency || "TRY";
      if (tx.type === "accrual") {
        // Accrual increases the amount we owe them
        balances[tx.employeeId][curr] += amt;
      } else {
        // Payment or Advance decreases the amount we owe them
        balances[tx.employeeId][curr] -= amt;
      }
    });
    return balances;
  }, [employees, transactions]);
  // Overall stats
  const stats = useMemo(() => {
    const activeCount = employees.filter((e) => e.isActive).length;
    // Salary sum per month (base salaries)
    const monthlySalary = { TRY: 0, USD: 0, EUR: 0 };
    employees.forEach((e) => {
      if (e.isActive) {
        monthlySalary[e.currency] =
          (monthlySalary[e.currency] || 0) + e.baseSalary;
      }
    });
    // Net owed balance (sum of all positive balances)
    const netOwed = { TRY: 0, USD: 0, EUR: 0 };
    Object.keys(employeeBalances).forEach((empId) => {
      const bal = employeeBalances[empId];
      if (bal) {
        if (bal.TRY > 0) netOwed.TRY += bal.TRY;
        if (bal.USD > 0) netOwed.USD += bal.USD;
        if (bal.EUR > 0) netOwed.EUR += bal.EUR;
      }
    });
    return {
      activeCount,
      monthlySalary,
      netOwed,
    };
  }, [employees, employeeBalances]);
  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchTerm)) ||
        (emp.email &&
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchRole = filterRole === "all" || emp.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [employees, searchTerm, filterRole]);
  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.description &&
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [transactions, searchTerm]);
  // Unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    employees.forEach((e) => {
      if (e.role) roles.add(e.role);
    });
    return Array.from(roles);
  }, [employees]);
  // Actions
  const handleOpenCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      hireDate: new Date().toISOString().split("T")[0],
      baseSalary: 0,
      currency: "TRY",
      isActive: true,
    });
    setFormError("");
    setIsEmployeeModalOpen(true);
  };
  const handleOpenEditEmployee = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setEmpFormData({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || "",
      email: emp.email || "",
      hireDate: emp.hireDate,
      baseSalary: emp.baseSalary,
      currency: emp.currency,
      isActive: emp.isActive,
    });
    setFormError("");
    setIsEmployeeModalOpen(true);
  };
  const handleDeleteEmployee = async (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `"${name}" adlı çalışanı silmek istediğinize emin misiniz? Bu işlem çalışanın cari geçmişini silmez.`,
      )
    )
      return;
    try {
      await deleteEmployee(id);
    } catch (err: any) {
      alert("Çalışan silinirken hata oluştu: " + err.message);
    }
  };
  const handleOpenCreateTx = (empId?: string) => {
    const initialEmp = empId || (employees.length > 0 ? employees[0].id : "");
    const emp = employees.find((e) => e.id === initialEmp);
    setEditingTx(null);
    setTxFormData({
      employeeId: initialEmp,
      type: "accrual",
      amount: emp ? emp.baseSalary : 0,
      currency: emp ? emp.currency : "TRY",
      date: new Date().toISOString().split("T")[0],
      account: "",
      description: "",
      selectedPortfolioCekId: "",
      newCekDueDate: "",
      newCekBank: "",
    });
    setFormError("");
    setIsTxModalOpen(true);
  };
  const handleOpenEditTx = (tx: EmployeeTransaction) => {
    setEditingTx(tx);
    setTxFormData({
      employeeId: tx.employeeId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.date,
      account: tx.account || "",
      description: tx.description || "",
      selectedPortfolioCekId: "",
      newCekDueDate: "",
      newCekBank: "",
    });
    setFormError("");
    setIsTxModalOpen(true);
  };
  const handleDeleteTx = async (id: string) => {
    if (!window.confirm("Bu hareketi silmek istediğinize emin misiniz?"))
      return;
    try {
      await deleteEmployeeTransaction(id);
    } catch (err: any) {
      alert("İşlem silinirken hata oluştu: " + err.message);
    }
  };
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFormData.name.trim()) {
      setFormError("Lütfen çalışan adı ve soyadı girin.");
      return;
    }
    if (!empFormData.role.trim()) {
      setFormError("Lütfen bir görev/ünvan tanımlayın.");
      return;
    }
    if (empFormData.baseSalary < 0) {
      setFormError("Lütfen geçerli bir maaş girin.");
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError("");
      const payload = {
        name: empFormData.name.trim(),
        role: empFormData.role.trim(),
        phone: empFormData.phone.trim(),
        email: empFormData.email.trim(),
        hireDate: empFormData.hireDate,
        baseSalary: Number(empFormData.baseSalary),
        currency: empFormData.currency,
        isActive: empFormData.isActive,
        createdAt: editingEmployee
          ? editingEmployee.createdAt
          : new Date().toISOString(),
      };
      await saveEmployee(payload, editingEmployee?.id);
      setIsEmployeeModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txFormData.employeeId) {
      setFormError("Lütfen bir çalışan seçin.");
      return;
    }
    if (txFormData.amount <= 0) {
      setFormError("Lütfen geçerli bir tutar girin.");
      return;
    }
    if (txFormData.type !== "accrual" && !txFormData.account) {
      setFormError(
        "Ödeme ve avans işlemleri için lütfen bir ödeme kaynağı seçin.",
      );
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError("");
      const selectedEmp = employees.find(
        (emp) => emp.id === txFormData.employeeId,
      );
      if (!selectedEmp) throw new Error("Çalışan bulunamadı.");
      // Check validations and processing
      let updatedDescription = txFormData.description.trim();
      if (txFormData.type !== "accrual") {
        if (txFormData.account === "cek_portfoy") {
          if (!txFormData.selectedPortfolioCekId) {
            throw new Error("Lütfen portföyden bir çek seçin.");
          }
          const selectedCek = ceksenet.find(
            (c) => c.id === txFormData.selectedPortfolioCekId,
          );
          if (!selectedCek) throw new Error("Seçilen çek bulunamadı.");
          if (
            selectedCek.amount !== Number(txFormData.amount) ||
            selectedCek.currency !== txFormData.currency
          ) {
            throw new Error(
              `Seçilen çek tutarı (${selectedCek.amount} ${selectedCek.currency}) girilen ödeme tutarı ile uyuşmuyor.`,
            );
          }
          // Update check status
          await saveCekSenet(
            {
              ...selectedCek,
              status: "endorsed",
              description: selectedCek.description
                ? `${selectedCek.description} | Personele Ciro Edildi: ${selectedEmp.name}`
                : `Personele Ciro Edildi: ${selectedEmp.name}`,
            },
            selectedCek.id,
          );
          updatedDescription = `Çek Ciro Edildi (Portföy No: ${selectedCek.portfolioNo}) - ${updatedDescription}`;
        } else if (txFormData.account === "cek_firma") {
          if (!txFormData.newCekDueDate || !txFormData.newCekBank) {
            throw new Error("Firma çeki için banka ve vade tarihi zorunludur.");
          }
          const newCek: Omit<CekSenet, "id"> = {
            type: "payable",
            docType: "cheque",
            portfolioNo: `P-${Date.now().toString().slice(-6)}`,
            serialNo: `F-${Date.now().toString().slice(-6)}`,
            debtor: "Firmamız (Kendi Çekimiz)",
            cariId: selectedEmp.id,
            cariName: selectedEmp.name,
            bankName: txFormData.newCekBank,
            amount: Number(txFormData.amount),
            currency: txFormData.currency,
            issueDate: txFormData.date,
            dueDate: txFormData.newCekDueDate,
            status: "portfolio",
            description: `Maaş/Avans ödemesi: ${selectedEmp.name}`,
            createdAt: new Date().toISOString(),
          };
          await saveCekSenet(newCek);
          updatedDescription = `Firma Çeki Verildi (Vade: ${txFormData.newCekDueDate}, Banka: ${txFormData.newCekBank}) - ${updatedDescription}`;
        }
      }
      const payload = {
        employeeId: txFormData.employeeId,
        employeeName: selectedEmp.name,
        type: txFormData.type,
        amount: Number(txFormData.amount),
        currency: txFormData.currency,
        date: txFormData.date,
        account: txFormData.type === "accrual" ? "" : txFormData.account,
        description: updatedDescription,
        createdAt: editingTx ? editingTx.createdAt : new Date().toISOString(),
      };
      await saveEmployeeTransaction(payload, editingTx?.id);
      setIsTxModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTxTypeChange = (type: "accrual" | "payment" | "advance") => {
    setTxFormData((prev) => ({
      ...prev,
      type,
      // If switching to accrual, account must be empty. If payment/advance, default to 'cash'
      account: type === "accrual" ? "" : prev.account || "cash",
    }));
  };
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
    return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  // Get specific employee transactions
  const employeeSpecificTransactions = useMemo(() => {
    if (!selectedEmployee) return [];
    return transactions.filter((t) => t.employeeId === selectedEmployee.id);
  }, [selectedEmployee, transactions]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1
            id="calisanlar-heading"
            className="text-xl font-extrabold uppercase tracking-wider text-slate-900"
          >
            Çalışan Yönetimi
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">
            PERSONEL KARTLARI • MAAŞ TAHAKKUKLARI • AVANS VE ÖDEME TAKİBİ
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            id="add-tx-btn"
            onClick={() => handleOpenCreateTx()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
          >
            <DollarSign size={15} />
            <span>Hak Ediş / Ödeme Yap</span>
          </button>
          <button
            id="add-employee-btn"
            onClick={handleOpenCreateEmployee}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
          >
            <Plus size={16} />
            <span>Yeni Personel Ekle</span>
          </button>
        </div>
      </div>
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Aktif Çalışanlar
            </span>
            <h4 className="text-xl font-extrabold text-slate-900 mt-1">
              {stats.activeCount} Personel
            </h4>
          </div>
        </div>
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Aylık Maaş Yükü (TL)
            </span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(stats.monthlySalary.TRY, "TRY")}
            </h4>
          </div>
        </div>
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Maaş Borçları (TL)
            </span>
            <h4 className="text-xl font-bold text-rose-600 mt-1">
              {formatCurrency(stats.netOwed.TRY, "TRY")}
            </h4>
          </div>
        </div>
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Maaş Borçları (USD/EUR)
            </span>
            <h4 className="text-sm font-bold text-slate-800 mt-1 flex flex-col">
              <span>{formatCurrency(stats.netOwed.USD, "USD")}</span>
              <span>{formatCurrency(stats.netOwed.EUR, "EUR")}</span>
            </h4>
          </div>
        </div>
      </div>
      {/* Main Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => {
            setActiveTab("employees");
            setSearchTerm("");
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "employees"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Personel Listesi
        </button>
        <button
          onClick={() => {
            setActiveTab("transactions");
            setSearchTerm("");
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "transactions"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Maaş & Ödeme Cari Geçmişi
        </button>
      </div>
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={
              activeTab === "employees"
                ? "Çalışan adı, ünvan veya iletişim ara..."
                : "Çalışan veya açıklama ara..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#ffffff] border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900"
          />
        </div>
        {activeTab === "employees" && (
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-[#ffffff] border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">Tüm Ünvanlar</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
        {activeTab === "transactions" && (
          <button
            onClick={() => handleOpenCreateTx()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Plus size={14} />
            <span>Hak Ediş / Ödeme Ekle</span>
          </button>
        )}
      </div>
      {/* TAB CONTENT: EMPLOYEES */}
      {activeTab === "employees" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
              Kayıtlı personel bulunamadı.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const balanceObj = employeeBalances[emp.id] || {
                TRY: 0,
                USD: 0,
                EUR: 0,
              };
              const currentBalance = balanceObj[emp.currency];
              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setIsDetailModalOpen(true);
                  }}
                  className="bg-[#ffffff] border border-slate-200 hover:border-teal-300 rounded-2xl shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Info & Status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-teal-600 transition">
                          {emp.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          {emp.role}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          emp.isActive
                            ? "bg-teal-50 text-teal-700 border border-teal-100"
                            : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {emp.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    {/* Contact & Hire Date details */}
                    <div className="space-y-1.5 text-slate-500 text-xs pt-1">
                      {emp.phone && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone size={12} className="text-slate-400" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                      {emp.email && (
                        <div className="flex items-center gap-2 text-[11px] truncate">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px]">
                        <Calendar size={12} className="text-slate-400" />
                        <span>İşe Giriş: {emp.hireDate}</span>
                      </div>
                    </div>
                  </div>
                  {/* Financial status footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        Aylık Net Maaş
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {formatCurrency(emp.baseSalary, emp.currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        Maaş Bakiyesi
                      </span>
                      <span
                        className={`font-mono font-extrabold text-xs ${
                          currentBalance > 0
                            ? "text-rose-600"
                            : currentBalance < 0
                              ? "text-teal-600"
                              : "text-slate-500"
                        }`}
                      >
                        {currentBalance > 0
                          ? `Borçluyuz: ${formatCurrency(currentBalance, emp.currency)}`
                          : currentBalance < 0
                            ? `Alacaklıyız: ${formatCurrency(Math.abs(currentBalance), emp.currency)}`
                            : "Dengede"}
                      </span>
                    </div>
                  </div>
                  {/* Quick Edit Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100/50 flex justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateTx(emp.id);
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:bg-teal-50 px-2.5 py-1 rounded-lg transition"
                    >
                      Hak Ediş / Ödeme Yap
                    </button>
                    <button
                      onClick={(e) => handleOpenEditEmployee(emp, e)}
                      className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition"
                      title="Kartı Düzenle"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Kartı Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* TAB CONTENT: CARI TRANSACTIONS */}
      {activeTab === "transactions" && (
        <div className="bg-[#ffffff] rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Çalışan Personel
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    İşlem Türü
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ödeme Kaynağı
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Açıklama / Not
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Tutar
                  </th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <span className="font-semibold text-slate-500">Eşleşen hareket kaydı bulunamadı.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateTx()}
                          className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <Plus size={14} />
                          <span>İlk Hareketi Ekle (Hak Ediş / Ödeme)</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono">
                          {tx.date}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {tx.employeeName}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tx.type === "accrual"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : tx.type === "payment"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}
                          >
                            {tx.type === "accrual" ? (
                              <>
                                <ArrowUpRight size={10} />
                                Hak Ediş
                              </>
                            ) : tx.type === "payment" ? (
                              <>
                                <ArrowDownLeft size={10} />
                                Ödeme
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft size={10} />
                                Avans
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {tx.account ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                tx.account === "cash"
                                  ? "bg-amber-100/50 text-amber-800"
                                  : tx.account === "bank"
                                    ? "bg-teal-100/50 text-teal-800"
                                    : tx.account === "pos"
                                      ? "bg-purple-100/50 text-purple-800"
                                      : "bg-indigo-100/50 text-indigo-800"
                              }`}
                            >
                              {tx.account === "cash"
                                ? "Kasa"
                                : tx.account === "bank"
                                  ? "Banka"
                                  : tx.account === "pos"
                                    ? "POS"
                                    : tx.account === "cek_portfoy"
                                      ? "Çek (Portföy)"
                                      : tx.account === "cek_firma"
                                        ? "Çek (Firma)"
                                        : tx.account}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                          {tx.description || (
                            <span className="text-slate-300 italic">
                              Girilmedi
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right font-extrabold text-slate-900">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditTx(tx)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                              title="Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteTx(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
            <CalisanlarModals 
        isEmployeeModalOpen={isEmployeeModalOpen}
        isTxModalOpen={isTxModalOpen}
        isDetailModalOpen={isDetailModalOpen}
        editingEmployee={editingEmployee}
        editingTx={editingTx}
        selectedEmployee={selectedEmployee}
        empFormData={empFormData}
        txFormData={txFormData}
        formError={formError}
        isSubmitting={isSubmitting}
        setIsEmployeeModalOpen={setIsEmployeeModalOpen}
        setIsTxModalOpen={setIsTxModalOpen}
        setIsDetailModalOpen={setIsDetailModalOpen}
        setEmpFormData={setEmpFormData}
        setTxFormData={setTxFormData}
        handleEmployeeSubmit={handleEmployeeSubmit}
        handleTxSubmit={handleTxSubmit}
        handleDeleteTx={handleDeleteTx}
        handleOpenEditTx={handleOpenEditTx}
        handleOpenCreateEmployee={handleOpenCreateEmployee}
        handleOpenCreateTx={handleOpenCreateTx}
        handleTxTypeChange={handleTxTypeChange}
        formatCurrency={formatCurrency}
                employeeBalances={employeeBalances}
        employeeSpecificTransactions={employeeSpecificTransactions}
        portfolioCekler={portfolioCekler}
        employees={employees}
      />
    </div>
  );
}
