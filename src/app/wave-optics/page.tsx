"use client";

import Link from "next/link";

const calculators = [
  { name: "Gaussian Beam Propagation", href: "/wave-optics/gaussian-beam", desc: "Beam waist, Rayleigh range, divergence, and spot size" },
  { name: "ABCD Matrix", href: "/wave-optics/abcd-matrix", desc: "Ray transfer matrix analysis for optical systems" },
  { name: "Cavity Stability", href: "/wave-optics/cavity-stability", desc: "g-parameter stability diagram for two-mirror resonators" },
  { name: "Gouy Phase Shift", href: "/wave-optics/gouy-phase", desc: "Extra phase accumulated by a Gaussian beam through focus" },
  { name: "Michelson Interferometer", href: "/wave-optics/interferometer", desc: "Fringe visibility and intensity for two-beam interference" },
  { name: "M² Beam Quality Factor", href: "/wave-optics/m2-factor", desc: "Real beam quality vs. diffraction limit" },
  { name: "Mode Matching", href: "/wave-optics/mode-matching", desc: "Optimal lens for coupling Gaussian beam modes" },
  { name: "Hermite-Gaussian Modes", href: "/wave-optics/hermite-gaussian", desc: "TEMmn rectangular higher-order Gaussian modes" },
  { name: "Laguerre-Gaussian Modes", href: "/wave-optics/laguerre-gaussian", desc: "Donut modes with orbital angular momentum" },
  { name: "Bessel Beam", href: "/wave-optics/bessel-beam", desc: "Non-diffracting beam profiles and propagation" },
  { name: "Beam Quality M² Analysis", href: "/wave-optics/beam-quality", desc: "Detailed M² measurement, BPP, and Strehl analysis" },
  { name: "Diffraction Integral", href: "/wave-optics/diffraction-integral", desc: "Fresnel/Kirchhoff diffraction for circular and slit apertures" },
  { name: "Spatial Filter Pinhole", href: "/wave-optics/spatial-filter", desc: "Optimal pinhole sizing for spatial filtering" },
  { name: "Etalon Finesse", href: "/wave-optics/etalon-finesse", desc: "Fabry-Pérot transmission, finesse, and spectral analysis" },
  { name: "Ring Resonator", href: "/wave-optics/ring-cavity", desc: "Ring cavity stability, modes, and finesse" },
];

export default function WaveOpticsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Wave Optics</h1>
      <p className="text-gray-400 mb-8">Calculators for Gaussian beam propagation and ABCD matrix ray tracing.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((calc) => (
          <Link key={calc.href} href={calc.href} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 hover:bg-gray-900/80 transition">
            <h2 className="text-lg font-semibold text-white">{calc.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
