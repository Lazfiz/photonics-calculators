import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Optical Parametric Oscillator',
  description: 'Interactive Optical Parametric Oscillator calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
