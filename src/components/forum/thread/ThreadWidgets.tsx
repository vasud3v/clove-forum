import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress(scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-forum-bg/50">
      <div
        className="h-full bg-primary to-forum-pink/60 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 z-30 transition-forum hud-panel h-9 w-9 flex items-center justify-center text-forum-muted hover:text-primary hover:border-primary/30 hover:shadow-brutal-sm"
      title="Scroll to top"
    >
      <ArrowUp size={14} />
    </button>
  );
}
