import React from 'react';
import { LayoutDashboard, Users, Package, Receipt, Briefcase, Wallet, Settings, Lock } from 'lucide-react';

interface MobileBottomNavProps {
  handleNavigate: (tab: any) => void;
  activeTab: string;
  userRole: string;
  sensitiveTabs: string[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  handleNavigate,
  activeTab,
  userRole,
  sensitiveTabs
}) => {
  return (
    <>

      {/* 4. MOBILE BOTTOM FIXED NAV BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080808] border-t border-white/10 py-2.5 px-4 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.5)] overflow-x-auto gap-4 custom-scrollbar">
        <button 
          id="btm-btn-dashboard"
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <div className="relative">
            <LayoutDashboard size={18} />
            {userRole === 'employee' && sensitiveTabs.includes('dashboard') && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500/95 text-white rounded-full p-0.5 text-[7px] leading-none shadow-sm"><Lock size={6} /></span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Pano</span>
        </button>

        <button 
          id="btm-btn-cariler"
          onClick={() => handleNavigate('cariler')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'cariler' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] uppercase tracking-wider">Cari</span>
        </button>

        <button 
          id="btm-btn-stoklar"
          onClick={() => handleNavigate('stoklar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'stoklar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Package size={18} />
          <span className="text-[9px] uppercase tracking-wider">Stok</span>
        </button>

        <button 
          id="btm-btn-islemler"
          onClick={() => handleNavigate('islemler')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'islemler' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Receipt size={18} />
          <span className="text-[9px] uppercase tracking-wider">Hareket</span>
        </button>

        <button 
          id="btm-btn-ceksenet"
          onClick={() => handleNavigate('ceksenet')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'ceksenet' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <div className="relative">
            <Briefcase size={18} />
            {userRole === 'employee' && sensitiveTabs.includes('ceksenet') && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500/95 text-white rounded-full p-0.5 text-[7px] leading-none shadow-sm"><Lock size={6} /></span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Çek/Senet</span>
        </button>

        <button 
          id="btm-btn-masraflar"
          onClick={() => handleNavigate('masraflar')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'masraflar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <div className="relative">
            <Wallet size={18} />
            {userRole === 'employee' && sensitiveTabs.includes('masraflar') && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500/95 text-white rounded-full p-0.5 text-[7px] leading-none shadow-sm"><Lock size={6} /></span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Masraf</span>
        </button>

        <button 
          id="btm-btn-calisanlar"
          onClick={() => handleNavigate('calisanlar')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'calisanlar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <div className="relative">
            <Users size={18} />
            {userRole === 'employee' && sensitiveTabs.includes('calisanlar') && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500/95 text-white rounded-full p-0.5 text-[7px] leading-none shadow-sm"><Lock size={6} /></span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Personel</span>
        </button>

        <button 
          id="btm-btn-ayarlar"
          onClick={() => handleNavigate('ayarlar')}
          className={`flex flex-col items-center gap-1 transition relative ${
            activeTab === 'ayarlar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <div className="relative">
            <Settings size={18} />
            {userRole === 'employee' && sensitiveTabs.includes('ayarlar') && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500/95 text-white rounded-full p-0.5 text-[7px] leading-none shadow-sm"><Lock size={6} /></span>
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider">Ayarlar</span>
        </button>
      </nav>
    </>
  );
};
