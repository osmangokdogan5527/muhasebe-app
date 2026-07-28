const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const css = `
        /* Additional color fixes */
        [data-design-style="pro-solid"] main [class*="text-red-400"],
        [data-design-style="pro-solid"] main [class*="text-rose-400"] {
           color: #e11d48 !important;
        }
        [data-design-style="pro-solid"] main [class*="text-emerald-400"],
        [data-design-style="pro-solid"] main [class*="text-green-400"] {
           color: #059669 !important;
        }
        [data-design-style="pro-solid"] main [class*="text-amber-400"],
        [data-design-style="pro-solid"] main [class*="text-yellow-400"] {
           color: #d97706 !important;
        }
        [data-design-style="pro-solid"] main [class*="text-teal-400"] {
           /* Note: we already have a rule for text-teal-400, but in case there are /80 versions */
           /* Wait, teal is mapped to accent. So we should map it to the darker accent or just use teal */
           color: color-mix(in srgb, var(--accent-700) 80%, #0d9488) !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + css + '\n`;\n');
fs.writeFileSync(file, code);
