import React from "react";
import { LayoutDashboard, Users, Package, Receipt, Briefcase, Wallet, DollarSign, Landmark, BarChart3, Settings } from "lucide-react";
import { KeyboardShortcut } from "./types";
export const StormLogo = ({ 
  className = "", 
  style = {}, 
  logoTheme, 
  theme,
  sidebarPattern,
  sidebarPatternOpacity,
  designStyle,
  width = "100%",
  height = "100%",
  downloadMode = false,
  sidebarBg,
  onlySvg = false
}: { 
  className?: string; 
  style?: React.CSSProperties; 
  logoTheme?: string; 
  theme?: string;
  sidebarPattern?: string;
  sidebarPatternOpacity?: number;
  designStyle?: string;
  width?: string | number;
  height?: string | number;
  downloadMode?: boolean;
  sidebarBg?: string;
  onlySvg?: boolean;
}) => {
  const currentDesignStyle = designStyle || (typeof document !== 'undefined' && document.documentElement.getAttribute('data-design-style')) || localStorage.getItem('storm_muhasebe_design_style') || 'glass';
  const isGlass = currentDesignStyle === 'glass';
  const isFluidMesh = currentDesignStyle === 'fluid-mesh';

  // Strip any shadow filters and transition effects to keep the logo perfectly flat and net
  const cleanedStyle = { ...style };
  if (cleanedStyle.filter) {
    delete cleanedStyle.filter;
  }

  const currentLogoTheme = logoTheme || localStorage.getItem('storm_muhasebe_logo_theme') || 'theme';
  const currentActiveTheme = theme || localStorage.getItem('kolay_hesap_accent_theme') || 'sky';

  const effectiveTheme = currentLogoTheme === 'theme' ? currentActiveTheme : currentLogoTheme;
  const preset = COLOR_PRESETS.find(p => p.id === effectiveTheme) || COLOR_PRESETS.find(p => p.id === 'sky') || COLOR_PRESETS[0];
  
  // Choose the background fill color
  let fillCol = '#0ea5e9'; // Default sky blue
  if (preset.id === 'sampi10-blue') {
    fillCol = '#22315b';
  } else if (preset.id !== 'sky') {
    fillCol = preset.preview || '#0ea5e9';
  }

  // Get active sidebar pattern details
  let currentPattern = sidebarPattern || localStorage.getItem('storm_muhasebe_sidebar_pattern') || 'crystal';
  if (designStyle === 'pro-solid' || designStyle === 'navy-perf' || currentDesignStyle === 'navy-perf') currentPattern = 'none';
  if (currentPattern === 'circles') currentPattern = 'flame';
  if (currentPattern === 'waves') currentPattern = 'chain';
  const savedOpacity = sidebarPatternOpacity !== undefined ? sidebarPatternOpacity : parseFloat(localStorage.getItem('storm_muhasebe_sidebar_pattern_opacity') || '0.75');
  
  // Set texture opacity inside logo to be subtle but beautiful
  const opacity = Math.min(0.24, Math.max(0.08, savedOpacity * 5));

  // Generate safe dynamic unique ID for pattern reference
  const rawId = React.useId ? React.useId() : '0';
  const uId = rawId.replace(/:/g, '');
  const patternId = 'storm-logo-pattern-' + uId;

  // Dynamic colors for Fluid Mesh style logo based on current active theme preset!
  const getFluidMeshLogoColors = (themeId: string) => {
    switch (themeId) {
      case 'sky':
      case 'sampi10-blue':
        return {
          borderGrad: ['#f43f5e', '#8b5cf6', '#3b82f6', '#14b8a6'],
          boltGrad: ['#ffffff', '#38bdf8', '#ec4899'],
          glow1: '#ec4899',
          glow2: '#14b8a6',
          glow3: '#8b5cf6',
          dropShadow: '#ec4899'
        };
      case 'teal':
        return {
          borderGrad: ['#0d9488', '#14b8a6', '#2dd4bf', '#10b981'],
          boltGrad: ['#ffffff', '#2dd4bf', '#10b981'],
          glow1: '#14b8a6',
          glow2: '#10b981',
          glow3: '#0f766e',
          dropShadow: '#14b8a6'
        };
      case 'amber':
        return {
          borderGrad: ['#d97706', '#f59e0b', '#fbbf24', '#f97316'],
          boltGrad: ['#ffffff', '#fbbf24', '#f97316'],
          glow1: '#f59e0b',
          glow2: '#f97316',
          glow3: '#b45309',
          dropShadow: '#f59e0b'
        };
      case 'emerald':
        return {
          borderGrad: ['#059669', '#10b981', '#34d399', '#14b8a6'],
          boltGrad: ['#ffffff', '#34d399', '#14b8a6'],
          glow1: '#10b981',
          glow2: '#14b8a6',
          glow3: '#047857',
          dropShadow: '#10b981'
        };
      case 'red':
        return {
          borderGrad: ['#dc2626', '#ef4444', '#f87171', '#f43f5e'],
          boltGrad: ['#ffffff', '#f87171', '#f43f5e'],
          glow1: '#ef4444',
          glow2: '#f43f5e',
          glow3: '#b91c1c',
          dropShadow: '#ef4444'
        };
      case 'purple':
        return {
          borderGrad: ['#7c3aed', '#8b5cf6', '#a78bfa', '#ec4899'],
          boltGrad: ['#ffffff', '#a78bfa', '#ec4899'],
          glow1: '#8b5cf6',
          glow2: '#ec4899',
          glow3: '#6d28d9',
          dropShadow: '#8b5cf6'
        };
      default: // 'gray', etc.
        return {
          borderGrad: ['#4b5563', '#9ca3af', '#d1d5db', '#6b7280'],
          boltGrad: ['#ffffff', '#d1d5db', '#6b7280'],
          glow1: '#9ca3af',
          glow2: '#6b7280',
          glow3: '#374151',
          dropShadow: '#9ca3af'
        };
    }
  };
  const fluidColors = getFluidMeshLogoColors(effectiveTheme);

  let patternWidth = 120;
  let patternHeight = 104;
  let patternViewBox = "0 0 120 104";
  let patternContent = null;

  if (currentPattern === 'none') {
    patternContent = null;
  } else if (currentPattern === 'flame') {
    // Halftone Baklava Deseni
    patternWidth = 120;
    patternHeight = 120;
    patternViewBox = "0 0 120 120";
    patternContent = (
      <g fill="#ffffff" opacity={opacity}>
        <path d="M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z" />
        <path d="M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z" fillOpacity={0.75} />
        <path d="M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z" fillOpacity={0.45} />
        <path d="M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z" fillOpacity={0.25} />
      </g>
    );
  } else if (currentPattern === 'crystal') {
    // Kristal
    patternWidth = 120;
    patternHeight = 104;
    patternViewBox = "0 0 120 104";
    patternContent = (
      <g opacity={opacity * 1.5}>
        <polygon points="0,0 60,0 30,52" fill="#ffffff" fillOpacity="0.3" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="60,0 120,0 90,52" fill="#ffffff" fillOpacity="0.6" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="30,52 90,52 60,0" fill="#ffffff" fillOpacity="0.4" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,0 30,52 0,52" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="120,0 90,52 120,52" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,52 60,52 30,104" fill="#ffffff" fillOpacity="0.35" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="60,52 120,52 90,104" fill="#ffffff" fillOpacity="0.65" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="30,104 90,104 60,52" fill="#ffffff" fillOpacity="0.5" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,52 30,104 0,104" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="120,52 90,104 120,104" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
      </g>
    );
  } else if (currentPattern === 'chain') {
    // Akışkan
    patternWidth = 120;
    patternHeight = 120;
    patternViewBox = "0 0 120 120";
    patternContent = (
      <g stroke="none" fill="#ffffff" opacity={opacity}>
        <path d="M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z" fillOpacity={0.35} />
        <path d="M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z" fillOpacity={0.35} />
        <path d="M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z" fillOpacity={0.5} />
        <path d="M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z" fillOpacity={0.5} />
        <rect x={38} y={47} width={12} height={30} rx={6} fillOpacity={0.2} />
        <rect x={98} y={15} width={12} height={40} rx={6} fillOpacity={0.2} />
        <rect x={98} y={65} width={12} height={45} rx={6} fillOpacity={0.2} />
        <rect x={15} y={-10} width={12} height={25} rx={6} fillOpacity={0.2} />
        <rect x={15} y={110} width={12} height={25} rx={6} fillOpacity={0.2} />
        <circle cx={28} cy={55} r={5} fillOpacity={0.25} />
        <circle cx={85} cy={35} r={5} fillOpacity={0.25} />
        <circle cx={85} cy={85} r={5} fillOpacity={0.25} />
      </g>
    );
  } else if (currentPattern === 'topography') {
    // Topografya
    patternWidth = 200;
    patternHeight = 200;
    patternViewBox = "0 0 200 200";
    patternContent = (
      <g stroke="#ffffff" strokeWidth="1.2" fill="none" strokeOpacity={opacity}>
        <path d="M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150" />
        <path d="M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10" />
        <path d="M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210" />
      </g>
    );
  }

  const svgElement = (
    <svg className={isGlass ? 'storm-logo-glass' : (isFluidMesh ? 'storm-logo-fluid-mesh' : '')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={width} height={height}>
        <defs>
          <clipPath id={`logo-clip-${uId}`}>
            <rect width="200" height="200" rx="48" />
          </clipPath>
          {patternContent && !isGlass && !isFluidMesh && currentDesignStyle !== 'clean-light' && (
            <pattern 
              id={patternId} 
              width={patternWidth} 
              height={patternHeight} 
              patternUnits="userSpaceOnUse" 
              viewBox={patternViewBox}
              x={(200 - patternWidth) / 2}
              y={(200 - patternHeight) / 2}
            >
              {patternContent}
            </pattern>
          )}
          
          {/* Glass Theme Gradients */}
          <linearGradient id={`glass-logo-grad-${uId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`glass-border-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`glass-back-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="35%" stopColor={fillCol} stopOpacity="0.1" />
            <stop offset="70%" stopColor={fillCol} stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id={`accent-bolt-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="50%" stopColor={fillCol} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`glass-shimmer-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`logo-text-shadow-${uId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.35" />
          </filter>

          {/* Fluid Mesh Theme Gradients */}
          <linearGradient id={`fluid-border-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fluidColors.borderGrad[0]} />
            <stop offset="40%" stopColor={fluidColors.borderGrad[1]} />
            <stop offset="70%" stopColor={fluidColors.borderGrad[2]} />
            <stop offset="100%" stopColor={fluidColors.borderGrad[3]} />
          </linearGradient>
          <linearGradient id={`fluid-bolt-grad-${uId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fluidColors.boltGrad[0]} />
            <stop offset="40%" stopColor={fluidColors.boltGrad[1]} />
            <stop offset="100%" stopColor={fluidColors.boltGrad[2]} />
          </linearGradient>
          <radialGradient id={`fluid-bg-glow-1-${uId}`} cx="25%" cy="25%" r="65%">
            <stop offset="0%" stopColor={fluidColors.glow1} stopOpacity="0.45" />
            <stop offset="100%" stopColor={fluidColors.glow1} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`fluid-bg-glow-2-${uId}`} cx="75%" cy="75%" r="65%">
            <stop offset="0%" stopColor={fluidColors.glow2} stopOpacity="0.45" />
            <stop offset="100%" stopColor={fluidColors.glow2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`fluid-bg-glow-3-${uId}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={fluidColors.glow3} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fluidColors.glow3} stopOpacity="0" />
          </radialGradient>
          <filter id={`fluid-logo-text-glow-${uId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor={fluidColors.dropShadow} floodOpacity="0.65" />
          </filter>
          <filter id={`fluid-bolt-glow-${uId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={fluidColors.dropShadow} floodOpacity="0.5" />
          </filter>
          {!downloadMode && (
            <style>{`
              @keyframes storm-glass-shimmer {
                0% { transform: translate3d(0, 0, 0) skewX(-25deg); opacity: 0; }
                8% { opacity: 0.7; }
                32% { transform: translate3d(420px, 0, 0) skewX(-25deg); opacity: 0.7; }
                35%, 100% { transform: translate3d(420px, 0, 0) skewX(-25deg); opacity: 0; }
              }
              .storm-logo-shimmer {
                animation: storm-glass-shimmer 5s infinite cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                transform-origin: center;
                mix-blend-mode: overlay;
                will-change: transform;
              }
              @keyframes mesh-logo-blob-1 {
                0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
                50% { transform: translate3d(15px, -15px, 0) scale3d(1.15, 1.15, 1); }
                100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
              }
              @keyframes mesh-logo-blob-2 {
                0% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
                50% { transform: translate3d(-15px, 15px, 0) scale3d(1.12, 1.12, 1); }
                100% { transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
              }
              .animate-mesh-logo-blob-1 {
                animation: mesh-logo-blob-1 12s infinite ease-in-out;
                transform-origin: 50px 50px;
                will-change: transform;
              }
              .animate-mesh-logo-blob-2 {
                animation: mesh-logo-blob-2 15s infinite ease-in-out;
                transform-origin: 150px 150px;
                will-change: transform;
              }
            `}</style>
          )}
        </defs>

        {isFluidMesh ? (
          <g clipPath={`url(#logo-clip-${uId})`}>
            {/* Base futuristic mesh canvas backing */}
            <rect width="200" height="200" fill="#04020a" />
            
            {/* Overlay orbiting colorful glowing blob waves */}
            <circle cx="50" cy="50" r="100" fill={`url(#fluid-bg-glow-1-${uId})`} className={!downloadMode ? "animate-mesh-logo-blob-1" : undefined} />
            <circle cx="150" cy="150" r="100" fill={`url(#fluid-bg-glow-2-${uId})`} className={!downloadMode ? "animate-mesh-logo-blob-2" : undefined} />
            <circle cx="100" cy="100" r="80" fill={`url(#fluid-bg-glow-3-${uId})`} />

            {/* Subtle frosted glass glare over the mesh */}
            <path d="M 0,0 L 200,0 L 200,95 Q 100,125 0,95 Z" fill={`url(#glass-logo-grad-${uId})`} />

            {/* Futuristic glowing multi-stop colorful border line */}
            <rect width="194" height="194" x="3" y="3" rx="45" fill="none" stroke={`url(#fluid-border-grad-${uId})`} strokeWidth="4.5" />
          </g>
        ) : isGlass ? (
          <g clipPath={`url(#logo-clip-${uId})`}>
            {/* Always render a solid premium dark/black background so it is a perfect "siyah logo" */}
            <rect width="200" height="200" fill="#0c0b14" />
            {/* Base tinted dark glass backing */}
            <rect width="200" height="200" fill={`url(#glass-back-grad-${uId})`} />
            {/* Main 3D curved gloss reflection block */}
            <path d="M 0,0 L 200,0 L 200,95 Q 100,125 0,95 Z" fill={`url(#glass-logo-grad-${uId})`} />
            {/* Ambient inner soft glowing light beam */}
            <circle cx="100" cy="50" r="70" fill="#ffffff" opacity="0.03" />
            {/* Moving glass shimmer light beam */}
            {!downloadMode && (
              <rect className="storm-logo-shimmer" x="-150" y="0" width="120" height="200" fill={`url(#glass-shimmer-grad-${uId})`} />
            )}
            {/* Beveled edge stroke with linear gradient */}
            <rect width="196" height="196" x="2" y="2" rx="46" fill="none" stroke={`url(#glass-border-grad-${uId})`} strokeWidth="3.5" />
          </g>
        ) : (
          <rect width="200" height="200" rx="48" fill={fillCol} />
        )}

        {/* Textured overlay pattern inside the logo background */}
        {patternContent && !isGlass && !isFluidMesh && currentDesignStyle !== 'clean-light' && currentDesignStyle !== 'pro-solid' && currentDesignStyle !== 'navy-perf' && (
          <rect width="200" height="200" rx="48" fill={`url(#${patternId})`} />
        )}

        {/* Modern Minimalist Lightning Bolt - Enlarged and centered */}
        <g transform="translate(63.75, 12) scale(1.45)">
          <path 
            d="M28 2 L8 38 L23 38 L15 66 L42 28 L28 28 Z" 
            fill={isFluidMesh ? `url(#fluid-bolt-grad-${uId})` : (isGlass ? `url(#accent-bolt-grad-${uId})` : "#ffffff")} 
            filter={isFluidMesh ? `url(#fluid-bolt-glow-${uId})` : undefined}
          />
        </g>

        {/* Typography - Enlarged and high contrast for absolute sharpness */}
        <text 
          x="100" 
          y="139" 
          dx="2" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="950" 
          fontSize="33" 
          fill="#ffffff" 
          letterSpacing="3.5" 
          filter={isFluidMesh ? `url(#fluid-logo-text-glow-${uId})` : (isGlass ? `url(#logo-text-shadow-${uId})` : undefined)}
        >
          STORM
        </text>
        <text 
          x="100" 
          y="171" 
          dx="1" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="19" 
          fill="#ffffff" 
          letterSpacing="2.5" 
          opacity="0.95" 
          filter={isFluidMesh ? `url(#fluid-logo-text-glow-${uId})` : (isGlass ? `url(#logo-text-shadow-${uId})` : undefined)}
        >
          MUHASEBE
        </text>
      </svg>
  );

  if (onlySvg) {
    return svgElement;
  }

  return (
    <div className={className} style={{ ...cleanedStyle, willChange: 'transform', display: 'flex', alignItems: 'center', justifyContent: 'center', width: typeof width === 'number' ? `${width}px` : (width === '100%' ? undefined : width), height: typeof height === 'number' ? `${height}px` : (height === '100%' ? undefined : height) }}>
      {svgElement}
    </div>
  );
};

export const APP_VERSION = '1.8.0';

export const CHANGELOG = {
  version: '1.8.0',
  features: [
    "1.8.0 Kararlı Sürüm Yayınlandı: Storm Ön Muhasebe v1.8.0 sürümü başarıyla canlıya alındı.",
    "%5 Akıcı Tipografi Ölçeklendirmesi: Tüm arayüz temalarında yazı tipi boyutları %5 oranında göz yormayan, net ve ekran çözünürlüğüne mükemmel uyumlu bir tipografi ölçeğine yükseltildi.",
    "Temiz Işık (Clean Light) Arayüz Yenilemesi: Temiz Işık temasında tüm gösterge paneli widget başlıkları, özet finansal kartlar ve tablolar ferah beyaz kart görünümüne kavuşturuldu.",
    "Baskı & PDF Sayfa İzolasyonu: Cari ekstre detayları ve yazdırma önizlemelerinde orijinal beyaz kağıt arka planı ve yüksek metin okunabilirliği garanti altına alındı."
  ],
  fixes: [
    "Performans ve Tipografi Senkronizasyonu: Sistem genelinde font ve tema ayarlarının anlık senkronizasyon hızı ve render stili optimize edildi.",
    "Yüksek Kontrast Kararlılığı: Koyu ve açık tema geçişlerinde metinlerin netliği ve renk uyumu korundu."
  ]
};

export const PREDEFINED_USERS = [
  { id: 'admin', name: 'XSTORM', pin: '270212' },
  { id: 'muhasebe', name: 'GÖKDOĞAN TEKSTİL', pin: '041646' },
  { id: 'firma_1', name: 'SAMPI10', pin: '111111' },
  { id: 'firma_2', name: 'NİFER', pin: '222222' },
  { id: 'firma_3', name: '3. Firma (Kullanıcı 3)', pin: '333333' },
];

export const COLOR_PRESETS = [
  {
    id: 'navy-blue-00007f',
    name: 'Lacivert',
    preview: '#00007f',
    colors: {
      '--accent-50': '#f0f2ff',
      '--accent-100': '#e0e4ff',
      '--accent-200': '#c7ceff',
      '--accent-300': '#9faeff',
      '--accent-400': '#7084ff',
      '--accent-500': '#3f53ff',
      '--accent-600': '#1d2eff',
      '--accent-700': '#000ee6',
      '--accent-800': '#000cb5',
      '--accent-900': '#00007f',
      '--accent-950': '#00004c',
    }
  },
  {
    id: 'sampi10-blue',
    name: 'Sadece Mavi',
    preview: '#22315b',
    colors: {
      '--accent-50': '#f4f6fb',
      '--accent-100': '#e7ecf5',
      '--accent-200': '#ced9ea',
      '--accent-300': '#a5bdda',
      '--accent-400': '#779dc5',
      '--accent-500': '#5480b1',
      '--accent-600': '#406594',
      '--accent-700': '#345179',
      '--accent-800': '#2d4565',
      '--accent-900': '#22315b',
      '--accent-950': '#1a2240',
    }
  },
  {
    id: 'teal',
    name: 'Turkuaz',
    preview: '#14b8a6',
    colors: {
      '--accent-50': '#f0fdfa',
      '--accent-100': '#ccfbf1',
      '--accent-200': '#99f6e4',
      '--accent-300': '#5eead4',
      '--accent-400': '#2dd4bf',
      '--accent-500': '#14b8a6',
      '--accent-600': '#0d9488',
      '--accent-700': '#0f766e',
      '--accent-800': '#115e59',
      '--accent-900': '#134e4a',
      '--accent-950': '#042f2e',
    }
  },
  {
    id: 'amber',
    name: 'Kehribar',
    preview: '#f59e0b',
    colors: {
      '--accent-50': '#fffbeb',
      '--accent-100': '#fef3c7',
      '--accent-200': '#fde68a',
      '--accent-300': '#fcd34d',
      '--accent-400': '#fbbf24',
      '--accent-500': '#f59e0b',
      '--accent-600': '#d97706',
      '--accent-700': '#b45309',
      '--accent-800': '#92400e',
      '--accent-900': '#78350f',
      '--accent-950': '#451a03',
    }
  },
  {
    id: 'pro-red',
    name: 'Açık Kırmızı',
    preview: '#E63946',
    colors: {
      '--accent-50': '#fef2f2',
      '--accent-100': '#fee2e2',
      '--accent-200': '#fecaca',
      '--accent-300': '#fca5a5',
      '--accent-400': '#f87171',
      '--accent-500': '#E63946', // MuhasebePro red
      '--accent-600': '#DC2626',
      '--accent-700': '#B91C1C', 
      '--accent-800': '#991B1B',
      '--accent-900': '#7F1D1D',
      '--accent-950': '#450A0A',
    }
  },
  {
    id: 'red',
    name: 'Kırmızı',
    preview: '#b91c1c',
    colors: {
      '--accent-50': '#fef2f2',
      '--accent-100': '#fee2e2',
      '--accent-200': '#fecaca',
      '--accent-300': '#fca5a5',
      '--accent-400': '#f87171',
      '--accent-500': '#b91c1c', // storm logo red
      '--accent-600': '#991b1b',
      '--accent-700': '#7f1d1d', // storm logo dark red
      '--accent-800': '#450a0a',
      '--accent-900': '#3a0909',
      '--accent-950': '#2b0707',
    }
  },
  {
    id: 'sky',
    name: 'Mavi',
    preview: '#0ea5e9',
    colors: {
      '--accent-50': '#f0f9ff',
      '--accent-100': '#e0f2fe',
      '--accent-200': '#bae6fd',
      '--accent-300': '#7dd3fc',
      '--accent-400': '#38bdf8',
      '--accent-500': '#0ea5e9',
      '--accent-600': '#0284c7',
      '--accent-700': '#0369a1',
      '--accent-800': '#075985',
      '--accent-900': '#0c4a6e',
      '--accent-950': '#031b2c',
    }
  },
  {
    id: 'gray',
    name: 'Gri',
    preview: '#71717a',
    colors: {
      '--accent-50': '#fafafa',
      '--accent-100': '#f4f4f5',
      '--accent-200': '#e4e4e7',
      '--accent-300': '#d4d4d8',
      '--accent-400': '#a1a1aa',
      '--accent-500': '#71717a',
      '--accent-600': '#52525b',
      '--accent-700': '#3f3f46',
      '--accent-800': '#27272a',
      '--accent-900': '#18181b',
      '--accent-950': '#09090b',
    }
  },
  {
    id: 'indigo',
    name: 'İndigo',
    preview: '#6366f1',
    colors: {
      '--accent-50': '#eef2ff',
      '--accent-100': '#e0e7ff',
      '--accent-200': '#c7d2fe',
      '--accent-300': '#a5b4fc',
      '--accent-400': '#818cf8',
      '--accent-500': '#6366f1',
      '--accent-600': '#4f46e5',
      '--accent-700': '#4338ca',
      '--accent-800': '#3730a3',
      '--accent-900': '#312e81',
      '--accent-950': '#1e1b4b',
    }
  },
  {
    id: 'yellow',
    name: 'Sarı',
    preview: '#eab308',
    colors: {
      '--accent-50': '#fefce8',
      '--accent-100': '#fef9c3',
      '--accent-200': '#fef08a',
      '--accent-300': '#fde047',
      '--accent-400': '#facc15',
      '--accent-500': '#eab308',
      '--accent-600': '#ca8a04',
      '--accent-700': '#a16207',
      '--accent-800': '#854d0e',
      '--accent-900': '#713f12',
      '--accent-950': '#422006',
    }
  }
];

export const StormIconWrapper = ({ iconElement, isActive, designStyle }: { iconElement: React.ReactNode, isActive?: boolean, designStyle?: string }) => {
  const isProSolid = designStyle === 'pro-solid';
  return (
    <div 
      className={`storm-icon-wrapper ${isActive ? 'active-icon' : ''} relative flex items-center justify-center shrink-0 rounded-lg transition-all duration-200 w-8 h-8 ${isProSolid && isActive ? 'text-white' : 'text-white'} group-hover:scale-110`}
      style={{
        backgroundColor: isProSolid ? 'transparent' : (isActive ? 'var(--accent-600)' : 'color-mix(in srgb, var(--accent-900) 40%, transparent)'),
        boxShadow: (isActive && !isProSolid) ? '0 0 10px color-mix(in srgb, var(--accent-500) 40%, transparent)' : 'none'
      }}
    >
      {/* Actual Icon */}
      <div className="relative z-10">
        {iconElement}
      </div>
    </div>
  );
};

export const TAB_DEFS: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard: { label: 'Gösterge Paneli', icon: <LayoutDashboard size={18} strokeWidth={2.4} /> },
  cariler: { label: 'Cari Hesaplar', icon: <Users size={18} strokeWidth={2.4} /> },
  stoklar: { label: 'Stok Durumu', icon: <Package size={18} strokeWidth={2.4} /> },
  islemler: { label: 'Finansal Hareketler', icon: <Receipt size={18} strokeWidth={2.4} /> },
  ceksenet: { label: 'Çek ve Senet Takibi', icon: <Briefcase size={18} strokeWidth={2.4} /> },
  masraflar: { label: 'Gider ve Masraflar', icon: <Wallet size={18} strokeWidth={2.4} /> },
  kasa: { label: 'Kasa & Banka Durumu', icon: <DollarSign size={18} strokeWidth={2.4} /> },
  krediler: { label: 'Kredi Takip Yönetimi', icon: <Landmark size={18} strokeWidth={2.4} /> },
  calisanlar: { label: 'Personel & Maaşlar', icon: <Users size={18} strokeWidth={2.4} /> },
  raporlar: { label: 'Raporlar ve Analiz', icon: <BarChart3 size={18} strokeWidth={2.4} /> },
  ayarlar: { label: 'Sistem Ayarları', icon: <Settings size={18} strokeWidth={2.4} /> }
};

export const SIDEBAR_BG_PRESETS = [
  { id: 'pure-white', name: 'Kar Beyaz (Beyaz)', value: '#ffffff', border: 'rgba(0,0,0,0.1)' },
  { id: 'pro-dark', name: 'Pro Koyu Gri', value: '#2b2d35', border: 'rgba(255,255,255,0.05)' },
  { id: 'slate-gray', name: 'Mika Grisi', value: '#1e293b', border: 'rgba(255,255,255,0.12)' },
  { id: 'royal-navy', name: 'Safir Mavisi (Lacivert)', value: '#1e3a8a', border: 'rgba(255,255,255,0.15)' },
  { id: 'sampi10-blue', name: 'Sadece Mavi', value: '#22315b', border: 'rgba(255,255,255,0.15)' },
  { id: 'vibrant-blue', name: 'Okyanus Mavisi (Mavi)', value: '#0284c7', border: 'rgba(255,255,255,0.15)' },
  { id: 'vibrant-amber', name: 'Altın Kehribar (Kehribar)', value: '#d97706', border: 'rgba(255,255,255,0.15)' },
  { id: 'forest-teal', name: 'Zümrüt Yeşili (Turkuaz)', value: '#0d9488', border: 'rgba(255,255,255,0.15)' },
  { id: 'storm-red', name: 'Kırmızı', value: '#b91c1c', border: 'rgba(255,255,255,0.15)' }
];

export const SIDEBAR_PATTERNS = [
  { id: 'none', name: 'Yok (Düz Renk)', svg: '', size: 'auto' },
  { id: 'geometric', name: 'Geometrik', svg: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z M30 69.28 L30 34.64 L0 17.32 M30 34.64 L60 17.32 M0 69.28 L30 86.6 L60 69.28 M30 86.6 L30 104 M0 69.28 L30 104 M60 69.28 L30 104 M0 51.96 L0 69.28 M60 51.96 L60 69.28 M0 0 L0 17.32 M60 0 L60 17.32 M0 69.28 L0 104 M60 69.28 L60 104' fill='none' stroke='PATTERNCOLOR' stroke-width='1.5' stroke-opacity='OPACITY'/%3E%3C/svg%3E")`, size: '60px 104px' },
  { id: 'flame', name: 'Halftone Baklava', svg: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='PATTERNCOLOR' opacity='OPACITY'%3E%3Cpath d='M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z' /%3E%3Cpath d='M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z' opacity='0.75' /%3E%3Cpath d='M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z' opacity='0.45' /%3E%3Cpath d='M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z' opacity='0.25' /%3E%3C/g%3E%3C/svg%3E")`, size: '120px 120px' },
  { id: 'crystal', name: 'Kristal', svg: `url("data:image/svg+xml,%3Csvg width='120' height='104' viewBox='0 0 120 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='OPACITY'%3E%3Cpolygon points='0,0 60,0 30,52' fill='PATTERNCOLOR' fill-opacity='0.3' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='60,0 120,0 90,52' fill='PATTERNCOLOR' fill-opacity='0.6' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='30,52 90,52 60,0' fill='PATTERNCOLOR' fill-opacity='0.4' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,0 30,52 0,52' fill='PATTERNCOLOR' fill-opacity='0.15' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='120,0 90,52 120,52' fill='PATTERNCOLOR' fill-opacity='0.15' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,52 60,52 30,104' fill='PATTERNCOLOR' fill-opacity='0.35' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='60,52 120,52 90,104' fill='PATTERNCOLOR' fill-opacity='0.65' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='30,104 90,104 60,52' fill='PATTERNCOLOR' fill-opacity='0.5' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,52 30,104 0,104' fill='PATTERNCOLOR' fill-opacity='0.2' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='120,52 90,104 120,104' fill='PATTERNCOLOR' fill-opacity='0.2' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`, size: '120px 104px' },
  { id: 'chain', name: 'Akışkan', svg: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='none' fill='PATTERNCOLOR' opacity='OPACITY'%3E%3Cpath d='M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z' fill-opacity='0.35'/%3E%3Cpath d='M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z' fill-opacity='0.35'/%3E%3Cpath d='M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z' fill-opacity='0.5'/%3E%3Cpath d='M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z' fill-opacity='0.5'/%3E%3Crect x='38' y='47' width='12' height='30' rx='6' fill-opacity='0.2'/%3E%3Crect x='98' y='15' width='12' height='40' rx='6' fill-opacity='0.2'/%3E%3Crect x='98' y='65' width='12' height='45' rx='6' fill-opacity='0.2'/%3E%3Crect x='15' y='-10' width='12' height='25' rx='6' fill-opacity='0.2'/%3E%3Crect x='15' y='110' width='12' height='25' rx='6' fill-opacity='0.2'/%3E%3Ccircle cx='28' cy='55' r='5' fill-opacity='0.25'/%3E%3Ccircle cx='85' cy='35' r='5' fill-opacity='0.25'/%3E%3Ccircle cx='85' cy='85' r='5' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E")`, size: '120px 120px' },
  { id: 'topography', name: 'Topografya', svg: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3Cpath d='M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3Cpath d='M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3C/svg%3E")`, size: '200px 200px' },
];

export const PIN_ACCOUNTS = [
  { name: 'XSTORM', pin: '270212', email: 'admin@storm.com', password: 'storm_admin_pass' },
  { name: 'GÖKDOĞAN TEKSTİL', pin: '041646', email: 'muhasebe@storm.com', password: 'storm_muhasebe_pass' },
  { name: 'SAMPI10', pin: '111111', email: 'firma_1@storm.com', password: 'storm_firma1_pass' },
  { name: 'NİFER', pin: '222222', email: 'firma_2@storm.com', password: 'storm_firma2_pass' },
  { name: '3. Firma (Kullanıcı 3)', pin: '333333', email: 'firma_3@storm.com', password: 'storm_firma3_pass' },
];

export const changelogData = [
  {
    version: "1.8.0",
    date: "29.07.2026",
    changes: [
      "1.8.0 Kararlı Sürüm Yayınlandı: Storm Ön Muhasebe v1.8.0 sürümü başarıyla yayınlandı ve canlıya alındı.",
      "%5 Akıcı Tipografi Ölçeklendirmesi: Tüm arayüz temalarında yazı tipi boyutları %5 oranında göz yormayan, net ve ekran çözünürlüğüne mükemmel uyumlu bir tipografi ölçeğine yükseltildi.",
      "Temiz Işık (Clean Light) Arayüz Yenilemesi: Temiz Işık temasında tüm gösterge paneli widget başlıkları, özet finansal kartlar ve tablolar ferah beyaz kart görünümüne kavuşturuldu.",
      "Baskı & PDF Sayfa İzolasyonu: Cari ekstre detayları ve yazdırma önizlemelerinde orijinal beyaz kağıt arka planı ve yüksek metin okunabilirliği garanti altına alındı."
    ]
  },
  {
    version: "1.7.9",
    date: "29.07.2026",
    changes: [
      "Varsayılan Tema ve Renk Güncellemesi: Varsayılan arayüz stili 'Sıvı Mesh Gradient (Aurora Mesh)' ve varsayılan vurgu rengi 'Mavi (Sky)' olarak güncellendi.",
      "Kompakt Tasarım Düzeni: Genel Ayarlar menüsündeki 'Arayüz Tasarım Stili' ile 'Uygulama Yazı Boyutu' kartları az yer kaplayan pratik ve şık tek bir kart bünyesinde birleştirildi.",
      "Arayüz ve Vurgu Rengi Düzenlemeleri: 'Storm AI' rozet görselleri ve vurgu renklerindeki uyumsuzluklar giderildi, renk paleti sadeleştirildi.",
      "Varsayılana Sıfırla Düzeltmesi: Varsayılan ayarlara dönüldüğünde Sıvı Mesh teması ve Mavi vurgu rengine pürüzsüz geçiş sağlandı.",
      "Lacivert Hız Teması Logo Düzenlemesi: Lacivert Hız (Navy Performance) teması seçildiğinde logo üzerindeki desen kaplaması kaldırıldı."
    ]
  },
  {
    version: "1.7.8",
    date: "28.07.2026",
    changes: [
      "Gösterge Paneli Başlık Tasarımı: Özet finansal göstergeler ve widget başlık kartları sol navigasyon paneli ve aktif renk temasıyla birebir uyumlu premium görünümle yenilendi.",
      "Sol Menü Kaydırma Çubuğu (Scrollbar): Sol navigasyon menüsüne özel sol tarafa hizalı, yüksek kontrastlı ve akıcı özel scrollbar entegre edildi.",
      "Arayüz & Tema Kararlılığı: Gösterge paneli kart başlıklarında metin okunabilirliği ve tasarım stili senkronizasyonu tüm renk temalarında tam uyumlu hale getirildi."
    ]
  },
  {
    version: "1.7.7",
    date: "25.07.2026",
    changes: [
      "Döviz.com Kurları: İşletmelerin daha çok tercih ettiği Döviz.com canlı kurları (USD, EUR) sisteme entegre edildi. Gösterge paneli ve işlemlerde otomatik olarak kullanılır.",
      "Performans ve Kararlılık: Uygulama genelinde altyapı güçlendirmeleri ve hız optimizasyonları yapıldı.",
      "Masaüstü İkonu: Uygulama masaüstü ikonu yüksek çözünürlüklü yeni versiyonuyla güncellendi."
    ]
  },
  {
    version: "1.7.6",
    date: "25.07.2026",
    changes: [
      "Arayüz İyileştirmeleri: Performans optimizasyonu yapıldı ve genel kararlılık artırıldı."
    ]
  },
  {
    version: "1.7.5",
    date: "24.07.2026",
    changes: [
      "Finansal Hareketler Tarih Filtresi: İşlemler sekmesinde varsayılan olarak son 1 aylık işlemlerin gösterilmesi sağlandı.",
      "Yapay Zeka İyileştirmeleri: Storm AI asistanının etkileşim hızı ve kararlılığı artırıldı.",
      "Arayüz İyileştirmeleri: Finansal hareketler ekranında ve genel arayüzde performans optimizasyonları yapıldı."
    ]
  },
  {
    version: "1.7.4",
    date: "24.07.2026",
    changes: [
      "Akıllı Excel Aktarımı (AI Parser): Bakiye okuma iyileştirmeleri ve döviz cinsi tanıma (TL, USD, EUR) algoritmaları güçlendirildi.",
      "Cari Aktarım Düzeltmesi: Excel aktarımında Açılış Bakiyesinin hesaplara iki kez yansımasına neden olan matematiksel hata giderildi.",
      "Gösterge Paneli Sadeleştirmesi: Döviz kuru bilgi çubuğundan gereksiz 'Yedek' metni kaldırılarak daha temiz bir arayüz sağlandı."
    ]
  },
  {
    version: "1.7.3",
    date: "21.07.2026",
    changes: [
      "Masaüstü Sol Menü (Sidebar) Genişletmesi: Bilgisayar sürümünde sol menü genişliği %10 oranında artırıldı (256px'ten 288px'e - w-72). Bu sayede 'KASA & BANKA DURUMU', 'FİNANSAL HAREKETLER', 'PERSONEL & MAAŞLAR' gibi uzun sekme metinlerinin tüm temalarda kesintisiz ve ferah bir şekilde sığması sağlandı.",
      "Masaüstü AI Asistan Butonu & Sürükleme Hassasiyeti: Storm AI asistanının sürükleme mesafesi toleransı artırılarak tıklama/sürükleme çakışmaları tamamen giderildi; asistan butonu masaüstünde %20 oranında büyütülerek daha kolay erişilebilir ve estetik hale getirildi.",
      "Mobil Menü Sekme Optimizasyonu: Mobil ana menü panelinde Çek ve Senet Takibi ile Kredi Takip Yönetimi sekmeleri gizlendi.",
      "Mobil Ayarlar Görünüm Sadeleştirmesi: Ayarlar sekmesinde mobil görünümde gereksiz olan Arayüz Tasarım Stili, Arayüz Vurgu Rengi ve Firma/Görünüm Ayarları panelleri gizlenerek pürüzsüz ve dikey ekran kazancını maksimize eden sade bir yapıya geçildi.",
      "Baskı & Şablon Tasarımcısı Mobil Koruması: Mobil cihazlarda şablon tasarımcısı sekmeleri gizlendi ve bilgisayardan tasarlanan şablonların kullanılması yönünde bilgilendirme kartı yerleştirildi.",
      "Klavye Kısayolları Mobil Koruması: Mobil cihazlarda zaten kullanılamayan klavye kısayolları sekmesi gizlenerek dikey alan israfı engellendi.",
      "Yapışkan Onay & Kaydet Barı (Sticky Footer): Satış Faturası, Alış Faturası, Tahsilat ve Ödeme makbuzu formlarında (IslemModal) 'İptal' ve 'Kaydet' butonları ekranın en altına yapışık (sticky footer) hale getirildi.",
      "Sürüklenebilir Yapay Zeka Asistanı: Mobil ve masaüstü ekranlarda Storm AI asistan butonu serbestçe sürüklenebilir hale getirildi; ekranın istenilen köşesine yerleştirilerek çalışma alanının kapatılması önlendi.",
      "Mobil Profil ve Güvenlik Koruması: Mobil cihazlarda gereksiz yer kaplayan Profil & Güvenlik ayarlar alt sekmesi gizlendi.",
      "Gelişmiş Gösterge Paneli Takvimi: Gösterge panelindeki takvim kutusu mobil ve masaüstü görünümlerde ay adını kısaltılmış yerine tam adıyla ve yıl bilgisiyle (örn. 21 Temmuz 2026) gösterecek şekilde güncellendi."
    ]
  },
  {
    version: "1.7.2",
    date: "21.07.2026",
    changes: [
      "Tam Ekran Mobil Ana Menü (MobileMenuView): Giriş ekranından sonra mobil kullanıcıları karşılayan, görsellerden arındırılmış son derece sade ve kompakt 3 sütunlu modern ana menü paneli devreye alındı.",
      "Kompakt Mobil Header ve Geri Dönüş Akışı: Diğer sekmelere giriş yapıldığında sol üst köşede beliren estetik 'Geri' butonu aracılığıyla kesintisiz bir şekilde ana menüye dönüş imkanı sağlandı. Büyük logo kaldırılarak üst bilgi alanı daraltıldı ve dikey ekran kazancı maksimize edildi.",
      "Mobil Alt Gezinme Çubuğu İptali: Kullanıcı talebi doğrultusunda ekran alanını kısıtlayan alt navigasyon barı (MobileBottomNav) tamamen devre dışı bırakıldı."
    ]
  },
  {
    version: "1.7.1",
    date: "21.07.2026",
    changes: [
      "Mobil Alt Navigasyon Çubuğu (MobileBottomNav): Mobil cihazlarda hızlı erişim sağlayan, pürüzsüz yaylı (spring) fizik tabanlı gösterge animasyonlu, akıllı kilit rozetli ve safe-area uyumlu alt gezinti barı uygulandı.",
      "Mobil Header Entegrasyonu: Üst bar alanını daha kompakt ve sade hale getirerek dikey çalışma alanını artıran ve yeni alt gezinme barıyla kusursuz senkronize olan mobil yerleşim düzeni tamamlandı.",
      "1.7.1 Sürüm Geçiş Altyapısı: Gelecek kararlı sürüm için gerekli tüm sürüm hazırlıkları ve taslak sürüm günlüğü (changelog) modülleri entegre edildi."
    ]
  },
  {
    version: "1.7.0",
    date: "21.07.2026",
    changes: [
      "Arayüz Arka Plan Desen Düzeltmesi: Sol menü / sidebar için seçilen arka plan desenlerinin (örneğin Kristal üçgen deseni) ana uygulama paneline sızması ve buralarda tekrarlayarak Cam Arayüz (Glassmorphism) ve Sıvı Mesh (Aurora Mesh) gibi modern görsel stilleri örtmesi engellendi.",
      "Göz Yormayan Çalışma Deneyimi: Muhasebe tabloları ve finans listeleri arkasındaki desen gürültüsü kaldırılarak çalışma alanının mükemmel temizlikte, yüksek kontrastlı ve son derece okunabilir olması sağlandı.",
      "Storm AI Asistanı Modernizasyonu: Yapay Zeka yüzer butonu daha kompakt, çerçevesiz, modern ve şık bir minimalist tasarıma kavuşturuldu.",
      "Akıllı Konumlandırma: Storm AI asistan butonu, mobil cihazlarda alt gezinme çubuğuyla çakışmaması için 1 cm yukarı kaydırılarak (bottom-20) sağ alt köşeye (right-1.5) konumlandırıldı.",
      "Yapay Zeka Açma / Kapama Desteği: Ayarlar -> Yapay Zeka (AI) Ayarları sekmesi altına asistanı hem bilgisayar hem mobil sürümlerde tamamen açıp kapatabilmeyi sağlayan yeni bir anahtar (Switch) eklendi ve bu tercih tarayıcı belleğine (localStorage) entegre edildi."
    ]
  }
];
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'open_sale', name: 'Yeni Satış Faturası Ekle', category: 'Hızlı İşlemler', key: 's', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'open_purchase', name: 'Yeni Alış Faturası Ekle', category: 'Hızlı İşlemler', key: 'a', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'open_collection', name: 'Yeni Tahsilat Girişi Ekle', category: 'Hızlı İşlemler', key: 't', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'open_payment', name: 'Yeni Ödeme Girişi Ekle', category: 'Hızlı İşlemler', key: 'o', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'add_cari', name: 'Yeni Cari Kartı Ekle', category: 'Hızlı İşlemler', key: 'c', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'add_stock', name: 'Yeni Ürün/Hizmet Ekle', category: 'Hızlı İşlemler', key: 'u', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_dashboard', name: 'Kontrol Paneli\'ne Git', category: 'Modül Navigasyonu', key: '1', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_cariler', name: 'Cariler Modülü\'ne Git', category: 'Modül Navigasyonu', key: '2', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_stoklar', name: 'Stoklar Modülü\'ne Git', category: 'Modül Navigasyonu', key: '3', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_islemler', name: 'İşlemler Modülü\'ne Git', category: 'Modül Navigasyonu', key: '4', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_kasa', name: 'Kasa/Banka Modülü\'ne Git', category: 'Modül Navigasyonu', key: '5', altKey: true, ctrlKey: false, shiftKey: false },
  { id: 'nav_ayarlar', name: 'Ayarlar Modülü\'ne Git', category: 'Modül Navigasyonu', key: '9', altKey: true, ctrlKey: false, shiftKey: false },
];

