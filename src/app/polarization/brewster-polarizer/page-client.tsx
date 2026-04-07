"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function BrewsterPolarizerPage() {
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.52);
  const [numSurfaces, setNumSurfaces] = useState(1);

  const brewsterDeg = Math.atan(n2 / n1) * 180 / Math.PI;
  const criticalDeg = n1 < n2 ? 90 : Math.asin(n2 / n1) * 180 / Math.PI;

  const polarizerData = useMemo(() => {
    const angles = Array.from({ length: 500 }, (_, i) => (i / 500) * (89.9 * Math.PI / 180));
    const degs = angles.map(a => a * 180 / Math.PI);

    const thetaT = (thetaI: number) => {
      const sinT = (n1 / n2) * Math.sin(thetaI);
      if (Math.abs(sinT) > 1) return null;
      return Math.acos(sinT > 1 ? 1 : sinT < -1 ? -1 : sinT);
    };

    const calcRs = (thetaI: number) => {
      const ct = thetaT(thetaI);
      if (ct === null) return 1;
      const cosI = Math.cos(thetaI);
      return ((n1 * cosI - n2 * ct) / (n1 * cosI + n2 * ct)) ** 2;
    };

    const calcRp = (thetaI: number) => {
      const ct = thetaT(thetaI);
      if (ct === null) return 1;
      const cosI = Math.cos(thetaI);
      return ((n2 * cosI - n1 * ct) / (n2 * cosI + n1 * ct)) ** 2;
    };

    // Single surface
    const RsSingle = angles.map(a => calcRs(a));
    const RpSingle = angles.map(a => calcRp(a));

    // Multi-surface stack (non-coherent addition)
    const RsStack = angles.map(a => {
      const r = calcRs(a);
      return 1 - (1 - r) ** numSurfaces;
    });
    const RpStack = angles.map(a => {
      const r = calcRp(a);
      return 1 - (1 - r) ** numSurfaces;
    });

    // Extinction ratio at each angle
    const extRatio = angles.map((a, i) => {
      const tp = 1 - RpStack[i];
      const ts = 1 - RsStack[i];
      return ts > 1e-10 ? tp / ts : 9999;
    });

    return [
      { x: degs, y: RsSingle, type: "scatter" as const, mode: "lines" as const, name: "Rs (1 surface)", line: { color: "#60a5fa", dash: "dot" } },
      { x: degs, y: RpSingle, type: "scatter" as const, mode: "lines" as const, name: "Rp (1 surface)", line: { color: "#f87171", dash: "dot" } },
      { x: degs, y: RsStack, type: "scatter" as const, mode: "lines" as const, name: "Rs (stack)", line: { color: "#60a5fa", width: 2 } },
      { x: degs, y: RpStack, type: "scatter" as const, mode: "lines" as const, name: "Rp (stack)", line: { color: "#f87171", width: 2 } },
    ];
  }, [n1, n2, numSurfaces]);

  const extData = useMemo(() => {
    const angles = Array.from({ length: 500 }, (_, i) => (i / 500) * (89.9 * Math.PI / 180));
    const degs = angles.map(a => a * 180 / Math.PI);
    const calcR = (thetaI: number, p: boolean) => {
      const sinT = (n1 / n2) * Math.sin(thetaI);
      if (Math.abs(sinT) > 1) return 1;
      const cosT = Math.cos(Math.asin(sinT));
      const cosI = Math.cos(thetaI);
      if (p) return ((n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT)) ** 2;
      return ((n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT)) ** 2;
    };

    const ratios = angles.map(a => {
      const Rs = 1 - (1 - calcR(a, false)) ** numSurfaces;
      const Rp = 1 - (1 - calcR(a, true)) ** numSurfaces;
      const tp = 1 - Rp;
      const ts = 1 - Rs;
      return ts > 1e-10 ? 10 * Math.log10(tp / ts) : 60;
    });

    return [
      { x: degs, y: ratios, type: "scatter" as const, mode: "lines" as const, name: "Extinction (dB)", line: { color: "#a78bfa", width: 2 } },
      { x: [brewsterDeg, brewsterDeg], y: [-10, 60], type: "scatter" as const, mode: "lines" as const, name: "Brewster", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [n1, n2, numSurfaces, brewsterDeg]);

  // Transmittance at Brewster angle
  const cosI = Math.cos(brewsterDeg * Math.PI / 180);
  const sinI = Math.sin(brewsterDeg * Math.PI / 180);
  const cosT = Math.cos(Math.asin(n1 / n2 * sinI));
  const TpSingle = (n2 * cosT) / (n1 * cosI) * (2 * n1 * cosI / (n2 * cosI + n1 * cosT)) ** 2;
  const TpStack = TpSingle ** numSurfaces;

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Brewster Polarizer Design" description="Design Brewster-angle polarizers using tilted glass plates. At Brewster&apos;s angle, p-polarized light has zero reflection.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">θ<sub>B</sub> = arctan(n₂/n₁)</p>
        <p className="text-gray-300 text-sm font-mono">R<sub>p</sub>(θ<sub>B</sub>) = 0, T<sub>p</sub>(θ<sub>B</sub>) = 1</p>
        <p className="text-gray-500 text-xs mt-1">Stack N surfaces: T<sub>p</sub> = T<sub>p,1</sub><sup>N</sup>, R<sub>s</sub> = 1 − (1 − R<sub>s,1</sub>)<sup>N</sup></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="n₁ (incident)" value={n1} onChange={setN1} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n₂ (plate)" value={n2} onChange={setN2} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Number of Surfaces" value={numSurfaces} onChange={setNumSurfaces} min={1} max={20} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setN1(1); setN2(1.52); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">BK7</button>
        <button onClick={() => { setN1(1); setN2(1.76); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">SF11</button>
        <button onClick={() => { setN1(1); setN2(2.42); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Diamond</button>
        <button onClick={() => setNumSurfaces(1)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">1 surface</button>
        <button onClick={() => setNumSurfaces(4)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">4 surfaces</button>
        <button onClick={() => setNumSurfaces(10)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">10 surfaces</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Brewster Angle</p>
          <p className="text-2xl font-bold text-blue-400">{brewsterDeg.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T<sub>p</sub> at θ<sub>B</sub> (stack)</p>
          <p className="text-2xl font-bold text-green-400">{(TpStack * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Acceptance Angle</p>
          <p className="text-2xl font-bold text-yellow-400">~±{Math.max(0.5, 3 / numSurfaces).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">F-number (min)</p>
          <p className="text-2xl font-bold text-purple-400">{(1 / (2 * Math.tan(brewsterDeg * Math.PI / 180 + 0.05))).toFixed(1)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Reflectance vs Angle</h3>
          <ChartPanel data={polarizerData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle (°)", gridcolor: "#374151", range: [0, 90] },
            yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1] },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Extinction Ratio (dB)</h3>
          <ChartPanel data={extData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle (°)", gridcolor: "#374151", range: [0, 90] },
            yaxis: { title: "T<sub>p</sub>/T<sub>s</sub> (dB)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
