import type { WeakArea } from '../types';
import { AlertTriangle } from 'lucide-react';

interface WeakAreaCardProps {
  weakArea: WeakArea;
  rank: number;
}

/**
 * Displays a single weak-area finding from the score result.
 * Responsibility: show the question, its normalised score bar, and the
 * human-readable explanation from the config. Read-only — no events.
 */
export function WeakAreaCard({ weakArea, rank }: WeakAreaCardProps) {
  const pct = Math.round(weakArea.normalizedScore * 100);

  return (
    <div className="weak-card">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
            Weak area #{rank}
          </span>
          <p className="text-sm font-medium text-gray-200 leading-snug">
            {weakArea.questionText}
          </p>
        </div>
      </div>

      {/* Mini score bar */}
      <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-red-900/40">
          <div
            className="h-1.5 rounded-full bg-red-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-red-400 font-medium shrink-0">{pct}%</span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{weakArea.explanation}</p>
    </div>
  );
}
