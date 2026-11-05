/**
 * Storm Ön Muhasebe - Yapay Zeka Sohbet Motoru (function calling)
 *
 * Sağlayıcılar: Gemini (ana) ve yedek (Groq ücretsiz ya da ChatGPT). Biri kota doldurur ya da hata
 * verirse sıradakiyle devam edilir. Sohbet geçmişi Gemini biçiminde tutulur; Groq/ChatGPT'ye
 * gönderilirken çevrilir, onlardan gelen cevap da Gemini biçimine döndürülür.
 *
 * Akış: kullanıcı mesajı → Gemini → araç çağrıları. Okuma araçları hemen çalışır ve
 * sonucu modele geri verilir. Yazma araçları için motor durur ve onay bekleyen işlemleri
 * döndürür; kullanıcı onaylayınca/iptal edince resumeAgent ile kaldığı yerden devam edilir.
 * Model: anahtarın erişebildiği güncel "flash" modeli (bkz. geminiModel.ts); eski model
 * yeni anahtarlara kapatılırsa kendiliğinden yenisine geçilir.
 */
import {
  AiTool, AiToolContext, AiChart, PreparedWrite,
  getAvailableTools, toFunctionDeclarations, checkToolPermission
} from './aiTools';
import { getTodayISO } from '../utils/dateUtils';
import { logError } from '../utils/errorLogger';
import { DEFAULT_GEMINI_MODEL, generateContentWithFallback } from './geminiModel';
import {
  AiCredentials, AiProviderError, AiProviderId, CompatMessage, CompatTool, PROVIDER_LABELS, SecondaryProvider,
  callCompatChat, isProviderCoolingDown, markProviderLimited, providerOrder, shouldFallback, transcribeAudio,
} from './aiProviders';

/** Varsayılan model (çalışan model anahtar başına geminiModel.ts'de belirlenir) */
export const GEMINI_MODEL = DEFAULT_GEMINI_MODEL;
const MAX_STEPS = 8; // Bir kullanıcı mesajı için en fazla model turu
const MAX_HISTORY = 40; // Bağlam şişmesin diye tutulan en fazla içerik sayısı

/** origin 'compat': içerik Groq/ChatGPT'den geldi (Gemini'ye düz metin olarak gönderilir) */
export type GeminiContent = { role: 'user' | 'model'; parts: any[]; origin?: 'compat' };

export interface PendingWrite {
  callIndex: number;
  toolName: string;
  summary: string[];
  execute: PreparedWrite['execute'];
}

export interface AgentSuspension {
  // Bu turdaki tüm araç çağrılarının yanıtları (onay bekleyenler henüz boş)
  responses: { name: string; response: any }[];
  pending: PendingWrite[];
}

export interface AgentResult {
  history: GeminiContent[];
  texts: string[];
  charts: AiChart[];
  suspension?: AgentSuspension;
  /** Son cevabı veren sağlayıcı */
  provider?: AiProviderId;
  /** Sıradaki sağlayıcıya geçildiyse ilk denenen (kullanıcıya küçük not gösterilir) */
  fallbackFrom?: AiProviderId;
}

interface ModelTurn {
  content: GeminiContent;
  provider: AiProviderId;
  fallbackFrom?: AiProviderId;
}

export class GeminiApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildSystemInstruction(ctx: AiToolContext): string {
  const restricted = ctx.permissions.isRestricted
    ? `\nKullanıcı "Personel" rolünde ve güvenlik modu açık. Şu menülere ait işlemler yasak: ${ctx.permissions.sensitiveTabs.join(', ') || 'yok'}. Bu menülere ait bir şey istenirse yetkisi olmadığını, yönetici girişi gerektiğini söyle.`
    : '';
  return `Sen "Storm AI"sın: Storm Ön Muhasebe uygulamasının Türkçe konuşan muhasebe asistanısın. Bugünün tarihi: ${getTodayISO()} (tarihler YYYY-MM-DD).

Kurallar:
- Uygulamadaki her işi araçlarla yapabilirsin: arama, ekstre, rapor, kasa durumu, fatura, tahsilat/ödeme, masraf, personel, cari/ürün kartı, çek/senet, kasa hareketi/transfer, kayıt silme.
- Veriyi tahmin etme; önce okuma araçlarıyla bak. Rakamları araç sonuçlarından aynen aktar, kendin hesaplama yapma gerekiyorsa açıkça belirt.
- Kayıt oluşturan/değiştiren/silen araçları çağırdığında kullanıcı ekranda bir onay kartı görür ve onaylar. Bu yüzden "emin misiniz" diye ayrıca sorma; eksik bilgi yoksa doğrudan aracı çağır. Eksik zorunlu bilgi varsa (ör. hangi cari, tutar, ödeme hesabı) kısa bir soru sor.
- Cari, ürün veya personel adı birden fazla kayda uyuyorsa ya da bulunamıyorsa araç hata döner; seçenekleri kullanıcıya sun.
- KDV zorunlu değildir: kullanıcı belirtmediyse ürün kartındaki oranı kullan, kendiliğinden KDV ekleme.
- Peşin satış/alışta odeme_hesabi kasa/banka/pos; vadeli (veresiye) satışta acik_hesap kullan. Belirtilmemişse kullanıcıya sor.
- Bir araç "basarili: false" veya "hata" dönerse sebebini kullanıcıya açıkla.
- Kullanıcı bir işlemi iptal ederse tekrar deneme; ne yapmak istediğini sor.
- Uygun olduğunda (dağılım, karşılaştırma) grafik_goster ile grafik çiz.
- Cevapların kısa, net ve profesyonel olsun; para tutarlarını ₺ ile ve Türkçe biçimde yaz.${restricted}`;
}

/**
 * Gemini'ye gönderilecek geçmiş: Groq/ChatGPT'nin araç çağrıları ve sonuçları Gemini'nin
 * doğrulayamayacağı biçimde olduğundan düz metne çevrilir; ek alanlar (origin) gönderilmez.
 */
function toGeminiContents(history: GeminiContent[]): { role: 'user' | 'model'; parts: any[] }[] {
  const out: { role: 'user' | 'model'; parts: any[] }[] = [];
  let flattenResponses = false;
  for (const content of history) {
    if (content.role === 'model' && content.origin === 'compat') {
      const parts = content.parts
        .map((p) => (p.functionCall
          ? { text: `[Araç çağrısı: ${p.functionCall.name} ${JSON.stringify(p.functionCall.args || {})}]` }
          : { text: typeof p.text === 'string' ? p.text : '' }))
        .filter((p) => p.text);
      out.push({ role: 'model', parts: parts.length ? parts : [{ text: '…' }] });
      flattenResponses = content.parts.some((p) => p.functionCall);
      continue;
    }
    if (content.role === 'user' && flattenResponses) {
      out.push({
        role: 'user',
        parts: content.parts.map((p) => (p.functionResponse
          ? { text: `[Araç sonucu: ${p.functionResponse.name} ${JSON.stringify(p.functionResponse.response ?? null).slice(0, 6000)}]` }
          : p)),
      });
      flattenResponses = false;
      continue;
    }
    flattenResponses = false;
    out.push({ role: content.role, parts: content.parts });
  }
  return out;
}

async function callGemini(apiKey: string, history: GeminiContent[], tools: AiTool[], ctx: AiToolContext): Promise<GeminiContent> {
  const { response } = await generateContentWithFallback(apiKey, {
    systemInstruction: { parts: [{ text: buildSystemInstruction(ctx) }] },
    contents: toGeminiContents(history),
    tools: [{ functionDeclarations: toFunctionDeclarations(tools) }],
    toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    generationConfig: { temperature: 0.2 },
  });

  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error?.message || ''; } catch (e) { /* ignore */ }
    if (response.status === 429) throw new GeminiApiError('Ücretsiz kullanım limitine ulaşıldı. Lütfen bir dakika bekleyip tekrar deneyin.', 429);
    if (response.status === 400 && /api key/i.test(detail)) throw new GeminiApiError('Gemini API anahtarı geçersiz. Ayarlar > Yapay Zeka bölümünden kontrol edin.', 400);
    if (response.status === 403) throw new GeminiApiError('Gemini API anahtarının bu modele erişim izni yok. Ayarlar > Yapay Zeka bölümünden kontrol edin.', 403);
    if (response.status === 404) throw new GeminiApiError('Bu API anahtarıyla kullanılabilen bir Gemini modeli bulunamadı. Anahtarın Google AI Studio\'da etkin olduğunu kontrol edin.', 404);
    throw new GeminiApiError(`Yapay zeka isteği başarısız oldu (${response.status}). ${detail}`.trim(), response.status);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const content = candidate?.content;
  if (!content || !Array.isArray(content.parts)) {
    const reason = candidate?.finishReason || data?.promptFeedback?.blockReason || 'boş yanıt';
    throw new GeminiApiError(`Yapay zekadan yanıt alınamadı (${reason}). Lütfen isteğinizi farklı şekilde yazın.`, 500);
  }
  // Model içeriği olduğu gibi saklanır (Gemini 2.5'in düşünce imzaları bir sonraki istekte geri gönderilmelidir)
  return { role: 'model', parts: content.parts };
}

// ---------------- Groq / ChatGPT ----------------

/** Gemini şema türleri (OBJECT, STRING…) OpenAI biçiminde küçük harflidir */
function toJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(toJsonSchema);
  const out: any = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (key === 'type' && typeof value === 'string') out.type = value.toLowerCase();
    else if (key === 'required' && Array.isArray(value) && value.length === 0) return;
    else out[key] = toJsonSchema(value);
  });
  return out;
}

function toCompatTools(tools: AiTool[]): CompatTool[] {
  return tools.map((tool) => {
    const hasParams = tool.parameters && tool.parameters.properties && Object.keys(tool.parameters.properties).length > 0;
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: hasParams ? toJsonSchema(tool.parameters) : { type: 'object', properties: {} },
      },
    };
  });
}

/** Sesli mesajların yazıya çevrilmiş hâli (aynı ses tekrar tekrar gönderilmesin) */
const transcripts = new WeakMap<object, string>();

async function toCompatMessages(history: GeminiContent[], system: string, provider: SecondaryProvider, key: string): Promise<CompatMessage[]> {
  const messages: CompatMessage[] = [{ role: 'system', content: system }];
  let callIds: string[] = [];
  for (let i = 0; i < history.length; i++) {
    const content = history[i];
    if (content.role === 'model') {
      const text = content.parts.filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('\n').trim();
      const calls = content.parts.filter((p) => p.functionCall);
      callIds = calls.map((_, j) => `call_${i}_${j}`);
      messages.push({
        role: 'assistant',
        content: text || (calls.length ? null : '…'),
        ...(calls.length ? {
          tool_calls: calls.map((p, j) => ({ id: callIds[j], type: 'function' as const, function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args || {}) } })),
        } : {}),
      });
      continue;
    }
    const responses = content.parts.filter((p) => p.functionResponse);
    responses.forEach((p, j) => {
      messages.push({ role: 'tool', tool_call_id: callIds[j] || `call_${i}_${j}`, content: JSON.stringify(p.functionResponse.response ?? null) });
    });
    if (responses.length) callIds = [];
    const texts: string[] = [];
    for (const part of content.parts) {
      if (typeof part.text === 'string' && part.text.trim()) texts.push(part.text);
      else if (part.inlineData?.data) {
        let transcript = transcripts.get(part);
        if (transcript === undefined) {
          transcript = await transcribeAudio(provider, key, part.inlineData.data, part.inlineData.mimeType || 'audio/webm');
          transcripts.set(part, transcript);
        }
        texts.push(`[Sesli mesaj, yazıya çevrildi]: ${transcript || '(anlaşılamadı)'}`);
      }
    }
    if (texts.length) messages.push({ role: 'user', content: texts.join('\n') });
  }
  return messages;
}

async function callCompat(provider: SecondaryProvider, key: string, history: GeminiContent[], tools: AiTool[], ctx: AiToolContext): Promise<GeminiContent> {
  const messages = await toCompatMessages(history, buildSystemInstruction(ctx), provider, key);
  const reply = await callCompatChat(provider, key, messages, toCompatTools(tools));
  const parts: any[] = [];
  if (reply.text.trim()) parts.push({ text: reply.text.trim() });
  reply.toolCalls.forEach((call) => parts.push({ functionCall: { name: call.name, args: call.args || {} } }));
  if (parts.length === 0) throw new AiProviderError(`${PROVIDER_LABELS[provider]} boş yanıt döndü.`, 500, provider);
  return { role: 'model', parts, origin: 'compat' };
}

/**
 * Sağlayıcıları sırayla dener. Kotası dolan sağlayıcı bir dakika sona alınır. Hepsi başarısızsa
 * kullanıcıya her birinin sebebi gösterilir.
 */
async function callModel(creds: AiCredentials, history: GeminiContent[], tools: AiTool[], ctx: AiToolContext): Promise<ModelTurn> {
  const configured = providerOrder(creds);
  if (configured.length === 0) throw new AiProviderError('Yapay zeka anahtarı girilmemiş. Ayarlar > Yapay Zeka bölümünden ekleyin.', 400, 'gemini');
  const ordered = [...configured.filter((p) => !isProviderCoolingDown(p)), ...configured.filter((p) => isProviderCoolingDown(p))];
  const errors: { provider: AiProviderId; error: unknown }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const provider = ordered[i];
    try {
      const content = provider === 'gemini'
        ? await callGemini(creds.geminiKey, history, tools, ctx)
        : await callCompat(provider, creds.secondaryKey, history, tools, ctx);
      return { content, provider, fallbackFrom: provider !== configured[0] ? configured[0] : undefined };
    } catch (err) {
      const status = (err as any)?.status;
      if (status === 429) markProviderLimited(provider);
      logError(err instanceof Error ? err : new Error(String(err)), `aiAgent.callModel:${provider}`);
      errors.push({ provider, error: err });
      if (!shouldFallback(err) || i === ordered.length - 1) break;
    }
  }
  if (errors.length === 1) throw errors[0].error;
  const message = errors
    .map(({ provider, error }) => `${PROVIDER_LABELS[provider]}: ${error instanceof Error ? error.message : String(error)}`)
    .join('\n');
  throw new AiProviderError(message, (errors[0].error as any)?.status || 500, errors[0].provider);
}

function trimHistory(history: GeminiContent[]): GeminiContent[] {
  if (history.length <= MAX_HISTORY) return history;
  let trimmed = history.slice(history.length - MAX_HISTORY);
  // Geçmiş bir kullanıcı metni ile başlamalı (araç yanıtı veya model turu ile başlarsa model hata verir)
  const firstUserText = trimmed.findIndex(c => c.role === 'user' && c.parts.some(p => typeof p.text === 'string' || p.inlineData));
  if (firstUserText > 0) trimmed = trimmed.slice(firstUserText);
  return trimmed;
}

/**
 * Model turlarını, onay gerektiren bir işlem çıkana ya da metin cevabı gelene kadar sürdürür.
 */
async function loop(creds: AiCredentials, history: GeminiContent[], ctx: AiToolContext, texts: string[], charts: AiChart[]): Promise<AgentResult> {
  const tools = getAvailableTools(ctx.permissions);
  let provider: AiProviderId | undefined;
  let fallbackFrom: AiProviderId | undefined;
  for (let step = 0; step < MAX_STEPS; step++) {
    const turn = await callModel(creds, history, tools, ctx);
    const modelContent = turn.content;
    provider = turn.provider;
    fallbackFrom = fallbackFrom || turn.fallbackFrom;
    history.push(modelContent);

    modelContent.parts.forEach(part => {
      if (typeof part.text === 'string' && part.text.trim() && !part.thought) texts.push(part.text.trim());
    });
    const calls = modelContent.parts.filter(part => part.functionCall).map(part => part.functionCall);
    if (calls.length === 0) {
      return { history: trimHistory(history), texts, charts, provider, fallbackFrom };
    }

    const responses: { name: string; response: any }[] = [];
    const pending: PendingWrite[] = [];
    calls.forEach((call: any, index: number) => {
      const name = call.name;
      const args = call.args || {};
      const tool = tools.find(t => t.name === name);
      if (!tool) {
        responses.push({ name, response: { hata: `"${name}" adında bir araç yok veya bu kullanıcının yetkisi dışında.` } });
        return;
      }
      const deniedReason = checkToolPermission(tool, ctx);
      if (deniedReason) {
        responses.push({ name, response: { hata: deniedReason } });
        return;
      }
      try {
        if (tool.kind === 'read' && tool.run) {
          responses.push({ name, response: tool.run(args, ctx) });
        } else if (tool.kind === 'ui' && tool.chart) {
          const chart = tool.chart(args);
          if (chart.data.length > 0) charts.push(chart);
          responses.push({ name, response: { basarili: true, mesaj: 'Grafik kullanıcıya gösterildi.' } });
        } else if (tool.kind === 'write' && tool.prepare) {
          const prepared = tool.prepare(args, ctx);
          if ('error' in prepared) {
            responses.push({ name, response: { basarili: false, hata: prepared.error } });
          } else {
            responses.push({ name, response: null });
            pending.push({ callIndex: index, toolName: name, summary: prepared.summary, execute: prepared.execute });
          }
        } else {
          responses.push({ name, response: { hata: 'Araç çalıştırılamadı.' } });
        }
      } catch (err: any) {
        logError(err instanceof Error ? err : new Error(String(err)), `aiAgent.tool.${name}`);
        responses.push({ name, response: { basarili: false, hata: err?.message || 'Araç çalışırken hata oluştu.' } });
      }
    });

    if (pending.length > 0) {
      return { history, texts, charts, suspension: { responses, pending }, provider, fallbackFrom };
    }
    history.push({ role: 'user', parts: responses.map(r => ({ functionResponse: { name: r.name, response: r.response } })) });
  }
  texts.push('İşlem çok fazla adım gerektirdi. Lütfen isteğinizi daha küçük parçalara bölün.');
  return { history: trimHistory(history), texts, charts, provider, fallbackFrom };
}

/** Yeni bir kullanıcı mesajı (metin ve/veya ses) ile sohbeti sürdürür. */
export async function runAgent(creds: AiCredentials, history: GeminiContent[], userParts: any[], ctx: AiToolContext): Promise<AgentResult> {
  const nextHistory = [...history, { role: 'user' as const, parts: userParts }];
  return loop(creds, nextHistory, ctx, [], []);
}

/**
 * Onay bekleyen işlemler için kullanıcının kararını uygular ve sohbeti sürdürür.
 * approved=true ise işlemler sırayla kaydedilir; biri hata verirse sonrakiler yapılmaz.
 */
export async function resumeAgent(
  creds: AiCredentials,
  history: GeminiContent[],
  suspension: AgentSuspension,
  approved: boolean,
  ctx: AiToolContext
): Promise<AgentResult & { executionResults: { toolName: string; ok: boolean; message: string }[] }> {
  const responses = suspension.responses.map(r => ({ ...r }));
  const executionResults: { toolName: string; ok: boolean; message: string }[] = [];
  let failed = false;
  for (const item of suspension.pending) {
    if (!approved) {
      responses[item.callIndex].response = { basarili: false, iptal: true, mesaj: 'Kullanıcı bu işlemi onaylamadı, kayıt yapılmadı.' };
      continue;
    }
    if (failed) {
      responses[item.callIndex].response = { basarili: false, hata: 'Önceki işlem hata verdiği için bu işlem yapılmadı.' };
      continue;
    }
    try {
      const result = await item.execute();
      responses[item.callIndex].response = result;
      executionResults.push({ toolName: item.toolName, ok: true, message: result?.mesaj || 'Kaydedildi.' });
    } catch (err: any) {
      failed = true;
      logError(err instanceof Error ? err : new Error(String(err)), `aiAgent.execute.${item.toolName}`);
      const message = err?.message || 'Kayıt sırasında hata oluştu.';
      responses[item.callIndex].response = { basarili: false, hata: message };
      executionResults.push({ toolName: item.toolName, ok: false, message });
    }
  }
  const nextHistory: GeminiContent[] = [
    ...history,
    { role: 'user', parts: responses.map(r => ({ functionResponse: { name: r.name, response: r.response ?? { basarili: false } } })) },
  ];
  const result = await loop(creds, nextHistory, ctx, [], []);
  return { ...result, executionResults };
}
