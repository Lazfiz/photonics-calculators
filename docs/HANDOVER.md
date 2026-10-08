# Handover — 2026-10-08 (session 21 → session 22)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4 findings: only the imaging items are left; or
Phase 2 stage 2c).
- PR #16 (findings batch 2) is merged and live; production `ui-check` passed (full suite + the 8 pages, comment on
  the PR).
- Session 21 fixed findings batch 3 on `phase-4/findings-batch-3` (**PR #17**). Merge only after the user approves,
  then run `ui-check` against production.

## State
- **`phase-4/findings-batch-3`** (on `main` 95ebaa04), one commit per topic plus docs:
  1. `spectral-resolution`: `src/physics/spectroscopy/spectral-resolution.ts` (order guard, λ/(mN) floor, Airy FP).
  2. `lambert-beer-law`: `…/lambert-beer-law.ts` (default 10 µM → A = 0.5).
  3. `fluorescence-lifetime`: `…/fluorescence-lifetime.ts` (intensity- and amplitude-weighted ⟨τ⟩, Φ).
  4. `pointing-loss`: `src/physics/free-space-comms/pointing-loss.ts` (Marcum-Q mean capture, range input).
  5. `scintillation` + `adaptive-optics`: `…/free-space-comms/turbulence.ts` (shared).
  6. `atmospheric-loss` + `laser-safety/atmospheric-attenuation`: `…/free-space-comms/atmospheric-attenuation.ts`.
  7. `docs`: ROADMAP ("Findings batch 3", findings marked fixed), this file.
- **Gates:** `check` green on the final code tree (tsc 0, eslint 0 errors, 1,187 warnings, was 1,195; 165 tests).
  Each module's test caught a mutation of its formula (8/8, incl. re-inserting the old bugs). `build` green.

## Decisions (this session)
- Coefficients I couldn't verify from memory were checked by web search before use: Andrews & Phillips'
  aperture-averaged plane-wave σ_I²(D) (0.49/0.51, 0.65d², 1.11, 0.90d², 0.62d²) and the Parenti-Sasiela halo
  term (1 − e^(−σ²))/(1 + (D/r₀)²).
- `atmospheric-attenuation`: Rayleigh from first principles (Peck & Reeder index, King factor 1.048, N_s = p/k_BT),
  tested against Hansen & Travis 1974 (−0.46 % at 0.4–1.55 µm). The aerosol part is 3.912/V minus Rayleigh at
  550 nm, so the visibility definition holds exactly. Invented H₂O/CO₂ peaks were removed rather than replaced:
  no verified line data; leaving absorption out is conservative for the NOHD page.
- `pointing-loss`: the jitter-averaged capture is exact as a single Gaussian of variance w²/4 + s² (convolution),
  so no fading-pdf integral is needed; the Marcum Q is a 1-D erf integral (`gaussianDiscFraction`).
- `scintillation` lost its BER chart (SNR/(1 + σ_I²) was ad hoc; BER lives on `ber`); it now shows the fade
  probabilities the registry promised.
- References without section numbers where I wasn't sure of them (Hecht §9.6.1 kept; Born & Wolf dropped).
- New URL keys: spectral-resolution `mode`, `gratingWidth`, `beamWidth`; fluorescence `model`, `tauRad`;
  pointing `range`; AO `windSpeed`. Dropped: atmospheric-loss `altitude`, `humidity`, `temperature`;
  atmospheric-attenuation `humidity`. Default changes: prism `dispersion` 1e-4 (was 0.02), Beer-Lambert
  `concentration` 1e-5.

## Next actions
1. Push, CI, ask before merging PR #17, then `ui-check` production (incl. a load check of the 8 pages). The local
   production build passed the same load check (0 console errors) and showed the expected values.
2. Then the **imaging** findings (last Phase 4 findings group): `two-photon-microscopy`,
   `third-harmonic-microscopy`, `coherent-raman` (Airy radius used as the Gaussian waist, 2P focal volume ≈ 7×
   too large), `multiphoton-depth` (reuse `twoPhotonAxialFwhm`), `second-harmonic-generation` (no sinc², plane-wave
   L²), `super-resolution` (Rayleigh 0.61λ/NA in the FWHM-based STED law), `shack-hartmann` (Airy radius as spot
   size, no dynamic range). Or stage **2c**. Ask the user.
3. `exposure-duration` leftovers are still listed in the hazard-weighting ROADMAP sub-item.

## Ship flow (worked fourteen times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO (302 to `vercel.com/sso-api`). Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **`ui-check` load mode** waits for an `<input>` with a React fiber; pages without inputs (e.g.
  `optical-glass-catalog`) fail with "not hydrated". Use a scratchpad copy that probes `button` instead. Wrap each
  run in `timeout 200`: a Chrome-startup hang otherwise blocks forever. Flake: loop up to 3 times.
- **Mutation check:** a scratchpad `mutate.mjs` (exact string replace → run one test → restore) is quicker than
  copying files by hand; use it only while no `check` is running.
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs (whole `/<category>/<slug>` matches).
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; `hazard-weighting.ts` rounds (`toNm`).
- **Standards PDFs:** WebFetch can't read PDFs. `curl` them to the scratchpad, then a small Node inflate +
  `Tj`/`TJ` extractor.
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. Never start a Bash command with a bare `cat > file` (it waits on stdin); use a heredoc.
- **`SimpleChart`** (what `ChartPanel` renders for scatter/bar): no `shapes`; unnamed traces stay out of the legend;
  skips NaN; on a log axis it clamps 0 to 1e-10. Filter NaN/∞ in the page anyway (Plotly fallback).
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
