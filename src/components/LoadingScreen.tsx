import React from 'react';
import { Cloud } from 'lucide-react';

interface LoadingScreenProps {
  currentThemeData: any;
  themeCssRules: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ currentThemeData, themeCssRules }) => {
  return (
    <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-black'} flex flex-col items-center justify-center p-6 text-center`}>
      <style>{`
        :root {
          ${themeCssRules}
        }
      `}</style>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
        <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400" size={20} />
      </div>
      <h2 className="text-lg font-light tracking-[0.2em] uppercase text-white/95 mt-6">Bulut Hesabım Yükleniyor...</h2>
      <p className="text-white/40 text-xs mt-2 max-w-xs uppercase tracking-widest font-mono">Güvenli bulut veri tabanına bağlanılıyor ve verileriniz eşitleniyor.</p>
    </main>
  );
};
