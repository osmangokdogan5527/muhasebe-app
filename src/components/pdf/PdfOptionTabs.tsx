/**
 * PDF penceresindeki küçük seçenek düğmeleri (ör. "80 mm / 58 mm", "A4 Fatura / Fiş").
 */
import React from 'react';

export interface PdfOptionTabsProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function PdfOptionTabs<T extends string>({ label, value, options, onChange }: PdfOptionTabsProps<T>) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {label && <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</span>}
      <div className="inline-flex p-1 rounded-xl border border-white/10" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              style={active ? { backgroundColor: 'var(--accent-600, #0284c7)', color: '#ffffff' } : { color: '#cbd5e1' }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
