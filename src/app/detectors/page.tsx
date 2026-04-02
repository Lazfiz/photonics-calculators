"use client";

import Link from "next/link";

const calculators = [
  { name: "NEP Calculator", href: "/detectors/nep", desc: "Noise Equivalent Power from dark current, bandwidth, and responsivity" },
  { name: "Responsivity", href: "/detectors/responsivity", desc: "Photodetector responsivity from quantum efficiency and wavelength" },
];

export default function DetectorsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Photodetectors</h1>
      <p className="text-gray-400 mb-8">Calculators for photodetector performance metrics.</p>
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
