import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Coins,
  CreditCard,
  Check,
  Package,
  Barcode,
  Sparkles,
} from "lucide-react";
import { Cari, Stock, Transaction, InvoiceItem } from "../../types";
import { createTransaction } from "../../firebase";

interface HizliPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cariler: Cari[];
  stoklar: Stock[];
  bankAccounts?: any[];
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function HizliPosModal({
  isOpen,
  onClose,
  cariler,
  stoklar,
  bankAccounts = [],
  showToast,
}: HizliPosModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{ stock: Stock; quantity: number }[]>([]);
  const [selectedCariId, setSelectedCariId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos">("cash");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSavedTransaction, setLastSavedTransaction] = useState<any>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filter out suppliers, get only customers
  const customers = useMemo(() => {
    return cariler.filter(c => c.isActive !== false && (c.type === "customer" || c.type === "both"));
  }, [cariler]);

  // Try to find a default retail customer
  useEffect(() => {
    if (isOpen && customers.length > 0) {
      const retail = customers.find(
        c =>
          c.code === "CAR-POS" ||
          c.name.toLowerCase().includes("hızlı") ||
          c.name.toLowerCase().includes("perakende") ||
          c.name.toLowerCase().includes("genel")
      );
      if (retail) {
        setSelectedCariId(retail.id);
      } else {
        setSelectedCariId(customers[0].id);
      }
    }
  }, [isOpen, customers]);

  // Focus barcode input on open
  useEffect(() => {
    if (isOpen && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Extract unique categories from stocks
  const categories = useMemo(() => {
    const list = new Set<string>();
    stoklar.forEach(s => {
      if (s.category) list.add(s.category);
    });
    return ["all", ...Array.from(list)];
  }, [stoklar]);

  // Filtered stocks for POS grid
  const filteredStocks = useMemo(() => {
    return stoklar.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.barcode && s.barcode.includes(searchTerm));
      const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stoklar, searchTerm, selectedCategory]);

  // Add stock to cart
  const addToCart = (stock: Stock) => {
    if (stock.quantity <= 0) {
      showToast(`${stock.name} stokta kalmamıştır!`, "error");
    }
    setCart(prev => {
      const existing = prev.find(item => item.stock.id === stock.id);
      if (existing) {
        return prev.map(item =>
          item.stock.id === stock.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { stock, quantity: 1 }];
    });
  };

  // Remove or decrease
  const decreaseQuantity = (stockId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.stock.id === stockId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.stock.id === stockId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.stock.id !== stockId);
    });
  };

  // Update quantity directly
  const updateQuantity = (stockId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.stock.id !== stockId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.stock.id === stockId ? { ...item, quantity: qty } : item
      )
    );
  };

  // Handle barcode scanner enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) return;

    const matchedStock = stoklar.find(
      s => s.barcode === cleanBarcode || s.code === cleanBarcode
    );

    if (matchedStock) {
      addToCart(matchedStock);
      showToast(`${matchedStock.name} sepete eklendi.`, "success");
      setBarcodeInput("");
    } else {
      showToast(`"${cleanBarcode}" barkodlu ürün bulunamadı!`, "error");
    }
    barcodeInputRef.current?.focus();
  };

  // Totals calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    cart.forEach(item => {
      const price = item.stock.salesPrice;
      const taxRate = item.stock.taxRate || 20;
      const itemSubtotal = price * item.quantity;
      const itemTax = itemSubtotal * (taxRate / 100);
      subtotal += itemSubtotal;
      taxTotal += itemTax;
    });
    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal,
    };
  }, [cart]);

  // Submit Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast("Lütfen önce sepete ürün ekleyin.", "error");
      return;
    }
    if (!selectedCariId) {
      showToast("Lütfen bir müşteri seçin.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCari = cariler.find(c => c.id === selectedCariId);
      if (!activeCari) throw new Error("Cari bulunamadı");

      // Generate items array for invoice
      const invoiceItems: InvoiceItem[] = cart.map(item => {
        const price = item.stock.salesPrice;
        const taxRate = item.stock.taxRate || 20;
        const total = price * item.quantity * (1 + taxRate / 100);
        return {
          stockId: item.stock.id,
          stockName: item.stock.name,
          quantity: item.quantity,
          unit: item.stock.unit || "Adet",
          price: price,
          taxRate: taxRate,
          total: total,
        };
      });

      const cleanInvoiceNo = `POS-${Date.now().toString().slice(-6)}`;

      const transactionData: Omit<Transaction, "id"> = {
        invoiceNo: cleanInvoiceNo,
        type: "sale",
        cariId: activeCari.id,
        cariName: activeCari.name,
        date: new Date().toISOString().split("T")[0],
        amount: totals.grandTotal,
        account: paymentMethod, // paid immediately to cash / pos
        description: "Hızlı Perakende POS Satışı",
        items: invoiceItems,
        createdAt: new Date().toISOString(),
        currency: activeCari.currency || "TRY",
      };

      await createTransaction(transactionData);
      setLastSavedTransaction(transactionData);
      
      showToast("Satış başarıyla gerçekleştirildi!", "success");
      setCart([]);
      setShowReceipt(true);
    } catch (err) {
      console.error(err);
      showToast("Satış kaydedilirken bir hata oluştu.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-55 p-4 md:p-6 font-sans">
      <div className="bg-[#121214] w-full max-w-7xl h-[90vh] rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-widest font-mono">
                Hızlı Satış Paneli (POS)
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                Barkod tarayıcı destekli anlık perakende satış modülü
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Popup */}
        {showReceipt && lastSavedTransaction && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-black w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col">
              <div className="text-center border-b border-dashed border-gray-300 pb-4">
                <h4 className="font-bold text-lg tracking-wider font-mono">STORM ÖN MUHASEBE</h4>
                <p className="text-xs text-gray-500 mt-1 uppercase font-mono">Hızlı Satış Fişi</p>
              </div>
              <div className="my-4 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Tarih:</span>
                  <span>{lastSavedTransaction.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fiş No:</span>
                  <span>{lastSavedTransaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Müşteri:</span>
                  <span className="truncate max-w-[200px]">{lastSavedTransaction.cariName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ödeme:</span>
                  <span className="uppercase">{lastSavedTransaction.account === 'cash' ? 'Nakit (Kasa)' : 'Kredi Kartı (POS)'}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 py-2 text-xs font-mono">
                <div className="grid grid-cols-12 gap-1 font-bold border-b border-gray-200 pb-1 mb-1">
                  <span className="col-span-6">Ürün</span>
                  <span className="col-span-2 text-center">Adet</span>
                  <span className="col-span-4 text-right">Tutar</span>
                </div>
                {lastSavedTransaction.items?.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 py-0.5">
                    <span className="col-span-6 truncate">{item.stockName}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">
                      {item.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 text-sm font-mono font-bold text-right">
                <div className="flex justify-between text-xs font-normal">
                  <span>KDV Toplamı:</span>
                  <span>
                    {lastSavedTransaction.items?.reduce((acc: number, item: any) => acc + (item.total - item.price * item.quantity), 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
                <div className="flex justify-between text-base border-t border-gray-300 pt-2">
                  <span>GENEL TOPLAM:</span>
                  <span>
                    {lastSavedTransaction.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold font-mono uppercase transition cursor-pointer"
                >
                  Yazdır
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl text-xs font-bold font-mono uppercase transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Sol Panel: Ürün Seçim Alti */}
          <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden bg-black/10">
            
            {/* Search, Filter & Barcode */}
            <div className="p-4 bg-white/2 border-b border-white/10 flex flex-col sm:flex-row gap-3 shrink-0">
              
              {/* Manual Barcode input simulating USB laser scanner */}
              <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-sm">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400">
                    <Barcode size={18} />
                  </span>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Barkodu okutun veya elle girin..."
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-teal-500/30 focus:border-teal-400 text-white rounded-xl text-xs font-semibold focus:outline-hidden font-mono placeholder:text-white/20"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500/20 text-teal-400 px-2 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase hover:bg-teal-500 hover:text-black transition cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
              </form>

              {/* Text Search */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Ürün adı, kodu ile arayın..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 focus:border-teal-500 text-white rounded-xl text-xs font-semibold focus:outline-hidden placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Category selection bar */}
            <div className="px-4 py-2 bg-white/1 flex gap-2 overflow-x-auto shrink-0 scrollbar-none border-b border-white/5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {cat === "all" ? "Tümü" : cat}
                </button>
              ))}
            </div>

            {/* Stock Grid */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 min-h-0 custom-scrollbar">
              {filteredStocks.map(stock => {
                const isOutOfStock = stock.quantity <= 0;
                return (
                  <button
                    key={stock.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(stock)}
                    className={`bg-white/3 border hover:bg-white/5 text-left rounded-2xl p-3 flex flex-col justify-between transition group cursor-pointer relative overflow-hidden ${
                      isOutOfStock
                        ? "opacity-40 border-white/5 cursor-not-allowed"
                        : "border-white/10 hover:border-teal-500/50"
                    }`}
                  >
                    {/* Quantity Badge */}
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${
                      stock.quantity <= stock.minQuantity
                        ? "bg-red-500/20 text-red-400"
                        : "bg-teal-500/20 text-teal-400"
                    }`}>
                      {stock.quantity} {stock.unit || "Adet"}
                    </span>

                    <div className="pt-2">
                      <div className="text-[10px] text-white/40 font-mono tracking-wider mb-1 uppercase">
                        {stock.code}
                      </div>
                      <div className="text-white font-bold text-xs line-clamp-2 leading-tight group-hover:text-teal-400 transition">
                        {stock.name}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-white/5 flex items-end justify-between">
                      <div>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
                          Satış Fiyatı
                        </div>
                        <div className="text-teal-400 font-extrabold text-sm font-mono mt-0.5">
                          {stock.salesPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredStocks.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-white/20 gap-3">
                  <Package size={40} strokeWidth={1} />
                  <p className="text-xs font-mono uppercase tracking-wider">Aramayla eşleşen ürün bulunamadı</p>
                </div>
              )}
            </div>

          </div>

          {/* Sağ Panel: Sepet ve Ödeme */}
          <div className="w-full md:w-96 flex flex-col bg-[#16161a] overflow-hidden">
            
            {/* Header / Cari Selection */}
            <div className="p-4 border-b border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShoppingCart size={14} />
                <span>MÜŞTERİ SEÇİMİ</span>
              </div>

              <select
                required
                value={selectedCariId}
                onChange={e => setSelectedCariId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-semibold focus:outline-hidden focus:border-teal-500"
              >
                <option value="" className="bg-[#16161a]">-- Seçin --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#16161a]">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 custom-scrollbar">
              {cart.map(item => (
                <div
                  key={item.stock.id}
                  className="bg-white/2 border border-white/5 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-[9px] text-white/30 font-mono tracking-wider uppercase mb-0.5">
                        {item.stock.code}
                      </div>
                      <div className="text-white font-bold text-xs leading-tight">
                        {item.stock.name}
                      </div>
                    </div>
                    <button
                      onClick={() => decreaseQuantity(item.stock.id)}
                      className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => decreaseQuantity(item.stock.id)}
                        className="p-1 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateQuantity(item.stock.id, parseInt(e.target.value) || 1)}
                        className="w-10 text-center bg-transparent text-white font-extrabold text-xs font-mono focus:outline-hidden"
                      />
                      <button
                        onClick={() => addToCart(item.stock)}
                        className="p-1 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-teal-400 font-extrabold text-xs font-mono">
                      {(item.stock.salesPrice * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3 py-16">
                  <ShoppingCart size={40} strokeWidth={1} />
                  <p className="text-xs font-mono uppercase tracking-wider">Sepetiniz Boş</p>
                </div>
              )}
            </div>

            {/* Bottom Summary & Payments */}
            <div className="p-4 bg-white/2 border-t border-white/10 space-y-4 shrink-0">
              
              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Ödeme Tipi
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold font-mono uppercase transition cursor-pointer border ${
                      paymentMethod === "cash"
                        ? "bg-teal-500/10 text-teal-400 border-teal-500"
                        : "bg-white/5 text-white/50 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <Coins size={14} />
                    <span>Nakit (Kasa)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pos")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold font-mono uppercase transition cursor-pointer border ${
                      paymentMethod === "pos"
                        ? "bg-teal-500/10 text-teal-400 border-teal-500"
                        : "bg-white/5 text-white/50 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Kredi Kartı</span>
                  </button>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="space-y-2 border-t border-white/5 pt-3 font-mono">
                <div className="flex justify-between text-xs text-white/50">
                  <span>Ara Toplam:</span>
                  <span>{totals.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>KDV Toplamı:</span>
                  <span>{totals.taxTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-teal-400 border-t border-white/10 pt-2">
                  <span>TOPLAM TUTAR:</span>
                  <span>{totals.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCompleteSale}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-white/5 disabled:text-white/20 text-black py-3 rounded-xl text-xs font-extrabold font-mono uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span>Satışı Tamamla</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
