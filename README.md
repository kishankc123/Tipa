This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI Inventory Assistant

A [CopilotKit](https://docs.copilotkit.ai) chat sidebar on every signed-in page (open it with the yellow button, bottom-right). It answers inventory questions using the app's existing API and shows results as UI cards inside the chat, not just text.

**What it can do** (read-only — it can't create, edit, or delete anything):

| Ask | Action | Renders |
|---|---|---|
| "How much milk do we have?" / "Is rice running low?" | `getStockLevel` | Stock card: total, reorder level, per-storage-place breakdown, low/out-of-stock badge |
| "How was this week?" | `getWeeklyActivitySummary` | Stat tiles + bar chart of logs per day for the last 7 days |
| "Show me the history of milk" | `getProductHistory` | List of the latest stock-log entries (when, where, how many, review status) |

### Setup

```bash
cp .env.local.example .env.local   # then set OPENAI_API_KEY
npm run dev
```

`OPENAI_API_KEY` is read server-side only. `OPENAI_MODEL` is an optional override. Next only reads `.env.local` when the dev server starts, so **restart `npm run dev` after creating or editing it**.

**Troubleshooting:** a browser console message like `Agent 'default' not found … No agents registered` means the runtime has no model, almost always a missing `OPENAI_API_KEY`. `/api/copilotkit` now answers 503 with the exact reason, and logs it in the dev-server terminal.

### How it's wired

```
Browser                                              Server
┌───────────────────────────────────────┐            ┌────────────────────────────┐
│ <CopilotSidebar> (chat UI)            │  messages  │ /api/copilotkit            │
│ useCopilotAction × 3 (the tools)      │ ─────────► │  1. checks the user's JWT  │
│                                       │            │  2. CopilotRuntime +       │──► OpenAI
│ tool call comes back from the LLM ◄───┼────────────┤     OpenAIAdapter          │
│  └─ handler → src/lib/api.ts          │            └────────────────────────────┘
│      └─ apiFetch (JWT, 401 handling)  │ ─► /api/system/* proxy ─► Django REST API
│  └─ result → inline card in the chat  │
└───────────────────────────────────────┘
```

The key point: **the LLM never calls our backend.** It only decides *which* action to call. The action handler runs in the browser and fetches data through the same typed functions and `apiFetch` client as every page, so JWT headers, the same-origin proxy, and the 401 → `/login` redirect all behave identically. The handler's return value goes to the LLM (so it can reply) and to the action's `render` prop (so the user sees a card).

| Piece | File |
|---|---|
| Runtime endpoint (OpenAI adapter, JWT check) | `src/app/api/copilotkit/route.ts` |
| `<CopilotKit>` provider (root layout; sends the JWT) | `src/components/copilot-provider.tsx` |
| Sidebar, instructions, the three `useCopilotAction`s | `src/components/copilot/inventory-assistant.tsx` |
| Data fetchers the actions call (typed, unit-tested) | `src/lib/assistant-tools.ts` |
| Inline result cards | `src/components/copilot/*-card.tsx` |

The tools reuse existing endpoints only: `listProducts`/`getProduct` (stock levels), `listLogsByDay` (weekly activity), and `getProductLogHistory` (history).

### Security notes

- `/api/copilotkit` spends LLM credits, so it requires a valid session: the client sends the user's JWT and the route verifies it against the Django `whoami` endpoint before running the model. CopilotKit's metadata probe (`{ method: "info" }`) is allowed through unauthenticated so the login page doesn't log errors; any request that isn't clearly that probe is treated as protected.
- Tool results are sent to the LLM provider. Today that's product names, stock counts, and log dates.

### Adding an action

1. Add a typed fetcher to `src/lib/assistant-tools.ts` that calls an existing function in `src/lib/api.ts` and returns a small JSON object (`{ ok: true, ... } | { ok: false, message }`).
2. Add a card for it under `src/components/copilot/`.
3. Register it with another `useCopilotAction` in `inventory-assistant.tsx` (`handler` calls the fetcher, `render` shows the card), and mention it in `INSTRUCTIONS`.

### Good to know

- This uses CopilotKit's v1 API (`useCopilotAction`, `CopilotSidebar` from `@copilotkit/react-ui`, `CopilotRuntime` + a service adapter). As of 1.79 CopilotKit marks that surface deprecated in favor of `@copilotkit/react-core/v2` and `@copilotkit/runtime/v2`; it still works, but plan a migration before a major upgrade.
- CopilotKit's runtime sends anonymous telemetry by default. Set `COPILOTKIT_TELEMETRY_DISABLED=true` to opt out.
- CopilotKit's floating dev inspector is turned off (`enableInspector={false}`) so it doesn't overlay the dashboard.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
