import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Intensified Camera (ICCD)',
  description: 'Gain chain: photocathode MCP phosphor fiber optic CCD. Noise and sensitivity analysis.'
};

export default function Page() {
  return <PageClient />;
}
