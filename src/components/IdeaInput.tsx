import { useState } from 'react';
import { Lightbulb, Sparkles, X } from 'lucide-react';
import { env } from '../config/env';
import { callAI } from '../services/api';
import { track } from '../services/analytics';
import type { ClarifyResponse } from '../types';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
}

type ClarifyState = 'idle' | 'loading' | 'done' | 'error';

/**
 * Step 1 — collect the user's project idea as free text.
 * Responsibility: render a single textarea + submit button;
 * emit the trimmed text via `onSubmit`. No scoring logic here.
 *
 * When AI is enabled (env.enableAi), also offers an optional "Clarify with AI"
 * step that surfaces 1-2 sharpening questions before the user proceeds.
 * The clarify flow is purely local — it never blocks the main submit path.
 */
export function IdeaInput({ onSubmit }: IdeaInputProps) {
  const [value, setValue] = useState('');
  const [clarifyState, setClarifyState] = useState<ClarifyState>('idle');
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  const canSubmit = value.trim().length > 0;

  const handleClarify = async () => {
    track('ai_clarify_requested');
    setClarifyState('loading');
    setClarifyError(null);
    try {
      const response = (await callAI('clarify', { idea: value.trim() })) as ClarifyResponse;
      setClarifyQuestions(response.questions ?? []);
      setClarifyState('done');
    } catch {
      setClarifyState('error');
      setClarifyError('Could not get clarifying questions. You can still continue.');
    }
  };

  const dismissClarify = () => {
    setClarifyState('idle');
    setClarifyQuestions([]);
    setClarifyError(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="text-amber-500 shrink-0" size={28} />
        <div>
          <h1 className="text-2xl font-semibold text-gray-50">AI-Era Idea Filter</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            A structured checklist to stress-test your side-project idea.
          </p>
        </div>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed">
        This tool asks ~8 questions about your idea's resilience to AI and platform
        risk, then shows a simple score with an explanation of the weakest points.
        <br />
        <span className="text-gray-500">
          No accounts, no data sent anywhere — everything stays in your browser.
        </span>
      </p>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="idea-input"
          className="text-sm font-medium text-gray-300"
        >
          Describe your idea in one or two sentences
        </label>
        <textarea
          id="idea-input"
          rows={4}
          className="input-base"
          placeholder="e.g. A browser extension that summarises Hacker News threads using a local AI model."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        {/* Clarify with AI — visible only when AI is enabled and there is input */}
        {env.enableAi && value.trim().length > 0 && clarifyState !== 'done' && (
          <button
            type="button"
            onClick={handleClarify}
            disabled={clarifyState === 'loading'}
            className="btn-ghost self-start flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
          >
            <Sparkles size={13} />
            {clarifyState === 'loading' ? 'Asking AI…' : 'Clarify with AI'}
          </button>
        )}

        {/* Clarify result */}
        {clarifyState === 'done' && clarifyQuestions.length > 0 && (
          <div className="relative rounded-lg border border-indigo-800/50 bg-indigo-950/40 p-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={dismissClarify}
              aria-label="Dismiss"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
            <p className="text-xs font-medium text-indigo-300">Consider before continuing:</p>
            <ul className="flex flex-col gap-1.5 pl-1">
              {clarifyQuestions.map((q, i) => (
                <li key={i} className="text-sm text-gray-300 leading-snug">
                  • {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clarify error */}
        {clarifyState === 'error' && clarifyError && (
          <div className="flex items-center justify-between rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
            <p className="text-xs text-red-400">{clarifyError}</p>
            <button
              type="button"
              onClick={dismissClarify}
              className="text-gray-500 hover:text-gray-300 ml-2"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(value)}
        className="btn-primary self-end"
      >
        Start evaluation →
      </button>
    </div>
  );
}
