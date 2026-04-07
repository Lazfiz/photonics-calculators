"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface BrillouinMaterial { name: string; n: number; rho: number; vA: number; p12: number; color: string }

// Brillouin shift: ν_B = 2nV_A/λ
// Gain coefficient: g_B = 2πn⁷p₁₂²/(cλ²ρV_AΓ_B)
const MATERIALS: Record<string, BrillouinMaterial> = {
  FusedSilica: { name: "Fused Silica", n: 1.45, rho: 2202, vA: 5960, p12: 0.27, color: "#60a5fa" },
  SMF28: { name: "SMF-28 Fiber", n: 1.468, rho: 2202, vA: 5760, p12: 0.27, color: "#34d399" },
  Ge_doped: { name: "Ge-doped Fiber", n: 1.47, rho: 2400, vA: 5550, p12: 0.29, color: "#f87171" },
  As2S3: { name: "As₂S₃ Chalcogenide", n: 2.44, rho: 3190, vA: 2600, p12: 0.23, color: "#f59e0b" },
  Bismuth: { name: "Bi₂O₃ Bismuth Fiber", n: 2.02, rho: 7100, vA: 3300, p12: 0.30, color: "#a78bfa" },
  Tellurite: { name: "TeO₂ Tellurite Glass", n: 2.02, rho: 5900, vA: 3400, p12: 0.25, color: "#ec4899" },
  PMMA: { name: "PMMA Polymer", n: 1.49, rho: 1190, vA: 2700, p12: 0.30, color: "#06b6d4" },
  Diamond: { name: "Diamond", n: 2.42, rho: 3515, vA: 17540, p12: 0.12, color: "#84cc16" },
};

function brillouinShift(n: number, vA: number, lambda_nm: number): number {
  return 2 * n * vA * 1e3 / (lambda_nm * 1e-9) / 1e9; // GHz
}

function brillouinGain(mat: BrillouinMaterial, lambda_nm: number, linewidth_MHz: number): number {
  const c = 3e8;
  const n = mat.n;
  const lambda = lambda_nm * 1e-9;
  const p12 = mat.p12;
  const rho = mat.rho;
  const vA = mat.vA;
  const Gamma = linewidth_MHz * 1e6;
  // Simplified gain coefficient (m/W)
  const gB = 2 * Math.PI * Math.pow(n, 7) * p12 * p12 / (c * c * lambda * lambda * rho * Gamma) * 1e-3;
  return gB;
}

export default function BrillouinScatteringPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("SMF28");
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [linewidth, setLinewidth] = useURLState("linewidth", 30); // MHz
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 10); // mW
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km

  const mat = MATERIALS[material];
  const vB = brillouinShift(mat.n, mat.vA, wavelength);
  const gB = brillouinGain(mat, wavelength, linewidth);
  const Pth = 21 * 1e-3 / gB / (fiberLength * 1000); // threshold power (W)
  const Pth_mW = Pth * 1000;

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 1000 + i * 5);
    return Object.entries(MATERIALS).map(([key, m]) => ({
      x: wls, y: wls.map(wl => brillouinShift(m.n, m.vA, wl)),
      type: "scatter" as const, mode: "lines" as const, name: m.name,
      line: { color: m.color, width: key === material ? 3 : 1 }
    }));
  }, [material]);

  const gainChart = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 1000 + i * 5);
    return Object.entries(MATERIALS).map(([key, m]) => ({
      x: wls, y: wls.map(wl => brillouinGain(m, wl, linewidth) * 1e11),
      type: "scatter" as const, mode: "lines" as const, name: m.name,
      line: { color: m.color, width: key === material ? 3 : 1 }
    }));
  }, [material, linewidth]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Brillouin Scattering" description="Stimulated Brillouin scattering (SBS): frequency shift, gain coefficient, and power threshold in optical fibers and bulk materials.">
            
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full bg-gray-800 rounded px-3 py-2">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Linewidth (MHz)</label>
          <input type="number" value={linewidth} onChange={e => setLinewidth(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fiber Length (km)</label>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-gray-500">Brillouin Shift</div><div className="text-lg font-bold text-blue-400">{vB.toFixed(2)} GHz</div></div>
        <div><div className="text-xs text-gray-500">Acoustic Wavelength</div><div className="text-lg font-bold text-green-400">{(mat.vA * 1e6 / (vB * 1e9)).toFixed(1)} µm</div></div>
        <div><div className="text-xs text-gray-500">Gain Coefficient</div><div className="text-lg font-bold text-yellow-400">{(gB * 1e11).toFixed(1)} ×10⁻¹¹ m/W</div></div>
        <div><div className="text-xs text-gray-500">SBS Threshold</div><div className="text-lg font-bold text-red-400">{Pth_mW.toFixed(1)} mW</div></div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">Brillouin Frequency Shift vs Wavelength</h3>
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "ν_B (GHz)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.3, font: { size: 9 } }, margin: { t: 20, b: 80, l: 60, r: 20 } }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Brillouin Gain Coefficient vs Wavelength</h3>
        <ChartPanel data={gainChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "g_B (×10⁻¹¹ m/W)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.3, font: { size: 9 } }, margin: { t: 20, b: 80, l: 60, r: 20 } }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">ν_B = 2nV_A / λ | g_B = 2πn⁷p₁₂² / (c²λ²ρΓ_B)</p>
        <p className="font-mono bg-gray-800 p-2 rounded">P<sub>th</sub> ≈ 21·A<sub>eff</sub> / (g_B · L<sub>eff</sub>) | Γ_B = Brillouin linewidth</p>
        <p className="mt-2 text-xs">Acoustic velocity: V_A = {mat.vA} m/s. SBS is a major power limit in narrow-linewidth fiber systems.</p>
      </div>
    </CalculatorShell>
  );
}
