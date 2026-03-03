import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export function KeyboardShortcutsHint() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform));

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: [cmdKey, 'K'], action: 'Search' },
    { keys: [cmdKey, '/'], action: 'Shortcuts' },
    { keys: ['?'], action: 'Help' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex group transition-all duration-200 items-center gap-1.5  border border-forum-border px-2 py-1.5 text-[10px] font-mono text-forum-muted hover:text-primary hover:border-primary/40 hover:bg-forum-hover"
        title={`Keyboard Shortcuts (${cmdKey} + /)`}
      >
        <Keyboard size={12} className="group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">{cmdKey} /</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  p-4">
          <div className="w-full max-w-sm  border border-forum-border bg-forum-card shadow-brutal">
            {/* Header */}
            <div className="border-b border-forum-border p-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-forum-text font-mono">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-forum-muted hover:text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shortcuts List */}
            <div className="p-4 space-y-3">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-forum-muted">
                    {shortcut.action}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <span
                        key={keyIdx}
                        className="px-2 py-1 rounded bg-forum-bg border border-forum-border text-[10px] font-mono text-forum-text"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
