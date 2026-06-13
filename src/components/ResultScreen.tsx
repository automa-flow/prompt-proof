import { useState } from 'react';
import type { AiFeedbackResponse, RefineResponse, ScoreResult } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { WeakAreaCard } from './WeakAreaCard';
import { CheckCircle2, RotateCcw, Sparkles, Wand2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { env } from '../config/env';
import { callAI } from '../services/api';
import { track } from '../services/analytics';

interface ResultScreenProps {
  idea: string;
  result: ScoreResult;
  onRestart: () => void;
}

type AiState = 'idle' | 'loading' | 'done' | 'error';

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
  const [feedbackState, setFeedbackState] = useState<AiState>('idle');
  const [feedbackMarkdown, setFeedbackMarkdown] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [refineState, setRefineState] = useState<AiState>('idle');
  const [refineResult, setRefineResult] = useState<{ refinedIdea: string; aiRiskNotes: string } | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);

  const handleFeedback = async () => {
    track('ai_feedback_requested', { zone: result.zone, score: result.totalScore });
    setFeedbackState('loading');
    setFeedbackError(null);
    try {
      const response = (await callAI('feedback', {
        idea,
        totalScore: result.totalScore,
        zone: result.zone,
        weakAreas: result.weakAreas.map((a) => ({
          questionId: a.questionId,
          explanation: a.explanation,
          normalizedScore: a.normalizedScore,
        })),
      })) as AiFeedbackResponse;
      setFeedbackMarkdown(response.markdown);
      setFeedbackState('done');
    } catch {
      setFeedbackState('error');
      setFeedbackError('Could not get AI analysis. Please try again.');
    }
  };

  const handleRefine = async () => {
    track('idea_refined', { zone: result.zone });
    setRefineState('loading');
    setRefineError(null);
    try {
      const response = (await callAI('refine', {
        idea,
        zone: result.zone,
        weakAreas: result.weakAreas.map((a) => a.questionId),
      })) as RefineResponse;
      setRefineResult(response);
      setRefineState('done');
    } catch {
      setRefineState('error');
      setRefineError('Could not refine idea. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-50">Evaluation Result</h2>
        {idea && (
          <div className="flex items-start justify-between gap-2 mt-1">
            <p className="text-sm text-gray-400 italic">"{idea}"</p>
            {env.enableAi && refineState === 'idle' && (
              <button
                type="button"
                onClick={handleRefine}
                className="btn-ghost flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
              >
                <Wand2 size={12} />
                Refine idea
              </button>
            )}
            {env.enableAi && refineState === 'loading' && (
              <span className="text-xs text-indigo-400 animate-pulse shrink-0">Refining…</span>
            )}
          </div>
        )}

        {/* Refine result */}
        {refineState === 'done' && refineResult && (
          <div className="mt-3 rounded-lg border border-indigo-800/50 bg-indigo-950/40 p-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-indigo-300 uppercase tracking-wide">Refined formulation</p>
            <p className="text-sm text-gray-100 font-medium leading-snug">{refineResult.refinedIdea}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{refineResult.aiRiskNotes}</p>
            <button
              type="button"
              onClick={() => { setRefineState('idle'); setRefineResult(null); }}
              className="self-end flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <X size={11} /> Dismiss
            </button>
          </div>
        )}
        {refineState === 'error' && refineError && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
            <p className="text-xs text-red-400">{refineError}</p>
            <button
              type="button"
              onClick={() => setRefineState('idle')}
              className="text-gray-500 hover:text-gray-300 ml-2"
            >
              <X size={13} />
            </button>
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
          {feedbackState === 'idle' && (
            <button
              type="button"
              onClick={handleFeedback}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles size={14} />
              Get AI analysis
            </button>
          )}
          {feedbackState === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-indigo-400">
              <span className="animate-pulse">●</span>
              Analysing…
            </div>
          )}
          {feedbackState === 'done' && feedbackMarkdown && (
            <div className="rounded-lg border border-indigo-800/50 bg-indigo-950/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  AI Analysis
                </p>
                <button
                  type="button"
                  onClick={() => { setFeedbackState('idle'); setFeedbackMarkdown(''); }}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-gray-300 [&_ul]:pl-4 [&_li]:mb-1">
                <ReactMarkdown>{feedbackMarkdown}</ReactMarkdown>
              </div>
            </div>
          )}
          {feedbackState === 'error' && feedbackError && (
            <div className="flex items-center justify-between rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
              <p className="text-xs text-red-400">{feedbackError}</p>
              <button
                type="button"
                onClick={() => setFeedbackState('idle')}
                className="text-gray-500 hover:text-gray-300 ml-2"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-4">
        This score is a structured thinking aid, not a verdict. It reflects the
        answers you provided and the weights in the current question config. Use
        it to identify blind spots, not to get a go / no-go decision.
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
