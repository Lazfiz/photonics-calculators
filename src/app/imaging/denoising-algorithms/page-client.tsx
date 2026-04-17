"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DenoisingAlgorithmsPage() {
  const [algorithm, setAlgorithm] = useState<"gaussian" | "median" | "bilateral" | "nlm" | "wavelet" | "deep">("nlm");
  const [inputNoise, setInputNoise] = useURLState("inputNoise", 20);
  const [filterSize, setFilterSize] = useURLState("filterSize", 3);
  const [sigmaSpatial, setSigmaSpatial] = useURLState("sigmaSpatial", 2);
  const [sigmaRange, setSigmaRange] = useURLState("sigmaRange", 10);
  const [waveletLevel, setWaveletLevel] = useURLState("waveletLevel", 3);
  const [threshold, setThreshold] = useURLState("threshold", 3);
  const [patchSize, setPatchSize] = useURLState("patchSize", 7);
  const [searchWindow, setSearchWindow] = useURLState("searchWindow", 21);

  // Simulate SNR improvement for each method
  const methodParams: Record<string, { base: number; scale: number; min: number }> = {
    gaussian: { base: 3, scale: 0.1, min: 1 },
    median: { base: 4, scale: 0.15, min: 2 },
    bilateral: { base: 5, scale: 0.2, min: 3 },
    nlm: { base: 6, scale: 0.25, min: 4 },
    wavelet: { base: 5.5, scale: 0.22, min: 3.5 },
    deep: { base: 7, scale: 0.3, min: 5 },
  };

  const params = methodParams[algorithm];
  const paramVal = algorithm === "gaussian" ? filterSize :
    algorithm === "median" ? filterSize :
    algorithm === "bilateral" ? sigmaRange + sigmaSpatial * 0.5 :
    algorithm === "nlm" ? searchWindow + patchSize * 0.3 :
    algorithm === "wavelet" ? threshold + waveletLevel :
    0.5;

  const snrImprovement = Math.max(params.min, params.base + params.scale * paramVal);
  const outputNoise = Math.max(1, inputNoise - snrImprovement);
  const outputSnr = inputNoise === 0 ? 99 : 20 * Math.log10(inputNoise / outputNoise);
  const detailLoss = algorithm === "gaussian" ? 0.3 : algorithm === "median" ? 0.1 : algorithm === "bilateral" ? 0.05 : algorithm === "nlm" ? 0.03 : algorithm === "wavelet" ? 0.08 : 0.02;

  // Simulated 1D signal before/after denoising
  const signalData = useMemo(() => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    const clean = x.map(v => Math.sin(v * 0.1) + 0.5 * Math.sin(v * 0.25) + 0.3 * Math.sin(v * 0.5));
    const noise = clean.map(v => v + (inputNoise / 100) * (Math.sin(v * 3.7) * 0.7 + Math.cos(v * 5.3) * 0.5 + (Math.sin(v * 11) * 0.3)));
    const denoised = clean.map((v, i) => v * (1 - detailLoss) + (noise[i] - v) * (outputNoise / (inputNoise || 1)));
    return [
      { x, y: clean, type: "scatter", mode: "lines" as const, name: "Ground Truth", line: { color: "#34d399", width: 2 } },
      { x, y: noise, type: "scatter", mode: "lines" as const, name: "Noisy Signal", line: { color: "#f87171", width: 1 } },
      { x, y: denoised, type: "scatter", mode: "lines" as const, name: "Denoised", line: { color: "#60a5fa", width: 2, dash: "dash" } },
    ];
  }, [inputNoise, outputNoise, detailLoss]);

  // SNR improvement vs input noise for all methods
  const snrCompareData = useMemo(() => {
    const noiseLevels = Array.from({ length: 30 }, (_, i) => 2 + i * 2);
    const algos = ["gaussian", "median", "bilateral", "nlm", "wavelet", "deep"];
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];
    return algos.map((a, idx) => ({
      x: noiseLevels,
      y: noiseLevels.map(n => {
        const p = methodParams[a];
        return 20 * Math.log10(n / Math.max(1, n - (p.base + p.scale * 5)));
      }),
      type: "scatter", mode: "lines" as const,
      name: a.charAt(0).toUpperCase() + a.slice(1),
      line: { color: colors[idx], width: 2 },
    }));
  }, []);

  // Tradeoff: detail preservation vs noise reduction
  const tradeoffData = useMemo(() => {
    const algos = ["Gaussian", "Median", "Bilateral", "NLM", "Wavelet", "Deep"];
    const noiseReduction = [3, 4, 5, 6, 5.5, 7];
    const detailPreservation = [70, 90, 95, 97, 92, 98];
    return [{
      x: noiseReduction, y: detailPreservation, type: "scatter", mode: "markers+text" as const,
      text: algos, textposition: "top center", textfont: { color: "#d1d5db", size: 11 },
      marker: { color: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"], size: 15 },
      name: "Methods",
    }];
  }, []);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Denoising Algorithms" description="Compare denoising methods: noise reduction, detail preservation, and SNR improvement tradeoffs.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Input Noise σ</p>
          <p className="text-2xl font-bold text-red-400">{inputNoise}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output Noise σ</p>
          <p className="text-2xl font-bold text-green-400">{outputNoise.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SNR Improvement</p>
          <p className="text-2xl font-bold text-blue-400">{outputSnr.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Detail Loss</p>
          <p className="text-2xl font-bold text-yellow-400">{(detailLoss * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Algorithm</span>
          <select value={algorithm} onChange={e => setAlgorithm(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="gaussian">Gaussian Filter</option>
            <option value="median">Median Filter</option>
            <option value="bilateral">Bilateral Filter</option>
            <option value="nlm">Non-Local Means (NLM)</option>
            <option value="wavelet">Wavelet Thresholding</option>
            <option value="deep">Deep Learning (DnCNN)</option>
          </select>
        </label>
        <ValidatedNumberInput label="Input Noise Level (σ)" value={inputNoise} onChange={setInputNoise} min={1} max={100} />
        {(algorithm === "gaussian" || algorithm === "median") && (
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Kernel Size</span>
            <select value={filterSize} onChange={e => setFilterSize(+e.target.value)}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {[3, 5, 7, 9, 11].map(s => <option key={s} value={s}>{s}×{s}</option>)}
            </select>
          </label>
        )}
        {algorithm === "bilateral" && <>
          <ValidatedNumberInput label="Spatial σ" value={sigmaSpatial} onChange={setSigmaSpatial} min={0.5} max={20} step="0.5" />
          <ValidatedNumberInput label="Range σ" value={sigmaRange} onChange={setSigmaRange} min={1} max={100} />
        </>}
        {algorithm === "nlm" && <>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Patch Size</span>
            <select value={patchSize} onChange={e => setPatchSize(+e.target.value)}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {[3, 5, 7, 9, 11].map(s => <option key={s} value={s}>{s}×{s}</option>)}
            </select>
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Search Window</span>
            <select value={searchWindow} onChange={e => setSearchWindow(+e.target.value)}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {[11, 15, 21, 25, 31].map(s => <option key={s} value={s}>{s}×{s}</option>)}
            </select>
          </label>
        </>}
        {algorithm === "wavelet" && <>
          <ValidatedNumberInput label="Decomposition Level" value={waveletLevel} onChange={setWaveletLevel} min={1} max={6} />
          <ValidatedNumberInput label="Threshold (σ multiples)" value={threshold} onChange={setThreshold} min={0.5} max={10} step="0.5" />
        </>}
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">1D Signal: Before & After Denoising</h3>
        <ChartPanel data={signalData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Sample", gridcolor: "#374151" }, yaxis: { title: "Intensity", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 10 } },
        }} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">SNR Improvement vs Input Noise</h3>
          <ChartPanel data={snrCompareData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Input Noise σ", gridcolor: "#374151" }, yaxis: { title: "SNR Improvement (dB)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 70 }, legend: { font: { size: 9 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Noise Reduction vs Detail Preservation</h3>
          <ChartPanel data={tradeoffData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Noise Reduction (σ units)", gridcolor: "#374151" },
            yaxis: { title: "Detail Preservation (%)", gridcolor: "#374151", range: [60, 100] },
            margin: { t: 30, r: 20, b: 50, l: 70 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Gaussian:</span> G(x) = (1/2πσ²) exp(−|x|²/2σ²)</p>
          <p><span className="text-blue-400">Bilateral:</span> BF(I) = (1/W) Σ G_s(‖p−q‖) · G_r(|I_p−I_q|) · I_q</p>
          <p><span className="text-blue-400">NLM weight:</span> w(p,q) = exp(−‖P(p)−P(q)‖² / h²)</p>
          <p><span className="text-blue-400">Wavelet threshold:</span> T = σ√(2 log N) (VisuShrink)</p>
          <p><span className="text-blue-400">PSNR:</span> PSNR = 20·log₁₀(MAX_I / √MSE)</p>
          <p><span className="text-blue-400">SSIM:</span> SSIM(x,y) = (2µ_xµ_y + c₁)(2σ_xy + c₂) / (µ_x² + µ_y² + c₁)(σ_x² + σ_y² + c₂)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
