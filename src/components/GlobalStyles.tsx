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

        ${globalStylesPart2}
      `}</style>
  );
};
