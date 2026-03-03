import { useState, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { EmbedRenderer } from './EmbedRenderer';
import VideoPlayer from './VideoPlayer';
import { parseEmbeddableUrl, isStandaloneUrl } from '@/lib/embed-parser';
import { Code, EyeOff, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface PostContentRendererProps {
  content: string;
}

// Splits content into segments: plain text, spoiler blocks, and standalone embed URLs.
// This pre-processing is needed because [spoiler] tags and auto-embeds are custom
// syntax that react-markdown doesn't handle natively.
interface Segment {
  type: 'markdown' | 'spoiler' | 'embed' | 'video';
  content: string;
}

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  
  // First, extract video tags
  const videoRegex = /<video[^>]*>[\s\S]*?<\/video>/gi;
  let videoMatches: { index: number; content: string; src: string; type: string }[] = [];
  let match;
  
  while ((match = videoRegex.exec(content)) !== null) {
    const videoHtml = match[0];
    const srcMatch = videoHtml.match(/src="([^"]+)"/);
    const typeMatch = videoHtml.match(/type="([^"]+)"/);
    if (srcMatch) {
      videoMatches.push({
        index: match.index,
        content: videoHtml,
        src: srcMatch[1],
        type: typeMatch ? typeMatch[1] : 'video/mp4'
      });
    }
  }
  
  // Split on spoiler tags first
  const spoilerRegex = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
  let lastIndex = 0;

  while ((match = spoilerRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'spoiler', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  // Now split markdown segments to extract videos and standalone embed URLs
  const expanded: Segment[] = [];
  for (const seg of segments) {
    if (seg.type !== 'markdown') {
      expanded.push(seg);
      continue;
    }

    let currentContent = seg.content;
    let currentIndex = 0;
    
    // Extract videos from this segment
    for (const video of videoMatches) {
      const relativeIndex = video.index - (content.length - seg.content.length);
      if (relativeIndex >= 0 && relativeIndex < seg.content.length) {
        // Add content before video
        if (relativeIndex > currentIndex) {
          const beforeContent = currentContent.slice(currentIndex, relativeIndex);
          if (beforeContent.trim()) {
            expanded.push({ type: 'markdown', content: beforeContent });
          }
        }
        // Add video segment
        expanded.push({ type: 'video', content: `${video.src}|${video.type}` });
        currentIndex = relativeIndex + video.content.length;
      }
    }
    
    // Add remaining content
    if (currentIndex < currentContent.length) {
      const remaining = currentContent.slice(currentIndex);
      
      // Check for standalone URLs in remaining content
      const lines = remaining.split('\n');
      let mdBuffer: string[] = [];

      const flushBuffer = () => {
        if (mdBuffer.length > 0) {
          expanded.push({ type: 'markdown', content: mdBuffer.join('\n') });
          mdBuffer = [];
        }
      };

      for (const line of lines) {
        if (isStandaloneUrl(line)) {
          const embedData = parseEmbeddableUrl(line.trim());
          if (embedData && embedData.type !== 'link') {
            flushBuffer();
            expanded.push({ type: 'embed', content: line.trim() });
            continue;
          }
        }
        mdBuffer.push(line);
      }
      flushBuffer();
    }
  }

  return expanded;
}

// Code block wrapper with language label and copy button
function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || '';

  const handleCopy = async () => {
    const text = extractText(children);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Still show copied state even if it failed
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3  border border-forum-border/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-forum-bg border-b border-forum-border/30">
        <span className="text-[8px] font-mono uppercase tracking-wider text-forum-muted">
          {lang || 'code'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-forum-muted/50 hover:text-primary transition-forum text-[9px] font-mono"
          >
            {copied ? <Check size={10} className="text-white" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <Code size={10} className="text-forum-muted/50" />
        </div>
      </div>
      <pre className="px-3 py-3 bg-forum-bg/80 overflow-x-auto !m-0 !rounded-none">
        <code className={`text-[11px] font-mono ${className || ''}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as any).props.children);
  }
  return '';
}

// Expandable Blockquote component
function ExpandableBlockquote({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useState<HTMLDivElement | null>(null)[0];
  
  // Check if content is long enough to need expansion
  const textContent = extractText(children);
  const isLong = textContent.length > 300; // More than 300 characters
  
  if (!isLong) {
    return (
      <blockquote className="my-2 pl-3 border-l-2 border-primary/40 text-forum-text/70 italic">
        {children}
      </blockquote>
    );
  }
  
  return (
    <blockquote className="my-2 pl-3 border-l-2 border-primary/40 text-forum-text/70 italic relative">
      <div className={`${isExpanded ? '' : 'max-h-[100px] overflow-hidden relative'}`}>
        {children}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-forum-bg to-transparent" />
        )}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp size={12} />
            Click to collapse...
          </>
        ) : (
          <>
            <ChevronDown size={12} />
            Click to expand...
          </>
        )}
      </button>
    </blockquote>
  );
}

// Spoiler block component
function SpoilerBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  // Parse spoiler content for videos and embeds
  const spoilerSegments = useMemo(() => {
    const segments: Segment[] = [];
    
    // Extract video tags from spoiler content
    const videoRegex = /<video[^>]*>[\s\S]*?<\/video>/gi;
    let videoMatches: { index: number; content: string; src: string; type: string }[] = [];
    let match;
    
    while ((match = videoRegex.exec(content)) !== null) {
      const videoHtml = match[0];
      const srcMatch = videoHtml.match(/src="([^"]+)"/);
      const typeMatch = videoHtml.match(/type="([^"]+)"/);
      if (srcMatch) {
        videoMatches.push({
          index: match.index,
          content: videoHtml,
          src: srcMatch[1],
          type: typeMatch ? typeMatch[1] : 'video/mp4'
        });
      }
    }
    
    if (videoMatches.length === 0) {
      // No videos, check for embeds
      const lines = content.split('\n');
      let mdBuffer: string[] = [];

      for (const line of lines) {
        if (isStandaloneUrl(line)) {
          const embedData = parseEmbeddableUrl(line.trim());
          if (embedData && embedData.type !== 'link') {
            if (mdBuffer.length > 0) {
              segments.push({ type: 'markdown', content: mdBuffer.join('\n') });
              mdBuffer = [];
            }
            segments.push({ type: 'embed', content: line.trim() });
            continue;
          }
        }
        mdBuffer.push(line);
      }
      
      if (mdBuffer.length > 0) {
        segments.push({ type: 'markdown', content: mdBuffer.join('\n') });
      }
      
      return segments;
    }
    
    // Process content with videos
    let lastIndex = 0;
    
    // Sort videos by index
    videoMatches.sort((a, b) => a.index - b.index);
    
    for (const video of videoMatches) {
      // Add content before video
      if (video.index > lastIndex) {
        const beforeContent = content.slice(lastIndex, video.index);
        if (beforeContent.trim()) {
          segments.push({ type: 'markdown', content: beforeContent });
        }
      }
      // Add video segment
      segments.push({ type: 'video', content: `${video.src}|${video.type}` });
      lastIndex = video.index + video.content.length;
    }
    
    // Add remaining content
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      if (remaining.trim()) {
        segments.push({ type: 'markdown', content: remaining });
      }
    }
    
    return segments;
  }, [content]);

  return (
    <span className="inline-block my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="transition-forum flex items-center gap-1.5 text-[10px] font-mono font-semibold text-primary/80 hover:text-primary bg-primary/[0.04] hover:bg-primary/[0.08] border border-primary/15 hover:border-primary/30  px-2.5 py-1.5"
      >
        <EyeOff size={10} />
        {expanded ? 'Hide Spoiler' : 'Show Spoiler'}
      </button>
      {expanded && (
        <div className="mt-1.5 px-3 py-2 bg-forum-bg/60 border border-forum-border/30  text-forum-text/80 animate-in fade-in duration-200">
          {spoilerSegments.map((seg, i) => {
            switch (seg.type) {
              case 'video': {
                const [src, type] = seg.content.split('|');
                return <VideoPlayer key={i} src={src} type={type} />;
              }
              case 'embed': {
                const embedData = parseEmbeddableUrl(seg.content);
                if (embedData && embedData.type !== 'link') {
                  return <EmbedRenderer key={i} embed={embedData} />;
                }
                return <MarkdownBlock key={i} content={seg.content} />;
              }
              case 'markdown':
                return <MarkdownBlock key={i} content={seg.content} />;
              default:
                return null;
            }
          })}
        </div>
      )}
    </span>
  );
}

// Custom component overrides for react-markdown to match forum styling
const markdownComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <div className="text-[18px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h2: ({ children }) => (
    <div className="text-[16px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h3: ({ children }) => (
    <div className="text-[14px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h4: ({ children }) => (
    <div className="text-[13px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h5: ({ children }) => (
    <div className="text-[12px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),
  h6: ({ children }) => (
    <div className="text-[11px] font-mono font-bold text-forum-text my-2">{children}</div>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="my-0.5 leading-relaxed">{processMentions(children)}</p>
  ),

  // Bold / Italic
  strong: ({ children }) => <strong className="font-bold text-forum-text">{children}</strong>,
  em: ({ children }) => <em className="italic text-forum-text/80">{children}</em>,

  // Strikethrough
  del: ({ children }) => <del className="text-forum-muted/60">{children}</del>,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline decoration-forum-pink/30 hover:decoration-forum-pink/60"
    >
      {children}
    </a>
  ),

  // Images
  img: ({ src, alt }) => (
    <div className="my-2">
      <img
        src={src}
        alt={alt || ''}
        className="max-w-full max-h-[400px]  border border-forum-border/30 object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  ),

  // Lists
  ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 my-0.5">
      <span className="text-primary mt-1 shrink-0">&#8226;</span>
      <span className="flex-1">{children}</span>
    </li>
  ),

  // Inline code
  code: ({ className, children }) => {
    // If it has a language class, it's inside a <pre> - rehype-highlight handles this
    if (className) {
      return <code className={className}>{children}</code>;
    }
    // Inline code
    return (
      <code className="px-1.5 py-0.5 rounded bg-forum-bg border border-forum-border/30 text-[11px] text-primary/90 font-mono">
        {children}
      </code>
    );
  },

  // Code blocks (pre wraps code)
  pre: ({ children }) => {
    // Extract the code element's props
    const codeChild = children as any;
    const className = codeChild?.props?.className || '';
    const codeContent = codeChild?.props?.children;
    return <CodeBlock className={className}>{codeContent}</CodeBlock>;
  },

  // Blockquotes
  blockquote: ({ children }) => <ExpandableBlockquote>{children}</ExpandableBlockquote>,

  // Horizontal rules
  hr: () => <hr className="my-4 border-forum-border/30" />,

  // Tables
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto  border border-forum-border/40">
      <table className="w-full text-[11px] font-mono">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-forum-bg border-b border-forum-border/30">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-bold text-primary/80 uppercase tracking-wider text-[9px]">
      {children}
    </th>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-forum-border/15 last:border-b-0 hover:bg-primary/[0.02] transition-forum">
      {children}
    </tr>
  ),
  td: ({ children }) => <td className="px-3 py-1.5 text-forum-text/80">{children}</td>,

  // Task list items (GFM checkboxes)
  input: ({ checked, type, ...props }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-1.5 accent-forum-pink rounded"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },

  // Custom video player
  video: ({ src, ...props }: any) => {
    if (src) {
      return <VideoPlayer src={src} type={props.type} />;
    }
    return <video src={src} {...props} />;
  },
};

// Highlight @mentions in text children
function processMentions(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return processMentionString(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') return <span key={i}>{processMentionString(child)}</span>;
      return child;
    });
  }
  return children;
}

function processMentionString(text: string): ReactNode {
  const parts = text.split(/(@\w+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Renders a markdown string with react-markdown
function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function PostContentRenderer({ content }: PostContentRendererProps) {
  const segments = useMemo(() => parseSegments(content), [content]);

  return (
    <div className="prose prose-invert max-w-none text-[13px] font-mono text-forum-text/90 leading-relaxed flex-1 break-words post-content">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'spoiler':
            return <SpoilerBlock key={i} content={seg.content} />;

          case 'video': {
            const [src, type] = seg.content.split('|');
            return <VideoPlayer key={i} src={src} type={type} />;
          }

          case 'embed': {
            const embedData = parseEmbeddableUrl(seg.content);
            if (embedData && embedData.type !== 'link') {
              return <EmbedRenderer key={i} embed={embedData} />;
            }
            return <MarkdownBlock key={i} content={seg.content} />;
          }

          case 'markdown':
            return <MarkdownBlock key={i} content={seg.content} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
