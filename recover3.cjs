const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
        walkDir(dirPath, callback);
    } else {
        callback(path.join(dir, f));
    }
  });
}

let found = false;
walkDir('.git/objects', (filePath) => {
  if (filePath.includes('pack') || filePath.includes('info')) return;
  try {
    const fileContent = fs.readFileSync(filePath);
    const unzipped = zlib.inflateSync(fileContent).toString('utf8');
    if (unzipped.includes('subscribeCariler')) {
      console.log('Found in', filePath);
      fs.writeFileSync('recovered_app_' + path.basename(filePath) + '.tsx', unzipped);
      found = true;
    }
  } catch (e) {
    // ignore
  }
});

if (!found) console.log("Not found.");
