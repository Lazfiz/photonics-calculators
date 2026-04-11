"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SuperResolutionPage() {
  const [na, setNa] = useURLState("na", 1.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 580);
  const [n, setN] = useURLState("n", 1.52);
  const [stedDepletion, setStedDepletion] = useURLState("stedDepletion", 30); // I_dep/I_sat ratio
  const [palmPhotons, setPalmPhotons] = useURLState("palmPhotons", 5000);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const abbe = 0.61 * lam / na * 1e9;
    const axialAbbe = 2 * n * lam / (na * na) * 1e9;
    let stedLat = null, stedAx = null;
    if (stedDepletion > 0) {
      const factor = 1 / Math.sqrt(1 + stedDepletion);
      stedLat = abbe * factor;
      // Note: 2D STED only improves lateral resolution; axial stays diffraction-limited
    }
    const palmRes = lam / (2 * na * Math.sqrt(palmPhotons)) * 1e9;
    const palmAxRes = 2 * lam * n / (na * na * Math.sqrt(palmPhotons)) * 1e9;
    return { abbe, axialAbbe, stedLat, palmRes, palmAxRes };
  }, [na, wavelength, n, stedDepletion, palmPhotons]);

  const plotData = useMemo(() => {
    const photons = [];
    const palmLats = [];
    const stedDepls = [];
    const stedLats = [];
    const lam = wavelength * 1e-9;
    const abbe = 0.61 * lam / na * 1e9;
    for (let p = 100; p <= 50000; p += 200) {
      photons.push(p);
      palmLats.push(lam / (2 * na * Math.sqrt(p)) * 1e9);
    }
    for (let d = 0; d <= 100; d += 1) {
      stedDepls.push(d);
      stedLats.push(abbe / Math.sqrt(1 + d));
    }
    return [
      { x: photons, y: palmLats, name: "PALM/STORM lateral", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", xaxis: "x", yaxis: "y" },
      { x: stedDepls, y: stedLats, name: "STED lateral", line: { color: "#f87171" }, type: "scatter", mode: "lines", xaxis: "x2", yaxis: "y" },
    ];
  }, [na, wavelength, n]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Super-Resolution Calculator" description="STED and PALM/STORM resolution limits beyond the diffraction barrier.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <ValidatedNumberInput label="NA" value={na} onChange={setNa} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emission wavelength (nm)</label>
            <ValidatedNumberInput label="Emission wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <ValidatedNumberInput label="Refractive index (n)" value={n} onChange={setN} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">STED I_dep / I_sat</label>
            <ValidatedNumberInput label="STED I_dep / I_sat" value={stedDepletion} onChange={setStedDepletion} min={0} max={200} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">PALM photons detected</label>
            <ValidatedNumberInput label="PALM photons detected" value={palmPhotons} onChange={setPalmPhotons} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffraction limit (lateral)</span><span className="font-mono">{results.abbe.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Diffraction limit (axial)</span><span className="font-mono">{results.axialAbbe.toFixed(1)} nm</span></div>
          {results.stedLat && (
              <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">STED lateral (2D)</span><span className="font-mono text-red-400">{results.stedLat.toFixed(1)} nm</span></div>
          )}
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">PALM/STORM lateral</span><span className="font-mono text-blue-400">{results.palmRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">PALM/STORM axial</span><span className="font-mono text-purple-400">{results.palmAxRes.toFixed(1)} nm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Abbe: d = 0.61λ/NA</p>
            <p>STED: d_STED = d_Abbe / √(1 + I_dep/I_sat) (lateral only)</p>
            <p>PALM: d = λ/(2·NA·√N_photons)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Resolution Improvement</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "PALM photons detected", gridcolor: "#333", side: "bottom" },
          xaxis2: { title: "STED I_dep / I_sat", gridcolor: "#333", overlaying: "x", side: "top", titlefont: { color: "#f87171" } },
          yaxis: { title: "Lateral resolution (nm)", gridcolor: "#333" },
          legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 60, b: 60 }
        }} />
      </div>
    </CalculatorShell>
  );
}
