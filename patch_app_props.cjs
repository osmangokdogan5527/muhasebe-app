const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/setFeedbackList=\{setFeedbackList\}/, "setFeedbackList={setFeedbackList}\n        financialData={{ cariler, stoklar, islemler, ceksenet, expenses, bankAccounts }}");
fs.writeFileSync('src/App.tsx', appContent);

let modalsContent = fs.readFileSync('src/components/AppModals.tsx', 'utf8');
modalsContent = modalsContent.replace(/setFeedbackList: \(list: any\[\]\) => void;/, "setFeedbackList: (list: any[]) => void;\n  financialData?: any;");
modalsContent = modalsContent.replace(/setFeedbackList\n\}: AppModalsProps\) \{/, "setFeedbackList,\n  financialData\n}: AppModalsProps) {");
modalsContent = modalsContent.replace(/onCommandParsed=\{/, "financialData={financialData}\n          onCommandParsed={");
fs.writeFileSync('src/components/AppModals.tsx', modalsContent);
