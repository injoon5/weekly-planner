# Weekly Planner · 주간 계획표

A realtime weekly timetable with magic-code auth. **React + Vite + TanStack Router + StyleX** on [InstantDB](https://www.instantdb.com).

## Features

- **Magic code login** — email a 6-digit code, Instant creates the account
- **Realtime sync** — boards and events update live across devices
- **Multi-board tabs** — duplicate, clear, rename, date ranges
- **Drag / resize / create** — mouse drag or touch long-press
- **Draft-until-save editor** — cancel never leaves orphan events
- **Import / export JSON** — and one-time migration from the old localStorage planner
- **Print + dark mode**
- **Account page** (`/account`) — display name, avatar color, theme, API tokens
- **REST API** (`/api/v1`) — bearer-token access to boards/events/todos; tokens are generated on the account page and refreshable ([docs](docs/content/docs/api/rest.mdx))

## Quick start

Node 22–24 is supported.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`, sign in with your email, enter the code Instant sends you.

## Routes

| Path     | Access        | Screen  |
|----------|---------------|---------|
| `/login` | signed out    | Login   |
| `/`      | authenticated | Planner |
| `/s/:token` | public link | Shared planner |
| `/account` | authenticated | Account settings |

Auth uses Instant's React hooks (`db.useAuth` / `db.useUser` / `db.useQuery`) from `@instantdb/react`, injected into TanStack Router context; `beforeLoad` redirects, and `router.invalidate()` re-runs guards when auth changes.

## Project layout

```
index.html
vite.config.js          # StyleX unplugin + React
src/
  main.jsx              # createRoot
  router.jsx            # TanStack Router + db.useAuth
  components/           # JSX UI (+ ui/ primitives)
  hooks/                # React hooks (workspace, runtime, share, …)
  styles/               # StyleX style modules + tokens.stylex.js (defineVars)
  db/                   # Instant init, schema, transactions (tx/)
  board/                # Board/workspace domain: models, import/export, bootstrap
  grid/                 # Week-grid geometry, drag + gesture logic
  sharing/              # Share links, roles, member policy
  theme/                # Theme state + darkTheme (createTheme)
  server/               # Shared with api/ + middleware: REST, tokens, OG meta
  lib/                  # Generic helpers: time, config, links, command-result
instant.schema.ts
instant.perms.ts
vercel.json
```

## Instant setup

1. Copy `.env.example` → `.env` and set **`INSTANT_APP_ID`** and **`VITE_INSTANT_APP_ID`** to the same Instant app id (CLI/server vs Vite client).
2. Admin token in `.env` from the [Instant dashboard](https://www.instantdb.com/dash).
3. Optional lock:

```bash
npm run push:schema
npm run push:perms
```

## Scripts

| Command               | What it does                 |
|-----------------------|------------------------------|
| `npm run dev`         | Vite dev server (port 3000)  |
| `npm run build`       | Production → `dist/`         |
| `npm run lint`        | ESLint                        |
| `npm run typecheck`   | Check core JavaScript modules |
| `npm run test`        | Vitest regression tests       |
| `npm run check`       | Lint, typecheck, test, build  |
| `npm run preview`     | Preview production build     |
| `npm run push:schema` | Push Instant schema          |
| `npm run push:perms`  | Push Instant permissions     |
| `npm run sync:auth-origins` | Register Instant auth origins (Vercel previews) |

## Deploy

`vercel.json` sets `framework: "vite"`. Build output is `dist/`.

### Vercel preview auth

Instant validates the browser `Origin` on auth requests. Preview URLs (`*.vercel.app`) must be registered once per Vercel project:

```bash
# one-time: print a CLI token (do not commit it)
npx instant-cli@latest login -p

# register preview + production + localhost origins
INSTANT_CLI_AUTH_TOKEN=<token> npm run sync:auth-origins
```

This adds a **Vercel** origin for the `weekly-planner` project (covers every preview deployment) plus website origins for production and `localhost:3000`.

For CI, add `INSTANT_CLI_AUTH_TOKEN` as a GitHub Actions secret — `.github/workflows/sync-instant-auth-origins.yml` runs on `main` and re-syncs when the script changes.

Set `INSTANT_ADMIN_TOKEN` in Vercel **Preview** and **Production** env scopes so `/api/invite` and `/api/share-meta` (dynamic OG cards for `/s/:token`) work on preview deployments too.

Optional: set `SITE_URL` to your custom domain so production builds inject absolute `og:image` / canonical tags (Vercel’s production URL is used automatically otherwise).

## Documentation site

Full codebase docs ship as a Fumadocs (Next.js) app in [`docs/`](./docs):

```bash
cd docs
npm ci
npm run dev
```

Deploy on Vercel with **Root Directory** = `docs`. See [`docs/README.md`](./docs/README.md) and the published docs under **Deploy → Docs site**.

## License

Private / personal use unless you say otherwise.
