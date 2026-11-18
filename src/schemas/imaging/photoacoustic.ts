import { DIFFUSION_MIN_RATIO, photoacousticSummary } from "../../physics/imaging/photoacoustic";
import { defineSchema } from "../types";

const XU_WANG = "Xu M., Wang L. V. (2006). Photoacoustic imaging in biomedicine. Rev. Sci. Instrum. 77, 041101. " +
  "https://doi.org/10.1063/1.2195024 (initial pressure p₀ = Γ μ_a F under stress and thermal confinement).";
const WANG_HU = "Wang L. V., Hu S. (2012). Photoacoustic tomography: in vivo imaging from organelles to organs. Science 335, 1458–1462. " +
  "https://doi.org/10.1126/science.1216210 (acoustic-resolution resolution R_A = 0.88 v_s/Δf and R_L = 0.71 v_s/(NA f₀), one-way detection).";
const WANG_WU = "Wang L. V., Wu H.-I. (2007). Biomedical Optics: Principles and Imaging, Wiley, ch. 5 (diffusion approximation: " +
  "μ_eff = √(3μ_a(μ_a + μ_s′)), F(z) = F₀ exp(−μ_eff z), transport mean free path 1/(μ_a + μ_s′)).";

const ICNIRP = "ICNIRP (2013). ICNIRP guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 μm. " +
  "Health Phys. 105(3), 271–295, https://doi.org/10.1097/HP.0b013e3182983fd4, skin limits, 400–1400 nm (C_A = 10^(0.002(λ − 700 nm)) for 700–1050 nm).";

const NO_BACKGROUND_ATTENUATION = "The background μ_a is 0, so μ_eff is 0 and the light is not attenuated: there is no finite penetration depth.";
const NO_TRANSPORT = "Background μ_a and μ_s′ are both 0, so the transport mean free path is infinite.";

export default defineSchema({
  href: "/imaging/photoacoustic",
  inputs: [
    { key: "laserWavelength", label: "Wavelength (skin limits only; 1400 nm is the IR-B band edge)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 750, min: 400, max: 1400 },
    { key: "pulseWidth", label: "Pulse width", unit: "ns", toSI: 1e-9, siUnit: "s", default: 5, min: 1, max: 1000 },
    { key: "fluence", label: "Fluence on the skin", unit: "mJ/cm²", toSI: 10, siUnit: "J/m²", default: 20, min: 0, max: 200 },
    { key: "repetitionRate", label: "Repetition rate", unit: "Hz", toSI: 1, siUnit: "Hz", default: 10, min: 0.1, max: 10000 },
    { key: "absorptionCoeff", label: "Target absorption μ_a", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 5, min: 0, max: 1000 },
    { key: "backgroundAbsorption", label: "Background absorption μ_a", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 0.1, min: 0, max: 100 },
    { key: "reducedScattering", label: "Background reduced scattering μ_s′", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹", default: 10, min: 0, max: 200 },
    { key: "gruneisen", label: "Grüneisen parameter Γ", unit: "", toSI: 1, siUnit: "", default: 0.2, min: 0, max: 2 },
    { key: "targetDepth", label: "Target depth", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0, max: 100 },
    { key: "soundSpeed", label: "Speed of sound", unit: "m/s", toSI: 1, siUnit: "m/s", default: 1540, min: 1000, max: 2000 },
    { key: "detectorFreq", label: "Centre frequency f₀", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 5, min: 0.1, max: 200 },
    { key: "bandwidthPct", label: "Bandwidth Δf (% of f₀)", unit: "%", toSI: 0.01, siUnit: "", default: 100, min: 10, max: 200 },
    { key: "acousticNa", label: "Acoustic NA", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0.05, max: 1 },
    { key: "acousticAttenuation", label: "Acoustic attenuation", unit: "dB cm⁻¹ MHz⁻¹", toSI: 1e-4, siUnit: "dB m⁻¹ Hz⁻¹", default: 0.5, min: 0, max: 5 },
  ],
  outputs: [
    { key: "p0Surface", label: "Initial pressure at the surface p₀", unit: "kPa", toSI: 1e3, siUnit: "Pa" },
    { key: "muEff", label: "Background μ_eff", unit: "cm⁻¹", toSI: 100, siUnit: "m⁻¹" },
    { key: "penetrationDepth", label: "Optical penetration depth 1/μ_eff", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "transportMfp", label: "Transport mean free path", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "fluenceAtTarget", label: "Fluence at the target", unit: "mJ/cm²", toSI: 10, siUnit: "J/m²" },
    { key: "p0Target", label: "Initial pressure at the target", unit: "kPa", toSI: 1e3, siUnit: "Pa" },
    { key: "acousticLoss", label: "Acoustic loss to the surface at f₀", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "axialResolution", label: "Axial resolution", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "lateralResolution", label: "Lateral resolution", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "stressConfinementTime", label: "Stress confinement time (axial resolution / v_s)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "pulseLimit", label: "Skin limit, one pulse (ICNIRP 2013)", unit: "mJ/cm²", toSI: 10, siUnit: "J/m²" },
    { key: "pulseRatio", label: "Fluence over the one-pulse limit", unit: "", toSI: 1, siUnit: "" },
    { key: "averageIrradiance", label: "Average irradiance (fluence × rate)", unit: "mW/cm²", toSI: 10, siUnit: "W/m²" },
    { key: "irradianceLimit", label: "Skin irradiance limit, 10 s or longer", unit: "mW/cm²", toSI: 10, siUnit: "W/m²" },
    { key: "averageRatio", label: "Average irradiance over the long-exposure limit", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({
    laserWavelength, pulseWidth, fluence, repetitionRate, absorptionCoeff, backgroundAbsorption, reducedScattering, gruneisen,
    targetDepth, soundSpeed, detectorFreq, bandwidthPct, acousticNa, acousticAttenuation,
  }) {
    const r = photoacousticSummary({
      lambda: laserWavelength, pulseWidth, fluence, repRate: repetitionRate, mua: absorptionCoeff, muaBackground: backgroundAbsorption,
      musPrime: reducedScattering, gruneisen, depth: targetDepth, soundSpeed, centerFrequency: detectorFreq,
      bandwidthFraction: bandwidthPct, na: acousticNa, acousticAttenuation,
    });
    const warnings: string[] = [];
    if (reducedScattering < DIFFUSION_MIN_RATIO * backgroundAbsorption) {
      warnings.push(`Background μ_s′ is below ${DIFFUSION_MIN_RATIO} × μ_a: diffusion theory needs μ_s′ ≫ μ_a, so the attenuation is closer to Beer–Lambert e^(−μ_a z).`);
    }
    if (!(pulseWidth < r.stressConfinementTime)) {
      warnings.push("The pulse is not shorter than the stress confinement time (axial resolution / v_s), so p₀ = Γμ_aF overestimates the initial pressure.");
    }
    if (r.pulseRatio > 1) warnings.push("The fluence exceeds the ICNIRP skin limit for one pulse.");
    if (r.averageRatio > 1) warnings.push("The average irradiance exceeds the ICNIRP skin limit for exposures of 10 s or more.");
    const noAttenuation = !(r.muEff > 0);
    const noTransport = !(backgroundAbsorption + reducedScattering > 0);
    const reasons: Record<string, string> = {};
    if (noAttenuation) reasons.penetrationDepth = NO_BACKGROUND_ATTENUATION;
    if (noTransport) reasons.transportMfp = NO_TRANSPORT;
    return {
      values: {
        p0Surface: r.p0Surface,
        muEff: r.muEff,
        penetrationDepth: r.penetrationDepth,
        transportMfp: r.transportMfp,
        fluenceAtTarget: r.fluenceAtTarget,
        p0Target: r.p0Target,
        acousticLoss: r.acousticLossDb,
        axialResolution: r.axialResolution,
        lateralResolution: r.lateralResolution,
        stressConfinementTime: r.stressConfinementTime,
        pulseLimit: r.pulseLimit,
        pulseRatio: r.pulseRatio,
        averageIrradiance: r.averageIrradiance,
        irradianceLimit: r.irradianceLimit,
        averageRatio: r.averageRatio,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults: v = 1540 m/s, f₀ = 5 MHz, Δf = 100 % of f₀, NA 0.5. R_A = 0.88 × 1540/5e6 = 271.04 µm;
      // R_L = 0.71 × 1540/(0.5 × 5e6) = 437.36 µm; confinement time R_A/v = 0.88/5e6 = 176 ns.
      source: WANG_HU,
      basis: "computed",
      inputs: { soundSpeed: 1540, detectorFreq: 5, bandwidthPct: 100, acousticNa: 0.5 },
      expect: { axialResolution: 271.04, lateralResolution: 437.36, stressConfinementTime: 176 },
      tolerance: 1e-8,
    },
    {
      // Background μ_a = 0.1, μ_s′ = 10 cm⁻¹: μ_eff = √(3 × 0.1 × 10.1) = √3.03 = 1.7406895 cm⁻¹; 1/μ_eff = 5.74485 mm;
      // transport mfp 1/10.1 cm = 0.990099 mm; F(2 mm) = 20 exp(−1.7406895 × 0.2) = 14.1200302 mJ/cm²;
      // p₀ = 0.2 × 500 m⁻¹ × 141.200302 J/m² = 14.1200302 kPa. Surface: p₀ = 0.2 × 500 m⁻¹ × 200 J/m² = 20 000 Pa = 20 kPa.
      source: `${XU_WANG} ${WANG_WU}`,
      basis: "computed",
      inputs: { backgroundAbsorption: 0.1, reducedScattering: 10, targetDepth: 2, fluence: 20 },
      expect: { p0Surface: 20, muEff: 1.7406895185529212, penetrationDepth: 5.7448498962142605, transportMfp: 0.9900990099009901, fluenceAtTarget: 14.120030185462012, p0Target: 14.120030185462012 },
      tolerance: 1e-8,
    },
    {
      // λ = 750 nm: C_A = 10^(0.002·(750 − 700)) = 1.25892541; one 5 ns pulse H = 200·C_A J/m² = 25.1785 mJ/cm², ratio 20/25.1785 = 0.794328;
      // E = 2000·C_A W/m² = 251.785 mW/cm²; average = 20 mJ/cm² × 10 Hz = 200 mW/cm², ratio 200/251.785 = 0.794328.
      source: ICNIRP,
      basis: "computed",
      inputs: { laserWavelength: 750, pulseWidth: 5, fluence: 20, repetitionRate: 10 },
      expect: {
        pulseLimit: 25.178508235883346, pulseRatio: 0.7943282347242815, averageIrradiance: 200, irradianceLimit: 251.78508235883345,
        averageRatio: 0.7943282347242815,
      },
      tolerance: 1e-8,
    },
  ],
});
