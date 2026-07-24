const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement was: 'cariler={cariler}\n            showToast={showToast as any}'
// Let's replace ALL of them back to 'cariler={cariler}'
content = content.replace(/cariler=\{cariler\}\n            showToast=\{showToast as any\}/g, 'cariler={cariler}');

// Now carefully ONLY replace the one for CarilerView.
// Look for renderWorkspaceView('cariler', <CarilerView \n            cariler={cariler}
content = content.replace(
  /renderWorkspaceView\('cariler', <CarilerView \n            cariler=\{cariler\}/,
  "renderWorkspaceView('cariler', <CarilerView \n            cariler={cariler}\n            showToast={showToast as any}"
);

fs.writeFileSync('src/App.tsx', content);
