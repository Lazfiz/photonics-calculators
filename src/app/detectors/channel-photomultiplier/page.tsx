import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/channel-photomultiplier",
    title: 'Channel Photomultiplier (Multi-Channel PMT)',
  description: 'Multi-channel PMT: gain staging, energy resolution, and timing.'
};

export default function Page() {
  return <PageClient />;
}
