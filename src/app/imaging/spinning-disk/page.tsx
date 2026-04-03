"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SpinningDiskPage() {
  const [na, setNa] = useState(0.8);
  const [wavelength, setWavelength] = useState(488);
  const [n, setN] = useState(1.33);
  const [pinholeDiam, setPinholeDiam] = useState(50);
  const [numPins, setNumPins] = useState(20000);
  const [diskRPM, setDiskRPM] = useState(5000);
  const [cameraExposure, setCameraExposure] = useState(100);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const airy = 1.22 * lam / na * 1e9; // nm
    const pinholeAU = pinholeDiam / airy;
    const lateralRes = 0.61 * lam / na * 1e9;
    const axialRes = 2 * n * lam / (na * na) * 1e9;
    const opticalSection = (4 * n * lam * pinholeAU) / (na * na) * 1e9;
    const diskFreq = diskRPM / 60;
    const dwellTime = (cameraExposure * 1e-3) / numPins * 1e6;
    const frameRate = diskFreq;
    return { airy, pinholeAU, lateralRes, axialRes, opticalSection, dwellTime, frameRate };
  }, [na, wavelength, n, pinholeDiam, numPins, diskRPM, cameraExposure]);

  const plotData = useMemo(() => {
    const auRange = [];
    const sectioning = [];
    const signal = [];
    for (let au = 0.5; au <= 5; au += 0.1) {
      auRange.push(au);
      sectioning.push((4 * n * wavelength * 1e-9 * au) / (na * na) * 1e9);
      signal.push(1 - Math.exp(-0.7 * au * au));
    }
    return [
      { x: auRange, y: sectioning, name: "Optical section (nm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: auRange, y: signal.map(v => v * 1000), name: "Relative signal (a.u.)", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [na, wavelength, n]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Spinning Disk Confocal Calculator" description="Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Excitation wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pinhole diameter (µm)</label>
            <input type="number" step={1} value={pinholeDiam} onChange={e => setPinholeDiam(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of pinholes</label>
            <input type="number" step={1000} value={numPins} onChange={e => setNumPins(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Disk speed (RPM)</label>
            <input type="number" step={100} value={diskRPM} onChange={e => setDiskRPM(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Camera exposure (ms)</label>
            <input type="number" step={10} value={cameraExposure} onChange={e => setCameraExposure(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Airy unit diameter</span><span className="font-mono">{results.airy.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pinhole size (AU)</span><span className="font-mono text-blue-400">{results.pinholeAU.toFixed(2)} AU</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution (ideal)</span><span className="font-mono text-yellow-400">{results.axialRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Optical section thickness</span><span className="font-mono text-purple-400">{results.opticalSection.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Max frame rate</span><span className="font-mono text-red-400">{results.frameRate.toFixed(1)} fps</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Dwell time per pinhole</span><span className="font-mono">{results.dwellTime.toFixed(2)} µs</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Airy unit: d_AU = 1.22·λ/NA</p>
            <p>Optical section: z = 4nλ·(d_pin/d_AU)/NA²</p>
            <p>Frame rate = RPM / 60 (one revolution per frame)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Optical Section &amp; Signal vs Pinhole Size</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Pinhole size (Airy units)", gridcolor: "#333" }, yaxis: { title: "Section thickness (nm)", gridcolor: "#333" }, yaxis2: { title: "Relative signal", overlaying: "y", side: "right", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 70, r: 70, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
