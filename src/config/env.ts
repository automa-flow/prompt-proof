// ---------------------------------------------------------------------------
// Feature-flag configuration — reads Vite env vars at build time.
// All AI and analytics features are disabled unless explicitly opted in
// via environment variables (set in your private deploy, never in the repo).
// ---------------------------------------------------------------------------

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** Backend API base URL, or null when not configured. */
const apiBaseUrl: string | null =
  rawApiBaseUrl && rawApiBaseUrl.trim() !== '' ? rawApiBaseUrl.trim() : null;

/** AI features are enabled only when both flag and API URL are present. */
const enableAi: boolean =
  import.meta.env.VITE_ENABLE_AI === 'true' && apiBaseUrl !== null;

/** Analytics is enabled only when both flag and API URL are present. */
const enableAnalytics: boolean =
  import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && apiBaseUrl !== null;

if (import.meta.env.DEV && apiBaseUrl !== null) {
  if (!apiBaseUrl.startsWith('https://') && !apiBaseUrl.startsWith('http://localhost')) {
    console.warn(
      '[prompt-proof] API base URL should use HTTPS in production. Got:',
      apiBaseUrl,
    );
  }
}

export const env = {
  apiBaseUrl,
  enableAi,
  enableAnalytics,
} as const;
