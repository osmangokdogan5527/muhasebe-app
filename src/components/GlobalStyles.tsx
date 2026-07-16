import React from 'react';

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

        /* GLASSMORPHISM / CAM ARAYÜZ OVERRIDES */
        [data-design-style="glass"] {
          color: #f8fafc !important;
        }

        [data-design-style="glass"] body,
        [data-design-style="glass"].bg-\\[\\#050505\\],
        body:has([data-design-style="glass"]) {
          background: 
            radial-gradient(circle at 10% 20%, color-mix(in srgb, var(--accent-500) 18%, transparent) 0%, transparent 45%),
            radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.14) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 40%),
            radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(135deg, #050505 0%, #08080a 100%) !important;
          background-size: 100% 100%, 100% 100%, 100% 100%, 24px 24px, 100% 100% !important;
          color: #f1f5f9 !important;
          background-attachment: fixed !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1) !important;
        }

        /* Pure Glass Panels for all kinds of card containers across the app */
        [data-design-style="glass"] .bg-white,
        [data-design-style="glass"] .bg-\\[\\#ffffff\\],
        [data-design-style="glass"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="glass"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="glass"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="glass"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="glass"] .bg-\\[\\#111111\\],
        [data-design-style="glass"] .bg-\\[\\#121212\\],
        [data-design-style="glass"] .bg-\\[\\#151515\\],
        [data-design-style="glass"] .bg-\\[\\#111111\\]\\/80,
        [data-design-style="glass"] .bg-\\[\\#121316\\],
        [data-design-style="glass"] .bg-\\[\\#0b0c0e\\],
        [data-design-style="glass"] .bg-zinc-950,
        [data-design-style="glass"] .bg-zinc-950\\/50,
        [data-design-style="glass"] .bg-zinc-900\\/50,
        [data-design-style="glass"] .bg-white\\/5,
        [data-design-style="glass"] .bg-slate-50,
        [data-design-style="glass"] .bg-slate-100,
        [data-design-style="glass"] .bg-slate-900\\/50,
        [data-design-style="glass"] .bg-zinc-900,
        [data-design-style="glass"] .bg-zinc-800,
        [data-design-style="glass"] .rounded-lg,
        [data-design-style="glass"] .rounded-xl,
        [data-design-style="glass"] .rounded-2xl {
          background: rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: blur(20px) contrast(1.1) saturate(210%) !important;
          -webkit-backdrop-filter: blur(20px) contrast(1.1) saturate(210%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 12px 40px -10px rgba(0, 0, 0, 0.55) !important;
          position: relative !important;
          overflow: hidden !important;
          color: #f1f5f9 !important;
          transform-style: preserve-3d !important;
          perspective: 1000px !important;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        /* Enhanced Glass refraction light simulation on hover - Simplified to prevent unwanted blur and distorting transforms */
        [data-design-style="glass"] .bg-white:hover,
        [data-design-style="glass"] .bg-\\[\\#ffffff\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#0a0a0a\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#0c0c0c\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#0d0d0d\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#0f0f0f\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#111111\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#121212\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#151515\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#111111\\]\\/80:hover,
        [data-design-style="glass"] .bg-\\[\\#121316\\]:hover,
        [data-design-style="glass"] .bg-\\[\\#0b0c0e\\]:hover,
        [data-design-style="glass"] .bg-zinc-950:hover,
        [data-design-style="glass"] .bg-zinc-950\\/50:hover,
        [data-design-style="glass"] .bg-zinc-900\\/50:hover,
        [data-design-style="glass"] .bg-white\\/5:hover,
        [data-design-style="glass"] .bg-slate-50:hover,
        [data-design-style="glass"] .bg-slate-100:hover,
        [data-design-style="glass"] .bg-slate-900\\/50:hover,
        [data-design-style="glass"] .bg-zinc-900:hover,
        [data-design-style="glass"] .bg-zinc-800:hover,
        [data-design-style="glass"] .rounded-lg:hover,
        [data-design-style="glass"] .rounded-xl:hover,
        [data-design-style="glass"] .rounded-2xl:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.32) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.24) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 20px 50px -10px rgba(0, 0, 0, 0.7),
            0 0 25px rgba(255, 255, 255, 0.15),
            0 0 10px rgba(var(--accent-rgb), 0.2) !important;
        }

        /* Elegant Diagonal Glass Shine Reflection Effect */
        [data-design-style="glass"] .bg-white::before,
        [data-design-style="glass"] .bg-\\[\\#ffffff\\]::before,
        [data-design-style="glass"] .bg-\\[\\#0a0a0a\\]::before,
        [data-design-style="glass"] .bg-\\[\\#0d0d0d\\]::before,
        [data-design-style="glass"] .bg-\\[\\#111111\\]::before,
        [data-design-style="glass"] .bg-white\\/5::before,
        [data-design-style="glass"] .rounded-xl::before,
        [data-design-style="glass"] .rounded-2xl::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 28%, transparent 50%, transparent 100%) !important;
          pointer-events: none !important;
          z-index: 1 !important;
        }

        [data-design-style="glass"] .bg-white\\/5:hover {
          background: rgba(255, 255, 255, 0.07) !important;
          border-top-color: rgba(255, 255, 255, 0.28) !important;
        }

        /* Form Inputs, Select elements and textareas inside glass panels */
        [data-design-style="glass"] input,
        [data-design-style="glass"] select,
        [data-design-style="glass"] textarea,
        [data-design-style="glass"] .bg-\\[\\#0c0c0c\\] {
          background-color: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        }

        [data-design-style="glass"] input:focus,
        [data-design-style="glass"] select:focus,
        [data-design-style="glass"] textarea:focus {
          border-color: rgba(var(--accent-rgb), 0.6) !important;
          box-shadow: 
            0 0 15px rgba(var(--accent-rgb), 0.3),
            inset 0 1px 2px rgba(255, 255, 255, 0.05) !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
        }

        /* Glass dialog / modal overrides */
        [data-design-style="glass"] .fixed.inset-0.bg-black\\/80,
        [data-design-style="glass"] .fixed.inset-0.bg-black\\/60,
        [data-design-style="glass"] .fixed.inset-0.bg-black\\/50 {
          backdrop-filter: blur(15px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(15px) saturate(160%) !important;
          background-color: rgba(4, 5, 12, 0.6) !important;
        }

        [data-design-style="glass"] .fixed.inset-0.z-50 .bg-\\[\\#0d0d0d\\],
        [data-design-style="glass"] .fixed.inset-0.z-50 .bg-\\[\\#111111\\],
        [data-design-style="glass"] .fixed.inset-0.z-50 .bg-\\[\\#151515\\] {
          background: rgba(14, 16, 29, 0.65) !important;
          backdrop-filter: blur(35px) saturate(220%) !important;
          -webkit-backdrop-filter: blur(35px) saturate(220%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75) !important;
        }

        /* Glass Buttons */
        [data-design-style="glass"] button.bg-indigo-600,
        [data-design-style="glass"] button.bg-indigo-500,
        [data-design-style="glass"] .bg-indigo-600,
        [data-design-style="glass"] .bg-indigo-500 {
          background: rgba(var(--accent-rgb), 0.24) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.5) !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: 0 4px 15px rgba(var(--accent-rgb), 0.18) !important;
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4) !important;
        }

        [data-design-style="glass"] button.bg-indigo-600:hover,
        [data-design-style="glass"] button.bg-indigo-500:hover,
        [data-design-style="glass"] .bg-indigo-600:hover,
        [data-design-style="glass"] .bg-indigo-500:hover {
          background: rgba(var(--accent-rgb), 0.4) !important;
          border-color: rgba(var(--accent-rgb), 0.75) !important;
          box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.35) !important;
        }

        /* Primary text color & readability fixes across all views */
        [data-design-style="glass"] main .text-white,
        [data-design-style="glass"] main .text-white\\/95,
        [data-design-style="glass"] main .text-white\\/90,
        [data-design-style="glass"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="glass"] main .text-white\\/80,
        [data-design-style="glass"] .text-slate-900,
        [data-design-style="glass"] .text-slate-800,
        [data-design-style="glass"] .text-slate-700,
        [data-design-style="glass"] .text-zinc-900,
        [data-design-style="glass"] .text-zinc-800,
        [data-design-style="glass"] .text-zinc-700,
        [data-design-style="glass"] .text-gray-900,
        [data-design-style="glass"] .text-gray-800,
        [data-design-style="glass"] .text-gray-700 {
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        /* Secondary text color & hierarchy */
        [data-design-style="glass"] main .text-white\\/70,
        [data-design-style="glass"] main .text-white\\/60,
        [data-design-style="glass"] .text-slate-500,
        [data-design-style="glass"] .text-slate-600,
        [data-design-style="glass"] .text-zinc-500,
        [data-design-style="glass"] .text-zinc-600,
        [data-design-style="glass"] .text-gray-500,
        [data-design-style="glass"] .text-gray-600 {
          color: #cbd5e1 !important;
        }

        /* Tertiary text color & micro-indicators */
        [data-design-style="glass"] main .text-white\\/50,
        [data-design-style="glass"] main .text-white\\/40,
        [data-design-style="glass"] .text-zinc-400,
        [data-design-style="glass"] .text-slate-400,
        [data-design-style="glass"] .text-gray-400 {
          color: #94a3b8 !important;
        }

        [data-design-style="glass"] .border-slate-200,
        [data-design-style="glass"] .border-slate-100,
        [data-design-style="glass"] .border-zinc-800,
        [data-design-style="glass"] .border-white\\/10 {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Glass Sidebar Navigation Overhaul */
        [data-design-style="glass"] aside {
          background: rgba(10, 11, 22, 0.35) !important;
          backdrop-filter: blur(30px) saturate(200%) !important;
          -webkit-backdrop-filter: blur(30px) saturate(200%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            12px 0 40px rgba(0, 0, 0, 0.45) !important;
        }

        [data-design-style="glass"] aside .bg-black\\/40,
        [data-design-style="glass"] aside .bg-black\\/20,
        [data-design-style="glass"] aside .bg-black\\/15,
        [data-design-style="glass"] aside .bg-\\[\\#111111\\] {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(10px) !important;
        }

        [data-design-style="glass"] aside .text-white,
        [data-design-style="glass"] aside .text-zinc-50,
        [data-design-style="glass"] aside button[id^="tab-btn-"] {
          color: #f1f5f9 !important;
        }

        [data-design-style="glass"] aside .text-zinc-300,
        [data-design-style="glass"] aside .text-slate-300 {
          color: #cbd5e1 !important;
        }

        [data-design-style="glass"] aside .text-zinc-400,
        [data-design-style="glass"] aside .text-slate-400 {
          color: #94a3b8 !important;
        }

        /* Light Sidebar overrides in Glass mode to prevent unreadable dark text on dark glass */
        [data-design-style="glass"] aside.sidebar-light,
        [data-design-style="glass"] aside.sidebar-light.text-white,
        [data-design-style="glass"] aside.sidebar-light .text-white,
        [data-design-style="glass"] aside.sidebar-light .text-zinc-50,
        [data-design-style="glass"] aside.sidebar-light .text-zinc-100,
        [data-design-style="glass"] aside.sidebar-light .text-zinc-200,
        [data-design-style="glass"] aside.sidebar-light button,
        [data-design-style="glass"] aside.sidebar-light span {
          color: #ffffff !important;
        }

        [data-design-style="glass"] aside.sidebar-light .text-zinc-400,
        [data-design-style="glass"] aside.sidebar-light .text-zinc-300,
        [data-design-style="glass"] aside.sidebar-light .text-slate-400,
        [data-design-style="glass"] aside.sidebar-light .text-slate-300 {
          color: #cbd5e1 !important;
        }

        /* Make the profile footer wrapper pop with rich glass reflection */
        [data-design-style="glass"] aside div.mt-auto {
          background: transparent !important;
        }

        [data-design-style="glass"] aside div.mt-auto > div {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(25px) saturate(220%) !important;
          -webkit-backdrop-filter: blur(25px) saturate(220%) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 10px 30px rgba(0, 0, 0, 0.4) !important;
        }

        /* Profile details container and feedback/admin buttons in Glass mode */
        [data-design-style="glass"] aside div.mt-auto div.border-white\/5,
        [data-design-style="glass"] aside div.mt-auto button.border-white\/5,
        [data-design-style="glass"] aside div.mt-auto button.border-teal-500\/20,
        [data-design-style="glass"] aside div.mt-auto button.border-red-500\/20 {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          transition: all 0.3s ease !important;
        }

        [data-design-style="glass"] aside div.mt-auto button:hover {
          background-color: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.28) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15) !important;
        }

        /* Guarantee absolute readability of all text within footer in Glass mode */
        [data-design-style="glass"] aside div.mt-auto span,
        [data-design-style="glass"] aside div.mt-auto .text-zinc-50,
        [data-design-style="glass"] aside div.mt-auto .text-zinc-300,
        [data-design-style="glass"] aside div.mt-auto .text-zinc-400,
        [data-design-style="glass"] aside div.mt-auto .text-teal-400,
        [data-design-style="glass"] aside div.mt-auto .text-red-400 {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        [data-design-style="glass"] aside div.mt-auto .text-zinc-50 {
          color: #ffffff !important;
          font-weight: 700 !important;
        }

        [data-design-style="glass"] aside div.mt-auto .text-zinc-300 {
          color: #e2e8f0 !important;
        }

        [data-design-style="glass"] aside div.mt-auto .text-zinc-400 {
          color: #94a3b8 !important;
        }

        [data-design-style="glass"] aside div.mt-auto button {
          color: #f1f5f9 !important;
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
        [data-design-style="glass"] .storm-logo-shimmer {
          animation: storm-glass-shimmer 5s infinite cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          transform-origin: center;
          mix-blend-mode: overlay;
        }
        [data-design-style="glass"] .storm-logo-glass {
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.08)) !important;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s ease !important;
          transform-style: preserve-3d !important;
          perspective: 1000px !important;
        }
        [data-design-style="glass"] .storm-logo-glass:hover {
          transform: perspective(1000px) rotateX(6deg) rotateY(-6deg) translateZ(4px) translateY(-2px) scale(1.02) !important;
          filter: drop-shadow(-4px 8px 16px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 15px rgba(255, 255, 255, 0.12)) !important;
        }

        /* StormIconWrapper Glass specific overrides */
        [data-design-style="glass"] .storm-icon-wrapper {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        [data-design-style="glass"] .storm-icon-wrapper svg {
          stroke: #ffffff !important;
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.2)) !important;
        }

        /* Hover style of the whole navigation button makes the icon pop */
        [data-design-style="glass"] button:hover .storm-icon-wrapper,
        [data-design-style="glass"] .group:hover .storm-icon-wrapper {
          background: rgba(255, 255, 255, 0.16) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          transform: scale(1.1) !important;
          box-shadow: 
            0 0 10px rgba(255, 255, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        /* Active navigation button icon styling */
        [data-design-style="glass"] .storm-icon-wrapper.active-icon {
          background: var(--accent-600) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
          box-shadow: 
            0 0 15px rgba(var(--accent-rgb), 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
        }

        /* Glass Active and Hover menu indicators */
        [data-design-style="glass"] aside button[id^="tab-btn-"][class*="bg-indigo-"],
        [data-design-style="glass"] aside button[class*="bg-indigo-600"],
        [data-design-style="glass"] aside div[class*="bg-indigo-600"] {
          background: rgba(var(--accent-rgb), 0.22) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.45) !important;
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.25) !important;
          color: #ffffff !important;
        }

        [data-design-style="glass"] aside .hover\\:bg-white\\/5:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }

        /* Tables Cam (Glass) overrides */
        [data-design-style="glass"] table {
          background: transparent !important;
        }

        [data-design-style="glass"] thead,
        [data-design-style="glass"] th {
          background: rgba(255, 255, 255, 0.04) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f1f5f9 !important;
        }

        [data-design-style="glass"] tbody tr {
          background: rgba(255, 255, 255, 0.01) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
        }

        [data-design-style="glass"] tbody tr:hover {
          background: rgba(255, 255, 255, 0.06) !important;
        }

        /* Scrollbars in Glass Mode */
        [data-design-style="glass"] ::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }
        [data-design-style="glass"] ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01) !important;
        }
        [data-design-style="glass"] ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12) !important;
          border-radius: 999px !important;
        }
        [data-design-style="glass"] ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22) !important;
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

        body,
        .bg-\\[\\#050505\\] {
          background: 
            ${bodyPatternSvg ? `${bodyPatternSvg},` : ''}
            linear-gradient(135deg, #050505 0%, #050505 100%) !important;
          background-size: ${bodyPatternSvg ? `${activePattern.size || 'auto'}, 100% 100%` : '100% 100%'} !important;
          background-repeat: ${bodyPatternSvg ? 'repeat, no-repeat' : 'no-repeat'} !important;
          background-attachment: fixed !important;
        }
        
        /* Normal dark sidebar rules */
        aside:not(.sidebar-light).text-white,
        aside:not(.sidebar-light) .text-white {
          color: #ffffff !important;
        }
        aside:not(.sidebar-light) .hover\\:text-white:hover {
          color: #ffffff !important;
        }
        aside:not(.sidebar-light) .hover\\:bg-white\\/5:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }

        /* Light sidebar rules */
        aside.sidebar-light,
        aside.sidebar-light.text-white,
        aside.sidebar-light .text-white,
        aside.sidebar-light .text-zinc-50 {
          color: #1e293b !important;
        }
        aside.sidebar-light .text-zinc-400,
        aside.sidebar-light .text-zinc-300 {
          color: #475569 !important;
        }
        aside.sidebar-light .border-white\\/10,
        aside.sidebar-light .border-white\\/5 {
          border-color: rgba(0, 0, 0, 0.1) !important;
        }
        aside.sidebar-light .bg-black\\/15,
        aside.sidebar-light .bg-white\\/5 {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        aside.sidebar-light .hover\\:bg-white\\/5:hover {
          background-color: rgba(0, 0, 0, 0.08) !important;
          color: #0f172a !important;
        }
        aside.sidebar-light .hover\\:text-white:hover {
          color: #0f172a !important;
        }

        /* Mobile menu fixes */
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light).text-white,
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) span,
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) button {
          color: #ffffff !important;
        }
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) .text-zinc-400 {
          color: #a1a1aa !important;
        }

        /* Ensure dropdown select options have highly visible contrast across all custom themes */
        select option {
          background-color: #1e293b !important;
          color: #ffffff !important;
        }

        /* PRINT PREVIEW PAPER ISOLATION AND HIGH-FIDELITY WHITE RESET */
        /* Forces any print previews, designer sheet, and invoice content to be authentic white paper sheets */
        .print-paper-sheet,
        #printable-invoice-content {
          background-color: #ffffff !important;
          background-image: none !important;
          background: #ffffff !important;
          color: #0f172a !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          text-shadow: none !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          transform-style: flat !important;
        }

        /* Disable glass/shimmer/backdrop effects on elements inside the paper */
        .print-paper-sheet *,
        #printable-invoice-content * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          text-shadow: none !important;
          box-shadow: none !important;
          transform-style: flat !important;
          perspective: none !important;
          transition: none !important;
          animation: none !important;
        }

        /* Restore exact background classes inside the paper sheets */
        .print-paper-sheet .bg-white,
        #printable-invoice-content .bg-white {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }

        .print-paper-sheet .bg-slate-50,
        .print-paper-sheet .bg-zinc-50,
        .print-paper-sheet .bg-gray-50,
        .print-paper-sheet [class*="bg-slate-50"],
        .print-paper-sheet [class*="bg-zinc-50"],
        #printable-invoice-content .bg-slate-50,
        #printable-invoice-content .bg-zinc-50,
        #printable-invoice-content .bg-gray-50,
        #printable-invoice-content [class*="bg-slate-50"],
        #printable-invoice-content [class*="bg-zinc-50"] {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
        }

        .print-paper-sheet .bg-slate-100,
        .print-paper-sheet .bg-zinc-100,
        .print-paper-sheet .bg-gray-100,
        .print-paper-sheet [class*="bg-slate-100"],
        .print-paper-sheet [class*="bg-zinc-100"],
        #printable-invoice-content .bg-slate-100,
        #printable-invoice-content .bg-zinc-100,
        #printable-invoice-content .bg-gray-100,
        #printable-invoice-content [class*="bg-slate-100"],
        #printable-invoice-content [class*="bg-zinc-100"] {
          background-color: #f1f5f9 !important;
          background: #f1f5f9 !important;
        }

        .print-paper-sheet .bg-slate-800,
        .print-paper-sheet .bg-zinc-800,
        .print-paper-sheet [class*="bg-slate-800"],
        .print-paper-sheet [class*="bg-zinc-800"],
        #printable-invoice-content .bg-slate-800,
        #printable-invoice-content .bg-zinc-800,
        #printable-invoice-content [class*="bg-slate-800"],
        #printable-invoice-content [class*="bg-zinc-800"] {
          background-color: #1e293b !important;
          background: #1e293b !important;
          color: #ffffff !important;
        }

        .print-paper-sheet .bg-slate-900,
        .print-paper-sheet .bg-zinc-900,
        .print-paper-sheet [class*="bg-slate-900"],
        .print-paper-sheet [class*="bg-zinc-900"],
        #printable-invoice-content .bg-slate-900,
        #printable-invoice-content .bg-zinc-900,
        #printable-invoice-content [class*="bg-slate-900"],
        #printable-invoice-content [class*="bg-zinc-900"] {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #ffffff !important;
        }

        .print-paper-sheet .bg-teal-50,
        .print-paper-sheet [class*="bg-teal-50"],
        #printable-invoice-content .bg-teal-50,
        #printable-invoice-content [class*="bg-teal-50"] {
          background-color: #f0fdfa !important;
          background: #f0fdfa !important;
        }

        /* Restore typography/colors to clean legible dark slate */
        .print-paper-sheet text,
        .print-paper-sheet p,
        .print-paper-sheet span,
        .print-paper-sheet div,
        .print-paper-sheet td,
        .print-paper-sheet th,
        .print-paper-sheet h1,
        .print-paper-sheet h2,
        .print-paper-sheet h3,
        .print-paper-sheet h4,
        .print-paper-sheet h5,
        .print-paper-sheet h6,
        .print-paper-sheet strong,
        .print-paper-sheet b,
        #printable-invoice-content text,
        #printable-invoice-content p,
        #printable-invoice-content span,
        #printable-invoice-content div,
        #printable-invoice-content td,
        #printable-invoice-content th,
        #printable-invoice-content h1,
        #printable-invoice-content h2,
        #printable-invoice-content h3,
        #printable-invoice-content h4,
        #printable-invoice-content h5,
        #printable-invoice-content h6,
        #printable-invoice-content strong,
        #printable-invoice-content b {
          color: #0f172a !important;
        }

        /* Dark Slate Text overrides */
        .print-paper-sheet .text-slate-900,
        .print-paper-sheet .text-zinc-900,
        .print-paper-sheet .text-zinc-950,
        .print-paper-sheet [class*="text-slate-900"],
        .print-paper-sheet [class*="text-zinc-900"],
        .print-paper-sheet [class*="text-zinc-955"],
        #printable-invoice-content .text-slate-900,
        #printable-invoice-content .text-zinc-900,
        #printable-invoice-content .text-zinc-955,
        #printable-invoice-content [class*="text-slate-900"],
        #printable-invoice-content [class*="text-zinc-900"],
        #printable-invoice-content [class*="text-zinc-955"] {
          color: #0f172a !important;
        }

        .print-paper-sheet .text-slate-800,
        .print-paper-sheet .text-zinc-800,
        .print-paper-sheet [class*="text-slate-800"],
        .print-paper-sheet [class*="text-zinc-800"],
        #printable-invoice-content .text-slate-800,
        #printable-invoice-content .text-zinc-800,
        #printable-invoice-content [class*="text-slate-800"],
        #printable-invoice-content [class*="text-zinc-800"] {
          color: #1e293b !important;
        }

        .print-paper-sheet .text-slate-700,
        .print-paper-sheet .text-zinc-700,
        .print-paper-sheet [class*="text-slate-700"],
        .print-paper-sheet [class*="text-zinc-700"],
        #printable-invoice-content .text-slate-700,
        #printable-invoice-content .text-zinc-700,
        #printable-invoice-content [class*="text-slate-700"],
        #printable-invoice-content [class*="text-zinc-700"] {
          color: #334155 !important;
        }

        .print-paper-sheet .text-slate-600,
        .print-paper-sheet .text-zinc-600,
        .print-paper-sheet [class*="text-slate-600"],
        .print-paper-sheet [class*="text-zinc-600"],
        #printable-invoice-content .text-slate-600,
        #printable-invoice-content .text-zinc-600,
        #printable-invoice-content [class*="text-slate-600"],
        #printable-invoice-content [class*="text-zinc-600"] {
          color: #475569 !important;
        }

        /* Muted and secondary text overrides */
        .print-paper-sheet .text-slate-500,
        .print-paper-sheet .text-zinc-500,
        .print-paper-sheet [class*="text-slate-500"],
        .print-paper-sheet [class*="text-zinc-500"],
        #printable-invoice-content .text-slate-500,
        #printable-invoice-content .text-zinc-500,
        #printable-invoice-content [class*="text-slate-500"],
        #printable-invoice-content [class*="text-zinc-500"] {
          color: #64748b !important;
        }

        .print-paper-sheet .text-slate-400,
        .print-paper-sheet .text-zinc-400,
        .print-paper-sheet [class*="text-slate-400"],
        .print-paper-sheet [class*="text-zinc-400"],
        #printable-invoice-content .text-slate-400,
        #printable-invoice-content .text-zinc-400,
        #printable-invoice-content [class*="text-slate-400"],
        #printable-invoice-content [class*="text-zinc-400"] {
          color: #94a3b8 !important;
        }

        /* Teal accent colors */
        .print-paper-sheet .text-teal-600,
        .print-paper-sheet [class*="text-teal-600"],
        #printable-invoice-content .text-teal-600,
        #printable-invoice-content [class*="text-teal-600"] {
          color: #0d9488 !important;
        }

        .print-paper-sheet .text-teal-700,
        .print-paper-sheet [class*="text-teal-700"],
        #printable-invoice-content .text-teal-700,
        #printable-invoice-content [class*="text-teal-700"] {
          color: #0f766e !important;
        }

        /* White text for dark table headers */
        .print-paper-sheet thead th,
        .print-paper-sheet .text-white,
        #printable-invoice-content thead th,
        #printable-invoice-content .text-white {
          color: #ffffff !important;
        }

        /* Clean crisp borders inside the paper */
        .print-paper-sheet .border,
        .print-paper-sheet .border-t,
        .print-paper-sheet .border-b,
        .print-paper-sheet .border-l,
        .print-paper-sheet .border-r,
        .print-paper-sheet [class*="border-"],
        #printable-invoice-content .border,
        #printable-invoice-content .border-t,
        #printable-invoice-content .border-b,
        #printable-invoice-content .border-l,
        #printable-invoice-content .border-r,
        #printable-invoice-content [class*="border-"] {
          border-color: #e2e8f0 !important;
        }

        .print-paper-sheet .border-dashed,
        #printable-invoice-content .border-dashed {
          border-style: dashed !important;
          border-color: #cbd5e1 !important;
        }

        /* The wrapper container that frames the physical page sheet */
        div:has(> .print-paper-sheet),
        div:has(> #printable-invoice-content) {
          background-color: #ffffff !important;
          background: #ffffff !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid rgba(0, 0, 0, 0.15) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35) !important;
        }
      `}</style>
  );
};
