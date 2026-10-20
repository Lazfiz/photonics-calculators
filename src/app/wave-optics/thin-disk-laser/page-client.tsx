"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { roundTripLoss } from "../../../physics/wave-optics/laser-resonator";
import {
  diskTemperatureRise, multipassAbsorption, pumpAbsorption, quasiThreeLevelSlope, quasiThreeLevelThreshold, thresholdInversion,
} from "../../../physics/wave-optics/quasi-three-level";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

// Yttrium sites in YAG, 1.38e22 cm⁻³: 1 at.% doping = 1.38e20 ions/cm³ (Koechner, Solid-State Laser Engineering, ch. 2).
const YAG_SITES = 1.38e28;

export default function ThinDiskLaserPage() {
  const [thicknessRaw, setThickness] = useURLState("diskThickness", 200); // µm
  const [diameterRaw, setDiameter] = useURLState("diskDiameter", 10); // mm
  const [spotRaw, setSpot] = useURLState("pumpSpotDiameter", 3); // mm
  const [dopingRaw, setDoping] = useURLState("Yb_concentration", 10); // at.%
  const [pumpPassesRaw, setPumpPasses] = useURLState("numPasses", 16);
  const [laserPassesRaw, setLaserPasses] = useURLState("laserPasses", 2);
  const [pumpRaw, setPump] = useURLState("pump", 200); // W incident
  const [rOcRaw, setROc] = useURLState("R_oc", 0.97);
  const [lossRaw, setLoss] = useURLState("loss", 1); // % per round trip
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1030); // nm
  const [pumpWavelengthRaw, setPumpWavelength] = useURLState("pumpWavelength", 940); // nm
  const [sigmaERaw, setSigmaE] = useURLState("sigmaE", 2.0); // 1e-20 cm² at λ
  const [sigmaARaw, setSigmaA] = useURLState("sigmaA", 0.11); // at λ
  const [sigmaAPRaw, setSigmaAP] = useURLState("sigmaAP", 0.75); // at λ_p
  const [sigmaEPRaw, setSigmaEP] = useURLState("sigmaEP", 0.16); // at λ_p
  const [tauRaw, setTau] = useURLState("tau", 0.95); // ms
  const [heatRaw, setHeat] = useURLState("heatFraction", 0.11);
  const [kappaRaw, setKappa] = useURLState("kappa", 14); // W/(m K)

  const d = clamp(thicknessRaw, 10, 5000, 200) * 1e-6;
  const diskD = clamp(diameterRaw, 0.1, 1000, 10) * 1e-3;
  const spotD = clamp(spotRaw, 0.01, 1000, 3) * 1e-3;
  const N = clamp(dopingRaw, 0.01, 100, 10) * 0.01 * YAG_SITES;
  const M = Math.round(clamp(pumpPassesRaw, 1, 100, 16));
  const m = Math.round(clamp(laserPassesRaw, 1, 100, 2));
  const pump = clamp(pumpRaw, 0, 1e6, 200);
  const R_oc = clamp(rOcRaw, 0.01, 0.9999, 0.97);
  const otherLoss = -Math.log(1 - clamp(lossRaw, 0, 50, 1) / 100); // nepers per round trip
  const lambda = clamp(wavelengthRaw, 300, 5000, 1030) * 1e-9;
  const lambdaP = clamp(pumpWavelengthRaw, 200, 5000, 940) * 1e-9;
  const sigmaE = clamp(sigmaERaw, 1e-4, 1e4, 2.0) * 1e-24; // m²
  const sigmaA = clamp(sigmaARaw, 0, 1e4, 0.11) * 1e-24;
  const sigmaAP = clamp(sigmaAPRaw, 1e-4, 1e4, 0.75) * 1e-24;
  const sigmaEP = clamp(sigmaEPRaw, 0, 1e4, 0.16) * 1e-24;
  const tau = clamp(tauRaw, 1e-4, 1e4, 0.95) * 1e-3;
  const heat = clamp(heatRaw, 0, 1, 0.11);
  const kappa = clamp(kappaRaw, 0.1, 2000, 14);

  const area = Math.PI * (spotD / 2) ** 2;
  const delta = roundTripLoss(1, R_oc, otherLoss / 2);
  const beta = thresholdInversion(delta, m, d, N, sigmaE, sigmaA);
  const betaTr = sigmaA / (sigmaA + sigmaE);
  const betaBleach = sigmaAP / (sigmaAP + sigmaEP);
  const alphaUnpumped = pumpAbsorption(N, sigmaAP, sigmaEP, 0);
  const alphaTh = beta <= 1 ? pumpAbsorption(N, sigmaAP, sigmaEP, beta) : NaN;
  const etaAbs = multipassAbsorption(alphaTh, d, M);
  const pTh = quasiThreeLevelThreshold(N, d, beta, area, lambdaP, tau, etaAbs);
  const slope = quasiThreeLevelSlope(etaAbs, lambdaP, lambda, R_oc, delta);
  const pOut = Number.isFinite(pTh) ? Math.max(0, slope * (pump - pTh)) : NaN;
  const absorbedIntensity = (etaAbs * pump) / area;
  const dT = diskTemperatureRise(absorbedIntensity, heat, d, kappa);
  const reachable = Number.isFinite(pTh);

  const passCurve = (alpha: number) =>
    Number.isFinite(alpha) ? Array.from({ length: 40 }, (_, i) => ({ x: i + 1, y: round6(multipassAbsorption(alpha, d, i + 1) * 100) })) : [];
  const passSeries = [
    { name: "At the threshold inversion", color: "#60a5fa", points: passCurve(alphaTh) },
    { name: "Unpumped disk", color: "#9ca3af", dashed: true, points: passCurve(alphaUnpumped) },
    { name: "This module", color: "#facc15", showPoints: true, points: Number.isFinite(etaAbs) ? [{ x: M, y: round6(etaAbs * 100) }] : [] },
  ];

  const pMax = Math.max(2 * pump, reachable ? 1.5 * pTh : 0, 1);
  const pumpGrid = Array.from({ length: 121 }, (_, i) => (pMax * i) / 120);
  const powerSeries = [
    { name: "Output power", color: "#a78bfa", points: reachable ? pumpGrid.map((p) => ({ x: round6(p), y: round6(Math.max(0, slope * (p - pTh))) })) : [] },
    { name: "This pump", color: "#facc15", showPoints: true, points: Number.isFinite(pOut) ? [{ x: round6(pump), y: round6(pOut) }] : [] },
  ];
  const tempSeries = [
    {
      name: "Front-to-back temperature rise",
      color: "#f87171",
      points: Number.isFinite(etaAbs) ? pumpGrid.map((p) => ({ x: round6(p), y: round6(diskTemperatureRise((etaAbs * p) / area, heat, d, kappa)) })) : [],
    },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Disk, pump module and resonator</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Disk thickness d (µm)" value={thicknessRaw} onChange={setThickness} min={10} max={5000} step="any" />
        <ValidatedNumberInput label="Disk diameter (mm)" value={diameterRaw} onChange={setDiameter} min={0.1} max={1000} step="any" />
        <ValidatedNumberInput label="Pump spot diameter (mm, top hat)" value={spotRaw} onChange={setSpot} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Yb doping (at.%)" value={dopingRaw} onChange={setDoping} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Pump passes through the disk M" value={pumpPassesRaw} onChange={setPumpPasses} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Laser passes per round trip m (2: disk as end mirror)" value={laserPassesRaw} onChange={setLaserPasses} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Incident pump power (W)" value={pumpRaw} onChange={setPump} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Output coupler reflectance" value={rOcRaw} onChange={setROc} min={0.01} max={0.9999} step="any" />
        <ValidatedNumberInput label="Other loss per round trip (%)" value={lossRaw} onChange={setLoss} min={0} max={50} step="any" />
      </div>
      <h2 className="text-lg font-semibold mb-3">Gain medium (defaults: Yb:YAG at room temperature; check them for your crystal)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser wavelength λ (nm)" value={wavelengthRaw} onChange={setWavelength} min={300} max={5000} step="any" />
        <ValidatedNumberInput label="Pump wavelength λ_p (nm)" value={pumpWavelengthRaw} onChange={setPumpWavelength} min={200} max={5000} step="any" />
        <ValidatedNumberInput label="Emission σ_e at λ (10⁻²⁰ cm²)" value={sigmaERaw} onChange={setSigmaE} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Absorption σ_a at λ (10⁻²⁰ cm²)" value={sigmaARaw} onChange={setSigmaA} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Absorption σ_ap at λ_p (10⁻²⁰ cm²)" value={sigmaAPRaw} onChange={setSigmaAP} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Emission σ_ep at λ_p (10⁻²⁰ cm²)" value={sigmaEPRaw} onChange={setSigmaEP} min={0} max={1e4} step="any" />
        <ValidatedNumberInput label="Upper-level lifetime τ (ms)" value={tauRaw} onChange={setTau} min={1e-4} max={1e4} step="any" />
        <ValidatedNumberInput label="Heat fraction of the absorbed pump" value={heatRaw} onChange={setHeat} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Thermal conductivity κ (W/(m K))" value={kappaRaw} onChange={setKappa} min={0.1} max={2000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <ResultCard label="Threshold inversion β_th" value={`${fmt(beta * 100)} %`} subtext={`transparency ${fmt(betaTr * 100)} %; pump bleaches at ${fmt(betaBleach * 100)} %`} tone="blue" />
        <ResultCard label="Pump absorbed" value={`${fmt(etaAbs * 100)} %`} subtext={`${M} passes at β_th; unpumped ${fmt(multipassAbsorption(alphaUnpumped, d, M) * 100)} %`} tone="cyan" />
        <ResultCard label="Threshold pump power" value={`${fmt(pTh)} W`} subtext={`${fmt(pTh / area / 1e7)} kW/cm² over the spot`} tone="orange" />
        <ResultCard label="Output power" value={`${fmt(pOut)} W`} subtext={`slope ${fmt(slope * 100)} %; δ = ${fmt(delta * 100)} %`} tone="purple" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Ion density" value={`${fmt(N / 1e26)} × 10²⁰ cm⁻³`} subtext="doping × 1.38 × 10²² Y sites/cm³" tone="green" />
        <ResultCard label="Absorbed pump intensity" value={`${fmt(absorbedIntensity / 1e7)} kW/cm²`} tone="yellow" />
        <ResultCard label="Temperature rise through the disk" value={`${fmt(dT)} K`} subtext="η_h I_abs d/(2κ), heat sink and solder not included" tone="red" />
      </div>

      {!reachable && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          Threshold needs an inversion above {fmt(betaBleach * 100)} %, where the pump is no longer absorbed: the laser cannot reach
          threshold. Lower the loss, add laser passes or use a thicker or more heavily doped disk.
        </p>
      )}
      {spotD > diskD && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">The pump spot is larger than the disk.</p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Threshold: m d N(βσ_e − (1 − β)σ_a) = δ = −ln R_oc − ln(1 − loss). Pump absorption α_p = N(σ_ap − β(σ_ap + σ_ep)), clamped at β_th
          above threshold: η_abs = 1 − e^(−M α_p d).</p>
        <p>P_th = h c N d β_th A/(λ_p τ η_abs); P_out = η_abs(λ_p/λ)(−ln R_oc/δ)(P − P_th) for a top-hat pump and mode of equal area.
          ΔT = η_h I_abs d/(2κ) for uniform heating with the back face cooled.</p>
      </div>

      <div className="space-y-6">
        {powerSeries[0].points.length > 0 && <SimpleLineChart title="Output power versus incident pump power" xLabel="Pump power (W)" yLabel="Output power (W)" series={powerSeries} />}
        {passSeries[0].points.length > 0 && <SimpleLineChart title="Pump absorption versus number of passes" xLabel="Pump passes" yLabel="Absorbed (%)" series={passSeries} />}
        {tempSeries[0].points.length > 0 && <SimpleLineChart title="Temperature rise through the disk" xLabel="Pump power (W)" yLabel="Temperature rise (K)" series={tempSeries} />}
      </div>
    </>
  );
}
