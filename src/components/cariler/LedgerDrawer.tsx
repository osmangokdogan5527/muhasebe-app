import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Cari, Transaction, Stock } from '../../types';
import { X, Printer, Download, Plus, ArrowRight, ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';


import { createTransaction, saveCari } from '../../firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface LedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCari: Cari;
  stoklar: Stock[];
  bankAccounts: any[];
  islemler: Transaction[];

}

export function LedgerDrawer({
  isOpen,
  onClose,
  currentCari,
  stoklar,
  bankAccounts,
  islemler,
}: LedgerDrawerProps) {


  const [notesText, setNotesText] = useState(currentCari.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ekstreType, setEkstreType] = useState<"summary" | "detailed">("summary");

  const [quickTxType, setQuickTxType] = useState<"collection" | "payment" | "adjustment" | "sale_return" | "purchase_return">("collection");
  const [adjustmentDirection, setAdjustmentDirection] = useState<"discount" | "debit_note">("discount");
  const [amountInputMode, setAmountInputMode] = useState<"direct" | "target_balance">("direct");
  const [targetBalanceInput, setTargetBalanceInput] = useState("");
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

  // Populate automatic Description when quickTxType or adjustmentDirection changes
  useEffect(() => {
    if (quickTxType === "collection") {
      setQuickTxDescription("Hızlı Tahsilat Girişi");
    } else if (quickTxType === "payment") {
      setQuickTxDescription("Hızlı Ödeme Girişi");
    } else if (quickTxType === "adjustment") {
      if (adjustmentDirection === "discount") {
        setQuickTxDescription("Sezon Sonu İskontosu / Fatura İndirimi");
      } else {
        setQuickTxDescription("Borç Dekontu / Masraf Yansıtma");
      }
    } else if (quickTxType === "sale_return") {
      setQuickTxDescription("Hızlı Satıştan İade Girişi");
    } else {
      setQuickTxDescription("Hızlı Alıştan İade Girişi");
    }
  }, [quickTxType, adjustmentDirection]);

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

    let finalAmount = 0;
    let finalType: "collection" | "payment" | "sale_return" | "purchase_return" = "collection";
    let finalAccount: "cash" | "bank" | "pos" | "" = quickTxAccount;
    let finalDescription = quickTxDescription;

    if (amountInputMode === "target_balance") {
      const targetVal = parseFloat(targetBalanceInput);
      if (isNaN(targetVal)) {
        setQuickTxError("Lütfen geçerli bir hedef kalan bakiye tutarı girin.");
        return;
      }
      const diff = currentNetBalance - targetVal;
      if (Math.abs(diff) < 0.001) {
        setQuickTxError("Mevcut bakiye zaten hedef bakiyeye eşittir. İşlem gerekmez.");
        return;
      }
      finalAmount = Math.abs(diff);

      if (quickTxType === "adjustment") {
        finalAccount = ""; // Düzeltme işlemi
        if (diff > 0) {
          // Müşteri borcu düşecek -> Alacaklandır (collection)
          finalType = "collection";
          if (!finalDescription.trim()) {
            finalDescription = `Kalan Bakiye Düzeltmesi (Hedef: ${targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`;
          }
        } else {
          // Müşteri borcu artacak -> Borçlandır (payment)
          finalType = "payment";
          if (!finalDescription.trim()) {
            finalDescription = `Kalan Bakiye Düzeltmesi (Hedef: ${targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`;
          }
        }
      } else if (quickTxType === "collection") {
        finalType = "collection";
        if (!finalDescription.trim()) {
          finalDescription = `Tahsilat (Bakiye ${targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ yapıldı)`;
        }
      } else if (quickTxType === "payment") {
        finalType = "payment";
        if (!finalDescription.trim()) {
          finalDescription = `Ödeme (Bakiye ${targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ yapıldı)`;
        }
      }
    } else {
      finalAmount = parseFloat(quickTxAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        setQuickTxError("Lütfen geçerli bir tutar girin.");
        return;
      }

      if (quickTxType === "adjustment") {
        finalAccount = ""; // No physical cash/bank movement for discount/adjustment
        if (adjustmentDirection === "discount") {
          finalType = "collection"; // reduces cari debt (Alacaklandır)
          if (!finalDescription.trim()) {
            finalDescription = "İskonto / Bakiye Düzeltme";
          }
        } else {
          finalType = "payment"; // increases cari debt (Borçlandır)
          if (!finalDescription.trim()) {
            finalDescription = "Borç Dekontu / Masraf Yansıtma";
          }
        }
      } else {
        finalType = quickTxType as "collection" | "payment" | "sale_return" | "purchase_return";
      }
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
        type: finalType,
        cariId: currentCari.id,
        cariName: currentCari.name,
        date: quickTxDate,
        amount: finalAmount,
        invoiceNo: quickTxInvoiceNo || "",
        account: isReturn || quickTxType === "adjustment" ? "" : finalAccount,
        bankAccountId: isReturn || quickTxType === "adjustment" ? "" : (quickTxBankAccountId || ""),
        description: finalDescription || (quickTxType === "collection" ? "Tahsilat" : quickTxType === "payment" ? "Ödeme" : "Bakiye Düzeltme"),
        currency: currentCari.currency || "TRY",
        exchangeRate: 1,
        convertedAmount: finalAmount,
        createdAt: new Date().toISOString(),
        items: items
      });

      // Clear inputs upon success
      setQuickTxAmount("");
      setQuickTxInvoiceNo("");
      setQuickTxDescription("");
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
                  ? (t.account === "" || t.description?.toLowerCase().includes("iskonto") || t.description?.toLowerCase().includes("düzeltme") || t.description?.toLowerCase().includes("indirim") ? "İskonto / Alacak Dekontu" : "Tahsilat")
                  : t.type === "payment"
                    ? (t.account === "" || t.description?.toLowerCase().includes("dekont") || t.description?.toLowerCase().includes("düzeltme") || t.description?.toLowerCase().includes("masraf") ? "Borç Dekontu / Düzeltme" : "Ödeme")
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

  // Current calculated net balance for this cari
  const currentNetBalance = useMemo(() => {
    if (cariLedger.length === 0) return currentCari?.openingBalance || 0;
    return cariLedger[cariLedger.length - 1].balance;
  }, [cariLedger, currentCari?.openingBalance]);

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


  // PDF Export
  const exportPDF = async () => {
    const element = document.getElementById("printable-invoice-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cari_ekstre_${currentCari.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF oluşturulurken hata:", err);
      alert("PDF oluşturulurken bir hata oluştu.");
    }
  };


  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-xs animate-fade-in">
        <div className="bg-[#0c0c0c] border-l border-white/10 w-full max-w-5xl h-full shadow-2xl flex flex-col lg:flex-row animate-slide-left overflow-hidden">
          
          {/* Left Column (Ledger Table & Info) */}
          <div
            id="printable-invoice-content"
            className="flex-1 overflow-y-auto flex flex-col bg-[#0c0c0c] print:bg-white print:text-black lg:border-r lg:border-white/5"
          >
            {/* Corporate Header */}
            <div className="p-8 border-b border-white/5 print:border-black/10 flex justify-between items-start gap-6 flex-col md:flex-row">
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-white print:text-black mb-1 font-sans">
                  {currentCari.name}
                </h1>
                <p className="text-xs text-teal-400 print:text-black font-mono uppercase tracking-wider mb-2">
                  Hesap Kodu: {currentCari.code}
                </p>
                
                <div className="flex items-center gap-2 mt-4 hidden-print">
                  <button
                    onClick={() => setEkstreType("summary")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5 ${
                      ekstreType === "summary"
                        ? "bg-teal-500 text-black shadow-lg shadow-teal-500/25"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Özet Ekstre
                  </button>
                  <button
                    onClick={() => setEkstreType("detailed")}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center gap-1.5 ${
                      ekstreType === "detailed"
                        ? "bg-teal-500 text-black shadow-lg shadow-teal-500/25"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Detaylı Ekstre
                  </button>
                </div>
                
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
                    <span><strong>V.Dairesi:</strong> {currentCari.taxOffice}</span>
                  )}
                  {currentCari.taxNo && (
                    <span><strong>V.No:</strong> {currentCari.taxNo}</span>
                  )}
                  {currentCari.address && (
                    <span className="mt-1 block max-w-[200px] whitespace-normal"><strong>Adres:</strong> {currentCari.address}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Table actions */}
            <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] hidden-print">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#111] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#111] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="px-3 py-1.5 text-xs text-white/50 hover:text-white"
                  >
                    Temizle
                  </button>
                )}
              </div>
              <button
                onClick={exportPDF}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded transition"
              >
                Yazdır / PDF
              </button>
            </div>

            {/* Ledger Table */}
            <div className="p-4 flex-1">
              <div className="overflow-x-auto border border-white/5 rounded-lg print:border-none print:shadow-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#111] text-white/50 print:bg-gray-100 print:text-black sticky top-0 uppercase tracking-widest font-mono text-[9px]">
                    <tr>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold">Tarih</th>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold">İşlem Türü</th>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold">Evrak No</th>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold">Açıklama</th>
                      {ekstreType === "detailed" && (
                        <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold">Ürünler</th>
                      )}
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold text-right text-red-400">Borç</th>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold text-right text-teal-400">Alacak</th>
                      <th className="py-3 px-4 border-b border-white/10 print:border-black/20 font-semibold text-right">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-black/10">
                    {filteredCariLedger.length === 0 ? (
                      <tr>
                        <td colSpan={ekstreType === "detailed" ? 8 : 7} className="py-8 text-center text-white/40">
                          Bu tarih aralığında hareket bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredCariLedger.map((row, index) => {
                        const isOpening = row.id === "opening" || row.id === "carried_over";
                        const actualAmount = row.currency && row.currency !== "TRY" && !row.convertedAmount ? row.amount : row.convertedAmount || row.amount;
                        
                        return (
                          <tr key={row.id || index} className={`hover:bg-white/[0.02] print:text-black ${isOpening ? "bg-white/[0.02]" : ""}`}>
                            <td className="py-3 px-4 text-white/70 print:text-black whitespace-nowrap">{row.date}</td>
                            <td className="py-3 px-4 text-white/90 print:text-black font-semibold">{row.type}</td>
                            <td className="py-3 px-4 text-white/50 print:text-black font-mono">{row.invoiceNo || "-"}</td>
                            <td className="py-3 px-4 text-white/70 print:text-black max-w-[200px] truncate" title={row.description}>{row.description || "-"}</td>
                            
                            {ekstreType === "detailed" && (
                              <td className="py-3 px-4 text-white/60 print:text-black max-w-[200px]">
                                {row.items && row.items.length > 0 ? (
                                  <div className="space-y-1">
                                    {row.items.map((it: any, i: number) => (
                                      <div key={i} className="text-[10px] truncate" title={`${it.name} - ${it.quantity} ${it.unit}`}>
                                        • {it.name} <span className="opacity-50">({it.quantity} {it.unit})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                              </td>
                            )}
                            
                            <td className="py-3 px-4 text-right font-mono text-red-400 print:text-red-700">
                              {row.effect === "borclandir" && actualAmount !== 0 ? formatCurrency(actualAmount, currentCari.currency) : "-"}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-teal-400 print:text-teal-700">
                              {row.effect === "alacaklandir" && actualAmount !== 0 ? formatCurrency(actualAmount, currentCari.currency) : "-"}
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${row.balance > 0 ? "text-teal-400 print:text-teal-700" : row.balance < 0 ? "text-red-400 print:text-red-700" : "text-white/50 print:text-black"}`}>
                              {formatCurrency(Math.abs(row.balance), currentCari.currency)} {row.balance > 0 ? "(A)" : row.balance < 0 ? "(B)" : ""}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Right Column (Sidebar: Notes & Quick Transaction) */}
          <div className="hidden-print w-full lg:w-96 bg-[#0f172a] text-slate-100 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
                <h4 className="text-xs font-black uppercase tracking-widest text-teal-400 font-sans">
                  İşlem & Not Paneli
                </h4>
              </div>
              <button
                onClick={() => onClose()}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                title="Paneli Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Notes Section */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Cari Notları
                </label>
                <span className="text-[9px] text-slate-400 font-mono">Özel Notlar</span>
              </div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Bu cariye özel notlarınızı yazabilirsiniz..."
                className="w-full bg-[#090d16] text-white placeholder-slate-500 border border-slate-700 rounded-lg p-3 text-xs min-h-[90px] resize-y focus:outline-none focus:border-teal-500 font-medium leading-relaxed"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-slate-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSavingNotes ? "Kaydediliyor..." : "Notları Kaydet"}
              </button>
            </div>

            {/* Quick Transaction & Adjustment Section */}
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/80 shadow-md space-y-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <span>Hızlı İşlem / Bakiye Düzelt</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-extrabold border border-teal-500/20">
                  HAREKET
                </span>
              </div>

              {/* Type Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#090d16] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickTxType("collection")}
                  className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition cursor-pointer ${
                    quickTxType === "collection"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  Tahsilat
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTxType("payment")}
                  className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition cursor-pointer ${
                    quickTxType === "payment"
                      ? "bg-rose-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTxType("adjustment")}
                  className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md transition cursor-pointer ${
                    quickTxType === "adjustment"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  İskonto
                </button>
              </div>

              {/* Special options for Adjustment / Discount */}
              {quickTxType === "adjustment" && (
                <div className="p-3 bg-[#090d16] rounded-xl border border-amber-500/30 space-y-3">
                  <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                    Düzeltme Yönü / İşlem Tipi
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection("discount")}
                      className={`p-2 rounded-lg text-[10px] font-bold border text-left transition cursor-pointer ${
                        adjustmentDirection === "discount"
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-extrabold text-amber-400">İskonto / Borç Düş</div>
                      <div className="text-[8px] text-slate-400 leading-tight mt-0.5">Müşteri alacaklanır (borcu azalır)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentDirection("debit_note")}
                      className={`p-2 rounded-lg text-[10px] font-bold border text-left transition cursor-pointer ${
                        adjustmentDirection === "debit_note"
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-extrabold text-amber-400">Borç Ekle / Dekont</div>
                      <div className="text-[8px] text-slate-400 leading-tight mt-0.5">Müşteri borçlanır (borcu artar)</div>
                    </button>
                  </div>

                  {/* Preset description chips */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Hızlı Sebep Seçimi
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {adjustmentDirection === "discount" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Sezon Sonu İskontosu")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Sezon İskontosu
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Kuruş Bakiye Düzeltmesi")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Kuruş Düzeltme
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Fatura Altı Özel İskonto")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Fatura İskontosu
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Bakiye Sıfırlama Yuvarlama")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Yuvarlama
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Vade Farkı Yansıtma")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Vade Farkı
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Nakliye / Kargo Masrafı")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Kargo Yansıtma
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Gecikme / Hizmet Bedeli")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Hizmet Bedeli
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTxDescription("Manuel Borç Düzeltmesi")}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded border border-slate-700 cursor-pointer"
                          >
                            Borç Düzeltme
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Transaction Form */}
              <form onSubmit={handleSaveQuickTx} className="space-y-3.5">
                {quickTxError && (
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold">
                    {quickTxError}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200">
                      {amountInputMode === "direct"
                        ? `İşlem Tutarı (${currentCari.currency || "TRY"})`
                        : `Hedef Kalan Bakiye (${currentCari.currency || "TRY"})`}
                    </label>
                    <div className="flex bg-[#090d16] p-0.5 rounded-md border border-slate-700/80 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setAmountInputMode("direct")}
                        className={`px-2 py-0.5 rounded cursor-pointer transition ${
                          amountInputMode === "direct"
                            ? "bg-slate-700 text-teal-300 font-extrabold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Tutar Gir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAmountInputMode("target_balance");
                          if (targetBalanceInput === "") setTargetBalanceInput("0");
                        }}
                        className={`px-2 py-0.5 rounded cursor-pointer transition ${
                          amountInputMode === "target_balance"
                            ? "bg-amber-600 text-white font-extrabold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Hedef Bakiye Gir
                      </button>
                    </div>
                  </div>

                  {amountInputMode === "direct" ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={quickTxAmount}
                      onChange={(e) => setQuickTxAmount(e.target.value)}
                      className="w-full bg-[#090d16] text-white placeholder-slate-500 border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-sm font-mono font-bold outline-none"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Örn: 0 veya 10000"
                          value={targetBalanceInput}
                          onChange={(e) => setTargetBalanceInput(e.target.value)}
                          className="w-full bg-[#090d16] text-amber-300 placeholder-slate-500 border border-amber-500/50 focus:border-amber-400 rounded-lg p-2.5 text-sm font-mono font-bold outline-none pr-28"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBalanceInput("0");
                            setQuickTxDescription("Bakiye Sıfırlama Düzeltmesi");
                          }}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9px] font-extrabold uppercase rounded border border-amber-500/40 cursor-pointer transition active:scale-95"
                        >
                          ⚡ 0 ₺ (Sıfırla)
                        </button>
                      </div>

                      {/* Dynamic calculation preview card */}
                      {(() => {
                        const targetVal = parseFloat(targetBalanceInput);
                        if (isNaN(targetVal)) return null;

                        const diff = currentNetBalance - targetVal;
                        const computedAmt = Math.abs(diff);

                        return (
                          <div className="p-2.5 bg-[#090d16] rounded-xl border border-slate-700/80 text-[10px] space-y-1.5 font-sans shadow-inner">
                            <div className="flex justify-between text-slate-400 font-mono">
                              <span>Mevcut Bakiye:</span>
                              <span className={currentNetBalance > 0 ? "text-rose-400 font-bold" : currentNetBalance < 0 ? "text-teal-400 font-bold" : "text-slate-300"}>
                                {currentNetBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ {currentNetBalance > 0 ? "(Borçlu)" : currentNetBalance < 0 ? "(Alacaklı)" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 font-mono">
                              <span>Hedef Kalan Bakiye:</span>
                              <span className="text-amber-300 font-extrabold">
                                {targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t border-slate-800 font-mono text-xs">
                              <span className="text-slate-200 font-bold">Hesaplanan Düzeltme Tutarı:</span>
                              <span className="text-teal-300 font-black">
                                {computedAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </span>
                            </div>
                            <div className="text-[9px] font-semibold pt-0.5 leading-relaxed">
                              {diff > 0 ? (
                                <span className="text-teal-400">
                                  ⬇️ {computedAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ alacak işlenerek borç {targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ seviyesine düşürülecektir.
                                </span>
                              ) : diff < 0 ? (
                                <span className="text-amber-400">
                                  ⬆️ {computedAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ borç dekontu işlenerek bakiye {targetVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ seviyesine çıkarılacaktır.
                                </span>
                              ) : (
                                <span className="text-emerald-400">
                                  ✅ Mevcut bakiye zaten hedef tutarla aynı. Düzeltme yapılmasına gerek yoktur.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    required
                    value={quickTxDate}
                    onChange={(e) => setQuickTxDate(e.target.value)}
                    className="w-full bg-[#090d16] text-white border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                    Evrak / Dekont / Fiş No
                  </label>
                  <input
                    type="text"
                    placeholder="Opsiyonel (Örn: DKN-2026-001)"
                    value={quickTxInvoiceNo}
                    onChange={(e) => setQuickTxInvoiceNo(e.target.value)}
                    className="w-full bg-[#090d16] text-white placeholder-slate-500 border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-xs font-medium outline-none"
                  />
                </div>

                {quickTxType !== "adjustment" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                        Hesap / Kasa
                      </label>
                      <select
                        value={quickTxAccount}
                        onChange={(e) => setQuickTxAccount(e.target.value as any)}
                        className="w-full bg-[#090d16] text-white border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-xs font-medium outline-none cursor-pointer"
                      >
                        <option value="cash" className="bg-slate-900 text-white">Nakit (Kasa)</option>
                        <option value="bank" className="bg-slate-900 text-white">Banka Transferi / EFT</option>
                        <option value="pos" className="bg-slate-900 text-white">Kredi Kartı (POS)</option>
                      </select>
                    </div>

                    {quickTxAccount !== "" && filteredAccountsForQuick.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                          Alt Hesap Seçimi
                        </label>
                        <select
                          value={quickTxBankAccountId}
                          onChange={(e) => setQuickTxBankAccountId(e.target.value)}
                          className="w-full bg-[#090d16] text-white border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-xs font-medium outline-none cursor-pointer"
                        >
                          {filteredAccountsForQuick.map((acc) => (
                            <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                              {acc.name} ({acc.currency})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-200 mb-1">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="İşlem açıklaması..."
                    value={quickTxDescription}
                    onChange={(e) => setQuickTxDescription(e.target.value)}
                    className="w-full bg-[#090d16] text-white placeholder-slate-500 border border-slate-700 focus:border-teal-500 rounded-lg p-2.5 text-xs font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingQuickTx}
                  className={`w-full py-3 mt-4 rounded-lg text-xs font-extrabold uppercase tracking-widest transition cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2 ${
                    quickTxType === "collection"
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                      : quickTxType === "payment"
                        ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                        : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                  }`}
                >
                  {isSavingQuickTx
                    ? "Kaydediliyor..."
                    : amountInputMode === "target_balance"
                      ? "Bakiyeyi Düzelt ve Kaydet"
                      : quickTxType === "adjustment"
                        ? (adjustmentDirection === "discount" ? "İskontoyu Kaydet" : "Borç Dekontunu Kaydet")
                        : quickTxType === "collection"
                          ? "Tahsilatı Kaydet"
                          : "Ödemeyi Kaydet"}
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}
