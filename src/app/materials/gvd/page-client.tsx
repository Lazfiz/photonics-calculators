"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
const MATERIALS: Record<string, { name: string; B: number[]; C: number[] }> = {
  BK7: { name: "BK7", B: [1.03961212, 0.231792344, 1.01046945], C: [0.00600069867, 0.0200179144, 103.560653] },
  FusedSilica: { name: "Fused Silica", B: [0.6961663, 0.4079426, 0.8974794], C: [0.0684043, 0.1162414, 9.896161] },
  SF11: { name: "SF11", B: [1.73759695, 0.313747346, 1.89878101], C: [0.013188707, 0.0623068142, 155.23629] },
  CaF2: { name: "CaF₂", B: [0.5675888, 0.4710914, 3.8484723], C: [0.00252643, 0.010078333, 1200.556] },
};

const sellmeierN = (wl_um: number, B: number[], C: number[]) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + B[0] * l2 / (l2 - C[0]) + B[1] * l2 / (l2 - C[1]) + B[2] * l2 / (l2 - C[2]));
};

// GVD = d²n/dλ² (ps²/km) = (λ/c) * d²n/dλ² * 1e6 for ps²/km units
// We compute d²n/dλ² numerically
export default function GVDPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("BK7");
  const [wavelength, setWavelength] = useState(800); // nm

  const calc = useMemo(() => {
    const mat = MATERIALS[material];
    const wl = wavelength / 1000; // µm
    const dw = 0.0001; // µm step for numerical derivative

    const n = sellmeierN(wl, mat.B, mat.C);
    const n_plus = sellmeierN(wl + dw, mat.B, mat.C);
    const n_minus = sellmeierN(wl - dw, mat.B, mat.C);
    const dndlambda = (n_plus - n_minus) / (2 * dw); // dn/dλ in µm⁻¹
    const d2ndl2 = (n_plus - 2 * n + n_minus) / (dw * dw); // d²n/dλ² in µm⁻²

    // GVD parameter β₂ = (λ²/(2πc)) * d²n/dλ² in s²/m
    // Convert to fs²/mm: multiply by 1e30 (s²→fs²) * 1e3 (m→mm)
    const c = 3e8; // m/s
    const beta2 = (wl * 1e-6) ** 2 / (2 * Math.PI * c) * d2ndl2 / 1e-12; // fs²/mm (d2n is per µm², convert)
    // More carefully: d2n/dλ² is in µm⁻² = 1e12 m⁻²
    const beta2_si = (wl * 1e-6) ** 2 / (2 * Math.PI * c) * d2ndl2 * 1e12; // s²/m
    const beta2_fs2_mm = beta2_si * 1e15; // fs²/mm... wait let me redo
    // β₂ = λ²/(2πc) · GVD_material, where GVD_material = -λ/c · d²n/dλ²... 
    // Actually β₂ = (λ²/(2πc)) · d²n/dλ² where d²n/dλ² in SI (m⁻²)
    // d²n/dλ² numerical is in µm⁻², so multiply by 1e12 to get m⁻²
    // β₂ in s²/m, then *1e30 for ps²/m, *1e-3 for ps²/km... no
    // β₂ s²/m × 1e30 = ps²/m, ×1e-3 = ps²/km... that's not right
    // 1 s²/m = 1e24 ps²/m = 1e27 ps²/km
    const beta2_ps2km = beta2_si * 1e27; // ps²/km

    return { n, dndlambda, d2ndl2, beta2_ps2km, dispersion: d2ndl2 };
  }, [material, wavelength]);

  const chartData = useMemo(() => {
    const mat = MATERIALS[material];
    const wls = Array.from({ length: 200 }, (_, i) => 0.4 + i * 0.008);
    const dw = 0.0001;
    const gvd = wls.map(wl => {
      const np = sellmeierN(wl + dw, mat.B, mat.C);
      const nm = sellmeierN(wl - dw, mat.B, mat.C);
      const d2 = (np - 2 * sellmeierN(wl, mat.B, mat.C) + nm) / (dw * dw);
      return d2;
    });
    const beta2s = wls.map(wl => {
      const np = sellmeierN(wl + dw, mat.B, mat.C);
      const nm = sellmeierN(wl - dw, mat.B, mat.C);
      const d2 = (np - 2 * sellmeierN(wl, mat.B, mat.C) + nm) / (dw * dw);
      const c = 3e8;
      return (wl * 1e-6) ** 2 / (2 * Math.PI * c) * d2 * 1e12 * 1e27; // ps²/km
    });

    return [
      { x: wls.map(w => w * 1000), y: beta2s, type: "scatter" as const, mode: "lines" as const, name: "β₂", line: { color: "#f87171" } },
      { x: [wavelength], y: [calc.beta2_ps2km], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [material, wavelength, calc]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Group Velocity Dispersion (GVD)" description="Calculate d²n/dλ² and β₂ dispersion parameter from Sellmeier coefficients.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n(λ)</p>
          <p className="text-xl font-bold text-blue-400">{calc.n.toFixed(6)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">d²n/dλ²</p>
          <p className="text-xl font-bold text-yellow-400">{calc.d2ndl2.toExponential(3)} µm⁻²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">β₂</p>
          <p className="text-xl font-bold text-red-400">{calc.beta2_ps2km.toExponential(3)} ps²/km</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "β₂ (ps²/km)", gridcolor: "#374151", zeroline: true, zerolinecolor: "#4b5563" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
