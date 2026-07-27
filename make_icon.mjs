import fs from 'fs';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const svg = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#0f172a" rx="50" />
  <path d="M128 20 L210 120 L150 120 L160 236 L70 140 L130 140 Z" fill="#2dd4bf" />
</svg>
`;

async function main() {
  await sharp(Buffer.from(svg))
    .png()
    .toFile('./public/icon.png');
  
  const buf = await pngToIco('./public/icon.png');
  fs.writeFileSync('./public/icon.ico', buf);
  fs.writeFileSync('./build/icon.ico', buf);
  console.log("Icons successfully created.");
}

main().catch(console.error);
