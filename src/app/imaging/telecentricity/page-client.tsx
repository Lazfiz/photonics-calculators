"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function TelecentricityPage() {
  const [magnification, setMagnification] = useState(0.5);
  const [focalLength, setFocalLength] = useState(50); // mm
  const [objectDistance, setObjectDistance] = useState(200); // mm
  const [pupilDiameter, setPupilDiameter] = useState(10); // mm
  const [maxFieldAngle, setMaxFieldAngle] = useState(5); // degrees

  const chartData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i * maxFieldAngle) / 200);
    // Chief ray angle at image for non-telecentric lens
    const nonTeleAngle = angles.map(a => a * (1 - magnification) / (1 + magnification));
    // For telecentric: chief ray is parallel (0°)
    // Show magnification error vs field angle
    const magErrorNonTele = angles.map(a => {
      const theta = (a * Math.PI) / 180;
      return Math.abs(magnification * (1 - theta * theta * 0.01)); // approx perspective error
    });
    const magErrorTele = angles.map(() => magnification);
    return [
      { x: angles, y: magErrorNonTele, type: "scatter" as const, mode: "lines" as const, name: "Non-telecentric", line: { color: "#f87171" } },
      { x: angles, y: magErrorTele, type: "scatter" as const, mode: "lines" as const, name: "Telecentric (constant)", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [magnification, focalLength, objectDistance, pupilDiameter, maxFieldAngle]);

  const objectNA = Math.sin(Math.atan(pupilDiameter / (2 * objectDistance)));
  const imageDistance = objectDistance * magnification / (1 - magnification);
  const telecentricDepth = pupilDiameter / (2 * objectNA) * magnification;
  const chiefRayAngle = maxFieldAngle * (1 - magnification) / (1 + magnification);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Telecentric Lens Design" description="Telecentric lenses maintain constant magnification regardless of object distance. Chief rays are parallel to optical axis.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Magnification" value={magnification} onChange={setMagnification} step="0.1" />
        <ValidatedNumberInput label="Focal Length (mm)" value={focalLength} onChange={setFocalLength} />
        <ValidatedNumberInput label="Object Distance (mm)" value={objectDistance} onChange={setObjectDistance} />
        <ValidatedNumberInput label="Entrance Pupil (mm)" value={pupilDiameter} onChange={setPupilDiameter} />
        <ValidatedNumberInput label="Max Field Angle (°)" value={maxFieldAngle} onChange={setMaxFieldAngle} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Image distance = <span className="text-blue-400 font-mono">{imageDistance.toFixed(1)} mm</span></p>
        <p className="text-gray-300">Object NA = <span className="text-blue-400 font-mono">{objectNA.toFixed(4)}</span></p>
        <p className="text-gray-300">Chief ray angle (non-tele) @ {maxFieldAngle}° = <span className="text-blue-400 font-mono">{chiefRayAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Telecentric depth of field ≈ <span className="text-blue-400 font-mono">{telecentricDepth.toFixed(1)} mm</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Object Field Angle (°)", gridcolor: "#374151" }, yaxis: { title: "Effective Magnification", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} />
    </CalculatorShell>
  );
}
