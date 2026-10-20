"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { absorptionCoefficient, penetrationDepth } from "../../../physics/spectroscopy/depth";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtLen = (m: number) =>
  m === Infinity ? "∞" : !Number.isFinite(m) ? "—"
    : m >= 1 ? `${fmt(m)} m` : m >= 1e-3 ? `${fmt(m * 1e3)} mm` : m >= 1e-6 ? `${fmt(m * 1e6)} µm` : `${fmt(m * 1e9)} nm`;
const DEG = Math.PI / 180;

export default function PenetrationDepthPage() {
  const [wlRaw, setWavelengthNm] = useURLState("wavelengthNm", 800);
  const [n0Raw, setAmbientIndex] = useURLState("ambientIndex", 1);
  const [nRaw, setRefractiveIndexN] = useURLState("refractiveIndexN", 1.5);
  const [kRaw, setExtinctionCoeffK] = useURLState("extinctionCoeffK", 0.001);
  const [angleRaw, setAngleDeg] = useURLState("angleDeg", 0);

  const lambda = clamp(wlRaw, 10, 1e6, 800) * 1e-9;
  const n0 = clamp(n0Raw, 1, 5, 1);
  const n = clamp(nRaw, 0.01, 10, 1.5);
  const k = clamp(kRaw, 0, 20, 0.001);
  const thetaDeg = clamp(angleRaw, 0, 89.9, 0);
  const theta = thetaDeg * DEG;

  const alpha = absorptionCoefficient(k, lambda);
  const dNormal = penetrationDepth(lambda, n0, n, k, 0);
  const dp = penetrationDepth(lambda, n0, n, k, theta);
  const tir = n0 * Math.sin(theta) > n;
  const regime = k === 0 ? (tir ? "evanescent: total internal reflection" : "lossless: the wave does not decay")
    : tir ? "evanescent and absorbing (frustrated TIR)" : "refracted wave, absorbed";

  const vsAngle = (() => {
    const ds = Array.from({ length: 179 }, (_, i) => i * 0.5);
    const pts = ds.map((a) => penetrationDepth(lambda, n0, n, k, a * DEG));
    return [
      { x: ds, y: pts.map((d) => (Number.isFinite(d) ? r6(d * 1e9) : NaN)), type: "scatter", mode: "lines", name: "d_p(θ)", line: { color: "#34d399", width: 2 } },
      ...(Number.isFinite(dp) ? [{ x: [thetaDeg], y: [r6(dp * 1e9)], type: "scatter", mode: "markers", name: "Current θ", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 10 } }] : []),
    ];
  })();

  const [zScale, zUnit] = dp >= 1e-3 ? [1e3, "mm"] : dp >= 1e-6 ? [1e6, "µm"] : [1e9, "nm"];
  const profile = (() => {
    if (!Number.isFinite(dp)) return [];
    const zs = Array.from({ length: 201 }, (_, i) => (i / 200) * 5 * dp);
    return [
      { x: zs.map((z) => r6(z * zScale)), y: zs.map((z) => r6(Math.exp(-z / dp))), type: "scatter", mode: "lines", name: "Intensity", line: { color: "#818cf8", width: 2 } },
      { x: zs.map((z) => r6(z * zScale)), y: zs.map((z) => r6(Math.exp(-z / (2 * dp)))), type: "scatter", mode: "lines", name: "|Field|", line: { color: "#f472b6", width: 2, dash: "dash" } },
      { x: [r6(dp * zScale)], y: [r6(Math.exp(-1))], type: "scatter", mode: "markers", name: "z = d_p", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 10 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Vacuum Wavelength λ₀ (nm)" value={wlRaw} onChange={setWavelengthNm} min={10} max={1e6} step="10" />
        <ValidatedNumberInput label="Incident-Medium Index n₀" value={n0Raw} onChange={setAmbientIndex} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Angle of Incidence θ (°)" value={angleRaw} onChange={setAngleDeg} min={0} max={89.9} step="1" />
        <ValidatedNumberInput label="Refractive Index n" value={nRaw} onChange={setRefractiveIndexN} min={0.01} max={10} step="0.01" />
        <ValidatedNumberInput label="Extinction Coefficient k" value={kRaw} onChange={setExtinctionCoeffK} min={0} max={20} step="0.001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Absorption Coefficient α" value={`${fmt(alpha / 100)} cm⁻¹`} tone="red" subtext={`4πk/λ₀ = ${fmt(alpha)} m⁻¹`} />
        <ResultCard label="Intensity Depth d_p at θ" value={fmtLen(dp)} tone="green" subtext={`1/e of intensity, normal to the surface; ${regime}`} />
        <ResultCard label="Field 1/e Depth 2d_p" value={fmtLen(2 * dp)} tone="purple" subtext={k > 0 && !tir ? "skin depth λ₀/(2πk) at normal incidence" : "amplitude falls to 1/e"} />
        <ResultCard label="Depth at Normal Incidence 1/α" value={fmtLen(dNormal)} tone="blue" subtext={`λ in medium λ₀/n = ${fmtLen(lambda / n)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Normal incidence: α = 4πk/λ₀, intensity I(z) = I₀ e^(−αz), d_p = 1/α.</p>
        <p>Oblique incidence from index n₀: k_z = (2π/λ₀) √(N² − n₀² sin²θ), N = n + ik, so d_p = λ₀ / (4π · Im √(N² − n₀² sin²θ)).</p>
        <p className="text-gray-400">This one formula gives 1/α at normal incidence and the evanescent TIR depth for k = 0 above the critical angle. The intensity is the depth-dependent factor of the transmitted field; reflection losses at the surface are not included.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={profile} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Decay with Depth at θ", font: { size: 13 } },
          xaxis: { title: `Depth z (${zUnit})`, gridcolor: "#374151" },
          yaxis: { title: "Relative to z = 0", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
        <ChartPanel data={vsAngle} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Penetration Depth vs Angle", font: { size: 13 } },
          xaxis: { title: "Angle of incidence θ (°)", gridcolor: "#374151" },
          yaxis: { title: "d_p (nm)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </>
  );
}
