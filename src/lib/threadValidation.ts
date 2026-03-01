// Thread creation validation utilities with advanced features
export interface ThreadValidationError {
  field: 'title' | 'content' | 'category' | 'topic' | 'tags' | 'general';
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ThreadValidationResult {
  isValid: boolean;
  errors: ThreadValidationError[];
  warnings: ThreadValidationError[];
  suggestions: string[];
}

// Validation constants with helpful descriptions
export const THREAD_VALIDATION = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 50000,
  TAG_MIN_LENGTH: 2,
  TAG_MAX_LENGTH: 30,
  MAX_TAGS: 10,
  EXCERPT_LENGTH: 120,
  
  // Rate limiting
  MIN_TIME_BETWEEN_THREADS: 30000, // 30 seconds
  
  // Quality thresholds
  RECOMMENDED_TITLE_LENGTH: 20,
  RECOMMENDED_CONTENT_LENGTH: 50,
  
  // Spam detection
  MAX_REPEATED_CHARS: 5,
  MAX_CAPS_PERCENTAGE: 0.7,
} as const;

// Common spam/low-quality patterns
const SPAM_PATTERNS = [
  /(.)\1{5,}/gi, // Repeated characters (aaaaa)
  /^[^a-zA-Z0-9]+$/g, // Only special characters
  /\b(click here|buy now|limited offer|act now)\b/gi, // Spam phrases
];

// Profanity filter (basic - expand as needed)
const PROFANITY_PATTERNS = [
  // Add patterns as needed - keeping it minimal for example
];

// Sanitize text to prevent XSS
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Strip markdown and HTML for excerpt generation
export function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/[*_~`#]/g, '') // Remove markdown symbols
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Generate safe excerpt
export function generateExcerpt(content: string, maxLength: number = THREAD_VALIDATION.EXCERPT_LENGTH): string {
  const stripped = stripMarkdown(content);
  if (stripped.length <= maxLength) {
    return stripped;
  }
  return stripped.slice(0, maxLength).trim() + '...';
}

// Advanced title validation with quality checks
export function validateTitle(title: string): {
  errors: ThreadValidationError[];
  warnings: ThreadValidationError[];
  suggestions: string[];
} {
  const trimmed = title.trim();
  const errors: ThreadValidationError[] = [];
  const warnings: ThreadValidationError[] = [];
  const suggestions: string[] = [];
  
  // Required check
  if (!trimmed) {
    errors.push({ 
      field: 'title', 
      message: 'Title is required',
      code: 'TITLE_REQUIRED',
      severity: 'error',
      suggestion: 'Enter a descriptive title for your thread'
    });
    return { errors, warnings, suggestions };
  }
  
  // Length checks
  if (trimmed.length < THREAD_VALIDATION.TITLE_MIN_LENGTH) {
    errors.push({ 
      field: 'title', 
      message: `Title must be at least ${THREAD_VALIDATION.TITLE_MIN_LENGTH} characters`,
      code: 'TITLE_TOO_SHORT',
      severity: 'error',
      suggestion: `Add ${THREAD_VALIDATION.TITLE_MIN_LENGTH - trimmed.length} more characters`
    });
  }
  
  if (trimmed.length > THREAD_VALIDATION.TITLE_MAX_LENGTH) {
    errors.push({ 
      field: 'title', 
      message: `Title must not exceed ${THREAD_VALIDATION.TITLE_MAX_LENGTH} characters`,
      code: 'TITLE_TOO_LONG',
      severity: 'error',
      suggestion: `Remove ${trimmed.length - THREAD_VALIDATION.TITLE_MAX_LENGTH} characters`
    });
  }
  
  // Quality checks (warnings)
  if (trimmed.length < THREAD_VALIDATION.RECOMMENDED_TITLE_LENGTH && trimmed.length >= THREAD_VALIDATION.TITLE_MIN_LENGTH) {
    warnings.push({
      field: 'title',
      message: 'Title is quite short',
      code: 'TITLE_SHORT',
      severity: 'warning',
      suggestion: 'Consider adding more detail to help others understand your topic'
    });
  }
  
  // Check for all caps
  const capsCount = (trimmed.match(/[A-Z]/g) || []).length;
  const capsPercentage = capsCount / trimmed.length;
  if (capsPercentage > THREAD_VALIDATION.MAX_CAPS_PERCENTAGE && trimmed.length > 10) {
    warnings.push({
      field: 'title',
      message: 'Too many capital letters',
      code: 'TITLE_ALL_CAPS',
      severity: 'warning',
      suggestion: 'Use normal capitalization for better readability'
    });
  }
  
  // Check for repeated characters
  if (SPAM_PATTERNS[0].test(trimmed)) {
    warnings.push({
      field: 'title',
      message: 'Excessive repeated characters detected',
      code: 'TITLE_REPEATED_CHARS',
      severity: 'warning',
      suggestion: 'Remove unnecessary repeated characters'
    });
  }
  
  // Check for only special characters
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
    errors.push({ 
      field: 'title', 
      message: 'Title must contain alphanumeric characters',
      code: 'TITLE_NO_ALPHANUMERIC',
      severity: 'error',
      suggestion: 'Add letters or numbers to your title'
    });
  }
  
  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS.slice(1)) {
    if (pattern.test(trimmed)) {
      warnings.push({
        field: 'title',
        message: 'Title may contain spam-like content',
        code: 'TITLE_SPAM_PATTERN',
        severity: 'warning',
        suggestion: 'Ensure your title is genuine and descriptive'
      });
      break;
    }
  }
  
  // Helpful suggestions
  if (errors.length === 0 && warnings.length === 0) {
    if (!trimmed.endsWith('?') && !trimmed.endsWith('.') && !trimmed.endsWith('!')) {
      suggestions.push('Consider ending with punctuation for clarity');
    }
  }
  
  return { errors, warnings, suggestions };
}

// Advanced content validation with quality checks
export function validateContent(content: string): {
  errors: ThreadValidationError[];
  warnings: ThreadValidationError[];
  suggestions: string[];
} {
  const trimmed = content.trim();
  const errors: ThreadValidationError[] = [];
  const warnings: ThreadValidationError[] = [];
  const suggestions: string[] = [];
  
  // Required check
  if (!trimmed) {
    errors.push({ 
      field: 'content', 
      message: 'Content is required',
      code: 'CONTENT_REQUIRED',
      severity: 'error',
      suggestion: 'Add content to explain your thread topic'
    });
    return { errors, warnings, suggestions };
  }
  
  // Length checks
  if (trimmed.length < THREAD_VALIDATION.CONTENT_MIN_LENGTH) {
    errors.push({ 
      field: 'content', 
      message: `Content must be at least ${THREAD_VALIDATION.CONTENT_MIN_LENGTH} characters`,
      code: 'CONTENT_TOO_SHORT',
      severity: 'error',
      suggestion: `Add ${THREAD_VALIDATION.CONTENT_MIN_LENGTH - trimmed.length} more characters`
    });
  }
  
  if (trimmed.length > THREAD_VALIDATION.CONTENT_MAX_LENGTH) {
    errors.push({ 
      field: 'content', 
      message: `Content must not exceed ${THREAD_VALIDATION.CONTENT_MAX_LENGTH} characters`,
      code: 'CONTENT_TOO_LONG',
      severity: 'error',
      suggestion: 'Consider breaking this into multiple posts'
    });
  }
  
  // Quality checks
  if (trimmed.length < THREAD_VALIDATION.RECOMMENDED_CONTENT_LENGTH && trimmed.length >= THREAD_VALIDATION.CONTENT_MIN_LENGTH) {
    warnings.push({
      field: 'content',
      message: 'Content is quite brief',
      code: 'CONTENT_SHORT',
      severity: 'warning',
      suggestion: 'Add more details to get better responses'
    });
  }
  
  // Check for all caps
  const capsCount = (trimmed.match(/[A-Z]/g) || []).length;
  const capsPercentage = capsCount / trimmed.length;
  if (capsPercentage > THREAD_VALIDATION.MAX_CAPS_PERCENTAGE && trimmed.length > 20) {
    warnings.push({
      field: 'content',
      message: 'Too many capital letters',
      code: 'CONTENT_ALL_CAPS',
      severity: 'warning',
      suggestion: 'Use normal capitalization for better readability'
    });
  }
  
  // Check for repeated characters
  const repeatedMatches = trimmed.match(/(.)\1{5,}/g);
  if (repeatedMatches && repeatedMatches.length > 2) {
    warnings.push({
      field: 'content',
      message: 'Excessive repeated characters detected',
      code: 'CONTENT_REPEATED_CHARS',
      severity: 'warning',
      suggestion: 'Remove unnecessary repeated characters'
    });
  }
  
  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      warnings.push({
        field: 'content',
        message: 'Content may contain spam-like patterns',
        code: 'CONTENT_SPAM_PATTERN',
        severity: 'warning',
        suggestion: 'Ensure your content is genuine and helpful'
      });
      break;
    }
  }
  
  // Helpful suggestions
  if (errors.length === 0) {
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 10) {
      suggestions.push('Consider adding more detail to help others understand your question or topic');
    }
    
    // Check for code blocks
    if (trimmed.includes('```') && !trimmed.match(/```[\s\S]*?```/)) {
      warnings.push({
        field: 'content',
        message: 'Unclosed code block detected',
        code: 'CONTENT_UNCLOSED_CODE',
        severity: 'warning',
        suggestion: 'Make sure all code blocks are properly closed with ```'
      });
    }
  }
  
  return { errors, warnings, suggestions };
}

// Advanced tag validation with suggestions
export function validateTags(tagsInput: string): { 
  isValid: boolean; 
  tags: string[]; 
  error: ThreadValidationError | null;
  warnings: ThreadValidationError[];
  suggestions: string[];
} {
  const warnings: ThreadValidationError[] = [];
  const suggestions: string[] = [];
  
  if (!tagsInput.trim()) {
    suggestions.push('Add tags to help others find your thread');
    return { isValid: true, tags: [], error: null, warnings, suggestions };
  }
  
  const tags = tagsInput
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/^#/, ''))
    .filter(t => t.length > 0);
  
  // Remove duplicates
  const uniqueTags = Array.from(new Set(tags));
  
  // Check for removed duplicates
  if (tags.length !== uniqueTags.length) {
    warnings.push({
      field: 'tags',
      message: `${tags.length - uniqueTags.length} duplicate tag(s) removed`,
      code: 'TAGS_DUPLICATES',
      severity: 'info'
    });
  }
  
  if (uniqueTags.length > THREAD_VALIDATION.MAX_TAGS) {
    return {
      isValid: false,
      tags: [],
      error: { 
        field: 'tags', 
        message: `Maximum ${THREAD_VALIDATION.MAX_TAGS} tags allowed (you have ${uniqueTags.length})`,
        code: 'TAGS_TOO_MANY',
        severity: 'error',
        suggestion: `Remove ${uniqueTags.length - THREAD_VALIDATION.MAX_TAGS} tag(s)`
      },
      warnings,
      suggestions
    };
  }
  
  // Validate individual tags
  for (const tag of uniqueTags) {
    if (tag.length < THREAD_VALIDATION.TAG_MIN_LENGTH) {
      return {
        isValid: false,
        tags: [],
        error: { 
          field: 'tags', 
          message: `Tag "${tag}" is too short (minimum ${THREAD_VALIDATION.TAG_MIN_LENGTH} characters)`,
          code: 'TAG_TOO_SHORT',
          severity: 'error',
          suggestion: 'Use more descriptive tags'
        },
        warnings,
        suggestions
      };
    }
    
    if (tag.length > THREAD_VALIDATION.TAG_MAX_LENGTH) {
      return {
        isValid: false,
        tags: [],
        error: { 
          field: 'tags', 
          message: `Tag "${tag}" is too long (maximum ${THREAD_VALIDATION.TAG_MAX_LENGTH} characters)`,
          code: 'TAG_TOO_LONG',
          severity: 'error',
          suggestion: 'Shorten your tags'
        },
        warnings,
        suggestions
      };
    }
    
    // Only allow alphanumeric, hyphens, and underscores
    if (!/^[a-z0-9_-]+$/.test(tag)) {
      return {
        isValid: false,
        tags: [],
        error: { 
          field: 'tags', 
          message: `Tag "${tag}" contains invalid characters`,
          code: 'TAG_INVALID_CHARS',
          severity: 'error',
          suggestion: 'Use only letters, numbers, hyphens, and underscores'
        },
        warnings,
        suggestions
      };
    }
  }
  
  // Quality suggestions
  if (uniqueTags.length < 3) {
    suggestions.push('Consider adding more tags to improve discoverability');
  }
  
  if (uniqueTags.length === 1) {
    warnings.push({
      field: 'tags',
      message: 'Only one tag added',
      code: 'TAGS_FEW',
      severity: 'info',
      suggestion: 'Add 2-3 more tags for better categorization'
    });
  }
  
  return { isValid: true, tags: uniqueTags, error: null, warnings, suggestions };
}

// Comprehensive validation with advanced features
export function validateThreadCreation(
  title: string,
  content: string,
  categoryId: string,
  tagsInput: string
): ThreadValidationResult {
  const allErrors: ThreadValidationError[] = [];
  const allWarnings: ThreadValidationError[] = [];
  const allSuggestions: string[] = [];
  
  // Validate title
  const titleValidation = validateTitle(title);
  allErrors.push(...titleValidation.errors);
  allWarnings.push(...titleValidation.warnings);
  allSuggestions.push(...titleValidation.suggestions);
  
  // Validate content
  const contentValidation = validateContent(content);
  allErrors.push(...contentValidation.errors);
  allWarnings.push(...contentValidation.warnings);
  allSuggestions.push(...contentValidation.suggestions);
  
  // Validate category
  if (!categoryId || !categoryId.trim()) {
    allErrors.push({ 
      field: 'category', 
      message: 'Please select a category',
      code: 'CATEGORY_REQUIRED',
      severity: 'error',
      suggestion: 'Choose the most relevant category for your thread'
    });
  }
  
  // Validate tags
  const tagsValidation = validateTags(tagsInput);
  if (!tagsValidation.isValid && tagsValidation.error) {
    allErrors.push(tagsValidation.error);
  }
  if (tagsValidation.warnings) {
    allWarnings.push(...tagsValidation.warnings);
  }
  if (tagsValidation.suggestions) {
    allSuggestions.push(...tagsValidation.suggestions);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions
  };
}

// Rate limiting check (client-side)
export function checkRateLimit(lastThreadTime: number | null): {
  allowed: boolean;
  remainingTime: number;
  message?: string;
} {
  if (!lastThreadTime) {
    return { allowed: true, remainingTime: 0 };
  }
  
  const now = Date.now();
  const timeSinceLastThread = now - lastThreadTime;
  const remainingTime = Math.max(0, THREAD_VALIDATION.MIN_TIME_BETWEEN_THREADS - timeSinceLastThread);
  
  if (remainingTime > 0) {
    const seconds = Math.ceil(remainingTime / 1000);
    return {
      allowed: false,
      remainingTime,
      message: `Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before creating another thread`
    };
  }
  
  return { allowed: true, remainingTime: 0 };
}

// Duplicate detection helper
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Simple Levenshtein distance-based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
