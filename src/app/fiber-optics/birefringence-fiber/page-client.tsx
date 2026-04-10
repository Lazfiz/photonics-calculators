"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function BirefringenceCalculator() {
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463);
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [ellipticity, setEllipticity] = useURLState("ellipticity", 0.98); // b/a ratio
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [stressAnisotropy, setStressAnisotropy] = useURLState("stressAnisotropy", 0); // nm

  // V-number (convert wavelength nm→μm to match core radius units)
  const na = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  const a = coreRadius; // μm
  const lambda = wavelength; // nm
  const vNumber = (2 * Math.PI * a * na) / (wavelength / 1000);

  // Geometric birefringence (elliptical core)
  const geometricBirefringence = useMemo(() => {
    if (ellipticity >= 1) return 0;
    const delta = (coreIndex - claddingIndex) / coreIndex;
    const e = Math.sqrt(1 - ellipticity ** 2);
    const B = delta * (e ** 2) * (0.25 + 0.1 * e ** 2);
    return B;
  }, [coreIndex, claddingIndex, ellipticity]);

  // Stress-induced birefringence
  const stressBirefringence = useMemo(() => {
    if (stressAnisotropy === 0) return 0;
    return stressAnisotropy / wavelength;
  }, [stressAnisotropy, wavelength]);

  const totalBirefringence = geometricBirefringence + stressBirefringence;

  // Beat length
  const beatLength = useMemo(() => {
    if (totalBirefringence === 0) return Infinity;
    return wavelength / totalBirefringence;
  }, [wavelength, totalBirefringence]);

  // Polarization mode dispersion (ps/km) — DGD per unit length = B / c
  // c = 3e8 m/s = 3e5 km/s; convert s/km → ps/km: × 1e12
  const pmd = useMemo(() => {
    if (totalBirefringence === 0) return 0;
    return (totalBirefringence * 1e12) / 3e5; // ps/km
  }, [totalBirefringence]);

  // Plot: birefringence vs ellipticity
  const plotData = useMemo(() => {
    const ellipticities: number[] = [];
    const bGeo: number[] = [];
    const bTotal: number[] = [];
    const beatLengths: (number | null)[] = [];
    const delta = (coreIndex - claddingIndex) / coreIndex;

    for (let e = 0.7; e <= 1.0; e += 0.005) {
      ellipticities.push(e);
      const ecc = Math.sqrt(1 - e ** 2);
      const bg = delta * (ecc ** 2) * (0.25 + 0.1 * ecc ** 2);
      bGeo.push(bg * 1e4);
      const bt = bg + stressBirefringence;
      bTotal.push(bt * 1e4);
      if (bt > 0) beatLengths.push(wavelength / bt / 1000);
      else beatLengths.push(null);
    }

    return [
      {
        x: ellipticities, y: bGeo, type: "scatter" as const, mode: "lines" as const,
        name: "Geometric B", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: ellipticities, y: bTotal, type: "scatter" as const, mode: "lines" as const,
        name: "Total B", line: { color: "#f59e0b", width: 2 },
      },
      {
        x: [ellipticity], y: [totalBirefringence * 1e4], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 },
      },
    ];
  }, [coreIndex, claddingIndex, ellipticity, stressBirefringence, wavelength, totalBirefringence]);

  const layout = {
    title: "Birefringence vs Core Ellipticity",
    xaxis: { title: "Ellipticity (b/a)", gridcolor: "#374151" },
    yaxis: { title: "Birefringence (×10⁻⁴)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Core Index n₁</label>
              <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} step="0.0001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cladding Index n₂</label>
              <ValidatedNumberInput label="Cladding Index n₂" value={claddingIndex} onChange={setCladdingIndex} step="0.0001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Radius (μm)</label>
              <ValidatedNumberInput label="Core Radius (μm)" value={coreRadius} onChange={setCoreRadius} min={0.1} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Ellipticity (b/a)</label>
              <ValidatedNumberInput label="Core Ellipticity (b/a)" value={ellipticity} onChange={setEllipticity} min={0.5} max={1} step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stress OPD (nm)</label>
              <ValidatedNumberInput label="Stress OPD (nm)" value={stressAnisotropy} onChange={setStressAnisotropy} step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={100} step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">NA:</span><span className="font-mono">{na.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">V-number:</span><span className="font-mono">{vNumber.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Geometric B:</span><span className="font-mono text-blue-400">{(geometricBirefringence * 1e4).toFixed(4)} ×10⁻⁴</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Stress B:</span><span className="font-mono text-yellow-400">{(stressBirefringence * 1e4).toFixed(4)} ×10⁻⁴</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total B:</span><span className="font-mono text-lg text-green-400">{(totalBirefringence * 1e4).toFixed(4)} ×10⁻⁴</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Beat length:</span><span className="font-mono">{beatLength === Infinity ? "∞" : (beatLength / 1e6).toFixed(3) + " mm"}</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">B_geo ≈ Δ · e² · (0.25 + 0.1·e²)</p>
              <p className="font-mono text-sm mt-1">B_stress = Δn_stress / λ</p>
              <p className="font-mono text-sm mt-1">L_beat = λ / B</p>
              <p className="font-mono text-sm mt-1">e = √(1 - (b/a)²)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
