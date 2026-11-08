# Contributing

Thanks for helping. Accuracy matters more than features here: a calculator that gives a wrong number with
confidence is worse than no calculator. Contributions of every size are welcome, from a corrected reference to a
new calculator.

## Reporting a mistake

- **On the site:** every calculator has a "Report a problem" form at the bottom of its page.
- **On GitHub:** open a [physics or calculation error](../../issues/new?template=physics-error.yml) issue. Include
  the page URL with your inputs (the inputs are in the URL), the value you expected and the source you got it from.

## Setup

Node 24 and npm.

```bash
git clone https://github.com/Lazfiz/photonics-calculators.git
cd photonics-calculators
npm ci
npm run dev          # http://localhost:3000
```

| Task | Command |
|---|---|
| All checks (run before every commit) | `npm run check` (TypeScript, ESLint, tests) |
| Tests only | `npm test` (`node:test` via tsx, files in `tests/*.test.ts`) |
| Production build | `npm run build` |

CI runs `npm ci`, `npm run check` and `npm run build` on every pull request; a PR merges only when it is green.

## How the code is laid out

- `src/app/<category>/<slug>/page.tsx`: a thin server component. Its metadata, heading, breadcrumbs and JSON-LD come
  from the registry through `CalculatorShell`.
- `src/app/<category>/<slug>/page-client.tsx`: the interactive part (`"use client"`): inputs, results, charts.
  Inputs are mirrored to the URL with `useURLState`, so every result can be shared as a link.
- `src/physics/`: pure functions in SI units, one module per topic. Physical constants live only in
  `src/physics/constants.ts` (CODATA 2022).
- `src/registry/calculators/<category>.ts`: one entry per calculator (title, description, model tier, references,
  related pages). Server-only: never import it from a client component.
- `src/schemas/<category>/<slug>.ts`: the API description of a calculator (inputs, outputs, reference checks), served
  at `/api/v1/<category>/<slug>`, `/openapi.json`, `/checks.json` and the MCP endpoint `/mcp`.
- `tests/`: golden-value tests, one file per topic.

## Physics rules

1. **SI units inside.** Convert nm, mm, dBm, °C and other display units only where values enter or leave the page,
   and name non-SI variables with their unit (`lambda_nm`).
2. **Constants** come from `src/physics/constants.ts`. Never write `3e8`, `6.626e-34` or `1.38e-23` inline; a test
   fails on any literal within 1 % of a physical constant.
3. **Guard the domain:** no division by zero, no `sqrt`/`log` of negatives, no `asin`/`acos` outside [−1, 1]. Return
   `NaN` with a message instead of a made-up number.
4. **Every formula change ships a golden-value test** that compares against a published value or an independent hand
   calculation and cites the source (book and equation, or paper and DOI). Asserting `> 0` doesn't count.
5. **Model tier and references:** each calculator is labelled Exact, Textbook approximation or Illustrative, and its
   registry entry lists the references the page shows. Cite only what you have checked in the source.
6. Physics goes into `src/physics/`, not inline in a page.

## UI rules

- Let users type freely in number inputs; validate and clamp on blur, never on each keystroke.
- No `window`, `document`, `localStorage`, `Date.now()` or `Math.random()` during render (static prerendering).
- Filter `NaN` and `±Infinity` out of chart data; log axes skip non-positive values.
- Every input has a label; results are text, not colour alone.

## Pull requests

- Branch from `main`, one topic per PR, conventional commit messages (`fix(fiber-optics): …`, `feat(imaging): …`).
- Run `npm run check` (and `npm run build` for page changes) before you push.
- An edit that touches more than about 10 files should be a script (an AST codemod with ts-morph), not a regex
  replace, and the PR should say how it was generated.
- Fill in the PR checklist. For physics changes, put the reference and the golden values in the description.

## Licence

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
