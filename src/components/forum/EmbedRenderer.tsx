import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Github, Code, Play, Globe } from 'lucide-react';
import { EmbedData } from '@/lib/embed-parser';

interface EmbedRendererProps {
  embed: EmbedData;
}

export function EmbedRenderer({ embed }: EmbedRendererProps) {
  switch (embed.type) {
    case 'youtube':
      return <YouTubeEmbed videoId={embed.id!} url={embed.url} />;
    case 'twitter':
      return <TwitterEmbed url={embed.url} />;
    case 'github':
      return <GitHubEmbed url={embed.url} />;
    case 'codepen':
      return <CodePenEmbed url={embed.url} />;
    case 'link':
      return <LinkPreview url={embed.url} />;
    default:
      return null;
  }
}

// Lazy-loads the embed iframe when visible in viewport
function useLazyLoad() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function EmbedHeader({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-forum-card-alt/30 border-b border-forum-border/20">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] font-mono font-semibold text-forum-text">{label}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-forum-muted hover:text-primary transition-forum"
        title="Open in new tab"
      >
        <ExternalLink size={10} />
      </a>
    </div>
  );
}

function EmbedPlaceholder({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full py-8 bg-forum-bg/40 hover:bg-forum-bg/60 transition-forum group"
    >
      <div className="flex items-center justify-center h-10 w-10  bg-primary/10 group-hover:bg-primary/20 transition-forum">
        <Play size={18} className="text-primary ml-0.5" />
      </div>
      <span className="text-[11px] font-mono text-forum-muted group-hover:text-forum-text transition-forum">
        Click to load {label}
      </span>
    </button>
  );
}

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-presentation';

function YouTubeEmbed({ videoId, url }: { videoId: string; url: string }) {
  const { ref, isVisible } = useLazyLoad();
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={ref} className="my-3  border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <EmbedHeader
        icon={
          <div className="h-4 w-4 rounded bg-red-500 flex items-center justify-center">
            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        }
        label="YouTube Video"
        url={url}
      />
      {isVisible && !loaded && (
        <EmbedPlaceholder onClick={() => setLoaded(true)} label="YouTube video" />
      )}
      {loaded && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
            title="YouTube video player"
            frameBorder="0"
            sandbox={IFRAME_SANDBOX}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
      {!isVisible && (
        <div className="w-full bg-forum-bg/40" style={{ paddingBottom: '56.25%' }} />
      )}
    </div>
  );
}

function TwitterEmbed({ url }: { url: string }) {
  return (
    <div className="my-3  border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <EmbedHeader
        icon={
          <svg className="h-3.5 w-3.5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        }
        label="Twitter/X Post"
        url={url}
      />
      <div className="p-4 text-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[11px] font-mono text-primary hover:text-primary/80 transition-forum"
        >
          <ExternalLink size={12} />
          View Tweet on Twitter/X
        </a>
        <p className="mt-2 text-[9px] font-mono text-forum-muted/60">
          Click to view the full post
        </p>
      </div>
    </div>
  );
}

function GitHubEmbed({ url }: { url: string }) {
  // Parse GitHub URL for richer display
  const parts = url.replace('https://github.com/', '').split('/');
  const owner = parts[0] || '';
  const repo = parts[1] || '';
  const pathType = parts[2]; // 'issues', 'pull', 'blob', etc.
  const pathNum = parts[3];

  let description = `${owner}/${repo}`;
  if (pathType === 'issues' && pathNum) description += ` #${pathNum} (Issue)`;
  else if (pathType === 'pull' && pathNum) description += ` #${pathNum} (PR)`;
  else if (pathType === 'blob') description += ` - File`;
  else if (pathType === 'tree') description += ` - Tree`;

  return (
    <div className="my-3  border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <EmbedHeader
        icon={<Github size={14} className="text-forum-text" />}
        label="GitHub"
        url={url}
      />
      <div className="p-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group"
        >
          <Github size={16} className="text-forum-muted shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-mono text-primary group-hover:text-primary/80 transition-forum font-semibold">
              {description}
            </span>
            <p className="text-[9px] font-mono text-forum-muted/60 truncate">{url}</p>
          </div>
        </a>
      </div>
    </div>
  );
}

function CodePenEmbed({ url }: { url: string }) {
  const { ref, isVisible } = useLazyLoad();
  const [loaded, setLoaded] = useState(false);

  const penMatch = url.match(/codepen\.io\/([^/]+)\/pen\/([^/?\s]+)/);
  const penId = penMatch ? penMatch[2] : null;
  const username = penMatch ? penMatch[1] : null;

  return (
    <div ref={ref} className="my-3  border border-forum-border/40 overflow-hidden bg-forum-bg/50">
      <EmbedHeader
        icon={<Code size={14} className="text-forum-text" />}
        label="CodePen"
        url={url}
      />
      {penId && username ? (
        <>
          {isVisible && !loaded && (
            <EmbedPlaceholder onClick={() => setLoaded(true)} label="CodePen" />
          )}
          {loaded && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://codepen.io/${encodeURIComponent(username)}/embed/${encodeURIComponent(penId)}?default-tab=result`}
                title="CodePen Embed"
                frameBorder="0"
                sandbox={IFRAME_SANDBOX}
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
          {!isVisible && (
            <div className="w-full bg-forum-bg/40" style={{ paddingBottom: '56.25%' }} />
          )}
        </>
      ) : (
        <div className="p-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-primary hover:text-primary/80 transition-forum break-all"
          >
            {url}
          </a>
        </div>
      )}
    </div>
  );
}

function LinkPreview({ url }: { url: string }) {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-2 flex items-center gap-2.5  border border-forum-border/30 bg-forum-bg/40 hover:bg-forum-bg/60 px-3 py-2 transition-forum group"
    >
      <Globe size={14} className="text-forum-muted shrink-0 group-hover:text-primary transition-forum" />
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-mono text-primary group-hover:underline decoration-forum-pink/30 truncate block">
          {hostname}
        </span>
        <span className="text-[9px] font-mono text-forum-muted/50 truncate block">{url}</span>
      </div>
      <ExternalLink size={10} className="text-forum-muted/40 shrink-0 group-hover:text-primary/60 transition-forum" />
    </a>
  );
}
