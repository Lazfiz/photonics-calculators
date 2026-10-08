"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { aliasFreeBandwidth, beatNote, rfMapping } from "../../../physics/spectroscopy/dual-comb-spectroscopy";

const CHART_TEETH = 800;

const fmt = (x: number, digits = 4) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e6 ? x.toPrecision(digits) : x.toExponential(3);

/** Frequency width at λ as a wavelength width, nm. */
const toNm = (df: number, lambda_nm: number) => (lambda_nm ** 2 * df) / (c * 1e9);

export default function DualCombSpectroscopyPage() {
  const [repRate1, setRepRate1] = useURLState("repRate1", 100); // MHz
  const [repRate2, setRepRate2] = useURLState("repRate2", 100.0002); // MHz
  const [ceoFreq1, setCeoFreq1] = useURLState("ceoFreq1", 20); // MHz
  const [ceoFreq2, setCeoFreq2] = useURLState("ceoFreq2", 20.1); // MHz
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 1550); // nm
  const [numModes, setNumModes] = useURLState("numModes", 100000);

  const calc = useMemo(() => {
    const comb1 = { frep: repRate1 * 1e6, fceo: ceoFreq1 * 1e6 };
    const comb2 = { frep: repRate2 * 1e6, fceo: ceoFreq2 * 1e6 };
    const nuCenter = c / (centerWavelength * 1e-9);
    const N = Math.max(2, Math.round(numModes));
    const dfr = comb2.frep - comb1.frep;
    const map = rfMapping(comb1, comb2, nuCenter, N);
    const opticalBW = (N - 1) * comb1.frep;
    const limit = aliasFreeBandwidth(comb1, comb2);
    return { comb1, comb2, nuCenter, N, dfr, map, opticalBW, limit };
  }, [repRate1, repRate2, ceoFreq1, ceoFreq2, centerWavelength, numModes]);

  const mappingData = useMemo(() => {
    const { comb1, comb2, nuCenter, map, N } = calc;
    if (calc.dfr === 0) return [];
    const step = Math.max(1, Math.floor(N / CHART_TEETH));
    const teeth = Array.from({ length: Math.floor((N - 1) / step) + 1 }, (_, i) => map.nFirst + i * step);
    const x = teeth.map((n) => (n * comb1.frep + comb1.fceo - nuCenter) / 1e12);
    return [
      {
        x, y: teeth.map((n) => Math.abs(beatNote(comb1, comb2, n)) / 1e6), type: "scatter", mode: "markers",
        name: "RF beat of each tooth pair", marker: { color: map.aliasFree ? "#a78bfa" : "#f87171", size: 3 },
      },
      {
        x: [x[0], x[x.length - 1]], y: [comb2.frep / 2e6, comb2.frep / 2e6], type: "scatter", mode: "lines",
        name: "f_r/2 (Nyquist)", line: { color: "#6b7280", width: 1, dash: "dash" },
      },
    ];
  }, [calc]);

  const { map, dfr } = calc;
  const fr = calc.comb1.frep;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Comb 1 rep rate f_r (MHz)" value={repRate1} onChange={setRepRate1} min={1} max={100000} step="0.1" />
        <ValidatedNumberInput label="Comb 2 rep rate (MHz)" value={repRate2} onChange={setRepRate2} min={1} max={100000} step="0.0001" />
        <ValidatedNumberInput label="Number of comb teeth N" value={numModes} onChange={setNumModes} min={2} max={10000000} step="10000" />
        <ValidatedNumberInput label="f_CEO comb 1 (MHz)" value={ceoFreq1} onChange={setCeoFreq1} min={0} max={100000} step="0.1" />
        <ValidatedNumberInput label="f_CEO comb 2 (MHz)" value={ceoFreq2} onChange={setCeoFreq2} min={0} max={100000} step="0.1" />
        <ValidatedNumberInput label="Center wavelength (nm)" value={centerWavelength} onChange={setCenterWavelength} min={200} max={20000} />
      </div>

      {dfr === 0 ? (
        <p className="mb-6 text-sm text-yellow-300" role="status">Equal repetition rates: the two combs give no dual-comb interferogram.</p>
      ) : !map.aliasFree ? (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Aliased: two or more optical teeth share an RF frequency.{" "}
          {calc.opticalBW > calc.limit
            ? `The optical band (${fmt(calc.opticalBW / 1e12)} THz) exceeds f_r²/(2Δf_r) = ${fmt(calc.limit / 1e12)} THz; reduce N or Δf_r, or filter the spectrum.`
            : `The band fits in principle; shift f_CEO of comb 2 by ${fmt(map.offsetToCentre / 1e6)} MHz to centre its image at f_r/4.`}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Δf_r" value={`${fmt(dfr)} Hz`} tone="green" subtext={`compression f_r/Δf_r = ${fmt(Math.abs(fr / dfr))}`} />
        <ResultCard label="Update time 1/Δf_r" value={`${fmt(1e3 / Math.abs(dfr))} ms`} tone="blue" subtext="one interferogram" />
        <ResultCard label="Optical bandwidth" value={`${fmt(calc.opticalBW / 1e12)} THz`} tone="yellow" subtext={`${fmt(toNm(calc.opticalBW, centerWavelength))} nm`} />
        <ResultCard
          label="Alias-free limit f_r²/(2Δf_r)"
          value={`${fmt(calc.limit / 1e12)} THz`}
          tone={calc.opticalBW <= calc.limit ? "green" : "red"}
          subtext={`${fmt(toNm(calc.limit, centerWavelength))} nm`}
        />
        <ResultCard
          label="RF image of the band"
          value={map.aliasFree ? `${fmt(map.rfMin / 1e6)}–${fmt(map.rfMax / 1e6)} MHz` : "aliased"}
          tone={map.aliasFree ? "purple" : "red"}
          subtext={`N·Δf_r = ${fmt((calc.N * Math.abs(dfr)) / 1e6)} MHz of [0, ${fmt(fr / 2e6)}] MHz`}
        />
        <ResultCard label="Resolution (tooth spacing)" value={`${fmt(fr / 1e6)} MHz`} tone="gray" subtext={`${fmt(toNm(fr, centerWavelength) * 1e3)} pm`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Optical → RF Mapping</h3>
        <ChartPanel data={mappingData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Optical frequency − ν_c (THz)", gridcolor: "#374151" },
          yaxis: { title: "RF frequency (MHz)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 }, height: 340,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
        }} />
        <p className="text-sm text-gray-400 mt-2">
          Each comb-1 tooth beats with the nearest comb-2 tooth. Alias-free, the points form one straight line inside
          [0, f_r/2]; a fold at 0 or at f_r/2 means two optical frequencies land on the same RF frequency.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">ν<sub>j</sub>(n) = n f<sub>r,j</sub> + f<sub>0,j</sub>,   f<sub>RF</sub>(n) = |wrap(n Δf<sub>r</sub> + Δf<sub>0</sub>)|  into [0, f<sub>r</sub>/2]</p>
          <p className="font-mono">Δν ≤ f<sub>r</sub>²/(2Δf<sub>r</sub>),   T<sub>update</sub> = 1/Δf<sub>r</sub>,   compression = f<sub>r</sub>/Δf<sub>r</sub></p>
          <p>
            Comb equation and sampling arithmetic, exact (Coddington, Newbury &amp; Swann, &quot;Dual-comb spectroscopy&quot;,
            Optica 3, 414, 2016). The interferogram is sampled once per pulse, so its Nyquist frequency is f<sub>r</sub>/2.
            The band&apos;s image must sit inside one half-band, which depends on the absolute tooth numbers and the
            offset frequencies, not only on the bandwidth limit.
          </p>
        </div>
      </div>
    </>
  );
}
