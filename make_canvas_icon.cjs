const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const size = 256;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Draw background
ctx.fillStyle = '#0F172A';
ctx.fillRect(0, 0, size, size);

// Draw inner box
ctx.fillStyle = '#1E293B';
ctx.beginPath();
ctx.roundRect(16, 16, size - 32, size - 32, 32);
ctx.fill();

// Draw a stylized lightning bolt / S shape
ctx.fillStyle = '#38BDF8';
ctx.beginPath();
ctx.moveTo(130, 50);
ctx.lineTo(190, 50);
ctx.lineTo(170, 135);
ctx.lineTo(110, 135);
ctx.closePath();
ctx.fill();

ctx.fillStyle = '#60A5FA';
ctx.fillRect(70, 150, 20, 40);
ctx.fillRect(98, 130, 20, 60);
ctx.fillRect(126, 110, 20, 80);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/app/applet/public/icon.png', buffer);
console.log('Saved new icon.png using canvas');
