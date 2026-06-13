import { useState } from 'react';
import { Lightbulb } from 'lucide-react';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
}

/**
 * Step 1 — collect the user's project idea as free text.
 * Responsibility: render a single textarea + submit button;
 * emit the trimmed text via `onSubmit`. No scoring logic here.
 */
export function IdeaInput({ onSubmit }: IdeaInputProps) {
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="text-amber-500 shrink-0" size={28} />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI-Era Idea Filter</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            A structured checklist to stress-test your side-project idea.
          </p>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed">
        This tool asks ~8 questions about your idea's resilience to AI and platform
        risk, then shows a simple score with an explanation of the weakest points.
        <br />
        <span className="text-gray-400">
          No accounts, no data sent anywhere — everything stays in your browser.
        </span>
      </p>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="idea-input"
          className="text-sm font-medium text-gray-700"
        >
          Describe your idea in one or two sentences
        </label>
        <textarea
          id="idea-input"
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900
                     placeholder-gray-400 text-sm focus:outline-none focus:ring-2
                     focus:ring-indigo-500 focus:border-transparent resize-none"
          placeholder="e.g. A browser extension that summarises Hacker News threads using a local AI model."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(value)}
        className="self-end px-6 py-2.5 rounded-lg text-sm font-medium
                   bg-indigo-600 text-white hover:bg-indigo-700
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        Start evaluation →
      </button>
    </div>
  );
}
