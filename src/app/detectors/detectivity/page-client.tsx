"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { darkCurrentRatio, type DarkCurrentMechanism } from "../../../physics/detectors/dark-current";
import {
  detectivitySummary, detectorDStarAt, responsivityAt, systemDStar, systemNoiseCurrent, type DetectivityParams,
} from "../../../physics/detectors/detectivity";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) && x > 0 ? x.toExponential(digits) : "—");

export default function DetectivityPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 850);
  const [cutoffRaw, setCutoff] = useURLState("cutoff", 1100);
  const [qeRaw, setQe] = useURLState("qe", 0.7);
  const [darkCurrentRaw, setDarkCurrent] = useURLState("darkCurrent", 1);
  const [areaRaw, setArea] = useURLState("area", 1);
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1);
  const [temperatureRaw, setTemperature] = useURLState("temperature", 293);
  const [loadResistanceRaw, setLoadResistance] = useURLState("loadResistance", 50);
  const [r0aRaw, setR0a] = useURLState("r0a", 1e7);
  const [gainRaw, setGain] = useURLState("gain", 1);
  const [excessNoiseFactorRaw, setExcessNoiseFactor] = useURLState("excessNoiseFactor", 1);
  const [darkLawRaw, setDarkLaw] = useURLState("darkLaw", "generation");
  const darkLaw: DarkCurrentMechanism = darkLawRaw === "diffusion" ? "diffusion" : "generation";

  const wavelength_nm = clamp(wavelengthRaw, 200, 20000, 850);
  const cutoff_nm = clamp(cutoffRaw, 300, 20000, 1100);
  const qe = clamp(qeRaw, 0.01, 1, 0.7);
  const darkCurrent = clamp(darkCurrentRaw, 0, 1e9, 1) * 1e-9; // nA → A
  const area_cm2 = clamp(areaRaw, 1e-4, 1e4, 1) * 1e-2; // mm² → cm² (D* uses cm·√Hz/W)
  const bandwidth = clamp(bandwidthRaw, 1e-6, 1e5, 1) * 1e6; // MHz → Hz
  const temperature = clamp(temperatureRaw, 4, 500, 293);
  const loadResistance = clamp(loadResistanceRaw, 1, 1e12, 50);
  const r0a = clamp(r0aRaw, 1e-6, 1e15, 1e7); // Ω·cm²
  const gain = clamp(gainRaw, 1, 1e4, 1);
  const excessNoiseFactor = clamp(excessNoiseFactorRaw, 1, 1e4, 1);
  const params: DetectivityParams = {
    wavelength_nm, cutoff_nm, qe, darkCurrent, area_cm2, bandwidth, temperature, loadResistance, r0a, gain, excessNoiseFactor,
  };
  const {
    bandGap_eV, responsivity, detectorDStar, systemDStar: detectivity, nepSpectral, shotNoise, thermalNoise, totalNoise, jd,
    shotVariance, johnsonVariance,
  } = detectivitySummary(params);
  const responsivityAtWl = (lambda_nm: number) => responsivityAt(params, lambda_nm);
  const dStar = (R: number, iNoise: number) => systemDStar(params, R, iNoise);
  const dStarDetector = (R: number, Id: number, rA: number, T: number) => detectorDStarAt(params, R, Id, rA, T);

  const spectralChart = (() => {
    const wlMax = Math.max(1.2 * cutoff_nm, wavelength_nm);
    const wl = Array.from({ length: 300 }, (_, i) => 200 + (i * (wlMax - 200)) / 299);
    const finite = (d: number) => (Number.isFinite(d) ? d : 0);
    return [
      { x: wl, y: wl.map(w => finite(dStarDetector(responsivityAtWl(w), darkCurrent, r0a, temperature))), type: "scatter", mode: "lines", name: "Detector D*", line: { color: "#60a5fa", width: 2 } },
      { x: wl, y: wl.map(w => finite(dStar(responsivityAtWl(w), totalNoise))), type: "scatter", mode: "lines", name: "System D* (incl. R_L)", line: { color: "#a78bfa", width: 2, dash: "dash" } },
    ];
  })();

  const tempChart = (() => {
    const temps = Array.from({ length: 151 }, (_, i) => 150 + i * 2);
    // Only the detector is swept: I_d scales with the chosen law and R₀A (the same junction current at zero bias) inversely;
    // the load stays at the entered temperature.
    const ratio = temps.map(T => darkCurrentRatio(T, temperature, bandGap_eV, darkLaw));
    const det = temps.map((T, i) => dStarDetector(responsivity, darkCurrent * ratio[i], r0a / ratio[i], T));
    const sys = ratio.map(r => dStar(responsivity, systemNoiseCurrent(params, darkCurrent * r, temperature)));
    const pos = (d: number) => (Number.isFinite(d) && d > 0 ? d : null);
    return [
      { x: temps, y: det.map(pos), type: "scatter", mode: "lines", name: "Detector D*", line: { color: "#f87171", width: 2 } },
      { x: temps, y: sys.map(pos), type: "scatter", mode: "lines", name: "System D* (incl. R_L)", line: { color: "#a78bfa", width: 2, dash: "dash" } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="10" />
        <ValidatedNumberInput label="Cutoff Wavelength λ_c (nm)" value={cutoffRaw} onChange={setCutoff} min={300} max={20000} step="10" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQe} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Dark Current (nA, unmultiplied)" value={darkCurrentRaw} onChange={setDarkCurrent} min={0} max={1e9} step="0.1" />
        <ValidatedNumberInput label="Area (mm²)" value={areaRaw} onChange={setArea} min={1e-4} max={1e4} step="0.1" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-6} max={1e5} step="0.1" />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={4} max={500} step="1" />
        <ValidatedNumberInput label="Detector R₀A (Ω·cm², zero-bias)" value={r0aRaw} onChange={setR0a} min={1e-6} max={1e15} step="any" />
        <ValidatedNumberInput label="Load R (Ω), system D* only" value={loadResistanceRaw} onChange={setLoadResistance} min={1} max={1e12} step="10" />
        <ValidatedNumberInput label="Avalanche Gain M" value={gainRaw} onChange={setGain} min={1} max={1e4} step="1" />
        <ValidatedNumberInput label="Excess Noise Factor F (1 for a PIN)" value={excessNoiseFactorRaw} onChange={setExcessNoiseFactor} min={1} max={1e4} step="0.1" />
        <label className="block text-sm text-gray-300">
          <span className="mb-1 block">Dark-current law vs T</span>
          <select value={darkLaw} onChange={e => setDarkLaw(e.target.value)} className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white">
            <option value="generation">Generation (∝ n_i)</option>
            <option value="diffusion">Diffusion (∝ n_i²)</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Responsivity (M = 1)" value={`${responsivity.toFixed(3)} A/W`} tone="blue" subtext={wavelength_nm > cutoff_nm ? "Beyond the cutoff: no response" : `E_g = ${bandGap_eV.toFixed(3)} eV from λ_c`} />
        <ResultCard label="Detector D*" value={`${fmt(detectorDStar)} cm·Hz^½/W`} tone="green" subtext={`J_d = ${fmt(jd)} A/cm²; ${shotVariance >= johnsonVariance ? "dark-current shot" : "R₀A Johnson"} noise dominates; area-independent`} />
        <ResultCard label="NEP (system)" value={`${fmt(nepSpectral)} W/√Hz`} tone="red" />
        <ResultCard label="Shot Noise (multiplied dark)" value={fmt(shotNoise) + " A"} tone="yellow" />
        <ResultCard label="Thermal Noise" value={fmt(thermalNoise) + " A"} tone="orange" />
        <ResultCard label="System D* (incl. load R_L)" value={`${fmt(detectivity)} cm·Hz^½/W`} tone="purple" subtext={thermalNoise > shotNoise ? "Load Johnson noise dominates: grows as √A at fixed I_d" : "Dark-current shot noise dominates"} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={spectralChart} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" } }} title="D* vs Wavelength (constant η up to λ_c)" />
        <ChartPanel data={tempChart} layout={{ xaxis: { title: "Detector temperature (K)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", type: "log", gridcolor: "#374151" } }} title="D* vs Detector Temperature (I_d by the chosen law, R₀A inversely; load at T)" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1">
        <p>Detector: D* = ℛ·M / √(2·q·J_d·M²·F + 4·k·T / R₀A),  J_d = I_d / A</p>
        <p>System: D* = √(A·Δf) / NEP,  NEP = i_n / (ℛ·M)</p>
        <p>ℛ = η·q·λ / (h·c) for λ ≤ λ_c = h·c/E_g, else 0</p>
        <p>i²_shot = 2·q·I_d·M²·F·Δf,  i²_thermal = 4·k·T·Δf / R_L</p>
        <p>I_d(T) ∝ n_i ∝ T^1.5·exp(−E_g/2kT) (generation) or ∝ n_i² (diffusion), scaled from the entered I_d at the entered T</p>
      </div>
    </>
  );
}
