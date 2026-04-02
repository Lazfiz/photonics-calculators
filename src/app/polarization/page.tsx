"use client";

import Link from "next/link";

const calculators = [
  { name: "Stokes Parameters", href: "/polarization/stokes", desc: "Describe polarization state from intensity measurements" },
  { name: "Jones Calculus", href: "/polarization/jones-calculus", desc: "Matrix formalism for polarized light propagation" },
  { name: "Jones Matrix Chain", href: "/polarization/jones-chain", desc: "Chain multiple Jones matrices and visualize polarization transformation" },
  { name: "Mueller Matrix Calculator", href: "/polarization/mueller-matrix", desc: "Chain optical elements using Mueller matrices and compute output Stokes vector" },
  { name: "Poincaré Sphere", href: "/polarization/poincare-sphere", desc: "Visualize polarization states on the Poincaré sphere" },
  { name: "Birefringence", href: "/polarization/birefringence", desc: "Ordinary & extraordinary refractive indices, phase retardation" },
  { name: "Waveplate Order", href: "/polarization/waveplate-order", desc: "Design zero-order and multi-order waveplates" },
  { name: "Waveplate Thickness", href: "/polarization/waveplate-thickness", desc: "Calculate required crystal thickness for waveplates" },
  { name: "Retarder Design", href: "/polarization/retarder", desc: "Design waveplate retarders and visualize transformation on Poincaré sphere" },
  { name: "Extinction Ratio", href: "/polarization/extinction-ratio", desc: "Polarizer contrast and transmission analysis" },
  { name: "Polarizer Extinction", href: "/polarization/polarizer-extinction", desc: "Extinction ratio, Malus's law, and cascaded polarizer performance" },
  { name: "PMD", href: "/polarization/pmd", desc: "Polarization mode dispersion in optical fibers" },
];

export default function PolarizationPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Polarization</h1>
      <p className="text-gray-400 mb-8">Calculators for polarization states, birefringence, and polarization optics.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 hover:bg-gray-900/80 transition"
          >
            <h2 className="text-lg font-semibold text-white">{calc.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
