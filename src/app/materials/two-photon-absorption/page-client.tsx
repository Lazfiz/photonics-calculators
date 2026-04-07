"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
// Two-photon absorption: β₂PA coefficient in cm/GW
interface TPAMaterial { name: string; beta0: number; Eg_eV: number; lambda_g: number; color: string; type: string }

const TPA_MATERIALS: Record<string, TPAMaterial> = {
  FusedSilica: { name: "Fused Silica", beta0: 0.5, Eg_eV: 9.0, lambda_g: 138, color: "#60a5fa", type: "glass" },
  BK7: { name: "BK7", beta0: 0.7, Eg_eV: 8.5, lambda_g: 146, color: "#34d399", type: "glass" },
  CS2: { name: "CS₂", beta0: 25, Eg_eV: 4.5, lambda_g: 275, color: "#f87171", type: "liquid" },
  ZnSe: { name: "ZnSe", beta0: 55, Eg_eV: 2.7, lambda_g: 459, color: "#f59e0b", type: "semiconductor" },
  GaAs: { name: "GaAs", beta0: 260, Eg_eV: 1.42, lambda_g: 873, color: "#a78bfa", type: "semiconductor" },
  Si: { name: "Silicon", beta0: 90, Eg_eV: 1.12, lambda_g: 1107, color: "#ec4899", type: "semiconductor" },
  Water: { name: "Water", beta0: 0.05, Eg_eV: 6.5, lambda_g: 191, color: "#06b6d4", type: "liquid" },
  BBO: { name: "BBO", beta0: 4.0, Eg_eV: 6.2, lambda_g: 200, color: "#84cc16", type: "crystal" },
};

// Simplified dispersion: β(λ) ≈ β₀ · (λ_g / λ)^3 for λ > λ_g/2
function tpaBeta(mat: TPAMaterial, wavelength_nm: number): number {
  const ratio = mat.lambda_g / wavelength_nm;
  if (ratio < 0.5) return 0; // above bandgap
  if (ratio > 2) return mat.beta0 * 100; // resonance enhancement
  return mat.beta0 * Math.pow(ratio, 3);
}

export default function TwoPhotonAbsorptionPage() {
  const [material, setMaterial] = useState<keyof typeof TPA_MATERIALS>("FusedSilica");
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [intensity, setIntensity] = useURLState("intensity", 100); // GW/cm²
  const [thickness, setThickness] = useURLState("thickness", 1); // mm

  const mat = TPA_MATERIALS[material];
  const beta = tpaBeta(mat, wavelength);
  const alphaTPA = beta * intensity; // 1/cm
  const L = thickness * 0.1; // cm
  const effectiveLength = alphaTPA > 0 ? (1 - Math.exp(-alphaTPA * L)) / alphaTPA : L;
  const transmission = Math.exp(-beta * intensity * effectiveLength);
  const loss_dB = -10 * Math.log10(transmission);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 200 + i * 10);
    return [
      { x: wls, y: wls.map(wl => tpaBeta(mat, wl)), type: "scatter" as const, mode: "lines" as const, name: "β₂PA", line: { color: mat.color, width: 2 } },
      { x: [wavelength, wavelength], y: [0, tpaBeta(mat, wavelength) * 1.2], type: "scatter" as const, mode: "lines" as const, name: `λ = ${wavelength} nm`, line: { color: "#9ca3af", width: 1, dash: "dash" } },
      { x: [mat.lambda_g, mat.lambda_g], y: [0, tpaBeta(mat, mat.lambda_g) * 1.2], type: "scatter" as const, mode: "lines" as const, name: "λ_g", line: { color: "#f87171", width: 1, dash: "dot" } },
    ];
  }, [material, wavelength]);

  const intensityData = useMemo(() => {
    const intensities = Array.from({ length: 200 }, (_, i) => 0.1 + i * 2);
    const b = tpaBeta(mat, wavelength);
    return [{ x: intensities, y: intensities.map(I => Math.exp(-b * I * thickness * 0.1) * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#f59e0b", width: 2 } }];
  }, [material, wavelength, thickness]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Two-Photon Absorption" description="Nonlinear absorption coefficient β₂PA and intensity-dependent transmission. TPA becomes significant at high peak intensities (pulsed lasers).">
            
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full bg-gray-800 rounded px-3 py-2">
            {Object.entries(TPA_MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.type})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Peak Intensity (GW/cm²)</label>
          <input type="number" value={intensity} onChange={e => setIntensity(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" step={10} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thickness (mm)</label>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" step={0.1} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-gray-500">β₂PA</div><div className="text-lg font-bold text-blue-400">{beta.toFixed(3)} cm/GW</div></div>
        <div><div className="text-xs text-gray-500">α₂PA</div><div className="text-lg font-bold text-yellow-400">{alphaTPA.toFixed(2)} cm⁻¹</div></div>
        <div><div className="text-xs text-gray-500">Transmission</div><div className="text-lg font-bold text-green-400">{(transmission * 100).toFixed(1)}%</div></div>
        <div><div className="text-xs text-gray-500">TPA Loss</div><div className="text-lg font-bold text-red-400">{loss_dB.toFixed(2)} dB</div></div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">β₂PA vs Wavelength</h3>
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "β₂PA (cm/GW)", gridcolor: "#374151", type: "log" }, legend: { orientation: "h", y: -0.25 }, margin: { t: 20, b: 70, l: 60, r: 20 } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Transmission vs Intensity</h3>
        <ChartPanel data={intensityData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Intensity (GW/cm²)", gridcolor: "#374151", type: "log" }, yaxis: { title: "Transmission (%)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 20, b: 60, l: 60, r: 20 } }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">dI/dz = −β₂PA · I² | T = exp(−β₂PA · I₀ · L<sub>eff</sub>)</p>
        <p className="font-mono bg-gray-800 p-2 rounded">L<sub>eff</sub> = [1 − exp(−α₂PA · L)] / α₂PA | α₂PA = β₂PA · I</p>
        <p className="mt-2 text-xs">Bandgap wavelength: λ_g = {mat.lambda_g} nm. Two-photon absorption occurs when 2·ℏ·ω &gt; E_g, i.e., λ &lt; 2·λ_g.</p>
      </div>
    </CalculatorShell>
  );
}
