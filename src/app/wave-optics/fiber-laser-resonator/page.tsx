"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FiberLaserResonatorPage() {
  const [fiberLength, setFiberLength] = useState(3); // m
  const [coreDiameter, setCoreDiameter] = useState(10); // µm
  const [NA, setNA] = useState(0.12);
  const [wavelength, setWavelength] = useState(1064); // nm
  const [pumpWavelength, setPumpWavelength] = useState(976); // nm
  const [R_oc, setR_oc] = useState(0.96); // output coupler reflectivity
  const [R_hr, setR_hr] = useState(0.999); // high reflector
  const [alpha, setAlpha] = useState(0.05); // dB/m background loss
  const [gainPerMeter, setGainPerMeter] = useState(1.5); // m^-1 small-signal gain coeff

  const coreRadius = coreDiameter / 2;
  const Vnumber = (Math.PI * coreDiameter * NA) / wavelength;
  const modeFieldDiameter = coreDiameter * (0.65 + 1.619 / Math.pow(Vnumber, 1.5) + 2.879 / Math.pow(Vnumber, 6));
  const A_mode = Math.PI * Math.pow(modeFieldDiameter / 2, 2) * 1e-12; // m²

  // Single-pass loss
  const alpha_np = alpha / (10 * Math.log10(Math.E)) * fiberLength; // Neper loss per round trip (single pass)
  const L_rt = alpha_np + Math.log(1 / R_oc) + Math.log(1 / R_hr); // total round-trip loss

  // Threshold: g_th = L_rt / (2L)
  const g_th = L_rt / (2 * fiberLength);

  // Threshold pump power estimate (simplified)
  const h = 6.626e-34;
  const c = 3e8;
  const sigma_em = 2.5e-25; // m² typical Yb emission cross-section
  const tau = 0.84e-3; // ms Yb lifetime
  const Isat = h * c / (wavelength * 1e-9 * sigma_em * tau);
  const P_th = Isat * A_mode * L_rt / (2 * (1 - Math.exp(-gainPerMeter * fiberLength)));

  // Slope efficiency (simplified)
  const eta_quantum = pumpWavelength / wavelength;
  const eta_slope = eta_quantum * Math.log(R_oc) / L_rt;

  // Output power vs pump power
  const piData = useMemo(() => {
    const pumps = Array.from({ length: 100 }, (_, i) => i * 20 / 100); // W
    const Pout = pumps.map(Pp => {
      if (Pp <= P_th) return 0;
      return eta_slope * (Pp - P_th);
    });
    return [
      { x: pumps, y: Pout, type: "scatter", mode: "lines", name: "Output Power", line: { color: "#60a5fa", width: 2 } },
      { x: pumps, y: pumps.map(() => P_th), type: "scatter", mode: "lines", name: "Threshold", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [P_th, eta_slope]);

  // Gain vs fiber length
  const gainData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => 0.5 + i * 10 / 100);
    const roundTripGain = lengths.map(L => 2 * gainPerMeter * L - L_rt);
    return [
      { x: lengths, y: roundTripGain, type: "scatter", mode: "lines", name: "Round-Trip Net Gain", line: { color: "#34d399", width: 2 } },
      { x: lengths, y: lengths.map(() => 0), type: "scatter", mode: "lines", name: "Threshold", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [gainPerMeter, L_rt]);

  // Mode field vs wavelength
  const modeData = useMemo(() => {
    const wls = Array.from({ length: 100 }, (_, i) => 900 + i * 400 / 100);
    const mfds = wls.map(wl => {
      const V = (Math.PI * coreDiameter * NA) / wl;
      return coreDiameter * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
    });
    return [{ x: wls, y: mfds, type: "scatter", mode: "lines", name: "MFD (µm)", line: { color: "#a78bfa", width: 2 } }];
  }, [coreDiameter, NA]);

  const plotLayout: any = {
    paper_bgcolor: "#111827",
    plot_bgcolor: "#1f2937",
    font: { color: "#e5e7eb" },
    xaxis: { gridcolor: "#374151" },
    yaxis: { gridcolor: "#374151" },
    margin: { t: 40, r: 20, b: 50, l: 60 },
    legend: { orientation: "h", y: -0.2 },
  };

  const inputStyle = "bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300">← Home</Link>
        <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300">← Wave Optics</Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">🔬 Fiber Laser Resonator Design</h1>
      <p className="text-gray-400 mb-6">Design and analyze fiber laser resonators — threshold, slope efficiency, mode field, and gain.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Fiber Length (m)</label>
          <input type="number" className={inputStyle} value={fiberLength} onChange={e => setFiberLength(+e.target.value)} step={0.1} min={0.1} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Core Diameter (µm)</label>
          <input type="number" className={inputStyle} value={coreDiameter} onChange={e => setCoreDiameter(+e.target.value)} step={1} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Numerical Aperture</label>
          <input type="number" className={inputStyle} value={NA} onChange={e => setNA(+e.target.value)} step={0.01} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Laser Wavelength (nm)</label>
          <input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Pump Wavelength (nm)</label>
          <input type="number" className={inputStyle} value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Output Coupler R</label>
          <input type="number" className={inputStyle} value={R_oc} onChange={e => setR_oc(+e.target.value)} step={0.01} min={0} max={1} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">HR Reflector R</label>
          <input type="number" className={inputStyle} value={R_hr} onChange={e => setR_hr(+e.target.value)} step={0.001} min={0} max={1} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Background Loss (dB/m)</label>
          <input type="number" className={inputStyle} value={alpha} onChange={e => setAlpha(+e.target.value)} step={0.01} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Small-Signal Gain (m⁻¹)</label>
          <input type="number" className={inputStyle} value={gainPerMeter} onChange={e => setGainPerMeter(+e.target.value)} step={0.1} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">V-number</div>
          <div className="text-xl font-bold text-blue-400">{Vnumber.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Mode Field Diameter</div>
          <div className="text-xl font-bold text-green-400">{modeFieldDiameter.toFixed(1)} µm</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Threshold Gain</div>
          <div className="text-xl font-bold text-red-400">{g_th.toFixed(3)} m⁻¹</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Slope Efficiency</div>
          <div className="text-xl font-bold text-yellow-400">{(eta_slope * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>V = π · d · NA / λ</p>
          <p>MFD ≈ d · (0.65 + 1.619/V^(3/2) + 2.879/V^6)</p>
          <p>g_th = δ_rt / (2L), where δ_rt = αL + ln(1/R_oc) + ln(1/R_hr)</p>
          <p>η_slope = η_q · ln(R_oc) / δ_rt, η_q = λ_p / λ_l</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Output Power vs Pump Power</h3>
          <Plot data={piData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump Power (W)" }, yaxis: { ...plotLayout.yaxis, title: "Output Power (W)" } }} config={{ responsive: true }} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Net Round-Trip Gain vs Fiber Length</h3>
          <Plot data={gainData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Fiber Length (m)" }, yaxis: { ...plotLayout.yaxis, title: "Net Gain" } }} config={{ responsive: true }} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Mode Field Diameter vs Wavelength</h3>
          <Plot data={modeData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "MFD (µm)" } }} config={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
}
