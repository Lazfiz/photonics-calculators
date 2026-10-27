"use client";

import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  CONFOCAL_MAX_PINHOLE_AU, confocalLateralFwhm, confocalOpticalSectionFwhm, pinholeThroughput,
} from "../../../physics/imaging/confocal";
import { airyUnit, confocalSectionFwhm } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ConfocalPinholePage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 488); // nm
  const [naRaw, setNA] = useURLState("na", 1.4);
  const [magnificationRaw, setMagnification] = useURLState("magnification", 60);
  const [nImmersionRaw, setNImmersion] = useURLState("nImmersion", 1.515);
  const [pinholeAURaw, setPinholeAU] = useURLState("pinholeAU", 1);
  const wavelength = clamp(wavelengthRaw, 300, 2000, 488);
  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const magnification = clamp(magnificationRaw, 1, 500, 60);
  const n = clamp(nImmersionRaw, 1, 1.8, 1.515);
  const pinholeAU = clamp(pinholeAURaw, 0, CONFOCAL_MAX_PINHOLE_AU, 1);
  const lambda = wavelength * 1e-9;
  const valid = na < n;

  const airyObjectNm = airyUnit(lambda, na) * 1e9;
  const airyPinholeUm = (airyObjectNm * magnification) / 1000;
  const pinholeUm = pinholeAU * airyPinholeUm;
  const throughput = pinholeThroughput(pinholeAU);
  const lateralNm = confocalLateralFwhm(lambda, na, pinholeAU) * 1e9;
  const sectionNm = confocalOpticalSectionFwhm(lambda, n, na, pinholeAU) * 1e9;
  const wilhelmNm = confocalSectionFwhm(lambda, n, na, pinholeAU) * 1e9;
  const wilhelmPct = (100 * (wilhelmNm - sectionNm)) / sectionNm;

  const aus = Array.from({ length: 51 }, (_, i) => i / 10);
  const chartData = [
    { x: aus, y: aus.map((p) => confocalOpticalSectionFwhm(lambda, n, na, p) * 1e9), type: "scatter" as const, mode: "lines" as const, name: "Optical section FWHM (nm)", line: { color: "#60a5fa" } },
    { x: aus, y: aus.map((p) => confocalLateralFwhm(lambda, na, p) * 1e9), type: "scatter" as const, mode: "lines" as const, name: "Lateral FWHM (nm)", line: { color: "#34d399" } },
    { x: aus, y: aus.map((p) => 100 * pinholeThroughput(p)), type: "scatter" as const, mode: "lines" as const, name: "Throughput (%)", line: { color: "#f87171", dash: "dash" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
        <ValidatedNumberInput label="NA" value={naRaw} onChange={setNA} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Magnification to the pinhole" value={magnificationRaw} onChange={setMagnification} min={1} max={500} />
        <ValidatedNumberInput label="Immersion RI (n)" value={nImmersionRaw} onChange={setNImmersion} min={1} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Pinhole (Airy units)" value={pinholeAURaw} onChange={setPinholeAU} min={0} max={CONFOCAL_MAX_PINHOLE_AU} step="0.1" />
      </div>

      {!valid && (
        <p className="text-red-400 mb-6">NA {na} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
      )}

      {valid && (
        <>
          <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
            <p className="text-gray-300">1 Airy unit at the sample = 1.22 λ/NA = <span className="text-blue-400 font-mono">{airyObjectNm.toFixed(1)} nm</span></p>
            <p className="text-gray-300">1 Airy unit at the pinhole = <span className="text-blue-400 font-mono">{airyPinholeUm.toFixed(2)} µm</span></p>
            <p className="text-gray-300">Pinhole diameter ({pinholeAU} AU) = <span className="text-blue-400 font-mono">{pinholeUm.toFixed(2)} µm</span></p>
            <p className="text-gray-300">Throughput of an in-focus point = <span className="text-red-400 font-mono">{(100 * throughput).toFixed(1)} %</span></p>
            <p className="text-gray-300">Lateral FWHM = <span className="text-green-400 font-mono">{lateralNm.toFixed(1)} nm</span></p>
            <p className="text-gray-300">Optical section FWHM = <span className="text-blue-400 font-mono">{sectionNm.toFixed(0)} nm</span></p>
            <p className="text-gray-300">
              Wilhelm&apos;s geometric formula (valid ≥ 1 AU) ={" "}
              <span className="text-gray-400 font-mono">{pinholeAU >= 1 ? `${wilhelmNm.toFixed(0)} nm` : "—"}</span>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Model</h3>
            <div className="text-sm text-gray-300 space-y-1 font-mono">
              <p>1 AU = 1.22 λ/NA at the sample, × M at the pinhole</p>
              <p>Throughput = 1 − J₀²(v) − J₁²(v), v = 3.832 × pinhole (AU)</p>
              <p>Lateral FWHM: 0.37 λ/NA (pinhole → 0) to 0.51 λ/NA (open)</p>
              <p>Section FWHM: 0.68 λ/(n − √(n² − NA²)) (pinhole → 0), 0.88 at 1 AU, growing with the pinhole</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Scalar paraxial theory of a confocal fluorescence microscope with equal excitation and emission
              wavelengths; a Stokes shift widens both FWHMs slightly. The optical section is the response to a thin
              fluorescent plane. Wilhelm&apos;s geometric formula √[(0.88 λ/(n − √(n² − NA²)))² + (√2 n PH/NA)²]{" "}
              {pinholeAU >= 1 && Number.isFinite(wilhelmPct) ? `lies ${wilhelmPct.toFixed(0)} % above it here` : "lies above it from 1 AU upward (set the pinhole to 1 AU or more to see by how much)"}.
              From 1 to 0.5 AU the lateral FWHM narrows from 0.50 to 0.40 λ/NA (20 %) while the throughput falls from 84 % to 59 %.
            </p>
          </div>

          <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pinhole size (Airy units)", gridcolor: "#374151" }, yaxis: { title: "FWHM (nm)", gridcolor: "#374151" }, yaxis2: { title: "Throughput (%)", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 105] }, margin: { t: 20, b: 40, l: 60, r: 60 }, autosize: true, showlegend: true }} />
        </>
      )}
    </>
  );
}
