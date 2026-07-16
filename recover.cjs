const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('.git/objects', (filePath) => {
  if (filePath.includes('pack') || filePath.includes('info')) return;
  try {
    const fileContent = fs.readFileSync(filePath);
    const unzipped = zlib.unzipSync(fileContent).toString('utf8');
    if (unzipped.includes('subscribeCariler') && unzipped.includes('APP_VERSION')) {
      console.log('Found in', filePath);
      fs.writeFileSync('recovered_app.tsx', unzipped);
    }
  } catch (e) {
    // ignore
  }
});
