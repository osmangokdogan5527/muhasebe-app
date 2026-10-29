/**
 * Storm Ön Muhasebe - Gemini Sohbet Motoru (function calling)
 *
 * Akış: kullanıcı mesajı → Gemini → araç çağrıları. Okuma araçları hemen çalışır ve
 * sonucu modele geri verilir. Yazma araçları için motor durur ve onay bekleyen işlemleri
 * döndürür; kullanıcı onaylayınca/iptal edince resumeAgent ile kaldığı yerden devam edilir.
 * Model: gemini-2.5-flash (ücretsiz katmanda kullanılabilir).
 */
import {
  AiTool, AiToolContext, AiChart, PreparedWrite,
  getAvailableTools, toFunctionDeclarations, checkToolPermission
} from './aiTools';
import { getTodayISO } from '../utils/dateUtils';
import { logError } from '../utils/errorLogger';

export const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_STEPS = 8; // Bir kullanıcı mesajı için en fazla model turu
const MAX_HISTORY = 40; // Bağlam şişmesin diye tutulan en fazla içerik sayısı

export type GeminiContent = { role: 'user' | 'model'; parts: any[] };

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

async function callGemini(apiKey: string, contents: GeminiContent[], tools: AiTool[], ctx: AiToolContext): Promise<GeminiContent> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemInstruction(ctx) }] },
      contents,
      tools: [{ functionDeclarations: toFunctionDeclarations(tools) }],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error?.message || ''; } catch (e) { /* ignore */ }
    if (response.status === 429) throw new GeminiApiError('Ücretsiz kullanım limitine ulaşıldı. Lütfen bir dakika bekleyip tekrar deneyin.', 429);
    if (response.status === 400 && /api key/i.test(detail)) throw new GeminiApiError('Gemini API anahtarı geçersiz. Ayarlar > Yapay Zeka bölümünden kontrol edin.', 400);
    if (response.status === 403) throw new GeminiApiError('Gemini API anahtarının bu modele erişim izni yok. Ayarlar > Yapay Zeka bölümünden kontrol edin.', 403);
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
async function loop(apiKey: string, history: GeminiContent[], ctx: AiToolContext, texts: string[], charts: AiChart[]): Promise<AgentResult> {
  const tools = getAvailableTools(ctx.permissions);
  for (let step = 0; step < MAX_STEPS; step++) {
    const modelContent = await callGemini(apiKey, history, tools, ctx);
    history.push(modelContent);

    modelContent.parts.forEach(part => {
      if (typeof part.text === 'string' && part.text.trim() && !part.thought) texts.push(part.text.trim());
    });
    const calls = modelContent.parts.filter(part => part.functionCall).map(part => part.functionCall);
    if (calls.length === 0) {
      return { history: trimHistory(history), texts, charts };
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
      return { history, texts, charts, suspension: { responses, pending } };
    }
    history.push({ role: 'user', parts: responses.map(r => ({ functionResponse: { name: r.name, response: r.response } })) });
  }
  texts.push('İşlem çok fazla adım gerektirdi. Lütfen isteğinizi daha küçük parçalara bölün.');
  return { history: trimHistory(history), texts, charts };
}

/** Yeni bir kullanıcı mesajı (metin ve/veya ses) ile sohbeti sürdürür. */
export async function runAgent(apiKey: string, history: GeminiContent[], userParts: any[], ctx: AiToolContext): Promise<AgentResult> {
  const nextHistory = [...history, { role: 'user' as const, parts: userParts }];
  return loop(apiKey, nextHistory, ctx, [], []);
}

/**
 * Onay bekleyen işlemler için kullanıcının kararını uygular ve sohbeti sürdürür.
 * approved=true ise işlemler sırayla kaydedilir; biri hata verirse sonrakiler yapılmaz.
 */
export async function resumeAgent(
  apiKey: string,
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
  const result = await loop(apiKey, nextHistory, ctx, [], []);
  return { ...result, executionResults };
}
