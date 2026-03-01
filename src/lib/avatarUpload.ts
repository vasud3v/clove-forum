/**
 * Avatar Upload Utilities
 * Handles uploading avatars to ImgBB (permanent storage)
 */

import { supabase } from './supabase';

// ImgBB API Key - Get from https://api.imgbb.com/
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

/**
 * Upload image to ImgBB
 * @param file - Image file or base64 data URL
 * @param name - Image name
 * @returns ImgBB image URL
 */
export async function uploadToImgBB(file: File | string, name: string): Promise<string> {
  try {
    let base64Image: string;

    // Convert to base64 if it's a File
    if (file instanceof File) {
      base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (data:image/png;base64,)
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else if (file.startsWith('data:')) {
      // Already a data URL, extract base64 part
      base64Image = file.split(',')[1];
    } else {
      throw new Error('Invalid file format');
    }

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('name', name);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Upload failed');
    }

    // Return the permanent URL
    return data.data.url;
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
}

/**
 * Upload avatar to ImgBB
 * @param userId - User ID
 * @param file - Image file or base64 data URL
 * @param type - 'avatar' or 'banner'
 * @returns Public URL of uploaded image
 */
export async function uploadAvatar(
  userId: string,
  file: File | string,
  type: 'avatar' | 'banner'
): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key not configured. Please set VITE_IMGBB_API_KEY in .env.local');
  }

  try {
    // Generate unique name
    const timestamp = Date.now();
    const imageName = `${userId}-${type}-${timestamp}`;

    // Upload to ImgBB
    const imageUrl = await uploadToImgBB(file, imageName);

    return imageUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Delete avatar (ImgBB doesn't support deletion via API for free tier)
 * @param userId - User ID
 * @param type - 'avatar' or 'banner'
 */
export async function deleteAvatar(
  userId: string,
  type: 'avatar' | 'banner'
): Promise<void> {
  // Note: ImgBB free tier doesn't support deletion via API
  // Images are permanent unless deleted manually from dashboard
  console.log(`Note: ImgBB images are permanent. Old ${type} will remain accessible.`);
}

/**
 * Check if URL is a base64 data URL
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Migrate base64 avatar to ImgBB
 * Call this when you detect a data URL avatar
 */
export async function migrateDataUrlToStorage(
  userId: string,
  dataUrl: string,
  type: 'avatar' | 'banner'
): Promise<string> {
  if (!isDataUrl(dataUrl)) {
    return dataUrl; // Already a URL, no migration needed
  }

  try {
    const publicUrl = await uploadAvatar(userId, dataUrl, type);
    
    // Update database
    await supabase
      .from('forum_users')
      .update({ [type]: publicUrl })
      .eq('id', userId);

    return publicUrl;
  } catch (error) {
    console.error('Error migrating data URL to ImgBB:', error);
    return dataUrl; // Return original on error
  }
}
