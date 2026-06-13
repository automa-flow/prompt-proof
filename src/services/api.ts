// ---------------------------------------------------------------------------
// AI API service — thin fetch wrapper for the backend Lambda.
// All calls are gated by env.enableAi; the function throws if AI is disabled,
// so callers should only invoke this when the flag is true.
// ---------------------------------------------------------------------------

import { env } from '../config/env';

type AiAction = 'feedback' | 'clarify' | 'refine';

/**
 * POST to the backend /ai endpoint.
 * Throws if AI features are disabled or the request fails.
 * Error messages never include raw server response bodies.
 */
export async function callAI(action: AiAction, payload: unknown): Promise<unknown> {
  if (!env.enableAi || env.apiBaseUrl === null) {
    throw new Error('AI features are not enabled');
  }

  if (
    payload !== null &&
    typeof payload === 'object' &&
    'idea' in payload &&
    typeof (payload as Record<string, unknown>).idea === 'string' &&
    ((payload as Record<string, unknown>).idea as string).length > 500
  ) {
    throw new Error('Idea too long (max 500 characters)');
  }

  const response = await fetch(`${env.apiBaseUrl}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload as Record<string, unknown> }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}
