# Weekly Planner Docs

Fumadocs site that documents the Weekly Planner codebase.

## Local development

```bash
cd docs
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Docs live at `/docs`.

## Content

MDX pages are under `content/docs/`. Edit those files and the sidebar updates from `meta.json` trees.

## Deploy on Vercel

1. Import the GitHub repo in Vercel (or create a second project next to the app).
2. Set **Root Directory** to `docs`.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default).
5. Output: Next.js default (no static export required).

No InstantDB or app env vars are required for the docs site.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js + Fumadocs MDX dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run types:check` | MDX + TypeScript check |
