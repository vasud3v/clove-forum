import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Node, mergeAttributes } from '@tiptap/core';
import { Eye, X, Upload, Loader2, Trash2 } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { toast } from '../Toast';

// Upload proxy server URL
const UPLOAD_PROXY_URL = 'http://localhost:3001/api/upload-image';

// ── Custom Image Extension ───────────────────────────────────────────
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
      style: {
        default: 'max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 8px;',
        renderHTML: attributes => {
          return { style: attributes.style };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

// ── Video Extension ───────────────────────────────────────
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: { setVideo: (options: { src: string }) => ReturnType };
  }
}

const Video = Node.create({
  name: 'video', 
  group: 'block', 
  atom: true,
  addAttributes() {
    return { 
      src: { default: null }, 
      controls: { default: true }, 
      width: { default: null },
      height: { default: null },
      style: { 
        default: 'max-width: 100%; max-height: 600px; width: auto; height: auto; display: block; margin: 16px auto; border-radius: 8px;' 
      }
    };
  },
  parseHTML() { return [{ tag: 'video' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, {
      controls: 'controls',
    })];
  },
  addCommands() {
    return {
      setVideo: (options: { src: string }) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

// ── Toolbar Button ────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1 rounded transition-all text-[10px] font-mono ${
        active
          ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/30'
          : 'text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10'
      }`}>
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-3.5 bg-zinc-700/60 mx-0.5 shrink-0" />;
}

// ── Modal ─────────────────────────────────────────────────
function Modal({ title, onClose, onConfirm, confirmLabel = 'Insert', confirmDisabled, children, hideConfirm }: {
  title: string; onClose: () => void; onConfirm?: () => void; confirmLabel?: string;
  confirmDisabled?: boolean; children: React.ReactNode; hideConfirm?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={14} /></button>
        </div>
        {children}
        {!hideConfirm && (
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors">Cancel</button>
            <button type="button" onClick={onConfirm!} disabled={confirmDisabled}
              className="px-4 py-2 text-[13px] bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-zinc-400 mb-1.5">{label}</label>
      <input {...props}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all" />
    </div>
  );
}

// ── Table Grid Picker ─────────────────────────────────────
function TablePicker({ onInsert, onClose }: { onInsert: (r: number, c: number) => void; onClose: () => void; }) {
  const [hr, setHr] = useState(2);
  const [hc, setHc] = useState(3);
  return (
    <div className="absolute top-full left-0 mt-1.5 z-[100] bg-zinc-900 border border-zinc-700/70 rounded-xl p-3 shadow-2xl" onMouseLeave={onClose}>
      <div className="text-center mb-2">
        <span className="text-[14px] font-mono font-bold text-zinc-100">{hr} × {hc}</span>
      </div>
      <div className="inline-grid gap-[3px] p-2 bg-zinc-800/50 rounded mb-2">
        {Array(8).fill(0).map((_, ri) => (
          <div key={ri} className="flex gap-[3px]">
            {Array(8).fill(0).map((_, ci) => (
              <button key={ci} type="button"
                onMouseEnter={() => { setHr(ri + 1); setHc(ci + 1); }}
                onClick={() => { onInsert(hr, hc); }}
                className={`w-[22px] h-[22px] border-2 rounded transition-all ${
                  ri < hr && ci < hc ? 'border-teal-400 bg-teal-400/20' : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                }`} />
            ))}
          </div>
        ))}
      </div>
      <div className="text-[8px] font-mono text-zinc-500 text-center">Click to insert</div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────
export interface AdvancedEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPreview?: () => void;
  placeholder?: string;
  minHeight?: string;
}

export function AdvancedEditor({
  value, onChange, onPreview,
  placeholder = 'Write your content here…',
  minHeight = '220px',
}: AdvancedEditorProps) {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showLinkModal, setShowLinkModal]     = useState(false);
  const [linkUrl, setLinkUrl]                 = useState('');
  const [linkText, setLinkText]               = useState('');
  const [showImageModal, setShowImageModal]   = useState(false);
  const [imageUrl, setImageUrl]               = useState('');
  const [showVideoModal, setShowVideoModal]   = useState(false);
  const [videoUrl, setVideoUrl]               = useState('');
  const [isUploading, setIsUploading]         = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-teal-400 underline hover:text-teal-300 cursor-pointer' },
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'forum-image',
        },
      }),
      Video,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none px-4 py-3',
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [editor, value]);

  if (!editor) return null;

  const insertLink = () => {
    if (!linkUrl) return;
    if (linkText) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkModal(false); setLinkUrl(''); setLinkText('');
  };

  const insertImage = () => {
    if (!imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageModal(false); setImageUrl('');
  };

  const insertVideo = () => {
    if (!videoUrl) return;
    editor.chain().focus().setVideo({ src: videoUrl }).run();
    setShowVideoModal(false); setVideoUrl('');
  };

  const uploadFile = async (file: File, type: 'image' | 'video') => {
    const isVideo = type === 'video';
    const maxSize = isVideo ? 500 : 32; // 500MB for videos, 32MB for images
    
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`${isVideo ? 'Video' : 'Image'} must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(UPLOAD_PROXY_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      const fileUrl = result.url;
      
      if (isVideo) {
        editor.chain().focus().setVideo({ src: fileUrl }).run();
        setShowVideoModal(false);
        toast.success('Video uploaded successfully');
      } else {
        editor.chain().focus().setImage({ src: fileUrl }).run();
        setShowImageModal(false);
        toast.success('Image uploaded successfully');
      }
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.error(error.message || 'Failed to upload file. Make sure the upload server is running.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, 'image');
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, 'video');
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };



  const inTable = editor.isActive('table');

  return (
    <div className="space-y-0 relative">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-700/50 flex-wrap bg-zinc-800/40 rounded-t-xl overflow-visible relative z-10">

        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (⌘Z)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/><path d="M3 13C5 7 9 4 14 4a9 9 0 0 1 9 9 9 9 0 0 1-9 9c-4 0-7-2-8.5-5"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (⌘⇧Z)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/><path d="M21 13C19 7 15 4 10 4a9 9 0 0 0-9 9 9 9 0 0 0 9 9c4 0 7-2 8.5-5"/>
          </svg>
        </ToolBtn>
        <Sep />

        {/* Text format */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          <span className="font-mono text-[9px]">X₂</span>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          <span className="font-mono text-[9px]">X²</span>
        </ToolBtn>
        <Sep />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>
        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task List">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </ToolBtn>
        <Sep />
        
        {/* Text Alignment */}
        <ToolBtn onClick={() => {
          if (editor.isActive({ textAlign: 'left' })) {
            editor.chain().focus().unsetTextAlign().run();
          } else {
            editor.chain().focus().setTextAlign('left').run();
          }
        }} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => {
          if (editor.isActive({ textAlign: 'center' })) {
            editor.chain().focus().unsetTextAlign().run();
          } else {
            editor.chain().focus().setTextAlign('center').run();
          }
        }} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => {
          if (editor.isActive({ textAlign: 'right' })) {
            editor.chain().focus().unsetTextAlign().run();
          } else {
            editor.chain().focus().setTextAlign('right').run();
          }
        }} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => {
          if (editor.isActive({ textAlign: 'justify' })) {
            editor.chain().focus().unsetTextAlign().run();
          } else {
            editor.chain().focus().setTextAlign('justify').run();
          }
        }} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolBtn>
        <Sep />
        
        {/* More formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <polyline points="9 8 5 12 9 16"/><polyline points="15 8 19 12 15 16"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
        </ToolBtn>
        <Sep />

        {/* Link */}
        <ToolBtn onClick={() => setShowLinkModal(true)} active={editor.isActive('link')} title="Insert Link">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </ToolBtn>

        {/* Image */}
        <ToolBtn onClick={() => setShowImageModal(true)} title="Insert Image">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </ToolBtn>

        {/* Video */}
        <ToolBtn onClick={() => setShowVideoModal(true)} title="Insert Video">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </ToolBtn>
        <Sep />

        {/* Table */}
        <div className="relative">
          <ToolBtn onClick={() => setShowTablePicker(p => !p)} active={inTable} title="Insert Table">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
          </ToolBtn>
          {showTablePicker && (
            <TablePicker
              onInsert={(r, c) => { editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run(); setShowTablePicker(false); }}
              onClose={() => setShowTablePicker(false)}
            />
          )}
        </div>

        {/* Table cell actions */}
        {inTable && (
          <>
            <Sep />
            <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="+Col Before">+C←</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="+Col After">+C→</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="+Row Before">+R↑</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="+Row After">+R↓</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Del Column">-C</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Del Row">-R</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </ToolBtn>
          </>
        )}
        <Sep />

        {/* Color */}
        <ColorPicker onApply={color => editor.chain().focus().setMark('textStyle', { color }).run()} />

        <div className="flex-1" />

        {/* Preview */}
        {onPreview && (
          <button type="button" onClick={onPreview} title="Preview"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 transition-all">
            <Eye size={10} /><span>Preview</span>
          </button>
        )}
      </div>

      {/* ── Editor Area ── */}
      <div className="rounded-b-xl border border-t-0 border-zinc-700 bg-zinc-900 focus-within:border-pink-500/40 focus-within:shadow-[0_0_0_1px_rgba(236,72,153,0.2)] transition-all"
        style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* ── Clear Button ── */}
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-700 hover:border-red-500/40 rounded-lg transition-all"
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>

      {/* ── Clear Confirmation Modal ── */}
      {showClearConfirm && (
        <Modal 
          title="Clear All Content" 
          onClose={() => setShowClearConfirm(false)}
          onConfirm={() => {
            editor.commands.clearContent();
            onChange('');
            setShowClearConfirm(false);
            toast.success('Content cleared');
          }}
          confirmLabel="Clear"
        >
          <p className="text-[13px] text-zinc-300 mb-4">
            Are you sure you want to clear all content? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* ── Modals ── */}
      {showLinkModal && (
        <Modal title="Insert Link" onClose={() => { setShowLinkModal(false); setLinkUrl(''); setLinkText(''); }}
          onConfirm={insertLink} confirmDisabled={!linkUrl}>
          <Field label="URL" type="url" value={linkUrl} onChange={e => setLinkUrl((e.target as HTMLInputElement).value)}
            placeholder="https://example.com" autoFocus />
          <Field label="Display Text (optional)" type="text" value={linkText} onChange={e => setLinkText((e.target as HTMLInputElement).value)}
            placeholder="Link text" />
        </Modal>
      )}

      {showImageModal && (
        <Modal title="Insert Image" onClose={() => { setShowImageModal(false); setImageUrl(''); }}
          onConfirm={insertImage} confirmDisabled={!imageUrl || isUploading}>
          <div className="space-y-4">
            {/* Upload from device */}
            <div>
              <label className="block text-[12px] text-zinc-400 mb-1.5">Upload from device</label>
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-3 text-[13px] text-zinc-300 hover:border-teal-500/50 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Choose image file (max 32MB)</span>
                  </>
                )}
              </button>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleImageFileSelect}
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-zinc-900 px-2 text-zinc-500">or paste URL</span>
              </div>
            </div>

            {/* URL input */}
            <Field label="Image URL" type="url" value={imageUrl} onChange={e => setImageUrl((e.target as HTMLInputElement).value)}
              placeholder="https://example.com/image.jpg" />
          </div>
        </Modal>
      )}

      {showVideoModal && (
        <Modal title="Insert Video" onClose={() => { setShowVideoModal(false); setVideoUrl(''); }}
          onConfirm={insertVideo} confirmDisabled={!videoUrl || isUploading}>
          <div className="space-y-4">
            {/* Upload from device */}
            <div>
              <label className="block text-[12px] text-zinc-400 mb-1.5">Upload from device</label>
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-3 text-[13px] text-zinc-300 hover:border-teal-500/50 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Choose video file (max 500MB)</span>
                  </>
                )}
              </button>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mov,video/avi"
                className="hidden"
                onChange={handleVideoFileSelect}
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-zinc-900 px-2 text-zinc-500">or paste URL</span>
              </div>
            </div>

            {/* URL input */}
            <Field label="Video URL (.mp4, .webm)" type="url" value={videoUrl} onChange={e => setVideoUrl((e.target as HTMLInputElement).value)}
              placeholder="https://example.com/video.mp4" />
          </div>
        </Modal>
      )}
    </div>
  );
}
