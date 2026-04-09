import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/lambert-beer-law' },
    title: 'Lambert-Beer Law Calculator',
  description: 'Beer-Lambert absorbance, optical density, and transmission with interactive parameter sweeps.'
};

export default function Page() {
  return <PageClient />;
}
