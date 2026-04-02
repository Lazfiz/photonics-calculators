"use client";

import Link from "next/link";

const calculators = [
  { name: "Spectral Resolution", href: "/spectroscopy/resolution", desc: "Grating spectrometer resolving power and resolution" },
  { name: "Blackbody Radiation", href: "/spectroscopy/blackbody", desc: "Planck's law — spectral radiance and total power" },
];

export default function SpectroscopyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Calculators for spectrometer design and blackbody radiation.</p>
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
