const fs = require('fs');
const yml = `name: Build and Release
on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    permissions:
      contents: write
    steps:
      - name: Kodu İndir
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
        
      - name: Eski release'i sil (varsa)
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        shell: bash
        run: gh release delete v1.7.5 -y || true
        
      - name: Eski tag'i sil (varsa)
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        shell: bash
        run: git push --delete origin v1.7.5 || true

      - name: Node.js Kur
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Bağımlılıkları Yükle
        run: npm install

      - name: Uygulamayı Derle ve GitHub'a Yükle
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        shell: bash
        run: npm run electron:build -- -p always
`
fs.writeFileSync('.github/workflows/release.yml', yml);
