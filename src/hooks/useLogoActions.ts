import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StormLogo } from '../constants';

export function useLogoActions(
  activeLogoTheme: string,
  activeTheme: string,
  sidebarPattern: string,
  sidebarPatternOpacity: number,
  designStyle: string,
  sidebarBg: string
) {
  const handleDownloadLogoSvg = () => {
    const rawSvg = renderToStaticMarkup(
      React.createElement(StormLogo, {
        logoTheme: activeLogoTheme,
        theme: activeTheme,
        sidebarPattern: sidebarPattern,
        sidebarPatternOpacity: sidebarPatternOpacity,
        designStyle: designStyle,
        width: "512",
        height: "512",
        downloadMode: true,
        sidebarBg: sidebarBg,
        onlySvg: true
      })
    );
    
    let svgContent = rawSvg;
    if (!svgContent.includes('xmlns=')) {
      svgContent = svgContent.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storm-muhasebe-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogoPng = () => {
    const rawSvg = renderToStaticMarkup(
      React.createElement(StormLogo, {
        logoTheme: activeLogoTheme,
        theme: activeTheme,
        sidebarPattern: sidebarPattern,
        sidebarPatternOpacity: sidebarPatternOpacity,
        designStyle: designStyle,
        width: "512",
        height: "512",
        downloadMode: true,
        sidebarBg: sidebarBg,
        onlySvg: true
      })
    );
    
    let svgContent = rawSvg;
    if (!svgContent.includes('xmlns=')) {
      svgContent = svgContent.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'storm-muhasebe-logo.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error("Canvas toDataURL failed:", err);
        }
      }
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.error("Image loading failed with Blob URL. Trying base64 data URL fallback.");
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      
      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
          try {
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'storm-muhasebe-logo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (err) {
            console.error("Canvas toDataURL fallback failed:", err);
          }
        }
      };
      
      img.onerror = (e) => {
        console.error("Fallback image load failed as well:", e);
      };

      img.src = 'data:image/svg+xml;base64,' + base64Svg;
    };

    img.src = url;
  };

  return {
    handleDownloadLogoSvg,
    handleDownloadLogoPng
  };
}
