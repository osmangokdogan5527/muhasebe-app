/**
 * Firma bilgileri eksikken (fişte ad ya da telefon yok) sahibe gösterilen küçük hatırlatma kartı.
 */
import React from 'react';
import { Building2, ChevronRight } from 'lucide-react';

interface FirmInfoBannerProps {
  onOpen: () => void;
  className?: string;
}

export const FirmInfoBanner: React.FC<FirmInfoBannerProps> = ({ onOpen, className }) => (
  <button
    type="button"
    id="firm-info-banner"
    onClick={onOpen}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left cursor-pointer transition bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/15 ${className || ''}`}
  >
    <span className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center shrink-0"><Building2 size={20} /></span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-extrabold text-white">Firma bilgileriniz eksik</span>
      <span className="block text-[11px] text-white/60">Adresiniz ve telefonunuz fişlerde görünmüyor. Bir kez doldurun, her fişte yazsın.</span>
    </span>
    <span className="shrink-0 flex items-center gap-1 text-xs font-extrabold text-sky-300">Doldur <ChevronRight size={14} /></span>
  </button>
);
