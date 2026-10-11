"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { fresnel } from "../../../physics/polarization/fresnel";
import {
  macNeilleAngle, macNeilleGlassIndex, macNeilleResponse, type MacNeilleDesign,
} from "../../../physics/polarization/reflection-polarizers";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fix(v * 100, digits)} %` : "—");
const dB = (ratio: number) => (Number.isFinite(ratio) && ratio > 0 ? `${fix(10 * Math.log10(ratio), 1)} dB` : "—");

/** Wanted outputs and leakage from 0.6 λ₀ to 1.6 λ₀. */
function spectralCharts(d: MacNeilleDesign) {
  const l = Array.from({ length: 301 }, (_, i) => d.lambda0 * (0.6 + i * (1.0 / 300)));
  const resp = l.map((x) => macNeilleResponse(d, x));
  const nm = l.map((x) => x * 1e9);
  return {
    wanted: [
      { x: nm, y: resp.map((q) => q.Tp), type: "scatter" as const, mode: "lines" as const, name: "Tₚ (transmitted p)", line: { color: "#f87171", width: 2 } },
      { x: nm, y: resp.map((q) => q.Rs), type: "scatter" as const, mode: "lines" as const, name: "Rₛ (reflected s)", line: { color: "#60a5fa", width: 2 } },
    ],
    leak: [
      { x: nm, y: resp.map((q) => q.Ts), type: "scatter" as const, mode: "lines" as const, name: "Tₛ (s leaking through)", line: { color: "#60a5fa", width: 2 } },
      { x: nm, y: resp.map((q) => q.Rp), type: "scatter" as const, mode: "lines" as const, name: "Rₚ (p leaking into reflection)", line: { color: "#f87171", width: 2 } },
    ],
  };
}

/** Extinction ratios at λ₀ against the external angle φ in air; inside, θ_g = θ_design + asin(sin φ / n_g). */
function angularChart(d: MacNeilleDesign) {
  const phi = Array.from({ length: 161 }, (_, i) => -20 + i * 0.25);
  const resp = phi.map((p) => macNeilleResponse(d, d.lambda0, d.thetaGlass + Math.asin(Math.sin(p * DEG) / d.nGlass)));
  return [
    { x: phi, y: resp.map((q) => q.Tp / q.Ts), type: "scatter" as const, mode: "lines" as const, name: "Tₚ/Tₛ (transmitted)", line: { color: "#a78bfa", width: 2 } },
    { x: phi, y: resp.map((q) => q.Rs / q.Rp), type: "scatter" as const, mode: "lines" as const, name: "Rₛ/Rₚ (reflected)", line: { color: "#34d399", width: 2 } },
  ];
}

export default function PBSPage() {
  const [nHIn, setNH] = useURLState("nH", 2.35);
  const [nLIn, setNL] = useURLState("nL", 1.38);
  const [nGlassIn, setNGlass] = useURLState("nGlass", 1.6829);
  const [pairsIn, setPairs] = useURLState("pairs", 5);
  const [lambda0In, setLambda0] = useURLState("lambda0", 550);
  const [angleIn, setAngle] = useURLState("angleDeg", 45);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const nH = clamp(nHIn, 1.2, 4.5);
  const nL = clamp(nLIn, 1.1, 4);
  const nGlass = clamp(nGlassIn, 1.3, 2.5);
  const pairs = Math.round(clamp(pairsIn, 1, 30));
  const lambda0 = clamp(lambda0In, 200, 5000) * 1e-9;
  const thetaGlass = clamp(angleIn, 20, 70) * DEG;

  const design: MacNeilleDesign = { nH, nL, nGlass, pairs, lambda0, thetaGlass };
  const r = macNeilleResponse(design, lambda0);
  const matchedGlass = macNeilleGlassIndex(nH, nL, thetaGlass);
  const matchedAngle = macNeilleAngle(nH, nL, nGlass);
  // How far the H/L interfaces are from Brewster's angle: their own p reflectance at this angle.
  const beta = nGlass * Math.sin(thetaGlass);
  const thetaH = beta < nH ? Math.asin(beta / nH) : NaN;
  const interfaceRp = Number.isFinite(thetaH) ? fresnel(nH, nL, thetaH).Rp : NaN;
  const evanescent = !(beta < nL);

  const spectral = spectralCharts(design);
  const angular = angularChart(design);

  const layout = (x: string, y: string, log = false) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151", ...(log ? { type: "log" as const } : { range: [0, 1] }) },
    margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>MacNeille cube: (HL)<sup>N</sup>H quarter-wave stack on the hypotenuse, glass on both sides</p>
        <p>H/L interfaces at Brewster: tan θ<sub>H</sub> = n<sub>L</sub>/n<sub>H</sub> ⇔ n<sub>g</sub>² sin²θ<sub>g</sub> = n<sub>H</sub>²n<sub>L</sub>²/(n<sub>H</sub>² + n<sub>L</sub>²)</p>
        <p>layer thickness d = λ₀/(4√(n² − n<sub>g</sub>²sin²θ<sub>g</sub>)), response by the characteristic-matrix method</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label={<>High index n<sub>H</sub></>} value={nHIn} onChange={setNH} min={1.2} max={4.5} step="0.01" />
        <ValidatedNumberInput label={<>Low index n<sub>L</sub></>} value={nLIn} onChange={setNL} min={1.1} max={4} step="0.01" />
        <ValidatedNumberInput label={<>Glass index n<sub>g</sub></>} value={nGlassIn} onChange={setNGlass} min={1.3} max={2.5} step="0.001" />
        <ValidatedNumberInput label="H/L pairs N" value={pairsIn} onChange={setPairs} min={1} max={30} step="1" />
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={lambda0In} onChange={setLambda0} min={200} max={5000} step="1" />
        <ValidatedNumberInput label="Angle in the glass (°)" value={angleIn} onChange={setAngle} min={20} max={70} step="0.5" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Indices are held constant with wavelength (no dispersion) and the layers are lossless. The cube&apos;s outer faces
        are not included. A 45° cube is used at normal incidence on its faces.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNH(2.35); setNL(1.38); setNGlass(1.6829); setAngle(45); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">ZnS / MgF₂</button>
        <button onClick={() => { setNH(2.3); setNL(1.46); setAngle(45); setNGlass(Math.round(macNeilleGlassIndex(2.3, 1.46) * 1e4) / 1e4); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">TiO₂ / SiO₂</button>
        {Number.isFinite(matchedGlass) && (
          <button onClick={() => setNGlass(Math.round(matchedGlass * 1e4) / 1e4)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Match the glass index ({fix(matchedGlass, 4)})</button>
        )}
        {Number.isFinite(matchedAngle) && (
          <button onClick={() => setAngle(Math.round((matchedAngle / DEG) * 100) / 100)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Match the angle ({fix(matchedAngle / DEG, 2)}°)</button>
        )}
      </div>

      {evanescent && (
        <p className="text-sm text-yellow-400 mb-4">
          n<sub>g</sub> sin θ<sub>g</sub> = {fix(beta, 3)} exceeds a layer index, so light cannot propagate in that layer: lower the angle or the glass index.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmitted (p) at λ₀</p>
          <p className="text-xl font-bold text-red-400">T<sub>p</sub> {pct(r.Tp, 2)}</p>
          <p className="text-xs text-gray-500">s leaking: T<sub>s</sub> = {Number.isFinite(r.Ts) ? r.Ts.toExponential(2) : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflected (s) at λ₀</p>
          <p className="text-xl font-bold text-blue-400">R<sub>s</sub> {pct(r.Rs, 3)}</p>
          <p className="text-xs text-gray-500">p leaking: R<sub>p</sub> = {pct(r.Rp, 2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction ratios</p>
          <p className="text-lg font-bold text-purple-400">T<sub>p</sub>/T<sub>s</sub> {dB(r.Tp / r.Ts)}</p>
          <p className="text-lg font-bold text-green-400">R<sub>s</sub>/R<sub>p</sub> {dB(r.Rs / r.Rp)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster match at the H/L interfaces</p>
          <p className="text-lg font-bold text-yellow-400">R<sub>p</sub> per interface {Number.isFinite(interfaceRp) ? interfaceRp.toExponential(1) : "—"}</p>
          <p className="text-xs text-gray-500">needs n<sub>g</sub> = {fix(matchedGlass, 4)} at this angle</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Wanted outputs against wavelength</h3>
          <ChartPanel data={spectral.wanted} layout={layout("Wavelength (nm)", "Fraction")} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Leakage against wavelength (log)</h3>
          <ChartPanel data={spectral.leak} layout={layout("Wavelength (nm)", "Fraction", true)} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Extinction ratios at λ₀ against the angle in air from the cube-face normal (log)</h3>
        <ChartPanel data={angular} layout={layout("Angle in air (°)", "Ratio", true)} />
      </div>
    </>
  );
}
