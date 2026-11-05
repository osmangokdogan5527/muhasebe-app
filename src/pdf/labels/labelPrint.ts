/**
 * Etiket yazıcısına doğrudan basım (yalnızca masaüstü uygulaması, rulo etiket).
 *
 * Etiketler PDF yerine vektörel SVG sayfaları olarak hazırlanır ve Windows yazdırma penceresi
 * açılmadan seçilen yazıcıya, etiket ölçüsünde ve %100 ölçekle gönderilir. Önizlemeyle aynı
 * yerleşim motoru ve yazı tipi kullanıldığı için basılan etiket ekrandakiyle aynıdır.
 */
import { Stock } from '../../types';
import { logError } from '../../utils/errorLogger';
import { LabelSettings } from './labelSettings';
import { LabelElement, computeLabelLayout, productFromStock } from './labelLayout';
import { LabelPrintItem, MAX_LABELS_PER_PDF } from './labelPdf';
import { canvasMeasure, embeddedFontCss, labelSvgBody, loadLabelFonts } from './labelSvg';

export interface LabelPrinter {
  name: string;
  displayName: string;
  isDefault: boolean;
}

interface ElectronLabelApi {
  listPrinters?: () => Promise<{ success: boolean; printers?: LabelPrinter[]; error?: string }>;
  printLabelHtml?: (job: { html: string; deviceName: string; widthMm: number; heightMm: number }) => Promise<{ success: boolean; error?: string }>;
}

const api = (): ElectronLabelApi | null => {
  try {
    return ((window as any).electronAPI as ElectronLabelApi) || null;
  } catch {
    return null;
  }
};

/** Doğrudan basım bu cihazda kullanılabilir mi (masaüstü uygulaması) */
export function canPrintLabelsDirectly(): boolean {
  const a = api();
  return !!(a?.listPrinters && a?.printLabelHtml);
}

// ---------------- Yazıcı tercihi (cihaza özel) ----------------

const PREF_KEY = 'storm_label_printer';

export interface LabelPrinterPref {
  deviceName: string;
  /** Sürücü etiketi yan basıyorsa 90° döndürülür */
  rotate: boolean;
}

export function readLabelPrinterPref(): LabelPrinterPref {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return { deviceName: typeof parsed.deviceName === 'string' ? parsed.deviceName : '', rotate: parsed.rotate === true };
  } catch {
    return { deviceName: '', rotate: false };
  }
}

export function saveLabelPrinterPref(pref: LabelPrinterPref) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(pref));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'labelPrint.savePref');
  }
}

export async function listLabelPrinters(): Promise<LabelPrinter[]> {
  const a = api();
  if (!a?.listPrinters) return [];
  const res = await a.listPrinters();
  if (!res?.success) throw new Error(res?.error || 'Yazıcılar okunamadı.');
  return Array.isArray(res.printers) ? res.printers : [];
}

// ---------------- Yazdırma sayfası ----------------

/** Her etiket bir sayfa; döndürme açıksa sayfa yan çevrilir ve etiket 90° döndürülür */
export async function buildLabelPrintHtml(items: LabelPrintItem[], settings: LabelSettings, firmName: string, rotate: boolean): Promise<{ html: string; count: number; pageWidthMm: number; pageHeightMm: number }> {
  await loadLabelFonts();
  const W = settings.widthMm;
  const H = settings.heightMm;
  const queue: Stock[] = [];
  items.forEach(({ stock, copies }) => {
    const n = Math.max(0, Math.floor(copies));
    for (let i = 0; i < n && queue.length < MAX_LABELS_PER_PDF; i += 1) queue.push(stock);
  });
  if (queue.length === 0) throw new Error('Basılacak etiket yok.');

  // Aynı ürünün kopyaları için SVG bir kez üretilir
  const cache = new Map<string, string>();
  const svgFor = (stock: Stock) => {
    const key = stock.id || stock.code || stock.name;
    let svg = cache.get(key);
    if (!svg) {
      const elements: LabelElement[] = computeLabelLayout(productFromStock(stock, settings), settings, firmName, canvasMeasure);
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm">${labelSvgBody(elements)}</svg>`;
      cache.set(key, svg);
    }
    return svg;
  };

  const pageW = rotate ? H : W;
  const pageH = rotate ? W : H;
  const labelStyle = rotate
    ? `position:absolute;left:0;top:0;width:${W}mm;height:${H}mm;transform-origin:0 0;transform:translateX(${H}mm) rotate(90deg);`
    : `position:absolute;left:0;top:0;width:${W}mm;height:${H}mm;`;
  const pages = queue.map((stock) => `<div class="page"><div style="${labelStyle}">${svgFor(stock)}</div></div>`).join('');
  const fontCss = await embeddedFontCss();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiket</title><style>
${fontCss}
@page { size: ${pageW}mm ${pageH}mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
.page { position: relative; width: ${pageW}mm; height: ${pageH}mm; overflow: hidden; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
svg { display: block; width: ${W}mm; height: ${H}mm; shape-rendering: crispEdges; text-rendering: geometricPrecision; }
</style></head><body>${pages}</body></html>`;
  return { html, count: queue.length, pageWidthMm: pageW, pageHeightMm: pageH };
}

/** Etiketleri seçili yazıcıya gönderir (Windows penceresi açılmaz) */
export async function printLabelsDirectly(items: LabelPrintItem[], settings: LabelSettings, firmName: string, pref: LabelPrinterPref): Promise<number> {
  const a = api();
  if (!a?.printLabelHtml) throw new Error('Doğrudan basım yalnızca masaüstü uygulamasında kullanılabilir.');
  if (!pref.deviceName) throw new Error('Önce etiket yazıcısını seçin.');
  const { html, count, pageWidthMm, pageHeightMm } = await buildLabelPrintHtml(items, settings, firmName, pref.rotate);
  const res = await a.printLabelHtml({ html, deviceName: pref.deviceName, widthMm: pageWidthMm, heightMm: pageHeightMm });
  if (!res?.success) throw new Error(res?.error || 'Yazıcıya gönderilemedi.');
  return count;
}
