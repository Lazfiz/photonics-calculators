"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function KerrLensPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm
  const [beamWaist, setBeamWaist] = useURLState("beamWaist", 50); // µm
  const [n2, setN2] = useURLState("n2", 3.2); // ×10⁻¹⁶ cm²/W (Ti:Sapphire)
  const [power, setPower] = useURLState("power", 1); // W
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 2); // mm
  const [n0, setN0] = useURLState("n0", 1.76); // refractive index

  const k = 2 * Math.PI / (wavelength * 1e-3); // 1/µm
  const Pcr = 3.77 * Math.pow(wavelength * 1e-3, 2) / (8 * Math.PI * n0 * n2 * 1e-4); // critical power in W (n2 in cm²/W → µm²/W)

  // Effective focal length of Kerr lens
  const fKerr = n0 * Math.PI * Math.pow(beamWaist, 4) / (4 * n2 * 1e-4 * power * crystalLength * 1e3);

  // Beam radius change vs power
  const chartData = useMemo(() => {
    const powers = Array.from({ length: 200 }, (_, i) => 0.01 + i * 5 / 200);
    const wPerturbed = powers.map(P => {
      const fk = n0 * Math.PI * Math.pow(beamWaist, 4) / (4 * n2 * 1e-4 * P * crystalLength * 1e3);
      const lensEffect = 1 / (1 + Math.pow(crystalLength * 1e3 / (2 * fk), 2));
      return beamWaist * (1 - 0.5 * lensEffect * n2 * 1e-4 * P * crystalLength * 1e3 / (n0 * Math.PI * Math.pow(beamWaist, 2)));
    });

    return [
      { x: powers, y: wPerturbed, type: "scatter", mode: "lines", name: "Beam waist w(P)", line: { color: "#60a5fa", width: 2 } },
      { x: [Pcr, Pcr], y: [wPerturbed[0] * 0.95, wPerturbed[wPerturbed.length - 1] * 1.05], type: "scatter", mode: "lines", name: "P_crit", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [wavelength, beamWaist, n2, crystalLength, n0, Pcr]);

  // GDD from Kerr effect
  const gdd = n2 * 1e-4 * power * crystalLength * 1e3 / (Math.PI * Math.pow(beamWaist, 2) * 3e8); // fs²
  const selfPhase = (2 * Math.PI / (wavelength * 1e-3)) * n2 * 1e-4 * power * crystalLength * 1e3; // rad

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Power (W)", gridcolor: "#374151" },
    yaxis: { title: "Beam waist (µm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Kerr Lens Mode Locking" description="Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.">
            
      {/* Formulas */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">n(I)</span> = n₀ + n₂ · I</p>
        <p><span className="text-blue-400">P_crit</span> = 3.77 λ² / (8π n₀ n₂)</p>
        <p><span className="text-blue-400">f_Kerr</span> ≈ n₀ π w₀⁴ / (4 n₂ P L)</p>
        <p><span className="text-blue-400">Δφ_NL</span> = k · n₂ · I · L</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Waist w₀ (µm)" value={beamWaist} onChange={setBeamWaist} step="any" />
        <ValidatedNumberInput label="n₀ (linear index)" value={n0} onChange={setN0} step="0.01" />
        <ValidatedNumberInput label="n₂ (×10⁻¹⁶ cm²/W)" value={n2} onChange={setN2} step="0.1" />
        <ValidatedNumberInput label="Power (W)" value={power} onChange={setPower} step="any" />
        <ValidatedNumberInput label="Crystal Length (mm)" value={crystalLength} onChange={setCrystalLength} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Critical Power P<sub>crit</sub></p>
          <p className="text-xl font-bold text-blue-400">{Pcr.toFixed(2)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Kerr Focal Length</p>
          <p className="text-xl font-bold text-green-400">{fKerr > 1e6 ? "∞" : (fKerr < 1e3 ? fKerr.toFixed(1) + " µm" : (fKerr / 1e3).toFixed(2) + " mm")}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Self-Phase Δφ<sub>NL</sub></p>
          <p className="text-xl font-bold text-orange-400">{selfPhase.toFixed(4)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">P / P<sub>crit</sub></p>
          <p className="text-xl font-bold text-purple-400">{(power / Pcr * 1e6).toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={chartData} layout={plotLayout} />
      </div>
    </CalculatorShell>
  );
}
