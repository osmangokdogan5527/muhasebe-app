import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_code = """
  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
  const themeCssRules = currentThemeData?.cssRules || '';
  const bodyPatternSvg = SIDEBAR_PATTERNS.find(p => p.id === activePattern)?.svg || '';
  const isLightSidebar = false;
  const sidebarPatternStyle = {};
  
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isBackupLoading, setBackupLoading] = useState(false);

  const renderWorkspaceView = (id: string, content: any) => (
    <div className={`w-full max-w-7xl mx-auto ${isLightSidebar ? 'text-gray-800' : 'text-gray-100'} transition-colors duration-300`}>
      {content}
    </div>
  );

  const renderSettingsView = () => <AyarlarView /> as any;
  const handleResetAllData = async () => {};
"""

content = content.replace(new_code, "")

# Insert just before the `  if (!user) {` inside the main body
content = content.replace("  if (!user) {\n    return (\n      <AuthScreen", new_code + "\n  if (!user) {\n    return (\n      <AuthScreen")

with open('src/App.tsx', 'w') as f:
    f.write(content)
