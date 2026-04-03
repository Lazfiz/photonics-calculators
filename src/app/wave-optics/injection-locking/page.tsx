"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function InjectionLockingCalculator() {
  const [freeRunFreq, setFreeRunFreq] = useState(282); // THz (Nd:YAG 1064nm)
  const [masterFreq, setMasterFreq] = useState(282.0); // THz
  const [masterPower, setMasterPower] = useState(10); // mW
  const [slavePower, setSlavePower] = useState(1000); // mW
  const [cavityFinesse, setCavityFinesse] = useState(100);
  const [cavityLength, setCavityLength] = useState(15); // cm
  const [injectionCoupling, setInjectionCoupling] = useState(0.05); // fraction

  const roundTripTime = cavityLength * 1e-2 / c;
  const cavityFSR = 1 / roundTripTime;
  const cavityLinewidth = cavityFSR / cavityFinesse;

  // Adler equation: dφ/dt = Δω − (ω₀/2Q) · √(P_m/P_s) · sin(φ)
  // Locking range: Δω_lock = (ω₀/2Q) · √(P_m/P_s)
  // In terms of cavity linewidth: Δν_lock = Δν_cav · √(P_m/P_s)
  const lockingRange = useMemo(() => {
    const ratio = masterPower / slavePower;
    const coupling = injectionCoupling;
    return cavityLinewidth * Math.sqrt(coupling * ratio);
  }, [cavityLinewidth, masterPower, slavePower, injectionCoupling]);

  // Locking ratio (P_m/P_s threshold)
  const detuning = Math.abs(masterFreq - freeRunFreq) * 1e12; // Hz
  const isLocked = detuning < lockingRange;
  const requiredRatio = (detuning / cavityLinewidth) ** 2 / injectionCoupling;
  const currentRatio = (masterPower / slavePower) * injectionCoupling;

  // Adler equation solution (transient)
  const adlerTransient = useMemo(() => {
    const deltaOmega = detuning;
    const alpha = (cavityLinewidth * Math.sqrt(injectionCoupling * masterPower / slavePower));
    const times: number[] = [];
    const phase: number[] = [];
    const freqDev: number[] = [];
    let phi = 0;

    const tMax = 100 / (alpha || 1);
    const dt = tMax / 2000;

    for (let i = 0; i < 2000; i++) {
      const t = i * dt;
      times.push(t * 1e9);
      if (isLocked && alpha > deltaOmega) {
        const dphidt = deltaOmega - alpha * Math.sin(phi);
        phi += dphidt * dt;
        // Steady-state frequency offset
        freqDev.push(deltaOmega - alpha * Math.sin(phi));
      } else {
        phi += deltaOmega * dt;
        freqDev.push(deltaOmega);
      }
      phase.push(phi);
    }
    return { times, phase, freqDev };
  }, [detuning, cavityLinewidth, injectionCoupling, masterPower, slavePower, isLocked]);

  // Locking range vs injection ratio
  const lockRangeVsRatio = useMemo(() => {
    const ratios = [];
    const ranges = [];
    for (let ratio = 0.001; ratio <= 0.5; ratio += 0.002) {
      ratios.push(ratio * 100);
      ranges.push(cavityLinewidth * Math.sqrt(ratio) / 1e6); // MHz
    }
    return { x: ratios, y: ranges };
  }, [cavityLinewidth]);

  // Locking range vs finesse
  const lockRangeVsFinesse = useMemo(() => {
    const fines = [];
    const ranges = [];
    for (let F = 10; F <= 500; F += 5) {
      fines.push(F);
      const lw = cavityFSR / F;
      ranges.push(lw * Math.sqrt(injectionCoupling * masterPower / slavePower) / 1e6);
    }
    return { x: fines, y: ranges };
  }, [cavityFSR, injectionCoupling, masterPower, slavePower]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Injection Locking Analyzer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Master-slave injection locking — Adler equation, locking range, and transient dynamics.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          dφ/dt = Δω − (ω₀/2Q)·√(P_m/P_s)·sin(φ) &nbsp;(Adler eq.)<br />
          Δν_lock = Δν_cav · √(κ · P_m/P_s)<br />
          Δν_cav = FSR / F = c / (2nL·F)<br />
          P_m/P_s ≥ (Δν_det / Δν_cav)² / κ &nbsp;(locking condition)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Slave Free-Run Freq (THz)" type="number" value={freeRunFreq} onChange={e => setFreeRunFreq(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.001 }} />
            <TextField label="Master Freq (THz)" type="number" value={masterFreq} onChange={e => setMasterFreq(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.001 }} />
            <TextField label="Master Power (mW)" type="number" value={masterPower} onChange={e => setMasterPower(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Slave Power (mW)" type="number" value={slavePower} onChange={e => setSlavePower(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Cavity Finesse" type="number" value={cavityFinesse} onChange={e => setCavityFinesse(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Cavity Length (cm)" type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Injection Coupling κ" type="number" value={injectionCoupling} onChange={e => setInjectionCoupling(+e.target.value)} fullWidth sx={{ mb: 2 }} inputProps={{ step: 0.01 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Results</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["Frequency Detuning", `${(detuning / 1e6).toFixed(2)} MHz`],
                    ["Cavity FSR", `${(cavityFSR / 1e6).toFixed(2)} MHz`],
                    ["Cavity Linewidth", `${(cavityLinewidth / 1e6).toFixed(4)} MHz`],
                    ["Locking Range", `${(lockingRange / 1e6).toFixed(4)} MHz`],
                    ["Locked?", isLocked ? "✅ YES" : "❌ NO"],
                    ["Required P_m/P_s", `${requiredRatio.toExponential(3)}`],
                    ["Current κ·P_m/P_s", `${currentRatio.toExponential(3)}`],
                    ["Phase Noise Reduction", isLocked ? `~20 log₁₀(√(P_s/P_m)) = ${(10 * Math.log10(slavePower / masterPower)).toFixed(1)} dB` : "N/A (unlocked)"],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Plot data={[{ x: adlerTransient.times, y: adlerTransient.freqDev, type: "scatter", mode: "lines", line: { color: isLocked ? "#00e5ff" : "#ff1744", width: 2 }, name: isLocked ? "Locked" : "Unlocked" }]} layout={{ ...darkPlot, title: { text: "Adler Equation: Frequency Deviation", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (ns)" }, yaxis: { ...ax, title: "Δν (Hz)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: lockRangeVsRatio.x, y: lockRangeVsRatio.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "Δν_lock" }]} layout={{ ...darkPlot, title: { text: "Locking Range vs Injection Ratio", font: { color: "#ccc" } }, xaxis: { ...ax, title: "κ·P_m/P_s (%)" }, yaxis: { ...ax, title: "Δν_lock (MHz)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: lockRangeVsFinesse.x, y: lockRangeVsFinesse.y, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 }, name: "Δν_lock" }]} layout={{ ...darkPlot, title: { text: "Locking Range vs Finesse", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Finesse" }, yaxis: { ...ax, title: "Δν_lock (MHz)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
