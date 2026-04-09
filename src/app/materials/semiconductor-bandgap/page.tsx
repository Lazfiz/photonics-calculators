import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/semiconductor-bandgap' },
    title: 'Semiconductor Bandgap',
  description: 'Bandgap energy and absorption edge vs temperature using the Varshni equation. Direct vs indirect gap materials.'
};

export default function Page() {
  return <PageClient />;
}
