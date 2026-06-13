import type { ScoreResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { WeakAreaCard } from './WeakAreaCard';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface ResultScreenProps {
  idea: string;
  result: ScoreResult;
  onRestart: () => void;
}

const ZONE_SUMMARIES = {
  red: 'Several critical risk factors need attention before this idea is likely to survive the AI era. Review the weak areas below and consider pivoting or strengthening them.',
  yellow: 'The idea has potential, but a few dimensions need deliberate improvement. Use the weak areas below as your next action list.',
  green: 'Strong foundation! The idea shows good resilience to AI and platform risk. Keep an eye on the weak areas below as you execute.',
};

/**
 * Step 3 — display the final score, zone summary, and all weak-area
 * explanations. Also shows a restart button.
 * Responsibility: present results; delegate scoring details to ScoreGauge
 * and WeakAreaCard. No scoring logic here.
 */
export function ResultScreen({ idea, result, onRestart }: ResultScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Evaluation Result</h2>
        {idea && (
          <p className="text-sm text-gray-500 mt-1 italic">"{idea}"</p>
        )}
      </div>

      {/* Gauge + summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <ScoreGauge score={result.totalScore} zone={result.zone} />
        <p className="text-sm text-gray-600 leading-relaxed sm:pt-4">
          {ZONE_SUMMARIES[result.zone]}
        </p>
      </div>

      {/* Weak areas */}
      {result.weakAreas.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Areas to strengthen
          </h3>
          {result.weakAreas.map((area, i) => (
            <WeakAreaCard key={area.questionId} weakArea={area} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          <p className="text-sm text-gray-700">
            No weak areas detected — all dimensions scored above the threshold.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
        This score is a structured thinking aid, not a verdict. It reflects the
        answers you provided and the weights in the current question config. Use
        it to identify blind spots, not to get a go / no-go decision.
      </p>

      {/* Restart */}
      <button
        type="button"
        onClick={onRestart}
        className="flex items-center gap-2 self-start px-5 py-2.5 rounded-lg
                   border border-gray-300 text-sm font-medium text-gray-700
                   hover:bg-gray-50 transition-colors"
      >
        <RotateCcw size={15} />
        Evaluate another idea
      </button>
    </div>
  );
}
