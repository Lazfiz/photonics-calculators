# Photonics Calculators — Monetization & Integration Blueprint

**Date:** 2026-04-04  
**Scope:** 536 calculators across 11 categories (thin-film, spectroscopy, wave-optics, fiber-optics, detectors, laser-safety, imaging, materials, polarization, free-space-comms)  
**Stack:** Next.js 16, React 19, Plotly.js, Tailwind CSS 4

---

# PART 1: MONETIZATION STRATEGY

## A. Freemium Model

### Free Tier (≈40% of calculators, ~215 tools)

Keep the "bread and butter" calculators free to drive SEO traffic and establish authority:

| Category | Free Examples | Rationale |
|----------|--------------|-----------|
| Thin-film | Single-layer AR, Fresnel equations, quarter-wave, bandpass filter | High-volume student queries |
| Spectroscopy | Beer-Lambert, wavenumber converter, basic resolution, blackbody | Universal teaching tools |
| Wave-optics | Gaussian beam, ABCD matrix, diffraction, cavity stability | Every optics course needs these |
| Fiber-optics | Attenuation, bend loss, OTDR, V-number | Industry staple lookups |
| Detectors | Shot noise, dark current, SNR, silicon photodiode | Core reference material |
| Laser safety | MPE, NOHD, OD calculations | *Must* be free — safety tool, huge SEO, moral obligation |
| Polarization | Jones vectors, Malus' law, birefringence | Standard coursework |
| Free-space comms | Link budget, BER, atmospheric loss | Design engineers need quick access |

### Premium Tier (≈60% of calculators, ~320 tools)

Gated behind subscription:

- **Advanced thin-film:** Multi-layer AR optimization, stress measurement, ellipsometry, ion-assisted deposition, sputtering, plasma deposition
- **Advanced spectroscopy:** CARS, pump-probe, dual-comb, phase correction, spectral deconvolution, stray-light rejection
- **Advanced wave-optics:** Mode-locking, Kerr lens, soliton, supercontinuum, filamentation, optical parametric oscillators
- **Advanced fiber:** Nonlinear effects, SBS/SRS thresholds, photonic crystal, specialty fibers
- **Advanced imaging:** Confocal, STED, OCT, expansion microscopy, computational imaging
- **Advanced materials:** Full material database with temperature-dependent properties

### Premium Features Beyond Access

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Calculator access | ~215 basic | All 536 | All 536 |
| Saved results/sessions | ❌ | ✅ (50 sessions) | ✅ (unlimited) |
| CSV/PNG/PDF export | ❌ | ✅ | ✅ |
| Batch calculations | ❌ | ✅ (10 inputs) | ✅ (unlimited) |
| Parameter sweeps | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Embeddable widgets | ❌ | ❌ | ✅ |
| Advanced physics modes | ❌ | ✅ | ✅ |
| White-label output | ❌ | ❌ | ✅ |
| Priority support | ❌ | Email | Slack/Dedicated |

### Price Point Analysis

**Competitor benchmarks:**

| Tool | Price | Notes |
|------|-------|-------|
| Wolfram Alpha Pro | $7.25/mo (annual) / $5.49/mo student | General-purpose, not photonics-specific |
| Wolfram Alpha API | $0.04–$0.12/call; $200+/mo for commercial tiers | 2,000 free non-commercial calls/mo |
| Zemax OpticStudio | $4,900–$14,900/yr | Full optical design suite, not calculators |
| Ansys Zemax Pro (subscription) | ~$4,900/yr (est.) | Per-seat license |
| RP Photonics Encyclopedia | Free (ad-supported) + consulting | Reference content, no interactive calcs |
| BeamXpertDESIGNER | ~€3,000/yr | Laser beam propagation |
| Calcapp (calculator builder) | $99–$499/mo | Platform, not domain-specific |

**Recommended pricing:**

| Tier | Monthly | Annual | Target |
|------|---------|--------|--------|
| Free | $0 | $0 | Students, casual engineers, SEO |
| Pro | $12/mo | $99/yr (save $45) | Working engineers, grad students, researchers |
| Business | $49/mo | $399/yr (save $189) | Teams, labs, companies |

**Rationale:** $12/mo is in the "no-brainer" range for professionals — less than a journal subscription. $49/mo for API + embed + batch is competitive with scientific tool APIs. The annual discount (31%) incentivizes commitment.

---

## B. Subscription Tiers — Detailed Design

### Free Tier
- Access to ~215 fundamental calculators
- Interactive charts (Plotly visualizations)
- Mobile-responsive UI
- Usage limit: 100 calculations/day
- Watermark on exports

### Pro Tier — $12/mo ($99/yr)
- All 536 calculators unlocked
- **Saved sessions:** Bookmark parameter sets, restore later
- **Export:** CSV data, PNG charts, PDF reports with formulas
- **Batch mode:** Upload CSV of inputs, get batch outputs
- **Advanced physics modes:** e.g., thin-film calculators with substrate dispersion, Gaussian beam with thermal lensing
- **Ad-free experience**
- Usage limit: 1,000 calculations/day

### Business Tier — $49/mo ($399/yr)
- Everything in Pro
- **REST API:** Programmatic access to all calculators (JSON in/out)
- **Embeddable widgets:** iframe calculators for your own site/company wiki
- **Parameter sweeps:** Define ranges, get heat maps
- **White-label:** Remove branding, add company logo
- **Team accounts:** 5 seats, centralized billing
- **Priority support:** 24h SLA
- Usage limit: 50,000 API calls/mo (overages at $0.002/call)
- SSO/SAML integration

### Conversion Strategy
1. **Free → Pro:** Calculator page shows "🔒 Advanced mode available in Pro" with parameter comparison
2. **Pro → Business:** API documentation page with interactive playground; team invite flow
3. **Trial:** 14-day Pro trial (no card required for free users)
4. **Academic discount:** 50% off Pro for .edu emails ($6/mo or $50/yr)

---

## C. API / Embeddable Widgets

### REST API Design

```
POST /api/v1/calculate
{
  "calculator": "gaussian-beam",
  "parameters": {
    "wavelength": 1.064,
    "beam_waist": 0.5,
    "propagation_distance": 100,
    "advanced": true
  },
  "options": {
    "units": "metric",
    "output_format": "full"
  }
}

Response:
{
  "result": {
    "rayleigh_range": 0.737,
    "beam_radius_at_z": 0.68,
    "divergence": 0.678
  },
  "chart_data": { ... },
  "metadata": { "computation_time_ms": 12 }
}
```

**API Pricing:**
| Tier | Calls/mo | Price |
|------|----------|-------|
| Free | 100 | $0 |
| Developer | 10,000 | $29/mo |
| Production | 100,000 | $99/mo |
| Enterprise | Unlimited | Custom |

**Embeddable Widgets:**

```html
<iframe src="https://photonicscalc.com/embed/gaussian-beam"
  width="600" height="500" frameborder="0"></iframe>
```

- Customizable color scheme via URL params
- Business tier only
- SaaS integration: add calculators to LabArchives, Notion, Confluence wikis
- White-label for optics companies' customer portals (e.g., Thorlabs embedding a coating designer)

---

## D. Enterprise / Academic Licensing

### University Site License — $2,999/yr
- Unlimited seats for .edu domain
- All calculators + API access
- LMS integration (Canvas/Moodle widgets)
- Lab manual templates using calculators
- 10 API keys for research groups

**Market size:** ~500 optics/photonics programs worldwide × $2,999 = $1.5M addressable

### Corporate Training Package — $4,999/yr
- Department-wide access (up to 50 seats)
- Custom calculator branding
- Training modules with embedded calculators
- Dedicated support channel

### Lab Integration Package — Custom pricing ($5K–$50K)
- API integration with lab information management systems (LIMS)
- Custom calculator development (1–5 per year)
- On-prem deployment option
- SLA with uptime guarantees

---

## E. Content & SEO Revenue

### Ad Revenue Potential

**Traffic estimate (12 months post-launch with 536 indexed pages):**
- 536 calculator pages × average 50 visits/mo organic = 26,800 pageviews/mo
- Long-tail optics queries: "Gaussian beam waist calculator," "MPE laser safety calculator," etc.
- RPM for scientific/engineering niche: $2–$8 (programmatic display)
- **Estimated ad revenue: $50–$215/mo** initially, scaling to $200–$800/mo at maturity

**Recommendation:** Ads on free tier only. Remove ads for Pro/Business. Use Carbon (carbonads.net) — ethical, relevant, $0.50–$2 CPM but high-quality advertiser pool (optics vendors, journals).

### Affiliate Opportunities

| Partner | Product | Commission | Fit |
|---------|---------|------------|-----|
| Thorlabs | Optics components | 3–5% | Every calculator page can link relevant components |
| Edmund Optics | Optical components | 2–4% | Same as above |
| API (Advanced Photonix) | Detectors | Unknown | Detector calculators → product links |
| OSA/Optica Publishing | Journal subscriptions | ~10% | "Learn more" links on advanced calculators |
| Laserglow Technologies | Lasers | 3–5% | Laser safety + resonator calculators |

**Implementation:** Contextual "Buy components for this calculation" sidebar on relevant calculator pages. Estimated $100–$500/mo at scale.

### Sponsored Calculator Pages
- Vendor-sponsored calculators (e.g., "Coating Designer powered by Thorlabs"): $500–$2,000/mo
- Requires minimum 10K monthly views on target calculator
- White-label with sponsor logo, link to their product configurator

---

## F. Adjacent Revenue Streams

### Online Courses — $199–$499 per course

Built around calculator clusters:

| Course | Price | Calculators Used |
|--------|-------|-----------------|
| "Photonics Fundamentals" | $199 | Gaussian beam, Fresnel, thin-film basics, Beer-Lambert |
| "Fiber Optic System Design" | $299 | Attenuation, dispersion, link budget, OTDR, amplifiers |
| "Laser System Engineering" | $399 | Cavity stability, mode-locking, Q-switching, nonlinear effects |
| "Spectroscopy Masterclass" | $349 | FTIR, Raman, resolution, SNR, spectral deconvolution |
| "Optical Coating Design" | $499 | Multi-layer AR, Bragg, dielectric stacks, stress |

**Revenue potential:** 50 students/course × $299 avg = $14,950/course launch. Platform: Teachable or Gumroad.

### Certification Programs — $149/exam
- "Certified Photonics Calculator Professional"
- Online exam testing practical calculator use
- Resume credential for optics engineers
- Volume: niche but high-value; 200/year × $149 = $29,800

### White-Label Calculators
- Sell calculator packages to optics companies for their customer portals
- Example: Thorlabs wants a "lens selection calculator" on their site
- Pricing: $5,000–$20,000 setup + $500/mo maintenance
- 3–5 clients/year = $30K–$100K

---

## Revenue Projection Summary

| Stream | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Subscriptions (Pro) | $8,400 | $25,200 | $50,400 |
| Subscriptions (Business) | $5,900 | $23,600 | $47,200 |
| Academic licenses | $6,000 | $18,000 | $30,000 |
| API revenue | $2,000 | $12,000 | $30,000 |
| Ad revenue | $1,500 | $5,000 | $10,000 |
| Affiliates | $1,200 | $4,000 | $8,000 |
| Sponsored pages | $0 | $6,000 | $24,000 |
| Courses | $5,000 | $20,000 | $40,000 |
| White-label | $0 | $15,000 | $45,000 |
| **Total** | **$30,000** | **$128,800** | **$284,600** |

*Assumptions: 100 Pro subs Y1 → 300 Y2 → 600 Y3; 10 Business subs Y1 → 40 Y2 → 80 Y3; 2 academic licenses Y1 → 6 Y2 → 10 Y3*

---

# PART 2: INTEGRATION BLUEPRINTS

---

## 1. LaserRunner Integration — Laser Cavity Simulation

### What is LaserRunner?

No established product called "LaserRunner" was found in web search. We design it as a **laser cavity simulator** — a guided, interactive tool where users design a laser resonator and simulate output characteristics. Think "LaserCavity Tycoon meets engineering tool."

### Product Vision

The user builds a laser cavity by adding components (mirrors, gain medium, Q-switch, saturable absorber, lenses) on a 2D beam path diagram. The simulator computes:
- Cavity stability (g-parameters)
- Mode structure (TEM₀₀, higher-order modes)
- Output power vs pump power
- Pulse characteristics (for mode-locked/Q-switched)
- Beam quality (M²)

Existing calculators feed parameter values in; LaserRunner provides the system-level simulation.

### Existing Calculators That Feed Into LaserRunner

From the codebase (wave-optics/ and spectroscopy/):

| Calculator | Parameter Provided |
|-----------|-------------------|
| `cavity-stability` | g₁, g₂, stability range |
| `cavity-mode-spacing` | FSR, longitudinal mode count |
| `gaussian-beam` | Beam waist, Rayleigh range inside cavity |
| `abcd-matrix` | Round-trip ABCD matrix |
| `mode-matching` | Coupling efficiency into cavity |
| `beam-quality` / `m2-factor` | Beam quality factor |
| `q-switched-laser` | Pulse energy, duration, peak power |
| `mode-locked-laser` | Pulse width, repetition rate, average power |
| `ring-cavity` | Ring resonator round-trip loss |
| `fiber-laser-resonator` | Fiber laser specific cavity parameters |
| `solid-state-laser-resonator` | Bulk crystal cavity parameters |
| `dye-laser-resonator` | Dye laser gain cavity |
| `kerr-lens` | Kerr lensing modelocking threshold |
| `gouy-phase` | Phase accumulation in cavity |

### Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                  LaserRunner UI                      │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐ │
│  │ Component│  │ 2D Cavity  │  │  Output Charts   │ │
│  │ Palette  │  │   Diagram  │  │  (Plotly)        │ │
│  └────┬─────┘  └─────┬──────┘  └────────┬────────┘ │
│       │              │                  │           │
│  ┌────▼──────────────▼──────────────────▼────────┐  │
│  │         Cavity Simulation Engine               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────┐ │  │
│  │  │ Ray     │ │ Gaussian │ │ Rate Equation  │ │  │
│  │  │ Transfer│ │ Propagation│ │ Solver         │ │  │
│  │  │ (ABCD)  │ │          │ │ (dP/dt, dN/dt) │ │  │
│  │  └────┬────┘ └────┬─────┘ └──────┬─────────┘ │  │
│  └───────┼───────────┼───────────────┼───────────┘  │
│          │           │               │              │
│  ┌───────▼───────────▼───────────────▼───────────┐  │
│  │          Calculator API Layer                  │  │
│  │  Import: abcd-matrix, gaussian-beam,           │  │
│  │          cavity-stability, rate-equations       │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Integration approach:** Shared React components + shared calculation functions extracted from existing calculator pages into `src/lib/physics/`. LaserRunner imports these as modules rather than calling separate APIs.

### Required New Components

| Component | Description | Effort |
|-----------|-------------|--------|
| `CavityEditor` | Drag-and-drop component placement on beam path | 3 weeks |
| `CavityEngine` | ABCD round-trip calculation, stability check | 1 week (wraps existing) |
| `RateEquationSolver` | ODE solver for pump→gain→output dynamics | 2 weeks |
| `PulseSimulator` | Time-domain pulse propagation (mode-lock, Q-switch) | 2 weeks |
| `CavityCanvas` | 2D SVG beam path visualization | 2 weeks |
| `OutputDashboard` | Multi-panel Plotly charts (power, mode, pulse) | 1 week |

**Total estimated effort:** ~11 weeks (1 developer)

### Data Flow

1. User places components → `CavityEditor` emits component list + positions
2. `CavityEngine` builds ABCD matrix from component sequence → checks stability
3. If stable: `GaussianBeam` calculator determines waist, divergence at each point
4. `RateEquationSolver` computes steady-state output power vs pump
5. For pulsed: `PulseSimulator` runs time-domain simulation
6. `OutputDashboard` renders: beam profile, power curve, mode structure, pulse shape

### Monetization Angle

**Premium feature — $12/mo Pro tier includes basic cavity design; $49/mo Business includes full pulse simulation + API.** Position LaserRunner as the "killer app" that justifies subscription upgrades. Free users get cavity stability + Gaussian mode only.

---

## 2. OCT Inverse Design Simulator

### Product Vision

Optical Coherence Tomography is a $2B+ market (medical imaging, industrial inspection). This simulator lets users:
1. Define a target tissue/sample structure (layer thicknesses, scattering coefficients)
2. Design an OCT system (source, interferometer, detector, scanning optics)
3. Simulate A-scans, B-scans, and en-face images
4. Run inverse design: "Given this tissue, what source bandwidth/coherence length do I need to resolve these features?"
5. Optimize system parameters (sensitivity, SNR, depth range, resolution)

### Physics Coverage

| Module | Physics | Existing Calculator? |
|--------|---------|---------------------|
| Source design | SLD bandwidth, center wavelength, coherence length | `spectral-range`, `spectral-resolution`, `coherence-length` (needs creation) |
| Interferometer | Michelson/Mach-Zehnder, reference arm delay, dispersion mismatch | `michelson-interferometer`, `interferometer` |
| Sensitivity analysis | Shot noise, excess noise, detector noise contributions | `shot-noise`, `excess-noise`, `readout-noise`, `signal-to-noise` |
| A-scan generation | Depth reflectivity profile via Fourier transform | `fourier-transform` (exists but needs OCT-specific mode) |
| B-scan formation | Lateral scanning, tissue scattering model | New component |
| Resolution vs depth | Coherence gate, confocal gate, axial/lateral tradeoffs | `resolution`, `spectral-resolution`, `confocal-resolution` |
| Dispersion compensation | Numerical dispersion correction | New component |
| Speckle modeling | Random scatterer statistics | New component |
| SNR vs averaging | A-scan averaging, sensitivity vs speed tradeoff | `snr-averaging`, `signal-to-noise` |

### New Calculators Needed

| Calculator | Category | Effort |
|-----------|----------|--------|
| OCT axial resolution | Spectroscopy | 0.5 week |
| OCT sensitivity | Detectors | 0.5 week |
| OCT depth range | Spectroscopy | 0.5 week |
| OCT coherence length | Wave-optics | 0.5 week |
| OCT dispersion mismatch | Spectroscopy | 1 week |
| OCT speckle contrast | Imaging | 1 week |
| OCT SNR budget | Detectors | 1 week |
| Tissue optical properties | Materials | 1 week |
| OCT inverse design optimizer | New (OCT/) | 3 weeks |

### Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    OCT Simulator UI                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Sample       │  │ System       │  │ Results        │ │
│  │ Definition   │  │ Parameters   │  │ (A/B-scan)     │ │
│  │ (layers, μs,μa)│ │ (λ, Δλ, NA) │  │                │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘ │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼────────┐ │
│  │              OCT Simulation Engine                   │ │
│  │                                                      │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Tissue Model│  │ Interferometer│  │ Fourier     │ │ │
│  │  │ (μs, μa, n, │  │ Model        │  │ Transform   │ │ │
│  │  │  g, d)     │  │ (reference,  │  │ Engine      │ │ │
│  │  │             │  │  sample arm) │  │             │ │ │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  │         │                │                  │        │ │
│  │  ┌──────▼────────────────▼──────────────────▼──────┐ │ │
│  │  │           Inverse Design Optimizer               │ │ │
│  │  │  Objective: maximize (resolution × sensitivity)  │ │ │
│  │  │  Variables: λ, Δλ, NA, reference power,         │ │ │
│  │  │            averaging, detector bandwidth          │ │ │
│  │  │  Method: gradient-free (Nelder-Mead) or grid     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         Calculator API Layer (shared)                │ │
│  │  Uses: michelson-interferometer, fourier-transform,  │ │
│  │        shot-noise, excess-noise, snr-averaging,      │ │
│  │        spectral-resolution, signal-to-noise           │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. User defines sample (layer stack with scattering/absorption coefficients per layer)
2. User sets system parameters (source λ, Δλ, power, detector specs, NA)
3. Engine computes: coherence function → interferogram → A-scan via FFT
4. Lateral scanning generates B-scan (2D cross-section image)
5. Sensitivity computed from noise calculators
6. Inverse mode: user specifies required resolution/depth → optimizer finds minimum system specs

### Effort Estimate

- **New calculators:** ~8 weeks
- **OCT engine core (forward model):** 4 weeks
- **Inverse optimizer:** 3 weeks
- **B-scan visualization + UI:** 3 weeks
- **Total:** ~18 weeks (1 developer) or ~10 weeks (2 developers)

### Monetization Angle

**OCT simulator is a premium-only feature (Pro or Business tier).** The medical/industrial OCT market has high willingness to pay. Target audience: OCT system engineers at companies like Zeiss, Canon, Topcon, Thorlabs, and academic OCT labs. 

Additional: **OCT System Design Certificate** ($299) — online course with simulator access for 6 months. Market: ~50 OCT research groups × $299 = ~$15K/course.

---

## 3. Extensive FTIR Simulator

### Product Vision

A comprehensive Fourier Transform Infrared Spectroscopy simulator that walks users through the complete FTIR pipeline — from source to spectrum — with full control over every instrument parameter. This is the "virtual FTIR lab."

### Existing FTIR-Related Calculators in the Codebase

| Calculator | Path | What It Does |
|-----------|------|-------------|
| `fourier-transform` | spectroscopy/ | Basic DFT of multi-frequency signal |
| `michelson-interferometer` | spectroscopy/ | Interferogram generation with multiple spectral lines |
| `apodization` | spectroscopy/ | Apodization function application |
| `apodization-comparison` | spectroscopy/ | Side-by-side apodization comparison |
| `ftir-resolution` | spectroscopy/ | Resolution vs OPD calculation |
| `phase-correction` | spectroscopy/ | Phase correction algorithms |
| `spectral-calibration` | spectroscopy/ | Wavelength/wavenumber calibration |
| `signal-to-noise` | spectroscopy/ | SNR calculation |
| `lambert-beer-law` | spectroscopy/ | Beer-Lambert absorbance |
| `concentration` | spectroscopy/ | Concentration from absorbance |
| `blackbody` | spectroscopy/ | Blackbody source spectrum |
| `spectral-range` | spectroscopy/ | Spectral range calculation |
| `resolution` | spectroscopy/ | General resolution |
| `jacquinot` | spectroscopy/ | Jacquinot throughput advantage |
| `lineshape-fit` | spectroscopy/ | Spectral line fitting |
| `spectral-deconvolution` | spectroscopy/ | Peak deconvolution |
| `stray-light` | spectroscopy/ | Stray light effects |
| `optical-density` | spectroscopy/ | OD calculation |

**That's ~18 existing calculators directly relevant to FTIR.** The site already has most building blocks.

### What's Missing

| Missing Component | Description | Effort |
|-------------------|-------------|--------|
| FTIR workflow orchestrator | Ties all calculators into a coherent session | 3 weeks |
| Interferogram → spectrum pipeline | OPD sampling, FFT, phase correction → single-beam spectrum | 2 weeks |
| Noise modeling module | Detector NEP, source fluctuations, 1/f noise, averaging | 2 weeks |
| Sample library | Gas cells (H₂O, CO₂, CH₄, CO), thin films, ATR crystals | 2 weeks |
| ATR simulation | Evanescent wave penetration depth, ATR correction | 1.5 weeks |
| Baseline correction | Polynomial baseline subtraction | 1 week |
| Quantitative analysis | Beer-Lambert with baseline correction, multi-component fitting | 1.5 weeks |
| Resolution vs scan length tradeoff UI | Interactive slider showing spectrum at different resolutions | 1 week |
| Scan coaddition simulator | Average N scans, show SNR improvement | 0.5 week |

**Total new work:** ~15 weeks

### Could Existing Calculators Be Wired Together?

**Yes — this is the key insight.** The FTIR simulator is primarily a *workflow layer* on top of existing calculators:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FTIR Simulator — Session UI                  │
│                                                                  │
│  Step 1: Source          Step 2: Interferometer    Step 3: Sample│
│  ┌──────────────┐       ┌──────────────┐        ┌────────────┐ │
│  │ Blackbody    │──────▶│ Michelson    │──────▶ │ Gas cell / │ │
│  │ (λ, T)       │       │ (OPD, Δx)   │        │ Thin film /│ │
│  └──────────────┘       └──────────────┘        │ ATR       │ │
│                                                  └────────────┘ │
│  Step 4: Acquisition     Step 5: Processing       Step 6: Analysis│
│  ┌──────────────┐       ┌──────────────┐        ┌────────────┐ │
│  │ Sampling     │──────▶│ Apodization  │──────▶ │ Beer-      │ │
│  │ + Noise      │       │ + Phase corr │        │ Lambert    │ │
│  │ + Coaddition │       │ + FFT        │        │ + Baseline │ │
│  └──────────────┘       └──────────────┘        │ + Fit      │ │
│                                                  └────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Interactive Chart: Interferogram │ Single-beam │ Absorb.  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

Each step calls the existing calculator's computation function (extracted into `src/lib/physics/`) with the output of the previous step as input.

### UX Flow for Complete FTIR Simulation Session

**Session: "Analyze CO₂ in a gas cell at different resolutions"**

1. **Source Selection (1 min)**
   - Select blackbody source: T = 1200K, range 400–4000 cm⁻¹
   - Uses: `blackbody` calculator
   - Chart: Source spectrum

2. **Interferometer Setup (1 min)**
   - Michelson: max OPD = 0.5–10 cm (slider), beamsplitter efficiency = 0.5
   - Uses: `michelson-interferometer` + `jacquinot` calculators
   - Chart: Theoretical interferogram

3. **Sample Configuration (2 min)**
   - Gas cell: CO₂ at 400 ppm, path length = 10 cm, pressure = 1 atm
   - Or: thin film (SiO₂ on Si, 500 nm thickness)
   - Or: ATR (diamond crystal, 3 reflections, sample on surface)
   - Uses: `lambert-beer-law`, new ATR module, sample library
   - Chart: Expected transmission spectrum

4. **Acquisition Parameters (1 min)**
   - Number of scans to co-add: 1, 16, 64, 256
   - Detector: MCT, NEP = 10⁻¹² W/√Hz
   - Resolution: 0.5, 1, 2, 4, 8 cm⁻¹ (from OPD slider)
   - Uses: `ftir-resolution`, `signal-to-noise`, new noise module
   - Chart: Simulated noisy interferogram

5. **Processing (30 sec — automatic)**
   - Apply apodization (Norton-Beer medium by default; user can compare)
   - Phase correction (Mertz method)
   - FFT → single-beam spectrum
   - Uses: `apodization-comparison`, `apodization`, `phase-correction`, `fourier-transform`
   - Charts: Apodized interferogram → Single-beam spectrum

6. **Analysis (2 min)**
   - Background subtraction → transmittance
   - Convert to absorbance
   - Baseline correction (polynomial, rubber-band)
   - Peak fitting (Lorentzian/Gaussian)
   - Quantitative: CO₂ concentration from integrated absorbance
   - Uses: `optical-density`, `lambert-beer-law`, `concentration`, `lineshape-fit`, `spectral-deconvolution`, new baseline correction
   - Charts: Absorbance spectrum, fit overlay, residual

7. **Export**
   - CSV of spectrum + metadata
   - PDF report with all parameters and charts
   - Comparison overlay of different resolutions/averaging

**Total session time: ~8 minutes for a complete FTIR experiment.**

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FTIR Simulator (Next.js Page)           │
│  src/app/spectroscopy/ftir-simulator/page.tsx            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Session State Manager                  │ │
│  │  (React Context or Zustand store)                   │ │
│  │  Holds: source, interferometer, sample,            │ │
│  │         acquisition, processing, analysis params    │ │
│  └──────────────────────┬─────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────▼─────────────────────────────┐ │
│  │           FTIR Pipeline Engine                      │ │
│  │                                                      │ │
│  │  Pipeline = [                                      │ │
│  │    { fn: sourceSpectrum, calc: 'blackbody' },      │ │
│  │    { fn: sampleTransmission, calc: 'lambert-beer' },│ │
│  │    { fn: generateInterferogram, calc: 'michelson' },│ │
│  │    { fn: addNoise, calc: 'noise-model' },         │ │
│  │    { fn: apodize, calc: 'apodization' },          │ │
│  │    { fn: phaseCorrect, calc: 'phase-correction' },│ │
│  │    { fn: fft, calc: 'fourier-transform' },        │ │
│  │    { fn: baselineCorrect, calc: 'baseline' },     │ │
│  │    { fn: fitPeaks, calc: 'lineshape-fit' },       │ │
│  │  ]                                                │ │
│  │                                                      │ │
│  │  Each step reads from session state, writes result. │ │
│  │  Steps auto-recompute when upstream params change.  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Physics Library (extracted from existing calcs)     │ │
│  │  src/lib/physics/                                    │ │
│  │  ├── blackbody.ts        (from spectroscopy/blackbody)│ │
│  │  ├── michelson.ts        (from spectroscopy/michelson)│ │
│  │  ├── apodization.ts      (from spectroscopy/apodization)│
│  │  ├── phaseCorrection.ts  (from spectroscopy/phase-correction)│
│  │  ├── fft.ts              (from spectroscopy/fourier-transform)│
│  │  ├── beerLambert.ts      (from spectroscopy/lambert-beer-law)│
│  │  ├── noiseModel.ts       (NEW)                      │ │
│  │  ├── baselineCorrection.ts (NEW)                    │ │
│  │  ├── atSimulation.ts     (NEW)                      │ │
│  │  └── sampleLibrary.ts    (NEW)                      │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key architectural decision:** Extract calculation logic from existing calculator pages into pure functions in `src/lib/physics/`. The calculator pages import from there (no behavior change), and the FTIR simulator imports the same functions. This means:
- No code duplication
- Existing calculators keep working independently
- FTIR simulator gets all physics for "free"
- New standalone calculators (ATR, baseline, noise) also get their own pages

### Effort Estimate

| Task | Weeks |
|------|-------|
| Extract physics from 18 existing calculators into lib/ | 2 |
| Build FTIR session state manager + step UI | 3 |
| Build FTIR pipeline engine (orchestration) | 2 |
| New: noise model calculator + page | 2 |
| New: ATR simulation calculator + page | 1.5 |
| New: baseline correction calculator + page | 1 |
| New: sample library (gas spectra data) | 2 |
| New: quantitative analysis module | 1.5 |
| Resolution/comparison interactive views | 1 |
| Export (CSV, PDF) | 0.5 |
| Testing + polish | 1.5 |
| **Total** | **~18 weeks** |

### Monetization Angle

**FTIR simulator = premium flagship.** Strategy:
1. Individual FTIR calculators (apodization, phase correction, etc.) remain free
2. **FTIR Simulator (full workflow)** is Pro-only ($12/mo)
3. **Advanced FTIR features** (noise modeling, ATR, quantitative analysis, batch sample comparison) are Business-only ($49/mo)
4. **Academic lab license** ($2,999/yr) includes FTIR simulator as a teaching tool — replaces physical lab time
5. **FTIR-SIS competitor positioning:** The existing FTIR-SIS (Raston Lab) is free, open-source, gas-phase only, no noise modeling. Our simulator covers transmission, ATR, reflectance, noise, quantitative analysis — a clear premium value proposition.

---

# Summary: Integration Priority & ROI

| Integration | Effort | Monetization Potential | Priority |
|------------|--------|----------------------|----------|
| **FTIR Simulator** | 18 weeks | ★★★★★ (broadest audience, most existing calculators) | **1st** |
| **LaserRunner** | 11 weeks | ★★★★☆ (laser engineers, niche but high-value) | **2nd** |
| **OCT Simulator** | 18 weeks | ★★★★★ (medical market, high willingness-to-pay) | **3rd** |

**Recommended path:**
1. Extract physics library from existing calculators (2 weeks) — prerequisite for all three
2. Build FTIR simulator (18 weeks) — most existing infrastructure, fastest to value
3. Launch Pro/Business tiers alongside FTIR simulator
4. Build LaserRunner (11 weeks) — leverages extracted wave-optics physics
5. Build OCT simulator (18 weeks) — requires most new physics

**Total timeline to all three integrations + monetization:** ~49 weeks (1 developer) or ~30 weeks (2 developers). FTIR simulator alone could launch at ~20 weeks with monetization.
