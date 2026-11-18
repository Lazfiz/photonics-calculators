import { minControlPoints, type TransformModel } from "../../physics/imaging/registration";
import { registrationSummary } from "../../physics/imaging/registration-summary";
import { defineSchema } from "../types";

const FITZPATRICK = "Fitzpatrick J. M., West J. B., Maurer C. R. (1998). Predicting error in rigid-body point-based registration. " +
  "IEEE Trans. Med. Imaging 17, 694–702, doi:10.1109/42.736021: ⟨TRE²⟩ ≈ (⟨FLE²⟩/N)(1 + ⅓Σd_k²/f_k²) and ⟨FRE²⟩ ≈ (1 − 2/N)⟨FLE²⟩ in 3-D; " +
  "the same linearised least-squares derivation in 2-D gives TRE² = (FLE²/N)(1 + m·d²/(2f²)) with m = 1, 2, 4 and FRE² = FLE²(1 − p/(2N)) for p = 3, 4, 6 parameters.";
const ROBINSON = "Robinson D., Milanfar P. (2004). Fundamental performance limits in image registration. " +
  "IEEE Trans. Image Process. 13, 1185–1199, doi:10.1109/TIP.2004.832923, §II-A: Fisher information J = (1/σ²)Σ∇f∇fᵀ; " +
  "with ⟨f_x²⟩ = σ_s²/ℓ² this gives ℓ/(SNR·√N_px) per axis.";
const DISPLACEMENT = "Mean squared displacement of x' = A·x + t over a centred L × L image: the cross term vanishes and ⟨x²⟩ = ⟨y²⟩ = L²/12, so " +
  "⟨|d|²⟩ = |t|² + (L²/12)·‖A − I‖²_F (an exact identity, worked here by hand; the largest displacement is at one of the four corners).";

const tooFew = (model: TransformModel) =>
  `A ${model} transform needs at least ${minControlPoints(model)} control-point pairs: the point-based errors are undefined.`;
const MODELS = ["rigid", "similarity", "affine"] as const;
const noPoints = "Too few control-point pairs for this transform: the point-based errors are undefined.";

export default defineSchema({
  href: "/imaging/registration",
  inputs: [
    { key: "imageSize", label: "Image size L (square)", unit: "px", toSI: 1, siUnit: "px", default: 512, min: 16, max: 16384 },
    { key: "pixelSizeNm", label: "Pixel size in the specimen", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 0.1, max: 1000000 },
    { key: "rotationDeg", label: "Rotation θ", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 2, min: -180, max: 180 },
    { key: "translationX", label: "Translation x", unit: "px", toSI: 1, siUnit: "px", default: 5, min: -16384, max: 16384 },
    { key: "translationY", label: "Translation y", unit: "px", toSI: 1, siUnit: "px", default: 3, min: -16384, max: 16384 },
    { key: "scaleFactor", label: "Scale factor s (similarity and affine)", unit: "", toSI: 1, siUnit: "", default: 1.02, min: 0.5, max: 2 },
    { key: "shearDeg", label: "Shear φ (affine)", unit: "°", toSI: Math.PI / 180, siUnit: "rad", default: 0.5, min: -45, max: 45 },
    { key: "numControlPoints", label: "Control-point pairs N", unit: "", toSI: 1, siUnit: "", default: 10, min: 1, max: 1000 },
    { key: "fle", label: "Fiducial localisation error FLE (2-D rms)", unit: "px", toSI: 1, siUnit: "px", default: 1, min: 0, max: 100 },
    { key: "snr", label: "Texture SNR σ_s/σ_noise", unit: "", toSI: 1, siUnit: "", default: 10, min: 0.01, max: 10000 },
    { key: "featureSize", label: "Texture correlation length ℓ", unit: "px", toSI: 1, siUnit: "px", default: 2, min: 1, max: 1000 },
  ],
  choices: [
    {
      key: "transformation",
      label: "Transform model",
      options: [
        { value: "rigid", label: "Rigid (rotation + shift), 3 DOF" },
        { value: "similarity", label: "Similarity (+ scale), 4 DOF" },
        { value: "affine", label: "Affine (+ shear), 6 DOF" },
      ],
      default: "rigid",
    },
  ],
  outputs: [
    { key: "rmsDisplacement", label: "RMS displacement over the image", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "rmsDisplacementPx", label: "RMS displacement over the image", unit: "px", toSI: 1, siUnit: "px" },
    { key: "maxDisplacement", label: "Largest displacement (a corner)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "treRms", label: "Control-point TRE, RMS over the image", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "treRmsPx", label: "Control-point TRE, RMS over the image", unit: "px", toSI: 1, siUnit: "px" },
    { key: "treCentre", label: "Control-point TRE at the centre", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "treCorner", label: "Control-point TRE at a corner", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "fre", label: "Expected fiducial residual FRE", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "crlb", label: "Intensity registration bound (per axis)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "crlbPx", label: "Intensity registration bound (per axis)", unit: "px", toSI: 1, siUnit: "px" },
  ],
  compute(i) {
    const model = MODELS.find((m) => m === i.transformation) ?? "rigid";
    const s = registrationSummary({
      model, size: Math.round(i.imageSize), theta: i.rotationDeg, tx: i.translationX, ty: i.translationY, scale: i.scaleFactor,
      shear: i.shearDeg, points: Math.round(i.numControlPoints), fle: i.fle, snr: i.snr, feature: i.featureSize,
    });
    const px = i.pixelSizeNm; // m per pixel (SI)
    const warnings = s.tooFew ? [tooFew(model)] : [];
    return {
      values: {
        rmsDisplacement: s.rms * px,
        rmsDisplacementPx: s.rms,
        maxDisplacement: s.max * px,
        treRms: s.treRms * px,
        treRmsPx: s.treRms,
        treCentre: s.treCentre * px,
        treCorner: s.treCorner * px,
        fre: s.fre * px,
        crlb: s.crlb * px,
        crlbPx: s.crlb,
      },
      warnings,
      reasons: { treRms: noPoints, treRmsPx: noPoints, treCentre: noPoints, treCorner: noPoints, fre: noPoints },
    };
  },
  checks: [
    {
      // Defaults (rigid, L = 512, θ = 2°, t = (5, 3) px, N = 10, FLE = 1 px, SNR 10, ℓ = 2 px, 100 nm pixels):
      // ‖R − I‖²_F = 4(1 − cos 2°) → rms = √(34 + (512²/12)·4(1 − cos 2°)) = 9.339719 px = 933.97188 nm;
      // largest corner displacement 18.330728 px = 1833.0728 nm.
      source: DISPLACEMENT,
      basis: "computed",
      inputs: {},
      expect: { rmsDisplacementPx: 9.33971880208694, rmsDisplacement: 933.9718802086941, maxDisplacement: 1833.072795246187 },
      tolerance: 1e-8,
    },
    {
      // Affine (m = 4, p = 6), N = 10, FLE = 1 px, f² = L²/6, 100 nm pixels: TRE_rms = FLE√((1 + 4/2)/10) = 0.54772256 px = 54.772256 nm;
      // centre FLE/√10 = 31.622777 nm; corner d² = L²/2 = 3f²: FLE√((1 + 4·3/2)/10) = 0.83666003 px = 83.666003 nm; FRE = FLE√(1 − 6/20) = 0.83666003 px = 83.666003 nm.
      source: FITZPATRICK,
      basis: "computed",
      inputs: { transformation: "affine" },
      expect: { treRms: 54.77225575051661, treCentre: 31.622776601683793, treCorner: 83.66600265340756, fre: 83.66600265340756 },
      tolerance: 1e-8,
    },
    {
      // SNR 4, ℓ = 3 px, L = 512 px (rigid defaults otherwise), 100 nm pixels: bound per axis ℓ/(SNR·L) = 3/(4·512) = 1.46484375e-3 px = 0.146484375 nm.
      source: ROBINSON,
      basis: "computed",
      inputs: { snr: 4, featureSize: 3 },
      expect: { crlbPx: 0.00146484375, crlb: 0.146484375 },
      tolerance: 1e-8,
    },
  ],
});
