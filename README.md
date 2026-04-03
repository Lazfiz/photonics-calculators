# Photonics Calculators

A comprehensive collection of **113 interactive calculators** for optics and photonics, built with Next.js and Plotly.js.

🌐 **Live Demo:** [Coming Soon](#)

## Calculator Categories

| Category | Calculators | Description |
|----------|------------|-------------|
| 🔴 Laser Safety | 12 | NOHD, MPE, OD, eye safety |
| 🔷 Fiber Optics | 16 | NA, V-number, attenuation, splice loss |
| 🌈 Thin Film | 11 | Coating design, AR coatings, Bragg reflectors |
| 📷 Imaging | 16 | FOV, DOF, magnification, lens design |
| 📊 Spectroscopy | 13 | Resolution, SNR, linewidth, wavelength |
| ⚡ Detectors | 12 | NEP, responsivity, bandwidth, noise |
| 💎 Materials | 7 | Refractive index, Sellmeier, dispersion |
| 🌊 Wave Optics | 7 | Gaussian beams, ABCD matrices, cavities |
| ↕️ Polarization | 12 | Jones calculus, Stokes, retarders |
| 📡 Free-Space Comms | 7 | Link budget, beam spread, atmospheric loss |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Plotting:** Plotly.js (react-plotly.js)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
git clone <repo-url>
cd photonics-calculators
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects Next.js — click **Deploy**

Or via CLI:
```bash
npx vercel
```

## Physics References

Key sources underlying these calculators:

- **Saleh & Teich**, *Fundamentals of Photonics*, 3rd Ed. (2023)
- **Hecht**, *Optics*, 5th Ed. (2016)
- **Born & Wolf**, *Principles of Optics*, 7th Ed. (1999)
- **Siegman**, *Lasers* (1986)
- **Agrawal**, *Fiber-Optic Communication Systems*, 5th Ed. (2021)
- **IEC 60825-1**, Safety of laser products
- **ANSI Z136.1**, American National Standard for Safe Use of Lasers
- **MacLeod**, *Thin-Film Optical Filters*, 4th Ed. (2010)

## License

MIT
