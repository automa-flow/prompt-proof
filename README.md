# prompt-proof — AI-Era Idea Filter

A browser-only SPA that stress-tests side-project ideas against AI substitution and platform risk. Describe your idea, answer 8 weighted questions, receive a 0–100 score, a risk zone, and prioritised weak-area recommendations.

**No accounts. No backend required. All state lives in the browser.**

Optionally self-host the backend to unlock AI-powered analysis (OpenAI) and privacy-friendly analytics — see below.

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm test        # unit tests
npm run build   # production build
```

---

## Optional AI & Analytics (self-hosted)

AI features and analytics are **off by default**. The public build works identically without them.

To enable them on your own deployment:

1. Deploy the backend (see [backend/README.md](backend/README.md)) — you'll get an API base URL.
2. Copy `.env.example` to `.env.local` and fill in:

   ```
   VITE_API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com
   VITE_ENABLE_AI=true
   VITE_ENABLE_ANALYTICS=true
   ```

3. Rebuild the frontend — AI buttons and analytics tracking activate automatically.

Without these variables set, the app is a pure client-side SPA with zero network calls.

---

## Security

- **OpenAI key** is stored in AWS Secrets Manager and never appears in the repository or frontend bundle. See [backend/README.md](backend/README.md) for rotation instructions.
- **CORS** on the backend is restricted to the origins you configure — requests from other origins are rejected by API Gateway.
- **Throttling**: API Gateway limits burst to 10 req/s and rate to 5 req/s to protect the OpenAI key from abuse.
- **No PII in analytics**: only scores, zones, and idea length are tracked — never the idea text itself.
- **Input validation**: idea text is capped at 500 characters both client-side and server-side; invalid requests return `400` with no internal detail.
- To report a security issue, open a private GitHub Security Advisory on this repository.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
