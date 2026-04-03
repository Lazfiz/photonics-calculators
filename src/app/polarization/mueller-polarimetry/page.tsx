"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Mueller matrix utilities
function multiply(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function applyMatrix(M: number[][], S: number[]): number[] {
  return [
    M[0][0] * S[0] + M[0][1] * S[1] + M[0][2] * S[2] + M[0][3] * S[3],
    M[1][0] * S[0] + M[1][1] * S[1] + M[1][2] * S[2] + M[1][3] * S[3],
    M[2][0] * S[0] + M[2][1] * S[1] + M[2][2] * S[2] + M[2][3] * S[3],
    M[3][0] * S[0] + M[3][1] * S[1] + M[3][2] * S[2] + M[3][3] * S[3],
  ];
}

// Mueller matrices
function linearPolarizer(theta: number): number[][] {
  const c = Math.cos(2 * theta);
  const s = Math.sin(2 * theta);
  return [
    [1, c, s, 0],
    [c, c * c, c * s, 0],
    [s, c * s, s * s, 0],
    [0, 0, 0, 0],
  ].map(row => row.map(x => x / 2));
}

function retarder(delta: number, fastAxis: number): number[][] {
  const c2 = Math.cos(2 * fastAxis);
  const s2 = Math.sin(2 * fastAxis);
  const cd = Math.cos(delta);
  const sd = Math.sin(delta);
  return [
    [1, 0, 0, 0],
    [0, c2 * c2 + s2 * s2 * cd, c2 * s2 * (1 - cd), -s2 * sd],
    [0, c2 * s2 * (1 - cd), s2 * s2 + c2 * c2 * cd, c2 * sd],
    [0, s2 * sd, -c2 * sd, cd],
  ];
}

function rotator(theta: number): number[][] {
  const c2 = Math.cos(2 * theta);
  const s2 = Math.sin(2 * theta);
  return [
    [1, 0, 0, 0],
    [0, c2, s2, 0],
    [0, -s2, c2, 0],
    [0, 0, 0, 1],
  ];
}

function depolarizer(d: number): number[][] {
  return [
    [1, 0, 0, 0],
    [0, d, 0, 0],
    [0, 0, d, 0],
    [0, 0, 0, d],
  ];
}

export default function MuellerPolarimetryPage() {
  const [inputS, setInputS] = useState([1, 1, 0, 0]); // H linear
  const [element1, setElement1] = useState<"polarizer" | "retarder" | "rotator" | "depolarizer">("retarder");
  const [param1, setParam1] = useState(90); // retardance or angle
  const [element2, setElement2] = useState<"polarizer" | "retarder" | "rotator" | "depolarizer">("polarizer");
  const [param2, setParam2] = useState(0);
  const [showAnalyzer, setShowAnalyzer] = useState(true);
  const [analyzerAngle, setAnalyzerAngle] = useState(45);

  const outputS = useMemo(() => {
    let M: number[][] = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    const p1Rad = param1 * Math.PI / 180;
    const p2Rad = param2 * Math.PI / 180;

    // First element
    let M1: number[][];
    switch (element1) {
      case "polarizer": M1 = linearPolarizer(p1Rad); break;
      case "retarder": M1 = retarder(p1Rad, 0); break;
      case "rotator": M1 = rotator(p1Rad); break;
      case "depolarizer": M1 = depolarizer(1 - param1 / 100); break;
    }
    M = multiply(M1, M);

    // Second element
    let M2: number[][];
    switch (element2) {
      case "polarizer": M2 = linearPolarizer(p2Rad); break;
      case "retarder": M2 = retarder(p2Rad, 0); break;
      case "rotator": M2 = rotator(p2Rad); break;
      case "depolarizer": M2 = depolarizer(1 - param2 / 100); break;
    }
    M = multiply(M2, M);

    return applyMatrix(M, inputS);
  }, [inputS, element1, param1, element2, param2]);

  const finalIntensity = useMemo(() => {
    if (!showAnalyzer) return outputS[0];
    const th = analyzerAngle * Math.PI / 180;
    return 0.5 * (outputS[0] + outputS[1] * Math.cos(2 * th) + outputS[2] * Math.sin(2 * th));
  }, [outputS, showAnalyzer, analyzerAngle]);

  const dopOut = Math.sqrt(outputS[1] ** 2 + outputS[2] ** 2 + outputS[3] ** 2) / Math.max(outputS[0], 1e-10);

  const poincareData = useMemo(() => {
    const n0 = outputS[0] > 0 ? 1 : 0;
    const s1n = outputS[1] / Math.max(outputS[0], 1e-10);
    const s2n = outputS[2] / Math.max(outputS[0], 1e-10);
    const s3n = outputS[3] / Math.max(outputS[0], 1e-10);

    return [
      // Input state
      {
        x: [inputS[1] / Math.max(inputS[0], 1e-10)],
        y: [inputS[2] / Math.max(inputS[0], 1e-10)],
        z: [inputS[3] / Math.max(inputS[0], 1e-10)],
        type: "scatter3d" as const, mode: "markers" as const, name: "Input",
        marker: { color: "#60a5fa", size: 8 },
      },
      // Output state
      {
        x: [s1n], y: [s2n], z: [s3n],
        type: "scatter3d" as const, mode: "markers" as const, name: "Output",
        marker: { color: "#f87171", size: 10 },
      },
    ];
  }, [inputS, outputS]);

  const scanData = useMemo(() => {
    const angles = Array.from({ length: 180 }, (_, i) => (i / 180) * 180);
    const intensities = angles.map(a => {
      const th = a * Math.PI / 180;
      return 0.5 * (outputS[0] + outputS[1] * Math.cos(2 * th) + outputS[2] * Math.sin(2 * th));
    });
    return [
      { x: angles, y: intensities, type: "scatter" as const, mode: "lines" as const, name: "I(θ)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [outputS]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Mueller Polarimetry</h1>
      <p className="text-gray-400 mb-8">Build optical systems using Mueller matrices and analyze polarization transformations.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S_out = M · S_in, M_total = M_n · ... · M_2 · M_1</p>
        <p className="text-gray-500 text-xs mt-1">Mueller calculus: 4×4 matrices operate on 4×1 Stokes vectors</p>
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-200">Input Stokes Vector</h2>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {["S₀", "S₁", "S₂", "S₃"].map((label, i) => (
          <label key={label} className="block">
            <span className="text-gray-300 text-sm">{label}</span>
            <input type="number" value={inputS[i]} onChange={e => {
              const newS = [...inputS];
              newS[i] = +e.target.value;
              setInputS(newS);
            }} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setInputS([1, 1, 0, 0])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">H linear</button>
        <button onClick={() => setInputS([1, 0, 1, 0])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">+45° linear</button>
        <button onClick={() => setInputS([1, 0, 0, 1])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">RCP</button>
        <button onClick={() => setInputS([1, 0.3, 0.2, 0.1])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Partial</button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-3">Element 1</h3>
          <select value={element1} onChange={e => setElement1(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-3">
            <option value="polarizer">Linear Polarizer</option>
            <option value="retarder">Retarder (QWP/HWP)</option>
            <option value="rotator">Rotator</option>
            <option value="depolarizer">Depolarizer</option>
          </select>
          <label className="block">
            <span className="text-gray-300 text-sm">{element1 === "retarder" ? "Retardance (°)" : element1 === "depolarizer" ? "Depolarization %" : "Angle (°)"}</span>
            <input type="number" value={param1} onChange={e => setParam1(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-3">Element 2</h3>
          <select value={element2} onChange={e => setElement2(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-3">
            <option value="polarizer">Linear Polarizer</option>
            <option value="retarder">Retarder (QWP/HWP)</option>
            <option value="rotator">Rotator</option>
            <option value="depolarizer">Depolarizer</option>
          </select>
          <label className="block">
            <span className="text-gray-300 text-sm">{element2 === "retarder" ? "Retardance (°)" : element2 === "depolarizer" ? "Depolarization %" : "Angle (°)"}</span>
            <input type="number" value={param2} onChange={e => setParam2(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output S₀</p>
          <p className="text-2xl font-bold text-blue-400">{outputS[0].toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output DOP</p>
          <p className="text-2xl font-bold text-green-400">{(dopOut * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Analyzer Angle</p>
          <input type="number" value={analyzerAngle} onChange={e => setAnalyzerAngle(+e.target.value)} className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Final Intensity</p>
          <p className="text-2xl font-bold text-yellow-400">{finalIntensity.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Analyzer Scan</h3>
          <Plot data={scanData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Intensity", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Output Stokes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500">S₁</p><p className="font-mono text-green-400">{outputS[1].toFixed(3)}</p></div>
            <div><p className="text-xs text-gray-500">S₂</p><p className="font-mono text-yellow-400">{outputS[2].toFixed(3)}</p></div>
            <div><p className="text-xs text-gray-500">S₃</p><p className="font-mono text-purple-400">{outputS[3].toFixed(3)}</p></div>
            <div><p className="text-xs text-gray-500">|S|</p><p className="font-mono text-blue-400">{Math.sqrt(outputS[1] ** 2 + outputS[2] ** 2 + outputS[3] ** 2).toFixed(3)}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
