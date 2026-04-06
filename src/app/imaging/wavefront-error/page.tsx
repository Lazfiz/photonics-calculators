import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wavefront Error Analysis',
  description: 'Analyze wavefront error in waves RMS, compute Strehl ratio, and check diffraction-limited condition.'
};

export default function Page() {
  return <PageClient />;
}
