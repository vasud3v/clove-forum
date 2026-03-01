/**
 * Avatar utility functions
 * Generates avatar URLs for users who haven't uploaded a custom avatar
 */

export type AvatarStyle = 'initials' | 'dicebear' | 'boring-avatars';

// Avatar cache to prevent duplicate API calls and reduce network load
const avatarCache = new Map<string, string>();

// Clear cache after 1 hour to allow for avatar updates
if (typeof window !== 'undefined') {
  setInterval(() => {
    avatarCache.clear();
  }, 60 * 60 * 1000);
}

/**
 * Check if a URL is from Unsplash (default placeholder)
 */
export function isDefaultAvatar(avatarUrl: string): boolean {
  return avatarUrl.includes('unsplash.com') || 
         avatarUrl.includes('images.unsplash') ||
         avatarUrl.includes('dicebear.com');
}

/**
 * Generate an avatar URL based on username
 * Uses DiceBear API for consistent, deterministic avatars
 * Results are cached to reduce API calls
 */
export function generateAvatar(username: string, style: AvatarStyle = 'dicebear'): string {
  const cacheKey = `${username}-${style}`;
  
  // Check cache first
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }
  
  const seed = encodeURIComponent(username);
  let url: string;
  
  switch (style) {
    case 'initials':
      // UI Avatars - shows initials
      const initials = username
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      url = `https://ui-avatars.com/api/?name=${seed}&background=ff2d92&color=fff&size=48&bold=true&format=svg`;
      break;
    
    case 'dicebear':
      // DiceBear - fun, consistent avatars (optimized size)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=1a1a1a&size=48`;
      break;
    
    case 'boring-avatars':
      // Boring Avatars - geometric patterns (optimized size)
      url = `https://source.boringavatars.com/beam/48/${seed}?colors=ff2d92,1a1a1a,2d2d2d,ff6bb5,ff9ec9`;
      break;
    
    default:
      return generateAvatar(username, 'dicebear');
  }
  
  // Cache the result
  avatarCache.set(cacheKey, url);
  return url;
}

/**
 * Get the appropriate avatar URL for a user
 * Returns custom avatar if set, otherwise generates one
 */
export function getUserAvatar(avatarUrl: string, username: string, style: AvatarStyle = 'dicebear'): string {
  // If it's a data URL (uploaded image), use it directly
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    return avatarUrl;
  }
  
  // If no avatar URL or it's a default placeholder, generate one
  if (!avatarUrl || isDefaultAvatar(avatarUrl)) {
    return generateAvatar(username, style);
  }
  
  return avatarUrl;
}

/**
 * Get avatar style from user preferences or default
 */
export function getAvatarStyle(): AvatarStyle {
  // Could be extended to read from user preferences
  return 'dicebear';
}
