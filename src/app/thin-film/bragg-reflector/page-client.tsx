"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stopBandEdges } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, quarterWaveStackReflectance, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";
import {
  bilayerBlochCos, blochPhase, quarterWaveDecayPerPeriod, quarterWaveGapMidgap, quarterWavePeriod,
} from "../../../physics/thin-film/photonic-crystal";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

/** Bloch phase of the infinite quarter-wave crystal against normalised frequency Λ/λ, for g = λ₀/λ in (0, 3.5]. */
function bandDiagram(nH: number, nL: number) {
  const x: number[] = [];
  const re: number[] = [];
  const im: number[] = [];
  const lambda0 = 1; // the diagram is scale-free in Λ/λ
  const period = quarterWavePeriod(lambda0, nH, nL);
  for (let i = 1; i <= 700; i++) {
    const g = (3.5 * i) / 700;
    const k = blochPhase(bilayerBlochCos(nH, lambda0 / (4 * nH), nL, lambda0 / (4 * nL), lambda0 / g));
    x.push(round6(g * period));
    re.push(round6(k.re / Math.PI));
    im.push(round6(k.im));
  }
  return [
    { x, y: re, type: "scatter" as const, mode: "lines" as const, name: "Re KΛ/π", line: { color: "#60a5fa" }, marker: { color: "#60a5fa" } },
    { x, y: im, type: "scatter" as const, mode: "lines" as const, name: "Im KΛ (Np per period)", yaxis: "y2", line: { color: "#f87171" }, marker: { color: "#f87171" } },
  ];
}

export default function BraggReflectorPage() {
  const [nIncRaw, setNInc] = useURLState("nInc", 1.0);
  const [nHRaw, setNH] = useURLState("nH", 2.35);
  const [nLRaw, setNL] = useURLState("nL", 1.45);
  const [nSubRaw, setNSub] = useURLState("nSub", 1.52);
  const [wlRaw, setDesignWavelength] = useURLState("designWavelength", 1550);
  const [pairsRaw, setPairs] = useURLState("pairs", 5);
  // useURLState does not clamp URL values, so clamp here and use these everywhere.
  const nInc = clamp(nIncRaw, 1, 5, 1);
  const nH = clamp(nHRaw, 0.1, 10, 2.35);
  const nL = clamp(nLRaw, 0.1, 10, 1.45);
  const nSub = clamp(nSubRaw, 0.1, 10, 1.52);
  const designWavelength = clamp(wlRaw, 100, 20000, 1550);
  const pairs = Math.round(clamp(pairsRaw, 1, 30, 5));

  // Stack: incident | (H L)^N | substrate. One index array feeds the plotted stack and the peak-R card.
  const indices = useMemo(() => Array.from({ length: 2 * pairs }, (_, j) => (j % 2 === 0 ? nH : nL)), [pairs, nH, nL]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => designWavelength * 0.7 + i * designWavelength * 0.6 / 300);
    const layers = quarterWaveLayers(indices, designWavelength * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));
    return [{ x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } }];
  }, [nInc, indices, nSub, designWavelength]);

  // Closed form at λ₀ for the same layers as the plot.
  const peakR = quarterWaveStackReflectance(nInc, indices, nSub);
  const band = stopBandEdges(designWavelength * 1e-9, nH, nL);
  const period = quarterWavePeriod(designWavelength * 1e-9, nH, nL);
  const gapMidgap = quarterWaveGapMidgap(nH, nL);
  const kappa = quarterWaveDecayPerPeriod(nH, nL);
  const bands = Number.isFinite(period) && nH !== nL ? bandDiagram(nH, nL) : null;
  const bandText = Number.isFinite(band.short) && Number.isFinite(band.long)
    ? `${(band.short * 1e9).toFixed(1)}–${(band.long * 1e9).toFixed(1)} nm, width ${((band.long - band.short) * 1e9).toFixed(1)} nm`
    : "—";

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nIncRaw} onChange={setNInc} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>high</sub></>} value={nHRaw} onChange={setNH} min={0.1} max={10} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>low</sub></>} value={nLRaw} onChange={setNL} min={0.1} max={10} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSubRaw} onChange={setNSub} min={0.1} max={10} step="0.01" />
        <ValidatedNumberInput label="Design Wavelength (nm)" value={wlRaw} onChange={setDesignWavelength} min={100} max={20000} />
        <ValidatedNumberInput label="Number of Pairs" value={pairsRaw} onChange={setPairs} min={1} max={30} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Peak Reflectance (at λ₀)</p>
          <p className="text-3xl font-bold text-blue-400">{Number.isFinite(peakR) ? `${(peakR * 100).toFixed(4)}%` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Δn = {Number.isFinite(nH - nL) ? (nH - nL).toFixed(2) : "—"}, {pairs} pairs, λ₀ = {designWavelength} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Stop band (infinite-stack edges)</p>
          <p className="text-xl font-bold text-green-400">{bandText}</p>
          <p className="text-sm text-gray-500 mt-1">gap/midgap Δω/ω₀ = {Number.isFinite(gapMidgap) ? `${(gapMidgap * 100).toFixed(2)} %` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Period Λ = d<sub>H</sub> + d<sub>L</sub></p>
          <p className="text-xl font-bold text-purple-400">{Number.isFinite(period) ? `${(period * 1e9).toFixed(2)} nm` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">
            d<sub>H</sub> = {(designWavelength / (4 * nH)).toFixed(2)} nm, d<sub>L</sub> = {(designWavelength / (4 * nL)).toFixed(2)} nm
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Bloch decay at λ₀: κ = ln(n<sub>H</sub>/n<sub>L</sub>)</p>
          <p className="text-xl font-bold text-orange-400">{kappa > 0 ? `${kappa.toFixed(4)} Np per period` : "no gap (n_H = n_L)"}</p>
          <p className="text-sm text-gray-500 mt-1">
            {kappa > 0 ? `field falls to 1/e in ${(1 / kappa).toFixed(2)} periods (${((period / kappa) * 1e9).toFixed(0)} nm)` : ""}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      {bands && (
        <div className="bg-gray-900 rounded-lg p-4 mt-6">
          <p className="text-sm text-gray-400 mb-2">Band structure of the infinite crystal (1D photonic crystal)</p>
          <ChartPanel data={bands} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Normalised frequency ωΛ/2πc = Λ/λ", gridcolor: "#374151" },
            yaxis: { title: "Re KΛ/π", gridcolor: "#374151", range: [0, 1.05] },
            yaxis2: { title: "Im KΛ (Np per period)", overlaying: "y", side: "right" },
            margin: { t: 30, r: 70, b: 50, l: 70 },
          }} />
          <p className="text-sm text-gray-400 mt-3">
            Bloch waves of the endless (HL) stack: cos KΛ = cos δ<sub>H</sub> cos δ<sub>L</sub> − ½(n<sub>H</sub>/n<sub>L</sub> + n<sub>L</sub>/n<sub>H</sub>) sin δ<sub>H</sub> sin δ<sub>L</sub>.
            Where |cos KΛ| &gt; 1 the wave decays by Im KΛ per period: these are the stop bands, at odd multiples of the
            design frequency for quarter-wave layers. N pairs between equal media reflect tanh²(N·Im KΛ) at the band centre.
          </p>
        </div>
      )}
    </>
  );
}
