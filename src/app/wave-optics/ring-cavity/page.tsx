import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Ring Resonator Design',
  description: 'Ring cavity stability, modes, and spectral analysis.'
};

export default function Page() {
  return <PageClient />;
}
