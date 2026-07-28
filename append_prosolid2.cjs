const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const proSolidCSS2 = `
        /* Mobile Header */
        [data-design-style="pro-solid"] header,
        [data-design-style="pro-solid"] .md\\:hidden.sticky.top-0 {
          background-color: #ffffff !important;
          border-bottom: 1px solid color-mix(in srgb, var(--accent-200) 25%, #e2e8f0) !important;
          color: color-mix(in srgb, var(--accent-950) 85%, #0f172a) !important;
        }

        [data-design-style="pro-solid"] .md\\:hidden.sticky.top-0 .text-zinc-300,
        [data-design-style="pro-solid"] .md\\:hidden.sticky.top-0 .bg-white\\/5 {
          color: #334155 !important;
          background-color: #f1f5f9 !important;
        }

        [data-design-style="pro-solid"] .md\\:hidden.sticky.top-0 .bg-gradient-to-r {
          background-image: none !important;
          background-color: transparent !important;
          color: #0f172a !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + proSolidCSS2 + '\n`;\n');
fs.writeFileSync(file, code);
