// OpenAI client factory.
// The API key is fetched from AWS Secrets Manager on the first invocation
// and cached in module scope for subsequent warm-Lambda calls.
// Secret format: { "apiKey": "sk-..." }
//
// LOCAL DEV SHORTCUT:
// Set OPENAI_API_KEY_OVERRIDE in backend/env.local.json when running
// `sam local start-api` to skip Secrets Manager entirely.
// Never set this variable in production.

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import OpenAI from 'openai';

const client = new SecretsManagerClient({});
let cachedClient = null;

export async function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  // Local dev shortcut — bypasses Secrets Manager when key is injected directly
  const directKey = process.env.OPENAI_API_KEY_OVERRIDE;
  if (directKey) {
    console.warn('[openai] Using OPENAI_API_KEY_OVERRIDE — local dev only');
    cachedClient = new OpenAI({ apiKey: directKey });
    return cachedClient;
  }

  const secretName = process.env.OPENAI_SECRET_NAME;
  if (!secretName) throw new Error('OPENAI_SECRET_NAME env var is not set');

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );

  const secret = JSON.parse(response.SecretString ?? '{}');
  if (!secret.apiKey) throw new Error('Secret is missing apiKey field');

  cachedClient = new OpenAI({ apiKey: secret.apiKey });
  return cachedClient;
}
