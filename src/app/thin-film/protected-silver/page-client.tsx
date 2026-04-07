"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
// Silver optical constants (simplified Drude)
function silverN(wlNm: number): { n: number; k: number } {
  const wl = wlNm / 1000; // μm
  const epsInf = 5.0;
  const wp = 9.01; // plasma frequency eV
  const gamma = 0.048; // damping eV
  const E = 1.24 / wl; // photon energy eV
  const epsR = epsInf - wp * wp / (E * E + gamma * gamma);
  const epsI = wp * wp * gamma / (E * (E * E + gamma * gamma));
  const n = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) + epsR) / 2);
  const k = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) - epsR) / 2);
  return { n, k };
}

export default function ProtectedSilverPage() {
  const [nSub, setNSub] = useState(1.52);
  const [agThickness, setAgThickness] = useState(80);
  const [nProtect, setNProtect] = useState(1.38);
  const [protectThick, setProtectThick] = useState(50);
  const [nAdhesion, setNAdhesion] = useState(2.35);
  const [adhesionThick, setAdhesionThick] = useState(10);

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => 300 + i * 900 / N);

    const R = wls.map(wl => {
      const Ag = silverN(wl);
      const layers: { n: number; k: number; d: number }[] = [
        { n: nAdhesion, k: 0, d: adhesionThick },
        { n: Ag.n, k: Ag.k, d: agThickness },
        { n: nProtect, k: 0, d: protectThick },
      ];

      let Mr = [[1, 0], [0, 1]] as [number, number][];
      let Mi = [[0, 0], [0, 0]] as [number, number][];

      for (const layer of layers) {
        const delta = (2 * Math.PI * layer.n * layer.d) / wl;
        const alpha = (2 * Math.PI * layer.k * layer.d) / wl;
        const cd = Math.cos(delta) * Math.cosh(alpha);
        const sd = Math.sin(delta) * Math.sinh(alpha);
        const ns = layer.n, ks = layer.k;
        const n2k2 = ns * ns + ks * ks;
        const etaR = ns / n2k2, etaI = -ks / n2k2;

        const Lr: [number, number][] = [[cd, -sd * etaR], [sd * ns, cd]];
        const Li: [number, number][] = [[0, -sd * etaI], [sd * ks, 0]];

        // Complex matrix multiply
        const newMr: [number, number][] = [
          [Mr[0][0]*Lr[0][0] - Mi[0][0]*Li[0][0] + Mr[0][1]*Lr[1][0] - Mi[0][1]*Li[1][0],
           Mr[0][0]*Lr[0][1] - Mi[0][0]*Li[0][1] + Mr[0][1]*Lr[1][1] - Mi[0][1]*Li[1][1]],
          [Mr[1][0]*Lr[0][0] - Mi[1][0]*Li[0][0] + Mr[1][1]*Lr[1][0] - Mi[1][1]*Li[1][0],
           Mr[1][0]*Lr[0][1] - Mi[1][0]*Li[0][1] + Mr[1][1]*Lr[1][1] - Mi[1][1]*Li[1][1]],
        ];
        const newMi: [number, number][] = [
          [Mr[0][0]*Li[0][0] + Mi[0][0]*Lr[0][0] + Mr[0][1]*Li[1][0] + Mi[0][1]*Lr[1][0],
           Mr[0][0]*Li[0][1] + Mi[0][0]*Lr[0][1] + Mr[0][1]*Li[1][1] + Mi[0][1]*Lr[1][1]],
          [Mr[1][0]*Li[0][0] + Mi[1][0]*Lr[0][0] + Mr[1][1]*Li[1][0] + Mi[1][1]*Lr[1][0],
           Mr[1][0]*Li[0][1] + Mi[1][0]*Lr[0][1] + Mr[1][1]*Li[1][1] + Mi[1][1]*Lr[1][1]],
        ];
        Mr = newMr;
        Mi = newMi;
      }

      const nInc = 1.0;
      const Ar = Mr[0][0]*nSub - Mr[1][0] - nInc*(Mr[1][1] - Mr[0][1]*nSub);
      const Ai = Mi[0][0]*nSub - Mi[1][0] - nInc*(Mi[1][1] - Mi[0][1]*nSub);
      const Br = Mr[0][0]*nSub + Mr[1][0] + nInc*(Mr[1][1] + Mr[0][1]*nSub);
      const Bi = Mi[0][0]*nSub + Mi[1][0] + nInc*(Mi[1][1] + Mi[0][1]*nSub);

      const rr = (Ar*Br + Ai*Bi) / (Br*Br + Bi*Bi);
      const ri = (Ai*Br - Ar*Bi) / (Br*Br + Bi*Bi);
      return rr * rr + ri * ri;
    });

    return { wls, R };
  }, [nSub, agThickness, nProtect, protectThick, nAdhesion, adhesionThick]);

  const T = tmm.R.map(r => Math.max(0, 1 - r));
  const avgR = tmm.R.reduce((a, b) => a + b, 0) / tmm.R.length;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Protected Silver Mirror" description="Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Ag Thickness (nm)" value={agThickness} onChange={setAgThickness} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>protect</sub> (overcoat)</span>
          <input type="number" value={nProtect} onChange={e => setNProtect(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Overcoat Thickness (nm)" value={protectThick} onChange={setProtectThick} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>adhesion</sub></span>
          <input type="number" value={nAdhesion} onChange={e => setNAdhesion(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Adhesion Layer (nm)" value={adhesionThick} onChange={setAdhesionThick} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Average R (300–1200 nm)</p>
          <p className="text-3xl font-bold text-blue-400">{(avgR * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Structure</p>
          <p className="text-lg font-bold text-gray-300">Air | {nProtect} ({protectThick}nm) | Ag ({agThickness}nm) | {nAdhesion} ({adhesionThick}nm) | Sub</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
          { x: tmm.wls, y: T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
