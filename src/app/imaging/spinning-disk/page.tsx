import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/spinning-disk",
    title: 'Spinning Disk Confocal Calculator',
  description: 'Pinhole size, optical sectioning, and frame rate for spinning disk confocal microscopy.'
};

export default function Page() {
  return <PageClient />;
}
