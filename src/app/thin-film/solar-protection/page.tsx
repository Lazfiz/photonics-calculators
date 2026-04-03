"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SolarProtectionPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.45);
  const [nSub, setNSub] = useState(1.52);
  const [uvWl, setUvWl] = useState(350);
  const [irWl, setIrWl] = useState(1000);
  const [uvPairs, setUvPairs] = useState(4);
  const [irPairs, setIrPairs] = useState(6);

  const solarSpectrum = useMemo(() => {
    // Simplified AM1.5 solar irradiance (W/m²/nm) — key wavelengths
    return [
      { wl: 300, e: 0.04 }, { wl: 350, e: 0.08 }, { wl: 400, e: 0.14 },
      { wl: 450, e: 0.18 }, { wl: 500, e: 0.19 }, { wl: 550, e: 0.19 },
      { wl: 600, e: 0.17 }, { wl: 650, e: 0.15 }, { wl: 700, e: 0.13 },
      { wl: 750, e: 0.11 }, { wl: 800, e: 0.09 }, { wl: 850, e: 0.08 },
      { wl: 900, e: 0.07 }, { wl: 950, e: 0.05 }, { wl: 1000, e: 0.04 },
      { wl: 1100, e: 0.03 }, { wl: 1200, e: 0.02 }, { wl: 1400, e: 0.01 },
      { wl: 1600, e: 0.008 }, { wl: 2000, e: 0.004 }, { wl: 2500, e: 0.002 },
    ];
  }, []);

  const tmm = useMemo(() => {
    const N = 500;
    const wls = Array.from({ length: N }, (_, i) => 250 + i * 2500 / N);

    const addLayers = (wl: number, pairs: number, startH: boolean) => {
      return wls.map(wavelength => {
        const dH = wl / (4 * nH);
        const dL = wl / (4 * nL);
        let M = [[1, 0], [0, 1]] as [number, number][];

        const addLayer = (n: number, d: number) => {
          const delta = (2 * Math.PI * n * d) / wavelength;
          const c = Math.cos(delta), s = Math.sin(delta);
          const L: [number, number][] = [[c, -s / n], [s * n, c]];
          M = [
            [M[0][0]*L[0][0]+M[0][1]*L[1][0], M[0][0]*L[0][1]+M[0][1]*L[1][1]],
            [M[1][0]*L[0][0]+M[1][1]*L[1][0], M[1][0]*L[0][1]+M[1][1]*L[1][1]],
          ];
        };

        for (let p = 0; p < pairs; p++) {
          if (startH) { addLayer(nH, dH); addLayer(nL, dL); }
          else { addLayer(nL, dL); addLayer(nH, dH); }
        }

        const nInc = 1.0;
        const num = M[0][0]*nSub + M[0][1]*nSub*nInc - M[1][0] - M[1][1]*nInc;
        const den = M[0][0]*nSub + M[0][1]*nSub*nInc + M[1][0] + M[1][1]*nInc;
        return (num / den) ** 2;
      });
    };

    const Ruv = addLayers(uvWl, uvPairs, false); // SP for UV
    const Rir = addLayers(irWl, irPairs, true);   // LP for IR
    const Tcombined = wls.map((_, i) => (1 - Ruv[i]) * (1 - Rir[i]));

    // Solar metrics
    let totalSolar = 0, transmittedSolar = 0;
    solarSpectrum.forEach(({ wl, e }) => {
      const idx = Math.round((wl - 250) / (2500 / N));
      const t = idx >= 0 && idx < N ? Tcombined[idx] : 0;
      totalSolar += e;
      transmittedSolar += e * t;
    });

    return { wls, Tcombined, solarTransmission: totalSolar > 0 ? transmittedSolar / totalSolar : 0 };
  }, [nH, nL, nSub, uvWl, irWl, uvPairs, irPairs, solarSpectrum]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Solar Protection Coating" description="Dual-stack design: UV + IR blocking for glazing and solar control applications.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>high</sub></span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>low</sub></span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">UV design λ (nm)</span>
          <input type="number" value={uvWl} onChange={e => setUvWl(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">IR design λ (nm)</span>
          <input type="number" value={irWl} onChange={e => setIrWl(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">UV Pairs</span>
          <input type="number" value={uvPairs} onChange={e => setUvPairs(+e.target.value)} min={1} max={15} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">IR Pairs</span>
          <input type="number" value={irPairs} onChange={e => setIrPairs(+e.target.value)} min={1} max={15} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar Heat Transmission</p>
          <p className="text-3xl font-bold text-orange-400">{(tmm.solarTransmission * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Solar Heat Rejection</p>
          <p className="text-3xl font-bold text-green-400">{((1 - tmm.solarTransmission) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.Tcombined, type: "scatter", mode: "lines", name: "Total T", line: { color: "#60a5fa", width: 2 } },
          { x: tmm.wls, y: tmm.Tcombined.map(t => 1 - t), type: "scatter", mode: "lines", name: "Total R+A", line: { color: "#f87171", width: 1 } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "T / (R+A)", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
