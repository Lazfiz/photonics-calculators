# Handover — 2026-10-16 (session 78 → session 79)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 78 merged PR #104 and finished **imaging audit part 0** on branch `phase-4/imaging-audit`, with this handover in
the PR. Eight `physics-reviewer` batches audited the 56 untiered imaging pages: 29 bugs, 22 questionable, 5 OK. The 51
non-OK pages now carry a registry `knownIssue`. Next: **imaging part 1 (diffraction PSF)**; the ROADMAP lists the
pages, modules and golden values for parts 1–15. `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 264 of 458 pages are tiered. There are 51 `knownIssue`s, all in imaging.
- **Release flow (PR #104):** merges to `main` deploy nothing. Production deploys only from `release`, and only when the
  user asks: `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. `/ship` ends at
  the merge. The user still has to set Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `selective-plane` → `light-sheet`, `working-distance` →
  `image-distance`, `strehl-ratio` + `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with
  CCD/CMOS presets. Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.
- One PR per stage, with the handover inside (session 68).

## Next actions
1. `/ship` this branch (docs and registry only: no post-merge values; don't release unless asked).
2. Imaging part 1: new `src/physics/imaging/diffraction-psf.ts` → airy-disk, resolution, psf-calculator, na-fnumber.
   Remove each page's `knownIssue` when its part fixes it, and tier the page.
3. Later: the detectors part 7b leftovers, fiber and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 78:**
  - The registry test allows a `knownIssue` of 40–240 characters ending in a full stop, with no `{}`, and only on an
    untiered page.
  - Reviewer stalls: when the shell hangs (dozens of leftover bash.exe or node.exe), every agent stalls with "no
    progress for 600s". Run reviewer batches of 7 pages, 2–3 at a time, with `timeout 60` on Bash and one page per Read.
    Each batch then takes 5–8 minutes.
  - Crossref returns 429 when hit too often. Space out the calls.
  - One Opus safeguard false positive stopped a reviewer (req_011Cg5yPcFoLiDXcpkpNs3P7); a relaunch passed.
  - `npx tsx scripts/tier-status.ts imaging` takes more than 2 minutes; run it in the background.
  - Batch findings with golden values are in the ROADMAP fix-part boxes. Reviewer section and equation numbers are unverified.
- **Session 77:** Seib semi-infinite: η(f) = 1 − e^(−αW)/(1 + α L_f); subtract the MTF floor before integrating
  line-spread shares. PDG PDFs: `pdg.lbl.gov/<year>/reviews/rpp<year>-rev-<name>.pdf`. Use `node --import tsx --test
  <file>`: `npx tsx --test` stalled for > 2 min.
- **Session 76:** EMVA 1288 PDFs download with curl: `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf`. DSNU₁₂₈₈ is
  absolute (e⁻), PRNU₁₂₈₈ relative; σ_q² = 1/12 DN². Random patterns in a client page must be seeded (module-level const).
- **Session 75:** Robbins–Hadwen F² = 2(1 − 1/G)/(1 + p) + 1/G; with N = 604 F² peaks near G = 300, so SNR is not
  monotonic in G.
- **Session 74:** rect ⊗ rect is a trapezoid of FWHM max(a, b). Johnson noise of 50 Ω beats shot noise below ≈ 1 mA.
- **Session 73:** Hamamatsu PMT handbook v4E: numbers survive `pdftotext`. Run the module before writing 1e-7 asserts.
- **Session 70–72:** Excelitas datasheets and rp-photonics: curl with a UA + `pdftotext -raw`. Europe PMC
  `/rest/<PMCID>/fullTextXML` works where mdpi.com gives 403.
- **Session 69:** `SimpleChart` maps `null` y to 0; use `NaN` for gaps. On log axes, y ≤ 0 is skipped.
- **Session 68:** Registry text can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
- **Session 65:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`.
  - A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the redirect,
    `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts for multi-line edits; write regexes via the Write tool or a quoted heredoc.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` is **LF**; scripts must keep line endings.
- **Earlier:** "from memory" reviewer numbers need a source. JSX text cannot hold `{…}`. Test the extreme corner of every
  input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes, SRS manuals and PDG. Optics Express,
  Appl. Opt., IEEE and nature.com don't download. `node scripts/crossref.mjs -q "<citation>"` finds book-chapter DOIs.
- **Fits:** empirical fits can go unphysical inside their stated range. Timings: CI ≈ 2–3 min, physics-reviewer ≈ 9 min,
  `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN. Show NaN/∞ as "—" with a reason. Plotly can't draw Infinity.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. A `next start` can hold port 3100:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **eslint:** about 665 pre-existing warnings. Lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Shell:** physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`. `python -`
  hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
