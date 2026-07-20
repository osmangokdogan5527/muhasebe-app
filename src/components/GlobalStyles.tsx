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

        /* FLUID MESH GEÇİŞLERİ VE SIVI TASARIM STİLİ OVERRIDES */
        [data-design-style="fluid-mesh"] {
          color: #f8fafc !important;
        }

        [data-design-style="fluid-mesh"] body,
        [data-design-style="fluid-mesh"].bg-\\[\\#050505\\],
        body:has([data-design-style="fluid-mesh"]) {
          background: transparent !important;
          color: #f1f5f9 !important;
          background-attachment: fixed !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1) !important;
        }

        /* Fluid Mesh Cards: Ultra transparent high contrast glassmorphism with glowing border */
        [data-design-style="fluid-mesh"] .bg-white,
        [data-design-style="fluid-mesh"] .bg-\\[\\#ffffff\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#111111\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#121212\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#151515\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#111111\\]\\/80,
        [data-design-style="fluid-mesh"] .bg-\\[\\#121316\\],
        [data-design-style="fluid-mesh"] .bg-\\[\\#0b0c0e\\],
        [data-design-style="fluid-mesh"] .bg-zinc-950,
        [data-design-style="fluid-mesh"] .bg-zinc-950\\/50,
        [data-design-style="fluid-mesh"] .bg-zinc-900\\/50,
        [data-design-style="fluid-mesh"] .bg-white\\/5,
        [data-design-style="fluid-mesh"] .bg-slate-50,
        [data-design-style="fluid-mesh"] .bg-slate-100,
        [data-design-style="fluid-mesh"] .bg-slate-900\\/50,
        [data-design-style="fluid-mesh"] .bg-zinc-900,
        [data-design-style="fluid-mesh"] .bg-zinc-800,
        [data-design-style="fluid-mesh"] .rounded-lg,
        [data-design-style="fluid-mesh"] .rounded-xl,
        [data-design-style="fluid-mesh"] .rounded-2xl {
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(28px) contrast(1.15) saturate(230%) !important;
          -webkit-backdrop-filter: blur(28px) contrast(1.15) saturate(230%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 16px 45px -12px rgba(0, 0, 0, 0.65),
            0 0 1px rgba(255, 255, 255, 0.2) !important;
          position: relative !important;
          overflow: hidden !important;
          color: #ffffff !important;
          transform-style: preserve-3d !important;
          perspective: 1000px !important;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        /* Fluid Mesh Hover effects */
        [data-design-style="fluid-mesh"] .bg-white:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#ffffff\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0a0a0a\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0c0c0c\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0d0d0d\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0f0f0f\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#111111\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#121212\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#151515\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#111111\\]\\/80:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#121316\\]:hover,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0b0c0e\\]:hover,
        [data-design-style="fluid-mesh"] .bg-zinc-950:hover,
        [data-design-style="fluid-mesh"] .bg-zinc-950\\/50:hover,
        [data-design-style="fluid-mesh"] .bg-zinc-900\\/50:hover,
        [data-design-style="fluid-mesh"] .bg-white\\/5:hover,
        [data-design-style="fluid-mesh"] .bg-slate-50:hover,
        [data-design-style="fluid-mesh"] .bg-slate-100:hover,
        [data-design-style="fluid-mesh"] .bg-slate-900\\/50:hover,
        [data-design-style="fluid-mesh"] .bg-zinc-900:hover,
        [data-design-style="fluid-mesh"] .bg-zinc-800:hover,
        [data-design-style="fluid-mesh"] .rounded-lg:hover,
        [data-design-style="fluid-mesh"] .rounded-xl:hover,
        [data-design-style="fluid-mesh"] .rounded-2xl:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.38) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.28) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 24px 60px -10px rgba(0, 0, 0, 0.8),
            0 0 30px rgba(255, 255, 255, 0.2),
            0 0 15px rgba(var(--accent-rgb), 0.3) !important;
          transform: translateY(-2px) !important;
        }

        /* Fluid Mesh Shine diagonal */
        [data-design-style="fluid-mesh"] .bg-white::before,
        [data-design-style="fluid-mesh"] .bg-\\[\\#ffffff\\]::before,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0a0a0a\\]::before,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0d0d0d\\]::before,
        [data-design-style="fluid-mesh"] .bg-\\[\\#111111\\]::before,
        [data-design-style="fluid-mesh"] .bg-white\\/5::before,
        [data-design-style="fluid-mesh"] .rounded-xl::before,
        [data-design-style="fluid-mesh"] .rounded-2xl::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 28%, transparent 50%, transparent 100%) !important;
          pointer-events: none !important;
          z-index: 1 !important;
        }

        /* Form inputs for Fluid Mesh */
        [data-design-style="fluid-mesh"] input,
        [data-design-style="fluid-mesh"] select,
        [data-design-style="fluid-mesh"] textarea,
        [data-design-style="fluid-mesh"] .bg-\\[\\#0c0c0c\\] {
          background-color: rgba(255, 255, 255, 0.02) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        }

        [data-design-style="fluid-mesh"] input:focus,
        [data-design-style="fluid-mesh"] select:focus,
        [data-design-style="fluid-mesh"] textarea:focus {
          border-color: rgba(var(--accent-rgb), 0.7) !important;
          box-shadow: 
            0 0 18px rgba(var(--accent-rgb), 0.35),
            inset 0 1px 2px rgba(255, 255, 255, 0.05) !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }

        /* Fluid mesh modal overrides */
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/80,
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/60,
        [data-design-style="fluid-mesh"] .fixed.inset-0.bg-black\\/50 {
          backdrop-filter: blur(18px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
          background-color: rgba(4, 3, 10, 0.5) !important;
        }

        [data-design-style="fluid-mesh"] .fixed.inset-0.z-50 .bg-\\[\\#0d0d0d\\],
        [data-design-style="fluid-mesh"] .fixed.inset-0.z-50 .bg-\\[\\#111111\\],
        [data-design-style="fluid-mesh"] .fixed.inset-0.z-50 .bg-\\[\\#151515\\] {
          background: rgba(12, 10, 24, 0.55) !important;
          backdrop-filter: blur(40px) saturate(220%) !important;
          -webkit-backdrop-filter: blur(40px) saturate(220%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.28) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: 
            0 25px 60px -15px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(var(--accent-rgb), 0.1) !important;
        }

        /* Fluid Mesh Buttons */
        [data-design-style="fluid-mesh"] button.bg-indigo-600,
        [data-design-style="fluid-mesh"] button.bg-indigo-500,
        [data-design-style="fluid-mesh"] .bg-indigo-600,
        [data-design-style="fluid-mesh"] .bg-indigo-500 {
          background: rgba(var(--accent-rgb), 0.3) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.6) !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: 
            0 4px 15px rgba(var(--accent-rgb), 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4) !important;
        }

        [data-design-style="fluid-mesh"] button.bg-indigo-600:hover,
        [data-design-style="fluid-mesh"] button.bg-indigo-500:hover,
        [data-design-style="fluid-mesh"] .bg-indigo-600:hover,
        [data-design-style="fluid-mesh"] .bg-indigo-500:hover {
          background: rgba(var(--accent-rgb), 0.45) !important;
          border-color: rgba(var(--accent-rgb), 0.85) !important;
          box-shadow: 
            0 6px 25px rgba(var(--accent-rgb), 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
        }

        /* Readability & Text Overrides */
        [data-design-style="fluid-mesh"] main .text-white,
        [data-design-style="fluid-mesh"] main .text-white\\/95,
        [data-design-style="fluid-mesh"] main .text-white\\/90,
        [data-design-style="fluid-mesh"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="fluid-mesh"] main .text-white\\/80,
        [data-design-style="fluid-mesh"] .text-slate-900,
        [data-design-style="fluid-mesh"] .text-slate-800,
        [data-design-style="fluid-mesh"] .text-slate-700,
        [data-design-style="fluid-mesh"] .text-zinc-900,
        [data-design-style="fluid-mesh"] .text-zinc-800,
        [data-design-style="fluid-mesh"] .text-zinc-700,
        [data-design-style="fluid-mesh"] .text-gray-900,
        [data-design-style="fluid-mesh"] .text-gray-800,
        [data-design-style="fluid-mesh"] .text-gray-700 {
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        [data-design-style="fluid-mesh"] main .text-white\\/70,
        [data-design-style="fluid-mesh"] main .text-white\\/60,
        [data-design-style="fluid-mesh"] .text-slate-500,
        [data-design-style="fluid-mesh"] .text-slate-600,
        [data-design-style="fluid-mesh"] .text-zinc-500,
        [data-design-style="fluid-mesh"] .text-zinc-600,
        [data-design-style="fluid-mesh"] .text-gray-500,
        [data-design-style="fluid-mesh"] .text-gray-600 {
          color: #e2e8f0 !important;
        }

        [data-design-style="fluid-mesh"] main .text-white\\/50,
        [data-design-style="fluid-mesh"] main .text-white\\/40,
        [data-design-style="fluid-mesh"] .text-zinc-400,
        [data-design-style="fluid-mesh"] .text-slate-400,
        [data-design-style="fluid-mesh"] .text-gray-400 {
          color: #cbd5e1 !important;
        }

        [data-design-style="fluid-mesh"] .border-slate-200,
        [data-design-style="fluid-mesh"] .border-slate-100,
        [data-design-style="fluid-mesh"] .border-zinc-800,
        [data-design-style="fluid-mesh"] .border-white\\/10 {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Sidebar in Fluid Mesh */
        [data-design-style="fluid-mesh"] aside {
          background: rgba(10, 8, 22, 0.22) !important;
          backdrop-filter: blur(35px) saturate(220%) !important;
          -webkit-backdrop-filter: blur(35px) saturate(220%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            12px 0 40px rgba(0, 0, 0, 0.5) !important;
        }

        [data-design-style="fluid-mesh"] aside .bg-black\\/40,
        [data-design-style="fluid-mesh"] aside .bg-black\\/20,
        [data-design-style="fluid-mesh"] aside .bg-black\\/15,
        [data-design-style="fluid-mesh"] aside .bg-\\[\\#111111\\] {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px) !important;
        }

        [data-design-style="fluid-mesh"] aside .text-white,
        [data-design-style="fluid-mesh"] aside .text-zinc-50,
        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"] {
          color: #f8fafc !important;
        }

        [data-design-style="fluid-mesh"] aside .text-zinc-300,
        [data-design-style="fluid-mesh"] aside .text-slate-300 {
          color: #f1f5f9 !important;
        }

        [data-design-style="fluid-mesh"] aside .text-zinc-400,
        [data-design-style="fluid-mesh"] aside .text-slate-400 {
          color: #cbd5e1 !important;
        }

        /* Sidebar profile footer */
        [data-design-style="fluid-mesh"] aside div.mt-auto {
          background: transparent !important;
        }

        [data-design-style="fluid-mesh"] aside div.mt-auto > div {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(25px) saturate(220%) !important;
          -webkit-backdrop-filter: blur(25px) saturate(220%) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 10px 30px rgba(0, 0, 0, 0.4) !important;
        }

        [data-design-style="fluid-mesh"] aside div.mt-auto div.border-white\/5,
        [data-design-style="fluid-mesh"] aside div.mt-auto button.border-white\/5,
        [data-design-style="fluid-mesh"] aside div.mt-auto button.border-teal-500\/20,
        [data-design-style="fluid-mesh"] aside div.mt-auto button.border-red-500\/20 {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          transition: all 0.3s ease !important;
        }

        [data-design-style="fluid-mesh"] aside div.mt-auto button:hover {
          background-color: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px) !important;
          box-shadow: 
            0 5px 15px rgba(0, 0, 0, 0.2),
            0 0 10px rgba(var(--accent-rgb), 0.2) !important;
        }

        /* StormLogo Fluid Mesh and Animations */
        [data-design-style="fluid-mesh"] .storm-logo-glass {
          filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 15px rgba(var(--accent-rgb), 0.25)) !important;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s ease !important;
          transform-style: preserve-3d !important;
          perspective: 1000px !important;
        }
        [data-design-style="fluid-mesh"] .storm-logo-glass:hover {
          transform: perspective(1000px) rotateX(8deg) rotateY(-8deg) translateZ(6px) translateY(-2px) scale(1.03) !important;
          filter: drop-shadow(-4px 8px 18px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 25px rgba(var(--accent-rgb), 0.4)) !important;
        }

        /* Icon wrapper in Fluid Mesh */
        [data-design-style="fluid-mesh"] .storm-icon-wrapper {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        [data-design-style="fluid-mesh"] .storm-icon-wrapper svg {
          stroke: #ffffff !important;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.25)) !important;
        }

        [data-design-style="fluid-mesh"] button:hover .storm-icon-wrapper,
        [data-design-style="fluid-mesh"] .group:hover .storm-icon-wrapper {
          background: rgba(255, 255, 255, 0.18) !important;
          border: 1px solid rgba(255, 255, 255, 0.28) !important;
          color: #ffffff !important;
          transform: scale(1.1) !important;
          box-shadow: 
            0 0 12px rgba(255, 255, 255, 0.2),
            0 0 8px rgba(var(--accent-rgb), 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }

        [data-design-style="fluid-mesh"] .storm-icon-wrapper.active-icon {
          background: var(--accent-600) !important;
          border: 1px solid rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
          box-shadow: 
            0 0 18px rgba(var(--accent-rgb), 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
        }

        [data-design-style="fluid-mesh"] aside button[id^="tab-btn-"][class*="bg-indigo-"],
        [data-design-style="fluid-mesh"] aside button[class*="bg-indigo-600"],
        [data-design-style="fluid-mesh"] aside div[class*="bg-indigo-600"] {
          background: rgba(var(--accent-rgb), 0.28) !important;
          border: 1px solid rgba(var(--accent-rgb), 0.55) !important;
          box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.35) !important;
          color: #ffffff !important;
        }

        /* Floating mesh core keyframes - Optimized with GPU Acceleration (3D transforms & will-change) */
        @keyframes mesh-float-1 {
          0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
          33% { transform: translate3d(60px, -80px, 0) scale3d(1.2, 1.2, 1); }
          66% { transform: translate3d(-30px, 30px, 0) scale3d(0.85, 0.85, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
        }
        @keyframes mesh-float-2 {
          0% { transform: translate3d(0, 0, 0) scale3d(1.1, 1.1, 1); }
          50% { transform: translate3d(-70px, 60px, 0) scale3d(0.9, 0.9, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(1.1, 1.1, 1); }
        }
        @keyframes mesh-float-3 {
          0% { transform: translate3d(0, 0, 0) scale3d(0.9, 0.9, 1); }
          33% { transform: translate3d(-40px, -40px, 0) scale3d(1.2, 1.2, 1); }
          66% { transform: translate3d(70px, 70px, 0) scale3d(0.8, 0.8, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(0.9, 0.9, 1); }
        }
        @keyframes mesh-float-4 {
          0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
          50% { transform: translate3d(80px, -50px, 0) scale3d(1.25, 1.25, 1); }
          100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
        }

        .animate-mesh-float-1 { 
          animation: mesh-float-1 25s infinite ease-in-out; 
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .animate-mesh-float-2 { 
          animation: mesh-float-2 30s infinite ease-in-out; 
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .animate-mesh-float-3 { 
          animation: mesh-float-3 22s infinite ease-in-out; 
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .animate-mesh-float-4 { 
          animation: mesh-float-4 28s infinite ease-in-out; 
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
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

        /* CLASSIC NAVY HIGH PERFORMANCE (ASİL LACİVERT VE YÜKSEK PERFORMANS) OVERRIDES */
        [data-design-style="navy-perf"] {
          color: #ffffff !important;
        }

        [data-design-style="navy-perf"] body,
        [data-design-style="navy-perf"].bg-\\[\\#050505\\],
        body:has([data-design-style="navy-perf"]),
        [data-design-style="navy-perf"] .min-h-screen {
          background-color: #000018 !important;
          background: linear-gradient(135deg, #000010 0%, #000028 100%) !important;
          color: #ffffff !important;
          background-attachment: fixed !important;
        }

        /* Override ALL dark panel, card, list and widget containers to deep navy cards with high contrast */
        [data-design-style="navy-perf"] [class*="bg-[#111111]"],
        [data-design-style="navy-perf"] [class*="bg-[#151515]"],
        [data-design-style="navy-perf"] [class*="bg-[#0a0a0a]"],
        [data-design-style="navy-perf"] [class*="bg-[#0c0c0c]"],
        [data-design-style="navy-perf"] [class*="bg-[#0d0d0d]"],
        [data-design-style="navy-perf"] [class*="bg-[#0f0f0f]"],
        [data-design-style="navy-perf"] [class*="bg-[#121212]"],
        [data-design-style="navy-perf"] [class*="bg-[#080808]"],
        [data-design-style="navy-perf"] [class*="bg-[#0b0c0e]"],
        [data-design-style="navy-perf"] [class*="bg-[#121316]"],
        [data-design-style="navy-perf"] [class*="bg-zinc-900"],
        [data-design-style="navy-perf"] [class*="bg-zinc-950"],
        [data-design-style="navy-perf"] [class*="bg-slate-900"],
        [data-design-style="navy-perf"] [class*="bg-black"],
        [data-design-style="navy-perf"] [class*="bg-white/5"],
        [data-design-style="navy-perf"] [class*="bg-white/10"],
        [data-design-style="navy-perf"] [class*="bg-white/20"],
        [data-design-style="navy-perf"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="navy-perf"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="navy-perf"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="navy-perf"] .bg-\\[\\#111111\\],
        [data-design-style="navy-perf"] .bg-\\[\\#121212\\],
        [data-design-style="navy-perf"] .bg-\\[\\#151515\\],
        [data-design-style="navy-perf"] .bg-\\[\\#080808\\],
        [data-design-style="navy-perf"] .bg-\\[\\#0b0c0e\\],
        [data-design-style="navy-perf"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="navy-perf"] .bg-\\[\\#121316\\],
        [data-design-style="navy-perf"] .bg-white\\/5,
        [data-design-style="navy-perf"] .bg-white\\/10,
        [data-design-style="navy-perf"] .bg-\\[\\#1a1f36\\],
        [data-design-style="navy-perf"] .bg-black\\/10,
        [data-design-style="navy-perf"] .bg-black\\/20,
        [data-design-style="navy-perf"] .bg-black\\/30,
        [data-design-style="navy-perf"] .bg-black\\/40,
        [data-design-style="navy-perf"] .bg-slate-900,
        [data-design-style="navy-perf"] .bg-zinc-900,
        [data-design-style="navy-perf"] .bg-zinc-950,
        [data-design-style="navy-perf"] .bg-black\\/50,
        [data-design-style="navy-perf"] .bg-white,
        [data-design-style="navy-perf"] .bg-\\[\\#ffffff\\],
        [data-design-style="navy-perf"] [class*="bg-[#ffffff]"] {
          background-color: #00003c !important;
          background: #00003c !important;
          border: 1.5px solid #00007f !important;
          box-shadow: 0 4px 12px rgba(0, 0, 127, 0.25) !important;
          color: #ffffff !important;
        }

        /* Hover styles inside navy-perf panels */
        [data-design-style="navy-perf"] [class*="bg-white/5"]:hover,
        [data-design-style="navy-perf"] [class*="bg-white/10"]:hover,
        [data-design-style="navy-perf"] [class*="hover:bg-white/5"]:hover,
        [data-design-style="navy-perf"] [class*="hover:bg-white/10"]:hover,
        [data-design-style="navy-perf"] .bg-white\\/5:hover,
        [data-design-style="navy-perf"] .hover\\:bg-white\\/5:hover,
        [data-design-style="navy-perf"] .hover\\:bg-white\\/10:hover,
        [data-design-style="navy-perf"] .bg-white\\/10:hover {
          background-color: #000055 !important;
          background: #000055 !important;
          border-color: #0000b0 !important;
        }

        /* Top Welcome Banner Custom Gradient Styling */
        [data-design-style="navy-perf"] .dashboard-wrapper > div:first-child,
        [data-design-style="navy-perf"] [class*="bg-[#111111]"][class*="bg-gradient-to-br"] {
          background-color: #00003c !important;
          background: linear-gradient(135deg, #000028 0%, #00004a 100%) !important;
          border: 1.5px solid #00007f !important;
          box-shadow: 0 10px 25px rgba(0, 0, 127, 0.3) !important;
        }

        /* Inputs, Selects, Textareas, Inputs inside panels */
        [data-design-style="navy-perf"] input,
        [data-design-style="navy-perf"] select,
        [data-design-style="navy-perf"] textarea,
        [data-design-style="navy-perf"] option,
        [data-design-style="navy-perf"] [class*="bg-[#0c0c0c]"],
        [data-design-style="navy-perf"] [class*="bg-[#121316]"],
        [data-design-style="navy-perf"] [class*="bg-white/5"],
        [data-design-style="navy-perf"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="navy-perf"] .bg-\\[\\#121316\\],
        [data-design-style="navy-perf"] .bg-white\\/5,
        [data-design-style="navy-perf"] .bg-slate-50,
        [data-design-style="navy-perf"] .bg-zinc-50,
        [data-design-style="navy-perf"] .bg-slate-100,
        [data-design-style="navy-perf"] .bg-zinc-100,
        [data-design-style="navy-perf"] .bg-slate-50\\/50,
        [data-design-style="navy-perf"] .bg-zinc-50\\/50,
        [data-design-style="navy-perf"] .bg-slate-50\\/80,
        [data-design-style="navy-perf"] .bg-zinc-50\\/80,
        [data-design-style="navy-perf"] [class*="bg-slate-50"],
        [data-design-style="navy-perf"] [class*="bg-zinc-50"],
        [data-design-style="navy-perf"] [class*="bg-slate-100"],
        [data-design-style="navy-perf"] [class*="bg-zinc-100"] {
          background-color: #000022 !important;
          background: #000022 !important;
          color: #ffffff !important;
          border: 1px solid #00007f !important;
        }

        [data-design-style="navy-perf"] option {
          background-color: #000022 !important;
          color: #ffffff !important;
        }

        [data-design-style="navy-perf"] input:focus,
        [data-design-style="navy-perf"] select:focus,
        [data-design-style="navy-perf"] textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
          outline: none !important;
        }

        [data-design-style="navy-perf"] input::placeholder,
        [data-design-style="navy-perf"] textarea::placeholder {
          color: #a3b8cc !important;
          opacity: 0.8 !important;
        }

        [data-design-style="navy-perf"] select option {
          background-color: #000022 !important;
          color: #ffffff !important;
        }

        /* Override modal window wrappers specifically to a solid dark navy in navy-perf */
        [data-design-style="navy-perf"] .modal-content,
        [data-design-style="navy-perf"] [class*="bg-white"][class*="rounded-xl"][class*="shadow-2xl"],
        [data-design-style="navy-perf"] [class*="bg-white"][class*="rounded-2xl"][class*="shadow-xl"] {
          background-color: #000028 !important;
          background: #000028 !important;
          border: 1.5px solid #00007f !important;
          box-shadow: 0 20px 50px rgba(0, 0, 127, 0.4) !important;
        }

        [data-design-style="navy-perf"] [class*="bg-white"][class*="rounded-xl"] header,
        [data-design-style="navy-perf"] [class*="bg-white"][class*="rounded-xl"] form,
        [data-design-style="navy-perf"] [class*="bg-white"][class*="rounded-xl"] .border-b {
          background-color: transparent !important;
          border-color: #00007f !important;
        }

        /* High contrast borders and dividers under navy-perf */
        [data-design-style="navy-perf"] .border-slate-100,
        [data-design-style="navy-perf"] .border-slate-200,
        [data-design-style="navy-perf"] .border-zinc-200,
        [data-design-style="navy-perf"] .border-zinc-100,
        [data-design-style="navy-perf"] .border-white\\/10,
        [data-design-style="navy-perf"] .border-white\\/20,
        [data-design-style="navy-perf"] [class*="border-slate-"],
        [data-design-style="navy-perf"] [class*="border-zinc-"],
        [data-design-style="navy-perf"] [class*="divide-slate-"],
        [data-design-style="navy-perf"] [class*="divide-zinc-"],
        [data-design-style="navy-perf"] .divide-slate-100,
        [data-design-style="navy-perf"] .divide-zinc-100 {
          border-color: #00007f !important;
        }

        /* Button styling overrides inside navy-perf */
        [data-design-style="navy-perf"] button.bg-white,
        [data-design-style="navy-perf"] button[class*="bg-white"] {
          background-color: #00003c !important;
          background: #00003c !important;
          color: #ffffff !important;
          border: 1px solid #00007f !important;
        }
        [data-design-style="navy-perf"] button.bg-white:hover,
        [data-design-style="navy-perf"] button[class*="bg-white"]:hover {
          background-color: #000055 !important;
          background: #000055 !important;
          border-color: #0000b0 !important;
        }

        /* Selected account lists active item overrides under navy-perf */
        [data-design-style="navy-perf"] .bg-amber-50.border-amber-400 {
          background-color: rgba(245, 158, 11, 0.15) !important;
          border-color: #f59e0b !important;
          color: #ffffff !important;
        }
        [data-design-style="navy-perf"] .bg-blue-50.border-blue-400 {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;
        }
        [data-design-style="navy-perf"] .bg-purple-50.border-purple-400 {
          background-color: rgba(168, 85, 247, 0.15) !important;
          border-color: #a855f7 !important;
          color: #ffffff !important;
        }

        /* Category Badges premium neon styling inside navy-perf */
        [data-design-style="navy-perf"] .bg-amber-50 {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #f59e0b !important;
          border: 1px solid rgba(245, 158, 11, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-sky-50 {
          background-color: rgba(14, 165, 233, 0.15) !important;
          color: #38bdf8 !important;
          border: 1px solid rgba(14, 165, 233, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-orange-50 {
          background-color: rgba(249, 115, 22, 0.15) !important;
          color: #f97316 !important;
          border: 1px solid rgba(249, 115, 22, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-emerald-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #34d399 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-indigo-50 {
          background-color: rgba(99, 102, 241, 0.15) !important;
          color: #818cf8 !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-purple-50 {
          background-color: rgba(168, 85, 247, 0.15) !important;
          color: #c084fc !important;
          border: 1px solid rgba(168, 85, 247, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-rose-50 {
          background-color: rgba(244, 63, 94, 0.15) !important;
          color: #fb7185 !important;
          border: 1px solid rgba(244, 63, 94, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-cyan-50 {
          background-color: rgba(6, 182, 212, 0.15) !important;
          color: #22d3ee !important;
          border: 1px solid rgba(6, 182, 212, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-blue-50 {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-red-50 {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
        }
        [data-design-style="navy-perf"] .bg-teal-50 {
          background-color: rgba(20, 184, 166, 0.15) !important;
          color: #2dd4bf !important;
          border: 1px solid rgba(20, 184, 166, 0.3) !important;
        }

        /* Force crisp white texts */
        [data-design-style="navy-perf"] [class*="text-white"],
        [data-design-style="navy-perf"] [class*="text-zinc-50"],
        [data-design-style="navy-perf"] [class*="text-zinc-100"],
        [data-design-style="navy-perf"] [class*="text-zinc-200"],
        [data-design-style="navy-perf"] [class*="text-slate-100"],
        [data-design-style="navy-perf"] [class*="text-slate-200"],
        [data-design-style="navy-perf"] [class*="text-[#e0e0e0]"],
        [data-design-style="navy-perf"] main .text-white,
        [data-design-style="navy-perf"] main .text-white\\/95,
        [data-design-style="navy-perf"] main .text-white\\/90,
        [data-design-style="navy-perf"] main .text-white\\/80,
        [data-design-style="navy-perf"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="navy-perf"] main .text-zinc-100,
        [data-design-style="navy-perf"] main .text-slate-100,
        [data-design-style="navy-perf"] main .text-zinc-200,
        [data-design-style="navy-perf"] main .text-slate-200 {
          color: #ffffff !important;
        }

        /* Secondary and subtle texts */
        [data-design-style="navy-perf"] [class*="text-white/70"],
        [data-design-style="navy-perf"] [class*="text-white/60"],
        [data-design-style="navy-perf"] [class*="text-white/50"],
        [data-design-style="navy-perf"] [class*="text-white/40"],
        [data-design-style="navy-perf"] [class*="text-slate-400"],
        [data-design-style="navy-perf"] [class*="text-zinc-400"],
        [data-design-style="navy-perf"] [class*="text-slate-300"],
        [data-design-style="navy-perf"] [class*="text-zinc-300"],
        [data-design-style="navy-perf"] [class*="text-slate-500"],
        [data-design-style="navy-perf"] [class*="text-zinc-500"],
        [data-design-style="navy-perf"] main .text-white\\/70,
        [data-design-style="navy-perf"] main .text-white\\/60,
        [data-design-style="navy-perf"] main .text-white\\/50,
        [data-design-style="navy-perf"] main .text-slate-400,
        [data-design-style="navy-perf"] main .text-zinc-400,
        [data-design-style="navy-perf"] main .text-slate-300,
        [data-design-style="navy-perf"] main .text-slate-500,
        [data-design-style="navy-perf"] main .text-zinc-500 {
          color: #b0c2f2 !important;
        }

        /* Dark slate/gray text fallback overridden to light blue for navy contrast */
        [data-design-style="navy-perf"] [class*="text-slate-900"],
        [data-design-style="navy-perf"] [class*="text-slate-800"],
        [data-design-style="navy-perf"] [class*="text-slate-700"],
        [data-design-style="navy-perf"] [class*="text-zinc-900"],
        [data-design-style="navy-perf"] [class*="text-zinc-800"],
        [data-design-style="navy-perf"] [class*="text-zinc-700"],
        [data-design-style="navy-perf"] main .text-slate-900,
        [data-design-style="navy-perf"] main .text-slate-800,
        [data-design-style="navy-perf"] main .text-slate-700,
        [data-design-style="navy-perf"] main .text-zinc-900,
        [data-design-style="navy-perf"] main .text-zinc-800,
        [data-design-style="navy-perf"] main .text-zinc-700,
        [data-design-style="navy-perf"] .text-slate-900,
        [data-design-style="navy-perf"] .text-slate-800,
        [data-design-style="navy-perf"] .text-slate-700,
        [data-design-style="navy-perf"] .text-slate-600,
        [data-design-style="navy-perf"] .text-zinc-900,
        [data-design-style="navy-perf"] .text-zinc-800,
        [data-design-style="navy-perf"] .text-zinc-700,
        [data-design-style="navy-perf"] .text-zinc-600,
        [data-design-style="navy-perf"] .text-zinc-500,
        [data-design-style="navy-perf"] .text-slate-500 {
          color: #ffffff !important;
        }

        /* Status Colors high contrast adjustments */
        [data-design-style="navy-perf"] [class*="text-teal-400"],
        [data-design-style="navy-perf"] .text-teal-400 {
          color: #00ffcc !important;
        }

        [data-design-style="navy-perf"] [class*="text-amber-400"],
        [data-design-style="navy-perf"] .text-amber-400,
        [data-design-style="navy-perf"] [class*="text-amber-500"],
        [data-design-style="navy-perf"] .text-amber-500 {
          color: #ffcc00 !important;
        }

        [data-design-style="navy-perf"] [class*="text-rose-400"],
        [data-design-style="navy-perf"] .text-rose-400 {
          color: #ff4d6a !important;
        }

        [data-design-style="navy-perf"] [class*="text-emerald-400"],
        [data-design-style="navy-perf"] .text-emerald-400 {
          color: #00ff88 !important;
        }

        /* Borders high contrast */
        [data-design-style="navy-perf"] [class*="border-white/5"],
        [data-design-style="navy-perf"] [class*="border-white/10"],
        [data-design-style="navy-perf"] [class*="border-white/20"],
        [data-design-style="navy-perf"] [class*="border-zinc-800"],
        [data-design-style="navy-perf"] .border-slate-200,
        [data-design-style="navy-perf"] .border-slate-100,
        [data-design-style="navy-perf"] .border-white\\/5,
        [data-design-style="navy-perf"] .border-white\\/10,
        [data-design-style="navy-perf"] .border-white\\/20,
        [data-design-style="navy-perf"] .border-zinc-800 {
          border-color: #00007f !important;
        }

        /* Sidebar styles when navy-perf is active */
        [data-design-style="navy-perf"] aside {
          background-color: #000014 !important;
          border-right: 1.5px solid #00007f !important;
        }

        [data-design-style="navy-perf"] aside,
        [data-design-style="navy-perf"] aside .text-white,
        [data-design-style="navy-perf"] aside .text-zinc-50,
        [data-design-style="navy-perf"] aside button,
        [data-design-style="navy-perf"] aside span {
          color: #ffffff !important;
        }

        [data-design-style="navy-perf"] aside .text-zinc-400,
        [data-design-style="navy-perf"] aside .text-zinc-300 {
          color: #b0c2f2 !important;
        }

        [data-design-style="navy-perf"] aside .border-white\\/10,
        [data-design-style="navy-perf"] aside .border-white\\/5 {
          border-color: #00007f !important;
        }

        [data-design-style="navy-perf"] aside .bg-black\\/15,
        [data-design-style="navy-perf"] aside .bg-white\\/5 {
          background-color: #000028 !important;
          border: 1px solid #00007f !important;
        }

        [data-design-style="navy-perf"] aside .hover\\:bg-white\\/5:hover {
          background-color: #00003c !important;
          color: #ffffff !important;
        }

        [data-design-style="navy-perf"] aside .hover\\:text-white:hover {
          color: #ffffff !important;
        }

        /* Header overrides */
        [data-design-style="navy-perf"] header {
          background-color: #000014 !important;
          border-bottom: 1.5px solid #00007f !important;
        }

        /* Tables overrides */
        [data-design-style="navy-perf"] thead,
        [data-design-style="navy-perf"] th {
          background-color: #000028 !important;
          border-bottom: 1.5px solid #00007f !important;
          color: #ffffff !important;
        }

        [data-design-style="navy-perf"] tbody tr {
          border-bottom: 1px solid #00003c !important;
        }

        [data-design-style="navy-perf"] tbody tr:hover {
          background-color: #00003c !important;
        }

        /* Scrollbars */
        [data-design-style="navy-perf"] ::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        [data-design-style="navy-perf"] ::-webkit-scrollbar-track {
          background: #000010 !important;
        }
        [data-design-style="navy-perf"] ::-webkit-scrollbar-thumb {
          background: #00007f !important;
          border-radius: 4px !important;
        }
        [data-design-style="navy-perf"] ::-webkit-scrollbar-thumb:hover {
          background: #0000b0 !important;
        }

        /* CLEAN LIGHT & PERFORMANCE THEME (TEMİZ IŞIK VE YÜKSEK PERFORMANS) OVERRIDES */
        [data-design-style="clean-light"] {
          color: color-mix(in srgb, var(--accent-950) 80%, #0f172a) !important;
        }

        [data-design-style="clean-light"] body,
        [data-design-style="clean-light"].bg-\\[\\#050505\\],
        body:has([data-design-style="clean-light"]),
        [data-design-style="clean-light"] .min-h-screen {
          background-color: color-mix(in srgb, var(--accent-50) 15%, #f1f5f9) !important;
          background: 
            ${bodyPatternSvg ? `${bodyPatternSvg},` : ''}
            linear-gradient(135deg, color-mix(in srgb, var(--accent-100) 12%, #f1f5f9) 0%, color-mix(in srgb, var(--accent-50) 8%, #f8fafc) 100%) !important;
          background-size: ${bodyPatternSvg ? `${activePattern.size || 'auto'}, 100% 100%` : '100% 100%'} !important;
          background-repeat: ${bodyPatternSvg ? 'repeat, no-repeat' : 'no-repeat'} !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
          background-attachment: fixed !important;
        }

        /* Override ALL dark panel, card, list and widget containers to clean white cards with gorgeous soft tint */
        [data-design-style="clean-light"] [class*="bg-[#111111]"],
        [data-design-style="clean-light"] [class*="bg-[#151515]"],
        [data-design-style="clean-light"] [class*="bg-[#0a0a0a]"],
        [data-design-style="clean-light"] [class*="bg-[#0c0c0c]"],
        [data-design-style="clean-light"] [class*="bg-[#0d0d0d]"],
        [data-design-style="clean-light"] [class*="bg-[#0f0f0f]"],
        [data-design-style="clean-light"] [class*="bg-[#121212]"],
        [data-design-style="clean-light"] [class*="bg-[#080808]"],
        [data-design-style="clean-light"] [class*="bg-[#0b0c0e]"],
        [data-design-style="clean-light"] [class*="bg-[#121316]"],
        [data-design-style="clean-light"] [class*="bg-zinc-900"],
        [data-design-style="clean-light"] [class*="bg-zinc-950"],
        [data-design-style="clean-light"] [class*="bg-slate-900"],
        [data-design-style="clean-light"] [class*="bg-black"],
        [data-design-style="clean-light"] [class*="bg-white/5"],
        [data-design-style="clean-light"] [class*="bg-white/10"],
        [data-design-style="clean-light"] [class*="bg-white/20"],
        [data-design-style="clean-light"] .bg-\\[\\#0a0a0a\\],
        [data-design-style="clean-light"] .bg-\\[\\#0d0d0d\\],
        [data-design-style="clean-light"] .bg-\\[\\#0f0f0f\\],
        [data-design-style="clean-light"] .bg-\\[\\#111111\\],
        [data-design-style="clean-light"] .bg-\\[\\#121212\\],
        [data-design-style="clean-light"] .bg-\\[\\#151515\\],
        [data-design-style="clean-light"] .bg-\\[\\#080808\\],
        [data-design-style="clean-light"] .bg-\\[\\#0b0c0e\\],
        [data-design-style="clean-light"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="clean-light"] .bg-\\[\\#121316\\],
        [data-design-style="clean-light"] .bg-white\\/5,
        [data-design-style="clean-light"] .bg-white\\/10,
        [data-design-style="clean-light"] .bg-\\[\\#1a1f36\\],
        [data-design-style="clean-light"] .bg-black\\/10,
        [data-design-style="clean-light"] .bg-black\\/20,
        [data-design-style="clean-light"] .bg-black\\/30,
        [data-design-style="clean-light"] .bg-black\\/40,
        [data-design-style="clean-light"] .bg-slate-900,
        [data-design-style="clean-light"] .bg-zinc-900,
        [data-design-style="clean-light"] .bg-zinc-950,
        [data-design-style="clean-light"] .bg-black\\/50 {
          background-color: #ffffff !important;
          background: #ffffff !important;
          border: 1px solid color-mix(in srgb, var(--accent-300) 18%, #e2e8f0) !important;
          box-shadow: 0 4px 20px -2px color-mix(in srgb, var(--accent-500) 3%, rgba(0,0,0,0.015)), 0 2px 6px -1px color-mix(in srgb, var(--accent-500) 2%, rgba(0,0,0,0.01)) !important;
          color: color-mix(in srgb, var(--accent-950) 80%, #1e293b) !important;
        }

        /* Hover styles inside clean light panels */
        [data-design-style="clean-light"] [class*="bg-white/5"]:hover,
        [data-design-style="clean-light"] [class*="bg-white/10"]:hover,
        [data-design-style="clean-light"] [class*="hover:bg-white/5"]:hover,
        [data-design-style="clean-light"] [class*="hover:bg-white/10"]:hover,
        [data-design-style="clean-light"] .bg-white\\/5:hover,
        [data-design-style="clean-light"] .hover\\:bg-white\\/5:hover,
        [data-design-style="clean-light"] .hover\\:bg-white\\/10:hover,
        [data-design-style="clean-light"] .bg-white\\/10:hover {
          background-color: color-mix(in srgb, var(--accent-50) 35%, #f8fafc) !important;
          background: color-mix(in srgb, var(--accent-50) 35%, #f8fafc) !important;
          border-color: color-mix(in srgb, var(--accent-300) 35%, #cbd5e1) !important;
        }

        /* Top Welcome Banner Custom Gradient Styling - Pure Magic */
        [data-design-style="clean-light"] .dashboard-wrapper > div:first-child,
        [data-design-style="clean-light"] [class*="bg-[#111111]"][class*="bg-gradient-to-br"] {
          background-color: #ffffff !important;
          background: linear-gradient(135deg, color-mix(in srgb, var(--accent-50) 55%, #ffffff) 0%, #ffffff 100%) !important;
          border: 1px solid color-mix(in srgb, var(--accent-400) 25%, #cbd5e1) !important;
          box-shadow: 0 10px 25px -5px color-mix(in srgb, var(--accent-500) 6%, rgba(0, 0, 0, 0.02)), 0 8px 10px -6px color-mix(in srgb, var(--accent-500) 4%, rgba(0, 0, 0, 0.01)) !important;
        }

        /* Inputs, Selects, Textareas, Inputs inside panels */
        [data-design-style="clean-light"] input,
        [data-design-style="clean-light"] select,
        [data-design-style="clean-light"] textarea,
        [data-design-style="clean-light"] option,
        [data-design-style="clean-light"] [class*="bg-[#0c0c0c]"],
        [data-design-style="clean-light"] [class*="bg-[#121316]"],
        [data-design-style="clean-light"] [class*="bg-white/5"],
        [data-design-style="clean-light"] .bg-\\[\\#0c0c0c\\],
        [data-design-style="clean-light"] .bg-\\[\\#121316\\],
        [data-design-style="clean-light"] .bg-white\\/5 {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
          border: 1px solid color-mix(in srgb, var(--accent-300) 25%, #cbd5e1) !important;
        }

        [data-design-style="clean-light"] option {
          background-color: #ffffff !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
        }

        [data-design-style="clean-light"] input:focus,
        [data-design-style="clean-light"] select:focus,
        [data-design-style="clean-light"] textarea:focus {
          border-color: var(--accent-600) !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-500) 15%, transparent) !important;
        }

        [data-design-style="clean-light"] input::placeholder,
        [data-design-style="clean-light"] textarea::placeholder {
          color: color-mix(in srgb, var(--accent-400) 40%, #94a3b8) !important;
          opacity: 1 !important;
        }

        [data-design-style="clean-light"] select option {
          background-color: #ffffff !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
        }

        /* Advanced Human-Friendly Core Text Remapping (Bye bye raw blacks & hidden white text) */
        [data-design-style="clean-light"] [class*="text-white"],
        [data-design-style="clean-light"] [class*="text-zinc-50"],
        [data-design-style="clean-light"] [class*="text-zinc-100"],
        [data-design-style="clean-light"] [class*="text-zinc-200"],
        [data-design-style="clean-light"] [class*="text-slate-100"],
        [data-design-style="clean-light"] [class*="text-slate-200"],
        [data-design-style="clean-light"] [class*="text-[#e0e0e0]"],
        [data-design-style="clean-light"] main .text-white,
        [data-design-style="clean-light"] main .text-white\\/95,
        [data-design-style="clean-light"] main .text-white\\/90,
        [data-design-style="clean-light"] main .text-white\\/80,
        [data-design-style="clean-light"] main .text-\\[\\#e0e0e0\\],
        [data-design-style="clean-light"] main .text-zinc-100,
        [data-design-style="clean-light"] main .text-slate-100,
        [data-design-style="clean-light"] main .text-zinc-200,
        [data-design-style="clean-light"] main .text-slate-200 {
          color: color-mix(in srgb, var(--accent-950) 45%, #0f172a) !important;
          text-shadow: none !important;
        }

        [data-design-style="clean-light"] [class*="text-white/70"],
        [data-design-style="clean-light"] [class*="text-white/60"],
        [data-design-style="clean-light"] [class*="text-white/50"],
        [data-design-style="clean-light"] [class*="text-white/40"],
        [data-design-style="clean-light"] [class*="text-slate-400"],
        [data-design-style="clean-light"] [class*="text-zinc-400"],
        [data-design-style="clean-light"] [class*="text-slate-300"],
        [data-design-style="clean-light"] [class*="text-zinc-300"],
        [data-design-style="clean-light"] [class*="text-slate-500"],
        [data-design-style="clean-light"] [class*="text-zinc-500"],
        [data-design-style="clean-light"] main .text-white\\/70,
        [data-design-style="clean-light"] main .text-white\\/60,
        [data-design-style="clean-light"] main .text-white\\/50,
        [data-design-style="clean-light"] main .text-slate-400,
        [data-design-style="clean-light"] main .text-zinc-400,
        [data-design-style="clean-light"] main .text-slate-300,
        [data-design-style="clean-light"] main .text-slate-500,
        [data-design-style="clean-light"] main .text-zinc-500 {
          color: color-mix(in srgb, var(--accent-800) 35%, #475569) !important;
          text-shadow: none !important;
        }

        [data-design-style="clean-light"] [class*="text-slate-900"],
        [data-design-style="clean-light"] [class*="text-slate-800"],
        [data-design-style="clean-light"] [class*="text-slate-700"],
        [data-design-style="clean-light"] [class*="text-zinc-900"],
        [data-design-style="clean-light"] [class*="text-zinc-800"],
        [data-design-style="clean-light"] [class*="text-zinc-700"],
        [data-design-style="clean-light"] main .text-slate-900,
        [data-design-style="clean-light"] main .text-slate-800,
        [data-design-style="clean-light"] main .text-slate-700,
        [data-design-style="clean-light"] main .text-zinc-900,
        [data-design-style="clean-light"] main .text-zinc-800,
        [data-design-style="clean-light"] main .text-zinc-700 {
          color: color-mix(in srgb, var(--accent-950) 50%, #0f172a) !important;
        }

        /* Color Contrast Correction for Dashboard Neon Indicators & Highlights */
        [data-design-style="clean-light"] [class*="text-teal-400"],
        [data-design-style="clean-light"] .text-teal-400 {
          color: color-mix(in srgb, var(--accent-700) 85%, #0d9488) !important;
        }
        [data-design-style="clean-light"] [class*="text-amber-400"],
        [data-design-style="clean-light"] .text-amber-400,
        [data-design-style="clean-light"] [class*="text-amber-500"],
        [data-design-style="clean-light"] .text-amber-500 {
          color: #b45309 !important; /* Premium Amber/Gold-700 with high contrast */
        }
        [data-design-style="clean-light"] [class*="text-rose-400"],
        [data-design-style="clean-light"] .text-rose-400 {
          color: #be123c !important; /* Rose-700 */
        }
        [data-design-style="clean-light"] [class*="text-emerald-400"],
        [data-design-style="clean-light"] .text-emerald-400 {
          color: #047857 !important; /* Emerald-700 */
        }
        [data-design-style="clean-light"] [class*="text-indigo-400"],
        [data-design-style="clean-light"] .text-indigo-400 {
          color: #4338ca !important; /* Indigo-700 */
        }

        /* Borders to clean, light, accent-tinted gray */
        [data-design-style="clean-light"] [class*="border-white/5"],
        [data-design-style="clean-light"] [class*="border-white/10"],
        [data-design-style="clean-light"] [class*="border-white/20"],
        [data-design-style="clean-light"] [class*="border-zinc-800"],
        [data-design-style="clean-light"] .border-slate-200,
        [data-design-style="clean-light"] .border-slate-100,
        [data-design-style="clean-light"] .border-white\\/5,
        [data-design-style="clean-light"] .border-white\\/10,
        [data-design-style="clean-light"] .border-white\\/20,
        [data-design-style="clean-light"] .border-zinc-800 {
          border-color: color-mix(in srgb, var(--accent-300) 15%, #e2e8f0) !important;
        }

        /* Sidebar styles when clean-light is active */
        [data-design-style="clean-light"] aside {
          background-color: #ffffff !important;
          border-right: 1px solid color-mix(in srgb, var(--accent-200) 25%, #e2e8f0) !important;
          box-shadow: 1px 0 5px rgba(0, 0, 0, 0.01) !important;
        }

        [data-design-style="clean-light"] aside,
        [data-design-style="clean-light"] aside .text-white,
        [data-design-style="clean-light"] aside .text-zinc-50,
        [data-design-style="clean-light"] aside button,
        [data-design-style="clean-light"] aside span {
          color: color-mix(in srgb, var(--accent-950) 80%, #1e293b) !important;
        }

        [data-design-style="clean-light"] aside .text-zinc-400,
        [data-design-style="clean-light"] aside .text-zinc-300 {
          color: color-mix(in srgb, var(--accent-900) 65%, #475569) !important;
        }

        [data-design-style="clean-light"] aside .border-white\\/10,
        [data-design-style="clean-light"] aside .border-white\\/5 {
          border-color: color-mix(in srgb, var(--accent-200) 20%, #e2e8f0) !important;
        }

        [data-design-style="clean-light"] aside .bg-black\\/15,
        [data-design-style="clean-light"] aside .bg-white\\/5 {
          background-color: color-mix(in srgb, var(--accent-100) 25%, #f1f5f9) !important;
        }

        [data-design-style="clean-light"] aside .hover\\:bg-white\\/5:hover {
          background-color: color-mix(in srgb, var(--accent-100) 50%, #e2e8f0) !important;
          color: var(--accent-900) !important;
        }

        [data-design-style="clean-light"] aside .hover\\:text-white:hover {
          color: var(--accent-950) !important;
        }

        [data-design-style="clean-light"] aside.sidebar-light {
          background-color: #ffffff !important;
        }

        /* Mobile Header */
        [data-design-style="clean-light"] header {
          background-color: #ffffff !important;
          border-bottom: 1px solid color-mix(in srgb, var(--accent-200) 25%, #e2e8f0) !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
        }

        /* Table custom styling for super clean and legible rows */
        [data-design-style="clean-light"] thead,
        [data-design-style="clean-light"] th {
          background-color: color-mix(in srgb, var(--accent-50) 40%, #f8fafc) !important;
          color: color-mix(in srgb, var(--accent-900) 70%, #334155) !important;
          border-bottom: 2px solid color-mix(in srgb, var(--accent-200) 30%, #e2e8f0) !important;
        }

        [data-design-style="clean-light"] tbody tr {
          border-bottom: 1px solid color-mix(in srgb, var(--accent-100) 15%, #f1f5f9) !important;
          background-color: #ffffff !important;
        }

        [data-design-style="clean-light"] tbody tr:hover {
          background-color: color-mix(in srgb, var(--accent-50) 25%, #f8fafc) !important;
        }

        /* Fast and lightweight Scrollbars for Performance Mode */
        [data-design-style="clean-light"] ::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }

        [data-design-style="clean-light"] ::-webkit-scrollbar-track {
          background: color-mix(in srgb, var(--accent-50) 10%, #f1f5f9) !important;
        }

        [data-design-style="clean-light"] ::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--accent-200) 50%, #cbd5e1) !important;
          border-radius: 3px !important;
        }

        [data-design-style="clean-light"] ::-webkit-scrollbar-thumb:hover {
          background: var(--accent-500) !important;
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
