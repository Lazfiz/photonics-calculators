// Partial Plotly bundle: core (with scatter) plus the traces in plotly-traces.ts, and bar for the
// ChartPanel error-boundary fallback. The full dist bundle is ≈ 4.8 MB minified.
import Plotly from "plotly.js/lib/core";
import bar from "plotly.js/lib/bar";
import heatmap from "plotly.js/lib/heatmap";
import scatter3d from "plotly.js/lib/scatter3d";
import surface from "plotly.js/lib/surface";
import scatterpolar from "plotly.js/lib/scatterpolar";

Plotly.register([bar, heatmap, scatter3d, surface, scatterpolar]);

export default Plotly;
