# Architecture

**AI-Era Idea Filter** is a browser-only React SPA that stress-tests side-project ideas against AI substitution and platform risk. Users describe an idea, answer 8 weighted questions, and receive a 0–100 score, a risk zone, and prioritised weak-area recommendations. No accounts, no backend — all state lives in the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 (PostCSS + Autoprefixer) |
| Icons | Lucide React |
| Testing | Vitest 4 + Testing Library + JSDOM |
| Linting | ESLint 10 + typescript-eslint |

---

## File Structure

```
src/
├── App.tsx                 # Root — orchestrates three-stage quiz flow
├── main.tsx                # React root mount
├── index.css               # Tailwind layers; all design tokens in @layer components
├── types/index.ts          # All TypeScript interfaces and types
├── config/questions.ts     # 8 questions + scoring thresholds (content config)
├── logic/scoring.ts        # Pure calculateScore() + normalisation helpers
├── hooks/useQuiz.ts        # Finite state machine + quiz flow transitions
└── components/
    ├── IdeaInput.tsx       # Stage 1 — textarea input
    ├── QuestionBlock.tsx   # Stage 2 — per-question widget renderer
    ├── ResultScreen.tsx    # Stage 3 — score, zone, weak-area recommendations
    ├── ScoreGauge.tsx      # SVG circular gauge (pure presentational)
    └── WeakAreaCard.tsx    # Single weak-area card (pure presentational)
docs/
└── architecture.md         # This file
src/test/
├── setup.ts                # Vitest setup (@testing-library/jest-dom)
└── scoring.test.ts         # 20+ unit tests for calculateScore()
```

---

## Quiz Flow — Finite State Machine

The app has exactly three stages managed by `useQuiz`:

```
┌──────────┐  submitIdea()  ┌────────────────────────┐  last answer  ┌──────────┐
│   idea   │ ─────────────► │  questions (index 0..N) │ ────────────► │  result  │
└──────────┘                └────────────────────────┘               └──────────┘
                                      ▲  goBack()  │
                                      └────────────┘
```

`QuizStep` is a discriminated union:

```ts
| { stage: 'idea' }
| { stage: 'questions'; questionIndex: number }
| { stage: 'result'; result: ScoreResult }
```

`useQuiz` owns all state (idea text, answers array, current step) and exposes pure transition functions (`submitIdea`, `answerQuestion`, `goBack`, `restart`). `App.tsx` only routes rendering — no business logic lives there.

---

## Scoring Logic

**File:** `src/logic/scoring.ts`  
**Function:** `calculateScore(answers, questions): ScoreResult`

All answer types are normalised to `[0, 1]` before scoring:

| Answer type | Normalisation |
|---|---|
| `scale` (direction `positive`) | `value / 10` |
| `scale` (direction `negative`) | `1 - value / 10` |
| `yes_no` | `true → 1`, `false → 0` |
| `multiple_choice` | `option.normalizedScore` |

Weighted total:

$$\text{totalScore} = \frac{\sum_{i} (\text{normalizedScore}_i \times \text{weight}_i)}{\sum_{i} \text{weight}_i} \times 100$$

**Zone boundaries:**

| Zone | Score range |
|---|---|
| `red` | 0–39 |
| `yellow` | 40–69 |
| `green` | 70–100 |

Questions with `normalizedScore < 0.4` are collected as `weakAreas`, sorted worst-first, and each carries a human-readable `explanation` from the question config.

The function is **pure and side-effect-free**, making it trivially testable.

---

## Question Configuration

**File:** `src/config/questions.ts`

All content (question text, weights, answer types, explanations) is defined here. The scoring and rendering layers are fully decoupled from wording — changing a question's weight or text requires no code changes elsewhere.

| # | Dimension | Type | Weight | Direction |
|---|---|---|---|---|
| 1 | AI Substitutability | scale | 20 | negative |
| 2 | Platform Dependency | scale | 15 | negative |
| 3 | Unique Moat | scale | 15 | positive |
| 4 | Audience Clarity | scale | 10 | positive |
| 5 | Distribution Path | yes_no | 15 | — |
| 6 | Monetisation Plan | multiple_choice | 10 | — |
| 7 | Time to Value | scale | 10 | positive |
| 8 | Founder Fit | scale | 5 | positive |

Constants: `WEAK_AREA_THRESHOLD = 0.4`, `RED_MAX = 40`, `YELLOW_MAX = 70`.

---

## Component Responsibilities

| Component | Stage | Responsibility |
|---|---|---|
| `App.tsx` | all | Reads quiz state, routes to stage component, passes callbacks |
| `IdeaInput` | 1 | Textarea + submit button; emits `onSubmit(idea)` |
| `QuestionBlock` | 2 | Renders scale / yes_no / multiple_choice widget; emits `onAnswer(answer)` |
| `ResultScreen` | 3 | Shows idea, score gauge, zone summary, weak areas, restart |
| `ScoreGauge` | 3 | Animated SVG circular gauge; pure presentational |
| `WeakAreaCard` | 3 | Score bar + explanation for one weak dimension; pure presentational |

---

## Styling

Design tokens for all reusable UI elements are centralised in `src/index.css` under `@layer components`. Changing the look of a button or card means editing one place.

Key classes:

| Class | Element |
|---|---|
| `.btn-primary` | Primary action buttons (indigo) |
| `.btn-secondary` | Secondary / outline buttons |
| `.btn-ghost` | Icon-only ghost buttons |
| `.choice-option` / `.choice-option-active` | Multiple-choice answer buttons |
| `.choice-yn` | Yes / No answer buttons |
| `.card` | Main content card |
| `.input-base` | Textarea / text inputs |
| `.progress-track` / `.progress-fill` | Step progress bar |
| `.weak-card` / `.success-card` | Result section cards |

**Theme:** dark (gray-950 background, gray-900 card, indigo-600 accent).

---

## Testing

**File:** `src/test/scoring.test.ts`

Unit tests cover the pure scoring function only:

- Perfect score (all answers positive) → 100, zone green
- Worst-case score → 0, zone red
- Scale direction inversion (negative dimensions)
- Yes/No and multiple-choice normalisation
- Weak area detection, threshold, sort order, explanations
- Zone boundary values (39 → red, 40 → yellow, 70 → green)
- Edge cases: no answers, unknown question IDs

Run with `npm test`.

---

## Key Design Decisions

1. **Finite state machine over boolean flags** — Three discrete stages (`idea / questions / result`) prevent impossible states and simplify reasoning about transitions.
2. **Pure scoring function** — `calculateScore` has no side effects; it's independently testable and can be reused or ported without touching React.
3. **Content isolated in config** — Question text, weights, and explanations live in one file. The scoring algorithm and UI components know nothing about specific questions.
4. **Design tokens in one CSS file** — `@layer components` in `index.css` is the single source of truth for reusable element styles. No design decisions spread across component files.
5. **Browser-only, no backend** — Simplest possible deployment; no auth, no database, no API.
