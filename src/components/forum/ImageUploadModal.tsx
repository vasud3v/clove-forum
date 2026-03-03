import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Crop, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (url: string) => void;
  title?: string;
  aspectRatio?: 'square' | 'banner'; // square = 1:1, banner = 16:9 or 2:1
  maxSizeMB?: number;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageSelected,
  title = 'Upload Image',
  aspectRatio = 'square',
  maxSizeMB = 2,
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      console.log('[ImageUploadModal] Starting upload...');
      console.log('[ImageUploadModal] File:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `topic-icons/${fileName}`;

      console.log('[ImageUploadModal] Upload path:', filePath);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('forum-assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[ImageUploadModal] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[ImageUploadModal] Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('forum-assets')
        .getPublicUrl(filePath);

      console.log('[ImageUploadModal] Public URL:', publicUrl);

      // Show success message
      console.log('[ImageUploadModal] Upload complete!');
      
      onImageSelected(publicUrl);
      handleClose();
    } catch (err: any) {
      console.error('[ImageUploadModal] Upload failed:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload image';
      
      if (err.message?.includes('JWT')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (err.message?.includes('not found')) {
        errorMessage = 'Storage bucket not found. Please contact admin.';
      } else if (err.message?.includes('permission')) {
        errorMessage = 'Permission denied. You may not have upload rights.';
      } else if (err.message?.includes('size')) {
        errorMessage = 'File is too large. Maximum size is 5MB.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    onClose();
  };

  const dimensions = aspectRatio === 'square' 
    ? { width: 'w-64', height: 'h-64', aspect: 'aspect-square' }
    : { width: 'w-96', height: 'h-32', aspect: 'aspect-[3/1]' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 ">
      <div className="relative w-full max-w-lg mx-4 bg-forum-card border border-forum-border  shadow-brutal-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-forum-border">
          <h2 className="text-[14px] font-bold text-forum-text font-mono">{title}</h2>
          <button
            onClick={handleClose}
            className="p-1  text-forum-muted hover:text-primary hover:bg-forum-hover transition-forum"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Upload Area */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`${dimensions.width} ${dimensions.height} mx-auto border-2 border-dashed border-forum-border  flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-forum-hover/30 transition-forum`}
            >
              <Upload size={32} className="text-forum-muted mb-2" />
              <p className="text-[12px] text-forum-text font-medium mb-1">Click to upload</p>
              <p className="text-[10px] text-forum-muted">
                {aspectRatio === 'square' ? 'Square image (1:1)' : 'Banner image (3:1)'}
              </p>
              <p className="text-[10px] text-forum-muted mt-1">
                Max {maxSizeMB}MB • PNG, JPG, GIF, WebP
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className={`${dimensions.width} ${dimensions.height} mx-auto  overflow-hidden border border-forum-border`}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Change Image Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2  text-[11px] font-medium text-forum-muted border border-forum-border hover:border-primary/30 hover:text-primary transition-forum"
              >
                <ImageIcon size={14} className="inline mr-2" />
                Change Image
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2  bg-red-500/10 border border-red-500/30 text-[11px] text-red-400">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="px-4 py-3  bg-forum-bg border border-forum-border/50">
            <p className="text-[10px] text-forum-muted leading-relaxed">
              <strong className="text-forum-text">Tip:</strong> For best results, use images with{' '}
              {aspectRatio === 'square' ? 'equal width and height (e.g., 512x512px)' : 'a 3:1 ratio (e.g., 768x256px or 1200x400px)'}.
              The image will be displayed as a banner next to the topic/thread name.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-forum-border">
          <button
            onClick={handleClose}
            className="px-4 py-2  text-[11px] font-medium text-forum-muted hover:text-forum-text hover:bg-forum-hover transition-forum"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2  text-[11px] font-medium text-white bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-forum flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white  animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check size={14} />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
