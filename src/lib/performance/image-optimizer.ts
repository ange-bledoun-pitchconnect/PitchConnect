/**
 * ============================================================================
 * IMAGE OPTIMIZER - NEXT.JS IMAGE WRAPPER
 * ============================================================================
 * 
 * Optimized image component with:
 * - Automatic format selection (WebP, AVIF)
 * - Lazy loading with blur placeholders
 * - Responsive srcset generation
 * - Dark mode support
 * - Quality optimization
 * - Error handling and fallbacks
 * 
 * Usage:
 * <OptimizedImage
 *   src={playerPhotoUrl}
 *   alt="Player Name"
 *   width={400}
 *   height={400}
 *   quality={80}
 *   sizes="(max-width: 640px) 100vw, 400px"
 * />
 */

'use client';

import Image, { ImageProps } from 'next/image';
import React, { ImgHTMLAttributes, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Image quality (1-100) */
  quality?: number;
  /** Responsive sizes for srcset */
  sizes?: string;
  /** Blur placeholder while loading */
  placeholder?: 'blur' | 'empty';
  /** Base64 encoded blur data URL */
  blurDataURL?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Show skeleton on load */
  showSkeleton?: boolean;
  /** Custom className */
  className?: string;
  /** Container className */
  containerClassName?: string;
  /** Callback on load */
  onLoadComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
  /** Callback on error */
  onLoadError?: (error: Error) => void;
  /** Dark mode image src */
  darkSrc?: string;
  /** Priority loading */
  priority?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default image quality settings */
const IMAGE_QUALITY = {
  DEFAULT: 75,
  HIGH: 90,
  MEDIUM: 75,
  LOW: 50,
  THUMBNAIL: 40,
} as const;

/** Blur placeholder color (matches design system) */
const BLUR_PLACEHOLDER_COLOR = 'rgba(212, 175, 55, 0.1)'; // Gold with opacity

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

export const OptimizedImage = React.forwardRef<
  HTMLImageElement,
  OptimizedImageProps
>(
  (
    {
      src,
      alt,
      width,
      height,
      quality = IMAGE_QUALITY.DEFAULT,
      sizes,
      placeholder = 'empty',
      blurDataURL,
      loading = 'lazy',
      showSkeleton = true,
      className = '',
      containerClassName = '',
      onLoadComplete,
      onLoadError,
      darkSrc,
      priority = false,
      ...props
    },
    ref
  ) => {
    // ========================================================================
    // STATE
    // ========================================================================

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    React.useEffect(() => {
      // Detect dark mode preference
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };

      darkModeQuery.addEventListener('change', handleChange);
      return () => darkModeQuery.removeEventListener('change', handleChange);
    }, []);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleLoadComplete = useCallback(
      (result: { naturalWidth: number; naturalHeight: number }) => {
        setIsLoading(false);
        setError(null);
        onLoadComplete?.(result);
      },
      [onLoadComplete]
    );

    const handleLoadError = useCallback(
      (error: Error) => {
        setIsLoading(false);
        setError(error);
        onLoadError?.(error);

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`Image load error: ${src}`, error);
        }
      },
      [src, onLoadError]
    );

    // ========================================================================
    // SELECT IMAGE SOURCE BASED ON DARK MODE
    // ========================================================================

    const imageSrc = isDarkMode && darkSrc ? darkSrc : src;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
      <div
        className={`
          relative
          overflow-hidden
          rounded-lg
          bg-gray-100 dark:bg-charcoal-800
          transition-colors duration-200
          ${containerClassName}
        `}
        style={{
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {/* LOADING SKELETON */}
        {isLoading && showSkeleton && (
          <div
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-charcoal-700 dark:via-charcoal-600 dark:to-charcoal-700"
            aria-hidden="true"
          />
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-charcoal-800">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400">{alt}</p>
            </div>
          </div>
        )}

        {/* ACTUAL IMAGE */}
        {!error && (
          <Image
            ref={ref}
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            sizes={sizes}
            priority={priority}
            loading={priority ? 'eager' : loading}
            placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : undefined}
            blurDataURL={blurDataURL}
            className={`
              w-full h-full object-cover
              transition-opacity duration-300
              ${isLoading ? 'opacity-0' : 'opacity-100'}
              ${className}
            `}
            onLoadingComplete={handleLoadComplete}
            onError={(error) => {
              handleLoadError(error as unknown as Error);
            }}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// ============================================================================
// IMAGE QUALITY PRESET HELPER
// ============================================================================

/**
 * Get recommended quality for image type
 * @param type - Image type (avatar, thumbnail, card, hero, banner)
 * @returns Recommended quality setting
 */
export function getImageQuality(
  type: 'avatar' | 'thumbnail' | 'card' | 'hero' | 'banner' = 'card'
): number {
  const qualities = {
    avatar: IMAGE_QUALITY.THUMBNAIL,
    thumbnail: IMAGE_QUALITY.LOW,
    card: IMAGE_QUALITY.MEDIUM,
    hero: IMAGE_QUALITY.HIGH,
    banner: IMAGE_QUALITY.HIGH,
  };

  return qualities[type];
}

// ============================================================================
// RESPONSIVE IMAGE WRAPPER
// ============================================================================

interface ResponsiveImageProps extends OptimizedImageProps {
  /** Mobile image width */
  mobileWidth?: number;
  /** Mobile image height */
  mobileHeight?: number;
}

/**
 * Responsive image component that adjusts quality based on viewport
 */
export const ResponsiveImage = React.forwardRef<
  HTMLImageElement,
  ResponsiveImageProps
>(({ mobileWidth, mobileHeight, width, height, quality, ...props }, ref) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const finalWidth = isMobile && mobileWidth ? mobileWidth : width;
  const finalHeight = isMobile && mobileHeight ? mobileHeight : height;
  const finalQuality = isMobile ? IMAGE_QUALITY.MEDIUM : quality;

  return (
    <OptimizedImage
      ref={ref}
      width={finalWidth}
      height={finalHeight}
      quality={finalQuality}
      {...props}
    />
  );
});

ResponsiveImage.displayName = 'ResponsiveImage';

// ============================================================================
// IMAGE CARD COMPONENT - PLAYER CARDS
// ============================================================================

interface ImageCardProps {
  src: string;
  darkSrc?: string;
  alt: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ImageCard({
  src,
  darkSrc,
  alt,
  title,
  subtitle,
  badge,
  onClick,
  href,
  className = '',
}: ImageCardProps) {
  const content = (
    <div className={`overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="relative h-48 sm:h-56 md:h-64">
        <OptimizedImage
          src={src}
          darkSrc={darkSrc}
          alt={alt}
          width={400}
          height={400}
          quality={80}
          sizes="(max-width: 640px) 100vw, 400px"
          className="hover:scale-105 transition-transform duration-300"
        />
        {badge && (
          <div className="absolute top-2 right-2">
            {badge}
          </div>
        )}
      </div>
      <div className="p-4 bg-white dark:bg-charcoal-800">
        <h3 className="font-semibold text-charcoal-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

export default OptimizedImage;
