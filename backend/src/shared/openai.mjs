// OpenAI client factory.
// The API key is fetched from AWS Secrets Manager on the first invocation
// and cached in module scope for subsequent warm-Lambda calls.
// Secret format: { "apiKey": "sk-..." }

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import OpenAI from 'openai';

const client = new SecretsManagerClient({});
let cachedClient = null;

export async function getOpenAIClient() {
  if (cachedClient) return cachedClient;

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
