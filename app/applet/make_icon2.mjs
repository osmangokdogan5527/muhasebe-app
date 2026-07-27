import pngToIco from "png-to-ico";
import fs from "fs";

async function makeIcon() {
  try {
    console.log("Converting to ICO...");
    const icoBuffer = await pngToIco("public/icon.png");
    fs.writeFileSync("public/icon.ico", icoBuffer);
    console.log("ICO created successfully.");
  } catch (err) {
    console.error("Error creating icon:", err);
  }
}

makeIcon();
