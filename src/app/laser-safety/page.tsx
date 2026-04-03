"use client";

import Link from "next/link";

const calculators = [
  { name: "MPE Calculator", href: "/laser-safety/mpe", desc: "Maximum Permissible Exposure per IEC 60825-1 / ANSI Z136" },
  { name: "NOHD Calculator", href: "/laser-safety/nohd", desc: "Nominal Ocular Hazard Distance" },
  { name: "Classification Calculator", href: "/laser-safety/classification", desc: "Determine laser class from power, wavelength, and emission duration" },
  { name: "Pulsed MPE Calculator", href: "/laser-safety/pulsed-mpe", desc: "MPE for pulsed lasers with PRF considerations" },
  { name: "Extended Source MPE", href: "/laser-safety/extended-source", desc: "MPE for extended sources and diffuse reflections" },
  { name: "Peak Power Calculator", href: "/laser-safety/peak-power", desc: "Peak power and pulse energy conversions" },
  { name: "Retinal Hazard Analysis", href: "/laser-safety/retinal-hazard", desc: "Retinal irradiance and image size calculations" },
  { name: "Corneal Limits", href: "/laser-safety/corneal-limits", desc: "Corneal exposure limits for UV and IR" },
  { name: "Skin MPE", href: "/laser-safety/skin-mpe", desc: "Maximum permissible exposure for skin" },
  { name: "UV Hazard", href: "/laser-safety/uv-hazard", desc: "Ultraviolet hazard analysis" },
  { name: "Infrared Hazard", href: "/laser-safety/infrared-hazard", desc: "IR-A, IR-B, IR-C hazard assessment" },
  { name: "Beam Expander", href: "/laser-safety/beam-expander", desc: "Beam expansion and irradiance changes" },
  // New calculators
  { name: "Aversion Response Time", href: "/laser-safety/aversion-response", desc: "MPE at natural blink/aversion response (0.25s)" },
  { name: "Multiple Wavelength MPE", href: "/laser-safety/multiple-wavelength", desc: "Additive hazard ratios for multi-wavelength lasers" },
  { name: "Scan Failure Analysis", href: "/laser-safety/scan-failure", desc: "Hazard when scanning laser fails to scan" },
  { name: "Eye-Safe Wavelength", href: "/laser-safety/eye-safe-wavelength", desc: "Identifies eye-safe spectral regions (1400-1800nm)" },
  { name: "Atmospheric Attenuation", href: "/laser-safety/atmospheric-attenuation", desc: "Beer-Lambert attenuation for outdoor laser safety" },
  { name: "Required Optical Density", href: "/laser-safety/optical-density", desc: "Minimum OD for laser protective eyewear" },
  { name: "Enclosure Classification", href: "/laser-safety/enclosure-class", desc: "Laser enclosure safety class assessment" },
  { name: "Interlock Time Calculation", href: "/laser-safety/interlock-design", desc: "Required interlock/shutter response time" },
];

export default function LaserSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Laser Safety</h1>
      <p className="text-gray-400 mb-8">Calculators for laser safety analysis — MPE, NOHD, and classification per IEC 60825-1 and ANSI Z136.</p>
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
