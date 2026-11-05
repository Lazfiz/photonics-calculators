"use client";

import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  CONFOCAL_MAX_PINHOLE_AU, SPINNING_DISK_MAX_PITCH_AU, confocalAxialCoordinate, confocalLateralFwhm,
  confocalOpticalSectionFwhm, pinholeAiryUnits, pinholeFillFactor, pinholeSectionFourier, pinholeThroughput,
  spinningDiskFrameRate, spinningDiskSection,
} from "../../../physics/imaging/confocal";
import { airyUnit, confocalSectionFwhm } from "../../../physics/imaging/optical-sectioning-thickness";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

/** Disk section with crosstalk, its floor and FWHM (m), and the thin-plane response curves against defocus (µm). */
function crosstalkSection(pinholeAU: number, pitchAU: number, zPerU: number) {
  const model = spinningDiskSection(pinholeAU, pitchAU);
  const single0 = pinholeSectionFourier(0, pinholeAU);
  const uMax = Number.isFinite(model.halfWidthU) ? 6 * model.halfWidthU : 30;
  const us = Array.from({ length: 61 }, (_, i) => (i / 60) * uMax);
  const zs = us.map((u) => u * zPerU * 1e6);
  return {
    floor: model.floor,
    fwhm: 2 * model.halfWidthU * zPerU,
    chart: [
      { x: zs, y: us.map((u) => pinholeSectionFourier(u, pinholeAU) / single0), name: "Single pinhole", line: { color: "#60a5fa", dash: "dash" }, type: "scatter", mode: "lines" },
      { x: zs, y: us.map(model.response), name: "Disk (with crosstalk)", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: [0, zs[60]], y: [model.floor, model.floor], name: "Crosstalk floor", line: { color: "#fbbf24", dash: "dot" }, type: "scatter", mode: "lines" },
    ],
  };
}

export default function SpinningDiskPage() {
  const [naRaw, setNa] = useURLState("na", 0.8);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 488);
  const [nRaw, setN] = useURLState("n", 1.33);
  const [magnificationRaw, setMagnification] = useURLState("magnification", 60);
  const [pinholeDiamRaw, setPinholeDiam] = useURLState("pinholeDiam", 50);
  const [pitchRaw, setPitch] = useURLState("pinholePitch", 250);
  const [diskRPMRaw, setDiskRPM] = useURLState("diskRPM", 5000);
  const [scansRaw, setScans] = useURLState("scansPerRev", 12);
  const [exposureRaw, setExposure] = useURLState("cameraExposure", 100);
  const na = clamp(naRaw, 0.1, 1.7, 0.8);
  const wavelength = clamp(wavelengthRaw, 300, 2000, 488);
  const n = clamp(nRaw, 1, 1.8, 1.33);
  const magnification = clamp(magnificationRaw, 10, 150, 60);
  const pinholeDiam = clamp(pinholeDiamRaw, 5, 200, 50);
  const pitch = clamp(pitchRaw, 20, 1000, 250);
  const diskRPM = clamp(diskRPMRaw, 0, 15000, 5000);
  const scans = clamp(scansRaw, 1, 36, 12);
  const exposureMs = clamp(exposureRaw, 0.01, 10000, 100);
  const lambda = wavelength * 1e-9;
  const valid = na < n;

  const airyNm = airyUnit(lambda, na) * 1e9;
  const pinholeAU = pinholeAiryUnits(pinholeDiam * 1e-6, magnification, lambda, na);
  const pitchAU = pinholeAiryUnits(pitch * 1e-6, magnification, lambda, na);
  const inTable = pinholeAU <= CONFOCAL_MAX_PINHOLE_AU;
  const lateralNm = confocalLateralFwhm(lambda, na, pinholeAU) * 1e9;
  const sectionNm = confocalOpticalSectionFwhm(lambda, n, na, pinholeAU) * 1e9;
  const wilhelmNm = confocalSectionFwhm(lambda, n, na, pinholeAU) * 1e9;
  const throughput = pinholeThroughput(pinholeAU);
  const frameRate = spinningDiskFrameRate(diskRPM, scans);
  const fill = pinholeFillFactor(pinholeDiam, pitch);
  const scansPerExposure = (exposureMs / 1000) * frameRate;
  const bandingDepth = scansPerExposure > 0 ? Math.abs(scansPerExposure - Math.round(scansPerExposure)) / scansPerExposure : 1;
  const banding = !(bandingDepth <= 0.01);
  const pinholeTooBig = pinholeDiam > pitch;
  // Defocus z (m) per unit of the optical coordinate u.
  const zPerU = 1 / confocalAxialCoordinate(1, lambda, n, na);
  const crosstalk = crosstalkSection(pinholeAU, pitchAU, zPerU);
  const widePitch = pitchAU > SPINNING_DISK_MAX_PITCH_AU;
  const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");

  const auMax = Math.max(5, 1.1 * pinholeAU);
  const aus = Array.from({ length: 51 }, (_, i) => (i / 50) * auMax);
  const plotData = [
    { x: aus, y: aus.map((p) => confocalOpticalSectionFwhm(lambda, n, na, p) * 1e9), name: "Optical section FWHM (nm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
    { x: aus, y: aus.map((p) => 100 * pinholeThroughput(p)), name: "Pinhole throughput (%)", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    { x: [pinholeAU], y: [sectionNm], name: "This disk", marker: { color: "#fbbf24", size: 10 }, type: "scatter", mode: "markers" },
  ];

  const row = (label: string, value: string, color = "") => (
    <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">{label}</span><span className={`font-mono ${color}`}>{value}</span></div>
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="NA" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} />
          <ValidatedNumberInput label="Refractive index (n)" value={nRaw} onChange={setN} min={1} max={1.8} step="0.01" />
          <ValidatedNumberInput label="Magnification to the disk" value={magnificationRaw} onChange={setMagnification} min={10} max={150} />
          <ValidatedNumberInput label="Pinhole diameter (µm)" value={pinholeDiamRaw} onChange={setPinholeDiam} min={5} max={200} />
          <ValidatedNumberInput label="Pinhole pitch (µm)" value={pitchRaw} onChange={setPitch} min={20} max={1000} />
          <ValidatedNumberInput label="Disk speed (RPM)" value={diskRPMRaw} onChange={setDiskRPM} min={0} max={15000} />
          <ValidatedNumberInput label="Field scans per revolution" value={scansRaw} onChange={setScans} min={1} max={36} />
          <ValidatedNumberInput label="Camera exposure (ms)" value={exposureRaw} onChange={setExposure} min={0.01} max={10000} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {!valid ? (
            <p className="text-red-400">NA {na} is not possible in a medium of n = {n}: NA = n sin α must stay below n.</p>
          ) : (
            <>
              {row("Airy unit (sample)", fmt(airyNm, 1, "nm"))}
              {row("Pinhole size", fmt(pinholeAU, 2, "AU"), "text-blue-400")}
              {row("Pinhole pitch", fmt(pitchAU, 1, "AU"))}
              {row("Pinhole throughput (in focus)", fmt(100 * throughput, 1, "%"))}
              {row("Lateral FWHM", inTable ? fmt(lateralNm, 1, "nm") : "> 5 AU", "text-green-400")}
              {row("Optical section FWHM", inTable ? fmt(sectionNm, 0, "nm") : "> 5 AU", "text-purple-400")}
              {row("Wilhelm geometric (≥ 1 AU)", pinholeAU >= 1 ? fmt(wilhelmNm, 0, "nm") : "—")}
              {row("Optical section FWHM, disk with crosstalk", widePitch ? "≈ single pinhole" : fmt(crosstalk.fwhm * 1e9, 0, "nm"), "text-purple-400")}
              {row("Crosstalk floor (plane far out of focus)", fmt(100 * crosstalk.floor, 2, "%"), crosstalk.floor > 0.05 ? "text-yellow-400" : "")}
              {Number.isFinite(crosstalk.floor) && Number.isFinite(crosstalk.fwhm) && (
                <p className="text-sm text-gray-400">
                  In a thick, uniformly labelled sample the floor is collected from every depth: about{" "}
                  {fmt((crosstalk.fwhm * 1e6) / crosstalk.floor, 0, "µm")} of labelled sample out of focus, in total on both sides
                  (disk section FWHM / floor), gives as much light as the in-focus section.
                </p>
              )}
              {row("Frame rate (full-field scans)", fmt(frameRate, 0, "fps"), "text-red-400")}
              {row("Open area of the disk", pinholeTooBig ? "—" : fmt(100 * fill, 2, "%"))}
              {row("Illuminated time per point", pinholeTooBig ? "—" : fmt(fill * exposureMs, 3, "ms"))}
              {row("Scans per exposure", fmt(scansPerExposure, 2, ""), banding ? "text-yellow-400" : "")}
              {banding && (
                <p className="text-sm text-yellow-300" role="status">
                  The exposure is not a whole number of scans: expect stripes (banding) of depth ≈ {fmt(100 * Math.min(1, bandingDepth), 1, "%")}.
                  {frameRate > 0 ? <> Use a multiple of {fmt(1000 / frameRate, 2, "ms")}.</> : null}
                </p>
              )}
              {pinholeTooBig && (
                <p className="text-sm text-yellow-300" role="status">
                  The pinhole diameter ({pinholeDiam} µm) exceeds the pitch ({pitch} µm): the holes would overlap, so the open area is not defined.
                </p>
              )}
            </>
          )}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Pinhole (AU) = (d / M) / (1.22 λ/NA)</p>
            <p>Frame rate = RPM/60 × scans per revolution (12 on Yokogawa CSU disks)</p>
            <p>Open area = π d²/(4 s²) for a square lattice of pitch s; each point is lit for this fraction of the exposure</p>
            <p>Lateral and section FWHM: scalar paraxial confocal model, one pinhole; the disk section adds the neighbouring pinholes (square lattice, incoherent beams)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Optical Section &amp; Throughput vs Pinhole Size</h2>
        <ChartPanel bare data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Pinhole size (Airy units)", gridcolor: "#333" }, yaxis: { title: "Section FWHM (nm)", gridcolor: "#333" }, yaxis2: { title: "Throughput (%)", overlaying: "y", side: "right", gridcolor: "#333", range: [0, 105] }, legend: { font: { size: 11 } }, margin: { l: 70, r: 70, t: 20, b: 60 } }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Response to a Thin Fluorescent Plane vs Defocus</h2>
        <ChartPanel bare data={crosstalk.chart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Defocus z (µm)", gridcolor: "#333" }, yaxis: { title: "Signal (in focus = 1)", gridcolor: "#333", range: [0, 1.05] }, legend: { font: { size: 11 } }, margin: { l: 70, r: 20, t: 20, b: 60 } }} />
        <p className="text-xs text-gray-500 mt-2">
          Light from a defocused plane spreads over many pinholes and returns through the neighbours of the one that lit it
          (pinhole crosstalk). Summed over the lattice (Poisson summation of the single-pinhole section), the response levels
          off at the floor instead of falling to zero{widePitch ? <>; above a pitch of {SPINNING_DISK_MAX_PITCH_AU} AU only the floor is computed</> : null}.
          Scalar paraxial pupil, no Stokes shift, square lattice, each beam focused to a point in its pinhole (microlens
          disk), mutually incoherent beams: laser-lit microlens beams interfere, which is not modelled, and a lamp-lit
          disk (extended sources) has a higher floor.
        </p>
      </div>
    </>
  );
}
