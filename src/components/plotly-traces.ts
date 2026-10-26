// Trace types that ChartPanel sends to Plotly; SimpleChart (SVG) draws scatter and bar.
// plotly-bundle.ts registers exactly these, so a new type needs both lists (tests/plotly-bundle.test.ts).
export const PLOTLY_TRACE_TYPES: readonly string[] = ["heatmap", "scatter3d", "surface", "scatterpolar"];
