"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FCSPage() {
  const [w0, setW0] = useState(0.3); // µm
  const [z0, setZ0] = useState(1.5); // µm axial
  const [tauD, setTauD] = useState(0.05); // ms diffusion time
  const [brightness, setBrightness] = useState(30000); // Hz per molecule
  const [concentration, setConcentration] = useState(50); // nM
  const [tripletFrac, setTripletFrac] = useState(0.1);
  const [tripletTau, setTripletTau] = useState(0.005); // ms

  const results = useMemo(() => {
    const kappa = z0 / w0; // structure parameter
    const Veff = Math.PI ** 1.5 * w0 * w0 * z0 * 1e-18; // L (effective volume)
    const Veff_fL = Veff * 1e15; // femtoliters
    const N = concentration * 1e-9 * 6.022e23 * Veff; // number of particles
    const G0 = 1 / N;
    const D = w0 * w0 * 1e-12 / (4 * tauD * 1e-3); // m²/s
    const D_um2s = D * 1e12;
    const countRate = N * brightness; // Hz
    const SNR = countRate * Math.sqrt(1 / (N * brightness)); // approximate
    return { kappa, Veff, Veff_fL, N, G0, D, D_um2s, countRate, SNR };
  }, [w0, z0, tauD, brightness, concentration, tripletFrac, tripletTau]);

  const plotData = useMemo(() => {
    const lags = [];
    const corr = [];
    for (let lg = -4; lg <= 2; lg += 0.05) {
      const tau = Math.pow(10, lg); // ms
      lags.push(tau);
      const diffTerm = 1 / (1 + (tau / tauD)) / Math.sqrt(1 + (tau / (tauD * results.kappa * results.kappa)));
      const tripTerm = 1 + tripletFrac * Math.exp(-tau / tripletTau);
      corr.push(results.G0 * tripTerm * diffTerm);
    }
    return [
      { x: lags, y: corr, name: "G(τ)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
    ];
  }, [tauD, tripletFrac, tripletTau, results]);

  const snrPlot = useMemo(() => {
    const concs = [];
    const snrs = [];
    for (let c = 1; c <= 500; c += 5) {
      concs.push(c);
      const n = c * 1e-9 * 6.022e23 * results.Veff;
      const g0 = 1 / n;
      const cr = n * brightness;
      const snr = g0 * Math.sqrt(cr * 1e-3); // per ms bin
      snrs.push(snr);
    }
    return [{ x: concs, y: snrs, name: "SNR", line: { color: "#f87171" }, type: "scatter", mode: "lines" }];
  }, [brightness, results.Veff]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="FCS Calculator" description="Fluorescence Correlation Spectroscopy — diffusion time, concentration, and confocal volume.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lateral beam waist w₀ (µm)</label>
            <input type="number" step={0.01} value={w0} onChange={e => setW0(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Axial parameter z₀ (µm)</label>
            <input type="number" step={0.1} value={z0} onChange={e => setZ0(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Diffusion time τ_D (ms)</label>
            <input type="number" step={0.01} value={tauD} onChange={e => setTauD(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Molecular brightness (kHz/particle)</label>
            <input type="number" step={1000} value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Concentration (nM)</label>
            <input type="number" step={1} value={concentration} onChange={e => setConcentration(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Triplet fraction</label>
            <input type="number" step={0.01} value={tripletFrac} onChange={e => setTripletFrac(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Structure parameter κ</span><span className="font-mono">{results.kappa.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective volume</span><span className="font-mono text-blue-400">{results.Veff_fL.toFixed(3)} fL</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Particles in volume N</span><span className="font-mono text-green-400">{results.N.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">G(0) amplitude</span><span className="font-mono text-yellow-400">{results.G0.toFixed(4)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffusion coefficient D</span><span className="font-mono text-purple-400">{results.D_um2s.toFixed(2)} µm²/s</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Count rate</span><span className="font-mono text-red-400">{(results.countRate / 1000).toFixed(1)} kHz</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>V_eff = π^(3/2) · w₀² · z₀</p>
            <p>D = w₀² / (4τ_D)</p>
            <p>G(τ) = (1/N)(1+T·e^(−τ/τ_T)) / [(1+τ/τ_D)√(1+τ/(κ²τ_D))]</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Autocorrelation Curve</h2>
          <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Lag time τ (ms)", type: "log", gridcolor: "#333" }, yaxis: { title: "G(τ)", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">SNR vs Concentration</h2>
          <ChartPanel data={snrPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Concentration (nM)", gridcolor: "#333" }, yaxis: { title: "SNR (a.u.)", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
