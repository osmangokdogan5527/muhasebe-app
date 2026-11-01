import React, { useRef, useState } from 'react';
import { logError } from '../../utils/errorLogger';

/**
 * Miktar kutusu (telefon hızlı satış ve masaüstü kasa): dokununca rakam klavyesi açılır, mevcut değer seçili gelir; 200 gibi
 * büyük miktarlar tek tek basmadan yazılır; toplam yazdıkça güncellenir.
 * Ondalık kabul edilir: 1,80 metre, 1,5 kg (virgül ya da nokta). Boş/0 yazılırsa eski değer geri gelir.
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
  const shown = draft ?? String(value).replace('.', ',');
  const commit = () => {
    if (draft === null) return;
    try {
      const parsed = Number(draft.replace(/\s/g, '').replace(',', '.'));
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
        const parsed = Number(next.replace(',', '.'));
        if (next && Number.isFinite(parsed) && parsed > 0) onCommit(parsed);
      }}
      onBlur={commit}
      // Değer aynı kalsa bile ("1" iken "1") yazmaya başlandığı tuş/giriş olayından anlaşılır
      onBeforeInput={() => { typedRef.current = true; }}
      onKeyDown={(e) => { typedRef.current = true; if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
      className={className}
      style={style}
      title={title}
    />
  );
};
