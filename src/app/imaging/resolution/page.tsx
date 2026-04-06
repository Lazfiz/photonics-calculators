import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Resolution Calculator',
  description: 'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.'
};

export default function Page() {
  return <PageClient />;
}
