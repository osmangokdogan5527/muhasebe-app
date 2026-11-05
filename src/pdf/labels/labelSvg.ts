/**
 * Etiketin SVG çizimi ve yazı tipi: hem ekrandaki canlı önizleme hem de etiket yazıcısına
 * doğrudan basım aynı yerleşimi ve aynı yazı tipini (Inter) kullanır.
 */
import interRegularUrl from '../fonts/Inter-Regular.ttf?url';
import interSemiBoldUrl from '../fonts/Inter-SemiBold.ttf?url';
import interBoldUrl from '../fonts/Inter-Bold.ttf?url';
import { logError } from '../../utils/errorLogger';
import type { LabelElement, MeasureText } from './labelLayout';

export const LABEL_FONT = 'StormLabelInter';
export const PT_TO_MM = 0.3528;
const PX_TO_MM = 25.4 / 96;
export const LABEL_FONT_WEIGHT = { normal: 400, semibold: 600, bold: 700 } as const;

const FONT_FILES: { url: string; weight: '400' | '600' | '700' }[] = [
  { url: interRegularUrl, weight: '400' },
  { url: interSemiBoldUrl, weight: '600' },
  { url: interBoldUrl, weight: '700' },
];

let fontsPromise: Promise<void> | null = null;

/** Yazı tiplerini sayfaya yükler (ölçümler ve önizleme için) */
export function loadLabelFonts(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      if (typeof FontFace === 'undefined' || !document.fonts) return;
      await Promise.all(FONT_FILES.map(async ({ url, weight }) => {
        const face = new FontFace(LABEL_FONT, `url(${url})`, { weight });
        await face.load();
        document.fonts.add(face);
      }));
    })().catch((err) => {
      fontsPromise = null;
      logError(err instanceof Error ? err : new Error(String(err)), 'labelSvg.loadFonts');
    });
  }
  return fontsPromise;
}

let measureContext: CanvasRenderingContext2D | null = null;

/** Yazı genişliği (mm), sayfadaki Inter yazı tipiyle */
export const canvasMeasure: MeasureText = (text, sizePt, weight) => {
  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  if (!measureContext) return text.length * sizePt * PT_TO_MM * 0.55;
  const sizePx = (sizePt * 96) / 72;
  measureContext.font = `${LABEL_FONT_WEIGHT[weight]} ${sizePx}px ${LABEL_FONT}, sans-serif`;
  return measureContext.measureText(text).width * PX_TO_MM;
};

export function qrPath(el: Extract<LabelElement, { kind: 'qr' }>): string {
  const m = el.size / el.qr.size;
  let d = '';
  for (let row = 0; row < el.qr.size; row += 1) {
    let start = -1;
    for (let col = 0; col <= el.qr.size; col += 1) {
      const dark = col < el.qr.size && el.qr.isDark(row, col);
      if (dark && start < 0) start = col;
      if (!dark && start >= 0) {
        d += `M${(el.x + start * m).toFixed(3)} ${(el.y + row * m).toFixed(3)}h${((col - start) * m + 0.01).toFixed(3)}v${(m + 0.01).toFixed(3)}h${(-(col - start) * m - 0.01).toFixed(3)}z`;
        start = -1;
      }
    }
  }
  return d;
}

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch] as string));

/** Bir etiketin SVG içeriği (mm biriminde; dış <svg> etiketi çağırana aittir) */
export function labelSvgBody(elements: LabelElement[]): string {
  return elements.map((el) => {
    if (el.kind === 'border') {
      return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="1" fill="none" stroke="#969696" stroke-width="0.15"/>`;
    }
    if (el.kind === 'text') {
      const anchor = el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle';
      return `<text x="${el.x}" y="${el.y}" font-family="${LABEL_FONT}, sans-serif" font-weight="${LABEL_FONT_WEIGHT[el.weight]}" font-size="${el.sizePt * PT_TO_MM}" text-anchor="${anchor}" fill="#000000">${escapeXml(el.text)}</text>`;
    }
    if (el.kind === 'barcode') {
      const module = el.w / el.moduleCount;
      const rects = el.runs.map(([start, length]) => `<rect x="${el.x + start * module}" y="${el.y}" width="${length * module}" height="${el.h}"/>`).join('');
      return `<g fill="#000000">${rects}</g>`;
    }
    return `<path d="${qrPath(el)}" fill="#000000"/>`;
  }).join('');
}

let fontCssPromise: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Yazdırma sayfasına gömülecek @font-face kuralları (dosya yollarına bağlı kalmaz) */
export function embeddedFontCss(): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = Promise.all(FONT_FILES.map(async ({ url, weight }) => (
      `@font-face{font-family:'${LABEL_FONT}';font-weight:${weight};src:url(${await toDataUrl(url)}) format('truetype');}`
    ))).then((rules) => rules.join('\n')).catch((err) => {
      fontCssPromise = null;
      throw err;
    });
  }
  return fontCssPromise;
}
