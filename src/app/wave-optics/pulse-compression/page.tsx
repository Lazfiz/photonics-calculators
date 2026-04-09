import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/pulse-compression' },
    title: 'Pulse Compression',
  description: 'Transform-limited pulse compression via chirp compensation.'
};

export default function Page() {
  return <PageClient />;
}
