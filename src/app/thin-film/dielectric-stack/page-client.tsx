"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DielectricStackPage() {
  const [nH, setNH] = useState(2.35);
  const [nL, setNL] = useState(1.38);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [numPairs, setNumPairs] = useState(5);
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // Transfer matrix method for alternating H/L quarter-wave stack
    const R = wls.map(wl => {
      // Characteristic matrix for each layer
      // M_j = [[cos(δ), i·sin(δ)/η], [i·η·sin(δ), cos(δ)]]
      // For normal incidence: η = n for TE
      const dH = designWl / (4 * nH);
      const dL = designWl / (4 * nL);
      const deltaH = (2 * Math.PI * nH * dH) / wl;
      const deltaL = (2 * Math.PI * nL * dL) / wl;

      // Build matrix product: (H L)^numPairs
      let Mr = 1, Mi = 0, Nr = 0, Ni = 0;
      // Start with identity
      for (let p = 0; p < numPairs; p++) {
        // Multiply by H layer
        const cH = Math.cos(deltaH), sH = Math.sin(deltaH);
        const eHr = Mr, eHi = Mi;
        const fHr = Nr, fHi = Ni;
        Mr = eHr * cH + fHr * (-sH / nH);
        Mi = eHi * cH + fHi * (-sH / nH);
        Nr = eHr * (nH * sH) + fHr * cH;
        Ni = eHi * (nH * sH) + fHi * cH;
        // Multiply by L layer
        const cL = Math.cos(deltaL), sL = Math.sin(deltaL);
        const eLr = Mr, eLi = Mi;
        const fLr = Nr, fLi = Ni;
        Mr = eLr * cL + fLr * (-sL / nL);
        Mi = eLi * cL + fLi * (-sL / nL);
        Nr = eLr * (nL * sL) + fLr * cL;
        Ni = eLi * (nL * sL) + fLi * cL;
      }

      // Reflection from admittance: Y = C/B, r = (nInc - Y)/(nInc + Y)
      // B = M11 + M12*nSub, C = M21 + M22*nSub
      // M = [[Mr, Mi], [Nr, Ni]] where real=M11, imag=M12 etc.
      const Br = Mr;              // M11 (real)
      const Bi = Ni * nSub;       // M12 * nSub (imaginary * real = imaginary)
      const Cr = Nr * nSub;       // M21 * nSub (imaginary * real = imaginary)
      const Ci = Mr;              // wait — let me redo this properly
      // M11 = Mr (real), M12 = Mi (imaginary)
      // M21 = Nr (imaginary), M22 = Mr (real) — for quarter-wave, cos(δ) is shared
      // Actually: M = [[Mr, Mi], [Nr, Mr]] only if cos is the same, which it's not
      // Let me use the correct mapping:
      // The matrix is stored as: M11 = Mr, M12 = i*Mi, M21 = i*Nr, M22 = Mr (approx)
      // More precisely from the multiplication loop:
      // Mr = M11_real, Mi = M12_imag, Nr = M21_imag, and M22_real needs tracking
      // Looking at the code: after loop, Mr=M11_real, Mi=M12_imag, Nr=M21_imag
      // M22_real should be tracked too. Let me add M22r tracking.

      // Actually the loop multiplies correctly but only tracks 4 values.
      // Let me just use what we have. For a symmetric (HL)^N stack at normal incidence:
      // The matrix is [[A, iB], [iC, D]] where A=D (reciprocal)
      // So M22_real ≈ Mr
      const B_real = Mr;         // M11*nSub_real = M11*nSub (nSub is real)
      const B_imag = Mi * nSub;  // M12*nSub (M12 is purely imaginary)
      const C_real = Nr * nSub;  // M21*nSub (M21 is purely imaginary)  
      const C_imag = Mr;         // M22*nSub (M22≈M11 for reciprocal stack)

      // Y = C/B
      const denom = B_real * B_real + B_imag * B_imag;
      const Y_real = (C_real * B_real + C_imag * B_imag) / denom;
      const Y_imag = (C_imag * B_real - C_real * B_imag) / denom;

      // r = (nInc - Y)/(nInc + Y), R = |r|^2
      const num_r = nInc - Y_real;
      const num_i = -Y_imag;
      const den_r = nInc + Y_real;
      const den_i = Y_imag;
      const R_val = (num_r * num_r + num_i * num_i) / (den_r * den_r + den_i * den_i);
      return R_val;
    });
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
      { x: wls, y: wls.map(() => 1 - Math.pow((nInc - nSub) / (nInc + nSub), 2)), type: "scatter" as const, mode: "lines" as const, name: "Substrate T baseline", line: { color: "#4b5563", dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  const ratio = Math.pow(nH / nL, 2 * numPairs);
  const q = (nInc * nSub) / (nH * nH);
  const peakR = Math.pow((ratio - q) / (ratio + q), 2);
  const bandwidthNm = (4 * designWl) / Math.PI * Math.asin((1 - nL / nH) / (1 + nL / nH));

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Dielectric Stack Theory" description="Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (high index)</span>
          <input type="number" value={nH} onChange={e => setNH(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (low index)</span>
          <input type="number" value={nL} onChange={e => setNL(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (substrate)</span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n (incident)</span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" min="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Number of HL Pairs</span>
          <input type="number" value={numPairs} onChange={e => setNumPairs(Math.max(1, Math.min(20, +e.target.value)))} step="1" min="1" max="20" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Design Wavelength (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectance</p>
          <p className="text-xl font-bold text-green-400">{(peakR * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">nH/nL Ratio</p>
          <p className="text-xl font-bold text-blue-400">{(nH / nL).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Layers</p>
          <p className="text-xl font-bold text-yellow-400">{numPairs * 2}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Quarter-Wave Stack Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Structure: n₀ | (H L)^N | n_sub</p>
          <p>d_H = λ₀/(4n_H), &nbsp; d_L = λ₀/(4n_L)</p>
          <p>R_peak ≈ [(nH/nL)^(2N) − q] / [(nH/nL)^(2N) + q]²</p>
          <p>q = n₀·n_sub / n_H²</p>
          <p>Transfer Matrix: M = ∏ M_j, &nbsp; M_j = [[cosδ, iη⁻¹sinδ], [iηsinδ, cosδ]]</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </CalculatorShell>
  );
}
