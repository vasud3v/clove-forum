import { useState, useEffect, useRef, type RefObject } from 'react';

/** SSR-safe localStorage helpers */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
    catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
};

/** Generate an SVG data-URI avatar from a username initial */
export function initialAvatar(username: string): string {
  const COLORS = ['#e11d48','#7c3aed','#0284c7','#059669','#d97706','#db2777'];
  const color = COLORS[(username.charCodeAt(0) ?? 0) % COLORS.length];
  const letter = (username?.[0] ?? '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="${color}22"/>
    <rect width="32" height="32" rx="4" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
    <text x="16" y="21" text-anchor="middle" font-size="14" font-family="monospace" font-weight="bold" fill="${color}">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Validate a CSS hex color (#RGB or #RRGGBB) */
export const isValidHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

/** Fuzzy-match: returns true when every char of query appears in order in target */
export function fuzzyMatch(target: string, query: string): boolean {
  let qi = 0;
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

/** Simple click-outside hook */
export function useClickOutside(ref: RefObject<HTMLElement | null>, cb: () => void, enabled: boolean) {
  const cbRef = useRef(cb);
  useEffect(() => { cbRef.current = cb; });
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cbRef.current();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, enabled]);
}

/** Debounce a value */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
