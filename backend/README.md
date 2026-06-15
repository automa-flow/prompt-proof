<div align="center">

# 🔌 prompt-proof · backend

### Optional serverless layer for AI analysis & anonymous analytics

A small AWS SAM stack you can bolt onto the [frontend](../README.md) to unlock LLM-written feedback and privacy-friendly usage stats. Skip it entirely and the app still runs as a pure client-side SPA.

</div>

---

## What's in the box

| Route | Function | Purpose |
|-------|----------|---------|
| `POST /ai` | `AiFunction` | Proxies idea analysis to OpenAI — `feedback` / `clarify` / `refine` |
| `POST /events` | `EventsFunction` | Ingests anonymous analytics events into DynamoDB |

The OpenAI API key is **never in the repository**. It lives in AWS Secrets Manager and is fetched at Lambda runtime.

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 22+

---

## First-time setup

**1. Create the OpenAI secret**

```bash
aws secretsmanager create-secret \
  --name prompt-proof/openai \
  --secret-string '{"apiKey":"sk-YOUR_KEY_HERE"}'
```

**2. Install dependencies**

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

| Parameter | Notes |
|-----------|-------|
| `OpenAISecretName` | Leave as `prompt-proof/openai` unless you named it differently above |
| `AllowedOrigins` | Your frontend URL, e.g. `https://yourdomain.com` (comma-separated for multiple) |
| `EventsTableName` | DynamoDB table name — defaults to `PromptProofEvents` |

The deploy output prints **`ApiBaseUrl`** — copy it into your frontend env:

```env
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
  "AiFunction":     { "OPENAI_SECRET_NAME": "prompt-proof/openai" },
  "EventsFunction": { "EVENTS_TABLE": "PromptProofEvents" }
}
```

Your local AWS profile needs access to Secrets Manager and DynamoDB (or use DynamoDB Local).

---

## Rotating the OpenAI key

```bash
aws secretsmanager put-secret-value \
  --secret-id prompt-proof/openai \
  --secret-string '{"apiKey":"sk-NEW_KEY_HERE"}'
```

The Lambda module-level cache refreshes on the next cold start. To force an immediate refresh, redeploy or trigger a new Lambda execution environment from the AWS console.

---

## Security posture

- **CORS** is restricted to the origins in `AllowedOrigins` — other origins are rejected by API Gateway.
- **Throttling** — API Gateway burst 5 req/s, rate 2 req/s.
- **Hard concurrency cap** — `AiFunction` runs with `ReservedConcurrentExecutions: 3`, limiting simultaneous OpenAI calls even if a scripted client bypasses the throttle.
- **Input validation** — `idea` capped at 500 chars; `weakAreas` at 8 items, each `explanation` ≤ 300 chars — prevents token-amplification.
- **No leaky errors** — responses never include stack traces or internal detail.
- **No idea text stored** — analytics events hold only scores, zones, and lengths.
- **Auto-expiry** — events self-delete after 90 days via DynamoDB TTL (`expiresAt`).
- `backend/.env` and `samconfig.toml` are git-ignored. Never commit secrets.

### 💸 Cost protection (important for public deployments)

CORS only restricts browsers — direct scripted requests bypass it. These are your real backstops:

- **OpenAI hard spending limit** — set a monthly hard cap in the [OpenAI dashboard](https://platform.openai.com/account/billing/limits). This is the single most important control.
- **AWS Budget alarm** — create a $5–10 monthly budget alert in the [AWS Billing console](https://console.aws.amazon.com/billing/home#/budgets).
- The reserved concurrency and throttle settings above limit the blast radius if someone does find the endpoint.
