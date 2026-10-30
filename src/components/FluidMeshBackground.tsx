import React, { useEffect } from 'react';

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
        /* Kuzey ışığı gibi çok yavaş dönen akışkan renk şeridi */
        .fluid-mesh-ribbon {
          position: absolute;
          left: 50%; top: 45%;
          width: 150vmax; height: 150vmax;
          margin: -75vmax 0 0 -75vmax;
          background: conic-gradient(from 210deg,
            transparent 0deg,
            rgba(var(--accent-rgb, 99, 102, 241), 0.42) 40deg,
            transparent 95deg,
            color-mix(in oklab, var(--accent-300, #a5b4fc) 45%, transparent) 150deg,
            transparent 205deg,
            color-mix(in oklab, var(--accent-600, #4f46e5) 50%, transparent) 260deg,
            transparent 320deg);
          filter: blur(80px);
          mix-blend-mode: screen;
          opacity: 0.4;
          animation: mesh-ribbon-spin 120s linear infinite;
          will-change: transform;
        }
        @keyframes mesh-ribbon-spin {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.08); }
          to { transform: rotate(360deg) scale(1); }
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
          .animate-mesh-float-4,
          .fluid-mesh-ribbon { animation: none !important; }
        }
`;

// GlobalStyles.tsx'teki Sıvı Mesh yüzey (kart) sınıflarıyla aynı liste
const SURFACE_CLASSES = [
  'bg-white', 'bg-[#ffffff]', 'bg-[#0a0a0a]', 'bg-[#0c0c0c]', 'bg-[#0d0d0d]', 'bg-[#0f0f0f]', 'bg-[#111111]',
  'bg-[#121212]', 'bg-[#151515]', 'bg-[#111111]/80', 'bg-[#121316]', 'bg-[#0b0c0e]', 'bg-zinc-950', 'bg-zinc-950/50',
  'bg-zinc-900/50', 'bg-zinc-900', 'bg-zinc-800', 'bg-slate-50', 'bg-slate-100', 'bg-slate-900/50',
  'bg-zinc-50', 'bg-zinc-100', 'bg-gray-50', 'bg-gray-100', 'bg-neutral-50',
];

/**
 * İmleç bir kartın üzerindeyken, imlecin altında tema renginde yumuşak bir ışık oluşturur
 * (kartların arka planındaki --spot-x/--spot-y değişkenleri). Her ekran karesinde en fazla bir kez çalışır.
 */
function useSurfaceSpotlight() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.escape) return;
    const selector = SURFACE_CLASSES.map(c => '.' + CSS.escape(c)).join(',');
    let lit: HTMLElement[] = [];
    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    const clear = () => {
      lit.forEach(el => { el.style.removeProperty('--spot-x'); el.style.removeProperty('--spot-y'); });
      lit = [];
    };

    const update = () => {
      frame = 0;
      const event = lastEvent;
      if (!event) return;
      // İmlecin altındaki kart ve onu içeren en fazla iki üst kart birlikte aydınlanır
      const chain: HTMLElement[] = [];
      let node = (event.target as Element | null)?.closest?.(selector) as HTMLElement | null;
      if (node && node.closest('.print-paper-sheet')) node = null; // yazdırma önizlemesi beyaz kâğıt kalır
      while (node && chain.length < 3) {
        chain.push(node);
        node = node.parentElement?.closest(selector) as HTMLElement | null;
      }
      lit.filter(el => !chain.includes(el)).forEach(el => { el.style.removeProperty('--spot-x'); el.style.removeProperty('--spot-y'); });
      chain.forEach(el => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      });
      lit = chain;
    };

    const onMove = (event: PointerEvent) => {
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeave = () => { lastEvent = null; clear(); };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (frame) cancelAnimationFrame(frame);
      clear();
    };
  }, []);
}

export const FluidMeshBackground: React.FC = () => {
  useSurfaceSpotlight();
  return (
    <>
      <style>{FLUID_MESH_CSS}</style>
      <div className="fluid-mesh-bg fixed inset-0 overflow-hidden pointer-events-none z-0 select-none" aria-hidden="true">
        <div className="fluid-mesh-ribbon" />
        <div className="fluid-mesh-blob fluid-mesh-blob-1 animate-mesh-float-1" />
        <div className="fluid-mesh-blob fluid-mesh-blob-2 animate-mesh-float-2" />
        <div className="fluid-mesh-blob fluid-mesh-blob-3 animate-mesh-float-3" />
        <div className="fluid-mesh-blob fluid-mesh-blob-4 animate-mesh-float-4" />
        <div className="fluid-mesh-vignette" />
        <div className="fluid-mesh-grain" />
      </div>
    </>
  );
};
