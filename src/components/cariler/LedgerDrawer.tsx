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
          <div className="hidden-print w-full lg:w-96 bg-[#0c0c0c] border-t lg:border-t-0 lg:border-l border-white/5 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-teal-500 font-sans">İşlem & Not Paneli</h4>
              <button onClick={() => onClose()} className="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            {/* Notes Section */}
            <div className="bg-[#111] p-4 rounded-lg border border-white/5 shadow-sm space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Cari Notları</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Bu cari ile ilgili notlarınızı buraya yazabilirsiniz..."
                className="w-full bg-black/50 border border-white/10 rounded p-3 text-xs text-white/90 min-h-[100px] resize-y focus:outline-none focus:border-teal-500/50"
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-widest transition"
              >
                {isSavingNotes ? "Kaydediliyor..." : "Notları Kaydet"}
              </button>
            </div>

            {/* Quick Transaction Section */}
            <div className="bg-[#111] p-4 rounded-lg border border-white/5 shadow-sm space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Hızlı İşlem Ekle</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickTxType("collection")}
                  className={`py-2 text-[9px] uppercase tracking-widest font-bold rounded transition ${quickTxType === "collection" ? "bg-blue-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
                >Tahsilat</button>
                <button
                  type="button"
                  onClick={() => setQuickTxType("payment")}
                  className={`py-2 text-[9px] uppercase tracking-widest font-bold rounded transition ${quickTxType === "payment" ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}
                >Ödeme</button>
              </div>

              <form onSubmit={handleSaveQuickTx} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Tutar ({currentCari.currency || "TRY"})</label>
                  <input
                    type="number" step="0.01" min="0.01" required
                    value={quickTxAmount} onChange={(e) => setQuickTxAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Tarih</label>
                  <input
                    type="date" required
                    value={quickTxDate} onChange={(e) => setQuickTxDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Evrak / Fiş No</label>
                  <input
                    type="text"
                    value={quickTxInvoiceNo} onChange={(e) => setQuickTxInvoiceNo(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Hesap / Kasa</label>
                  <select
                    value={quickTxAccount} onChange={(e) => setQuickTxAccount(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                  >
                    <option value="cash">Nakit (Kasa)</option>
                    <option value="bank">Banka Transferi</option>
                    <option value="pos">Kredi Kartı (POS)</option>
                  </select>
                </div>
                {quickTxAccount !== "" && filteredAccountsForQuick.length > 0 && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Alt Hesap Seçimi</label>
                    <select
                      value={quickTxBankAccountId} onChange={(e) => setQuickTxBankAccountId(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                    >
                      {filteredAccountsForQuick.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={quickTxDescription} onChange={(e) => setQuickTxDescription(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingQuickTx}
                  className={`w-full py-3 mt-4 rounded text-[10px] uppercase tracking-widest font-bold transition flex items-center justify-center ${
                    quickTxType === "collection" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isSavingQuickTx ? "Kaydediliyor..." : "İşlemi Kaydet"}
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}
