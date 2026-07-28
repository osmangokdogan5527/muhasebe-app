const { JSDOM } = require("jsdom");
const dom = new JSDOM(`
  <html>
    <head>
      <style>
        [class*="bg-[#111111]"] { background-color: white !important; color: black; }
      </style>
    </head>
    <body>
      <div class="bg-[#111111] p-4">Hello</div>
    </body>
  </html>
`);
const win = dom.window;
const div = win.document.querySelector("div");
console.log(win.getComputedStyle(div).backgroundColor);
