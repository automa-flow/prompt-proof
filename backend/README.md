# prompt-proof backend

AWS SAM backend providing two Lambda endpoints:

| Route | Function | Purpose |
|---|---|---|
| `POST /ai` | AiFunction | Proxies idea analysis to OpenAI (feedback / clarify / refine) |
| `POST /events` | EventsFunction | Ingests anonymous analytics events into DynamoDB |

The OpenAI API key is **never in the repository**. It lives in AWS Secrets Manager and is fetched at Lambda runtime.

---

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 22+

---

## First-time setup

### 1. Create the OpenAI secret

```bash
aws secretsmanager create-secret \
  --name prompt-proof/openai \
  --secret-string '{"apiKey":"sk-YOUR_KEY_HERE"}'
```

### 2. Install dependencies

```bash
cd backend
npm install
```

---

## Deploy

```bash
cd backend
sam build
sam deploy --guided
```

`--guided` walks you through the parameters on first deploy and saves them to `samconfig.toml` (git-ignored).

Key parameters:
- **OpenAISecretName** — leave as `prompt-proof/openai` unless you used a different name above
- **AllowedOrigins** — your frontend URL, e.g. `https://yourdomain.com` (comma-separated for multiple)
- **EventsTableName** — DynamoDB table name, default `PromptProofEvents`

The deploy output prints **ApiBaseUrl** — copy it to your frontend env:

```
VITE_API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com
VITE_ENABLE_AI=true
VITE_ENABLE_ANALYTICS=true
```

---

## Local development

```bash
cd backend
sam local start-api --env-vars env.json
```

Create `env.json` (git-ignored) with local overrides:

```json
{
  "AiFunction": {
    "OPENAI_SECRET_NAME": "prompt-proof/openai"
  },
  "EventsFunction": {
    "EVENTS_TABLE": "PromptProofEvents"
  }
}
```

Your local AWS profile must have access to Secrets Manager and DynamoDB (or use DynamoDB Local).

---

## Rotating the OpenAI key

```bash
aws secretsmanager put-secret-value \
  --secret-id prompt-proof/openai \
  --secret-string '{"apiKey":"sk-NEW_KEY_HERE"}'
```

The Lambda module-level cache will refresh on the next cold start. To force an immediate refresh, redeploy or use the AWS console to force a new Lambda execution environment.

---

## Security notes

- CORS is restricted to the origins in `AllowedOrigins` — requests from other origins are rejected by API Gateway.
- API Gateway throttle: burst 5 req/s, rate 2 req/s.
- `AiFunction` has `ReservedConcurrentExecutions: 3` — hard cap on simultaneous OpenAI calls even if throttle is bypassed by a scripted client.
- Input validation: `idea` capped at 500 chars; `weakAreas` at 8 items with each `explanation` ≤ 300 chars — prevents token-amplification attacks.
- Error responses never include stack traces or internal details.
- No idea text is stored — analytics events contain only scores, zones, and lengths.
- Analytics events auto-expire after 90 days via DynamoDB TTL (`expiresAt`).
- `backend/.env` and `samconfig.toml` are git-ignored; never commit secrets.

### Cost protection (important for public deployments)

CORS only restricts browsers — direct scripted requests bypass it. Use these as your real backstop:

- **OpenAI hard spending limit** — set a monthly hard cap in the [OpenAI dashboard](https://platform.openai.com/account/billing/limits). This is the most important control.
- **AWS Budget alarm** — create a $5–10 monthly budget alert in the [AWS Billing console](https://console.aws.amazon.com/billing/home#/budgets).
- The `ReservedConcurrentExecutions: 3` and throttle settings above limit blast radius if someone does find the endpoint.
