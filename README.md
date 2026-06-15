<div align="center">

# 🧪 prompt-proof

### Will your side-project idea survive the AI era?

Describe an idea, answer eight weighted questions, and get an honest **0–100 resilience score** — with the risk zone and the weak spots worth fixing first.

<br />

![type](https://img.shields.io/badge/type-weekend%20experiment-8b5cf6)
![stack](https://img.shields.io/badge/React%2019-vite-0ea5e9)
![lang](https://img.shields.io/badge/TypeScript-3178c6)
![backend](https://img.shields.io/badge/optional%20backend-AWS%20Lambda-f59e0b)
![privacy](https://img.shields.io/badge/no%20account-no%20tracking-22c55e)

</div>

---

## Why this exists

A small weekend build — part scratch-an-itch, part craftsmanship playground.

Every other day there's a new "AI just ate this entire category" headline. So the question got concrete: **if I poured a few months of evenings into an idea, would AI make it irrelevant before it ever found users?** prompt-proof turns that anxiety into a quick, structured gut-check.

It's intentionally tiny in scope but built like it isn't — typed end to end, unit-tested scoring, a clean serverless backend, and security defaults that assume the internet is hostile. Think of it as a postcard from the workbench rather than a product launch.

## What it does

You walk through eight questions covering the dimensions that actually decide whether a small project lives or dies:

| # | Dimension | Why it matters |
|---|-----------|----------------|
| 1 | **AI substitutability** | Can a chatbot already do the core job? |
| 2 | **Platform dependency** | One API away from extinction? |
| 3 | **Unique moat** | Does your edge compound, or get copied? |
| 4 | **Audience clarity** | Can you name the exact person who needs this? |
| 5 | **Distribution path** | A real route to the first 100 users? |
| 6 | **Monetisation path** | A plausible line from value to revenue? |
| 7 | **Time to value** | How fast is the "aha" moment? |
| 8 | **Founder fit** | Skills × interest × sustainable time |

Answers are normalised, weighted, and rolled into a single score with a **red / yellow / green** verdict. Anything below the threshold gets surfaced as a prioritised **weak area** with specific advice — sorted worst-first, so you know what to fix next.

> The scoring engine is a pure, side-effect-free function (`src/logic/scoring.ts`) with its own test suite — swap weights, tweak thresholds, or rewrite the questions in `src/config/questions.ts` without touching the UI.

## Highlights

- ⚡ **Instant, offline-first** — the default build is a pure client-side SPA. No account, no backend, no network calls. All state lives in the browser.
- 🔌 **Optional AI layer** — self-host the backend to add LLM-written feedback, idea clarification, and refinement suggestions.
- 🔒 **Privacy by default** — analytics (when enabled) capture only scores, zones, and lengths. The idea text itself is never stored or transmitted to analytics.
- 🧱 **Typed & tested** — React 19 + TypeScript, Tailwind for styling, Vitest for the logic that matters.

---

## Quick start

```bash
npm install
npm run dev          # → http://localhost:5173
```

```bash
npm test             # unit tests (scoring engine)
npm run build        # production build
npm run lint         # eslint
```

That's the whole experience — no keys, no config, no signup.

---

## Optional: AI & analytics

AI features and analytics are **off by default**, and the public build behaves identically without them. To light them up on your own deployment:

1. Deploy the backend — see [backend/README.md](backend/README.md). You'll get an API base URL.
2. Copy `.env.example` to `.env.local`:

   ```env
   VITE_API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com
   VITE_ENABLE_AI=true
   VITE_ENABLE_ANALYTICS=true
   ```

3. Rebuild — the AI buttons and analytics activate automatically.

With those variables unset, the app makes **zero network requests**.

---

## Architecture

```
prompt-proof/
├── src/                 # React 19 + TypeScript SPA
│   ├── config/          # questions & weights (content lives here)
│   ├── logic/           # pure scoring engine (+ tests)
│   ├── components/      # IdeaInput · QuestionBlock · ScoreGauge · ResultScreen …
│   ├── hooks/           # useQuiz — flow & state
│   └── services/        # api & analytics clients (no-ops when disabled)
└── backend/             # optional AWS SAM serverless stack
    ├── POST /ai         # OpenAI proxy: feedback · clarify · refine
    └── POST /events     # anonymous analytics → DynamoDB (90-day TTL)
```

The frontend stands entirely on its own. The backend is a clean, optional bolt-on: two small Lambda functions behind API Gateway, with the OpenAI key kept in AWS Secrets Manager — never in the repo or the bundle.

---

## Security posture

Even a weekend toy gets the seatbelts:

- **Secrets stay secret** — the OpenAI key lives in AWS Secrets Manager, fetched at runtime; it never touches the repo or the frontend bundle.
- **CORS locked down** — API Gateway only accepts the origins you configure.
- **Throttled & capped** — request-rate throttling plus reserved Lambda concurrency limit the blast radius if the endpoint is found.
- **No PII** — analytics track scores, zones, and lengths only; never the idea text. Events auto-expire after 90 days.
- **Validated input** — idea text is capped at 500 chars client- and server-side; bad requests get a clean `400` with no internal detail leaked.

To report a security issue, open a private GitHub Security Advisory on this repository. Full deployment and cost-protection notes live in [backend/README.md](backend/README.md).

---

<div align="center">
<sub>A small experiment in shipping something correct, calm, and self-contained. Fork it, score your own ideas, and rewrite the questions to fit your world.</sub>
</div>
