import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/laguerre-gaussian",
    title: 'Laguerre-Gaussian Modes',
  description: 'Donut modes with orbital angular momentum.'
};

export default function Page() {
  return <PageClient />;
}
