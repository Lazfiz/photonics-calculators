import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'OH Absorption in Silica',
  description: 'Hydroxyl (OH⁻) absorption peaks in silica fibers and bulk glass. The fundamental OH stretch at 2.72 µm and overtones at 1.38 µm and 0.94 µm dominate loss spectra.'
};

export default function Page() {
  return <PageClient />;
}
