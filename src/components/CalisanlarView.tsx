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

      {/* MODAL: ADD/EDIT EMPLOYEE CARD */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {editingEmployee
                      ? "Personel Kartını Düzenle"
                      : "Yeni Personel Kartı Oluştur"}
                  </h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                    STORM MUHASEBE PERSONEL FORMU
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleEmployeeSubmit}
              className="p-6 overflow-y-auto space-y-4 flex-1"
            >
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={empFormData.name}
                    onChange={(e) =>
                      setEmpFormData({ ...empFormData, name: e.target.value })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Görevi / Ünvanı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kıdemli Yazılım Geliştirici, Satış Müdürü"
                    value={empFormData.role}
                    onChange={(e) =>
                      setEmpFormData({ ...empFormData, role: e.target.value })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>

                {/* Hire Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    İşe Giriş Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={empFormData.hireDate}
                    onChange={(e) =>
                      setEmpFormData({
                        ...empFormData,
                        hireDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                  />
                </div>

                {/* Base Salary */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Aylık Net Maaş *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0.00"
                    value={empFormData.baseSalary || ""}
                    onChange={(e) =>
                      setEmpFormData({
                        ...empFormData,
                        baseSalary: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Para Birimi *
                  </label>
                  <select
                    value={empFormData.currency}
                    onChange={(e) =>
                      setEmpFormData({
                        ...empFormData,
                        currency: e.target.value as "TRY" | "USD" | "EUR",
                      })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                  >
                    <option value="TRY">₺ TRY</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    placeholder="Örn: 0555 123 4567"
                    value={empFormData.phone}
                    onChange={(e) =>
                      setEmpFormData({ ...empFormData, phone: e.target.value })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    placeholder="Örn: ahmet@sirket.com"
                    value={empFormData.email}
                    onChange={(e) =>
                      setEmpFormData({ ...empFormData, email: e.target.value })
                    }
                    className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>

                {/* Is Active status toggle */}
                <div className="md:col-span-2 flex items-center gap-3.5 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive-checkbox"
                    checked={empFormData.isActive}
                    onChange={(e) =>
                      setEmpFormData({
                        ...empFormData,
                        isActive: e.target.checked,
                      })
                    }
                    className="h-4.5 w-4.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label
                    htmlFor="isActive-checkbox"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                  >
                    Çalışan Aktif Olarak Çalışmaya Devam Ediyor
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting
                    ? "Kaydediliyor..."
                    : editingEmployee
                      ? "Kartı Güncelle"
                      : "Personeli Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SALARY CARI TRANSACTION */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {editingTx
                      ? "Personel Hareketini Düzenle"
                      : "Yeni Hak Ediş, Ödeme veya Avans Girişi"}
                  </h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                    STORM MUHASEBE TAHAKKUK VE AVANS FORMU
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-xs">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-850 uppercase tracking-wide">
                    Kayıtlı Personel Bulunmamaktadır
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Maaş hakedişi, ödeme veya avans kaydı girmek için önce "Personel Kartları" sekmesinden en az bir personel eklemeniz gerekmektedir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTxModalOpen(false);
                    handleOpenCreateEmployee();
                  }}
                  className="mt-2 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <Plus size={14} />
                  <span>Yeni Personel Ekle</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleTxSubmit}
                className="p-6 overflow-y-auto space-y-4 flex-1"
              >
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Employee */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Çalışan Personel *
                    </label>
                    <select
                      required
                      disabled={!!editingTx}
                      value={txFormData.employeeId}
                      onChange={(e) => {
                        const empId = e.target.value;
                        const emp = employees.find((x) => x.id === empId);
                        setTxFormData({
                          ...txFormData,
                          employeeId: empId,
                          amount: emp ? emp.baseSalary : 0,
                          currency: emp ? emp.currency : "TRY",
                        });
                      }}
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Personel Seçin...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role} —{" "}
                          {formatCurrency(emp.baseSalary, emp.currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      İşlem Türü *
                    </label>
                    <select
                      value={txFormData.type}
                      onChange={(e) => handleTxTypeChange(e.target.value as any)}
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="accrual">
                        Maaş Hak Edişi (Borç Artışı)
                      </option>
                      <option value="payment">
                        Maaş Ödemesi (Borç Kapanışı)
                      </option>
                      <option value="advance">Avans Ödemesi (Ön Ödeme)</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      İşlem Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={txFormData.date}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, date: e.target.value })
                      }
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tutar *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={txFormData.amount || ""}
                      onChange={(e) =>
                        setTxFormData({
                          ...txFormData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Para Birimi *
                    </label>
                    <select
                      value={txFormData.currency}
                      onChange={(e) =>
                        setTxFormData({
                          ...txFormData,
                          currency: e.target.value as "TRY" | "USD" | "EUR",
                        })
                      }
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="TRY">₺ TRY</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>

                  {/* Payment Account */}
                  {txFormData.type !== "accrual" && (
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Ödeme Kaynağı (Nereden Ödendi) *
                        </label>
                        <select
                          required
                          value={txFormData.account}
                          onChange={(e) =>
                            setTxFormData({
                              ...txFormData,
                              account: e.target.value as any,
                            })
                          }
                          className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                        >
                          <option value="">Seçiniz...</option>
                          <option value="cash">Kasa (Nakit)</option>
                          <option value="bank">
                            Banka (Banka Hesabı/Havale/EFT)
                          </option>
                          <option value="pos">POS (Kredi Kartı)</option>
                          <option value="cek_portfoy">
                            Portföyden Çek Ciro Et
                          </option>
                          <option value="cek_firma">
                            Firma Çeki (Kendi Çekimiz) Yaz
                          </option>
                        </select>
                      </div>

                      {txFormData.account === "cek_portfoy" && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                            Portföyden Çek Seçin *
                          </label>
                          <select
                            required
                            value={txFormData.selectedPortfolioCekId}
                            onChange={(e) =>
                              setTxFormData({
                                ...txFormData,
                                selectedPortfolioCekId: e.target.value,
                              })
                            }
                            className="w-full border border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg p-2.5 text-xs text-slate-900 bg-white cursor-pointer"
                          >
                            <option value="">Çek Seçiniz...</option>
                            {portfolioCekler.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.amount} {c.currency} - Vade:{" "}
                                {new Date(c.dueDate).toLocaleDateString("tr-TR")}{" "}
                                (Banka: {c.bankName || "Belirtilmedi"})
                              </option>
                            ))}
                          </select>
                          <p className="text-[9px] text-amber-600 font-medium">
                            Seçtiğiniz çekin tutarı ödeme tutarıyla eşleşmelidir.
                          </p>
                        </div>
                      )}

                      {txFormData.account === "cek_firma" && (
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
                              Çek Vade Tarihi *
                            </label>
                            <input
                              type="date"
                              required
                              value={txFormData.newCekDueDate}
                              onChange={(e) =>
                                setTxFormData({
                                  ...txFormData,
                                  newCekDueDate: e.target.value,
                                })
                              }
                              className="w-full border border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">
                              Banka / Şube *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Örn: Garanti BBVA"
                              value={txFormData.newCekBank}
                              onChange={(e) =>
                                setTxFormData({
                                  ...txFormData,
                                  newCekBank: e.target.value,
                                })
                              }
                              className="w-full border border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Açıklama / Not
                    </label>
                    <textarea
                      placeholder="Örn: Haziran 2026 Maaş Ödemesi, Temmuz Avansı vb."
                      value={txFormData.description}
                      onChange={(e) =>
                        setTxFormData({
                          ...txFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full border border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTxModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white uppercase tracking-wider bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting
                      ? "Kaydediliyor..."
                      : editingTx
                        ? "Hareketi Kaydet"
                        : "İşlemi Tamamla"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EMPLOYEE CARI DETAIL VIEWER */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-[9px] text-teal-600 font-bold uppercase tracking-widest font-mono mt-0.5">
                    {selectedEmployee.role} • İŞE GİRİŞ:{" "}
                    {selectedEmployee.hireDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Detail Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Contact Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs">
                {selectedEmployee.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        Telefon
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedEmployee.phone}
                      </span>
                    </div>
                  </div>
                )}
                {selectedEmployee.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        E-posta
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedEmployee.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Balances detail */}
              <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Maaş Türü
                  </span>
                  <div className="text-lg font-extrabold text-slate-800 mt-1">
                    {formatCurrency(
                      selectedEmployee.baseSalary,
                      selectedEmployee.currency,
                    )}
                    <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                      Aylık Sözleşmeli Tutar
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Net Cari Maaş Bakiyesi
                  </span>
                  <div
                    className={`text-lg font-extrabold mt-1 ${
                      (employeeBalances[selectedEmployee.id]?.[
                        selectedEmployee.currency
                      ] || 0) > 0
                        ? "text-rose-600"
                        : (employeeBalances[selectedEmployee.id]?.[
                              selectedEmployee.currency
                            ] || 0) < 0
                          ? "text-teal-600"
                          : "text-slate-500"
                    }`}
                  >
                    {formatCurrency(
                      Math.abs(
                        employeeBalances[selectedEmployee.id]?.[
                          selectedEmployee.currency
                        ] || 0,
                      ),
                      selectedEmployee.currency,
                    )}
                    <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                      {(employeeBalances[selectedEmployee.id]?.[
                        selectedEmployee.currency
                      ] || 0) > 0
                        ? "Firmamız Personele Borçludur"
                        : (employeeBalances[selectedEmployee.id]?.[
                              selectedEmployee.currency
                            ] || 0) < 0
                          ? "Personele Fazla / Avans Ödenmiştir"
                          : "Ödemeler Tamamen Kapatılmıştır"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions List of this Employee */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Personel Hesap Ekstresi (Cari Hareketler)
                  </h4>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenCreateTx(selectedEmployee.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Hareket Girişi Yap</span>
                  </button>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Tarih</th>
                          <th className="py-2.5 px-3">Tür</th>
                          <th className="py-2.5 px-3">Ödeme Kaynağı</th>
                          <th className="py-2.5 px-3">Açıklama</th>
                          <th className="py-2.5 px-3 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeSpecificTransactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-slate-400 italic font-medium"
                            >
                              Bu personele ait cari hareket kaydı henüz
                              bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          employeeSpecificTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/30">
                              <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                                {t.date}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    t.type === "accrual"
                                      ? "bg-amber-50 text-amber-700"
                                      : t.type === "payment"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-indigo-50 text-indigo-700"
                                  }`}
                                >
                                  {t.type === "accrual"
                                    ? "Hak Ediş"
                                    : t.type === "payment"
                                      ? "Ödeme"
                                      : "Avans"}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-600">
                                {t.account === "cash"
                                  ? "Kasa"
                                  : t.account === "bank"
                                    ? "Banka"
                                    : t.account === "pos"
                                      ? "POS"
                                      : t.account === "cek_portfoy"
                                        ? "Çek (Portföy)"
                                        : t.account === "cek_firma"
                                          ? "Çek (Firma)"
                                          : "—"}
                              </td>
                              <td
                                className="py-3 px-3 text-slate-600 max-w-xs truncate"
                                title={t.description || ""}
                              >
                                {t.description || (
                                  <span className="text-slate-300 italic">
                                    Detay yok
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                {formatCurrency(t.amount, t.currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
