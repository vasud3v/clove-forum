import {
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Table,
  EyeOff,
  AtSign,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  Palette,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Emoji Constants
// ============================================================================

export const COMMON_EMOJIS = [
  '😀', '😂', '🤔', '👍', '👎', '🔥', '💡', '❤️', '🎉', '👀',
  '🚀', '💯', '🐛', '⚡', '🤖', '🎯', '✅', '❌', '⚠️', '💀',
  '🧠', '💻', '🔧', '📦', '🎨', '🛡️', '☕', '🌟', '😎', '🤝',
] as const;

export const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Helpful' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🎯', label: 'On Point' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '👀', label: 'Watching' },
] as const;

// ============================================================================
// Markdown Toolbar Actions
// ============================================================================

export interface MarkdownAction {
  icon: LucideIcon | null;
  iconLabel?: string; // For text-only buttons (like "{}")
  tooltip: string;
  insertText: string;
  separator?: boolean; // Whether to show separator before this action
}

export const MARKDOWN_TOOLBAR_ACTIONS: MarkdownAction[] = [
  { icon: Bold, tooltip: 'Bold (Ctrl+B)', insertText: '**text**' },
  { icon: Italic, tooltip: 'Italic (Ctrl+I)', insertText: '*text*' },
  { icon: Underline, tooltip: 'Underline', insertText: '<u>text</u>' },
  { icon: Strikethrough, tooltip: 'Strikethrough', insertText: '~~text~~' },
  { icon: Palette, tooltip: 'Text Color', insertText: '<span style="color: #ff0000">text</span>' },
  
  { icon: Heading, tooltip: 'Heading 1', insertText: '# ', separator: true },
  { icon: null, iconLabel: 'H2', tooltip: 'Heading 2', insertText: '## ' },
  { icon: null, iconLabel: 'H3', tooltip: 'Heading 3', insertText: '### ' },
  
  { icon: LinkIcon, tooltip: 'Insert Link', insertText: '[text](url)', separator: true },
  { icon: null, iconLabel: '{}', tooltip: 'Inline Code', insertText: '`code`' },
  { icon: Code, tooltip: 'Code Block', insertText: '\n```\ncode\n```\n' },
  
  { icon: List, tooltip: 'Bullet List', insertText: '\n- item\n- item\n- item\n', separator: true },
  { icon: ListOrdered, tooltip: 'Numbered List', insertText: '\n1. item\n2. item\n3. item\n' },
  
  { icon: Quote, tooltip: 'Blockquote', insertText: '> ', separator: true },
  { icon: Minus, tooltip: 'Horizontal Line', insertText: '\n---\n' },
  
  { icon: AlignLeft, tooltip: 'Align Left', insertText: '<div align="left">text</div>', separator: true },
  { icon: AlignCenter, tooltip: 'Align Center', insertText: '<div align="center">text</div>' },
  { icon: AlignRight, tooltip: 'Align Right', insertText: '<div align="right">text</div>' },
  
  { icon: Table, tooltip: 'Insert Table', insertText: '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n', separator: true },
  { icon: EyeOff, tooltip: 'Spoiler Tag', insertText: '\n[spoiler]Hidden content[/spoiler]\n' },
  { icon: AtSign, tooltip: 'Mention User', insertText: '@' },
];

// ============================================================================
// Report Reasons
// ============================================================================

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'off_topic', label: 'Off-topic' },
  { value: 'duplicate', label: 'Duplicate post' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// Threading Constants
// ============================================================================

export const MAX_THREAD_DEPTH = 3;

// ============================================================================
// Pagination Constants
// ============================================================================

export const DEFAULT_POSTS_PER_PAGE = 20;
export const DEFAULT_THREADS_PER_PAGE = 25;
