const fs = require('fs');
let content = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');

// Ensure Sparkles is imported
if (!content.includes('Sparkles')) {
  content = content.replace('FileSpreadsheet,', 'FileSpreadsheet,\n  Sparkles,');
}

// Update the button
content = content.replace(
  /<FileSpreadsheet size=\{16\} \/>\n            <span className="hidden sm:inline">Excel Aktarım<\/span>/,
  "<Sparkles size={16} className=\"text-teal-400\" />\n            <span className=\"hidden sm:inline\">Akıllı Excel Aktarım</span>"
);

fs.writeFileSync('src/components/CarilerView.tsx', content);
