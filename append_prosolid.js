const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const proSolidCSS = `
        /* PRO-SOLID OVERRIDES */
        [data-design-style="pro-solid"] {
          color: #334155 !important;
        }

        [data-design-style="pro-solid"] body,
        [data-design-style="pro-solid"].bg-\\[\\#050505\\],
        body:has([data-design-style="pro-solid"]),
        [data-design-style="pro-solid"] .min-h-screen {
          background-color: #f1f5f9 !important;
          background: #f1f5f9 !important;
          color: #334155 !important;
          background-attachment: fixed !important;
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
        [data-design-style="pro-solid"] main .bg-white\\/5,
        [data-design-style="pro-solid"] main .bg-white\\/10,
        [data-design-style="pro-solid"] main .bg-\\[\\#1a1f36\\],
        [data-design-style="pro-solid"] main .bg-black\\/10,
        [data-design-style="pro-solid"] main .bg-black\\/20,
        [data-design-style="pro-solid"] main .bg-black\\/30,
        [data-design-style="pro-solid"] main .bg-black\\/40,
        [data-design-style="pro-solid"] main .bg-slate-900,
        [data-design-style="pro-solid"] main .bg-zinc-900,
        [data-design-style="pro-solid"] main .bg-zinc-950,
        [data-design-style="pro-solid"] main .bg-black\\/50 {
          background-color: #ffffff !important;
          background: #ffffff !important;
          border: 1px solid color-mix(in srgb, var(--accent-200) 15%, #e2e8f0) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important;
          color: #1e293b !important;
        }

        [data-design-style="pro-solid"] main .text-white,
        [data-design-style="pro-solid"] main .text-zinc-50,
        [data-design-style="pro-solid"] main [class*="text-zinc-100"],
        [data-design-style="pro-solid"] main [class*="text-slate-100"] {
          color: #0f172a !important;
        }

        [data-design-style="pro-solid"] main .text-zinc-400,
        [data-design-style="pro-solid"] main .text-slate-400,
        [data-design-style="pro-solid"] main .text-zinc-300,
        [data-design-style="pro-solid"] main .text-slate-300 {
          color: #475569 !important;
        }

        [data-design-style="pro-solid"] thead,
        [data-design-style="pro-solid"] th {
          background-color: color-mix(in srgb, var(--accent-50) 40%, #f8fafc) !important;
          color: color-mix(in srgb, var(--accent-900) 70%, #334155) !important;
          border-bottom: 2px solid color-mix(in srgb, var(--accent-200) 30%, #e2e8f0) !important;
        }

        [data-design-style="pro-solid"] tbody tr {
          border-bottom: 1px solid color-mix(in srgb, var(--accent-100) 15%, #f1f5f9) !important;
          background-color: #ffffff !important;
        }

        [data-design-style="pro-solid"] tbody tr:hover {
          background-color: color-mix(in srgb, var(--accent-50) 25%, #f8fafc) !important;
        }

        [data-design-style="pro-solid"] main input,
        [data-design-style="pro-solid"] main select,
        [data-design-style="pro-solid"] main textarea,
        [data-design-style="pro-solid"] main option {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }

        [data-design-style="pro-solid"] main ::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
        }

        [data-design-style="pro-solid"] main ::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 3px !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + proSolidCSS + '\n`;\n');
fs.writeFileSync(file, code);
