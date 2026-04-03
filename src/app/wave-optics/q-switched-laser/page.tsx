"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow, Slider, FormControlLabel, Checkbox } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function QSwitchedLaserCalculator() {
  const [cavityLength, setCavityLength] = useState(30); // cm
  const [upperStateLifetime, setUpperStateLifetime] = useState(230); // μs (Nd:YAG)
  const [stimulatedEmissionXs, setStimulatedEmissionXs] = useState(2.8e-19); // cm² (Nd:YAG)
  const [pumpRate, setPumpRate] = useState(10); // relative
  const [initialLoss, setInitialLoss] = useState(0.8); // fraction
  const [outputCoupling, setOutputCoupling] = useState(0.3); // fraction
  const [crystalLength, setCrystalLength] = useState(5); // cm
  const [inversionDensity, setInversionDensity] = useState(1e18); // cm⁻³
  const [showBuildup, setShowBuildup] = useState(true);

  const roundTripTime = cavityLength * 1e-2 / c;
  const cavityFreq = 1 / roundTripTime;
  const Qfactor = 2 * Math.PI * cavityFreq / (initialLoss * cavityFreq);

  // Energy extraction (simplified)
  const energyStored = inversionDensity * stimulatedEmissionXs * crystalLength;
  const energyExtracted = energyStored * (1 - Math.exp(-initialLoss * 10));

  // Pulse width estimate
  const tauP = useMemo(() => {
    const nRT = 2 / (outputCoupling + 0.01) * 5;
    return nRT * roundTripTime * 1e9; // ns
  }, [outputCoupling, cavityLength]);

  // Peak power
  const peakPower = tauP > 0 ? energyExtracted / (tauP * 1e-9) : 0;

  // Pulse buildup simulation
  const buildup = useMemo(() => {
    if (!showBuildup) return { time: [], power: [] };
    const times: number[] = [];
    const power: number[] = [];
    const dt = roundTripTime;
    const nRT = 200;
    let phi = 0.01; // initial photon number (normalized)
    let N = 1.0; // normalized inversion

    const sigma = stimulatedEmissionXs;
    const L = crystalLength;
    const delta = outputCoupling;
    const loss = initialLoss * 0.1 + 0.02;

    for (let i = 0; i < nRT; i++) {
      times.push(i * dt * 1e6); // μs
      const gain = sigma * L * N * 1e-4; // simplified
      const netGain = gain - loss;
      phi *= Math.exp(netGain);
      N *= Math.exp(-gain * phi / (N + 0.001));
      N = Math.max(N, 0);
      power.push(phi);
    }
    return { time: times, power };
  }, [showBuildup, cavityLength, outputCoupling, initialLoss, stimulatedEmissionXs, crystalLength]);

  // Inversion vs time
  const inversionDecay = useMemo(() => {
    const times: number[] = [];
    const inv: number[] = [];
    const tau = upperStateLifetime * 1e-6;
    for (let t = 0; t < 5 * tau; t += tau / 50) {
      times.push(t * 1e6);
      inv.push(Math.exp(-t / tau) * pumpRate);
    }
    return { time: times, inv };
  }, [upperStateLifetime, pumpRate]);

  // Output coupling optimization
  const couplingOpt = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let oc = 0.01; oc <= 0.9; oc += 0.01) {
      const eff = oc * Math.log(1 / (1 - oc)) * (1 - oc);
      x.push(oc * 100); y.push(eff * 100);
    }
    return { x, y };
  }, []);

  // Pulse width vs output coupling
  const tauVsOC = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let oc = 0.05; oc <= 0.8; oc += 0.01) {
      const nRT = 2 / (oc + 0.01) * 5;
      x.push(oc * 100); y.push(nRT * roundTripTime * 1e9);
    }
    return { x, y };
  }, [cavityLength]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Q-Switched Laser Designer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Active/passive Q-switching — giant pulse generation, energy extraction, and output coupling optimization.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          T_RT = L_cav / c &nbsp;|&nbsp; τ_p ≈ T_RT · 2/(δ+α)<br />
          E_extract = N_i · σ · L · (1 − e^(−2δ))<br />
          P_peak = E / τ_p<br />
          N(t) = N₀ · e^(−t/τ_f) + R_p · τ_f<br />
          Optimal OC: δ ≈ √(2g₀·L_i) − L_i &nbsp;(Rigrod)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Cavity Length (cm)" type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Upper State Lifetime (μs)" type="number" value={upperStateLifetime} onChange={e => setUpperStateLifetime(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="σ_se (×10⁻¹⁹ cm²)" type="number" value={stimulatedEmissionXs * 1e19} onChange={e => setStimulatedEmissionXs(+e.target.value * 1e-19)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Pump Rate (rel.)" type="number" value={pumpRate} onChange={e => setPumpRate(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Initial Q-switch Loss" type="number" value={initialLoss} onChange={e => setInitialLoss(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.1 }} />
            <TextField label="Output Coupling" type="number" value={outputCoupling} onChange={e => setOutputCoupling(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.05 }} />
            <TextField label="Crystal Length (cm)" type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Inversion Density (×10¹⁸ cm⁻³)" type="number" value={inversionDensity / 1e18} onChange={e => setInversionDensity(+e.target.value * 1e18)} fullWidth sx={{ mb: 2 }} />
            <FormControlLabel control={<Checkbox checked={showBuildup} onChange={e => setShowBuildup(e.target.checked)} />} label="Pulse buildup" sx={{ color: "#ccc" }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Results</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["Round-Trip Time", `${(roundTripTime * 1e9).toFixed(3)} ns`],
                    ["Est. Pulse Width", `${tauP.toFixed(2)} ns`],
                    ["Peak Power", `${peakPower.toExponential(2)} W`],
                    ["Energy Extracted", `${energyExtracted.toExponential(2)} J`],
                    ["Stored Energy", `${energyStored.toExponential(2)} J`],
                    ["Extraction Eff.", `${((energyExtracted / energyStored) * 100).toFixed(1)}%`],
                    ["Q-Factor (approx)", `${Qfactor.toFixed(0)}`],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            {showBuildup && (
              <Grid item xs={12}>
                <Plot data={[{ x: buildup.time, y: buildup.power, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 }, name: "Intracavity power" }]} layout={{ ...darkPlot, title: { text: "Q-Switch Pulse Buildup", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (μs)" }, yaxis: { ...ax, title: "Power (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: inversionDecay.time, y: inversionDecay.inv, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "N(t)" }]} layout={{ ...darkPlot, title: { text: "Population Inversion Buildup", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (μs)" }, yaxis: { ...ax, title: "N (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: tauVsOC.x, y: tauVsOC.y, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 }, name: "τ_p" }]} layout={{ ...darkPlot, title: { text: "Pulse Width vs Output Coupling", font: { color: "#ccc" } }, xaxis: { ...ax, title: "OC (%)" }, yaxis: { ...ax, title: "τ_p (ns)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
