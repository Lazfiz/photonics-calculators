import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/snr-averaging",
    title: 'SNR Improvement with Co-Adding',
  description: 'SNR improves as N where N is the number of co-added scans. Signal adds linearly, noise as N.'
};

export default function Page() {
  return <PageClient />;
}
