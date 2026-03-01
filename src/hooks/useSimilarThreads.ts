import { useState, useEffect } from 'react';
import { calculateSimilarity } from '@/lib/threadValidation';
import type { Thread } from '@/types/forum';

export function useSimilarThreads(title: string, getAllThreads: () => Thread[]) {
  const [similarThreads, setSimilarThreads] = useState<Array<Thread & { similarity: number }>>([]);
  const [showSimilarThreads, setShowSimilarThreads] = useState(false);

  useEffect(() => {
    if (!title || title.length < 10) {
      setSimilarThreads([]);
      setShowSimilarThreads(false);
      return;
    }
    
    const timer = setTimeout(() => {
      const allThreads = getAllThreads();
      const similar = allThreads
        .map(thread => ({
          ...thread,
          similarity: calculateSimilarity(title, thread.title)
        }))
        .filter(t => t.similarity > 0.6 && t.similarity < 1) // 60% similar but not exact match
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);
      
      setSimilarThreads(similar);
      setShowSimilarThreads(similar.length > 0);
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timer);
  }, [title, getAllThreads]);

  return {
    similarThreads,
    showSimilarThreads,
    setShowSimilarThreads
  };
}
