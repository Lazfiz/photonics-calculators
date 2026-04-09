import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/detectivity' },
      title: 'Detectivity (D*)',
  description: 'Specific detectivity from NEP, area, and bandwidth. D* = (Af) / NEP',
};

export default function Page() {
  return <PageClient />;
}
