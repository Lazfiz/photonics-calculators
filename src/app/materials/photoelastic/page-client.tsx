"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { STRESS_OPTIC, stressForRetardance, type StressOpticId } from "../../../physics/materials/stress-optic";
import { photoelasticRetardance } from "../../../physics/polarization/photoelasticity";
import { retardanceFromPath } from "../../../physics/polarization/retarders";

const GLASS_IDS = Object.keys(STRESS_OPTIC) as StressOpticId[];
const CUSTOM = "custom";
const DEFAULT_MATERIAL: StressOpticId = "silica";
const C_MIN = -100;
const C_MAX = 100;
const STRESS_MIN_MPA = -2000;
const STRESS_MAX_MPA = 2000;
const THICKNESS_MIN_MM = 0.01;
const THICKNESS_MAX_MM = 1000;
const WAVELENGTH_MIN_NM = 200;
const WAVELENGTH_MAX_NM = 20000;
const CHART_POINTS = 40;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
});

function retardanceChart(C: number, d: number, sigma_MPa: number, R_nm: number, lambda_nm: number) {
  const max_MPa = Math.max(2 * Math.abs(sigma_MPa), 1);
  const s = Array.from({ length: CHART_POINTS + 1 }, (_, k) => (k * max_MPa) / CHART_POINTS);
  return [
    { x: s.map(round6), y: s.map((x) => round6(Math.abs(photoelasticRetardance(C, d, x * 1e6)) * 1e9)), type: "scatter", mode: "lines", name: "|R|", line: { color: "#60a5fa", width: 2 } },
    { x: [0, round6(max_MPa)], y: [round6(lambda_nm / 2), round6(lambda_nm / 2)], type: "scatter", mode: "lines", name: "λ/2", line: { color: "#fbbf24", width: 1.5, dash: "dash" } },
    { x: [round6(Math.abs(sigma_MPa))], y: [round6(Math.abs(R_nm))], type: "scatter", mode: "markers", name: "now", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } },
  ];
}

export default function PhotoelasticPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_MATERIAL as string);
  const [CRaw, setC] = useURLState("C", 3); // 1e-12 Pa^-1
  const [stressRaw, setStress] = useURLState("stress", 10); // MPa
  const [thicknessRaw, setThickness] = useURLState("thickness", 10); // mm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm
  const isCustom = materialParam === CUSTOM;
  const glassId = (GLASS_IDS as string[]).includes(materialParam) ? (materialParam as StressOpticId) : DEFAULT_MATERIAL;
  const C_custom = clamp(CRaw, C_MIN, C_MAX, 3);
  const stress_MPa = clamp(stressRaw, STRESS_MIN_MPA, STRESS_MAX_MPA, 10);
  const thickness_mm = clamp(thicknessRaw, THICKNESS_MIN_MM, THICKNESS_MAX_MM, 10);
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 633);

  const C = isCustom ? C_custom * 1e-12 : STRESS_OPTIC[glassId].C;
  const sigma = stress_MPa * 1e6;
  const d = thickness_mm * 1e-3;
  const lambda = wavelength_nm * 1e-9;

  const deltaN = C * sigma;
  const R_nm = photoelasticRetardance(C, d, sigma) * 1e9;
  const R_nm_per_cm = photoelasticRetardance(C, 0.01, sigma) * 1e9;
  const phase = retardanceFromPath(R_nm * 1e-9, wavelength_nm * 1e-9);
  const order = R_nm / wavelength_nm;
  const halfWave_MPa = stressForRetardance(lambda / 2, C, d) / 1e6;
  const chart = C !== 0 ? retardanceChart(C, d, stress_MPa, R_nm, wavelength_nm) : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Glass</span>
          <select value={isCustom ? CUSTOM : glassId} onChange={(e) => setMaterial(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {GLASS_IDS.map((id) => <option key={id} value={id}>{STRESS_OPTIC[id].name}</option>)}
            <option value={CUSTOM}>Custom</option>
          </select>
        </label>
        {isCustom && (
          <ValidatedNumberInput label="Stress-optic coefficient C (×10⁻¹² Pa⁻¹)" value={CRaw} onChange={setC} min={C_MIN} max={C_MAX} step="0.01" />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Stress difference σ₁ − σ₂ (MPa)" value={stressRaw} onChange={setStress} min={STRESS_MIN_MPA} max={STRESS_MAX_MPA} step="1" />
        <ValidatedNumberInput label="Thickness d (mm)" value={thicknessRaw} onChange={setThickness} min={THICKNESS_MIN_MM} max={THICKNESS_MAX_MM} step="0.5" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
      </div>
      {(wavelength_nm < 400 || wavelength_nm > 2500) && (
        <p className="text-sm mb-4 text-yellow-400">
          C is measured in the visible (silica&apos;s C rises 5.6 % from 650 to 460 nm, Jog 1957) and glasses absorb outside
          roughly 0.35–2.5 µm; outside this range the retardance is indicative only.
        </p>
      )}
      <p className="text-xs mb-6 text-gray-500">For uniaxial stress (σ₂ = 0), a positive value is tension and a negative one compression.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Stress-optic coefficient C" value={`${sig(C * 1e12, 4)} ×10⁻¹² Pa⁻¹`} tone="blue"
          subtext={isCustom ? "custom value" : STRESS_OPTIC[glassId].source} />
        <ResultCard label="Birefringence Δn = C·σ" value={Number.isFinite(deltaN) ? deltaN.toExponential(3) : "—"} tone="green" subtext="signed" />
        <ResultCard label="Phase Γ = 2πR/λ" value={Number.isFinite(phase) ? `${sig(phase, 4)} rad` : "—"} tone="cyan"
          subtext={Number.isFinite(order) ? `fringe order R/λ = ${sig(order, 4)}` : undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label={`Retardance R in ${thickness_mm} mm`} value={Number.isFinite(R_nm) ? `${sig(R_nm, 4)} nm` : "—"} tone="orange"
          subtext="signed: flips between tension and compression" />
        <ResultCard label="Retardance per cm" value={Number.isFinite(R_nm_per_cm) ? `${sig(R_nm_per_cm, 4)} nm/cm` : "—"} tone="purple"
          subtext="the unit glass catalogs use for stress birefringence" />
        <ResultCard label="Stress for half-wave retardance" value={Number.isFinite(halfWave_MPa) ? `${sig(halfWave_MPa, 4)} MPa` : "—"} tone="yellow"
          subtext={Number.isFinite(halfWave_MPa) ? "R = λ/2 at this thickness and wavelength" : "C = 0: no birefringence at any stress"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Retardance against stress</h3>
        {chart.length ? <ChartPanel data={chart} layout={layout("|σ₁ − σ₂| (MPa)", "|R| (nm)")} />
          : <p className="text-sm text-gray-400">C = 0: the retardance is zero at every stress.</p>}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Glasses at {sig(stress_MPa, 4)} MPa</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Glass</th><th className="pr-4 py-1">C (×10⁻¹² Pa⁻¹)</th>
              <th className="pr-4 py-1">R per cm (nm/cm)</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {GLASS_IDS.map((id) => (
              <tr key={id} onClick={() => setMaterial(id)} className={`cursor-pointer hover:bg-gray-800 ${!isCustom && id === glassId ? "bg-gray-800" : ""}`}>
                <td className="pr-4 py-1">{STRESS_OPTIC[id].name}</td>
                <td className="pr-4 py-1">{sig(STRESS_OPTIC[id].C * 1e12, 4)}</td>
                <td className="pr-4 py-1">{sig(photoelasticRetardance(STRESS_OPTIC[id].C, 0.01, sigma) * 1e9, 4)}</td>
                <td className="py-1 text-gray-400">{STRESS_OPTIC[id].source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the glass.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">R = C d (σ₁ − σ₂),  Γ = 2πR/λ</p>
          <p>
            The principal stress axes are the birefringence axes. C comes from the Schott data sheets (K in 10⁻⁶ mm²/N =
            10⁻¹² Pa⁻¹; SF57&apos;s 0.02 is the near-zero-K lead glass used for polarization-preserving optics) and from Jog 1957
            for fused silica (3.55 at 649.5 nm, rising to 3.75 at 460 nm). The sign of R flips between tension and compression.
          </p>
          <p>
            Crystals are not listed because they have a stress-optic tensor, so their birefringence depends on the stress and
            light directions. Liquids carry no static shear stress.
          </p>
        </div>
      </div>
    </>
  );
}
