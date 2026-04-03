import Link from "next/link";
import AboutFooter from "./about-footer";

const categories = [
  {
    href: "/laser-safety",
    emoji: "🔴",
    title: "Laser Safety",
    description: "NOHD, MPE, OD calculations and eye safety tools",
    hoverDescription: "Calculate Nominal Ocular Hazard Distance, Maximum Permissible Exposure, required Optical Density, and AEL classifications per IEC 60825-1 and ANSI Z136.1.",
    count: 12,
  },
  {
    href: "/fiber-optics",
    emoji: "🔷",
    title: "Fiber Optics",
    description: "NA, V-number, attenuation, splice loss calculators",
    hoverDescription: "Numerical aperture, V-number and mode count, connector and splice loss budgets, bend loss, dispersion, and nonlinear threshold calculations.",
    count: 16,
  },
  {
    href: "/thin-film",
    emoji: "🌈",
    title: "Thin Film",
    description: "Coating design, reflectance, optical thickness tools",
    hoverDescription: "Single and multilayer AR coating design, Bragg reflectors, dichroic filters, quarter-wave stacks, angle-of-incidence shifts, and coating stress analysis.",
    count: 11,
  },
  {
    href: "/imaging",
    emoji: "📷",
    title: "Imaging",
    description: "FOV, DOF, magnification, lens calculators",
    hoverDescription: "Field of view, depth of field, modulation transfer function, lens equation, f-number, sensor format comparison, and aberration estimation.",
    count: 16,
  },
  {
    href: "/spectroscopy",
    emoji: "📊",
    title: "Spectroscopy",
    description: "Wavelength, resolution, SNR, linewidth tools",
    hoverDescription: "Spectral resolution, signal-to-noise ratio, FWHM and linewidth analysis, etendue, free spectral range, and diffraction grating equations.",
    count: 13,
  },
  {
    href: "/detectors",
    emoji: "⚡",
    title: "Detectors",
    description: "NEP, responsivity, bandwidth, noise calculators",
    hoverDescription: "Noise-equivalent power, responsivity, dark current, shot noise, thermal noise, full-well capacity, SNDR, and CCD vs CMOS comparison.",
    count: 12,
  },
  {
    href: "/materials",
    emoji: "💎",
    title: "Materials",
    description: "Refractive index, dispersion, absorption data",
    hoverDescription: "Sellmeier equation fitting, group velocity dispersion, Abbe number, Brewster's angle, TIR critical angle, and material absorption coefficients.",
    count: 7,
  },
  {
    href: "/wave-optics",
    emoji: "🌊",
    title: "Wave Optics",
    description: "Interference, diffraction, coherence calculators",
    hoverDescription: "Gaussian beam propagation, ABCD matrix method, cavity stability, Gouy phase, M² factor, mode matching, and interferometer analysis.",
    count: 7,
  },
  {
    href: "/polarization",
    emoji: "↕️",
    title: "Polarization",
    description: "Jones vectors, Stokes parameters, retarders",
    hoverDescription: "Jones and Mueller calculus, Poincaré sphere visualization, waveplate design, PMD, birefringence, extinction ratio, and Stokes parameter analysis.",
    count: 12,
  },
  {
    href: "/free-space-comms",
    emoji: "📡",
    title: "Free-Space Comms",
    description: "Link budget, beam spread, atmospheric loss",
    hoverDescription: "Link margin analysis, beam divergence, pointing loss, scintillation, turbulence effects, and weather attenuation models.",
    count: 7,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="px-6 py-16 mx-auto max-w-7xl sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Photonics Calculators
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            113 interactive optics and photonics calculators
          </p>
          <p className="mt-2 text-sm text-gray-500">
            All calculators are free and open source
          </p>
          {/* Search Bar Placeholder */}
          <div className="mt-8 mx-auto max-w-md">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-500 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search calculators... (coming soon)
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="px-6 pb-24 mx-auto max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{category.emoji}</span>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {category.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-2">
                {category.description}
              </p>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                {category.hoverDescription}
              </div>
              <span className="text-sm text-blue-500 group-hover:text-blue-400 flex items-center gap-1">
                {category.count} calculators
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <AboutFooter />
    </main>
  );
}
