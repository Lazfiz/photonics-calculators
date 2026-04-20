"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ModeMatchingPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [w1, setW1] = useURLState("w1", 50); // µm input beam waist
  const [w2, setW2] = useURLState("w2", 200); // µm target beam waist
  const [d, setD] = useURLState("d", 200); // mm distance between waists

  const lam = wavelength * 1e-3; // µm (nm → µm)
  const zR1 = Math.PI * w1 * w1 / lam; // µm
  const zR2 = Math.PI * w2 * w2 / lam; // µm
  const d_mm = d; // mm
  const d_um = d * 1000; // µm

  // Mode matching with thin lens
  // f = 1/(1/(d + zR1²/(d - zR2²))) ... use the standard formula
  // For a single thin lens mode matcher:
  // s1 = d·zR2² / (d² + zR1² - zR2²)  (distance from input waist to lens)
  // f = ... (focal length)

  // Using the standard result for mode matching with a single thin lens:
  // f = (1/d²) * (d² - zR1² - zR2²) * ... let me use the direct formula
  // 
  // The ABCD matrix from waist 1 to waist 2 through a thin lens at distance s from waist 1:
  // [1 s] [1 0] [1 d-s]   [1 + (d-s)(-1/f)    s - s(d-s)/f ]
  // [0 1] [-1/f 1] [0 1 ] = [-1/f               1 - s/f     ]
  //
  // The imaging condition B = 0 gives: s - s(d-s)/f = 0 → f = d-s (not useful for mode matching)
  // Instead, use the complex beam parameter approach.
  //
  // Simpler: use the magnification approach
  // M = w2/w1
  // For symmetric mode matching: s1 = s2 = d/2
  // f = (d/2) / (1 + (w2/w1)² * (zR1/zR2)²)... 
  //
  // Let's just use the standard single-lens formulas:
  // The Gaussian beam parameter q transforms through ABCD matrices.
  // q1 = i*zR1, q2 = i*zR2 (at the waists)
  // Through lens at position s from waist 1: propagation s, lens f, propagation d-s
  // q_out = (A·q_in + B) / (C·q_in + D)
  // Set Im(1/q_out) = -λ/(π·w2²) = -1/zR2
  //
  // Using the standard result for single-lens mode matching:
  // f = (d² - zR1² - zR2²) / (2d)  ... no that's for imaging
  //
  // Correct formula from Self (1983):
  // s = f ± (f² - f·d·(1 + (zR2/zR1)²) / (1 - (f/zR1)²) + ...)^(1/2)
  //
  // Simpler approach: given d, w1, w2, λ, find f and s.
  // Using: f²·(d-zR2·zR1·...) ... let me just compute numerically.

  // Numerical approach: scan focal lengths and positions to find solutions
  const solutions = useMemo(() => {
    const sols: { f: number; s: number; overlap: number }[] = [];
    // Scan s for each candidate f
    for (let f_test = 5; f_test < 3000; f_test += 1) {
      for (let s_test = 1; s_test < d_mm - 1; s_test += 0.5) {
        // Complex q parameter approach (all in mm)
        const zR1_mm = zR1 / 1000;
        const zR2_mm = zR2 / 1000;
        const w1_mm = w1 / 1000;
        const w2_mm = w2 / 1000;
        const lam_mm = wavelength * 1e-6;
        
        // q at waist 1: q = i*zR1
        // Propagate s_test mm: q = s_test + i*zR1_mm
        // Thin lens f_test: 1/q' = 1/q - 1/f_test
        // q' = 1 / (1/(s_test + i*zR1_mm) - 1/f_test)
        // = (f_test * (s_test + i*zR1_mm)) / (f_test - s_test - i*zR1_mm)
        const num_r = f_test * s_test;
        const num_i = f_test * zR1_mm;
        const den_r = f_test - s_test;
        const den_i = -zR1_mm;
        const den_mag2 = den_r * den_r + den_i * den_i;
        const qp_r = (num_r * den_r + num_i * den_i) / den_mag2;
        const qp_i = (num_i * den_r - num_r * den_i) / den_mag2;
        
        // Propagate (d - s_test): q'' = qp + (d - s_test)
        const qpp_r = qp_r + (d_mm - s_test);
        const qpp_i = qp_i;
        
        // Beam at output: w = sqrt(-λ/(π·Im(1/q'')))
        // Im(1/q'') = -qpp_i / (qpp_r² + qpp_i²)
        const inv_q_im = -qpp_i / (qpp_r * qpp_r + qpp_i * qpp_i);
        const w_out = Math.sqrt(-lam_mm / (Math.PI * inv_q_im)) * 1000; // back to µm
        
        // Mode overlap integral for Gaussian beams:
        // η = 4/((w1/w2 + w2/w1)²) when waists coincide and phase fronts match
        // For our case, we also need the wavefront curvature to match (qpp_r ≈ 0 at output waist)
        // 
        // Simplified: just check if w_out ≈ w2 and qpp_r ≈ 0 (output at waist)
        if (Math.abs(w_out - w2) / w2 < 0.005 && Math.abs(qpp_r) / zR2_mm < 0.05) {
        // Compute exact Gaussian mode overlap (Kogelnik & Li, 1966):
        // η = 4·Im(q₁)·Im(q₂) / |q₁* - q₂|²
        const q_target = 0 + 1i * zR2_mm; // target at its waist
        const q_out_conj = qpp_r - qpp_i; // complex conjugate
        const dq_r = q_out_conj - 0;
        const dq_i = qpp_i - zR2_mm;
        const eta = 4 * qpp_i * zR2_mm / (dq_r * dq_r + dq_i * dq_i);
          
          // Avoid duplicates
          if (!sols.some(s => Math.abs(s.f - f_test) < 5 && Math.abs(s.s - s_test) < 2)) {
            sols.push({ f: f_test, s: s_test, overlap: eta });
          }
        }
      }
      if (sols.length >= 2) break;
    }

    return sols.slice(0, 2);
  }, [wavelength, w1, w2, d]);

  // Also compute the mode overlap as a function of focal length for the chart
  const chartData = useMemo(() => {
    const focalLengths = Array.from({ length: 300 }, (_, i) => 10 + i * (d * 2 - 10) / 300);
    const overlaps = focalLengths.map(f_test => {
      // For each f, find best s and compute overlap
      let bestEta = 0;
      const zR1_mm = zR1 / 1000;
      const lam_mm = wavelength * 1e-6;
      
      for (let s_test = 1; s_test < d_mm - 1; s_test += 2) {
        const num_r = f_test * s_test;
        const num_i = f_test * zR1_mm;
        const den_r = f_test - s_test;
        const den_i = -zR1_mm;
        const den_mag2 = den_r * den_r + den_i * den_i;
        if (den_mag2 < 1e-10) continue;
        const qp_r = (num_r * den_r + num_i * den_i) / den_mag2;
        const qp_i = (num_i * den_r - num_r * den_i) / den_mag2;
        const qpp_r = qp_r + (d_mm - s_test);
        const qpp_i = qp_i;
        const inv_q_im = -qpp_i / (qpp_r * qpp_r + qpp_i * qpp_i);
        if (inv_q_im >= 0) continue;
        const w_out = Math.sqrt(-lam_mm / (Math.PI * inv_q_im)) * 1000;
        // Exact overlap: η = 4·Im(q_out)·Im(q_target) / |q_out* - q_target|²
        const q_target_i = zR2 / 1000;
        const dq_r = qpp_r;
        const dq_i = qpp_i - q_target_i;
        const eta = 4 * qpp_i * q_target_i / (dq_r * dq_r + dq_i * dq_i);
        if (eta > bestEta) bestEta = eta;
      }
      return bestEta;
    });

    const markers = solutions.map(s => ({
      x: [s.f], y: [s.overlap], type: "scatter" as const, mode: "markers" as const,
      name: `f=${s.f.toFixed(1)}mm`, marker: { color: "#facc15", size: 12 },
    }));

    return [
      { x: focalLengths, y: overlaps, type: "scatter" as const, mode: "lines" as const, name: "Mode overlap η", line: { color: "#60a5fa" } },
      ...markers,
    ];
  }, [wavelength, w1, w2, d, solutions, d_mm, zR1, zR2]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Mode Matching" description="Find the optimal lens for coupling one Gaussian beam mode into another.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <pre>{`q = z + i·z_R   (complex beam parameter)
z_R = π·w₀² / λ

Mode overlap: η = |∫ E₁·E₂* dA|² / (|E₁|²·|E₂|²)

Single thin lens mode matcher: find f and s
  s = distance from input waist to lens`}</pre>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Input waist w₁ (µm)" value={w1} onChange={setW1} step="any" />
        <ValidatedNumberInput label="Target waist w₂ (µm)" value={w2} onChange={setW2} step="any" />
      </div>

      <label className="block mb-6"><span className="text-sm text-gray-300">Distance between waists d: {d} mm</span>
        <input type="range" min={10} max={1000} step={1} value={d} onChange={e => setD(+e.target.value)} className="w-full mt-1" /></label>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">z<sub>R1</sub> (input)</p>
          <p className="text-xl font-bold text-blue-400">{(zR1/1000).toFixed(2)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">z<sub>R2</sub> (target)</p>
          <p className="text-xl font-bold text-green-400">{(zR2/1000).toFixed(2)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-400 mb-2">Solutions (single thin lens)</p>
        {solutions.length === 0 && <p className="text-yellow-400">No solution found — try adjusting parameters</p>}
        {solutions.map((sol, i) => (
          <div key={i} className="flex gap-6 text-sm mb-1">
            <span className="text-blue-400">f = {sol.f.toFixed(1)} mm</span>
            <span className="text-green-400">s = {sol.s.toFixed(1)} mm from input waist</span>
            <span className="text-yellow-400">η = {(sol.overlap * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Focal length f (mm)", gridcolor: "#374151" },
          yaxis: { title: "Mode overlap η", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, showlegend: true, legend: { x: 0, y: 1.15, orientation: "h" },
        }} />
      </div>
    </CalculatorShell>
  );
}
