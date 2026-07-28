const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const proSolidCSS3 = `
        /* Hide sidebar pattern in pro-solid */
        [data-design-style="pro-solid"] aside .absolute.inset-0.pointer-events-none {
          display: none !important;
          opacity: 0 !important;
        }

        /* Fix text colors */
        [data-design-style="pro-solid"] main,
        [data-design-style="pro-solid"] .text-gray-100,
        [data-design-style="pro-solid"] .text-gray-200,
        [data-design-style="pro-solid"] .text-gray-300,
        [data-design-style="pro-solid"] .text-gray-400,
        [data-design-style="pro-solid"] main .text-white\\/90,
        [data-design-style="pro-solid"] main .text-white\\/80,
        [data-design-style="pro-solid"] main .text-white\\/70,
        [data-design-style="pro-solid"] main .text-white\\/60,
        [data-design-style="pro-solid"] main .text-white\\/50,
        [data-design-style="pro-solid"] main [class*="text-white/"],
        [data-design-style="pro-solid"] main [class*="text-gray-"] {
          color: #1e293b !important;
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

        [data-design-style="pro-solid"] main .text-emerald-400 {
           color: #059669 !important;
        }
        [data-design-style="pro-solid"] main .text-rose-400 {
           color: #e11d48 !important;
        }
        [data-design-style="pro-solid"] main .text-amber-400 {
           color: #d97706 !important;
        }
        [data-design-style="pro-solid"] main .text-blue-400 {
           color: #2563eb !important;
        }
        [data-design-style="pro-solid"] main .text-indigo-400 {
           color: #4f46e5 !important;
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

        /* Forms */
        [data-design-style="pro-solid"] main .bg-black\\/20,
        [data-design-style="pro-solid"] main .bg-black\\/40,
        [data-design-style="pro-solid"] main input[type="text"],
        [data-design-style="pro-solid"] main input[type="number"],
        [data-design-style="pro-solid"] main input[type="date"],
        [data-design-style="pro-solid"] main input[type="password"],
        [data-design-style="pro-solid"] main select,
        [data-design-style="pro-solid"] main textarea {
           background-color: #ffffff !important;
           border: 1px solid #cbd5e1 !important;
           color: #0f172a !important;
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
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + proSolidCSS3 + '\n`;\n');
fs.writeFileSync(file, code);
