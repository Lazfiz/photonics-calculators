# Photonics Calculators

**411 free, interactive optics and photonics calculators**, each with its model tier and references:
**[photonicscalculators.com](https://photonicscalculators.com)**

[![CI](https://github.com/Lazfiz/photonics-calculators/actions/workflows/ci.yml/badge.svg)](https://github.com/Lazfiz/photonics-calculators/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Categories

| Category | Calculators | Covers |
|---|---:|---|
| [Laser Safety](https://photonicscalculators.com/laser-safety) | 40 | MPE (ICNIRP 2013), NOHD, optical density, IEC 60825-1 classes |
| [Fiber Optics](https://photonicscalculators.com/fiber-optics) | 47 | Coupling, dispersion, bend loss, V-number, nonlinear thresholds |
| [Thin Film](https://photonicscalculators.com/thin-film) | 45 | AR coatings, dielectric stacks, dichroics, reflectors, ellipsometry |
| [Imaging](https://photonicscalculators.com/imaging) | 61 | Resolution, PSF, depth of field, microscopy, OCT, wavefronts |
| [Spectroscopy](https://photonicscalculators.com/spectroscopy) | 41 | FTIR, Raman, spectral resolution, calibration, line broadening |
| [Detectors](https://photonicscalculators.com/detectors) | 54 | Responsivity, NEP, dark noise, SPADs, avalanche gain |
| [Optical Materials](https://photonicscalculators.com/materials) | 27 | Refractive index, Sellmeier fits, thermal and nonlinear properties |
| [Wave Optics](https://photonicscalculators.com/wave-optics) | 37 | Gaussian beams, cavities, diffraction, interferometers |
| [Polarization](https://photonicscalculators.com/polarization) | 33 | Jones and Stokes calculus, Mueller matrices, retarders, birefringence |
| [Free-Space Comms](https://photonicscalculators.com/free-space-comms) | 26 | Link budgets, pointing loss, scintillation, BER, weather attenuation |

## Accuracy

- Every calculator is labelled **Exact**, **Textbook approximation** or **Illustrative**, and its page lists the
  references its formulas come from (book and equation, or paper and DOI).
- The physics lives in pure TypeScript functions in SI units (`src/physics/`), with CODATA 2022 constants and
  golden-value tests against published values or hand calculations (`tests/`).
- A [blind audit](docs/audit/9b-blind-audit.md) of 30 randomly drawn pages (seeded, reproducible) found 0 wrong
  results and 7 minor issues.
- Found a mistake? Use "Report a problem" on the page, or open a
  [physics error issue](https://github.com/Lazfiz/photonics-calculators/issues/new?template=physics-error.yml).

## API and MCP

A growing set of calculators (those listed in `/openapi.json`) can also be run by programs and AI agents:

- REST: `https://photonicscalculators.com/api/v1/<category>/<slug>?<inputs>`, described in
  [`/openapi.json`](https://photonicscalculators.com/openapi.json).
- Reference cases and this deployment's results: [`/checks.json`](https://photonicscalculators.com/checks.json).
- MCP server: `https://photonicscalculators.com/mcp` (for example
  `claude mcp add --transport http photonics https://photonicscalculators.com/mcp`).

## Run locally

Node 24 and npm:

```bash
git clone https://github.com/Lazfiz/photonics-calculators.git
cd photonics-calculators
npm ci
npm run dev          # http://localhost:3000
npm run check        # TypeScript, ESLint and tests
npm run build        # static production build
```

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4. Charts are SVG, or Plotly.js where a
plot needs zoom and hover.

## Contributing

Corrections, references and new calculators are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the setup, the
physics rules and the PR checklist, and [SECURITY.md](SECURITY.md) for security reports.

## License

[MIT](LICENSE). Exception: `src/physics/imaging/fpbase-spectra.ts` holds spectra adapted from
[FPbase](https://www.fpbase.org) and is licensed CC BY-SA 4.0, like its source.

The calculators are for education and reference. Don't use them as the only basis for safety-critical decisions;
check laser safety against IEC 60825-1 / ANSI Z136.1 and a qualified laser safety officer.
