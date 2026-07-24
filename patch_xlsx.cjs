const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');
if (!content.includes("import * as XLSX")) {
  content = content.replace(/import React/, "import * as XLSX from 'xlsx';\nimport React");
  fs.writeFileSync('src/components/AiAssistant.tsx', content);
}
