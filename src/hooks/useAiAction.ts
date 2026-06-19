import { useState } from 'react';
import { callAI } from '../services/api';
import type { AiAction, AiResponseMap } from '../services/api';

// ---------------------------------------------------------------------------
// useAiAction — shared state machine for a single optional AI call.
//
// IdeaInput (clarify) and ResultScreen (feedback, refine) all follow the same
// idle → loading → done | error lifecycle. This hook owns that plumbing so the
// components only render results. Analytics tracking stays at the call site so
// each event name remains explicit and greppable.
// ---------------------------------------------------------------------------

export type AiActionState = 'idle' | 'loading' | 'done' | 'error';

interface UseAiActionReturn<A extends AiAction> {
  /** Current lifecycle state. */
  state: AiActionState;
  /** The typed response once state === 'done', otherwise null. */
  data: AiResponseMap[A] | null;
  /** User-facing error message once state === 'error', otherwise null. */
  error: string | null;
  /** Fire the call. Resolves to the response, or null if it failed. */
  run: (payload: Record<string, unknown>) => Promise<AiResponseMap[A] | null>;
  /** Reset back to the idle state, clearing data and error. */
  reset: () => void;
}

/**
 * @param action       Which backend AI action to invoke.
 * @param errorMessage User-facing message shown when the call fails.
 */
export function useAiAction<A extends AiAction>(
  action: A,
  errorMessage: string,
): UseAiActionReturn<A> {
  const [state, setState] = useState<AiActionState>('idle');
  const [data, setData] = useState<AiResponseMap[A] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    payload: Record<string, unknown>,
  ): Promise<AiResponseMap[A] | null> => {
    setState('loading');
    setError(null);
    try {
      const response = await callAI(action, payload);
      setData(response);
      setState('done');
      return response;
    } catch {
      setError(errorMessage);
      setState('error');
      return null;
    }
  };

  const reset = () => {
    setState('idle');
    setData(null);
    setError(null);
  };

  return { state, data, error, run, reset };
}
