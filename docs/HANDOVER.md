# Handover — 2026-10-15 (session 68 → session 69)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 68 finished detectors part 4b (InGaAs band gap): PR #97, merged as `492b8e3b`. This handover rides in PR
`chore/vercel-main-only`, which also limits Vercel to `main`. Next: **Detectors part 4c: Si vs InGaAs and
back-illumination**. `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 235 of 458 pages are tiered (detectors 25 / 54, materials 4 / 45). 19 `knownIssue`s left, all in detectors. 693 tests.
- `materials/bandgap.ts`: `VARSHNI` (Si, Ge: Sze; GaAs, InAs, InP, GaP X gap, GaSb, InSb, GaN: Vurgaftman 2001),
  `varshniBandGap(T, p)`, `ingaasBandGap(x, T)` (bowing 0.477 eV; 0.816 eV at 0 K, 0.7373 eV at 300 K).
- `detectors/ingaas.ts`: `ingaasIntrinsicDensity(x, T)` (6.3e17 m⁻³ at 300 K, Paul 1991), `ingaasAbsorption(λ, E_g)`
  (A·√(E − E_g), A = 2.4e6 1/(m·eV^½), ±12 % of Adachi 1989), `cutoffWavelength(E_g)`. `dark-current.ts` adds
  `generationCurrentAtBias(I_gen, V ≤ 0, T)` and `generationNoiseDensity(I_gen)` = √(2qI_gen).
- Still in FSO: `excessNoiseFactor` (McIntyre) and `photonEnergy` in `src/physics/free-space-comms/background-radiance.ts`.
  Part 5 moves McIntyre to `detectors/apd.ts`. Part 6 replaces `src/lib/geiger-mode-avalanche.ts`.
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` (part 4c); keep `spad` and SPCM as separate pages on
  one module; rewrite `channel-photomultiplier` as a true CPM. Session 68: Vercel builds only `main`; the handover
  goes on the feature branch, one PR per stage (Hobby plan build limits).

## Next actions
1. Ship this PR (`/ship`). After the merge, `post-merge-check` still waits on main's Vercel status.
2. Detectors part 4c, then 5–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL inputs +
   `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
   `/handover` on the feature branch before `/ship`.
3. `post-merge-check` takes default-page values only (no query strings). Grep the prerendered
   `.next/server/app/<cat>/<slug>.html` after `build` for a distinctive default string. Part 4b used
   `detectors/ingaas-parameters="0.7373 eV"` `detectors/ingaas-parameters="1.023 A/W"`.
4. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.

## Non-obvious facts
- **Session 68 lessons:**
  - Vurgaftman 2001 PDF: `ursemiconductors.web.illinois.edu/ECE536/Vurgaftman(2001).pdf` (pdftotext). The Ioffe NSM
    archive needs `curl -k` over http. refractiveindex.info alloys are under `data/other/semiconductor alloys/`.
  - Registry text can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
  - Vercel MCP `list_deployments` returns only the ~9 newest. Usage figures need the dashboard
    (`vercel.com/mariusrut-8463s-projects/~/usage`); the observability API is 402 on Hobby.
- **Session 67 lessons:**
  - Optical tables: the refractiveindex.info database is on GitHub raw
    (`polyanskiy/refractiveindex.info-database/master/database/data/main/<El>/nk/<Author-Year>.yml`). pveducation.org's
    silicon table is Green & Keevers 1995, not Green 2008: a usable second source (agrees within 2.3 %).
- **Session 66 lessons:**
  - Parts of 3–4 modules and 4–5 pages fit one session inline (sessions 66, 67), without a physics-reviewer pass, when
    each function is probed against an independent numeric or hand check before the tests are written.
- **Session 65 lessons:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`: no stale deps, no eslint-disable.
  - A slug rename touching < 10 files: `git mv` the folder, change `href` in `page.tsx`, move the registry entry to its
    sorted place (old title into `keywords`), add the redirect, `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts: write regexes with backslashes via the Write tool, not `node -e`/heredoc edits.
- **Session 64 lessons:**
  - Pattern per page: `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input with the
    same `min`/`max`. Selects: map the raw string onto an id list with a default.
  - `src/registry/calculators/detectors.ts` is **LF**. Registry scripts must keep the file's line endings.
- **Earlier:** "from memory" reviewer numbers need a source. Format integer outputs as integers. JSX text cannot hold `{…}`: wrap it in `{"…"}`. A "maximum distance"
  output needs a zero-attenuation case. Test the extreme corner of every input range. A general routine must reproduce
  the closed forms it generalises. `useURLState` inside `.map` breaks `rules-of-hooks`.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext -layout` works for arXiv, radioeng.cz, URSI GA, `theses.eurasip.org`,
  TI app notes (`ti.com/lit/an/<id>/<id>.pdf`) and SRS manuals. mdpi.com gives 403 (Europe PMC
  `/rest/<PMCID>/fullTextXML` works); Optics Express doesn't download. Thorlabs spec sheets come from the public `/graphql`
  endpoint (storeId "Thorlabs-Website"). Cross-check a coefficient table against a second independent source; settle
  disagreements with a physical check, not a vote.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 2–3
  min, physics-reviewer ≈ 8–15 min, `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: find it with `netstat -ano | grep :3100`, kill it with
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &`.
- **eslint:** about 665 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks, run with
  `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
