"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RegistrationPage() {
  const [transformation, setTransformation] = useState<"rigid" | "affine" | "elastic">("affine");
  const [imageSize, setImageSize] = useState(512);
  const [rotationDeg, setRotationDeg] = useState(2);
  const [translationX, setTranslationX] = useState(5);
  const [translationY, setTranslationY] = useState(3);
  const [scaleFactor, setScaleFactor] = useState(1.02);
  const [shearDeg, setShearDeg] = useState(0.5);
  const [noiseLevel, setNoiseLevel] = useState(5);
  const [interpolation, setInterpolation] = useState<"linear" | "cubic" | "spline">("cubic");
  const [numControlPoints, setNumControlPoints] = useState(100);

  // Calculate RMSE and CC
  const pixelSizeNm = 100;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const displacementRms = Math.sqrt(
    (translationX * pixelSizeNm) ** 2 +
    (translationY * pixelSizeNm) ** 2 +
    (rotationRad * imageSize * pixelSizeNm / 2) ** 2
  );

  const baseAccuracy = transformation === "rigid" ? 0.02 : transformation === "affine" ? 0.05 : 0.08;
  const rmseNm = displacementRms * baseAccuracy + noiseLevel * 2;
  const cc = Math.max(0.85, 1 - (noiseLevel / 200) - (rmseNm / 10000));

  // Transformation matrix
  const transformMatrix = useMemo(() => {
    const c = Math.cos(rotationRad);
    const s = Math.sin(rotationRad);
    const sh = Math.tan((shearDeg * Math.PI) / 180);
    if (transformation === "rigid") {
      return [[c.toFixed(4), (-s).toFixed(4), translationX.toFixed(1)],
              [s.toFixed(4), c.toFixed(4), translationY.toFixed(1)],
              ["0", "0", "1"]];
    } else if (transformation === "affine") {
      return [[(c * scaleFactor).toFixed(4), ((-s + sh) * scaleFactor).toFixed(4), translationX.toFixed(1)],
              [(s * scaleFactor).toFixed(4), (c * scaleFactor).toFixed(4), translationY.toFixed(1)],
              ["0", "0", "1"]];
    } else {
      return [[(c * scaleFactor).toFixed(4), ((-s + sh) * scaleFactor).toFixed(4), translationX.toFixed(1)],
              [(s * scaleFactor).toFixed(4), (c * scaleFactor).toFixed(4), translationY.toFixed(1)],
              ["0", "0", "1"]];
    }
  }, [rotationRad, scaleFactor, shearDeg, translationX, translationY, transformation]);

  // Error vs number of control points
  const errorVsPoints = useMemo(() => {
    const points = Array.from({ length: 30 }, (_, i) => 10 + i * 20);
    const errors = points.map(n => {
      const base = transformation === "elastic" ? 50 : transformation === "affine" ? 20 : 10;
      return base + (500 / Math.sqrt(n)) + noiseLevel * 1.5;
    });
    return [{
      x: points, y: errors, type: "scatter", mode: "lines" as const,
      name: "RMSE (nm)", line: { color: "#60a5fa", width: 2 },
    }, {
      x: [numControlPoints], y: [transformation === "elastic" ? 50 + 500 / Math.sqrt(numControlPoints) + noiseLevel * 1.5 :
        transformation === "affine" ? 20 + 500 / Math.sqrt(numControlPoints) + noiseLevel * 1.5 :
        10 + 500 / Math.sqrt(numControlPoints) + noiseLevel * 1.5],
      type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [transformation, numControlPoints, noiseLevel]);

  // CC vs noise for different transforms
  const ccVsNoise = useMemo(() => {
    const noises = Array.from({ length: 30 }, (_, i) => i * 2);
    const transforms = ["rigid", "affine", "elastic"] as const;
    const colors = ["#34d399", "#fbbf24", "#f87171"];
    return transforms.map((t, i) => ({
      x: noises,
      y: noises.map(n => {
        const base = t === "rigid" ? 0.99 : t === "affine" ? 0.97 : 0.94;
        return Math.max(0.5, base - n * (t === "rigid" ? 0.003 : t === "affine" ? 0.005 : 0.008));
      }),
      type: "scatter", mode: "lines" as const,
      name: t.charAt(0).toUpperCase() + t.slice(1),
      line: { color: colors[i], width: 2 },
    }));
  }, []);

  // Grid distortion visualization for elastic
  const gridData = useMemo(() => {
    if (transformation !== "elastic") return [];
    const grid = Array.from({ length: 11 }, (_, i) => i * 50);
    const lines = grid.map((y, idx) => ({
      x: grid.map(x => x + 5 * Math.sin((x + y) * 0.05)),
      y: grid.map(x => y + 3 * Math.cos((x + y) * 0.04)),
      type: "scatter", mode: "lines" as const, name: `Row ${idx}`,
      line: { color: "#60a5fa", width: 1 }, showlegend: false,
    }));
    return lines;
  }, [transformation]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Image Registration</h1>
      <p className="text-gray-400 mb-6">Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Displacement RMS</p>
          <p className="text-2xl font-bold text-blue-400">{displacementRms.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Registration RMSE</p>
          <p className="text-2xl font-bold text-green-400">{rmseNm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Correlation Coeff.</p>
          <p className="text-2xl font-bold text-yellow-400">{cc.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOF</p>
          <p className="text-2xl font-bold text-purple-400">{transformation === "rigid" ? 6 : transformation === "affine" ? 12 : "∞"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Transformation</span>
          <select value={transformation} onChange={e => setTransformation(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="rigid">Rigid (6 DOF)</option>
            <option value="affine">Affine (12 DOF)</option>
            <option value="elastic">Elastic (B-spline)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Rotation (°)</span>
          <input type="number" value={rotationDeg} onChange={e => setRotationDeg(+e.target.value)} min={-180} max={180} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Translation X (px)</span>
          <input type="number" value={translationX} onChange={e => setTranslationX(+e.target.value)} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Translation Y (px)</span>
          <input type="number" value={translationY} onChange={e => setTranslationY(+e.target.value)} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Scale Factor</span>
          <input type="number" value={scaleFactor} onChange={e => setScaleFactor(+e.target.value)} min={0.9} max={1.1} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Shear (°)</span>
          <input type="number" value={shearDeg} onChange={e => setShearDeg(+e.target.value)} min={-10} max={10} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Noise Level (%)</span>
          <input type="number" value={noiseLevel} onChange={e => setNoiseLevel(+e.target.value)} min={0} max={30}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Interpolation</span>
          <select value={interpolation} onChange={e => setInterpolation(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Bilinear</option>
            <option value="cubic">Bicubic</option>
            <option value="spline">B-spline</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Control Points</span>
          <input type="number" value={numControlPoints} onChange={e => setNumControlPoints(+e.target.value)} min={10} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Transformation Matrix</h3>
        <div className="font-mono text-sm">
          {transformMatrix.map((row, i) => (
            <div key={i} className="flex gap-4">
              {row.map((v, j) => (
                <span key={j} className="w-24 text-right text-gray-300">{v}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">RMSE vs Control Points</h3>
          <Plot data={errorVsPoints} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Control Points", gridcolor: "#374151" }, yaxis: { title: "RMSE (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">CC vs Noise Level</h3>
          <Plot data={ccVsNoise} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Noise (%)", gridcolor: "#374151" }, yaxis: { title: "Correlation Coefficient", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 }, legend: { font: { size: 9 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Rigid:</span> x&apos; = R·x + t  (rotation + translation)</p>
          <p><span className="text-blue-400">Affine:</span> x&apos; = A·x + t  (linear + translation)</p>
          <p><span className="text-blue-400">Elastic:</span> x&apos; = x + u(x)  (displacement field)</p>
          <p><span className="text-blue-400">NCC:</span> NCC(I₁,I₂) = Σ(I₁−μ₁)(I₂−μ₂) / √[Σ(I₁−μ₁)² · Σ(I₂−μ₂)²]</p>
          <p><span className="text-blue-400">MI:</span> MI(I₁,I₂) = H(I₁) + H(I₂) − H(I₁,I₂)</p>
          <p><span className="text-blue-400">RMSE:</span> RMSE = √(Σ(x̂ᵢ − xᵢ)² / N)</p>
        </div>
      </div>
    </div>
  );
}
