"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PhotoacousticPage() {
  const [laserWavelength, setLaserWavelength] = useState(750); // nm
  const [pulseEnergy, setPulseEnergy] = useState(10); // mJ
  const [pulseWidth, setPulseWidth] = useState(5); // ns
  const [fluence, setFluence] = useState(20); // mJ/cm²
  const [repetitionRate, setRepetitionRate] = useState(20); // Hz
  const [absorptionCoeff, setAbsorptionCoeff] = useState(5); // cm⁻¹ (µa)
  const [scatteringCoeff, setScatteringCoeff] = useState(100); // cm⁻¹ (µs')
  const [gruneisen, setGruneisen] = useState(0.8); // Grüneisen parameter
  const [detectorFreq, setDetectorFreq] = useState(5); // MHz

  const results = useMemo(() => {
    const reducedScattering = scatteringCoeff * (1 - 0.1); // ~g=0.9
    const mfp = 1 / (absorptionCoeff + scatteringCoeff); // cm
    const transportMfp = 1 / (absorptionCoeff + reducedScattering); // cm
    // Effective attenuation for diffuse light: µ_eff = √(3µa(µa + µs'))
    const muEff = Math.sqrt(3 * absorptionCoeff * (absorptionCoeff + reducedScattering)); // cm⁻¹
    const penetrationDepth = 1 / muEff; // cm
    const penetrationDepth_mm = penetrationDepth * 10; // mm
    // Photoacoustic pressure: p₀ = Γ · µa · F (initial pressure)
    const F = fluence * 1e-3 * 1e4; // J/m² (mJ/cm² to J/m²)
    const p0 = gruneisen * absorptionCoeff * 100 * F; // Pa (µa in m⁻¹)
    // Maximum imaging depth (acoustic): limited by frequency-dependent attenuation
    const acousticAttenuation = 0.5 * detectorFreq; // dB/cm (approx tissue, ~0.5 dB/cm/MHz)
    const acousticPenetration = 20 / acousticAttenuation; // cm (at -20 dB)
    const acousticPenetration_mm = acousticPenetration * 10;
    // Imaging depth = min of optical and acoustic
    const imagingDepth = Math.min(penetrationDepth_mm, acousticPenetration_mm);
    // Axial resolution = c / (2 · BW), BW ≈ 0.5 · f_center
    const axialRes = 1540 / (2 * detectorFreq * 1e6) * 1e6; // µm
    // Lateral resolution ~ beam width / NA_acoustic ≈ λ_acoustic
    const lateralRes = 1540 / (detectorFreq * 1e6) * 1e6; // µm
    return { mfp, transportMfp, muEff, penetrationDepth_mm, p0, acousticPenetration_mm, imagingDepth, axialRes, lateralRes, acousticAttenuation };
  }, [laserWavelength, pulseEnergy, pulseWidth, fluence, repetitionRate, absorptionCoeff, scatteringCoeff, gruneisen, detectorFreq]);

  const depthPlot = useMemo(() => {
    const muaRange = [];
    const opticalDepth = [];
    const acousticDepth = [];
    for (let mua = 0.1; mua <= 30; mua += 0.2) {
      muaRange.push(mua);
      const muEff = Math.sqrt(3 * mua * (mua + scatteringCoeff * 0.9));
      opticalDepth.push(10 / muEff); // mm
      const acAtt = 0.5 * detectorFreq;
      acousticDepth.push(20 / acAtt * 10); // mm
    }
    return [
      { x: muaRange, y: opticalDepth, name: "Optical penetration", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: muaRange, y: acousticDepth, name: "Acoustic penetration", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [scatteringCoeff, detectorFreq]);

  const resPlot = useMemo(() => {
    const freqs = [];
    const axial = [];
    const lateral = [];
    for (let f = 1; f <= 50; f += 1) {
      freqs.push(f);
      axial.push(1540 / (2 * f * 1e6) * 1e6); // µm
      lateral.push(1540 / (f * 1e6) * 1e6); // µm
    }
    return [
      { x: freqs, y: axial, name: "Axial resolution", line: { color: "#4ade80" }, type: "scatter", mode: "lines" },
      { x: freqs, y: lateral, name: "Lateral resolution", line: { color: "#c084fc" }, type: "scatter", mode: "lines" },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Photoacoustic Imaging Calculator</h1>
      <p className="text-gray-400 mb-8">Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Laser wavelength (nm)</label>
            <input type="number" step={10} value={laserWavelength} onChange={e => setLaserWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse energy (mJ)</label>
            <input type="number" step={1} value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (ns)</label>
            <input type="number" step={1} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fluence (mJ/cm²)</label>
            <input type="number" step={1} value={fluence} onChange={e => setFluence(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Repetition rate (Hz)</label>
            <input type="number" step={5} value={repetitionRate} onChange={e => setRepetitionRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Absorption coeff µ_a (cm⁻¹)</label>
            <input type="number" step={0.5} value={absorptionCoeff} onChange={e => setAbsorptionCoeff(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scattering coeff µ_s (cm⁻¹)</label>
            <input type="number" step={10} value={scatteringCoeff} onChange={e => setScatteringCoeff(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Grüneisen parameter Γ</label>
            <input type="number" step={0.05} value={gruneisen} onChange={e => setGruneisen(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Detector center freq (MHz)</label>
            <input type="number" step={1} value={detectorFreq} onChange={e => setDetectorFreq(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Mean free path</span><span className="font-mono">{(results.mfp * 10).toFixed(3)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Transport MFP</span><span className="font-mono">{(results.transportMfp * 10).toFixed(3)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">µ_eff</span><span className="font-mono text-blue-400">{results.muEff.toFixed(2)} cm⁻¹</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Optical penetration</span><span className="font-mono text-green-400">{results.penetrationDepth_mm.toFixed(2)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Acoustic penetration (−20 dB)</span><span className="font-mono text-yellow-400">{results.acousticPenetration_mm.toFixed(1)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective imaging depth</span><span className="font-mono text-purple-400">{results.imagingDepth.toFixed(2)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Initial pressure p₀</span><span className="font-mono text-red-400">{(results.p0 / 1e3).toFixed(1)} kPa</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono">{results.axialRes.toFixed(0)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono">{results.lateralRes.toFixed(0)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>µ_eff = √(3µa(µa + µs'))</p>
            <p>p₀ = Γ · µa · F</p>
            <p>Axial res = c / (2·BW), Lateral ≈ λ_acoustic</p>
            <p>ANSI limit: 20 mJ/cm² at 750 nm (skin)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Penetration Depth vs Absorption</h2>
          <Plot data={depthPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "µ_a (cm⁻¹)", gridcolor: "#333" }, yaxis: { title: "Penetration (mm)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Resolution vs Frequency</h2>
          <Plot data={resPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Frequency (MHz)", gridcolor: "#333" }, yaxis: { title: "Resolution (µm)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
      </div>
    </div>
  );
}
