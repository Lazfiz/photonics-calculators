"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import { darkCurrentRatio, type DarkCurrentMechanism } from "../../../physics/detectors/dark-current";
import { johnsonNoise, noiseEquivalentPower, responsivity as responsivityOf, shotNoiseCurrent, specificDetectivity } from "../../../physics/detectors/noise";

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
  const gain = clamp(gainRaw, 1, 1e4, 1);
  const excessNoiseFactor = clamp(excessNoiseFactorRaw, 1, 1e4, 1);
  const bandGap_eV = hc_eV_nm / cutoff_nm;

  // ℛ = η·q·λ/(h·c) below the cutoff λ_c = h·c/E_g, zero above it (η held constant up to λ_c).
  const responsivityAt = (lambda_nm: number) => (lambda_nm <= cutoff_nm ? responsivityOf(qe, lambda_nm * 1e-9) : 0);
  // Multiplied dark-current shot noise 2q·I_d·M²·F·B and load Johnson noise 4kTB/R_L; the signal current is ℛ·M·P.
  const noiseCurrent = (Id: number, T: number) =>
    Math.hypot(shotNoiseCurrent(Id, bandwidth) * gain * Math.sqrt(excessNoiseFactor), johnsonNoise(loadResistance, T, bandwidth).i);
  const dStar = (R: number, iNoise: number) => (R > 0 ? specificDetectivity(area_cm2, bandwidth, noiseEquivalentPower(iNoise, R, gain)) : NaN);

  const responsivity = responsivityAt(wavelength_nm);
  const shotNoise = shotNoiseCurrent(darkCurrent, bandwidth) * gain * Math.sqrt(excessNoiseFactor);
  const thermalNoise = johnsonNoise(loadResistance, temperature, bandwidth).i;
  const totalNoise = noiseCurrent(darkCurrent, temperature);
  const nepSpectral = responsivity > 0 ? noiseEquivalentPower(totalNoise, responsivity, gain) / Math.sqrt(bandwidth) : NaN; // W/√Hz
  const detectivity = dStar(responsivity, totalNoise);

  const spectralChart = (() => {
    const wlMax = Math.max(1.2 * cutoff_nm, wavelength_nm);
    const wl = Array.from({ length: 300 }, (_, i) => 200 + (i * (wlMax - 200)) / 299);
    return [{ x: wl, y: wl.map(w => { const d = dStar(responsivityAt(w), totalNoise); return Number.isFinite(d) ? d : 0; }), type: "scatter", mode: "lines", name: "D*", line: { color: "#60a5fa", width: 2 } }];
  })();

  const tempChart = (() => {
    const temps = Array.from({ length: 151 }, (_, i) => 150 + i * 2);
    const y = temps.map(T => dStar(responsivity, noiseCurrent(darkCurrent * darkCurrentRatio(T, temperature, bandGap_eV, darkLaw), T)));
    return [{ x: temps, y: y.map(d => (Number.isFinite(d) ? d : null)), type: "scatter", mode: "lines", name: "D*", line: { color: "#f87171", width: 2 } }];
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
        <ValidatedNumberInput label="Load R (Ω)" value={loadResistanceRaw} onChange={setLoadResistance} min={1} max={1e12} step="10" />
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
        <ResultCard label="NEP" value={`${fmt(nepSpectral)} W/√Hz`} tone="red" />
        <ResultCard label="Shot Noise (multiplied dark)" value={fmt(shotNoise) + " A"} tone="yellow" />
        <ResultCard label="Thermal Noise" value={fmt(thermalNoise) + " A"} tone="orange" />
        <ResultCard label="Detectivity D*" value={`${fmt(detectivity)} cm·Hz^½/W`} tone="green" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={spectralChart} layout={{ xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", gridcolor: "#374151" } }} title="D* vs Wavelength (constant η up to λ_c)" />
        <ChartPanel data={tempChart} layout={{ xaxis: { title: "Temperature (K)", gridcolor: "#374151" }, yaxis: { title: "D* (cm·Hz^½/W)", type: "log", gridcolor: "#374151" } }} title="D* vs Temperature" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1">
        <p>D* = √(A·Δf) / NEP,  NEP = i_n / (ℛ·M)</p>
        <p>ℛ = η·q·λ / (h·c) for λ ≤ λ_c = h·c/E_g, else 0</p>
        <p>i²_shot = 2·q·I_d·M²·F·Δf,  i²_thermal = 4·k·T·Δf / R_L</p>
        <p>I_d(T) ∝ n_i ∝ T^1.5·exp(−E_g/2kT) (generation) or ∝ n_i² (diffusion), scaled from the entered I_d at the entered T</p>
      </div>
    </>
  );
}
