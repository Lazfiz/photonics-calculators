import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/nonlinear-index' },
      title: 'Nonlinear Refractive Index (n)',
  description: 'Kerr effect: n = n I, where I is the optical intensity',
};

export default function Page() {
  return <PageClient />;
}
