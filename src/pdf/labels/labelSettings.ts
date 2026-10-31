/**
 * Etiket tasarımı ayarları: ölçü (rulo ya da A4 sayfada çoklu), içerik ve yazı boyutu.
 * Firmaya ortak saklanır (Firestore: users/{firma}/ayarlar/etiketTasarimi).
 */

export type LabelLayoutMode = 'roll' | 'sheet';
export type LabelFontScale = 'small' | 'normal' | 'large';
export type LabelQrContent = 'code' | 'info' | 'custom';
export type LabelPriceMode = 'withTax' | 'withoutTax';

export interface LabelSheet {
  columns: number;
  rows: number;
  marginTopMm: number;
  marginLeftMm: number;
  gapXMm: number;
  gapYMm: number;
}

export interface LabelSettings {
  presetId: string;
  mode: LabelLayoutMode;
  widthMm: number;
  heightMm: number;
  sheet: LabelSheet;
  showFirmName: boolean;
  showName: boolean;
  showPrice: boolean;
  priceMode: LabelPriceMode;
  showCode: boolean;
  showUnit: boolean;
  showBarcode: boolean;
  showBarcodeText: boolean;
  showQr: boolean;
  qrContent: LabelQrContent;
  qrCustomText: string;
  fontScale: LabelFontScale;
  showBorder: boolean;
}

export interface LabelPreset {
  id: string;
  name: string;
  mode: LabelLayoutMode;
  widthMm: number;
  heightMm: number;
  sheet?: LabelSheet;
}

const NO_SHEET: LabelSheet = { columns: 1, rows: 1, marginTopMm: 0, marginLeftMm: 0, gapXMm: 0, gapYMm: 0 };

export const LABEL_PRESETS: LabelPreset[] = [
  { id: 'roll-40x20', name: 'Rulo 40 × 20 mm', mode: 'roll', widthMm: 40, heightMm: 20 },
  { id: 'roll-50x25', name: 'Rulo 50 × 25 mm', mode: 'roll', widthMm: 50, heightMm: 25 },
  { id: 'roll-50x30', name: 'Rulo 50 × 30 mm', mode: 'roll', widthMm: 50, heightMm: 30 },
  { id: 'roll-58x40', name: 'Rulo 58 × 40 mm', mode: 'roll', widthMm: 58, heightMm: 40 },
  { id: 'roll-60x40', name: 'Rulo 60 × 40 mm', mode: 'roll', widthMm: 60, heightMm: 40 },
  { id: 'roll-100x50', name: 'Rulo 100 × 50 mm (raf etiketi)', mode: 'roll', widthMm: 100, heightMm: 50 },
  { id: 'a4-21', name: 'A4 21\'li (70 × 42,3 mm)', mode: 'sheet', widthMm: 70, heightMm: 42.3, sheet: { columns: 3, rows: 7, marginTopMm: 0, marginLeftMm: 0, gapXMm: 0, gapYMm: 0 } },
  { id: 'a4-24', name: 'A4 24\'lü (70 × 37 mm)', mode: 'sheet', widthMm: 70, heightMm: 37, sheet: { columns: 3, rows: 8, marginTopMm: 0.5, marginLeftMm: 0, gapXMm: 0, gapYMm: 0 } },
  { id: 'a4-40', name: 'A4 40\'lı (52,5 × 29,7 mm)', mode: 'sheet', widthMm: 52.5, heightMm: 29.7, sheet: { columns: 4, rows: 10, marginTopMm: 0, marginLeftMm: 0, gapXMm: 0, gapYMm: 0 } },
  { id: 'a4-65', name: 'A4 65\'li (38,1 × 21,2 mm)', mode: 'sheet', widthMm: 38.1, heightMm: 21.2, sheet: { columns: 5, rows: 13, marginTopMm: 10.7, marginLeftMm: 4.75, gapXMm: 2.5, gapYMm: 0 } },
];

export const CUSTOM_PRESET_ID = 'custom';

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  presetId: 'roll-50x30',
  mode: 'roll',
  widthMm: 50,
  heightMm: 30,
  sheet: NO_SHEET,
  showFirmName: false,
  showName: true,
  showPrice: true,
  priceMode: 'withTax',
  showCode: true,
  showUnit: false,
  showBarcode: true,
  showBarcodeText: true,
  showQr: false,
  qrContent: 'code',
  qrCustomText: '',
  fontScale: 'normal',
  showBorder: false,
};

export const A4_WIDTH = 210;
export const A4_HEIGHT = 297;

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
};

function normalizeSheet(raw: any, widthMm: number, heightMm: number): LabelSheet {
  const source = raw || {};
  const sheet: LabelSheet = {
    columns: Math.round(clampNumber(source.columns, 1, 10, 1)),
    rows: Math.round(clampNumber(source.rows, 1, 30, 1)),
    marginTopMm: clampNumber(source.marginTopMm, 0, 50, 0),
    marginLeftMm: clampNumber(source.marginLeftMm, 0, 50, 0),
    gapXMm: clampNumber(source.gapXMm, 0, 20, 0),
    gapYMm: clampNumber(source.gapYMm, 0, 20, 0),
  };
  // Sayfaya sığmayan sütun/satır sayısı düşürülür
  while (sheet.columns > 1 && sheet.marginLeftMm + sheet.columns * widthMm + (sheet.columns - 1) * sheet.gapXMm > A4_WIDTH + 0.01) sheet.columns -= 1;
  while (sheet.rows > 1 && sheet.marginTopMm + sheet.rows * heightMm + (sheet.rows - 1) * sheet.gapYMm > A4_HEIGHT + 0.01) sheet.rows -= 1;
  return sheet;
}

export function normalizeLabelSettings(raw: Partial<LabelSettings> | Record<string, any> | null | undefined): LabelSettings {
  const s = { ...DEFAULT_LABEL_SETTINGS, ...((raw || {}) as Record<string, any>) };
  const mode: LabelLayoutMode = s.mode === 'sheet' ? 'sheet' : 'roll';
  const widthMm = clampNumber(s.widthMm, 15, mode === 'sheet' ? A4_WIDTH : 150, DEFAULT_LABEL_SETTINGS.widthMm);
  const heightMm = clampNumber(s.heightMm, 10, mode === 'sheet' ? A4_HEIGHT : 150, DEFAULT_LABEL_SETTINGS.heightMm);
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    presetId: typeof s.presetId === 'string' ? s.presetId : CUSTOM_PRESET_ID,
    mode,
    widthMm,
    heightMm,
    sheet: mode === 'sheet' ? normalizeSheet(s.sheet, widthMm, heightMm) : NO_SHEET,
    showFirmName: bool(s.showFirmName, DEFAULT_LABEL_SETTINGS.showFirmName),
    showName: bool(s.showName, true),
    showPrice: bool(s.showPrice, true),
    priceMode: s.priceMode === 'withoutTax' ? 'withoutTax' : 'withTax',
    showCode: bool(s.showCode, true),
    showUnit: bool(s.showUnit, false),
    showBarcode: bool(s.showBarcode, true),
    showBarcodeText: bool(s.showBarcodeText, true),
    showQr: bool(s.showQr, false),
    qrContent: s.qrContent === 'info' || s.qrContent === 'custom' ? s.qrContent : 'code',
    qrCustomText: typeof s.qrCustomText === 'string' ? s.qrCustomText.slice(0, 300) : '',
    fontScale: s.fontScale === 'small' || s.fontScale === 'large' ? s.fontScale : 'normal',
    showBorder: bool(s.showBorder, false),
  };
}

/** Hazır ölçü seçildiğinde ayarlara uygular. */
export function applyPreset(settings: LabelSettings, presetId: string): LabelSettings {
  const preset = LABEL_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { ...settings, presetId: CUSTOM_PRESET_ID };
  return normalizeLabelSettings({
    ...settings,
    presetId: preset.id,
    mode: preset.mode,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    sheet: preset.sheet || NO_SHEET,
  });
}

/** A4 sayfasında bir sayfaya kaç etiket sığar. */
export function labelsPerPage(settings: LabelSettings): number {
  return settings.mode === 'sheet' ? settings.sheet.columns * settings.sheet.rows : 1;
}
