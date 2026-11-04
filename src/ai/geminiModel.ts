/**
 * Gemini model seçimi.
 *
 * Google eski modelleri zamanla yeni API anahtarlarına kapatıyor (ör. "gemini-2.5-flash is no
 * longer available to new users"). Eski anahtarlar çalışmaya devam ederken yeni anahtarlar
 * 404 alır. Bu yüzden model koda sabitlenmez:
 *  1. Önce bu anahtar için daha önce çalışan model (cihazda hatırlanır), yoksa varsayılan denenir.
 *  2. Model bulunamaz/kapatılmışsa (404) hata mesajında önerilen model denenir.
 *  3. Öneri yoksa anahtarın erişebildiği modeller listelenir ve en uygun "flash" modeli seçilir.
 * Çalışan model anahtar başına hatırlanır; anahtarın kendisi saklanmaz, yalnızca kısa bir özeti.
 */
import { logError } from '../utils/errorLogger';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_KEY = 'storm_gemini_model_by_key';

/** Anahtarın kendisini saklamamak için kısa, geri döndürülemez özet */
function keyFingerprint(apiKey: string): string {
  let h = 2166136261;
  for (let i = 0; i < apiKey.length; i++) {
    h ^= apiKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getModelForKey(apiKey: string): string {
  return readCache()[keyFingerprint(apiKey)] || DEFAULT_GEMINI_MODEL;
}

function rememberModel(apiKey: string, model: string) {
  try {
    const cache = readCache();
    cache[keyFingerprint(apiKey)] = model;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'geminiModel.rememberModel');
  }
}

/** "Please update your code to use models/gemini-3.0-flash" → "gemini-3.0-flash" */
export function suggestedModelFromError(detail: string, failedModel: string): string | null {
  const matches = (detail || '').match(/models\/(gemini-[a-z0-9.\-]+)/gi) || [];
  for (const m of matches) {
    const name = m.replace(/^models\//i, '').replace(/[.\-]+$/, '');
    if (name && name !== failedModel) return name;
  }
  return null;
}

interface ListedModel {
  name: string;
  supportedGenerationMethods?: string[];
}

/** Sürüm numarası (3.5 > 3 > 2.5); bilinmiyorsa 0 */
function modelVersion(name: string): number {
  const m = name.match(/gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Sohbet ve araç çağırma için uygun en yeni "flash" modeli (lite/görsel/ses/deneme sürümleri hariç tutulur) */
export function pickBestModel(models: ListedModel[]): string | null {
  const candidates = models
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => /^gemini-/.test(n) && /flash/.test(n))
    .filter((n) => !/(lite|image|tts|audio|live|embedding|vision|thinking|robotics|native)/.test(n));
  if (candidates.length === 0) return null;
  const stable = (n: string) => !/(preview|exp|experimental)/.test(n);
  candidates.sort((a, b) => {
    if (stable(a) !== stable(b)) return stable(a) ? -1 : 1;
    const v = modelVersion(b) - modelVersion(a);
    if (v !== 0) return v;
    // "-latest" ya da tarihsiz ad, tarihli sürümden önce
    return a.length - b.length;
  });
  return candidates[0];
}

async function listModels(apiKey: string): Promise<ListedModel[]> {
  try {
    const response = await fetch(`${API_BASE}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.models) ? data.models : [];
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'geminiModel.listModels');
    return [];
  }
}

export interface GeminiCallResult {
  response: Response;
  model: string;
}

/**
 * generateContent çağrısı; model kapatılmış/bulunamamışsa (404) uygun modele geçip bir kez yeniden
 * dener. Çalışan model anahtar için hatırlanır. Dönen yanıt başarısızsa çağıran hata mesajını işler.
 */
export async function generateContentWithFallback(apiKey: string, body: unknown): Promise<GeminiCallResult> {
  const send = (model: string) => fetch(`${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const first = getModelForKey(apiKey);
  const response = await send(first);
  if (response.ok || response.status !== 404) {
    if (response.ok && first !== readCache()[keyFingerprint(apiKey)]) rememberModel(apiKey, first);
    return { response, model: first };
  }

  // 404: model bu anahtar için yok/kapatıldı → yeni model bul
  let detail = '';
  try { detail = (await response.clone().json())?.error?.message || ''; } catch { /* ignore */ }
  let next = suggestedModelFromError(detail, first);
  if (!next) next = pickBestModel(await listModels(apiKey));
  if (!next || next === first) return { response, model: first };

  const retry = await send(next);
  if (retry.ok) rememberModel(apiKey, next);
  else if (retry.status === 404) {
    // Önerilen ad da yoksa listedeki en iyi modeli son kez dene
    const listed = pickBestModel(await listModels(apiKey));
    if (listed && listed !== next && listed !== first) {
      const last = await send(listed);
      if (last.ok) rememberModel(apiKey, listed);
      return { response: last, model: listed };
    }
  }
  return { response: retry, model: next };
}
