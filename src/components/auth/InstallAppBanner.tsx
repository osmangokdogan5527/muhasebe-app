import React from 'react';
import { Download, Share } from 'lucide-react';
import { usePwaInstall } from '../../utils/pwa';

interface InstallAppBannerProps {
  textPrimary: string;
  textTertiary: string;
  cardBgClass: string;
}

/** Telefona yükleme çağrısı: Android/Chrome'da yükleme penceresi, iPhone Safari'de "Ana Ekrana Ekle" ipucu. */
export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ textPrimary, textTertiary, cardBgClass }) => {
  const { canInstall, showIosHint, promptInstall } = usePwaInstall();
  if (!canInstall && !showIosHint) return null;

  return (
    <div className={`${cardBgClass} rounded-2xl p-4 mt-4 flex items-center gap-3 animate-fade-in`}>
      <img src="icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${textPrimary}`}>Telefona Yükle</div>
        {canInstall ? (
          <div className={`text-[11px] ${textTertiary}`}>Storm'u ana ekrandan uygulama gibi açın.</div>
        ) : (
          <div className={`text-[11px] leading-snug ${textTertiary}`}>
            Safari'de <Share size={11} className="inline -mt-0.5" /> <b>Paylaş</b> → <b>Ana Ekrana Ekle</b> adımlarını izleyin.
          </div>
        )}
      </div>
      {canInstall && (
        <button
          type="button"
          onClick={promptInstall}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition cursor-pointer"
        >
          <Download size={14} /> Yükle
        </button>
      )}
    </div>
  );
};
