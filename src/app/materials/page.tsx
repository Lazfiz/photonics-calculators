import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Optical Materials Calculators",
  description: "Optical materials calculators for refractive index, Sellmeier fits, thermal properties, absorption, and nonlinear material behavior.",
};


const calculators = [
  { name: "Sellmeier Index", href: "/materials/sellmeier", desc: "Refractive index from Sellmeier dispersion coefficients" },
  { name: "Schott Glass Catalog", href: "/materials/schott-glass", desc: "n vs λ for common SCHOTT optical glasses" },
  { name: "Chromatic Dispersion", href: "/materials/chromatic-dispersion", desc: "Material dispersion dn/dλ from Sellmeier coefficients" },
  { name: "Group Index", href: "/materials/group-index", desc: "Group index n_g vs phase index n for pulse propagation" },
  { name: "Transparency Range", href: "/materials/transparency-range", desc: "UV to IR transmission range for common optical materials" },
  { name: "Birefringent Crystals", href: "/materials/birefringent-crystals", desc: "Ordinary & extraordinary refractive indices for calcite, quartz, LiNbO₃, BBO, KDP" },
  { name: "Nonlinear Index (n₂)", href: "/materials/nonlinear-index", desc: "Kerr nonlinear refractive index for glasses, crystals, semiconductors" },
  { name: "Thermal Expansion", href: "/materials/thermal-expansion", desc: "CTE values and dimensional change from temperature" },
  { name: "Photoelastic Constants", href: "/materials/photoelastic", desc: "Stress-optic coefficients p₁₁, p₁₂, p₄₄ for glasses and crystals" },
  { name: "Verdet Constant", href: "/materials/verdet-constant", desc: "Faraday rotation coefficient for TGG, YIG, paramagnetic glasses" },
  { name: "Infrared Materials", href: "/materials/infrared-materials", desc: "Ge, Si, ZnSe, chalcogenides — IR refractive index and properties" },
  { name: "Cauchy Model", href: "/materials/cauchy", desc: "Simplified dispersion model n(λ) = A + B/λ² + C/λ⁴" },
  { name: "Abbe Number", href: "/materials/abbe", desc: "Chromatic dispersion measure from refractive indices" },
  { name: "Group Velocity Dispersion", href: "/materials/gvd", desc: "Pulse broadening from material dispersion" },
  { name: "Fresnel Losses", href: "/materials/fresnel", desc: "Reflection/transmission at dielectric interfaces" },
  { name: "Brewster Angle", href: "/materials/brewster-tir", desc: "Brewster angle & total internal reflection" },
  { name: "TIR Critical Angle", href: "/materials/tir", desc: "Critical angle for total internal reflection" },
  { name: "Thermal dn/dT", href: "/materials/thermal-dndt", desc: "Temperature-dependent refractive index change" },
  { name: "Material Absorption", href: "/materials/absorption", desc: "Beer-Lambert absorption coefficient calculator" },
  { name: "Birefringence", href: "/materials/birefringence", desc: "Ordinary & extraordinary refractive indices" },
  { name: "OH Absorption in Silica", href: "/materials/oh-absorption", desc: "Hydroxyl absorption peaks and loss spectra in silica fibers" },
  { name: "Rare Earth Absorption", href: "/materials/rare-earth-absorption", desc: "Er³⁺, Nd³⁺, Yb³⁺, Tm³⁺, Ho³⁺ absorption cross-sections" },
  { name: "Semiconductor Bandgap", href: "/materials/semiconductor-bandgap", desc: "Varshni equation: Eg vs temperature for GaAs, Si, GaN, InP, etc." },
  { name: "Two-Photon Absorption", href: "/materials/two-photon-absorption", desc: "β₂PA coefficient and intensity-dependent transmission" },
  { name: "Brillouin Scattering", href: "/materials/brillouin-scattering", desc: "SBS frequency shift, gain coefficient, and power threshold" },
  { name: "Raman Scattering", href: "/materials/raman-scattering", desc: "Raman gain spectra and Stokes shift for optical materials" },
  { name: "Color Centers", href: "/materials/color-centers", desc: "NV⁻, SiV⁻, F-centers: absorption/emission cross-sections" },
  { name: "Photorefractive Effect", href: "/materials/photorefractive", desc: "Light-induced index change: Δn, EO coefficients, 2BC gain" },
  { name: "Optical Glass Catalog", href: "/materials/optical-glass-catalog", desc: "Interactive glass map (n_d vs V_d) with Sellmeier dispersion for SCHOTT/OHARA glasses" },
  { name: "Infrared Glass Materials", href: "/materials/infrared-glass", desc: "Ge, Si, ZnSe, chalcogenides — IR transmission, dn/dT, thermal properties" },
  { name: "UV Optical Materials", href: "/materials/uv-materials", desc: "Deep UV materials: fused silica, CaF₂, MgF₂, LiF, sapphire — dispersion & transmission" },
  { name: "X-ray Optics Materials", href: "/materials/x-ray-optics", desc: "δ, β, penetration depth for Be, diamond, Si, Ni, Au — X-ray refractive index" },
  { name: "Diamond Optics", href: "/materials/diamond-optics", desc: "Diamond dispersion, thermal conductivity, bandgap — the ultimate optical material" },
  { name: "Sapphire Properties", href: "/materials/sapphire-properties", desc: "Al₂O₃ uniaxial dispersion, birefringence, thermo-optic, thermal properties" },
  { name: "Quartz Crystal Properties", href: "/materials/quartz-crystal", desc: "SiO₂ uniaxial dispersion, birefringence, optical activity, piezoelectric" },
  { name: "Calcite Properties", href: "/materials/calcite-properties", desc: "CaCO₃ extreme birefringence, walk-off angle, beam displacement calculator" },
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
