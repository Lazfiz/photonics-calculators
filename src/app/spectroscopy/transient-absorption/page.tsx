import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Transient Absorption Spectroscopy',
  description: 'A spectra vs delay time. Decompose into GSB, ESA, and SE contributions across the probe range.'
};

export default function Page() {
  return <PageClient />;
}
