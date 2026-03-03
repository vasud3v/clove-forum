import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates URLs/paths to support:
 * - Full URLs (http://, https://)
 * - Absolute paths (/path/to/resource)
 * - Relative paths (path/to/resource)
 * - Data URLs (data:image/...)
 * 
 * @param url - URL or path to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrlOrPath(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  
  // Full URLs (http/https)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  
  // Data URLs
  if (trimmed.startsWith('data:')) {
    return true;
  }
  
  // Absolute paths
  if (trimmed.startsWith('/')) {
    return true;
  }
  
  // Relative paths (must contain a file extension)
  if (trimmed.match(/^[a-zA-Z0-9._/-]+\.(svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|avi|ogg)$/i)) {
    return true;
  }
  
  return false;
}

/**
 * Validates if a path is a relative path (not a full URL)
 */
export function isRelativePath(path: string | undefined): boolean {
  if (!path || typeof path !== 'string') return false;
  
  const trimmed = path.trim();
  // Is not a full URL and is not a data URL
  return !trimmed.startsWith('http://') && 
         !trimmed.startsWith('https://') && 
         !trimmed.startsWith('data:') &&
         (trimmed.startsWith('/') || trimmed.includes('/') || trimmed.match(/\.[a-zA-Z0-9]+$/));
}
