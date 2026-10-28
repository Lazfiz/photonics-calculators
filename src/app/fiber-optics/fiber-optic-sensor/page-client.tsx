"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  SMF28_THERMAL_COEFFICIENT, braggShift, phaseStrainSensitivity, phaseTemperatureSensitivity, strainGaugeFactor,
} from "../../../physics/fiber-optics/fiber-bragg-grating";
import {
  WATER_DN_DT, WATER_INDEX_1550, cavityReflectance, freeSpectralRange, penetrationDepth, penetrationDepthSensitivity,
} from "../../../physics/fiber-optics/fiber-sensors";
import { coefficientOfFinesse } from "../../../physics/thin-film/interference";

type SensorType = "fbg" | "mach_zehnder" | "fabry_perot" | "evanescent";
const SENSOR_TYPES: SensorType[] = ["fbg", "mach_zehnder", "fabry_perot", "evanescent"];
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function FiberOpticSensorPage() {
  const [sensorRaw, setSensorType] = useURLState("sensor", "fbg");
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [tempChange, setTempChange] = useURLState("tempChange", 10); // K
  const [strain, setStrain] = useURLState("strain", 100); // µε
  const [gaugeLength, setGaugeLength] = useURLState("gaugeLength", 10); // mm (MZI)
  const [cavityLength, setCavityLength] = useURLState("cavityLength", 20); // µm (EFPI air gap)
  const [mirrorR, setMirrorR] = useURLState("mirrorR", 0.033); // EFPI end-face reflectance
  const [nEffRaw, setNEff] = useURLState("n_eff", 1.447);
  const [nExtRaw, setNExt] = useURLState("n_ext", WATER_INDEX_1550);
  const sensorType: SensorType = SENSOR_TYPES.includes(sensorRaw as SensorType) ? (sensorRaw as SensorType) : "fbg";

  const lambda = clamp(wavelength, 400, 2000) * 1e-9;
  // Water dn/dT is only roughly constant within ±30 K of room temperature; the fibre K_T within ±100 K.
  const dTMax = sensorType === "evanescent" ? 30 : 100;
  const dT = clamp(tempChange, -dTMax, dTMax);
  const eps = clamp(strain, -1e4, 1e4) * 1e-6;
  const nEff = clamp(nEffRaw, 1, 3);
  const gauge = strainGaugeFactor(nEff);
  const KT = SMF28_THERMAL_COEFFICIENT;

  const calc = useMemo(() => {
    switch (sensorType) {
      case "fbg": {
        const strainShift = braggShift(lambda, eps, 0, gauge, KT);
        const tempShift = braggShift(lambda, 0, dT, gauge, KT);
        return {
          kind: "fbg" as const, strainShift, tempShift, total: strainShift + tempShift,
          strainPm: braggShift(lambda, 1e-6, 0, gauge, KT) * 1e12, tempPm: braggShift(lambda, 0, 1, gauge, KT) * 1e12,
        };
      }
      case "mach_zehnder": {
        const L = clamp(gaugeLength, 0.1, 1e5) * 1e-3;
        const perStrain = phaseStrainSensitivity(lambda, nEff, L, gauge); // rad per unit strain
        const perK = phaseTemperatureSensitivity(lambda, nEff, L, KT);
        return { kind: "mzi" as const, perMicrostrain: perStrain * 1e-6, perK, phase: perStrain * eps + perK * dT, perStrain };
      }
      case "fabry_perot": {
        // Plane-wave Airy model: beyond ≈ 20 µm the second reflection diffracts and recouples poorly into SMF (input allowed to 50 µm, contrast overstated there).
        const d = clamp(cavityLength, 1, 50) * 1e-6;
        const R = clamp(mirrorR, 0, 0.9);
        const F = coefficientOfFinesse(R);
        return { kind: "efpi" as const, d, R, F, fsr: freeSpectralRange(lambda, 1, d), peak: F / (1 + F), fringeShift: lambda * eps };
      }
      case "evanescent": {
        const nExt0 = clamp(nExtRaw, 1, 3);
        const nExt = nExt0 + WATER_DN_DT * dT;
        return {
          kind: "evanescent" as const, nExt0, nExt,
          dp: penetrationDepth(lambda, nEff, nExt), dp0: penetrationDepth(lambda, nEff, nExt0),
          sens: penetrationDepthSensitivity(lambda, nEff, nExt),
        };
      }
    }
  }, [sensorType, lambda, eps, dT, gauge, KT, nEff, gaugeLength, cavityLength, mirrorR, nExtRaw]);

  const chart = useMemo(() => {
    const line = (x: number[], y: number[], name: string, color: string) =>
      [{ x, y: y.map((v) => (Number.isFinite(v) ? v : null)), type: "scatter" as const, mode: "lines" as const, name, line: { color } }];
    // Strain axis: 0…max(2000, 1.2·|ε|) µε, extended to negative ε when the input is negative.
    const epsUe = eps * 1e6;
    const sMax = Math.max(2000, 1.2 * Math.abs(epsUe));
    const sLo = epsUe < 0 ? -sMax : 0;
    const sHi = epsUe < 0 ? 0 : sMax;
    const strains = Array.from({ length: 101 }, (_, i) => sLo + ((sHi - sLo) * i) / 100);
    const marker = (x: number, y: number) => ({
      x: [x], y: [Number.isFinite(y) ? y : null], type: "scatter" as const, mode: "markers" as const, name: "Operating point",
      marker: { color: "#ffffff", size: 9, line: { color: "#111827", width: 1 } },
    });
    switch (calc.kind) {
      case "fbg":
        return { x: "Strain (µε)", y: "Bragg shift (pm)", data: [...line(strains, strains.map((s) => s * calc.strainPm), "Strain shift", "#f87171"), marker(epsUe, epsUe * calc.strainPm)] };
      case "mzi":
        return { x: "Strain (µε)", y: "Phase (rad)", data: [...line(strains, strains.map((s) => s * calc.perMicrostrain), "Phase", "#34d399"), marker(epsUe, epsUe * calc.perMicrostrain)] };
      case "efpi": {
        const span = Math.min(2.5 * calc.fsr, 1.6 * lambda);
        const wls = Array.from({ length: 2001 }, (_, i) => lambda - span / 2 + (span * i) / 2000);
        return {
          x: "Wavelength (nm)", y: "Cavity reflectance (%)",
          data: line(wls.map((w) => w * 1e9), wls.map((w) => 100 * cavityReflectance(w, 1, calc.d, calc.R)), "Reflectance", "#a78bfa"),
        };
      }
      case "evanescent": {
        // n_ext axis: from min(1.3, n_ext − 0.02) up to just below n_eff (air at 1.0 is reachable).
        const lo = Math.min(1.3, calc.nExt - 0.02);
        const hi = nEff - 1e-3;
        if (!(hi > lo)) {
          return { x: "External index n_ext", y: "Penetration depth (nm)", data: [], empty: "No guided evanescent field in this range: n_eff must exceed n_ext." };
        }
        const ns = Array.from({ length: 101 }, (_, i) => lo + ((hi - lo) * i) / 100);
        return {
          x: "External index n_ext", y: "Penetration depth (nm)",
          data: [...line(ns, ns.map((n) => penetrationDepth(lambda, nEff, n) * 1e9), "d_p", "#fbbf24"),
            marker(calc.nExt, penetrationDepth(lambda, nEff, calc.nExt) * 1e9)],
        };
      }
    }
  }, [calc, lambda, nEff, eps]);

  const pm = (v: number) => `${(v * 1e12).toFixed(1)} pm`;
  const nmOrDash = (v: number, digits = 1) => (Number.isFinite(v) ? `${(v * 1e9).toFixed(digits)} nm` : "not guided");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sensor Type</span>
          <select value={sensorType} onChange={(e) => setSensorType(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="fbg">Fiber Bragg Grating (FBG)</option>
            <option value="mach_zehnder">Mach-Zehnder Interferometer (sensing arm)</option>
            <option value="fabry_perot">Extrinsic Fabry-Pérot (air gap)</option>
            <option value="evanescent">Evanescent Field (unclad region)</option>
          </select>
        </label>
        <ValidatedNumberInput label={sensorType === "fbg" ? "Bragg Wavelength (nm)" : "Wavelength (nm)"} value={wavelength} onChange={setWavelength} min={400} max={2000} />
        {sensorType !== "fabry_perot" && (
          <ValidatedNumberInput label="Temperature Change ΔT (K)" value={tempChange} onChange={setTempChange} min={-dTMax} max={dTMax} step="any" />
        )}
        {sensorType !== "evanescent" && (
          <ValidatedNumberInput label="Strain (µε)" value={strain} onChange={setStrain} min={-1e4} max={1e4} step="any" />
        )}
        {sensorType !== "fabry_perot" && (
          <ValidatedNumberInput label="Mode Effective Index n_eff (phase)" value={nEffRaw} onChange={setNEff} min={1} max={3} step="0.001" />
        )}
        {sensorType === "mach_zehnder" && (
          <ValidatedNumberInput label="Gauge Length (mm)" value={gaugeLength} onChange={setGaugeLength} min={0.1} max={1e5} step="any" />
        )}
        {sensorType === "fabry_perot" && (
          <>
            <ValidatedNumberInput label="Air Gap d (µm, ≤ 50)" value={cavityLength} onChange={setCavityLength} min={1} max={50} step="any" />
            <ValidatedNumberInput label="End-Face Reflectance R (bare silica ≈ 0.033)" value={mirrorR} onChange={setMirrorR} min={0} max={0.9} step="any" />
          </>
        )}
        {sensorType === "evanescent" && (
          <ValidatedNumberInput label="External Index at ΔT = 0 (water at 1550 nm ≈ 1.318)" value={nExtRaw} onChange={setNExt} min={1} max={3} step="0.001" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {calc.kind === "fbg" && (
          <>
            <Card label="Total Shift" value={pm(calc.total)} tone="text-red-400" />
            <Card label="Strain Sensitivity" value={`${calc.strainPm.toFixed(3)} pm/µε`} sub={`1 − p_e = ${gauge.toFixed(4)}`} tone="text-blue-400" />
            <Card label="Temperature Sensitivity" value={`${calc.tempPm.toFixed(2)} pm/K`} sub="K_T = 6.165×10⁻⁶/K (SMF-28)" tone="text-green-400" />
            <Card label="Shifted λ_B" value={`${((lambda + calc.total) * 1e9).toFixed(3)} nm`} tone="text-yellow-400" />
          </>
        )}
        {calc.kind === "mzi" && (
          <>
            <Card label="Phase Shift" value={`${calc.phase.toFixed(3)} rad`} sub={`${(calc.phase / (2 * Math.PI)).toFixed(2)} fringes`} tone="text-green-400" />
            <Card label="Strain Sensitivity" value={`${calc.perMicrostrain.toFixed(5)} rad/µε`} tone="text-blue-400" />
            <Card label="Temperature Sensitivity" value={`${calc.perK.toFixed(4)} rad/K`} tone="text-red-400" />
            <Card label="Strain for One Fringe" value={`${((2 * Math.PI) / calc.perMicrostrain).toFixed(1)} µε`} tone="text-yellow-400" />
          </>
        )}
        {calc.kind === "efpi" && (
          <>
            <Card label="Free Spectral Range" value={`${(calc.fsr * 1e9).toFixed(2)} nm`} tone="text-purple-400" />
            <Card label="Coefficient of Finesse F" value={calc.F.toFixed(4)} tone="text-blue-400" />
            <Card label="Peak Reflectance F/(1 + F)" value={`${(calc.peak * 100).toFixed(2)} %`} tone="text-green-400" />
            <Card label="Fringe Shift (gap strain)" value={pm(calc.fringeShift)} sub="Δλ = λ·ε" tone="text-yellow-400" />
          </>
        )}
        {calc.kind === "evanescent" && (
          <>
            <Card label="External Index n_ext" value={calc.nExt.toFixed(5)} sub={`dn/dT = ${WATER_DN_DT.toExponential(1)} /K (water)`} tone="text-blue-400" />
            <Card label="Penetration Depth d_p" value={nmOrDash(calc.dp)} sub="field 1/e; intensity 1/e at d_p/2" tone="text-yellow-400" />
            <Card label="Change from ΔT" value={nmOrDash(calc.dp - calc.dp0, 3)} tone="text-green-400" />
            <Card label="d(d_p)/dn_ext" value={Number.isFinite(calc.sens) ? `${(calc.sens * 1e9).toFixed(0)} nm/RIU` : "—"} tone="text-red-400" />
          </>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          {calc.kind === "fbg" && (
            <>
              <p>Δλ_B/λ_B = (1 − p_e)·ε + K_T·ΔT (Kersey 1997)</p>
              <p>p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)], p₁₁ 0.113, p₁₂ 0.252, ν 0.16</p>
              <p>K_T = (1/n)dn/dT + α = 6.165×10⁻⁶/K (SMF-28, 20 °C)</p>
            </>
          )}
          {calc.kind === "mzi" && (
            <>
              <p>Δφ = (2π/λ)·Δ(n_eff·L) = (2π·n_eff·L/λ)·[(1 − p_e)·ε + K_T·ΔT]</p>
              <p>The reference arm is assumed isolated; a longer gauge raises both sensitivities.</p>
            </>
          )}
          {calc.kind === "efpi" && (
            <>
              <p>FSR = λ²/(2d), R = F·sin²(δ/2)/(1 + F·sin²(δ/2)), δ = 4πd/λ</p>
              <p>F = 4R/(1 − R)² (Born &amp; Wolf §7.6.1); a fringe moves by Δλ/λ = Δd/d</p>
              <p>The gap is assumed to carry the strain ε. In a capillary-mounted EFPI the gap changes by ε·L_gauge, so Δλ = λ·ε·L_gauge/d.</p>
              <p>An air-gap cavity has almost no thermo-optic response; its thermal drift depends on the capillary mount.</p>
              <p>Plane-wave model: gap diffraction loss is ignored, so fringe contrast is overstated beyond ≈ 20 µm.</p>
            </>
          )}
          {calc.kind === "evanescent" && (
            <>
              <p>d_p = λ / (2π·√(n_eff² − n_ext²)) (Harrick 1967)</p>
              <p>n_ext(T) = n_ext + (dn/dT)·ΔT, dn/dT ≈ −1×10⁻⁴/K for water</p>
              <p>n_eff is the local mode index where the cladding is removed; it must exceed n_ext.</p>
              <p>Only the thermo-optic change of the external medium is applied; silica&apos;s own dn/dT (≈ +1×10⁻⁵/K) on n_eff is not included.</p>
            </>
          )}
        </div>
      </div>

      {chart.empty && <p className="text-sm text-yellow-400 mb-2">{chart.empty}</p>}
      <ChartPanel data={chart.data} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: chart.x, gridcolor: "#374151" },
        yaxis: { title: chart.y, gridcolor: "#374151" },
        showlegend: false,
        margin: { t: 30 },
      }} />
    </>
  );
}
