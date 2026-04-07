"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function LowWaterPeakPage() {
  const [fiberType, setFiberType] = useState<"SMF28e" | "SMF28ePlus" | "AllWave" | "TrueWave">("SMF28e");
  const [length, setLength] = useState(100); // km
  const [channels, setChannels] = useState(40);

  const getAttenuation = (wl: number, type: string) => {
    const rayleigh = 0.85 * Math.pow(1.55 / (wl / 1000), 4) * 0.19;
    const irAbsorption = 6e10 * Math.exp(-48 / (wl / 1000));
    const uvAbsorption = 1e-3 * Math.exp(4.63 * (1.55 - wl / 1000));
    // OH peak at 1383nm - varies by fiber type
    const ohPeakHeight = type === "SMF28e" ? 0.15 : type === "SMF28ePlus" ? 0.08 : type === "AllWave" ? 0.1 : 0.12;
    const ohPeak = ohPeakHeight * Math.exp(-0.5 * Math.pow((wl - 1383) / 8, 2));
    return rayleigh + irAbsorption + ohPeak + uvAbsorption;
  };

  const calc = useMemo(() => {
    // Compare OH peak loss for standard vs low water peak
    const ohStandard = 0.5 * Math.exp(-0.5 * 0); // peak value at 1383nm
    const ohLWP = getAttenuation(1383, fiberType);
    const ohStdTotal = ohStandard + 0.85 * 0.19 * Math.pow(1.55 / 1.383, 4);
    const reduction = ((ohStandard - getAttenuation(1383, fiberType)) / ohStandard) * 100;

    // Usable bandwidth in E-band (1360-1460nm) and S-band (1460-1530nm)
    const eBandWls = Array.from({ length: 50 }, (_, i) => 1360 + i * 2);
    const sBandWls = Array.from({ length: 35 }, (_, i) => 1460 + i * 2);
    const avgEBand = eBandWls.reduce((s, w) => s + getAttenuation(w, fiberType), 0) / eBandWls.length;
    const avgSBand = sBandWls.reduce((s, w) => s + getAttenuation(w, fiberType), 0) / sBandWls.length;

    // CWDM channel spacing: 20nm from 1271 to 1611nm = 18 channels
    const cwdmChannels = Array.from({ length: 18 }, (_, i) => 1271 + i * 20);
    const cwdmLosses = cwdmChannels.map(wl => getAttenuation(wl, fiberType));
    const worstChannel = cwdmLosses.reduce((max, l, i) => l > max.val ? { val: l, idx: i } : max, { val: 0, idx: 0 });

    return { reduction, avgEBand, avgSBand, worstChannel, cwdmLosses, cwdmChannels };
  }, [fiberType]);

  const spectrumData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 1200 + i * 1.5);
    const attLWP = wls.map(wl => getAttenuation(wl, fiberType));
    // Standard fiber for comparison (high OH peak)
    const attStd = wls.map(wl => {
      const rayleigh = 0.85 * Math.pow(1.55 / (wl / 1000), 4) * 0.19;
      const irAbsorption = 6e10 * Math.exp(-48 / (wl / 1000));
      const uvAbsorption = 1e-3 * Math.exp(4.63 * (1.55 - wl / 1000));
      const ohPeak = 0.5 * Math.exp(-0.5 * Math.pow((wl - 1383) / 8, 2));
      return rayleigh + irAbsorption + ohPeak + uvAbsorption;
    });

    return [
      { x: wls, y: attStd, type: "scatter" as const, mode: "lines" as const, name: "Standard SMF", line: { color: "#f87171", width: 1.5 } },
      { x: wls, y: attLWP, type: "scatter" as const, mode: "lines" as const, name: `Low Water Peak (${fiberType})`, line: { color: "#34d399", width: 2 } },
      // Band markers
      { x: [1360, 1460], y: [0, 0], type: "scatter" as const, mode: "lines" as const, name: "E-band", line: { color: "#fbbf24", width: 8, opacity: 0.3 }, showlegend: false },
      { x: [1460, 1530], y: [0, 0], type: "scatter" as const, mode: "lines" as const, name: "S-band", line: { color: "#60a5fa", width: 8, opacity: 0.3 }, showlegend: false },
    ];
  }, [fiberType]);

  const cwdmData = useMemo(() => {
    return [
      { x: calc.cwdmChannels, y: calc.cwdmLosses, type: "bar" as const, name: "CWDM Channel Loss",
        marker: { color: calc.cwdmLosses.map((l, i) => i === calc.worstChannel.idx ? "#f87171" : "#4b5563") } },
    ];
  }, [calc]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Low Water Peak Fiber" description="Analyze low water peak (LWP) fibers that reduce the OH⁻ absorption peak at 1383 nm, enabling E-band and full CWDM operation.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Type</span>
          <select value={fiberType} onChange={e => setFiberType(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="SMF28e">SMF-28e (G.652.C)</option>
            <option value="SMF28ePlus">SMF-28e+ (G.652.D)</option>
            <option value="AllWave">AllWave (OFS)</option>
            <option value="TrueWave">TrueWave REACH</option>
          </select>
        </label>
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0.1} step="any" />
        <ValidatedNumberInput label="WDM Channels" value={channels} onChange={setChannels} min={1} max={96} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">OH Peak Reduction</p>
          <p className="text-xl font-bold text-green-400">{calc.reduction.toFixed(0)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Avg E-band (1360-1460)</p>
          <p className="text-xl font-bold text-yellow-400">{calc.avgEBand.toFixed(3)} dB/km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Avg S-band (1460-1530)</p>
          <p className="text-xl font-bold text-blue-400">{calc.avgSBand.toFixed(3)} dB/km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Worst CWDM Ch. Loss</p>
          <p className="text-xl font-bold text-red-400">{calc.worstChannel.val.toFixed(3)} dB/km</p>
          <p className="text-xs text-gray-500">@ {calc.cwdmChannels[calc.worstChannel.idx]} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Attenuation Spectrum: Standard vs Low Water Peak</h3>
        <ChartPanel data={spectrumData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.0] },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          shapes: [
            { type: "rect" as const, x0: 1360, x1: 1460, y0: 0, y1: 1, fillcolor: "#fbbf2420", line: { width: 0 } },
            { type: "rect" as const, x0: 1460, x1: 1530, y0: 0, y1: 1, fillcolor: "#60a5fa20", line: { width: 0 } },
          ],
          annotations: [
            { x: 1410, y: 0.92, text: "E-band", showarrow: false, font: { color: "#fbbf24", size: 11 } },
            { x: 1495, y: 0.92, text: "S-band", showarrow: false, font: { color: "#60a5fa", size: 11 } },
          ],
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">CWDM Channel Attenuation (20nm spacing)</h3>
        <ChartPanel data={cwdmData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 300,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">OH⁻ peak at 1383 nm from residual water in silica</p>
          <p className="font-mono">LWP fiber: OH peak &lt; 0.31 dB/km (G.652.C/D) vs ~0.5 dB/km standard</p>
          <p className="font-mono">Enables E-band (1360-1460nm): +100nm usable spectrum</p>
          <p className="font-mono">Critical for CWDM: 18 channels × 20nm spacing over full O+S+C+L bands</p>
          <p className="font-mono">ITU-T G.652.C/D specifies max attenuation in 1310-1625nm range</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
