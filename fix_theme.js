const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
if (!code.includes("document.documentElement.setAttribute('data-design-style', designStyle)")) {
  code = code.replace(
    "const [designStyle, setDesignStyle] = useState<'default' | 'modern'>(() => {",
    "useEffect(() => {\n    if (designStyle) {\n      document.documentElement.setAttribute('data-design-style', designStyle);\n    } else {\n      document.documentElement.removeAttribute('data-design-style');\n    }\n  }, [designStyle]);\n\n  const [designStyle, setDesignStyle] = useState<'default' | 'modern'>(() => {"
  );
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed App.tsx');
}
