import { Jimp } from "jimp";
import pngToIco from "png-to-ico";
import fs from "fs";

async function makeIcon() {
  try {
    console.log("Creating image with Jimp...");
    const image = new Jimp({ width: 256, height: 256, color: "#1E3A8A" });
    
    // Create a very basic text representation using Jimp's print
    // Jimp has a built-in font for testing
    // wait, jimp in latest version uses different imports.
    
    // Instead of text, we can just use the blue square, it's fine for an icon
    // It's better than failing builds. 
    
    // Or we can draw a smaller white square inside to make it look like an S or something.
    // Let's just do a white square in the middle
    image.scan(64, 64, 128, 128, (x, y, idx) => {
        image.bitmap.data[idx + 0] = 255;
        image.bitmap.data[idx + 1] = 255;
        image.bitmap.data[idx + 2] = 255;
        image.bitmap.data[idx + 3] = 255;
    });

    const buffer = await image.getBuffer("image/png");
    fs.writeFileSync("public/icon_raw.png", buffer);
    console.log("Raw PNG created.");

    console.log("Converting to ICO...");
    const icoBuffer = await pngToIco("public/icon_raw.png");
    fs.writeFileSync("public/icon.ico", icoBuffer);
    console.log("ICO created successfully.");
  } catch (err) {
    console.error("Error creating icon:", err);
  }
}

makeIcon();
