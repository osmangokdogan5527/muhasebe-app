const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Remove from MobileHeader
appContent = appContent.replace(/setFeedbackList=\{setFeedbackList\}\n        financialData=\{\{ cariler, stoklar, islemler, ceksenet, expenses, bankAccounts \}\}/, "setFeedbackList={setFeedbackList}");

// Add to AppModals
appContent = appContent.replace(/setAiPrefilledData=\{setAiPrefilledData\}\n        setFeedbackList=\{setFeedbackList\}/, "setAiPrefilledData={setAiPrefilledData}\n        setFeedbackList={setFeedbackList}\n        financialData={{ cariler, stoklar, islemler, ceksenet, expenses, bankAccounts }}");

fs.writeFileSync('src/App.tsx', appContent);
