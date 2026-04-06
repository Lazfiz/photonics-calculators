import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Pump-Probe Spectroscopy',
  description: 'Ultrafast dynamics via time-resolved differential transmission. GSB, SE, and ESA contributions.'
};

export default function Page() {
  return <PageClient />;
}
