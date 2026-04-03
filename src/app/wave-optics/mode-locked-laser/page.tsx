"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function ModeLockedLaserCalculator() {
  const [cavityLength, setCavityLength] = useState(150); // cm
  const [gdnProduct, setGdnProduct] = useState(0.3); // GVD × L (ps²)
  const [selfPhaseMod, setSelfPhaseMod] = useState(0.5); // SPM parameter (rad)
  const [saturableAbsModDepth, setSAModDepth] = useState(0.1); // modulation depth
  const [saturableAbsRecovery, setSARecovery] = useState(500); // ps recovery time
  const [netGain, setNetGain] = useState(0.02); // small-signal net gain per round trip
  const [outputCoupling, setOutputCoupling] = useState(10); // %

  const roundTripTime = cavityLength * 1e-2 / c * 1e12; // ps
  const repRate = 1 / (roundTripTime * 1e-12); // Hz

  // Kuizenga-Siegman pulse width estimate (soliton-like)
  const tauPulse = useMemo(() => {
    // Approximate: τ = 1.76 × |GDD| / φ_NL for soliton
    // More general: τ ≈ (|β₂|L / (φ_NL × |g|))^0.5
    const beta2 = gdnProduct * 1e-24; // s² (ps² to s²)
    const phiNL = selfPhaseMod;
    const g = netGain;
    if (g <= 0 || phiNL <= 0) return NaN;
    return 1.76 * Math.sqrt(Math.abs(beta2) / (phiNL * g)) * 1e12; // ps
  }, [gdnProduct, selfPhaseMod, netGain]);

  // Time-bandwidth product → bandwidth
  const bandwidth = useMemo(() => {
    if (!tauPulse || isNaN(tauPulse)) return NaN;
    return 0.315 / (tauPulse * 1e-12); // Hz (sech²)
  }, [tauPulse]);

  // Peak power from average
  const avgPower = 100; // mW assumed
  const peakPower = avgPower * 1e-3 / (tauPulse * 1e-12 * repRate) || 0;

  // Pulse train simulation
  const pulseTrain = useMemo(() => {
    if (!tauPulse || isNaN(tauPulse)) return { times: [], amps: [] };
    const times: number[] = [];
    const amps: number[] = [];
    const tRT = roundTripTime;
    for (let t = 0; t < 5 * tRT; t += tRT / 500) {
      times.push(t);
      // sech² pulse train
      let a = 0;
      for (let n = 0; n < 5; n++) {
        const dt = t - n * tRT;
        a += 1 / Math.cosh(dt / (tauPulse * 0.5)) ** 2;
      }
      amps.push(a);
    }
    return { times, amps };
  }, [tauPulse, roundTripTime]);

  // Pulse spectrum (sech² → sech in frequency)
  const pulseSpectrum = useMemo(() => {
    if (!bandwidth || isNaN(bandwidth)) return { freqs: [], power: [] };
    const freqs: number[] = [];
    const power: number[] = [];
    const bw = bandwidth;
    for (let f = -5 * bw; f <= 5 * bw; f += bw / 100) {
      freqs.push(f / 1e12);
      power.push(1 / Math.cosh(Math.PI * f / (2 * bw / 0.315)) ** 2);
    }
    return { freqs, power };
  }, [bandwidth]);

  // Pulse width vs GDD
  const tauVsGDD = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let gdd = 0.01; gdd <= 5; gdd += 0.05) {
      const t = 1.76 * Math.sqrt((gdd * 1e-24) / (selfPhaseMod * netGain)) * 1e12;
      x.push(gdd); y.push(t);
    }
    return { x, y };
  }, [selfPhaseMod, netGain]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Mode-Locked Laser Designer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Soliton mode-locking theory — pulse width, bandwidth, and repetition rate from cavity parameters.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          T_RT = L_cav / c &nbsp;|&nbsp; f_rep = 1 / T_RT<br />
          τ_p ≈ 1.76 √(|β₂|L / (φ_NL · g)) &nbsp;(soliton approx.)<br />
          Δν · τ_p ≥ 0.315 &nbsp;(sech² TBP)<br />
          P_peak = P_avg / (f_rep · E_pulse)<br />
          φ_NL = γ · P_peak · L_eff &nbsp;(nonlinear phase)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Cavity Length (cm)" type="number" value={cavityLength} onChange={e => setCavityLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="GVD×L (ps²)" type="number" value={gdnProduct} onChange={e => setGdnProduct(+e.target.value)} fullWidth sx={{ mb: 2 }} helperText="Net group delay dispersion" />
            <TextField label="SPM φ_NL (rad)" type="number" value={selfPhaseMod} onChange={e => setSelfPhaseMod(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="SAM Depth" type="number" value={saturableAbsModDepth} onChange={e => setSAModDepth(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="SAM Recovery (ps)" type="number" value={saturableAbsRecovery} onChange={e => setSARecovery(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Net Gain (per RT)" type="number" value={netGain} onChange={e => setNetGain(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Output Coupling (%)" type="number" value={outputCoupling} onChange={e => setOutputCoupling(+e.target.value)} fullWidth sx={{ mb: 2 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Results</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["Round-Trip Time", `${roundTripTime.toFixed(3)} ps`],
                    ["Repetition Rate", `${(repRate / 1e6).toFixed(2)} MHz`],
                    ["Est. Pulse Width", tauPulse ? `${tauPulse.toFixed(3)} ps` : "N/A"],
                    ["Est. Bandwidth", bandwidth && !isNaN(bandwidth) ? `${(bandwidth / 1e12).toFixed(2)} THz` : "N/A"],
                    ["TBP", tauPulse && bandwidth && !isNaN(bandwidth) ? `${(0.315).toFixed(3)} (transform-limited)` : "N/A"],
                    ["Est. Peak Power (100mW avg)", peakPower > 0 ? `${peakPower.toFixed(0)} W` : "N/A"],
                    ["Output Coupling Loss", `${outputCoupling}%`],
                    ["SAM Modulation Depth", `${(saturableAbsModDepth * 100).toFixed(1)}%`],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Plot data={[{ x: pulseTrain.times, y: pulseTrain.amps, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 }, name: "Pulse train" }]} layout={{ ...darkPlot, title: { text: "Mode-Locked Pulse Train (sech²)", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (ps)" }, yaxis: { ...ax, title: "Intensity (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: pulseSpectrum.freqs, y: pulseSpectrum.power, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 }, name: "Spectrum" }]} layout={{ ...darkPlot, title: { text: "Pulse Spectrum (sech)", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Frequency offset (THz)" }, yaxis: { ...ax, title: "Power (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: tauVsGDD.x, y: tauVsGDD.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "τ_p" }]} layout={{ ...darkPlot, title: { text: "Pulse Width vs GDD×L", font: { color: "#ccc" } }, xaxis: { ...ax, title: "GDD×L (ps²)" }, yaxis: { ...ax, title: "τ_p (ps)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
