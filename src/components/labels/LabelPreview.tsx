/**
 * Etiketin canlı önizlemesi (SVG). PDF ile aynı yerleşim motorunu ve aynı yazı tipini (Inter)
 * kullandığı için ekranda görülen etiket basılan etiketle aynıdır.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { LabelSettings } from '../../pdf/labels/labelSettings';
import { LabelProduct, computeLabelLayout } from '../../pdf/labels/labelLayout';
import { LABEL_FONT, LABEL_FONT_WEIGHT, PT_TO_MM, canvasMeasure, loadLabelFonts, qrPath } from '../../pdf/labels/labelSvg';

const PREVIEW_FONT = LABEL_FONT;
const WEIGHT = LABEL_FONT_WEIGHT;
const loadPreviewFonts = loadLabelFonts;

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
