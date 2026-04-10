"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LinearModeAPDPage() {
  const [gain, setGain] = useURLState("gain", 100);
  const [excessNoiseFactor, setExcessNoiseFactor] = useURLState("excessNoiseFactor", 2.5);
  const [quantumEff, setQuantumEff] = useURLState("quantumEff", 0.8);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100e6); // Hz
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 10e-9); // A (unmultiplied)
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [incidentPower, setIncidentPower] = useURLState("incidentPower", 1e-9); // W

  const results = useMemo(() => {
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c); // A/W
    const iPhoto = incidentPower * resp;
    const iPhotoOut = iPhoto * gain;
    const iDarkOut = darkCurrent * gain;
    const shotNoise = Math.sqrt(2 * q * iPhoto * gain * gain * excessNoiseFactor * bandwidth);
    const darkNoise = Math.sqrt(2 * q * darkCurrent * gain * gain * excessNoiseFactor * bandwidth);
    const totalNoise = Math.sqrt(shotNoise ** 2 + darkNoise ** 2);
    const snr = iPhotoOut / totalNoise;
    const nep = totalNoise / (resp * gain); // W (total, bandwidth-dependent)
    const nepSpectral = nep / Math.sqrt(bandwidth); // W/√Hz
    return { resp, iPhoto, iPhotoOut, iDarkOut, shotNoise, darkNoise, totalNoise, snr, nep, nepSpectral };
  }, [gain, excessNoiseFactor, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower]);

  const chartData = useMemo(() => {
    const gains = Array.from({ length: 100 }, (_, i) => 1 + i * 2);
    const h = 6.626e-34;
    const c = 3e8;
    const q = 1.6e-19;
    const resp = (quantumEff * q * wavelength * 1e-9) / (h * c);
    const iPhoto = incidentPower * resp;
    const signal = gains.map(g => iPhoto * g);
    const noise = gains.map(g => Math.sqrt(2 * q * iPhoto * g * g * excessNoiseFactor * bandwidth + 2 * q * darkCurrent * g * g * excessNoiseFactor * bandwidth));
    const snr = signal.map((s, i) => s / noise[i]);
    return [
      { x: gains, y: signal, type: "scatter", mode: "lines", name: "Signal (A)", line: { color: "#60a5fa" } },
      { x: gains, y: noise, type: "scatter", mode: "lines", name: "Noise (A)", line: { color: "#f87171" } },
      { x: gains, y: snr, type: "scatter", mode: "lines", name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [excessNoiseFactor, quantumEff, bandwidth, darkCurrent, wavelength, incidentPower]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Gain (M)" value={gain} onChange={setGain} />
        <ValidatedNumberInput label="Excess Noise Factor (F)" value={excessNoiseFactor} onChange={setExcessNoiseFactor} step="0.1" />
        <ValidatedNumberInput label="Quantum Efficiency" value={quantumEff} onChange={setQuantumEff} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Bandwidth (Hz)" value={bandwidth} onChange={setBandwidth} step="1e6" />
        <ValidatedNumberInput label="Dark Current - unmultiplied (A)" value={darkCurrent} onChange={setDarkCurrent} step="1e-9" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Incident Power (W)" value={incidentPower} onChange={setIncidentPower} step="1e-12" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Responsivity = <span className="text-blue-400 font-mono">{(results.resp * 1e3).toFixed(2)} mA/W (unmultiplied)</span></p>
        <p className="text-gray-300">Output photocurrent = <span className="text-blue-400 font-mono">{results.iPhotoOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Output dark current = <span className="text-blue-400 font-mono">{results.iDarkOut.toExponential(3)} A</span></p>
        <p className="text-gray-300">Shot noise = <span className="text-blue-400 font-mono">{results.shotNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">Total noise = <span className="text-blue-400 font-mono">{results.totalNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">SNR = <span className="text-blue-400 font-mono">{results.snr.toFixed(1)}</span></p>
        <p className="text-gray-300">NEP = <span className="text-blue-400 font-mono">{results.nep.toExponential(3)} W</span> (total)</p>
        <p className="text-gray-300">NEP = <span className="text-blue-400 font-mono">{results.nepSpectral.toExponential(3)} W/√Hz</span> (spectral)</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = η·q·λ / (h·c)</p>
        <p>I<sub>out</sub> = M · I<sub>photo</sub></p>
        <p>i<sub>shot</sub> = √(2·q·M²·I·F·Δf)</p>
        <p>NEP = i<sub>total</sub> / (M·R)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Gain (M)", gridcolor: "#374151" },
        yaxis: { title: "Current (A)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
