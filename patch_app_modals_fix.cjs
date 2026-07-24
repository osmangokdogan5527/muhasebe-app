const fs = require('fs');
let content = fs.readFileSync('src/components/AppModals.tsx', 'utf8');
content = content.replace(/  setFeedbackList,\n  userRole,/g, "  setFeedbackList,\n  financialData,\n  userRole,");
fs.writeFileSync('src/components/AppModals.tsx', content);
