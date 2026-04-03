"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const hc = 1.986446e-25; // J·m
const c = 3e8;

function parametricGain({ pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff }: { pumpWavelength: number; crystalLength: number; dEff: number; nPump: number; nSignal: number; nIdler: number; pumpPower: number; beamRadius: number; walkOff: number }) {
  const omegaP = 2 * Math.PI * c / (pumpWavelength * 1e-6);
  const omegaS = 2 * Math.PI * c / (2 * pumpWavelength * 1e-6);
  const deff = dEff * 1e-12;
  const eps0 = 8.854e-12;
  const Ip = pumpPower / (Math.PI * (beamRadius * 1e-6) ** 2);
  const gamma = (4 * deff / (c * Math.sqrt(nPump * nSignal * nIdler))) * Math.sqrt(2 * omegaP * omegaS * Ip / (eps0 * c * nPump));
  const walkOffRad = (walkOff * Math.PI) / 180;
  const L = crystalLength * 1e-3;
  const argSquared = (gamma / 2) ** 2 - (walkOffRad / (2 * L)) ** 2;
  const arg = argSquared > 0 ? Math.sqrt(argSquared) : 0;
  const g0 = arg > 1e-12 ? (Math.sinh(arg * L) / arg) * (gamma / 2) : gamma * L;
  return { g0, gamma };
}

export default function OPOCalculator() {
  const [pumpWavelength, setPumpWavelength] = useState(532);
  const [crystalLength, setCrystalLength] = useState(20);
  const [dEff, setDEff] = useState(2.0);
  const [nPump, setNPump] = useState(1.65);
  const [nSignal, setNSignal] = useState(1.53);
  const [nIdler, setNIdler] = useState(1.53);
  const [pumpPower, setPumpPower] = useState(5);
  const [beamRadius, setBeamRadius] = useState(50);
  const [walkOff, setWalkOff] = useState(0.5);
  const [showPhaseMatching, setShowPhaseMatching] = useState(true);

  const signalWavelength = pumpWavelength < 2 * pumpWavelength ? pumpWavelength * 1.2 : pumpWavelength / 2;
  const idlerWavelength = (pumpWavelength * signalWavelength) / (signalWavelength - pumpWavelength);
  const omegaP = 2 * Math.PI * c / (pumpWavelength * 1e-6);
  const omegaS = 2 * Math.PI * c / (signalWavelength * 1e-6);
  const omegaI = omegaP - omegaS;

  const { g0, gamma } = useMemo(
    () => parametricGain({ pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff }),
    [pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff]
  );

  const thresholdPower = useMemo(() => {
    const eps0 = 8.854e-12;
    const deff = dEff * 1e-12;
    const L = crystalLength * 1e-3;
    const w = beamRadius * 1e-6;
    const area = Math.PI * w * w;
    const nAvg = Math.pow(nPump * nSignal * nIdler, 1 / 3);
    const Pth = (Math.PI * Math.PI * w * w * eps0 * c * nPump * nSignal * nIdler) / (4 * deff * deff * L * L * omegaP * omegaS) * (2 * Math.PI / (c * nAvg));
    return Math.abs(Pth);
  }, [pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, beamRadius]);

  // Phase matching curve
  const phaseMatchData = useMemo(() => {
    if (!showPhaseMatching) return { x: [], y: [] };
    const temps = [];
    const deltaK = [];
    const T0 = 25;
    for (let T = 0; T <= 80; T += 0.5) {
      temps.push(T);
      const dn_dT = 1e-5 * (T - T0);
      const kP = 2 * Math.PI * nPump / (pumpWavelength * 1e-6);
      const kS = 2 * Math.PI * (nSignal + dn_dT) / (signalWavelength * 1e-6);
      const kI = 2 * Math.PI * (nIdler + dn_dT * 0.8) / (Math.abs(idlerWavelength) * 1e-6);
      deltaK.push((kP - kS - kI) * 1e-3);
    }
    return { x: temps, y: deltaK };
  }, [showPhaseMatching, pumpWavelength, signalWavelength, idlerWavelength, nPump, nSignal, nIdler]);

  // Gain vs crystal length
  const gainVsLength = useMemo(() => {
    const lengths = [];
    const gains = [];
    for (let L = 1; L <= 50; L += 0.5) {
      lengths.push(L);
      const r = parametricGain({ pumpWavelength, crystalLength: L, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff });
      gains.push(r.g0);
    }
    return { x: lengths, y: gains };
  }, [pumpWavelength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius, walkOff]);

  // Gain vs pump power
  const gainVsPower = useMemo(() => {
    const powers = [];
    const gains = [];
    for (let P = 0.1; P <= 20; P += 0.2) {
      powers.push(P);
      const r = parametricGain({ pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower: P, beamRadius, walkOff });
      gains.push(r.g0);
    }
    return { x: powers, y: gains };
  }, [pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, beamRadius, walkOff]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const axisStyle = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold text-cyan-400 mb-2">Optical Parametric Oscillator (OPO) Designer</h1>
      <p className="text-gray-500 mb-6">Singly-resonant OPO — signal resonant, idler extracted. Quasi-phase-matched (QPM) or birefringent phase matching model.</p>

      {/* Formulas */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h3 className="text-cyan-400 font-semibold mb-2">Key Equations</h3>
        <p className="font-mono text-gray-400 text-sm leading-relaxed">
          ωₚ = ωₛ + ωᵢ &nbsp;|&nbsp; λᵢ = λₚ·λₛ / (λₛ − λₚ)<br />
          γ = (4d_eff / c√(nₚnₛnᵢ)) √(2ωₚωₛIₚ / ε₀cnₚ)<br />
          g₀ ≈ γL · sinh(γL/2)/(γL/2) &nbsp; (plane-wave, low walk-off)<br />
          P_th ≈ π³w²ε₀c·nₚnₛnᵢ / (4d_eff²L²ωₚωₛ)<br />
          Δk = kₚ − kₛ − kᵢ − 2π/Λ (QPM)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="md:col-span-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-4">Parameters</h3>

            <label className="block mb-3">
              <span className="text-sm text-gray-400">Pump λ (nm)</span>
              <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} step={1} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Crystal Length (mm)</span>
              <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} step={1} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">d_eff (pm/V)</span>
              <input type="number" value={dEff} onChange={e => setDEff(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>

            <p className="text-xs text-gray-500 mb-2">Refractive Indices</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <label className="block">
                <span className="text-xs text-gray-400">nₚ</span>
                <input type="number" value={nPump} onChange={e => setNPump(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">nₛ</span>
                <input type="number" value={nSignal} onChange={e => setNSignal(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">nᵢ</span>
                <input type="number" value={nIdler} onChange={e => setNIdler(+e.target.value)} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              </label>
            </div>

            <label className="block mb-3">
              <span className="text-sm text-gray-400">Pump Power (W)</span>
              <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} step={0.5} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Beam Radius (μm)</span>
              <input type="number" value={beamRadius} onChange={e => setBeamRadius(+e.target.value)} step={5} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-gray-400">Walk-off (deg)</span>
              <input type="number" value={walkOff} onChange={e => setWalkOff(+e.target.value)} step={0.1} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </label>

            <label className="flex items-center gap-2 text-gray-300 mt-4">
              <input type="checkbox" checked={showPhaseMatching} onChange={e => setShowPhaseMatching(e.target.checked)} className="rounded" />
              Phase matching curve
            </label>
          </div>
        </div>

        {/* Results + Plots */}
        <div className="md:col-span-8">
          {/* Results table */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-3">Results</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Signal λ", `${signalWavelength.toFixed(1)} nm`],
                  ["Idler λ", `${Math.abs(idlerWavelength).toFixed(1)} nm`],
                  ["ωₚump", `${(omegaP / 1e15).toFixed(2)} PHz`],
                  ["ωₛignal", `${(omegaS / 1e15).toFixed(2)} PHz`],
                  ["ωᵢdler", `${(omegaI / 1e15).toFixed(2)} PHz`],
                  ["Parametric gain g₀", `${g0.toFixed(3)}`],
                  ["Coupling γ", `${gamma.toFixed(1)} m⁻¹`],
                  ["Est. Threshold", `${thresholdPower < 1000 ? thresholdPower.toFixed(2) + " W" : (thresholdPower / 1000).toFixed(2) + " kW"}`],
                  ["Above threshold?", pumpPower > thresholdPower ? "✅ Yes" : "❌ No"],
                  ["Pump Intensity", `${(pumpPower / (Math.PI * (beamRadius * 1e-6) ** 2) / 1e10).toFixed(2)} GW/m²`],
                ].map(([label, val], i) => (
                  <tr key={i}>
                    <td className="text-gray-500 py-1">{label}</td>
                    <td className="text-gray-200 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Plot data={[{ x: gainVsLength.x, y: gainVsLength.y, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 }, name: "g₀" }]} layout={{ ...darkPlot, title: { text: "Gain vs Crystal Length", font: { color: "#ccc" } }, xaxis: { ...axisStyle, title: "Length (mm)" }, yaxis: { ...axisStyle, title: "g₀" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            <Plot data={[{ x: gainVsPower.x, y: gainVsPower.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "g₀" }]} layout={{ ...darkPlot, title: { text: "Gain vs Pump Power", font: { color: "#ccc" } }, xaxis: { ...axisStyle, title: "Power (W)" }, yaxis: { ...axisStyle, title: "g₀" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            {showPhaseMatching && (
              <div className="col-span-2">
                <Plot data={[{ x: phaseMatchData.x, y: phaseMatchData.y, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 }, name: "Δk" }]} layout={{ ...darkPlot, title: { text: "Phase Mismatch vs Crystal Temperature", font: { color: "#ccc" } }, xaxis: { ...axisStyle, title: "Temperature (°C)" }, yaxis: { ...axisStyle, title: "Δk (×10³ m⁻¹)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
