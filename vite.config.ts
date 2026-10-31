import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    build: {
      // Derlenen tüm dosyaların listesi: telefon uygulaması (sw.js) internetsiz açılabilmek için
      // ekranları ilk açılışta bu listeden önbelleğe alır.
      manifest: 'asset-manifest.json',
      rollupOptions: {
        output: {
          // Sık değişmeyen büyük kütüphaneler ayrı dosyada: yeni sürümde yeniden indirilmez
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (/node_modules[\\/](@firebase|firebase)[\\/]/.test(id)) return 'vendor-firebase';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
