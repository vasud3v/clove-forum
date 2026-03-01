import { memo } from 'react';

interface CharacterCounterProps {
  count: number;
  maxCount: number;
}

const CharacterCounter = memo(({ count, maxCount }: CharacterCounterProps) => {
  const percentage = (count / maxCount) * 100;
  const isWarning = percentage >= 90;
  const isNearLimit = percentage >= 95;

  return (
    <span 
      className={`text-[9px] font-mono ${
        isNearLimit 
          ? 'text-red-400 font-bold animate-pulse' 
          : isWarning 
            ? 'text-amber-400 font-bold' 
            : 'text-forum-muted/30'
      }`}
      aria-live="polite"
      aria-label={`${count} of ${maxCount} characters used`}
    >
      {count.toLocaleString()} / {maxCount.toLocaleString()}
      {isWarning && ` (${Math.round(percentage)}%)`}
    </span>
  );
});

CharacterCounter.displayName = 'CharacterCounter';

export default CharacterCounter;
