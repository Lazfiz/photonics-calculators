"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function DepthOfFieldPage() {
  const [na, setNa] = useURLState("na", 0.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [magnification, setMagnification] = useURLState("magnification", 40);
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 6.5);
  const [n, setN] = useURLState("n", 1.52);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3; // nm → µm
    const diffraction = (lambda_um * n) / (na * na);
    const detector = (n * pixelSize) / (magnification * na);
    const total = diffraction + detector;
    return { diffraction, detector, total };
  }, [na, wavelength, magnification, pixelSize, n]);

  const plotData = useMemo(() => {
    const nas: number[] = [];
    const diffs: number[] = [];
    const dets: number[] = [];
    const totals: number[] = [];
    for (let x = 0.05; x <= 1.5; x += 0.01) {
      nas.push(x);
      const lam = wavelength * 1e-3;
      const d = (lam * n) / (x * x);
      const e = (n * pixelSize) / (magnification * x);
      diffs.push(d);
      dets.push(e);
      totals.push(d + e);
    }
    return [
      { x: nas, y: totals, type: "scatter" as const, mode: "lines" as const, name: "Total DOF", line: { color: "#60a5fa" } },
      { x: nas, y: diffs, type: "scatter" as const, mode: "lines" as const, name: "Diffraction", line: { color: "#34d399", dash: "dash" } },
      { x: nas, y: dets, type: "scatter" as const, mode: "lines" as const, name: "Detector", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [wavelength, n, pixelSize, magnification]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Depth of Field" description="Microscope depth of field including diffraction and detector contributions.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <ValidatedNumberInput label="Numerical Aperture (NA)" value={na} onChange={setNa} min={0.01} max={1.8} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={2000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Magnification (×)</label>
            <ValidatedNumberInput label="Magnification (×)" value={magnification} onChange={setMagnification} min={1} max={200} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel size (µm)</label>
            <ValidatedNumberInput label="Pixel size (µm)" value={pixelSize} onChange={setPixelSize} min={0.1} max={50} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <ValidatedNumberInput label="Refractive index (n)" value={n} onChange={setN} min={1} max={2} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Diffraction contribution</span>
            <span className="font-mono text-green-400">{results.diffraction.toFixed(3)} µm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Detector contribution</span>
            <span className="font-mono text-yellow-400">{results.detector.toFixed(3)} µm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Total DOF</span>
            <span className="font-mono text-blue-400 text-lg font-bold">{results.total.toFixed(3)} µm</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>DOF = λn / NA² + ne / (M·NA)</p>
            <p>λ = wavelength, n = refractive index, e = pixel size, M = magnification</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">DOF vs NA</h2>
        <ChartPanel data={plotData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#ccc" },
            xaxis: { title: "NA", gridcolor: "#333" },
            yaxis: { title: "DOF (µm)", gridcolor: "#333" },
            legend: { font: { size: 10 } },
            margin: { l: 60, r: 20, t: 20, b: 40 },
          }}
         
         
        />
      </div>
    </CalculatorShell>
  );
}
