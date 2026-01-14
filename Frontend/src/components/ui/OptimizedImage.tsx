'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  placeholder = '/placeholder-product.jpg',
  fallbackSrc = '/placeholder-product.jpg',
  onError,
  onLoad,
}: OptimizedImageProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setImageLoading(true);
      setImageError(false);
    }
  }, [src, currentSrc]);

  const handleLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageLoading(false);
    
    // Try fallback image if current src is not already fallback
    if (currentSrc !== fallbackSrc && !currentSrc.includes(fallbackSrc)) {
      setCurrentSrc(fallbackSrc);
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageError(true);
      onError?.();
    }
  }, [currentSrc, fallbackSrc, onError]);

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string) => {
    if (!imagePath) return fallbackSrc;
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const fullSrc = getFullImageUrl(currentSrc);

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">Image unavailable</span>
        </div>
      )}

      {!imageError && (
        <Image
          src={fullSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={`object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          sizes={fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined}
          unoptimized={fullSrc.includes('cloudinary.com')} // Cloudinary handles optimization
        />
      )}
    </div>
  );
}
