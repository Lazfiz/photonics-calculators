import type { Metadata } from "next";
import Link from "next/link";
import LaserSafetyDisclaimer from "../../components/laser-safety-disclaimer";

export const metadata: Metadata = {
  title: "Laser Safety Calculators",
  description: "Educational laser safety calculators for MPE, NOHD, exposure limits, classification, and hazard analysis. Do not use as compliance-grade outputs without formal laser safety review.",
};


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
  { name: "Beam Diameter Conversion", href: "/laser-safety/beam-diameter-conversion", desc: "Convert 1/e², 1/e, and FWHM beam diameters" },
  { name: "Power Density", href: "/laser-safety/power-density", desc: "Irradiance from power and beam diameter (Gaussian/top-hat)" },
  { name: "Scanned Beam MPE", href: "/laser-safety/scanned-mpe", desc: "MPE for scanned beams based on dwell time per point" },
  { name: "Thermal vs Photochemical MPE", href: "/laser-safety/thermal-vs-photochemical", desc: "Compare thermal and photochemical MPE limits" },
  { name: "Blue Light Hazard", href: "/laser-safety/blue-light-hazard", desc: "Blue-light weighted irradiance and risk group (IEC 62471)" },
  { name: "UV Exposure Limits", href: "/laser-safety/uv-exposure", desc: "Actinic UV exposure limits (ICNIRP/ACGIH)" },
  { name: "IR Corneal Exposure", href: "/laser-safety/infrared-corneal", desc: "Corneal MPE for IR lasers (1400nm–1mm)" },
  { name: "Maximum Exposure Duration", href: "/laser-safety/maximum-exposure", desc: "Max safe exposure time before exceeding MPE" },
  { name: "AEL Limits", href: "/laser-safety/ael-limits", desc: "Accessible Emission Limits by laser classification (IEC 60825-1)" },
  { name: "OD Requirements", href: "/laser-safety/od-requirements", desc: "Required optical density for protective eyewear" },
  { name: "Safe Exposure Duration", href: "/laser-safety/exposure-duration", desc: "Maximum safe CW exposure time before exceeding MPE" },
  { name: "Beam Divergence Hazards", href: "/laser-safety/beam-divergence-hazards", desc: "Gaussian beam propagation and hazard distance analysis" },
  { name: "Skin Hazard Assessment", href: "/laser-safety/skin-hazard", desc: "Skin exposure risk evaluation per ANSI Z136.1" },
  { name: "Safe Viewing Distance", href: "/laser-safety/viewing-distance", desc: "NOHD calculation for direct beam viewing" },
  { name: "Thermal Lens Hazard", href: "/laser-safety/thermal-lens-hazard", desc: "Thermal lensing risk to protective eyewear" },
  { name: "Diffuse Reflection Hazard", href: "/laser-safety/diffuse-reflection", desc: "Lambertian reflection hazard with extended-source MPE" },
];

export default function LaserSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Laser Safety</h1>
      <p className="text-gray-400 mb-4">Educational calculators for laser safety analysis — MPE, NOHD, and classification concepts with explicit trust boundaries.</p>
      <LaserSafetyDisclaimer />
      <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
        <p className="font-semibold text-amber-200">Current decision</p>
        <p className="mt-2">
          This category remains <span className="font-semibold">educational-only</span> until the pages are reviewed against the full standards tables and validated through a qualified laser-safety workflow. Unsupported regimes should be disabled rather than approximated.
        </p>
      </div>
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
