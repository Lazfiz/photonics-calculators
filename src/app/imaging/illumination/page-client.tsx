"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function IlluminationPage() {
  const [objMag, setObjMag] = useURLState("objMag", 40);
  const [objNa, setObjNa] = useURLState("objNa", 0.95);
  const [tubeFocal, setTubeFocal] = useURLState("tubeFocal", 160); // mm
  const [condenserNa, setCondenserNa] = useURLState("condenserNa", 0.9);
  const [fieldDiaphragm, setFieldDiaphragm] = useURLState("fieldDiaphragm", 20); // mm
  const [condenserFocal, setCondenserFocal] = useURLState("condenserFocal", 40); // mm

  const results = useMemo(() => {
    const objFocal = tubeFocal / objMag;
    const fieldStopDiam = fieldDiaphragm / objMag;
    const sampleFov = fieldDiaphragm * 1e-3 / objMag * 1e6; // µm
    const naRatio = condenserNa / objNa;
    const fillFactor = Math.min(naRatio, 1.0);
    const koehlerConjugate = tubeFocal + objFocal;
    const condenserMag = tubeFocal / condenserFocal;
    const collectorImageSize = fieldDiaphragm / condenserMag;
    // Numerical aperture of condenser at sample
    const condenserHalfAngle = Math.asin(Math.min(condenserNa / 1.52, 1)) * 180 / Math.PI;
    const resolutionAtSample = 550e-9 / (objNa + condenserNa) * 1e9;
    return { objFocal, sampleFov, naRatio, fillFactor, koehlerConjugate, condenserMag, collectorImageSize, condenserHalfAngle, resolutionAtSample };
  }, [objMag, objNa, tubeFocal, condenserNa, fieldDiaphragm, condenserFocal]);

  const plotData = useMemo(() => {
    const ratios = [];
    const resVals = [];
    for (let r = 0.2; r <= 1.5; r += 0.01) {
      ratios.push(r);
      resVals.push(550 / (objNa + objNa * r));
    }
    return [
      { x: ratios, y: resVals, name: "Resolution (nm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: [1], y: [550 / (2 * objNa)], name: "NA_cond = NA_obj", mode: "markers", marker: { color: "#f87171", size: 10 }, type: "scatter" },
    ];
  }, [objNa]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Köhler Illumination Calculator" description="Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective magnification</label>
            <ValidatedNumberInput label="Objective magnification" value={objMag} onChange={setObjMag} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <ValidatedNumberInput label="Objective NA" value={objNa} onChange={setObjNa} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tube length (mm)</label>
            <ValidatedNumberInput label="Tube length (mm)" value={tubeFocal} onChange={setTubeFocal} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Condenser NA</label>
            <ValidatedNumberInput label="Condenser NA" value={condenserNa} onChange={setCondenserNa} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Field diaphragm (mm)</label>
            <ValidatedNumberInput label="Field diaphragm (mm)" value={fieldDiaphragm} onChange={setFieldDiaphragm} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Condenser focal length (mm)</label>
            <ValidatedNumberInput label="Condenser focal length (mm)" value={condenserFocal} onChange={setCondenserFocal} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Objective focal length</span><span className="font-mono">{results.objFocal.toFixed(1)} mm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Sample FOV</span><span className="font-mono text-blue-400">{results.sampleFov.toFixed(0)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">NA ratio (cond/obj)</span><span className="font-mono text-green-400">{results.naRatio.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fill factor</span><span className="font-mono text-yellow-400">{results.fillFactor.toFixed(2)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Condenser magnification</span><span className="font-mono">{results.condenserMag.toFixed(1)}×</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Condenser half-angle</span><span className="font-mono">{results.condenserHalfAngle.toFixed(1)}°</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective resolution</span><span className="font-mono text-purple-400">{results.resolutionAtSample.toFixed(1)} nm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>f_obj = tube_length / M</p>
            <p>FOV = field_stop / M</p>
            <p>Resolution: d = λ/(NA_obj + NA_cond)</p>
            <p>Fill factor = NA_cond/NA_obj (ideal ≈ 1)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Resolution vs Condenser/Objective NA Ratio</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "NA_cond / NA_obj", gridcolor: "#333" }, yaxis: { title: "Resolution (nm)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
