"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  ACOUSTO_OPTIC, accessTime, braggAngle, braggEfficiency, fullEfficiencyPower, kleinCookQ, scanAngle, type AcoustoOpticId,
} from "../../../physics/materials/acousto-optic";

const IDS = Object.keys(ACOUSTO_OPTIC) as AcoustoOpticId[];
const CUSTOM = "custom";
const DEFAULT_ID: AcoustoOpticId = "teo2-shear";
const CHART_POINTS = 200;
const DEG = Math.PI / 180;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
});
const materialLabel = (id: AcoustoOpticId) => `${ACOUSTO_OPTIC[id].name}, ${ACOUSTO_OPTIC[id].mode}`;
const powerText = (P_W: number) => (!Number.isFinite(P_W) ? "—" : P_W < 1 ? `${sig(P_W * 1e3, 4)} mW` : `${sig(P_W, 4)} W`);

function efficiencyChart(lambda: number, M2: number, L: number, H: number, P_W: number, P100: number) {
  const max_W = Math.max(2 * P100, P_W);
  const p = Array.from({ length: CHART_POINTS + 1 }, (_, k) => (k * max_W) / CHART_POINTS);
  return [
    { x: p.map(round6), y: p.map((x) => round6(100 * braggEfficiency(lambda, M2, L, H, x))), type: "scatter", mode: "lines", name: "η", line: { color: "#60a5fa", width: 2 } },
    { x: [round6(P_W)], y: [round6(100 * braggEfficiency(lambda, M2, L, H, P_W))], type: "scatter", mode: "markers", name: "now", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } },
  ];
}

export default function AcoustoOpticPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm
  const [frequencyRaw, setFrequency] = useURLState("frequency", 80); // MHz
  const [powerRaw, setPower] = useURLState("power", 0.02); // W acoustic
  const [lengthRaw, setLength] = useURLState("length", 10); // mm
  const [heightRaw, setHeight] = useURLState("height", 1); // mm
  const [beamRaw, setBeam] = useURLState("beam", 2); // mm
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 40); // MHz
  const [nRaw, setN] = useURLState("n", 2.26);
  const [velocityRaw, setVelocity] = useURLState("velocity", 617); // m/s
  const [m2Raw, setM2] = useURLState("m2", 793); // 1e-15 s^3/kg
  const isCustom = materialParam === CUSTOM;
  const id = (IDS as string[]).includes(materialParam) ? (materialParam as AcoustoOpticId) : DEFAULT_ID;

  const wavelength_nm = clamp(wavelengthRaw, 200, 20000, 633);
  const frequency_MHz = clamp(frequencyRaw, 1, 3000, 80);
  const power_W = clamp(powerRaw, 0, 100, 0.02);
  const length_mm = clamp(lengthRaw, 0.1, 200, 10);
  const height_mm = clamp(heightRaw, 0.01, 50, 1);
  const beam_mm = clamp(beamRaw, 0.01, 100, 2);
  const bandwidth_MHz = clamp(bandwidthRaw, 0, 2000, 40);
  const n = isCustom ? clamp(nRaw, 1, 5, 2.26) : ACOUSTO_OPTIC[id].n;
  const v = isCustom ? clamp(velocityRaw, 100, 20000, 617) : ACOUSTO_OPTIC[id].v;
  const M2 = (isCustom ? clamp(m2Raw, 0.01, 5000, 793) : ACOUSTO_OPTIC[id].M2 * 1e15) * 1e-15;

  const lambda = wavelength_nm * 1e-9;
  const f = frequency_MHz * 1e6;
  const L = length_mm * 1e-3;
  const H = height_mm * 1e-3;
  const D = beam_mm * 1e-3;
  const df = bandwidth_MHz * 1e6;

  const thetaOut = braggAngle(lambda, f, v);
  const thetaIn = braggAngle(lambda / n, f, v);
  const scan_mrad = scanAngle(lambda, df, v) * 1e3;
  const Q = kleinCookQ(lambda, L, f, n, v);
  const eta = 100 * braggEfficiency(lambda, M2, L, H, power_W);
  const P100 = fullEfficiencyPower(lambda, M2, L, H);
  const tau = accessTime(D, v);
  const spots = tau * df;
  const chart = Number.isFinite(P100) ? efficiencyChart(lambda, M2, L, H, power_W, P100) : [];
  const noAngle = "λf/(2v) > 1: no Bragg angle at this frequency";
  const regime = !Number.isFinite(Q) ? undefined : Q >= 10 ? "Bragg regime (Q ≫ 1)" : Q <= 1 ? "Raman–Nath regime (Q ≪ 1)" : "intermediate: the Bragg formulas are approximate";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6" role="group" aria-label="Material">
        {IDS.map((k) => (
          <button key={k} onClick={() => setMaterial(k)} aria-pressed={!isCustom && id === k}
            className={`px-3 py-2 rounded text-sm ${!isCustom && id === k ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {materialLabel(k)}
          </button>
        ))}
        <button onClick={() => setMaterial(CUSTOM)} aria-pressed={isCustom}
          className={`px-3 py-2 rounded text-sm ${isCustom ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Acoustic velocity v (m/s)" value={velocityRaw} onChange={setVelocity} min={100} max={20000} step="10" />
          <ValidatedNumberInput label="Figure of merit M₂ (×10⁻¹⁵ s³/kg)" value={m2Raw} onChange={setM2} min={0.01} max={5000} step="0.1" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="1" />
        <ValidatedNumberInput label="RF frequency f (MHz)" value={frequencyRaw} onChange={setFrequency} min={1} max={3000} step="1" />
        <ValidatedNumberInput label="Acoustic power P (W)" value={powerRaw} onChange={setPower} min={0} max={100} step="0.005" />
        <ValidatedNumberInput label="RF sweep Δf (MHz)" value={bandwidthRaw} onChange={setBandwidth} min={0} max={2000} step="1" />
        <ValidatedNumberInput label="Interaction length L (mm)" value={lengthRaw} onChange={setLength} min={0.1} max={200} step="0.5" />
        <ValidatedNumberInput label="Transducer height H (mm)" value={heightRaw} onChange={setHeight} min={0.01} max={50} step="0.1" />
        <ValidatedNumberInput label="Beam width D (mm)" value={beamRaw} onChange={setBeam} min={0.01} max={100} step="0.1" />
      </div>
      {!isCustom && id === "teo2-shear" && (
        <p className="text-xs mb-4 text-yellow-400">
          TeO₂ slow-shear cells use anisotropic Bragg diffraction (light near the optic axis, polarization changes); their Bragg angles differ from these isotropic values.
        </p>
      )}
      <p className="text-xs mb-6 text-gray-500">n = {sig(n, 4)}, v = {sig(v, 4)} m/s, M₂ = {sig(M2 * 1e15, 4)} ×10⁻¹⁵ s³/kg.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Bragg angle outside θ_B" value={Number.isFinite(thetaOut) ? `${sig(thetaOut / DEG, 4)}°` : "—"} tone="blue"
          subtext={Number.isFinite(thetaOut) ? "sin θ_B = λf/(2v)" : noAngle} />
        <ResultCard label="Deflection 2θ_B" value={Number.isFinite(thetaOut) ? `${sig((2 * thetaOut) / DEG, 4)}°` : "—"} tone="green"
          subtext="angle between the zero and first order" />
        <ResultCard label="Bragg angle inside the cell" value={Number.isFinite(thetaIn) ? `${sig(thetaIn / DEG, 4)}°` : "—"} tone="cyan"
          subtext={Number.isFinite(thetaIn) ? "asin(λf/(2nv)); refraction restores the outside angle" : noAngle} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label={`Scan range for Δf = ${bandwidth_MHz} MHz`} value={Number.isFinite(scan_mrad) ? `${sig(scan_mrad, 4)} mrad` : "—"} tone="orange"
          subtext="Δθ = λΔf/v, outside the cell" />
        <ResultCard label="Klein–Cook parameter Q" value={sig(Q, 4)} tone="purple" subtext={regime} />
        <ResultCard label="First-order efficiency η" value={Number.isFinite(eta) ? `${sig(eta, 4)} %` : "—"} tone="red"
          subtext={power_W > P100 ? "overdriven: past P₁₀₀ the power flows back into the zero order" : `at ${sig(power_W, 4)} W acoustic power`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Power for 100 %" value={powerText(P100)} tone="yellow" subtext={Number.isFinite(P100) ? "λ²H/(2M₂L)" : "M₂ or L is zero"} />
        <ResultCard label="Access time τ = D/v" value={Number.isFinite(tau) ? `${sig(tau * 1e6, 4)} µs` : "—"} tone="gray" subtext="time for the sound to cross the beam" />
        <ResultCard label="Resolvable spots N = τΔf" value={sig(spots, 4)} tone="green" subtext="for the swept bandwidth" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Efficiency against acoustic power</h3>
        {chart.length ? <ChartPanel data={chart} layout={layout("Acoustic power (W)", "η (%)")} />
          : <p className="text-sm text-gray-400">No efficiency curve: M₂ or L is zero.</p>}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Presets</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Material</th><th className="pr-4 py-1">Mode</th><th className="pr-4 py-1">n</th>
              <th className="pr-4 py-1">v (m/s)</th><th className="py-1">M₂ (×10⁻¹⁵ s³/kg)</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((k) => (
              <tr key={k} onClick={() => setMaterial(k)} className={`cursor-pointer hover:bg-gray-800 ${!isCustom && id === k ? "bg-gray-800" : ""}`}>
                <td className="pr-4 py-1">{ACOUSTO_OPTIC[k].name}</td>
                <td className="pr-4 py-1 text-gray-300">{ACOUSTO_OPTIC[k].mode}</td>
                <td className="pr-4 py-1">{ACOUSTO_OPTIC[k].n}</td>
                <td className="pr-4 py-1">{ACOUSTO_OPTIC[k].v}</td>
                <td className="py-1">{sig(ACOUSTO_OPTIC[k].M2 * 1e15, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">
          M₂ = n⁶p²/(ρv³), measured at 633 nm (Uchida &amp; Niizeki 1973; Dixon 1967); using it at other wavelengths ignores the
          dispersion of n and p.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">sin θ_B = λ₀f/(2v) outside,  λ₀f/(2nv) inside,  Δθ = λ₀Δf/v</p>
          <p>
            Refraction at the entrance face restores the outside value of the Bragg angle. The diffracted beam leaves at 2θ_B.
          </p>
          <p className="font-mono">Q = 2πλ₀Lf²/(nv²),  η = sin²[(π/(√2 λ₀))√(M₂LP/H)],  P₁₀₀ = λ₀²H/(2M₂L)</p>
          <p>
            The Klein–Cook parameter (Klein &amp; Cook 1967) separates the Bragg regime (Q ≫ 1) from Raman–Nath diffraction
            (Q ≪ 1). The efficiency and the power for 100 % follow Yariv &amp; Yeh, ch. 9.
          </p>
          <p className="font-mono">τ = D/v,  N = τΔf</p>
          <p>Acoustic attenuation is ignored.</p>
        </div>
      </div>
    </>
  );
}
