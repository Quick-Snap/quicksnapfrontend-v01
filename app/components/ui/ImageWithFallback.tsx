'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  fill = false
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(''); // Clear src to show fallback
    }
  };

  if (hasError || !imgSrc) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover"
          onError={handleError}
          unoptimized
        />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      onError={handleError}
      unoptimized
    />
  );
}

