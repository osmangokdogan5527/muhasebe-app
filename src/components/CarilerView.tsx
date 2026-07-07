import React, { useState, useMemo, useEffect } from "react";
import { Cari, Transaction } from "../types";
import { saveCari, deleteCari } from "../firebase";
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Users,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

interface CarilerViewProps {
  cariler: Cari[];
  islemler: Transaction[];
  onQuickTransaction?: (
    type: "sale" | "purchase" | "collection" | "payment",
    cariId: string,
  ) => void;
  aiPrefilledData?: any;
  onClearAiPrefilledData?: () => void;
}

export default function CarilerView({
  cariler,
  islemler,
  onQuickTransaction,
  aiPrefilledData,
  onClearAiPrefilledData,
}: CarilerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "customer" | "supplier" | "receivable" | "payable" | "passive"
  >("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [selectedCariForDetails, setSelectedCariForDetails] =
    useState<Cari | null>(null);

  // Load print settings from localStorage
  const printSettings = useMemo(() => {
    const DEFAULT_PRINT_SETTINGS = {
      companyName: 'Firma Adı',
      companyAddress: 'Firma Adresi',
      companyPhone: '0555 555 55 55',
      logoType: 'text',
      logoImageUrl: '',
    };
    const saved = localStorage.getItem('storm_muhasebe_print_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PRINT_SETTINGS;
  }, [selectedCariForDetails]);

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
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
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
  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `"${name}" unvanlı cariyi silmek istediğinize emin misiniz? (Bu cariye ait işlemler silinmeyecektir!)`,
      )
    ) {
      try {
        await deleteCari(id);
        if (selectedCariForDetails?.id === id) {
          setSelectedCariForDetails(null);
        }
      } catch (err) {
        console.error(err);
        alert("Cari silinirken bir hata oluştu.");
      }
    }
  };

  // Extract ledger details for the selected Cari
  const cariLedger = useMemo(() => {
    if (!selectedCariForDetails) return [];

    // Filter and sort transactions related to selected Cari
    const relatedTransactions = islemler
      .filter((t) => t.cariId === selectedCariForDetails.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = selectedCariForDetails.openingBalance;

    return [
      {
        id: "opening",
        date: selectedCariForDetails.createdAt?.substring(0, 10) || "Açılış",
        type: "Açılış Bakiyesi",
        description: "Hesap açılış bakiyesi",
        amount: Math.abs(selectedCariForDetails.openingBalance),
        effect:
          selectedCariForDetails.openingBalance >= 0
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
                  : "Ödeme",
          invoiceNo: t.invoiceNo || "",
          description: t.description,
          amount: t.amount,
          convertedAmount: t.convertedAmount,
          exchangeRate: t.exchangeRate,
          currency: t.currency,
          effect,
          balance: runningBalance,
        };
      }),
    ];
  }, [selectedCariForDetails, islemler]);

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
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-white/95 text-sm">
                                  {cari.name}
                                </div>
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
                              id={`btn-ekstre-${cari.id}`}
                              onClick={() => setSelectedCariForDetails(cari)}
                              title="Cari Ekstre / Detaylar"
                              className="p-2 text-teal-400 hover:bg-white/5 rounded transition shrink-0"
                            >
                              <FileText size={16} />
                            </button>
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
                              onClick={() => handleDelete(cari.id, cari.name)}
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
                              <div className="font-bold text-white/90 text-sm leading-tight">
                                {cari.name}
                              </div>
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
                          id={`btn-mob-ekstre-${cari.id}`}
                          onClick={() => setSelectedCariForDetails(cari)}
                          className="p-2 text-teal-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          id={`btn-mob-edit-${cari.id}`}
                          onClick={() => handleOpenEditModal(cari)}
                          className="p-2 text-amber-400 bg-white/5 hover:bg-white/10 rounded"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          id={`btn-mob-delete-${cari.id}`}
                          onClick={() => handleDelete(cari.id, cari.name)}
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
      {selectedCariForDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] border-l border-white/10 w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-left">
            <div
              id="printable-invoice-content"
              className="flex-1 overflow-y-auto flex flex-col bg-[#0c0c0c] print:bg-white print:text-black"
            >
              {/* Corporate Header - Visible only in Print or Top of Drawer */}
              <div className="p-8 border-b border-white/5 print:border-black/10 flex justify-between items-start">
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tighter text-teal-400 print:text-black mb-1 font-sans"
                  >
                    {printSettings.companyName}
                  </h1>
                  <p className="text-[10px] font-sans text-white/50 print:text-gray-600 uppercase tracking-widest whitespace-pre-line max-w-[250px]">
                    {printSettings.companyAddress}
                  </p>
                  <p className="text-[10px] font-sans text-white/50 print:text-gray-600 font-bold mt-1">
                    Tel: {printSettings.companyPhone}
                  </p>
                  <p className="text-[10px] font-mono text-white/50 print:text-gray-600 mt-4 uppercase tracking-widest">
                    Hesap Ekstresi
                  </p>
                  <p className="text-[10px] font-mono text-white/50 print:text-gray-600">
                    Tarih: {new Date().toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <h3
                    className="text-xl font-light italic text-white/95 print:text-black tracking-tight"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {selectedCariForDetails.name}
                  </h3>
                  <p className="text-[10px] text-white/50 print:text-gray-600 mt-1 font-mono uppercase tracking-wider">
                    Hesap Kodu: {selectedCariForDetails.code}
                  </p>
                  <div className="mt-3 text-[10px] font-mono text-white/50 print:text-gray-600 space-y-0.5 text-right flex flex-col items-end">
                    {selectedCariForDetails.phone && (
                      <span>Tel: {selectedCariForDetails.phone}</span>
                    )}
                    {selectedCariForDetails.email && (
                      <span>E-posta: {selectedCariForDetails.email}</span>
                    )}
                    {selectedCariForDetails.taxOffice && (
                      <span>V.D.: {selectedCariForDetails.taxOffice}</span>
                    )}
                    {selectedCariForDetails.taxNo && (
                      <span>Vergi No: {selectedCariForDetails.taxNo}</span>
                    )}
                    {selectedCariForDetails.address && (
                      <span className="max-w-[200px] whitespace-pre-wrap">
                        {selectedCariForDetails.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button - Desktop Only */}
              <button
                id="btn-close-ekstre"
                onClick={() => setSelectedCariForDetails(null)}
                className="hidden-print absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={18} />
              </button>

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

                {cariLedger.length > 1 && (
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
                        {cariLedger.map((row, index) => {
                          const isOpening = row.id === "opening";
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
                            <tr
                              key={row.id}
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
                                      selectedCariForDetails.currency || "TRY",
                                    )
                                  : "-"}
                              </td>
                              <td className="py-3 px-2 text-right text-red-400 print:text-black font-semibold">
                                {alacakAmount > 0
                                  ? formatCurrency(
                                      alacakAmount,
                                      selectedCariForDetails.currency || "TRY",
                                    )
                                  : "-"}
                              </td>
                              <td
                                className={`py-3 px-2 text-right font-bold ${row.balance > 0 ? "text-teal-400 print:text-black" : row.balance < 0 ? "text-red-400 print:text-black" : "text-white/50 print:text-gray-500"}`}
                              >
                                {formatCurrency(
                                  row.balance,
                                  selectedCariForDetails.currency || "TRY",
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
                        cariLedger.reduce(
                          (sum, row) =>
                            sum +
                            (row.effect === "borclandir"
                              ? row.convertedAmount || row.amount
                              : 0),
                          0,
                        ),
                        selectedCariForDetails.currency || "TRY",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between w-64 text-xs font-mono text-white/60 print:text-gray-700">
                    <span>Toplam Alacak:</span>
                    <span className="text-white/90 print:text-black font-semibold">
                      {formatCurrency(
                        cariLedger.reduce(
                          (sum, row) =>
                            sum +
                            (row.effect === "alacaklandir"
                              ? row.convertedAmount || row.amount
                              : 0),
                          0,
                        ),
                        selectedCariForDetails.currency || "TRY",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between w-64 mt-2 pt-2 border-t border-white/10 print:border-black/20">
                    <span className="text-sm font-bold uppercase tracking-widest text-teal-400 print:text-black mt-1">
                      Güncel Bakiye:
                    </span>
                    <div className="text-right">
                      <span
                        className={`text-xl font-light italic block tracking-tight ${
                          selectedCariForDetails.balance > 0
                            ? "text-teal-400 print:text-black"
                            : selectedCariForDetails.balance < 0
                              ? "text-red-400 print:text-black"
                              : "text-white/50 print:text-black"
                        }`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {formatCurrency(
                          selectedCariForDetails.balance,
                          selectedCariForDetails.currency || "TRY",
                        )}
                      </span>
                      <span className="text-[9px] text-white/40 print:text-gray-500 font-mono tracking-wider uppercase block">
                        {selectedCariForDetails.balance > 0
                          ? "(ALACAKLIYIZ / BORÇLU)"
                          : selectedCariForDetails.balance < 0
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
            </div>

            {/* Footer action inside Drawer */}
            <div className="hidden-print p-6 border-t border-white/5 bg-white/[0.01] flex gap-3">
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
        </div>
      )}
    </div>
  );
}
