import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/linear-mode-avalanche' },
    title: 'Linear Mode Avalanche',
  description: 'Interactive Linear Mode Avalanche calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
