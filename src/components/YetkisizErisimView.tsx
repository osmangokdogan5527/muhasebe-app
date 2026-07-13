import React from 'react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface YetkisizErisimViewProps {
  moduleName: string;
  onUnlockClick: () => void;
}

export default function YetkisizErisimView({ moduleName, onUnlockClick }: YetkisizErisimViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md animate-fade-in my-6 max-w-2xl mx-auto shadow-2xl">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
          <Lock size={36} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white border-4 border-[#090909] shadow-lg">
          <ShieldAlert size={14} />
        </div>
      </div>

      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/95 mb-3 font-sans">
        Kısıtlı Yetki / Yetkisiz Erişim
      </h3>
      
      <p className="text-zinc-400 text-xs max-w-md leading-relaxed mb-8">
        Şu anda <strong className="text-red-400">{moduleName}</strong> modülünü görüntülemektesiniz. 
        Personel (Kısıtlı) modu aktif olduğu için finansal ve sistemsel verilere erişim yetkiniz bulunmamaktadır.
      </p>

      <button
        onClick={onUnlockClick}
        className="px-6 py-3 text-xs uppercase tracking-widest font-bold text-black bg-teal-400 hover:bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_25px_rgba(45,212,191,0.4)] rounded-xl transition-all duration-300 flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
      >
        <KeyRound size={14} />
        <span>Yönetici Şifresi ile Kilidi Aç</span>
      </button>

      <div className="mt-8 pt-6 border-t border-white/5 w-full max-w-xs text-[10px] text-white/20 font-mono tracking-wider">
        SECURE ROLE-BASED ACCESS CONTROL
      </div>
    </div>
  );
}
