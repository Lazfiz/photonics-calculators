declare module "react-plotly.js" {
  import { Component } from "react";
  import * as Plotly from "plotly.js-dist-min";

  export interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: Plotly.Frame[];
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    onInitialized?: (figure: Readonly<PlotParams>, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Readonly<PlotParams>, graphDiv: HTMLElement) => void;
    onPurge?: (figure: Readonly<PlotParams>, graphDiv: HTMLElement) => void;
    onError?: (error: Error) => void;
  }

  export default class Plot extends Component<PlotParams> {}
}

declare module "plotly.js-dist-min" {
  export * from "plotly.js";
}

// Global Plotly namespace for direct type usage (e.g. Partial<Plotly.Layout>)
declare namespace Plotly {
  export interface Data {
    x?: (number | string)[];
    y?: (number | string)[];
    z?: (number | string)[][];
    type?: string;
    mode?: string;
    name?: string;
    line?: { color?: string; width?: number; dash?: string; shape?: string };
    marker?: { color?: string; size?: number; symbol?: string };
    fill?: string;
    fillcolor?: string;
    opacity?: number;
    text?: string;
    [key: string]: unknown;
  }
  export interface Layout {
    title?: string | { text?: string; font?: { size?: number; color?: string } };
    xaxis?: { title?: string; range?: (number | string)[]; showgrid?: boolean; gridcolor?: string; zeroline?: boolean; color?: string; type?: string; autorange?: boolean | string; dtick?: number; tickmode?: string; tick0?: number; tickvals?: number[]; ticktext?: string[]; tickangle?: number };
    yaxis?: { title?: string; range?: (number | string)[]; showgrid?: boolean; gridcolor?: string; zeroline?: boolean; color?: string; type?: string; autorange?: boolean | string; dtick?: number; tickmode?: string; tick0?: number; tickvals?: number[]; ticktext?: string[] };
    showlegend?: boolean;
    legend?: { x?: number; y?: number; bgcolor?: string; font?: { color?: string } };
    margin?: { l?: number; r?: number; t?: number; b?: number };
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: { color?: string; family?: string; size?: number };
    autosize?: boolean;
    height?: number;
    width?: number;
    scene?: Record<string, unknown>;
    [key: string]: unknown;
  }
  export interface Config {
    responsive?: boolean;
    displayModeBar?: boolean | string;
    displaylogo?: boolean;
    staticPlot?: boolean;
    [key: string]: unknown;
  }
  export interface Frame {
    data?: Data[];
    layout?: Partial<Layout>;
    name?: string;
    group?: string;
    traces?: number[];
  }
}
