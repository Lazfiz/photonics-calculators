"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import {
  CD_OPTIMUM_ABSORBANCE, DELTA_EPS_CONV_PER_SI, MOLAR_ELLIPTICITY_CONV_PER_SI,
  deltaEpsilon, dissymmetryFactor, ellipticity, ellipticityLinear, meanResidueEllipticity, molarEllipticity, relativeCdSnr,
} from "../../../physics/polarization/circular-dichroism";

const MDEG_PER_RAD = (180 / Math.PI) * 1000;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** A value with its unit, or "—" when it is undefined. */
const val = (v: number, digits: number, unit = "") => (Number.isFinite(v) ? `${fix(v, digits)}${unit}` : "—");
/** Scientific notation for values that span many decades. */
const sci = (v: number, unit = "") => (Number.isFinite(v) ? `${v.toExponential(3)}${unit}` : "—");

export default function CircularDichroismPage() {
  const [aLIn, setAL] = useURLState("AL", 0.8);
  const [aRIn, setAR] = useURLState("AR", 0.79);
  const [cIn, setC] = useURLState("concentration", 0.1);
  const [lIn, setL] = useURLState("pathLength", 1);
  const [nIn, setN] = useURLState("residues", 0);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const AL = clamp(aLIn, 0, 4);
  const AR = clamp(aRIn, 0, 4);
  const c_mM = clamp(cIn, 0, 1000);
  const l_mm = clamp(lIn, 0, 100);
  const residues = clamp(nIn, 0, 100000);

  // SI at the physics boundary: 1 mM = 1 mol/m³; mm -> m.
  const c = c_mM, l = l_mm * 1e-3;
  const dA = AL - AR;
  const meanA = (AL + AR) / 2;
  const theta_mdeg = ellipticity(AL, AR) * MDEG_PER_RAD;
  const thetaLin_mdeg = ellipticityLinear(AL, AR) * MDEG_PER_RAD;
  const dEps = deltaEpsilon(AL, AR, c, l);
  const molar = molarEllipticity(dEps);
  const mre = meanResidueEllipticity(molar, residues);
  const g = dissymmetryFactor(AL, AR);
  const snr = relativeCdSnr(meanA);

  const chart = useMemo(() => {
    const aMax = Math.max(3, Math.ceil(meanA));
    const x = Array.from({ length: 200 }, (_, i) => (aMax * i) / 199);
    const data: Record<string, unknown>[] = [
      { x, y: x.map(relativeCdSnr), type: "scatter", mode: "lines", name: "Relative S/N", line: { color: "#60a5fa", width: 2 } },
      { x: [CD_OPTIMUM_ABSORBANCE], y: [1], type: "scatter", mode: "markers", name: "Optimum", line: { color: "#4ade80" }, marker: { color: "#4ade80", size: 8 } },
    ];
    const here = relativeCdSnr(meanA);
    if (Number.isFinite(here)) data.push({ x: [meanA], y: [here], type: "scatter", mode: "markers", name: "Your sample", line: { color: "#facc15" }, marker: { color: "#facc15", size: 8 } });
    return data;
  }, [meanA]);

  const layout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: "Mean absorbance (A_L + A_R)/2", gridcolor: "#374151" },
    yaxis: { title: "Relative CD S/N", gridcolor: "#374151" },
    margin: { t: 20, r: 20, b: 60, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  };

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>ΔA = A<sub>L</sub> − A<sub>R</sub> = Δε c l, &nbsp;tan θ = tanh(ln 10 · ΔA / 4)</p>
        <p>θ (mdeg) ≈ 32 980 ΔA &nbsp;(small ΔA), &nbsp;[θ] = 3298.2 Δε &nbsp;(deg·cm²·dmol⁻¹, Δε in M⁻¹cm⁻¹)</p>
        <p>g = 2ΔA / (A<sub>L</sub> + A<sub>R</sub>), &nbsp;[θ]<sub>MRE</sub> = [θ] / (N − 1), &nbsp;S/N ∝ A·10<sup>−A/2</sup> (best at A = 2/ln 10)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-2">
        <ValidatedNumberInput label="Absorbance of left-circular light A_L" value={AL} onChange={setAL} min={0} max={4} step="0.001" />
        <ValidatedNumberInput label="Absorbance of right-circular light A_R" value={AR} onChange={setAR} min={0} max={4} step="0.001" />
        <ValidatedNumberInput label="Concentration c of molecules (mM; for a protein, of chains)" value={c_mM} onChange={setC} min={0} max={1000} step="0.01" />
        <ValidatedNumberInput label="Path length l (mm)" value={l_mm} onChange={setL} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Residues N (0 = not a protein)" value={residues} onChange={setN} min={0} max={100000} step="1" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Δε needs c &gt; 0 and l &gt; 0. The mean-residue ellipticity is shown for a whole number of residues N ≥ 2 and uses N − 1 peptide bonds.
        {residues > 0 && !Number.isInteger(residues) ? " Enter N as a whole number." : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="ΔA = A_L − A_R" value={val(dA, 5)} tone="blue" />
        <ResultCard label="Ellipticity θ (exact)" value={val(theta_mdeg, 3, " mdeg")} tone="green"
          subtext={`small-angle ${val(thetaLin_mdeg, 3, " mdeg")}`} />
        <ResultCard label="Δε" value={val(dEps * DELTA_EPS_CONV_PER_SI, 3, " M⁻¹cm⁻¹")} tone="yellow"
          subtext={Number.isFinite(dEps) ? undefined : "Needs c > 0 and l > 0."} />
        <ResultCard label="Molar ellipticity [θ]" value={sci(molar * MOLAR_ELLIPTICITY_CONV_PER_SI, " deg·cm²·dmol⁻¹")} tone="purple" />
        {residues >= 2 && (
          <ResultCard label="Mean-residue ellipticity" value={sci(mre * MOLAR_ELLIPTICITY_CONV_PER_SI, " deg·cm²·dmol⁻¹")} tone="orange"
            subtext={Number.isFinite(mre) ? `[θ] / (N − 1), N = ${residues}` : "N must be a whole number."} />
        )}
        <ResultCard label="Dissymmetry factor g" value={val(g, 5)} tone="cyan" subtext="2ΔA / (A_L + A_R)" />
        <ResultCard label="Mean absorbance" value={val(meanA, 4)} tone="blue" subtext={`optimum for S/N: ${fix(CD_OPTIMUM_ABSORBANCE, 3)}`} />
        <ResultCard label="Relative S/N" value={val(snr, 3)} tone="green" subtext="1 at the optimum (shot-noise limit)" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Relative CD signal-to-noise against absorbance</h3>
        <ChartPanel data={chart} layout={layout} />
        <p className="text-xs text-gray-500 mt-2">
          At fixed g the shot-noise-limited S/N is proportional to A·10<sup>−A/2</sup>: it peaks at A = {fix(CD_OPTIMUM_ABSORBANCE, 3)}{" "}
          and falls on either side, so adjust c or l to bring the mean absorbance close to it.
        </p>
      </div>
    </>
  );
}
