---
paths:
  - "src/app/**"
  - "next.config.js"
---
# Next.js app code (Next 16, App Router)

- Before using any Next API (metadata, routing, `generateStaticParams`, redirects, `next/dynamic`,
  caching), read the matching guide in `node_modules/next/dist/docs/`. APIs differ from training data.
- `page.tsx` is a **server component**. It exports `metadata` and renders JSON-LD, both built from the
  calculator's registry entry (until the registry exists: from the same `title`/`description` literals,
  never duplicated by hand). JSON-LD values are plain strings, never source code inside template literals.
- `page-client.tsx` (`"use client"`) is only for interactivity: inputs, state, calling physics functions,
  and rendering results/charts. No metadata and no large static data imports.
- Related links, category lists and search data are computed on the server (or at build time) and passed
  as props. Don't import `src/registry` (or a module that imports it) into client components;
  `tests/registry.test.ts` checks this.
- Keep pages statically prerenderable: no request-time APIs in calculator pages.
- Plotly loads only via `next/dynamic` with `ssr: false`, and only on pages that need it.
- URL/slug changes need a 301 redirect in `next.config.js` and a registry update (the sitemap follows).
