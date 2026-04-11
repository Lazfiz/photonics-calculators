"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PolarizationScramblingPage() {
  const [numSegments, setNumSegments] = useURLState("numSegments", 100);
  const [sweepMode, setSweepMode] = useState<"uniform" | "gaussian" | "random">("uniform");
  const [inputPol, setInputPol] = useState<"linear" | "circular" | "elliptical">("linear");
  const [sweepRate, setSweepRate] = useURLState("sweepRate", 100); // Hz
  const [detectionRate, setDetectionRate] = useURLState("detectionRate", 10000); // Hz

  const [ellipticity, setEllipticity] = useURLState("ellipticity", 0.5); // for elliptical input

  // Simulate polarization scrambling
  const data = useMemo(() => {
    const inputAngle = Math.random() * 360;
    const inputS3 = inputPol === "circular" ? 1 : inputPol === "elliptical" ? ellipticity : 0;
    const inputS1 = inputPol === "linear" ? Math.cos(2 * inputAngle * Math.PI / 180) : 0;
    const inputS2 = inputPol === "linear" ? Math.sin(2 * inputAngle * Math.PI / 180) : 0;

    // Generate scrambling pattern
    const N = numSegments;
    const angles: number[] = [];
    const s1: number[] = [];
    const s2: number[] = [];
    const s3: number[] = [];
    const dop: number[] = [];
    const times: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i / N;
      times.push(t * 1000 / sweepRate); // in ms
      let theta: number;
      switch (sweepMode) {
        case "uniform":
          theta = (360 * i) / N;
          break;
        case "gaussian":
          theta = gaussianRandom() * 360;
          break;
        case "random":
          theta = Math.random() * 360;
          break;
      }
      angles.push(theta);

      // Rotated Stokes vector
      // Mueller rotation matrix for Stokes parameters (rotation by 2θ about S3 axis)
      // M_rot(2θ) = [[1,0,0,0],[0,cos2θ,sin2θ,0],[0,-sin2θ,cos2θ,0],[0,0,0,1]]
      const c2 = Math.cos(2 * theta * Math.PI / 180);
      const s2 = Math.sin(2 * theta * Math.PI / 180);
      s1.push(inputS1 * c2 + inputS2 * s2);
      s2.push(-inputS1 * s2 + inputS2 * c2);
      s3.push(inputS3);
      dop.push(1.0); // each segment is fully polarized
    }

    // Time-averaged Stokes (what detector sees)
    const avgS1 = s1.reduce((a, b) => a + b, 0) / N;
    const avgS2 = s2.reduce((a, b) => a + b, 0) / N;
    const avgS3 = s3.reduce((a, b) => a + b, 0) / N;
    const avgDoP = Math.sqrt(avgS1 ** 2 + avgS2 ** 2 + avgS3 ** 2);

    // Residual polarization vs number of segments
    const residualVsN: { n: number; dop: number }[] = [];
    for (let n = 1; n <= 200; n++) {
      const step = Math.max(1, Math.floor(N / n));
      let rs1 = 0, rs2 = 0, rs3 = 0, count = 0;
      for (let i = 0; i < N; i += step) {
        rs1 += s1[i]; rs2 += s2[i]; rs3 += s3[i]; count++;
      }
      rs1 /= count; rs2 /= count; rs3 /= count;
      residualVsN.push({ n, dop: Math.sqrt(rs1 ** 2 + rs2 ** 2 + rs3 ** 2) });
    }

    return { angles, s1, s2, s3, dop, times, avgS1, avgS2, avgS3, avgDoP, residualVsN };
  }, [numSegments, sweepMode, inputPol, ellipticity, sweepRate]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 50, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Polarization Scrambling" description="Simulate polarization scrambling: how randomizing polarization state reduces residual polarization.">
            
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Scrambler Settings</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Sweep mode</label>
            <div role="group" aria-label="Options" className="flex gap-2">
              {(["uniform", "gaussian", "random"] as const).map((m) => (
                <button key={m} onClick={() => setSweepMode(m)}
                  className={`px-3 py-1 text-xs rounded ${sweepMode === m ? "bg-blue-600" : "bg-gray-800 border border-gray-700"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Number of segments</label>
            <ValidatedNumberInput label="Number of segments" value={numSegments} onChange={setNumSegments} />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Sweep rate (Hz)</label>
            <ValidatedNumberInput label="Sweep rate (Hz)" value={sweepRate} onChange={setSweepRate} />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Input polarization</label>
            <div role="group" aria-label="Options" className="flex gap-2">
              {(["linear", "circular", "elliptical"] as const).map((p) => (
                <button key={p} onClick={() => setInputPol(p)}
                  className={`px-3 py-1 text-xs rounded ${inputPol === p ? "bg-blue-600" : "bg-gray-800 border border-gray-700"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {inputPol === "elliptical" && (
            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">Ellipticity</label>
              <input type="range" aria-label="Ellipticity" min={-1} max={1} step={0.01} value={ellipticity}
                onChange={(e) => setEllipticity(parseFloat(e.target.value))} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Parameters vs Time</h2>
          <ChartPanel data={[
            { x: data.times, y: data.s1, name: "S₁", type: "scatter", mode: "lines", line: { color: "#ef4444", width: 1 } },
            { x: data.times, y: data.s2, name: "S₂", type: "scatter", mode: "lines", line: { color: "#22c55e", width: 1 } },
            { x: data.times, y: data.s3, name: "S₃", type: "scatter", mode: "lines", line: { color: "#3b82f6", width: 1 } },
          ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Time (ms)" } }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Scrambler Angle vs Time</h2>
          <ChartPanel data={[
            { x: data.times, y: data.angles, type: "scatter", mode: "lines", line: { color: "#a855f7" } },
          ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Time (ms)" }, yaxis: { ...plotLayout.yaxis, title: "Angle (°)" } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Residual DoP vs Segments</h2>
          <ChartPanel data={[
            { x: data.residualVsN.map((r) => r.n), y: data.residualVsN.map((r) => r.dop), type: "scatter", mode: "lines", line: { color: "#f59e0b" } },
          ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Number of segments" }, yaxis: { ...plotLayout.yaxis, title: "Residual DoP" } }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Time-Averaged Result</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400">⟨S₁⟩</div>
            <div className="text-xl font-bold font-mono">{data.avgS1.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400">⟨S₂⟩</div>
            <div className="text-xl font-bold font-mono">{data.avgS2.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400">⟨S₃⟩</div>
            <div className="text-xl font-bold font-mono">{data.avgS3.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400">Residual DoP</div>
            <div className="text-xl font-bold font-mono text-yellow-400">{(data.avgDoP * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>R(θ) · S = rotated Stokes vector by angle θ</p>
          <p>⟨S⟩_t = (1/T) ∫₀ᵀ S(t) dt — time-averaged Stokes</p>
          <p>Residual DoP = √(⟨S₁⟩² + ⟨S₂⟩² + ⟨S₃⟩²) / S₀</p>
          <p>Ideal scrambler: residual DoP → 0 as N → ∞</p>
          <p>Residual DoP ∝ 1/√N for random scrambling</p>
        </div>
      </div>
    </CalculatorShell>
  );
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
