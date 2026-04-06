import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Third-Harmonic Generation Microscopy Calculator',
  description: 'Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.'
};

export default function Page() {
  return <PageClient />;
}
