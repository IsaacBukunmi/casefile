# Casefile

Contract review app for attorneys. Monorepo: `apps/web` (React), `apps/api` (FastAPI).

## Source of truth
- Design: `design/Casefile App.dc.html` (interactive prototype) and `design/theme.css` (tokens).
- API types: generated from FastAPI's OpenAPI schema. Never hand-write API types.

## Rules
- Style ONLY with design tokens via Tailwind classes. No arbitrary values (`p-[13px]`, `bg-[#fff]`), no inline `style`.
- Use semantic tokens (`text-fg-muted`, `bg-surface-card`) over raw scales (`text-ink-500`).
- Risk is never shown by colour alone: always icon + label.
- TypeScript is strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment explaining why.
- Every feature ships with tests and loading, empty and error states.
- If the API contract looks wrong, stop and say so. Don't work around it in the client.
- `.env.example` files hold placeholders only. Real values go in `.env`, which git ignores.

## Building UI
- Match `design/Casefile App.dc.html`. Each screen is marked with an HTML comment (`<!-- MATTERS LIST -->`, `<!-- APP SHELL -->`). The prototype's inline styles show intent; translate them to token classes.
- If a value can't be expressed with existing tokens (e.g. a grid template), add a named token or `@utility` in `theme.css` and mention it in the PR. Never use arbitrary values.
- Icons: `lucide-react`, the same set the prototype uses. Decorative icons get `aria-hidden`.
- Data comes only from the hooks in `src/api/` and `src/hooks/`. Don't call `api` directly from components, and don't add query keys outside `keys.ts`.
- Components live in `src/components/` (shared) or next to their page. Pages stay thin.
- Accessibility: real buttons and links, visible focus (`shadow-focus`), menus with correct ARIA and keyboard support (Escape closes, focus returns to the trigger).
- Tests: integration tests with `renderApp(url)` from `src/test/render.tsx`, finding elements by role, label or text. The API is mocked with schema-typed MSW handlers in `src/test/server.ts`; Clerk is faked in `src/test/clerk.tsx` (extend it there when you use a new Clerk export).
- Out of scope unless asked: mobile layouts (Step 10), screens without a route.

## Commands
- `pnpm dev` runs web (5173) and api (8000).
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` must pass before any commit.
- `pnpm gen:api` regenerates `packages/api-types` after any API change. Never edit `schema.d.ts` by hand.
- `pnpm test` runs the API suite against `casefile_test` (Docker Postgres must be running).
- Tokens live in `apps/web/src/styles/theme.css`. Tailwind defaults are disabled, so only token classes exist.