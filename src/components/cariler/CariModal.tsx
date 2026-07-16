import React, { useState, useEffect } from 'react';
import { Cari } from '../../types';
import { X, Upload, Check, AlertCircle, Building, User, Info, FileText, Image as ImageIcon } from 'lucide-react';
import { saveCari } from '../../firebase';
import { compressImage } from '../../utils/imageCompressor';

export interface CariModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCari: Cari | null;
  cariler: Cari[];
  aiPrefilledData?: any;
  onClearAiPrefilledData?: () => void;
}

export function CariModal({
  isOpen,
  onClose,
  editingCari,
  cariler,
  aiPrefilledData,
  onClearAiPrefilledData
}: CariModalProps) {

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

  useEffect(() => {
    if (isOpen) {
      if (editingCari) {
        setFormData({
          name: editingCari.name,
          code: editingCari.code,
          type: editingCari.type,
          phone: editingCari.phone,
          email: editingCari.email,
          address: editingCari.address,
          openingBalance: editingCari.openingBalance,
          isActive: editingCari.isActive !== false,
          currency: editingCari.currency || "TRY",
          taxOffice: editingCari.taxOffice || "",
          taxNo: editingCari.taxNo || "",
          imageUrl: editingCari.imageUrl || "",
        });
      } else if (!aiPrefilledData) {
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
      }
      setFormError("");
    }
  }, [isOpen, editingCari, cariler.length, aiPrefilledData]);



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
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(
        "Cari kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };



  if (!isOpen) return null;

  return (
    <>
{/* Add / Edit Cari Modal */}
      {(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                {editingCari ? "Cari Düzenle" : "Yeni Cari Hesap"}
              </h3>
              <button
                id="btn-close-modal"
                onClick={() => onClose()}
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
                  onClick={() => onClose()}
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

      
    </>
  );
}
