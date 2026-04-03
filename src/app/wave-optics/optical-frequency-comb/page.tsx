"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;

export default function FrequencyCombCalculator() {
  const [repRate, setRepRate] = useState(100); // MHz
  const [carrierOffset, setCarrierOffset] = useState(20); // MHz
  const [centerWavelength, setCenterWavelength] = useState(1560); // nm
  const [nModes, setNModes] = useState(500);
  const [bandwidthNm, setBandwidthNm] = useState(100);

  const centerFreq = c / (centerWavelength * 1e-9);
  const repRateHz = repRate * 1e6;
  const offsetHz = carrierOffset * 1e6;

  // Comb modes: f_n = f_ceo + n * f_rep
  const combData = useMemo(() => {
    const centerMode = Math.round(centerFreq / repRateHz);
    const modes: number[] = [];
    const freqs: number[] = [];
    const wavelengths: number[] = [];
    const powers: number[] = [];

    const lambdaMin = centerWavelength - bandwidthNm / 2;
    const lambdaMax = centerWavelength + bandwidthNm / 2;
    const freqMin = c / (lambdaMax * 1e-9);
    const freqMax = c / (lambdaMin * 1e-9);

    for (let n = centerMode - nModes; n <= centerMode + nModes; n++) {
      const f = offsetHz + n * repRateHz;
      if (f >= freqMin && f <= freqMax) {
        modes.push(n);
        freqs.push(f / 1e12);
        wavelengths.push(c / f * 1e9);
        // Gaussian spectral envelope
        const deltaF = (f - centerFreq) / (c / (centerWavelength * 1e-9) - c / ((centerWavelength + bandwidthNm / 2) * 1e-9));
        powers.push(Math.exp(-0.5 * deltaF * deltaF));
      }
    }
    return { modes, freqs, wavelengths, powers };
  }, [repRate, carrierOffset, centerWavelength, nModes, bandwidthNm]);

  // Conversion efficiency plot (f-2f)
  const f2fData = useMemo(() => {
    const offsets = [];
    const beats = [];
    for (let fceo = 0; fceo <= repRate * 1e6; fceo += repRate * 1e3) {
      offsets.push(fceo / 1e6);
      beats.push(0.5 * (1 + Math.cos(2 * Math.PI * fceo / repRateHz)));
    }
    return { x: offsets, y: beats };
  }, [repRate]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  const modeSpacingNm = repRateHz * (centerWavelength * 1e-9) ** 2 / c * 1e9;

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Optical Frequency Comb Generator
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Modelocked laser frequency comb analysis — mode structure, spectral envelope, and f-2f self-referencing.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          fₙ = f_CEO + n · f_rep<br />
          Δλ ≈ λ² · f_rep / c &nbsp;(mode spacing in wavelength)<br />
          f_CEO ∈ [0, f_rep) &nbsp;|&nbsp; f_rep = c / L_RT<br />
          f-2f beat: 2(f_CEO + n·f_rep) − (f_CEO + 2n·f_rep) = f_CEO
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Repetition Rate (MHz)" type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="f_CEO (MHz)" type="number" value={carrierOffset} onChange={e => setCarrierOffset(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Center λ (nm)" type="number" value={centerWavelength} onChange={e => setCenterWavelength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Spectral Bandwidth (nm)" type="number" value={bandwidthNm} onChange={e => setBandwidthNm(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Max Modes (±)" type="number" value={nModes} onChange={e => setNModes(+e.target.value)} fullWidth sx={{ mb: 2 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Comb Properties</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["Center Frequency", `${(centerFreq / 1e12).toFixed(2)} THz`],
                    ["Mode Spacing (freq)", `${repRate} MHz`],
                    ["Mode Spacing (λ)", `${modeSpacingNm.toFixed(4)} nm`],
                    ["f_CEO", `${carrierOffset} MHz`],
                    ["Cavity Round-Trip", `${(1e3 / repRate * 1e6).toFixed(2)} ns`],
                    ["Cavity Length", `${(c / repRateHz * 100).toFixed(2)} cm`],
                    ["Visible Modes", combData.freqs.length],
                    ["Optical Bandwidth", `${(c / (combData.freqs[0] * 1e12) - c / (combData.freqs[combData.freqs.length - 1] * 1e12)).toFixed(1)} nm`],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Plot data={[{ x: combData.wavelengths, y: combData.powers, type: "scatter", mode: "lines+markers", marker: { size: 3, color: "#00e5ff" }, line: { color: "#00e5ff", width: 1 }, name: "Comb modes" }]} layout={{ ...darkPlot, title: { text: "Frequency Comb Spectrum", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Wavelength (nm)" }, yaxis: { ...ax, title: "Relative Power" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 400 }} />
            </Grid>
            <Grid item xs={12}>
              <Plot data={[{ x: f2fData.x, y: f2fData.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "f-2f beat" }]} layout={{ ...darkPlot, title: { text: "f-2f Self-Referencing Interferogram", font: { color: "#ccc" } }, xaxis: { ...ax, title: "f_CEO (MHz)" }, yaxis: { ...ax, title: "Beat Signal" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
