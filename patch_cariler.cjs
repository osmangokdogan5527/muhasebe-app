const fs = require('fs');
let content = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');

content = content.replace(
  /  onSelectCariForDetails,\n\}: CarilerViewProps\) \{/,
  "  onSelectCariForDetails,\n  showToast,\n}: CarilerViewProps) {"
);

fs.writeFileSync('src/components/CarilerView.tsx', content);
