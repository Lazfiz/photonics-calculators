import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/kerr-lens' },
    title: 'Kerr Lens Mode Locking',
  description: 'Self-focusing and Kerr-lens effect in nonlinear media for ultrashort pulse generation.'
};

export default function Page() {
  return <PageClient />;
}
