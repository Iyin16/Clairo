# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (not used by Clario)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)

## Artifacts

### Clario (react-vite) — `/`
A single-page message clarity analyzer. Users paste any real-world message (job offers, WhatsApp messages, promotions, etc.) and get back:
- Message type (job offer / scam risk / informational / promotional / unknown)
- Risk level (low / medium / high)
- Missing information checklist
- Plain-language summary
- Safe recommendation

**Key files:**
- `artifacts/clario/src/pages/home.tsx` — main UI page
- `artifacts/clario/src/App.tsx` — router setup
- `artifacts/api-server/src/routes/analyze.ts` — AI analysis route

### API Server (express) — `/api`
Serves all API routes:
- `GET /api/healthz` — health check
- `POST /api/analyze` — message analysis using OpenAI gpt-5.2

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/clario run dev` — run frontend locally

## API Contract

`POST /api/analyze` — accepts `{ input: string }` (max 5000 chars), always returns HTTP 200 with:
```json
{
  "type": "job offer | scam risk | informational | promotional | unknown",
  "riskLevel": "low | medium | high",
  "observations": ["string"],
  "summary": "string",
  "action": "string"
}
```

**Edge case behaviour (all return HTTP 200 with the fallback shape):**
- Missing, null, empty, or non-string `input` → safe fallback JSON (no crash)
- Input trimmed and capped at 5000 characters
- SQL injection / special characters treated as plain text
- AI parse failure → safe fallback JSON

**data-testid inventory:**
| Element | `data-testid` |
|---|---|
| Page heading | `heading-title` |
| Subtitle | `text-subtitle` |
| Textarea | `input-message` |
| Analyze button | `button-analyze` |
| Error state | `status-error` |
| Results wrapper | `section-results` |
| Type card | `card-type` / `text-type` |
| Risk card | `card-risk` / `text-risk-level` |
| Observations | `card-observations` / `text-observation-{n}` |
| Summary | `card-summary` / `text-summary` |
| Action | `card-action` / `text-action` |

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy base URL (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI proxy key (auto-provisioned)
- `SESSION_SECRET` — session secret (available, not currently used)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
