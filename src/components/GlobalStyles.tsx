import React from 'react';
import { globalStylesPart2 } from './GlobalStylesPart2';

interface GlobalStylesProps {
  bodyPatternSvg: string;
  activePattern: any;
  themeCssRules: string;
}

export const GlobalStyles: React.FC<GlobalStylesProps> = ({ themeCssRules, bodyPatternSvg, activePattern }) => {
    return (
      <style>{`
        :root {
          ${themeCssRules}
        }

        /* =====================================================================
           SIVI MESH (FLUID MESH) TASARIM STİLİ
           Koyu, derin bir zemin üzerinde temanın renginden türetilen yumuşak
           aurora; üzerinde sakin ve okunaklı buzlu cam yüzeyler.
           ===================================================================== */
        [data-design-style="fluid-mesh"] {
          color: #eef2ff !important;
          --mesh-surface: rgba(12, 14, 34, 0.36);
          --mesh-surface-strong: rgba(11, 13, 30, 0.82);
          --mesh-border: rgba(255, 255, 255, 0.085);
          --mesh-border-top: rgba(255, 255, 255, 0.16);
          --mesh-text-soft: #c7cfe2;
          --mesh-text-muted: #94a0bb;
        }

        [data-design-style="fluid-mesh"] body,
        [data-design-style="fluid-mesh"].bg-\\[\\#050505\\],
        body:has([data-design-style="fluid-mesh"]) {
          background: #04050c !important;
          color: #eef2ff !important;
        }

        /* --- Yüzeyler: buzlu cam kartlar --- */
        /* Cam kenar halkası için konum bağlamı (absolute/fixed/sticky öğelerin konumu korunur) */
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50):not(.absolute):not(.fixed):not(.sticky) {
          position: relative;
        }

        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) {
          background:
            radial-gradient(420px circle at var(--spot-x, -999px) var(--spot-y, -999px), rgba(var(--accent-rgb), 0.13), transparent 60%),
            linear-gradient(165deg, rgba(255, 255, 255, 0.065) 0%, rgba(255, 255, 255, 0.018) 45%, rgba(255, 255, 255, 0.01) 100%),
            var(--mesh-surface) !important;
          backdrop-filter: blur(22px) saturate(135%) !important;
          -webkit-backdrop-filter: blur(22px) saturate(135%) !important;
          border: 1px solid var(--mesh-border) !important;
          border-top-color: var(--mesh-border-top) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 12px 32px -14px rgba(0, 0, 0, 0.6) !important;
          color: #eef2ff !important;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease !important;
        }

        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50):hover {
          border-color: rgba(var(--accent-rgb), 0.28) !important;
          border-top-color: rgba(var(--accent-rgb), 0.4) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            0 0 0 1px rgba(var(--accent-rgb), 0.06),
            0 16px 42px -16px rgba(var(--accent-rgb), 0.38) !important;
        }

        /* Işıklı cam kenar: sol üstten parlayıp tema rengine dönen ince halka */
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50):not([class*="after:"]):not(.print-paper-sheet *)::after {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.06) 28%, transparent 55%, rgba(var(--accent-rgb), 0.22) 85%, rgba(var(--accent-rgb), 0.38) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.75;
          transition: opacity 0.35s ease;
        }
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50):not([class*="after:"]):not(.print-paper-sheet *):hover::after {
          opacity: 1;
        }

        /* Kart içindeki kartlar: daha hafif, ek bulanıklık yok (okunabilirlik ve performans) */
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50)::after {
          content: none;
        }
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) {
          background:
            radial-gradient(300px circle at var(--spot-x, -999px) var(--spot-y, -999px), rgba(var(--accent-rgb), 0.12), transparent 60%),
            rgba(255, 255, 255, 0.035) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          border-color: rgba(255, 255, 255, 0.07) !important;
        }
        [data-design-style="fluid-mesh"] :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50):hover {
          background: rgba(255, 255, 255, 0.055) !important;
          border-color: rgba(var(--accent-rgb), 0.22) !important;
          box-shadow: none !important;
        }

        /* Küçük yumuşak yüzeyler (ikon kutuları, rozetler) */
        [data-design-style="fluid-mesh"] .bg-white\\/5 {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.09) !important;
        }

        /* --- Form alanları --- */
        [data-design-style="fluid-mesh"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
        [data-design-style="fluid-mesh"] select,
        [data-design-style="fluid-mesh"] textarea {
          background-color: rgba(4, 6, 18, 0.45) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease !important;
        }
        [data-design-style="fluid-mesh"] input::placeholder,
        [data-design-style="fluid-mesh"] textarea::placeholder {
          color: rgba(203, 213, 225, 0.45) !important;
        }
        [data-design-style="fluid-mesh"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus,
        [data-design-style="fluid-mesh"] select:focus,
        [data-design-style="fluid-mesh"] textarea:focus {
          outline: none !important;
          border-color: rgba(var(--accent-rgb), 0.65) !important;
          background-color: rgba(6, 8, 22, 0.6) !important;
          box-shadow:
            0 0 0 3px rgba(var(--accent-rgb), 0.18),
            inset 0 1px 2px rgba(0, 0, 0, 0.25) !important;
        }
        [data-design-style="fluid-mesh"] select option {
          background: #0b0d1e !important;
          color: #eef2ff !important;
        }

        /* --- Modal pencereler: sayfadan net ayrışan koyu cam --- */
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/80,
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/70,
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/60,
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/50 {
          background-color: rgba(3, 4, 12, 0.62) !important;
          backdrop-filter: blur(14px) saturate(120%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(120%) !important;
        }
        [data-design-style="fluid-mesh"] .fixed.inset-0 > :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50),
        [data-design-style="fluid-mesh"] .fixed.inset-0 > div > :is(.bg-white, .bg-\\[\\#ffffff\\], .bg-\\[\\#0a0a0a\\], .bg-\\[\\#0c0c0c\\], .bg-\\[\\#0d0d0d\\], .bg-\\[\\#0f0f0f\\], .bg-\\[\\#111111\\], .bg-\\[\\#121212\\], .bg-\\[\\#151515\\], .bg-\\[\\#111111\\]\\/80, .bg-\\[\\#121316\\], .bg-\\[\\#0b0c0e\\], .bg-zinc-950, .bg-zinc-950\\/50, .bg-zinc-900\\/50, .bg-zinc-900, .bg-zinc-800, .bg-slate-50, .bg-slate-100, .bg-slate-900\\/50, .bg-zinc-50, .bg-zinc-100, .bg-gray-50, .bg-gray-100, .bg-neutral-50) {
          background:
            linear-gradient(170deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 40%),
            var(--mesh-surface-strong) !important;
          backdrop-filter: blur(30px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(30px) saturate(140%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-top-color: rgba(255, 255, 255, 0.2) !important;
          box-shadow:
            0 30px 80px -20px rgba(0, 0, 0, 0.85),
            0 0 0 1px rgba(var(--accent-rgb), 0.06),
            0 0 60px -20px rgba(var(--accent-rgb), 0.35) !important;
        }

        /* --- Vurgu butonları --- */
        [data-design-style="fluid-mesh"] .bg-indigo-600,
        [data-design-style="fluid-mesh"] .bg-indigo-500 {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.04) 48%, transparent 52%),
            linear-gradient(135deg, rgba(var(--accent-rgb), 0.95) 0%, color-mix(in oklab, var(--accent-600, #4f46e5) 80%, #000) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          box-shadow:
            0 6px 18px -6px rgba(var(--accent-rgb), 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          color: #ffffff !important;
        }
        [data-design-style="fluid-mesh"] .bg-indigo-600:hover,
        [data-design-style="fluid-mesh"] .bg-indigo-500:hover {
          filter: brightness(1.08) !important;
          box-shadow:
            0 10px 26px -8px rgba(var(--accent-rgb), 0.75),
            inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
        }

        /* --- Metin okunabilirliği (açık zemin sınıflarını koyu cama uyarlar) --- */
        [data-design-style="fluid-mesh"] main .text-white,
        [data-design-style="fluid-mesh"] main .text-white\\/95,
        [data-design-style="fluid-mesh"] main .text-white\\/90,
        [data-design-style="fluid-mesh"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="fluid-mesh"] .text-slate-900,
        [data-design-style="fluid-mesh"] .text-slate-800,
        [data-design-style="fluid-mesh"] .text-slate-700,
        [data-design-style="fluid-mesh"] .text-zinc-900,
        [data-design-style="fluid-mesh"] .text-zinc-800,
        [data-design-style="fluid-mesh"] .text-zinc-700,
        [data-design-style="fluid-mesh"] .text-gray-900,
        [data-design-style="fluid-mesh"] .text-gray-800,
        [data-design-style="fluid-mesh"] .text-gray-700 {
          color: #f5f7ff !important;
        }
        [data-design-style="fluid-mesh"] main .text-white\\/80,
        [data-design-style="fluid-mesh"] main .text-white\\/70,
        [data-design-style="fluid-mesh"] main .text-white\\/60,
        [data-design-style="fluid-mesh"] .text-slate-500,
        [data-design-style="fluid-mesh"] .text-slate-600,
        [data-design-style="fluid-mesh"] .text-zinc-500,
        [data-design-style="fluid-mesh"] .text-zinc-600,
        [data-design-style="fluid-mesh"] .text-gray-500,
        [data-design-style="fluid-mesh"] .text-gray-600 {
          color: var(--mesh-text-soft) !important;
        }
        [data-design-style="fluid-mesh"] main .text-white\\/50,
        [data-design-style="fluid-mesh"] main .text-white\\/40,
        [data-design-style="fluid-mesh"] main .text-white\\/30,
        [data-design-style="fluid-mesh"] main .text-white\\/25,
        [data-design-style="fluid-mesh"] .text-zinc-400,
        [data-design-style="fluid-mesh"] .text-slate-400,
        [data-design-style="fluid-mesh"] .text-gray-400 {
          color: var(--mesh-text-muted) !important;
        }

        [data-design-style="fluid-mesh"] .border-slate-200,
        [data-design-style="fluid-mesh"] .border-slate-100,
        [data-design-style="fluid-mesh"] .border-zinc-800,
        [data-design-style="fluid-mesh"] .border-white\\/10,
        [data-design-style="fluid-mesh"] .border-white\\/5,
        [data-design-style="fluid-mesh"] .border-zinc-200,
        [data-design-style="fluid-mesh"] .border-zinc-100,
        [data-design-style="fluid-mesh"] .border-gray-200,
        [data-design-style="fluid-mesh"] .border-slate-300 {
          border-color: rgba(255, 255, 255, 0.07) !important;
        }

        /* --- Pastel uyarı/bilgi kutuları: koyu zeminde renkli yarı saydam cam, açık tonlu yazı --- */
        [data-design-style="fluid-mesh"] .bg-red-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-red-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-red-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-red-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(239, 68, 68, 0.12) !important;
          border-color: rgba(239, 68, 68, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-red-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-red-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-red-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-red-950:not(.print-paper-sheet *) {
          color: #fca5a5 !important;
        }
        [data-design-style="fluid-mesh"] .border-red-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-red-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-red-300:not(.print-paper-sheet *) {
          border-color: rgba(239, 68, 68, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-rose-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-rose-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-rose-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-rose-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(244, 63, 94, 0.12) !important;
          border-color: rgba(244, 63, 94, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-rose-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-rose-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-rose-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-rose-950:not(.print-paper-sheet *) {
          color: #fda4af !important;
        }
        [data-design-style="fluid-mesh"] .border-rose-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-rose-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-rose-300:not(.print-paper-sheet *) {
          border-color: rgba(244, 63, 94, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-orange-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-orange-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-orange-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-orange-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(249, 115, 22, 0.12) !important;
          border-color: rgba(249, 115, 22, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-orange-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-orange-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-orange-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-orange-950:not(.print-paper-sheet *) {
          color: #fdba74 !important;
        }
        [data-design-style="fluid-mesh"] .border-orange-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-orange-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-orange-300:not(.print-paper-sheet *) {
          border-color: rgba(249, 115, 22, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-amber-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-amber-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-amber-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-amber-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(245, 158, 11, 0.12) !important;
          border-color: rgba(245, 158, 11, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-amber-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-amber-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-amber-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-amber-950:not(.print-paper-sheet *) {
          color: #fcd34d !important;
        }
        [data-design-style="fluid-mesh"] .border-amber-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-amber-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-amber-300:not(.print-paper-sheet *) {
          border-color: rgba(245, 158, 11, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-yellow-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-yellow-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-yellow-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-yellow-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(234, 179, 8, 0.12) !important;
          border-color: rgba(234, 179, 8, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-yellow-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-yellow-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-yellow-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-yellow-950:not(.print-paper-sheet *) {
          color: #fde047 !important;
        }
        [data-design-style="fluid-mesh"] .border-yellow-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-yellow-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-yellow-300:not(.print-paper-sheet *) {
          border-color: rgba(234, 179, 8, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-emerald-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-emerald-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-emerald-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-emerald-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(16, 185, 129, 0.12) !important;
          border-color: rgba(16, 185, 129, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-emerald-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-emerald-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-emerald-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-emerald-950:not(.print-paper-sheet *) {
          color: #6ee7b7 !important;
        }
        [data-design-style="fluid-mesh"] .border-emerald-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-emerald-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-emerald-300:not(.print-paper-sheet *) {
          border-color: rgba(16, 185, 129, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-green-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-green-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-green-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-green-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(34, 197, 94, 0.12) !important;
          border-color: rgba(34, 197, 94, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-green-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-green-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-green-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-green-950:not(.print-paper-sheet *) {
          color: #86efac !important;
        }
        [data-design-style="fluid-mesh"] .border-green-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-green-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-green-300:not(.print-paper-sheet *) {
          border-color: rgba(34, 197, 94, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-teal-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-teal-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-teal-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-teal-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(20, 184, 166, 0.12) !important;
          border-color: rgba(20, 184, 166, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-teal-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-teal-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-teal-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-teal-950:not(.print-paper-sheet *) {
          color: #5eead4 !important;
        }
        [data-design-style="fluid-mesh"] .border-teal-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-teal-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-teal-300:not(.print-paper-sheet *) {
          border-color: rgba(20, 184, 166, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-cyan-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-cyan-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-cyan-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-cyan-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(6, 182, 212, 0.12) !important;
          border-color: rgba(6, 182, 212, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-cyan-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-cyan-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-cyan-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-cyan-950:not(.print-paper-sheet *) {
          color: #67e8f9 !important;
        }
        [data-design-style="fluid-mesh"] .border-cyan-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-cyan-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-cyan-300:not(.print-paper-sheet *) {
          border-color: rgba(6, 182, 212, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-sky-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-sky-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-sky-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-sky-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(14, 165, 233, 0.12) !important;
          border-color: rgba(14, 165, 233, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-sky-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-sky-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-sky-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-sky-950:not(.print-paper-sheet *) {
          color: #7dd3fc !important;
        }
        [data-design-style="fluid-mesh"] .border-sky-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-sky-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-sky-300:not(.print-paper-sheet *) {
          border-color: rgba(14, 165, 233, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-blue-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-blue-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-blue-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-blue-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(59, 130, 246, 0.12) !important;
          border-color: rgba(59, 130, 246, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-blue-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-blue-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-blue-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-blue-950:not(.print-paper-sheet *) {
          color: #93c5fd !important;
        }
        [data-design-style="fluid-mesh"] .border-blue-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-blue-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-blue-300:not(.print-paper-sheet *) {
          border-color: rgba(59, 130, 246, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-indigo-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-indigo-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-indigo-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-indigo-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(99, 102, 241, 0.12) !important;
          border-color: rgba(99, 102, 241, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-indigo-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-indigo-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-indigo-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-indigo-950:not(.print-paper-sheet *) {
          color: #a5b4fc !important;
        }
        [data-design-style="fluid-mesh"] .border-indigo-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-indigo-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-indigo-300:not(.print-paper-sheet *) {
          border-color: rgba(99, 102, 241, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-violet-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-violet-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-violet-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-violet-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(139, 92, 246, 0.12) !important;
          border-color: rgba(139, 92, 246, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-violet-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-violet-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-violet-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-violet-950:not(.print-paper-sheet *) {
          color: #c4b5fd !important;
        }
        [data-design-style="fluid-mesh"] .border-violet-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-violet-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-violet-300:not(.print-paper-sheet *) {
          border-color: rgba(139, 92, 246, 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .bg-purple-50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-purple-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-purple-50\\/50:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .bg-purple-50\\/70:not(.print-paper-sheet *) {
          background-color: rgba(168, 85, 247, 0.12) !important;
          border-color: rgba(168, 85, 247, 0.32) !important;
        }
        [data-design-style="fluid-mesh"] .text-purple-700:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-purple-800:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-purple-900:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .text-purple-950:not(.print-paper-sheet *) {
          color: #d8b4fe !important;
        }
        [data-design-style="fluid-mesh"] .border-purple-100:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-purple-200:not(.print-paper-sheet *),
        [data-design-style="fluid-mesh"] .border-purple-300:not(.print-paper-sheet *) {
          border-color: rgba(168, 85, 247, 0.35) !important;
        }

        /* --- Tablolar --- */
        [data-design-style="fluid-mesh"] table thead tr,
        [data-design-style="fluid-mesh"] table thead th {
          background-color: rgba(255, 255, 255, 0.025) !important;
          border-color: rgba(255, 255, 255, 0.07) !important;
        }
        [data-design-style="fluid-mesh"] table tbody tr {
          border-color: rgba(255, 255, 255, 0.05) !important;
          transition: background-color 0.2s ease !important;
        }
        [data-design-style="fluid-mesh"] table tbody tr:hover {
          background-color: rgba(var(--accent-rgb), 0.07) !important;
        }

        /* --- Kaydırma çubukları --- */
        [data-design-style="fluid-mesh"] ::-webkit-scrollbar { width: 8px; height: 8px; }
        [data-design-style="fluid-mesh"] ::-webkit-scrollbar-track { background: transparent; }
        [data-design-style="fluid-mesh"] ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        [data-design-style="fluid-mesh"] ::-webkit-scrollbar-thumb:hover { background-color: rgba(var(--accent-rgb), 0.45); }

        /* --- Sol menü --- */
        [data-design-style="fluid-mesh"] aside {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.045) 0%, rgba(255, 255, 255, 0.012) 100%),
            rgba(7, 9, 24, 0.5) !important;
          backdrop-filter: blur(28px) saturate(135%) !important;
          -webkit-backdrop-filter: blur(28px) saturate(135%) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-top-color: rgba(255, 255, 255, 0.14) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            18px 0 50px -30px rgba(0, 0, 0, 0.8) !important;
        }
        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"] {
          color: #e6eaf7 !important;
          border: 1px solid transparent !important;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"]:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.06) !important;
        }
        /* Aktif menü öğesi (satır içi vurgu rengi taşıyan buton) */
        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"][style*="color-mix"],
        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"][style*="background-color"] {
          background: linear-gradient(90deg, rgba(var(--accent-rgb), 0.22) 0%, rgba(var(--accent-rgb), 0.06) 100%) !important;
          border-color: rgba(var(--accent-rgb), 0.3) !important;
          box-shadow:
            inset 3px 0 0 rgba(var(--accent-rgb), 0.95),
            0 8px 24px -12px rgba(var(--accent-rgb), 0.6) !important;
          color: #ffffff !important;
        }
        [data-design-style="fluid-mesh"] aside .bg-black\\/40,
        [data-design-style="fluid-mesh"] aside .bg-black\\/20,
        [data-design-style="fluid-mesh"] aside .bg-black\\/15 {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        [data-design-style="fluid-mesh"] aside .text-white,
        [data-design-style="fluid-mesh"] aside .text-zinc-50 { color: #f5f7ff !important; }
        [data-design-style="fluid-mesh"] aside .text-zinc-300,
        [data-design-style="fluid-mesh"] aside .text-slate-300 { color: #dde3f3 !important; }
        [data-design-style="fluid-mesh"] aside .text-zinc-400,
        [data-design-style="fluid-mesh"] aside .text-slate-400 { color: var(--mesh-text-muted) !important; }

        /* Menü alt profil kartı */
        [data-design-style="fluid-mesh"] aside div.mt-auto { background: transparent !important; }
        [data-design-style="fluid-mesh"] aside div.mt-auto > div {
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.09) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }
        [data-design-style="fluid-mesh"] aside div.mt-auto button {
          transition: background-color 0.2s ease, border-color 0.2s ease !important;
        }
        [data-design-style="fluid-mesh"] aside div.mt-auto button:hover {
          background-color: rgba(255, 255, 255, 0.09) !important;
          border-color: rgba(var(--accent-rgb), 0.3) !important;
        }

        /* --- Logo ve ikonlar --- */
        [data-design-style="fluid-mesh"] .storm-logo-glass {
          filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 22px rgba(var(--accent-rgb), 0.28)) !important;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s ease !important;
        }
        [data-design-style="fluid-mesh"] .storm-logo-glass:hover {
          transform: translateY(-2px) scale(1.02) !important;
          filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 30px rgba(var(--accent-rgb), 0.45)) !important;
        }
        [data-design-style="fluid-mesh"] .storm-icon-wrapper {
          background: rgba(255, 255, 255, 0.055) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease !important;
        }
        [data-design-style="fluid-mesh"] .storm-icon-wrapper svg { stroke: #ffffff !important; }
        [data-design-style="fluid-mesh"] button:hover .storm-icon-wrapper,
        [data-design-style="fluid-mesh"] .group:hover .storm-icon-wrapper {
          background: rgba(var(--accent-rgb), 0.16) !important;
          border-color: rgba(var(--accent-rgb), 0.35) !important;
        }
        [data-design-style="fluid-mesh"] .storm-icon-wrapper.active-icon {
          background: linear-gradient(135deg, var(--accent-500) 0%, var(--accent-700) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          box-shadow:
            0 6px 18px -6px rgba(var(--accent-rgb), 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
        }

        @keyframes mesh-logo-blob-1 {
          0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
          50% { transform: translate3d(15px, -15px, 0) scale3d(1.15, 1.15, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
        }
        @keyframes mesh-logo-blob-2 {
          0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
          50% { transform: translate3d(-15px, 15px, 0) scale3d(1.12, 1.12, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
        }
        .animate-mesh-logo-blob-1 {
          animation: mesh-logo-blob-1 12s infinite ease-in-out;
          transform-origin: 50px 50px;
          will-change: transform;
          backface-visibility: hidden;
        }
        .animate-mesh-logo-blob-2 {
          animation: mesh-logo-blob-2 15s infinite ease-in-out;
          transform-origin: 150px 150px;
          will-change: transform;
          backface-visibility: hidden;
        }

        /* StormLogo Glass Mode Overrides and Animations */
        @keyframes storm-glass-shimmer {
          0% {
            transform: translateX(0px) skewX(-25deg);
            opacity: 0;
          }
          8% {
            opacity: 0.7;
          }
          32% {
            transform: translateX(420px) skewX(-25deg);
            opacity: 0.7;
          }
          35%, 100% {
            transform: translateX(420px) skewX(-25deg);
            opacity: 0;
          }
        }

        /* CYBER NEON / SİBER GECE OVERRIDES */
        [data-design-style="cyber"] {
          color: rgba(var(--accent-rgb), 1) !important;
        }

        [data-design-style="cyber"] body,
        [data-design-style="cyber"].bg-\\[\\#050505\\],
        body:has([data-design-style="cyber"]) {
          background: 
            linear-gradient(rgba(255, 255, 255, 0.003) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.003) 1px, transparent 1px),
            #030305 !important;
          background-size: 30px 30px, 30px 30px, 100% 100% !important;
          color: #00ffcc !important;
          background-attachment: fixed !important;
        }

        [data-design-style="cyber"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="cyber"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="cyber"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="cyber"] .bg-\\[\\#111111\\],
        [data-design-style="cyber"] .bg-\\[\\#121212\\],
        [data-design-style="cyber"] .bg-\\[\\#151515\\],
        [data-design-style="cyber"] .bg-white\\/5 {
          background-color: #050505 !important;
          border: 1px solid rgba(var(--accent-rgb), 0.35) !important;
          box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.15) !important;
          color: #e2e8f0 !important;
        }

        [data-design-style="cyber"] .bg-white\\/5:hover {
          background-color: #0e101f !important;
          border-color: rgba(var(--accent-rgb), 0.7) !important;
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3) !important;
        }

        [data-design-style="cyber"] input,
        [data-design-style="cyber"] select,
        [data-design-style="cyber"] textarea,
        [data-design-style="cyber"] .bg-\\[\\#0c0c0c\\] {
          background-color: #040509 !important;
          color: rgba(var(--accent-rgb), 1) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.3) !important;
          font-family: ui-monospace, SFMono-Regular, monospace !important;
        }

        [data-design-style="cyber"] input:focus,
        [data-design-style="cyber"] select:focus,
        [data-design-style="cyber"] textarea:focus {
          border-color: rgba(var(--accent-rgb), 1) !important;
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.4) !important;
        }

        [data-design-style="cyber"] main .text-white,
        [data-design-style="cyber"] main .text-white\\/95,
        [data-design-style="cyber"] main .text-white\\/90,
        [data-design-style="cyber"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="cyber"] main .text-white\\/80 {
          color: #ffffff !important;
        }

        [data-design-style="cyber"] main .text-white\\/70,
        [data-design-style="cyber"] main .text-white\\/60 {
          color: #a1a1aa !important;
        }

        [data-design-style="cyber"] .text-slate-900,
        [data-design-style="cyber"] .text-slate-700,
        [data-design-style="cyber"] .text-slate-800 {
          color: #e2e8f0 !important;
        }

        [data-design-style="cyber"] .text-slate-500,
        [data-design-style="cyber"] .text-slate-600 {
          color: #71717a !important;
        }

        [data-design-style="cyber"] .border-slate-200,
        [data-design-style="cyber"] .border-slate-100 {
          border-color: rgba(var(--accent-rgb), 0.2) !important;
        }

        [data-design-style="cyber"] aside {
          background-color: #04050a !important;
          border-color: rgba(var(--accent-rgb), 0.4) !important;
          box-shadow: 4px 0 25px rgba(var(--accent-rgb), 0.1) !important;
        }

        [data-design-style="cyber"] aside .bg-black\\/40,
        [data-design-style="cyber"] aside .bg-\\[\\#111111\\] {
          background-color: #0a0b14 !important;
          border-color: rgba(var(--accent-rgb), 0.25) !important;
        }

        [data-design-style="cyber"] aside .text-white,
        [data-design-style="cyber"] aside span,
        [data-design-style="cyber"] aside button {
          color: rgba(var(--accent-rgb), 0.95) !important;
        }

        [data-design-style="cyber"] aside .text-zinc-400,
        [data-design-style="cyber"] aside .text-zinc-300 {
          color: rgba(var(--accent-rgb), 0.6) !important;
        }

        /* AURORA AMBIENT / IŞILTILI KUZEY IŞIKLARI OVERRIDES */
        [data-design-style="aurora"] {
          color: #f1f5f9 !important;
        }

        [data-design-style="aurora"] body,
        [data-design-style="aurora"].bg-\\[\\#050505\\],
        body:has([data-design-style="aurora"]) {
          background: 
            radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(var(--accent-rgb), 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(139, 92, 246, 0.08) 0px, transparent 40%),
            linear-gradient(135deg, #090a12 0%, #150f24 100%) !important;
          color: #f1f5f9 !important;
          background-attachment: fixed !important;
        }

        [data-design-style="aurora"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="aurora"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="aurora"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="aurora"] .bg-\\[\\#111111\\],
        [data-design-style="aurora"] .bg-\\[\\#121212\\],
        [data-design-style="aurora"] .bg-\\[\\#151515\\],
        [data-design-style="aurora"] .bg-white\\/5 {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(139, 92, 246, 0.18) !important;
          box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.2) !important;
          color: #f1f5f9 !important;
        }

        [data-design-style="aurora"] .bg-white\\/5:hover {
          background-color: rgba(21, 15, 34, 0.85) !important;
          border-color: rgba(139, 92, 246, 0.35) !important;
        }

        [data-design-style="aurora"] input,
        [data-design-style="aurora"] select,
        [data-design-style="aurora"] textarea,
        [data-design-style="aurora"] .bg-\\[\\#0c0c0c\\] {
          background-color: rgba(15, 11, 26, 0.5) !important;
          color: #ffffff !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        [data-design-style="aurora"] aside {
          background-color: rgba(13, 9, 22, 0.65) !important;
          backdrop-filter: blur(20px) !important;
          border-color: rgba(139, 92, 246, 0.18) !important;
        }

        ${globalStylesPart2}
      `}</style>
  );
};
