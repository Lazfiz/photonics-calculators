"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BeamWaistMatchingPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [w0in, setW0in] = useURLState("w0in", 100); // µm input waist
  const [w0out, setW0out] = useURLState("w0out", 200); // µm desired output waist
  const [z, setZ] = useURLState("z", 500); // mm distance between waists

  // Calculate required lens focal length for mode matching
  // All distances in mm, waists in µm
  const zRinMm = Math.PI * w0in * w0in / (wavelength * 1e-3) / 1000; // mm
  const zRoutMm = Math.PI * w0out * w0out / (wavelength * 1e-3) / 1000; // mm

  // Exact single-lens mode matching (q-parameter approach)
  // Solve: q_out = q_after_lens + (d - s1) = i * zRout
  // where 1/q_after_lens = 1/(s1 + i*zRin) - 1/f
  // Standard result: s1 = d*zRin/(zRin + zRout) ± sqrt((f-s1)²+zRin²)... 
  // Using the quadratic in f from q-parameter constraints:
  const A_coeff = (zRinMm - zRoutMm) * (zRinMm - zRoutMm);
  const B_coeff = 4 * z * zRinMm * zRoutMm;
  const C_coeff = -zRinMm * zRoutMm * (z * z + (zRinMm + zRoutMm) * (zRinMm + zRoutMm));
  const disc = B_coeff * B_coeff - 4 * A_coeff * C_coeff;
  const fOpt = disc >= 0 ? (A_coeff === 0 ? -C_coeff / B_coeff : (-B_coeff + Math.sqrt(disc)) / (2 * A_coeff)) : null;

  // Lens position from input waist
  const s1 = fOpt ? (z * zRinMm + fOpt * (zRoutMm - zRinMm)) / (zRinMm + zRoutMm) : null;

  // Verification: propagate through lens and check
  const chartData = useMemo(() => {
    const fRange = Array.from({ length: 200 }, (_, i) => 20 + i * 980 / 200); // mm
    const mismatch = fRange.map(f => {
      if (f <= 0 || f >= z) return 100;
      // Scan lens position s1 to find minimum waist mismatch at distance z
      let minMismatch = Infinity;
      for (let s1test = 0.5; s1test < z - 0.5; s1test += z / 100) {
        const s2test = z - s1test;
        // Magnification M² = f² / ((s1-f)² + zR²)
        const M2 = f * f / ((s1test - f) * (s1test - f) + zRinMm * zRinMm);
        // Output waist after lens
        const w0after = w0in * Math.sqrt(M2);
        // Actual waist position from lens: s2waist = f + M²*(s1 - f)
        const s2waist = f + M2 * (s1test - f);
        // Beam radius at s2test (distance from lens)
        const zRafterMm = zRinMm * M2;
        const dz = s2test - s2waist;
        const wAtS2 = w0after * Math.sqrt(1 + dz * dz / (zRafterMm * zRafterMm));
        const mm = Math.abs(wAtS2 - w0out) / w0out;
        if (mm < minMismatch) minMismatch = mm;
      }
      return minMismatch * 100; // percentage
    });

    return [
      { x: fRange, y: mismatch, type: "scatter", mode: "lines", name: "Mismatch (%)", line: { color: "#60a5fa", width: 2 } },
      ...(fOpt ? [{ x: [fOpt, fOpt], y: [0, Math.max(...mismatch)], type: "scatter" as const, mode: "lines" as const, name: "Optimal f", line: { color: "#f87171", dash: "dash" } }] : []),
    ];
  }, [wavelength, w0in, w0out, z, zRinMm, fOpt]);

  // Beam profile at output
  const profileData = useMemo(() => {
    if (!fOpt || !s1) return [];
    const zs = Array.from({ length: 200 }, (_, i) => i * z / 200);
    const M2 = fOpt * fOpt / ((s1 - fOpt) * (s1 - fOpt) + zRinMm * zRinMm);
    const wLens = w0in * Math.sqrt(M2); // waist after lens
    const zRafterMm = zRinMm * M2; // Rayleigh range after lens (mm)
    // Actual output waist position from lens: s2waist = f + M²*(s1 - f)
    const s2waistFromLens = fOpt + M2 * (s1 - fOpt);
    const s2waistAbs = s1 + s2waistFromLens; // absolute position of output waist

    const ws = zs.map(zi => {
      if (zi <= s1) {
        return w0in * Math.sqrt(1 + (zi * zi) / (zRinMm * zRinMm));
      } else {
        const dz = zi - s2waistAbs; // distance from actual output waist
        return wLens * Math.sqrt(1 + (dz * dz) / (zRafterMm * zRafterMm));
      }
    });
    return [
      { x: zs, y: ws, type: "scatter", mode: "lines", name: "Beam radius", line: { color: "#34d399", width: 2 } },
      { x: [s1, s1], y: [0, ws[Math.floor(s1 / z * 200)] || w0in], type: "scatter", mode: "lines", name: "Lens position", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [wavelength, w0in, w0out, z, zRinMm, fOpt, s1]);

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
          <p className="text-xl font-bold text-purple-400">{zRinMm.toFixed(2)} / {zRoutMm.toFixed(2)} mm</p>
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
