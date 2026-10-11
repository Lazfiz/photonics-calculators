/**
 * Wireframe of the unit Poincaré sphere as Plotly `scatter3d` line traces, both hemispheres: full latitude
 * circles at −60°, −30°, 0°, 30° and 60°, and full meridian great circles at longitudes 0°, 30°, …, 150°.
 * Axes are S1, S2, S3 (x, y, z). Pure geometry, no physics.
 */
const POINTS = 73; // 5° steps around a full circle, the last point closing it
const DEG = Math.PI / 180;

function lineTrace(x: number[], y: number[], z: number[]): Record<string, unknown> {
  return {
    type: "scatter3d",
    mode: "lines",
    x,
    y,
    z,
    line: { color: "#374151", width: 1 },
    showlegend: false,
    hoverinfo: "skip",
  };
}

export function poincareWireframeTraces(): Record<string, unknown>[] {
  const t = Array.from({ length: POINTS }, (_, i) => (i / (POINTS - 1)) * 2 * Math.PI);
  const traces: Record<string, unknown>[] = [];

  // Latitude circles: x = cos(lat) cos t, y = cos(lat) sin t, z = sin(lat).
  for (const latDeg of [-60, -30, 0, 30, 60]) {
    const lat = latDeg * DEG;
    traces.push(lineTrace(t.map((p) => Math.cos(lat) * Math.cos(p)), t.map((p) => Math.cos(lat) * Math.sin(p)), t.map(() => Math.sin(lat))));
  }

  // Meridian great circles through the poles: x = cos t cos p, y = cos t sin p, z = sin t, t over a full turn.
  for (let lonDeg = 0; lonDeg < 180; lonDeg += 30) {
    const p = lonDeg * DEG;
    traces.push(lineTrace(t.map((u) => Math.cos(u) * Math.cos(p)), t.map((u) => Math.cos(u) * Math.sin(p)), t.map((u) => Math.sin(u))));
  }

  return traces;
}
