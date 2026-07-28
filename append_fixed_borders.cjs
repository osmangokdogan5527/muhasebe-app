const fs = require('fs');
const file = 'src/components/GlobalStylesPart2.ts';
let code = fs.readFileSync(file, 'utf8');

const css = `
        /* Additional border fixes */
        [data-design-style="pro-solid"] main [class*="border-white"],
        [data-design-style="pro-solid"] main [class*="border-black"] {
           border-color: #e2e8f0 !important;
        }
`;

code = code.replace(/}\s*`;\s*$/, '} \n' + css + '\n`;\n');
fs.writeFileSync(file, code);
