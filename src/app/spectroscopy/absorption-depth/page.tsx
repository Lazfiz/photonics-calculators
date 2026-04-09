import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/absorption-depth",
    title: 'Absorption Depth Calculator',
  description: 'Calculate absorption depth = 1/ and explore spectral dependence for common optical materials.'
};

export default function Page() {
  return <PageClient />;
}
