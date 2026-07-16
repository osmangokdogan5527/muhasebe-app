import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

vars_code = """
  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
  const themeCssRules = currentThemeData.cssRules || '';
  const bodyPatternSvg = SIDEBAR_PATTERNS.find(p => p.id === activePattern)?.svg || '';
  const isLightSidebar = false;
  const sidebarPatternStyle = {};
  
  const renderWorkspaceView = (id: string, content: any) => (
    <div className={`w-full max-w-7xl mx-auto ${isLightSidebar ? 'text-gray-800' : 'text-gray-100'} transition-colors duration-300`}>
      {content}
    </div>
  );

  const renderSettingsView = () => <AyarlarView />;
  const handleResetAllData = async () => {};
"""

# Just remove all of them
content = content.replace(vars_code, "")

with open('src/App.tsx', 'w') as f:
    f.write(content)
