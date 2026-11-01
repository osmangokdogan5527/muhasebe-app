import React, { useRef, useState } from 'react';
import { logError } from '../../utils/errorLogger';
import { parseLocaleNumber } from '../../utils/excelParser';

/**
 * Miktar kutusu (telefon hızlı satış ve masaüstü kasa): dokununca rakam klavyesi açılır, mevcut değer seçili gelir; 200 gibi
 * büyük miktarlar tek tek basmadan yazılır; toplam yazdıkça güncellenir.
 * Ondalık kabul edilir: 1,80 metre, 1,5 kg. Türkçe yazımda nokta binliktir: "1.000" = bin, "2.500" = iki bin beş yüz;
 * tek başına "1.5" / "0.250" ondalık okunur (parseLocaleNumber). Boş/0 yazılırsa eski değer geri gelir; Esc yazmadan önceki miktara döner.
 */
export interface QuantityInputProps {
  value: number;
  onCommit: (value: number) => void;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({ value, onCommit, label, className, style, title }) => {
  const [draft, setDraft] = useState<string | null>(null);
  // Odaktan sonra yazı yazıldı mı? (gecikmeli yeniden seçim yazılanı seçip ezmesin)
  const typedRef = useRef(false);
  // Esc ile dönülecek, odaklanmadan önceki miktar
  const originalRef = useRef(value);
  // Esc sonrası gelen blur, vazgeçilen değeri yeniden yazmasın
  const cancelledRef = useRef(false);
  const parse = (text: string): number => parseLocaleNumber(text);
  const shown = draft ?? String(value).replace('.', ',');
  const commit = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setDraft(null);
      return;
    }
    if (draft === null) return;
    try {
      const parsed = parse(draft);
      if (Number.isFinite(parsed) && parsed > 0) onCommit(parsed);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'QuantityInput.commit');
    }
    setDraft(null);
  };
  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      aria-label={label}
      value={shown}
      onFocus={(e) => {
        const initial = String(value).replace('.', ',');
        const el = e.target;
        typedRef.current = false;
        originalRef.current = value;
        setDraft(initial);
        el.select();
        // Bazı telefon tarayıcıları seçimi odaktan hemen sonra bozar: henüz hiç yazılmadıysa yeniden seç
        // (değer kontrolü yetmez: "1" iken "1" yazılırsa değer aynı kalır ve yazılan seçilip ezilirdi)
        requestAnimationFrame(() => { if (!typedRef.current && document.activeElement === el) el.select(); });
      }}
      onChange={(e) => {
        typedRef.current = true;
        const next = e.target.value.replace(/[^0-9.,]/g, '').slice(0, 9);
        setDraft(next);
        // Toplam yazdıkça güncellenir; geçersiz/boş ara değerlerde son geçerli miktar kalır
        const parsed = parse(next);
        if (next && Number.isFinite(parsed) && parsed > 0) onCommit(parsed);
      }}
      onBlur={commit}
      // Değer aynı kalsa bile ("1" iken "1") yazmaya başlandığı tuş/giriş olayından anlaşılır
      onBeforeInput={() => { typedRef.current = true; }}
      onKeyDown={(e) => { typedRef.current = true; if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') {
          // Yazarken toplam canlı güncellendiği için vazgeçince eski miktar geri yazılır
          e.preventDefault();
          cancelledRef.current = true;
          setDraft(null);
          if (originalRef.current !== value) onCommit(originalRef.current);
          (e.target as HTMLInputElement).blur();
        } }}
      className={className}
      style={style}
      title={title}
    />
  );
};
