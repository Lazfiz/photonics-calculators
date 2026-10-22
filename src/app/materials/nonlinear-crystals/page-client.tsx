"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BK_OPTIMUM, SHG_CRYSTALS, SHG_LAMBDA, focusedShg, shgFigureOfMerit, shgPrefactor, waistForXi, type ShgCrystalId,
} from "../../../physics/materials/nonlinear-crystals";

const IDS = Object.keys(SHG_CRYSTALS) as ShgCrystalId[];
type Choice = ShgCrystalId | "custom";
const CHOICES: readonly Choice[] = [...IDS, "custom"];
const DEFAULT_ID: Choice = "bbo";
const LENGTH_MIN_MM = 0.1;
const LENGTH_MAX_MM = 100;
const POWER_MAX_W = 1e9;
const WAIST_MIN_UM = 1;
const WAIST_MAX_UM = 10000;
const WAVELENGTH_MIN_NM = 400;
const WAVELENGTH_MAX_NM = 12000;
const DEFF_MAX_PMV = 500;
/** ξ = L/b of the best focus at Δk = 0 (h = 0.646). */
const XI_BEST_PHASE_MATCHED = 1.39;
/** Conversion above which the undepleted-pump result is flagged. */
const DEPLETION_WARNING = 0.1;
const CHART_POINTS = 100;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const watts = (P: number) => {
  if (!Number.isFinite(P)) return "—";
  const [s, u] = P >= 1e3 ? [1e3, "kW"] : P >= 1 ? [1, "W"] : P >= 1e-3 ? [1e-3, "mW"] : [1e-6, "µW"];
  return `${sig(P / s, 4)} ${u}`;
};
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});

interface Medium {
  lambda: number;
  deff: number;
  nOmega: number;
  n2Omega: number;
}

/** K (1/W) over crystal length: at the chosen waist and at the best phase-matched focus for each length. */
function lengthChart(m: Medium, w0: number, L: number) {
  const Ls = Array.from({ length: CHART_POINTS }, (_, k) => (LENGTH_MAX_MM * (k + 1)) / CHART_POINTS);
  const fixed = Ls.map((mm) => focusedShg({ ...m, length: mm * 1e-3, w0 }).K);
  const best = Ls.map((mm) => focusedShg({ ...m, length: mm * 1e-3, w0: waistForXi(m.lambda, m.nOmega, mm * 1e-3, XI_BEST_PHASE_MATCHED) }).K);
  if (!fixed.every(Number.isFinite) || !best.every(Number.isFinite)) return [];
  const K = focusedShg({ ...m, length: L, w0 }).K;
  return [
    { x: Ls, y: fixed.map((k) => round6(100 * k)), type: "scatter", mode: "lines", name: `w₀ = ${sig(w0 * 1e6, 3)} µm`, line: { color: "#60a5fa", width: 2 } },
    { x: Ls, y: best.map((k) => round6(100 * k)), type: "scatter", mode: "lines", name: "best focus (ξ = 1.39)", line: { color: "#34d399", width: 2, dash: "dash" } },
    { x: [round6(L * 1e3)], y: [round6(100 * K)], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } },
  ];
}

export default function NonlinearCrystalsPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [lengthRaw, setLength] = useURLState("length", 10); // mm
  const [powerRaw, setPower] = useURLState("pumpPower", 5); // W, peak
  const [waistRaw, setWaist] = useURLState("waist", 30); // µm, 1/e² radius
  const [wavelengthRaw, setWavelength] = useURLState("pumpWavelength", 1064); // nm, custom
  const [deffRaw, setDeff] = useURLState("deff", 2); // pm/V, custom
  const [nRaw, setN] = useURLState("n", 1.66); // custom
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const crystal = choice === "custom" ? null : SHG_CRYSTALS[choice];
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 10);
  const power = clamp(powerRaw, 0, POWER_MAX_W, 5);
  const waist_um = clamp(waistRaw, WAIST_MIN_UM, WAIST_MAX_UM, 30);
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 1064);
  const deff_pmV = clamp(deffRaw, 0, DEFF_MAX_PMV, 2);
  const nCustom = clamp(nRaw, 1, 5, 1.66);

  const m: Medium = crystal
    ? { lambda: SHG_LAMBDA, deff: crystal.deff, nOmega: crystal.nOmega, n2Omega: crystal.n2Omega }
    : { lambda: wavelength_nm * 1e-9, deff: deff_pmV * 1e-12, nOmega: nCustom, n2Omega: nCustom };
  const L = length_mm * 1e-3;
  const w0 = waist_um * 1e-6;
  const shg = focusedShg({ ...m, length: L, w0 });
  const efficiency = shg.K * power;
  const P2 = shg.K * power ** 2;
  const prefactor = shgPrefactor(m.lambda, L, m.deff, m.nOmega, m.n2Omega);
  const wBest = waistForXi(m.lambda, m.nOmega, L, XI_BEST_PHASE_MATCHED);
  const KBest = focusedShg({ ...m, length: L, w0: wBest }).K;
  const wOpt = waistForXi(m.lambda, m.nOmega, L, BK_OPTIMUM.xi);
  const chart = lengthChart(m, w0, L);
  const lambda_nm = Math.round(m.lambda * 1e9);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 mb-6" role="group" aria-label="Crystal">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : SHG_CRYSTALS[id].name}
          </button>
        ))}
      </div>

      {!crystal && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Pump λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
          <ValidatedNumberInput label="d_eff (pm/V)" value={deffRaw} onChange={setDeff} min={0} max={DEFF_MAX_PMV} step="0.1" />
          <ValidatedNumberInput label="Phase-matched index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="0.5" />
        <ValidatedNumberInput label="Pump peak power (W)" value={powerRaw} onChange={setPower} min={0} max={POWER_MAX_W} step="any" />
        <ValidatedNumberInput label="Focus waist w₀ (µm, 1/e² radius)" value={waistRaw} onChange={setWaist} min={WAIST_MIN_UM} max={WAIST_MAX_UM} step="1" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {crystal
          ? `${crystal.cut}, ${lambda_nm} → ${lambda_nm / 2} nm: d_eff = ${sig(crystal.deff * 1e12, 4)} pm/V, n_ω = ${sig(crystal.nOmega, 5)}, n_2ω = ${sig(crystal.n2Omega, 5)}; ${crystal.source}.`
          : `Custom crystal, ${lambda_nm} → ${sig(lambda_nm / 2, 5)} nm, n_ω = n_2ω = ${sig(nCustom, 4)}.`}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Second-harmonic power" value={watts(P2)} tone="green" subtext={`P_2ω = K P_ω², ${lambda_nm} → ${sig(lambda_nm / 2, 5)} nm`} />
        <ResultCard label="Conversion efficiency" value={`${sig(100 * efficiency, 4)} %`} tone="blue"
          subtext={efficiency > DEPLETION_WARNING ? "pump depletion: the real value is lower" : "η = K P_ω (undepleted pump)"} />
        <ResultCard label="Normalized efficiency K" value={`${sig(100 * shg.K, 4)} %/W`} tone="purple"
          subtext={`ξ = L/b = ${sig(shg.xi, 3)}, h = ${sig(shg.h, 3)}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Best focus at Δk = 0" value={`${sig(100 * KBest, 4)} %/W`} tone="orange"
          subtext={`w₀ = ${sig(wBest * 1e6, 3)} µm (ξ = 1.39, h = 0.646)`} />
        <ResultCard label="Boyd–Kleinman optimum" value={`${sig(100 * prefactor * BK_OPTIMUM.h, 4)} %/W`} tone="gray"
          subtext={`w₀ = ${sig(wOpt * 1e6, 3)} µm (ξ = 2.84) with Δk tuned to σ = 0.57, h = 1.068`} />
      </div>
      {efficiency > DEPLETION_WARNING && (
        <p className="text-sm text-yellow-400 mb-6">
          Above about 10 % conversion the pump depletes and P_2ω grows slower than P_ω²; this model overestimates it.
        </p>
      )}

      {chart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Normalized efficiency over crystal length</h3>
          <ChartPanel data={chart} layout={layout("Crystal length (mm)", "K (%/W)")} />
          <p className="text-xs text-gray-500 mt-2">
            A fixed waist gives K ∝ L² while L stays below the confocal parameter, then ∝ L⁰; refocusing for each length keeps K ∝ L.
          </p>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Crystals for 1064 → 532 nm</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Crystal</th><th className="pr-4 py-1">Cut</th><th className="pr-4 py-1 text-right">d_eff (pm/V)</th>
              <th className="pr-4 py-1 text-right">n_ω / n_2ω</th><th className="pr-4 py-1 text-right">d²/(n_ω²n_2ω) (pm²/V²)</th>
              <th className="pr-4 py-1 text-right">K, best focus</th><th className="pr-4 py-1">Transparency (nm)</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((id) => {
              const c = SHG_CRYSTALS[id];
              const K = focusedShg({ lambda: SHG_LAMBDA, length: L, deff: c.deff, nOmega: c.nOmega, n2Omega: c.n2Omega,
                w0: waistForXi(SHG_LAMBDA, c.nOmega, L, XI_BEST_PHASE_MATCHED) }).K;
              return (
                <tr key={id} onClick={() => setMaterial(id)} className={`cursor-pointer hover:bg-gray-800 ${id === choice ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1">{c.name}</td>
                  <td className="pr-4 py-1 text-gray-300">{c.cut}</td>
                  <td className="pr-4 py-1 text-right">{sig(c.deff * 1e12, 3)}</td>
                  <td className="pr-4 py-1 text-right">{sig(c.nOmega, 4)} / {sig(c.n2Omega, 4)}</td>
                  <td className="pr-4 py-1 text-right">{sig(shgFigureOfMerit(c.deff, c.nOmega, c.n2Omega) * 1e24, 3)}</td>
                  <td className="pr-4 py-1 text-right">{sig(100 * K, 3)} %/W</td>
                  <td className="pr-4 py-1">{c.transparency.map((x) => Math.round(x * 1e9)).join("–")}</td>
                  <td className="py-1 text-gray-400">{c.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the crystal. K is for the length above at the best phase-matched focus.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">P_2ω = K P_ω²,  K = 16π² d_eff² L h(ξ) / (ε₀ c n_ω n_2ω λ³),  ξ = L/b,  b = 2πn_ω w₀²/λ</p>
          <p>
            Boyd–Kleinman focused Gaussian beam with the focus at the crystal centre, exact phase matching, no absorption and
            an undepleted pump. At Δk = 0, h = arctan²ξ/ξ peaks at 0.646 for ξ = 1.39; tuning Δk slightly raises the optimum
            to h = 1.068 at ξ = 2.84.
          </p>
          <p>
            Walk-off is ignored, so the critically phase-matched crystals (BBO 56 mrad, BiBO 26 mrad) convert less than shown
            once the beam is tighter than the walk-off allows; the noncritical and QPM cuts have none. d_eff belongs to one
            cut at 1064 nm and changes with wavelength and angle, and published values differ by tens of per cent between
            sources. For pulses, use the peak power and keep the pulse longer than the group-velocity walk-off over L.
          </p>
        </div>
      </div>
    </>
  );
}
