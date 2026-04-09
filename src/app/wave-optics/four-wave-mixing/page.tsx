import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/four-wave-mixing' },
    title: 'Four-Wave Mixing (FWM)',
  description: 'Degenerate FWM with energy conservation 2p = s + i in fibers and waveguides.'
};

export default function Page() {
  return <PageClient />;
}
