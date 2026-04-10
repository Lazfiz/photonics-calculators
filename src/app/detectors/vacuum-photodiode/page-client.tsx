"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function VacuumPhotodiodePage() {
  const [quantumEff, setQuantumEff] = useURLState("quantumEff", 0.25);
  const [anodeVoltage, setAnodeVoltage] = useURLState("anodeVoltage", 100); // V
  const [cathodeArea, setCathodeArea] = useURLState("cathodeArea", 100); // mm²
  const [wavelength, setWavelength] = useURLState("wavelength", 300); // nm (UV)
  const [incidentPower, setIncidentPower] = useURLState("incidentPower", 1e-6); // W
  const [loadResistance, setLoadResistance] = useURLState("loadResistance", 50); // Ω
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C
  const [workFunction, setWorkFunction] = useURLState("workFunction", 2.0); // eV

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c);
    const iPhoto = incidentPower * resp;
    const vOut = iPhoto * loadResistance;
    // Richardson-Dushman: J = A_RD * T² * exp(-eφ / kT), A_RD = 1.2e6 A/m²/K²
    const T = 273.15 + temperature;
    const eOverkB = 11600; // K/eV
    const thermionicCurrent = 1.2e6 * cathodeArea * 1e-6 * T * T * Math.exp(-eOverkB * workFunction / T);
    const darkCurrent = Math.max(thermionicCurrent, 1e-15);
    // Transit time: d ≈ 0.1*√(area), v_drift ≈ √(2*e*V/m)
    const cathodeAnodeGap = 0.1 * Math.sqrt(cathodeArea * 1e-6); // m
    const driftVelocity = Math.sqrt(2 * q * anodeVoltage / (9.109e-31)); // m/s
    const transitTime = (cathodeAnodeGap / driftVelocity) * 1e12; // ps
    const bandwidth = 0.35 / (transitTime * 1e-12); // Hz
    // Shot-noise limited SNR: SNR = I_photo / √(2q(I_photo + I_dark)·BW)
    const shotNoiseCurrent = Math.sqrt(2 * q * (iPhoto + darkCurrent) * bandwidth);
    const snr = shotNoiseCurrent > 0 ? iPhoto / shotNoiseCurrent : 0;
    return { resp, iPhoto, vOut, darkCurrent, transitTime, bandwidth, snr };
  }, [quantumEff, anodeVoltage, cathodeArea, wavelength, incidentPower, loadResistance, temperature]);

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 150 + i * 2.5);
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    // Simple QE model: rises at cutoff, peaks mid-band
    const cutoff = 1240 / workFunction; // nm, from work function
    const qe = wavelengths.map(l => {
      if (l > cutoff) return 0;
      const uvPeak = 0.25 * Math.exp(-0.5 * ((l - 300) / 200) ** 2);
      const visResp = 0.15 * Math.exp(-0.5 * ((l - 450) / 150) ** 2);
      return Math.min(quantumEff / 0.25, uvPeak + visResp);
    });
    const resp = wavelengths.map((l, i) => (qe[i] * q * l * 1e-9) / (h * c));
    return [
      { x: wavelengths, y: qe, type: "scatter", mode: "lines", name: "QE", line: { color: "#60a5fa" } },
      { x: wavelengths, y: resp.map(r => r * 1e3), type: "scatter", mode: "lines", name: "Responsivity (mA/W)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [quantumEff, workFunction]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Vacuum Photodiode" description="Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Anode Voltage (V)" value={anodeVoltage} onChange={setAnodeVoltage} />
        <ValidatedNumberInput label="Cathode Area (mm²)" value={cathodeArea} onChange={setCathodeArea} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Incident Power (W)" value={incidentPower} onChange={setIncidentPower} step="1e-9" />
        <ValidatedNumberInput label="Load Resistance (Ω)" value={loadResistance} onChange={setLoadResistance} />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} />
        <ValidatedNumberInput label="Work Function (eV)" value={workFunction} onChange={setWorkFunction} step="0.1" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1">
        <p className="text-gray-300">Responsivity = <span className="text-blue-400 font-mono">{(results.resp * 1e3).toFixed(3)} mA/W</span></p>
        <p className="text-gray-300">Photocurrent = <span className="text-blue-400 font-mono">{(results.iPhoto * 1e6).toFixed(3)} µA</span></p>
        <p className="text-gray-300">Voltage across load = <span className="text-blue-400 font-mono">{(results.vOut * 1e3).toFixed(3)} mV</span></p>
        <p className="text-gray-300">Dark current ≈ <span className="text-blue-400 font-mono">{results.darkCurrent.toExponential(2)} A</span></p>
        <p className="text-gray-300">Transit time ≈ <span className="text-blue-400 font-mono">{results.transitTime.toFixed(1)} ps</span></p>
        <p className="text-gray-300">Est. bandwidth ≈ <span className="text-blue-400 font-mono">{(results.bandwidth / 1e9).toFixed(1)} GHz</span></p>
        <p className="text-gray-300">SNR (shot-noise limited) ≈ <span className="text-blue-400 font-mono">{(20 * Math.log10(results.snr)).toFixed(1)} dB</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ / (h·c)</p>
        <p>I<sub>photo</sub> = P · R</p>
        <p>J<sub>th</sub> = A<sub>RD</sub>·T² · exp(-eφ / k<sub>B</sub>T)  [Richardson-Dushman]</p>
        <p>τ<sub>transit</sub> ≈ d / v<sub>drift</sub></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Quantum Efficiency", gridcolor: "#374151", range: [0, 0.4] },
        yaxis2: { title: "Responsivity (mA/W)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 80 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
