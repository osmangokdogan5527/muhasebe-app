const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

// Add financialData to destructuring
content = content.replace(
  /export default function AiAssistant\(\{ \n  apiKey, \n  userRole = 'employee',\n  isSecurityActive = false,\n  sensitiveTabs = \[\],\n  actionPermissions = \{\},\n  onNavigateToSettings, \n  onCommandParsed \n\}: AiAssistantProps\) \{/,
  "export default function AiAssistant({ \n  apiKey, \n  userRole = 'employee',\n  isSecurityActive = false,\n  sensitiveTabs = [],\n  actionPermissions = {},\n  onNavigateToSettings, \n  onCommandParsed, \n  financialData \n}: AiAssistantProps) {"
);

// Replace Date.now().toString() with Date.now().toString() + Math.random().toString(36).substr(2, 5)
// Actually, let's just make it \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
content = content.replace(/Date\.now\(\)\.toString\(\)/g, "\`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`");

fs.writeFileSync('src/components/AiAssistant.tsx', content);
