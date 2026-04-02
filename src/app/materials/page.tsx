"use client";

import Link from "next/link";

const calculators = [
  { name: "Sellmeier Index", href: "/materials/sellmeier", desc: "Refractive index from Sellmeier dispersion coefficients" },
  { name: "Cauchy Model", href: "/materials/cauchy", desc: "Simplified dispersion model n(λ) = A + B/λ² + C/λ⁴" },
  { name: "Abbe Number", href: "/materials/abbe", desc: "Chromatic dispersion measure from refractive indices" },
  { name: "Group Velocity Dispersion", href: "/materials/gvd", desc: "Pulse broadening from material dispersion" },
  { name: "Fresnel Losses", href: "/materials/fresnel", desc: "Reflection/transmission at dielectric interfaces" },
  { name: "Brewster Angle", href: "/materials/brewster-tir", desc: "Brewster angle & total internal reflection" },
  { name: "TIR Critical Angle", href: "/materials/tir", desc: "Critical angle for total internal reflection" },
  { name: "Thermal dn/dT", href: "/materials/thermal-dndt", desc: "Temperature-dependent refractive index change" },
  { name: "Material Absorption", href: "/materials/absorption", desc: "Beer-Lambert absorption coefficient calculator" },
  { name: "Birefringence", href: "/materials/birefringence", desc: "Ordinary & extraordinary refractive indices" },
];

export default function MaterialsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Optical Materials</h1>
      <p className="text-gray-400 mb-8">Calculators for optical material properties and surface interactions.</p>
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
