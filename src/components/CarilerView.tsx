import React, { useState, useMemo, useEffect } from "react";
import { Cari, Transaction, Stock } from "../types";
import { saveCari, deleteCari, createTransaction } from "../firebase";
import { compressImage } from "../utils/imageCompressor";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  FileText,
  X,
  Users,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Save,
  Calendar,
} from "lucide-react";

interface CarilerViewProps {
  cariler: Cari[];
  islemler: Transaction[];
  stoklar?: Stock[];
  bankAccounts?: any[];
  onQuickTransaction?: (
    type: "sale" | "purchase" | "collection" | "payment",
    cariId: string,
  ) => void;
  aiPrefilledData?: any;
  onClearAiPrefilledData?: () => void;
  pendingAddCari?: boolean;
  onCariAdded?: () => void;
  selectedCariIdForDetails?: string | null;
  onSelectCariForDetails?: (cariId: string | null) => void;
}

export default function CarilerView({
  cariler,
  islemler,
  stoklar = [],
  bankAccounts = [],
  onQuickTransaction,
  aiPrefilledData,
  onClearAiPrefilledData,
  pendingAddCari,
  onCariAdded,
  selectedCariIdForDetails,
  onSelectCariForDetails,
}: CarilerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "customer" | "supplier" | "receivable" | "payable" | "passive"
  >("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [localSelectedCariForDetails, setLocalSelectedCariForDetails] =
    useState<Cari | null>(null);

  const selectedCariForDetails = useMemo(() => {
    if (selectedCariIdForDetails !== undefined) {
      if (!selectedCariIdForDetails) return null;
      return cariler.find((c) => c.id === selectedCariIdForDetails) || null;
    }
    return localSelectedCariForDetails;
  }, [selectedCariIdForDetails, localSelectedCariForDetails, cariler]);

  const setSelectedCariForDetails = (cari: Cari | null) => {
    if (onSelectCariForDetails) {
      onSelectCariForDetails(cari ? cari.id : null);
    } else {
      setLocalSelectedCariForDetails(cari);
    }
  };
  const [ekstreType, setEkstreType] = useState<"summary" | "detailed">("summary");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const currentCari = useMemo(() => {
    if (!selectedCariForDetails) return null;
    return cariler.find((c) => c.id === selectedCariForDetails.id) || selectedCariForDetails;
  }, [selectedCariForDetails, cariler]);

  // Notes and Embedded Quick Transactions states
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [quickTxType, setQuickTxType] = useState<"collection" | "payment" | "sale_return" | "purchase_return">("collection");
  const [quickTxAmount, setQuickTxAmount] = useState("");
  const [quickTxInvoiceNo, setQuickTxInvoiceNo] = useState("");
  const [quickTxDate, setQuickTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [quickTxAccount, setQuickTxAccount] = useState<"cash" | "bank" | "pos" | "">("cash");
  const [quickTxBankAccountId, setQuickTxBankAccountId] = useState("");
  const [quickTxDescription, setQuickTxDescription] = useState("");
  const [isSavingQuickTx, setIsSavingQuickTx] = useState(false);
  const [quickTxError, setQuickTxError] = useState("");

  // Product selection states for return transactions
  const [quickTxStockId, setQuickTxStockId] = useState("");
  const [quickTxQuantity, setQuickTxQuantity] = useState("1");
  const [quickTxUnitPrice, setQuickTxUnitPrice] = useState("");

  // Update prices and compute totals automatically when product or type changes
  useEffect(() => {
    if (quickTxType === "sale_return" || quickTxType === "purchase_return") {
      const selectedStock = stoklar.find(s => s.id === quickTxStockId);
      if (selectedStock) {
        const price = quickTxType === "sale_return" ? selectedStock.salesPrice : selectedStock.purchasePrice;
        setQuickTxUnitPrice(price.toString());
        const qty = parseFloat(quickTxQuantity) || 1;
        setQuickTxAmount((qty * price).toFixed(2));
      } else {
        setQuickTxUnitPrice("");
        setQuickTxAmount("");
      }
    }
  }, [quickTxStockId, quickTxType, stoklar]);

  // Recalculate total amount when quantity or unit price is changed manually
  useEffect(() => {
    if (quickTxType === "sale_return" || quickTxType === "purchase_return") {
      const qty = parseFloat(quickTxQuantity) || 0;
      const price = parseFloat(quickTxUnitPrice) || 0;
      if (qty > 0 && price > 0) {
        setQuickTxAmount((qty * price).toFixed(2));
      }
    }
  }, [quickTxQuantity, quickTxUnitPrice, quickTxType]);

  // Populate Notes when currentCari changes
  useEffect(() => {
    if (currentCari) {
      setNotesText(currentCari.notes || "");
      setStartDate("");
      setEndDate("");
    } else {
      setNotesText("");
      setStartDate("");
      setEndDate("");
    }
  }, [currentCari?.id]);

  // Populate automatic Description when quickTxType changes
  useEffect(() => {
    if (quickTxType === "collection") {
      setQuickTxDescription("Hızlı Tahsilat Girişi");
    } else if (quickTxType === "payment") {
      setQuickTxDescription("Hızlı Ödeme Girişi");
    } else if (quickTxType === "sale_return") {
      setQuickTxDescription("Hızlı Satıştan İade Girişi");
    } else {
      setQuickTxDescription("Hızlı Alıştan İade Girişi");
    }
  }, [quickTxType]);

  // Filter accounts based on selected account type
  const filteredAccountsForQuick = useMemo(() => {
    return bankAccounts.filter((acc) => {
      if (quickTxAccount === "cash") return acc.type === "kasa";
      if (quickTxAccount === "bank") return acc.type === "banka";
      if (quickTxAccount === "pos") return acc.type === "pos";
      return false;
    });
  }, [bankAccounts, quickTxAccount]);

  // Set default bank account ID when filteredAccounts changes
  useEffect(() => {
    if (filteredAccountsForQuick.length > 0) {
      setQuickTxBankAccountId(filteredAccountsForQuick[0].id);
    } else {
      setQuickTxBankAccountId("");
    }
  }, [filteredAccountsForQuick]);

  // Save notes handler
  const handleSaveNotes = async () => {
    if (!currentCari) return;
    setIsSavingNotes(true);
    try {
      const { id, ...cariDataWithoutId } = currentCari;
      await saveCari({
        ...cariDataWithoutId,
        notes: notesText,
      }, id);
    } catch (err) {
      console.error("Not kaydedilirken hata oluştu:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Quick transaction save handler
  const handleSaveQuickTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCari) return;
    const finalAmount = parseFloat(quickTxAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setQuickTxError("Lütfen geçerli bir tutar girin.");
      return;
    }

    // Validate product if it is a return transaction
    let items = undefined;
    const isReturn = quickTxType === "sale_return" || quickTxType === "purchase_return";
    if (isReturn) {
      if (!quickTxStockId) {
        setQuickTxError("Lütfen iade edilecek ürünü seçin.");
        return;
      }
      const selectedStock = stoklar.find(s => s.id === quickTxStockId);
      if (!selectedStock) {
        setQuickTxError("Seçilen ürün bulunamadı.");
        return;
      }
      const qty = parseFloat(quickTxQuantity);
      if (isNaN(qty) || qty <= 0) {
        setQuickTxError("Lütfen geçerli bir miktar girin.");
        return;
      }
      const price = parseFloat(quickTxUnitPrice) || 0;
      const taxRateValue = selectedStock.taxRate || 0;
      const itemTotal = qty * price * (1 + taxRateValue / 100);

      items = [{
        stockId: selectedStock.id,
        stockName: selectedStock.name,
        quantity: qty,
        unit: selectedStock.unit || "Adet",
        price: price,
        taxRate: taxRateValue,
        total: itemTotal
      }];
    }

    setIsSavingQuickTx(true);
    setQuickTxError("");

    try {
      await createTransaction({
        type: quickTxType,
        cariId: currentCari.id,
        cariName: currentCari.name,
        date: quickTxDate,
        amount: finalAmount,
        invoiceNo: quickTxInvoiceNo || "",
        // If it is a return, there is no payment/kasa involved (it is open-account). "ödeme ne alaka" -> correct!
        account: isReturn ? "" : quickTxAccount,
        bankAccountId: isReturn ? "" : (quickTxBankAccountId || ""),
        description: quickTxDescription || `${quickTxType === "collection" ? "Tahsilat" : quickTxType === "payment" ? "Ödeme" : quickTxType === "sale_return" ? "Satıştan İade" : "Alıştan İade"}`,
        currency: currentCari.currency || "TRY",
        exchangeRate: 1,
        convertedAmount: finalAmount,
        createdAt: new Date().toISOString(),
        items: items
      });

      // Clear inputs upon success
      setQuickTxAmount("");
      setQuickTxInvoiceNo("");
      if (isReturn) {
        setQuickTxStockId("");
        setQuickTxQuantity("1");
        setQuickTxUnitPrice("");
      }
    } catch (err: any) {
      console.error("Hızlı işlem kaydedilirken hata oluştu:", err);
      setQuickTxError(err.message || "İşlem kaydedilemedi.");
    } finally {
      setIsSavingQuickTx(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "customer" as "customer" | "supplier" | "both",
    phone: "",
    email: "",
    address: "",
    openingBalance: 0,
    isActive: true,
    currency: "TRY" as "TRY" | "USD" | "EUR",
    taxOffice: "",
    taxNo: "",
    imageUrl: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion states
  const [deleteConfirmCari, setDeleteConfirmCari] = useState<Cari | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter and search Cariler
  const filteredCariler = useMemo(() => {
    return cariler.filter((cari) => {
      const matchSearch =
        cari.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cari.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cari.phone.includes(searchTerm) ||
        cari.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      switch (filterType) {
        case "passive":
          return cari.isActive === false;
        case "customer":
          return (
            cari.isActive !== false &&
            (cari.type === "customer" || cari.type === "both")
          );
        case "supplier":
          return (
            cari.isActive !== false &&
            (cari.type === "supplier" || cari.type === "both")
          );
        case "receivable":
          return cari.isActive !== false && cari.balance > 0;
        case "payable":
          return cari.isActive !== false && cari.balance < 0;
        default: // 'all'
          return cari.isActive !== false;
      }
    });
  }, [cariler, searchTerm, filterType]);

  // Open modal with AI prefilled data
  useEffect(() => {
    if (aiPrefilledData) {
      const type = aiPrefilledData.islem;
      if (type === 'add_customer' || type === 'add_supplier') {
        const isCustomer = type === 'add_customer';
        setEditingCari(null);
        setFormData({
          name: aiPrefilledData.cariAdi || "",
          code: aiPrefilledData.code || `CAR-${String(cariler.length + 1).padStart(4, "0")}`,
          type: isCustomer ? "customer" : "supplier",
          phone: aiPrefilledData.phone || "",
          email: aiPrefilledData.email || "",
          address: aiPrefilledData.address || "",
          openingBalance: aiPrefilledData.bakiye || 0,
          isActive: true,
          currency: (aiPrefilledData.currency && ["TRY", "USD", "EUR"].includes(aiPrefilledData.currency)) ? aiPrefilledData.currency : "TRY",
          taxOffice: aiPrefilledData.taxOffice || "",
          taxNo: aiPrefilledData.taxNo || "",
          imageUrl: "",
        });
        setFormError("");
        setIsModalOpen(true);
        
        if (onClearAiPrefilledData) {
          onClearAiPrefilledData();
        }
      }
    }
  }, [aiPrefilledData, cariler.length, onClearAiPrefilledData]);

  // Open modal automatically when pendingAddCari is triggered
  useEffect(() => {
    if (pendingAddCari) {
      handleOpenCreateModal();
      if (onCariAdded) {
        onCariAdded();
      }
    }
  }, [pendingAddCari, onCariAdded]);

  // Open modal for creating new Cari
  const handleOpenCreateModal = () => {
    setEditingCari(null);
    setFormData({
      name: "",
      code: `CAR-${String(cariler.length + 1).padStart(4, "0")}`,
      type: "customer",
      phone: "",
      email: "",
      address: "",
      openingBalance: 0,
      isActive: true,
      currency: "TRY",
      taxOffice: "",
      taxNo: "",
      imageUrl: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing Cari
  const handleOpenEditModal = (cari: Cari) => {
    setEditingCari(cari);
    setFormData({
      name: cari.name,
      code: cari.code,
      type: cari.type,
      phone: cari.phone,
      email: cari.email,
      address: cari.address,
      openingBalance: cari.openingBalance,
      isActive: cari.isActive !== false,
      currency: cari.currency || "TRY",
      taxOffice: cari.taxOffice || "",
      taxNo: cari.taxNo || "",
      imageUrl: cari.imageUrl || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 300, 300, 0.7);
        setFormData({ ...formData, imageUrl: compressedBase64 });
      } catch (err) {
        console.error("Resim sıkıştırma hatası:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Lütfen cari ünvanını/adını girin.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (editingCari) {
        // Carry over current balance adjustments
        const balanceDiff =
          formData.openingBalance - editingCari.openingBalance;
        const updatedCari: Omit<Cari, "id"> = {
          name: formData.name,
          code: formData.code,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          openingBalance: formData.openingBalance,
          balance: editingCari.balance + balanceDiff, // adjust balance with opening balance diff
          isActive: formData.isActive,
          currency: formData.currency,
          taxOffice: formData.taxOffice,
          taxNo: formData.taxNo,
          imageUrl: formData.imageUrl,
          createdAt: editingCari.createdAt || new Date().toISOString(),
        };
        await saveCari(updatedCari, editingCari.id);
      } else {
        const newCari: Omit<Cari, "id"> = {
          name: formData.name,
          code: formData.code,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          openingBalance: formData.openingBalance,
          balance: formData.openingBalance,
          isActive: formData.isActive,
          currency: formData.currency,
          taxOffice: formData.taxOffice,
          taxNo: formData.taxNo,
          imageUrl: formData.imageUrl,
          createdAt: new Date().toISOString(),
        };
        await saveCari(newCari);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(
        "Cari kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deletion of Cari
  const handleDelete = (cari: Cari) => {
    setDeleteConfirmCari(cari);
    setDeleteError(null);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmCari) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCari(deleteConfirmCari.id);
      if (selectedCariForDetails?.id === deleteConfirmCari.id) {
        setSelectedCariForDetails(null);
      }
      setDeleteConfirmCari(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError("Cari silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract ledger details for the selected Cari
  const cariLedger = useMemo(() => {
    if (!currentCari) return [];

    // Filter and sort transactions related to selected Cari
    const relatedTransactions = islemler
      .filter((t) => t.cariId === currentCari.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = currentCari.openingBalance;

    return [
      {
        id: "opening",
        date: currentCari.createdAt?.substring(0, 10) || "Açılış",
        type: "Açılış Bakiyesi",
        description: "Hesap açılış bakiyesi",
        amount: Math.abs(currentCari.openingBalance),
        effect:
          currentCari.openingBalance >= 0
            ? "borclandir"
            : "alacaklandir", // borclandir = owes us, alacaklandir = we owe
        balance: runningBalance,
        invoiceNo: undefined as string | undefined,
        convertedAmount: undefined as number | undefined,
        exchangeRate: undefined as number | undefined,
        currency: undefined as string | undefined,
      },
      ...relatedTransactions.map((t) => {
        let effect: "borclandir" | "alacaklandir" = "borclandir"; // borclandir = adds to receivable, alacaklandir = adds to payable

        const effAmount =
          t.convertedAmount !== undefined && t.convertedAmount !== 0
            ? t.convertedAmount
            : t.amount;

        if (t.type === "sale") {
          runningBalance += effAmount;
          effect = "borclandir";
        } else if (t.type === "purchase") {
          runningBalance -= effAmount;
          effect = "alacaklandir";
        } else if (t.type === "collection") {
          runningBalance -= effAmount;
          effect = "alacaklandir";
        } else if (t.type === "payment") {
          runningBalance += effAmount;
          effect = "borclandir";
        } else if (t.type === "sale_return") {
          runningBalance -= effAmount;
          effect = "alacaklandir";
        } else if (t.type === "purchase_return") {
          runningBalance += effAmount;
          effect = "borclandir";
        }

        return {
          id: t.id,
          date: t.date,
          type:
            t.type === "sale"
              ? "Satış Faturası"
              : t.type === "purchase"
                ? "Alış Faturası"
                : t.type === "collection"
                  ? "Tahsilat"
                  : t.type === "payment"
                    ? "Ödeme"
                    : t.type === "sale_return"
                      ? "Satıştan İade"
                      : t.type === "purchase_return"
                        ? "Alıştan İade"
                        : t.type,
          invoiceNo: t.invoiceNo || "",
          description: t.description,
          amount: t.amount,
          convertedAmount: t.convertedAmount,
          exchangeRate: t.exchangeRate,
          currency: t.currency,
          effect,
          balance: runningBalance,
          items: t.items,
        };
      }),
    ];
  }, [currentCari, islemler]);

  // Filter ledger details by date range
  const filteredCariLedger = useMemo(() => {
    if (cariLedger.length === 0) return [];

    let result = [...cariLedger];

    if (startDate || endDate) {
      let prevBalance = 0;
      let hasPrevRows = false;

      const filtered = result.filter((row) => {
        const rowDate = row.date;

        // Check if date is before start date
        if (startDate && rowDate && rowDate < startDate && rowDate !== "Açılış") {
          prevBalance = row.balance;
          hasPrevRows = true;
          return false;
        }

        // Check if date is after end date
        if (endDate && rowDate && rowDate > endDate && rowDate !== "Açılış") {
          return false;
        }

        return true;
      });

      if (hasPrevRows) {
        const devredenRow = {
          id: "carried_over",
          date: startDate,
          type: "Devreden Bakiye",
          description: "Önceki dönemden devreden bakiye",
          amount: Math.abs(prevBalance),
          effect: prevBalance >= 0 ? ("borclandir" as const) : ("alacaklandir" as const),
          balance: prevBalance,
          invoiceNo: undefined as string | undefined,
          convertedAmount: undefined as number | undefined,
          exchangeRate: undefined as number | undefined,
          currency: undefined as string | undefined,
          items: [] as any[],
        };

        const cleanFiltered = filtered.filter((r) => r.id !== "opening");

        return [devredenRow, ...cleanFiltered];
      }

      return filtered;
    }

    return result;
  }, [cariLedger, startDate, endDate]);

  // Format currency helper
  const formatCurrency = (val: number, cur: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: cur,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg">
        <div>
          <h1
            id="cariler-heading"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90"
          >
            Cari Hesaplar
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Müşterilerinizin ve tedarikçilerinizin borç/alacak takibini ve cari
            ekstrelerini yönetin.
          </p>
        </div>
        <button
          id="btn-add-cari"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-black text-xs font-semibold uppercase tracking-wider px-4 py-3 rounded-lg transition duration-150 shadow-[0_0_12px_rgba(45,212,191,0.2)] cursor-pointer"
        >
          <Plus size={16} />
          <span>Yeni Cari Hesap Ekle</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            size={16}
          />
          <input
            id="search-cari"
            type="text"
            placeholder="Cari adı, kodu, telefon veya e-posta ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-teal-500 focus:bg-white/[0.08] transition"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="filter-cari-all"
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "all"
                ? "bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            id="filter-cari-customer"
            onClick={() => setFilterType("customer")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "customer"
                ? "bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Müşteriler
          </button>
          <button
            id="filter-cari-supplier"
            onClick={() => setFilterType("supplier")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "supplier"
                ? "bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Tedarikçiler
          </button>
          <button
            id="filter-cari-receivable"
            onClick={() => setFilterType("receivable")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "receivable"
                ? "bg-teal-500/20 border border-teal-500/40 text-teal-400"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Alacaklılarımız
          </button>
          <button
            id="filter-cari-payable"
            onClick={() => setFilterType("payable")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "payable"
                ? "bg-red-400/20 border border-red-400/40 text-red-400"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Borçlarımız
          </button>
          <button
            id="filter-cari-passive"
            onClick={() => setFilterType("passive")}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === "passive"
                ? "bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.15)] font-bold"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Pasifler
          </button>
        </div>
      </div>

      {/* Cariler List */}
      <div className="bg-[#111111] rounded-lg border border-white/5 shadow-lg overflow-hidden">
        {filteredCariler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="text-white/20 mb-4" size={48} />
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
              Cari Bulunamadı
            </h3>
            <p className="text-xs text-white/40 mt-2 max-w-sm font-mono uppercase tracking-widest">
              Kriterlerinize uygun bir cari hesap bulunamadı.
            </p>
            <button
              id="btn-no-cari-add"
              onClick={handleOpenCreateModal}
              className="mt-6 bg-teal-500 hover:bg-teal-600 text-black text-[10px] uppercase tracking-wider font-bold px-5 py-3 rounded-lg shadow-[0_0_12px_rgba(45,212,191,0.2)]"
            >
              Yeni Cari Oluştur
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                      Kod & Ünvan
                    </th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                      Cari Tipi
                    </th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                      İletişim Bilgileri
                    </th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">
                      Mevcut Bakiye
                    </th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCariler.map((cari) => {
                    const balance = cari.balance || 0;
                    return (
                      <tr
                        key={cari.id}
                        className={`hover:bg-white/[0.02] transition ${cari.isActive === false ? "opacity-60" : ""}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {cari.imageUrl ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                <img src={cari.imageUrl} alt={cari.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 shrink-0 uppercase font-bold text-sm">
                                {cari.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCariForDetails(cari);
                                    setEkstreType("detailed");
                                  }}
                                  className="font-bold text-teal-400 hover:text-teal-300 text-sm hover:underline cursor-pointer transition text-left leading-tight"
                                >
                                  {cari.name}
                                </button>
                                {cari.isActive === false && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold tracking-wider bg-red-500/20 text-red-400">
                                    PASİF
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider">
                                {cari.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                                cari.type === "customer"
                                  ? "bg-teal-500/10 text-teal-400"
                                  : cari.type === "supplier"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-purple-500/10 text-purple-400"
                              }`}
                            >
                              {cari.type === "customer"
                                ? "Müşteri"
                                : cari.type === "supplier"
                                  ? "Tedarikçi"
                                  : "Müşteri+Tedarikçi"}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                              {cari.currency || "TRY"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-white/60 space-y-1 font-mono">
                          {cari.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-white/30" />{" "}
                              {cari.phone}
                            </div>
                          )}
                          {cari.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-white/30" />{" "}
                              {cari.email}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div
                            className={`font-semibold text-sm ${
                              balance > 0
                                ? "text-teal-400"
                                : balance < 0
                                  ? "text-red-400"
                                  : "text-white/50"
                            }`}
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {formatCurrency(balance, cari.currency || "TRY")}
                          </div>
                          <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider font-medium">
                            {balance > 0
                              ? "Alacaklıyız (Müşteri Borçlu)"
                              : balance < 0
                                ? "Borçluyuz (Bizim Borcumuz)"
                                : "Hesap Dengede"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {onQuickTransaction && (
                              <div className="flex items-center gap-1.5 border-r border-white/5 pr-2.5 mr-1">
                                {(cari.type === "customer" ||
                                  cari.type === "both") && (
                                  <>
                                    <button
                                      onClick={() =>
                                        onQuickTransaction("sale", cari.id)
                                      }
                                      title="Hızlı Satış Faturası Girişi"
                                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-black rounded transition cursor-pointer shrink-0"
                                    >
                                      Satış
                                    </button>
                                    <button
                                      onClick={() =>
                                        onQuickTransaction(
                                          "collection",
                                          cari.id,
                                        )
                                      }
                                      title="Hızlı Tahsilat Girişi"
                                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-black rounded transition cursor-pointer shrink-0"
                                    >
                                      Tahsilat
                                    </button>
                                  </>
                                )}
                                {(cari.type === "supplier" ||
                                  cari.type === "both") && (
                                  <>
                                    <button
                                      onClick={() =>
                                        onQuickTransaction("purchase", cari.id)
                                      }
                                      title="Hızlı Alış Faturası Girişi"
                                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black rounded transition cursor-pointer shrink-0"
                                    >
                                      Alış
                                    </button>
                                    <button
                                      onClick={() =>
                                        onQuickTransaction("payment", cari.id)
                                      }
                                      title="Hızlı Ödeme Girişi"
                                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded transition cursor-pointer shrink-0"
                                    >
                                      Ödeme
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            <button
                              id={`btn-edit-cari-${cari.id}`}
                              onClick={() => handleOpenEditModal(cari)}
                              title="Düzenle"
                              className="p-2 text-amber-400 hover:bg-white/5 rounded transition shrink-0"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              id={`btn-delete-cari-${cari.id}`}
                              onClick={() => handleDelete(cari)}
                              title="Sil"
                              className="p-2 text-red-400 hover:bg-white/5 rounded transition shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredCariler.map((cari) => {
                const balance = cari.balance || 0;
                return (
                  <div
                    key={cari.id}
                    className={`p-4 bg-white/[0.01] rounded-lg border border-white/5 flex flex-col gap-3 justify-between ${cari.isActive === false ? "opacity-60" : ""}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-3 items-start">
                          {cari.imageUrl ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0">
                              <img src={cari.imageUrl} alt={cari.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 shrink-0 uppercase font-bold text-lg">
                              {cari.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCariForDetails(cari);
                                  setEkstreType("detailed");
                                }}
                                className="font-bold text-teal-400 hover:text-teal-300 text-sm hover:underline cursor-pointer transition text-left leading-tight"
                              >
                                {cari.name}
                              </button>
                              {cari.isActive === false && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold tracking-wider bg-red-500/20 text-red-400">
                                  PASİF
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40 mt-1 font-mono tracking-wider">
                              {cari.code}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold ${
                              cari.type === "customer"
                                ? "bg-teal-500/10 text-teal-400"
                                : cari.type === "supplier"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-purple-500/10 text-purple-400"
                            }`}
                          >
                            {cari.type === "customer"
                              ? "Müşteri"
                              : cari.type === "supplier"
                                ? "Tedarikçi"
                                : "Müşteri+Tedarikçi"}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                            {cari.currency || "TRY"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-white/60 space-y-1.5 border-t border-white/5 pt-2 font-mono">
                        {cari.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-white/30" />{" "}
                            {cari.phone}
                          </div>
                        )}
                        {cari.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-white/30" />{" "}
                            {cari.email}
                          </div>
                        )}
                        {cari.address && (
                          <div className="flex items-start gap-1.5">
                            <MapPin
                              size={12}
                              className="text-white/30 mt-0.5 shrink-0"
                            />{" "}
                            <span className="line-clamp-1">{cari.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Mobile Quick Actions */}
                      {onQuickTransaction && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-2">
                          {(cari.type === "customer" ||
                            cari.type === "both") && (
                            <>
                              <button
                                onClick={() =>
                                  onQuickTransaction("sale", cari.id)
                                }
                                className="flex-1 min-w-[70px] text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-black rounded transition cursor-pointer"
                              >
                                Satış
                              </button>
                              <button
                                onClick={() =>
                                  onQuickTransaction("collection", cari.id)
                                }
                                className="flex-1 min-w-[70px] text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-black rounded transition cursor-pointer"
                              >
                                Tahsilat
                              </button>
                            </>
                          )}
                          {(cari.type === "supplier" ||
                            cari.type === "both") && (
                            <>
                              <button
                                onClick={() =>
                                  onQuickTransaction("purchase", cari.id)
                                }
                                className="flex-1 min-w-[70px] text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black rounded transition cursor-pointer"
                              >
                                Alış
                              </button>
                              <button
                                onClick={() =>
                                  onQuickTransaction("payment", cari.id)
                                }
                                className="flex-1 min-w-[70px] text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded transition cursor-pointer"
                              >
                                Ödeme
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <div>
                        <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">
                          Bakiye
                        </div>
                        <div
                          className={`font-bold text-sm ${
                            balance > 0
                              ? "text-teal-400"
                              : balance < 0
                                ? "text-red-400"
                                : "text-white/50"
                          }`}
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {formatCurrency(balance, cari.currency || "TRY")}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          id={`btn-mob-edit-${cari.id}`}
                          onClick={() => handleOpenEditModal(cari)}
                          className="p-2 text-amber-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          id={`btn-mob-delete-${cari.id}`}
                          onClick={() => handleDelete(cari)}
                          className="p-2 text-red-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Cari Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                {editingCari ? "Cari Düzenle" : "Yeni Cari Hesap"}
              </h3>
              <button
                id="btn-close-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="p-5 overflow-y-auto space-y-4 flex-1"
            >
              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2 text-xs text-red-400 font-medium">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Profil Resmi</label>
                  <div className="flex items-center gap-4">
                    {formData.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
                        <img src={formData.imageUrl} alt="Profil" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, imageUrl: ''})}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-white/10 border-dashed flex items-center justify-center bg-white/5 text-white/20 shrink-0">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-semibold transition inline-block">
                        Resim Seç
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="text-[10px] text-white/40 mt-1">Önerilen: Kare, JPG/PNG.</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Cari Ünvanı / Adı Soyadı *
                  </label>
                  <input
                    id="form-cari-name"
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Cari Kodu
                  </label>
                  <input
                    id="form-cari-code"
                    type="text"
                    placeholder="Örn: CAR-001"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Cari Tipi
                  </label>
                  <select
                    id="form-cari-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="customer" className="bg-[#0c0c0c]">
                      Müşteri (Alıcı)
                    </option>
                    <option value="supplier" className="bg-[#0c0c0c]">
                      Tedarikçi (Satıcı)
                    </option>
                    <option value="both" className="bg-[#0c0c0c]">
                      Müşteri + Tedarikçi
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Telefon No
                  </label>
                  <input
                    id="form-cari-phone"
                    type="text"
                    placeholder="Örn: 0555 123 4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    E-posta Adresi
                  </label>
                  <input
                    id="form-cari-email"
                    type="email"
                    placeholder="Örn: cari@eposta.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Para Birimi *
                  </label>
                  <select
                    id="form-cari-currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currency: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-mono font-bold"
                  >
                    <option value="TRY" className="bg-[#0c0c0c]">
                      TRY (₺) - Türk Lirası
                    </option>
                    <option value="USD" className="bg-[#0c0c0c]">
                      USD ($) - Dolar
                    </option>
                    <option value="EUR" className="bg-[#0c0c0c]">
                      EUR (€) - Euro
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Profil Durumu
                  </label>
                  <select
                    id="form-cari-status"
                    value={formData.isActive ? "active" : "passive"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "active",
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white/95 rounded text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-bold"
                  >
                    <option
                      value="active"
                      className="bg-[#0c0c0c] text-teal-400"
                    >
                      🟢 AKTİF
                    </option>
                    <option
                      value="passive"
                      className="bg-[#0c0c0c] text-red-400"
                    >
                      🔴 PASİF / KALDIRILMIŞ
                    </option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Açılış Bakiyesi ({formData.currency || "TRY"})
                  </label>
                  <div className="relative">
                    <input
                      id="form-cari-opening-balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.openingBalance || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingBalance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs font-semibold focus:outline-hidden focus:border-teal-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">
                      {formData.currency || "TRY"}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider font-mono">
                    Müşteri borçlu (alacaklıyız) ise artı (+), tedarikçiye
                    borçlu isek eksi (-) bakiye giriniz.
                  </p>
                </div>

                <div className="col-span-1">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Vergi Dairesi
                  </label>
                  <input
                    id="form-cari-tax-office"
                    type="text"
                    placeholder="Örn: Kadıköy V.D."
                    value={formData.taxOffice || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, taxOffice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 font-semibold"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Vergi No / T.C. Kimlik
                  </label>
                  <input
                    id="form-cari-tax-no"
                    type="text"
                    placeholder="Örn: 1234567890"
                    value={formData.taxNo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, taxNo: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    Adres
                  </label>
                  <textarea
                    id="form-cari-address"
                    rows={2}
                    placeholder="Fatura ve sevk adresi..."
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-transparent">
                <button
                  id="btn-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/40 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  id="btn-save"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-[10px] uppercase tracking-wider font-semibold text-black bg-teal-500 hover:bg-teal-600 disabled:bg-teal-800 rounded transition shadow-[0_0_8px_rgba(45,212,191,0.2)] flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cari Hesap Ekstresi (Ledger Drawer / Sheet) */}
      {selectedCariForDetails && currentCari && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] border-l border-white/10 w-full max-w-5xl h-full shadow-2xl flex flex-col lg:flex-row animate-slide-left overflow-hidden">
            
            {/* Left Column (Ledger Table & Info - scrollable and printable) */}
            <div
              id="printable-invoice-content"
              className="flex-1 overflow-y-auto flex flex-col bg-[#0c0c0c] print:bg-white print:text-black lg:border-r lg:border-white/5"
            >
              {/* Corporate Header - Visible only in Print or Top of Drawer */}
              <div className="p-8 border-b border-white/5 print:border-black/10 flex justify-between items-start gap-6 flex-col md:flex-row">
                <div className="flex-1">
                  {/* Customer name is written BIG on the left side */}
                  <h1 className="text-3xl font-extrabold tracking-tight text-white print:text-black mb-1 font-sans">
                    {currentCari.name}
                  </h1>
                  
                  {/* Account Code under the name */}
                  <p className="text-xs text-teal-400 print:text-black font-mono uppercase tracking-wider mb-2">
                    Hesap Kodu: {currentCari.code}
                  </p>

                  {/* Buttons right under the name to switch summary vs detailed */}
                  <div className="flex items-center gap-2 mt-4 hidden-print">
                    <button
                      id="btn-toggle-summary"
                      type="button"
                      onClick={() => setEkstreType("summary")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5 ${
                        ekstreType === "summary"
                          ? "bg-teal-500 text-black shadow-lg shadow-teal-500/25"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <FileText size={12} />
                      Özet Ekstre
                    </button>
                    <button
                      id="btn-toggle-detailed"
                      type="button"
                      onClick={() => setEkstreType("detailed")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5 ${
                        ekstreType === "detailed"
                          ? "bg-teal-500 text-black shadow-lg shadow-teal-500/25"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <FileText size={12} />
                      Detaylı Ekstre
                    </button>
                  </div>

                  {/* Statement type text for print */}
                  <p className="text-[10px] font-mono text-white/50 print:text-gray-600 mt-4 uppercase tracking-widest font-bold">
                    {ekstreType === "detailed" ? "Detaylı Cari Hesap Ekstresi" : "Özet Cari Hesap Ekstresi"}
                  </p>
                  <p className="text-[10px] font-mono text-white/50 print:text-gray-600">
                    Tarih: {new Date().toLocaleDateString("tr-TR")}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="text-[11px] font-mono text-white/75 print:text-black space-y-1 text-right flex flex-col items-end bg-white/5 print:bg-gray-100 p-3 rounded border border-white/5 print:border-black/10">
                    <span className="text-[9px] text-white/40 print:text-gray-600 font-bold uppercase tracking-widest block border-b border-white/10 pb-1 mb-1">Cari Kart Detayları</span>
                    {currentCari.phone && (
                      <span><strong>Tel:</strong> {currentCari.phone}</span>
                    )}
                    {currentCari.email && (
                      <span><strong>E-posta:</strong> {currentCari.email}</span>
                    )}
                    {currentCari.taxOffice && (
                      <span><strong>V.D.:</strong> {currentCari.taxOffice}</span>
                    )}
                    {currentCari.taxNo && (
                      <span><strong>Vergi No:</strong> {currentCari.taxNo}</span>
                    )}
                    {currentCari.address && (
                      <span className="max-w-[200px] whitespace-pre-wrap text-left text-white/50 print:text-gray-700 block mt-1 text-[10px]">
                        {currentCari.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button - Desktop Only (Hidden if we show sidebar anyway but kept for visual safety) */}
              <button
                id="btn-close-ekstre"
                onClick={() => setSelectedCariForDetails(null)}
                className="hidden-print lg:hidden absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={18} />
              </button>

              {/* Date Filters Panel */}
              <div className="hidden-print mx-6 mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-lg flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <Calendar size={14} className="text-teal-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Tarih Aralığı Filtresi</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Başlangıç:</span>
                    <input
                      id="filter-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-1.5 bg-[#141414] border border-white/10 rounded text-[11px] font-mono text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Bitiş:</span>
                    <input
                      id="filter-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-1.5 bg-[#141414] border border-white/10 rounded text-[11px] font-mono text-white focus:outline-none focus:border-teal-500/50"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      id="btn-clear-date-filter"
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 rounded transition cursor-pointer"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Transactions Table */}
              <div className="flex-1 p-6 print:p-8">
                {cariLedger.length === 1 && (
                  <div className="text-center py-12 bg-white/[0.01] print:bg-gray-50 rounded-lg border border-dashed border-white/10 print:border-gray-300">
                    <FileText
                      className="text-white/20 print:text-gray-400 mx-auto mb-2"
                      size={32}
                    />
                    <span className="text-xs uppercase tracking-widest text-white/60 print:text-gray-600 font-medium">
                      İşlem Hareketi Yok
                    </span>
                    <p className="text-[10px] text-white/30 print:text-gray-500 mt-1 uppercase tracking-widest font-mono">
                      Bu cariye ait henüz işlem kaydı bulunmuyor.
                    </p>
                  </div>
                )}

                {cariLedger.length > 1 && filteredCariLedger.length === 0 && (
                  <div className="text-center py-12 bg-white/[0.01] print:bg-gray-50 rounded-lg border border-dashed border-white/10 print:border-gray-300">
                    <Calendar
                      className="text-white/20 print:text-gray-400 mx-auto mb-2"
                      size={32}
                    />
                    <span className="text-xs uppercase tracking-widest text-white/60 print:text-gray-600 font-medium">
                      Filtreye Uygun İşlem Bulunamadı
                    </span>
                    <p className="text-[10px] text-white/30 print:text-gray-500 mt-1 uppercase tracking-widest font-mono">
                      Seçilen tarih aralığında herhangi bir hesap hareketi bulunmamaktadır.
                    </p>
                  </div>
                )}

                {filteredCariLedger.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 print:border-black/20 text-white/40 print:text-gray-600 uppercase tracking-widest text-[9px]">
                          <th className="py-3 px-2 font-semibold">Tarih</th>
                          <th className="py-3 px-2 font-semibold">
                            İşlem Türü
                          </th>
                          <th className="py-3 px-2 font-semibold">
                            Evrak No / Açıklama
                          </th>
                          <th className="py-3 px-2 font-semibold text-right">
                            Borç
                          </th>
                          <th className="py-3 px-2 font-semibold text-right">
                            Alacak
                          </th>
                          <th className="py-3 px-2 font-semibold text-right">
                            Bakiye
                          </th>
                          <th className="py-3 px-2 font-semibold text-right">
                            Döviz/Kur
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCariLedger.map((row, index) => {
                          const borcAmount =
                            row.effect === "borclandir"
                              ? row.convertedAmount && row.convertedAmount !== 0
                                ? row.convertedAmount
                                : row.amount
                              : 0;
                          const alacakAmount =
                            row.effect === "alacaklandir"
                              ? row.convertedAmount && row.convertedAmount !== 0
                                ? row.convertedAmount
                                : row.amount
                              : 0;

                          return (
                            <React.Fragment key={row.id || index}>
                              <tr
                                className={`border-b border-white/5 print:border-black/10 ${index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02] print:bg-gray-50"}`}
                              >
                                <td className="py-3 px-2 text-white/70 print:text-black whitespace-nowrap">
                                  {row.date}
                                </td>
                                <td className="py-3 px-2 text-white/90 print:text-black font-semibold">
                                  {row.type}
                                </td>
                                <td className="py-3 px-2 text-white/60 print:text-gray-800">
                                  {row.invoiceNo && (
                                    <span className="text-teal-400 print:text-black font-bold mr-2">
                                      #{row.invoiceNo}
                                    </span>
                                  )}
                                  {row.description}
                                </td>
                                <td className="py-3 px-2 text-right text-teal-400 print:text-black font-semibold">
                                  {borcAmount > 0
                                    ? formatCurrency(
                                        borcAmount,
                                        currentCari.currency || "TRY",
                                      )
                                    : "-"}
                                </td>
                                <td className="py-3 px-2 text-right text-red-400 print:text-black font-semibold">
                                  {alacakAmount > 0
                                    ? formatCurrency(
                                        alacakAmount,
                                        currentCari.currency || "TRY",
                                      )
                                    : "-"}
                                </td>
                                <td
                                  className={`py-3 px-2 text-right font-bold ${row.balance > 0 ? "text-teal-400 print:text-black" : row.balance < 0 ? "text-red-400 print:text-black" : "text-white/50 print:text-gray-500"}`}
                                >
                                  {formatCurrency(
                                    row.balance,
                                    currentCari.currency || "TRY",
                                  )}
                                </td>
                                <td className="py-3 px-2 text-right text-[9px] text-white/40 print:text-gray-500">
                                  {row.convertedAmount &&
                                  row.exchangeRate &&
                                  row.exchangeRate !== 1 ? (
                                    <span>
                                      {formatCurrency(
                                        row.amount,
                                        row.currency || "TRY",
                                      )}{" "}
                                      <br /> (Kur: {row.exchangeRate})
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                              {/* Detailed items expander row */}
                              {ekstreType === "detailed" && row.items && row.items.length > 0 && (
                                <tr className="bg-slate-900/10 print:bg-slate-50 border-b border-white/5 print:border-black/10">
                                  <td colSpan={7} className="py-3 px-4">
                                    <div className="flex flex-col gap-2 pl-6">
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-teal-400 print:text-teal-850">
                                        <FileText size={12} className="text-teal-400 print:text-teal-700" />
                                        <span>Fatura İçeriği (Kalemler)</span>
                                      </div>
                                      <div className="overflow-hidden rounded border border-white/10 print:border-black/15 bg-white/[0.02] print:bg-white shadow-inner">
                                        <table className="w-full text-left text-[11px] font-sans border-collapse">
                                          <thead>
                                            <tr className="bg-white/5 print:bg-slate-100 text-white/50 print:text-gray-700 font-bold border-b border-white/10 print:border-black/15 uppercase tracking-wider text-[9px]">
                                              <th className="py-2 px-3">Ürün / Hizmet Adı</th>
                                              <th className="py-2 px-3 text-right">Miktar</th>
                                              <th className="py-2 px-3 text-right">Birim Fiyat</th>
                                              <th className="py-2 px-3 text-right">KDV Oranı</th>
                                              <th className="py-2 px-3 text-right">KDV Dahil Toplam</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-white/5 print:divide-slate-200">
                                            {row.items.map((item, idx) => (
                                              <tr key={idx} className="hover:bg-white/[0.01] print:hover:bg-slate-50/50">
                                                <td className="py-2 px-3 font-semibold text-white/80 print:text-black">
                                                  {item.stockName}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-white/60 print:text-black">
                                                  {item.quantity} {item.unit || "Adet"}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-white/60 print:text-black">
                                                  {formatCurrency(item.price, currentCari.currency || "TRY")}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-white/40 print:text-black">
                                                  %{item.taxRate}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-teal-400 print:text-black">
                                                  {formatCurrency(item.total, currentCari.currency || "TRY")}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Totals */}
                <div className="mt-8 pt-6 border-t border-white/10 print:border-black/30 flex flex-col items-end gap-2">
                  <div className="flex justify-between w-64 text-xs font-mono text-white/60 print:text-gray-700">
                    <span>Toplam Borç:</span>
                    <span className="text-white/90 print:text-black font-semibold">
                      {formatCurrency(
                        filteredCariLedger.reduce(
                          (sum, row) =>
                            sum +
                            (row.id !== "carried_over" && row.effect === "borclandir"
                              ? row.convertedAmount || row.amount
                              : 0),
                          0,
                        ),
                        currentCari.currency || "TRY",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between w-64 text-xs font-mono text-white/60 print:text-gray-700">
                    <span>Toplam Alacak:</span>
                    <span className="text-white/90 print:text-black font-semibold">
                      {formatCurrency(
                        filteredCariLedger.reduce(
                          (sum, row) =>
                            sum +
                            (row.id !== "carried_over" && row.effect === "alacaklandir"
                              ? row.convertedAmount || row.amount
                              : 0),
                          0,
                        ),
                        currentCari.currency || "TRY",
                      )}
                    </span>
                  </div>

                  {/* Period Balance (Dönem Sonu Bakiye) if filters are active */}
                  {(startDate || endDate) && (
                    <div className="flex justify-between w-64 text-xs font-mono text-white/60 print:text-gray-700 border-b border-white/5 pb-2 mb-1">
                      <span>Dönem Sonu Bakiye:</span>
                      <span className={`font-bold ${
                        (filteredCariLedger[filteredCariLedger.length - 1]?.balance || 0) > 0
                          ? "text-teal-400 print:text-black"
                          : (filteredCariLedger[filteredCariLedger.length - 1]?.balance || 0) < 0
                            ? "text-red-400 print:text-black"
                            : "text-white/50 print:text-black"
                      }`}>
                        {formatCurrency(
                          filteredCariLedger[filteredCariLedger.length - 1]?.balance || 0,
                          currentCari.currency || "TRY",
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between w-64 mt-2 pt-2 border-t border-white/10 print:border-black/20">
                    <span className="text-sm font-bold uppercase tracking-widest text-teal-400 print:text-black mt-1">
                      Güncel Bakiye:
                    </span>
                    <div className="text-right">
                      <span
                        className={`text-xl font-light italic block tracking-tight ${
                          currentCari.balance > 0
                            ? "text-teal-400 print:text-black"
                            : currentCari.balance < 0
                              ? "text-red-400 print:text-black"
                              : "text-white/50 print:text-black"
                        }`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {formatCurrency(
                          currentCari.balance,
                          currentCari.currency || "TRY",
                        )}
                      </span>
                      <span className="text-[9px] text-white/40 print:text-gray-500 font-mono tracking-wider uppercase block">
                        {currentCari.balance > 0
                          ? "(ALACAKLIYIZ / BORÇLU)"
                          : currentCari.balance < 0
                            ? "(BORÇLUYUZ / ALACAKLI)"
                            : "KAPALI"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal Notice */}
                <div className="mt-12 text-center text-[9px] font-mono text-white/30 print:text-gray-500 uppercase tracking-widest">
                  İşbu hesap ekstresine 7 gün içerisinde itiraz edilmemesi
                  halinde mutabık kalınmış sayılır.
                </div>
              </div>

              {/* Footer action inside Drawer */}
              <div className="hidden-print p-6 border-t border-white/5 bg-white/[0.01] flex gap-3 mt-auto">
                <button
                  id="btn-print-ekstre"
                  onClick={() => {
                    const printContent = document.getElementById('printable-invoice-content');
                    if (printContent) {
                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'fixed';
                      iframe.style.right = '0';
                      iframe.style.bottom = '0';
                      iframe.style.width = '0';
                      iframe.style.height = '0';
                      iframe.style.border = '0';
                      document.body.appendChild(iframe);
                      
                      const iframeDoc = iframe.contentWindow?.document;
                      if (iframeDoc) {
                        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                          .map(s => s.outerHTML)
                          .join('\\n');
                          
                        const clone = printContent.cloneNode(true) as HTMLElement;
                        clone.style.transform = 'none';
                        clone.style.position = 'static';
                        clone.style.width = '100%';
                        clone.style.height = 'auto';
                        clone.style.minHeight = '0';
                        clone.style.margin = '0';
                        clone.style.padding = '20px';
                        
                        iframeDoc.open();
                        iframeDoc.write(`
                          <html>
                            <head>
                              ${styles}
                              <style>
                                @page { size: A4 portrait; margin: 0; }
                                body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                /* Reset text colors for print inside iframe */
                                * { color: black !important; border-color: #ddd !important; }
                                .text-white\\/50, .text-white\\/40, .text-white\\/30 { color: #666 !important; }
                              </style>
                            </head>
                            <body>
                              ${clone.outerHTML}
                            </body>
                          </html>
                        `);
                        iframeDoc.close();
                        
                        iframe.onload = () => {
                          setTimeout(() => {
                            iframe.contentWindow?.focus();
                            iframe.contentWindow?.print();
                            setTimeout(() => {
                              if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                              }
                            }, 1000);
                          }, 250);
                        };
                      }
                    } else {
                      setTimeout(() => {
                        window.print();
                      }, 250);
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/85 text-[10px] uppercase tracking-widest font-semibold py-3 rounded-lg transition cursor-pointer text-center"
                >
                  Ekstre Yazdır
                </button>
                <button
                  id="btn-close-ekstre-footer"
                  onClick={() => setSelectedCariForDetails(null)}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-black text-[10px] uppercase tracking-widest font-bold py-3 rounded-lg transition cursor-pointer text-center"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* Right Column (Sidebar: Customer Notes & Quick Transaction Entry Form) */}
            <div className="hidden-print w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col gap-5 overflow-y-auto shrink-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-teal-600 font-sans">İşlem & Not Paneli</h4>
                <button
                  onClick={() => setSelectedCariForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Customer Notes */}
              <div className="space-y-3 bg-slate-50 border border-slate-200/85 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Cari Notları</span>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || notesText === (currentCari.notes || "")}
                    className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold bg-teal-50 border border-teal-200/80 disabled:bg-slate-100 disabled:border-transparent text-teal-700 disabled:text-slate-400 hover:bg-teal-600 hover:text-white rounded transition cursor-pointer flex items-center gap-1"
                  >
                    <Save size={10} />
                    {isSavingNotes ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Müşteri ile ilgili özel notlar, mutabakat detayları veya görüşme özetleri..."
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none resize-none font-sans shadow-xs"
                />
              </div>

              {/* Embedded Quick Transactions */}
              <div className="space-y-3 bg-slate-50 border border-slate-200/85 p-4 rounded-lg flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Hızlı İşlem Girişi</span>
                
                {/* Tabs selection */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setQuickTxType("collection")}
                    className={`py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition cursor-pointer text-center ${quickTxType === "collection" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
                  >
                    Tahsilat
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTxType("payment")}
                    className={`py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition cursor-pointer text-center ${quickTxType === "payment" ? "bg-red-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
                  >
                    Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTxType("sale_return")}
                    className={`py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition cursor-pointer text-center ${quickTxType === "sale_return" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
                  >
                    Satıştan İade
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTxType("purchase_return")}
                    className={`py-1.5 text-[9px] uppercase tracking-widest font-bold rounded transition cursor-pointer text-center ${quickTxType === "purchase_return" ? "bg-orange-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"}`}
                  >
                    Alıştan İade
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSaveQuickTx} className="space-y-3 mt-1 flex flex-col">
                  {quickTxError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[10px] text-red-600 font-semibold font-mono uppercase tracking-wider">
                      {quickTxError}
                    </div>
                  )}

                  {/* Conditional Product details for Return Transactions */}
                  {(quickTxType === "sale_return" || quickTxType === "purchase_return") && (
                    <>
                      {/* Product selection */}
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">İade Edilecek Ürün</label>
                        <select
                          value={quickTxStockId}
                          required
                          onChange={(e) => setQuickTxStockId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                        >
                          <option value="">-- Ürün / Hizmet Seçin --</option>
                          {stoklar.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) - Stok: {s.quantity} {s.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">Miktar</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={quickTxQuantity}
                            onChange={(e) => setQuickTxQuantity(e.target.value)}
                            placeholder="1"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none font-mono shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">Birim Fiyat</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={quickTxUnitPrice}
                            onChange={(e) => setQuickTxUnitPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none font-mono shadow-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Amount */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">
                      {(quickTxType === "sale_return" || quickTxType === "purchase_return") ? "Toplam Tutar" : "Tutar"} ({currentCari.currency || "TRY"})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quickTxAmount}
                      onChange={(e) => setQuickTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                    />
                  </div>

                  {/* Invoice/Receipt No */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono">Evrak / Fatura No (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      value={quickTxInvoiceNo}
                      onChange={(e) => setQuickTxInvoiceNo(e.target.value)}
                      placeholder="Örn: FT-2026-001"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 uppercase focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none font-mono shadow-sm"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono">İşlem Tarihi</label>
                    <input
                      type="date"
                      required
                      value={quickTxDate}
                      onChange={(e) => setQuickTxDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none font-mono shadow-sm"
                    />
                  </div>

                  {/* Account choice - ONLY show for non-return payment/collection transactions */}
                  {quickTxType !== "sale_return" && quickTxType !== "purchase_return" && (
                    <>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono">İşlem Yeri / Hesap</label>
                        <select
                          value={quickTxAccount}
                          onChange={(e) => setQuickTxAccount(e.target.value as any)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                        >
                          <option value="cash">Kasa (Nakit)</option>
                          <option value="bank">Banka Hesabı</option>
                          <option value="pos">POS Cihazı</option>
                          <option value="">Açık Hesap (Vadeli / Ödenmedi)</option>
                        </select>
                      </div>

                      {/* Account selection dropdown */}
                      {quickTxAccount !== "" && filteredAccountsForQuick.length > 0 && (
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">
                            {quickTxAccount === "cash" ? "Kasa Seçimi" : quickTxAccount === "pos" ? "POS Seçimi" : "Banka Hesabı Seçimi"}
                          </label>
                          <select
                            value={quickTxBankAccountId}
                            onChange={(e) => setQuickTxBankAccountId(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none shadow-sm"
                          >
                            {filteredAccountsForQuick.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 font-mono font-semibold">Açıklama</label>
                    <input
                      type="text"
                      value={quickTxDescription}
                      onChange={(e) => setQuickTxDescription(e.target.value)}
                      placeholder="İşlem açıklaması girin..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none font-sans shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingQuickTx}
                    className={`w-full py-3 rounded-lg text-[10px] uppercase tracking-widest font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-4 text-white ${
                      quickTxType === "collection"
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/15"
                        : quickTxType === "payment"
                          ? "bg-red-600 hover:bg-red-700 shadow-red-600/15"
                          : quickTxType === "sale_return"
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15"
                            : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/15"
                    }`}
                  >
                    {isSavingQuickTx ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>İşlemi Kaydet</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation / Block Modal */}
      {deleteConfirmCari && (() => {
        const balance = deleteConfirmCari.balance || 0;
        const hasBalance = Math.abs(balance) > 0.001;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/95 flex items-center gap-2">
                  {hasBalance ? (
                    <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                  ) : (
                    <Trash2 size={16} className="text-red-500" />
                  )}
                  {hasBalance ? "Cari Hesap Silinemez" : "Cari Hesabı Sil"}
                </h3>
                <button
                  onClick={() => setDeleteConfirmCari(null)}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
                  disabled={isDeleting}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {deleteError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2 text-xs text-red-400 font-medium font-mono uppercase tracking-wider">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                {hasBalance ? (
                  <div className="space-y-3">
                    <p className="text-xs text-white/70 leading-relaxed">
                      <strong className="text-white font-semibold">{deleteConfirmCari.name}</strong> unvanlı cari hesabın mevcut bakiyesi bulunuyor:
                    </p>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-lg text-center">
                      <div 
                        className={`text-xl font-bold ${balance > 0 ? 'text-teal-400' : 'text-red-400'}`}
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {formatCurrency(balance, deleteConfirmCari.currency || "TRY")}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                        {balance > 0 ? "Alacaklıyız (Müşteri Borçlu)" : "Borçluyuz (Bizim Borcumuz)"}
                      </div>
                    </div>
                    <p className="text-xs text-red-400/90 leading-relaxed font-medium bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                      ⚠️ Güvenlik ve muhasebe tutarlılığı nedeniyle, bakiyesi sıfır (0) olmayan cari hesaplar silinemez. Lütfen önce bu cari hesaba ait tüm işlemleri silin veya bakiye sıfırlama işlemi yapın.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-white/70 leading-relaxed">
                      <strong className="text-white font-semibold">{deleteConfirmCari.name}</strong> ({deleteConfirmCari.code}) unvanlı cari hesabı silmek istediğinize emin misiniz?
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed font-mono uppercase tracking-wide">
                      Bu işlem geri alınamaz. Cari hesaba ait tüm tanımlamalar kalıcı olarak silinecektir. (Varsa ilişkili işlemler sistemde kalmaya devam eder.)
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-white/5 bg-white/[0.01] flex gap-3 justify-end">
                {hasBalance ? (
                  <button
                    onClick={() => setDeleteConfirmCari(null)}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition"
                  >
                    Anladım
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setDeleteConfirmCari(null)}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs font-semibold uppercase tracking-wider rounded-lg transition"
                      disabled={isDeleting}
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={handleExecuteDelete}
                      className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1.5"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Siliniyor...</span>
                        </>
                      ) : (
                        <span>Evet, Sil</span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
