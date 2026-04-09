import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/wave-optics/free-electron-laser",
    title: 'Free Electron Laser',
  description: 'Interactive Free Electron Laser calculator for photonics and optical engineering.'
};

export default function Page() {
  return <PageClient />;
}
