"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CoherentRamanPage() {
  const [mode, setMode] = useState<"CARS" | "SRS">("CARS");
  const [pumpWl, setPumpWl] = useState(800); // nm
  const [wavenumber, setWavenumber] = useState(2850); // cm⁻¹ (CH stretch)
  const [pumpPower, setPumpPower] = useState(50); // mW
  const [stokesPower, setStokesPower] = useState(50); // mW
  const [pulseWidth, setPulseWidth] = useState(2); // ps
  const [repRate, setRepRate] = useState(80); // MHz
  const [na, setNa] = useState(1.0);

  const results = useMemo(() => {
    const deltaNu = wavenumber; // cm⁻¹
    const lambdaPump_m = pumpWl * 1e-9;
    const lambdaStokes_m = 1e-2 / (1e-2 / lambdaPump_m + deltaNu * 100); // convert cm⁻¹ to m⁻¹
    const stokesWl = lambdaStokes_m * 1e9;
    const freqDiff_THz = deltaNu * 2.998e10 / 1e12; // THz

    const pulseEnergyPump = (pumpPower * 1e-3) / (repRate * 1e6); // J
    const pulseEnergyStokes = (stokesPower * 1e-3) / (repRate * 1e6);
    const peakPowerPump = pulseEnergyPump / (pulseWidth * 1e-12); // W
    const peakPowerStokes = pulseEnergyStokes / (pulseWidth * 1e-12);

    const w0 = 0.61 * lambdaPump_m / na;
    const intensityPump = peakPowerPump / (Math.PI * w0 * w0);
    const intensityStokes = peakPowerStokes / (Math.PI * w0 * w0);

    // CARS: signal ∝ |χ_NR + χ_R/(Ω-ω+ iΓ)|² · I_pump² · I_stokes
    // SRS: signal ∝ Im[χ_R] · I_pump · I_stokes (linear in concentration)
    const carsSignal = intensityPump * intensityPump * intensityStokes * 1e-60; // arbitrary scaling
    const srsSignal = intensityPump * intensityStokes * 1e-30;

    return { stokesWl, freqDiff_THz, pulseEnergyPump, pulseEnergyStokes, peakPowerPump, peakPowerStokes, intensityPump, intensityStokes, carsSignal, srsSignal, w0 };
  }, [mode, pumpWl, wavenumber, pumpPower, stokesPower, pulseWidth, repRate, na]);

  const spectrumPlot = useMemo(() => {
    const wn = [];
    const cars = [];
    const srs = [];
    const center = wavenumber;
    for (let w = center - 500; w <= center + 500; w += 5) {
      wn.push(w);
      // Lorentzian Raman line
      const gamma = 15; // linewidth cm⁻¹
      const lorentz = gamma * gamma / ((w - center) ** 2 + gamma * gamma);
      // CARS: squared amplitude (interferes with non-resonant background)
      const chiNR = 0.3;
      const chiR = lorentz;
      cars.push(Math.abs(chiNR + chiR) ** 2);
      // SRS: purely imaginary part (dispersive)
      srs.push(lorentz);
    }
    return [
      { x: wn, y: cars.map(v => v / Math.max(...cars)), name: "CARS spectrum", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: wn, y: srs.map(v => v / Math.max(...srs)), name: "SRS spectrum", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, [wavenumber]);

  const powerPlot = useMemo(() => {
    const powers = [];
    const carsSig = [];
    const srsSig = [];
    for (let p = 1; p <= 100; p += 2) {
      powers.push(p);
      const I = p * 1e-3 / (repRate * 1e6 * pulseWidth * 1e-12) / (Math.PI * results.w0 ** 2);
      carsSig.push(I * I * I * 1e-60);
      srsSig.push(I * I * 1e-30);
    }
    const maxCars = Math.max(...carsSig);
    const maxSrs = Math.max(...srsSig);
    return [
      { x: powers, y: carsSig.map(v => v / maxCars), name: "CARS ∝ P³", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: powers, y: srsSig.map(v => v / maxSrs), name: "SRS ∝ P²", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, [repRate, pulseWidth, results.w0]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Coherent Raman (CARS/SRS) Calculator</h1>
      <p className="text-gray-400 mb-8">Coherent Anti-Stokes Raman Scattering and Stimulated Raman Scattering signal estimation.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as "CARS" | "SRS")} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="CARS">CARS (Coherent Anti-Stokes Raman)</option>
              <option value="SRS">SRS (Stimulated Raman Scattering)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pump wavelength (nm)</label>
            <input type="number" step={10} value={pumpWl} onChange={e => setPumpWl(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Raman shift (cm⁻¹)</label>
            <input type="number" step={10} value={wavenumber} onChange={e => setWavenumber(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pump power (mW)</label>
            <input type="number" step={5} value={pumpPower} onChange={e => setPumpPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stokes power (mW)</label>
            <input type="number" step={5} value={stokesPower} onChange={e => setStokesPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (ps)</label>
            <input type="number" step={0.5} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <input type="number" step={10} value={repRate} onChange={e => setRepRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stokes wavelength</span><span className="font-mono text-blue-400">{results.stokesWl.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Frequency difference</span><span className="font-mono">{results.freqDiff_THz.toFixed(1)} THz</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pump pulse energy</span><span className="font-mono">{(results.pulseEnergyPump * 1e9).toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak pump power</span><span className="font-mono text-red-400">{(results.peakPowerPump / 1e3).toFixed(1)} kW</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity (pump)</span><span className="font-mono text-yellow-400">{(results.intensityPump / 1e12).toFixed(1)} TW/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Active mode</span><span className="font-mono text-green-400">{mode}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>ν_Stokes = ν_Pump − ν_Raman</p>
            <p>CARS: P_CARS ∝ |χ_NR + χ_R|² · I²_pump · I_Stokes</p>
            <p>SRS: P_SRS ∝ Im(χ_R) · I_pump · I_Stokes</p>
            <p>CARS has non-resonant background; SRS is background-free</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">CARS vs SRS Spectral Shape</h2>
          <Plot data={spectrumPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Raman shift (cm⁻¹)", gridcolor: "#333" }, yaxis: { title: "Normalized signal", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Signal vs Power</h2>
          <Plot data={powerPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Power (mW)", gridcolor: "#333" }, yaxis: { title: "Normalized signal", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
      </div>
    </div>
  );
}
