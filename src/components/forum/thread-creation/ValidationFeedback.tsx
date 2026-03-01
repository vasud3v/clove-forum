import { AlertCircle, AlertTriangle, Info, Lightbulb, CheckCircle } from 'lucide-react';
import type { ThreadValidationError } from '@/lib/threadValidation';

interface ValidationFeedbackProps {
  errors?: ThreadValidationError[];
  warnings?: ThreadValidationError[];
  suggestions?: string[];
  className?: string;
}

export function ValidationFeedback({ errors = [], warnings = [], suggestions = [], className = '' }: ValidationFeedbackProps) {
  if (errors.length === 0 && warnings.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {errors.map((error, i) => (
        <div key={`error-${i}`} className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono font-bold text-red-400">{error.message}</p>
              {error.suggestion && (
                <p className="text-[10px] font-mono text-red-400/70 mt-1">{error.suggestion}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Warnings */}
      {warnings.map((warning, i) => (
        <div key={`warning-${i}`} className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono font-bold text-orange-400">{warning.message}</p>
              {warning.suggestion && (
                <p className="text-[10px] font-mono text-orange-400/70 mt-1">{warning.suggestion}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono font-bold text-blue-400 mb-1">Suggestions:</p>
              <ul className="space-y-1">
                {suggestions.map((suggestion, i) => (
                  <li key={i} className="text-[10px] font-mono text-blue-400/80">• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldValidationProps {
  error?: string;
  warning?: string;
  suggestion?: string;
}

export function FieldValidation({ error, warning, suggestion }: FieldValidationProps) {
  if (!error && !warning && !suggestion) return null;

  return (
    <div className="mt-1 space-y-1">
      {error && (
        <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
      {warning && !error && (
        <p className="text-[10px] text-orange-400 font-mono flex items-center gap-1">
          <AlertTriangle size={10} /> {warning}
        </p>
      )}
      {suggestion && !error && !warning && (
        <p className="text-[9px] text-blue-400/70 font-mono flex items-center gap-1">
          <Info size={9} /> {suggestion}
        </p>
      )}
    </div>
  );
}

interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number;
}

export function CharacterCounter({ current, max, warningThreshold = 0.9 }: CharacterCounterProps) {
  const percentage = current / max;
  const isWarning = percentage >= warningThreshold;
  const isError = current > max;

  return (
    <span className={`text-[9px] font-mono transition-colors ${
      isError 
        ? 'text-red-400 font-bold' 
        : isWarning 
        ? 'text-orange-400' 
        : 'text-forum-muted/40'
    }`}>
      {current.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
}

interface QualityIndicatorProps {
  score: number; // 0-100
  label?: string;
}

export function QualityIndicator({ score, label = 'Quality' }: QualityIndicatorProps) {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    if (score >= 60) return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
    if (score >= 40) return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    return 'text-red-400 border-red-400/30 bg-red-400/10';
  };

  const getIcon = () => {
    if (score >= 80) return <CheckCircle size={12} />;
    if (score >= 60) return <Info size={12} />;
    if (score >= 40) return <AlertTriangle size={12} />;
    return <AlertCircle size={12} />;
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-mono font-bold ${getColor()}`}>
      {getIcon()}
      <span>{label}: {score}%</span>
    </div>
  );
}
