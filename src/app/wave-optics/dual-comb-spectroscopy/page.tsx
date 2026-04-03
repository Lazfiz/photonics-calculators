"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow, Slider } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function DualCombSpectroscopyCalculator() {
  const [repRate1, setRepRate1] = useState(100.0); // MHz
  const [deltaRepRate, setDeltaRepRate] = useState(0.1); // kHz
  const [centerWavelength, setCenterWavelength] = useState(1550); // nm
  const [bandwidthNm, setBandwidthNm] = useState(50);
  const [avgTime, setAvgTime] = useState(10); // ms (one interferogram)
  const [combLines, setCombLines] = useState(100);

  const repRate1Hz = repRate1 * 1e6;
  const repRate2Hz = (repRate1 + deltaRepRate / 1e3) * 1e6;
  const deltaFrep = repRate2Hz - repRate1Hz;
  const centerFreq = c / (centerWavelength * 1e-9);

  const multiplexedModes = repRate1Hz / deltaFrep;
  const updateRate = 1 / avgTime * 1e3; // Hz
  const resolutionHz = deltaFrep;
  const resolutionNm = deltaFrep * (centerWavelength * 1e-9) ** 2 / c * 1e9;

  // Simulate interferogram
  const interferogram = useMemo(() => {
    const N = 2000;
    const tMax = 1 / deltaFrep;
    const times: number[] = [];
    const signal: number[] = [];
    const envelope: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = (i / N) * tMax;
      times.push(t * 1e6); // μs
      // Sum of beating modes
      let s = 0;
      for (let m = -combLines; m <= combLines; m++) {
        const f1 = centerFreq + m * repRate1Hz;
        const f2 = centerFreq + m * repRate2Hz;
        const beatFreq = Math.abs(f1 - f2) + m * deltaFrep;
        const amp = Math.exp(-0.5 * (m / (combLines * 0.4)) ** 2);
        s += amp * Math.cos(2 * Math.PI * m * deltaFrep * t);
      }
      // Gaussian envelope
      const env = Math.exp(-((t - tMax / 2) / (tMax * 0.25)) ** 2);
      signal.push(s / (2 * combLines + 1) * env);
      envelope.push(env * 0.3);
    }
    return { times, signal, envelope };
  }, [repRate1, deltaRepRate, centerWavelength, bandwidthNm, combLines]);

  // Simulate dual-comb spectrum (resolved modes)
  const spectrum = useMemo(() => {
    const freqs: number[] = [];
    const power: number[] = [];
    const freqMin = c / ((centerWavelength + bandwidthNm / 2) * 1e-9);
    const freqMax = c / ((centerWavelength - bandwidthNm / 2) * 1e-9);

    for (let f = freqMin; f <= freqMax; f += deltaFrep) {
      freqs.push((f / 1e12).toFixed(4) as unknown as number);
      const relF = (f - centerFreq) / (freqMax - freqMin) * 2;
      power.push(Math.exp(-0.5 * relF * relF) * (1 + 0.1 * Math.sin(50 * relF)));
    }
    return { freqs: freqs.map(Number), power };
  }, [centerWavelength, bandwidthNm, deltaFrep, centerFreq]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Dual-Comb Spectroscopy Analyzer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Two optical frequency combs with slightly different rep rates produce a down-converted RF interferogram — enabling rapid, high-resolution broadband spectroscopy.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          Δf_rep = f_rep,2 − f_rep,1<br />
          f_beat,m = m · Δf_rep &nbsp;(down-converted RF comb)<br />
          N_modes = f_rep / Δf_rep &nbsp;(multiplexed modes)<br />
          δν = Δf_rep &nbsp;(spectral resolution)<br />
          T_interferogram = 1 / Δf_rep<br />
          Δλ_res ≈ λ² · Δf_rep / c
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="f_rep,1 (MHz)" type="number" value={repRate1} onChange={e => setRepRate1(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Δf_rep (Hz)" type="number" value={deltaRepRate} onChange={e => setDeltaRepRate(+e.target.value)} fullWidth sx={{ mb: 2 }} helperText="Rep rate difference" />
            <TextField label="Center λ (nm)" type="number" value={centerWavelength} onChange={e => setCenterWavelength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Bandwidth (nm)" type="number" value={bandwidthNm} onChange={e => setBandwidthNm(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Interferogram Time (ms)" type="number" value={avgTime} onChange={e => setAvgTime(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Comb Lines (±)" type="number" value={combLines} onChange={e => setCombLines(+e.target.value)} fullWidth sx={{ mb: 2 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Performance</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["f_rep,2", `${(repRate1 + deltaRepRate / 1e3).toFixed(6)} MHz`],
                    ["Δf_rep", `${deltaRepRate} Hz`],
                    ["Multiplexed Modes", `${multiplexedModes.toFixed(0)}`],
                    ["Spectral Resolution", `${resolutionHz} Hz`],
                    ["Resolution (λ)", `${resolutionNm.toFixed(6)} nm`],
                    ["Interferogram Period", `${(1 / deltaFrep * 1e6).toFixed(1)} μs`],
                    ["Update Rate", `${updateRate.toFixed(0)} Hz`],
                    ["Center Frequency", `${(centerFreq / 1e12).toFixed(2)} THz`],
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
                  { x: interferogram.times, y: interferogram.signal, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 1 }, name: "Interferogram" },
                  { x: interferogram.times, y: interferogram.envelope, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 1, dash: "dash" }, name: "Envelope" },
                ]}
                layout={{ ...darkPlot, title: { text: "Dual-Comb Interferogram", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Time (μs)" }, yaxis: { ...ax, title: "Signal (a.u.)" }, margin: { t: 40, b: 40 } }}
                config={{ responsive: true }} style={{ width: "100%", height: 400 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Plot data={[{ x: spectrum.freqs, y: spectrum.power, type: "scatter", mode: "lines+markers", marker: { size: 2, color: "#76ff03" }, line: { color: "#76ff03", width: 1 }, name: "Spectrum" }]} layout={{ ...darkPlot, title: { text: "Down-Converted Dual-Comb Spectrum", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Frequency (THz)" }, yaxis: { ...ax, title: "Power (a.u.)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
