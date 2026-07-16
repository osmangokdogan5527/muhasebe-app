import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const themeCssRules = currentThemeData?.cssRules || '';", """  const themeCssRules = React.useMemo(() => {
    return Object.entries(currentThemeData.colors)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\\n');
  }, [currentThemeData]);""")

with open('src/App.tsx', 'w') as f:
    f.write(content)
