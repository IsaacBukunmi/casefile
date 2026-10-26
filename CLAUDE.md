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

## Commands
- `pnpm dev` runs web (5173) and api (8000).
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check` must pass before any commit.
- Tokens live in `apps/web/src/styles/theme.css`. Tailwind defaults are disabled, so only token classes exist.