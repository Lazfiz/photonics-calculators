import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Scintillation Index',
  description: 'Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.'
};

export default function Page() {
  return <PageClient />;
}
