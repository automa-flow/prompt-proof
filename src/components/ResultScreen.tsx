import type { ScoreResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { WeakAreaCard } from './WeakAreaCard';
import { DismissibleBanner } from './DismissibleBanner';
import { CheckCircle2, RotateCcw, Sparkles, Wand2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { env } from '../config/env';
import { track } from '../services/analytics';
import { useAiAction } from '../hooks/useAiAction';

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
 *
 * When AI is enabled (env.enableAi):
 *  - "Refine idea" button near the idea text → calls action='refine'
 *  - "Get AI analysis" button below weak areas → calls action='feedback'
 */
export function ResultScreen({ idea, result, onRestart }: ResultScreenProps) {
  const feedback = useAiAction('feedback', 'Could not get AI analysis. Please try again.');
  const refine = useAiAction('refine', 'Could not refine idea. Please try again.');

  const handleFeedback = async () => {
    track('ai_feedback_requested', { zone: result.zone, score: result.totalScore });
    await feedback.run({
      idea,
      totalScore: result.totalScore,
      zone: result.zone,
      weakAreas: result.weakAreas.map((a) => ({
        questionId: a.questionId,
        explanation: a.explanation,
        normalizedScore: a.normalizedScore,
      })),
    });
  };

  const handleRefine = async () => {
    track('idea_refined', { zone: result.zone });
    await refine.run({
      idea,
      zone: result.zone,
      weakAreas: result.weakAreas.map((a) => a.questionId),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-50">Evaluation Result</h2>
        {idea && (
          <div className="flex items-start justify-between gap-2 mt-1">
            <p className="text-sm text-gray-400 italic">"{idea}"</p>
            {env.enableAi && refine.state === 'idle' && (
              <button
                type="button"
                onClick={handleRefine}
                className="btn-ghost flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
              >
                <Wand2 size={12} />
                Refine idea
              </button>
            )}
            {env.enableAi && refine.state === 'loading' && (
              <span className="text-xs text-indigo-400 animate-pulse shrink-0">Refining…</span>
            )}
          </div>
        )}

        {/* Refine result */}
        {refine.state === 'done' && refine.data && (
          <div className="mt-3 rounded-lg border border-indigo-800/50 bg-indigo-950/40 p-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-indigo-300 uppercase tracking-wide">Refined formulation</p>
            <p className="text-sm text-gray-100 font-medium leading-snug">{refine.data.refinedIdea}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{refine.data.aiRiskNotes}</p>
            <button
              type="button"
              onClick={refine.reset}
              className="self-end flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <X size={11} /> Dismiss
            </button>
          </div>
        )}
        {refine.state === 'error' && refine.error && (
          <div className="mt-2">
            <DismissibleBanner message={refine.error} onDismiss={refine.reset} />
          </div>
        )}
      </div>

      {/* Gauge + summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <ScoreGauge score={result.totalScore} zone={result.zone} />
        <p className="text-sm text-gray-400 leading-relaxed sm:pt-4">
          {ZONE_SUMMARIES[result.zone]}
        </p>
      </div>

      {/* Weak areas */}
      {result.weakAreas.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Areas to strengthen
          </h3>
          {result.weakAreas.map((area, i) => (
            <WeakAreaCard key={area.questionId} weakArea={area} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="success-card">
          <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          <p className="text-sm text-gray-300">
            No weak areas detected — all dimensions scored above the threshold.
          </p>
        </div>
      )}

      {/* AI feedback — below weak areas, above disclaimer */}
      {env.enableAi && (
        <>
          {feedback.state === 'idle' && (
            <button
              type="button"
              onClick={handleFeedback}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles size={14} />
              Get AI analysis
            </button>
          )}
          {feedback.state === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-indigo-400">
              <span className="animate-pulse">●</span>
              Analysing…
            </div>
          )}
          {feedback.state === 'done' && feedback.data && (
            <div className="rounded-lg border border-indigo-800/50 bg-indigo-950/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  AI Analysis
                </p>
                <button
                  type="button"
                  onClick={feedback.reset}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-gray-300 [&_ul]:pl-4 [&_li]:mb-1">
                <ReactMarkdown>{feedback.data.markdown}</ReactMarkdown>
              </div>
            </div>
          )}
          {feedback.state === 'error' && feedback.error && (
            <DismissibleBanner message={feedback.error} onDismiss={feedback.reset} />
          )}
        </>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-4">
        This score is a structured thinking aid, not a verdict. It reflects the
        answers you provided and the weights in the current question config. Use
        it to identify blind spots, not to get a go / no-go decision.{' '}
        No idea text is stored or sent to any server.
      </p>

      {/* Restart */}
      <button
        type="button"
        onClick={onRestart}
        className="btn-secondary"
      >
        <RotateCcw size={15} />
        Evaluate another idea
      </button>
    </div>
  );
}
