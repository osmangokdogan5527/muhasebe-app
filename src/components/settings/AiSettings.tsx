import React from 'react';
import { Bot, Info } from 'lucide-react';

export interface AiSettingsProps {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  setAiInfoModalOpen: (open: boolean) => void;
}

export const AiSettings: React.FC<AiSettingsProps> = ({
  geminiApiKey,
  setGeminiApiKey,
  setAiInfoModalOpen
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

              <div className="space-y-3">
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

  );
};
