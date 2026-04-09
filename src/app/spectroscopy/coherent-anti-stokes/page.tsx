import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/coherent-anti-stokes",
    title: 'Coherent Anti-Stokes Raman Spectroscopy (CARS)',
  description: 'Four-wave mixing process: _CARS = _pump − _Stokes + _probe. Coherent, directional signal above fluorescence.'
};

export default function Page() {
  return <PageClient />;
}
