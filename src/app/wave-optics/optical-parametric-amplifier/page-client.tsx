"use client";
import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
const c = 3e8;
const eps0 = 8.854e-12;

function opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius }: { pumpWavelength: number; signalWavelength: number; crystalLength: number; dEff: number; nPump: number; nSignal: number; nIdler: number; pumpPower: number; beamRadius: number }) {
  const lambdaP = pumpWavelength * 1e-9;
  const lambdaS = signalWavelength * 1e-9;
  const lambdaI = (lambdaP * lambdaS) / (lambdaS - lambdaP);
  const omegaP = 2 * Math.PI * c / lambdaP;
  const omegaS = 2 * Math.PI * c / lambdaS;
  const omegaI = omegaP - omegaS;
  const deff = dEff * 1e-12;
  const L = crystalLength * 1e-3;
  const w = beamRadius * 1e-6;
  const Ip = pumpPower / (Math.PI * w * w);
  const gamma = (2 * deff / c) * Math.sqrt(omegaP * omegaS * Ip / (2 * eps0 * c * nPump * nSignal * nIdler));
  const G = 1 + (gamma * L * Math.sinh(gamma * L)) ** 2 / (gamma * L) ** 2;
  const gaindB = 10 * Math.log10(G);
  return { G, gaindB, gamma, lambdaI: lambdaI * 1e9, omegaI };
}

export default function OPACalculator() {
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 532);
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1064);
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 15);
  const [dEff, setDEff] = useURLState("dEff", 2.0);
  const [nPump, setNPump] = useURLState("nPump", 1.65);
  const [nSignal, setNSignal] = useURLState("nSignal", 1.53);
  const [nIdler, setNIdler] = useURLState("nIdler", 1.53);
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 10);
  const [beamRadius, setBeamRadius] = useURLState("beamRadius", 50);

  const result = useMemo(() => opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius }), [pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsLength = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let L = 1; L <= 40; L += 0.5) {
      const r = opaGain({ pumpWavelength, signalWavelength, crystalLength: L, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius });
      x.push(L); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, signalWavelength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsSignal = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let ls = pumpWavelength + 50; ls <= 5000; ls += 20) {
      const r = opaGain({ pumpWavelength, signalWavelength: ls, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius });
      x.push(ls); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsPower = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let P = 0.5; P <= 30; P += 0.5) {
      const r = opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower: P, beamRadius });
      x.push(P); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, beamRadius]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
            <p className="text-gray-500 mb-6">Non-collinear or collinear OPA gain analysis. Parametric amplification of a seed signal by a strong pump.</p>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h3 className="text-cyan-400 font-semibold mb-2">Key Equations</h3>
        <p className="font-mono text-gray-400 text-sm leading-relaxed">
          ωₚ = ωₛ + ωᵢ &nbsp;|&nbsp; λᵢ = λₚλₛ/(λₛ − λₚ)<br />
          γ = (2d_eff/c) √(ωₚωₛIₚ / 2ε₀cnₚnₛnᵢ)<br />
          G = 1 + [sinh²(γL)] &nbsp; (undepleted pump)<br />
          G_dB = 10 log₁₀(G)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-4">Parameters</h3>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Pump λ (nm)</span>
              <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Signal λ (nm)</span>
              <input type="number" value={signalWavelength} onChange={e => setSignalWavelength(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Crystal Length (mm)</span>
              <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">d_eff (pm/V)</span>
              <input type="number" value={dEff} onChange={e => setDEff(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
                <span className="text-xs text-gray-400">nₚ</span>
                <input type="number" value={nPump} onChange={e => setNPump(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
                <span className="text-xs text-gray-400">nₛ</span>
                <input type="number" value={nSignal} onChange={e => setNSignal(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
                <span className="text-xs text-gray-400">nᵢ</span>
                <input type="number" value={nIdler} onChange={e => setNIdler(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
            </div>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Pump Power (W)</span>
              <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Beam Radius (μm)</span>
              <input type="number" value={beamRadius} onChange={e => setBeamRadius(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-3">Results</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Idler λ", `${result.lambdaI.toFixed(1)} nm`],
                  ["Power Gain G", result.G > 1e6 ? result.G.toExponential(2) : result.G.toFixed(2)],
                  ["Gain (dB)", `${result.gaindB.toFixed(2)} dB`],
                  ["Coupling γ", `${result.gamma.toFixed(1)} m⁻¹`],
                  ["Pump Intensity", `${(pumpPower / (Math.PI * (beamRadius * 1e-6) ** 2) / 1e10).toFixed(2)} GW/m²`],
                ].map(([l, v], i) => (
                  <tr key={i}><td className="text-gray-500 py-1">{l}</td><td className="text-gray-200 font-semibold">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartPanel data={[{ x: gainVsLength.x, y: gainVsLength.y, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Crystal Length", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Length (mm)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} />
            <ChartPanel data={[{ x: gainVsPower.x, y: gainVsPower.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Pump Power", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Power (W)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} />
            <div className="col-span-2">
              <ChartPanel data={[{ x: gainVsSignal.x, y: gainVsSignal.y, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Signal Wavelength", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Signal λ (nm)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
