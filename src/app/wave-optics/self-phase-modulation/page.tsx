"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SelfPhaseModulationPage() {
  const [wavelength, setWavelength] = useState(800); // nm
  const [pulseEnergy, setPulseEnergy] = useState(1); // nJ
  const [pulseDuration, setPulseDuration] = useState(100); // fs (FWHM → 1/e intensity half-width)
  const [beamWaist, setBeamWaist] = useState(50); // µm
  const [n2, setN2] = useState(3.2); // ×10⁻¹⁶ cm²/W
  const [mediumLength, setMediumLength] = useState(2); // mm
  const [n0, setN0] = useState(1.76); // Ti:Sapphire crystal
  const [pulseShape, setPulseShape] = useState<"gaussian" | "sech">("gaussian");

  const tau = pulseDuration * 1e-15 / (2 * Math.sqrt(Math.LN2)); // 1/e half-width for Gaussian FWHM
  const w0 = beamWaist * 1e-6;
  const area = Math.PI * w0 ** 2;
  const k = 2 * Math.PI * n0 / (wavelength * 1e-9);
  const peakPower = pulseEnergy * 1e-9 / (pulseDuration * 1e-15 * Math.sqrt(Math.PI / (4 * Math.LN2))); // Gaussian
  const peakIntensity = peakPower / area;

  // Maximum nonlinear phase shift
  const L = mediumLength * 1e-3;
  const phiMax = k * n2 * 1e-20 * peakIntensity * L;

  // Spectral broadening factor
  const broadening = Math.sqrt(1 + (4 * Math.LN2 / Math.PI) * phiMax ** 2);

  // B-integral
  const Bintegral = phiMax;

  // Time-dependent phase and chirp
  const timeData = useMemo(() => {
    const t = Array.from({ length: 300 }, (_, i) => (i - 150) * 3 * pulseDuration * 1e-15 / 150);
    const envelope = t.map(ti => {
      if (pulseShape === "gaussian") return Math.exp(-(ti ** 2) / (2 * tau ** 2));
      return 1 / Math.cosh(ti / tau);
    });
    const phase = t.map(ti => {
      if (pulseShape === "gaussian") return phiMax * Math.exp(-(ti ** 2) / (2 * tau ** 2));
      return phiMax * (1 / Math.cosh(ti / tau)) ** 2;
    });
    const chirp = t.map((ti, i) => {
      if (i === 0 || i === t.length - 1) return 0;
      return -(phase[i + 1] - phase[i - 1]) / (t[2] - t[0]); // dφ/dt in rad/s
    });
    return [
      { x: t.map(v => v * 1e15), y: envelope, type: "scatter", mode: "lines", name: "Envelope", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: t.map(v => v * 1e15), y: phase.map(p => p / Math.PI), type: "scatter", mode: "lines", name: "φ_NL(t)/π", line: { color: "#f472b6", width: 2 }, yaxis: "y" },
      { x: t.map(v => v * 1e15), y: chirp.map(c => c / 1e15), type: "scatter", mode: "lines", name: "Chirp (rad/fs)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [wavelength, pulseEnergy, pulseDuration, beamWaist, n2, mediumLength, n0, pulseShape]);

  // Spectrum (approximate SPM-broadened spectrum)
  const spectrumData = useMemo(() => {
    const omega = Array.from({ length: 400 }, (_, i) => -50 + i * 100 / 400);
    const omega0 = 0;
    const sigma = 2 * Math.LN2 / (pulseDuration * 1e-15); // transform-limited width
    const spec = omega.map(w => {
      // SPM creates oscillatory structure; approximate with broadened Gaussian
      const broadenedSigma = sigma * broadening;
      const base = Math.exp(-((w * 1e15) ** 2) / (2 * broadenedSigma ** 2));
      // Add SPM modulation
      const modulation = phiMax > 0.5 ? 0.7 + 0.3 * Math.cos(phiMax * Math.exp(-((w * 1e15) ** 2) / (2 * sigma ** 2))) : 1;
      return 10 * Math.log10(base * modulation + 1e-10);
    });
    return [
      { x: omega, y: spec, type: "scatter", mode: "lines", name: "SPM Spectrum", fill: "tozeroy", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [wavelength, pulseEnergy, pulseDuration, beamWaist, n2, mediumLength, n0, phiMax, broadening, pulseShape]);

  const timeLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Time (fs)", gridcolor: "#374151" },
    yaxis: { title: "Amplitude / φ/π", gridcolor: "#374151", side: "left" },
    yaxis2: { title: "Chirp (rad/fs)", gridcolor: "#374151", side: "right", overlaying: "y" },
    margin: { t: 30, r: 70, b: 50, l: 70 },
    legend: { x: 0.02, y: 0.98 },
  };

  const spectrumLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Δω (THz)", gridcolor: "#374151" },
    yaxis: { title: "Spectral power (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // Peak frequency shift
  const maxChirp = phiMax / tau; // rad/s at peak
  const maxShiftHz = maxChirp / (2 * Math.PI);
  const maxShiftNm = maxShiftHz * (wavelength * 1e-9) ** 2 / 3e8 * 1e9;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Self-Phase Modulation (SPM)</h1>
      <p className="text-gray-400 mb-8">Intensity-dependent phase shift and spectral broadening from the optical Kerr effect.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">φ<sub>NL</sub>(t)</span> = −n₂ I(t) k L = −(n₂ ω/c) I(t) L</p>
        <p><span className="text-blue-400">Δω(t)</span> = −∂φ<sub>NL</sub>/∂t — instantaneous frequency shift</p>
        <p><span className="text-blue-400">B</span> = (2π/λ) n₂ I<sub>peak</sub> L — B-integral</p>
        <p><span className="text-blue-400">Broadening:</span> Δω<sub>SPM</sub> / Δω<sub>TL</sub> ≈ √(1 + (4 ln2/π) φ<sub>max</sub>²)</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setPulseShape("gaussian")} className={`px-4 py-2 rounded ${pulseShape === "gaussian" ? "bg-blue-600" : "bg-gray-800"}`}>Gaussian</button>
        <button onClick={() => setPulseShape("sech")} className={`px-4 py-2 rounded ${pulseShape === "sech" ? "bg-blue-600" : "bg-gray-800"}`}>Sech²</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pulse Energy (nJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} step="any" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pulse Duration FWHM (fs)</span>
          <input type="number" value={pulseDuration} onChange={e => setPulseDuration(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Beam Waist (µm)</span>
          <input type="number" value={beamWaist} onChange={e => setBeamWaist(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n₂ (×10⁻¹⁶ cm²/W)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Medium Length (mm)</span>
          <input type="number" value={mediumLength} onChange={e => setMediumLength(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-xl font-bold text-blue-400">{peakPower.toExponential(2)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Intensity</p>
          <p className="text-xl font-bold text-green-400">{(peakIntensity / 1e16).toFixed(2)} ×10¹⁶ W/m²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">φ<sub>max</sub></p>
          <p className="text-xl font-bold text-orange-400">{phiMax.toFixed(3)} rad ({(phiMax / Math.PI).toFixed(2)}π)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">B-integral</p>
          <p className="text-xl font-bold text-purple-400">{Bintegral.toFixed(3)} rad</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Broadening</p>
          <p className="text-xl font-bold text-cyan-400">{broadening.toFixed(2)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Chirp</p>
          <p className="text-xl font-bold text-yellow-400">{(maxChirp / 1e15).toFixed(2)} rad/fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Δλ</p>
          <p className="text-xl font-bold text-pink-400">{maxShiftNm.toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SPM Regime</p>
          <p className="text-xl font-bold text-red-400">{phiMax > 3.14 ? "Strong" : phiMax > 1 ? "Moderate" : "Weak"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={timeData} layout={timeLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={spectrumData} layout={spectrumLayout} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
