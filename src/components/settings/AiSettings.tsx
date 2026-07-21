import React from 'react';
import { Bot, Info } from 'lucide-react';

export interface AiSettingsProps {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  setAiInfoModalOpen: (open: boolean) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
}

export const AiSettings: React.FC<AiSettingsProps> = ({
  geminiApiKey,
  setGeminiApiKey,
  setAiInfoModalOpen,
  isAiEnabled,
  setIsAiEnabled
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yapay Zeka (AI) Ayarları</h3>
            <p className="text-xs text-white/50 mt-0.5">Sistem asistanı ve akıllı özellikler için Gemini API entegrasyonu</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Toggle Switch Row */}
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="pr-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Storm AI Asistanı</span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">
                Asistanı hem bilgisayar hem mobil sürümünde etkinleştirir veya gizler. Varsayılan olarak aktiftir.
              </span>
            </div>
            <button
              onClick={() => {
                const newValue = !isAiEnabled;
                setIsAiEnabled(newValue);
                localStorage.setItem('storm_muhasebe_ai_enabled', String(newValue));
              }}
              className={`w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none relative p-0.5 cursor-pointer shrink-0 ${
                isAiEnabled ? 'bg-teal-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  isAiEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider">Gemini API Anahtarı (API Key)</label>
              <button
                onClick={() => setAiInfoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Info size={14} />
                <span>Nasıl Alınır?</span>
              </button>
            </div>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                setGeminiApiKey(e.target.value);
                localStorage.setItem('storm_muhasebe_gemini_api_key', e.target.value);
              }}
              placeholder="AIzaSy..."
              className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white transition outline-none font-mono"
            />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Değişiklikler otomatik olarak tarayıcıya kaydedilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
