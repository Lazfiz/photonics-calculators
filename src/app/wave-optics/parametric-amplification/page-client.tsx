"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ParametricAmplificationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 500); // mW
  const [chi2, setChi2] = useURLState("chi2", 2.0); // pm/V
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 20); // mm
  const [pumpDepletion, setPumpDepletion] = useState(false);
  const [walkoff, setWalkoff] = useURLState("walkoff", 0.1); // mrad

  // Parametric gain
  const lambdaP = wavelength;
  const omegaP = 2 * Math.PI * 3e8 / (lambdaP * 1e-9);
  const n = 2.2; // typical PPLN
  const epsilon0 = 8.854e-12;
  const dEff = chi2 * 1e-12; // m/V

  // Small-signal parametric gain coefficient (Boyd, Nonlinear Optics Ch.2)
  // For degenerate OPA: g = (2ωs·deff)/(n·c) · √(2Ip/(ε₀·n·c))
  // where ωs = ωp/2 for degenerate case
  const omegaS = omegaP / 2;
  const gammaPA = (2 * omegaS * dEff) / (n * 3e8) * Math.sqrt(2 * pumpPower * 1e-3 / (epsilon0 * n * 3e8 * 8e-11));
  // Simplified gain in dB: G ≈ 10 log10(cosh²(γPL))
  const gL = gammaPA * crystalLength * 1e-3;
  const gainLinear = Math.cosh(gL) ** 2;
  const gainDB = 10 * Math.log10(gainLinear);

  // Gain vs crystal length
  const gainData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 50 / 200);
    const gains = lengths.map(L => {
      const g = gammaPA * L * 1e-3;
      return 10 * Math.log10(Math.cosh(g) ** 2);
    });
    return [
      { x: lengths, y: gains, type: "scatter", mode: "lines", name: "Parametric gain", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [wavelength, pumpPower, chi2, crystalLength]);

  // Gain bandwidth vs pump power
  const powerData = useMemo(() => {
    const powers = Array.from({ length: 200 }, (_, i) => 10 + i * 990 / 200);
    const gains = powers.map(P => {
      const gam = (2 * omegaS * dEff) / (n * 3e8) * Math.sqrt(2 * P * 1e-3 / (epsilon0 * n * 3e8 * 8e-11));
      return 10 * Math.log10(Math.cosh(gam * crystalLength * 1e-3) ** 2);
    });
    return [
      { x: powers, y: gains, type: "scatter", mode: "lines", name: "Gain vs P_pump", line: { color: "#34d399", width: 2 } },
    ];
  }, [wavelength, chi2, crystalLength]);

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Crystal length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const powerLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Pump power (mW)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // Bandwidth (phase-matching bandwidth via GVM)
  // Δω ≈ 2.78 / (|1/vg,i - 1/vg,s| · L) — RP Photonics / Boyd
  // walkoff input repurposed as GVM parameter (fs/mm): 1/vg,i - 1/vg,s
  const gvm = walkoff * 1e-3; // fs/mm → ps/m
  const bandwidthHz = gvm > 0 ? 2.78 / (gvm * crystalLength * 1e-3) : 0;
  const bandwidth = bandwidthHz * 1e-12; // Hz → THz
  const bwNm = bandwidthHz > 0 ? bandwidthHz * (wavelength * 1e-9) ** 2 / 3e8 * 1e9 : 0; // Hz → nm

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Parametric Amplification" description="Optical parametric amplification (OPA) gain and bandwidth in χ⁽²⁾ nonlinear crystals.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">G</span> = cosh²(g · L)</p>
        <p><span className="text-blue-400">g</span> = (2ω<sub>s</sub> d<sub>eff</sub> / n c) √(2I<sub>p</sub> / (ε₀ n c))</p>
        <p><span className="text-blue-400">G<sub>max</sub></span> = (P<sub>p</sub> / P<sub>th</sub>) · sinh²(gL) + cosh²(gL)</p>
        <p><span className="text-blue-400">Δν</span> ≈ 2.78 / (Δvg⁻¹ · L) — GVM bandwidth</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpPower} onChange={setPumpPower} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">d<sub>eff</sub> (pm/V)</span>
          <ValidatedNumberInput label="deff (pm/V)" value={chi2} onChange={setChi2} step="0.1" /></label>
        <ValidatedNumberInput label="Crystal Length (mm)" value={crystalLength} onChange={setCrystalLength} />
        <ValidatedNumberInput label="GVM (fs/mm)" value={walkoff} onChange={setWalkoff} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Parametric Gain</p>
          <p className="text-xl font-bold text-blue-400">{gainDB.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Gain Coefficient g</p>
          <p className="text-xl font-bold text-green-400">{gammaPA.toFixed(2)} m⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">g · L Product</p>
          <p className="text-xl font-bold text-orange-400">{gL.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth</p>
          <p className="text-xl font-bold text-purple-400">{isFinite(bwNm) ? bwNm.toFixed(1) : "—"} nm</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={gainData} layout={plotLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={powerData} layout={powerLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
