import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Stimulated Raman Scattering (SRS)',
  description: 'Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.'
};

export default function Page() {
  return <PageClient />;
}
