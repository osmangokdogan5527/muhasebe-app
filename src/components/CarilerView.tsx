import React, { useState, useMemo, useEffect, useCallback } from "react";
import { VirtualTableBody } from './VirtualTableBody';
import { CariModal } from './cariler/CariModal';
import { LedgerDrawer } from './cariler/LedgerDrawer';
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

function CarilerView({
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

  const setSelectedCariForDetails = useCallback((cari: Cari | null) => {
    if (onSelectCariForDetails) {
      onSelectCariForDetails(cari ? cari.id : null);
    } else {
      setLocalSelectedCariForDetails(cari);
    }
  }, [onSelectCariForDetails]);

  // Format currency helper
  const formatCurrency = useCallback((val: number, cur: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: cur,
    }).format(val);
  }, []);

  const [ekstreType, setEkstreType] = useState<"summary" | "detailed">("summary");
  const [deleteConfirmCari, setDeleteConfirmCari] = useState<Cari | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentCari = selectedCariForDetails;

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
        setEditingCari(null);
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

  const handleOpenCreateModal = useCallback(() => {
    setEditingCari(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((cari: Cari) => {
    setEditingCari(cari);
    setIsModalOpen(true);
  }, []);

  // Handle deletion of Cari
  const handleDelete = useCallback((cari: Cari) => {
    setDeleteConfirmCari(cari);
    setDeleteError(null);
  }, []);

  const handleExecuteDelete = useCallback(async () => {
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
  }, [deleteConfirmCari, selectedCariForDetails, setSelectedCariForDetails]);

  const renderCariRow = useCallback((cari: Cari, index: number) => {
    const balance = cari.balance || 0;
    return (
      <tr
        key={cari.id}
        id={`cari-row-${cari.id}`}
        className={`hover:bg-white/[0.02] transition h-[72px] ${cari.isActive === false ? "opacity-60" : ""}`}
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
  }, [formatCurrency, onQuickTransaction, setSelectedCariForDetails, handleOpenEditModal, handleDelete]);

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
                <VirtualTableBody
                  items={filteredCariler}
                  rowHeight={72}
                  renderRow={renderCariRow}
                />
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
      <CariModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCari={editingCari}
        cariler={cariler}
        aiPrefilledData={aiPrefilledData}
        onClearAiPrefilledData={onClearAiPrefilledData}
      />

      {/* Cari Hesap Ekstresi (Ledger Drawer / Sheet) */}
      {selectedCariForDetails && currentCari && (
        <LedgerDrawer
          isOpen={!!selectedCariForDetails}
          onClose={() => setSelectedCariForDetails(null)}
          currentCari={currentCari}
          stoklar={stoklar}
          bankAccounts={bankAccounts}
          islemler={islemler}

        />
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

export default React.memo(CarilerView);
