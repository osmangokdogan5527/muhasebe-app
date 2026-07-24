const fs = require('fs');
let modalsContent = fs.readFileSync('src/components/AppModals.tsx', 'utf8');

if (!modalsContent.includes('financialData?: any;')) {
  modalsContent = modalsContent.replace(/setFeedbackList: \(data: any\) => void;/, "setFeedbackList: (data: any) => void;\n  financialData?: any;");
}
if (!modalsContent.includes('financialData\n}: AppModalsProps')) {
  modalsContent = modalsContent.replace(/setFeedbackList\n\}: AppModalsProps\) \{/, "setFeedbackList,\n  financialData\n}: AppModalsProps) {");
}

fs.writeFileSync('src/components/AppModals.tsx', modalsContent);
