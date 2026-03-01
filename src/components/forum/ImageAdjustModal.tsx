import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  type: 'avatar' | 'banner';
  onSave: (adjustedImageUrl: string) => void;
}

export default function ImageAdjustModal({ isOpen, onClose, imageUrl, type, onSave }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const isAvatar = type === 'avatar';
  const containerWidth = isAvatar ? 400 : 600;
  const containerHeight = isAvatar ? 400 : 300;

  // Reset state when modal opens with new image
  useEffect(() => {
    if (!isOpen) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      // Calculate initial scale to fit image in container
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const initialScale = Math.max(scaleX, scaleY);
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load image');
      setImageLoaded(false);
    };
    img.src = imageUrl;
  }, [imageUrl, isOpen, containerWidth, containerHeight]);

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1));
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on type
    const outputWidth = isAvatar ? 400 : 1200;
    const outputHeight = isAvatar ? 400 : 400;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Clear canvas
    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Calculate the scale ratio between output and preview
    const scaleRatio = outputWidth / containerWidth;

    // Calculate scaled dimensions in preview
    const previewScaledWidth = imageRef.current.width * scale;
    const previewScaledHeight = imageRef.current.height * scale;

    // Calculate the position in preview (center + offset)
    const previewX = containerWidth / 2 + position.x;
    const previewY = containerHeight / 2 + position.y;

    // Convert to output coordinates
    const outputX = previewX * scaleRatio;
    const outputY = previewY * scaleRatio;
    const outputScaledWidth = previewScaledWidth * scaleRatio;
    const outputScaledHeight = previewScaledHeight * scaleRatio;

    // Draw the image centered at the calculated position
    ctx.drawImage(
      imageRef.current,
      outputX - outputScaledWidth / 2,
      outputY - outputScaledHeight / 2,
      outputScaledWidth,
      outputScaledHeight
    );

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative hud-panel w-full max-w-4xl">
        {/* Header */}
        <div className="border-b border-forum-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-[14px] font-mono font-bold text-forum-text">
            Adjust {isAvatar ? 'Avatar' : 'Banner'}
          </h2>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Preview Container */}
          <div className="mb-4 flex justify-center">
            <div
              ref={containerRef}
              className={`relative overflow-hidden bg-forum-bg border-2 border-forum-pink/30 cursor-move ${
                isAvatar ? 'rounded-lg' : 'rounded'
              }`}
              style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
              }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              {imageLoaded && imageRef.current && (
                <img
                  src={imageUrl}
                  alt="Adjust"
                  className="absolute pointer-events-none select-none"
                  style={{
                    width: `${imageRef.current.width * scale}px`,
                    height: `${imageRef.current.height * scale}px`,
                    left: `${containerWidth / 2 + position.x}px`,
                    top: `${containerHeight / 2 + position.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  draggable={false}
                />
              )}

              {/* Loading indicator */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forum-pink"></div>
                </div>
              )}

              {/* Overlay hint */}
              {!isDragging && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded text-[10px] font-mono text-white">
                    Drag to reposition • Scroll to zoom
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={handleZoomOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-forum-bg border border-forum-border text-[11px] font-mono text-forum-text hover:bg-forum-hover transition-forum"
            >
              <ZoomOut size={14} />
              Zoom Out
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded bg-forum-bg border border-forum-border">
              <span className="text-[10px] font-mono text-forum-muted">Zoom:</span>
              <span className="text-[11px] font-mono text-forum-text font-bold">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <button
              onClick={handleZoomIn}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-forum-bg border border-forum-border text-[11px] font-mono text-forum-text hover:bg-forum-hover transition-forum"
            >
              <ZoomIn size={14} />
              Zoom In
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="mb-6">
            <input
              type="range"
              min="50"
              max="300"
              value={scale * 100}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="w-full h-2 bg-forum-bg rounded-lg appearance-none cursor-pointer accent-forum-pink"
            />
          </div>

          {/* Info */}
          <div className="bg-forum-pink/5 border border-forum-pink/20 rounded-md p-3 mb-4">
            <div className="text-[9px] font-mono text-forum-muted leading-relaxed">
              <p className="text-forum-pink font-bold mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Click and drag to reposition the image</li>
                <li>Use mouse wheel or buttons to zoom in/out</li>
                <li>The preview shows how your {isAvatar ? 'avatar' : 'banner'} will look</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!imageLoaded}
              className="flex-1 transition-forum flex items-center justify-center gap-2 rounded-md bg-forum-pink px-4 py-2.5 text-[11px] font-mono font-bold text-white hover:bg-forum-pink/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={12} />
              Apply Changes
            </button>
            <button
              onClick={onClose}
              className="transition-forum rounded-md border border-forum-border px-4 py-2.5 text-[11px] font-mono text-forum-muted hover:text-forum-text hover:bg-forum-hover"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
