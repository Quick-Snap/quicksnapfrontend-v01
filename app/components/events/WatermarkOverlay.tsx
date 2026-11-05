'use client';

import React from 'react';

interface WatermarkOverlayProps {
  opacity?: number;
  label?: string;
  className?: string;
}

export function WatermarkOverlay({
  opacity = 0.16,
  label = 'roopixo.com',
  className = '',
}: WatermarkOverlayProps) {
  // SVG background repeating pattern with diagonal text
  const patternSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150" viewBox="0 0 220 150"><text x="30" y="85" fill="white" font-size="19" font-family="sans-serif" font-weight="bold" letter-spacing="2" transform="rotate(-26 30 85)" fill-opacity="0.95">${label}</text></svg>`;

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-20 ${className}`}
      style={{
        opacity,
        backgroundImage: `url('${patternSvg}')`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  );
}

export default WatermarkOverlay;
