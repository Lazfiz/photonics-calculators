import Link from "next/link";

const categories = [
  {
    href: "/laser-safety",
    emoji: "🔴",
    title: "Laser Safety",
    description: "NOHD, MPE, OD calculations and eye safety tools",
  },
  {
    href: "/fiber-optics",
    emoji: "🔷",
    title: "Fiber Optics",
    description: "NA, V-number, attenuation, splice loss calculators",
  },
  {
    href: "/thin-film",
    emoji: "🌈",
    title: "Thin Film",
    description: "Coating design, reflectance, optical thickness tools",
  },
  {
    href: "/imaging",
    emoji: "📷",
    title: "Imaging",
    description: "FOV, DOF, magnification, lens calculators",
  },
  {
    href: "/spectroscopy",
    emoji: "📊",
    title: "Spectroscopy",
    description: "Wavelength, resolution, SNR, linewidth tools",
  },
  {
    href: "/detectors",
    emoji: "⚡",
    title: "Detectors",
    description: "NEP, responsivity, bandwidth, noise calculators",
  },
  {
    href: "/materials",
    emoji: "💎",
    title: "Materials",
    description: "Refractive index, dispersion, absorption data",
  },
  {
    href: "/wave-optics",
    emoji: "🌊",
    title: "Wave Optics",
    description: "Interference, diffraction, coherence calculators",
  },
  {
    href: "/polarization",
    emoji: "↕️",
    title: "Polarization",
    description: "Jones vectors, Stokes parameters, retarders",
  },
  {
    href: "/free-space-comms",
    emoji: "📡",
    title: "Free-Space Comms",
    description: "Link budget, beam spread, atmospheric loss",
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
            100+ interactive optics and photonics tools
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="px-6 pb-24 mx-auto max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{category.emoji}</span>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {category.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                {category.description}
              </p>
              <span className="text-sm text-blue-500 group-hover:text-blue-400 flex items-center gap-1">
                10 calculators
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
