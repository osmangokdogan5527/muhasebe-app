import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Info, CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, ExternalLink, ArrowRightLeft } from 'lucide-react';
import {
  AiCredentials, AiOrder, AiProviderId, GEMINI_KEY_STORAGE, KeyCheckResult, PROVIDER_LABELS, SecondaryProvider, saveAiSetting, verifyAiKey,
} from '../../ai/aiProviders';
import { logError } from '../../utils/errorLogger';

/** Yedek yapay zeka ayarları (useAppSettings'ten gelir) */
export interface AiSettingsControls {
  credentials: AiCredentials;
  setSecondaryProvider: (provider: SecondaryProvider) => void;
  setSecondaryKey: (key: string) => void;
  setOrder: (order: AiOrder) => void;
}

export interface AiSettingsProps {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  setAiInfoModalOpen: (open: boolean) => void;
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
  aiControls: AiSettingsControls;
}

const SECONDARY_INFO: Record<SecondaryProvider, { title: string; hint: string; url: string; placeholder: string }> = {
  groq: {
    title: 'Groq (ücretsiz)',
    hint: 'console.groq.com adresinde ücretsiz hesap açıp "API Keys" bölümünden anahtar alın. Kredi kartı istemez.',
    url: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
  },
  openai: {
    title: 'ChatGPT (OpenAI, ücretli)',
    hint: 'platform.openai.com adresinden anahtar alınır. ChatGPT uygulamasının ücretsiz üyeliği yetmez; API hesabında bakiye gerekir.',
    url: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
  },
};

type CheckStatus = { phase: 'idle' } | { phase: 'checking' } | { phase: 'done'; result: KeyCheckResult };

/** Anahtar yazıldıktan kısa süre sonra kendiliğinden sınanır; sonuç anahtar değişene kadar geçerlidir */
function useKeyCheck(provider: AiProviderId, key: string) {
  const [status, setStatus] = useState<CheckStatus>({ phase: 'idle' });
  const runId = useRef(0);

  const run = useCallback(async (value: string) => {
    const id = ++runId.current;
    if (!value.trim()) {
      setStatus({ phase: 'idle' });
      return;
    }
    setStatus({ phase: 'checking' });
    try {
      const result = await verifyAiKey(provider, value);
      if (id === runId.current) setStatus({ phase: 'done', result });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), `AiSettings.check:${provider}`);
      if (id === runId.current) setStatus({ phase: 'done', result: { state: 'network', message: 'Anahtar sınanamadı.' } });
    }
  }, [provider]);

  useEffect(() => {
    const timer = setTimeout(() => run(key), 700);
    return () => clearTimeout(timer);
  }, [key, run]);

  return { status, recheck: () => run(key) };
}

const KeyStatusBadge: React.FC<{ id: string; status: CheckStatus; onRecheck: () => void }> = ({ id, status, onRecheck }) => {
  if (status.phase === 'idle') {
    return <span id={id} data-state="empty" className="text-[11px] text-white/45">Anahtar girilmedi</span>;
  }
  if (status.phase === 'checking') {
    return (
      <span id={id} data-state="checking" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/60">
        <Loader2 size={13} className="animate-spin" /> Anahtar sınanıyor…
      </span>
    );
  }
  const { result } = status;
  const tone = result.state === 'valid'
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    : result.state === 'invalid' || result.state === 'no_model'
      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      : 'bg-sky-500/10 border-sky-500/30 text-sky-300';
  const Icon = result.state === 'valid' ? CheckCircle2 : result.state === 'invalid' || result.state === 'no_model' ? XCircle : AlertCircle;
  const title = result.state === 'valid' ? 'Onaylandı' : result.state === 'invalid' ? 'Onaylanmadı' : result.state === 'no_model' ? 'Kullanılamıyor' : result.state === 'quota' ? 'Geçerli, limit dolu' : 'Sınanamadı';
  return (
    <span id={id} data-state={result.state} className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-xl border text-[11px] ${tone}`}>
      <span className="inline-flex items-center gap-1.5 font-extrabold"><Icon size={14} /> {title}</span>
      <span className="opacity-80">{result.message}{result.model ? ` · model: ${result.model}` : ''}</span>
      {result.state !== 'valid' && (
        <button type="button" onClick={onRecheck} className="inline-flex items-center gap-1 font-bold underline underline-offset-2 cursor-pointer">
          <RefreshCw size={11} /> Tekrar sına
        </button>
      )}
    </span>
  );
};

const inputClass = 'w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-white transition outline-none font-mono';

export const AiSettings: React.FC<AiSettingsProps> = ({
  geminiApiKey,
  setGeminiApiKey,
  setAiInfoModalOpen,
  isAiEnabled,
  setIsAiEnabled,
  aiControls,
}) => {
  const { credentials, setSecondaryProvider, setSecondaryKey, setOrder } = aiControls;
  const gemini = useKeyCheck('gemini', geminiApiKey || '');
  const secondary = useKeyCheck(credentials.secondaryProvider, credentials.secondaryKey);
  const info = SECONDARY_INFO[credentials.secondaryProvider];
  const secondaryLabel = PROVIDER_LABELS[credentials.secondaryProvider];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yapay Zeka (AI) Ayarları</h3>
            <p className="text-xs text-white/50 mt-0.5">Storm AI asistanı ve akıllı Excel aktarımı için Gemini ve yedek yapay zeka</p>
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

          {/* Gemini */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="ai-gemini-key" className="text-xs font-bold text-white/80 uppercase tracking-wider">Gemini API Anahtarı</label>
              <button
                onClick={() => setAiInfoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Info size={14} />
                <span>Nasıl Alınır?</span>
              </button>
            </div>
            <input
              id="ai-gemini-key"
              type="password"
              autoComplete="off"
              value={geminiApiKey}
              onChange={(e) => {
                const value = e.target.value.trim();
                setGeminiApiKey(value);
                saveAiSetting(GEMINI_KEY_STORAGE, value);
              }}
              placeholder="AIzaSy..."
              className={inputClass}
            />
            <KeyStatusBadge id="ai-gemini-status" status={gemini.status} onRecheck={gemini.recheck} />
          </div>

          {/* Yedek yapay zeka */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div>
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">Yedek Yapay Zeka</span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">
                Gemini'nin ücretsiz limiti dolduğunda ya da hata verdiğinde Storm AI otomatik olarak yedekle devam eder.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Yedek yapay zeka">
              {(['groq', 'openai'] as SecondaryProvider[]).map((p) => {
                const on = credentials.secondaryProvider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-provider={p}
                    onClick={() => { if (!on) setSecondaryProvider(p); }}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${on ? 'bg-teal-500/10 border-teal-500/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                  >
                    {SECONDARY_INFO[p].title}
                  </button>
                );
              })}
            </div>
            <div className="flex items-start justify-between gap-2">
              <label htmlFor="ai-secondary-key" className="text-xs font-bold text-white/80 uppercase tracking-wider">{secondaryLabel} API Anahtarı</label>
              <a href={info.url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:underline">
                Anahtar al <ExternalLink size={11} />
              </a>
            </div>
            <input
              id="ai-secondary-key"
              type="password"
              autoComplete="off"
              value={credentials.secondaryKey}
              onChange={(e) => setSecondaryKey(e.target.value.trim())}
              placeholder={info.placeholder}
              className={inputClass}
            />
            <p className="text-[11px] text-white/45 leading-relaxed">{info.hint}</p>
            <KeyStatusBadge id="ai-secondary-status" status={secondary.status} onRecheck={secondary.recheck} />

            {/* Deneme sırası */}
            <div className="pt-2">
              <span className="text-[10px] font-extrabold text-white/60 uppercase tracking-wider flex items-center gap-1.5 mb-2"><ArrowRightLeft size={12} /> Önce hangisi denensin?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'gemini_first' as AiOrder, label: `Önce Gemini, olmazsa ${secondaryLabel}` },
                  { id: 'secondary_first' as AiOrder, label: `Önce ${secondaryLabel}, olmazsa Gemini` },
                ]).map((o) => {
                  const on = credentials.order === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      data-order={o.id}
                      onClick={() => setOrder(o.id)}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold text-left transition cursor-pointer ${on ? 'bg-teal-500/10 border-teal-500/40 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            Anahtarlar yalnızca bu cihazda saklanır ve otomatik kaydedilir.
          </p>
        </div>
      </div>
    </div>
  );
};
