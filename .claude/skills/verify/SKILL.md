---
name: verify
description: Run this project's gates on Windows (tsc, eslint, tests, build), read failures efficiently, and optionally check the live/preview site. Use before every commit (check) and push (build), and after deploys.
---
# Verify

## Gates (run in this order; long ones in the background, then read only the tail)
1. `npm run check`: `tsc --noEmit && eslint && npm test`. tsc alone takes about 4 min on this disk, so run the
   gate with `run_in_background` and redirect output to a log in the scratchpad.
2. `npm run build`: required before a push. It prerenders `/search-index.json` and the sitemap from the
   registry; nothing generated is committed.
- Type-check only: `node node_modules/typescript/bin/tsc --noEmit -p .`

## Reading failures (keep output small)
- tsc: `grep -E "error TS" log | head -20`, then count with `grep -c "error TS"`.
  - Parse errors (TS1xxx) hide type errors. Fix them first, then re-run the full tsc.
  - TS1382 / TS1381: raw `>` or `}` in JSX text, so use `&gt;` / `{'}'}`.
  - TS17006/17007: unary minus before `**`, so write `-(x ** 2)`.
- eslint: `npx eslint <files>` on just the changed files while iterating.
- tests: `npm test 2>&1 | tail -30`; failing tests print `not ok` plus the assertion diff.
- build: `tail -40`. Prerender errors name the route, so open that `page.tsx` / `page-client.tsx`.

## Live / preview check
- Status and cache: `curl -sI <url> | grep -iE "^(HTTP|x-vercel-cache|age)"`
- Text present: `curl -s <url> | grep -o "<expected text>" | head -1`
- JSON-LD parses: extract `<script type="application/ld+json">` and run it through `node -e "JSON.parse(...)"`.
  Its `name` must not contain `',` or `description:`.
- Pass a preview URL (from the PR / Vercel) instead of production when verifying before a merge.

Report: each gate pass/fail plus the first failing lines only.
