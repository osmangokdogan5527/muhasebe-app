export const globalStylesPart2 = `

        /* CLEAN LIGHT & PERFORMANCE THEME (TEMİZ IŞIK VE YÜKSEK PERFORMANS) OVERRIDES */
        [data-design-style="clean-light"] {
          color: color-mix(in srgb, var(--accent-950) 80%, #0f172a) !important;
        }

        [data-design-style="clean-light"] body,
        [data-design-style="pro-solid"] body,
        [data-design-style="clean-light"].bg-\\[\\#050505\\],
        body:has([data-design-style="clean-light"]),
        body:has([data-design-style="pro-solid"]),
        [data-design-style="clean-light"] .min-h-screen,
        [data-design-style="pro-solid"] .min-h-screen {
          background-color: color-mix(in srgb, var(--accent-50) 15%, #f1f5f9) !important;
          background: 
            linear-gradient(135deg, color-mix(in srgb, var(--accent-100) 12%, #f1f5f9) 0%, color-mix(in srgb, var(--accent-50) 8%, #f8fafc) 100%) !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
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
        [data-design-style="clean-light"] [class*="bg-[#18181b]"],
        [data-design-style="clean-light"] [class*="bg-[#18181c]"],
        [data-design-style="clean-light"] [class*="bg-[#0f0f12]"],
        [data-design-style="clean-light"] [class*="bg-[#1a1f36]"],
        [data-design-style="clean-light"] [class*="bg-zinc-900"],
        [data-design-style="clean-light"] [class*="bg-zinc-950"],
        [data-design-style="clean-light"] [class*="bg-zinc-800"],
        [data-design-style="clean-light"] [class*="bg-slate-900"],
        [data-design-style="clean-light"] [class*="bg-black"],
        [data-design-style="clean-light"] [class*="bg-white/5"],
        [data-design-style="clean-light"] [class*="bg-white/10"],
        [data-design-style="clean-light"] [class*="bg-white/20"],
        [data-design-style="clean-light"] [class*="bg-black/"],
        [data-design-style="clean-light"] .dashboard-widget-header {
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
        [data-design-style="clean-light"] [class*="hover:bg-white/10"]:hover {
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
        [data-design-style="clean-light"] [class*="bg-white/5"] {
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
          color: #b45309 !important;
        }
        [data-design-style="clean-light"] [class*="text-rose-400"],
        [data-design-style="clean-light"] .text-rose-400 {
          color: #be123c !important;
        }
        [data-design-style="clean-light"] [class*="text-emerald-400"],
        [data-design-style="clean-light"] .text-emerald-400 {
          color: #047857 !important;
        }
        [data-design-style="clean-light"] [class*="text-indigo-400"],
        [data-design-style="clean-light"] .text-indigo-400 {
          color: #4338ca !important;
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
          background-image: none !important;
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

        [data-design-style="clean-light"] aside .bg-black\\\\/,
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
            linear-gradient(135deg, #050505 0%, #050505 100%) !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
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
        aside.sidebar-light .bg-black\\\\/,
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
        .fixed.inset-0.z-30.bg-black\\\\/ aside:not(.sidebar-light).text-white,
        .fixed.inset-0.z-30.bg-black\\\\/ aside:not(.sidebar-light) span,
        .fixed.inset-0.z-30.bg-black\\\\/ aside:not(.sidebar-light) button {
          color: #ffffff !important;
        }
        .fixed.inset-0.z-30.bg-black\\\\/ aside:not(.sidebar-light) .text-zinc-400 {
          color: #a1a1aa !important;
        }

        /* Ensure dropdown select options have highly visible contrast across all custom themes */
        select option {
          background-color: #1e293b !important;
          color: #ffffff !important;
        }

        /* PRINT PREVIEW PAPER ISOLATION AND HIGH-FIDELITY WHITE RESET */
        /* Forces any print previews, designer sheet, and invoice content to be authentic white paper sheets */
        .print-paper-sheet {
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
        .print-paper-sheet * {
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
        .print-paper-sheet .bg-white {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }

        .print-paper-sheet .bg-slate-50,
        .print-paper-sheet .bg-zinc-50,
        .print-paper-sheet .bg-gray-50,
        .print-paper-sheet [class*="bg-slate-50"],
        .print-paper-sheet [class*="bg-zinc-50"] {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
        }

        .print-paper-sheet .bg-slate-100,
        .print-paper-sheet .bg-zinc-100,
        .print-paper-sheet .bg-gray-100,
        .print-paper-sheet [class*="bg-slate-100"],
        .print-paper-sheet [class*="bg-zinc-100"] {
          background-color: #f1f5f9 !important;
          background: #f1f5f9 !important;
        }

        .print-paper-sheet .bg-slate-800,
        .print-paper-sheet .bg-zinc-800,
        .print-paper-sheet [class*="bg-slate-800"],
        .print-paper-sheet [class*="bg-zinc-800"] {
          background-color: #1e293b !important;
          background: #1e293b !important;
          color: #ffffff !important;
        }

        .print-paper-sheet .bg-slate-900,
        .print-paper-sheet .bg-zinc-900,
        .print-paper-sheet [class*="bg-slate-900"],
        .print-paper-sheet [class*="bg-zinc-900"] {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #ffffff !important;
        }

        .print-paper-sheet .bg-teal-50,
        .print-paper-sheet [class*="bg-teal-50"] {
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
        .print-paper-sheet b {
          color: #0f172a !important;
        }

        /* Dark Slate Text overrides */
        .print-paper-sheet .text-slate-900,
        .print-paper-sheet .text-zinc-900,
        .print-paper-sheet .text-zinc-950,
        .print-paper-sheet [class*="text-slate-900"],
        .print-paper-sheet [class*="text-zinc-900"],
        .print-paper-sheet [class*="text-zinc-955"] {
          color: #0f172a !important;
        }

        .print-paper-sheet .text-slate-800,
        .print-paper-sheet .text-zinc-800,
        .print-paper-sheet [class*="text-slate-800"],
        .print-paper-sheet [class*="text-zinc-800"] {
          color: #1e293b !important;
        }

        .print-paper-sheet .text-slate-700,
        .print-paper-sheet .text-zinc-700,
        .print-paper-sheet [class*="text-slate-700"],
        .print-paper-sheet [class*="text-zinc-700"] {
          color: #334155 !important;
        }

        .print-paper-sheet .text-slate-600,
        .print-paper-sheet .text-zinc-600,
        .print-paper-sheet [class*="text-slate-600"],
        .print-paper-sheet [class*="text-zinc-600"] {
          color: #475569 !important;
        }

        /* Muted and secondary text overrides */
        .print-paper-sheet .text-slate-500,
        .print-paper-sheet .text-zinc-500,
        .print-paper-sheet [class*="text-slate-500"],
        .print-paper-sheet [class*="text-zinc-500"] {
          color: #64748b !important;
        }

        .print-paper-sheet .text-slate-400,
        .print-paper-sheet .text-zinc-400,
        .print-paper-sheet [class*="text-slate-400"],
        .print-paper-sheet [class*="text-zinc-400"] {
          color: #94a3b8 !important;
        }

        /* Teal accent colors */
        .print-paper-sheet .text-teal-600,
        .print-paper-sheet [class*="text-teal-600"] {
          color: #0d9488 !important;
        }

        .print-paper-sheet .text-teal-700,
        .print-paper-sheet [class*="text-teal-700"] {
          color: #0f766e !important;
        }

        /* White text for dark table headers */
        .print-paper-sheet thead th,
        .print-paper-sheet .text-white {
          color: #ffffff !important;
        }

        /* Clean crisp borders inside the paper */
        .print-paper-sheet .border,
        .print-paper-sheet .border-t,
        .print-paper-sheet .border-b,
        .print-paper-sheet .border-l,
        .print-paper-sheet .border-r,
        .print-paper-sheet [class*="border-"] {
          border-color: #e2e8f0 !important;
        }

        .print-paper-sheet .border-dashed {
          border-style: dashed !important;
          border-color: #cbd5e1 !important;
        }

        /* The wrapper container that frames the physical page sheet */
        div:has(> .print-paper-sheet) {
          background-color: #ffffff !important;
          background: #ffffff !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid rgba(0, 0, 0, 0.15) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35) !important;
        } 

        } 

        } 

        }
`;
