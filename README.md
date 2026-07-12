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

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, sign in with your email, enter the code Instant sends you.

## Routes

| Path     | Access        | Screen  |
|----------|---------------|---------|
| `/login` | signed out    | Login   |
| `/`      | authenticated | Planner |

Auth uses Instant's React hooks (`db.useAuth` / `db.useUser` / `db.useQuery`) from `@instantdb/react`, injected into TanStack Router context; `beforeLoad` redirects, and `router.invalidate()` re-runs guards when auth changes.

## Project layout

```
index.html
vite.config.js          # StyleX unplugin + React
src/
  main.jsx              # createRoot
  router.jsx            # TanStack Router + db.useAuth
  db.js                 # Instant init + tx helpers
  tokens.stylex.js      # StyleX design tokens (defineVars)
  themes.js             # darkTheme (createTheme)
  styles/               # StyleX style modules
  components/           # JSX UI
  schema.js / …         # Instant schema + domain logic
instant.schema.ts
instant.perms.ts
vercel.json
```

## Instant setup

1. App id in **`src/config.js`** (`APP_ID`). Same value in `.env` as `INSTANT_APP_ID`.
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
| `npm run preview`     | Preview production build     |
| `npm run push:schema` | Push Instant schema          |
| `npm run push:perms`  | Push Instant permissions     |

## Deploy

`vercel.json` sets `framework: "vite"`. Build output is `dist/`.

## License

Private / personal use unless you say otherwise.
