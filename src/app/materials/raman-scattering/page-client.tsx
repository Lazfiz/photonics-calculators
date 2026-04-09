"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface RamanMaterial { name: string; shift: number; linewidth: number; gain: number; color: string }

// Raman gain spectra: shift in cm⁻¹, linewidth in cm⁻¹, peak gain in 10⁻¹³ m/W
const MATERIALS: Record<string, RamanMaterial> = {
  FusedSilica: { name: "Fused Silica", shift: 440, linewidth: 80, gain: 1.0, color: "#60a5fa" },
  Germanosilicate: { name: "Ge-doped Silica", shift: 430, linewidth: 100, gain: 1.5, color: "#34d399" },
  Phosphosilicate: { name: "P-doped Silica", shift: 1330, linewidth: 60, gain: 2.5, color: "#f87171" },
  CS2: { name: "CS₂", shift: 656, linewidth: 20, gain: 24, color: "#f59e0b" },
  Water: { name: "Water", shift: 3400, linewidth: 300, gain: 0.06, color: "#06b6d4" },
  Benzene: { name: "Benzene", shift: 992, linewidth: 5, gain: 12, color: "#a78bfa" },
  Diamond: { name: "Diamond", shift: 1332, linewidth: 8, gain: 7, color: "#84cc16" },
  As2S3: { name: "As₂S₃ Chalcogenide", shift: 340, linewidth: 50, gain: 50, color: "#ec4899" },
};

function ramanSpectrum(mat: RamanMaterial, shift: number): number {
  const sigma = mat.linewidth / 2.355;
  return mat.gain * Math.exp(-0.5 * Math.pow((shift - mat.shift) / sigma, 2));
}

function shiftToWavelength(pump_nm: number, shift_cm: number): number {
  return 1 / (1 / pump_nm - shift_cm * 1e-7); // nm
}

export default function RamanScatteringPage() {
  const [selected, setSelected] = useState<string[]>(["FusedSilica", "CS2", "Benzene", "As2S3"]);
  const [pumpWl, setPumpWl] = useURLState("pumpWl", 1064);

  const toggle = (key: string) => setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const chartData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => 100 + i * 15);
    return selected.map(key => {
      const m = MATERIALS[key];
      return { x: shifts, y: shifts.map(s => ramanSpectrum(m, s)), type: "scatter" as const, mode: "lines" as const, name: m.name, line: { color: m.color, width: 2 } };
    });
  }, [selected]);

  const peakGains = selected.map(key => {
    const m = MATERIALS[key];
    return { ...m, key, stokesWl: shiftToWavelength(pumpWl, m.shift), gain: m.gain };
  });

  const threshold = (mat: RamanMaterial, pumpPower_W: number, length_m: number) => {
    return pumpPower_W > 0 && length_m > 0 ? mat.gain * 1e-13 * pumpPower_W * length_m : 0;
  };

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Raman Scattering" description="Spontaneous and stimulated Raman scattering cross-sections and gain spectra for common optical materials.">
            
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(MATERIALS).map(([key, m]) => (
          <button key={key} onClick={() => toggle(key)} className={`px-3 py-1.5 rounded text-sm border ${selected.includes(key) ? "border-blue-500 bg-blue-500/20 text-blue-300" : "border-gray-700 text-gray-500"}`}>{m.name}</button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-1">Pump Wavelength: {pumpWl} nm</label>
        <input type="range" aria-label="Pump Wavelength: {pumpWl} nm" min={400} max={2000} step={10} value={pumpWl} onChange={e => setPumpWl(+e.target.value)} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 border-b border-gray-800"><th className="text-left py-2">Material</th><th className="text-right py-2">Shift (cm⁻¹)</th><th className="text-right py-2">Stokes λ (nm)</th><th className="text-right py-2">g_R (×10⁻¹³ m/W)</th><th className="text-right py-2">Δν (cm⁻¹)</th></tr></thead>
          <tbody>
            {peakGains.map(p => <tr key={p.key} className="border-b border-gray-800/50"><td className="py-2">{p.name}</td><td className="text-right py-2">{p.shift}</td><td className="text-right py-2">{p.stokesWl.toFixed(1)}</td><td className="text-right py-2 font-bold">{p.gain}</td><td className="text-right py-2">{p.linewidth}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Raman Gain Spectra</h3>
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "g_R (×10⁻¹³ m/W)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.25 }, margin: { t: 20, b: 70, l: 60, r: 20 } }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">1/λ<sub>S</sub> = 1/λ<sub>p</sub> − Δν̃ | Δν̃ = Raman shift (cm⁻¹)</p>
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">g_R(ν̃) = g_R<sub>peak</sub> · exp[−(ν̃ − ν̃₀)² / 2σ²]</p>
        <p className="font-mono bg-gray-800 p-2 rounded">P<sub>S</sub> = g_R · P<sub>p</sub> · L<sub>eff</sub> · A<sub>eff</sub> | SRS threshold ≈ 16·A<sub>eff</sub> / (g_R · L<sub>eff</sub>)</p>
      </div>
    </CalculatorShell>
  );
}
