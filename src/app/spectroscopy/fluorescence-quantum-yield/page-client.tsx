"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { absorptance, relativeQuantumYield, type QuantumYieldInput } from "../../../physics/spectroscopy/quantum-yield";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);

export default function FluorescenceQuantumYieldPage() {
  const [sampleIntRaw, setSampleInt] = useURLState("sampleInt", 50000);
  const [refIntRaw, setRefInt] = useURLState("refInt", 80000);
  const [sampleAbsRaw, setSampleAbs] = useURLState("sampleAbs", 0.05);
  const [refAbsRaw, setRefAbs] = useURLState("refAbs", 0.1);
  const [refQYRaw, setRefQY] = useURLState("refQY", 0.546);
  const [nSampleRaw, setNSample] = useURLState("refrIdxSample", 1.333);
  const [nRefRaw, setNRef] = useURLState("refrIdxRef", 1.333);

  const q: QuantumYieldInput = {
    sampleEmission: clamp(sampleIntRaw, 0, 1e15, 50000),
    referenceEmission: clamp(refIntRaw, 0, 1e15, 80000),
    sampleAbsorbance: clamp(sampleAbsRaw, 0, 5, 0.05),
    referenceAbsorbance: clamp(refAbsRaw, 0, 5, 0.1),
    sampleIndex: clamp(nSampleRaw, 1, 3, 1.333),
    referenceIndex: clamp(nRefRaw, 1, 3, 1.333),
    referenceYield: clamp(refQYRaw, 0, 1, 0.546),
  };
  const phi = relativeQuantumYield(q);
  const phiLinear = relativeQuantumYield(q, "absorbance");
  const reason = q.referenceEmission === 0 ? "reference emission is 0"
    : q.sampleAbsorbance === 0 || q.referenceAbsorbance === 0 ? "an absorbance is 0" : "";
  const overOne = phi > 1;
  const fS = absorptance(q.sampleAbsorbance), fR = absorptance(q.referenceAbsorbance);
  const linearError = phiLinear / phi - 1;
  const highA = Math.max(q.sampleAbsorbance, q.referenceAbsorbance) > 0.1;

  // f/(A ln 10): how far the absorptance is from the linear (small-A) form
  const As = Array.from({ length: 200 }, (_, i) => 0.005 + (i / 199) * 0.995);
  const ratio = (A: number) => absorptance(A) / (A * Math.LN10);
  const chart = [
    { x: As, y: As.map((A) => r6(ratio(A))), type: "scatter", mode: "lines", name: "(1 − 10^(−A)) / (A ln 10)", line: { color: "#60a5fa", width: 2 } },
    ...(q.sampleAbsorbance > 0 ? [{ x: [q.sampleAbsorbance], y: [r6(ratio(q.sampleAbsorbance))], type: "scatter", mode: "markers", name: "Sample", line: { color: "#f87171" }, marker: { color: "#f87171", size: 10 } }] : []),
    ...(q.referenceAbsorbance > 0 ? [{ x: [q.referenceAbsorbance], y: [r6(ratio(q.referenceAbsorbance))], type: "scatter", mode: "markers", name: "Reference", line: { color: "#34d399" }, marker: { color: "#34d399", size: 10 } }] : []),
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Sample Integrated Emission F_s" value={sampleIntRaw} onChange={setSampleInt} min={0} max={1e15} step="1000" />
        <ValidatedNumberInput label="Reference Integrated Emission F_ref" value={refIntRaw} onChange={setRefInt} min={0} max={1e15} step="1000" />
        <ValidatedNumberInput label="Reference Φ_ref (quinine sulfate, 0.5 M H₂SO₄: 0.546)" value={refQYRaw} onChange={setRefQY} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Sample Absorbance A_s at λ_ex" value={sampleAbsRaw} onChange={setSampleAbs} min={0} max={5} step="0.01" />
        <ValidatedNumberInput label="Reference Absorbance A_ref at λ_ex" value={refAbsRaw} onChange={setRefAbs} min={0} max={5} step="0.01" />
        <div />
        <ValidatedNumberInput label="Refractive Index n_s (sample solvent)" value={nSampleRaw} onChange={setNSample} min={1} max={3} step="0.001" />
        <ValidatedNumberInput label="Refractive Index n_ref (reference solvent)" value={nRefRaw} onChange={setNRef} min={1} max={3} step="0.001" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Quantum Yield Φ_s" value={overOne ? `${fmt(phi)} (> 1)` : fmt(phi)} tone={overOne ? "red" : "blue"}
          subtext={reason ? `undefined: ${reason}` : overOne ? "above 1: the inputs are inconsistent (check standard, absorbances, detector)" : `${fmt(phi * 100, 3)} %, absorptance form`} />
        <ResultCard label="Absorbance-Ratio Approximation" value={fmt(phiLinear)} tone="purple"
          subtext={Number.isFinite(linearError) ? `A_ref/A_s in place of f_ref/f_s: ${linearError >= 0 ? "+" : ""}${fmt(linearError * 100, 3)} %` : "—"} />
        <ResultCard label="Absorbed Fractions f = 1 − 10^(−A)" value={`${fmt(fS, 4)} / ${fmt(fR, 4)}`} tone="green" subtext="sample / reference" />
        <ResultCard label="Refractive-Index Factor (n_s/n_ref)²" value={fmt((q.sampleIndex / q.referenceIndex) ** 2)} tone={highA ? "orange" : "gray"}
          subtext={highA ? "A > 0.1: inner-filter effects likely, dilute the samples" : "A ≤ 0.1: inner-filter effects small"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">Φ_s = Φ_ref · (F_s / F_ref) · (f_ref / f_s) · (n_s² / n_ref²),  f = 1 − 10^(−A)</p>
        <p>F is the integrated, spectrally corrected emission, measured with the same excitation wavelength, slit widths and geometry for sample and reference. f is the fraction of excitation light absorbed; the common A_ref/A_s form is its small-absorbance limit and errs when the two absorbances differ.</p>
        <p className="text-gray-400">Keep A ≲ 0.1 (1 cm cell) so that the excitation is uniform through the cell and reabsorption of the emission is negligible; the absorptance does not correct for either. Recommended standards and their yields are reviewed by Brouwer (2011).</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Absorptance vs Its Linear Approximation", font: { color: "white" } },
          xaxis: { title: "Absorbance A", gridcolor: "#374151" },
          yaxis: { title: "f / (A ln 10)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </>
  );
}
