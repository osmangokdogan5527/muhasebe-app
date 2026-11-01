export const globalStylesPart2 = `

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
