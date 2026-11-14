# Architecture

rwbjee-companion — `rwbjee.com`, Next.js 16 (App Router) + Payload CMS 3 + Supabase + Upstash.
Surface: `web-fullstack`. Deployed on Vercel.

## Layout
- `src/app/(app)/` — public site:
  - `(resources)/blog`, `blog/[slug]`, `colleges`, `colleges/[slug]`, `timeline`
  - `(tools)/cutoffs`, `marks-calculator`, `predictor`
  - `(legal)/disclaimer`, `faq`, `privacy`; plus `socials`
- `src/app/(payload)/admin/[[...segments]]` — Payload admin mounted inside the Next app.
- `src/app/api/` — server surface:
  - `v1/cutoffs`, `v1/cutoffs/search`, `v1/timeline` (public, cacheable data API)
  - `predictor/*`, `tools/marks-calculator/*` (rank/rank-list tooling)
  - `admin/*` — `build`, `import`, `export`, `sync`, `deploy`, `bulk-delete`, `bulk-seo`, `media-match`
  - `revalidate`, `preview`, `exit-preview`, `og`, `run-migration`
- `src/collections/` — Payload collections: `Colleges`, `CollegeCutoffs`, `CollegePlacementReports`, `Timeline`, `Posts`, `Tags`, `Authors`, `Media`, `SiteSettings`, `Users`, `AnswerKeys`.
- `src/components`, `src/hooks`, `src/lib` (`payload-client.ts`, `utils.ts`), `src/types`, `src/utils`.
- `scripts/` — build (`build-metadata`, `generate-static-slices`, `build-cutoffs-data`), database (seed/import/clear), `seo/submit-indexnow`, validation (`verify-all-data`, duplicates, distribution, static slicing).
- `supabase/*.sql` — schema and data operations applied outside the app.
- `public/` static assets, `tests/` Playwright specs, `docs/` notes.

## Data flow
1. **Read model (Supabase Postgres)** — cutoff, college, and predictor data. Public APIs under `/api/v1/*` serve it; `/api/predictor/*` filters it.
2. **Editorial content (Payload CMS on Postgres via `DATABASE_URI`)** — blog posts, colleges, timeline entries, media. Edited at `/admin`; rendered by server components.
3. **Cache** — Upstash Redis (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) for shared reads and invalidation; `/api/revalidate` drives ISR revalidation on content change.
4. **Media** — Payload S3 storage adapter (`S3_*`); `next/image` is allowed to fetch from the Supabase storage hosts configured in `next.config.ts`.
5. **Build-time data** — `npm run build` = `build:metadata` → `build:mobile` (static slices) → `build:desktop` (columnar cutoff payload) → `next build`. Mobile gets progressive API slices; desktop gets the compressed client-side payload.

## Environment
- App: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SERVER_URL`, `NODE_ENV`, `LOG_LEVEL`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URI`
- Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- S3: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- Tooling: `GOOGLE_SHEETS_EXPORT_URL`

## Invariants
- Generated cutoff artifacts are produced by `scripts/build/*` at build time; never hand-edit them.
- `SUPABASE_SECRET_KEY`, `DATABASE_URI`, `S3_SECRET_ACCESS_KEY`, and Upstash tokens are server-only. Anything prefixed `NEXT_PUBLIC_` is shipped to the browser.
- Editorial writes go through Payload collections; public reads go through `/api/*` or server components, not direct client SDK calls.
- `/api/v1/*` response shapes are a mobile contract — additive changes only.
- New image hosts must be added to `next.config.ts` `images.remotePatterns` or `next/image` will reject them.
- Security headers (frame, sniff, referrer, permissions) are set globally in `next.config.ts`; do not bypass them per-route.

## Verification
- `vgate` must pass before reporting work as done.
- Manual: `npm run lint` (oxlint + eslint) and `npx tsc --noEmit`.
- Full production check: `npm run build` (runs the data pipelines, so it is slow and needs the build env).
- Tests live in `tests/` (Playwright config), but there is no `test` npm script yet.
- Deployment: Vercel; `@vercel/analytics` and `@vercel/speed-insights` are wired in the app.
