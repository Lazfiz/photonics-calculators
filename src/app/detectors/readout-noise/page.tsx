import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Readout Noise',
  description: 'Interactive Readout Noise calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
