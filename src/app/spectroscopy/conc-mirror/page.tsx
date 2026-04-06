import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Concave Mirror Throughput',
  description: 'Connes advantage and throughput for concave mirror-based spectrometers (e.g., FTIR, concave grating).',
};

export default function Page() {
  return <PageClient />;
}
