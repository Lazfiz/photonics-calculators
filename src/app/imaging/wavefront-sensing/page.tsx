import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wavefront Sensing',
  description: 'Wavefront error analysis, Zernike decomposition, Strehl ratio, and sensor sensitivity.'
};

export default function Page() {
  return <PageClient />;
}
