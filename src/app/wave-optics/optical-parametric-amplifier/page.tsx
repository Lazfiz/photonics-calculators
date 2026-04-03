"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Box, Typography, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableRow, Divider, Slider,
} from "@mui/material";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const c = 3e8;
const eps0 = 8.854e-12;

function opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius }: { pumpWavelength: number; signalWavelength: number; crystalLength: number; dEff: number; nPump: number; nSignal: number; nIdler: number; pumpPower: number; beamRadius: number }) {
  const lambdaP = pumpWavelength * 1e-9;
  const lambdaS = signalWavelength * 1e-9;
  const lambdaI = (lambdaP * lambdaS) / (lambdaS - lambdaP);
  const omegaP = 2 * Math.PI * c / lambdaP;
  const omegaS = 2 * Math.PI * c / lambdaS;
  const omegaI = omegaP - omegaS;
  const deff = dEff * 1e-12;
  const L = crystalLength * 1e-3;
  const w = beamRadius * 1e-6;
  const Ip = pumpPower / (Math.PI * w * w);
  const gamma = (2 * deff / c) * Math.sqrt(omegaP * omegaS * Ip / (2 * eps0 * c * nPump * nSignal * nIdler));
  const G = 1 + (gamma * L * Math.sinh(gamma * L)) ** 2 / (gamma * L) ** 2;
  const gaindB = 10 * Math.log10(G);
  return { G, gaindB, gamma, lambdaI: lambdaI * 1e9, omegaI };
}

export default function OPACalculator() {
  const [pumpWavelength, setPumpWavelength] = useState(532);
  const [signalWavelength, setSignalWavelength] = useState(1064);
  const [crystalLength, setCrystalLength] = useState(15);
  const [dEff, setDEff] = useState(2.0);
  const [nPump, setNPump] = useState(1.65);
  const [nSignal, setNSignal] = useState(1.53);
  const [nIdler, setNIdler] = useState(1.53);
  const [pumpPower, setPumpPower] = useState(10);
  const [beamRadius, setBeamRadius] = useState(50);

  const result = useMemo(() => opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius }), [pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsLength = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let L = 1; L <= 40; L += 0.5) {
      const r = opaGain({ pumpWavelength, signalWavelength, crystalLength: L, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius });
      x.push(L); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, signalWavelength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsSignal = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let ls = pumpWavelength + 50; ls <= 5000; ls += 20) {
      const r = opaGain({ pumpWavelength, signalWavelength: ls, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius });
      x.push(ls); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower, beamRadius]);

  const gainVsPower = useMemo(() => {
    const x: number[] = [], y: number[] = [];
    for (let P = 0.5; P <= 30; P += 0.5) {
      const r = opaGain({ pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, pumpPower: P, beamRadius });
      x.push(P); y.push(r.gaindB);
    }
    return { x, y };
  }, [pumpWavelength, signalWavelength, crystalLength, dEff, nPump, nSignal, nIdler, beamRadius]);

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const ax = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };

  return (
    <Box sx={{ p: 3, bgcolor: "#0a0a0a", minHeight: "100vh", color: "#e0e0e0" }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#00e5ff", fontWeight: 700 }}>
        Optical Parametric Amplifier (OPA) Designer
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "#888" }}>
        Non-collinear or collinear OPA gain analysis. Parametric amplification of a seed signal by a strong pump.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
        <Typography variant="subtitle2" sx={{ color: "#00e5ff", mb: 1 }}>Key Equations</Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#aaa", lineHeight: 2 }}>
          ωₚ = ωₛ + ωᵢ &nbsp;|&nbsp; λᵢ = λₚλₛ/(λₛ − λₚ)<br />
          γ = (2d_eff/c) √(ωₚωₛIₚ / 2ε₀cnₚnₛnᵢ)<br />
          G = 1 + [sinh²(γL)] &nbsp; (undepleted pump)<br />
          G_dB = 10 log₁₀(G)
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 2 }}>Parameters</Typography>
            <TextField label="Pump λ (nm)" type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Signal λ (nm)" type="number" value={signalWavelength} onChange={e => setSignalWavelength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Crystal Length (mm)" type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="d_eff (pm/V)" type="number" value={dEff} onChange={e => setDEff(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={4}><TextField label="nₚ" type="number" value={nPump} onChange={e => setNPump(+e.target.value)} size="small" fullWidth /></Grid>
              <Grid item xs={4}><TextField label="nₛ" type="number" value={nSignal} onChange={e => setNSignal(+e.target.value)} size="small" fullWidth /></Grid>
              <Grid item xs={4}><TextField label="nᵢ" type="number" value={nIdler} onChange={e => setNIdler(+e.target.value)} size="small" fullWidth /></Grid>
            </Grid>
            <TextField label="Pump Power (W)" type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} fullWidth sx={{ mb: 2 }} />
            <TextField label="Beam Radius (μm)" type="number" value={beamRadius} onChange={e => setBeamRadius(+e.target.value)} fullWidth sx={{ mb: 2 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#111", border: "1px solid #333" }}>
            <Typography variant="h6" sx={{ color: "#ff9100", mb: 1 }}>Results</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {[
                    ["Idler λ", `${result.lambdaI.toFixed(1)} nm`],
                    ["Power Gain G", result.G > 1e6 ? result.G.toExponential(2) : result.G.toFixed(2)],
                    ["Gain (dB)", `${result.gaindB.toFixed(2)} dB`],
                    ["Coupling γ", `${result.gamma.toFixed(1)} m⁻¹`],
                    ["Pump Intensity", `${(pumpPower / (Math.PI * (beamRadius * 1e-6) ** 2) / 1e10).toFixed(2)} GW/m²`],
                  ].map(([l, v], i) => (
                    <TableRow key={i}><TableCell sx={{ color: "#888", border: 0 }}>{l}</TableCell><TableCell sx={{ color: "#e0e0e0", fontWeight: 600, border: 0 }}>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: gainVsLength.x, y: gainVsLength.y, type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Crystal Length", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Length (mm)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot data={[{ x: gainVsPower.x, y: gainVsPower.y, type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Pump Power", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Power (W)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
            <Grid item xs={12}>
              <Plot data={[{ x: gainVsSignal.x, y: gainVsSignal.y, type: "scatter", mode: "lines", line: { color: "#76ff03", width: 2 } }]} layout={{ ...darkPlot, title: { text: "Gain vs Signal Wavelength", font: { color: "#ccc" } }, xaxis: { ...ax, title: "Signal λ (nm)" }, yaxis: { ...ax, title: "Gain (dB)" }, margin: { t: 40, b: 40 } }} config={{ responsive: true }} style={{ width: "100%", height: 350 }} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
