const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

// I will use 4 backslashes for ALL escaped slashes to ensure it writes 2 backslashes to the file,
// which JS string literal will evaluate to 1 backslash for CSS parser.
const css = `
        /* PRO-SOLID OVERRIDES */
        [data-design-style="pro-solid"] {
          color: #334155 !important;
        }

        [data-design-style="pro-solid"] body,
        [data-design-style="pro-solid"].bg-\\[\\#050505\\],
        body:has([data-design-style="pro-solid"]),
        [data-design-style="pro-solid"] .min-h-screen,
        [data-design-style="pro-solid"] main {
          background-color: #f4f6f8 !important;
          background: #f4f6f8 !important;
          color: #334155 !important;
          background-attachment: fixed !important;
        }
        
        [data-design-style="pro-solid"] aside {
          background-color: #2b2d35 !important;
          border-right: none !important;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1) !important;
        }
        
        /* Hide sidebar pattern */
        [data-design-style="pro-solid"] aside .absolute.inset-0.pointer-events-none {
          display: none !important;
          opacity: 0 !important;
        }

        [data-design-style="pro-solid"] main [class*="bg-[#111111]"],
        [data-design-style="pro-solid"] main [class*="bg-[#151515]"],
        [data-design-style="pro-solid"] main [class*="bg-[#0a0a0a]"],
        [data-design-style="pro-solid"] main [class*="bg-[#0c0c0c]"],
        [data-design-style="pro-solid"] main [class*="bg-[#0d0d0d]"],
        [data-design-style="pro-solid"] main [class*="bg-[#0f0f0f]"],
        [data-design-style="pro-solid"] main [class*="bg-[#121212]"],
        [data-design-style="pro-solid"] main [class*="bg-[#080808]"],
        [data-design-style="pro-solid"] main [class*="bg-[#0b0c0e]"],
        [data-design-style="pro-solid"] main [class*="bg-[#121316]"],
        [data-design-style="pro-solid"] main [class*="bg-zinc-900"],
        [data-design-style="pro-solid"] main [class*="bg-zinc-950"],
        [data-design-style="pro-solid"] main [class*="bg-slate-900"],
        [data-design-style="pro-solid"] main [class*="bg-black"],
        [data-design-style="pro-solid"] main [class*="bg-white/5"],
        [data-design-style="pro-solid"] main [class*="bg-white/10"],
        [data-design-style="pro-solid"] main [class*="bg-white/20"],
        [data-design-style="pro-solid"] main .bg-\\[\\#0a0a0a\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#0d0d0d\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#0f0f0f\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#111111\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#121212\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#151515\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#080808\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#0b0c0e\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#0c0c0c\\],
        [data-design-style="pro-solid"] main .bg-\\[\\#121316\\],
        [data-design-style="pro-solid"] main .bg-white\\\\/5,
        [data-design-style="pro-solid"] main .bg-white\\\\/10,
        [data-design-style="pro-solid"] main .bg-black\\\\/10,
        [data-design-style="pro-solid"] main .bg-black\\\\/20,
        [data-design-style="pro-solid"] main .bg-black\\\\/30,
        [data-design-style="pro-solid"] main .bg-black\\\\/40,
        [data-design-style="pro-solid"] main .bg-black\\\\/50 {
          background-color: #ffffff !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
          color: #1e293b !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        /* Additional border fixes */
        [data-design-style="pro-solid"] main [class*="border-white"],
        [data-design-style="pro-solid"] main [class*="border-black"] {
           border-color: #e2e8f0 !important;
        }

        /* Fix text colors (escaped slashes with 4 backslashes in script so it writes 2 backslashes to file) */
        [data-design-style="pro-solid"] main .text-white,
        [data-design-style="pro-solid"] main .text-zinc-50,
        [data-design-style="pro-solid"] main [class*="text-zinc-100"],
        [data-design-style="pro-solid"] main [class*="text-slate-100"],
        [data-design-style="pro-solid"] .text-gray-100,
        [data-design-style="pro-solid"] .text-gray-200,
        [data-design-style="pro-solid"] .text-gray-300,
        [data-design-style="pro-solid"] .text-gray-400,
        [data-design-style="pro-solid"] main .text-white\\\\/90,
        [data-design-style="pro-solid"] main .text-white\\\\/80,
        [data-design-style="pro-solid"] main .text-white\\\\/70,
        [data-design-style="pro-solid"] main .text-white\\\\/60,
        [data-design-style="pro-solid"] main .text-white\\\\/50,
        [data-design-style="pro-solid"] main .text-white\\\\/40,
        [data-design-style="pro-solid"] main .text-white\\\\/30,
        [data-design-style="pro-solid"] main .text-white\\\\/20,
        [data-design-style="pro-solid"] main .text-white\\\\/10,
        [data-design-style="pro-solid"] main [class*="text-white/"],
        [data-design-style="pro-solid"] main [class*="text-gray-"] {
          color: #1e293b !important;
        }
        
        /* Typography overrides */
        [data-design-style="pro-solid"] main .text-zinc-400,
        [data-design-style="pro-solid"] main .text-slate-400,
        [data-design-style="pro-solid"] main .text-zinc-300,
        [data-design-style="pro-solid"] main .text-slate-300 {
          color: #475569 !important;
        }
        
        [data-design-style="pro-solid"] main h1,
        [data-design-style="pro-solid"] main h2,
        [data-design-style="pro-solid"] main h3,
        [data-design-style="pro-solid"] main h4,
        [data-design-style="pro-solid"] main h5,
        [data-design-style="pro-solid"] main h6,
        [data-design-style="pro-solid"] main strong,
        [data-design-style="pro-solid"] main b {
          color: #0f172a !important;
        }

        /* Specific colors */
        [data-design-style="pro-solid"] main .text-emerald-400,
        [data-design-style="pro-solid"] main [class*="text-green-400"] {
           color: #059669 !important;
        }
        [data-design-style="pro-solid"] main .text-rose-400,
        [data-design-style="pro-solid"] main [class*="text-red-400"] {
           color: #e11d48 !important;
        }
        [data-design-style="pro-solid"] main .text-amber-400,
        [data-design-style="pro-solid"] main [class*="text-yellow-400"] {
           color: #d97706 !important;
        }
        [data-design-style="pro-solid"] main .text-blue-400 {
           color: #2563eb !important;
        }
        [data-design-style="pro-solid"] main .text-indigo-400 {
           color: #4f46e5 !important;
        }
        [data-design-style="pro-solid"] main [class*="text-teal-400"] {
           color: color-mix(in srgb, var(--accent-700) 80%, #0d9488) !important;
        }

        /* Table styles */
        [data-design-style="pro-solid"] thead,
        [data-design-style="pro-solid"] th {
          background-color: color-mix(in srgb, var(--accent-50) 40%, #f8fafc) !important;
          color: color-mix(in srgb, var(--accent-900) 70%, #334155) !important;
          border-bottom: 2px solid color-mix(in srgb, var(--accent-200) 30%, #e2e8f0) !important;
        }

        [data-design-style="pro-solid"] tbody tr {
          border-bottom: 1px solid #f1f5f9 !important;
          background-color: #ffffff !important;
        }

        [data-design-style="pro-solid"] tbody tr:hover {
          background-color: #f8fafc !important;
        }

        /* Inputs */
        [data-design-style="pro-solid"] main input[type="text"],
        [data-design-style="pro-solid"] main input[type="number"],
        [data-design-style="pro-solid"] main input[type="date"],
        [data-design-style="pro-solid"] main input[type="password"],
        [data-design-style="pro-solid"] main select,
        [data-design-style="pro-solid"] main textarea,
        [data-design-style="pro-solid"] main option {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }

        [data-design-style="pro-solid"] main input:focus,
        [data-design-style="pro-solid"] main select:focus,
        [data-design-style="pro-solid"] main textarea:focus {
           border-color: var(--accent-500) !important;
           outline: none !important;
           box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-500) 20%, transparent) !important;
        }
        
        [data-design-style="pro-solid"] main ::placeholder {
           color: #94a3b8 !important;
           opacity: 1 !important;
        }

        /* Scrollbars */
        [data-design-style="pro-solid"] main ::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
        }
        [data-design-style="pro-solid"] main ::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 3px !important;
        }
        
        /* Badges */
        [data-design-style="pro-solid"] main .bg-emerald-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-green-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-emerald-400\\\\/10 {
           background-color: #d1fae5 !important;
           color: #059669 !important;
           border: 1px solid #a7f3d0 !important;
        }
        
        [data-design-style="pro-solid"] main .bg-rose-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-red-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-rose-400\\\\/10 {
           background-color: #ffe4e6 !important;
           color: #e11d48 !important;
           border: 1px solid #fecdd3 !important;
        }
        
        [data-design-style="pro-solid"] main .bg-amber-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-yellow-500\\\\/20,
        [data-design-style="pro-solid"] main .bg-amber-400\\\\/10 {
           background-color: #fef3c7 !important;
           color: #d97706 !important;
           border: 1px solid #fde68a !important;
        }

        /* Buttons on pro-solid */
        [data-design-style="pro-solid"] main button[class*="bg-white/5"] {
           background-color: #f1f5f9 !important;
           color: #334155 !important;
           border: 1px solid #e2e8f0 !important;
        }
        [data-design-style="pro-solid"] main button[class*="bg-white/5"]:hover {
           background-color: #e2e8f0 !important;
           color: #0f172a !important;
        }

        /* Mobile Header */
        [data-design-style="pro-solid"] header,
        [data-design-style="pro-solid"] .md\\\\:hidden.sticky.top-0 {
          background-color: #ffffff !important;
          border-bottom: 1px solid color-mix(in srgb, var(--accent-200) 25%, #e2e8f0) !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
        }

        [data-design-style="pro-solid"] .md\\\\:hidden.sticky.top-0 .text-zinc-300,
        [data-design-style="pro-solid"] .md\\\\:hidden.sticky.top-0 .bg-white\\\\/5 {
          color: #334155 !important;
          background-color: #f1f5f9 !important;
        }

        [data-design-style="pro-solid"] .md\\\\:hidden.sticky.top-0 .bg-gradient-to-r {
          background-image: none !important;
          background-color: transparent !important;
          color: #0f172a !important;
        }
        
        /* Rounded corners */
        [data-design-style="pro-solid"] main [class*="rounded-"],
        [data-design-style="pro-solid"] main .rounded-xl,
        [data-design-style="pro-solid"] main .rounded-2xl,
        [data-design-style="pro-solid"] main .rounded-3xl,
        [data-design-style="pro-solid"] main .rounded-lg,
        [data-design-style="pro-solid"] main .rounded-md {
          border-radius: 0.75rem !important; /* 12px for cleaner look */
        }
        
        /* Recharts */
        [data-design-style="pro-solid"] .recharts-cartesian-grid-horizontal line,
        [data-design-style="pro-solid"] .recharts-cartesian-grid-vertical line {
          stroke: #e2e8f0 !important;
        }
        [data-design-style="pro-solid"] .recharts-text {
          fill: #64748b !important;
        }
        [data-design-style="pro-solid"] .recharts-tooltip-wrapper .recharts-default-tooltip {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          border-radius: 8px !important;
          color: #1e293b !important;
        }
        [data-design-style="pro-solid"] .recharts-tooltip-item {
          color: #1e293b !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + css + '\n`;\n');
fs.writeFileSync(file, code);
