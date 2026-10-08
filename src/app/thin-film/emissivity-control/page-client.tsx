"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c1_radiation, c2_radiation } from "../../../physics/constants";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function EmissivityControlPage() {
  const [nH, setNH] = useURLState("nH", 1.9);
  const [nL, setNL] = useURLState("nL", 1.1);
  const [nSub, setNSub] = useURLState("nSub", 3.5);
  const [designWl, setDesignWl] = useURLState("designWl", 10000);
  const [pairs, setPairs] = useURLState("pairs", 5);
  const [lowESilver] = useState(0.02);

  // Kirchhoff's law: emissivity = absorptance at thermal equilibrium
  // For opaque surface: ε = 1 - R (normal incidence)
  // Low-E coating: thin Ag layer + dielectric stacks

  const tmm = useMemo(() => {
    const N = 500;
    // Mid-IR range (2.5 - 25 µm) — thermal radiation
    const wls = Array.from({ length: N }, (_, i) => 2500 + i * 22500 / N);

    // Quarter-wave stack air | (LH)^p | sub (H on the substrate)
    const indices = Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nL : nH));
    const layers = quarterWaveLayers(indices, designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: 1, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));

    return { wls, R };
  }, [nH, nL, nSub, designWl, pairs]);

  // Effective emissivity: weighted by Planck function at 300K
  const T = 300;
  const emissivity = useMemo(() => {
    let num = 0, den = 0;
    tmm.wls.forEach((wlNm, i) => {
      const wlM = wlNm * 1e-9;
      const B = c1_radiation / (Math.pow(wlM, 5) * Math.expm1(c2_radiation / (wlM * T)));
      const e = 1 - tmm.R[i]; // Kirchhoff
      den += B;
      num += B * e;
    });
    return den > 0 ? num / den : 0;
  }, [tmm]);

  const E = tmm.R.map(r => 1 - r);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Emissivity Control" description="Low-emissivity (Low-E) coating for thermal insulation — Kirchhoff's law: ε = 1 - R.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>high</sub> (dielectric)</>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub> (dielectric)</>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Pairs" value={pairs} onChange={setPairs} min={1} max={20} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Effective Emissivity (300 K)</p>
          <p className="text-3xl font-bold text-orange-400">{emissivity.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Avg Reflectance (mid-IR)</p>
          <p className="text-3xl font-bold text-blue-400">{(tmm.R.reduce((a, b) => a + b) / tmm.R.length * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                                      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls.map(w => w / 1000), y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
          { x: tmm.wls.map(w => w / 1000), y: E, type: "scatter", mode: "lines", name: "Emissivity (ε)", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (µm)", gridcolor: "#374151" },
          yaxis: { title: "R / ε", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
