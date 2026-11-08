import {
  coreFwhm, coreRadius, maxPropagationDistance, radialWavenumber,
} from "../../physics/wave-optics/bessel-beam";
import { rayleighRange } from "../../physics/wave-optics/gaussian-beam";
import { defineSchema } from "../types";

const SOURCE =
  "Durnin J., Miceli J. J., Eberly J. H. (1987). Diffraction-free beams. Phys. Rev. Lett. 58, 1499–1501, " +
  "doi:10.1103/PhysRevLett.58.1499 (J₀ beam from plane waves on a cone, k_r = k sin θ); first zero j₀,₁ = 2.404826 of J₀ " +
  "(Abramowitz M., Stegun I. A. (1964). Handbook of Mathematical Functions, Table 9.5); J₀(x)² = ½ at x = 1.126364; " +
  "range z_max = R/tan θ (geometric estimate) as in McGloin D., Dholakia K. (2005). Bessel beams: diffraction in a new light. " +
  "Contemp. Phys. 46, 15–28, doi:10.1080/0010751042000275259";

export default defineSchema({
  href: "/wave-optics/bessel-beam",
  inputs: [
    { key: "wavelength", label: "Wavelength in the medium λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632.8, min: 200, max: 11000 },
    { key: "alpha", label: "Cone half-angle θ", unit: "rad", toSI: 1, siUnit: "rad", default: 0.01, min: 1e-5, max: 1 },
    { key: "R", label: "Input beam radius at the axicon R", unit: "mm", toSI: 1e-3, siUnit: "m", default: 5, min: 0.01, max: 1000 },
    { key: "maxR", label: "Plotted radius (display only, no effect on the results)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 200, min: 1, max: 1e7 },
  ],
  outputs: [
    { key: "radialWavenumber", label: "Radial wavenumber k_r = (2π/λ) sin θ", unit: "1/mm", toSI: 1e3, siUnit: "1/m" },
    { key: "coreRadius", label: "Core radius (first dark ring) j₀,₁/k_r", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "coreFwhm", label: "Core FWHM of the J₀² intensity", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "maxDistance", label: "Non-diffracting range z_max = R/tan θ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "gaussianRayleighRange", label: "Rayleigh range of a Gaussian with waist r₀", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rings", label: "Rings across the input ≈ k_r R/π", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, alpha, R }) {
    const kr = radialWavenumber(wavelength, alpha);
    const r0 = coreRadius(kr);
    const warnings: string[] = [];
    if (alpha > 0.3) warnings.push("Above θ ≈ 0.3 rad the scalar (paraxial-amplitude) picture is only indicative.");
    return {
      values: {
        radialWavenumber: kr,
        coreRadius: r0,
        coreFwhm: coreFwhm(kr),
        maxDistance: maxPropagationDistance(R, alpha),
        gaussianRayleighRange: rayleighRange({ lambda: wavelength, w0: r0 }),
        rings: (kr * R) / Math.PI,
      },
      warnings,
    };
  },
  checks: [
    {
      // λ = 632.8 nm, θ = 0.01 rad, R = 5 mm: k_r = 2π sin(0.01)/632.8 nm = 99290.148 1/m, r₀ = 2.404826/k_r = 24.220183 µm,
      // FWHM = 2 · 1.1263642/k_r = 22.688338 µm, z_max = 5 mm/tan(0.01) = 499.98333 mm, z_R = π r₀²/λ = 2.9123143 mm, k_r R/π = 158.02518.
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 632.8, alpha: 0.01, R: 5 },
      expect: { coreRadius: 24.22018294383946, coreFwhm: 22.68833753707352, maxDistance: 499.9833332222211, gaussianRayleighRange: 2.9123142860993623, rings: 158.0251791113569 },
      tolerance: 1e-8,
    },
    {
      // λ = 1064 nm, θ = 0.1 rad, R = 2 mm: k_r = 589541.22 1/m, r₀ = 4.0791474 µm, FWHM = 3.8211550 µm, z_max = 19.933289 mm.
      source: SOURCE,
      basis: "computed",
      inputs: { wavelength: 1064, alpha: 0.1, R: 2 },
      expect: { coreRadius: 4.079147448270058, coreFwhm: 3.8211550418277747, maxDistance: 19.933288846518472, rings: 375.31359641664716 },
      tolerance: 1e-8,
    },
  ],
});
