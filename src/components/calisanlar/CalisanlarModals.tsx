import React from 'react';
import { X, Users, CreditCard, AlertCircle, FileText, Download, Wallet, Trash2, DollarSign, Plus, Phone, Mail } from 'lucide-react';
import { Employee, EmployeeTransaction } from '../../types';

export function CalisanlarModals({ isEmployeeModalOpen, isTxModalOpen, isDetailModalOpen, editingEmployee, editingTx, selectedEmployee, empFormData, txFormData, formError, isSubmitting, setIsEmployeeModalOpen, setIsTxModalOpen, setIsDetailModalOpen, setEmpFormData, setTxFormData, handleEmployeeSubmit, handleTxSubmit, handleDeleteTx, handleOpenEditTx, formatCurrency, employeeBalances, employeeSpecificTransactions, portfolioCekler, employees, handleOpenCreateEmployee, handleOpenCreateTx, handleTxTypeChange }) {
  return (
    <>
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
          
    </>
  );
}
