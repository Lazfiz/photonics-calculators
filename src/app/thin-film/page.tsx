"use client";

import Link from "next/link";

const calculators = [
  { name: "Single Layer AR Coating", href: "/thin-film/single-ar", desc: "Quarter-wave antireflection coating design" },
  { name: "Bragg Reflector", href: "/thin-film/bragg-reflector", desc: "Dielectric stack reflectance and stopband" },
  { name: "Double Layer AR", href: "/thin-film/double-layer-ar", desc: "Two-layer broadband antireflection" },
  { name: "Multilayer AR", href: "/thin-film/multilayer-ar", desc: "Multi-layer V-coat and broadband AR" },
  { name: "Quarter Wave Stack", href: "/thin-film/quarter-wave", desc: "Basic quarter-wave optical thickness" },
  { name: "Edge Filter", href: "/thin-film/edge-filter", desc: "Long-pass / short-pass edge filter" },
  { name: "Bandpass Filter", href: "/thin-film/bandpass-filter", desc: "Fabry-Perot multi-cavity bandpass" },
  { name: "Notch Filter", href: "/thin-film/notch-filter", desc: "Rejection notch filter design" },
  { name: "Gradient Index", href: "/thin-film/gradient-index", desc: "Continuously graded index coating" },
  { name: "Protected Silver", href: "/thin-film/protected-silver", desc: "Protected silver mirror with overcoat" },
  { name: "Enhanced Aluminum", href: "/thin-film/enhanced-aluminum", desc: "Dielectric-enhanced Al mirror" },
  { name: "Dielectric HR Mirror", href: "/thin-film/dielectric-high-reflector", desc: "High reflector quarter-wave stack" },
  { name: "Dual-Band AR", href: "/thin-film/dual-band-ar", desc: "Two-wavelength AR coating" },
  { name: "Coating Stress", href: "/thin-film/coating-stress", desc: "Thin film stress analysis" },
  { name: "Dichroic Filter", href: "/thin-film/dichroic", desc: "Color-selective dichroic coating" },
  { name: "Long-Pass Filter", href: "/thin-film/long-pass", desc: "Long-pass edge filter" },
  { name: "Short-Pass Filter", href: "/thin-film/short-pass", desc: "Short-pass edge filter" },
  { name: "Angle Shift", href: "/thin-film/angle-shift", desc: "Wavelength shift vs angle of incidence" },
];

export default function ThinFilmPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Thin Film Optics</h1>
      <p className="text-gray-400 mb-8">Calculators for thin film coatings, AR coatings, and dielectric stacks.</p>
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
