import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Surface-Enhanced Raman Spectroscopy (SERS)',
  description: 'EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.'
};

export default function Page() {
  return <PageClient />;
}
