import { useEffect, useRef, useCallback, useState } from 'react';

const DRAFT_PREFIX = 'chuglii_draft_';
const SAVE_DELAY_MS = 3000; // 3 seconds as per spec
const DRAFT_EXPIRY_DAYS = 7;

/**
 * Auto-saves draft text to localStorage with debounced writes.
 * Restores the draft on mount and clears it when explicitly discarded.
 * Expires drafts older than 7 days.
 */
export function useDraftAutoSave(key: string, text: string, setText: (v: string) => void) {
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const timestampKey = `${storageKey}_timestamp`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft on mount (once per key)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (saved && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        if (age < maxAge) {
          setText(saved);
          setDraftRestored(true);
          // Hide the indicator after 3 seconds
          setTimeout(() => setDraftRestored(false), 3000);
        } else {
          // Draft expired, remove it
          localStorage.removeItem(storageKey);
          localStorage.removeItem(timestampKey);
        }
      }
    } catch {
      // localStorage unavailable - ignore
    }
  }, [storageKey, timestampKey, setText]);

  // Debounced save whenever text changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        if (text) {
          localStorage.setItem(storageKey, text);
          localStorage.setItem(timestampKey, Date.now().toString());
        } else {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(timestampKey);
        }
      } catch {
        // quota exceeded or unavailable - ignore
      }
    }, SAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, storageKey, timestampKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
    } catch {
      // ignore
    }
  }, [storageKey, timestampKey]);

  return { clearDraft, draftRestored };
}
