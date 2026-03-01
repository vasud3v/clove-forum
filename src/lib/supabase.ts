import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Simple validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase credentials not configured!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.\n' +
    'See .env.example for reference.'
  );
} else {
  // Validate anon key format (should be a JWT with 3 parts)
  const keyParts = supabaseAnonKey.split('.');
  if (keyParts.length !== 3) {
    console.error(
      '❌ Invalid VITE_SUPABASE_ANON_KEY format!\n' +
      'The anon key should be a complete JWT token with 3 parts (header.payload.signature).\n' +
      'Please copy the complete "anon" key from your Supabase project settings:\n' +
      'https://app.supabase.com/project/YOUR_PROJECT/settings/api'
    );
  }
}

// Use placeholder values if credentials are missing to prevent runtime errors
// The app will still initialize but database operations will fail gracefully
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10, // Reduced from 50 to limit realtime overhead
      },
    },
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'forum-app',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  }
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key');
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Custom error class for forum operations
 */
export class ForumError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ForumError';
  }
}

/**
 * Converts Supabase errors into user-friendly ForumError instances
 */
export function handleSupabaseError(error: any, operation: string): ForumError {
  console.error(`[ForumContext] ${operation} failed:`, error);

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new ForumError(
      error.message,
      'NETWORK_ERROR',
      'Connection failed. Please check your internet connection and try again.',
      true
    );
  }

  // Authentication errors
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    return new ForumError(
      error.message,
      'AUTH_ERROR',
      'Your session has expired. Please log in again.',
      false
    );
  }

  // Permission errors
  if (error.code === '42501' || error.message?.includes('permission')) {
    return new ForumError(
      error.message,
      'PERMISSION_ERROR',
      "You don't have permission to perform this action.",
      false
    );
  }

  // Conflict errors
  if (error.code === '23505') {
    return new ForumError(
      error.message,
      'CONFLICT_ERROR',
      'This action conflicts with existing data. Please refresh and try again.',
      true
    );
  }

  // Rate limit errors
  if (error.message?.includes('rate limit')) {
    return new ForumError(
      error.message,
      'RATE_LIMIT_ERROR',
      'Too many requests. Please wait a moment and try again.',
      true
    );
  }

  // Generic error
  return new ForumError(
    error.message,
    'UNKNOWN_ERROR',
    'Something went wrong. Please try again.',
    true
  );
}

/**
 * Retry wrapper for operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      const forumError = handleSupabaseError(error, 'operation');
      
      // Don't retry if not retryable
      if (!forumError.retryable) {
        throw forumError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw forumError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError!;
}
