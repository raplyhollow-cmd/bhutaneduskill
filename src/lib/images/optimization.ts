/**
 * IMAGE OPTIMIZATION UTILITIES
 *
 * Next.js Image optimization helpers
 */

import { ImageProps } from "next/image";

// Optimized image sizes for different contexts
export const IMAGE_SIZES = {
  avatar: { width: 64, height: 64 },
  thumbnail: { width: 200, height: 200 },
  card: { width: 400, height: 300 },
  banner: { width: 1200, height: 400 },
  hero: { width: 1920, height: 1080 },
} as const;

// Quality settings for different contexts
export const IMAGE_QUALITY = {
  low: 50,    // Thumbnails, previews
  medium: 75, // Standard images
  high: 85,   // High-quality photos
  ultra: 95,  // Professional photography
} as const;

// Default props for optimized images
export function getDefaultImageProps(
  context: keyof typeof IMAGE_SIZES = "card"
): Partial<ImageProps> {
  const size = IMAGE_SIZES[context];
  return {
    width: size.width,
    height: size.height,
    quality: IMAGE_QUALITY.medium,
    loading: "lazy",
    placeholder: "blur",
    blurDataURL: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=",
  };
}

// Generate blur placeholder
export function generateBlurDataURL(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Responsive image sizes
export function getResponsiveSizes(
  mobile: number,
  tablet: number,
  desktop: number
): string {
  return `(max-width: 640px) ${mobile}px, (max-width: 1024px) ${tablet}px, ${desktop}px`;
}

// Image format priorities (WebP > AVIF > JPEG/PNG)
export const IMAGE_FORMATS = ["image/avif", "image/webp"] as const;

// Lazy load images below fold
export function shouldLazyLoad(index: number, foldThreshold = 3): boolean {
  return index >= foldThreshold;
}
