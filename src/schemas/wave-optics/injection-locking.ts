import { facetCouplingRate, lockingRange } from "../../physics/wave-optics/injection-locking";
import { defineSchema } from "../types";

const LANG = "Lang R. (1982). Injection locking properties of a semiconductor laser. IEEE J. Quantum Electron. 18, 976–983, " +
  "doi:10.1109/jqe.1982.1071632; Mogensen F., Olesen H., Jacobsen G. (1985). Locking conditions and stability properties for a " +
  "semiconductor laser with external light injection. IEEE J. Quantum Electron. 21, 784–793, doi:10.1109/jqe.1985.1072760; " +
  "Adler R. (1946). A study of locking phenomena in oscillators. Proc. IRE 34, 351–357, doi:10.1109/jrproc.1946.229930 (α = 0). " +
  "Static range −k_c√ρ√(1+α²) ≤ Δω ≤ k_c√ρ as stated in the physics module's header (equation numbers not cited).";
const KONDRATIEV = "Kondratiev N. M., Lobanov V. E., Shitikov A. E. et al. (2023). Recent advances in laser self-injection locking to " +
  "high-Q microresonators. Front. Phys. 18, 21305, doi:10.1007/s11467-022-1245-3 (arXiv:2212.05730), κ_do = (1 − R_o²)/(τ_LC R_o) " +
  "defined with Eq. (4), R_o the facet amplitude reflectivity; with R = R_o²: k_c = (1 − R)/(τ_rt √R), τ_rt = 2 n_g L/c.";

export default defineSchema({
  href: "/wave-optics/injection-locking",
  inputs: [
    { key: "masterPower", label: "Injected master power P_inj (mode-matched)", unit: "mW", toSI: 1e-3, siUnit: "W", default: 0.1, min: 0, max: 1e9 },
    { key: "slavePower", label: "Slave output P from the injection facet", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 1e-9, max: 1e9 },
    { key: "couplingRate", label: "Coupling rate k_c/2π", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 24.51, min: 0, max: 1e4 },
    { key: "alpha", label: "Linewidth enhancement factor α", unit: "", toSI: 1, siUnit: "", default: 1, min: -20, max: 20 },
    { key: "detuning", label: "Detuning f_master − f_slave", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: -1, min: -1e5, max: 1e5 },
    { key: "cavityLength", label: "Slave cavity length L (for the k_c estimate)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 300, min: 1, max: 1e6 },
    { key: "facetR", label: "Injection facet reflectance R", unit: "", toSI: 1, siUnit: "", default: 0.32, min: 1e-4, max: 0.9999 },
    { key: "ng", label: "Group index n_g", unit: "", toSI: 1, siUnit: "", default: 3.9, min: 1, max: 6 },
  ],
  outputs: [
    { key: "lowerEdge", label: "Lower locking edge −k_c√ρ√(1+α²)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "upperEdge", label: "Upper locking edge k_c√ρ", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "width", label: "Locking range width", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "injectionRatio", label: "Injection ratio ρ = P_inj/P", unit: "", toSI: 1, siUnit: "" },
    { key: "injectionRatioDb", label: "Injection ratio ρ", unit: "dB", toSI: 1, siUnit: "" },
    { key: "adlerRange", label: "Adler range ±k_c√ρ (α = 0)", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "locked", label: "Detuning inside the static range (1 = yes, 0 = no)", unit: "", toSI: 1, siUnit: "" },
    { key: "facetCoupling", label: "k_c/2π estimated from the cavity (1 − R)/(τ_rt√R)/2π", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
  ],
  compute({ masterPower, slavePower, couplingRate, alpha, detuning, cavityLength, facetR, ng }) {
    const rho = masterPower / slavePower;
    // Rates here are k_c/2π and Δf in Hz; the range formula is linear in the rate, so the 2π cancels.
    const { lower, upper } = lockingRange(couplingRate, rho, alpha);
    const adler = lockingRange(couplingRate, rho, 0);
    const warnings: string[] = [];
    if (rho > 0.1) warnings.push("Strong injection (ρ > −10 dB): the weak-injection locking range and its asymmetry are only estimates.");
    if (!(rho > 0)) warnings.push("No injected power: ρ = 0, so the locking range is zero and ρ in dB is undefined.");
    return {
      values: {
        lowerEdge: lower,
        upperEdge: upper,
        width: upper - lower,
        injectionRatio: rho,
        injectionRatioDb: 10 * Math.log10(rho),
        adlerRange: adler.upper,
        locked: detuning >= lower && detuning <= upper ? 1 : 0,
        facetCoupling: facetCouplingRate(facetR, cavityLength, ng) / (2 * Math.PI),
      },
      warnings,
    };
  },
  checks: [
    {
      // k_c/2π = 24.51 GHz, ρ = 0.1/10 = 0.01, √ρ = 0.1, α = 1: upper = 2.451 GHz; lower = −2.451 √2 = −3.46623744 GHz;
      // width = 2.451 (1 + √2) = 5.91723744 GHz; ρ = −20 dB; Adler ±2.451 GHz; Δf = −1 GHz is inside, so locked = 1.
      source: LANG,
      basis: "computed",
      inputs: { masterPower: 0.1, slavePower: 10, couplingRate: 24.51, alpha: 1, detuning: -1 },
      expect: { lowerEdge: -3.4662374413764563, upperEdge: 2.451, width: 5.917237441376455, injectionRatioDb: -20, adlerRange: 2.451, locked: 1 },
      tolerance: 1e-8,
    },
    {
      // k_c/2π = 10 GHz, ρ = 1/4, √ρ = 0.5, α = 3: upper = 5 GHz; lower = −5 √10 = −15.8113883 GHz; ρ = 10 log10(0.25) = −6.02059991 dB.
      source: LANG,
      basis: "computed",
      inputs: { masterPower: 1, slavePower: 4, couplingRate: 10, alpha: 3, detuning: 6 },
      expect: { lowerEdge: -15.811388300841898, upperEdge: 5, injectionRatioDb: -6.020599913279624 },
      tolerance: 1e-8,
    },
    {
      // R = 0.32, L = 300 µm, n_g = 3.9: τ_rt = 2 × 3.9 × 300e-6/c = 7.8053998 ps; k_c = 0.68/(τ_rt × 0.56568542) = 1.540e11 rad/s;
      // /2π = 24.5108798 GHz.
      source: KONDRATIEV,
      basis: "computed",
      inputs: { cavityLength: 300, facetR: 0.32, ng: 3.9 },
      expect: { facetCoupling: 24.51087982783198 },
      tolerance: 1e-8,
    },
  ],
});
