"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  TRANSFORM_DOF,
  type TransformModel,
  displacementMax,
  displacementRms,
  fiducialRegistrationError,
  minControlPoints,
  targetRegistrationError,
  transformMatrix,
  translationCrlb,
} from "../../../physics/imaging/registration";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const deg = Math.PI / 180;

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

const MODELS: TransformModel[] = ["rigid", "similarity", "affine"];
const MODEL_LABELS: Record<TransformModel, string> = {
  rigid: "Rigid (rotation + shift)",
  similarity: "Similarity (+ scale)",
  affine: "Affine (+ shear)",
};
const MODEL_COLORS: Record<TransformModel, string> = { rigid: "#34d399", similarity: "#fbbf24", affine: "#f87171" };

export default function RegistrationPage() {
  const [modelRaw, setModel] = useURLState("transformation", "rigid");
  const [sizeRaw, setImageSize] = useURLState("imageSize", 512);
  const [pixelRaw, setPixelSize] = useURLState("pixelSizeNm", 100);
  const [rotationRaw, setRotationDeg] = useURLState("rotationDeg", 2);
  const [txRaw, setTranslationX] = useURLState("translationX", 5);
  const [tyRaw, setTranslationY] = useURLState("translationY", 3);
  const [scaleRaw, setScaleFactor] = useURLState("scaleFactor", 1.02);
  const [shearRaw, setShearDeg] = useURLState("shearDeg", 0.5);
  const [pointsRaw, setNumControlPoints] = useURLState("numControlPoints", 10);
  const [fleRaw, setFle] = useURLState("fle", 1);
  const [snrRaw, setSnr] = useURLState("snr", 10);
  const [featureRaw, setFeature] = useURLState("featureSize", 2);
  const model: TransformModel = MODELS.find((m) => m === modelRaw) ?? "rigid";
  const size = Math.round(clamp(sizeRaw, 16, 16384, 512));
  const pixelNm = clamp(pixelRaw, 0.1, 1e6, 100);
  const rotationDeg = clamp(rotationRaw, -180, 180, 2);
  const tx = clamp(txRaw, -16384, 16384, 5);
  const ty = clamp(tyRaw, -16384, 16384, 3);
  const scale = clamp(scaleRaw, 0.5, 2, 1.02);
  const shearDeg = clamp(shearRaw, -45, 45, 0.5);
  const points = Math.round(clamp(pointsRaw, 1, 1000, 10));
  const fle = clamp(fleRaw, 0, 100, 1);
  const snr = clamp(snrRaw, 0.01, 1e4, 10);
  const feature = clamp(featureRaw, 1, 1000, 2);

  const a = transformMatrix(model, rotationDeg * deg, scale, shearDeg * deg);
  const rms = displacementRms(a, tx, ty, size);
  const max = displacementMax(a, tx, ty, size);

  // Fiducials spread uniformly over the image: mean squared radius L²/6, as for targets averaged over the image.
  const fiducialRms = size / Math.sqrt(6);
  const tre = (m: TransformModel, n: number, d: number) => targetRegistrationError({ model: m, n, fle, fiducialRms, targetDistance: d });
  const treRms = tre(model, points, fiducialRms);
  const treCentre = tre(model, points, 0);
  const treCorner = tre(model, points, size / Math.SQRT2);
  const fre = fiducialRegistrationError(model, points, fle);
  const tooFew = points < minControlPoints(model);
  const crlb = translationCrlb(snr, feature, size * size);

  const counts = Array.from({ length: 61 }, (_, k) => Math.round(2 * 500 ** (k / 60))).filter((n, k, all) => k === 0 || n !== all[k - 1]);
  const chart = [
    ...MODELS.map((m) => {
      const ns = counts.filter((n) => n >= minControlPoints(m));
      return {
        x: ns, y: ns.map((n) => tre(m, n, fiducialRms) * pixelNm),
        type: "scatter" as const, mode: "lines" as const, name: m.charAt(0).toUpperCase() + m.slice(1), line: { color: MODEL_COLORS[m], width: 2 },
      };
    }),
    ...(Number.isFinite(treRms)
      ? [{ x: [points], y: [treRms * pixelNm], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 10 } }]
      : []),
  ];

  const matrix = [
    [a[0], a[1], tx],
    [a[2], a[3], ty],
  ];

  return (
    <>
      <div role="group" aria-label="Transform model" className="flex flex-wrap gap-2 mb-4">
        {MODELS.map((m) => (
          <button key={m} onClick={() => setModel(m)} className={buttonClass(model === m)}>{MODEL_LABELS[m]} · {TRANSFORM_DOF[m]} DOF</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {card("RMS displacement over the image", fmt(rms * pixelNm, 1, " nm"), `${fmt(rms, 2, " px")}; largest at a corner ${fmt(max * pixelNm, 1, " nm")}`, "text-blue-400")}
        {card("Control-point TRE (RMS over the image)", fmt(treRms * pixelNm, 1, " nm"), `${fmt(treRms, 3, " px")}; centre ${fmt(treCentre * pixelNm, 1)}, corner ${fmt(treCorner * pixelNm, 1, " nm")}`, "text-green-400")}
        {card("Expected fiducial residual FRE", fmt(fre * pixelNm, 1, " nm"), "The fit residual, not the target error: a small FRE does not mean a small TRE", "text-yellow-400")}
        {card("Intensity registration bound (per axis)", fmt(crlb * pixelNm, 3, " nm"), `${fmt(crlb, 5, " px")}: Cramér–Rao bound for the translation`, "text-purple-400")}
      </div>
      {tooFew && (
        <p className="mb-4 text-sm text-red-400">
          A {model} transform needs at least {minControlPoints(model)} control-point pairs: the point-based results are blank.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Image size L (px, square)" value={sizeRaw} onChange={setImageSize} min={16} max={16384} step="1" />
        <ValidatedNumberInput label="Pixel size (nm, in the specimen)" value={pixelRaw} onChange={setPixelSize} min={0.1} max={1e6} step="any" />
        <ValidatedNumberInput label="Rotation θ (°)" value={rotationRaw} onChange={setRotationDeg} min={-180} max={180} step="any" />
        <ValidatedNumberInput label="Translation x (px)" value={txRaw} onChange={setTranslationX} min={-16384} max={16384} step="any" />
        <ValidatedNumberInput label="Translation y (px)" value={tyRaw} onChange={setTranslationY} min={-16384} max={16384} step="any" />
        {model !== "rigid" && (
          <ValidatedNumberInput label="Scale factor s" value={scaleRaw} onChange={setScaleFactor} min={0.5} max={2} step="any" />
        )}
        {model === "affine" && (
          <ValidatedNumberInput label="Shear φ (°)" value={shearRaw} onChange={setShearDeg} min={-45} max={45} step="any" />
        )}
        <ValidatedNumberInput label="Control-point pairs N" value={pointsRaw} onChange={setNumControlPoints} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Fiducial localisation error FLE (px, 2-D rms)" value={fleRaw} onChange={setFle} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Texture SNR σ_s/σ_noise" value={snrRaw} onChange={setSnr} min={0.01} max={1e4} step="any" />
        <ValidatedNumberInput label="Texture correlation length ℓ (px)" value={featureRaw} onChange={setFeature} min={1} max={1000} step="any" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Transform x&apos; = A·x + t (pixels, origin at the image centre)</h3>
        <div className="font-mono text-sm">
          {matrix.map((row, i) => (
            <div key={i} className="flex gap-4">
              {row.map((v, j) => (
                <span key={j} className={`w-24 text-right ${j === 2 ? "text-blue-300" : "text-gray-300"}`}>{fmt(v, j === 2 ? 2 : 5)}</span>
              ))}
            </div>
          ))}
          <div className="flex gap-4 text-gray-500">
            {["0", "0", "1"].map((v, j) => <span key={j} className="w-24 text-right">{v}</span>)}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Control-point TRE vs number of pairs (RMS over the image)</h3>
        <ChartPanel data={chart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Control-point pairs N", type: "log", gridcolor: "#374151" },
          yaxis: { title: "TRE (nm)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Displacement:</span> ⟨|d|²⟩ = |t|² + (L²/12)·‖A − I‖²_F over a centred L × L image</p>
          <p><span className="text-blue-400">TRE:</span> TRE² = (FLE²/N)·(1 + m·d²/(2f²)), m = 1, 2, 4 for rigid, similarity, affine</p>
          <p><span className="text-blue-400">FRE:</span> FRE² = FLE²·(1 − p/(2N)), p = 3, 4, 6 parameters</p>
          <p><span className="text-blue-400">Cramér–Rao:</span> σ_t ≥ ℓ/(SNR·√N_px) per axis, from J = Σ∇f∇fᵀ/σ²</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          The fiducials are spread uniformly over the image, so f² = L²/6 and the RMS target sits at d = f. The 2-D TRE and
          FRE follow Fitzpatrick&apos;s first-order least-squares analysis with isotropic, independent localisation errors, for fiducials on a regular, centred, isotropic layout; random placement raises the affine TRE by ≈ 20 % at N = 10 (rigid ≈ 6 %). The
          bound assumes a noise-free reference, white Gaussian noise on the moving image, and a random texture whose gradient
          variance is σ_s²/ℓ². The bound assumes a noise-free reference and no interpolation bias; with two equally noisy images it is √2 larger. Elastic (B-spline) registration has a displacement field instead of a matrix and is not modelled.
        </p>
      </div>
    </>
  );
}
