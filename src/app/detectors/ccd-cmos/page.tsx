import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'CCD vs CMOS Comparison',
  description: 'Compare SNR and dynamic range between CCD and CMOS detectors.'
};

export default function Page() {
  return <PageClient />;
}
