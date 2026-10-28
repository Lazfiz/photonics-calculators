"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  birefringentPhase, loopCombPeriod, loopMirrorReflectance, loopMirrorTransmittance,
} from "../../../physics/fiber-optics/sagnac";

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

export default function FiberLoopMirrorPage() {
  const [couplingRaw, setCouplingRatio] = useURLState("couplingRatio", 50); // %
  const [lossRaw, setLoss] = useURLState("loss", 0); // dB, coupler excess (both passes) + loop
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [pmLengthRaw, setPmLength] = useURLState("fiberLength", 1); // m, PM section
  const [birefRaw, setBirefringence] = useURLState("birefringence", 4e-4);

  const k = clamp(couplingRaw, 0, 100) / 100;
  const loss_dB = clamp(lossRaw, 0, 30);
  const lambda_nm = clamp(wavelengthRaw, 400, 2000);
  const L = clamp(pmLengthRaw, 0, 100);
  const B = clamp(birefRaw, 0, 0.01);

  const calc = useMemo(() => {
    const tau = 10 ** (-loss_dB / 10);
    const R = loopMirrorReflectance(k, tau);
    const T = loopMirrorTransmittance(k, 0, tau);
    const period = loopCombPeriod(B, L, lambda_nm * 1e-9); // m
    const tMin = loopMirrorTransmittance(k, 0, tau), tMax = loopMirrorTransmittance(k, Math.PI, tau);
    const extinction = tMin > 0 ? 10 * Math.log10(tMax / tMin) : Infinity;
    return { tau, R, T, period, tMax, tMin, extinction };
  }, [k, loss_dB, B, L, lambda_nm]);

  const couplingChart = useMemo(() => {
    const ks = Array.from({ length: 101 }, (_, i) => i / 100);
    return [
      { x: ks.map(x => x * 100), y: ks.map(x => loopMirrorReflectance(x, calc.tau) * 100), type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: ks.map(x => x * 100), y: ks.map(x => loopMirrorTransmittance(x, 0, calc.tau) * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [calc.tau]);

  const spectrumData = useMemo(() => {
    if (!(calc.period <= 200e-9)) return [];
    const span = clamp(3 * calc.period * 1e9, 0.01, 200); // nm, about three comb periods
    const wls = Array.from({ length: 801 }, (_, i) => lambda_nm - span / 2 + (i * span) / 800);
    return [{
      x: wls,
      y: wls.map(wl => loopMirrorTransmittance(k, birefringentPhase(B, L, wl * 1e-9), calc.tau) * 100),
      type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#34d399" },
    }];
  }, [calc.period, calc.tau, lambda_nm, k, B, L]);

  const pm = Number.isFinite(calc.period) && calc.period <= 200e-9; // longer periods: the comb is flat over the band

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Coupler Power Coupling k (%)" value={couplingRaw} onChange={setCouplingRatio} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Total Loss: Coupler Excess + Loop (dB)" value={lossRaw} onChange={setLoss} min={0} max={30} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={400} max={2000} />
        <ValidatedNumberInput label="PM Section Length (m, 0 = none)" value={pmLengthRaw} onChange={setPmLength} min={0} max={100} step="any" />
        <ValidatedNumberInput label="PM Birefringence B (0 = isotropic loop)" value={birefRaw} onChange={setBirefringence} min={0} max={0.01} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Card label="Reflectance (isotropic loop)" value={`${(calc.R * 100).toFixed(2)} %`} sub="4k(1 − k)·τ" tone="text-red-400" />
        <Card label="Transmission (isotropic loop)" value={`${(calc.T * 100).toFixed(2)} %`} sub="(1 − 2k)²·τ" tone="text-blue-400" />
        {pm && <Card label="Comb Period" value={`${(calc.period * 1e9).toPrecision(4)} nm`} sub="λ²/(B·L)" tone="text-green-400" />}
        {pm && <Card label="Comb Extinction" value={Number.isFinite(calc.extinction) ? `${calc.extinction.toFixed(1)} dB` : "∞"} sub={`T from ${(calc.tMin * 100).toFixed(1)} % to ${(calc.tMax * 100).toFixed(1)} %`} tone="text-yellow-400" />}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Isotropic loop: R = 4k(1 − k)·τ, T = (1 − 2k)²·τ; k = ½ reflects everything</p>
          <p>PM section, axes exchanged between directions: Δφ = 2πBL/λ</p>
          <p>T = τ·[(1 − 2k)² + 4k(1 − k)·sin²(Δφ/2)], R = τ − T</p>
          <p>Comb period: Δλ = λ²/(B·L)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          The comb assumes the polarization controller is set for full contrast, so the counter-propagating waves
          cross the PM section on opposite axes; any input polarization then sees the same response. Only the period and
          contrast are meaningful: the fringe positions shift with the controller type and with L on a scale of λ/B. τ lumps
          the coupler excess loss and the loop loss.
        </p>
      </div>

      <ChartPanel data={couplingChart} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        title: { text: "Isotropic Loop vs Coupling Ratio", font: { color: "#e5e7eb", size: 14 } },
        xaxis: { title: "Power Coupling k (%)", gridcolor: "#374151", range: [0, 100] },
        yaxis: { title: "Power (%)", gridcolor: "#374151", range: [0, 105] },
        legend: { x: 0.6, y: 0.99 },
        margin: { t: 40 },
      }} />

      {Number.isFinite(calc.period) && !pm && (
        <p className="text-sm text-yellow-300 mt-4">
          Comb period λ²/(B·L) = {(calc.period * 1e9).toPrecision(4)} nm exceeds the 200 nm plotted span, so the comb is
          not drawn: the transmission is nearly flat across the band at the wavelength entered.
        </p>
      )}

      {spectrumData.length > 0 && (
        <ChartPanel data={spectrumData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Transmission Comb (PM Loop Mirror)", font: { color: "#e5e7eb", size: 14 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", range: [0, 105] },
          margin: { t: 40 },
        }} />
      )}
    </>
  );
}
