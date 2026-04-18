"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function TelecentricityPage() {
  const [magnification, setMagnification] = useURLState("magnification", 0.5);
  const [objectDistance, setObjectDistance] = useURLState("objectDistance", 200); // mm
  const [pupilDiameter, setPupilDiameter] = useURLState("pupilDiameter", 10); // mm
  const [maxFieldAngle, setMaxFieldAngle] = useURLState("maxFieldAngle", 5); // degrees

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i * maxFieldAngle) / 200);
    // Chief ray angle at image for non-telecentric lens: tan(θ') = tan(θ) / m
    const nonTeleAngle = angles.map(a => Math.atan(Math.tan(a * Math.PI / 180) / magnification) * 180 / Math.PI);
    // Show magnification variation with defocus for non-telecentric vs telecentric
    // Non-telecentric: magnification changes with defocus Δz as m_eff ≈ m·(1 + Δz·tan(θ')/y)
    // Simplified: relative error Δm/m ≈ Δz/(s_o·(1+m)²) for on-axis point
    // For off-axis, chief ray angle θ' = atan(tan(θ)/m) causes image shift with defocus
    const defocusRange = Array.from({ length: 200 }, (_, i) => -maxFieldAngle * 2 + (i * maxFieldAngle * 4) / 200); // mm
    const magErrorNonTele = defocusRange.map(dz => {
      const theta = maxFieldAngle * Math.PI / 180;
      const thetaPrime = Math.atan(Math.tan(theta) / magnification);
      const imageShift = Math.abs(dz * Math.tan(thetaPrime));
      const nominalImageHeight = Math.abs(objectDistance * Math.tan(theta) * magnification);
      return nominalImageHeight > 0 ? magnification * (1 + imageShift / nominalImageHeight) : magnification;
    });
    const magErrorTele = defocusRange.map(() => magnification);
    return [
      { x: defocusRange, y: magErrorNonTele, type: "scatter" as const, mode: "lines" as const, name: "Non-telecentric", line: { color: "#f87171" } },
      { x: defocusRange, y: magErrorTele, type: "scatter" as const, mode: "lines" as const, name: "Telecentric (constant)", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [magnification, maxFieldAngle]);

  const objectNA = Math.sin(Math.atan(pupilDiameter / (2 * objectDistance)));
  const imageDistance = objectDistance * magnification;
  const focalLength = imageDistance * objectDistance / (imageDistance + objectDistance);
  // Geometric depth of field: DoF ≈ 2·NA·s_o for non-telecentric, constant magnification for telecentric
  // Using circle of confusion = pixel/2 (0.5 pixel blur tolerance)
  const fNumber = 1 / (2 * objectNA);
  const telecentricDepth = 2 * fNumber * (1 + magnification) / (magnification * magnification) * 1000; // µm
  const chiefRayAngle = Math.atan(Math.tan(maxFieldAngle * Math.PI / 180) / magnification) * 180 / Math.PI;

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Telecentric Lens Design" description="Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Magnification" value={magnification} onChange={setMagnification} step="0.1" />
        <ValidatedNumberInput label="Object Distance (mm)" value={objectDistance} onChange={setObjectDistance} />
        <ValidatedNumberInput label="Entrance Pupil (mm)" value={pupilDiameter} onChange={setPupilDiameter} />
        <ValidatedNumberInput label="Max Field Angle (°)" value={maxFieldAngle} onChange={setMaxFieldAngle} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Focal length (derived) = <span className="text-blue-400 font-mono">{focalLength.toFixed(1)} mm</span></p>
        <p className="text-gray-300">Image distance = <span className="text-blue-400 font-mono">{imageDistance.toFixed(1)} mm</span></p>
        <p className="text-gray-300">Object NA = <span className="text-blue-400 font-mono">{objectNA.toFixed(4)}</span></p>
        <p className="text-gray-300">Chief ray angle (non-tele) @ {maxFieldAngle}° = <span className="text-blue-400 font-mono">{chiefRayAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Telecentric depth tolerance ≈ <span className="text-blue-400 font-mono">{telecentricDepth.toFixed(0)} µm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Object Defocus Δz (mm)", gridcolor: "#374151" }, yaxis: { title: "Effective Magnification", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
