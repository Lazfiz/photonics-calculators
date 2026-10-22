"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { stokesWavelength } from "../../../physics/imaging/coherent-raman";
import {
  RAMAN_LINES, dephasingTime, lorentzianGain, ramanGainAtPump, ramanGainExponent, type GainBasis, type RamanLine, type RamanLineId,
} from "../../../physics/materials/raman-gain";

const IDS = Object.keys(RAMAN_LINES) as RamanLineId[];
const DEFAULT_ID: RamanLineId = "diamond";
const PUMP_MIN_NM = 200;
const PUMP_MAX_NM = 3000;
const INTENSITY_MAX_GW_CM2 = 100;
const LENGTH_MIN_MM = 0.01;
const LENGTH_MAX_MM = 1e6;
const BASIS_LABEL: Record<GainBasis, string> = {
  measured: "measured",
  interpolated: "interpolated between measured pump wavelengths",
  scaled: "scaled as 1/λ_p from the nearest measured pump wavelength (estimate)",
};

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");

/** Lorentzian gain over ±8 FWHM around the line, cm/GW against shift in cm⁻¹ (rounded for the chart axis). */
function lineCurve(line: RamanLine, gPeak: number) {
  const x = Array.from({ length: 161 }, (_, i) => line.shift + ((i - 80) / 10) * line.fwhm);
  return {
    x: x.map((s) => +(s / 100).toFixed(6)),
    y: x.map((s) => +(lorentzianGain(gPeak, s, line.shift, line.fwhm) / 1e-11).toFixed(6)),
  };
}

export default function RamanScatteringPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [pumpRaw, setPump] = useURLState("pumpWl", 1064); // nm
  const [intensityRaw, setIntensity] = useURLState("intensity", 0.1); // GW/cm²
  const [lengthRaw, setLength] = useURLState("length", 10); // mm
  const id = (IDS as string[]).includes(materialParam) ? (materialParam as RamanLineId) : DEFAULT_ID;
  const line = RAMAN_LINES[id];
  const pump_nm = clamp(pumpRaw, PUMP_MIN_NM, PUMP_MAX_NM, 1064);
  const intensity_GWcm2 = clamp(intensityRaw, 0, INTENSITY_MAX_GW_CM2, 0.1);
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 10);

  const lambdaP = pump_nm * 1e-9;
  const lambdaS = stokesWavelength(lambdaP, line.shift);
  const { g, basis } = ramanGainAtPump(line, lambdaP);
  const T2 = dephasingTime(line.fwhm);
  const G = ramanGainExponent(g, intensity_GWcm2 * 1e13, length_mm * 1e-3);
  const curve = Number.isFinite(line.fwhm) && Number.isFinite(g) ? lineCurve(line, g) : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6" role="group" aria-label="Raman medium">
        {IDS.map((k) => (
          <button key={k} onClick={() => setMaterial(k)} aria-pressed={id === k}
            className={`px-3 py-2 rounded text-sm ${id === k ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {RAMAN_LINES[k].name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Pump wavelength (nm)" value={pumpRaw} onChange={setPump} min={PUMP_MIN_NM} max={PUMP_MAX_NM} step="1" />
        <ValidatedNumberInput label="Pump intensity (GW/cm²)" value={intensityRaw} onChange={setIntensity} min={0} max={INTENSITY_MAX_GW_CM2} step="any" />
        <ValidatedNumberInput label="Length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="any" />
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {line.name}: Ω̃ = {sig(line.shift / 100, 5)} cm⁻¹, Δν̃ = {Number.isFinite(line.fwhm) ? `${sig(line.fwhm / 100, 3)} cm⁻¹` : "broad (glass)"};{" "}
        gain measured at {line.gains.map((p) => `${Math.round(p.lambda * 1e9)} nm`).join(", ")}; {line.source}.{" "}
        <span className={basis === "scaled" ? "text-yellow-400" : ""}>g_R at {sig(pump_nm, 5)} nm is {BASIS_LABEL[basis]}.</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Stokes wavelength 1/λ_s = 1/λ_p − Ω̃" value={`${sig(lambdaS * 1e9, 6)} nm`} tone="blue"
          subtext={`shift ${sig((c * line.shift) / 1e12, 4)} THz`} />
        <ResultCard label="Peak Raman gain g_R" value={`${sig(g / 1e-11, 3)} cm/GW`} tone="green" subtext={`= ${Number.isFinite(g) ? g.toExponential(2) : "—"} m/W`} />
        <ResultCard label="Dephasing time T₂ = 1/(πcΔν̃)" value={Number.isFinite(T2) ? `${sig(T2 * 1e12, 3)} ps` : "—"} tone="orange"
          subtext={Number.isFinite(T2) ? `steady state needs pulses ≫ ${sig(T2 * 1e12, 2)} ps` : "glass line is not Lorentzian"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Single-pass gain exponent G = g_R I L" value={sig(G, 4)} tone="purple" subtext={`Stokes grows by e^G = ${sig(4.342944819 * G, 4)} dB`} />
      </div>

      {curve && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold mb-2">{line.name} gain line at {sig(pump_nm, 5)} nm pump</h3>
          <ChartPanel
            data={[{ x: curve.x, y: curve.y, type: "scatter" as const, mode: "lines" as const, name: "g_R", line: { color: "#34d399", width: 2 } }]}
            layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Raman shift (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "g_R (cm/GW)", gridcolor: "#374151" }, margin: { t: 20, b: 50, l: 60, r: 20 } }}
          />
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Raman media at {sig(pump_nm, 5)} nm pump</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Medium</th><th className="pr-4 py-1 text-right">Ω̃ (cm⁻¹)</th><th className="pr-4 py-1 text-right">Δν̃ (cm⁻¹)</th>
              <th className="pr-4 py-1 text-right">g_R (cm/GW)</th><th className="pr-4 py-1 text-right">Stokes λ (nm)</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((k) => {
              const m = RAMAN_LINES[k];
              const r = ramanGainAtPump(m, lambdaP);
              return (
                <tr key={k} onClick={() => setMaterial(k)} className={`cursor-pointer hover:bg-gray-800 ${k === id ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1">{m.name}</td>
                  <td className="pr-4 py-1 text-right">{sig(m.shift / 100, 5)}</td>
                  <td className="pr-4 py-1 text-right">{Number.isFinite(m.fwhm) ? sig(m.fwhm / 100, 3) : "broad"}</td>
                  <td className="pr-4 py-1 text-right font-mono">{sig(r.g / 1e-11, 3)}{r.basis === "scaled" ? "*" : ""}</td>
                  <td className="pr-4 py-1 text-right">{sig(stokesWavelength(lambdaP, m.shift) * 1e9, 6)}</td>
                  <td className="py-1 text-gray-400">{m.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the medium. * scaled as 1/λ_p outside the measured pump range.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">1/λ_s = 1/λ_p − Ω̃,  g(Ω̃) = g_R / (1 + [2(Ω̃ − Ω̃₀)/Δν̃]²),  I_s(L) = I_s(0)·e^(g_R I_p L)</p>
          <p>
            Steady-state stimulated Raman scattering of a plane-wave pump that is not depleted. The gain holds for pulses much
            longer than T₂; shorter pulses are in the transient regime, where the gain is set by the integrated cross-section
            and is lower. Gains are for the pump polarization of the measurement (diamond along &lt;111&gt;).
          </p>
          <p>
            The diamond gain falls with pump wavelength faster than 1/λ_p (Savitski 2013: 17 cm/GW at 1064 nm, 7.6 at 1280 nm);
            between measured points it is interpolated in pump wavenumber. Silica fibre gains and thresholds are on the fibre
            SRS pages.
          </p>
        </div>
      </div>
    </>
  );
}
