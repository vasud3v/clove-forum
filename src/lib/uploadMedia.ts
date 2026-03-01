/**
 * Universal Media Upload Utility
 * Uploads images to ImgBB and videos to Catbox.moe directly from the browser.
 * No proxy server needed — works on static hosting (GitHub Pages, Vercel, etc.)
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '9058482f589223f475eb9deace55a70f';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const CATBOX_UPLOAD_URL = 'https://catbox.moe/user/api.php';

export interface UploadResult {
    success: boolean;
    url: string;
    type: 'image' | 'video';
    host: 'imgbb' | 'catbox';
    error?: string;
}

/**
 * Convert a File to base64 string (without the data URL prefix)
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove "data:...;base64," prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Upload an image to ImgBB (permanent, free, no CORS issues)
 */
async function uploadImageToImgBB(file: File): Promise<UploadResult> {
    const base64Data = await fileToBase64(file);

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    formData.append('name', file.name.split('.')[0]);

    const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Image upload to ImgBB failed');
    }

    return {
        success: true,
        url: result.data.url,
        type: 'image',
        host: 'imgbb',
    };
}

/**
 * Upload a video to Catbox.moe (free, instant playback)
 * Note: Catbox doesn't have CORS restrictions for uploads
 */
async function uploadVideoToCatbox(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file, file.name);

    const response = await fetch(CATBOX_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    const resultText = await response.text();

    if (!response.ok || !resultText.startsWith('https://')) {
        throw new Error('Video upload to Catbox failed');
    }

    return {
        success: true,
        url: resultText.trim(),
        type: 'video',
        host: 'catbox',
    };
}

/**
 * Upload any media file (auto-detects image vs video)
 * @param file - The file to upload
 * @returns Upload result with the public URL
 */
export async function uploadMedia(file: File): Promise<UploadResult> {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
        throw new Error('Unsupported file type. Please upload an image or video.');
    }

    if (isVideo) {
        return uploadVideoToCatbox(file);
    } else {
        return uploadImageToImgBB(file);
    }
}

/**
 * Upload an image file and return just the URL (convenience wrapper)
 */
export async function uploadImageFile(file: File): Promise<string> {
    const result = await uploadImageToImgBB(file);
    return result.url;
}
