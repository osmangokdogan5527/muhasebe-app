import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  value: string;
  size: number;
  className?: string;
}

export function QrCodeImage({ value, size, className = '' }: QrCodeImageProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2, // Generate higher resolution for sharpness
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => {
        if (active) setQrUrl(url);
      })
      .catch(err => {
        console.error('QR code generation error:', err);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!qrUrl) {
    return (
      <div 
        style={{ width: `${size}px`, height: `${size}px` }} 
        className={`bg-slate-100 animate-pulse rounded flex items-center justify-center text-[8px] text-slate-400 ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <img 
      src={qrUrl} 
      alt="QR Code" 
      className={className}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        display: 'block',
        imageRendering: 'pixelated'
      }} 
      referrerPolicy="no-referrer"
    />
  );
}
