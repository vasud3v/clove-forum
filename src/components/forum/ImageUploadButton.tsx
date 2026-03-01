import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X, Loader2, ExternalLink, Video } from 'lucide-react';

interface ImageUploadButtonProps {
  onImageInsert: (markdownImage: string) => void;
  className?: string;
  iconSize?: number;
  mode?: 'image' | 'video' | 'both'; // New prop to specify upload mode
}

// Upload proxy server URL
const UPLOAD_PROXY_URL = 'http://localhost:3001/api/upload-image';

export default function ImageUploadButton({
  onImageInsert,
  className = 'transition-forum rounded p-1.5 text-forum-muted hover:bg-forum-hover hover:text-forum-pink',
  iconSize = 14,
  mode = 'both', // Default to both images and videos
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Determine file accept types based on mode
  const getAcceptTypes = () => {
    if (mode === 'image') return 'image/png,image/jpeg,image/gif,image/webp';
    if (mode === 'video') return 'video/mp4,video/webm,video/mov,video/avi';
    return 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/mov,video/avi';
  };

  // Get button text based on mode
  const getButtonText = () => {
    if (mode === 'image') return 'Upload images';
    if (mode === 'video') return 'Upload videos';
    return 'Insert Image';
  };

  // Get icon based on mode
  const getIcon = () => {
    if (mode === 'video') return Video;
    return ImageIcon;
  };

  const Icon = getIcon();

  const uploadFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    // Validate file type based on mode
    if (mode === 'image' && !isImage) {
      alert('Please select an image file');
      return;
    }
    if (mode === 'video' && !isVideo) {
      alert('Please select a video file');
      return;
    }
    if (mode === 'both' && !isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size
    const maxSize = isVideo ? 500 : 32; // 500MB for videos, 32MB for images (ImgBB)
    if (file.size > maxSize * 1024 * 1024) {
      alert(`${isVideo ? 'Video' : 'Image'} must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData and append the file directly
      const formData = new FormData();
      formData.append('image', file);

      // Upload via proxy server
      const response = await fetch(UPLOAD_PROXY_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Get the file URL from response
      const fileUrl = result.url;
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      
      // Insert appropriate markdown based on file type
      if (isVideo) {
        // For videos, use HTML5 video tag with src directly on video element (not nested source)
        onImageInsert(`\n<video src="${fileUrl}" type="${file.type}" controls width="100%" style="max-width: 800px;"></video>\n`);
      } else {
        // For images, use markdown image syntax
        onImageInsert(`\n![${altText}](${fileUrl})\n`);
      }
      
      setShowDropdown(false);
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert(error.message || 'Failed to upload file. Make sure the upload server is running (npm run dev).');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleUrlInsert = () => {
    if (!urlInput.trim()) return;
    onImageInsert(`\n![image](${urlInput.trim()})\n`);
    setUrlInput('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Render as full button for image/video modes, icon button for 'both' mode */}
      {mode === 'image' || mode === 'video' ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Icon size={16} />
          )}
          {isUploading ? 'Uploading...' : getButtonText()}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={className}
          title="Insert Image"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <Icon size={iconSize} />
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Dropdown menu - only show for 'both' mode */}
      {showDropdown && mode === 'both' && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 hud-panel w-[280px] max-w-[calc(100vw-2rem)] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-forum-text uppercase tracking-wider">
                Insert Image
              </span>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-forum-muted hover:text-forum-text transition-forum"
              >
                <X size={12} />
              </button>
            </div>

            {/* Upload from file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="transition-forum w-full flex items-center gap-2 rounded-md border border-dashed border-forum-border/50 bg-forum-bg/50 px-3 py-3 text-[10px] font-mono text-forum-muted hover:border-forum-pink/40 hover:text-forum-pink hover:bg-forum-pink/[0.03] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={14} className="text-forum-muted group-hover:text-forum-pink transition-forum" />
              <div className="text-left">
                <div className="font-semibold">
                  {isUploading ? 'Uploading...' : 'Upload from device'}
                </div>
                <div className="text-[8px] text-forum-muted/60">
                  Images (32MB) · Videos (500MB)
                </div>
              </div>
            </button>

            {/* Insert from URL */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-forum-muted flex items-center gap-1">
                <ExternalLink size={9} />
                Or paste image URL
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
                  placeholder="https://example.com/image.png"
                  className="flex-1 rounded border border-forum-border/40 bg-forum-bg px-2.5 py-1.5 text-[10px] font-mono text-forum-text placeholder:text-forum-muted/40 outline-none focus:border-forum-pink/40 focus:ring-1 focus:ring-forum-pink/20 transition-forum"
                />
                <button
                  onClick={handleUrlInsert}
                  disabled={!urlInput.trim()}
                  className="transition-forum rounded bg-forum-pink/15 border border-forum-pink/30 px-2.5 py-1.5 text-[9px] font-mono font-semibold text-forum-pink hover:bg-forum-pink/25 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
