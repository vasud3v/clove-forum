import { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipForward, 
  SkipBack,
  Settings,
  Download,
  Loader2
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  type?: string;
}

export default function VideoPlayer({ src, type = 'video/mp4' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  let hideControlsTimeout: NodeJS.Timeout;

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume, isMuted]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && !isHovering && !showSettings) {
      hideControlsTimeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(hideControlsTimeout);
  }, [isPlaying, isHovering, showSettings]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  }, []);

  const changeVolume = useCallback((delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, [volume]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }, [currentTime, duration]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  }, []);

  const downloadVideo = useCallback(() => {
    const a = document.createElement('a');
    a.href = src;
    a.download = src.split('/').pop() || 'video.mp4';
    a.click();
  }, [src]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="my-3  border border-red-500/30 bg-red-500/10 p-4 max-w-[400px]">
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="video-player-container my-3  overflow-hidden border border-forum-border bg-black max-w-[400px] relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
    >
      <div className="relative group">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black cursor-pointer"
          onClick={togglePlay}
          playsInline
        >
          <source src={src} type={type} />
          Your browser does not support the video tag.
        </video>

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        )}

        {/* Play overlay */}
        {!isPlaying && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
            onClick={togglePlay}
          >
            <div className="w-12 h-12  bg-primary/90 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all">
              <Play size={24} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-background via-black/80 to-transparent p-2 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress bar */}
          <div 
            ref={progressBarRef}
            className="w-full h-1.5 mb-2 bg-white/20  cursor-pointer relative group/progress"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div 
              className="absolute h-full bg-white/30 "
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div 
              className="absolute h-full bg-primary "
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Hover thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary  opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-6px' }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-forum p-1"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Skip back */}
            <button
              onClick={() => skip(-10)}
              className="text-white hover:text-primary transition-forum p-1"
              title="Skip back 10s (←)"
            >
              <SkipBack size={14} />
            </button>

            {/* Skip forward */}
            <button
              onClick={() => skip(10)}
              className="text-white hover:text-primary transition-forum p-1"
              title="Skip forward 10s (→)"
            >
              <SkipForward size={14} />
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-primary transition-forum p-1"
              title="Mute (M)"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-12 h-1 bg-white/20  appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]: [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-primary"
              title="Volume (↑↓)"
            />

            {/* Time */}
            <span className="text-white text-[9px] font-mono whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-primary transition-forum p-1"
                title="Settings"
              >
                <Settings size={16} />
              </button>

              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSettings(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 bg-forum-card border border-forum-border  p-2 min-w-[120px] z-20">
                    <div className="text-[9px] font-mono text-forum-muted uppercase mb-1">Speed</div>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left px-2 py-1 text-[10px] font-mono rounded transition-forum ${
                          playbackRate === rate 
                            ? 'bg-primary/20 text-primary' 
                            : 'text-forum-text hover:bg-forum-hover'
                        }`}
                      >
                        {rate}x {rate === 1 && '(Normal)'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Download */}
            <button
              onClick={downloadVideo}
              className="text-white hover:text-primary transition-forum p-1"
              title="Download"
            >
              <Download size={16} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-forum p-1"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
