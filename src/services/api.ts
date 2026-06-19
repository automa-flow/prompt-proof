// ---------------------------------------------------------------------------
// AI API service — thin fetch wrapper for the backend Lambda.
// All calls are gated by env.enableAi; the function throws if AI is disabled,
// so callers should only invoke this when the flag is true.
// ---------------------------------------------------------------------------

import { env } from '../config/env';
import type {
  AiFeedbackResponse,
  ClarifyResponse,
  RefineResponse,
} from '../types';

/** Maps each AI action to the response shape the backend returns. */
export interface AiResponseMap {
  feedback: AiFeedbackResponse;
  clarify: ClarifyResponse;
  refine: RefineResponse;
}

export type AiAction = keyof AiResponseMap;

const MAX_IDEA_LEN = 500;

/** Narrow check for payloads carrying an over-length idea string. */
function ideaTooLong(payload: unknown): boolean {
  if (payload === null || typeof payload !== 'object' || !('idea' in payload)) {
    return false;
  }
  const idea = (payload as Record<string, unknown>).idea;
  return typeof idea === 'string' && idea.length > MAX_IDEA_LEN;
}

/**
 * POST to the backend /ai endpoint. The return type is inferred from `action`,
 * so callers get a typed response with no casting.
 * Throws if AI features are disabled or the request fails.
 * Error messages never include raw server response bodies.
 */
export async function callAI<A extends AiAction>(
  action: A,
  payload: Record<string, unknown>,
): Promise<AiResponseMap[A]> {
  if (!env.enableAi || env.apiBaseUrl === null) {
    throw new Error('AI features are not enabled');
  }

  if (ideaTooLong(payload)) {
    throw new Error(`Idea too long (max ${MAX_IDEA_LEN} characters)`);
  }

  const response = await fetch(`${env.apiBaseUrl}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  return response.json() as Promise<AiResponseMap[A]>;
}
