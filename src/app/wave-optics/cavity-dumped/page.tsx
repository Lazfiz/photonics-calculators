"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function CavityDumpedLaserCalculator() {
  const [cavityLength, setCavityLength] = useState(50); // cm
  const [repetitionRate, setRepetitionRate] = useState(1); // kHz
  const [roundTripLoss, setRoundTripLoss] = useState(0.02); // per pass
  const [smallSignalGain, setSmallSignalGain] = useState(0.1]; // per pass
  const [modeArea, setModeArea] = useState(1e-4); // cm²
  const [inversionDensity, setInversionDensity] = useState(5e17]; // cm⁻³
  const [stimEmissionXs, setStimEmissionXs] = useState(2.8e-19]; // cm²
  const [dumpEfficiency, setDumpEfficiency] = useState(0.9]; // Bragg cell efficiency
  const [upperStateLifetime, setUpperStateLifetime] = useState(230); // μs

  const roundTripTime = cavityLength * 1e-2 / c; // s
  const cavityFreq = 1 / roundTripTime;
  const netGainPerRT = smallSignalGain - roundTripLoss;

  // Number of round trips to reach steady state
  const nRTSteady = netGainPerRT > 0 ? Math.ceil(10 / netGainPerRT) : 100;

  // Intracavity energy buildup
  const buildUp = useMemo(() => {
    const times: number[] = [];
    const energy: number[] = [];
    let E = 0.01;
    for (let i = 0; i < nRTSteady * 2; i++) {
      times.push(i * roundTripTime * 1e9); // ns
      E = E * (1 + netGainPerRT) * (1 - roundTripLoss);
      energy.push(E);
    }
    return { times, energy };
  }, [roundTripTime, netGainPerRT, roundTripLoss, nRTSteady]);

  // Dumped pulse
  const dumpPulse = useMemo(() => {
    const steadyEnergy = buildUp.energy[buildUp.energy.length - 1] || 1;
    const times: number[] = [];
    const pulse: number[] = [];
    // Bragg cell switches out in ~2 round trips
    const dumpTime = 3 * roundTripTime;
    for (let i = 0; i < nRTSteady * 3; i++) {
      const t = i * roundTripTime;
      times.push(t * 1e9);
      if (t < dumpTime) {
        pulse.push(steadyEnergy * dumpEfficiency * (1 - t / dumpTime));
      } else {
        pulse.push(0);
      }
    }
    return { times, pulse };
  }, [buildUp, roundTripTime, dumpEfficiency, nRTSteady]);

  // Average power
  const steadyEnergy = buildUp.energy[buildUp.energy.length - 1] || 1;
  const pulseEnergy = steadyEnergy * dumpEfficiency;
  const avgPower = pulseEnergy * repetitionRate * 1e3; // W
  const peakPower = pulseEnergy / (roundTripTime * 2);
  const pulseWidth = 2 * roundTripTime * 1e9; // ns

  // Comparison: cavity-dumped vs CW
  const comparison = useMemo(() => {
    const reps = [0.1, 0.5, 1, 5, 10, 50, 100];
    const cdPulseE = reps.map(r => ({ rep: r, energy: pulseEnergy * 1, peak: pulseEnergy / (roundTripTime * 2) }));
    return cdPulseE;
  }, [pulseEnergy, roundTripTime]);

  // Energy vs dump rate
  const energyVsRate = useMemo(() => {
    const rates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const energies = rates.map(r => {
      const buildTime = 1 / (r * 1e3);
      const nRT = Math.floor(buildTime / roundTripTime);
      let E = 0.01;
      for (let i = 0; i < nRT; i++) E *= (1 + netGainPerRT) * (1 - roundTripLoss);
      return E * dumpEfficiency;
    });
    return { x: rates, y: energies };
  }, [roundTripTime, netGainPerRT, roundTripLoss, dumpEfficiency]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Cavity-Dumped Laser Analyzer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Acousto-optic or electro-optic cavity dumping — extracting the full intracavity energy in a controlled pulse without output coupling mirror.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          E_cav(n) = E₀ · [(1+g)(1−L)]ⁿ<br />
          τ_dump ≈ 2 × T_RT (Bragg cell switch time)<br />
          E_pulse = η_dump · E_cav(steady)<br />
          P_peak = E_pulse / τ_dump<br />
          ⟨P⟩ = E_pulse · f_dump
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Cavity Length (cm)" type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Dump Rate (kHz)" type="number" value={repetitionRate} onChange={e => setRepetitionRate(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Round-Trip Loss" type="number" value={roundTripLoss} onChange={e => setRoundTripLoss(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.01 }} />
            <TextField label="Small-Signal Gain" type="number" value={smallSignalGain} onChange={e => setSmallSignalGain(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.01 }} />
            <TextField label="Dump Efficiency" type="number" value={dumpEfficiency} onChange={e => setDumpEfficiency(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.05 }} />
            <TextField label="Mode Area (cm²)" type="number" value={modeArea} onChange={e => setModeArea(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="τ_upper (μs)" type="number" value={upperStateLifetime} onChange={e => setUpperStateLifetime(+e.target.value)} fullWidth sx={{ mb: 2 }} />
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
                    ["RTs to Steady State", `${nRTSteady}`],
                    ["Pulse Energy", `${pulseEnergy.toExponential(3)} (a.u.)`],
                    ["Pulse Width", `${pulseWidth.toFixed(3)} ns`],
                    ["Peak Power", `${peakPower.toExponential(2)} (a.u.)`],
                    ["Average Power", `${avgPower.toExponential(2)} (a.u.)`],
                    ["Net Gain/RT", `${netGainPerRT.toFixed(4)}`],
                    ["Buildup Time", `${(nRTSteady * roundTripTime * 1e6).toFixed(1)} μs`],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Plot
                data={[
                  { x: buildUp.times, y: buildUp.energy, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 }, name: "Intracavity E" },
                  { x: dumpPulse.times, y: dumpPulse.pulse, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "Dumped pulse" },
                ]}
                layout={{ ...darkPlot, title: { text: "Intracavity Buildup & Dump", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (ns)" }, yaxis: { ...ax, title: "Energy (a.u.)" }, margin: { t: 40, b: 40 } }}
                config={{ responsive: true }} style={{ width: "100%", height: 400 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Plot data={[{ x: energyVsRate.x, y: energyVsRate.y, type: "scatter", mode: "lines+markers", marker: { size: 8, color: "#76ff03" }, line: { color: "#76ff03", width: 2 }, name: "E_pulse" }]} layout={{ ...darkPlot, title: { text: "Pulse Energy vs Dump Rate", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Rate (kHz)" }, yaxis: { ...ax, title: "Energy (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
