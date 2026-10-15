"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { epsilon_0 } from "../../../physics/constants";
import { johnsonNoise, shotNoiseCurrent } from "../../../physics/detectors/noise";
import {
  childLangmuirCurrentDensity, planarTransitTime, thermionicCurrentDensity, thresholdWavelength, vacuumTransitBandwidth,
} from "../../../physics/detectors/photoemission";
import { combinedBandwidth, rcBandwidth } from "../../../physics/detectors/photodiode-rc";
import { responsivity } from "../../../physics/detectors/responsivity";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

// Defaults: a UV vacuum photodiode with a 100 mm² cathode 2 mm from a planar anode, read across a 50 Ω load.
const T_LOAD = 298.15; // K: the load stays at room temperature whatever the cathode does
export default function VacuumPhotodiodePage() {
  const [qeRaw, setQuantumEff] = useURLState("quantumEff", 0.25);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 300); // nm
  const [powerRaw, setIncidentPower] = useURLState("incidentPower", 1e-6); // W
  const [phiRaw, setWorkFunction] = useURLState("workFunction", 2.0); // eV
  const [voltageRaw, setAnodeVoltage] = useURLState("anodeVoltage", 100); // V
  const [gapRaw, setGap] = useURLState("gap", 2); // mm
  const [areaRaw, setCathodeArea] = useURLState("cathodeArea", 100); // mm²
  const [loadRaw, setLoadResistance] = useURLState("loadResistance", 50); // Ω
  const [tempRaw, setTemperature] = useURLState("temperature", 25); // °C

  const qe = clamp(qeRaw, 0, 1, 0.25);
  const wavelength_nm = clamp(wavelengthRaw, 100, 2000, 300);
  const power = clamp(powerRaw, 0, 1, 1e-6);
  const phi = clamp(phiRaw, 0.5, 6, 2.0);
  const voltage = clamp(voltageRaw, 1, 1e4, 100);
  const gap_mm = clamp(gapRaw, 0.1, 50, 2);
  const area_mm2 = clamp(areaRaw, 0.1, 1e4, 100);
  const load = clamp(loadRaw, 1, 1e9, 50);
  const T = clamp(tempRaw, -200, 300, 25) + 273.15;

  const gap = gap_mm * 1e-3;
  const area = area_mm2 * 1e-6;
  const cutoff_nm = thresholdWavelength(phi) * 1e9;
  const resp = wavelength_nm <= cutoff_nm ? responsivity(qe, wavelength_nm * 1e-9) : 0;
  const iPhoto = power * resp;
  const iDark = thermionicCurrentDensity(T, phi) * area;
  const transit = planarTransitTime(gap, voltage);
  const fTransit = vacuumTransitBandwidth(transit);
  const capacitance = (epsilon_0 * area) / gap;
  const fRC = rcBandwidth(load, capacitance);
  const bandwidth = combinedBandwidth(fRC, fTransit);
  const iShot = shotNoiseCurrent(iPhoto + iDark, bandwidth);
  const iJohnson = johnsonNoise(load, T_LOAD, bandwidth).i;
  const iNoise = Math.hypot(iShot, iJohnson);
  const snrDb = 20 * Math.log10(iPhoto / iNoise);
  const iChild = childLangmuirCurrentDensity(voltage, gap) * area;
  const overChild = iPhoto + iDark > iChild;

  const powers = Array.from({ length: 121 }, (_, i) => 10 ** (-12 + i / 10)); // 1 pW to 1 W
  const noiseChart = [
    { x: powers, y: powers.map((p) => p * resp), type: "scatter" as const, mode: "lines" as const, name: "Photocurrent", line: { color: "#60a5fa" } },
    { x: powers, y: powers.map((p) => shotNoiseCurrent(p * resp + iDark, bandwidth)), type: "scatter" as const, mode: "lines" as const, name: "Shot noise", line: { color: "#34d399" } },
    { x: [powers[0], powers[powers.length - 1]], y: [iJohnson, iJohnson], type: "scatter" as const, mode: "lines" as const, name: "Johnson noise of the load", line: { color: "#f87171", dash: "dash" } },
    { x: [powers[0], powers[powers.length - 1]], y: [iChild, iChild], type: "scatter" as const, mode: "lines" as const, name: "Child's law limit", line: { color: "#fbbf24", dash: "dot" } },
  ];
  const volts = Array.from({ length: 121 }, (_, i) => 10 ** (1 + i / 40)); // 10 V to 10 kV
  const bwChart = [
    { x: volts, y: volts.map((v) => vacuumTransitBandwidth(planarTransitTime(gap, v)) / 1e9), type: "scatter" as const, mode: "lines" as const, name: "Transit limit", line: { color: "#60a5fa" } },
    { x: [volts[0], volts[volts.length - 1]], y: [fRC / 1e9, fRC / 1e9], type: "scatter" as const, mode: "lines" as const, name: "RC limit", line: { color: "#f87171", dash: "dash" } },
    { x: volts, y: volts.map((v) => combinedBandwidth(fRC, vacuumTransitBandwidth(planarTransitTime(gap, v))) / 1e9), type: "scatter" as const, mode: "lines" as const, name: "Combined", line: { color: "#34d399" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={2000} step="10" />
        <ValidatedNumberInput label="Incident Power (W)" value={powerRaw} onChange={setIncidentPower} min={0} max={1} />
        <ValidatedNumberInput label="Work Function / Threshold (eV)" value={phiRaw} onChange={setWorkFunction} min={0.5} max={6} step="0.1" />
        <ValidatedNumberInput label="Anode Voltage (V)" value={voltageRaw} onChange={setAnodeVoltage} min={1} max={1e4} step="10" />
        <ValidatedNumberInput label="Cathode–Anode Gap (mm)" value={gapRaw} onChange={setGap} min={0.1} max={50} step="0.1" />
        <ValidatedNumberInput label="Cathode Area (mm²)" value={areaRaw} onChange={setCathodeArea} min={0.1} max={1e4} />
        <ValidatedNumberInput label="Load Resistance (Ω)" value={loadRaw} onChange={setLoadResistance} min={1} max={1e9} />
        <ValidatedNumberInput label="Cathode Temperature (°C)" value={tempRaw} onChange={setTemperature} min={-200} max={300} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Responsivity" value={`${fix(resp * 1e3, 3)} mA/W`} tone="blue" subtext={`Threshold ${fix(cutoff_nm, 0)} nm (hc/φ)`} />
        <ResultCard label="Photocurrent" value={`${fmt(iPhoto)} A`} tone={overChild ? "orange" : "green"} subtext={`${fmt(iPhoto * load)} V across the load`} />
        <ResultCard label="Thermionic Dark Current" value={`${fmt(iDark)} A`} tone="gray" subtext="Richardson–Dushman, A₀ = 1.20×10⁶ A/(m²·K²)" />
        <ResultCard label="Space-Charge Limit" value={`${fmt(iChild)} A`} tone={overChild ? "orange" : "yellow"} subtext={overChild ? "Photo + dark current exceed Child's law" : "Child's law; nonlinearity starts well below it"} />
        <ResultCard label="Transit Time" value={`${fix(transit * 1e12, 1)} ps`} tone="cyan" subtext={`Transit limit ${fix(fTransit / 1e9, 3)} GHz (0.553/τ)`} />
        <ResultCard label="Capacitance" value={`${fix(capacitance * 1e12, 3)} pF`} tone="cyan" subtext={`RC limit ${fix(fRC / 1e9, 3)} GHz`} />
        <ResultCard label="Bandwidth" value={`${fix(bandwidth / 1e9, 3)} GHz`} tone="purple" subtext="1/√(1/f_RC² + 1/f_tr²), used as the noise bandwidth" />
        <ResultCard label="SNR" value={`${fix(snrDb, 1)} dB`} tone={snrDb < 0 ? "red" : "green"}
          subtext={`20·log₁₀(I/σ) in B; shot ${fmt(iShot)} A, Johnson (load at 25 °C) ${fmt(iJohnson)} A rms`} />
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ/(h·c) for λ ≤ hc/φ; I<sub>ph</sub> = P·R</p>
        <p>J<sub>th</sub> = A₀·T²·exp(−φ/k<sub>B</sub>T), A₀ = 4π·m<sub>e</sub>·k<sub>B</sub>²·q/h³</p>
        <p>τ = d·√(2m<sub>e</sub>/(qV)); f<sub>tr</sub> = 0.553/τ; f<sub>RC</sub> = 1/(2π·R<sub>L</sub>·ε₀A/d)</p>
        <p>σ<sub>I</sub>² = 2q(I<sub>ph</sub> + I<sub>th</sub>)B + 4k<sub>B</sub>T<sub>L</sub>·B/R<sub>L</sub></p>
        <p>I<sub>max</sub> = (4ε₀/9)·√(2q/m<sub>e</sub>)·V<sup>3/2</sup>·A/d² (Child)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={noiseChart} layout={{
          xaxis: { title: "Incident Power (W)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
        }} title="Signal and Noise vs Power" />
        <ChartPanel data={bwChart} layout={{
          xaxis: { title: "Anode Voltage (V)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "Bandwidth (GHz)", type: "log", gridcolor: "#374151" },
        }} title="Bandwidth vs Voltage" />
      </div>
    </>
  );
}
