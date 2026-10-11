"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { apply, linearRetarder, linearState, stokesFromJones, type JonesVector } from "../../../physics/polarization/jones";
import { CONVENTION_NOTE, degOrDash, fix, stateLabel } from "../../../components/polarization-format";
import { ellipseAngles } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

/** The ellipse Re{E e^{iωt}} traced over one period, closed. */
function ellipsePoints(E: JonesVector, n = 200): { x: number[]; y: number[] } {
  const t = Array.from({ length: n + 1 }, (_, i) => (i / n) * 2 * Math.PI);
  return {
    x: t.map((tt) => E[0].re * Math.cos(tt) - E[0].im * Math.sin(tt)),
    y: t.map((tt) => E[1].re * Math.cos(tt) - E[1].im * Math.sin(tt)),
  };
}

export default function RetarderPage() {
  const [retardanceDeg, setRetardanceDeg] = useURLState("retardanceDeg", 90);
  const [fastAxisDeg, setFastAxisDeg] = useURLState("fastAxisDeg", 0);
  const [inputPolDeg, setInputPolDeg] = useURLState("inputPolDeg", 45);

  const { Ein, Eout, S } = useMemo(() => {
    const Ein = linearState(inputPolDeg * DEG);
    const Eout = apply(linearRetarder(retardanceDeg * DEG, fastAxisDeg * DEG), Ein);
    return { Ein, Eout, S: stokesFromJones(Eout) };
  }, [retardanceDeg, fastAxisDeg, inputPolDeg]);

  const chartData = useMemo(() => {
    const inEllipse = ellipsePoints(Ein);
    const outEllipse = ellipsePoints(Eout);
    return [
      { x: inEllipse.x, y: inEllipse.y, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#60a5fa", dash: "dash" } },
      { x: outEllipse.x, y: outEllipse.y, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#f87171" } },
    ];
  }, [Ein, Eout]);

  const { psi, chi } = ellipseAngles(S);

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Retardance (°)" value={retardanceDeg} onChange={setRetardanceDeg} step="1" />
        <ValidatedNumberInput label="Fast Axis (°)" value={fastAxisDeg} onChange={setFastAxisDeg} step="1" />
        <ValidatedNumberInput label="Input Pol. (°)" value={inputPolDeg} onChange={setInputPolDeg} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><p className="text-xs text-gray-500">Intensity</p><p className="font-mono text-blue-400">{fix(S[0], 3)}</p></div>
        <div><p className="text-xs text-gray-500">State</p><p className="font-mono text-blue-400">{stateLabel(S)}</p></div>
        <div><p className="text-xs text-gray-500">Ellipticity angle χ</p><p className="font-mono text-blue-400">{degOrDash(chi)}</p></div>
        <div><p className="text-xs text-gray-500">Orientation ψ</p><p className="font-mono text-blue-400">{degOrDash(psi)}</p></div>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Stokes Parameters</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div><span className="text-gray-400">S₀</span><br/><span className="text-blue-400 font-mono">{fix(S[0], 3)}</span></div>
          <div><span className="text-gray-400">S₁</span><br/><span className="text-blue-400 font-mono">{fix(S[1], 3)}</span></div>
          <div><span className="text-gray-400">S₂</span><br/><span className="text-blue-400 font-mono">{fix(S[2], 3)}</span></div>
          <div><span className="text-gray-400">S₃</span><br/><span className="text-blue-400 font-mono">{fix(S[3], 3)}</span></div>
        </div>
        <p className="mt-3 text-xs text-gray-500">{CONVENTION_NOTE}</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Ex", gridcolor: "#374151", scaleanchor: "y" },
        yaxis: { title: "Ey", gridcolor: "#374151" },
        margin: { t: 30, b: 50, l: 60, r: 30 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />

      <div className="bg-gray-900 rounded p-4 mt-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>Jones matrix: R(−θ) · diag(1, e<sup>−iΓ</sup>) · R(θ), R(θ) = [[cos θ, sin θ], [−sin θ, cos θ]]</p>
        <p>Γ = retardance, θ = fast axis angle</p>
        <p>Stokes: S₀ = |Eₓ|² + |E_y|², S₁ = |Eₓ|² − |E_y|²</p>
        <p>S₂ = 2 Re(Eₓ* E_y), S₃ = 2 Im(Eₓ* E_y)</p>
      </div>
    </>
  );
}
