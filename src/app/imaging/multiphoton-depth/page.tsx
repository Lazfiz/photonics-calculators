import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Multiphoton Imaging Depth Calculator',
  description: 'Two-photon excitation depth penetration, resolution, and laser parameters.'
};

export default function Page() {
  return <PageClient />;
}
