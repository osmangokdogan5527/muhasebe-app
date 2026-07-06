import React, { useState } from 'react';
import { Plus, Landmark, HandCoins, CheckCircle2, CircleDashed, X } from 'lucide-react';
import { Credit } from '../types';
import { saveCredit } from '../firebase';

interface KredilerViewProps {
  credits: Credit[];
}

export default function KredilerView({ credits }: KredilerViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Credit>>({
    bank: '',
    name: '',
    totalAmount: 0,
    remainingInstallments: 0,
    monthlyPayment: 0,
    status: 'active'
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const activeDebt = credits.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.remainingInstallments * c.monthlyPayment), 0);
  const monthlyPaymentSum = credits.filter(c => c.status === 'active').reduce((sum, c) => sum + c.monthlyPayment, 0);
  const closedCount = credits.filter(c => c.status === 'closed').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank || !formData.name || !formData.totalAmount || !formData.monthlyPayment) return;
    
    await saveCredit({
      bank: formData.bank,
      name: formData.name,
      totalAmount: Number(formData.totalAmount),
      remainingInstallments: Number(formData.remainingInstallments),
      monthlyPayment: Number(formData.monthlyPayment),
      status: formData.status as 'active' | 'closed',
      createdAt: new Date().toISOString()
    });
    
    setIsModalOpen(false);
    setFormData({ bank: '', name: '', totalAmount: 0, remainingInstallments: 0, monthlyPayment: 0, status: 'active' });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 relative animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Landmark className="text-teal-400" />
            Kredi ve Finansman Takibi
          </h1>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Banka kredileri ve finansman ödemelerinizi takip edin.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} />
          Yeni Kredi Girişi
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toplam Aktif Kredi Borcu */}
        <div className="bg-[#111111] rounded-xl p-5 border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Landmark size={64} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest font-mono mb-1">Toplam Aktif Kredi Borcu</p>
          <h3 className="text-2xl font-bold text-white mb-2 font-mono">{formatCurrency(activeDebt)}</h3>
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            Tüm bankalardaki güncel anapara borcu
          </div>
        </div>

        {/* Bu Ay Ödenecek Taksit Tutarı */}
        <div className="bg-[#111111] rounded-xl p-5 border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HandCoins size={64} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest font-mono mb-1">Bu Ay Ödenecek Taksit Tutarı</p>
          <h3 className="text-2xl font-bold text-white mb-2 font-mono">{formatCurrency(monthlyPaymentSum)}</h3>
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Yaklaşan taksit ödemeleri
          </div>
        </div>

        {/* Kapanmış/Biten Krediler */}
        <div className="bg-[#111111] rounded-xl p-5 border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest font-mono mb-1">Kapanmış/Biten Krediler</p>
          <h3 className="text-2xl font-bold text-white mb-2 font-mono">{closedCount}</h3>
          <div className="text-xs text-white/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Ödemesi tamamlanmış kredi sayısı
          </div>
        </div>
      </div>

      {/* Credit List Table */}
      <div className="bg-[#111111] rounded-xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Aktif Krediler Listesi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Banka Adı</th>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Kredi Adı / Amacı</th>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Toplam Tutar</th>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">Kalan Taksit</th>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Aylık Taksit</th>
                <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {credits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <CircleDashed className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium">Henüz kayıtlı bir kredi bulunmuyor.</p>
                      <p className="text-xs opacity-75">Sağ üst köşedeki butonu kullanarak yeni bir kredi girişi yapabilirsiniz.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                credits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-sm text-white font-medium">{credit.bank}</td>
                    <td className="p-4 text-sm text-white/40">{credit.name}</td>
                    <td className="p-4 text-sm text-white font-mono text-right">{formatCurrency(credit.totalAmount)}</td>
                    <td className="p-4 text-center">
                      {credit.remainingInstallments > 0 ? (
                        <span className="inline-flex items-center justify-center bg-white/5 text-white/60 px-2 py-0.5 rounded text-xs font-mono">
                          {credit.remainingInstallments} Ay
                        </span>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono text-right text-rose-400">{formatCurrency(credit.monthlyPayment)}</td>
                    <td className="p-4 text-center">
                      {credit.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40">
                          <CheckCircle2 size={12} />
                          Kapandı
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Credit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f11] rounded-2xl shadow-xl w-full max-w-lg border border-white/10 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Landmark size={18} className="text-teal-500" />
                Yeni Kredi Girişi
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Banka Adı</label>
                  <input
                    type="text"
                    required
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Örn: Garanti BBVA"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Kredi Adı / Amacı</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Örn: Ticari Araç Kredisi"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Toplam Tutar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₺</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.totalAmount || ''}
                      onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Kalan Taksit Sayısı</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.remainingInstallments || ''}
                    onChange={(e) => setFormData({ ...formData, remainingInstallments: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Ay"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Aylık Taksit Tutarı</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₺</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.monthlyPayment || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shadow-sm"
                >
                  Krediyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
