"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function BeamWaistMatchingPage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [w0in, setW0in] = useState(100); // µm input waist
  const [w0out, setW0out] = useState(200); // µm desired output waist
  const [z, setZ] = useState(500); // mm distance between waists

  // Calculate required lens focal length for mode matching
  // Using ABCD matrix approach
  const zRin = Math.PI * Math.pow(w0in, 2) / (wavelength * 1e-3); // µm
  const zRout = Math.PI * Math.pow(w0out, 2) / (wavelength * 1e-3); // µm

  // For a single thin lens: f = 1/(1/(d + zRin²/(d-zRout²)) + 1/zRout)
  // Simpler: optimal lens position and focal length
  // Using the mode matching equations
  const d = z; // total distance

  // Exact solution for single-lens mode matching
  const discriminant = Math.pow(zRin - zRout, 2) + 4 * d * zRout;
  const fOpt = discriminant > 0 ? (d + Math.sqrt(discriminant)) / 2 : null;

  // Lens position from input waist
  const s1 = fOpt ? (fOpt * (fOpt - d)) / (fOpt - d - zRout) : null;

  // Verification: propagate through lens and check
  const chartData = useMemo(() => {
    const fRange = Array.from({ length: 200 }, (_, i) => 20 + i * 980 / 200); // mm
    const mismatch = fRange.map(f => {
      if (f <= 0 || f >= d) return 100;
      // ABCD: input waist -> propagate s1 -> lens f -> propagate s2
      // q_in = i * zRin
      // For optimal s1: q_after_lens = 1/(1/q1 - 1/f) where q1 = s1 + i*zRin
      // We find s1 that gives output waist = w0out at distance d
      // q_out = q_after_lens + (d - s1)
      // Im(1/q_out) = -1/zRout

      // Use: 1/q_out = (1/q_in - 1/f) + 1/f... actually let me use the direct formula
      // Magnification: M = w0out/w0in
      // M² = f² / ((s1 - f)² + zRin²)
      // s2 = f + f²(M² - 1) / (s1 - f) ... complex
      // Simplest: scan s1 for each f and find minimum mismatch
      let minMismatch = Infinity;
      for (let s1test = 1; s1test < d - 1; s1test += d / 100) {
        const s2test = d - s1test;
        // q1 = s1 + i*zRin, after lens: 1/q2 = 1/q1 - 1/f
        // q2 = (s1 - f + i*zRin) * f / ((s1-f) - zRin²/(s1-f) + i*2*zRin... )
        // Real approach: M² = f² / ((s1-f)² + zRin²)
        const M2 = f * f / ((s1test - f) * (s1test - f) + zRin * zRin);
        const wAtS2 = w0in * Math.sqrt(M2) * Math.sqrt(1 + Math.pow(s2test * zRin / ((s1test - f) * (s1test - f) + zRin * zRin), 2));
        const mm = Math.abs(wAtS2 - w0out) / w0out;
        if (mm < minMismatch) minMismatch = mm;
      }
      return minMismatch * 100; // percentage
    });

    return [
      { x: fRange, y: mismatch, type: "scatter", mode: "lines", name: "Mismatch (%)", line: { color: "#60a5fa", width: 2 } },
      ...(fOpt ? [{ x: [fOpt, fOpt], y: [0, Math.max(...mismatch)], type: "scatter" as const, mode: "lines" as const, name: "Optimal f", line: { color: "#f87171", dash: "dash" } }] : []),
    ];
  }, [wavelength, w0in, w0out, z, zRin, fOpt]);

  // Beam profile at output
  const profileData = useMemo(() => {
    if (!fOpt || !s1) return [];
    const zs = Array.from({ length: 200 }, (_, i) => i * z / 200);
    const ws = zs.map(zi => {
      if (zi <= s1) {
        return w0in * Math.sqrt(1 + Math.pow(zi / zRin, 2));
      } else {
        const s2 = z - s1;
        const M2 = fOpt * fOpt / ((s1 - fOpt) * (s1 - fOpt) + zRin * zRin);
        const wLens = w0in * Math.sqrt(M2);
        const zRafter = Math.PI * wLens * wLens / (wavelength * 1e-3);
        return wLens * Math.sqrt(1 + Math.pow((zi - s1) / zRafter, 2));
      }
    });
    return [
      { x: zs, y: ws, type: "scatter", mode: "lines", name: "Beam radius", line: { color: "#34d399", width: 2 } },
      { x: [s1, s1], y: [0, ws[Math.floor(s1 / z * 200)] || w0in], type: "scatter", mode: "lines", name: "Lens position", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [wavelength, w0in, w0out, z, zRin, fOpt, s1]);

  const layout1 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Focal length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Mismatch (%)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const layout2 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "z (mm)", gridcolor: "#374151" },
    yaxis: { title: "Beam radius (µm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Beam Waist Matching" description="Find the optimal lens for coupling one Gaussian mode into another.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">M</span> = w₀,out / w₀,in (magnification)</p>
        <p><span className="text-blue-400">z<sub>R</sub></span> = π w₀² / λ</p>
        <p><span className="text-blue-400">Mode matching efficiency</span> = |∫ E₁·E₂* dA|²</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Input Waist w₀,in (µm)" value={w0in} onChange={setW0in} step="any" />
        <ValidatedNumberInput label="Desired Waist w₀,out (µm)" value={w0out} onChange={setW0out} step="any" />
        <ValidatedNumberInput label="Distance d (mm)" value={z} onChange={setZ} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optimal f</p>
          <p className="text-xl font-bold text-blue-400">{fOpt ? fOpt.toFixed(1) + " mm" : "No solution"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lens Position (from input)</p>
          <p className="text-xl font-bold text-green-400">{s1 ? s1.toFixed(1) + " mm" : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Magnification M</p>
          <p className="text-xl font-bold text-orange-400">{(w0out / w0in).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">z<sub>R,in</sub> / z<sub>R,out</sub></p>
          <p className="text-xl font-bold text-purple-400">{(zRin / 1000).toFixed(2)} / {(zRout / 1000).toFixed(2)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm text-gray-400 mb-2">Mismatch vs Focal Length</h3>
        <ChartPanel data={chartData} layout={layout1} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Beam Propagation (with optimal lens)</h3>
        <ChartPanel data={profileData} layout={layout2} />
      </div>
    </CalculatorShell>
  );
}
