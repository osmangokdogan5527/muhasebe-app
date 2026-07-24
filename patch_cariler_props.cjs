const fs = require('fs');
let content = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');

if (!content.includes('showToast?:')) {
  content = content.replace(
    /interface CarilerViewProps \{/,
    "interface CarilerViewProps {\n  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;"
  );
}

content = content.replace(
  /export default function CarilerView\(\{([\s\S]*?)\}: CarilerViewProps\) \{/,
  "export default function CarilerView({$1, showToast}: CarilerViewProps) {"
);

fs.writeFileSync('src/components/CarilerView.tsx', content);
