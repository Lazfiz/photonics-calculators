import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/fourier-self-comb",
    title: 'Fourier Self-Comb Spectroscopy',
  description: 'Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.'
};

export default function Page() {
  return <PageClient />;
}
