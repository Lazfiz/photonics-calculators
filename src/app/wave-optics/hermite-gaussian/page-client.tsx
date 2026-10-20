"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beamRadius, rayleighRange } from "../../../physics/wave-optics/gaussian-beam";
import {
  hgAmplitude1D, hgSecondMomentRadius, lgIntensity, lgRingRadius, lgSecondMomentRadius, modeGouyPhase,
} from "../../../physics/wave-optics/higher-order-modes";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const index = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const MAX_INDEX = 10;

export default function HigherOrderModesPage() {
  const [familyRaw, setFamily] = useURLState("family", "");
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [waistRaw, setWaist] = useURLState("waist", 50); // µm, TEM₀₀ 1/e² waist radius
  const [zRaw, setZ] = useURLState("z", 0); // mm from the waist
  const [powerRaw, setPower] = useURLState("power", 1); // mW
  const [mRaw, setM] = useURLState("m", 0);
  const [nRaw, setN] = useURLState("n", 0);
  const [pRaw, setP] = useURLState("p", NaN); // NaN when absent: a link from the old Laguerre-Gaussian page sets p or l
  const [lRaw, setL] = useURLState("l", NaN);

  const family = familyRaw === "lg" || familyRaw === "hg" ? familyRaw : Number.isFinite(pRaw) || Number.isFinite(lRaw) ? "lg" : "hg";
  const lg = family === "lg";
  const wavelength = clamp(wavelengthRaw, 200, 11000, 1550);
  const waist_um = clamp(waistRaw, 1, 1e5, 50);
  const z_mm = clamp(zRaw, -1e5, 1e5, 0);
  const power_mW = clamp(powerRaw, 1e-6, 1e9, 1);
  const m = index(mRaw, 0, MAX_INDEX, 0);
  const n = index(nRaw, 0, MAX_INDEX, 0);
  const p = index(pRaw, 0, MAX_INDEX, 0);
  const l = index(lRaw, -MAX_INDEX, MAX_INDEX, 1);

  const beam = { lambda: wavelength * 1e-9, w0: waist_um * 1e-6 };
  const zR = rayleighRange(beam);
  const z = z_mm * 1e-3;
  const w = beamRadius(beam, z); // TEM₀₀ radius at z: every mode scales with it
  const w_um = w * 1e6;
  const order = lg ? 2 * p + Math.abs(l) : m + n;
  const gouy = modeGouyPhase(order, z, zR);
  const Wx_um = (lg ? lgSecondMomentRadius(p, l, w) : hgSecondMomentRadius(m, w)) * 1e6;
  const Wy_um = lg ? Wx_um : hgSecondMomentRadius(n, w) * 1e6;
  const M2x = lg ? 2 * p + Math.abs(l) + 1 : 2 * m + 1;
  const M2y = lg ? M2x : 2 * n + 1;

  // Profiles on a grid out to just past the outermost lobe (the second-moment radius).
  const ext_um = 1.2 * Math.max(Wx_um, Wy_um) + 0.8 * w_um;
  const G = 161;
  const axis = Array.from({ length: G }, (_, i) => round6(-ext_um + (2 * ext_um * i) / (G - 1)));
  const ux = axis.map((x) => hgAmplitude1D(m, x * 1e-6, w) ** 2);
  const uy = axis.map((y) => hgAmplitude1D(n, y * 1e-6, w) ** 2);
  const map = axis.map((y) => axis.map((x, i) => (lg ? lgIntensity(p, l, Math.hypot(x, y) * 1e-6, w) : ux[i] * hgAmplitude1D(n, y * 1e-6, w) ** 2)));

  // Peak intensity from a fine 1-D scan (HG is separable; LG depends on r only).
  const scan = (f: (s: number) => number, s1: number) => {
    let best = 0;
    for (let i = 0; i <= 4000; i++) best = Math.max(best, f((s1 * i) / 4000));
    return best;
  };
  const ext = ext_um * 1e-6;
  const peakPerW = lg
    ? scan((r) => lgIntensity(p, l, r, w), ext)
    : scan((x) => hgAmplitude1D(m, x, w) ** 2, ext) * scan((y) => hgAmplitude1D(n, y, w) ** 2, ext);
  const peak_Wcm2 = peakPerW * power_mW * 1e-3 * 1e-4;

  let peakMap = 0;
  for (const row of map) for (const v of row) peakMap = Math.max(peakMap, v);
  const heat = [{
    z: map.map((row) => row.map((v) => round6(v / peakMap))),
    x: axis, y: axis, type: "heatmap" as const, colorscale: "Inferno", colorbar: { title: { text: "I / I_peak" } },
  }];

  const rs = axis.slice((G - 1) / 2);
  const uxMax = Math.max(...ux);
  const uyMax = Math.max(...uy);
  const profile = lg
    ? [{ name: "Radial intensity", color: "#60a5fa", points: rs.map((r) => ({ x: r, y: round6(lgIntensity(p, l, r * 1e-6, w) / peakPerW) })) }]
    : [
      { name: `x: H${m}`, color: "#60a5fa", points: axis.map((x, i) => ({ x, y: round6(ux[i] / uxMax) })) },
      { name: `y: H${n}`, color: "#f87171", dashed: true, points: axis.map((y, i) => ({ x: y, y: round6(uy[i] / uyMax) })) },
    ];

  const modeLabel = lg ? `LG${toSub(p)}${toSup(l)}` : `TEM${toSub(m)}${toSub(n)}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Mode family</span>
          <select value={family} onChange={(e) => setFamily(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="hg">Hermite-Gaussian TEMmn (rectangular)</option>
            <option value="lg">Laguerre-Gaussian LGpl (circular, OAM)</option>
          </select>
        </label>
        {lg ? (
          <>
            <ValidatedNumberInput label={`Radial index p (0–${MAX_INDEX})`} value={Number.isFinite(pRaw) ? pRaw : p} onChange={setP} min={0} max={MAX_INDEX} step="1" />
            <ValidatedNumberInput label={`Azimuthal index l (−${MAX_INDEX} to ${MAX_INDEX})`} value={Number.isFinite(lRaw) ? lRaw : l} onChange={setL} min={-MAX_INDEX} max={MAX_INDEX} step="1" />
          </>
        ) : (
          <>
            <ValidatedNumberInput label={`Mode index m, along x (0–${MAX_INDEX})`} value={mRaw} onChange={setM} min={0} max={MAX_INDEX} step="1" />
            <ValidatedNumberInput label={`Mode index n, along y (0–${MAX_INDEX})`} value={nRaw} onChange={setN} min={0} max={MAX_INDEX} step="1" />
          </>
        )}
        <ValidatedNumberInput label="Wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={11000} />
        <ValidatedNumberInput label="Waist radius w₀ of the TEM₀₀ beam (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="Distance from the waist z (mm)" value={zRaw} onChange={setZ} min={-1e5} max={1e5} step="any" />
        <ValidatedNumberInput label="Power (mW)" value={powerRaw} onChange={setPower} min={1e-6} max={1e9} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Mode" value={modeLabel} subtext={`Order N = ${lg ? "2p + |l|" : "m + n"} = ${order}`} tone="blue" />
        <ResultCard label="Rayleigh range z_R" value={`${fmt(zR * 1e3)} mm`} subtext="Same for every mode of this family" tone="green" />
        <ResultCard
          label="Second-moment radius W"
          value={lg || m === n ? `${fmt(Wx_um)} µm` : `${fmt(Wx_um)} × ${fmt(Wy_um)} µm`}
          subtext={`w(z) = ${fmt(w_um)} µm for TEM₀₀; W = w√(${lg ? "2p+|l|+1" : "2m+1"})`}
          tone="yellow"
        />
        <ResultCard label="Beam quality M²" value={M2x === M2y ? String(M2x) : `${M2x} (x), ${M2y} (y)`} subtext={lg ? "2p + |l| + 1" : "2m + 1, 2n + 1"} tone="orange" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ResultCard label="Gouy phase (N + 1) arctan(z/z_R)" value={`${fmt(gouy, 4)} rad`} subtext={`${fmt(order * Math.atan(z / zR), 4)} rad more than TEM₀₀`} tone="purple" />
        <ResultCard label="Peak intensity" value={`${fmt(peak_Wcm2)} W/cm²`} subtext={`At z, for ${fmt(power_mW, 3)} mW in the mode`} tone="red" />
        {lg ? (
          <ResultCard
            label="Orbital angular momentum"
            value={`${l} ħ per photon`}
            subtext={p === 0 && l !== 0 ? `Bright ring at r = w√(|l|/2) = ${fmt(lgRingRadius(l, w) * 1e6)} µm` : "Phase winds 2πl around the axis"}
            tone="cyan"
          />
        ) : (
          <ResultCard label="Dark lines" value={`${m} vertical, ${n} horizontal`} subtext="Zeros of H_m(√2x/w) and H_n(√2y/w)" tone="cyan" />
        )}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        {lg ? (
          <p>u<sub>pl</sub>(r, φ) = √(2p!/(π(p+|l|)!))/w · (√2r/w)<sup>|l|</sup> L<sub>p</sub><sup>|l|</sup>(2r²/w²) e<sup>−r²/w²</sup> e<sup>ilφ</sup></p>
        ) : (
          <p>u<sub>mn</sub>(x, y) = √(2/π)/w · H<sub>m</sub>(√2x/w) H<sub>n</sub>(√2y/w) e<sup>−(x²+y²)/w²</sup> / √(2<sup>m+n</sup> m! n!)</p>
        )}
        <p>Normalised to unit power; w = w(z) is the TEM₀₀ radius at the plane shown. The Gouy phase sets the mode spacing in a cavity.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg bg-gray-900 p-4">
          <ChartPanel data={heat} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            title: { text: `${modeLabel} intensity at z = ${fmt(z_mm, 3)} mm` },
            xaxis: { title: { text: "x (µm)" }, gridcolor: "#374151" },
            yaxis: { title: { text: "y (µm)" }, gridcolor: "#374151", scaleanchor: "x" },
            margin: { t: 40, r: 30, b: 50, l: 70 },
          }} />
        </div>
        <SimpleLineChart
          title={lg ? "Radial profile" : "Profiles along x and y"}
          xLabel={lg ? "Radius r (µm)" : "Position (µm)"}
          yLabel="Intensity (relative to the peak)"
          series={profile}
        />
      </div>
    </>
  );
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function toSub(k: number): string {
  return String(k).replace(/\d/g, (d) => SUB[Number(d)]);
}
function toSup(k: number): string {
  return (k < 0 ? "⁻" : "") + String(Math.abs(k)).replace(/\d/g, (d) => SUP[Number(d)]);
}
