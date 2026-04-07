"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function PupilMatchingPage() {
  const [objectiveNA, setObjectiveNA] = useURLState("objectiveNA", 0.75);
  const [objectiveMag, setObjectiveMag] = useURLState("objectiveMag", 40);
  const [tubeLensFL, setTubeLensFL] = useURLState("tubeLensFL", 200); // mm
  const [eyepieceMag, setEyepieceMag] = useURLState("eyepieceMag", 10);
  const [eyePupil, setEyePupil] = useURLState("eyePupil", 4); // mm

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 200 }, (_, i) => 0.1 + i * 1.4 / 200);
    // Exit pupil diameter = (2 * tube_lens_FL * NA) / (objective_mag * eyepiece_mag)
    const exitPupils = nas.map(na => (2 * tubeLensFL * na) / (objectiveMag * eyepieceMag));
    // Eye pupil match
    const match = nas.map(na => {
      const exitP = (2 * tubeLensFL * na) / (objectiveMag * eyepieceMag);
      return Math.min(1, exitP / eyePupil);
    });
    return [
      { x: nas, y: exitPupils, type: "scatter" as const, mode: "lines" as const, name: "Exit Pupil (mm)", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(na => eyePupil), type: "scatter" as const, mode: "lines" as const, name: "Eye Pupil (mm)", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [objectiveMag, tubeLensFL, eyepieceMag, eyePupil]);

  const exitPupil = (2 * tubeLensFL * objectiveNA) / (objectiveMag * eyepieceMag);
  const matchRatio = exitPupil / eyePupil;
  const optimalNA = (eyePupil * objectiveMag * eyepieceMag) / (2 * tubeLensFL);
  const totalMag = objectiveMag * eyepieceMag;

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Pupil Matching in Microscopy" description="Exit pupil = (2·ftube·NA)/(Mobj·Meyepiece). Match to eye pupil (2-8mm) for optimal brightness.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Objective NA" value={objectiveNA} onChange={setObjectiveNA} step="0.01" />
        <ValidatedNumberInput label="Objective Mag" value={objectiveMag} onChange={setObjectiveMag} />
        <ValidatedNumberInput label="Tube Lens f (mm)" value={tubeLensFL} onChange={setTubeLensFL} />
        <ValidatedNumberInput label="Eyepiece Mag" value={eyepieceMag} onChange={setEyepieceMag} />
        <ValidatedNumberInput label="Eye Pupil (mm)" value={eyePupil} onChange={setEyePupil} step="0.5" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Exit pupil diameter = <span className="text-blue-400 font-mono">{exitPupil.toFixed(2)} mm</span></p>
        <p className="text-gray-300">Match ratio = <span className="text-blue-400 font-mono">{(matchRatio * 100).toFixed(0)}%</span></p>
        <p className="text-gray-300">Optimal NA for eye match = <span className="text-blue-400 font-mono">{optimalNA.toFixed(3)}</span></p>
        <p className="text-gray-300">Total magnification = <span className="text-blue-400 font-mono">{totalMag}×</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Objective NA", gridcolor: "#374151" }, yaxis: { title: "Pupil Diameter (mm)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
