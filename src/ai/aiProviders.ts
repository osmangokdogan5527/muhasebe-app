/**
 * Yapay zeka sağlayıcıları: Gemini (ana) ve yedek sağlayıcı (Groq ücretsiz ya da ChatGPT/OpenAI).
 *
 * - Anahtarlar bu cihazda saklanır (Gemini anahtarı gibi).
 * - verifyAiKey: anahtarın çalışıp çalışmadığını ayarlar ekranında hemen gösterir.
 * - Groq ve OpenAI aynı "chat completions" biçimini kullanır; tek istemci ikisine de hizmet eder.
 * - Model koda sabitlenmez: anahtarın erişebildiği listeden uygun model seçilir ve hatırlanır.
 */
import { logError } from '../utils/errorLogger';
import { generateContentWithFallback, pickBestModel } from './geminiModel';

export type SecondaryProvider = 'groq' | 'openai';
export type AiProviderId = 'gemini' | SecondaryProvider;
export type AiOrder = 'gemini_first' | 'secondary_first';

export interface AiCredentials {
  geminiKey: string;
  secondaryProvider: SecondaryProvider;
  secondaryKey: string;
  order: AiOrder;
}

export const GEMINI_KEY_STORAGE = 'storm_muhasebe_gemini_api_key';
export const SECONDARY_PROVIDER_STORAGE = 'storm_ai_secondary_provider';
export const SECONDARY_KEY_STORAGE = 'storm_ai_secondary_key';

/** Her yedek sağlayıcının anahtarı ayrı saklanır (sağlayıcı değiştirince anahtar kaybolmaz) */
export function secondaryKeyStorage(provider: SecondaryProvider): string {
  return provider === 'groq' ? SECONDARY_KEY_STORAGE : `${SECONDARY_KEY_STORAGE}_${provider}`;
}
export const AI_ORDER_STORAGE = 'storm_ai_order';

export const PROVIDER_LABELS: Record<AiProviderId, string> = {
  gemini: 'Gemini',
  groq: 'Groq',
  openai: 'ChatGPT',
};

const COMPAT_BASE: Record<SecondaryProvider, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

/** Sesli mesajı yazıya çevirme modeli */
const TRANSCRIBE_MODEL: Record<SecondaryProvider, string> = {
  groq: 'whisper-large-v3-turbo',
  openai: 'whisper-1',
};

/**
 * Tercih sırası (Türkçe ve araç çağırma için uygun olanlar önce). Listede olmayan bir anahtar için
 * erişilebilen sohbet modellerinden uygun olan seçilir.
 */
const PREFERRED_MODELS: Record<SecondaryProvider, string[]> = {
  groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct', 'qwen/qwen3-32b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
  openai: ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4o'],
};

const read = (key: string, fallback = ''): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export function readAiCredentials(): AiCredentials {
  const secondaryProvider: SecondaryProvider = read(SECONDARY_PROVIDER_STORAGE, 'groq') === 'openai' ? 'openai' : 'groq';
  return {
    geminiKey: read(GEMINI_KEY_STORAGE).trim(),
    secondaryProvider,
    secondaryKey: read(secondaryKeyStorage(secondaryProvider)).trim(),
    order: read(AI_ORDER_STORAGE) === 'secondary_first' ? 'secondary_first' : 'gemini_first',
  };
}

export function saveAiSetting(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'aiProviders.saveAiSetting');
  }
}

export function hasAnyAiKey(creds: AiCredentials): boolean {
  return !!(creds.geminiKey || creds.secondaryKey);
}

/** Denenecek sağlayıcılar, sırasıyla (anahtarı olmayan atlanır) */
export function providerOrder(creds: AiCredentials): AiProviderId[] {
  const list: AiProviderId[] = creds.order === 'secondary_first'
    ? [creds.secondaryProvider, 'gemini']
    : ['gemini', creds.secondaryProvider];
  return list.filter((p) => (p === 'gemini' ? !!creds.geminiKey : !!creds.secondaryKey));
}

/** Sağlayıcıdan gelen ve kullanıcıya gösterilecek hata */
export class AiProviderError extends Error {
  status: number;
  provider: AiProviderId;
  constructor(message: string, status: number, provider: AiProviderId) {
    super(message);
    this.status = status;
    this.provider = provider;
  }
}

// ---------------- Anahtar doğrulama ----------------

export type KeyCheckState = 'valid' | 'invalid' | 'quota' | 'network' | 'no_model';

export interface KeyCheckResult {
  state: KeyCheckState;
  message: string;
  model?: string;
}

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';

/** Anahtarı gerçek bir istekle sınar (model listesi okunur; ücret/kota harcamaz) */
export async function verifyAiKey(provider: AiProviderId, rawKey: string): Promise<KeyCheckResult> {
  const key = (rawKey || '').trim();
  if (!key) return { state: 'invalid', message: 'Anahtar boş.' };
  try {
    if (provider === 'gemini') {
      const res = await fetch(`${GEMINI_API}/models?pageSize=200&key=${encodeURIComponent(key)}`);
      if (res.status === 429) return { state: 'quota', message: 'Anahtar doğru, ama şu an kullanım limiti dolu.' };
      if (!res.ok) return { state: 'invalid', message: 'Anahtar geçersiz ya da etkin değil.' };
      const data = await res.json();
      const model = pickBestModel(Array.isArray(data?.models) ? data.models : []);
      if (!model) return { state: 'no_model', message: 'Anahtar doğru, ama uygun bir Gemini modeline erişimi yok.' };
      return { state: 'valid', message: 'Anahtar çalışıyor.', model };
    }
    const res = await fetch(`${COMPAT_BASE[provider]}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (res.status === 429) return { state: 'quota', message: 'Anahtar doğru, ama şu an kullanım limiti dolu.' };
    if (res.status === 401 || res.status === 403) return { state: 'invalid', message: 'Anahtar geçersiz ya da iptal edilmiş.' };
    if (!res.ok) return { state: 'network', message: `Sunucu yanıt vermedi (${res.status}). Biraz sonra tekrar deneyin.` };
    const data = await res.json();
    const model = pickCompatModel(provider, Array.isArray(data?.data) ? data.data : []);
    if (!model) return { state: 'no_model', message: 'Anahtar doğru, ama uygun bir sohbet modeline erişimi yok.' };
    rememberCompatModel(provider, key, model);
    return { state: 'valid', message: 'Anahtar çalışıyor.', model };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), `aiProviders.verify:${provider}`);
    return { state: 'network', message: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.' };
  }
}

// ---------------- Groq / OpenAI model seçimi ----------------

const COMPAT_CACHE = 'storm_ai_compat_model_by_key';

function fingerprint(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function readCompatCache(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPAT_CACHE) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function rememberCompatModel(provider: SecondaryProvider, key: string, model: string) {
  try {
    const cache = readCompatCache();
    cache[`${provider}:${fingerprint(key)}`] = model;
    localStorage.setItem(COMPAT_CACHE, JSON.stringify(cache));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'aiProviders.rememberCompatModel');
  }
}

/** Erişilebilen modellerden sohbet ve araç çağırmaya uygun olanı */
export function pickCompatModel(provider: SecondaryProvider, models: { id?: string }[]): string | null {
  const ids = models.map((m) => String(m?.id || '')).filter(Boolean);
  for (const preferred of PREFERRED_MODELS[provider]) {
    if (ids.includes(preferred)) return preferred;
  }
  const excluded = /(whisper|tts|audio|embed|guard|moderation|image|dall-e|vision|realtime|transcribe|search|compound|playai|orpheus|davinci|babbage|instruct$)/i;
  const chat = ids.filter((id) => !excluded.test(id));
  const pattern = provider === 'openai' ? /^gpt-/ : /(gpt-oss|llama|qwen|kimi|mistral|gemma)/i;
  const candidates = chat.filter((id) => pattern.test(id));
  return candidates[0] || chat[0] || null;
}

async function resolveCompatModel(provider: SecondaryProvider, key: string, refresh = false): Promise<string | null> {
  if (!refresh) {
    const cached = readCompatCache()[`${provider}:${fingerprint(key)}`];
    if (cached) return cached;
  }
  try {
    const res = await fetch(`${COMPAT_BASE[provider]}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return refresh ? null : PREFERRED_MODELS[provider][0];
    const data = await res.json();
    const model = pickCompatModel(provider, Array.isArray(data?.data) ? data.data : []);
    if (model) rememberCompatModel(provider, key, model);
    return model;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'aiProviders.resolveCompatModel');
    return refresh ? null : PREFERRED_MODELS[provider][0];
  }
}

// ---------------- Groq / OpenAI sohbet çağrısı ----------------

export interface CompatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export interface CompatTool {
  type: 'function';
  function: { name: string; description: string; parameters: any };
}

export interface CompatReply {
  text: string;
  toolCalls: { name: string; args: any }[];
  model: string;
}

function compatError(provider: SecondaryProvider, status: number, detail: string): AiProviderError {
  const label = PROVIDER_LABELS[provider];
  if (status === 429) return new AiProviderError(`${label} kullanım limiti doldu. Biraz bekleyip tekrar deneyin.`, 429, provider);
  if (status === 401 || status === 403) return new AiProviderError(`${label} API anahtarı geçersiz. Ayarlar > Yapay Zeka bölümünden kontrol edin.`, status, provider);
  if (status === 402) return new AiProviderError(`${label} hesabında bakiye yok.`, status, provider);
  return new AiProviderError(`${label} isteği başarısız oldu (${status}). ${detail}`.trim(), status, provider);
}

export async function callCompatChat(
  provider: SecondaryProvider,
  key: string,
  messages: CompatMessage[],
  tools: CompatTool[] | null,
  options: { temperature?: number; json?: boolean } = {},
): Promise<CompatReply> {
  let model = await resolveCompatModel(provider, key);
  if (!model) throw new AiProviderError(`${PROVIDER_LABELS[provider]} anahtarıyla kullanılabilen bir model bulunamadı.`, 404, provider);

  const send = (m: string) => fetch(`${COMPAT_BASE[provider]}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      messages,
      temperature: options.temperature ?? 0.2,
      ...(tools && tools.length ? { tools, tool_choice: 'auto' } : {}),
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  let response = await send(model);
  if (response.status === 404 || response.status === 400) {
    // Model kapatılmış olabilir: liste yenilenip bir kez daha denenir
    let detail = '';
    try { detail = (await response.clone().json())?.error?.message || ''; } catch { /* yok */ }
    if (response.status === 404 || /model/i.test(detail)) {
      const next = await resolveCompatModel(provider, key, true);
      if (next && next !== model) {
        model = next;
        response = await send(model);
      }
    }
  }
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error?.message || ''; } catch { /* yok */ }
    throw compatError(provider, response.status, detail);
  }
  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new AiProviderError(`${PROVIDER_LABELS[provider]} boş yanıt döndü.`, 500, provider);
  const toolCalls = (Array.isArray(message.tool_calls) ? message.tool_calls : []).map((call: any) => {
    let args: any = {};
    try { args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {}; } catch { args = {}; }
    return { name: String(call?.function?.name || ''), args };
  }).filter((c: { name: string }) => c.name);
  return { text: typeof message.content === 'string' ? message.content : '', toolCalls, model };
}

/** Sesli mesajı yazıya çevirir (Gemini ses dinleyebilir; Groq/OpenAI için önce yazıya çevrilir) */
export async function transcribeAudio(provider: SecondaryProvider, key: string, base64: string, mimeType: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const ext = /mp4|m4a|aac/.test(mimeType) ? 'm4a' : /ogg/.test(mimeType) ? 'ogg' : /wav/.test(mimeType) ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mimeType || 'audio/webm' }), `ses.${ext}`);
  form.append('model', TRANSCRIBE_MODEL[provider]);
  form.append('language', 'tr');
  const res = await fetch(`${COMPAT_BASE[provider]}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch { /* yok */ }
    throw compatError(provider, res.status, detail);
  }
  const data = await res.json();
  return String(data?.text || '').trim();
}

// ---------------- Geçici devre dışı bırakma ----------------

/** Kota dolan sağlayıcı kısa süre denenmez (her mesajda boşuna beklenmesin) */
const cooldownUntil: Partial<Record<AiProviderId, number>> = {};
const COOLDOWN_MS = 60_000;

export function markProviderLimited(provider: AiProviderId) {
  cooldownUntil[provider] = Date.now() + COOLDOWN_MS;
}

export function isProviderCoolingDown(provider: AiProviderId): boolean {
  return (cooldownUntil[provider] || 0) > Date.now();
}

/** Bu hatada sıradaki sağlayıcıya geçilir mi? (kota, anahtar, model, sunucu ve bağlantı hataları) */
export function shouldFallback(err: unknown): boolean {
  if (err instanceof AiProviderError) return true;
  if (err && typeof err === 'object' && 'status' in err) return true;
  // fetch bağlantı hatası (TypeError) ya da beklenmeyen yanıt
  return err instanceof TypeError || err instanceof SyntaxError;
}

// ---------------- Tek seferlik JSON isteği (Excel eşleştirme gibi) ----------------

/**
 * İstemi sırayla Gemini ve yedek sağlayıcıya gönderir; ilk geçerli JSON cevabını döndürür.
 * Hiçbiri cevap veremezse null (çağıran kendi kural tabanlı yöntemine döner).
 */
export async function generateJsonWithFallback(prompt: string): Promise<any | null> {
  const creds = readAiCredentials();
  const configured = providerOrder(creds);
  const ordered = [...configured.filter((p) => !isProviderCoolingDown(p)), ...configured.filter((p) => isProviderCoolingDown(p))];
  for (const provider of ordered) {
    try {
      if (provider === 'gemini') {
        const { response } = await generateContentWithFallback(creds.geminiKey, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        });
        if (!response.ok) {
          if (response.status === 429) markProviderLimited('gemini');
          continue;
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === 'string') return JSON.parse(text);
      } else {
        const reply = await callCompatChat(
          provider,
          creds.secondaryKey,
          [
            { role: 'system', content: 'Yalnızca istenen biçimde geçerli bir JSON nesnesi döndür. Açıklama ya da markdown yazma.' },
            { role: 'user', content: prompt },
          ],
          null,
          { temperature: 0.1, json: true },
        );
        const cleaned = reply.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      if ((err as any)?.status === 429) markProviderLimited(provider);
      logError(err instanceof Error ? err : new Error(String(err)), `aiProviders.generateJson:${provider}`);
    }
  }
  return null;
}
