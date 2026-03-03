import { useState, useCallback, useRef } from 'react';
import { Palette } from 'lucide-react';
import { storage, isValidHex, useClickOutside } from './utils';

const PRESET_COLORS = [
  '#ff4757','#ff6348','#ffa502','#2ed573','#1e90ff','#5352ed','#ff6b81','#eccc68',
  '#a4b0be','#ffffff','#57606f','#2f3542','#ced6e0','#000000',
];

interface ColorPickerProps {
  onApply: (color: string) => void;
}

export function ColorPicker({ onApply }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('#ff4757');
  const [inputVal, setInputVal] = useState('#ff4757');
  const [recentColors, setRecentColors] = useState<string[]>(() =>
    storage.get<string[]>('forum_recent_colors', [])
  );
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const commit = useCallback((color: string) => {
    const normalizedColor = color.toLowerCase();
    if (!isValidHex(normalizedColor)) return;
    setSelected(normalizedColor);
    setInputVal(normalizedColor);
    onApply(normalizedColor);
    setOpen(false);
    const updated = [normalizedColor, ...recentColors.filter(c => c.toLowerCase() !== normalizedColor)].slice(0, 7);
    setRecentColors(updated);
    storage.set('forum_recent_colors', updated);
  }, [onApply, recentColors]);

  return (
    <div ref={ref} className="relative">
      <button 
        type="button" 
        onClick={() => { setOpen(p => !p); setInputVal(selected); }}
        title="Text Color"
        aria-label="Choose text color"
        aria-expanded={open}
        className="transition-all rounded p-1.5 text-foreground hover:text-white hover:bg-primary/20">
        <span className="relative block">
          <Palette size={12} />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2  border border-black/30"
            style={{ background: selected }} />
        </span>
      </button>

      {open && (
        <div 
          className="absolute top-full left-0 mt-1.5 z-[100] bg-zinc-900 border border-zinc-700/70  p-3 shadow-brutal-lg w-[220px]"
          onMouseDown={e => e.stopPropagation()}
          role="dialog"
          aria-label="Color picker"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Text Color</span>
            <span className="w-5 h-5 rounded border border-zinc-600" style={{ background: isValidHex(inputVal) ? inputVal : selected }} />
          </div>

          {recentColors.length > 0 && (
            <div className="mb-2">
              <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Recent</div>
              <div className="flex gap-1 flex-wrap">
                {recentColors.map(c => (
                  <button key={c} type="button" onClick={() => commit(c)}
                    aria-label={`Select color ${c}`}
                    className="w-5 h-5  border-2 border-zinc-700 hover:border-zinc-400 transition-colors"
                    style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1.5 mb-2.5">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => commit(c)}
                aria-label={`Select color ${c}`}
                className={`w-6 h-6  border-2 transition-all hover:scale-110 ${
                  selected === c ? 'border-white' : 'border-zinc-700 hover:border-zinc-400'
                }`}
                style={{ background: c }} title={c} />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <input type="color" value={selected}
              onChange={e => { setSelected(e.target.value); setInputVal(e.target.value); }}
              aria-label="Custom color picker"
              className="w-8 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer p-0.5 shrink-0" />
            <input type="text" value={inputVal} maxLength={7} spellCheck={false}
              onChange={e => { 
                const val = e.target.value.toLowerCase();
                setInputVal(val); 
                if (isValidHex(val)) setSelected(val); 
              }}
              placeholder="#rrggbb"
              aria-label="Hex color input"
              className={`flex-1 px-2 py-1 text-[10px] font-mono bg-zinc-800 border rounded text-zinc-100 outline-none transition-colors ${
                isValidHex(inputVal) ? 'border-zinc-600 focus:border-pink-500/60' : 'border-red-500/60'
              }`} />
            <button type="button" onClick={() => commit(inputVal)} disabled={!isValidHex(inputVal)}
              className="px-2 py-1 text-[9px] font-mono bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors shrink-0">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
