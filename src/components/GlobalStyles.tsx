import React from 'react';
import { globalStylesPart2 } from './GlobalStylesPart2';

interface GlobalStylesProps {
  bodyPatternSvg: string;
  activePattern: any;
  themeCssRules: string;
}

export const GlobalStyles: React.FC<GlobalStylesProps> = ({ themeCssRules, bodyPatternSvg, activePattern }) => {
    return (
      <style>{`
        :root {
          ${themeCssRules}
        }

        /* Sıvı Mesh tasarım stili src/styles/sivimesh.css dosyasındadır. */

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
          backface-visibility: hidden;
        }
        .animate-mesh-logo-blob-2 {
          animation: mesh-logo-blob-2 15s infinite ease-in-out;
          transform-origin: 150px 150px;
          will-change: transform;
          backface-visibility: hidden;
        }

        /* StormLogo Glass Mode Overrides and Animations */
        @keyframes storm-glass-shimmer {
          0% {
            transform: translateX(0px) skewX(-25deg);
            opacity: 0;
          }
          8% {
            opacity: 0.7;
          }
          32% {
            transform: translateX(420px) skewX(-25deg);
            opacity: 0.7;
          }
          35%, 100% {
            transform: translateX(420px) skewX(-25deg);
            opacity: 0;
          }
        }

        ${globalStylesPart2}
      `}</style>
  );
};
