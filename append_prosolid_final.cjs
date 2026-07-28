const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const proSolidCSSFinal = `
        /* PRO-SOLID FINAL REFINEMENTS FOR EXACT MATCH */
        [data-design-style="pro-solid"] aside {
          background-color: #2b2d35 !important;
          border-right: none !important;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1) !important;
        }

        [data-design-style="pro-solid"] main {
          background-color: #f4f6f8 !important;
        }
        
        [data-design-style="pro-solid"] body, 
        [data-design-style="pro-solid"] .min-h-screen {
          background-color: #f4f6f8 !important;
        }

        [data-design-style="pro-solid"] main [class*="rounded-"],
        [data-design-style="pro-solid"] main .rounded-xl,
        [data-design-style="pro-solid"] main .rounded-2xl,
        [data-design-style="pro-solid"] main .rounded-3xl,
        [data-design-style="pro-solid"] main .rounded-lg,
        [data-design-style="pro-solid"] main .rounded-md {
          border-radius: 0.75rem !important; /* 12px for cleaner look */
        }
        
        [data-design-style="pro-solid"] main [class*="bg-black/"],
        [data-design-style="pro-solid"] main [class*="bg-white/"] {
           border: 1px solid #e2e8f0 !important;
           background-color: #ffffff !important;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
           backdrop-filter: none !important;
           -webkit-backdrop-filter: none !important;
        }

        /* Recharts in Pro-Solid */
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

        /* Headers and Typography */
        [data-design-style="pro-solid"] main .text-3xl {
           font-size: 1.5rem !important;
           font-weight: 700 !important;
           color: #0f172a !important;
        }
        
        [data-design-style="pro-solid"] main .text-2xl {
           font-size: 1.25rem !important;
           font-weight: 700 !important;
           color: #1e293b !important;
        }
        
        /* Table fixes */
        [data-design-style="pro-solid"] tbody tr {
           background-color: #ffffff !important;
           border-bottom: 1px solid #f1f5f9 !important;
        }
        [data-design-style="pro-solid"] tbody tr:hover {
           background-color: #f8fafc !important;
        }
        
        /* Badge fixes */
        [data-design-style="pro-solid"] main .bg-emerald-500\\/20,
        [data-design-style="pro-solid"] main .bg-green-500\\/20,
        [data-design-style="pro-solid"] main .bg-emerald-400\\/10 {
           background-color: #d1fae5 !important;
           color: #059669 !important;
           border: 1px solid #a7f3d0 !important;
        }
        
        [data-design-style="pro-solid"] main .bg-rose-500\\/20,
        [data-design-style="pro-solid"] main .bg-red-500\\/20,
        [data-design-style="pro-solid"] main .bg-rose-400\\/10 {
           background-color: #ffe4e6 !important;
           color: #e11d48 !important;
           border: 1px solid #fecdd3 !important;
        }
        
        [data-design-style="pro-solid"] main .bg-amber-500\\/20,
        [data-design-style="pro-solid"] main .bg-yellow-500\\/20,
        [data-design-style="pro-solid"] main .bg-amber-400\\/10 {
           background-color: #fef3c7 !important;
           color: #d97706 !important;
           border: 1px solid #fde68a !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + proSolidCSSFinal + '\n`;\n');
fs.writeFileSync(file, code);
