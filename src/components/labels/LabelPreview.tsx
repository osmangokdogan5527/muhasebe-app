/**
 * Etiketin canlı önizlemesi (SVG). PDF ile aynı yerleşim motorunu ve aynı yazı tipini (Inter)
 * kullandığı için ekranda görülen etiket basılan etiketle aynıdır.
 */
import React, { useEffect, useMemo, useState } from 'react';
import interRegularUrl from '../../pdf/fonts/Inter-Regular.ttf?url';
import interSemiBoldUrl from '../../pdf/fonts/Inter-SemiBold.ttf?url';
import interBoldUrl from '../../pdf/fonts/Inter-Bold.ttf?url';
import { LabelSettings } from '../../pdf/labels/labelSettings';
import { LabelElement, LabelProduct, MeasureText, computeLabelLayout } from '../../pdf/labels/labelLayout';
import { logError } from '../../utils/errorLogger';

const PREVIEW_FONT = 'StormLabelInter';
const PT_TO_MM = 0.3528;
const PX_TO_MM = 25.4 / 96;
const WEIGHT = { normal: 400, semibold: 600, bold: 700 } as const;

let fontsPromise: Promise<void> | null = null;
function loadPreviewFonts(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      if (typeof FontFace === 'undefined' || !document.fonts) return;
      const faces = [
        new FontFace(PREVIEW_FONT, `url(${interRegularUrl})`, { weight: '400' }),
        new FontFace(PREVIEW_FONT, `url(${interSemiBoldUrl})`, { weight: '600' }),
        new FontFace(PREVIEW_FONT, `url(${interBoldUrl})`, { weight: '700' }),
      ];
      await Promise.all(faces.map(async (face) => {
        await face.load();
        document.fonts.add(face);
      }));
    })().catch((err) => {
      fontsPromise = null;
      logError(err instanceof Error ? err : new Error(String(err)), 'LabelPreview.loadFonts');
    });
  }
  return fontsPromise;
}

let measureContext: CanvasRenderingContext2D | null = null;
const canvasMeasure: MeasureText = (text, sizePt, weight) => {
  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  if (!measureContext) return text.length * sizePt * PT_TO_MM * 0.55;
  const sizePx = (sizePt * 96) / 72;
  measureContext.font = `${WEIGHT[weight]} ${sizePx}px ${PREVIEW_FONT}, sans-serif`;
  return measureContext.measureText(text).width * PX_TO_MM;
};

function qrPath(el: Extract<LabelElement, { kind: 'qr' }>): string {
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

export interface LabelPreviewProps {
  product: LabelProduct;
  settings: LabelSettings;
  firmName: string;
  className?: string;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ product, settings, firmName, className = '' }) => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreviewFonts().then(() => { if (active) setFontsReady(true); });
    return () => { active = false; };
  }, []);

  const elements = useMemo(
    () => computeLabelLayout(product, settings, firmName, canvasMeasure),
    // fontsReady: yazı tipi yüklenince ölçüler yeniden hesaplanır
    [product, settings, firmName, fontsReady],
  );

  const W = settings.widthMm;
  const H = settings.heightMm;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ width: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, backgroundColor: '#ffffff', borderRadius: 4, boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}
      role="img"
      aria-label={`${product.name} etiket önizlemesi`}
    >
      {elements.map((el, index) => {
        if (el.kind === 'border') {
          return <rect key={index} x={el.x} y={el.y} width={el.w} height={el.h} rx={1} fill="none" stroke="#969696" strokeWidth={0.15} />;
        }
        if (el.kind === 'text') {
          return (
            <text
              key={index}
              x={el.x}
              y={el.y}
              fontFamily={`${PREVIEW_FONT}, sans-serif`}
              fontWeight={WEIGHT[el.weight]}
              fontSize={el.sizePt * PT_TO_MM}
              textAnchor={el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle'}
              fill="#000000"
            >
              {el.text}
            </text>
          );
        }
        if (el.kind === 'barcode') {
          const module = el.w / el.moduleCount;
          return (
            <g key={index} fill="#000000">
              {el.runs.map(([start, length], i) => (
                <rect key={i} x={el.x + start * module} y={el.y} width={length * module} height={el.h} />
              ))}
            </g>
          );
        }
        return <path key={index} d={qrPath(el)} fill="#000000" />;
      })}
    </svg>
  );
};
