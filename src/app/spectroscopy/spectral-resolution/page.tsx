import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Spectral Resolution Calculator',
  description: 'Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.'
};

export default function Page() {
  return <PageClient />;
}
