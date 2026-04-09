import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/spectral-response",
      title: 'Spectral Response',
  description: 'R() = η() q / (hc). Responsivity and quantum efficiency as a function of wavelength.',
};

export default function Page() {
  return <PageClient />;
}
