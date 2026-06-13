// ---------------------------------------------------------------------------
// Analytics service — fire-and-forget event tracking.
// All calls are no-ops when env.enableAnalytics is false.
// No PII is ever collected: idea text must never be passed here.
// ---------------------------------------------------------------------------

import { env } from '../config/env';

const SESSION_KEY = 'pp_session_id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Track an analytics event. Silent no-op if analytics is disabled.
 * Never pass raw idea text as a prop — use length or derived values only.
 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!env.enableAnalytics || env.apiBaseUrl === null) return;

  const payload = {
    sessionId: getSessionId(),
    event,
    props,
    ts: Date.now(),
  };

  fetch(`${env.apiBaseUrl}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Swallow silently — analytics must never affect the user experience.
  });
}
