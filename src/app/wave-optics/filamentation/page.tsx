"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FilamentationPage() {
  const [wavelength, setWavelength] = useState(800); // nm
  const [pulseEnergy, setPulseEnergy] = useState(1000); // µJ
  const [pulseDuration, setPulseDuration] = useState(50); // fs
  const [beamWaist, setBeamWaist] = useState(500); // µm
  const [n2, setN2] = useState(3.2); // ×10⁻¹⁶ cm²/W (fused silica)
  const [n0, setN0] = useState(1.45);
  const [pressure, setPressure] = useState(1); // atm

  const k = 2 * Math.PI / (wavelength * 1e-9); // 1/m
  const w0 = beamWaist * 1e-6; // m
  const zR = Math.PI * w0 ** 2 * n0 / (wavelength * 1e-9); // Rayleigh range
  const Pcr = 3.77 * (wavelength * 1e-9) ** 2 / (8 * Math.PI * n0 * n2 * 1e-20); // critical power W
  const peakPower = pulseEnergy * 1e-6 / (pulseDuration * 1e-15); // W

  // Filament length estimate
  const PoverPcr = peakPower / Pcr;
  const zFil = 0.367 * zR * Math.sqrt(PoverPcr); // Marburger formula for self-focusing distance
  const Lfil = 2 * zFil * Math.sqrt(PoverPcr); // approximate filament length

  // Beam radius vs propagation (Marburger)
  const beamData = useMemo(() => {
    const z = Array.from({ length: 300 }, (_, i) => i * zFil * 3 / 300);
    const wLinear = z.map(zi => w0 * Math.sqrt(1 + (zi / zR) ** 2) * 1e6); // linear diffraction
    const wKerr = z.map(zi => {
      const zf = zFil;
      if (zi < zf * 0.95) {
        const w = w0 * Math.sqrt(1 - (zi / zf) ** 2 + (zi / zR) ** 2);
        return Math.max(w * 1e6, wavelength / 2);
      }
      // Inside filament: clamped at ~w_filament
      return beamWaist * 0.02;
    });
    return [
      { x: z.map(v => v * 100), y: wLinear, type: "scatter", mode: "lines", name: "Linear", line: { color: "#374151", width: 1, dash: "dash" } },
      { x: z.map(v => v * 100), y: wKerr, type: "scatter", mode: "lines", name: "With Kerr", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [wavelength, beamWaist, n0, n2, pulseEnergy, pulseDuration]);

  // Peak intensity vs z
  const intensityData = useMemo(() => {
    const z = Array.from({ length: 300 }, (_, i) => i * zFil * 3 / 300);
    const I = z.map(zi => {
      const zf = zFil;
      if (zi < zf * 0.95) {
        const w = w0 * Math.sqrt(1 - (zi / zf) ** 2 + (zi / zR) ** 2);
        const area = Math.PI * w ** 2;
        return peakPower / area;
      }
      return 5e17; // clamped intensity ~5×10¹³ W/cm² = 5×10¹⁷ W/m²
    });
    return [
      { x: z.map(v => v * 100), y: I.map(v => v / 1e16), type: "scatter", mode: "lines", name: "Peak I(z)", line: { color: "#f472b6", width: 2 } },
    ];
  }, [wavelength, beamWaist, n0, n2, pulseEnergy, pulseDuration]);

  const beamLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Propagation z (cm)", gridcolor: "#374151" },
    yaxis: { title: "Beam radius (µm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const intLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Propagation z (cm)", gridcolor: "#374151" },
    yaxis: { title: "Intensity (×10¹⁶ W/m²)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // B-integral
  const Iclamped = 5e17;
  const Bintegral = (2 * Math.PI / (wavelength * 1e-9)) * n2 * 1e-20 * Iclamped * Lfil;

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Filamentation Dynamics" description="Laser filamentation — balance of Kerr self-focusing, plasma defocusing, and diffraction.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">P<sub>cr</sub></span> = 3.77 λ² / (8π n₀ n₂)</p>
        <p><span className="text-blue-400">z<sub>sf</sub></span> ≈ 0.367 z<sub>R</sub> √(P/P<sub>cr</sub>) — Marburger formula</p>
        <p><span className="text-blue-400">I<sub>clamped</sub></span> ≈ 5 × 10¹³ W/cm² — intensity clamping</p>
        <p><span className="text-blue-400">B</span> = (2π/λ) n₂ ∫I dz — B-integral</p>
        <p><span className="text-blue-400">Balance:</span> Kerr focus + plasma defocus + diffraction</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Energy (µJ)</span>
          <input type="number" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Pulse Duration (fs)</span>
          <input type="number" value={pulseDuration} onChange={e => setPulseDuration(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Beam Waist (µm)</span>
          <input type="number" value={beamWaist} onChange={e => setBeamWaist(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₀</span>
          <input type="number" value={n0} onChange={e => setN0(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n₂ (×10⁻¹⁶ cm²/W)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Power P<sub>cr</sub></p>
          <p className="text-xl font-bold text-blue-400">{(Pcr / 1e6).toFixed(2)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-xl font-bold text-green-400">{(peakPower / 1e6).toFixed(1)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">P / P<sub>cr</sub></p>
          <p className="text-xl font-bold text-orange-400">{PoverPcr.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Self-focusing z</p>
          <p className="text-xl font-bold text-purple-400">{(zFil * 100).toFixed(1)} cm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-xl font-bold text-cyan-400">{(zR * 100).toFixed(1)} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Filament Length</p>
          <p className="text-xl font-bold text-yellow-400">{(Lfil * 100).toFixed(1)} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">B-integral</p>
          <p className="text-xl font-bold text-pink-400">{isFinite(Bintegral) ? Bintegral.toFixed(1) : "—"} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Filamentation?</p>
          <p className="text-xl font-bold text-red-400">{PoverPcr > 1 ? "Yes ✓" : "No ✗"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={beamData} layout={beamLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={intensityData} layout={intLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
