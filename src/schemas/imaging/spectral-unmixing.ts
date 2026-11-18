import { FLUOROPHORES, fluorophoreByName } from "../../physics/imaging/fluorophores";
import {
  DUPLICATE_MESSAGE, type UnmixMethod, lowPhotonsMessage, missingEmissionMessage, rangeRewrittenMessage, unmixingSummary,
} from "../../physics/imaging/spectral-unmixing";
import { defineSchema } from "../types";

const KAY = "Kay S. M. (1993). Fundamentals of Statistical Signal Processing: Estimation Theory. Prentice Hall, §4.3 (linear model y = E·x + n; Cov(Ay) = A·diag(v)·Aᵀ with A = (EᵀE)⁻¹Eᵀ): " +
  "Cov(x̂) = (EᵀE)⁻¹ Eᵀ diag(v) E (EᵀE)⁻¹ for independent band noise of variances v_b = (E·x)_b + σ_read² (Gaussian limit of shot noise); " +
  "the share p_j = x_j/Σx by the delta method; κ(E) = √(λ_max/λ_min of EᵀE). Endmember spectra: Lambert T. J. (2019). FPbase: a community-editable " +
  "fluorescent protein database. Nat. Methods 16, 277–278, doi:10.1038/s41592-019-0352-8 (www.fpbase.org, CC BY-SA 4.0), binned into equal bands, " +
  "E_bj = ∫_band b F_j dλ / ∫_range F_j dλ; linear unmixing in microscopy: Zimmermann T., Rietdorf J., Pepperkok R. (2003). Spectral imaging and its " +
  "applications in live cell microscopy. FEBS Lett. 546, 87–92, doi:10.1016/S0014-5793(03)00521-0.";

const dyeOptions = FLUOROPHORES.map((f) => ({ value: f.name, label: f.name }));
const optionalDyeOptions = [{ value: "none", label: "none" }, ...dyeOptions];
const METHODS = ["ols", "nnls", "fcls"] as const;
/** Metres back to the page's nm, without the 1e-16 rounding noise of × 1e9. */
const nm = (m: number) => Number((m * 1e9).toPrecision(12));
const unused = (n: number) => `Endmember ${n} is not selected (none), so it has no result.`;
const unsolved = "E is rank deficient (κ = ∞), so the OLS covariance is undefined: an endmember has no emission in the range, two endmembers are the same dye, " +
  "or two endmembers' in-range spectra are proportional (e.g. both fall in one band).";
const ZERO_FIT = "The fit gives 0 photons to every endmember (the noisy pixel projects to ≤ 0), so the shares are undefined.";
const percent = <K extends string>(key: K, label: string) => ({ key, label, unit: "%", toSI: 0.01, siUnit: "" });
const share = <K extends string>(key: K, label: string, value: number) => ({ key, label, unit: "", toSI: 1, siUnit: "", default: value, min: 0, max: 1 });

export default defineSchema({
  href: "/imaging/spectral-unmixing",
  choices: [
    { key: "dye1", label: "Endmember 1", options: dyeOptions, default: "EGFP" },
    { key: "dye2", label: "Endmember 2", options: dyeOptions, default: "mVenus" },
    { key: "dye3", label: "Endmember 3", options: optionalDyeOptions, default: "mCherry" },
    { key: "dye4", label: "Endmember 4", options: optionalDyeOptions, default: "none" },
    {
      key: "method",
      label: "Method (changes the simulated estimate only)",
      options: [
        { value: "ols", label: "OLS: unconstrained least squares" },
        { value: "nnls", label: "NNLS: non-negative (Lawson–Hanson)" },
        { value: "fcls", label: "FCLS: non-negative, sum = measured total" },
      ],
      default: "nnls",
    },
  ],
  inputs: [
    share("abundance1", "Share of photons, endmember 1", 0.5),
    share("abundance2", "Share of photons, endmember 2", 0.3),
    share("abundance3", "Share of photons, endmember 3", 0.2),
    share("abundance4", "Share of photons, endmember 4", 0.2),
    { key: "numBands", label: "Spectral bands", unit: "", toSI: 1, siUnit: "", default: 32, min: 4, max: 128 },
    { key: "startNm", label: "Range start", unit: "nm", toSI: 1e-9, siUnit: "m", default: 480, min: 350, max: 950 },
    { key: "endNm", label: "Range end", unit: "nm", toSI: 1e-9, siUnit: "m", default: 720, min: 360, max: 1000 },
    { key: "photons", label: "Detected photons per pixel", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 2000, min: 1, max: 1e8 },
    { key: "readNoise", label: "Read noise per band", unit: "e⁻", toSI: 1, siUnit: "e⁻", default: 1, min: 0, max: 100 },
    { key: "seed", label: "Noise seed (only the simulated estimate, residual and χ² depend on it)", unit: "", toSI: 1, siUnit: "", default: 1, min: 0, max: 1e6 },
  ],
  outputs: [
    { key: "bandWidth", label: "Band width", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "kappa", label: "Condition number κ(E)", unit: "", toSI: 1, siUnit: "" },
    percent("sigma1", "±σ of the share, endmember 1"),
    percent("sigma2", "±σ of the share, endmember 2"),
    percent("sigma3", "±σ of the share, endmember 3"),
    percent("worstSigma", "Largest ±σ of a share (all selected endmembers)"),
    percent("relError1", "Relative error σ/x, endmember 1"),
    percent("relError2", "Relative error σ/x, endmember 2"),
    percent("relError3", "Relative error σ/x, endmember 3"),
    percent("estimate1", "Estimated share, endmember 1 (simulated pixel)"),
    percent("estimate2", "Estimated share, endmember 2 (simulated pixel)"),
    percent("estimate3", "Estimated share, endmember 3 (simulated pixel)"),
    { key: "residualRms", label: "Residual rms (simulated pixel)", unit: "e⁻/band", toSI: 1, siUnit: "e⁻" },
    { key: "chi2", label: "χ²/(B − K) (simulated pixel)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute(i) {
    // As on the page: endmembers 1 and 2 are always used, 3 and 4 unless "none"; a "none" slot drops its share.
    const slotNames = [i.dye1, i.dye2, i.dye3, i.dye4];
    const slotShares = [i.abundance1, i.abundance2, i.abundance3, i.abundance4];
    const active = slotNames.map((name, k) => (k < 2 || name !== "none" ? k : -1)).filter((k) => k >= 0);
    const method: UnmixMethod = METHODS.find((m) => m === i.method) ?? "nnls";
    const bands = Math.round(i.numBands);
    const s = unmixingSummary({
      dyes: active.map((k) => fluorophoreByName(slotNames[k])),
      abundances: active.map((k) => slotShares[k]),
      bands, start: nm(i.startNm), end: nm(i.endNm), photons: i.photons, readNoise: i.readNoise, method, seed: Math.round(i.seed),
    });
    const warnings: string[] = [];
    if (s.missing.length > 0) warnings.push(missingEmissionMessage(s.missing));
    if (s.duplicate) warnings.push(DUPLICATE_MESSAGE);
    if (s.rewritten) warnings.push(rangeRewrittenMessage(s.start, s.end));
    if (s.lowPhotons) warnings.push(lowPhotonsMessage(i.photons / bands));

    // Result of slot n (0-based) among the selected endmembers; NaN for a slot that is "none".
    const per = (values: readonly number[], n: number) => (active.includes(n) ? values[active.indexOf(n)] : NaN);
    const reasons: Record<string, string> = {};
    for (const n of [0, 1, 2]) {
      const k = active.indexOf(n);
      const key = n + 1;
      if (k < 0) {
        for (const o of ["sigma", "relError", "estimate"]) reasons[`${o}${key}`] = unused(key);
        continue;
      }
      if (!Number.isFinite(s.shareSigma[k])) reasons[`sigma${key}`] = unsolved;
      if (!Number.isFinite(s.estimate[k])) reasons[`estimate${key}`] = s.solved ? ZERO_FIT : unsolved;
      if (!Number.isFinite(s.relError[k])) {
        reasons[`relError${key}`] = s.shares[k] > 0 ? unsolved : `The share of endmember ${key} is 0, so the relative error σ/x is undefined.`;
      }
    }
    const sigmaOk = s.shareSigma.every(Number.isFinite);
    if (!Number.isFinite(s.kappa)) reasons.kappa = unsolved;
    if (!sigmaOk) reasons.worstSigma = unsolved;
    if (!Number.isFinite(s.residualRms)) reasons.residualRms = unsolved;
    if (!Number.isFinite(s.chi2)) {
      reasons.chi2 = s.solved && s.residualRms >= 0 && Number.isFinite(s.residualRms)
        ? "A band has zero expected variance (no photons and no read noise), so χ² is undefined."
        : unsolved;
    }
    return {
      values: {
        bandWidth: s.step * 1e-9,
        kappa: s.kappa,
        sigma1: per(s.shareSigma, 0), sigma2: per(s.shareSigma, 1), sigma3: per(s.shareSigma, 2),
        worstSigma: sigmaOk ? Math.max(...s.shareSigma) : NaN,
        relError1: per(s.relError, 0), relError2: per(s.relError, 1), relError3: per(s.relError, 2),
        estimate1: per(s.estimate, 0), estimate2: per(s.estimate, 1), estimate3: per(s.estimate, 2),
        residualRms: s.residualRms,
        chi2: s.chi2,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Defaults (EGFP 50 %, mVenus 30 %, mCherry 20 %, 2000 photons, read noise 1 e⁻, 32 bands over 480–720 nm, FPbase emission spectra):
      // band width (720 − 480)/32 = 7.5 nm. E_bj = trapezoid integral of the 1 nm samples over band b / over the range; x = 2000·(0.5, 0.3, 0.2),
      // band variance (E·x)_b + 1, Cov = (EᵀE)⁻¹ Eᵀ diag(v) E (EᵀE)⁻¹, share σ by the delta method, relative error √Cov_jj/x_j, κ = √(λmax/λmin of EᵀE),
      // all from a scratch script with its own Jacobi eigensolver and Gauss–Jordan inverse: κ = 2.2251569413233154, ±σ = (2.383151546231027,
      // 2.468256901996323, 1.165989993006902) %, σ/x = (5.323956636898417, 8.549582515737319, 6.359816002418799) %.
      source: KAY,
      basis: "computed",
      inputs: {},
      expect: {
        bandWidth: 7.5, kappa: 2.2251569413233154, sigma1: 2.383151546231027, sigma2: 2.468256901996323, sigma3: 1.165989993006902,
        relError1: 5.323956636898417, relError2: 8.549582515737319, relError3: 6.359816002418799,
      },
      tolerance: 1e-8,
    },
    {
      // mTurquoise2 20 %, EGFP 50 %, mScarlet 30 %, 5000 photons, read noise 2 e⁻, 40 bands over 470–710 nm (6 nm bands), same method as above:
      // κ = 2.581263050800926, ±σ = (1.2960679345857353, 1.4412590898043645, 0.8039791007211383) %, σ/x = (6.603112072660393, 3.2790766795885515, 3.1170955399877096) %.
      source: KAY,
      basis: "computed",
      inputs: { dye1: "mTurquoise2", dye2: "EGFP", dye3: "mScarlet", abundance1: 0.2, abundance2: 0.5, abundance3: 0.3, numBands: 40, startNm: 470, endNm: 710, photons: 5000, readNoise: 2 },
      expect: {
        bandWidth: 6, kappa: 2.581263050800926, sigma1: 1.2960679345857353, sigma2: 1.4412590898043645, sigma3: 0.8039791007211383,
        relError1: 6.603112072660393, relError2: 3.2790766795885515, relError3: 3.1170955399877096,
      },
      tolerance: 1e-8,
    },
    {
      // Four endmembers (mTagBFP2, mVenus, mKate2, miRFP670), 25 % each, 3000 photons, read noise 0.5 e⁻, 48 bands over 450–786 nm (7 nm bands):
      // κ = 2.6350712445502804, ±σ = (0.916313211066968, 0.9926743651858293, 1.6218310827965396, 1.5542406640742283) %, so the largest is 1.6218310827965396 %.
      source: KAY,
      basis: "computed",
      inputs: {
        dye1: "mTagBFP2", dye2: "mVenus", dye3: "mKate2", dye4: "miRFP670", abundance1: 0.25, abundance2: 0.25, abundance3: 0.25, abundance4: 0.25,
        numBands: 48, startNm: 450, endNm: 786, photons: 3000, readNoise: 0.5,
      },
      expect: { bandWidth: 7, kappa: 2.6350712445502804, sigma1: 0.916313211066968, sigma3: 1.6218310827965396, worstSigma: 1.6218310827965396 },
      tolerance: 1e-8,
    },
  ],
});
