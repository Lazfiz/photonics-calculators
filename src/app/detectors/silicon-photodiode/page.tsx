import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/silicon-photodiode' },
    title: 'Silicon Photodiode',
  description: 'Interactive Silicon Photodiode calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
