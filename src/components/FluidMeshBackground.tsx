import React from 'react';

/**
 * Sıvı Mesh tasarım stilinin arka planı (giriş ekranı ve uygulama ortak kullanır).
 * Işık katmanları aktif temanın renk değişkenlerinden (--accent-*) türetilir.
 * Stiller bileşenin içindedir; giriş ekranında genel stil dosyası yüklenmeden de çalışır.
 */
const FLUID_MESH_CSS = `
        /* --- Arka plan: aurora katmanları, kenar karartması ve film greni --- */
        .fluid-mesh-bg {
          background:
            radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--accent-900, #1e1b4b) 55%, #0b0d1f) 0%, transparent 60%),
            linear-gradient(180deg, #070817 0%, #04050c 100%);
        }
        .fluid-mesh-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(64px);
          mix-blend-mode: screen;
          opacity: 0.78;
        }
        .fluid-mesh-blob-1 {
          top: -22%; left: -14%; width: 62vw; height: 62vw;
          background: radial-gradient(circle at 40% 40%, rgba(var(--accent-rgb, 99, 102, 241), 0.85) 0%, rgba(var(--accent-rgb, 99, 102, 241), 0.25) 38%, transparent 68%);
        }
        .fluid-mesh-blob-2 {
          bottom: -28%; right: -16%; width: 70vw; height: 70vw;
          background: radial-gradient(circle at 55% 55%, color-mix(in oklab, var(--accent-500, #6366f1) 45%, #8b5cf6) 0%, color-mix(in oklab, var(--accent-700, #4338ca) 40%, #4c1d95) 40%, transparent 70%);
          opacity: 0.7;
        }
        .fluid-mesh-blob-3 {
          top: 8%; right: 4%; width: 38vw; height: 38vw;
          background: radial-gradient(circle, color-mix(in oklab, var(--accent-300, #a5b4fc) 45%, #22d3ee) 0%, transparent 65%);
          opacity: 0.5;
        }
        .fluid-mesh-blob-4 {
          bottom: -6%; left: 18%; width: 46vw; height: 46vw;
          background: radial-gradient(circle, color-mix(in oklab, var(--accent-600, #4f46e5) 55%, #db2777) 0%, transparent 66%);
          opacity: 0.42;
        }
        .fluid-mesh-vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 95% 80% at 50% 45%, transparent 45%, rgba(2, 3, 9, 0.45) 100%);
        }
        .fluid-mesh-grain {
          position: absolute; inset: -50%;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* --- Aurora hareketi: yavaş ve organik --- */
        @keyframes mesh-float-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(6vw, 5vh, 0) scale(1.08); }
          66% { transform: translate3d(-3vw, 8vh, 0) scale(0.96); }
        }
        @keyframes mesh-float-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.04); }
          50% { transform: translate3d(-7vw, -6vh, 0) scale(0.94); }
        }
        @keyframes mesh-float-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.95); }
          40% { transform: translate3d(-8vw, 6vh, 0) scale(1.1); }
          75% { transform: translate3d(-2vw, -4vh, 0) scale(1); }
        }
        @keyframes mesh-float-4 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(10vw, -5vh, 0) scale(1.12); }
        }

        .animate-mesh-float-1 { animation: mesh-float-1 38s infinite ease-in-out; will-change: transform; }
        .animate-mesh-float-2 { animation: mesh-float-2 46s infinite ease-in-out; will-change: transform; }
        .animate-mesh-float-3 { animation: mesh-float-3 32s infinite ease-in-out; will-change: transform; }
        .animate-mesh-float-4 { animation: mesh-float-4 42s infinite ease-in-out; will-change: transform; }

        /* Cihazda "hareketi azalt" açıksa aurora sabit durur */
        @media (prefers-reduced-motion: reduce) {
          .animate-mesh-float-1,
          .animate-mesh-float-2,
          .animate-mesh-float-3,
          .animate-mesh-float-4 { animation: none !important; }
        }
`;

export const FluidMeshBackground: React.FC = () => (
  <>
    <style>{FLUID_MESH_CSS}</style>
    <div className="fluid-mesh-bg fixed inset-0 overflow-hidden pointer-events-none z-0 select-none" aria-hidden="true">
      <div className="fluid-mesh-blob fluid-mesh-blob-1 animate-mesh-float-1" />
      <div className="fluid-mesh-blob fluid-mesh-blob-2 animate-mesh-float-2" />
      <div className="fluid-mesh-blob fluid-mesh-blob-3 animate-mesh-float-3" />
      <div className="fluid-mesh-blob fluid-mesh-blob-4 animate-mesh-float-4" />
      <div className="fluid-mesh-vignette" />
      <div className="fluid-mesh-grain" />
    </div>
  </>
);
